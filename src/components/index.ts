// Основной компонент сегмента
export {SegmentComp} from './SegmentNew';

// Компоненты для разных режимов рендеринга
export {LineComponent} from './LineComponent';
export {ParagraphLineComponent} from './ParagraphLineComponent';
export {ParagraphLine3D} from './ParagraphLine3D';

// Утилиты анимации
export {
	animInit,
	createLetterizeAnimation,
	createDefaultAnimation,
	interpolateCharTimings
} from './animations';

export { EmojiSnow } from './EmojiSnow';

export * from './BackgroundComponent';
export * from './LineComponent';
export * from './ParagraphLineComponent';
export * from './SegmentNew';
export * from './LightGradient';
export { Rain } from './Rain';
export * from './Lyrics3DScene'; 