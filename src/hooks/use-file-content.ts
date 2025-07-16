import { useQuery } from '@tanstack/react-query';

const resolverDefault = (res: Response) => {
	if (!res.ok) {
		throw new Error(`HTTP error! status: ${res.status}`);
	}
	return res.text();
}
 
export const useFileContent = (fileUrl: string, resolver = resolverDefault) => {
	const query = useQuery({
		queryKey: [fileUrl],
		queryFn: () => fetch(fileUrl).then(resolver),
		retry: 1,
		retryDelay: 1000,
	});

	if (query.error) {
		console.warn(`Failed to load file ${fileUrl}:`, query.error);
		return {
			...query,
			data: null,
			isSuccess: false,
		};
	}

	return query;
}