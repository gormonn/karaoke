/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import {Config} from '@remotion/cli/config';

// ProRes 4444 для прозрачности
Config.setVideoImageFormat("png");
Config.setPixelFormat("yuv420p");
Config.setCodec("h264"); 
Config.setHardwareAcceleration("required");
// Config.setProResProfile("4444");

// Настройки для Studio
// Config.buff
Config.setStudioPort(3000);
Config.setMaxTimelineTracks(200); // Увеличиваем количество треков
Config.setKeyboardShortcutsEnabled(true);
// Config.setLevel('info');

// Настройки рендеринга
// Config.setConcurrency(4);

// Увеличиваем таймаут ожидания delayRender(), так как инициализация <ThreeCanvas>
// с объёмной сценой дождя может занимать больше 30 секунд.
Config.setDelayRenderTimeoutInMilliseconds(360_000); // 6 минуты
Config.setChromiumOpenGlRenderer('vulkan');

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
