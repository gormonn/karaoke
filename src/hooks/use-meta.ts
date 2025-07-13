import { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { useFileContent } from './use-file-content';
import { SONG_TARGET } from '../_config';
import { Segment } from '../types';

/**
 * Хук для проверки, находится ли текущий кадр в пределах указанной мета-линии
 * @param metaLine - строка мета-линии (например, "[Chorus]", "[Verse 1]")
 * @returns true, если текущий кадр находится в пределах указанной мета-линии
 * 
 * @example
 * ```tsx
 * const isChorus = useMeta("[Chorus]");
 * const isVerse1 = useMeta("[Verse 1]");
 * 
 * if (isChorus) {
 *   // Применяем специальную анимацию для припева
 * }
 * ```
 */
export const useMeta = (metaLine: string): boolean => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Загружаем данные о сегментах
  const segmentsData = useFileContent(SONG_TARGET.segments);
  
  // Парсим JSON с сегментами
  const segments: Segment[] = useMemo(() => {
    try {
      return JSON.parse(segmentsData.data).segments || [];
    } catch (error) {
      console.error('Ошибка парсинга сегментов:', error);
      return [];
    }
  }, [segmentsData.data]);
  
  // Конвертируем кадр в секунды
  const currentTimeInSeconds = frame / fps;
  
  // Ищем сегмент, который содержит указанную мета-линию и в котором находится текущий кадр
  const isInMetaLine = useMemo(() => {
    return segments.some(segment => {
      // Проверяем, содержит ли сегмент указанную мета-линию
      const hasMetaLine = segment.metaLines && segment.metaLines.includes(metaLine);
      
      if (!hasMetaLine) return false;
      
      // Проверяем, находится ли текущее время в пределах сегмента
      const isInTimeRange = currentTimeInSeconds >= segment.start && currentTimeInSeconds <= segment.end;
      
      return isInTimeRange;
    });
  }, [segments, metaLine, currentTimeInSeconds]);
  
  return isInMetaLine;
}; 