const fs = require('fs');
const path = require('path');

// Читаем JSON файл
const jsonPath = path.join(__dirname, 'public', 'clocking.json');
const jsonContent = fs.readFileSync(jsonPath, 'utf8');

// Исправляем пробелы в начале слов
const fixedContent = jsonContent.replace(/"word": " /g, '"word": "');

// Записываем исправленный файл
fs.writeFileSync(jsonPath, fixedContent, 'utf8');

console.log('✅ Пробелы в начале слов исправлены в файле clocking.json'); 