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
	music: getAudioFile(SONG_NAME),
	background: staticFile('assets/background.jpg'),
};
