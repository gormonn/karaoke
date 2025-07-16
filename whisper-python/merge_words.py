import os
import json
import sys

PUBLIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../public'))


def list_json_files(directory):
    """Показывает список JSON файлов в папке"""
    json_files = [f for f in os.listdir(directory) if f.endswith('.json')]
    return sorted(json_files)


def select_file(files, prompt):
    """Позволяет выбрать файл из списка"""
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


def merge_words_from_json(json_path):
    """Объединяет все слова из JSON в один массив"""
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        all_words = []
        
        # Проходим по всем сегментам
        for segment in data.get('segments', []):
            # Если есть разбивка по словам
            if 'words' in segment:
                all_words.extend(segment['words'])
            else:
                # Если нет разбивки по словам, создаем один элемент из текста сегмента
                all_words.append({
                    'word': segment.get('text', '').strip(),
                    'start_s': segment.get('start_s', 0),
                    'end_s': segment.get('end_s', 0)
                })
        
        print(f"Найдено {len(all_words)} слов")
        
        # Перезаписываем файл
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(all_words, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Файл {os.path.basename(json_path)} перезаписан с {len(all_words)} словами")
        
        # Показываем первые несколько слов для проверки
        if all_words:
            print("\nПервые 5 слов:")
            for i, word in enumerate(all_words[:5]):
                print(f"{i+1}. '{word.get('word', '')}' ({word.get('start_s', 0):.2f}s - {word.get('end_s', 0):.2f}s)")
        
    except Exception as e:
        print(f"❌ Ошибка при обработке файла: {e}")


def main():
    print(f"Папка с JSON файлами: {PUBLIC_DIR}")
    
    json_files = list_json_files(PUBLIC_DIR)
    
    if not json_files:
        print("Нет JSON файлов в папке public/")
        sys.exit(1)
    
    selected_file = select_file(json_files, "Доступные JSON файлы:")
    if not selected_file:
        print("Выход.")
        sys.exit(0)
    
    json_path = os.path.join(PUBLIC_DIR, selected_file)
    merge_words_from_json(json_path)


if __name__ == '__main__':
    main() 