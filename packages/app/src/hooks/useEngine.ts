import { useEffect, useRef, useState } from 'react';
import { ProunEngine } from '@proun/engine';

export function useEngine(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const engineRef = useRef<ProunEngine | null>(null);
  // useRef mutations don't trigger re-renders, so without this counter
  // consumers (HUD, SettingsPanel) would never receive the real engine
  // instance — they'd be stuck with the initial `null` forever.
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new ProunEngine({ canvas: canvasRef.current });
    engineRef.current = engine;

    engine.mount();
    engine.start();
    forceRender(x => x + 1);

    const onResize = () => {
      if (canvasRef.current && engineRef.current) {
        const w = canvasRef.current.clientWidth || window.innerWidth;
        const h = canvasRef.current.clientHeight || window.innerHeight;
        engineRef.current.renderer.resize(w, h);
      }
    };
    onResize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      engine.unmount();
      engine.started = false;
    };
  }, []);

  return engineRef.current;
}
