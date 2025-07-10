import {Img} from 'remotion';
import {z} from 'zod';
import {FC, useMemo} from 'react';	
import {Audio} from 'remotion';
import {AbsoluteFill} from 'remotion';
import {useMusic} from './context/music';
import {Bottom} from './Bottom';
import {fontSize} from './Dots';
import {Subtitles} from './Subtitles';
import {SONG_TARGET} from './_config';
import {PropsContext} from './hooks/use-props-context';

const AudioComp = () => {
	const music = useMusic();
	return <Audio src={music} />;
};

export const myCompSchema = z.object({
	transparent: z.boolean(),
	stems: z.object({
		guitar: z.boolean(),
		bass: z.boolean(),
		drums: z.boolean(),
		percussion: z.boolean(),
		synth: z.boolean(),
		vocals: z.boolean(),
	}),
});

export const MyComposition:FC<z.infer<typeof myCompSchema>> = ({transparent, stems}) => {
	const props = useMemo(() => ({transparent, stems}), [transparent, stems]);

	// 🆕 Флаг для тестирования нового режима автоматической разбивки на линии
	const USE_AUTO_LINES = true; // Переключите на false для старого режима
	
	// 🆕 Новый флаг для выбора режима анимации
	const ANIMATION_MODE: 'default' | 'letterize' | 'zoom'  = 'letterize'; // Используем новый режим анимации из Word.tsx

	return (
		<PropsContext.Provider value={props}>
			<AbsoluteFill
				style={{
					fontSize,
					fontFamily: 'sans-serif',
					backgroundColor: transparent ? undefined : 'black',
				}}
			>
				{!transparent && <AbsoluteFill>
					<Img src={SONG_TARGET.background} />
				</AbsoluteFill>}
				<Bottom />
				<Subtitles 
					src={SONG_TARGET.segments} 
					useAutoLines={USE_AUTO_LINES} 
					animationMode={ANIMATION_MODE}
				/>
				<AudioComp />
			</AbsoluteFill>
		</PropsContext.Provider>
	);
};
