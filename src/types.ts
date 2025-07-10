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