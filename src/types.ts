export interface WhisperResponse {
	text: string;
	segments: Segment[];
	language: string;
}

export interface Segment {
	id: number;
	seek: number;
	start: number;
	end: number;
	text: string[];
	paragraph: string;
	tokens: number[];
	temperature: number;
	avg_logprob: number;
	compression_ratio: number;
	no_speech_prob: number;
	words: Word[];
	lines?: Word[][];
	metaLines: string[]
}

export interface Word {
	id: number;
	word: string;
	start: number;
	end: number;
	probability: number;
}

export interface CharTiming {
	char: string;
	start: number;
	end: number;
	wordPart: Word;
	wordId: number; // todo: поменять на id
	word: string;
	charIndexInWord: number;
}

export enum ANIMATION_MODE {
	LETTERIZE = 'letterize',
	LETTERIZE2 = 'letterize2',
	ZOOM = 'zoom',
	ZOOM_IN = 'zoom-in',
	ZOOM_IN_BLUR = 'zoom-in-blur',
	ZOOM_IN_OUT = 'zoom-in-out',
	DEFAULT = 'default',
}

// Глобальное расширение типа Window для KARAOKE_ANIMATION_MODE
declare global {
	interface Window {
		KARAOKE_ANIMATION_MODE?: ANIMATION_MODE;
	}
}

export interface CameraTarget {
	position: [number, number, number];
	rotation: [number, number, number];
	fov: number;
}