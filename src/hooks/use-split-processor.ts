import { useMemo, useEffect, useState } from 'react';
import { WhisperResponse } from '../types';
// @ts-ignore - ES6 модуль без типов для Node.js совместимости
import { processSplitFile } from '../converter/client-utils.mjs';

/**
 * Хук для загрузки содержимого файла по URL
 */
function useFileContent(fileUrl: string | null): string | null {
	const [content, setContent] = useState<string | null>(null);
	
	useEffect(() => { 
		if (!fileUrl) {
			setContent(null);
			return;
		}
		
		fetch(fileUrl)
			.then(response => { 
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.text();
			})
			.then(text => { 
				setContent(text);
			})
			.catch(error => { 
				setContent(null);
			});
	}, [fileUrl]);
	
	return content;
}

/**
 * Хук для обработки split.txt файла и перегруппировки сегментов
 * @param originalData - оригинальные данные из converted.json
 * @param splitFileUrl - URL split.txt файла (от staticFile)
 * @returns перегруппированные данные или оригинальные данные, если splitContent пустой
 */
export function useSplitProcessor(
	originalData: WhisperResponse | null,
	splitFileUrl: string | null
): WhisperResponse | null {
	const splitContent = useFileContent(splitFileUrl);
	
	return useMemo(() => { 
		if (!originalData || !splitContent || splitContent.trim() === '') { 
			return originalData;
		} 

		try { 
			const result = processSplitFile(originalData, splitContent); 
			return result;
		} catch (error) { 
			return originalData;
		}
	}, [originalData, splitContent]);
} 