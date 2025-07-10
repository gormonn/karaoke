import {gsap} from '../lib/gsap';
import {KARAOKE_CONFIG} from '../_config';
import {CharTiming, Word} from '../types';

// Функция для инициализации символов в режиме "letterize"
export const initializeLetterizeChars = (chars: Element[]) => {
	const currentMode = (window as any).KARAOKE_ANIMATION_MODE || KARAOKE_CONFIG.animationMode;
	
	if (currentMode === 'letterize') {
		const config = KARAOKE_CONFIG.letterizeAnimation;
		gsap.set(chars, {
			opacity: 0,
			color: config.colors.from,
			translateY: -config.charTranslateY,
			rotateX: config.rotation.from,
			filter: `blur(${config.blur.from}px)`,
			transformOrigin: 'center bottom',
		});
	} else {
		// Стандартная инициализация
		gsap.set(chars, {
			opacity: 0.4,
			color: '#666666',
			scale: 1,
			textShadow: 'none',
		});
	}
};

// Функция для создания анимации символов в режиме "letterize"
export const createLetterizeAnimation = (
	timeline: gsap.core.Timeline,
	charElement: Element,
	timing: CharTiming
) => {
	const config = KARAOKE_CONFIG.letterizeAnimation;
	
	// Используем время всего слова для длительности анимации
	const duration = timing.wordPart.end - timing.wordPart.start;
	
	console.log('createLetterizeAnimation', { timing, duration });
	// Анимация появления (in)
	timeline.to(charElement, {
		opacity: 1,
		color: config.colors.to,
		translateY: 0,
		rotateX: config.rotation.to,
		filter: `blur(${config.blur.to}px)`,
		duration: config.duration || duration,
		ease: config.easing,
	}, timing.start);

	// Анимация исчезновения (out) - опционально
	// timeline.to(charElement, {
	// 	opacity: 0,
	// 	color: 'rgb(0, 0, 0)',
	// 	translateY: config.charTranslateY,
	// 	rotateX: 90,
	// 	filter: `blur(${config.blur.from}px)`,
	// 	duration: config.duration,
	// 	ease: config.easing,
	// }, timing.end);
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
	timeline.to(charElement, {
		color: '#FFFFFF',
		scale: 1,
		textShadow: 'none',
		duration: 0.1,
	}, timing.end);
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