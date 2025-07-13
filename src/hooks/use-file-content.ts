import { useSuspenseQuery } from '@tanstack/react-query';

const resolverDefault = (res: Response) => res.text()

// const resolverWav = (res: Response) => {
// 	const reader = new FileReader()
// 	reader.readAsDataURL(res.blob())
// 	return reader.result
// }

export const useFileContent = (fileUrl: string, resolver = resolverDefault) =>
	useSuspenseQuery({
		queryKey: [fileUrl],
		queryFn: () =>
		fetch(fileUrl).then((res) =>
			res.text(),
		)}
	)