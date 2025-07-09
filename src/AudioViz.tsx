import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {nanoid} from 'nanoid';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {useMusic} from './context/music';

export const AudioViz: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const music = useMusic();
	const audioData = useAudioData(music);
	if (!audioData) {
		return null;
	}

	const visualization = visualizeAudio({
		fps,
		frame,
		audioData,
		numberOfSamples: 4,
	}).map((value) => ({
		id: nanoid(2),
		value
	})); // [0.22, 0.1, 0.01, 0.01, 0.01, 0.02, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

	
	// Render a bar chart for each frequency, the higher the amplitude,
	// the longer the bar
	return (
		<div
			// key={frame}
			style={{
				display: 'flex',
				alignItems: 'flex-end',
			}}
		>
			{visualization.map((v) => {
				return (
					<div
						key={v.id}
						style={{
							height: 200 * v.value,
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
