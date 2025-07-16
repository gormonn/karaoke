// Тестовый скрипт для проверки логики группировки слов
const testWords = [
	{ id: 6, word: "Sc", start: 4.05, end: 4.09 },
	{ id: 7, word: "roll", start: 4.09, end: 4.16 },
	{ id: 8, word: "ing", start: 4.16, end: 4.23 },
	{ id: 9, word: "through", start: 4.23, end: 4.25 },
	{ id: 10, word: "your", start: 4.25, end: 5.05 },
	{ id: 11, word: "phone", start: 5.05, end: 5.12 },
	{ id: 12, word: "again", start: 5.12, end: 6.09 }
];

const MIN_WORD_DURATION = 0.07; // 70 мс
const SHORT_WORD_ANIMATION_DURATION = 0.05; // 50 мс для анимации коротких слов

function groupRelatedWords(words) {
	const wordGroups = [];
	let currentGroup = [];
	
	for (let i = 0; i < words.length; i++) {
		const currentWord = words[i];
		const nextWord = words[i + 1];
		
		// Проверяем, является ли текущее слово частью следующего слова
		const isRelated = nextWord && (
			// Случай 1: слова идут подряд без пробела и имеют очень короткие интервалы
			!currentWord.word.endsWith(' ') && !nextWord.word.startsWith(' ') &&
			(nextWord.start - currentWord.end) < 0.05 && // интервал меньше 50мс
			
			// Случай 2: одно из слов очень короткое (1-3 символа) и идет рядом с другим
			// без пробела, и интервал очень маленький
			(currentWord.word.length <= 3 || nextWord.word.length <= 3) &&
			!currentWord.word.endsWith(' ') && !nextWord.word.startsWith(' ') &&
			(nextWord.start - currentWord.end) < 0.05 && // интервал меньше 50мс
			
			// Случай 3: слова образуют осмысленное слово при соединении И имеют очень короткий интервал
			!currentWord.word.endsWith(' ') && !nextWord.word.startsWith(' ') &&
			(currentWord.word + nextWord.word).toLowerCase().match(/^[a-z]+$/) &&
			(nextWord.start - currentWord.end) < 0.05 // интервал меньше 50мс
		);
		
		currentGroup.push(currentWord);
		
		if (!isRelated || i === words.length - 1) {
			// Если слова не связаны или это последнее слово, завершаем группу
			if (currentGroup.length > 0) {
				wordGroups.push([...currentGroup]);
				currentGroup = [];
			}
		}
	}
	
	return wordGroups;
}

function interpolateCharTimings(words) {
	const timings = [];
	const wordGroups = groupRelatedWords(words);
	
	wordGroups.forEach((wordGroup, groupIndex) => {
		if (wordGroup.length > 1) {
			const groupWords = wordGroup.map(w => w.word).join(' + ');
			const groupTiming = `${wordGroup[0].start.toFixed(2)}s - ${wordGroup[wordGroup.length - 1].end.toFixed(2)}s`;
			console.log(`🔗 Группа ${groupIndex}: [${groupWords}] (${groupTiming})`);
		}
		
		if (wordGroup.length === 1) {
			// Обычное слово
			const word = wordGroup[0];
			const cleanWord = word.word.replace(/^\n/, '');
			const nonSpaceChars = cleanWord.replace(/ /g, '');
			const wordDuration = word.end - word.start;

			let nonSpaceCharIndex = 0;

			for (let i = 0; i < cleanWord.length; i++) {
				const char = cleanWord[i];

				if (char !== ' ') {
					let charStart, charEnd;
					
					if (wordDuration < MIN_WORD_DURATION) {
						// Короткое слово - все символы появляются одновременно
						charStart = word.start;
						charEnd = word.start + SHORT_WORD_ANIMATION_DURATION;
					} else {
						// Обычная интерполяция
						const charDuration = wordDuration / nonSpaceChars.length;
						charStart = word.start + (nonSpaceCharIndex * charDuration);
						charEnd = charStart + charDuration;
					}
					
					timings.push({
						char,
						start: charStart,
						end: charEnd,
						word: word.word,
						wordDuration: wordDuration,
						isShort: wordDuration < MIN_WORD_DURATION
					});
					
					nonSpaceCharIndex++;
				}
			}
		} else {
			// Группа связанных слов
			const fullWord = wordGroup.map(w => w.word).join('');
			const cleanFullWord = fullWord.replace(/^\n/, '');
			const nonSpaceChars = cleanFullWord.replace(/ /g, '');
			
			const groupStart = wordGroup[0].start;
			const groupEnd = wordGroup[wordGroup.length - 1].end;
			const groupDuration = groupEnd - groupStart;

			let nonSpaceCharIndex = 0;

			for (let i = 0; i < cleanFullWord.length; i++) {
				const char = cleanFullWord[i];

				if (char !== ' ') {
					let charStart, charEnd;
					
					if (groupDuration < MIN_WORD_DURATION) {
						// Короткая группа - все символы появляются одновременно
						charStart = groupStart;
						charEnd = groupStart + SHORT_WORD_ANIMATION_DURATION;
					} else {
						// Обычная интерполяция
						const charDuration = groupDuration / nonSpaceChars.length;
						charStart = groupStart + (nonSpaceCharIndex * charDuration);
						charEnd = charStart + charDuration;
					}
					
					timings.push({
						char,
						start: charStart,
						end: charEnd,
						word: fullWord,
						wordDuration: groupDuration,
						isShort: groupDuration < MIN_WORD_DURATION
					});
					
					nonSpaceCharIndex++;
				}
			}
		}
	});
	
	return timings;
}

// Тестируем группировку
console.log('🧪 Тестирование новой логики анимации:');
console.log('Исходные слова:');
testWords.forEach(word => {
	const duration = word.end - word.start;
	console.log(`  "${word.word}" (${word.start}s - ${word.end}s, ${(duration * 1000).toFixed(0)}ms)`);
});

const charTimings = interpolateCharTimings(testWords);

console.log('\n📊 Результат интерполяции символов:');
charTimings.forEach((timing, index) => {
	const duration = timing.end - timing.start;
	const type = timing.isShort ? '🟡 КОРОТКОЕ' : '🟢 ОБЫЧНОЕ';
	console.log(`  ${index + 1}. "${timing.char}" (${timing.start.toFixed(3)}s - ${timing.end.toFixed(3)}s, ${(duration * 1000).toFixed(0)}ms) ${type}`);
	console.log(`     Слово: "${timing.word}" (${(timing.wordDuration * 1000).toFixed(0)}ms)`);
}); 