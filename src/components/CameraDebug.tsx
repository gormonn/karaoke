import React, { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraDebugProps {
  initialCameraConfig: {
    position: [number, number, number];
    rotation?: [number, number, number];
    fov: number;
  };
}

export const CameraDebug: React.FC<CameraDebugProps> = ({
  initialCameraConfig,
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'c' && (event.metaKey || event.ctrlKey)) {
        const { position, rotation } = camera;
        const cameraState = {
          position: position.toArray(),
          rotation: [rotation.x, rotation.y, rotation.z],
          ...(camera instanceof THREE.PerspectiveCamera && { fov: camera.fov }),
        };

        const jsonState = JSON.stringify(cameraState, null, 2);
        
        navigator.clipboard.writeText(jsonState).then(() => {
          console.log('Camera state copied to clipboard:', jsonState);
        }).catch(err => {
          console.error('Failed to copy camera state: ', err);
        });
        return;
      }

      if (event.code === 'KeyR' && event.shiftKey) {
        const { position, rotation = [0, 0, 0], fov } = initialCameraConfig;

        camera.position.set(...position);
        camera.rotation.set(rotation[0], rotation[1], rotation[2]);
        
        if (camera instanceof THREE.PerspectiveCamera) {
          camera.fov = fov;
          camera.updateProjectionMatrix();
        }

        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
        console.log('Camera reset to initial state.');
        return;
      }
      
      if (camera instanceof THREE.PerspectiveCamera) {
        if (event.key === '[') {
          camera.fov -= 10;
          camera.updateProjectionMatrix();
          console.log('Camera FOV:', camera.fov);
        } else if (event.key === ']') {
          camera.fov += 10;
          camera.updateProjectionMatrix();
          console.log('Camera FOV:', camera.fov);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [camera, initialCameraConfig]);

  return <OrbitControls ref={controlsRef} />;
}; 