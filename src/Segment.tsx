import React, {useCallback, useState} from 'react';
import {
	AbsoluteFill,
	Img,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {Dots, LayoutsState, lineHeight, padding} from './Dots';
import {Segment} from './types';
import {WordComponent} from './Word';

const InnerComponent: React.FC<{
	segment: Segment;
}> = ({segment}) => {
	const [wordRefs] = useState(() => {
		return new Array(segment.words.length)
			.fill(0)
			.map(() => React.createRef<HTMLSpanElement>());
	});

	const [layouts, setLayouts] = useState<LayoutsState>(() => {
		return new Array(segment.words.length).fill(null);
	});

	const onWordLayout = useCallback(
		({
			height,
			index,
			width,
			x,
			y,
		}: {
			x: number;
			y: number;
			width: number;
			height: number;
			index: number;
		}) => {
			setLayouts((layouts) => {
				return layouts.map((layout, i) => {
					if (i !== index) {
						return layout;
					}

					return {
						x,
						y,
						width,
						height,
					};
				});
			});
		},
		[]
	);

	// Проверяем, есть ли структура строк в сегменте
	const hasLines = segment.lines && segment.lines.length > 0;

	return (
		<AbsoluteFill
			style={{
				fontWeight: 'bold',
				lineHeight,
				padding,
			}}
		>
			{/* <Dots layouts={layouts} words={segment.words} /> */}
			{hasLines ? (
				<div>
					{segment.lines?.map((line, lineIndex) => (
						<div key={lineIndex} className="line">
							{line.map((word, wordIndex) => {
								// Находим глобальный индекс слова в оригинальном массиве слов
								const globalIndex = segment.words.findIndex(
									(w) => w.start === word.start && w.end === word.end
								);
								
								return (
									<WordComponent
										ref={wordRefs[globalIndex]}
										key={wordIndex}
										index={globalIndex}
										word={word}
										onWordLayout={onWordLayout}
									/>
								);
							})}
						</div>
					))}
				</div>
			) : (
				// Запасной вариант для старого формата
				<div>
					{segment.words.map((word, i) => {
						const hasNewLine = word.word.includes('\n');
						
						return (
							<>
								{hasNewLine && i > 0 && <br />}
								<WordComponent
									ref={wordRefs[i]}
									key={i}
									index={i}
									word={word}
									onWordLayout={onWordLayout}
								/>
							</>
						);
					})}
				</div>
			)}
		</AbsoluteFill>
	);
};

export const SegmentComp: React.FC<{
	segment: Segment;
}> = ({segment}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const timeInSeconds = frame / fps;
	const {start, end} = segment;

	if (timeInSeconds < start || timeInSeconds > end) {
		return null;
	}

	return <InnerComponent segment={segment} />;
};
