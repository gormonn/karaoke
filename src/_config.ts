import {staticFile} from 'remotion'; 
import {SONG_SETTINGS} from './settings/Never_Said';

export const SONG_NAME = `Never_Said`;

// Функция для расчета charTranslateY на основе fontSize
const calculateCharTranslateY = (fontSize: string): number => {
	// Извлекаем числовое значение из fontSize (например, "2.5rem" -> 2.5)
	const numericValue = parseFloat(fontSize);
	
	// Если fontSize в rem, конвертируем в px (1rem = 16px)
	const fontSizeInPx = fontSize.includes('rem') ? numericValue * 16 : numericValue;
	
	// Применяем коэффициент 0.6 для получения charTranslateY
	return fontSizeInPx * 0.5;
};

export const SONG_TARGET = {
	segments: staticFile(`${SONG_NAME}-converted.json`),
	edits: staticFile(`${SONG_NAME}-converted-edits.json`),
	splitLines: staticFile(`stems/${SONG_NAME}/split-lines.txt`),
	splitWords: staticFile(`stems/${SONG_NAME}/split-words.txt`),
	music: staticFile(SONG_NAME),
	stems: {
	bass: staticFile('stems/Never_Said/It’s not clocking to you Said No One Ever (Bass).wav'),
	drums: staticFile('stems/Never_Said/It’s not clocking to you Said No One Ever (Drums).wav'),
	guitar: staticFile('stems/Never_Said/It’s not clocking to you Said No One Ever (Guitar).wav'),
	percussion: staticFile('stems/Never_Said/It’s not clocking to you Said No One Ever (Percussion).wav'),
	synth: staticFile('stems/Never_Said/It’s not clocking to you Said No One Ever (Synth).wav'),
	vocals: staticFile('stems/Never_Said/It’s not clocking to you Said No One Ever (Vocals).wav')
	} as Record<string, string>,
	background: staticFile('assets/background.jpg'),
	settings: SONG_SETTINGS,
};

const COLORS = {
	BACKGROUND: 'hsl(0, 0%, 10%)',
	// CHAR: 'hsl(350, 46%, 47%)',
	CHAR: 'yellow',
	CHAR_ACCENT: '#CCCCCC',
};

const fontSize = '6rem';
// ✅ Настройки караоке анимации
export const KARAOKE_CONFIG = {
	COLORS,

	splitLines: true,
	splitWords: true,
	transparent: false,
	// Интерполяция символов внутри слов
	// true: символы слова подсвечиваются поочередно в течение времени слова
	// false: все символы слова подсвечиваются одновременно по времени слова
	interpolateChars: true,
	
	// Анимация появления/исчезновения сегментов
	segmentTransition: {
		enabled: true,           // Включить/выключить анимацию сегментов
		fadeInDuration: 0.5,     // Длительность появления (сек)
		fadeOutDuration: 0.5,    // Длительность исчезновения (сек)
		easing: 'ease-out',      // CSS easing функция
	},
	
	// Режим анимации символов
	animationMode: 'default' as 'default' | 'letterize',
	
	fontSize,
	// fontSize: '6rem',

	// Настройки для режима "letterize" (адаптированного из Word.tsx)
	letterizeAnimation: {
		charTranslateY: calculateCharTranslateY(fontSize),      // Смещение символов по вертикали
		// duration: 0.4,           // Длительность анимации (сек)
		duration: null,           // Длительность анимации (будет рассчитана в createLetterizeAnimation)
		easing: 'power2.inOut',  // GSAP easing
		blur: {
			from: 4,             // Начальное размытие
			to: 0,               // Конечное размытие
		},
		rotation: {
			from: -90,           // Начальный поворот (градусы)
			to: 0,               // Конечный поворот (градусы)
		},
		colors: {
			from2: 'hsl(217, 45.80%, 47.10%)',  // Начальный цвет
			from: 'hsl(0, 0.00%, 100.00%)',  // Начальный цвет
			to: 'hsl(350, 46%, 47%)',    // Конечный цвет
			// from: COLORS.CHAR_ACCENT,  // Начальный цвет
			// to: COLORS.CHAR,    // Конечный цвет
		},
	},
};

