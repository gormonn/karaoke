const fs = require('fs');
const path = require('path');

/**
 * Конвертер файлов для караоке-системы
 * 
 * Использование:
 * - node converter.js --list         - показать список доступных JSON файлов
 * - node converter.js <filename>     - конвертировать указанный файл (без расширения)
 * 
 * Пример:
 * node converter.js --list
 * node converter.js song1
 */

// Функция для отображения списка JSON файлов
function showJsonFiles() {
    const files = fs.readdirSync(path.join(__dirname, 'public'))
        .filter(file => file.endsWith('.json') && !file.endsWith('-converted.json'));
    
    if (files.length === 0) {
        console.log('Файлы JSON не найдены в каталоге public/');
        return;
    }

    console.log('Доступные файлы для конвертации:');
    files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.replace('.json', '')}`);
    });
}

// Обработка аргументов командной строки
const [arg] = process.argv.slice(2);

// Проверяем аргументы
if (!arg) {
    console.log('Использование:');
    console.log('node converter.js --list         - показать список доступных файлов');
    console.log('node converter.js <filename>     - конвертировать указанный файл');
    process.exit(1);
}

// Если запрошен список файлов
if (arg === '--list') {
    showJsonFiles();
    process.exit(0);
}

// Проверяем существование файлов перед конвертацией
if (!fs.existsSync(path.join(__dirname, 'public', `${arg}.json`))) {
    console.error(`Ошибка: Файл ${arg}.json не найден в каталоге public/`);
    process.exit(1);
}

if (!fs.existsSync(path.join(__dirname, 'public', `${arg}.txt`))) {
    console.error(`Ошибка: Файл ${arg}.txt не найден в каталоге public/`);
    process.exit(1);
}

// Читаем файлы
const sunoData = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', `${arg}.json`), 'utf8'));
const textData = fs.readFileSync(path.join(__dirname, 'public', `${arg}.txt`), 'utf8');

// Функция для очистки метаданных из текста
function removeMetadata(text) {
    return text
        .replace(/\[.*?\]/g, '')
        .replace(/\n{2,}/g, '\n');
}

// Определяем абзацы в текстовом файле
function getParagraphs(textData) {
    const paragraphs = textData.split(/\n\s*\n/);
    return paragraphs.filter(para => para.trim() !== '');
}

// Получаем абзацы из текстового файла
const paragraphs = getParagraphs(textData);

// Обработанный текст без метаданных
const cleanedTextData = removeMetadata(textData);

// Создаем объект в формате music.json
const convertedData = {
    text: cleanedTextData,
    segments: buildSegmentsFromParagraphs(sunoData, paragraphs),
    language: "en"
};

// Добавляем разделение на строки для каждого сегмента
convertedData.segments.forEach(segment => {
    segment.lines = splitSegmentIntoLines(segment);
});

// Записываем результат в новый файл
fs.writeFileSync(
    path.join(__dirname, 'public', `${arg}-converted.json`),
    JSON.stringify(convertedData, null, 2),
    'utf8'
);

console.log('Конвертация завершена успешно!'); 