import React, {useEffect, useState} from 'react';
import {AbsoluteFill} from 'remotion';
import {SegmentComp} from './components/SegmentNew';
import {WhisperResponse, ANIMATION_MODE} from './types';
import {mergeEditsWithConverted, MusicData, EditsData} from './lib/mergeEdits';
import {SONG_TARGET} from './_config';
import {useSplitProcessor, useSplitWordsProcessor} from './hooks/use-split-processor';
import {useSplitLinesConfig, useSplitWordsConfig} from './hooks/use-config';

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
	const splitWordsConfig = useSplitWordsConfig();
	
	// Цепочка обработки: сначала split-lines, затем split-words
	const splitLinesSubs = useSplitProcessor(subtitles, splitLinesConfig);
	const finalSubs = useSplitWordsProcessor(splitLinesSubs, splitWordsConfig);

	useEffect(() => {
		console.log('!!! splitLinesSubs', splitLinesSubs);
		console.log('!!! finalSubs', finalSubs);
	}, [splitLinesSubs, finalSubs]);
	 
	if (finalSubs === null) {
		return null;
	}

	return (
		<>
			{finalSubs.segments.map((segment) => { 
				return (
										<SegmentComp 
						key={segment.id}
						segment={segment}
						useAutoLines={useAutoLines}
						animationMode={animationMode}
					/>
				);
			})}
		</>
	);
};
