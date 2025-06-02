import React, {useCallback, useState, useMemo, useEffect, useRef} from 'react';
import {
	AbsoluteFill,
	Img,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {Dots, LayoutsState, lineHeight, padding} from './Dots';
import {Segment, Word} from './types';
import {WordComponent} from './Word';

// Новый тип для карты символов
interface CharTiming {
	char: string;
	charIndex: number; // Позиция в общем тексте
	wordIndex: number; // Индекс слова в исходном массиве
	start: number;
	end: number;
}

// Функция для создания карты временных меток символов
const createCharTimingMap = (words: Word[]): {
	fullText: string;
	charTimings: CharTiming[];
} => {
	let fullText = '';
	const charTimings: CharTiming[] = [];
	let charIndex = 0;

	words.forEach((word, wordIndex) => {
		// Фильтруем пустые слова
		if (!word.word || word.word.trim() === '') return;

		// Добавляем каждый символ с его временными метками
		for (let i = 0; i < word.word.length; i++) {
			const char = word.word[i];
			fullText += char;

			charTimings.push({
				char,
				charIndex,
				wordIndex,
				start: word.start,
				end: word.end,
			});

			charIndex++;
		}
	});

	return { fullText, charTimings };
};

// Новый компонент для строки с побуквенной анимацией
const LineComponent: React.FC<{
	words: Word[];
	lineIndex: number;
}> = ({words, lineIndex}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const timeInSeconds = frame / fps;

	// Фильтруем пустые слова перед созданием карты
	const filteredWords = words.filter(word => word.word && word.word.trim() !== '');

	// Создаём карту символов
	const {fullText, charTimings} = useMemo(() =>
		createCharTimingMap(filteredWords), [filteredWords]
	);

	// Логирование для отладки
	// useEffect(() => {
	// 	console.log(`Line ${lineIndex}:`, {
	// 		originalWordsCount: words.length,
	// 		filteredWordsCount: filteredWords.length,
	// 		fullText: `"${fullText}"`,
	// 		charCount: charTimings.length,
	// 		timeInSeconds,
	// 		emptyWords: words.filter(w => !w.word || w.word.trim() === '').length
	// 	});
	// }, [fullText, charTimings, lineIndex, timeInSeconds, words.length, filteredWords.length]);

	// Проверяем, должна ли строка быть видна
	const isLineVisible = filteredWords.some(word => timeInSeconds >= word.start);

	if (!isLineVisible || filteredWords.length === 0) {
		// console.log(`Line ${lineIndex} hidden: time=${timeInSeconds}, visible=${isLineVisible}, hasWords=${filteredWords.length > 0}`);
		return null;
	}

	return (
		<div
			className="line"
			style={{
				fontSize: '3rem',
				lineHeight: lineHeight,
				whiteSpace: 'pre-wrap',
				color: 'white', // Убеждаемся что текст виден
			}}
		>
			{fullText}
		</div>
	);
};

const InnerComponent: React.FC<{
	segment: Segment;
}> = ({segment}) => {
	// Проверяем, есть ли структура строк в сегменте
	const hasLines = segment.lines && segment.lines.length > 0;

	// Логирование для отладки
	useEffect(() => {
		console.log('Segment rendering:', {
			hasLines,
			linesCount: segment.lines?.length || 0,
			wordsCount: segment.words.length,
			segmentId: segment.id
		});
	}, [hasLines, segment.lines?.length, segment.words.length, segment.id]);

	return (
		<AbsoluteFill
			style={{
				fontWeight: 'bold',
				lineHeight,
				padding,
			}}
		>
			{hasLines ? (
				// Новый подход: простые строки с картой символов
				<div>
					{segment.lines?.map((line, lineIndex) => (
						<LineComponent
							key={lineIndex}
							words={line}
							lineIndex={lineIndex}
						/>
					))}
				</div>
			) : (
				// Для обратной совместимости - одна строка
				<LineComponent
					words={segment.words}
					lineIndex={0}
				/>
			)}
		</AbsoluteFill>
	);
};

export const SegmentComp: React.FC<{
	segment: Segment;
}> = ({segment}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const timeInSeconds = frame / fps;
	const {start, end} = segment;

	if (timeInSeconds < start || timeInSeconds > end) {
		return null;
	}

	return <InnerComponent segment={segment} />;
};
