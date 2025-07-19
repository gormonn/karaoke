import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGsapTimeline } from '../lib/gsap';
import { CameraTarget } from '../types';
import { gsap } from 'gsap';

interface CameraAnimatorProps {
  target: CameraTarget | null;
  duration: number;
}

export const CameraAnimator: React.FC<CameraAnimatorProps> = ({
  target,
  duration,
}) => {
  const { camera } = useThree();

  useGsapTimeline(() => {
    const tl = gsap.timeline();

    if (target) {
      // Это создает короткую анимацию от текущей точки к целевой.
      // useGsapTimeline позаботится о синхронизации с Remotion.
      tl.to(
        camera.position,
        {
          x: target.position[0],
          y: target.position[1],
          z: target.position[2],
          duration,
          ease: 'power3.inOut',
        },
        0
      );
      tl.to(
        camera.rotation,
        {
          x: target.rotation[0],
          y: target.rotation[1],
          z: target.rotation[2],
          duration,
          ease: 'power3.inOut',
        },
        0
      );
      
      if (camera instanceof THREE.PerspectiveCamera) {
        tl.to(camera, { fov: target.fov, duration, ease: 'power3.inOut', onUpdate: () => camera.updateProjectionMatrix() }, 0);
      }
    }

    return tl;
  }, [target, duration, camera]);

  return null;
}; 