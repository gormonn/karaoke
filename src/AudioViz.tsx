import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import { SONG_TARGET } from './_song'; 

export const AudioViz: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const audioData = useAudioData(SONG_TARGET.music);
	if (!audioData) {
		return null;
	}
	const visualization = visualizeAudio({
		fps,
		frame,
		audioData,
		numberOfSamples: 4,
	}); // [0.22, 0.1, 0.01, 0.01, 0.01, 0.02, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	// Render a bar chart for each frequency, the higher the amplitude,
	// the longer the bar
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'flex-end',
			}}
		>
			{visualization.map((v) => {
				return (
					<div
						style={{
							height: 200 * v,
							width: 15,
							marginLeft: 2,
							backgroundColor: 'white',
						}}
					/>
				);
			})}
		</div>
	);
};
