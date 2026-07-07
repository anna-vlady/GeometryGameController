import { useEffect, useRef } from 'react';
import { ProunEngine } from '@proun/engine';

export function useEngine(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const engineRef = useRef<ProunEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const engine = new ProunEngine({ canvas: canvasRef.current });
    engineRef.current = engine;
    
    engine.mount();
    engine.start();
    
    const onResize = () => {
      engine.renderer.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      engine.unmount();
      engine.started = false;
    };
  }, []);

  return engineRef.current;
}
