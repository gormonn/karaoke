import { useMemo } from 'react';
import { WhisperResponse } from '../types';
// @ts-ignore - ES6 модуль без типов для Node.js совместимости
import { processSplitFile } from '../converter/client-utils.mjs'; 
import { useSplitLines } from './use-config';
import { useFileContent } from './use-file-contents';
import { SONG_TARGET } from '../_config';

export const useSplitLinesConfig = () => useFileContent(SONG_TARGET.split);  

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