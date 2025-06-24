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

// Импортируем настроенный GSAP из библиотеки
import { gsap, SplitText } from './lib/gsap';

// Функция для создания карты символов со временными метками для целой строки
const createLineCharMap = (words: Word[]) => {
	const filteredWords = words.filter(word => word.word && word.word.trim() !== '');
	
	let fullLineText = '';
	const charTimingMap: Array<{
		char: string;
		start: number;
		end: number;
		wordPart: Word;
	}> = [];

	filteredWords.forEach((wordPart, wordIndex) => {
		const cleanedWord = wordPart.word.replace(/^\n/, '');
		
		// Добавляем символы слова
		for (let i = 0; i < cleanedWord.length; i++) {
			const char = cleanedWord[i];
			fullLineText += char;
			
			if(char !== ' ') {
				charTimingMap.push({
					char,
					start: wordPart.start,
					end: wordPart.end,
					wordPart
				});
			}
		}
	});

	const result = { fullLineText, charTimingMap };
	if(fullLineText.length > 0) {
		console.log('createLineCharMap',{words,...result});
	}
	return result;
};

// Новый компонент для строки с GSAP SplitText на целой строке
const LineComponent: React.FC<{
	words: Word[];
	lineIndex: number;
}> = ({words, lineIndex}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const timeInSeconds = frame / fps;
	const lineRef = useRef<HTMLDivElement>(null);
	const splitRef = useRef<SplitText | null>(null);

	// Создаем карту символов для целой строки
	const { fullLineText, charTimingMap } = useMemo(() => 
		createLineCharMap(words), [words]
	);

	// Создаем SplitText для целой строки
	useEffect(() => {
		if (lineRef.current && !splitRef.current && fullLineText) {
			splitRef.current = new SplitText(lineRef.current, {
				type: "chars",
				charsClass: "char",
				reduceWhiteSpace: false
			});
		}
		
		return () => {
			if (splitRef.current) {
				splitRef.current.revert();
				splitRef.current = null;
			}
		};
	}, [fullLineText]);

	// 🎵 Анимируем символы строки по временным меткам
	useEffect(() => {
		if (!splitRef.current || !charTimingMap.length) return;

		// Группируем символы по словам для правильной анимации
		const wordGroups: { [key: string]: number[] } = {};
		charTimingMap.forEach((timing, charIndex) => {
			const wordKey = `${timing.start}-${timing.end}`;
			if (!wordGroups[wordKey]) {
				wordGroups[wordKey] = [];
			}
			wordGroups[wordKey].push(charIndex);
		});

		splitRef.current.chars.forEach((char, charIndex) => {
			const timing = charTimingMap[charIndex];
			if (!timing) return;

			const isActive = timeInSeconds >= timing.start && timeInSeconds <= timing.end;
			const hasWordStarted = timeInSeconds >= timing.start;
			
			if (isActive) {
				// Активное слово - золотой с эффектами
				gsap.set(char, {
					opacity: 1,
					color: '#FFD700',
					scale: 1.15,
					textShadow: '0 0 15px #FFD700, 0 0 25px #FFD700'
				});
			} else if (hasWordStarted) {
				// Уже пропетое слово - белый, нормальный
				gsap.set(char, {
					opacity: 1,
					color: '#FFFFFF',
					scale: 1,
					textShadow: 'none'
				});
			} else {
				// Еще не пропетое слово - серый, полупрозрачный
				gsap.set(char, {
					opacity: 0.4,
					color: '#666666',
					scale: 1,
					textShadow: 'none'
				});
			}
		});
	}, [timeInSeconds, charTimingMap]);

	// Проверяем, должна ли строка быть видна
	const isLineVisible = charTimingMap.some(timing => timeInSeconds >= timing.start);

	if (!isLineVisible || !fullLineText) {
		return null;
	}

	return (
		<div
			ref={lineRef}
			className="line"
			style={{
				fontSize: '3rem',
				lineHeight: lineHeight,
				whiteSpace: 'pre-wrap',
				fontWeight: 'bold',
			}}
		>
			{fullLineText}
		</div>
	);
};

const InnerComponent: React.FC<{
	segment: Segment;
}> = ({segment}) => {
	// Проверяем, есть ли структура строк в сегменте
	const hasLines = segment.lines && segment.lines.length > 0;

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
					{/* {[(segment?.lines?.[1] || []) as Word[]]?.map((line, lineIndex) => ( */}
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
