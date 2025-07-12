import React, {useEffect, useState} from 'react';
import {AbsoluteFill} from 'remotion';
import {SegmentComp} from './components/SegmentNew';
import {WhisperResponse, ANIMATION_MODE} from './types';
import {mergeEditsWithConverted, MusicData, EditsData} from './lib/mergeEdits';
import {SONG_TARGET} from './_config';
import {useSplitProcessor} from './hooks/use-split-processor';
import { effect } from 'zod';

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
 
	const splittedSubs = useSplitProcessor(subtitles, SONG_TARGET.split);


	useEffect(() => {
		console.log('!!! splittedSubs', splittedSubs);
	}, [splittedSubs]);
	
	useEffect(() => {
		console.log('!!! subtitles', subtitles);
	}, [subtitles]);



	const subs = splittedSubs || subtitles;
	if (subs === null) {
		return null;
	}

	return (
		<AbsoluteFill style={{color: '#F5F5F5'}}>
			{subs.segments.map((segment) => { 
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
