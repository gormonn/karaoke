import {Composition} from 'remotion';
import {MyComposition} from './Composition';
import {Editor} from './Editor';
import {StandaloneTimeline} from './StandaloneTimeline';
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
			<Composition
				id="Editor"
				component={Editor}
				fps={fps}
				durationInFrames={30 * fps} // 30 секунд для демо
				width={1920}
				height={1080}
			/>
			<Composition
				id="StandaloneTimeline"
				component={StandaloneTimeline}
				fps={fps}
				durationInFrames={30 * fps} // 30 секунд для демо
				width={1920}
				height={1080}
			/>
		</>
	);
};
