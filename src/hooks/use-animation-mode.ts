import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ANIMATION_MODE } from '../types';
import { SONG_TARGET } from '../_config';
import { useMetaByTime } from './use-meta';

/**
 * Хук для определения режима анимации на основе текущей мета-линии
 * @returns режим анимации для текущего времени
 */
export const useAnimationMode = (): ANIMATION_MODE => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeInSeconds = frame / fps;
  
  const { ANIMATIONS } = SONG_TARGET.settings;
  
  // Получаем текущую мета-линию по времени
  const currentMetaLine = useMetaByTime(currentTimeInSeconds);
  
  // Если есть текущая мета-линия и для неё есть специальная анимация, используем её
  if (currentMetaLine && currentMetaLine in ANIMATIONS.metaLines) {
    return ANIMATIONS.metaLines[currentMetaLine as keyof typeof ANIMATIONS.metaLines];
  }
  
  // Если специальной анимации нет, используем дефолтную
  return ANIMATIONS.default;
}; 