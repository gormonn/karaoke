const fs = require('fs');
const path = require('path');

module.exports = {
	createSegmentsSequentially,
	preprocessAlignment,
	removeMetadata,
	createFormattedJson,
	createEditsFile,
	checkStemsFiles,
	updateStemsInConfig
};

/**
 * - получаем отдельные сегменты (параграфы)
 * - затем, проходимся по параграфам и по json, удяляем из json использованное
 *  - таким образом, мы всегда будем искать не во всем тексте песни,
 * а в конкретных параграфах, попутно удаляя из объекта со слогами (json)
 * уже отработанные слоги.
 * (другими словами, нам не нужно всегда искать все во всем,
 * мы как бы двигаем окно, и вместо удаления - можем использовать поинтер)
 *
 * Сегменты состоят из paragraph, words
 * @param paragraphs
 * @return {*[]}
 */
function getSegmentsWithParagraphs(paragraphs) {
	const segments = [];
	let segmentId = 0;

	// todo: хуета, нужно по другому решить
	// Сортируем абзацы по длине (от самых длинных к самым коротким)
	// Это поможет избежать создания сегментов для подстрок, которые уже обработаны

	paragraphs
		.map((p) => removeMetadata(p).trim())
		.filter((p) => p.length > 0)
		.forEach((paragraph) => {
			// Создаем сегмент для текущего вхождения абзаца
			const segment = {
				id: segmentId++,
				paragraph,
				start: null,
				end: null,
				words: [],
			};

			// todo: Добавляем слова в сегмент

			segments.push(segment);
		});

	return segments;
}

/**
 * Создает сегменты из параграфов с использованием указателя на alignment
 * Обрабатывает параграфы последовательно, построчно
 * @param {Array} paragraphs - массив параграфов, где каждый параграф содержит массив строк
 * @param {Array} processedAlignment - обработанные данные выравнивания
 * @returns {Array} массив сегментов
 */
function createSegmentsSequentially(paragraphs, processedAlignment) {
	const segments = [];
	let alignmentPointer = 0;
	const MAX_SKIP_ATTEMPTS = 1; // minimum 1

	paragraphs.forEach((paragraph, paragraphIndex) => {
		// Пропускаем пустые параграфы
		if (!paragraph.lines || paragraph.lines.length === 0) return;

		let segmentWords = [];
		let segmentStart = null;
		let segmentEnd = null;
		let wordIndex = 0; // Счетчик слов в сегменте

		// Обрабатываем каждую строку параграфа
		paragraph.lines.forEach((line, lineIndex) => {
			console.log(`\n🔍 Обрабатываем строку: "${line}"`);
			console.log(`📍 Позиция alignmentPointer: ${alignmentPointer}`);
			
			let remainingLine = line.trim();
			let attempts = 0;
			
			while (remainingLine.length > 0 && attempts < MAX_SKIP_ATTEMPTS) {
				if (alignmentPointer >= processedAlignment.length) {
					throw new Error(`Закончился alignment, но строка не обработана: "${remainingLine}"`);
				}
				
				const word = processedAlignment[alignmentPointer];
				const cleanWord = removeMetadata(word.word)//.trim();
				
				console.log(`  🔤 Проверяем слово: "${word.word}" (clean: "${cleanWord}")`);
				console.log(`  📝 Оставшаяся строка: remainingLine "${remainingLine}" startWith cleanWord ${cleanWord}`);
				
				if (remainingLine.startsWith(cleanWord)) {
					console.log(`  ✅ Совпадение! Откусываем "${cleanWord}"`);
					
					// Добавляем слово в сегмент с уникальным ID
					segmentWords.push({
						id: wordIndex,
						word: cleanWord,
						start: word.start_s,
						end: word.end_s,
						probability: word.p_align,
					});
					
					// Устанавливаем границы сегмента
					if (segmentStart === null) segmentStart = word.start_s;
					segmentEnd = word.end_s;
					
					// "Откусываем" от строки
					remainingLine = remainingLine.substring(cleanWord.length)//.trim();
					alignmentPointer++;
					wordIndex++; // Увеличиваем счетчик слов
					attempts = 0; // Сбрасываем счетчик попыток
				} else {
					console.log(`  ❌ Не совпадает, пропускаем`);
					alignmentPointer++;
					attempts++;
				}
			}
			
			if (remainingLine.length > 0) {
				console.log(`🚨 ОШИБКА: Не удалось обработать всю строку`);
				console.log(`🚨 Оставшаяся часть: "${remainingLine}"`);
				console.log(`🚨 Текущая позиция pointer: ${alignmentPointer}`);
				throw new Error(`Не удалось полностью обработать строку: "${line}"`);
			}
			
			console.log(`✅ Строка обработана полностью`);
		});

		// Создаем сегмент для всего параграфа
		const segment = {
			id: paragraphIndex,
			start: segmentStart,
			end: segmentEnd,
			text: paragraph.lines,
			paragraph: paragraph.lines.join('\n'),
			words: segmentWords,
		};

		segments.push(segment);
	});

	return segments;
}

/**
 * Находит начало строки в alignment
 * @param {Array} alignment - массив данных выравнивания
 * @param {string} line - очищенный текст строки (без метаданных)
 * @param {number} startIndex - индекс, с которого начинать поиск
 * @returns {number} индекс начала строки или -1, если не найден
 */
function findLineStart(alignment, line, startIndex) {
	// Строка уже очищена от метаданных в getParagraphs
	
	// Пробуем найти начало строки
	for (let i = startIndex; i < alignment.length; i++) {
		// Строим текст из alignment, начиная с позиции i
		let constructedText = '';
		
		// Берем достаточно слов для сравнения (в 2 раза больше длины строки, минимум 50)
		const maxConstructedLength = Math.max(line.length * 2, 50);
		for (let j = i; j < alignment.length && constructedText.length < maxConstructedLength; j++) {
			constructedText += alignment[j].word;
		}
		
		// Убираем метаданные из построенного текста alignment
		const cleanConstructed = removeMetadata(constructedText).trim();
		
		// Проверяем, начинается ли строка с построенного текста
		if (line.startsWith(cleanConstructed.substring(0, Math.min(cleanConstructed.length, line.length)))) {
			return i;
		}
		
		// Проверяем частичное совпадение начала (первые 15 символов)
		const minLength = Math.min(15, line.length);
		if (minLength > 0 && line.substring(0, minLength) === cleanConstructed.substring(0, minLength)) {
			return i;
		}
	}
	
	return -1;
}

/**
 * Находит конец строки в alignment
 * @param {Array} alignment - массив данных выравнивания
 * @param {string} line - очищенный текст строки (без метаданных)
 * @param {number} startIndex - индекс начала строки
 * @returns {number} индекс конца строки или -1, если не найден
 */
function findLineEnd(alignment, line, startIndex) {
	// Строка уже очищена от метаданных в getParagraphs
	
	let constructedText = '';
	
	for (let i = startIndex; i < alignment.length; i++) {
		constructedText += alignment[i].word;
		const cleanConstructed = removeMetadata(constructedText).trim();
		
		// Если построенный текст содержит всю строку
		if (cleanConstructed.includes(line)) {
			return i;
		}
		
		// Если построенный текст стал слишком длинным
		if (cleanConstructed.length > line.length * 2) {
			return i - 1;
		}
	}
	
	return -1;
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

// todo: refactor
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

// Функция для очистки метаданных из текста
function removeMetadata(text) {
	return text
		.replace(/\[.*?\]/g, '') // Удаляем только текст в квадратных скобках
		// .replace(/\n{2,}/g, '\n'); // Заменяем несколько последовательных переносов строк на один
		.replace(/\n{2,}/g, '') // Удаляем несколько последовательных переносов строк
		.replace(/\n/g, '')
		.replace(/\u2019/g, "'") // Типографский апостроф → обычный
		.replace(/\u2018/g, "'") // Типографский апостроф → обычный
		.replace(/\u201C/g, '"') // Типографские кавычки → обычные
		.replace(/\u201D/g, '"'); // Типографские кавычки → обычные
}

// Предварительная обработка слов для исправления проблем с разделением кавычек
function preprocessAlignment(alignment) {
	const result = [...alignment]; // Копируем массив

	// Проходим по всем словам и исправляем кавычки и отдельные буквы
	for (let i = 0; i < result.length - 1; i++) {
		const currentWord = result[i].word;
		const nextWord = result[i + 1].word;

		// Проверяем различные случаи неправильного разделения кавычек

		// Случай 1: кавычки находятся в начале следующего слова с переносом
		if (nextWord.match(/^"\n/) && !currentWord.endsWith('"')) {
			result[i].word = currentWord + '"';
			result[i + 1].word = nextWord.replace(/^"/, '');
		}

		// Случай 2: закрывающая кавычка находится в начале переноса строки
		if (nextWord.match(/^\n"/) && !currentWord.endsWith('"')) {
			result[i].word = currentWord + '"';
			result[i + 1].word = nextWord.replace(/^(\n)"/, '$1');
		}

		// Случай 3: кавычка в конце текущего слова отделена от переноса строки
		if (currentWord.endsWith('"') && nextWord.startsWith('\n')) {
			result[i].word = currentWord.replace(/"$/, '');
			result[i + 1].word = '"' + nextWord;
		}

		// Случай 4: отдельная буква (например, "s") после слова
		if (nextWord.trim().length === 1 && !nextWord.match(/^\n/)) {
			result[i].word = currentWord + nextWord;
			result[i + 1].word = '';
		}
	}

	// Удаляем пустые слова после объединения
	return result.filter((item) => item.word !== '');
}

function createSegments(paragraphs, fullText, processedAlignment) {
	const segments = [];
	let segmentId = 0;

	// todo: хуета, нужно по другому решить
	// Сортируем абзацы по длине (от самых длинных к самым коротким)
	// Это поможет избежать создания сегментов для подстрок, которые уже обработаны

	const sortedParagraphs = paragraphs
		.map((para, index) => ({
			paragraph: para,
			cleanParagraph: removeMetadata(para).trim(),
			originalIndex: index,
		}))
		.filter((p) => p.cleanParagraph !== '');
	// .sort((a, b) => b.cleanParagraph.length - a.cleanParagraph.length);

	// Для каждого абзаца находим все его вхождения в тексте
	// createSegments({sortedParagraphs});
	// Массив для отслеживания уже обработанных позиций в тексте
	const processedRanges = [];

	// Для каждого абзаца находим все его вхождения в тексте
	// todo: а нахуя находить все вхождения???
	/**
	 * план: запоминать последнюю позицию,
	 * игнорируя все предыдущие позиции
	 */
	for (const {paragraph, cleanParagraph, originalIndex} of sortedParagraphs) {
		if (!cleanParagraph) continue;

		// Находим все вхождения абзаца в полном тексте
		const occurrences = findAllOccurrences(fullText, cleanParagraph);

		// Если абзац не найден, пропускаем его
		if (occurrences.length === 0) {
			console.warn(
				`Не удалось найти абзац: "${cleanParagraph.substring(0, 50)}...":
 findAllOccurrences(
 ${fullText}
 
 ##
 
 ${cleanParagraph}
 );
					
`
			);
			continue;
		}

		// Для каждого вхождения создаем сегмент
		for (const position of occurrences) {
			const rangeEnd = position + cleanParagraph.length - 1;

			// Проверяем, не пересекается ли этот диапазон с уже обработанными
			if (isRangeProcessed(position, rangeEnd)) {
				console.log(
					`Пропускаем перекрывающийся сегмент для: "${cleanParagraph.substring(
						0,
						30
					)}..."`
				);
				continue;
			}

			// Находим слова, соответствующие началу и концу абзаца
			const startWordIndex = findWordIndexForPosition(
				processedAlignment,
				fullText,
				position
			);
			const endWordIndex = findWordIndexForPosition(
				processedAlignment,
				fullText,
				rangeEnd
			);

			// Если не удалось определить границы сегмента, пропускаем
			if (startWordIndex === -1 || endWordIndex === -1) {
				console.warn(
					`Не удалось определить границы сегмента для абзаца: "${cleanParagraph.substring(
						0,
						50
					)}..."`
				);
				continue;
			}

			const startTime = processedAlignment[startWordIndex].start_s;
			const endTime = processedAlignment[endWordIndex].end_s;

			// Проверяем, нет ли уже сегмента с такими же временными метками
			// Это поможет избежать дублирования при обработке припевов
			const segmentExists = segments.some(
				(seg) =>
					Math.abs(seg.start - startTime) < 0.1 &&
					Math.abs(seg.end - endTime) < 0.1
			);

			if (segmentExists) {
				// Пропускаем создание дубликата сегмента
				continue;
			}

			// Создаем сегмент для текущего вхождения абзаца
			const segment = {
				id: segmentId++,
				start: startTime,
				end: endTime,
				text: cleanParagraph.split('\n'),
				paragraph: cleanParagraph,
				words: [],
			};

			// Добавляем слова в сегмент
			for (let i = startWordIndex; i <= endWordIndex; i++) {
				const word = processedAlignment[i];
				segment.words.push({
					word: removeMetadata(word.word),
					start: word.start_s,
					end: word.end_s,
					probability: word.p_align,
				});
			}

			segments.push(segment);

			// Добавляем этот диапазон в обработанные
			processedRanges.push({
				start: position,
				end: rangeEnd,
			});
		}
	}

	return segments;

	// Функция для проверки, пересекается ли новый диапазон с уже обработанными
	function isRangeProcessed(start, end) {
		return processedRanges.some(
			(range) =>
				(start >= range.start && start <= range.end) ||
				(end >= range.start && end <= range.end) ||
				(start <= range.start && end >= range.end)
		);
	}
}


// Функция для создания formatted JSON файла (предварительная обработка)
function createFormattedJson(filename, jsonPath) {
	const sunoData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
	const formattedFile = `${filename}-formatted.json`;
	const formattedPath = path.join(__dirname, 'public', formattedFile);

	// Обработка закрывающих знаков препинания
	console.log('\n🔧 Обработка закрывающих знаков препинания:');

	// Определяем закрывающие знаки препинания (включая типографические)
	const closingPunctuation = /^[)\]}"'\u201C\u201D\u2018\u2019?!.,;:]/;

	for (let i = 1; i < sunoData.length; i++) {
		const currentWord = sunoData[i];
		const previousWord = sunoData[i - 1];
		
		// Проверяем, начинается ли текущее слово с закрывающего знака препинания
		if (currentWord.word && closingPunctuation.test(currentWord.word)) {
			// Извлекаем закрывающие знаки препинания из начала слова
			const match = currentWord.word.match(/^([)\]}"'\u201C\u201D\u2018\u2019?!.,;:]+)/);
			if (match) {
				const punctuationToMove = match[1];
				const remainingWord = currentWord.word.substring(punctuationToMove.length);
				
				// Переносим знаки препинания в предыдущее слово
				previousWord.word = previousWord.word + punctuationToMove;
				currentWord.word = remainingWord;
				
				// Выводим информацию о переносе
				console.log(`  📝 Перенесено "${punctuationToMove}" из позиции ${i} в позицию ${i-1}`);
				console.log(`     Было: "${sunoData[i-1].word}" | "${punctuationToMove}${remainingWord}"`);
				console.log(`     Стало: "${previousWord.word}" | "${remainingWord}"`);
				
				// Если после переноса слово стало пустым, удаляем его
				if (remainingWord.trim() === '') {
					console.log(`  🗑️ Удаляем пустое слово на позиции ${i}`);
					sunoData.splice(i, 1);
					i--; // Корректируем индекс после удаления
				}
			}
		}
	}
	
	console.log('✅ Обработка закрывающих знаков препинания завершена\n');

	// Сохраняем данные в formatted файл
	fs.writeFileSync(
		formattedPath,
		JSON.stringify(sunoData, null, 2),
		'utf8'
	);

	console.log(`Создан файл предварительной обработки: ${formattedFile}`);
}

/**
 * Создает edits файл на основе converted данных
 * @param {string} filename - имя файла без расширения
 * @param {Object} convertedData - данные из converted файла
 */
function createEditsFile(filename, convertedData) {
	const editsFile = `${filename}-converted-edits.json`;
	const editsPath = path.join(__dirname, 'public', editsFile);

	// Создаем структуру для edits файла
	const editsData = {
		text: convertedData.text,
		segments: convertedData.segments.map(segment => ({
			id: segment.id,
			start: null, // Можно переопределить
			end: null,   // Можно переопределить
			text: segment.text,
			paragraph: segment.paragraph,
			words: [], // Пустой массив для редактирования
			lines: segment.lines
		})),
		language: convertedData.language
	};

	// Сохраняем edits файл
	fs.writeFileSync(
		editsPath,
		JSON.stringify(editsData, null, 2),
		'utf8'
	);

	console.log(`Создан файл для редактирования: ${editsFile}`);
}

/**
 * Проверяет наличие файлов стемов в каталоге stems/{song_name}/
 * @param {string} songName - имя песни
 * @returns {Object} объект с найденными стемами
 */
function checkStemsFiles(songName) {
	const stemsDir = path.join(__dirname, 'public', 'stems', songName);
	const stemsConfig = {};
	
	// Проверяем существование каталога
	if (!fs.existsSync(stemsDir)) {
		console.log(`Каталог стемов не найден: ${stemsDir}`);
		return stemsConfig;
	}
	
	// Список поддерживаемых типов стемов и их соответствие ключам
	const stemTypes = {
		'bass': ['(Bass)', '(bass)', '(BASS)'],
		'drums': ['(Drums)', '(drums)', '(DRUMS)'],
		'guitar': ['(Guitar)', '(guitar)', '(GUITAR)'],
		'percussion': ['(Percussion)', '(percussion)', '(PERCUSSION)'],
		'synth': ['(Synth)', '(synth)', '(SYNTH)'],
		'vocals': ['(Vocals)', '(vocals)', '(VOCALS)']
	};
	
	try {
		// Читаем файлы в каталоге стемов
		const files = fs.readdirSync(stemsDir);
		
		// Проверяем каждый файл на соответствие типам стемов
		files.forEach(file => {
			// Проверяем только аудиофайлы
			if (file.match(/\.(mp3|wav|flac|m4a|ogg)$/i)) {
				Object.entries(stemTypes).forEach(([key, patterns]) => {
					patterns.forEach(pattern => {
						if (file.includes(pattern)) {
							stemsConfig[key] = `stems/${songName}/${file}`;
							console.log(`✅ Найден стем ${key}: ${file}`);
						}
					});
				});
			}
		});
		
		if (Object.keys(stemsConfig).length === 0) {
			console.log(`Стемы не найдены в каталоге: ${stemsDir}`);
		} else {
			console.log(`Найдено стемов: ${Object.keys(stemsConfig).length}`);
		}
		
	} catch (error) {
		console.error(`Ошибка при чтении каталога стемов: ${error.message}`);
	}
	
	return stemsConfig;
}

/**
 * Обновляет конфигурацию стемов в _config.ts
 * @param {Object} stemsConfig - объект с найденными стемами
 */
function updateStemsInConfig(stemsConfig) {
	const configPath = path.join(__dirname, 'src', '_config.ts');
	
	try {
		let content = fs.readFileSync(configPath, 'utf8');
		
		// Формируем новый объект stems
		let stemsObject = '';
		if (Object.keys(stemsConfig).length > 0) {
			const stemsEntries = Object.entries(stemsConfig)
				.map(([key, filePath]) => `\t${key}: staticFile('${filePath}')`)
				.join(',\n');
			stemsObject = `{\n${stemsEntries}\n\t}`;
		} else {
			stemsObject = '{}';
		}
		
		// Заменяем объект stems в SONG_TARGET, сохраняя остальную структуру
		const stemsRegex = /(\s+stems:\s*)\{[^}]*\}(\s*as\s+Record<string,\s*string>)/;
		const replacement = `$1${stemsObject}$2`;
		
		if (stemsRegex.test(content)) {
			content = content.replace(stemsRegex, replacement);
		} else {
			console.warn('Не удалось найти секцию stems в _config.ts');
			return;
		}
		
		// Записываем обновленный файл
		fs.writeFileSync(configPath, content, 'utf8');
		
		if (Object.keys(stemsConfig).length > 0) {
			console.log(`✅ Конфигурация стемов обновлена в _config.ts:`);
			Object.entries(stemsConfig).forEach(([key, filePath]) => {
				console.log(`   ${key}: ${filePath}`);
			});
		} else {
			console.log('✅ Объект stems очищен в _config.ts');
		}
		
	} catch (error) {
		console.error(`Ошибка при обновлении _config.ts: ${error.message}`);
	}
}