import { useEffect, useRef } from 'react';
import { useEngine } from '../hooks/useEngine';
import { HUD } from '../components/HUD';
import { SettingsPanel } from '../components/SettingsPanel';
import { MultiplayerClient } from '../network/multiplayer';

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engine = useEngine(canvasRef);

  useEffect(() => {
    if (!engine) return;
    const mp = new MultiplayerClient(engine);
    mp.connect();
    return () => mp.disconnect();
  }, [engine]);

  const activePaper = engine ? engine.getLevelConfig().palette.paper : '#E7DFCC';

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: activePaper, transition: 'background-color 0.4s ease' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      <div className="proun-title-tag">
        PROUN<b>&nbsp;//&nbsp;</b>CLOCKWORK ORNITHOLOGY
      </div>

      {/* HUD Container */}
      <HUD engine={engine} />
      <SettingsPanel engine={engine} />
    </div>
  );
}
