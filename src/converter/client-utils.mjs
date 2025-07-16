// Клиентские утилиты для обработки данных караоке

const isClient = typeof window !== 'undefined';

let console = {
	log: (...args) => {
		if(!isClient) {
			globalThis.console.log(...args);
		}
	},
} 

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
 */
function createSegmentsSequentially(
	paragraphs,
	processedAlignment,
	_alignmentPointer = 0,
	parentId = null,
	isLineSplitter = false,
	isWordSplitter = false
) {
	// console = window.console;
	const segments = [];
	let alignmentPointer = _alignmentPointer;
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
			const isDebug = line === "While I'm talking 'bout our plans";
			isDebug && console.log(`\n🔍 Обрабатываем строку: "${line}"`);
			isDebug && console.log(`📍 Позиция alignmentPointer: ${alignmentPointer}`);
			
			let remainingLine = line.trim();
			let attempts = 0;
			
			while (remainingLine.length > 0 && attempts < MAX_SKIP_ATTEMPTS) {
				if (alignmentPointer >= processedAlignment.length) {
					throw new Error(`Закончился alignment, но строка не обработана: "${remainingLine}"`);
				}
				
				const word = processedAlignment[alignmentPointer];

				const cleanWord = removeMetadata(word.word);
				const trimmedCleanWord = cleanWord.trim(); // убираем пробелы для сравнения
				
				isDebug && console.log(`  🔤 Проверяем слово: "${word.word}" (clean: "${cleanWord}", trimmed: "${trimmedCleanWord}")`);
				isDebug && console.log(`  📝 Оставшаяся строка: remainingLine "${remainingLine}" startWith trimmedCleanWord "${trimmedCleanWord}"`);
				
				// Проверяем точное совпадение
				if (remainingLine.startsWith(trimmedCleanWord)) {
					isDebug && console.log(`  ✅ Совпадение! Откусываем "${trimmedCleanWord}"`);
					
					// Добавляем слово в сегмент с уникальным ID
					segmentWords.push({
						id: wordIndex,
						word: trimmedCleanWord, // используем trimmed версию для консистентности
						start: word.start_s,
						end: word.end_s,
						probability: word.p_align,
					});
					
					// Устанавливаем границы сегмента
					if (segmentStart === null) segmentStart = word.start_s;
					segmentEnd = word.end_s;
					
					// "Откусываем" от строки
					remainingLine = remainingLine.substring(trimmedCleanWord.length).trim();
					isDebug && console.log(`  🔄 После откусывания: remainingLine="${remainingLine}"`);
					alignmentPointer++;
					wordIndex++; // Увеличиваем счетчик слов
					attempts = 0; // Сбрасываем счетчик попыток
				} else {
					isDebug && console.log(`  ❌ Не совпадает, пропускаем`);
					alignmentPointer++;
					attempts++;
				}
			}
			
			if (remainingLine.length > 0) {
				isDebug && console.log(`🚨 ОШИБКА: Не удалось обработать всю строку`);
				isDebug && console.log(`🚨 Оставшаяся часть: "${remainingLine}"`);
				isDebug && console.log(`🚨 Текущая позиция pointer: ${alignmentPointer}`);
				throw new Error(`Не удалось полностью обработать строку: "${line}"`);
			}
			
			console.log(`✅ Строка обработана полностью`);
		});

		// Создаем сегмент для всего параграфа
		const segment = {
			id: paragraphIndex,
			parentId: parentId,
			start: segmentStart,
			end: segmentEnd,
			text: paragraph.lines,
			metaLines: paragraph.metaLines || [],
			paragraph: paragraph.lines.join('\n'),
			words: segmentWords,
		};

		segments.push(segment);
	});

	if (isLineSplitter) {
		return [segments, alignmentPointer];
	}

	return segments;
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

// Функция для очистки метаданных из текста
// Функция для очистки метаданных из текста
function removeMetadata(text) {
	return text
		.replace(/\[.*?\]/g, '') // Удаляем только текст в квадратных скобках
		.replace(/\n{2,}/g, '') // Удаляем несколько последовательных переносов строк
		.replace(/\n/g, '')
		.replace(/\u2019/g, "'") // Типографский апостроф → обычный
		.replace(/\u2018/g, "'") // Типографский апостроф → обычный
		.replace(/\u201C/g, '"') // Типографские кавычки → обычные
		.replace(/\u201D/g, '"') // Типографские кавычки → обычные
		.trim(); // Удаляем пробелы в начале и конце
}

/**
 * Разделяет массив на две части: первые N элементов и остальные
 */
function splitArray(array, count) {
	const firstPart = array.slice(0, count);
	const secondPart = array.slice(count);
	return [firstPart, secondPart];
}

/**
 * Обрабатывает split-lines.txt файл и перегруппирует сегменты используя createSegmentsSequentially
 */
function processSplitFile(convertedData, splitContent) {
	const splitInstructions = splitContent.trim().split(' ');
	
	// Преобразуем каждую инструкцию в массив цифр
	const splitGroups = [];
	splitInstructions.forEach(instruction => {
		const digits = instruction.split('').map(Number).filter(n => !isNaN(n));
		splitGroups.push(digits);
	});
	
	console.log('!! splitGroups', splitGroups);
	console.log('!! splitContent', splitContent);
	
	const newSegments = [];
	let segmentId = 0;
	
	// Применяем split инструкции к каждому сегменту отдельно
	convertedData.segments.forEach((segment, segmentIndex) => {
		if (!segment.text || !segment.words) return;
		let alignmentPointer = 0;
		
		// Получаем группу цифр для этого сегмента
		const currentSplitGroup = splitGroups[segmentIndex % splitGroups.length];
		if (!currentSplitGroup) return;
		
		console.log(`!! Processing segment ${segmentIndex} with split group:`, currentSplitGroup);
		
		const segmentWords = segment.words.map(word => ({
			word: word.word,
			start_s: word.start,
			end_s: word.end,
			p_align: word.probability || 1.0
		}));
		
		// Применяем split инструкции к строкам этого сегмента
		let remainingLines = [...segment.text];
		
		currentSplitGroup.forEach(linesCount => {
			if (linesCount === 0 || remainingLines.length === 0) return;
			
			// Разделяем оставшиеся строки: берем первые N и оставляем остальные
			const [currentLines, restLines] = splitArray(remainingLines, linesCount);
			
			console.log('!! processing:', linesCount, 'lines');
			console.log('!! remainingLines', remainingLines.length);
			console.log('!! currentLines', currentLines);
			console.log('!! restLines', restLines.length);
			
			remainingLines = restLines;
			
			if (currentLines.length > 0) {
				// Создаем параграф для createSegmentsSequentially
				const paragraph = {
					lines: currentLines,
					metaLines: segment.metaLines || [],
					fullText: currentLines.join('\n')
				};
				
				// const isDebug = currentLines.some(line => line === "While I'm talking 'bout our plans");
				// if(isDebug) {
				// 	const logAndExit = (...args) => {
				// 		console.error(...args);
				// 		process.exit(1);
				// 	}
					
				// 	logAndExit('!! alignmentPointer', alignmentPointer);
				// }

				// Используем createSegmentsSequentially для создания нового сегмента
				const [createdSegments, _alignmentPointer] = createSegmentsSequentially(
					[paragraph],
					segmentWords,
					alignmentPointer,
					segment.id, // передаем parentId как id оригинального сегмента
					true,
				);
				alignmentPointer = _alignmentPointer;


				if (createdSegments.length > 0) {
					const newSegment = {
						...createdSegments[0],
						id: segmentId++
					};
					newSegments.push(newSegment);
				}
			}
		});
	});

	const result = {
		...convertedData,
		segments: newSegments
	};

	console.log('!! result', result);
 
	
	return result;
}

/**
 * Объединяет alignment данные в соответствии с реальными словами из текста
 * @param {string} fullText - полный текст сегмента
 * @param {object[]} wordData - данные слов с временными метками
 * @returns {object[]} - массив объединенных слов
 */
function mergeWordParts(fullText, wordData) {
	// Получаем реальные слова из текста
	const realWords = fullText.trim().split(/\s+/).filter(word => word.length > 0);
	
	// Получаем alignment слова (очищенные от метаданных)
	const alignmentWords = wordData.map(word => removeMetadata(word.word).trim());
	
	console.log(`!! mergeWordParts START`);
	console.log(`!! real: [${realWords.join(', ')}]`);
	console.log(`!! alignment: [${alignmentWords.join(', ')}]`);
	
	const result = [];
	let alignmentIndex = 0;
	
	// Простой алгоритм: для каждого реального слова находим соответствующие alignment части
	for (let realIndex = 0; realIndex < realWords.length; realIndex++) {
		const realWord = realWords[realIndex];
		console.log(`!! processing word ${realIndex}: "${realWord}"`);
		
		if (alignmentIndex >= alignmentWords.length) {
			console.log(`!! ERROR: alignment exhausted at "${realWord}"`);
			break;
		}
		
		// Проверяем прямое совпадение
		if (alignmentWords[alignmentIndex].toLowerCase() === realWord.toLowerCase()) {
			console.log(`!! DIRECT match: "${realWord}" = "${alignmentWords[alignmentIndex]}"`);
			result.push({
				text: realWord,
				startTime: wordData[alignmentIndex].start,
				endTime: wordData[alignmentIndex].end,
				words: [wordData[alignmentIndex]]
			});
			alignmentIndex++;
			continue;
		}
		
		// Проверяем обратное совпадение (alignment слово содержит несколько реальных слов)
		const alignmentWord = alignmentWords[alignmentIndex];
		let combinedRealWords = '';
		let wordCount = 0;
		let reverseMatchFound = false;
		
		for (let i = 0; i < realWords.length - realIndex; i++) {
			if (i > 0) combinedRealWords += ' '; // Добавляем пробел между словами
			combinedRealWords += realWords[realIndex + i].toLowerCase();
			wordCount++;
			
			if (combinedRealWords === alignmentWord.toLowerCase()) {
				console.log(`!! REVERSE match: "${alignmentWord}" contains ${wordCount} words`);
				// Создаем ОДИН сегмент для всех реальных слов
				const matchedWords = realWords.slice(realIndex, realIndex + wordCount);
				result.push({
					text: matchedWords.join(' '),
					startTime: wordData[alignmentIndex].start,
					endTime: wordData[alignmentIndex].end,
					words: [wordData[alignmentIndex]]
				});
				// Пропускаем обработанные слова
				realIndex += wordCount - 1; // -1 потому что цикл сам инкрементирует
				alignmentIndex++;
				reverseMatchFound = true;
				break;
			}
		}
		
		// Пропускаем обычную обработку, если уже найдено обратное совпадение
		if (reverseMatchFound) {
			continue;
		}
		
		// Проверяем собранное слово (clock + ing = clocking)
		let wordParts = [];
		let reconstructed = '';
		let startIndex = alignmentIndex;
		
		while (alignmentIndex < alignmentWords.length) {
			const alignmentWord = alignmentWords[alignmentIndex];
			const alignmentData = wordData[alignmentIndex];
			
			wordParts.push(alignmentData);
			reconstructed += alignmentWord;
			alignmentIndex++;
			
			// Проверяем, получили ли полное слово
			if (reconstructed.toLowerCase() === realWord.toLowerCase()) {
				console.log(`!! COMBINED match: "${realWord}" from ${wordParts.length} parts`);
				result.push({
					text: realWord,
					startTime: wordParts[0].start,
					endTime: wordParts[wordParts.length - 1].end,
					words: wordParts
				});
				break;
			}
			
			// Если переступили границу, откатываемся
			if (!realWord.toLowerCase().startsWith(reconstructed.toLowerCase())) {
				console.log(`!! FAILED to match "${realWord}" with "${reconstructed}"`);
				alignmentIndex = startIndex + 1; // Пропускаем текущее alignment слово
				break;
			}
		}
	}
	
	console.log(`!! mergeWordParts END - created ${result.length} words`);
	console.log(`!! result: [${result.map(r => r.text).join(', ')}]`);
	return result;
}

/**
 * Обрабатывает split-words.txt файл и разбивает указанные сегменты на отдельные слова
 * @param {object} convertedData - данные с сегментами
 * @param {string} splitWordsContent - содержимое split-words.txt ("2 5")
 * @returns {object} - данные с разбитыми на слова сегментами
 */
function processSplitWords(convertedData, splitWordsContent) {
	// console = window.console;
	console.log('!! processSplitWords - convertedData:', convertedData);
	console.log('!! processSplitWords - splitWordsContent:', splitWordsContent);
	
	if (!splitWordsContent || splitWordsContent.trim() === '') {
		return convertedData;
	}
	
	// Парсим id сегментов из файла
	const segmentIds = splitWordsContent.trim().split(' ')
		.map(Number);
		
	console.log('!! processSplitWords - segmentIds to split:', segmentIds);
	
	const newSegments = [...convertedData.segments];
	let nextId = Math.max(...newSegments.map(s => s.id)) + 1;
	
	// Итерируемся по каждому id из файла
	segmentIds.forEach(targetId => {
		// Находим сегмент по id или parentId
		const segmentIndex = newSegments.findIndex(segment => 
			segment.id === targetId || segment.parentId === targetId
		);
		
		if (segmentIndex === -1) {
			console.log(`!! processSplitWords - segment with id ${targetId} not found`);
			return;
		}
		
		const segment = newSegments[segmentIndex];
		console.log(`!! processSplitWords - processing segment ${targetId}:`, segment);
		
		// Проверяем что у сегмента есть слова
		if (!segment.words || segment.words.length === 0) {
			console.log(`!! processSplitWords - segment ${targetId} has no words`);
			return;
		}
		
		// Получаем полный текст сегмента
		const fullText = segment.text.join('\n');
		console.log(`!! processSplitWords - fullText: "${fullText}"`);
		
		// Объединяем alignment данные в соответствии с реальными словами из текста
		const mergedWords = mergeWordParts(fullText, segment.words);
		console.log(`!! processSplitWords - mergedWords:`, mergedWords);
		
		// Создаем параграфы для каждого объединенного слова
		const wordParagraphs = mergedWords.map(wordData => ({
			lines: [wordData.text],
			metaLines: segment.metaLines || [],
			fullText: wordData.text
		}));
		
		// Подготавливаем processedAlignment из объединенных слов
		const processedAlignment = mergedWords.map(wordData => ({
			word: wordData.text,
			start_s: wordData.startTime,
			end_s: wordData.endTime,
			p_align: wordData.words.reduce((avg, w) => avg + (w.probability || 1.0), 0) / wordData.words.length
		}));
		
		console.log(`!! processSplitWords - processedAlignment:`, processedAlignment);
		
		// Используем createSegmentsSequentially для создания сегментов из слов
		const [wordSegments, _] = createSegmentsSequentially(
			wordParagraphs,
			processedAlignment,
			0, // начинаем с 0
			segment.id, // parentId
			true
		);
		
		console.log(`!! processSplitWords - created ${wordSegments.length} word segments for segment ${targetId}`);
		
		// Перенумеровываем id для новых сегментов
		wordSegments.forEach(wordSegment => {
			wordSegment.id = nextId++;
		});
		
		// Заменяем исходный сегмент новыми сегментами-словами
		newSegments.splice(segmentIndex, 1, ...wordSegments);
	});
	
	const result = {
		...convertedData,
		segments: newSegments
	};
	
	console.log('!! processSplitWords - result:', result);
	return result;
}

export {
	createSegmentsSequentially,
	preprocessAlignment,
	removeMetadata,
	processSplitFile,
	processSplitWords,
	getSegmentsWithParagraphs
}; 