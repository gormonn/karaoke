# 🎵 Whisper Audio Processor

Скрипт для обработки аудио файлов с помощью Whisper для создания транскрипций.

## 📋 Возможности

- 🔍 Автоматическое обнаружение аудио файлов в папке `public/`
- 🎯 Интерактивный выбор файла для обработки
- 🎤 Два метода обработки: Whisper CLI и Remotion Whisper API
- 📄 Сохранение результатов в JSON формате
- 📝 Отображение транскрипции с временными метками

## 🚀 Запуск

### Основной скрипт (рекомендуется)
```bash
node run-whisper.js
```

### Прямой запуск Whisper CLI
```bash
node whisper-processor.js
```

### Прямой запуск Remotion Whisper
```bash
node whisper-remotion.js
```

## 📁 Структура файлов

```
karaoke/
├── run-whisper.js          # Главный скрипт с выбором метода
├── whisper-processor.js    # Whisper CLI обработчик
├── whisper-remotion.js     # Remotion Whisper API обработчик
├── public/                 # Папка с аудио файлами
│   ├── song1.mp3
│   ├── song2.wav
│   └── ...
└── WHISPER-README.md       # Этот файл
```

## 🎵 Поддерживаемые форматы

- MP3 (.mp3)
- WAV (.wav)
- M4A (.m4a)
- FLAC (.flac)
- OGG (.ogg)
- AAC (.aac)

## 🔧 Методы обработки

### 1. Whisper CLI (рекомендуется)
- Использует стандартный Whisper CLI
- Более стабильная работа
- Поддерживает различные модели (tiny, base, small, medium, large)

### 2. Remotion Whisper API
- Использует Remotion Whisper интеграцию
- Может быть более интегрирован с Remotion проектом
- Требует установки `@remotion/install-whisper-cpp`

## 📦 Установка зависимостей

Скрипт автоматически установит необходимые зависимости при первом запуске. Если нужно установить вручную:

```bash
# Для Whisper CLI
npm install -g openai-whisper

# Для Remotion Whisper
npm install --save-exact @remotion/install-whisper-cpp@4.0.323
```

## 📄 Формат результата

Результат сохраняется в JSON файл с именем исходного аудио файла:

```json
{
  "text": "Полный текст транскрипции",
  "segments": [
    {
      "start": 0.0,
      "end": 2.5,
      "text": "Текст сегмента"
    }
  ],
  "language": "ru"
}
```

## 🎛️ Настройки

### Изменение модели Whisper
В файле `whisper-processor.js` найдите строку:
```javascript
'--model', 'base', // можно изменить на 'tiny', 'small', 'medium', 'large'
```

### Изменение языка
```javascript
'--language', 'auto', // или 'ru', 'en', 'de', etc.
```

## 🔍 Использование

1. Поместите аудио файлы в папку `public/`
2. Запустите скрипт: `node run-whisper.js`
3. Выберите метод обработки
4. Выберите аудио файл из списка
5. Дождитесь завершения обработки
6. Просмотрите результат в консоли и в JSON файле

## ⚠️ Требования

- Node.js 14+
- Достаточно места на диске для моделей Whisper
- Интернет соединение для загрузки моделей (при первом запуске)

## 🐛 Устранение неполадок

### Ошибка "Whisper не установлен"
```bash
npm install -g openai-whisper
```

### Ошибка "Remotion Whisper не установлен"
```bash
npm install --save-exact @remotion/install-whisper-cpp@4.0.323
```

### Медленная обработка
- Используйте модель 'tiny' для быстрой обработки
- Убедитесь, что у вас достаточно RAM

### Ошибки кодировки
- Убедитесь, что аудио файл имеет правильную кодировку
- Попробуйте конвертировать в WAV формат

## 📝 Пример использования

```bash
$ node run-whisper.js

🎵 Whisper Audio Processor
==============================
Выберите метод обработки:
1. Whisper CLI (рекомендуется)
2. Remotion Whisper API
q. Выход

Ваш выбор: 1

🚀 Запускаем Whisper CLI...

🎵 Доступные аудио файлы:
1. song1.mp3
2. song2.wav
3. Never_Said.mp3

Выберите номер файла для обработки (или "q" для выхода): 3

🎤 Обрабатываем файл: Never_Said.mp3
✅ Обработка завершена успешно
📄 Результат сохранен в: public/Never_Said.json

📝 Результат транскрипции:
==================================================
[0.00s - 2.50s]: It's not clocking to you
[2.50s - 5.00s]: Said no one ever
[5.00s - 7.50s]: ...
==================================================

Обработать еще один файл? (y/n): n
👋 До свидания!
```

## 🔗 Полезные ссылки

- [Remotion Whisper Documentation](https://www.remotion.dev/docs/install-whisper-cpp/)
- [OpenAI Whisper](https://github.com/openai/whisper)
- [Whisper.cpp](https://github.com/ggerganov/whisper.cpp) 