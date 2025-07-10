import {useCurrentFrame, useVideoConfig} from 'remotion';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {SONG_TARGET} from '../_config';
import {usePropsContext} from './use-props-context';

export const useStemAudio = (stem: keyof typeof SONG_TARGET.stems) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const audioData = useAudioData(SONG_TARGET.stems[stem]);

	const {stems} = usePropsContext();

	if (!audioData || !stems[stem as keyof typeof stems]) {
		return [null,null,null,null, null,null,null,null, null,null,null,null, null,null,null,null];
	}
  
  return visualizeAudio({
		fps,
		frame,
		audioData,
		numberOfSamples: 4,
	}) || [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
}