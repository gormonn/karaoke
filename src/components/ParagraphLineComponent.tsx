import React, {useMemo, useEffect, useRef} from 'react';
import {lineHeight} from '../Dots';
import {Segment} from '../types';
import {KARAOKE_CONFIG} from '../_config';
import {SplitText, useGsapTimeline, gsap} from '../lib/gsap';
import {
	initializeLetterizeChars,
	createLetterizeAnimation,
	createDefaultAnimation,
	interpolateCharTimings
} from './animations';

// ✅ CSS стили для автоматической разбивки из paragraph
const paragraphStyles = `
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
	!document.getElementById('paragraph-styles')
) {
	const styleSheet = document.createElement('style');
	styleSheet.id = 'paragraph-styles';
	styleSheet.textContent = paragraphStyles;
	document.head.appendChild(styleSheet);
}

// 🆕 Компонент для автоматической разбивки на линии из paragraph
export const ParagraphLineComponent: React.FC<{
	segment: Segment;
}> = ({segment}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const splitRef = useRef<SplitText | null>(null);
	const segmentId = `segment-${segment.id}`; // Используем существующий ID сегмента

	useEffect(() => {
		console.log('ParagraphLineComponent', {segment, interpolateChars: KARAOKE_CONFIG.interpolateChars});
	}, [segment]);

	// ✅ Создаем SplitText для автоматической разбивки согласно документации
	useEffect(() => {
		if (containerRef.current && !splitRef.current && segment.paragraph) {
			// ✅ Согласно документации: элемент должен быть отображен так, как нужно в конце анимации
			containerRef.current.innerHTML = segment.paragraph.replace(
				/\n/g,
				'<br />'
			);

			const applySplit = () => {
				if (!splitRef.current && containerRef.current) {
					// ✅ Оптимизация производительности: разбиваем только на lines и chars
					splitRef.current = new SplitText(containerRef.current, {
						type: 'lines,chars', // Только то, что нужно для караоке
						linesClass: `auto-line-${segment.id}`,
						charsClass: `auto-char-${segment.id}`, // ✅ Уникальный класс для каждого сегмента
						position: 'relative', // Естественный поток
						lineThreshold: 0.2, // Порог для определения линий
					});

					// ✅ Сразу инициализируем все символы в зависимости от режима
					if (splitRef.current.chars) {
						initializeLetterizeChars(splitRef.current.chars);
					}

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
	}, [segment.paragraph, segment.id]);

	// ✅ Используем общую функцию интерполяции
	const charTimings = useMemo(() => {
		if (!segment.words.length) return [];
		return interpolateCharTimings(segment.words);
	}, [segment.words]);

	// ✅ Создаем карту символов для каждого слова
	const wordCharMap = useMemo(() => {
		const map: Record<number, { totalChars: number; startCharIndex: number }> = {};
		let globalCharIndex = 0;

		segment.words.forEach((word) => {
			const cleanWord = word.word.replace(/\n/, '');
			const nonSpaceChars = cleanWord.replace(/ /g, '').length;
			
			map[word.id] = {
				totalChars: nonSpaceChars,
				startCharIndex: globalCharIndex,
			};
			
			globalCharIndex += nonSpaceChars;
		});

		return map;
	}, [segment.words]);

	// ✅ Синхронизируем GSAP анимации с Remotion timeline
	const paragraphAnimationRef = useGsapTimeline(() => {
		console.log('! paragraphAnimationRef');
		if (!charTimings.length || !splitRef.current?.chars) return gsap.timeline();

		const timeline = gsap.timeline();
		const chars = splitRef.current.chars;
		
		// Символы уже инициализированы в useEffect, создаем только анимацию

		// Создаем анимацию для каждого символа в зависимости от режима
		charTimings.forEach((timing, charIndex) => {
			const wordMap = wordCharMap[timing.wordId];
			if (!wordMap) return;

			// ✅ Прямая ссылка на DOM элемент символа
			const charGlobalIndex = wordMap.startCharIndex + timing.charIndexInWord;
			const charElement = chars[charGlobalIndex];
			
			if (!charElement) return;

			// Используем соответствующую анимацию в зависимости от режима
			const currentMode = (window as any).KARAOKE_ANIMATION_MODE || KARAOKE_CONFIG.animationMode;
			if (currentMode === 'letterize') {
				createLetterizeAnimation(timeline, charElement, timing);
			} else {
				createDefaultAnimation(timeline, charElement, timing);
			}
		});

		return timeline;
	}, [charTimings, segmentId, wordCharMap, splitRef.current?.chars]);

	if (!segment.paragraph) {
		return null;
	}

	return (
		<div
			ref={paragraphAnimationRef}
			className={`paragraph-container ${segmentId}`}
			style={{
				fontSize: '2rem',
				lineHeight: lineHeight,
				fontWeight: 'bold',
				position: 'relative',
				whiteSpace: 'pre-wrap',
			}}
		>
			<div ref={containerRef}>
				{/* ✅ Контент устанавливается через innerHTML в useEffect */}
			</div>
		</div>
	);
}; 