import { useState } from 'react';
import { ProunEngine, updatePhysicsParams, G_GRAV, GRAV_CAP, GRAV_SWIRL, CENTER_K, RADIAL_DAMP, DRAG_COAST, DRAG_THRUST, CAP_THRESH, REL_THRESH, SWITCH_FAC, RHYTHM_TOLERANCE } from '@proun/engine';

interface SettingsPanelProps {
  engine: ProunEngine | null;
}

export function SettingsPanel({ engine }: SettingsPanelProps) {
  const [open, setOpen] = useState(false);

  // Гравитация / физика
  const [params, setParams] = useState({
    G_GRAV, GRAV_CAP, GRAV_SWIRL, CENTER_K, RADIAL_DAMP,
    DRAG_COAST, DRAG_THRUST, CAP_THRESH, REL_THRESH, SWITCH_FAC,
    RHYTHM_TOLERANCE
  });

  // Аудио и частицы — независимые регуляторы в реальном времени
  const [masterVol, setMasterVolState] = useState(85);
  const [objVol, setObjVolState] = useState(100);
  const [plrVol, setPlrVolState] = useState(100);
  const [particles, setParticlesState] = useState(70);
  const [seed, setSeed] = useState(engine ? engine.world.seed : 137);

  // Уровни и моды
  const [activeLevel, setActiveLevel] = useState<number>(engine ? engine.getLevelId() : 1);
  const [usePrimitives, setUsePrimitivesState] = useState<boolean>(
    engine ? engine.getLevelConfig().usePrimitives : false
  );

  const handleSelectLevel = (lvl: number) => {
    setActiveLevel(lvl);
    if (engine) {
      const cfg = engine.setLevel(lvl);
      setUsePrimitivesState(cfg.usePrimitives);
    }
  };

  const handleTogglePrimitives = () => {
    const nextVal = !usePrimitives;
    setUsePrimitivesState(nextVal);
    if (engine) {
      engine.setUsePrimitives(activeLevel, nextVal);
    }
  };

  const handlePhysicsChange = (key: string, value: number) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    updatePhysicsParams({ [key]: value });
  };

  const handleMasterVol = (v: number) => { setMasterVolState(v); engine?.setMasterVol(v / 100); };
  const handleObjVol = (v: number) => { setObjVolState(v); engine?.setObjVol(v / 100); };
  const handlePlrVol = (v: number) => { setPlrVolState(v); engine?.setPlrVol(v / 100); };
  const handleParticles = (v: number) => { setParticlesState(v); engine?.setParticleFrac(v / 100); };
  const handleRegenerate = () => engine?.setSeed(seed);
  const handleRandomSeed = () => {
    const s = Math.floor(Math.random() * 999999) + 1;
    setSeed(s);
    engine?.setSeed(s);
  };

  if (!open) {
    return (
      <button className="proun-panel-toggle" onClick={() => setOpen(true)}>
        Регуляторы
      </button>
    );
  }

  return (
    <div className="proun-panel">
      <div className="proun-panel-head" onClick={() => setOpen(false)}>
        <span>Регуляторы</span>
        <span className="tog">▾</span>
      </div>

      <div className="proun-panel-section">Уровни &amp; Моды</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '6px' }}>
        {[1, 2, 3, 4, 5].map((lvl) => (
          <button
            key={lvl}
            style={{
              background: activeLevel === lvl ? '#BF3B2B' : 'rgba(30,27,22,0.7)',
              color: '#FFF',
              padding: '6px 2px',
              fontSize: '11px',
              fontWeight: 'bold',
              border: activeLevel === lvl ? '2px solid #FFF' : '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => handleSelectLevel(lvl)}
          >
            Ур. {lvl}
          </button>
        ))}
      </div>
      <div style={{ marginBottom: '8px', fontSize: '10px', color: '#A09888', fontStyle: 'italic' }}>
        {engine ? engine.getLevelConfig().name : `Уровень ${activeLevel}`}
      </div>
      <button
        style={{
          width: '100%',
          background: usePrimitives ? '#C99B3F' : '#3F5666',
          color: '#FFF',
          padding: '8px',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '11px',
          border: 'none',
          cursor: 'pointer',
          marginBottom: '12px'
        }}
        onClick={handleTogglePrimitives}
      >
        {usePrimitives ? '✦ Стиль: Чистые Примитивы' : '🎨 Стиль: Кастомное Оформление'}
      </button>

      <div className="proun-panel-section">Мир &amp; Джойстик</div>

      <div className="proun-seed-row" style={{ marginBottom: '8px' }}>
        <input
          type="number"
          value={seed}
          onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)}
        />
        <button className="proun-btn" onClick={handleRegenerate}>Обновить</button>
        <button className="proun-btn" onClick={handleRandomSeed}>Случайно</button>
      </div>
      <div style={{ marginBottom: '12px' }}>
        <a
          href="/controller-settings"
          style={{
            display: 'block',
            textAlign: 'center',
            background: '#BF3B2B',
            color: '#FFF',
            padding: '8px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '12px'
          }}
        >
          📱 Настройка Мобильного Джойстика
        </a>
      </div>

      <div className="proun-panel-section">Звук</div>
      <div className="proun-ctl">
        <label>Мастер <b>{masterVol}</b></label>
        <input type="range" min={0} max={100} value={masterVol}
          onChange={(e) => handleMasterVol(parseInt(e.target.value, 10))} />
      </div>
      <div className="proun-ctl thumb-ink">
        <label>Объекты <b>{objVol}</b></label>
        <input type="range" min={0} max={150} value={objVol}
          onChange={(e) => handleObjVol(parseInt(e.target.value, 10))} />
      </div>
      <div className="proun-ctl thumb-blue">
        <label>Игрок <b>{plrVol}</b></label>
        <input type="range" min={0} max={150} value={plrVol}
          onChange={(e) => handlePlrVol(parseInt(e.target.value, 10))} />
      </div>
      <div className="proun-ctl thumb-ochre">
        <label>Плотность частиц <b>{particles}%</b></label>
        <input type="range" min={20} max={300} value={particles}
          onChange={(e) => handleParticles(parseInt(e.target.value, 10))} />
      </div>

      <div className="proun-panel-section">Гравитация &amp; физика</div>
      {Object.entries(params).map(([k, v]) => (
        <div key={k} className="proun-ctl">
          <label>{k} <b>{v.toFixed(k.includes('GRAV') && v > 100 ? 0 : 2)}</b></label>
          <input
            type="range"
            min={v * 0.1} max={v * 3} step={v * 0.01}
            value={v}
            onChange={(e) => handlePhysicsChange(k, parseFloat(e.target.value))}
          />
        </div>
      ))}
    </div>
  );
}
