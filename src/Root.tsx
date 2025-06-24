import {Composition} from 'remotion';
import {MyComposition} from './Composition';
import { SONG_TARGET } from './_config';
import { getAudioDurationInSeconds } from '@remotion/media-utils';
const fps = 30;

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="MyComp"
				component={MyComposition}
				fps={fps}
				calculateMetadata={async () => {
					const duration = await getAudioDurationInSeconds(
						SONG_TARGET.music
					);
					return {
						durationInFrames: Math.round(duration * fps),
					};
				}}
				width={1280}
				height={720}
			/>
		</>
	);
};
