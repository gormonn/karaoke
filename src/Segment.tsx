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

// Компонент для одного слова с GSAP анимацией символов
const WordWithGSAP: React.FC<{
	word: Word;
	timeInSeconds: number;
}> = ({ word, timeInSeconds }) => {
	const wordRef = useRef<HTMLSpanElement>(null);
	const splitRef = useRef<SplitText | null>(null);

	// Создаем SplitText для этого слова
	useEffect(() => {
		if (wordRef.current && !splitRef.current && word.word) {
			splitRef.current = new SplitText(wordRef.current, {
				type: "chars",
				charsClass: "char"
			});
		}
		
		return () => {
			if (splitRef.current) {
				splitRef.current.revert();
				splitRef.current = null;
			}
		};
	}, [word.word]);

	// Анимируем символы этого слова
	useEffect(() => {
		if (!splitRef.current || !word.word) return;

		const isActive = timeInSeconds >= word.start && timeInSeconds <= word.end;
		const isVisible = timeInSeconds >= word.start;
		
		if (isActive) {
			// Прогресс внутри слова
			const wordProgress = (timeInSeconds - word.start) / (word.end - word.start);
			
			splitRef.current.chars.forEach((char, charIndex) => {
				const charProgress = Math.max(0, Math.min(1, 
					wordProgress * word.word!.length - charIndex
				));
				
				gsap.set(char, {
					opacity: 1,
					color: charProgress > 0.5 ? '#FFD700' : '#FFFFFF',
					scale: 1 + charProgress * 0.1,
					textShadow: charProgress > 0.5 ? '0 0 10px #FFD700' : 'none'
				});
			});
		} else if (isVisible) {
			// Уже пропетое слово
			splitRef.current.chars.forEach((char) => {
				gsap.set(char, {
					opacity: 0.7,
					color: '#888888',
					scale: 1,
					textShadow: 'none'
				});
			});
		} else {
			// Еще не пропетое слово
			splitRef.current.chars.forEach((char) => {
				gsap.set(char, {
					opacity: 0.3,
					color: '#444444',
					scale: 1,
					textShadow: 'none'
				});
			});
		}
	}, [timeInSeconds, word]);

	if (!word.word || word.word.trim() === '') return null;

	return (
		<span ref={wordRef} style={{ marginRight: '0.3em' }}>
			{word.word}
		</span>
	);
};

// Новый компонент для строки с GSAP SplitText анимацией
const LineComponent: React.FC<{
	words: Word[];
	lineIndex: number;
}> = ({words, lineIndex}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const timeInSeconds = frame / fps;

	// Фильтруем пустые слова
	const filteredWords = words.filter(word => word.word && word.word.trim() !== '');

	// Логирование для отладки
	useEffect(() => {
		console.log(`GSAP Line ${lineIndex}:`, {
			originalWordsCount: words.length,
			filteredWordsCount: filteredWords.length,
			timeInSeconds
		});
	}, [lineIndex, timeInSeconds, words.length, filteredWords.length]);

	// Проверяем, должна ли строка быть видна
	const isLineVisible = filteredWords.some(word => timeInSeconds >= word.start);

	if (!isLineVisible || filteredWords.length === 0) {
		return null;
	}

	return (
		<div
			className="line"
			style={{
				fontSize: '3rem',
				lineHeight: lineHeight,
				whiteSpace: 'pre-wrap',
				fontWeight: 'bold',
			}}
		>
			{filteredWords.map((word, index) => (
				<WordWithGSAP 
					key={`${lineIndex}-${index}`}
					word={word}
					timeInSeconds={timeInSeconds}
				/>
			))}
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
