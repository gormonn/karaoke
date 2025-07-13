import React, { useEffect } from 'react';
import {AbsoluteFill} from 'remotion';

interface LightGradientProps {
	position?: 'top' | 'bottom';
	intensity?: number;
	animationIntensity?: number;
	color?: 'white' | 'yellow';
	offset?: number;
	size?: string;
	perspective?: boolean;
	isMain?: boolean;
	isInvert?: boolean;
	xPosition?: number;
	yPosition?: number;
}

export const LightGradient: React.FC<LightGradientProps> = ({
	position = 'bottom',
	intensity = 0.74,
	animationIntensity = 0,
	color = 'white',
	offset = 0,
	size = '80% 40%',
	perspective = false,
	isMain = false,
	xPosition = 50,
	yPosition,
	isInvert = false,
}) => {
	const isTop = position === 'top';
	// Если yPosition передан, позиционируем относительно него, иначе используем offset
	const verticalPosition = yPosition !== undefined 
		? `${yPosition}%` 
		: (isTop ? `${offset}%` : `${100 - offset}%`);
	
	const dynamicIntensity = intensity + (animationIntensity * 0.8);
	const secondaryIntensity = dynamicIntensity * 0.95;
	const tertiaryIntensity = dynamicIntensity * 0.4;
	
	const colorRGB = color === 'yellow' ? '255, 255, 0' : '255, 255, 255';
	
	const perspectiveStyles = perspective ? {
		transform: isTop ? 'perspective(500px) rotateX(60deg)' : 'perspective(500px) rotateX(-60deg)',
		transformOrigin: isTop ? 'center top' : 'center bottom',
	} : {};

	return (
		<AbsoluteFill
			className={"light-gradient "+size}
			style={{
				filter: isInvert ? 'invert(1)' : 'none',
				background: `radial-gradient(ellipse ${size} at ${xPosition}% ${verticalPosition}, 
					rgba(${colorRGB}, ${Math.min(dynamicIntensity, 1)}) 0%, 
					rgba(${colorRGB}, ${Math.min(secondaryIntensity, 1)}) 30%, 
					rgba(${colorRGB}, ${Math.min(tertiaryIntensity, 1)}) 50%, 
					transparent 70%)`,
				mixBlendMode: 'soft-light',
				pointerEvents: 'none',
			}}
		/>
		);
	}; 