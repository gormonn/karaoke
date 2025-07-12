import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {lineHeight, padding} from '../Dots';
import {Segment, ANIMATION_MODE} from '../types';
import {KARAOKE_CONFIG} from '../_config';
import {useGsapTimeline, gsap} from '../lib/gsap';
import {LineComponent} from './LineComponent';
import {ParagraphLineComponent} from './ParagraphLineComponent';

const InnerComponent: React.FC<{
	segment: Segment;
	useAutoLines?: boolean; // 🆕 Новый параметр для выбора режима
	animationMode?: ANIMATION_MODE; // 🆕 Параметр для выбора режима анимации
}> = ({segment, useAutoLines = false, animationMode}) => {
	// Проверяем, есть ли структура строк в сегменте
	const hasLines = segment.lines && segment.lines.length > 0;
	const hasParagraph = segment.paragraph && segment.paragraph.trim() !== '';

	// Устанавливаем режим анимации для использования компонентами
	React.useEffect(() => {
		if (animationMode) {
			window.KARAOKE_ANIMATION_MODE = animationMode;
		}
	}, [animationMode]);

	return (
		<AbsoluteFill
			style={{
				fontWeight: 'bold',
				lineHeight,
				padding,
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
			<InnerComponent segment={segment} useAutoLines={useAutoLines} animationMode={animationMode} />
		</div>
	);
};
