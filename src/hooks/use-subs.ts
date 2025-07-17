import { useEffect, useState } from "react";
import { WhisperResponse } from "../types";
import { useSplitLinesConfig, useSplitWordsConfig } from "./use-config";
import { mergeEditsWithConverted } from "../lib/mergeEdits";
import { MusicData } from "../lib/mergeEdits";
import { EditsData } from "../lib/mergeEdits";
import { SONG_TARGET } from "../_config";
import { useSplitProcessor } from "./use-split-processor";
import { useSplitWordsProcessor } from "./use-split-processor";

// todo: refactor to useSuspenseQuery
export const useSubtitles = (): WhisperResponse | null => {
	const [subtitles, setSubtitles] = useState<WhisperResponse | null>(null);

	useEffect(() => {
		// Загружаем оба файла параллельно
		Promise.all([
			fetch(SONG_TARGET.segments).then((res) => res.json()), // converted файл
			// fetch(SONG_TARGET.edits).then((res) => res.json()) // edits файл
		]).then(([
			convertedData,
			//editsData
		]) => {
			// Применяем мерж edits с converted данными
			const editsData = SONG_TARGET.edits;
			const mergedData = mergeEditsWithConverted(convertedData as MusicData, editsData as EditsData);
			setSubtitles(mergedData as WhisperResponse);
		});
	}, []);
 
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

	return finalSubs;
}