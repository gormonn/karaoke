const fs = require('fs');
const path = require('path');
const readline = require('readline');
const {
	createSegmentsSequentially,
	preprocessAlignment,
	removeMetadata,
	createFormattedJson,
	createEditsFile
} = require('./converter-utils');

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
	const files = fs
		.readdirSync(path.join(__dirname, 'public'))
		.filter(
			(file) => file.endsWith('.json') && 
			!file.endsWith('-converted.json') && 
			!file.endsWith('-formatted.json')
		)
		.map((file) => ({
			original: file,
			display: file.replace('.json', ''),
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
		output: process.stdout,
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
	console.log(
		'node converter.js --list         - показать список доступных файлов'
	);
	console.log(
		'node converter.js "<filename>"   - конвертировать указанный файл (в кавычках, если есть пробелы)'
	);
	process.exit(1);
}

// Функция для обновления SONG_NAME в _config.ts
function updateSongName(filename) {
	const songFilePath = path.join(__dirname, 'src', CONFIG_FILE);
	let content = fs.readFileSync(songFilePath, 'utf8');

	// Экранируем специальные символы в filename для использования в регулярном выражении
	const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

	// Обновляем значение SONG_NAME, используя экранированное имя файла
	content = content.replace(
		/const SONG_NAME = `.*`/,
		'const SONG_NAME = `' + escapedFilename + '`'
	);

	fs.writeFileSync(songFilePath, content, 'utf8');
	console.log(
		`Файл ${CONFIG_FILE} обновлен с новым именем песни: "${filename}"`
	);
}


// Основная функция конвертации
async function convert(filename) {
	const jsonFile = `${filename}.json`;
	const jsonFileFormatted = `${filename}-formatted.json`;
	const txtFile = `${filename}.txt`;
	const convertedFile = `${filename}-converted.json`;

	// Проверяем существование файлов перед конвертацией
	const jsonPath = path.join(__dirname, 'public', jsonFile);
	const jsonPathFormatted = path.join(__dirname, 'public', jsonFileFormatted);
	const txtPath = path.join(__dirname, 'public', txtFile);

	if (!fs.existsSync(jsonPath)) {
		console.error(`Ошибка: Файл "${jsonFile}" не найден в каталоге public/`);
		process.exit(1);
	}
	// Создаем formatted JSON файл с исходными данными
	createFormattedJson(filename, jsonPath);

	if (!fs.existsSync(txtPath)) {
		console.error(`Ошибка: Файл "${txtFile}" не найден в каталоге public/`);
		process.exit(1);
	}
	// Читаем файлы
	const textData = fs.readFileSync(txtPath, 'utf8');

	if (!fs.existsSync(jsonPathFormatted)) {
		console.error(`Ошибка: Файл "${jsonPathFormatted}" не найден в каталоге public/`);
		process.exit(1);
	}
	const sunoData = JSON.parse(fs.readFileSync(jsonPathFormatted, 'utf8'));

	// Автоматически извлекаем массив из JSON, независимо от структуры
	// let sunoData;
	// if (Array.isArray(rawJsonData)) {
	// 	// Если это массив, используем его как есть
	// 	sunoData = rawJsonData;
	// } else if (
	// 	rawJsonData &&
	// 	typeof rawJsonData === 'object' &&
	// 	rawJsonData.alignment
	// ) {
	// 	// Если это объект с полем alignment, используем его
	// 	sunoData = rawJsonData.alignment;
	// } else {
	// 	// Если структура неизвестна, пробуем найти массив в объекте
	// 	const possibleArrays = Object.values(rawJsonData).filter(Array.isArray);
	// 	if (possibleArrays.length > 0) {
	// 		sunoData = possibleArrays[0];
	// 	} else {
	// 		console.error('Не удалось найти массив данных в JSON файле');
	// 		process.exit(1);
	// 	}
	// }

	// Определяем абзацы в текстовом файле
	function getParagraphs(textData) {
		// Разбиваем текст на абзацы по двойному переносу строки
		const paragraphs = textData.split(/\n\s*\n/);

		// Для каждого параграфа разделяем строки на обычные и метаданные
		return paragraphs
			.filter(para => para.trim().length > 0)
			.map(para => {
				const allLines = para.split('\n').filter(line => line.trim().length > 0);
				const lines = []; // Строки с реальным текстом
				const metaLines = []; // Строки только с метаданными
				
				allLines.forEach(line => {
					const cleanLine = removeMetadata(line).trim();
					if (cleanLine === '') {
						metaLines.push(line); // Только метаданные
					} else {
						lines.push(cleanLine); // Реальный текст без метаданных
					}
				});
				
				return {
					lines: lines, // Чистые строки для поиска
					metaLines: metaLines, // Метаданные для сохранения
					fullText: para // Оставляем полный текст для совместимости
				};
			});
	}

	// Функция для построения сегментов на основе абзацев из текстового файла
	function buildSegmentsFromParagraphs(alignment, paragraphs, cleanedTextData) {
		// Предварительно обрабатываем выравнивание
		const processedAlignment = preprocessAlignment(alignment);

		// Используем новую последовательную логику обработки
		const segments = createSegmentsSequentially(paragraphs, processedAlignment);

		// Сортируем сегменты по времени начала (на всякий случай)
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

	// Создаем объект в формате music.json
	const convertedData = {
		text: cleanedTextData,
		segments: buildSegmentsFromParagraphs(
			sunoData,
			paragraphs,
			cleanedTextData
		),
		language: 'en', // Можно определять автоматически при необходимости
	};

	// todo: устарело deprecated:
	// Добавляем разделение на строки для каждого сегмента
	convertedData.segments.forEach((segment) => {
		segment.lines = []; //splitSegmentIntoLines(segment);
	});

	// Записываем результат в новый файл
	fs.writeFileSync(
		path.join(__dirname, 'public', convertedFile),
		JSON.stringify(convertedData, null, 2),
		'utf8'
	);

	// Создаем edits файл для редактирования тайминга
	createEditsFile(filename, convertedData);

	// Обновляем SONG_NAME в _config.ts
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
