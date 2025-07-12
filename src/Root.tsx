import React from 'react';
import {Composition} from 'remotion';
import {parseMedia} from '@remotion/media-parser';
import {
  QueryClient,
  QueryClientProvider, 
} from '@tanstack/react-query'
import {MusicContextProvider} from './context/music';
import {MyComposition} from './Composition';
import {SONG_TARGET} from './_config';
import {configSchema, defaultProps} from './hooks/use-config'; 
import {useFileContent} from './hooks/use-file-content';

const fps = 30;
 

const RootComponentWithContext = () => {
	const {data: splitLinesConfig} = useFileContent(SONG_TARGET.splitLines);

	return (
		<Composition
			id="MyComp"
			component={MyComposition}
			fps={fps}
			calculateMetadata={async () => {
				const {slowDurationInSeconds} = await parseMedia({
					src: await SONG_TARGET.music,
					fields: {slowDurationInSeconds: true},
				}); 
				
				return {
					durationInFrames: Math.round(slowDurationInSeconds * fps), 
				};
			}}
			schema={configSchema}
			defaultProps={{
				...defaultProps,
				splitLinesConfig,
			}}
			width={1280}
			height={720}
		/>
	);
};



const queryClient = new QueryClient()

export const RemotionRoot: React.FC = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<MusicContextProvider>
				<RootComponentWithContext />
			</MusicContextProvider>
		</QueryClientProvider>
	);
};
