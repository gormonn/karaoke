import React, {useEffect, useImperativeHandle, useRef, useState} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Word} from './types';
import Letterize from 'letterizejs';
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
	}
> = ({word, onWordLayout, index}, ref) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const timeInSeconds = frame / fps;
	const [animationInitialized, setAnimationInitialized] = useState(false);

	const componentRef = useRef<HTMLSpanElement>(null);
	const internalRef = useRef<HTMLDivElement>(null);
	useImperativeHandle(ref, () => componentRef.current as HTMLSpanElement);

	const isShown = timeInSeconds >= word.start;

	// Проверяем, является ли слово фрагментом (частью) большего слова
	const isWordFragment = word.word.trim().length > 0 && (
		(!word.word.startsWith(' ') && !word.word.startsWith('\n')) || 
		word.word === 'ffee' || // Специальные случаи из JSON
		word.word === 'lls' ||
		word.word === 'ir' ||
		word.word === 's' ||
		word.word.startsWith("'") || 
		word.word.startsWith("et'") || 
		word.word.startsWith("r") || 
		word.word.startsWith("ink")
	);
	
	// Если слово - фрагмент, не добавляем пробел между ним и следующим словом
	const needsSpace = !isWordFragment && 
		!word.word.startsWith('\n') && 
		!word.word.endsWith('\n') && 
		word.word.trim() !== '';

	// Функция создания анимации, идентичная примеру
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
		
		// Создаем Letterize инстанс для выбранного текста
		const text = new Letterize({
			targets: element
		});
		
		// Создаем таймлайн с настройками
		const animation = createTimeline({
			defaults: {
				duration,
				ease: 'inOutQuad',
				delay: stagger(duration / 10),
			},
			autoplay: false, // Изначально не запускаем, запустим когда слово будет показано
		}).add(text.listAll, {delay: 100}); // Уменьшаем задержку чтобы анимация началась быстрее
		
		// Добавляем анимацию в зависимости от типа (in или out)
		if (isOut) {
			animation.add(text.listAll, {
				translateY: { from: '0px', to: `${charTranslateY}px` },
				rotateX: { from: '0deg', to: '90deg' },
				filter: { from: 'blur(0px)', to: 'blur(4px)' },
				opacity: { from: 1, to: 0 },
				color: { from: 'rgb(255, 255, 255)', to: 'rgb(0, 0, 0)' },
			});
		} else {
			animation.add(text.listAll, {
				translateY: { from: `-${charTranslateY}px`, to: '0px' },
				rotateX: { from: '-90deg', to: '0deg' },
				filter: { from: 'blur(4px)', to: 'blur(0px)' },
				opacity: { from: 0, to: 1 },
				color: { from: 'hsl(109, 97%, 88%)', to: 'hsl(350, 46%, 47%)' },
			});
		}
		
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
		marginRight: needsSpace ? '0.3em' : 0, // Добавляем отступ только для слов, которые не являются фрагментами
		visibility: isShown ? 'visible' : 'hidden',
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

	// Корректируем подход к определению ширины слова
	// Для фрагментов слов устанавливаем близко к содержимому
	const wordWidth = isWordFragment 
		? word.word.length * 0.5 + 'em' 
		: word.word.length * 0.6 + 'em';

	return (
		<span 
			ref={componentRef} 
			style={containerStyle}
			className={isWordFragment ? 'word-fragment' : 'word-full'}
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
