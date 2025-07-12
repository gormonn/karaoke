import React, {useEffect, useRef} from 'react';
import {MediaUtilsAudioData, useAudioData, visualizeAudio} from '@remotion/media-utils';
import {useCurrentFrame, useVideoConfig, Img} from 'remotion';
import {SONG_TARGET} from '../_config';
import {gsap} from '../lib/gsap';

export const BackgroundComponent: React.FC = () => {
	const backgroundRef = useRef<HTMLDivElement>(null);
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	let synthAudio: MediaUtilsAudioData | null = null;
	try {
		 synthAudio = useAudioData(SONG_TARGET.stems.synth || '');
	} catch (error) {}

	// ✅ Реакция фона на synth
	useEffect(() => {
		if (!synthAudio || !backgroundRef.current) return;

		// Анализируем synth для изменения оттенка
		const synthVisualization = visualizeAudio({
			fps,
			frame,
			audioData: synthAudio,
			numberOfSamples: 8, // Фокус на средних частотах для synth
		});

		// Анализируем средние частоты (индексы 2-5) для synth
		const synthIntensity = synthVisualization.slice(2, 6).reduce((sum, val) => sum + val, 0) / 4;
		
		// Нормализуем значение synth от 0 до 1 и применяем кривую
		const synthNormalized = Math.min(synthIntensity * 2, 1); // Усиливаем в 2 раза
		// Применяем мягкую кривую для плавного изменения оттенка
		const normalizedSynthIntensity = Math.pow(synthNormalized, 0.8);
		
		// Интерполируем оттенок от 0 до 120 градусов (synth)
		const hueRotation = normalizedSynthIntensity * 120; // Диапазон 0-120 градусов

		// Применяем изменение оттенка фона
		gsap.set(backgroundRef.current, {
			filter: `hue-rotate(${hueRotation}deg)`,
		});
		
	}, [frame, fps, synthAudio]);

	return (
		<div ref={backgroundRef} style={{width: '100%', height: '100%'}}>
			<Img src={SONG_TARGET.background} style={{width: '100%', height: '100%'}} />
		</div>
	);
}; 