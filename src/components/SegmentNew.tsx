import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Segment, ANIMATION_MODE} from '../types';
import {KARAOKE_CONFIG} from '../_config';
import {useGsapTimeline, gsap} from '../lib/gsap';
import {LineComponent} from './LineComponent';
import {ParagraphLineComponent} from './ParagraphLineComponent';
import {useAnimationMode} from '../hooks/use-animation-mode';

const InnerComponent: React.FC<{
	segment: Segment;
	useAutoLines?: boolean; // 🆕 Новый параметр для выбора режима
	animationMode?: ANIMATION_MODE; // 🆕 Параметр для выбора режима анимации
}> = ({segment, useAutoLines = false, animationMode}) => {
	// Проверяем, есть ли структура строк в сегменте
	const hasLines = segment.lines && segment.lines.length > 0;
	const hasParagraph = segment.paragraph && segment.paragraph.trim() !== '';

	// 🆕 Определяем режим анимации на основе текущей мета-линии
	const currentAnimationMode = useAnimationMode();
	
	// Используем переданный animationMode или определяем на основе мета-линий
	const finalAnimationMode = animationMode || currentAnimationMode;

	// Устанавливаем режим анимации для использования компонентами
	React.useEffect(() => {
		if (finalAnimationMode) {
			window.KARAOKE_ANIMATION_MODE = finalAnimationMode;
		}
	}, [finalAnimationMode]);
 
	
	// todo: create better function for this
	const isChorus = segment.metaLines.includes("[Chorus 1]") || segment.metaLines.includes("[Chorus 2]");

	return (
		<AbsoluteFill
			style={{ 
				lineHeight: 1,
				padding: isChorus ? '25%' : '100px',
			}}
		>
			<ParagraphLineComponent segment={segment} />
		</AbsoluteFill>
	);
};

export const SegmentComp: React.FC<{
	segment: Segment;
	useAutoLines?: boolean; // 🆕 Параметр для включения автоматической разбивки на линии
	animationMode?: ANIMATION_MODE; // 🆕 Параметр для выбора режима анимации
}> = ({segment, useAutoLines = false, animationMode}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const timeInSeconds = frame / fps;
	const {start, end} = segment;

	// ✅ Создаем timeline для fade-in/fade-out анимации сегмента
	const segmentAnimationRef = useGsapTimeline(() => {
		if (!KARAOKE_CONFIG.segmentTransition.enabled) {
			// Без анимации - просто возвращаем пустой timeline
			return gsap.timeline();
		}

		const timeline = gsap.timeline();
		const fadeInDuration = KARAOKE_CONFIG.segmentTransition.fadeInDuration;
		const fadeOutDuration = KARAOKE_CONFIG.segmentTransition.fadeOutDuration;
		
		// ✅ Защита от отрицательного времени начала fade-in
		const fadeInStart = Math.max(0, start - fadeInDuration);
		// ✅ Защита от того, что fade-out начнется до fade-in
		const fadeOutStart = Math.max(start, end - fadeOutDuration);

		// Устанавливаем начальное состояние - полностью прозрачный
		// Используем :scope для анимации самого ref элемента
		timeline.set(':scope', { opacity: 0 }, 0);
		
		// Fade-in анимация
		timeline.to(':scope', {
			opacity: 1,
			duration: fadeInDuration,
			ease: KARAOKE_CONFIG.segmentTransition.easing,
		}, fadeInStart);
		
		// Fade-out анимация
		timeline.to(':scope', {
			opacity: 0,
			duration: fadeOutDuration,
			ease: KARAOKE_CONFIG.segmentTransition.easing,
		}, fadeOutStart);

		return timeline;
	}, [start, end]);

	// Определяем, нужно ли рендерить сегмент
	const shouldRender = useMemo(() => {
		if (!KARAOKE_CONFIG.segmentTransition.enabled) {
			return timeInSeconds >= start && timeInSeconds <= end;
		}
		
		// ✅ Защита от отрицательного времени (аналогично timeline)
		const fadeInStart = Math.max(0, start - KARAOKE_CONFIG.segmentTransition.fadeInDuration);
		const fadeOutEnd = end + KARAOKE_CONFIG.segmentTransition.fadeOutDuration;
		
		return timeInSeconds >= fadeInStart && timeInSeconds <= fadeOutEnd;
	}, [timeInSeconds, start, end]);

	// Если сегмент не должен рендериться, возвращаем null
	if (!shouldRender) {
		return null;
	}

	return (
		<div ref={segmentAnimationRef}>
			<InnerComponent 
				segment={segment} 
				useAutoLines={useAutoLines} 
				animationMode={animationMode}
			/>
		</div>
	);
};
