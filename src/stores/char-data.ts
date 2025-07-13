import { createStore, createEvent } from 'effector';

// Типы для данных о символах
export interface CharData {
	xPosition: number;
	yPosition: number;
	isActive: boolean;
	intensity: number;
}

// Эвент для обновления данных о символах
export const updateCharData = createEvent<CharData[]>();

// Стор для хранения данных о символах
export const $charData = createStore<CharData[]>([])
	.on(updateCharData, (_, charData) => charData); 