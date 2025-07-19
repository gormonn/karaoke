import { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { gsap } from 'gsap';

export interface CameraTarget {
  position: [number, number, number];
  rotation: [number, number, number];
  fov: number;
}

export const useAnimateCamera = (
  target: CameraTarget | null,
  durationInSeconds: number
) => {
  const { camera } = useThree();
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const animationState = useRef<{
    startFrame: number;
    startPosition: THREE.Vector3;
    startRotation: THREE.Euler;
    startFov: number;
    endTarget: CameraTarget;
  } | null>(null);

  const prevTargetRef = useRef(target);

  if (target !== prevTargetRef.current) {
    animationState.current = target
      ? {
          startFrame: frame,
          startPosition: camera.position.clone(),
          startRotation: camera.rotation.clone(),
          startFov: camera instanceof THREE.PerspectiveCamera ? camera.fov : 75,
          endTarget: target,
        }
      : null;
    prevTargetRef.current = target;
  }

  useFrame(() => {
    if (!animationState.current) {
      return;
    }

    const {
      startFrame,
      startPosition,
      startRotation,
      startFov,
      endTarget,
    } = animationState.current;

    const durationInFrames = durationInSeconds * fps;
    const progress = (frame - startFrame) / durationInFrames;

    if (progress < 0) return;

    if (progress >= 1) {
      camera.position.set(...endTarget.position);
      camera.rotation.set(...endTarget.rotation);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = endTarget.fov;
        camera.updateProjectionMatrix();
      }
      animationState.current = null;
      return;
    }

    const easedProgress = gsap.parseEase('power3.inOut')(progress);

    camera.position.lerpVectors(
      startPosition,
      new THREE.Vector3(...endTarget.position),
      easedProgress
    );

    const qStart = new THREE.Quaternion().setFromEuler(startRotation);
    const qEnd = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(...endTarget.rotation)
    );
    qStart.slerp(qEnd, easedProgress);
    camera.setRotationFromQuaternion(qStart);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = startFov + (endTarget.fov - startFov) * easedProgress;
      camera.updateProjectionMatrix();
    }
  });
}; 