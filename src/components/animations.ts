import {gsap} from '../lib/gsap';
import {KARAOKE_CONFIG, SONG_TARGET} from '../_config';
import {CharTiming, Word} from '../types';

// Функция для инициализации символов в режиме "letterize"
export const animInit = (chars: Element[], chars2?: Element[]) => {
	// 🆕 Используем глобальный режим или дефолтный
	const currentMode = window.KARAOKE_ANIMATION_MODE || KARAOKE_CONFIG.animationMode;
	
	switch (currentMode) {
		case 'zoom-in':{
			gsap.set(chars, {
				opacity: 0,
				scale: 0.5,
				color: 'hsl(350, 46%, 47%)'
				// color: KARAOKE_CONFIG.COLORS.CHAR, 
			}); 
		}
		break;
		case 'zoom-in-blur':
			gsap.set(chars, {
				opacity: 0,
				scale: 0.5, 
				filter: `blur(100px)`,
				color: KARAOKE_CONFIG.COLORS.CHAR, 
			});
		break;
		case 'zoom-in-out':
			gsap.set(chars, {
				opacity: 0,
				scale: 0.5, 
				filter: `blur(100px)`,
				color: KARAOKE_CONFIG.COLORS.CHAR, 
			});
		break;
		case 'letterize':{
			const config = KARAOKE_CONFIG.letterizeAnimation;

			gsap.set(chars, {
				opacity: 0,
				color: config.colors.from,
				translateY: -config.charTranslateY,
				rotateX: config.rotation.from,
				filter: `blur(${config.blur.from}px)`, 
			});
		}
		break;
		case 'letterize2':{
			const config = KARAOKE_CONFIG.letterizeAnimation;

			if (chars2) {
				gsap.set(chars, {
					opacity: 0,
					color: 'hsl(0, 0%, 10%)',
					translateY: -config.charTranslateY,
					rotateX: config.rotation.from,
					filter: `blur(${config.blur.from}px)`, 
				});
	 
				gsap.set(chars2, {
					opacity: 1,
					color: 'hsl(0, 0.00%, 18.40%)',
					translateY: '0px',
					rotateX: '0deg',
					filter: `blur(0px)`, 
				}); 
			}
		}
		break;
		case 'zoom':{
			const config = KARAOKE_CONFIG.letterizeAnimation;
			gsap.set(chars, {
				opacity: 0,
				scale: 0,
				filter: `blur(${config.blur.from}px)`,
				transformOrigin: 'center center',
			});
		}
		break;
		case 'default':
			gsap.set(chars, {
				opacity: 0.4,
				color: '#666666',
				scale: 1,
				textShadow: 'none',
			});
			break;
	}
};

// Функция для создания анимации символов в режиме "letterize"
export const createZoomInBlurAnimation = (
	timeline: gsap.core.Timeline,
	charElement: Element,
	timing: CharTiming
) => {
	const config = KARAOKE_CONFIG.letterizeAnimation;
	
	// Используем время всего слова для длительности анимации
	const duration = config.duration || timing.wordPart.end - timing.wordPart.start;
	
	// Анимация появления (in)
	timeline.to(charElement, {
		opacity: 1,
		scale: 1, 
		duration: duration,
		filter: `blur(0px)`,
		ease: config.easing,
	}, timing.start);
};


// Функция для создания анимации символов в режиме "letterize"
export const createZoomInAnimation = (
	timeline: gsap.core.Timeline,
	charElement: Element,
	timing: CharTiming
) => {
	const config = KARAOKE_CONFIG.letterizeAnimation;
	
	// Используем время всего слова для длительности анимации
	const duration = config.duration || timing.wordPart.end - timing.wordPart.start;
 
	
	// Анимация появления (in)
	timeline.to(charElement, {
		opacity: 1,
		scale: 1, 
		duration: duration,
		// ease: config.easing,
		ease: 'bounce.inOut',
	}, timing.start);

					// timeline.to(charElement2, {
					// 	opacity: 1,
					// 	scale: 1.5,
					// 	filter: `blur(100px)`,
					// 	duration: duration,
					// 	ease: config.easing,
					// }, timing.start);

	
	// timeline.to(charElement2, {
	// 	opacity: 0,
	// 	scale: 0,  
	// 	duration: duration,
	// 	ease: config.easing,
	// }, timing.end);

	// пойдет для подложки - но нужно отключать внутри файла ParagraphLineComponent.tsx:
	// splitRef.current.chars.forEach((char: Element) => {
	// 	// Случайное размытие для каждого символа (создает эффект тряски)
	// 	const randomBlur = Math.max(0, baseBlur + (Math.random() * blurShakeIntensity));
		
	// 	gsap.set(char, {
	// 		filter: `brightness(${brightness}) contrast(${contrast}) blur(${randomBlur}px)`,
	// 	});
	// });
	// timeline.to(charElement2, {
	// 	opacity: 0,
	// 	scale: 0,  
	// 	duration: 0.3,
	// 	filter: `blur(100px)`,
	// 	ease: config.easing,
	// }, timing.end);
};


// Функция для создания анимации символов в режиме "letterize"
export const createZoomInOutAnimation = (
	timeline: gsap.core.Timeline,
	charElement: Element,
	timing: CharTiming, 
) => { 
	const config = KARAOKE_CONFIG.letterizeAnimation;
	
	// Используем время всего слова для длительности анимации
	const duration = config.duration || timing.wordPart.end - timing.wordPart.start;
 
	// const easing1 = 'power2';
	// const easing2 = 'inOut';
	// const ease = `${easing1}.${easing2}`;

	// Анимация появления (in)
	timeline.to(charElement, {
		opacity: 1,
		scale: 1,
		filter: `blur(0px)`,
		duration: duration,
		ease: config.easing,
		// ease: 'power2.inOut',
		// ease,
		// ease: 'bounce.in',
	}, timing.start);
 
	timeline.to(charElement, {
		opacity: 0,
		scale: 0,  
		duration: duration,
		ease: config.easing,
		// ease: 'power2.inOut',
		// ease
		// ease: 'bounce.out',
	}, timing.end); 
};


// Функция для создания анимации символов в режиме "letterize"
export const createLetterizeAnimation = (
	timeline: gsap.core.Timeline,
	charElement: Element,
	timing: CharTiming, 
) => {
	const config = KARAOKE_CONFIG.letterizeAnimation;
	
	// Используем время всего слова для длительности анимации
	const duration = config.duration || timing.wordPart.end - timing.wordPart.start;

	// Анимация появления (in)
	timeline.to(charElement, {
		opacity: 1,
		color: config.colors.to,
		translateY: 0,
		rotateX: config.rotation.to,
		filter: `blur(${config.blur.to}px)`,
		duration: duration,
		ease: config.easing,
	}, timing.start);

	// Получился интересный эффект исчезновения,
	// как буд-то слова появляются как дымка, которая постепенно исчезает
	// timeline.to(charElement, {
	// 	opacity: 0,
	// 	color: 'rgb(0, 0, 0)',
	// 	translateY: config.charTranslateY,
	// 	rotateX: 90,
	// 	filter: `blur(${config.blur.from}px)`,
	// 	duration: duration * 4,
	// 	ease: config.easing,
	// }, timing.end);

	// Слова словно выборочно распадаются на части,
	// и падают вниз. Но это происходит предсказуемо,
	// и не создает эффекта хаоса.
	// timeline.to(charElement, {
	// 	opacity: 0,
	// 	color: 'rgb(0, 0, 0)',
	// 	translateY: config.charTranslateY,
	// 	rotateX: 90,
	// 	filter: `blur(${config.blur.from}px)`,
	// 	duration: duration * 6,
	// 	ease: config.easing,
	// }, timing.end + duration * 6);

	// console.log('featureTiming', featureTiming);

	// буквы усыпаются как песочек (но почему-то не работает после первого куплета)
	// timeline.to(charElement, {
	// 	opacity: 0,
	// 	color: 'rgb(0, 0, 0)',
	// 	translateY: config.charTranslateY,
	// 	rotateX: 90,
	// 	filter: `blur(${config.blur.from}px)`,
	// 	duration: duration ,
	// 	ease: config.easing,
	// }, timing.end + timing.wordPart.end  );

	// любопытный эффект, создается впечатление что мы используем невидимое "окно"
	// можно использовать с другим эффектом, для создания иллюзии зума (реализовано в createZoomAnimation)
	// timeline.to(charElement, {
	// 	opacity: 0,
	// 	color: 'rgb(0, 0, 0)',
	// 	translateY: config.charTranslateY,
	// 	rotateX: 90,
	// 	filter: `blur(${config.blur.from}px)`,
	// 	duration: duration ,
	// 	ease: config.easing,
	// }, futureTiming ? futureTiming.start : timing.end + timing.wordPart.end  );

 

	// timeline.to(charElement, {
	// 	opacity: 0,
	// 	color: 'rgb(0, 0, 0)', 
	// 	scale: 0,
	// 	filter: `blur(${config.blur.from}px)`,
	// 	duration: duration ,
	// 	ease: config.easing,
	// }, futureTiming ? futureTiming.wordPart.start : timing.end + timing.wordPart.end  );
};


// Функция для создания анимации символов в режиме "letterize"
export const createLetterizeAnimation2 = (
	timeline: gsap.core.Timeline,
	[charElement1, charElement2]: [Element, Element],
	timing: CharTiming
) => {
	const config = KARAOKE_CONFIG.letterizeAnimation;
	
	// Используем время всего слова для длительности анимации
	const duration = config.duration || timing.wordPart.end - timing.wordPart.start;
	 
 
	timeline.to(charElement1, {
		opacity: 1,
		color: 'hsl(350, 46%, 47%)',
		translateY: 0,
		rotateX: config.rotation.to,
		filter: `blur(${config.blur.to}px)`,
		duration: duration,
		ease: config.easing,
	}, timing.start); 

	timeline.to(charElement2, {
		opacity: 0,
		color: 'hsl(350, 46%, 47%)',
		translateY: config.charTranslateY,
		rotateX: '90deg',
		filter: `blur(4px)`, 
		duration: duration,
		ease: config.easing,
	}, timing.start); 
};


// Функция для создания анимации символов в режиме "letterize"
export const createZoomAnimation = (
	timeline: gsap.core.Timeline,
	charElement: Element,
	timing: CharTiming,
	timingsArray: CharTiming[],
	timingIndex: number
) => {
	const config = KARAOKE_CONFIG.letterizeAnimation;
	
	const duration = timing.wordPart.end - timing.wordPart.start;
	
	const futureTiming = timingsArray?.[timingIndex + 10];

	timeline.to(charElement, {
		opacity: 1,
		color: config.colors.to,
		scale: 1,
		filter: `blur(${config.blur.to}px)`,
		duration: duration,
		ease: config.easing,
	}, timing.start);

	timeline.to(charElement, {
		opacity: 0,
		color: 'rgb(0, 0, 0)', 
		scale: 0,
		filter: `blur(${config.blur.from}px)`,
		duration: duration,
		ease: config.easing,
	}, futureTiming ? futureTiming.start : timing.end + timing.wordPart.end  );
};

// Функция для создания стандартной анимации символов
export const createDefaultAnimation = (
	timeline: gsap.core.Timeline,
	charElement: Element,
	timing: CharTiming
) => {
	// Анимация активации
	timeline.to(charElement, {
		opacity: 1,
		color: '#FFD700',
		scale: 1.15,
		textShadow: '0 0 15px #FFD700, 0 0 25px #FFD700',
		duration: 0.1,
	}, timing.start);

	// Анимация завершения
	// timeline.to(charElement, {
	// 	color: '#FFFFFF',
	// 	scale: 1,
	// 	textShadow: 'none',
	// 	duration: 0.1,
	// }, timing.end);
};

const MIN_WORD_DURATION = 0.07; // 70 мс
const SHORT_WORD_ANIMATION_DURATION = 0.05; // 50 мс для анимации коротких слов

// ✅ Общая функция для интерполяции символов внутри слов
export const interpolateCharTimings = (words: Word[], metaLines?: string[], segmentId?: number): Array<CharTiming> => {
	// console.time('interpolateCharTimings');
	const timings: Array<CharTiming> = [];

	// Определяем, разрешена ли интерполяция для этих metaLines
	let interpolateChars = KARAOKE_CONFIG.interpolateChars;
	if (!interpolateChars && metaLines && SONG_TARGET.settings.interpolationMetaLines) {
		interpolateChars = metaLines.some(meta => SONG_TARGET.settings.interpolationMetaLines.includes(meta));
	}

	// Группируем связанные слова (части одного слова)
	const wordGroups: Word[][] = [];
	let currentGroup: Word[] = [];
	
	for (let i = 0; i < words.length; i++) {
		const currentWord = words[i];
		const nextWord = words[i + 1];
		
		// Проверяем, является ли текущее слово частью следующего слова
		const isRelated = nextWord && (
			// Случай 1: слова идут подряд без пробела и имеют очень короткие интервалы
			// (признак того, что это части одного слова)
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

	// Обрабатываем каждую группу слов
	wordGroups.forEach((wordGroup, groupIndex) => {
		// Отладочная информация
		if (wordGroup.length > 1) {
			const groupWords = wordGroup.map(w => w.word).join(' + ');
			const groupTiming = `${wordGroup[0].start.toFixed(2)}s - ${wordGroup[wordGroup.length - 1].end.toFixed(2)}s`;
			console.log(`🔗 Группа ${groupIndex}: [${groupWords}] (${groupTiming})`);
		}


		const getIsInterpolate = (word: Word) => {
			const wordID = word.id;
			const segmentWordId = `${segmentId}-${wordID}`;
			const doNotInterpolateSegmentWordIds = SONG_TARGET.settings.doNotInterpolateSegmentWordIds;
			const doNotInterpolate = doNotInterpolateSegmentWordIds.has(segmentWordId);
			
			let isInterpolate = doNotInterpolate ? false : interpolateChars;
			return isInterpolate;
		}

		if (wordGroup.length === 1) {
			// Обычное слово - используем стандартную интерполяцию
			const word = wordGroup[0];
			const cleanWord = word.word.replace(/^\n/, '');
			const nonSpaceChars = cleanWord.replace(/ /g, '');
			const wordDuration = word.end - word.start;


			const isInterpolate = getIsInterpolate(word);

			// if(doNotInterpolate){
			// 	console.log('isInterpolate', isInterpolate,'word',word.word, segmentWordId);
			// }

			let nonSpaceCharIndex = 0;

			for (let i = 0; i < cleanWord.length; i++) {
				const char = cleanWord[i];

				if (char !== ' ') {
					let charStart, charEnd;
					
					if (wordDuration < MIN_WORD_DURATION) {
						// Если слово очень короткое — все символы появляются одновременно
						// но с короткой анимацией появления
						charStart = word.start;
						charEnd = word.start + SHORT_WORD_ANIMATION_DURATION;
					} else if (isInterpolate) {
						const charDuration = wordDuration / nonSpaceChars.length;
						charStart = word.start + (nonSpaceCharIndex * charDuration);
						charEnd = charStart + charDuration;
					} else {
						charStart = word.start;
						charEnd = word.end;
					}
					
					timings.push({
						char,
						start: charStart,
						end: charEnd,
						wordPart: word,
						wordId: word.id,
						word: word.word,
						charIndexInWord: nonSpaceCharIndex,
					});
					
					nonSpaceCharIndex++;
				}
			}
		} else {
			// todo: тут какая-то хрень происходит, нужно разобраться
			// Группа связанных слов - интерполируем символы по всей группе
			const fullWord = wordGroup.map(w => w.word).join('');
			const cleanFullWord = fullWord.replace(/^\n/, '');
			const nonSpaceChars = cleanFullWord.replace(/ /g, '');
			
			// Общее время группы
			const groupStart = wordGroup[0].start;
			const groupEnd = wordGroup[wordGroup.length - 1].end;
			const groupDuration = groupEnd - groupStart;

			let nonSpaceCharIndex = 0;
			let wordIndex = 0;
			let charIndexInCurrentWord = 0;

			for (let i = 0; i < cleanFullWord.length; i++) {
				const char = cleanFullWord[i];

				if (char !== ' ') {
					let charStart, charEnd;

					// Находим соответствующее слово в группе
					const currentWord = wordGroup[wordIndex];
					const isInterpolate = getIsInterpolate(currentWord);
					
					if (groupDuration < MIN_WORD_DURATION) {
						// Если группа очень короткая — все символы появляются одновременно
						// но с короткой анимацией появления
						charStart = groupStart;
						charEnd = groupStart + SHORT_WORD_ANIMATION_DURATION;
					} else if (isInterpolate) {
						const charDuration = groupDuration / nonSpaceChars.length;
						charStart = groupStart + (nonSpaceCharIndex * charDuration);
						charEnd = charStart + charDuration;
					} else {
						charStart = groupStart;
						charEnd = groupEnd;
					}
					
					
					timings.push({
						char,
						start: charStart,
						end: charEnd,
						wordPart: currentWord,
						wordId: currentWord.id,
						word: currentWord.word,
						charIndexInWord: charIndexInCurrentWord,
					});
					
					nonSpaceCharIndex++;
					charIndexInCurrentWord++;
					
					// Переходим к следующему слову, если достигли конца текущего
					const currentWordClean = currentWord.word.replace(/^\n/, '').replace(/ /g, '');
					if (charIndexInCurrentWord >= currentWordClean.length && wordIndex < wordGroup.length - 1) {
						wordIndex++;
						charIndexInCurrentWord = 0;
					}
				}
			}
		}
	});

	// console.timeEnd('interpolateCharTimings');
	return timings;
}; 