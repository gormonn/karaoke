import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { Text } from '@react-three/drei';
import { useVideoConfig, useCurrentFrame, interpolate } from 'remotion';
import { Segment } from '../types';

interface ParagraphLine3DProps {
  segment: Segment;
  /** Размер шрифта в трёховских единицах */
  fontSize?: number;
  /** Базовый цвет букв */
  color?: string;
}

/**
 * Упрощённый 3D-рендер текста сегмента. Каждая буква — отдельный <Text>,
 * что позволит впоследствии навесить на неё физический коллайдер.
 * Пока что делаем лишь базовый вывод и простую подсветку символов
 * в момент их «активации» (как в ParagraphLineComponent).
 */
export const ParagraphLine3D: React.FC<ParagraphLine3DProps> = ({
  segment,
  fontSize = 50,
  color = '#ffffff',
}) => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const time = frame / fps;

  // Приблизительный горизонтальный шаг между символами
  const charStep = fontSize * 0.6;
  const lineHeight = fontSize * 1.2;

  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [0, 0, 600], fov: 75 }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.5} />
      {/* Центрируем блок текста */}
      <group
        position={[-(segment.text.join('').length * charStep) / 2, lineHeight, 0]}
      >
        {segment.text.map((line, lineIndex) => (
          <group key={lineIndex} position={[0, -lineIndex * lineHeight, 0]}>
            {Array.from(line).map((char, charIndex) => {
              // Ищем тайминг данного символа, чтобы подсветить его
              const timing = segment.words
                .flatMap((w) => w.word)
                .join(''); // плейсхолдер – для полноценного тайминга нужен interpolateCharTimings

              // Для демонстрации: простой пульс цвета за время
              const pulse = interpolate(
                Math.sin((frame + charIndex) / 10),
                [-1, 1],
                [0.3, 1]
              );

              return (
                <Text
                  key={`${lineIndex}-${charIndex}`}
                  fontSize={fontSize}
                  color={color}
                  position={[charIndex * charStep, 0, 0]}
                  anchorX="left"
                  anchorY="middle"
                  fillOpacity={pulse}
                >
                  {char}
                </Text>
              );
            })}
          </group>
        ))}
      </group>
    </ThreeCanvas>
  );
}; 