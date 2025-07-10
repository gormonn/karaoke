import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {nanoid} from 'nanoid';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {useMusic} from './context/music';
import {useStemAudio} from './hooks/use-stem-audio';

const Bar = ({value, color = 'red'}: {value: number | null, color?: string}) => 
	value!==null ? <div
		style={{
			height: 200 * value,
			width: 15,	
			marginLeft: 2,
			backgroundColor: color,
		}}
	/>:null

export const AudioViz: React.FC = () => {  
	const [g1,g2,g3,g4] = useStemAudio('guitar');
	const [b1,b2,b3,b4] = useStemAudio('bass');
	const [d1,d2,d3,d4] = useStemAudio('drums');
	const [p1,p2,p3,p4] = useStemAudio('percussion');
	const [s1,s2,s3,s4] = useStemAudio('synth');
	const [v1,v2,v3,v4,v5,v6] = useStemAudio('vocals');
	
	// Render a bar chart for each frequency, the higher the amplitude,
	// the longer the bar
	return (
		<div 
			style={{
				display: 'flex',
				alignItems: 'flex-end',
			}}
		>
			<Bar value={g1} />
			<Bar value={g2} />
			<Bar value={g3} />
			<Bar value={g4} />

			<Bar value={b1} />
			<Bar value={b2} />
			<Bar value={b3} />
			<Bar value={b4} />

			<Bar value={d1} />
			<Bar value={d2} />
			<Bar value={d3} />
			<Bar value={d4} />

			<Bar value={p1} />
			<Bar value={p2} />
			<Bar value={p3} />
			<Bar value={p4} />

			<Bar value={s1} />
			<Bar value={s2} />
			<Bar value={s3} />
			<Bar value={s4} />
			
			<Bar value={v1} color='white' />
			<Bar value={v2} color='white' />
			<Bar value={v3} color='white' />
			<Bar value={v4} color='white' />
			<Bar value={v5} color='white' />
			<Bar value={v6} color='white' />
		</div>
	);
};
