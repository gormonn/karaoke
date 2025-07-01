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

// CSS стили для SplitText элементов
const splitTextStyles = `
  .split-line {
    display: block;
    position: relative;
  }
  
  .split-word {
    display: inline-block;
    position: relative;
  }
  
  .split-char {
    display: inline-block;
    position: relative;
    transition: all 0.3s ease;
  }
  
  .line-container {
    font-kerning: none;
    -webkit-text-rendering: optimizeSpeed;
    text-rendering: optimizeSpeed;
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
  }
  
  /* Стили для автоматической разбивки из paragraph */
  .auto-line {
    display: block;
    position: relative;
    margin-bottom: 0.2em;
  }
  
  .auto-word {
    display: inline-block;
    position: relative;
    margin-right: 0.1em;
  }
  
  .auto-char {
    display: inline-block;
    position: relative;
    transition: all 0.2s ease-out;
  }
  
  .paragraph-container {
    font-kerning: none;
    -webkit-text-rendering: optimizeSpeed;
    text-rendering: optimizeSpeed;
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
  }
`;

// Инжектируем стили если их еще нет
if (typeof document !== 'undefined' && !document.getElementById('split-text-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'split-text-styles';
  styleSheet.textContent = splitTextStyles;
  document.head.appendChild(styleSheet);
}

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

// Новый улучшенный компонент для строки с GSAP SplitText
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

	// Создаем SplitText для целой строки с улучшенными настройками
	useEffect(() => {
		if (lineRef.current && !splitRef.current && fullLineText) {
			splitRef.current = new SplitText(lineRef.current, {
				type: "lines,words,chars",
				linesClass: "split-line",
				wordsClass: "split-word", 
				charsClass: "split-char",
				reduceWhiteSpace: false,
				// Используем absolute для лучшей производительности анимации
				position: "absolute"
			});

			// Логирование для отладки
			console.log('SplitText created for line:', lineIndex, {
				lines: splitRef.current.lines?.length || 0,
				words: splitRef.current.words?.length || 0,
				chars: splitRef.current.chars?.length || 0
			});
		}
		
		return () => {
			if (splitRef.current) {
				splitRef.current.revert();
				splitRef.current = null;
			}
		};
	}, [fullLineText, lineIndex]);

	// 🎵 Анимируем символы строки по временным меткам с улучшенной производительностью
	useEffect(() => {
		if (!splitRef.current || !charTimingMap.length) return;

		// Используем более эффективный подход к анимации
		splitRef.current.chars?.forEach((char, charIndex) => {
			const timing = charTimingMap[charIndex];
			if (!timing) return;

			const isActive = timeInSeconds >= timing.start && timeInSeconds <= timing.end;
			const hasWordStarted = timeInSeconds >= timing.start;
			
			// Группируем изменения стилей для лучшей производительности
			const styles: any = {};
			
			if (isActive) {
				// Активное слово - золотой с эффектами
				Object.assign(styles, {
					opacity: 1,
					color: '#FFD700',
					scale: 1.15,
					textShadow: '0 0 15px #FFD700, 0 0 25px #FFD700'
				});
			} else if (hasWordStarted) {
				// Уже пропетое слово - белый, нормальный
				Object.assign(styles, {
					opacity: 1,
					color: '#FFFFFF',
					scale: 1,
					textShadow: 'none'
				});
			} else {
				// Еще не пропетое слово - серый, полупрозрачный
				Object.assign(styles, {
					opacity: 0.4,
					color: '#666666',
					scale: 1,
					textShadow: 'none'
				});
			}

			// Применяем все стили за один вызов
			gsap.set(char, styles);
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
			className="line-container"
			style={{
				fontSize: '3rem',
				lineHeight: lineHeight,
				whiteSpace: 'pre-wrap',
				fontWeight: 'bold',
				// Позиционирование контейнера для absolute элементов
				position: 'relative',
				minHeight: '1em'
			}}
		>
			{fullLineText}
		</div>
	);
};

// 🆕 НОВЫЙ компонент для автоматической разбивки на линии из paragraph
const ParagraphLineComponent: React.FC<{
	segment: Segment;
}> = ({segment}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const timeInSeconds = frame / fps;
	const containerRef = useRef<HTMLDivElement>(null);
	const splitRef = useRef<SplitText | null>(null);
	const [isReady, setIsReady] = useState(false);

	// Создаем SplitText для автоматической разбивки paragraph на линии
	useEffect(() => {
		if (containerRef.current && !splitRef.current && segment.paragraph) {
			// Устанавливаем текст в контейнер
			containerRef.current.textContent = segment.paragraph;
			
			// Создаем SplitText с автоматическим определением линий
			splitRef.current = new SplitText(containerRef.current, {
				type: "lines,words,chars",
				linesClass: "auto-line",
				wordsClass: "auto-word",
				charsClass: "auto-char",
				position: "relative", // Для естественного потока
				// Настройка порога линий для корректного определения
				lineThreshold: 0.2
			});

			console.log('🆕 Auto SplitText created:', {
				lines: splitRef.current.lines?.length || 0,
				words: splitRef.current.words?.length || 0,
				chars: splitRef.current.chars?.length || 0
			});

			setIsReady(true);
		}
		
		return () => {
			if (splitRef.current) {
				splitRef.current.revert();
				splitRef.current = null;
			}
			setIsReady(false);
		};
	}, [segment.paragraph]);

	// Анимируем символы с использованием временных данных из words
	useEffect(() => {
		if (!splitRef.current || !isReady || !segment.words.length) return;

		// Улучшенный алгоритм сопоставления символов с временными метками
		const createAdvancedCharTimingMap = () => {
			// Создаем текст из всех слов для сопоставления
			let fullWordsText = '';
			const wordTimings: Array<{ start: number; end: number; startIndex: number; endIndex: number }> = [];
			
			segment.words.forEach(word => {
				const cleanWord = word.word.replace(/^\n+/, ''); // Убираем переносы в начале
				const startIndex = fullWordsText.length;
				fullWordsText += cleanWord;
				const endIndex = fullWordsText.length - 1;
				
				if (cleanWord.trim()) {
					wordTimings.push({
						start: word.start,
						end: word.end,
						startIndex,
						endIndex
					});
				}
			});

			// Создаем полный текст из paragraph для сопоставления
			const paragraphText = segment.paragraph.replace(/\n/g, ' ');
			
			// Находим соответствие между paragraph и words
			const charTimingMap = new Map<number, { start: number; end: number }>();
			
			// Простое сопоставление по позиции (можно улучшить)
			let wordsIndex = 0;
			let paragraphIndex = 0;
			
			while (paragraphIndex < paragraphText.length && wordsIndex < wordTimings.length) {
				const timing = wordTimings[wordsIndex];
				const wordLength = timing.endIndex - timing.startIndex + 1;
				
				// Присваиваем временные метки символам
				for (let i = 0; i < wordLength && paragraphIndex < paragraphText.length; i++) {
					charTimingMap.set(paragraphIndex, {
						start: timing.start,
						end: timing.end
					});
					paragraphIndex++;
				}
				
				// Пропускаем пробелы в paragraph
				while (paragraphIndex < paragraphText.length && paragraphText[paragraphIndex] === ' ') {
					paragraphIndex++;
				}
				
				wordsIndex++;
			}
			
			return charTimingMap;
		};

		const charTimingMap = createAdvancedCharTimingMap();
		
		// Применяем анимацию к символам
		splitRef.current.chars?.forEach((char, charIndex) => {
			const timing = charTimingMap.get(charIndex);
			if (!timing) return;

			const isActive = timeInSeconds >= timing.start && timeInSeconds <= timing.end;
			const hasStarted = timeInSeconds >= timing.start;
			
			const styles: any = {};
			
			if (isActive) {
				Object.assign(styles, {
					opacity: 1,
					color: '#FFD700',
					scale: 1.15,
					textShadow: '0 0 15px #FFD700, 0 0 25px #FFD700'
				});
			} else if (hasStarted) {
				Object.assign(styles, {
					opacity: 1,
					color: '#FFFFFF',
					scale: 1,
					textShadow: 'none'
				});
			} else {
				Object.assign(styles, {
					opacity: 0.4,
					color: '#666666',
					scale: 1,
					textShadow: 'none'
				});
			}

			gsap.set(char, styles);
		});
	}, [timeInSeconds, segment.words, segment.paragraph, isReady]);

	if (!segment.paragraph) {
		return null;
	}

	return (
		<div
			ref={containerRef}
			className="paragraph-container"
			style={{
				fontSize: '3rem',
				lineHeight: lineHeight,
				fontWeight: 'bold',
				position: 'relative',
				whiteSpace: 'pre-wrap'
			}}
		>
			{/* Контент устанавливается через textContent в useEffect */}
		</div>
	);
};

const InnerComponent: React.FC<{
	segment: Segment;
	useAutoLines?: boolean; // 🆕 Новый параметр для выбора режима
}> = ({segment, useAutoLines = false}) => {
	// Проверяем, есть ли структура строк в сегменте
	const hasLines = segment.lines && segment.lines.length > 0;
	const hasParagraph = segment.paragraph && segment.paragraph.trim() !== '';

	return (
		<AbsoluteFill
			style={{
				fontWeight: 'bold',
				lineHeight,
				padding,
			}}
		>
			{useAutoLines && hasParagraph ? (
				// 🆕 НОВЫЙ режим: автоматическая разбивка на линии из paragraph
				<ParagraphLineComponent segment={segment} />
			) : hasLines ? (
				// Существующий подход: ручные строки с картой символов
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
	useAutoLines?: boolean; // 🆕 Параметр для включения автоматической разбивки на линии
}> = ({segment, useAutoLines = false}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const timeInSeconds = frame / fps;
	const {start, end} = segment;

	if (timeInSeconds < start || timeInSeconds > end) {
		return null;
	}

	return <InnerComponent segment={segment} useAutoLines={useAutoLines} />;
};
