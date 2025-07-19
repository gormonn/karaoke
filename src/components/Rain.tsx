import React, {useMemo, useRef, useLayoutEffect} from 'react';
import * as THREE from 'three'; 
import {useVideoConfig, useCurrentFrame} from 'remotion'; 
import { CameraTarget } from '../types';

interface RainProps {
  /** Количество капель */
  count?: number;
  /** Скорость падения (единиц в секунду) */
  speed?: number;
  /** Если true – камера развёрнута так, будто мы смотрим вверх в небо */
  lookUp?: boolean;
  /** Включает режим отладки камеры */
  debug?: boolean;
  cameraTarget?: CameraTarget | null;
  animationDuration?: number;
}
// где-нибудь в начале RainPoints
const WIND_ANGLE = -0.53;      // отрицательные – ветер справа-налево; 0 ≈ вниз
const ANGLE_JITTER = 1.25;     // небольшой разброс, чтобы не было «идеального» потока

/**
 * Реалистичный дождь на базе three.js.
 * Используются точечные спрайты (`Points`) с анимацией в `useFrame`.
 * Canvas располагается поверх сцены и не перехватывает события мыши.
 */
const RainPoints: React.FC<{count: number; speed: number; lookUp?: boolean}> = ({count, speed, lookUp = false}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  // Мы не используем камеру напрямую, но она может пригодиться для billboarding в будущем

  // Памятка объектов и скоростей
  const drops = useMemo(() => {
    type DropData = {
      basePos: THREE.Vector3; // начальная позиция (x,z, topY)
      velocity: THREE.Vector3; // вектор скорости
      angle: number; // угол наклона
      pathLength: number; // расстояние от top до bottom
      cycleTime: number; // время полного падения
      phase: number; // смещение фазы для рандомизации старта
    };
    const bottomY = -100;
    const data: DropData[] = [];
    for (let i = 0; i < count; i++) {
      // const angle = (Math.random() - 0.5) * 0.4; // наклон по ветру (рад)
      const angle = WIND_ANGLE + (Math.random() - 0.5) * ANGLE_JITTER;
      const vel = new THREE.Vector3(Math.sin(angle), -Math.cos(angle), 0).multiplyScalar(
        speed * (0.8 + Math.random() * 0.4),
      );
      
      // В режиме lookUp расширяем область генерации капель, чтобы покрыть всё поле зрения
      const topY = lookUp 
        ? 60 + Math.random() * 80  // больший диапазон высот для режима "вид в небо"
        : 60 + Math.random() * 20; // обычный диапазон
      
      const pathLength = topY - bottomY;
      const cycleTime = pathLength / Math.abs(vel.y);
      data.push({
        basePos: new THREE.Vector3(
          (Math.random() - 0.5) * 200, // шире по X в режиме lookUp
          topY,
          (Math.random() - 0.5) * 200, // шире по Z в режиме lookUp
        ),
        velocity: vel,
        angle,
        pathLength,
        cycleTime,
        phase: Math.random() * cycleTime,
      });
    }
    return data;
  }, [count, speed, lookUp]);

  // Создаём инстанс-сетки
  useMemo(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    drops.forEach((drop, i) => {
      dummy.position.copy(drop.basePos);
      dummy.scale.set(0.05, 0.5, 0.05); // тонкая длинная капля
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [drops]);

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
      dummy.scale.set(0.06, 0.8, 0.06);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [time, drops]);

  return (
    <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, count]}>
      <planeGeometry args={[0.05, 1]} />
      <meshBasicMaterial
        color={0xb2cdfb}
        transparent
        opacity={0.7}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};

export const Rain: React.FC<RainProps> = ({
  count = 7000,
  speed = 25,
  lookUp = false,
  debug = false,
  cameraTarget = null,
  animationDuration = 2,
}) => {

  // console.log(width, height);

  // Камера по умолчанию смотрит вдоль -Z (вглубь экрана). Если нужна «вид в небо»,
  // ставим её чуть ниже сцены и поворачиваем на +90° по оси X, чтобы она
  // смотрела вдоль +Y (вверх).
  // const cameraConfig = lookUp
  //   ? { position: [0, -20, 0] as [number, number, number], fov: 75, rotation: [Math.PI / 2, 0, 0] as [number, number, number] }
  //   : { position: [0, 0, 40] as [number, number, number], fov: 75 };

  return (
    <>
      {/* {debug ? (
        <>
          <CameraDebug initialCameraConfig={cameraConfig} />
          <axesHelper args={[20]} />
          {!lookUp && <gridHelper args={[100, 20]} />}
        </>
      ) : (
        // <CameraAnimator target={cameraTarget} duration={animationDuration || 0} />
      )} */}
      <RainPoints count={count} speed={speed} lookUp={lookUp} />
    </>
  );
}; 