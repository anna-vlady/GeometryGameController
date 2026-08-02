import { useEffect, useRef, useState } from 'react';
import { ProunEngine, SPAWN, ALTITUDE_MAX, levelRegistry } from '@proun/engine';
import { CornerQRCodes } from './CornerQRCodes';

interface HUDProps {
  engine: ProunEngine | null;
}

export function HUD({ engine }: HUDProps) {
  const [altitude, setAltitude] = useState(0);
  const [won, setWon] = useState(false);
  const [climbSecs, setClimbSecs] = useState(0);
  const [peerPilot, setPeerPilot] = useState<{ name: string; distM: number; angleDeg: number } | null>(null);
  const [activeLevel, setActiveLevel] = useState<number>(engine ? engine.getLevelId() : 1);
  const rafRef = useRef<number>(0);

  const allLevels = levelRegistry.getAllConfigs();

  const handleSelectLevel = (lvlId: number) => {
    if (!engine) return;
    setActiveLevel(lvlId);
    engine.setLevel(lvlId);
    engine.restart();
  };

  const getArtistName = (lvlId: number) => {
    if (lvlId === 1) return 'misak samokatian';
    if (lvlId === 2 || lvlId === 3 || lvlId === 4) return 'anna ghazaryan vladimirskaya';
    const cfg = levelRegistry.getLevelConfig(lvlId);
    return cfg ? cfg.artist.toLowerCase() : 'grisha tsvetkov';
  };

  useEffect(() => {
    if (!engine) return;
    setActiveLevel(engine.getLevelId());

    const tick = () => {
      setAltitude(Math.round(Math.max(0, (SPAWN.y - engine.player.y) / 10)));
      setWon(engine.won);
      if (engine.won) setClimbSecs(Math.round(engine.climbSeconds()));

      if (engine.netPlayers && engine.netPlayers.length > 0) {
        let bestDist = Infinity;
        let bestNp: any = null;
        for (const np of engine.netPlayers) {
          if (!np || typeof np.x !== 'number' || typeof np.y !== 'number' || isNaN(np.x) || isNaN(np.y)) continue;
          const dx = np.x - engine.player.x;
          const dy = np.y - engine.player.y;
          const d = Math.hypot(dx, dy);
          if (d < bestDist) {
            bestDist = d;
            bestNp = { ...np, dx, dy, dist: d };
          }
        }
        if (bestNp) {
          const angleDeg = Math.round((Math.atan2(bestNp.dy, bestNp.dx) * 180 / Math.PI + 360) % 360);
          setPeerPilot({
            name: bestNp.name || bestNp.id,
            distM: Math.round(bestNp.dist / 10),
            angleDeg
          });
        } else {
          setPeerPilot(null);
        }
      } else {
        setPeerPilot(null);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [engine]);

  if (!engine) return null;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
      {/* Permanent Corner QR Codes (Wi-Fi & Controller) */}
      <CornerQRCodes />

      {/* Title Branding Tag, Level Selection Buttons & Artist Text */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'auto',
        zIndex: 10
      }}>
        <div className="proun-title-tag" style={{ position: 'static' }}>
          PROUN<b>&nbsp;//&nbsp;</b>CLOCKWORK ORNITHOLOGY
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {allLevels.map((cfg) => {
            const isActive = activeLevel === cfg.id;
            return (
              <button
                key={cfg.id}
                onClick={() => handleSelectLevel(cfg.id)}
                style={{
                  background: isActive ? '#BF3B2B' : 'rgba(30, 27, 22, 0.75)',
                  color: isActive ? '#FFFFFF' : '#E7DFCC',
                  border: isActive ? '1px solid #BF3B2B' : '1px solid rgba(255, 255, 255, 0.25)',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '800',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  transition: 'all 0.15s ease'
                }}
                title={cfg.name}
              >
                LVL {cfg.id}
              </button>
            );
          })}
        </div>
        <div style={{
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.5px',
          color: 'rgba(30, 27, 22, 0.75)',
          marginTop: '2px'
        }}>
          artist: {getArtistName(activeLevel)}
        </div>
      </div>

      {/* Open Controller Emoticon Button (Top Right next to Map Altimeter) */}
      <button
        onClick={() => window.open('/#/controller?player=1', '_blank', 'width=420,height=750,resizable=yes')}
        style={{
          position: 'absolute',
          top: '76px',
          right: '60px',
          background: 'rgba(30,27,22,0.88)',
          color: '#E7DFCC',
          border: '1px solid rgba(255,255,255,0.25)',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
          cursor: 'pointer',
          pointerEvents: 'auto',
          zIndex: 15,
          transition: 'transform 0.1s ease, background 0.2s ease'
        }}
        title="Open Controller Joystick ↗"
      >
        🕹
      </button>

      {/* Tanks for all active local players */}
      <div style={{ position: 'absolute', bottom: '26px', left: '26px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {engine.slots && engine.slots.filter(s => s.active).map(s => {
          const slotColor = engine ? engine.getLevelConfig().palette.energyColors[(s.num - 1) % 4] : s.color;
          return (
            <div key={s.slotId} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: '900', color: slotColor, width: '56px', letterSpacing: '1px' }}>
                {s.name}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {s.tanks.map((fill, i) => (
                  <div key={i} style={{ width: '8px', height: '36px', border: `1px solid ${s.color}`, position: 'relative', borderRadius: '1px' }}>
                    <div style={{
                      position: 'absolute', bottom: 1, left: 1, right: 1,
                      height: `${(fill / 12) * 100}%`,
                      backgroundColor: (engine ? engine.getLevelConfig().palette.energyColors : ['#BF3B2B', '#1E1B16', '#C99B3F', '#3F5666'])[i]
                    }} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Peer Pilot Co-op Compass */}
      {peerPilot && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(30,27,22,0.88)',
          color: '#E7DFCC',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold',
          letterSpacing: '1px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          <span style={{ color: '#BF3B2B' }}>🤝</span>
          <span>{peerPilot.name}</span>
          <span style={{ color: '#C99B3F' }}>({peerPilot.distM}m)</span>
          <span style={{
            display: 'inline-block',
            transform: `rotate(${peerPilot.angleDeg}deg)`,
            fontSize: '14px',
            color: '#BF3B2B'
          }}>➔</span>
        </div>
      )}

      {/* Rhythm Combo Feedback (Corner Placement - Top Left) */}
      {engine.comboFlash > 0 && (
        <div style={{
          position: 'absolute',
          top: '70px',
          left: '26px',
          color: engine.comboFeedback.includes('PON') ? (engine ? engine.getLevelConfig().palette.ochre : '#C99B3F') : (engine ? engine.getLevelConfig().palette.red : '#BF3B2B'),
          fontSize: engine.comboFeedback.includes('REZONANCE') ? '16px' : '20px',
          fontWeight: '900',
          letterSpacing: '2px',
          padding: '6px 14px',
          background: 'rgba(242,235,217,0.92)',
          border: '2px solid ' + (engine.comboFeedback.includes('PON') ? (engine ? engine.getLevelConfig().palette.ochre : '#C99B3F') : (engine ? engine.getLevelConfig().palette.red : '#BF3B2B')),
          borderRadius: '6px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
          transition: 'all 0.1s ease-out',
          textAlign: 'left'
        }}>
          {engine.comboFeedback}
        </div>
      )}

      {/* Vertical Altimeter Scale */}
      <div style={{
        position: 'absolute',
        top: '80px',
        bottom: '80px',
        right: '24px',
        width: '28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        pointerEvents: 'none'
      }}>
        {/* Top Label (Summit) */}
        <div style={{ fontSize: '10px', fontWeight: '900', color: engine ? engine.getLevelConfig().palette.red : '#BF3B2B', letterSpacing: '1px' }}>
          {ALTITUDE_MAX}m
        </div>

        {/* Vertical Scale Bar Track */}
        <div style={{
          flex: 1,
          width: '6px',
          background: 'rgba(30,27,22,0.15)',
          borderRadius: '3px',
          position: 'relative',
          margin: '8px 0',
          border: '1px solid rgba(30,27,22,0.3)'
        }}>
          {/* Player Height Marker */}
          <div style={{
            position: 'absolute',
            left: '-6px',
            right: '-6px',
            height: '8px',
            background: engine ? engine.getLevelConfig().palette.red : '#BF3B2B',
            borderRadius: '2px',
            bottom: `${Math.min(100, Math.max(0, (altitude / ALTITUDE_MAX) * 100))}%`,
            transform: 'translateY(50%)',
            boxShadow: '0 2px 6px ' + (engine ? engine.getLevelConfig().palette.red : '#BF3B2B') + '80'
          }} />
        </div>

        {/* Bottom Label (Start) & Altitude Readout */}
        <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'rgba(30,27,22,0.7)', textAlign: 'center' }}>
          <div>{altitude}m</div>
          <div style={{ fontSize: '9px', opacity: 0.7 }}>0m</div>
        </div>
      </div>

      {/* Hint */}
      <div className="proun-hud-hint">
        WASD — Thrust · J-K — Patapon Rhythm (J-J-J-K) · M — Mute Audio · R — Restart
      </div>

      {/* Victory Overlay */}
      {won && (
        <div className="proun-overlay" style={{ pointerEvents: 'auto', cursor: 'default' }}>
          <h1>RITUAL<span className="red"> OF ASCENT</span></h1>
          <div className="sub" style={{ marginBottom: 0 }}>
            {engine.getLevelConfig().name} — COMPLETED
          </div>
          <div className="sub" style={{ marginTop: '12px' }}>
            climb time — {Math.floor(climbSecs / 60)}:{String(climbSecs % 60).padStart(2, '0')}
          </div>
          <div className="sub" style={{ marginTop: '6px', fontSize: '14px', opacity: 0.7 }}>
            altitude — {ALTITUDE_MAX}m · Mount Ararat Summit
          </div>
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => { engine.nextLevel(); setWon(false); }}
              style={{
                background: '#BF3B2B',
                color: '#FFF',
                border: 'none',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '900',
                borderRadius: '6px',
                cursor: 'pointer',
                letterSpacing: '1px',
                boxShadow: '0 4px 15px rgba(191,59,43,0.4)'
              }}
            >
              🚀 ADVANCE TO NEXT LEVEL →
            </button>
            <div className="start" style={{ fontSize: '12px', opacity: 0.7 }}>
              R — restart this level
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

