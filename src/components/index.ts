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