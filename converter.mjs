import fs from 'fs';
import path from 'path';
import readline from 'readline';
import {
	createSegmentsSequentially,
	preprocessAlignment,
	removeMetadata,
	processSplitFile,
	processSplitWords
} from './src/converter/client-utils.mjs';

import {
	createFormattedJson,
	createEditsFile,
	checkStemsFiles,
	updateStemsInConfig
} from './src/converter/server-utils.mjs';

const logAndExit = (...args) => {
	console.error(...args);
	process.exit(1);
}

const CONFIG_FILE = '_config.ts';

// Глобальные переменные для логирования
let logFile = null;
let originalConsoleLog = console.log;
let originalConsoleError = console.error;

// Функция для настройки логирования
function setupLogging(filename) {
	logFile = path.join(process.cwd(), 'public', `${filename}_convert.logs`);
	
	// Перехватываем console.log
	console.log = function(...args) {
		const message = args.join(' ');
		// Выводим в консоль как обычно
		originalConsoleLog(...args);
		// Записываем в файл
		fs.appendFileSync(logFile, message + '\n', 'utf8');
	};
	
	// Перехватываем console.error
	console.error = function(...args) {
		const message = args.join(' ');
		// Выводим в консоль как обычно
		originalConsoleError(...args);
		// Записываем в файл
		fs.appendFileSync(logFile, message + '\n', 'utf8');
	};
}

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
		.readdirSync(path.join(process.cwd(), 'public'))
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
	const songFilePath = path.join(process.cwd(), 'src', CONFIG_FILE);
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


// Функция для обработки split-lines и split-words файлов
async function processSplitFiles(filename, originalData) {
	console.log('📂 Ищем split-файлы...');
	
	// Создаем папку results если её нет
	const resultsDir = path.join(process.cwd(), 'results');
	if (!fs.existsSync(resultsDir)) {
		fs.mkdirSync(resultsDir, { recursive: true });
		console.log('📁 Создана папка results/');
	}
	
	// Пути к split файлам
	const splitLinesPath = path.join(process.cwd(), 'public', 'stems', filename, 'split-lines.txt');
	const splitWordsPath = path.join(process.cwd(), 'public', 'stems', filename, 'split-words.txt');
	
	let currentData = { ...originalData };
	
	// Обработка split-lines
	if (fs.existsSync(splitLinesPath)) {
		console.log('✅ Найден split-lines.txt, обрабатываем...');
		const splitLinesContent = fs.readFileSync(splitLinesPath, 'utf8');
		
		try {
			// Заглушка для window.console в Node.js
			global.window = global.window || {};
			global.window.console = console;

			const splitLinesData = processSplitFile(currentData, splitLinesContent);
			
			// logAndExit('!! splitLinesData', splitLinesData);
			
			// Сохраняем результат split-lines
			const splitLinesFile = `${filename}-split-lines.json`;
			const splitLinesFilePath = path.join(process.cwd(), 'results', splitLinesFile);
			fs.writeFileSync(splitLinesFilePath, JSON.stringify(splitLinesData, null, 2), 'utf8');
			console.log(`💾 Сохранен результат split-lines: results/${splitLinesFile}`);
			
			currentData = splitLinesData;
		} catch (error) {
			console.error('❌ Ошибка при обработке split-lines:', error.message);
			process.exit(1);
		}
	} else {
		console.log('⚠️ split-lines.txt не найден, пропускаем');
	}
	
	// Обработка split-words
	if (fs.existsSync(splitWordsPath)) {
		console.log('✅ Найден split-words.txt, обрабатываем...');
		const splitWordsContent = fs.readFileSync(splitWordsPath, 'utf8');
		
		try {
			// Заглушка для window.console в Node.js
			global.window = global.window || {};
			global.window.console = console;
			
			const splitWordsData = processSplitWords(currentData, splitWordsContent);
			
			// Сохраняем результат split-words
			const splitWordsFile = `${filename}-split-words.json`;
			const splitWordsFilePath = path.join(process.cwd(), 'results', splitWordsFile);
			fs.writeFileSync(splitWordsFilePath, JSON.stringify(splitWordsData, null, 2), 'utf8');
			console.log(`💾 Сохранен результат split-words: results/${splitWordsFile}`);
			
			// Сохраняем финальный результат
			const finalFile = `${filename}-final.json`;
			const finalFilePath = path.join(process.cwd(), 'results', finalFile);
			fs.writeFileSync(finalFilePath, JSON.stringify(splitWordsData, null, 2), 'utf8');
			console.log(`💾 Сохранен финальный результат: results/${finalFile}`);
			
			// Сохраняем оригинальные данные для сравнения
			const originalFile = `${filename}-original.json`;
			const originalFilePath = path.join(process.cwd(), 'results', originalFile);
			fs.writeFileSync(originalFilePath, JSON.stringify(originalData, null, 2), 'utf8');
			console.log(`💾 Сохранены оригинальные данные: results/${originalFile}`);
			
		} catch (error) {
			console.error('❌ Ошибка при обработке split-words:', error.message);
		}
	} else {
		console.log('⚠️ split-words.txt не найден, пропускаем');
	}
}

// Основная функция конвертации
async function convert(filename) {
	// Настраиваем логирование для этого файла
	setupLogging(filename);
	
	try {
		const jsonFile = `${filename}.json`;
		const jsonFileFormatted = `${filename}-formatted.json`;
		const txtFile = `${filename}.txt`;
		const convertedFile = `${filename}-converted.json`;

		// Проверяем существование файлов перед конвертацией
		const jsonPath = path.join(process.cwd(), 'public', jsonFile);
		const jsonPathFormatted = path.join(process.cwd(), 'public', jsonFileFormatted);
		const txtPath = path.join(process.cwd(), 'public', txtFile);

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

		// logAndExit('!! paragraphs', paragraphs.map(p => p.metaLines.map(m => removeMetadata(m))));

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

		// Сохраняем оригинальные данные для дальнейшей обработки
		console.log('\n🔄 Обработка split-lines и split-words...');
		await processSplitFiles(filename, convertedData);

		// todo: устарело deprecated: (кто сказал???)
		// Добавляем разделение на строки для каждого сегмента
		convertedData.segments.forEach((segment) => {
			segment.lines = []; //splitSegmentIntoLines(segment);
		});

		// Записываем результат в новый файл
		fs.writeFileSync(
			path.join(process.cwd(), 'public', convertedFile),
			JSON.stringify(convertedData, null, 2),
			'utf8'
		);

		// Создаем edits файл для редактирования тайминга
		createEditsFile(filename, convertedData);

		// Обновляем SONG_NAME в _config.ts
		updateSongName(filename);

		// Проверяем наличие стемов и обновляем конфигурацию
		console.log('\n🎵 Проверка стемов...');
		const stemsConfig = checkStemsFiles(filename);
		updateStemsInConfig(stemsConfig);

		console.log('Конвертация завершена успешно!');
	} catch (error) {
		console.error('Ошибка при конвертации:', error);
		throw error;
	} finally {
		// Восстанавливаем оригинальный console.log
		console.log = originalConsoleLog;
		console.error = originalConsoleError;
	}
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
