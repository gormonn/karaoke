import {Segment} from '../types';

export interface MusicData {
	text: string;
	segments: Segment[];
	language: string;
}

export interface EditSegment {
	id: number;
	start: number | null;
	end: number | null;
	text: string[];
	paragraph: string;
	words: EditWord[];
	lines: any[];
}

export interface EditWord {
	id: number;
	word: string;
	start: number | null;
	end: number | null;
	probability: number;
}

export interface EditsData {
	text: string;
	segments: EditSegment[];
	language: string;
}

/**
 * Мержит изменения из edits файла с converted данными
 * @param convertedData - данные из converted файла
 * @param editsData - данные из edits файла
 * @returns обновленные данные
 */
export function mergeEditsWithConverted(
	convertedData: MusicData,
	editsData: EditsData
): MusicData {
	// return convertedData;
	// Создаем глубокую копию converted данных
	const mergedData = JSON.parse(JSON.stringify(convertedData));

	// Проходим по каждому сегменту в edits
	editsData.segments.forEach((editSegment) => {
		// Находим соответствующий сегмент в converted данных
		const targetSegment = mergedData.segments.find(
			(seg: Segment) => seg.id === editSegment.id
		);

		if (targetSegment) {
			// Обновляем границы сегмента, если они заданы в edits
			if (editSegment.start !== null) {
				targetSegment.start = editSegment.start;
			}
			if (editSegment.end !== null) {
				targetSegment.end = editSegment.end;
			}

			targetSegment.text = editSegment.text;

			// Если в edits есть слова с изменениями, применяем их
			if (editSegment.words && editSegment.words.length > 0) {
				editSegment.words.forEach((editWord) => {
					const targetWord = targetSegment.words.find(
						(word: any) => word.id === editWord.id
					);

					if (targetWord) {
						// Обновляем тайминг слова, если он задан в edits
						if (editWord.start !== null) {
							targetWord.start = editWord.start;
						}
						if (editWord.end !== null) {
							targetWord.end = editWord.end;
						}
						targetWord.word = editWord.word;
					}
				});
			}
		}
	});

	return mergedData;
} 