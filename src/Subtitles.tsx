import React, {useEffect, useState} from 'react';
import {AbsoluteFill} from 'remotion';
import {SegmentComp} from './components/SegmentNew';
import {WhisperResponse, ANIMATION_MODE} from './types';
import {mergeEditsWithConverted, MusicData, EditsData} from './lib/mergeEdits';
import {SONG_TARGET} from './_config';
import {useSplitProcessor} from './hooks/use-split-processor';
import {useSplitLinesConfig} from './hooks/use-config';

export const Subtitles: React.FC<{
	src: string;
	useAutoLines?: boolean; // 🆕 Новый параметр для режима автоматической разбивки
	animationMode?: ANIMATION_MODE; // 🆕 Параметр для выбора режима анимации
}> = ({src, useAutoLines = false, animationMode}) => {
	const [subtitles, setSubtitles] = useState<WhisperResponse | null>(null);

	useEffect(() => {
		// Загружаем оба файла параллельно
		Promise.all([
			fetch(src).then((res) => res.json()), // converted файл
			fetch(SONG_TARGET.edits).then((res) => res.json()) // edits файл
		]).then(([convertedData, editsData]) => {
			// Применяем мерж edits с converted данными
			const mergedData = mergeEditsWithConverted(convertedData as MusicData, editsData as EditsData);
			setSubtitles(mergedData as WhisperResponse);
		});
	}, [src]);
 
	const splitLinesConfig = useSplitLinesConfig();
	const splittedSubs = useSplitProcessor(subtitles, splitLinesConfig);


	useEffect(() => {
		console.log('!!! splittedSubs', splittedSubs);
	}, [splittedSubs]);
	 
	if (splittedSubs === null) {
		return null;
	}

	return (
		<AbsoluteFill style={{color: '#F5F5F5'}}>
			{splittedSubs.segments.map((segment) => { 
				return (
					<SegmentComp
						key={segment.id}
						segment={segment}
						useAutoLines={useAutoLines}
						animationMode={animationMode}
					/>
				);
			})}
		</AbsoluteFill>
	);
};
