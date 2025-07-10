/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import {Config} from '@remotion/cli/config';

// ProRes 4444 для прозрачности
Config.setVideoImageFormat("png");
Config.setPixelFormat("yuva444p10le");
Config.setCodec("prores");
Config.setProResProfile("4444");

// Настройки для Studio
Config.setStudioPort(3000);
Config.setMaxTimelineTracks(20); // Увеличиваем количество треков
Config.setKeyboardShortcutsEnabled(true);
Config.setLevel('info');

// Настройки рендеринга
Config.setConcurrency(4);

// Настройки для разработки
Config.setShouldOpenBrowser(true);
Config.setCachingEnabled(true);

// Кастомизация Webpack для Timeline
Config.overrideWebpackConfig((currentConfiguration) => {
	return {
		...currentConfiguration,
		resolve: {
			...currentConfiguration.resolve,
			alias: {
				...currentConfiguration.resolve?.alias,
				// Добавляем алиасы для кастомных компонентов
				'@/timeline': './src/Timeline',
				'@/editor': './src/Editor',
			},
		},
	};
});
