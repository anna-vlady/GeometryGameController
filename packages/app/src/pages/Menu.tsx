import { useNavigate } from 'react-router-dom';

export function Menu() {
  const navigate = useNavigate();

  return (
    <div className="proun-overlay" onClick={() => navigate('/game')}>
      <div className="proun-title-tag">
        PROUN<b>&nbsp;//&nbsp;</b>CLOCKWORK ORNITHOLOGY
      </div>

      <h1>PRO<span className="red">UN</span></h1>
      <div className="sub">clockwork ornithology · ascent</div>

      <div className="proun-legend">
        <div className="proun-leg">
          <svg width="40" height="40"><rect x="6" y="6" width="28" height="28" fill="#BF3B2B" transform="rotate(8 20 20)" /></svg>
          <span>square<br />will</span>
        </div>
        <div className="proun-leg">
          <svg width="40" height="40"><circle cx="20" cy="20" r="13" fill="none" stroke="#1E1B16" strokeWidth="5" /></svg>
          <span>circle<br />calm</span>
        </div>
        <div className="proun-leg">
          <svg width="40" height="40"><polygon points="20,5 35,33 5,33" fill="#C99B3F" /></svg>
          <span>wedge<br />light</span>
        </div>
        <div className="proun-leg">
          <svg width="40" height="40"><rect x="-2" y="17" width="44" height="7" fill="#3F5666" transform="rotate(-32 20 20)" /></svg>
          <span>ray<br />birds</span>
        </div>
      </div>

      <div className="hint">
        goal — summit: 1000 meters up · thrust burns energy, particles replenish it ·
        headwind strengthens with altitude · full tanks stick harder in orbits,
        but mechanism orbits are free slingshots · mechanism rings are their scores:
        non-retrograde rhythms readable by eye and ear
      </div>

      <button className="start" onClick={() => navigate('/game')}>
        WASD — thrust · M — audio · R — restart · click anywhere to start
      </button>

      <button
        style={{
          marginTop: '18px',
          background: '#BF3B2B',
          color: '#FFF',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '900',
          letterSpacing: '1px',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(191,59,43,0.3)',
          transition: 'transform 0.1s ease'
        }}
        onClick={(e) => {
          e.stopPropagation();
          window.open('/controller', '_blank', 'width=420,height=750,resizable=yes');
        }}
      >
        🕹 OPEN CONTROLLER IN NEW WINDOW ↗
      </button>
    </div>
  );
}
