import {Img} from 'remotion';
import {Audio} from 'remotion';
import {AbsoluteFill} from 'remotion';
import {useMusic} from './context/music';
import {Bottom} from './Bottom';
import {fontSize} from './Dots';
import {Subtitles} from './Subtitles';
import {SONG_TARGET} from './_config';

const AudioComp = () => {
	const music = useMusic();
	return <Audio src={music} />;
};

export const MyComposition = () => {
	// 🆕 Флаг для тестирования нового режима автоматической разбивки на линии
	const USE_AUTO_LINES = true; // Переключите на false для старого режима

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
			<Subtitles src={SONG_TARGET.segments} useAutoLines={USE_AUTO_LINES} />
			<AudioComp />
		</AbsoluteFill>
	);
};
