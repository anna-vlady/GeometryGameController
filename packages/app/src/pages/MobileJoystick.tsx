import { useState, useEffect, useRef } from 'react';

export function MobileJoystick() {
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(1);
  const [customRoom, setCustomRoom] = useState<string>('');
  const [connectionState, setConnectionState] = useState<'connecting' | 'online' | 'offline'>('connecting');
  const [activeBtn, setActiveBtn] = useState<'A' | 'B' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const joyVectorRef = useRef({ x: 0, y: 0 });
  const isPointerDownRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const joystickCenterRef = useRef({ x: 0, y: 0 });

  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const joystickThumbRef = useRef<HTMLDivElement>(null);

  const roomName = customRoom ? customRoom.toUpperCase() : `SLOT-${selectedPlayer || 1}`;

  // Ensure document body & root html background match controller color (#F9F7F1) edge-to-edge
  useEffect(() => {
    const origBodyBg = document.body.style.backgroundColor;
    const origDocBg = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = '#F9F7F1';
    document.documentElement.style.backgroundColor = '#F9F7F1';
    return () => {
      document.body.style.backgroundColor = origBodyBg;
      document.documentElement.style.backgroundColor = origDocBg;
    };
  }, []);

  // Read URL params e.g. ?player=1 or ?room=SLOT-1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('player')) {
      const p = parseInt(params.get('player') || '1', 10);
      if (p >= 1 && p <= 4) setSelectedPlayer(p);
    } else if (params.has('room')) {
      setCustomRoom(params.get('room') || '');
      setSelectedPlayer(1);
    }
  }, []);

  // WebSocket Connection Effect with Auto-Reconnect Loop
  useEffect(() => {
    if (!selectedPlayer && !customRoom) return;

    let socket: WebSocket | null = null;
    let isCleanedUp = false;
    let reconnectTimer: any = null;

    const connect = () => {
      if (isCleanedUp) return;

      const hostname = window.location.hostname || 'localhost';
      const isRemoteHost = hostname !== 'localhost' && hostname !== '127.0.0.1';
      const defaultWs = isRemoteHost ? 'wss://geometrygamecontroller.onrender.com' : 'ws://localhost:8085';
      const wsUrl = (import.meta.env as any).VITE_WS_URL || defaultWs;

      try {
        setConnectionState('connecting');
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (isCleanedUp) return;
          setConnectionState('online');
          socket?.send(JSON.stringify({ type: 'controller_join', room: roomName }));
        };

        socket.onclose = () => {
          if (isCleanedUp) return;
          setConnectionState('offline');
          reconnectTimer = setTimeout(connect, 1500);
        };

        socket.onerror = () => {
          if (isCleanedUp) return;
          setConnectionState('offline');
        };
      } catch (e) {
        setConnectionState('offline');
        reconnectTimer = setTimeout(connect, 1500);
      }
    };

    connect();

    return () => {
      isCleanedUp = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [selectedPlayer, customRoom, roomName]);

  // 40 Hz Send Loop
  useEffect(() => {
    if (!selectedPlayer && !customRoom) return;

    const interval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'controller_input',
          room: roomName,
          vector: joyVectorRef.current
        }));
      }
    }, 25);

    return () => clearInterval(interval);
  }, [selectedPlayer, customRoom, roomName]);

  // Universal Pointer Event Handlers (Mouse & Touch compatible)
  const handlePointerDown = (e: React.PointerEvent) => {
    isPointerDownRef.current = true;
    pointerIdRef.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (joystickBaseRef.current) {
      const rect = joystickBaseRef.current.getBoundingClientRect();
      joystickCenterRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }
    updatePointerJoystick(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    updatePointerJoystick(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerId === pointerIdRef.current || isPointerDownRef.current) {
      isPointerDownRef.current = false;
      pointerIdRef.current = null;
      joyVectorRef.current = { x: 0, y: 0 };
      if (joystickThumbRef.current) {
        joystickThumbRef.current.style.transform = 'translate(-50%, -50%)';
      }
    }
  };

  const handleReturnToSlotSelect = () => {
    setSelectedPlayer(null);
    setCustomRoom('');
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const updatePointerJoystick = (clientX: number, clientY: number) => {
    let maxRadius = 140;
    if (joystickBaseRef.current) {
      const rect = joystickBaseRef.current.getBoundingClientRect();
      maxRadius = Math.max(40, (rect.width / 2) - 18);
    }

    const dx = clientX - joystickCenterRef.current.x;
    const dy = clientY - joystickCenterRef.current.y;
    const dist = Math.hypot(dx, dy);

    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, maxRadius);

    const thumbX = Math.cos(angle) * clampedDist;
    const thumbY = Math.sin(angle) * clampedDist;

    if (joystickThumbRef.current) {
      joystickThumbRef.current.style.transform = `translate(calc(-50% + ${thumbX}px), calc(-50% + ${thumbY}px))`;
    }

    const normX = thumbX / maxRadius;
    const normY = thumbY / maxRadius;
    joyVectorRef.current = { x: normX, y: normY };
  };

  // Button Action Handlers (A & B)
  const handleButtonTap = (btn: 'A' | 'B') => {
    if (navigator.vibrate) navigator.vibrate(btn === 'A' ? 25 : 35);
    setActiveBtn(btn);
    setTimeout(() => setActiveBtn(null), 160);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'controller_input',
        room: roomName,
        vector: joyVectorRef.current,
        buttonTap: btn
      }));
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* STAGE 1: INTERMEDIATE PLAYER SELECT SCREEN                                 */
  /* -------------------------------------------------------------------------- */
  if (!selectedPlayer && !customRoom) {
    return (
      <div style={{
        width: '100vw',
        height: '100dvh',
        backgroundColor: '#F9F7F1',
        color: '#2B2D31',
        fontFamily: "'Inter', -apple-system, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          background: '#FFF',
          border: '2px solid #2B2D31',
          borderRadius: '16px',
          padding: '32px 24px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '3px', color: '#8C8A82', marginBottom: '8px' }}>
            GEOMETRY GAME CONTROLLER
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#2B2D31', margin: '0 0 20px 0' }}>
            SELECT <span style={{ color: '#D84234' }}>PLAYER</span>
          </h1>

          <p style={{ fontSize: '13px', color: '#8C8A82', lineHeight: '1.5', marginBottom: '24px' }}>
            Select your pilot slot number to connect joystick:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
            {[
              { num: 1, color: '#D84234', label: '🔴 PLAYER 1' },
              { num: 2, color: '#2B2D31', label: '⬛ PLAYER 2' },
              { num: 3, color: '#C99B3F', label: '🟡 PLAYER 3' },
              { num: 4, color: '#3F5666', label: '🔵 PLAYER 4' },
            ].map(p => (
              <button
                key={p.num}
                onClick={() => setSelectedPlayer(p.num)}
                style={{
                  background: '#F9F7F1',
                  color: p.color,
                  border: `2px solid ${p.color}`,
                  padding: '16px 10px',
                  borderRadius: '10px',
                  fontWeight: '900',
                  fontSize: '14px',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  transition: 'transform 0.1s ease'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #E5E2D8', paddingTop: '16px' }}>
            <div style={{ fontSize: '11px', color: '#8C8A82', marginBottom: '8px' }}>Or enter custom room PIN:</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="A8F2"
                maxLength={6}
                value={customRoom}
                onChange={(e) => setCustomRoom(e.target.value.toUpperCase())}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1.5px solid #2B2D31',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  letterSpacing: '2px'
                }}
              />
              <button
                onClick={() => { if (customRoom) setSelectedPlayer(1); }}
                style={{
                  background: '#2B2D31',
                  color: '#FFF',
                  border: 'none',
                  padding: '0 16px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const slotNum = selectedPlayer || 1;
  const slotColors: Record<number, { main: string, text: string, shape: string }> = {
    1: { main: '#D84234', text: '#FFF', shape: '🔴 P1' },
    2: { main: '#2B2D31', text: '#F9F7F1', shape: '⬛ P2' },
    3: { main: '#C99B3F', text: '#2B2D31', shape: '🟡 P3' },
    4: { main: '#3F5666', text: '#FFF', shape: '🔵 P4' }
  };
  const theme = slotColors[slotNum] || slotColors[1];

  /* -------------------------------------------------------------------------- */
  /* STAGE 2: 1-TO-1 AUTHENTIC GEOMETRYGAMECONTROLLER SCREEN                   */
  /* -------------------------------------------------------------------------- */
  return (
    <div style={{
      width: '100vw',
      height: '100dvh',
      backgroundColor: '#F9F7F1',
      color: '#2B2D31',
      fontFamily: "'Inter', -apple-system, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 'max(4px, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(6px, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left))',
      boxSizing: 'border-box',
      overflow: 'hidden',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      touchAction: 'none'
    }}>
      {/* Top Controls: Fullscreen Toggle */}
      <header style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: '100%',
        paddingBottom: '2px'
      }}>
        <button
          onClick={toggleFullscreen}
          aria-label="Toggle Fullscreen"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: '#2B2D31',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {isFullscreen ? (
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            ) : (
              <path d="M15 3h6v6M9 3H3v6m0 6v6h6m6 0h6v-6" />
            )}
          </svg>
        </button>
      </header>

      <style>{`
        .controller-main {
          display: flex;
          width: 100%;
          flex: 1;
          margin: 0 auto;
          box-sizing: border-box;
        }

        /* PORTRAIT MODE: Vertical orientation (Joystick top, status middle, stacked buttons bottom) */
        @media (orientation: portrait) {
          .controller-main {
            flex-direction: column;
            justify-content: space-evenly;
            align-items: center;
            padding: 4px 0;
          }
          .joystick-base {
            width: min(60vw, 220px, 26dvh) !important;
            height: min(60vw, 220px, 26dvh) !important;
          }
          .status-badge-container {
            flex-direction: row !important;
            gap: 10px !important;
            padding: 0 12px;
            flex-shrink: 0;
          }
          .status-button {
            padding: 8px 18px !important;
          }
          .action-buttons {
            display: flex;
            flex-direction: column !important;
            gap: 12px !important;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .action-btn {
            width: min(28vw, 115px) !important;
            height: min(28vw, 115px) !important;
            font-size: 30px !important;
          }
        }

        /* LANDSCAPE MODE: Horizontal orientation (Joystick left, status middle, side-by-side buttons right) */
        @media (orientation: landscape) {
          .controller-main {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            max-height: calc(100dvh - 32px);
          }
          .joystick-base {
            width: min(calc(100dvh - 36px), 50vw) !important;
            height: min(calc(100dvh - 36px), 50vw) !important;
            max-width: 92vh !important;
            max-height: 92vh !important;
          }
          .status-badge-container {
            flex-direction: row !important;
            gap: 10px !important;
            padding: 0 12px;
          }
          .status-button {
            padding: 10px 20px !important;
          }
          .action-buttons {
            display: flex;
            flex-direction: row !important;
            gap: 18px !important;
            align-items: center;
          }
          .action-btn {
            width: min(28vh, 138px) !important;
            height: min(28vh, 138px) !important;
            font-size: 34px !important;
          }
        }
      `}</style>

      {/* Main Viewport: Responsive (Vertical in Portrait, Horizontal in Landscape) */}
      <main className="controller-main">
        {/* Joystick Base */}
        <div
          ref={joystickBaseRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="joystick-base"
          style={{
            aspectRatio: '1 / 1',
            borderRadius: '50%',
            border: `6px solid ${theme.main}`,
            background: `${theme.main}1A`,
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            touchAction: 'none',
            cursor: 'grab',
            boxShadow: `0 10px 30px ${theme.main}33`,
            flexShrink: 0
          }}
        >
          {/* Tick mark guides */}
          <div style={{ position: 'absolute', width: '100%', height: '2px', background: `${theme.main}44` }} />
          <div style={{ position: 'absolute', width: '2px', height: '100%', background: `${theme.main}44` }} />

          {/* Thumb knob (Themed with Player Color & Badge) */}
          <div
            ref={joystickThumbRef}
            style={{
              width: '32%',
              height: '32%',
              borderRadius: '50%',
              background: theme.main,
              color: theme.text,
              border: '4px solid #F9F7F1',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              pointerEvents: 'none',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontWeight: '900',
              fontSize: '18px',
              letterSpacing: '1px'
            }}
          >
            P{slotNum}
          </div>
        </div>

        {/* Center: SLOT button & Glowing LED Connection Indicator */}
        <div className="status-badge-container" style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}>
          <button
            onClick={handleReturnToSlotSelect}
            className="status-button"
            style={{
              background: theme.main,
              color: theme.text,
              border: 'none',
              borderRadius: '24px',
              fontSize: '13px',
              fontWeight: '900',
              cursor: 'pointer',
              letterSpacing: '1.5px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          >
            ⚙ P{slotNum} · {roomName}
          </button>

          {/* Status LED Dot (Green when connected, Red when disconnected) */}
          <div
            title={connectionState === 'online' ? 'Connected' : connectionState === 'connecting' ? 'Connecting...' : 'Disconnected'}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: connectionState === 'online' ? '#4CAF50' : '#D84234',
              boxShadow: connectionState === 'online'
                ? '0 0 10px #4CAF50, 0 0 4px #4CAF50'
                : '0 0 10px #D84234, 0 0 4px #D84234',
              border: '2px solid #F9F7F1',
              flexShrink: 0,
              transition: 'background-color 0.3s ease, box-shadow 0.3s ease'
            }}
          />
        </div>

        {/* Action Buttons A (PATA) and B (PON) - Stacked vertically in Portrait, side-by-side in Landscape */}
        <div className="action-buttons">
          {/* Button A - Red (PATA) */}
          <button
            onPointerDown={(e) => { e.preventDefault(); handleButtonTap('A'); }}
            className="action-btn"
            style={{
              borderRadius: '50%',
              background: activeBtn === 'A' ? '#B53225' : '#D84234',
              color: '#FFF',
              border: 'none',
              fontWeight: '900',
              letterSpacing: '1px',
              boxShadow: '0 8px 24px rgba(216,66,52,0.45)',
              cursor: 'pointer',
              transform: activeBtn === 'A' ? 'scale(0.92)' : 'scale(1)',
              transition: 'transform 0.08s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            A
            <div style={{ fontSize: '10px', fontWeight: 'bold', opacity: 0.85, marginTop: '2px' }}>PATA</div>
          </button>

          {/* Button B - Charcoal / Gold Accent (PON) */}
          <button
            onPointerDown={(e) => { e.preventDefault(); handleButtonTap('B'); }}
            className="action-btn"
            style={{
              borderRadius: '50%',
              background: activeBtn === 'B' ? '#17181B' : '#2B2D31',
              color: '#F9F7F1',
              border: 'none',
              fontWeight: '900',
              letterSpacing: '1px',
              boxShadow: '0 8px 24px rgba(43,45,49,0.45)',
              cursor: 'pointer',
              transform: activeBtn === 'B' ? 'scale(0.92)' : 'scale(1)',
              transition: 'transform 0.08s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            B
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#C99B3F', marginTop: '2px' }}>PON</div>
          </button>
        </div>
      </main>

      {/* Footer Info */}
      <footer style={{ textAlign: 'center', fontSize: '10px', color: '#8C8A82', paddingBottom: '2px' }}>
        PROUN ORNITHOLOGY · GEOMETRY CONTROLLER
      </footer>
    </div>
  );
}
