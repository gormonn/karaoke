import { useSuspenseQuery } from '@tanstack/react-query';

export const useFileContent = (fileUrl: string ) =>
	useSuspenseQuery({
		queryKey: [fileUrl],
		queryFn: () =>
		fetch(fileUrl).then((res) =>
			res.text(),
		)}
	)