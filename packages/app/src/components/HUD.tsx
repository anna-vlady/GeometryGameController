import { useEffect, useState } from 'react';
import { ProunEngine } from '@proun/engine';

interface HUDProps {
  engine: ProunEngine | null;
}

export function HUD({ engine }: HUDProps) {
  const [tanks, setTanks] = useState([0, 0, 0, 0]);
  const [altitude, setAltitude] = useState(0);

  useEffect(() => {
    if (!engine) return;
    
    // Poll engine state for UI updates at 15fps
    const interval = setInterval(() => {
      setTanks([...engine.tanks]);
      const alt = Math.max(0, (800 - engine.player.y) / 10);
      setAltitude(Math.round(alt));
    }, 1000 / 15);

    return () => clearInterval(interval);
  }, [engine]);

  if (!engine) return null;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
      {/* Tanks */}
      <div style={{ position: 'absolute', bottom: '26px', left: '26px', display: 'flex', gap: '20px' }}>
        {tanks.map((fill, i) => (
          <div key={i} style={{ width: '10px', height: '56px', border: '1px solid rgba(30,27,22,0.45)', position: 'relative' }}>
            <div style={{ 
              position: 'absolute', bottom: 1, left: 1, right: 1, 
              height: `${(fill / 12) * 100}%`, 
              backgroundColor: ['#BF3B2B', '#1E1B16', '#C99B3F', '#3F5666'][i] 
            }} />
          </div>
        ))}
      </div>

      {/* Altitude */}
      <div style={{ position: 'absolute', bottom: '70px', right: '30px', color: 'rgba(30,27,22,0.6)', textAlign: 'right' }}>
        <p>{altitude} М</p>
      </div>
    </div>
  );
}
