declare module '@remotion/three' {
  import {CanvasProps} from '@react-three/fiber';
  import * as React from 'react';
  export interface ThreeCanvasProps extends CanvasProps {
    width: number;
    height: number;
  }
  export const ThreeCanvas: React.FC<ThreeCanvasProps>;
} 