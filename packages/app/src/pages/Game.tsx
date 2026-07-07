import { useRef } from 'react';
import { useEngine } from '../hooks/useEngine';
import { HUD } from '../components/HUD';
import { SettingsPanel } from '../components/SettingsPanel';

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engine = useEngine(canvasRef);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#F2EBD9' }}>
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%', display: 'block' }} 
      />
      
      {/* HUD Container */}
      <HUD engine={engine} />
      <SettingsPanel />
    </div>
  );
}
