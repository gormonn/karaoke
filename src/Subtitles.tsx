import React from 'react'; 
import {SegmentComp} from './components/SegmentNew';
import {ANIMATION_MODE} from './types';
import {useSubtitlesContext} from './context/subtitles';
import { Sequence, useVideoConfig } from 'remotion';


export const Subtitles: React.FC<{ 
	useAutoLines?: boolean; // 🆕 Новый параметр для режима автоматической разбивки
	animationMode?: ANIMATION_MODE; // 🆕 Параметр для выбора режима анимации (опциональный)
	verticalAlign?: 'top' | 'center' | 'bottom'; // 🆕 Параметр для вертикального выравнивания
}> = ({useAutoLines = false, animationMode, verticalAlign = 'center'}) => {
	const finalSubs = useSubtitlesContext();
	
	if (finalSubs === null) {
		return null;
	}

	return (
    <>
			{finalSubs.segments.map((segment) => { 
				return (
					// <Sequence 
					// 	key={segment.id}
					// 	from={segment.start * fps}
					// 	durationInFrames={segment.end * fps - segment.start * fps}
					// >
						<SegmentComp 
							key={segment.id}
							segment={segment}
							useAutoLines={useAutoLines}
							animationMode={animationMode}
							verticalAlign={verticalAlign}
						/>
					// </Sequence>
				);
			})}
		</>
	);
};
