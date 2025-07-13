// import {Img} from 'remotion'; // Не используется 
import React, {FC, useEffect, useRef} from 'react';	
import {Audio, AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {MediaUtilsAudioData, useAudioData, visualizeAudio} from '@remotion/media-utils'; 
import {useMusic} from './context/music';
import {SubtitlesProvider} from './context/subtitles';
import {Bottom} from './Bottom';
import {fontSize} from './Dots';
import {Subtitles} from './Subtitles';
import {KARAOKE_CONFIG, SONG_TARGET} from './_config';
import {ConfigContext, ConfigProps} from './hooks/use-config';		
import {ANIMATION_MODE} from './types';
import {BackgroundComponent} from './components/BackgroundComponent';
import {LightGradient} from './components/LightGradient';
import {loadFont} from '@remotion/google-fonts/Cinzel';
import {gsap} from './lib/gsap'; 

const {fontFamily} = loadFont(); // "Titan One"

const AudioComp = () => {
	const music = useMusic();
	return <Audio src={music} />;
};


export const MyComposition:FC<ConfigProps> = (props) => { 
	const {transparent} = props;
	const backgroundRef = useRef<HTMLDivElement>(null);
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
 
	
	let drumsAudio: MediaUtilsAudioData | null = null;
	try {
		 drumsAudio = useAudioData(SONG_TARGET.stems.drums || '');
	} catch (error) {}

	// 🆕 Флаг для тестирования нового режима автоматической разбивки на линии
	const USE_AUTO_LINES = true; // Переключите на false для старого режима
	
	
	// todo: move to props
	// 🆕 Новый флаг для выбора режима анимации
	const _ANIMATION_MODE: ANIMATION_MODE  = ANIMATION_MODE.ZOOM_IN_OUT  ; // Используем новый режим анимации из Word.tsx

	// Вычисляем интенсивность drums для анимации градиентов
	let drumsAnimationIntensity = 0;
	if (drumsAudio) {
		const drumsVisualization = visualizeAudio({
			fps,
			frame,
			audioData: drumsAudio,
			numberOfSamples: 8, // Фокус на низких частотах для drums
		});

		// Анализируем низкие частоты (индексы 0-2) для drums
		const drumIntensity = drumsVisualization.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3;
		
		// Интерполируем значения на основе интенсивности drums
		// Нормализуем значение от 0 до 1 и применяем кривую для большей чувствительности
		const drumsNormalized = Math.min(drumIntensity * 5, 1); // Усиливаем в 5 раз (было 3)
		// Применяем более резкую кривую для более заметного эффекта
		drumsAnimationIntensity = Math.pow(drumsNormalized, 0.4); // Было 0.6
	}
	
	// Реакция фона на drums
	useEffect(() => {
		if (!drumsAudio || !backgroundRef.current) return;

		// Анализируем drums для обводки, яркости, размытия
		const drumsVisualization = visualizeAudio({
			fps,
			frame,
			audioData: drumsAudio,
			numberOfSamples: 8, // Фокус на низких частотах для drums
		});

		// Анализируем низкие частоты (индексы 0-2) для drums
		const drumIntensity = drumsVisualization.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3;
		
		// Интерполируем значения на основе интенсивности drums
		// Нормализуем значение от 0 до 1 и применяем кривую для большей чувствительности
		const drumsNormalized = Math.min(drumIntensity * 3, 1); // Усиливаем в 3 раза
		// Применяем корень для того, чтобы небольшие значения давали больший эффект
		const normalizedDrumsIntensity = Math.pow(drumsNormalized, 0.6);
		
		// Интерполируем яркость от 1.0 до 0.92 (drums делает едва заметно темнее)
		const brightness = 1 - normalizedDrumsIntensity * 0.08;
		
		// Интерполируем контрастность от 1.0 до 1.5 (drums)
		const contrast = 1 + normalizedDrumsIntensity * 0.5;
		
		// Небольшое размытие для фона
		const blur = normalizedDrumsIntensity * 0.5;

		// Применяем эффекты к фону
		gsap.set(backgroundRef.current, {
			filter: `brightness(${brightness})`// contrast(${contrast}) blur(${blur}px)`,
		});
		
	}, [frame, fps, drumsAudio]);

	return (
		<ConfigContext.Provider value={props}>
			<SubtitlesProvider>
				<AbsoluteFill
				ref={backgroundRef}
				style={{
					fontFamily,
					textAlign: 'center',
					color: KARAOKE_CONFIG.COLORS.CHAR,
					fontStyle: 'normal',
					fontWeight: 100,
					backgroundColor: transparent
						? 'transparent'
						: KARAOKE_CONFIG.COLORS.BACKGROUND,
				}}
			>
				{/* {!transparent && <AbsoluteFill>
					<BackgroundComponent />
				</AbsoluteFill>} */}
				
				{/* Световые градиенты с анимацией в такт drums */}
				{!transparent && (
					<>
						{/* Белые градиенты на краях */}
						<LightGradient 
							position="top" 
							intensity={0.5} 
							animationIntensity={drumsAnimationIntensity} 
							color="white"
							offset={0}
							size="80% 40%"
							isMain	
						/>
						<LightGradient 
							position="bottom" 
							intensity={0.74} 
							animationIntensity={drumsAnimationIntensity} 
							color="white"
							offset={0}
							size="80% 40%"
							isMain
						/>
						
						{/* Желтые прожекторы для припева управляются через CSS псевдоэлементы в ParagraphLineComponent */}
						{/* Желтые прожекторы для не-припевных символов */}
					 
					</>
				)}
				
				{/* <Bottom /> */}
				<Subtitles 
					useAutoLines={USE_AUTO_LINES} 
					animationMode={_ANIMATION_MODE}
				/>
				<AudioComp />
			</AbsoluteFill>
			</SubtitlesProvider>
		</ConfigContext.Provider> 
	);
};
