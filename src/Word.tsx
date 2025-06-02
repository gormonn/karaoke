import React, {useEffect, useImperativeHandle, useRef, useState} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Word} from './types';
import Letterize from 'letterizejs'; // Возвращаем импорт
import {stagger, createTimeline, utils} from 'animejs';

const WordComp: React.ForwardRefRenderFunction<
	HTMLSpanElement,
	{
		word: Word;
		index: number;
		onWordLayout: (option: {
			x: number;
			y: number;
			width: number;
			height: number;
			index: number;
		}) => void;
		isPartOfGroup?: boolean;
		groupInfo?: {
			fullText: string;
			partIndex: number;
			totalParts: number;
		};
	}
> = ({word, onWordLayout, index, isPartOfGroup = false, groupInfo}, ref) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const timeInSeconds = frame / fps;
	const [animationInitialized, setAnimationInitialized] = useState(false);

	const componentRef = useRef<HTMLSpanElement>(null);
	const internalRef = useRef<HTMLDivElement>(null);
	useImperativeHandle(ref, () => componentRef.current as HTMLSpanElement);

	const isShown = timeInSeconds >= word.start;

	// todo: переделать на более простую логику
	// Используем новую логику для определения фрагментов слов
	const isWordFragment = React.useMemo(() => {
		// Если явно указано, что это часть группы - это фрагмент
		if (isPartOfGroup) {
			return true;
		}
		
		// Если это НЕ часть группы - это НЕ фрагмент, независимо от содержимого
		return false;
	}, [word.word, isPartOfGroup]);

	// Определяем, нужен ли пробел после слова
	const needsSpace = React.useMemo(() => {
		if (!word.word) return false;

		// Если это часть группы - проверяем, последняя ли это часть
		if (isPartOfGroup && groupInfo) {
			// Пробел нужен только после последней части группы
			const isLastPart = groupInfo.partIndex === groupInfo.totalParts - 1;
			if (!isLastPart) {
				return false; // Между частями одного слова пробелов нет
			}
			
			// Для последней части проверяем, есть ли пробел в конце
			const endsWithWhitespace = /[\s\n]$/.test(word.word);
			return !endsWithWhitespace;
		}
		
		// Для обычных слов (не части группы) - проверяем пробелы в конце
		const endsWithWhitespace = /[\s\n]$/.test(word.word);
		return !endsWithWhitespace;
	}, [word.word, isPartOfGroup, groupInfo]);

	// Функция создания анимации
	const createAnimation = (
		element: HTMLElement,
		type: string,
		{
			duration = 400,
			charTranslateY = 24,
		} = {}
	) => {
		if (!element) return null;
		
		const isOut = type === 'out';
		
		// === ВРЕМЕННО ОТКЛЮЧЕНО: Letterize анимация ===
		// Создаем Letterize инстанс для выбранного текста
		// const text = new Letterize({
		// 	targets: element
		// });
		// 
		// // Создаем таймлайн с настройками
		// const animation = createTimeline({
		// 	defaults: {
		// 		duration,
		// 		ease: 'inOutQuad',
		// 		delay: stagger(duration / 10),
		// 	},
		// 	autoplay: false, // Изначально не запускаем, запустим когда слово будет показано
		// }).add(text.listAll, {delay: 100}); // Уменьшаем задержку чтобы анимация началась быстрее
		//
		// // Добавляем анимацию в зависимости от типа (in или out)
		// if (isOut) {
		// 	animation.add(text.listAll, {
		// 		translateY: { from: '0px', to: `${charTranslateY}px` },
		// 		rotateX: { from: '0deg', to: '90deg' },
		// 		filter: { from: 'blur(0px)', to: 'blur(4px)' },
		// 		opacity: { from: 1, to: 0 },
		// 		color: { from: 'rgb(255, 255, 255)', to: 'rgb(0, 0, 0)' },
		// 	});
		// } else {
		// 	animation.add(text.listAll, {
		// 		translateY: { from: `-${charTranslateY}px`, to: '0px' },
		// 		rotateX: { from: '-90deg', to: '0deg' },
		// 		filter: { from: 'blur(4px)', to: 'blur(0px)' },
		// 		opacity: { from: 0, to: 1 },
		// 		color: { from: 'hsl(109, 97%, 88%)', to: 'hsl(350, 46%, 47%)' },
		// 	});
		// }
		// === КОНЕЦ ОТКЛЮЧЕННОГО КОДА ===
		
		// === ВРЕМЕННОЕ РЕШЕНИЕ: Простая анимация без букв ===
		// Создаем простую анимацию без разбивки на буквы
		const animation = createTimeline({
			defaults: {
				duration,
				ease: 'inOutQuad',
			},
			autoplay: false,
		});

		// Добавляем анимацию напрямую к элементу (без букв)
		if (isOut) {
			animation.add(element, {
				translateY: { from: '0px', to: `${charTranslateY}px` },
				rotateX: { from: '0deg', to: '90deg' },
				filter: { from: 'blur(0px)', to: 'blur(4px)' },
				opacity: { from: 1, to: 0 },
				color: { from: 'rgb(255, 255, 255)', to: 'rgb(0, 0, 0)' },
			});
		} else {
			animation.add(element, {
				translateY: { from: `-${charTranslateY}px`, to: '0px' },
				rotateX: { from: '-90deg', to: '0deg' },
				filter: { from: 'blur(4px)', to: 'blur(0px)' },
				opacity: { from: 0, to: 1 },
				color: { from: 'hsl(109, 97%, 88%)', to: 'hsl(350, 46%, 47%)' },
			});
		}
		// === КОНЕЦ ВРЕМЕННОГО РЕШЕНИЯ ===
		
		return animation;
	};

	// Анимация появления слова
	useEffect(() => {
		const container = internalRef.current;
		if (!container || animationInitialized) {
			return;
		}
		
		if (isShown && !animationInitialized) {
			// Находим элементы in и out внутри контейнера
			const inElement = container.querySelector('.word-in') as HTMLElement;
			const outElement = container.querySelector('.word-out') as HTMLElement;
			
			if (!inElement || !outElement) return;
			
			// Создаем две анимации
			const inAnimation = createAnimation(inElement, 'in');
			const outAnimation = createAnimation(outElement, 'out');
			
			if (inAnimation && outAnimation) {
				// Запускаем обе анимации
				inAnimation.play();
				outAnimation.play();
				
				// После завершения одной из анимаций (можно выбрать любую) отмечаем как инициализировано
				inAnimation.then(() => {
					setAnimationInitialized(true);
				});
			}
		}

		return () => {
			// Очистка ресурсов, если необходимо
		};
	}, [isShown, animationInitialized]);

	// Наблюдение за размерами для layout
	useEffect(() => {
		const {current} = componentRef;
		if (!current) {
			return;
		}

		const observer = new ResizeObserver((entries) => {
			const layout = entries[0].contentRect;

			onWordLayout({
				x: layout.x,
				y: layout.y,
				width: layout.width,
				height: layout.height,
				index,
			});
		});

		observer.observe(current);

		return () => {
			observer.unobserve(current as HTMLSpanElement);
		};
	}, [index, onWordLayout]);

	// Стили контейнера и текстовых слоев
	const containerStyle: React.CSSProperties = {
		position: 'relative',
		display: 'inline-block',
		whiteSpace: 'pre-wrap',
		marginRight: needsSpace ? '0.3em' : 0,
		visibility: isShown ? 'visible' : 'hidden',
		fontSize: isPartOfGroup ? '1rem' : 'inherit',
	};
	
	const textStyle: React.CSSProperties = {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		display: 'inline-block',
		whiteSpace: 'pre-wrap',
	};
	
	const textSpanStyle: React.CSSProperties = {
		display: 'inline-block',
		transformStyle: 'preserve-3d',
	};

	// Улучшенная логика определения ширины
	const wordWidth = React.useMemo(() => {
		if (isPartOfGroup && groupInfo) {
			// Для частей группы используем ширину пропорционально длине части
			const partLength = word.word.trim().length;
			return partLength * 0.6 + 'em';
		}
		
		// Для обычных слов
		return word.word.length * 0.6 + 'em';
	}, [word.word, isPartOfGroup, groupInfo]);

	// Определяем CSS класс для части слова
	const getWordClassName = () => {
		if (isPartOfGroup && groupInfo) {
			const {partIndex, totalParts} = groupInfo;
			const classes = ['word-part'];
			
			if (partIndex === 0) classes.push('word-part-first');
			if (partIndex === totalParts - 1) classes.push('word-part-last');
			if (totalParts > 1) classes.push('word-part-grouped');
			
			return classes.join(' ');
		}
		
		return isWordFragment ? 'word-fragment' : 'word-full';
	};

	return (
		<span 
			ref={componentRef} 
			style={containerStyle}
			className={getWordClassName()}
			data-word-part={isPartOfGroup ? `${groupInfo?.partIndex}/${groupInfo?.totalParts}` : undefined}
			data-full-text={isPartOfGroup ? groupInfo?.fullText : undefined}
		>
			<div ref={internalRef} style={{position: 'relative', minWidth: wordWidth}}>
				<div className="word-in" style={textStyle}>
					<span style={textSpanStyle}>{word.word}</span>
				</div>
				<div className="word-out" style={textStyle}>
					<span style={textSpanStyle}>{word.word}</span>
				</div>
			</div>
		</span>
	);
};

export const WordComponent = React.forwardRef(WordComp);
