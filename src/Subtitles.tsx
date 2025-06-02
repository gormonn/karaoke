import React, {useEffect, useState} from 'react';
import {AbsoluteFill} from 'remotion';
import {SegmentComp} from './Segment';
import {WhisperResponse} from './types';

export const Subtitles: React.FC<{src: string}> = ({src}) => {
	const [subtitles, setSubtitles] = useState<WhisperResponse | null>(null);

	useEffect(() => {
		fetch(src)
			.then((res) => res.json())
			.then((data) => {
				console.log('data', data);
				setSubtitles(data);
			});
	}, []);

	useEffect(() => {
		console.log('subtitles', subtitles);
	}, [subtitles]);

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
				return <SegmentComp key={segment.id} segment={segment} />;
			})}
		</AbsoluteFill>
	);
};
