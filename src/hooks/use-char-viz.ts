
import {MediaUtilsAudioData, useAudioData, visualizeAudio} from '@remotion/media-utils';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import { useEffect } from "react";
import { SONG_TARGET } from "../_config";
import { SONG_SETTINGS } from "../settings/Never_Said"; 
import { useMetaByTime } from './use-meta';
import {SplitText, gsap} from '../lib/gsap';
 


const useIgnoredByMeta = (ignoredBy: string[], currentTimeInSeconds: number) => {
	const currentMetaLine = useMetaByTime(currentTimeInSeconds);
 
	return currentMetaLine ? ignoredBy.includes(currentMetaLine) : null;
}

export const useCharViz = (
	splitRef: React.RefObject<SplitText>,
	ignoredByMetaLines: string[] = SONG_SETTINGS.IGNORE_CHAR_VIZ
) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	let drumsAudio: MediaUtilsAudioData | null = null;
	let bassAudio: MediaUtilsAudioData | null = null;
	try {	
		drumsAudio = useAudioData(SONG_TARGET.stems.drums || '');
		bassAudio = useAudioData(SONG_TARGET.stems.bass || '');
	} catch (error) {}

	const isIgnoredByMeta = useIgnoredByMeta(ignoredByMetaLines, frame / fps);
 
	// ✅ Интерполяция мерцания букв в такт drums и bass
	useEffect(() => {
		if (isIgnoredByMeta || !drumsAudio || !bassAudio || !splitRef.current?.chars) return;

		console.log('?isIgnoredByMeta',isIgnoredByMeta)
		
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
		} else if (brightness > 1.1 || contrast > 1.1) {
			// Применяем одинаковое размытие ко всем символам
			gsap.set(splitRef.current.chars, {
				filter: `brightness(${brightness}) contrast(${contrast})`, 
			});
		} 
		
		
	}, [isIgnoredByMeta, frame, fps, drumsAudio, bassAudio, splitRef.current?.chars]);
}