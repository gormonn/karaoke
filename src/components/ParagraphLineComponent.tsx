import React, {useMemo, useEffect, useRef} from 'react';
import {MediaUtilsAudioData, useAudioData, visualizeAudio} from '@remotion/media-utils';
import {useCurrentFrame, useVideoConfig} from 'remotion';

import {Segment, ANIMATION_MODE} from '../types';
import {KARAOKE_CONFIG, SONG_TARGET} from '../_config';
import {SplitText, useGsapTimeline, gsap} from '../lib/gsap';
import {updateCharData} from '../stores/char-data'; // Нужно для не-припевных символов
import {
	initializeLetterizeChars,
	createLetterizeAnimation,
	createLetterizeAnimation2,
	createZoomAnimation,
	createDefaultAnimation,
	interpolateCharTimings,
	createZoomInAnimation,
} from './animations';
import { useCharViz } from '../hooks/use-char-viz';

// Расширяем типы для глобального объекта window
declare global {
	interface Window {
		KARAOKE_ANIMATION_MODE?: ANIMATION_MODE;
		KARAOKE_PULSE_TYPE?: string;
	}
}

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
  
  /* Световые градиенты как псевдоэлементы для символов в припеве */
  .chorus-char::before,
  .chorus-char::after {
    content: '';
    position: absolute;
    left: 50%;
    width: 200%;
    // width: 600%;
    height: 100%;
    transform: translateX(-50%);
    background: radial-gradient(ellipse 80% 60% at center, 
      rgba(255, 255, 0, var(--light-intensity, 0)) 0%, 
      rgba(255, 255, 0, calc(var(--light-intensity, 0) * 0.8)) 20%, 
      rgba(255, 255, 0, calc(var(--light-intensity, 0) * 0.4)) 40%, 
      transparent 70%);
    pointer-events: none;
    z-index: -1;
    transition: all 0.1s ease-out;
  }
  
  /* Верхний прожектор */
  .chorus-char::before {
    top: -150%;
    transform: translateX(-50%) perspective(300px) rotateX(60deg);
  }
  
  /* Нижний прожектор */
  .chorus-char::after {
    bottom: -150%;
    transform: translateX(-50%) perspective(300px) rotateX(-60deg);
  }
  
  /* Анимация пульсации в такт drums */
  .chorus-char {
    --drums-intensity: 0;
  }
  
  /* ВАРИАНТ 1: Классическая пульсация с масштабированием и прозрачностью */
  .chorus-char::before {
    opacity: calc(0.6 + var(--drums-intensity, 0) * 0.4);
    transform: translateX(-50%) perspective(300px) rotateX(60deg) scale(calc(1 + var(--drums-intensity, 0) * 0.2));
  }
  
  .chorus-char::after {
    opacity: calc(0.8 + var(--drums-intensity, 0) * 0.2);
    transform: translateX(-50%) perspective(300px) rotateX(-60deg) scale(calc(1 + var(--drums-intensity, 0) * 0.2));
  }
  
  /* ВАРИАНТ 2: Цветовая пульсация с изменением оттенка */
  .chorus-char.pulse-color::before {
    opacity: calc(0.7 + var(--drums-intensity, 0) * 0.3);
    background: radial-gradient(ellipse 80% 60% at center, 
      hsl(calc(60 + var(--drums-intensity, 0) * 30), 100%, 70%) 0%, 
      hsl(calc(60 + var(--drums-intensity, 0) * 30), 100%, 60%) 20%, 
      hsl(calc(60 + var(--drums-intensity, 0) * 30), 100%, 50%) 40%, 
      transparent 70%);
    transform: translateX(-50%) perspective(300px) rotateX(60deg) scale(calc(1 + var(--drums-intensity, 0) * 0.15));
  }
  
  .chorus-char.pulse-color::after {
    opacity: calc(0.8 + var(--drums-intensity, 0) * 0.2);
    background: radial-gradient(ellipse 80% 60% at center, 
      hsl(calc(45 + var(--drums-intensity, 0) * 45), 100%, 65%) 0%, 
      hsl(calc(45 + var(--drums-intensity, 0) * 45), 100%, 55%) 20%, 
      hsl(calc(45 + var(--drums-intensity, 0) * 45), 100%, 45%) 40%, 
      transparent 70%);
    transform: translateX(-50%) perspective(300px) rotateX(-60deg) scale(calc(1 + var(--drums-intensity, 0) * 0.15));
  }
  
  /* ВАРИАНТ 3: Волновая пульсация с размытием */
  .chorus-char.pulse-wave::before {
    opacity: calc(0.5 + var(--drums-intensity, 0) * 0.5);
    filter: blur(calc(1px - var(--drums-intensity, 0) * 1px));
    transform: translateX(-50%) perspective(300px) rotateX(60deg) scale(calc(1 + var(--drums-intensity, 0) * 0.3));
  }
  
  .chorus-char.pulse-wave::after {
    opacity: calc(0.6 + var(--drums-intensity, 0) * 0.4);
    filter: blur(calc(2px - var(--drums-intensity, 0) * 2px));
    transform: translateX(-50%) perspective(300px) rotateX(-60deg) scale(calc(1 + var(--drums-intensity, 0) * 0.3));
  }
  
  /* ВАРИАНТ 4: Энергетическая пульсация с множественными слоями */
  .chorus-char.pulse-energy::before {
    opacity: calc(0.4 + var(--drums-intensity, 0) * 0.6);
    background: radial-gradient(ellipse 80% 60% at center, 
      rgba(255, 255, 0, var(--light-intensity, 0)) 0%, 
      rgba(255, 165, 0, calc(var(--light-intensity, 0) * 0.8)) 15%, 
      rgba(255, 69, 0, calc(var(--light-intensity, 0) * 0.6)) 30%, 
      rgba(255, 0, 0, calc(var(--light-intensity, 0) * 0.4)) 45%, 
      transparent 70%);
    transform: translateX(-50%) perspective(300px) rotateX(60deg) scale(calc(1 + var(--drums-intensity, 0) * 0.4));
  }
  
  .chorus-char.pulse-energy::after {
    opacity: calc(0.5 + var(--drums-intensity, 0) * 0.5);
    background: radial-gradient(ellipse 80% 60% at center, 
      rgba(255, 255, 0, var(--light-intensity, 0)) 0%, 
      rgba(255, 215, 0, calc(var(--light-intensity, 0) * 0.8)) 15%, 
      rgba(255, 140, 0, calc(var(--light-intensity, 0) * 0.6)) 30%, 
      rgba(255, 69, 0, calc(var(--light-intensity, 0) * 0.4)) 45%, 
      transparent 70%);
    transform: translateX(-50%) perspective(300px) rotateX(-60deg) scale(calc(1 + var(--drums-intensity, 0) * 0.4));
  }
  
  /* ВАРИАНТ 5: Минималистичная пульсация с тонкими эффектами */
  .chorus-char.pulse-minimal::before {
    opacity: calc(0.3 + var(--drums-intensity, 0) * 0.7);
    background: radial-gradient(ellipse 60% 40% at center, 
      rgba(255, 255, 255, var(--light-intensity, 0)) 0%, 
      rgba(255, 255, 0, calc(var(--light-intensity, 0) * 0.6)) 50%, 
      transparent 80%);
    transform: translateX(-50%) perspective(300px) rotateX(60deg) scale(calc(1 + var(--drums-intensity, 0) * 0.1));
  }
  
  .chorus-char.pulse-minimal::after {
    opacity: calc(0.4 + var(--drums-intensity, 0) * 0.6);
    background: radial-gradient(ellipse 60% 40% at center, 
      rgba(255, 255, 255, var(--light-intensity, 0)) 0%, 
      rgba(255, 255, 0, calc(var(--light-intensity, 0) * 0.6)) 50%, 
      transparent 80%);
    transform: translateX(-50%) perspective(300px) rotateX(-60deg) scale(calc(1 + var(--drums-intensity, 0) * 0.1));
  }
  
  /* ВАРИАНТ 6: Нейронная пульсация с электрическими эффектами */
  .chorus-char.pulse-neural::before {
    opacity: calc(0.6 + var(--drums-intensity, 0) * 0.4);
    background: radial-gradient(ellipse 80% 60% at center, 
      rgba(0, 255, 255, var(--light-intensity, 0)) 0%, 
      rgba(0, 255, 255, calc(var(--light-intensity, 0) * 0.8)) 20%, 
      rgba(0, 255, 255, calc(var(--light-intensity, 0) * 0.4)) 40%, 
      transparent 70%);
    transform: translateX(-50%) perspective(300px) rotateX(60deg) scale(calc(1 + var(--drums-intensity, 0) * 0.25));
    filter: drop-shadow(0 0 calc(5px * var(--drums-intensity, 0)) rgba(0, 255, 255, 0.8));
  }
  
  .chorus-char.pulse-neural::after {
    opacity: calc(0.7 + var(--drums-intensity, 0) * 0.3);
    background: radial-gradient(ellipse 80% 60% at center, 
      rgba(255, 0, 255, var(--light-intensity, 0)) 0%, 
      rgba(255, 0, 255, calc(var(--light-intensity, 0) * 0.8)) 20%, 
      rgba(255, 0, 255, calc(var(--light-intensity, 0) * 0.4)) 40%, 
      transparent 70%);
    transform: translateX(-50%) perspective(300px) rotateX(-60deg) scale(calc(1 + var(--drums-intensity, 0) * 0.25));
    filter: drop-shadow(0 0 calc(5px * var(--drums-intensity, 0)) rgba(255, 0, 255, 0.8));
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

// Типы для данных о символах


// 🆕 Компонент для автоматической разбивки на линии из paragraph
export const ParagraphLineComponent: React.FC<{
	segment: Segment;
}> = ({segment}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const containerRef2 = useRef<HTMLDivElement>(null);
	const splitRef = useRef<SplitText | null>(null);
	const splitRef2 = useRef<SplitText | null>(null);
	const segmentId = `segment-${segment.id}`; // Используем существующий ID сегмента
 
	useCharViz(splitRef);
	useCharViz(splitRef2);
	
	// ✅ Получаем данные для мерцания в такт drums и bass
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const timeInSeconds = frame / fps;
	let drumsAudio: MediaUtilsAudioData | null = null;
	let bassAudio: MediaUtilsAudioData | null = null;
	try {	
		drumsAudio = useAudioData(SONG_TARGET.stems.drums || '');
		bassAudio = useAudioData(SONG_TARGET.stems.bass || '');
	} catch (error) {}
 
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
	
	// ✅ Функция для установки световых эффектов: CSS переменные для припева, effector стор для остальных
	const updateCharacterLightEffects = React.useCallback(() => {
		if (!splitRef.current?.chars) return;
		
		const chars = splitRef.current.chars;
		const isChorus = segment.metaLines.includes("[Chorus]");
		
		// Вычисляем drums intensity для всех символов
		let drumsIntensity = 0;
		if (drumsAudio) {
			const drumsVisualization = visualizeAudio({
				fps,
				frame,
				audioData: drumsAudio,
				numberOfSamples: 8,
			});
			const drumIntensity = drumsVisualization.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3;
			const drumsNormalized = Math.min(drumIntensity * 5, 1);
			drumsIntensity = Math.pow(drumsNormalized, 0.4);
		}
		
		// Функция для получения типа пульсации (можно настроить через конфиг)
		const getPulseType = () => {
			// Можно добавить в KARAOKE_CONFIG или получать из URL параметров
			// minimal is great когда blur на соседних (строка 487 конфликтует с этим!)
			// energy  тоже прикольно
			// default - норм
			const pulseType = window.KARAOKE_PULSE_TYPE || 'minimal';
			return pulseType;
		};
		
		// Функция для применения класса пульсации
		const applyPulseClass = (element: HTMLElement) => {
			// Убираем все классы пульсации
			element.classList.remove('pulse-color', 'pulse-wave', 'pulse-energy', 'pulse-minimal', 'pulse-neural');
			
			// Добавляем нужный класс
			const pulseType = getPulseType();
			if (pulseType !== 'default') {
				element.classList.add(`pulse-${pulseType}`);
			}
		};
		
		// Для не-припевных символов собираем данные для effector стора
		const nonChorusCharData: Array<{
			xPosition: number;
			yPosition: number;
			isActive: boolean;
			intensity: number;
		}> = [];
		
		// Обновляем каждый символ
		charTimings.forEach((timing: any, timingIndex: number) => {
			const wordMap = wordCharMap[timing.wordId];
			if (wordMap) {
				const charGlobalIndex = wordMap.startCharIndex + timing.charIndexInWord;
				const charElement = chars[charGlobalIndex] as HTMLElement;
				
				if (charElement) {
					// Вычисляем интенсивность для этого символа
					const isActive = timeInSeconds >= timing.start && timeInSeconds <= timing.end;
					const isRecentlyActive = timeInSeconds > timing.end && timeInSeconds <= timing.end + 0.2;
					
					let lightIntensity = 0;
					if (isActive) {
						lightIntensity = 0.8;
					} else if (isRecentlyActive) {
						const timeSinceEnd = timeInSeconds - timing.end;
						lightIntensity = Math.max(0, 0.8 - (timeSinceEnd / 0.2) * 0.8);
					}
					
					if (isChorus) {
						// Для припева - используем CSS переменные
						charElement.classList.add('chorus-char');
						applyPulseClass(charElement);
						charElement.style.setProperty('--light-intensity', lightIntensity.toString());
						charElement.style.setProperty('--drums-intensity', drumsIntensity.toString());
					} else {
						// Для не-припева - убираем класс и собираем данные для effector стора
						charElement.classList.remove('chorus-char');
						return;
						
						// Получаем позицию символа для точного позиционирования
						// const charRect = charElement.getBoundingClientRect();
						// if (charRect.width > 0) {
						// 	const centerX = charRect.left + charRect.width / 2;
						// 	const centerY = charRect.top + charRect.height / 2;
						// 	const xPercent = (centerX / window.innerWidth) * 100;
						// 	const yPercent = (centerY / window.innerHeight) * 100;
							
						// 	const clampedXPercent = Math.min(Math.max(xPercent, 5), 95);
						// 	const clampedYPercent = Math.min(Math.max(yPercent, 5), 95);
							
						// 	nonChorusCharData.push({
						// 		xPosition: clampedXPercent,
						// 		yPosition: clampedYPercent,
						// 		isActive: isActive || isRecentlyActive,
						// 		intensity: lightIntensity
						// 	});
						// }
					}
				}
			}
		});
		
		// Передаем данные для не-припевных символов через effector стор
		if (!isChorus && nonChorusCharData.length > 0) {
			updateCharData(nonChorusCharData as any);
		} else if (isChorus) {
			// Очищаем стор для припева
			updateCharData([] as any);
		}
	}, [charTimings, wordCharMap, timeInSeconds, segment.metaLines, drumsAudio, fps, frame]);
	
	// ✅ Вызываем функцию при каждом изменении времени
	useEffect(() => {
		updateCharacterLightEffects();
	}, [updateCharacterLightEffects]);

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
				case 'zoom-in':{
					createZoomInAnimation(timeline, charElement, timing);
				}break;
				case 'zoom-in-out':{
					createZoomInAnimation(timeline, charElement, timing, true);
				}break;
				case 'default':
					createDefaultAnimation(timeline, charElement, timing);
					break;
			}
		});

		return timeline;
	}, [charTimings, segmentId, wordCharMap, splitRef.current?.chars, splitRef2.current?.chars]);


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
						smartWrap: false
					}
						// ✅ Оптимизация производительности: разбиваем только на lines и chars
					splitRef.current = new SplitText(containerRef.current, splitConfig);
					splitRef2.current = [ANIMATION_MODE.LETTERIZE2, ANIMATION_MODE.ZOOM_IN]
						.includes(currentMode as ANIMATION_MODE)
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

	if (!segment.paragraph) {
		return null;
	}

	return (
		<div
			ref={paragraphAnimationRef}
			className={`paragraph-container ${segmentId}`}
			style={{
				fontSize: KARAOKE_CONFIG.fontSize,
				lineHeight: '100%',
				fontWeight: 'bold',
				position: 'relative',
				// whiteSpace: 'pre-wrap',
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