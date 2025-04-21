const fs = require('fs');
const path = require('path');

// Обработка аргументов командной строки
const [name] = process.argv.slice(2); // Получаем все аргументы после node converter.js

if(!name) {
    console.log('Please provide a name as an argument');
    process.exit(1);
}

// Читаем файлы
const sunoData = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', `${name}.json`), 'utf8'));
const textData = fs.readFileSync(path.join(__dirname, 'public', `${name}.txt`), 'utf8');

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
function buildSegmentsFromParagraphs(alignment, paragraphs) {
  const segments = [];
  let segmentId = 0;
  
  // Предварительно обрабатываем выравнивание
  const processedAlignment = preprocessAlignment(alignment);
  
  // Строим полный текст из alignment для поиска
  let fullText = '';
  processedAlignment.forEach(word => {
    fullText += removeMetadata(word.word);
  });
  
  // Для каждого абзаца находим все его вхождения в тексте
  for (const paragraph of paragraphs) {
    const cleanParagraph = removeMetadata(paragraph).trim();
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
      // Находим слова, соответствующие началу и концу абзаца
      const startWordIndex = findWordIndexForPosition(processedAlignment, fullText, position);
      const endWordIndex = findWordIndexForPosition(processedAlignment, fullText, position + cleanParagraph.length - 1);
      
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
      
      // Создаем сегмент для текущего вхождения абзаца
      const segment = {
        id: segmentId++,
        seek: 0,
        start: startTime,
        end: endTime,
        text: cleanParagraph,
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
  segments: buildSegmentsFromParagraphs(sunoData.alignment, paragraphs),
  language: "en" // Можно определять автоматически при необходимости
};

// Добавляем разделение на строки для каждого сегмента
convertedData.segments.forEach(segment => {
  segment.lines = splitSegmentIntoLines(segment);
});

// Записываем результат в новый файл
fs.writeFileSync(
  path.join(__dirname, 'public', `${name}-converted.json`),
  JSON.stringify(convertedData, null, 2),
  'utf8'
);

console.log('Конвертация завершена успешно!');
