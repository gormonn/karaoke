import {
	createContext,
	FC,
	PropsWithChildren,
	useContext,
} from 'react';
import {SONG_TARGET} from '../_config';
import { useFileContent } from '../hooks/use-file-content';

const MusicContext = createContext<string>('');

export const useUnknownMusicFormat = () => {
	const wav = SONG_TARGET.music + '.wav';
	const mp3 = SONG_TARGET.music + '.mp3';
	const {data: musicWav} = useFileContent(wav);
	const {data: musicMp3} = useFileContent(mp3);
	
	return musicWav.length > musicMp3.length ? wav : mp3;
}

export const MusicContextProvider: FC<PropsWithChildren> = ({children}) => {
	const music = useUnknownMusicFormat();

	return (
		<MusicContext.Provider value={music}>{children}</MusicContext.Provider>
	);
};

export const useMusic = () => useContext(MusicContext);
