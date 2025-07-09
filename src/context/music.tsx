import {
	createContext,
	FC,
	PropsWithChildren,
	useContext,
	useEffect,
	useState,
} from 'react';
import {SONG_TARGET} from '../_config';

const MusicContext = createContext<string>('');

export const MusicContextProvider: FC<PropsWithChildren> = ({children}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [music, setMusic] = useState('');
	const [error, setError] = useState('');

	useEffect(() => {
		setIsLoading(true);
		SONG_TARGET.music
			.then(setMusic)
			.catch(setError)
			.finally(() => setIsLoading(false));
	}, []);

	useEffect(() => {
		if (music) console.log('! result', music);
	}, [music]);

	if (isLoading) {
		console.log('! loading...', error);
		return <>Loading...</>;
	}

	if (error) {
		console.log('! error', error);
		return <>{error}</>;
	}

	return (
		<MusicContext.Provider value={music}>{children}</MusicContext.Provider>
	);
};

export const useMusic = () => useContext(MusicContext);
