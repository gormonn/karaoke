import os
import sys
import json
import whisper
from tqdm import tqdm
import re
import librosa
import soundfile as sf
import tempfile
import ssl
import urllib.request

# Временно отключить проверку SSL (только для тестирования!)
# Иначе не скачивается модель large-v3-turbo
ssl._create_default_https_context = ssl._create_unverified_context

AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac']

PUBLIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../public'))


def list_files(directory, exts):
    return sorted([f for f in os.listdir(directory) if os.path.splitext(f)[1].lower() in exts])

def select_file(files, prompt):
    if not files:
        return None
    print(f"\n{prompt}")
    for i, f in enumerate(files):
        print(f"{i+1}. {f}")
    while True:
        choice = input("Введите номер файла (или n для пропуска): ").strip()
        if choice.lower() == 'n':
            return None
        if choice.isdigit() and 1 <= int(choice) <= len(files):
            return files[int(choice)-1]
        print("Некорректный ввод. Попробуйте снова.")

def time_to_seconds(time):
    # time: float (секунды) или None
    return float(time) if time is not None else 0.0

def convert_audio_to_16khz(audio_path):
    """Конвертирует аудио в 16kHz WAV для лучшей транскрипции"""
    print(f"Конвертирую аудио в 16kHz...")
    
    # Загружаем аудио с автоматическим определением частоты дискретизации
    audio, sr = librosa.load(audio_path, sr=None)
    
    # Если частота уже 16kHz, возвращаем оригинальный путь
    if sr == 16000:
        print(f"Аудио уже в 16kHz ({sr}Hz)")
        return audio_path
    
    print(f"Исходная частота: {sr}Hz, конвертирую в 16kHz...")
    
    # Конвертируем в 16kHz
    audio_16k = librosa.resample(audio, orig_sr=sr, target_sr=16000)
    
    # Создаем временный файл
    temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
    temp_path = temp_file.name
    temp_file.close()
    
    # Сохраняем как WAV 16kHz
    sf.write(temp_path, audio_16k, 16000)
    
    print(f"Аудио конвертировано и сохранено в: {temp_path}")
    return temp_path

def process_text_for_prompt(original_text):
    """Обрабатывает текст для prompt: заменяет кавычки, удаляет квадратные скобки, заменяет переносы строк"""
    if not original_text:
        return None
    
    processed_text = original_text
    
    # Заменяем обычные кавычки на типографические
    processed_text = processed_text.replace('"', '\u201C')  # Обычные двойные → типографические
    processed_text = processed_text.replace('"', '\u201D')  # Обычные двойные → типографические
    processed_text = processed_text.replace("'", '\u2018')  # Обычные одинарные → типографические
    processed_text = processed_text.replace("'", '\u2019')  # Обычные одинарные → типографические
    
    # Удаляем весь контент в квадратных скобках
    processed_text = re.sub(r'\[.*?\]', '', processed_text)
    
    # Заменяем все переносы строк на \n
    processed_text = processed_text.replace('\r\n', '\n').replace('\r', '\n')
    
    # Убираем только множественные пустые строки, но сохраняем одиночные
    processed_text = re.sub(r'\n\s*\n\s*\n+', '\n\n', processed_text)
    processed_text = processed_text.strip()
    
    return processed_text

def create_simple_prompt(processed_text):
    """Создает prompt на основе всего обработанного текста"""
    if not processed_text:
        return None
    
    # Используем весь обработанный текст как prompt
    prompt = processed_text
    # prompt += "\n\nCRITICAL: Preserve EXACT formatting, punctuation, quotes, and spacing as shown above."
    # prompt += " Do NOT add extra punctuation like periods or commas unless they exist in the original."
    # prompt += " Keep all quotes, apostrophes, and special characters exactly as written."
    # prompt += " Maintain line breaks and spacing. Keep all repeated words and phrases."
    
    return prompt

def main():
    print(f"Папка с аудио: {PUBLIC_DIR}")
    audio_files = list_files(PUBLIC_DIR, AUDIO_EXTENSIONS)
    text_files = list_files(PUBLIC_DIR, ['.txt'])

    if not audio_files:
        print("Нет аудиофайлов в папке public/")
        sys.exit(1)

    audio_file = select_file(audio_files, "Доступные аудиофайлы:")
    if not audio_file:
        print("Выход.")
        sys.exit(0)

    text_file = select_file(text_files, "Доступные текстовые файлы (txt):")
    initial_prompt = None
    original_text = None
    processed_text = None
    if text_file:
        with open(os.path.join(PUBLIC_DIR, text_file), 'r', encoding='utf-8') as f:
            original_text = f.read()
            processed_text = process_text_for_prompt(original_text)
            initial_prompt = create_simple_prompt(processed_text)
            
            # Сохраняем обработанный текст в отдельный файл для проверки
            processed_file_path = os.path.join(PUBLIC_DIR, os.path.splitext(text_file)[0] + '-processed.txt')
            with open(processed_file_path, 'w', encoding='utf-8') as f_processed:
                f_processed.write(processed_text or '')
            print(f"\nОбработанный текст сохранён в: {processed_file_path}")
            print(f"Используемый prompt: {initial_prompt}")

    print(f"\nЗагружаю модель large-v3-turbo (может занять несколько минут)...")
    model = whisper.load_model("large-v3-turbo")

    audio_path = os.path.join(PUBLIC_DIR, audio_file)
    
    # Конвертируем аудио в 16kHz для лучшей транскрипции
    converted_audio_path = convert_audio_to_16khz(audio_path)
    
    print(f"\nТранскрибирую: {audio_file}")
    result = model.transcribe(
        converted_audio_path,
        initial_prompt=initial_prompt,
        verbose=True,
        word_timestamps=True,
        condition_on_previous_text=True,
        temperature=0.0,
        best_of=5,
        beam_size=5,
        fp16=False,
        language="en",
        task="transcribe",
        suppress_tokens=[-1]  # Подавляем добавление дополнительных токенов
    )
    
    # Удаляем временный файл, если он был создан
    if converted_audio_path != audio_path:
        try:
            os.unlink(converted_audio_path)
            print(f"Временный файл удален: {converted_audio_path}")
        except:
            pass

    # Собираем все слова из всех сегментов в один массив
    all_words = []
    for seg in tqdm(result['segments'], desc='Собираю слова'):
        if isinstance(seg, dict):
            for word in seg.get('words', []):
                word_data = {
                    'word': word.get('word', ''),
                    'start_s': time_to_seconds(word.get('start')),
                    'end_s': time_to_seconds(word.get('end'))
                }
                all_words.append(word_data)

    out_path = os.path.join(PUBLIC_DIR, os.path.splitext(audio_file)[0] + '.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump({
            'words': all_words,
            'language': result.get('language'),
            'model': 'large-v3-turbo'
        }, f, ensure_ascii=False, indent=2)
    print(f"\n✅ Результат сохранён в: {out_path}")
    print(f"всего слов: {len(all_words)}")

if __name__ == '__main__':
    main()
