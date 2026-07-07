import { useEffect, useRef, useState } from 'react';
import { ProunEngine, SPAWN } from '@proun/engine';

interface HUDProps {
  engine: ProunEngine | null;
}

export function HUD({ engine }: HUDProps) {
  const [tanks, setTanks] = useState([0, 0, 0, 0]);
  const [altitude, setAltitude] = useState(0);
  const [won, setWon] = useState(false);
  const [climbSecs, setClimbSecs] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!engine) return;

    const tick = () => {
      setTanks([...engine.tanks]);
      setAltitude(Math.round(Math.max(0, (SPAWN.y - engine.player.y) / 10)));
      setWon(engine.won);
      if (engine.won) setClimbSecs(Math.round(engine.climbSeconds()));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
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

      {/* Hint */}
      <div className="proun-hud-hint">
        WASD — тяга · M — звук · R — заново
      </div>

      {/* Финал: вершина */}
      {won && (
        <div className="proun-overlay" style={{ pointerEvents: 'auto', cursor: 'default' }}>
          <h1>ВЕР<span className="red">ШИНА</span></h1>
          <div className="sub" style={{ marginBottom: 0 }}>
            время восхождения — {Math.floor(climbSecs / 60)}:{String(climbSecs % 60).padStart(2, '0')}
          </div>
          <div className="start" style={{ marginTop: '20px' }}>
            R — снова · полёт продолжается
          </div>
        </div>
      )}
    </div>
  );
}
