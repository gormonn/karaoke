const fs = require('fs');
const path = require('path');

// Читаем JSON файл
const jsonPath = path.join(__dirname, 'public', 'clocking.json');
const jsonContent = fs.readFileSync(jsonPath, 'utf8');

// Исправляем пунктуацию в словах
let fixedContent = jsonContent;

// Удаляем запятые, точки, вопросительные и восклицательные знаки из слов
fixedContent = fixedContent.replace(/"word": "([^"]*)([,.!?])"/g, '"word": "$1"');

// Удаляем пробелы в начале слов
fixedContent = fixedContent.replace(/"word": " /g, '"word": "');

console.log('✅ Пунктуация и пробелы в словах исправлены в файле clocking.json');

// Записываем исправленный файл
fs.writeFileSync(jsonPath, fixedContent, 'utf8'); 