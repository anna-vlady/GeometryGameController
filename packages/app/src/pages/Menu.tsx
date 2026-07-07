import { useNavigate } from 'react-router-dom';

export function Menu() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100vh', backgroundColor: '#F2EBD9',
      color: '#1E1B16', fontFamily: 'sans-serif'
    }}>
      <h1>ПРОУН</h1>
      <p style={{ maxWidth: '400px', textAlign: 'center' }}>
        Музыкально-гравитационное восхождение. 
        Нажмите старт, чтобы начать генерацию вселенной Лисицкого.
      </p>
      <button 
        onClick={() => navigate('/game')}
        style={{
          padding: '12px 24px', fontSize: '18px',
          border: '2px solid #1E1B16', backgroundColor: '#F2EBD9',
          cursor: 'pointer', marginTop: '20px'
        }}
      >
        НАЧАТЬ
      </button>
    </div>
  );
}
