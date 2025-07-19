// import {Img} from 'remotion'; // Не используется 
import React, {FC, useEffect, useRef, useState} from 'react';	
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
import { EmojiSnow } from './components';
import { Rain } from './components/Rain';
import { useCurrentMeta, useMeta } from './hooks/use-meta';
import { useConfig } from './hooks/use-config';
import { CameraTarget } from './types';
import { ThreeCanvas } from '@remotion/three';

const {fontFamily} = loadFont(); // "Titan One"

const AudioComp = () => {
	const music = useMusic();
	return <Audio src={music} />;
}; 

export const MyComposition:FC<ConfigProps> = (props) => { 
	return (
		<ConfigContext.Provider value={props}>
			<SubtitlesProvider>
				<Content />
			</SubtitlesProvider>
		</ConfigContext.Provider> 
	);
};


const metaRains: Record<string, {count: number, speed: number}> = {
	"[Verse 1]":      {count: 100,  speed: 10},
	"[Pre-Chorus 1]": {count: 200,  speed: 15},
	"[Chorus 1]":     {count: 400,  speed: 30},
	"[Verse 2]":      {count: 450,  speed: 10},
	"[Pre-Chorus 2]": {count: 900,  speed: 15},
	"[Chorus 2]":     {count: 1800, speed: 30},
	"[Bridge]": 			{count: 3600, speed: 10},
	"[Final Chorus]": {count: 7200, speed: 15},
}

const cameraTargets: Record<string, {cameraTarget: CameraTarget, duration: number}> = {
	"[Verse 1]":      { cameraTarget: {position: [0, 0, 0], rotation: [0, 0, 0], fov: 75}, duration: 200 },
	"[Pre-Chorus 1]": { cameraTarget: {position: [0, 0, 0], rotation: [0, 0, 0], fov: 75}, duration: 200 },
	"[Chorus 1]":     { cameraTarget: {
		"position": [
			-0.0005026479610804905,
			-39.988438539389165,
			0.9616563465363814
		],
		"rotation": [
			1.5467526015807316,
			-0.000012566199027343027,
			0.0005225386735497837
		],
		"fov": 115
	}, duration: 200 },
	"[Verse 2]":      { cameraTarget: {
		"position": [
			-25.315785474373126,
			-14.360174105071525,
			27.43895780614764
		],
		"rotation": [
			0.4821525120548994,
			-0.6852862161784273,
			0.3198521308343608
		],
		"fov": 85
	}, duration: 200 },
	"[Pre-Chorus 2]": { cameraTarget: {position: [0, 0, 0], rotation: [0, 0, 0], fov: 75}, duration: 200 },
	"[Chorus 2]":     { cameraTarget: {
		"position": [
			6.084283834490385,
			38.842844441532186,
			7.363078562144257
		],
		"rotation": [
			-1.3834583640065043,
			0.1526998274153625,
			0.6762140479066334
		],
		"fov": 115}, duration: 200 },
	"[Bridge]": 			{ cameraTarget: {
		"position": [
			-12.395002992337378,
			7.07571207265726,
			-33.158832902935956
		],
		"rotation": [
			-2.931357346745999,
			-0.35048342480870553,
			-3.0684560076740555
		],
		"fov": 145
	}, duration: 200 },
	"[Final Chorus]": { cameraTarget: {
		"position": [
			-16.099584455805015,
			-8.85753973737272,
			-31.0734190289915
		],
		"rotation": [
			2.863905418523054,
			-0.46225979716147336,
			3.0151457382609936
		],
		"fov": 275
	}, duration: 200 },
}

const cameraConfig = {
	position: [0, 0, 0],
	rotation: [0, 0, 0],
	fov: 75,
};

const Content = () => {
	const {transparent} = useConfig();
	const backgroundRef = useRef<HTMLDivElement>(null);
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
 
	
	let drumsAudio: MediaUtilsAudioData | null = null;
	try {
		 drumsAudio = useAudioData(SONG_TARGET.stems.drums || '');
	} catch (error) {}

	// 🆕 Флаг для тестирования нового режима автоматической разбивки на линии
	const USE_AUTO_LINES = true; // Переключите на false для старого режима
	
	// 🆕 Убираем хардкод анимации - теперь система автоматически определяет режим на основе мета-линий
	// const _ANIMATION_MODE: ANIMATION_MODE = SONG_TARGET.settings.ANIMATIONS.default;

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

	const currentMeta = useCurrentMeta();

	const cameraProps = currentMeta ? cameraTargets[currentMeta] : null;
	
	const rainProps =  currentMeta ? metaRains[currentMeta] : {count: 1000, speed: 10};

	// ⛱️ Плавно изменяем скорость дождя при смене сегментов
	const [rainSpeed, setRainSpeed] = useState(rainProps.speed);
	const speedRef = useRef<{value: number}>({value: rainProps.speed});

	useEffect(() => {
		// Обновляем стартовое значение и прерываем предыдущую анимацию, если была
		speedRef.current.value = rainSpeed;
		gsap.killTweensOf(speedRef.current);
		// Анимируем к новой целевой скорости
		gsap.to(speedRef.current, {
			value: rainProps.speed,
			duration: 3,
			ease: 'power2.inOut',
			onUpdate: () => {
				setRainSpeed(speedRef.current.value);
			},
		});
	}, [rainProps.speed]);

  const { width, height } = useVideoConfig();
	return (
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
				</>
			)}

			<ThreeCanvas
				camera={cameraConfig as any}
				width={width}
				height={height}
				style={{
					position: 'absolute',
					inset: 0,
					pointerEvents: 'none',
				}}
			>
				{drumsAudio && 
					<Rain
						count={Math.min(rainProps.count * 20, 50000)}
						speed={rainSpeed}
					/>
				}
			</ThreeCanvas>
			<AbsoluteFill style={{pointerEvents: 'none'}}>
				<Subtitles 
					useAutoLines={USE_AUTO_LINES} 
					verticalAlign="center" // 🆕 Добавляем вертикальное выравнивание
				/>
			</AbsoluteFill>
			<AudioComp />
		</AbsoluteFill>
	);
};