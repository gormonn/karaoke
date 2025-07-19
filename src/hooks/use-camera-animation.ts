import { useCurrentFrame, useVideoConfig } from 'remotion';
import { cameraKeyframes, CameraKeyframe } from '../settings/camera-positions';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

function interpolate(
  val1: number,
  val2: number,
  progress: number
) {
  return val1 + (val2 - val1) * progress;
}

function interpolateArray(
  arr1: number[],
  arr2: number[],
  progress: number
): number[] {
  return arr1.map((val, i) => interpolate(val, arr2[i], progress));
}

export const useCameraAnimation = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { camera } = useThree();

  useEffect(() => {
    const time = frame / fps;

    // Сортируем ключевые кадры по времени
    const sortedKeyframes = [...cameraKeyframes].sort((a, b) => a.time - b.time);

    let currentKeyframe: CameraKeyframe | undefined;
    let nextKeyframe: CameraKeyframe | undefined;

    for (let i = 0; i < sortedKeyframes.length; i++) {
      if (sortedKeyframes[i].time <= time) {
        currentKeyframe = sortedKeyframes[i];
        if (i < sortedKeyframes.length - 1) {
          nextKeyframe = sortedKeyframes[i + 1];
        }
      } else {
        break;
      }
    }

    if (currentKeyframe && nextKeyframe) {
      const timeBetween = nextKeyframe.time - currentKeyframe.time;
      const progress = (time - currentKeyframe.time) / timeBetween;
      
      const pos = interpolateArray(currentKeyframe.position, nextKeyframe.position, progress);
      camera.position.set(pos[0], pos[1], pos[2]);

      const rot = interpolateArray(currentKeyframe.rotation, nextKeyframe.rotation, progress);
      camera.rotation.set(rot[0], rot[1], rot[2]);
      
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = interpolate(currentKeyframe.fov, nextKeyframe.fov, progress);
        camera.updateProjectionMatrix();
      }

    } else if (currentKeyframe) {
      camera.position.set(...currentKeyframe.position);
      camera.rotation.set(...currentKeyframe.rotation);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = currentKeyframe.fov;
        camera.updateProjectionMatrix();
      }
    }
  }, [frame, fps, camera]);
}; 