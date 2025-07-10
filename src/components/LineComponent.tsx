import React, {useMemo, useEffect, useRef} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {lineHeight} from '../Dots';
import {Word, CharTiming} from '../types';
import {KARAOKE_CONFIG} from '../_config';
import {SplitText, useGsapTimeline, gsap} from '../lib/gsap';
import {
	initializeLetterizeChars,
	createLetterizeAnimation,
	createDefaultAnimation,
	interpolateCharTimings
} from './animations';

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

	// ✅ Используем общую функцию интерполяции
	const charTimingMap = interpolateCharTimings(filteredWords);
	
	// Собираем полный текст строки
	const fullLineText = filteredWords.map(word => word.word.replace(/^\n/, '')).join('');

	const result = {fullLineText, charTimingMap};
	if (fullLineText.length > 0) {
		console.log('createLineCharMap', {words, ...result});
	}
	return result;
};

// Улучшенный компонент для строки с GSAP SplitText
export const LineComponent: React.FC<{
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
						charsClass: `split-char-line-${lineIndex}`, // ✅ Уникальный класс для каждой линии
						reduceWhiteSpace: false,
						position: 'relative', // Естественный поток
					});

					// ✅ Сразу инициализируем все символы в зависимости от режима
					if (splitRef.current.chars) {
						initializeLetterizeChars(splitRef.current.chars);
					}

					// Логирование для отладки
					console.log('SplitText created for line:', lineIndex, {
						chars: splitRef.current.chars?.length || 0,
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

	// 🎵 Синхронизируем GSAP анимации с Remotion timeline
	const animationRef = useGsapTimeline(() => {
		console.log('! animationRef');
		if (!charTimingMap.length) return gsap.timeline();

		const timeline = gsap.timeline();
		const lineId = `line-${lineIndex}`;
		
		// Символы уже инициализированы в useEffect, создаем только анимацию
		const uniqueCharClass = `split-char-line-${lineIndex}`;

		// Создаем анимацию для каждого символа в зависимости от режима
		charTimingMap.forEach((timing, charIndex, array) => {
			const charSelector = `.${lineId} .${uniqueCharClass}:nth-child(${charIndex + 1})`;
			console.log('id', charSelector);
			
			// Используем DOM элемент для более точного таргетинга
			const charElement = document.querySelector(charSelector);
			
			if (charElement) {
				const currentMode = (window as any).KARAOKE_ANIMATION_MODE || KARAOKE_CONFIG.animationMode;
				const futureTiming = array?.[charIndex + 10];
				switch (currentMode) {
					case 'letterize':
					case 'zoom':
						createLetterizeAnimation(timeline, charElement, timing, futureTiming);
						break;
					case 'default':
						createDefaultAnimation(timeline, charElement, timing);
						break;
				}
			}
		});

		return timeline;
	}, [charTimingMap, lineIndex]);

	// Проверяем, должна ли строка быть видна
	const isLineVisible = charTimingMap.some(
		(timing) => timeInSeconds >= timing.start
	);

	if (!isLineVisible || !fullLineText) {
		return null;
	}

	return (
		<div
			ref={animationRef}
			className={`line-container line-${lineIndex}`}
			style={{
				fontSize: '2rem',
				lineHeight: lineHeight,
				whiteSpace: 'pre-wrap',
				fontWeight: 'bold',
			}}
		>
			<div ref={lineRef}>
				{fullLineText}
			</div>
		</div>
	);
}; 