import React from 'react'; 
import {SegmentComp} from './components/SegmentNew';
import {ANIMATION_MODE} from './types';
import {useSubtitlesContext} from './context/subtitles';


export const Subtitles: React.FC<{ 
	useAutoLines?: boolean; // 🆕 Новый параметр для режима автоматической разбивки
	animationMode?: ANIMATION_MODE; // 🆕 Параметр для выбора режима анимации
}> = ({useAutoLines = false, animationMode}) => {
	const finalSubs = useSubtitlesContext();
	 
	if (finalSubs === null) {
		return null;
	}

	return (
		<>
			{finalSubs.segments.map((segment) => { 
				return (
					<SegmentComp 
						key={segment.id}
						segment={segment}
						useAutoLines={useAutoLines}
						animationMode={animationMode}
					/>
				);
			})}
		</>
	);
};
