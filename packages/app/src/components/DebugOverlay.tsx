import { useEffect, useState } from 'react';

export function DebugOverlay() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.__PROUN_DEBUG__) {
        setDebugInfo({ ...window.__PROUN_DEBUG__ });
      }
    }, 250);
    return () => clearInterval(interval);
  }, []);

  if (!debugInfo) return null;

  const hasErrors = debugInfo.errorCount > 0;

  return (
    <div style={{
      position: 'absolute',
      bottom: '16px',
      right: '70px',
      zIndex: 9999,
      fontFamily: 'monospace',
      fontSize: '11px',
      pointerEvents: 'auto'
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: hasErrors ? '#BF3B2B' : 'rgba(30,27,22,0.85)',
          color: '#E7DFCC',
          border: 'none',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
        }}
      >
        Отладчик {hasErrors ? `(Ошибок: ${debugInfo.errorCount})` : '✓'}
      </button>

      {open && (
        <div style={{
          marginTop: '6px',
          width: '380px',
          maxHeight: '300px',
          overflowY: 'auto',
          background: 'rgba(20,18,15,0.92)',
          color: '#E7DFCC',
          padding: '10px',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
        }}>
          <div style={{ fontWeight: 'bold', color: '#C99B3F', marginBottom: '4px' }}>
            PROUN RUNTIME MONITOR
          </div>
          <div>FPS: <b style={{ color: debugInfo.fps > 30 ? '#5A9' : '#F55' }}>{debugInfo.fps}</b> | Кадров: {debugInfo.loopCount}</div>
          <div>Аудио: <b style={{ color: debugInfo.audioState === 'running' ? '#5A9' : '#FA0' }}>{debugInfo.audioState}</b></div>
          <div>Игрок: X={debugInfo.playerPos?.x || 0}, Y={debugInfo.playerPos?.y || 0}</div>
          <div>Ошибок всего: <b style={{ color: hasErrors ? '#F55' : '#5A9' }}>{debugInfo.errorCount}</b></div>
          
          {debugInfo.lastError && (
            <div style={{ marginTop: '8px', padding: '6px', background: 'rgba(191,59,43,0.3)', borderRadius: '4px', color: '#FF9999', wordBreak: 'break-all' }}>
              <b>Последняя ошибка:</b>
              <br />
              {debugInfo.lastError}
            </div>
          )}

          <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.85 }}>
            <b>Журнал событий (последние):</b>
            {debugInfo.logs?.slice(-5).map((l: string, idx: number) => (
              <div key={idx} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
