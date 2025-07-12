import { useMemo } from 'react';
import { WhisperResponse } from '../types';
// @ts-ignore - ES6 модуль без типов для Node.js совместимости
import { processSplitFile, processSplitWords } from '../converter/client-utils.mjs'; 
import { useSplitLines, useSplitWords } from './use-config'; 

/**
 * Хук для обработки split-lines.txt файла и перегруппировки сегментов
 * @param originalData - оригинальные данные из converted.json
 * @param splitFileUrl - URL split-lines.txt файла (от staticFile)
 * @returns перегруппированные данные или оригинальные данные, если splitContent пустой
 */
export function useSplitProcessor(
	originalData: WhisperResponse | null,
	splitContent: string,
	_isEnabled?: boolean
): WhisperResponse | null {
	const splitLines = useSplitLines();
	const isEnabled = _isEnabled ?? splitLines; 
	
	return useMemo(() => { 
		if (!isEnabled || !originalData || !splitContent || splitContent.trim() === '') { 
			return originalData;
		} 

		try { 
			const result = processSplitFile(originalData, splitContent); 
			return result;
		} catch (error) { 
			return originalData;
		}
	}, [isEnabled, originalData, splitContent]);
}

/**
 * Хук для обработки split-words.txt файла и разбивки сегментов на слова
 * @param originalData - данные после обработки split-lines (или оригинальные данные)
 * @param splitWordsContent - содержимое split-words.txt файла
 * @returns данные с разбитыми на слова сегментами или оригинальные данные
 */
export function useSplitWordsProcessor(
	originalData: WhisperResponse | null,
	splitWordsContent: string,
	_isEnabled?: boolean
): WhisperResponse | null {
	const splitWords = useSplitWords();
	const isEnabled = _isEnabled ?? splitWords; 
	
	return useMemo(() => { 
		if (!isEnabled || !originalData || !splitWordsContent || splitWordsContent.trim() === '') { 
			return originalData;
		} 

		try { 
			const result = processSplitWords(originalData, splitWordsContent); 
			return result;
		} catch (error) { 
			console.error('!! useSplitWordsProcessor error:', error);
			return originalData;
		}
	}, [isEnabled, originalData, splitWordsContent]);
} 