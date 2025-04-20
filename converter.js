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

// Функция для очистки текста
function cleanText(text) {
  return text
    .replace(/\[.*?\]/g, '') // Удаляем текст в квадратных скобках
    .replace(/[.,!?…]/g, '') // Удаляем знаки препинания
    // .replace(/\s+/g, ' ') // Заменяем множественные пробелы на один
    .replace(/\n\s*\n/g, '') // Убираем пустые строкин
    .replace(/\n/g, '') // Убираем пустые строки
    .trimEnd(); // Убираем пробелы в начале и конце
}

// Функция для группировки слов в сегменты
function groupWordsIntoSegments(alignment) {
  const segments = [];
  let currentSegment = {
    id: 0,
    seek: 0,
    start: alignment[0].start_s,
    end: alignment[0].end_s,
    text: '',
    words: []
  };

  let currentText = '';
  let segmentId = 0;

  alignment.forEach((word, index) => {
    // Если встречаем перенос строки или специальные маркеры, создаем новый сегмент
    if (word.word.includes('\n') || word.word.includes('[') || index === 0) {
      if (currentSegment.words.length > 0) {
        currentSegment.text = cleanText(currentText);
        segments.push(currentSegment);
        currentText = '';
      }
      
      currentSegment = {
        id: segmentId++,
        seek: 0,
        start: word.start_s,
        end: word.end_s,
        text: '',
        words: []
      };
    }

    // Очищаем слово с помощью cleanText
    const cleanedWord = cleanText(word.word);
    
    // Добавляем слово в текущий сегмент
    currentSegment.words.push({
      word: cleanedWord,
      start: word.start_s,
      end: word.end_s,
      probability: word.p_align
    });

    // Для текста сегмента используем очищенное слово
    if (!cleanedWord.match(/^[.,!?…]$/)) {
      currentText += cleanedWord + ' ';
    } else {
      currentText += cleanedWord;
    }
    
    currentSegment.end = word.end_s;
  });

  // Добавляем последний сегмент
  if (currentSegment.words.length > 0) {
    currentSegment.text = cleanText(currentText);
    segments.push(currentSegment);
  }

  return segments;
}

// Создаем объект в формате music.json
const convertedData = {
  text: cleanText(textData),
  segments: groupWordsIntoSegments(sunoData.alignment)
};

// Записываем результат в новый файл
fs.writeFileSync(
  path.join(__dirname, 'public', `${name}-converted.json`),
  JSON.stringify(convertedData, null, 2),
  'utf8'
);

console.log('Конвертация завершена успешно!');
