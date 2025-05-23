import {useEffect, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import gsap from 'gsap';

export const MyComp = () => {
  const boxRef = useRef(null);
  const frame = useCurrentFrame();

  useEffect(() => {
    // Создаем временную шкалу
    const tl = gsap.timeline();
    
    tl.to(boxRef.current, {
      x: 100,
      duration: 1,
      ease: 'power2.out',
    })
    .to(boxRef.current, {
      y: 50,
      duration: 0.5,
      ease: 'bounce.out',
    })
    .to(boxRef.current, {
      rotation: 360,
      duration: 1,
      ease: 'power2.inOut',
    });

    // Очистка при размонтировании
    return () => {
      tl.kill();
    };
  }, []);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        ref={boxRef}
        style={{
          width: 100,
          height: 100,
          backgroundColor: '#ff0000',
        }}
      />
    </AbsoluteFill>
  );
}; 