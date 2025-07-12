import React, {useMemo, useEffect, useRef} from 'react';
import {MediaUtilsAudioData, useAudioData, visualizeAudio} from '@remotion/media-utils';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {lineHeight} from '../Dots';
import {Segment, ANIMATION_MODE} from '../types';
import {KARAOKE_CONFIG, SONG_TARGET} from '../_config';
import {SplitText, useGsapTimeline, gsap} from '../lib/gsap';
import {
	initializeLetterizeChars,
	createLetterizeAnimation,
	createLetterizeAnimation2,
	createZoomAnimation,
	createDefaultAnimation,
	interpolateCharTimings,
	createZoomInAnimation,
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
	const containerRef2 = useRef<HTMLDivElement>(null);
	const splitRef = useRef<SplitText | null>(null);
	const splitRef2 = useRef<SplitText | null>(null);
	const segmentId = `segment-${segment.id}`; // Используем существующий ID сегмента
 
	// ✅ Получаем данные для мерцания в такт drums и bass
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	let drumsAudio: MediaUtilsAudioData | null = null;
	let bassAudio: MediaUtilsAudioData | null = null;
	try {	
		drumsAudio = useAudioData(SONG_TARGET.stems.drums || '');
		bassAudio = useAudioData(SONG_TARGET.stems.bass || '');
	} catch (error) {}
 
	// ✅ Создаем SplitText для автоматической разбивки согласно документации
	useEffect(() => {
		if (containerRef.current && containerRef2.current &&
			!splitRef.current && !splitRef2.current && segment.paragraph) {
			const currentMode = window.KARAOKE_ANIMATION_MODE || KARAOKE_CONFIG.animationMode;

			// ✅ Согласно документации: элемент должен быть отображен так, как нужно в конце анимации
			containerRef.current.innerHTML = segment.paragraph.replace(
				/\n/g,
				'<br />'
			);
			containerRef2.current.innerHTML = currentMode === ANIMATION_MODE.LETTERIZE2
				? containerRef.current.innerHTML
				: '';

			const applySplit = () => {
				if (!splitRef.current && containerRef.current
					&& !splitRef2.current && containerRef2.current
				) {
					const splitConfig = {
						type: 'lines,chars', // Только то, что нужно для караоке
						linesClass: `auto-line-${segment.id}`,
						charsClass: `auto-char-${segment.id}`, // ✅ Уникальный класс для каждого сегмента
						position: 'relative', // Естественный поток
						lineThreshold: 0.2, // Порог для определения линий
					}
						// ✅ Оптимизация производительности: разбиваем только на lines и chars
					splitRef.current = new SplitText(containerRef.current, splitConfig);
					splitRef2.current = currentMode === ANIMATION_MODE.LETTERIZE2 
						? new SplitText(containerRef2.current, splitConfig)
						: null;

					// ✅ Сразу инициализируем все символы в зависимости от режима
					if (splitRef.current.chars && splitRef2?.current?.chars) {
						initializeLetterizeChars(splitRef.current.chars, splitRef2.current.chars);
					}else if (splitRef.current.chars) {
						initializeLetterizeChars(splitRef.current.chars);
					} 
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
			if (splitRef2.current) {
				splitRef2.current.revert();
				splitRef2.current = null;
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
		if (!charTimings.length || !splitRef.current?.chars) return gsap.timeline();

		const timeline = gsap.timeline();
		const chars = splitRef.current.chars;
		
		// Символы уже инициализированы в useEffect, создаем только анимацию
		// Создаем анимацию для каждого символа в зависимости от режима
		charTimings.forEach((timing, timingIndex, timingsArray) => {
			const wordMap = wordCharMap[timing.wordId];
			if (!wordMap) return;

			// ✅ Прямая ссылка на DOM элемент символа
			const charGlobalIndex = wordMap.startCharIndex + timing.charIndexInWord;
			const charElement = chars[charGlobalIndex];

			if (!charElement) return;

			// Используем соответствующую анимацию в зависимости от режима
			const currentMode = window.KARAOKE_ANIMATION_MODE || KARAOKE_CONFIG.animationMode;

			// const futureTiming = timingsArray?.[timingIndex + 50];
			switch (currentMode) {
				case 'letterize':
					createLetterizeAnimation(timeline, charElement,  timing);
					break;
				case 'letterize2':{
					if(!splitRef2.current) return;
					const chars2 = splitRef2.current.chars;
					const charElement2 = chars2[charGlobalIndex];
					createLetterizeAnimation2(timeline, [charElement, charElement2], timing);
					}break;
				case 'zoom':
					createZoomAnimation(timeline, charElement, timing, timingsArray, timingIndex);
					break;
				case 'zoom-in':
					createZoomInAnimation(timeline, charElement, timing);
					break;
				case 'default':
					createDefaultAnimation(timeline, charElement, timing);
					break;
			}
		});

		return timeline;
	}, [charTimings, segmentId, wordCharMap, splitRef.current?.chars, splitRef2.current?.chars]);

	// ✅ Интерполяция мерцания букв в такт drums и bass
	useEffect(() => {
		if (!drumsAudio || !bassAudio || !splitRef.current?.chars) return;

		// Анализируем drums для обводки, яркости, размытия
		const drumsVisualization = visualizeAudio({
			fps,
			frame,
			audioData: drumsAudio,
			numberOfSamples: 8, // Фокус на низких частотах для drums
		});

		// Анализируем bass для дрожания
		const bassVisualization = visualizeAudio({
			fps,
			frame,
			audioData: bassAudio,
			numberOfSamples: 8, // Фокус на низких частотах для bass
		});

		// Анализируем низкие частоты (индексы 0-2) для drums
		const drumIntensity = drumsVisualization.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3;
		
		// Анализируем низкие частоты (индексы 0-2) для bass
		const bassIntensity = bassVisualization.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3;
		
		// Интерполируем значения на основе интенсивности drums
		// Нормализуем значение от 0 до 1 и применяем кривую для большей чувствительности
		const drumsNormalized = Math.min(drumIntensity * 3, 1); // Усиливаем в 3 раза
		// Применяем корень для того, чтобы небольшие значения давали больший эффект
		const normalizedDrumsIntensity = Math.pow(drumsNormalized, 0.6);
		
		// Нормализуем значение bass от 0 до 1 и применяем кривую
		const bassNormalized = Math.min(bassIntensity * 3, 1); // Усиливаем в 3 раза
		// Применяем кубическую кривую для более резкой реакции
		const normalizedBassIntensity = Math.pow(bassNormalized, 2.5);
		
		// Интерполируем яркость от 1.0 до 2.0 (drums)
		const brightness = 1 + normalizedDrumsIntensity * 1.0;
		
		// Интерполируем контрастность от 1.0 до 1.5 (drums)
		const contrast = 1 + normalizedDrumsIntensity * 0.5;
		
		// Интенсивность blur-тряски от bass
		const blurShakeIntensity = normalizedBassIntensity * 1.5;
		 
		
		// Применяем blur-тряску индивидуально к каждому символу
		if (blurShakeIntensity > 0.1) {
			// Когда bass активен - drums повышает резкость (уменьшает blur)
			// Базовое размытие 1.5px, drums уменьшает его до 0px
			const baseBlur = 1 - (normalizedDrumsIntensity * 2);
			
			splitRef.current.chars.forEach((char: Element) => {
				// Случайное размытие для каждого символа (создает эффект тряски)
				const randomBlur = Math.max(0, baseBlur + (Math.random() * blurShakeIntensity));
				
				gsap.set(char, {
					filter: `brightness(${brightness}) contrast(${contrast}) blur(${randomBlur}px)`,
				});
			});
		} else {
			// Применяем одинаковое размытие ко всем символам
			gsap.set(splitRef.current.chars, {
				filter: `brightness(${brightness}) contrast(${contrast})`, 
			});
		} 
		
		
	}, [frame, fps, drumsAudio, bassAudio, splitRef.current?.chars]);

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
			<div ref={containerRef} >
				{/* ✅ Контент устанавливается через innerHTML в useEffect */}
			</div>
			<div ref={containerRef2} style={{position	: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1}}>
				{/* ✅ Контент устанавливается через innerHTML в useEffect */}
			</div>
		</div>
	);
}; 