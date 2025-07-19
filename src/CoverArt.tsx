import React, { FC, useEffect, useRef, useState } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Audio } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Cinzel';
import { KARAOKE_CONFIG } from './_config';
import { ConfigContext, ConfigProps } from './hooks/use-config';
import { MediaUtilsAudioData, useAudioData, visualizeAudio } from '@remotion/media-utils';
import { useMusic } from './context/music';
import { LightGradient } from './components/LightGradient';
import { Rain } from './components/Rain';
import { gsap } from './lib/gsap';
import { ThreeCanvas } from '@remotion/three';
import { SONG_TARGET } from './_config';

// Загружаем шрифт (тот же, что используется в основном клипе)
const { fontFamily } = loadFont();

/**
 * Простая композиция для генерации cover-art.
 * Рендерит один кадр с заданным текстом по центру, сохраняя
 * те же цветовые настройки, что и основная композиция караоке.
 */

// --- Переиспользуем Audio компонент из Composition.tsx ---
const AudioComp = () => {
  const music = useMusic();
  return <Audio src={music} />;
};

// --- Константы, взятые из Composition.tsx ---
const metaRains: Record<string, { count: number; speed: number }> = {
  '[Verse 1]': { count: 100, speed: 10 },
  '[Pre-Chorus 1]': { count: 200, speed: 15 },
  '[Chorus 1]': { count: 400, speed: 30 },
  '[Verse 2]': { count: 450, speed: 10 },
  '[Pre-Chorus 2]': { count: 900, speed: 15 },
  '[Chorus 2]': { count: 1800, speed: 30 },
  '[Bridge]': { count: 3600, speed: 10 },
  '[Final Chorus]': { count: 7200, speed: 15 },
};

const cameraConfig = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  fov: 75,
};

// Утилита для получения кодпоинтов смайлика для Twemoji
const toCodePoint = (unicodeSurrogates: string) => {
  const r: string[] = [];
  let c = 0,
    p = 0,
    i = 0;

  while (i < unicodeSurrogates.length) {
    c = unicodeSurrogates.charCodeAt(i++);
    if (p) {
      if ((0xDC00 <= c && c <= 0xDFFF)) {
        r.push(((0x10000 + ((p - 0xD800) << 10) + (c - 0xDC00)).toString(16)));
        p = 0;
        continue;
      }
      r.push(p.toString(16));
      p = 0;
    }
    if (0xD800 <= c && c <= 0xDBFF) {
      p = c;
    } else {
      r.push(c.toString(16));
    }
  }
  return r.join('-');
};

// React-компонент, который загружает SVG OpenMoji и встраивает его инлайн, чтобы можно было стилизовать
interface OpenMojiSVGProps {
  emoji: string;
  size?: string | number;
  strokeColor?: string;
  strokeWidth?: number;
  glowColor?: string;
  glowRadius?: number;
}

const OpenMojiSVG: FC<OpenMojiSVGProps> = ({
  emoji,
  size = '100vmin',
  strokeColor = 'gray',
  strokeWidth = 2,
  glowColor = 'yellow',
  glowRadius = 11,
}) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);

  useEffect(() => {
    const code = toCodePoint(emoji).toUpperCase();
    const url = `https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/${code}.svg`;
    fetch(url)
      .then((res) => res.text())
      .then((txt) => {
        // Добавляем stroke ко всем path внутри SVG
        // const withStroke = txt.replace(
        //   /<path /g,
        //   `<path stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round" `
        // );
        const withStroke = txt;
        setSvgContent(withStroke);
      });
  }, [emoji, strokeColor, strokeWidth]);

  if (!svgContent) return null;

  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      style={{
        width: sizeValue,
        height: sizeValue,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        filter: `drop-shadow(0 0 ${glowRadius}px ${glowColor}) drop-shadow(0 0 ${
          glowRadius * 0.5
        }px ${glowColor})`,
      }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

export const CoverArtComposition: FC<ConfigProps> = (props) => {
  const { coverTop = '', coverBottom = '', coverEmoji = '🎵', transparent } = props as any;

  const config = props as ConfigProps;
  const { coverText = '', ...restConfig } = config;
  const backgroundRef = useRef<HTMLDivElement>(null);
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Подгружаем drums для анимации
  let drumsAudio: MediaUtilsAudioData | null = null;
  try {
    drumsAudio = useAudioData(SONG_TARGET.stems.drums || '');
  } catch (e) {}

  // Интенсивность анимации градиентов
  let drumsAnimationIntensity = 0;
  if (drumsAudio) {
    const drumsVisualization = visualizeAudio({
      fps,
      frame,
      audioData: drumsAudio,
      numberOfSamples: 8,
    });
    const drumIntensity =
      drumsVisualization.slice(0, 3).reduce((s, v) => s + v, 0) / 3;
    const drumsNormalized = Math.min(drumIntensity * 5, 1);
    drumsAnimationIntensity = Math.pow(drumsNormalized, 0.4);
  }

  // Эффект на фоне при ударах барабанов
  useEffect(() => {
    if (!drumsAudio || !backgroundRef.current) return;

    const drumsVisualization = visualizeAudio({
      fps,
      frame,
      audioData: drumsAudio,
      numberOfSamples: 8,
    });
    const drumIntensity =
      drumsVisualization.slice(0, 3).reduce((s, v) => s + v, 0) / 3;
    const drumsNormalized = Math.min(drumIntensity * 3, 1);
    const normalizedDrumsIntensity = Math.pow(drumsNormalized, 0.6);
    const brightness = 1 - normalizedDrumsIntensity * 0.08;
    gsap.set(backgroundRef.current, {
      filter: `brightness(${brightness})`,
    });
  }, [frame, fps, drumsAudio]);

  // Для дождя: используем дефолтные параметры
  const rainProps = metaRains['[Chorus 1]'];
  const [rainSpeed, setRainSpeed] = useState(rainProps.speed);
  const speedRef = useRef<{ value: number }>({ value: rainProps.speed });

  useEffect(() => {
    speedRef.current.value = rainSpeed;
    gsap.killTweensOf(speedRef.current);
    gsap.to(speedRef.current, {
      value: rainProps.speed,
      duration: 1,
      ease: 'power2.out',
      onUpdate: () => setRainSpeed(speedRef.current.value),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rainProps.speed]);

  return (
    <ConfigContext.Provider value={config}>
      <AbsoluteFill
        ref={backgroundRef}
        style={{
          backgroundColor: transparent ? 'transparent' : KARAOKE_CONFIG.COLORS.BACKGROUND,
          fontFamily,
          color: KARAOKE_CONFIG.COLORS.CHAR,
        }}
      >
        {/* Световые градиенты */}
        {!transparent && (
          <>
            <LightGradient
              position="top"
              intensity={0.5}
              animationIntensity={drumsAnimationIntensity}
              color="white"
              offset={0}
              size="80% 40%"
              isMain
            />
            <LightGradient
              position="bottom"
              intensity={0.74}
              animationIntensity={drumsAnimationIntensity}
              color="white"
              offset={0}
              size="80% 40%"
              isMain
            />
          </>
        )}

        {/* 3D Canvas c дождём */}
        <ThreeCanvas
          camera={cameraConfig as any}
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {drumsAudio && (
            <Rain count={101101} speed={10} />
          )}
        </ThreeCanvas>


        {/* Верхний текст */}
        <div
          style={{
            fontFamily: 'Impact',
            position: 'absolute',
            top: '3%',
            width: '100%',
            textAlign: 'center',
            fontSize: '16rem',
            pointerEvents: 'none',
            color: 'white',
            WebkitTextStroke: '2px black',
            textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000',
          }}
        >
          {coverTop}
        </div>

        {/* Эмоджи по центру (два варианта для сравнения) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: '5rem',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {/* SVG Twemoji */}
          {(() => {
            const code = toCodePoint(coverEmoji);
            const url = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${code}.svg`;
            return (
              <img
                src={url}
                style={{ width: '2000px' }}
                alt={coverEmoji}
              />
            );
          })()}

{/* всрато пиздец */}
          {/* SVG OpenMoji */}
          {/* <OpenMojiSVG emoji={coverEmoji} size="3000px"/> */}

          {/* Текстовый смайлик */}
          {/* <span style={{ fontSize: '80rem' }}>{coverEmoji}</span> */}
        </div>

        {/* Нижний текст */}
        <div
          style={{
            fontFamily: 'Impact',
            position: 'absolute',
            bottom: '3%',
            width: '100%',
            textAlign: 'center',
            fontSize: '16rem',
            pointerEvents: 'none',
            color: 'white',
            WebkitTextStroke: '2px black',
            textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000',
          }}
        >
          {coverBottom}
        </div>

        {/* Аудио */}
        <AudioComp />
      </AbsoluteFill>
    </ConfigContext.Provider>
  );
}; 