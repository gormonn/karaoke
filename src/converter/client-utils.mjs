// Клиентские утилиты для обработки данных караоке

const isClient = typeof window !== 'undefined';

const console = {
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
function createSegmentsSequentially(paragraphs, processedAlignment, _alignmentPointer = 0) {
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
			metaLines: paragraph.metaLines,
			paragraph: paragraph.lines.join('\n'),
			words: segmentWords,
		};

		segments.push(segment);
	});

	if (isClient) {
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
		.replace(/\u201D/g, '"'); // Типографские кавычки → обычные
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
 * Обрабатывает split.txt файл и перегруппирует сегменты используя createSegmentsSequentially
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
					metaLines: [],
					fullText: currentLines.join('\n')
				};
				
				// Используем createSegmentsSequentially для создания нового сегмента
				const [createdSegments, _alignmentPointer] = createSegmentsSequentially(
					[paragraph],
					segmentWords,
					alignmentPointer
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

export {
	createSegmentsSequentially,
	preprocessAlignment,
	removeMetadata,
	processSplitFile,
	getSegmentsWithParagraphs
}; 