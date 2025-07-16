# Whisper Python Transcriber

## Предварительные требования

- Python 3.8 или новее (рекомендуется Python 3.11)
- pip (менеджер пакетов Python)
- ffmpeg (для работы с аудио)

### Установка pip

pip обычно устанавливается вместе с Python. Если не установлен:

macOS:
```bash
python3 -m ensurepip --upgrade
```

Ubuntu/Debian:
```bash
sudo apt update && sudo apt install python3-pip
```

Windows:
- pip устанавливается автоматически с Python с https://python.org

### Установка ffmpeg

macOS (Homebrew):
```bash
brew install ffmpeg
```

Ubuntu/Debian:
```bash
sudo apt update && sudo apt install ffmpeg
```

Windows:
- Скачать сборку с https://ffmpeg.org/download.html и добавить ffmpeg в PATH

## Установка зависимостей

```bash
python3 -m pip install -r requirements.txt
```

## Использование

```bash
python3 whisper_transcribe.py
```

- Скрипт покажет список аудиофайлов в папке `../public/`.
- Позволит выбрать аудиофайл и текстовый файл (txt) для initial_prompt.
- Сохранит результат в JSON с секундами (start_s, end_s) и оригинальными пробелами в тексте.

## Поддерживаемые форматы
- Аудио: mp3, wav, m4a, flac, ogg, aac
- Текст: txt

## Пример результата
```json
{
  "segments": [
    { "start_s": 1.43, "end_s": 2.12, "text": "Hello world!" }
  ],
  "language": "en",
  "model": "large-v3"
}
```

## Важно
- Для максимальной точности используется модель `large-v3` (можно изменить в коде).
- initial_prompt влияет на всю транскрипцию.

## Скачивание модели large-v3 вручную

Если модель не скачивается автоматически, используйте команду:

```bash
curl -L -o ~/.cache/whisper/large-v3.pt https://openaipublic.azureedge.net/main/whisper/models/e5b1a55b89c1367dacf97e3e19bfd829a01529dbfdeefa8caeb59b3f1b81dadb/large-v3.pt
```

Эта команда скачает файл модели large-v3.pt в нужную папку кэша whisper.

## Скачивание модели large-v3-turbo вручную

Для оригинального openai/whisper (pip install openai-whisper) модель large-v3-turbo скачивается автоматически при первом запуске, если указать --model large-v3-turbo или model = whisper.load_model("large-v3-turbo").

Если вы используете Transformers/HuggingFace, скачайте safetensors вручную:

```bash
mkdir -p ~/.cache/huggingface/hub/models--openai--whisper-large-v3-turbo
curl -L -o ~/.cache/huggingface/hub/models--openai--whisper-large-v3-turbo/model.safetensors https://huggingface.co/openai/whisper-large-v3-turbo/resolve/main/model.safetensors
```

Подробнее: https://huggingface.co/openai/whisper-large-v3-turbo

> Для openai/whisper (pip) отдельного .pt-файла для turbo пока нет в открытом доступе, модель скачивается автоматически.

## Решение проблем

### Ошибка SSL при загрузке модели

Если возникает ошибка:
```
ssl.SSLCertVerificationError: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed
```
brew install ca-certificates


**Решение — скачать модель вручную:**

1. Создайте папку для моделей:
```bash
mkdir -p ~/.cache/whisper
```

2. Скачайте модель large-v3:
```bash
curl -L -o ~/.cache/whisper/large-v3.pt https://openaipublic.azureedge.net/main/whisper/models/e5b1a55b89c1367dacf97e3e19bfd829a01529dbfdeefa8caeb59b3f1b81dadb/large-v3.pt
```

3. Проверьте скачивание:
```bash
ls -lh ~/.cache/whisper/large-v3.pt
```
(Файл должен быть ~2,9 ГБ)

4. Запустите скрипт:
```bash
python3 whisper_transcribe.py
```

**Альтернативное решение (временно отключить SSL):**
```bash
PYTHONHTTPSVERIFY=0 python3 whisper_transcribe.py
```
*Внимание: это небезопасно, используйте только для скачивания модели!*
