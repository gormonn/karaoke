import { useSuspenseQuery } from '@tanstack/react-query';

const resolverDefault = (res: Response) => res.text()
 
export const useFileContent = (fileUrl: string, resolver = resolverDefault) =>
	useSuspenseQuery({
		queryKey: [fileUrl],
		queryFn: () =>
		fetch(fileUrl).then(resolver)
	})