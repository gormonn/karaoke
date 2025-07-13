// Основной компонент сегмента
export {SegmentComp} from './SegmentNew';

// Компоненты для разных режимов рендеринга
export {LineComponent} from './LineComponent';
export {ParagraphLineComponent} from './ParagraphLineComponent';

// Утилиты анимации
export {
	initializeLetterizeChars,
	createLetterizeAnimation,
	createDefaultAnimation,
	interpolateCharTimings
} from './animations';

export * from './BackgroundComponent';
export * from './LineComponent';
export * from './ParagraphLineComponent';
export * from './SegmentNew';
export * from './LightGradient'; 