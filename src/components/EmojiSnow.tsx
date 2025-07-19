import React, { useCallback } from 'react';
import { Sequence, useVideoConfig } from 'remotion';
import { gsap, useGsapTimeline } from '../lib/gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(MotionPathPlugin);

interface EmojiSnowProps {
  emoji: string; // символ, например "❄️"
  start?: number; // сек
  end?: number; // сек
  count?: number; // количество снежинок
  fontSize?: string; // размер
  duration?: number; // время падения одной снежинки (сек)
}

export const EmojiSnow: React.FC<EmojiSnowProps> = ({
  emoji,
  start = 0,
  end = 10,
  count = 50,
  fontSize = '3rem',
  duration = 6,
}) => {
  const { fps, width, height } = useVideoConfig();

  const startFrame = Math.round(start * fps);
  const durationFrames = Math.round((end - start) * fps);

  const timelineFactory = useCallback(() => {
    const tl = gsap.timeline();

    // Очистим контейнер перед созданием
    const container = elementRef.current!;
    container.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const snow = document.createElement('div');
      snow.textContent = emoji;
      snow.style.position = 'absolute';
      snow.style.fontSize = fontSize;
      snow.style.left = `${Math.random() * width}px`;
      snow.style.top = `-${Math.random() * height}px`;
      snow.style.opacity = '0';
      snow.style.transformStyle = 'preserve-3d';
      container.appendChild(snow);

      const xEnd = Math.random() * width;
      const yEnd = height + 50;

      // Параметры глубины
      const maxDepth = 300;
      // Ограничение наклона по X/Y, чтобы спрайт не «плоско» поворачивался к камере
      const maxTilt = 40; // градусы
      const zStart = (Math.random() - 0.5) * 2 * maxDepth; // диапазон [-300, 300]
      const zEnd = zStart + (Math.random() - 0.5) * 100; // небольшое изменение глубины
      const scaleStart = gsap.utils.mapRange(-maxDepth, maxDepth, 0.4, 1.4, zStart);
      const scaleEnd = gsap.utils.mapRange(-maxDepth, maxDepth, 0.4, 1.4, zEnd);

      // Небольшое горизонтальное колебание (ветер)
      const windAmplitude = gsap.utils.random(-50, 50); // px
      const windDuration = duration / 2;

      // Размытие в зависимости от глубины (дальние снежинки чуть размыты)
      const blurStart = gsap.utils.mapRange(-maxDepth, maxDepth, 2, 0, zStart);
      const blurEnd = gsap.utils.mapRange(-maxDepth, maxDepth, 2, 0, zEnd);

      // Временная шкала для одной снежинки (повторяющаяся)
      const flakeTl = gsap.timeline({ repeat: -1, repeatDelay: 0, delay: Math.random() * duration });

      // Добавляем 3D-вращение во время падения
      flakeTl.fromTo(
        snow,
        {
          y: -50,
          opacity: 0,
          // Случайный начальный поворот по X/Y (ограниченный) и полный оборот по Z
          rotationX: gsap.utils.random(-maxTilt, maxTilt),
          rotationY: gsap.utils.random(-maxTilt, maxTilt),
          rotationZ: Math.random() * 360,
          z: zStart,
          scale: scaleStart,
          filter: `blur(${blurStart}px)`,
        },
        {
          y: yEnd,
          x: xEnd,
          opacity: 1,
          // Ограничиваем наклон по X и Y, полный оборот только по Z
          rotationX: `+=${gsap.utils.random(-maxTilt, maxTilt)}`,
          rotationY: `+=${gsap.utils.random(-maxTilt, maxTilt)}`,
          rotationZ: "+=360",
          z: zEnd,
          scale: scaleEnd,
          filter: `blur(${blurEnd}px)`,
          duration: duration,
          ease: 'linear',
        },
        0,
      );

      // Анимация ветра — плавное колебание влево/вправо
      flakeTl.to(
        snow,
        {
          x: `+=${windAmplitude}`,
          duration: windDuration,
          yoyo: true,
          repeat: 1, // два полупериода за один цикл падения
          ease: 'sine.inOut',
        },
        0,
      );

      // Исчезновение за последние 20% времени
      flakeTl.to(
        snow,
        {
          opacity: 0,
          duration: duration * 0.2,
          ease: 'linear',
        },
        duration * 0.8,
      );

      tl.add(flakeTl, 0);
    }

    return tl;
  }, [emoji, count, duration, fontSize, width, height]);

  const elementRef = useGsapTimeline<HTMLDivElement>(timelineFactory, [emoji, count, duration, fontSize, width, height]);

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <div
        ref={elementRef}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          pointerEvents: 'none',
          perspective: 1200,
          transformStyle: 'preserve-3d',
          // filter: 'blur(5px)',
        }}
      />
    </Sequence>
  );
}; 