import {staticFile} from 'remotion'; 

export const SONG_NAME = `Never_Said`;

const checkFile = (baseName: string): Promise<string> => {
	return new Promise((resolve, reject) => {
		const file = staticFile(baseName);
		const checker = new Audio();

		checker.src = file;
		checker.onprogress = () => {
			console.log(`! onprogress ${baseName}`);
			checker.remove();
			resolve(file);
		};
		checker.onerror = (e) => {
			console.log(`! onError ${baseName}`, e);
			reject(`Error: File ${file} not found!`);
		};
	});
};

// Функция для определения доступного аудиоформата
const getAudioFile = (baseName: string): Promise<string> => {
	return new Promise(async (resolve, reject) => {
		const wav = await checkFile(`${baseName}.wav`)
			.then((v) => v)
			.catch(() => null);

		const mp3 = await checkFile(`${baseName}.mp3`)
			.then((v) => v)
			.catch(() => null);

		if (wav) {
			resolve(wav);
		} else if (mp3) {
			resolve(mp3);
		} else {
			reject(`Error: File ${baseName}.{mp3|wav} not found!`);
		}
	});
};

export const SONG_TARGET = {
	segments: staticFile(`${SONG_NAME}-converted.json`),
	edits: staticFile(`${SONG_NAME}-converted-edits.json`),
	split: staticFile(`stems/${SONG_NAME}/split.txt`),
	music: getAudioFile(SONG_NAME),
	stems: {
	bass: staticFile('stems/Never_Said/It’s not clocking to you Said No One Ever (Bass).wav'),
	drums: staticFile('stems/Never_Said/It’s not clocking to you Said No One Ever (Drums).wav'),
	guitar: staticFile('stems/Never_Said/It’s not clocking to you Said No One Ever (Guitar).wav'),
	percussion: staticFile('stems/Never_Said/It’s not clocking to you Said No One Ever (Percussion).wav'),
	synth: staticFile('stems/Never_Said/It’s not clocking to you Said No One Ever (Synth).wav'),
	vocals: staticFile('stems/Never_Said/It’s not clocking to you Said No One Ever (Vocals).wav')
	} as Record<string, string>,
	background: staticFile('assets/background.jpg'),
};

// ✅ Настройки караоке анимации
export const KARAOKE_CONFIG = {
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
	
	// Настройки для режима "letterize" (адаптированного из Word.tsx)
	letterizeAnimation: {
		charTranslateY: 24,      // Смещение символов по вертикали
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
			from: 'hsl(109, 97%, 88%)',  // Начальный цвет
			to: 'hsl(350, 46%, 47%)',    // Конечный цвет
		},
	},
};
