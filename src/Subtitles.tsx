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

	useEffect(() => {
		fetch(src)
			.then((res) => res.json())
			.then((data) => {
				setSubtitles(data);
			});
	}, []);

	if (subtitles === null) {
		return null;
	}

	return (
		<AbsoluteFill
			style={{ color: 'white' }}
		>
			{subtitles.segments.map((segment) => {
				return <SegmentComp key={segment.id} segment={segment} useAutoLines={useAutoLines} />;
			})}
		</AbsoluteFill>
	);
};
