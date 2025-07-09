import React from 'react';
import {Composition} from 'remotion';
import {parseMedia} from '@remotion/media-parser';
import {MusicContextProvider, useMusic} from './context/music';
import {MyComposition} from './Composition';
import {SONG_TARGET} from './_config';
const fps = 30;

const RootComponentWithContext = () => {
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
			width={1280}
			height={720}
		/>
	);
};

export const RemotionRoot: React.FC = () => {
	return (
		<MusicContextProvider>
			<RootComponentWithContext />
		</MusicContextProvider>
	);
};
