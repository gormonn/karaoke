import React from 'react';
import {Composition} from 'remotion';
import {parseMedia} from '@remotion/media-parser';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MusicContextProvider, useUnknownMusicFormat} from './context/music';
import {MyComposition} from './Composition';
import {SONG_TARGET} from './_config';
import {configSchema, defaultProps} from './hooks/use-config';
import {useFileContent} from './hooks/use-file-content';

const fps = 30;

const RootComponentWithContext = () => {
	// Безопасная загрузка конфигурационных файлов
	const {data: splitLinesConfig} = useFileContent(SONG_TARGET.splitLines);
	const {data: splitWordsConfig} = useFileContent(SONG_TARGET.splitWords);
	const musicSrc = useUnknownMusicFormat();

	return (
		<Composition
			id="MyComp"
			component={MyComposition}
			fps={fps}
			calculateMetadata={async () => {
				try {
					const {slowDurationInSeconds} = await parseMedia({
						src: musicSrc,
						fields: {slowDurationInSeconds: true},
					});

					return {
						durationInFrames: Math.round(slowDurationInSeconds * fps),
					};
				} catch (error) {
					console.warn('Failed to parse media, using default duration:', error);
					// Возвращаем дефолтную длительность в случае ошибки
					return {
						durationInFrames: 300 * fps, // 5 минут по умолчанию
					};
				}
			}}
			schema={configSchema}
			// похоже что так по-уебищному работает сохранение конфигурации из интерфейса remotion
			// (хардкодом затирается конфиг прямо в Root.tsx)
			// todo: (low) создать PR на сохранение конфигурации в localStorage
			// а пока, просто не используем интерфейс remotion для сохранения конфигурации
			
			// Оригинальный код (если опять затрется):
			// defaultProps={{
			// 	...defaultProps,
			// 	splitLinesConfig,
			// 	splitWordsConfig,
			// }}
			defaultProps={{
				...defaultProps,
				splitLinesConfig: splitLinesConfig || '',
				splitWordsConfig: splitWordsConfig || '',
			}}
			width={1280}
			height={720}
		/>
	);
};

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			retryDelay: 1000,
		},
	},
});

export const RemotionRoot: React.FC = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<MusicContextProvider>
				<RootComponentWithContext />
			</MusicContextProvider>
		</QueryClientProvider>
	);
};
