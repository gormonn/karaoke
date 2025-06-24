const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CONFIG_FILE = '_config.ts';

/**
 * Конвертер файлов для караоке-системы
 *
 * Использование:
 * - node converter.js --list         - показать список доступных JSON файлов и выбрать файл
 * - node converter.js <filename>     - конвертировать указанный файл (без расширения)
 *
 * Пример:
 * node converter.js --list
 * node converter.js song1
 */

// Функция для отображения списка JSON файлов и выбора файла
async function showJsonFiles() {
    const files = fs.readdirSync(path.join(__dirname, 'public'))
        .filter(file => file.endsWith('.json') && !file.endsWith('-converted.json'))
        .map(file => ({
            original: file,
            display: file.replace('.json', '')
        }));

    if (files.length === 0) {
        console.log('Файлы JSON не найдены в каталоге public/');
        process.exit(1);
    }

    console.log('Доступные файлы для конвертации:');
    files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.display}`);
    });

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('Выберите номер файла для конвертации: ', (answer) => {
            rl.close();
            const index = parseInt(answer) - 1;
            if (index >= 0 && index < files.length) {
                const selectedFile = files[index].display;
                resolve(selectedFile);
            } else {
                console.log('Неверный номер файла');
                process.exit(1);
            }
        });
    });
}

// Обработка аргументов командной строки
const [arg] = process.argv.slice(2);

// Проверяем аргументы
if (!arg) {
    console.log('Использование:');
    console.log('node converter.js --list         - показать список доступных файлов');
    console.log('node converter.js "<filename>"   - конвертировать указанный файл (в кавычках, если есть пробелы)');
    process.exit(1);
}

// Функция для обновления SONG_NAME в _song.ts
function updateSongName(filename) {
    const songFilePath = path.join(__dirname, 'src', CONFIG_FILE);
    let content = fs.readFileSync(songFilePath, 'utf8');

    // Экранируем специальные символы в filename для использования в регулярном выражении
    const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Обновляем значение SONG_NAME, используя экранированное имя файла
    content = content.replace(/const SONG_NAME = '.*'/, `const SONG_NAME = '${escapedFilename}'`);

    fs.writeFileSync(songFilePath, content, 'utf8');
    console.log(`Файл _song.ts обновлен с новым именем песни: "${filename}"`);
}

// Основная функция конвертации
async function convert(filename) {
    const jsonFile = `${filename}.json`;
    const txtFile = `${filename}.txt`;
    const convertedFile = `${filename}-converted.json`;

    // Проверяем существование файлов перед конвертацией
    const jsonPath = path.join(__dirname, 'public', jsonFile);
    const txtPath = path.join(__dirname, 'public', txtFile);

    if (!fs.existsSync(jsonPath)) {
        console.error(`Ошибка: Файл "${jsonFile}" не найден в каталоге public/`);
        process.exit(1);
    }

    if (!fs.existsSync(txtPath)) {
        console.error(`Ошибка: Файл "${txtFile}" не найден в каталоге public/`);
        process.exit(1);
    }

    // Читаем файлы
    const sunoData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const textData = fs.readFileSync(txtPath, 'utf8');

    // Функция для очистки метаданных из текста
    function removeMetadata(text) {
      return text
        .replace(/\[.*?\]/g, '') // Удаляем только текст в квадратных скобках
        .replace(/\n{2,}/g, '\n'); // Заменяем несколько последовательных переносов строк на один
    }

    // Определяем абзацы в текстовом файле
    function getParagraphs(textData) {
      // Разбиваем текст на абзацы по двойному переносу строки
      const paragraphs = textData.split(/\n\s*\n/);
      return paragraphs.filter(para => para.trim() !== ''); // Убираем пустые абзацы
    }

    // Предварительная обработка слов для исправления проблем с разделением кавычек
    function preprocessAlignment(alignment) {
      const processedAlignment = [...alignment]; // Копируем массив

      // Проходим по всем словам и исправляем кавычки и отдельные буквы
      for (let i = 0; i < processedAlignment.length - 1; i++) {
        const currentWord = processedAlignment[i].word;
        const nextWord = processedAlignment[i+1].word;

        // Проверяем различные случаи неправильного разделения кавычек

        // Случай 1: кавычки находятся в начале следующего слова с переносом
        if (nextWord.match(/^"\n/) && !currentWord.endsWith('"')) {
          processedAlignment[i].word = currentWord + '"';
          processedAlignment[i+1].word = nextWord.replace(/^"/, '');
        }

        // Случай 2: закрывающая кавычка находится в начале переноса строки
        if (nextWord.match(/^\n"/) && !currentWord.endsWith('"')) {
          processedAlignment[i].word = currentWord + '"';
          processedAlignment[i+1].word = nextWord.replace(/^(\n)"/, '$1');
        }

        // Случай 3: кавычка в конце текущего слова отделена от переноса строки
        if (currentWord.endsWith('"') && nextWord.startsWith('\n')) {
          processedAlignment[i].word = currentWord.replace(/"$/, '');
          processedAlignment[i+1].word = '"' + nextWord;
        }

        // Случай 4: отдельная буква (например, "s") после слова
        if (nextWord.trim().length === 1 && !nextWord.match(/^\n/)) {
          processedAlignment[i].word = currentWord + nextWord;
          processedAlignment[i+1].word = '';
        }
      }

      // Удаляем пустые слова после объединения
      return processedAlignment.filter(item => item.word !== '');
    }

    // Функция для нахождения всех вхождений подстроки в строку с их позициями
    function findAllOccurrences(text, substr) {
      const positions = [];
      let pos = text.indexOf(substr);
      while (pos !== -1) {
        positions.push(pos);
        pos = text.indexOf(substr, pos + 1);
      }
      return positions;
    }

    // Функция для поиска индекса слова, соответствующего определенной позиции в тексте
    function findWordIndexForPosition(alignment, text, position) {
      let runningLength = 0;
      for (let i = 0; i < alignment.length; i++) {
        const word = removeMetadata(alignment[i].word);
        runningLength += word.length;
        if (runningLength >= position) {
          return i;
        }
      }
      return -1; // Не найдено
    }

    // Функция для построения сегментов на основе абзацев из текстового файла
    function buildSegmentsFromParagraphs(alignment, paragraphs, cleanedTextData) {
      const segments = [];
      let segmentId = 0;

      console.log(alignment)
      // Предварительно обрабатываем выравнивание
      const processedAlignment = preprocessAlignment(alignment);

      // Строим полный текст из alignment для поиска
      let fullText = '';
      processedAlignment.forEach(word => {
        fullText += removeMetadata(word.word);
      });

      // Сортируем абзацы по длине (от самых длинных к самым коротким)
      // Это поможет избежать создания сегментов для подстрок, которые уже обработаны
      const sortedParagraphs = paragraphs
        .map((para, index) => ({
          paragraph: para,
          cleanParagraph: removeMetadata(para).trim(),
          originalIndex: index
        }))
        .filter(p => p.cleanParagraph !== '')
        .sort((a, b) => b.cleanParagraph.length - a.cleanParagraph.length);

      // Массив для отслеживания уже обработанных позиций в тексте
      const processedRanges = [];

      // Функция для проверки, пересекается ли новый диапазон с уже обработанными
      function isRangeProcessed(start, end) {
        return processedRanges.some(range => 
          (start >= range.start && start <= range.end) ||
          (end >= range.start && end <= range.end) ||
          (start <= range.start && end >= range.end)
        );
      }

      // Для каждого абзаца находим все его вхождения в тексте
      for (const {paragraph, cleanParagraph, originalIndex} of sortedParagraphs) {
        if (!cleanParagraph) continue;

        // Находим все вхождения абзаца в полном тексте
        const occurrences = findAllOccurrences(fullText, cleanParagraph);

        // Если абзац не найден, пропускаем его
        if (occurrences.length === 0) {
          console.warn(`Не удалось найти абзац: "${cleanParagraph.substring(0, 50)}..."`);
          continue;
        }

        // Для каждого вхождения создаем сегмент
        for (const position of occurrences) {
          const rangeEnd = position + cleanParagraph.length - 1;
          
          // Проверяем, не пересекается ли этот диапазон с уже обработанными
          if (isRangeProcessed(position, rangeEnd)) {
            console.log(`Пропускаем перекрывающийся сегмент для: "${cleanParagraph.substring(0, 30)}..."`);
            continue;
          }

          // Находим слова, соответствующие началу и концу абзаца
          const startWordIndex = findWordIndexForPosition(processedAlignment, fullText, position);
          const endWordIndex = findWordIndexForPosition(processedAlignment, fullText, rangeEnd);

          // Если не удалось определить границы сегмента, пропускаем
          if (startWordIndex === -1 || endWordIndex === -1) {
            console.warn(`Не удалось определить границы сегмента для абзаца: "${cleanParagraph.substring(0, 50)}..."`);
            continue;
          }

          const startTime = processedAlignment[startWordIndex].start_s;
          const endTime = processedAlignment[endWordIndex].end_s;

          // Проверяем, нет ли уже сегмента с такими же временными метками
          // Это поможет избежать дублирования при обработке припевов
          const segmentExists = segments.some(seg =>
            Math.abs(seg.start - startTime) < 0.1 && Math.abs(seg.end - endTime) < 0.1
          );

          if (segmentExists) {
            // Пропускаем создание дубликата сегмента
            continue;
          }

          // console.log('cleanParagraph', cleanParagraph);
          // process.exit(1);
          // Создаем сегмент для текущего вхождения абзаца
          const segment = {
            id: segmentId++,
            seek: 0,
            start: startTime,
            end: endTime,
            text: cleanParagraph.split("\n"),
            paragraph: cleanParagraph,
            words: []
          };

          // Добавляем слова в сегмент
          for (let i = startWordIndex; i <= endWordIndex; i++) {
            const word = processedAlignment[i];
            segment.words.push({
              word: removeMetadata(word.word),
              start: word.start_s,
              end: word.end_s,
              probability: word.p_align
            });
          }

          segments.push(segment);
          
          // Добавляем этот диапазон в обработанные
          processedRanges.push({
            start: position,
            end: rangeEnd
          });
        }
      }

      // Сортируем сегменты по времени начала
      segments.sort((a, b) => a.start - b.start);

      // Переназначаем ID после сортировки
      segments.forEach((segment, index) => {
        segment.id = index;
      });

      return segments;
    }

    // Получаем абзацы из текстового файла
    const paragraphs = getParagraphs(textData);

    // Обработанный текст без метаданных
    const cleanedTextData = removeMetadata(textData);

    // Функция для разделения слов сегмента на строки
    function splitSegmentIntoLines(segment) {
      const lines = [];
      let currentLine = [];

      for (let i = 0; i < segment.words.length; i++) {
        const word = segment.words[i];
        currentLine.push(word);

        // Если слово содержит перенос строки или это последнее слово
        if (word.word.includes('\n') || i === segment.words.length - 1) {
          // Если это перенос строки, удалим символ переноса из текущего слова
          if (word.word.includes('\n')) {
            const parts = word.word.split('\n');
            // Обновим текущее слово, убрав перенос
            currentLine[currentLine.length - 1] = {
              ...word,
              word: parts[0]
            };

            // Добавим текущую строку в массив строк
            if (currentLine.length > 0) {
              lines.push([...currentLine]);
            }

            // Начнем новую строку со второй части разделенного слова
            currentLine = [];
            if (parts[1]) {
              currentLine.push({
                ...word,
                word: parts[1]
              });
            }
          } else if (i === segment.words.length - 1) {
            // Если это последнее слово, добавляем текущую строку в массив
            lines.push([...currentLine]);
          }
        }
      }

      return lines;
    }

    // Создаем объект в формате music.json
    const convertedData = {
      text: cleanedTextData,
      segments: buildSegmentsFromParagraphs(sunoData, paragraphs, cleanedTextData),
      language: "en" // Можно определять автоматически при необходимости
    };

    // Добавляем разделение на строки для каждого сегмента
    convertedData.segments.forEach(segment => {
      segment.lines = splitSegmentIntoLines(segment);
    });

    // Записываем результат в новый файл
    fs.writeFileSync(
      path.join(__dirname, 'public', convertedFile),
      JSON.stringify(convertedData, null, 2),
      'utf8'
    );

    // Обновляем SONG_NAME в _song.ts
    updateSongName(filename);

    console.log('Конвертация завершена успешно!');
}

// Запускаем основной процесс
async function main() {
    if (arg === '--list') {
        const selectedFile = await showJsonFiles();
        await convert(selectedFile);
    } else {
        await convert(arg);
    }
}

main().catch(console.error);
