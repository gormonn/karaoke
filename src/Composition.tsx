import {Img} from 'remotion'; 
import {FC} from 'react';	
import {Audio, AbsoluteFill} from 'remotion';
import {useMusic} from './context/music';
import {Bottom} from './Bottom';
import {fontSize} from './Dots';
import {Subtitles} from './Subtitles';
import {SONG_TARGET} from './_config';
import {ConfigContext, ConfigProps} from './hooks/use-config';		
import {ANIMATION_MODE} from './types';
import {BackgroundComponent} from './components/BackgroundComponent';

const AudioComp = () => {
	const music = useMusic();
	return <Audio src={music} />;
};


export const MyComposition:FC<ConfigProps> = (props) => { 
	const {transparent} = props;

	// 🆕 Флаг для тестирования нового режима автоматической разбивки на линии
	const USE_AUTO_LINES = true; // Переключите на false для старого режима
	
	// todo: move to props
	// 🆕 Новый флаг для выбора режима анимации
	const _ANIMATION_MODE: ANIMATION_MODE  = ANIMATION_MODE.LETTERIZE; // Используем новый режим анимации из Word.tsx

	return (
		<ConfigContext.Provider value={props}>
			<AbsoluteFill
				style={{
					fontSize,
					fontFamily: 'sans-serif',
					backgroundColor: transparent ? 'transparent' : '#1A1A1A',
				}}
			>
				{!transparent && <AbsoluteFill>
					<BackgroundComponent />
				</AbsoluteFill>}
				<Bottom />
				<Subtitles 
					src={SONG_TARGET.segments} 
					useAutoLines={USE_AUTO_LINES} 
					animationMode={_ANIMATION_MODE}
				/>
				<AudioComp />
			</AbsoluteFill>
		</ConfigContext.Provider> 
	);
};
