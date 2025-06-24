import {Img} from 'remotion';
import {Audio} from 'remotion';
import {AbsoluteFill} from 'remotion';
import {Bottom} from './Bottom';
import {fontSize} from './Dots';
import {Subtitles} from './Subtitles'; 
import { SONG_TARGET } from './_config';

export const MyComposition = () => {
	return (
		<AbsoluteFill
			style={{
				fontSize,
				fontFamily: 'sans-serif',
				backgroundColor: 'black',
			}}
		>
			<AbsoluteFill>
				<Img src={SONG_TARGET.background} />
			</AbsoluteFill> 
			<Bottom />
			<Subtitles src={SONG_TARGET.segments}/>
			<Audio src={SONG_TARGET.music} />
		</AbsoluteFill>
	);
};
