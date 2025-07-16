import os
import sys
import json
import torch
from transformers import WhisperForConditionalGeneration, WhisperProcessor
from tqdm import tqdm
import re

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
    return float(time) if time is not None else 0.0

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
            initial_prompt = processed_text
            
            # Сохраняем обработанный текст в отдельный файл для проверки
            processed_file_path = os.path.join(PUBLIC_DIR, os.path.splitext(text_file)[0] + '-processed.txt')
            with open(processed_file_path, 'w', encoding='utf-8') as f_processed:
                f_processed.write(processed_text)
            print(f"\nОбработанный текст сохранён в: {processed_file_path}")
            print(f"Используемый prompt: {initial_prompt[:200]}...")

    print(f"\nЗагружаю модель Whisper через Hugging Face (может занять несколько минут)...")
    
    # Используем Hugging Face версию Whisper
    model_name = "openai/whisper-large-v3"
    processor = WhisperProcessor.from_pretrained(model_name)
    model = WhisperForConditionalGeneration.from_pretrained(model_name)
    
    if torch.cuda.is_available():
        model = model.to("cuda")
        print("Используется GPU")
    else:
        print("Используется CPU")

    audio_path = os.path.join(PUBLIC_DIR, audio_file)
    print(f"\nТранскрибирую: {audio_file}")
    
    # Загружаем аудио
    import librosa
    audio, sr = librosa.load(audio_path, sr=16000)
    
    # Подготавливаем входные данные
    input_features = processor(audio, sampling_rate=16000, return_tensors="pt").input_features
    
    if torch.cuda.is_available():
        input_features = input_features.to("cuda")
    
    # Генерируем токены с prompt
    if initial_prompt:
        # Создаем prompt токены
        prompt_tokens = processor.get_prompt_tokens(initial_prompt)
        print(f"Prompt токены: {len(prompt_tokens)}")
        
        # Генерируем с prompt
        predicted_ids = model.generate(
            input_features,
            language="en",
            task="transcribe",
            prompt_ids=prompt_tokens,
            return_timestamps=True,
            temperature=0.0,
            do_sample=False,
            num_beams=5,
            length_penalty=1.0,
            repetition_penalty=1.0,
            no_speech_threshold=0.6,
            condition_on_previous_text=True
        )
    else:
        # Генерируем без prompt
        predicted_ids = model.generate(
            input_features,
            language="en",
            task="transcribe",
            return_timestamps=True,
            temperature=0.0,
            do_sample=False,
            num_beams=5,
            length_penalty=1.0,
            repetition_penalty=1.0,
            no_speech_threshold=0.6,
            condition_on_previous_text=True
        )
    
    # Декодируем результат
    transcription = processor.batch_decode(predicted_ids, skip_special_tokens=True)[0]
    
    # Получаем временные метки
    timestamps = processor.decode(predicted_ids[0], skip_special_tokens=False)
    
    # Парсим временные метки и слова
    all_words = []
    current_time = 0.0
    
    # Простой парсинг временных меток (можно улучшить)
    words = transcription.split()
    for i, word in enumerate(words):
        # Примерное время (можно улучшить с помощью более точного парсинга)
        word_time = current_time + (i * 0.5)  # Примерно 0.5 секунды на слово
        word_data = {
            'word': word,
            'start_s': word_time,
            'end_s': word_time + 0.5
        }
        all_words.append(word_data)
        current_time = word_time + 0.5

    out_path = os.path.join(PUBLIC_DIR, os.path.splitext(audio_file)[0] + '-hf.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump({
            'words': all_words,
            'transcription': transcription,
            'language': 'en',
            'model': 'whisper-large-v3-hf'
        }, f, ensure_ascii=False, indent=2)
    print(f"\n✅ Результат сохранён в: {out_path}")
    print(f"Всего слов: {len(all_words)}")
    print(f"Транскрипция: {transcription[:200]}...")

if __name__ == '__main__':
    main() 