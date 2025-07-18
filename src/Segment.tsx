import React, {useMemo, useEffect, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {lineHeight, padding} from './Dots';
import {Segment, Word} from './types';
import {KARAOKE_CONFIG} from './_config';
import {countVisualChars} from './lib/text-utils';

// Импортируем настроенный GSAP из библиотеки
import {gsap, SplitText} from './lib/gsap';

// ✅ CSS стили для SplitText элементов (согласно документации GSAP)
const splitTextStyles = `
  /* Стили для символов (основная анимация караоке) */
  .split-char {
    display: inline-block;
    position: relative;
    transition: all 0.15s ease-out;
  }
  
  /* Контейнер строки с оптимизациями для Safari */
  .line-container {
    font-kerning: none;
    -webkit-text-rendering: optimizeSpeed;
    text-rendering: optimizeSpeed;
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
    position: relative;
  }
  
  /* Стили для автоматической разбивки из paragraph */
  .auto-line {
    display: block;
    position: relative;
    margin-bottom: 0.1em;
  }
  
  .auto-char {
    display: inline-block;
    position: relative;
    transition: all 0.15s ease-out;
  }
  
  /* Контейнер paragraph с оптимизациями Safari */
  .paragraph-container {
    font-kerning: none;
    -webkit-text-rendering: optimizeSpeed;
    text-rendering: optimizeSpeed;
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
    position: relative;
  }
`;

// Инжектируем стили если их еще нет
if (
	typeof document !== 'undefined' &&
	!document.getElementById('split-text-styles')
) {
	const styleSheet = document.createElement('style');
	styleSheet.id = 'split-text-styles';
	styleSheet.textContent = splitTextStyles;
	document.head.appendChild(styleSheet);
}

// Функция для создания карты символов со временными метками для целой строки
const createLineCharMap = (words: Word[]) => {
	const filteredWords = words.filter(
		(word) => word.word && word.word.trim() !== ''
	);

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

			if (char !== ' ') {
				charTimingMap.push({
					char,
					start: wordPart.start,
					end: wordPart.end,
					wordPart,
				});
			}
		}
	});

	const result = {fullLineText, charTimingMap}; 
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
	const {fullLineText, charTimingMap} = useMemo(
		() => createLineCharMap(words),
		[words]
	);

	// ✅ Создаем SplitText согласно лучшим практикам GSAP
	useEffect(() => {
		if (lineRef.current && !splitRef.current && fullLineText) {
			// ✅ Обеспечиваем загрузку шрифтов перед split (согласно документации)
			const applySplit = () => {
				if (!splitRef.current && lineRef.current) {
					splitRef.current = new SplitText(lineRef.current, {
						type: 'chars', // Только символы для караоке анимации
						charsClass: 'split-char',
						reduceWhiteSpace: false,
						position: 'relative', // Естественный поток
					});
				}
			};

			// Проверяем загруженность шрифтов
			if (document.fonts && document.fonts.ready) {
				document.fonts.ready.then(applySplit);
			} else {
				// Fallback для старых браузеров
				setTimeout(applySplit, 100);
			}
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

			const isActive =
				timeInSeconds >= timing.start && timeInSeconds <= timing.end;
			const hasWordStarted = timeInSeconds >= timing.start;

			// Группируем изменения стилей для лучшей производительности
			const styles: any = {};

			if (isActive) {
				// Активное слово - золотой с эффектами
				Object.assign(styles, {
					opacity: 1,
					color: '#FFD700',
					scale: 1.15,
					textShadow: '0 0 15px #FFD700, 0 0 25px #FFD700',
				});
			} else if (hasWordStarted) {
				// Уже пропетое слово - белый, нормальный
				Object.assign(styles, {
					opacity: 1,
					color: '#FFFFFF',
					scale: 1,
					textShadow: 'none',
				});
			} else {
				// Еще не пропетое слово - серый, полупрозрачный
				Object.assign(styles, {
					opacity: 0.4,
					color: '#666666',
					scale: 1,
					textShadow: 'none',
				});
			}

			// Применяем все стили за один вызов
			gsap.set(char, styles);
		});
	}, [timeInSeconds, charTimingMap]);

	// Проверяем, должна ли строка быть видна
	const isLineVisible = charTimingMap.some(
		(timing) => timeInSeconds >= timing.start
	);

	if (!isLineVisible || !fullLineText) {
		return null;
	}

	return (
		<div
			ref={lineRef}
			className="line-container"
			style={{
				fontSize: KARAOKE_CONFIG.fontSize,
				lineHeight: lineHeight,
				whiteSpace: 'pre-wrap',
				fontWeight: 'bold',
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

	// ✅ Создаем SplitText для автоматической разбивки согласно документации
	useEffect(() => {
		if (containerRef.current && !splitRef.current && segment.paragraph && segment.text.length > 0) {
			// ✅ Согласно документации: элемент должен быть отображен так, как нужно в конце анимации
			// containerRef.current.innerHTML = segment.paragraph.replace(
			// 	/\n/g,
			// 	'<br />'
			// );
			containerRef.current.innerHTML = segment.text.join(
				'<br />'
			);

			const applySplit = () => {
				if (!splitRef.current && containerRef.current) {
					// ✅ Оптимизация производительности: разбиваем только на lines и chars
					splitRef.current = new SplitText(containerRef.current, {
						type: 'lines,chars', // Только то, что нужно для караоке
						linesClass: 'auto-line',
						charsClass: 'auto-char',
						position: 'relative', // Естественный поток
						lineThreshold: 0.2, // Порог для определения линий
					});

					console.log('🆕 Auto SplitText created:', {
						lines: splitRef.current.lines?.length || 0,
						chars: splitRef.current.chars?.length || 0,
					});
				}
			};

			// ✅ Проверяем загруженность шрифтов
			if (document.fonts && document.fonts.ready) {
				document.fonts.ready.then(applySplit);
			} else {
				// Fallback для старых браузеров
				setTimeout(applySplit, 100);
			}
		}

		return () => {
			if (splitRef.current) {
				splitRef.current.revert();
				splitRef.current = null;
			}
		};
	}, [segment.paragraph, segment.text]);

	// ✅ Оптимизированный алгоритм с мемоизацией карты символов
	const charTimings = useMemo(() => {
		if (!segment.words.length) return [];

		const timings: Array<{
			start: number;
			end: number;
			char: string;
			word: string;
		}> = [];

		segment.words.forEach((word) => {
			// const cleanWord = word.word.replace(/^\n+/, '').replace(/\n+$/, '');
			const cleanWord = word.word.replace(/\n/, ''); //.replace(/\n+$/, '');

			for (let i = 0; i < cleanWord.length; i++) {
				if (cleanWord[i] !== ' ') {
					timings.push({
						start: word.start,
						end: word.end,
						char: cleanWord[i],
						word: word.word,
					});
				}
			}
		});

		return timings;
	}, [segment.words]);

	// ✅ Отслеживаем предыдущие состояния символов для оптимизации
	const prevCharStatesRef = useRef<Array<'inactive' | 'active' | 'completed'>>(
		[]
	);

	// ✅ Оптимизированный эффект анимации - применяется только при изменении состояний символов
	useEffect(() => {
		console.time('charTimings');
		if (!splitRef.current || !charTimings.length) return;

		// ✅ Ранний выход: если ни один символ еще не должен быть видимым
		if (!charTimings.some((timing) => timeInSeconds >= timing.start)) {
			return;
		}

		// Вычисляем новые состояния символов
		const newCharStates = charTimings.map((timing) => {
			const isActive =
				timeInSeconds >= timing.start && timeInSeconds <= timing.end;
			const hasStarted = timeInSeconds >= timing.start;

			if (isActive) return 'active';
			if (hasStarted) return 'completed';
			return 'inactive';
		}) as Array<'inactive' | 'active' | 'completed'>;

		// ✅ Проверяем, есть ли изменения в состояниях с помощью some
		const hasChanges = newCharStates.some(
			(state, index) => state !== prevCharStatesRef.current[index]
		);

		// Если нет изменений, не применяем анимацию
		if (!hasChanges) return;

		// Применяем анимацию только к символам, состояние которых изменилось
		splitRef.current.chars?.forEach((char, charIndex) => {
			const newState = newCharStates[charIndex];
			const prevState = prevCharStatesRef.current[charIndex];

			// Пропускаем символы без изменений состояния
			if (newState === prevState) return;

			const styles: any = {};

			switch (newState) {
				case 'active':
					Object.assign(styles, {
						opacity: 1,
						color: '#FFD700',
						scale: 1.15,
						textShadow: '0 0 15px #FFD700, 0 0 25px #FFD700',
					});
					break;
				case 'completed':
					Object.assign(styles, {
						opacity: 1,
						color: '#FFFFFF',
						scale: 1,
						textShadow: 'none',
					});
					break;
				case 'inactive':
				default:
					Object.assign(styles, {
						opacity: 0.4,
						color: '#666666',
						scale: 1,
						textShadow: 'none',
					});
					break;
			}

			gsap.set(char, styles);
		});

		// Сохраняем новые состояния для следующего сравнения
		prevCharStatesRef.current = newCharStates;
		console.timeEnd('charTimings');
	}, [timeInSeconds, charTimings]);

	if (!segment.paragraph) {
		return null;
	}

	return (
		<div
			ref={containerRef}
			className="paragraph-container"
			style={{
				fontSize: KARAOKE_CONFIG.fontSize,
				lineHeight: lineHeight,
				fontWeight: 'bold',
				position: 'relative',
				whiteSpace: 'pre-wrap',
			}}
		>
			{/* ✅ Контент устанавливается через innerHTML в useEffect */}
		</div>
	);
};

const InnerComponent: React.FC<{
	segment: Segment;
	useAutoLines?: boolean; // 🆕 Новый параметр для выбора режима
	verticalAlign?: 'top' | 'center' | 'bottom'; // 🆕 Новый параметр для вертикального выравнивания
}> = ({segment, useAutoLines = false, verticalAlign = 'center'}) => {
	const {height} = useVideoConfig(); // Получаем высоту экрана для выравнивания
	
	// Проверяем, есть ли структура строк в сегменте
	const hasLines = segment.lines && segment.lines.length > 0;
	const hasParagraph = segment.paragraph && segment.paragraph.trim() !== '';

	// 🆕 Вычисляем количество строк для вертикального выравнивания
	const getLineCount = () => {
		if (useAutoLines && hasParagraph) {
			// Для автоматической разбивки считаем более точное количество строк
			const {width} = useVideoConfig();
			// Извлекаем числовое значение из fontSize (например, "6rem" -> 6)
			const fontSizeRem = parseFloat(KARAOKE_CONFIG.fontSize);
			const fontSizePx = fontSizeRem * 16; // Конвертируем rem в px
			const avgCharWidth = fontSizePx * 0.6; // Примерная ширина символа
			const availableWidth = width - padding * 2;
			const charsPerLine = Math.floor(availableWidth / avgCharWidth);
			
			// Считаем общее количество символов в text
			const totalChars = segment.text?.join('') ? countVisualChars(segment.text.join('')) : 0;
			return Math.ceil(totalChars / charsPerLine);
		} else if (hasLines) {
			return segment.lines?.length || 0;
		} else {
			return 1; // Одна строка
		}
	};

	const lineCount = getLineCount();
	
	// 🆕 Вычисляем стили выравнивания в зависимости от verticalAlign
	const getAlignmentStyles = () => {
		switch (verticalAlign) {
			case 'top':
				return {
					display: 'flex' as const,
					flexDirection: 'column' as const,
					justifyContent: 'flex-start' as const,
					alignItems: 'center' as const,
				};
			case 'bottom':
				return {
					display: 'flex' as const,
					flexDirection: 'column' as const,
					justifyContent: 'flex-end' as const,
					alignItems: 'center' as const,
				};
			case 'center':
			default:
				return {
					display: 'flex' as const,
					flexDirection: 'column' as const,
					justifyContent: 'center' as const,
					alignItems: 'center' as const,
				};
		}
	};

	const alignmentStyles = getAlignmentStyles();

	return (
		<AbsoluteFill
			style={{
				fontWeight: 'bold',
				lineHeight,
				padding: `${padding}px`, // 🆕 Упрощенный padding
				...alignmentStyles, // 🆕 Применяем стили выравнивания
			}}
		>
			{useAutoLines && hasParagraph ? (
				// 🆕 НОВЫЙ режим: автоматическая разбивка на линии из paragraph
				<ParagraphLineComponent segment={segment} />
			) : hasLines ? (
				// Существующий подход: ручные строки с картой символов
				<div>
					{segment.lines?.map((line, lineIndex) => (
						<LineComponent key={lineIndex} words={line} lineIndex={lineIndex} />
					))}
				</div>
			) : (
				// Для обратной совместимости - одна строка
				<LineComponent words={segment.words} lineIndex={0} />
			)}
		</AbsoluteFill>
	);
};

export const SegmentComp: React.FC<{
	segment: Segment;
	useAutoLines?: boolean; // 🆕 Параметр для включения автоматической разбивки на линии
	verticalAlign?: 'top' | 'center' | 'bottom'; // 🆕 Параметр для вертикального выравнивания
}> = ({segment, useAutoLines = false, verticalAlign = 'center'}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const timeInSeconds = frame / fps;
	const {start, end} = segment;

	if (timeInSeconds < start || timeInSeconds > end) {
		return null;
	}

	return <InnerComponent segment={segment} useAutoLines={useAutoLines} verticalAlign={verticalAlign} />;
};
