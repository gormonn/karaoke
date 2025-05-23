const fs = require('fs');

// Читаем файл логов
const logData = JSON.parse(fs.readFileSync('./log.json', 'utf8'));

// Выводим структуру данных
console.log('Тип данных:', typeof logData);
console.log('Ключи верхнего уровня:', Object.keys(logData));
console.log('Пример первой записи:', JSON.stringify(logData[Object.keys(logData)[0]], null, 2));

const errorStats = {};

if (!Array.isArray(logData.messages)) {
    console.error('log.json не содержит массив messages');
    process.exit(1);
}

function normalizePodName(text) {
    // Заменяем шаблон <имя>-<хэш> на <имя>
    // Например: monitoring-597b58f759-2fh7d -> monitoring
    return text.replace(/([a-zA-Z0-9]+)-[a-z0-9]{6,}-[a-z0-9]{4,}/g, '$1');
}

logData.messages.forEach(msg => {
    // Проверяем text
    if (Array.isArray(msg.text)) {
        msg.text.forEach(part => {
            if (part && part.type === 'italic') {
                let text = part.text || 'unknown';
                text = normalizePodName(text);
                if (text.toLowerCase().includes('frontend')) {
                    errorStats[text] = (errorStats[text] || 0) + 1;
                }
            }
        });
    }
    // Проверяем text_entities
    if (Array.isArray(msg.text_entities)) {
        msg.text_entities.forEach(part => {
            if (part && part.type === 'italic') {
                let text = part.text || 'unknown';
                text = normalizePodName(text);
                if (text.toLowerCase().includes('frontend')) {
                    errorStats[text] = (errorStats[text] || 0) + 1;
                }
            }
        });
    }
});

// Выводим статистику
console.log('Статистика ошибок с типом italic (без хэша пода, только с "frontend"):');
console.log('--------------------------------');
Object.entries(errorStats)
    .sort(([,a], [,b]) => b - a) // Сортируем по убыванию количества
    .forEach(([text, count]) => {
        console.log(`Текст: "${text}"`);
        console.log(`Количество: ${count}`);
        console.log('--------------------------------');
    }); 