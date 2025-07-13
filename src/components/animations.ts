import {gsap} from '../lib/gsap';
import {KARAOKE_CONFIG} from '../_config';
import {CharTiming, Word} from '../types';

// Функция для инициализации символов в режиме "letterize"
export const initializeLetterizeChars = (chars: Element[], chars2?: Element[]) => {
	// 🆕 Используем глобальный режим или дефолтный
	const currentMode = window.KARAOKE_ANIMATION_MODE || KARAOKE_CONFIG.animationMode;
	
	switch (currentMode) {
		case 'zoom-in':{
			gsap.set(chars, {
				opacity: 0,
				scale: 0.5,
				color: KARAOKE_CONFIG.COLORS.CHAR, 
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
		ease: config.easing,
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
 
	
	// Анимация появления (in)
	timeline.to(charElement, {
		opacity: 1,
		scale: 1,
		filter: `blur(0px)`,
		duration: duration,
		ease: config.easing,
	}, timing.start);
 
	timeline.to(charElement, {
		opacity: 0,
		scale: 0,  
		duration: duration,
		ease: config.easing,
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

// ✅ Общая функция для интерполяции символов внутри слов
export const interpolateCharTimings = (words: Word[]): Array<CharTiming> => {
	const timings: Array<CharTiming> = [];

	words.forEach((word) => {
		const cleanWord = word.word.replace(/^\n/, '');
		
		// Считаем только не-пробельные символы для интерполяции
		const nonSpaceChars = cleanWord.replace(/ /g, '');
		const wordDuration = word.end - word.start;
		const charDuration = KARAOKE_CONFIG.interpolateChars && nonSpaceChars.length > 0 
			? wordDuration / nonSpaceChars.length 
			: 0;

		let nonSpaceCharIndex = 0;

		// Добавляем символы слова
		for (let i = 0; i < cleanWord.length; i++) {
			const char = cleanWord[i];

			if (char !== ' ') {
				let charStart, charEnd;
				
				if (KARAOKE_CONFIG.interpolateChars) {
					// Интерполируем символы внутри времени слова
					charStart = word.start + (nonSpaceCharIndex * charDuration);
					charEnd = charStart + charDuration;
				} else {
					// Все символы слова используют время всего слова
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
	});

	return timings;
}; 