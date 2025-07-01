import React, {useEffect, useState} from 'react';
import {AbsoluteFill} from 'remotion';
import {SegmentComp} from './Segment';
import {WhisperResponse, Segment} from './types';
import { SplitText } from "gsap/SplitText";
import gsap from 'gsap';

export const Subtitles: React.FC<{
	src: string;
	useAutoLines?: boolean; // 🆕 Новый параметр для режима автоматической разбивки
}> = ({src, useAutoLines = false}) => {
	const [subtitles, setSubtitles] = useState<WhisperResponse | null>(null);
	const [currentSegment, setCurrentSegment] = useState<Segment | null>(null);
	const [splitInstance, setSplitInstance] = useState<SplitText | null>(null);
	const containerRef = React.useRef<HTMLDivElement>(null);

	useEffect(() => {
		fetch(src)
			.then((res) => res.json())
			.then((data) => {
				setSubtitles(data);
			});
	}, []);

	useEffect(() => {
		if (currentSegment && containerRef.current) {
			containerRef.current.textContent = currentSegment.paragraph;
			
			const splitText = new SplitText(containerRef.current, {
				type: "lines,words,chars",
				linesClass: "line",
				wordsClass: "word", 
				charsClass: "char",
				position: "relative"
			});

			setSplitInstance(splitText);
			
			return () => {
				if (splitText) {
					splitText.revert();
				}
			};
		}
	}, [currentSegment]);

	useEffect(() => {
		if (splitInstance) {
			gsap.from(".line", {
				duration: 0.6,
				y: 30,
				autoAlpha: 0,
				stagger: 0.1,
				ease: "back.out(1.7)"
			});

			gsap.from(".word", {
				duration: 0.8,
				y: 20,
				autoAlpha: 0,
				stagger: {
					amount: 1.2,
					from: "start"
				}
			});
		}
	}, [splitInstance]);

	if (subtitles === null) {
		return null;
	}

	return (
		<AbsoluteFill
			style={{
				color: 'white',
			}}
		>
			{subtitles.segments.map((segment) => {
				return <SegmentComp key={segment.id} segment={segment} useAutoLines={useAutoLines} />;
			})}
		</AbsoluteFill>
	);
};
