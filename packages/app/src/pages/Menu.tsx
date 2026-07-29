import { useNavigate } from 'react-router-dom';

export function Menu() {
  const navigate = useNavigate();

  return (
    <div className="proun-overlay" onClick={() => navigate('/game')}>
      <div className="proun-title-tag">
        ПРОУН<b>&nbsp;//&nbsp;</b>ЗАВОДНАЯ ОРНИТОЛОГИЯ
      </div>

      <h1>ПРО<span className="red">УН</span></h1>
      <div className="sub">заводная орнитология · восхождение</div>

      <div className="proun-legend">
        <div className="proun-leg">
          <svg width="40" height="40"><rect x="6" y="6" width="28" height="28" fill="#BF3B2B" transform="rotate(8 20 20)" /></svg>
          <span>квадрат<br />воля</span>
        </div>
        <div className="proun-leg">
          <svg width="40" height="40"><circle cx="20" cy="20" r="13" fill="none" stroke="#1E1B16" strokeWidth="5" /></svg>
          <span>круг<br />покой</span>
        </div>
        <div className="proun-leg">
          <svg width="40" height="40"><polygon points="20,5 35,33 5,33" fill="#C99B3F" /></svg>
          <span>клин<br />свет</span>
        </div>
        <div className="proun-leg">
          <svg width="40" height="40"><rect x="-2" y="17" width="44" height="7" fill="#3F5666" transform="rotate(-32 20 20)" /></svg>
          <span>луч<br />птицы</span>
        </div>
      </div>

      <div className="hint">
        цель — вершина: 1000 метров вверх · тяга жжёт энергию, частицы её восполняют ·
        встречный поток крепнет с высотой · полные баки сильнее вязнут в орбитах,
        но орбиты механизмов — бесплатные пращи · кольца механизмов — их партитуры:
        необратимые ритмы читаются и глазом, и ухом
      </div>

      <button className="start" onClick={() => navigate('/game')}>
        WASD — тяга · M — звук · R — заново · нажмите, чтобы начать
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
        🕹 ОТКРЫТЬ ДЖОЙСТИК В ОТДЕЛЬНОМ ОКНЕ ↗
      </button>
    </div>
  );
}
