import { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { Segment } from '../types';
import { useSubtitlesContext } from '../context/subtitles';

/**
 * Хук для получения текущей мета-линии по времени
 * @param currentTimeInSeconds - время в секундах
 * @param segments - массив сегментов (опционально, если не передан - загружается автоматически)
 * @returns строка мета-линии или null, если не найдена
 * 
 * @example
 * ```tsx
 * const currentMetaLine = useMetaByTime(15.5); // "[Chorus]" или null
 * 
 * if (currentMetaLine === "[Chorus]") {
 *   // Применяем специальную анимацию для припева
 * }
 * ```
 */
export const useMetaByTime = (currentTimeInSeconds: number, segments?: Segment[]): string | null => {
  // Загружаем данные о сегментах только если не переданы
  const subtitles = segments ? null : useSubtitlesContext();
  const segmentsToUse = segments || subtitles?.segments;
  
  // Ищем сегмент, в котором находится текущее время или ближайший к нему
  const currentMetaLine = useMemo(() => {
    // Проверяем, что данные загружены
    if (!segmentsToUse || segmentsToUse.length === 0) {
      return null;
    }

    // Сначала пытаемся найти точное совпадение
    let currentSegment = segmentsToUse.find(segment => 
      currentTimeInSeconds >= segment.start && currentTimeInSeconds <= segment.end
    );

    // Если точное совпадение не найдено, ищем ближайший сегмент
    if (!currentSegment) {
      // Сортируем сегменты по расстоянию до текущего времени
      const segmentsWithDistance = segmentsToUse
        .map((segment: Segment) => {
          // Вычисляем расстояние до сегмента
          let distance: number;
          
          if (currentTimeInSeconds < segment.start) {
            // Время до начала сегмента
            distance = segment.start - currentTimeInSeconds;
          } else if (currentTimeInSeconds > segment.end) {
            // Время после конца сегмента
            distance = currentTimeInSeconds - segment.end;
          } else {
            // Время внутри сегмента (не должно произойти, но на всякий случай)
            distance = 0;
          }
          
          return { segment, distance };
        })
        .sort((a: { segment: Segment; distance: number }, b: { segment: Segment; distance: number }) => a.distance - b.distance);

      // Берем ближайший сегмент, если он не слишком далеко (например, в пределах 5 секунд)
      const nearestSegment = segmentsWithDistance[0];
      if (nearestSegment && nearestSegment.distance <= 5) {
        currentSegment = nearestSegment.segment;
      }
    }

    if (!currentSegment || !currentSegment.metaLines || currentSegment.metaLines.length === 0) {
      return null;
    }
    
    // Возвращаем первую мета-линию из массива (обычно там одна)
    return currentSegment.metaLines[0];
  }, [segmentsToUse, currentTimeInSeconds]);
  
  return currentMetaLine;
};

/**
 * Утилитная функция для получения мета-линии по времени (без хука)
 * @param currentTimeInSeconds - время в секундах
 * @param segments - массив сегментов
 * @returns строка мета-линии или null, если не найдена
 * 
 * @example
 * ```tsx
 * const finalSubs = useSubtitles();
 * const currentMetaLine = getMetaByTime(15.5, finalSubs?.segments);
 * ```
 */
export const getMetaByTime = (currentTimeInSeconds: number, segments?: Segment[]): string | null => {
  if (!segments || segments.length === 0) {
    return null;
  }

  // Сначала пытаемся найти точное совпадение
  let currentSegment = segments.find(segment => 
    currentTimeInSeconds >= segment.start && currentTimeInSeconds <= segment.end
  );

  // Если точное совпадение не найдено, ищем ближайший сегмент
  if (!currentSegment) {
    // Сортируем сегменты по расстоянию до текущего времени
    const segmentsWithDistance = segments
      .map((segment: Segment) => {
        // Вычисляем расстояние до сегмента
        let distance: number;
        
        if (currentTimeInSeconds < segment.start) {
          // Время до начала сегмента
          distance = segment.start - currentTimeInSeconds;
        } else if (currentTimeInSeconds > segment.end) {
          // Время после конца сегмента
          distance = currentTimeInSeconds - segment.end;
        } else {
          // Время внутри сегмента (не должно произойти, но на всякий случай)
          distance = 0;
        }
        
        return { segment, distance };
      })
      .sort((a: { segment: Segment; distance: number }, b: { segment: Segment; distance: number }) => a.distance - b.distance);

    // Берем ближайший сегмент, если он не слишком далеко (например, в пределах 5 секунд)
    const nearestSegment = segmentsWithDistance[0];
    if (nearestSegment && nearestSegment.distance <= 5) {
      currentSegment = nearestSegment.segment;
    }
  }

  if (!currentSegment || !currentSegment.metaLines || currentSegment.metaLines.length === 0) {
    return null;
  }
  
  // Возвращаем первую мета-линию из массива (обычно там одна)
  return currentSegment.metaLines[0];
};



export const useCurrentMeta = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Конвертируем кадр в секунды
  const currentTimeInSeconds = frame / fps;
  
  // Используем новый хук для получения текущей мета-линии
  return useMetaByTime(currentTimeInSeconds);
}

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
  const currentMetaLine = useCurrentMeta();
  
  return currentMetaLine === metaLine;
}; 

