import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {Text, Text3D} from '@react-three/drei';
import {useVideoConfig, useCurrentFrame, interpolate} from 'remotion';
import {useSubtitlesContext} from '../context/subtitles';
import {Segment} from '../types';
import { ConfigContext, ConfigProps } from '../hooks/use-config';
import { SubtitlesProvider } from '../context/subtitles';
import { useMusic } from '../context/music';
import { Audio } from 'remotion';
import * as THREE from 'three';
import {useGsapTimeline, gsap} from '../lib/gsap';
import {KARAOKE_CONFIG} from '../_config';
import * as font from '@remotion/google-fonts/Cinzel';
import { Center } from '@react-three/drei';
// @ts-ignore
import fontUrl from '../assets/fonts/Cinzel.ttf';

// const fontInfo = font.getInfo(); 
// const {fonts} = fontInfo;
// const fontUrl = fonts.normal[400]['latin-ext'];

console.log(fontUrl);

// Берём размер шрифта из глобального конфига (например, "6rem")
const fontStr = KARAOKE_CONFIG.fontSize as string;
const fontNumeric = parseFloat(fontStr);
const fontPx = fontStr.includes('rem') ? fontNumeric * 16 : fontNumeric; // 1rem = 16px

// Переводим px → «три-единицы» через эмпирический коэффициент (1 ед ≈ 2px)
const FONT_SIZE = fontPx / 2.4; // 96px → ~40

const CHAR_STEP = FONT_SIZE * 0.6;
const LINE_HEIGHT = FONT_SIZE * 1.2;

const SegmentText: React.FC<{segment: Segment; fps: number}> = ({segment, fps}) => {
  // const groupRef = useGsapTimeline<THREE.Group>(() => {
  //   const tl = gsap.timeline();
  //   // fade in
  //   tl.fromTo(
  //     {}, // dummy
  //     {opacity: 0},
  //     {
  //       opacity: 1,
  //       duration: 0.3,
  //       onUpdate() {
  //         const g = groupRef.current;
  //         if (!g) return;
  //         g.children.forEach((mesh) => {
  //           // @ts-ignore
  //           mesh.material.opacity = tl.progress();
  //           // @ts-ignore
  //           mesh.material.transparent = true;
  //         });
  //       },
  //     },
  //     segment.start
  //   );
  //   // hold automatically
  //   // fade out
  //   tl.to(
  //     {},
  //     {
  //       opacity: 0,
  //       duration: 0.3,
  //       onUpdate() {
  //         const g = groupRef.current;
  //         if (!g) return;
  //         g.children.forEach((mesh) => {
  //           // @ts-ignore
  //           mesh.material.opacity = gsap.getProperty({}, 'opacity');
  //           // @ts-ignore
  //           mesh.material.transparent = true;
  //         });
  //       },
  //     },
  //     segment.end - 0.3
  //   );

  //   return tl;
  // }, [segment]);

  return (
    <Center  >
      {segment.text.map((line, lineIndex) => (
        <Text3D
          key={lineIndex}
          // fontSize={FONT_SIZE}
          font={fontUrl}
        >
          {line}
        </Text3D>
      ))}
      {/* {segment.text.map((line, lineIndex) => (
        <group 
          key={lineIndex}
          position={[0, -lineIndex * LINE_HEIGHT, 0]}
          ref={groupRef}
        >
          {Array.from(line).map((char, charIndex) => {
            return (
              <mesh position={[charIndex * CHAR_STEP, 0, 0]} key={charIndex}>
                <meshBasicMaterial color="white" transparent opacity={1} />
                <Text
                  fontSize={FONT_SIZE}
                  font={fontUrl}
                  color="white"
                  anchorX="left"
                  anchorY="middle"
                >
                  {char}
                </Text>
              </mesh>
            );
          })}
        </group>
      ))} */}
    </Center>
  );
};


const AudioComp = () => {
	const music = useMusic();
	return <Audio src={music} />;
}; 

const SceneInner: React.FC = () => {
  const {width, height, fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const time = frame / fps;
  const finalSubs = useSubtitlesContext();

  if (!finalSubs) return null;

  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{position: [0, 0, 600], fov: 75}}
      style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}
      onCreated={({scene}) => {
        scene.background = new THREE.Color('#000');
      }}
    >
      <ambientLight intensity={0.7} />
      <Center>
        {finalSubs.segments
          .filter((seg) => time >= seg.start - 1 && time <= seg.end + 1)
          .map((segment) => (
            <SegmentText key={segment.id} segment={segment} fps={fps} />
          ))}
      </Center>
    </ThreeCanvas>
  );
};

export const Lyrics3DScene: React.FC<ConfigProps> = (props) => {
  return (
    <ConfigContext.Provider value={props}>
      <SubtitlesProvider>
        <SceneInner />
        <AudioComp />
      </SubtitlesProvider>
    </ConfigContext.Provider>
  );
}; 