// GSAP инициализация и конфигурация
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

// Регистрируем все необходимые плагины
gsap.registerPlugin(SplitText);

// Экспортируем для использования в компонентах
export { gsap, SplitText };

// Можно добавить глобальные настройки GSAP если нужно
// gsap.defaults({ ease: "power2.out", duration: 1 }); 

/**
 * Hook для интеграции GSAP с Remotion
 * Синхронизирует GSAP timeline с Remotion useCurrentFrame()
 */
export const useGsapTimeline = <T extends HTMLElement = HTMLDivElement>(
  gsapTimelineFactory: () => GSAPTimeline,
  deps: React.DependencyList = []
) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const animationScopeRef = useRef<T>(null);
  const timelineRef = useRef<GSAPTimeline | null>(null);
  const contextRef = useRef<gsap.Context | null>(null);

  // Создаем GSAP контекст и timeline
  useEffect(() => {
    if (!animationScopeRef.current) return;

    // Создаем GSAP контекст для управления анимациями
    contextRef.current = gsap.context(() => {
      // Создаем timeline через переданную factory функцию
      timelineRef.current = gsapTimelineFactory();
      
      // Сразу паузим timeline, чтобы управлять им вручную
      timelineRef.current.pause();
    }, animationScopeRef.current);

    // Очистка при размонтировании
    return () => {
      if (contextRef.current) {
        contextRef.current.kill();
      }
    };
  }, [gsapTimelineFactory, ...deps]);

  // Синхронизация GSAP timeline с Remotion frame
  useEffect(() => {
    if (!timelineRef.current) return;

    // Конвертируем frame в секунды: frame / fps = секунды
    const timeInSeconds = frame / fps;
    
    // Перемещаем GSAP timeline к нужному времени
    timelineRef.current.seek(timeInSeconds);
  }, [frame, fps]);

  return animationScopeRef;
};

/**
 * Альтернативный хук для более простых случаев
 * Позволяет создать GSAP анимацию, синхронизированную с Remotion
 */
export const useGsapAnimation = <T extends HTMLElement = HTMLDivElement>(
  animationFactory: (element: T) => GSAPTimeline,
  deps: React.DependencyList = []
) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const elementRef = useRef<T>(null);
  const timelineRef = useRef<GSAPTimeline | null>(null);
  const contextRef = useRef<gsap.Context | null>(null);

  // Создаем анимацию
  useEffect(() => {
    if (!elementRef.current) return;

    contextRef.current = gsap.context(() => {
      timelineRef.current = animationFactory(elementRef.current!);
      timelineRef.current.pause();
    }, elementRef.current);

    return () => {
      if (contextRef.current) {
        contextRef.current.kill();
      }
    };
  }, [animationFactory, ...deps]);

  // Синхронизация с Remotion
  useEffect(() => {
    if (!timelineRef.current) return;
    
    const timeInSeconds = frame / fps;
    timelineRef.current.seek(timeInSeconds);
  }, [frame, fps]);

  return elementRef;
};

/**
 * Утилита для создания GSAP timeline с настройками по умолчанию
 */
export const createGsapTimeline = (config?: GSAPTimelineVars) => {
  return gsap.timeline({
    paused: true,
    ...config
  });
};

/**
 * Утилита для преобразования кадров в секунды
 */
export const framesToSeconds = (frames: number, fps: number) => {
  return frames / fps;
};

/**
 * Утилита для преобразования секунд в кадры
 */
export const secondsToFrames = (seconds: number, fps: number) => {
  return seconds * fps;
}; 