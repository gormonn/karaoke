import {useCurrentFrame, useVideoConfig} from 'remotion';
import {MediaUtilsAudioData, useAudioData, visualizeAudio} from '@remotion/media-utils';
import {SONG_TARGET} from '../_config';
import {useConfig} from './use-config';

export const useStemAudio = (stem: keyof typeof SONG_TARGET.stems) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	let audioData: MediaUtilsAudioData | null = null;
	try {
		audioData = useAudioData(SONG_TARGET.stems[stem] || '');
	} catch (error) {}

	const { stems } = useConfig();

	if (!audioData || !stems || !stems[stem as keyof typeof stems]) {
		return [null,null,null,null, null,null,null,null, null,null,null,null, null,null,null,null];
	}
  
  return visualizeAudio({
		fps,
		frame,
		audioData,
		numberOfSamples: 4,
	}) || [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
}