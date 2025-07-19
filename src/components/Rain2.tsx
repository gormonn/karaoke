import React, {useMemo, useRef, useLayoutEffect} from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import {useVideoConfig, useCurrentFrame} from 'remotion';
import {Environment, OrbitControls} from '@react-three/drei';

interface RainProps {
  /** Количество капель */
  count?: number;
  /** Скорость падения (единиц в секунду) */
  speed?: number;
  /** Если true – камера развёрнута так, будто мы смотрим вверх в небо */
  lookUp?: boolean;
}
// где-нибудь в начале RainPoints
const WIND_ANGLE = -0.33;      // отрицательные – ветер справа-налево; 0 ≈ вниз
const ANGLE_JITTER = 0.05;     // небольшой разброс, чтобы не было «идеального» потока

/**
 * Реалистичный дождь на базе three.js.
 * Используются точечные спрайты (`Points`) с анимацией в `useFrame`.
 * Canvas располагается поверх сцены и не перехватывает события мыши.
 */
const RainPoints: React.FC<{count: number; speed: number; lookUp?: boolean}> = ({
  count,
  speed,
  lookUp = false,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  // Мы не используем камеру напрямую, но она может пригодиться для billboarding в будущем

  const {drops, geometry} = useMemo(() => {
    type DropData = {
      basePos: THREE.Vector3;
      velocity: THREE.Vector3;
      angle: number;
      pathLength: number;
      cycleTime: number;
      phase: number;
      scale: THREE.Vector3;
    };
    const bottomY = -10;
    const dropData: DropData[] = [];
    const colorArray = new Float32Array(count * 4);
    const baseColor = new THREE.Color(0xffffff);

    for (let i = 0; i < count; i++) {
      const angle = WIND_ANGLE + (Math.random() - 0.5) * ANGLE_JITTER;

      const vel = new THREE.Vector3(
        Math.sin(angle),
        -Math.cos(angle),
        0,
      ).multiplyScalar(speed * (0.7 + Math.random() * 0.6));

      const topY = lookUp ? 60 + Math.random() * 80 : 60 + Math.random() * 20;

      const pathLength = topY - bottomY;
      const cycleTime = pathLength / Math.abs(vel.y);

      // Масштаб для объемной капли (одинаковый по X и Z для сохранения формы)
      const scaleXZ = 0.4 + Math.random() * 0.8;
      const scaleY = 0.5 + Math.random() * 1.2;
      const scale = new THREE.Vector3(scaleXZ, scaleY, scaleXZ);

      dropData.push({
        basePos: new THREE.Vector3(
          (Math.random() - 0.5) * (lookUp ? 200 : 100),
          topY,
          (Math.random() - 0.5) * (lookUp ? 200 : 100),
        ),
        velocity: vel,
        angle,
        pathLength,
        cycleTime,
        phase: Math.random() * cycleTime,
        scale,
      });

      const opacity = THREE.MathUtils.lerp(
        0.3,
        0.8,
        Math.min(scaleY / 1.5, 1.0),
      );
      baseColor.toArray(colorArray, i * 4);
      colorArray[i * 4 + 3] = opacity;
    }

    // Используем CapsuleGeometry для создания объемных капель с низкой детализацией для производительности
    const geom = new THREE.CapsuleGeometry(0.07, 0.5, 4, 8);
    geom.setAttribute(
      'color',
      new THREE.InstancedBufferAttribute(colorArray, 4),
    );

    return {drops: dropData, geometry: geom};
  }, [count, speed, lookUp]);

  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();

    drops.forEach((drop, i) => {
      const localT = (time + drop.phase) % drop.cycleTime;
      const posY = drop.basePos.y + drop.velocity.y * localT;
      const posX = drop.basePos.x + drop.velocity.x * localT;
      const posZ = drop.basePos.z;

      dummy.position.set(posX, posY, posZ);
      dummy.rotation.z = drop.angle;

      // Имитация размытия в движении за счет масштабирования
      const speedFactor = drop.velocity.length() * 0.03;
      dummy.scale.set(
        drop.scale.x,
        drop.scale.y * (1 + speedFactor),
        drop.scale.z,
      );

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [time, drops]);

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, count]}>
      <meshPhysicalMaterial
        vertexColors
        transparent
        opacity={0.6}
        roughness={0}
        metalness={0}
        transmission={1}
        ior={1.52}
        thickness={2.5}
        reflectivity={1.5}
      />
    </instancedMesh>
  );
};

export const Rain: React.FC<RainProps> = ({
  count = 7000,
  speed = 25,
  lookUp = false,
}) => {
  const { width, height } = useVideoConfig();

  // console.log(width, height);

  // Камера по умолчанию смотрит вдоль -Z (вглубь экрана). Если нужна «вид в небо»,
  // ставим её чуть ниже сцены и поворачиваем на +90° по оси X, чтобы она
  // смотрела вдоль +Y (вверх).
  const cameraConfig = lookUp
    ? {
        position: [0, -20, 0] as [number, number, number],
        fov: 75,
        rotation: [Math.PI / 2, 0, 0] as [number, number, number],
      }
    : {position: [0, 0, 40] as [number, number, number], fov: 75};

  const fogConfig = lookUp
    ? (['#16161d', 70, 160] as const)
    : (['#16161d', 30, 90] as const);

  // Позиция для желтого света: перед камерой или над ней в режиме lookUp
  const pointLightPosition: [number, number, number] = lookUp
    ? [0, 10, 0]
    : [0, 0, 25];

  return (
    <ThreeCanvas
      camera={cameraConfig as any}
      width={width}
      height={height}
      style={{position: 'absolute', inset: 0, zIndex: 10}}
    >
      <OrbitControls />
      <fog attach="fog" args={fogConfig} />
      <ambientLight intensity={0.2} />
      <directionalLight position={[0, 50, 20]} intensity={1} />
      {/* Вот и наша желтая лампочка */}
      <pointLight
        position={pointLightPosition}
        color="#ffddaa"
        intensity={80000}
        distance={150}
      />
      <Environment preset="city" />

      {/* Красный куб для теста отражений */}
      {/* <mesh position={[0, 0, 15]}>
        <boxGeometry args={[10, 10, 10]} />
        <meshStandardMaterial
          color="red"
          emissive="darkred"
          emissiveIntensity={0.2}
          roughness={0.2}
        />
      </mesh> */}

      <RainPoints count={count} speed={speed} lookUp={lookUp} />
    </ThreeCanvas>
  );
}; 