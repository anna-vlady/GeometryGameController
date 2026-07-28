import { useEffect, useRef } from 'react';
import { useEngine } from '../hooks/useEngine';
import { HUD } from '../components/HUD';
import { SettingsPanel } from '../components/SettingsPanel';
import { MultiplayerClient } from '../network/multiplayer';

import { DebugOverlay } from '../components/DebugOverlay';

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engine = useEngine(canvasRef);

  useEffect(() => {
    if (!engine) return;
    const mp = new MultiplayerClient(engine);
    mp.connect();
    return () => mp.disconnect();
  }, [engine]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#E7DFCC' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      <div className="proun-title-tag">
        ПРОУН<b>&nbsp;//&nbsp;</b>ЗАВОДНАЯ ОРНИТОЛОГИЯ
      </div>

      {/* HUD Container */}
      <HUD engine={engine} />
      <SettingsPanel engine={engine} />
      <DebugOverlay />
    </div>
  );
}
