import { useState } from 'react';
import { updatePhysicsParams, G_GRAV, GRAV_CAP, GRAV_SWIRL, CENTER_K, RADIAL_DAMP, DRAG_COAST, DRAG_THRUST, CAP_THRESH, REL_THRESH, SWITCH_FAC } from '@proun/engine';

export function SettingsPanel() {
  const [open, setOpen] = useState(false);
  
  // Local state for sliders
  const [params, setParams] = useState({
    G_GRAV, GRAV_CAP, GRAV_SWIRL, CENTER_K, RADIAL_DAMP, 
    DRAG_COAST, DRAG_THRUST, CAP_THRESH, REL_THRESH, SWITCH_FAC
  });

  const handleChange = (key: string, value: number) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    updatePhysicsParams({ [key]: value });
  };

  if (!open) {
    return (
      <button 
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute', top: '20px', right: '20px',
          padding: '8px 12px', background: 'rgba(30,27,22,0.1)', border: '1px solid #1E1B16',
          cursor: 'pointer', fontFamily: 'sans-serif'
        }}
      >
        НАСТРОЙКИ
      </button>
    );
  }

  return (
    <div style={{
      position: 'absolute', top: '20px', right: '20px', width: '320px',
      background: '#F2EBD9', border: '2px solid #1E1B16', padding: '16px',
      fontFamily: 'sans-serif', fontSize: '12px', color: '#1E1B16'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>Гравитация & Физика</h3>
        <button onClick={() => setOpen(false)} style={{ cursor: 'pointer', background: 'none', border: 'none' }}>✕</button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Object.entries(params).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{k}</span>
              <span>{v.toFixed(k.includes('GRAV') && v > 100 ? 0 : 2)}</span>
            </div>
            <input 
              type="range" 
              min={v * 0.1} max={v * 3} step={v * 0.01}
              value={v}
              onChange={(e) => handleChange(k, parseFloat(e.target.value))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
