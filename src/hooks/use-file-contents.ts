import {useState, useEffect} from 'react';

/**
 * Хук для загрузки содержимого файла по URL
 */
export function useFileContent(fileUrl: string | null): string {
	const [content, setContent] = useState<string>('');
	
	useEffect(() => { 
		if (!fileUrl) {
			setContent('');
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
				setContent('');
			});
	}, [fileUrl]);
	
	return content;
}
