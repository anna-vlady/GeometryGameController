import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export function ControllerSettings() {
  const [roomPin, setRoomPin] = useState('A8F2');
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState(false);
  const [testStick, setTestStick] = useState({ x: 0, y: 0 });
  const [lastButton, setLastButton] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const controllerUrl = `https://anna-vlady.github.io/GeometryGameController/?room=${roomPin}`;

  useEffect(() => {
    // Generate random room PIN on mount if not set
    const pin = Math.random().toString(36).substring(2, 6).toUpperCase();
    setRoomPin(pin);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(controllerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render Interactive Input Tester Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Background grid
      ctx.fillStyle = '#F2EBD9';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(30,27,22,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
      ctx.moveTo(0, cy); ctx.lineTo(w, cy);
      ctx.stroke();

      // Outer joystick boundary ring
      ctx.strokeStyle = '#1E1B16';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 65, 0, Math.PI * 2);
      ctx.stroke();

      // Remote stick position
      const stickX = cx + testStick.x * 60;
      const stickY = cy + testStick.y * 60;

      // Connecting line
      ctx.strokeStyle = '#BF3B2B';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(stickX, stickY);
      ctx.stroke();

      // Thumb knob
      ctx.fillStyle = '#BF3B2B';
      ctx.beginPath();
      ctx.arc(stickX, stickY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1E1B16';
      ctx.lineWidth = 2;
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [testStick]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#E7DFCC',
      color: '#1E1B16',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      padding: '30px 20px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Title */}
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '3px', margin: '0 0 8px 0' }}>
          MOBILE <span style={{ color: '#BF3B2B' }}>CONTROLLER SETTINGS</span>
        </h1>
        <p style={{ color: 'rgba(30,27,22,0.65)', fontSize: '14px', margin: 0 }}>
          Control the game from any smartphone screen using GeometryGameController
        </p>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        width: '100%',
        maxWidth: '900px'
      }}>
        {/* Card 1: Room & Connection */}
        <div style={{
          background: 'rgba(242,235,217,0.85)',
          border: '2px solid #1E1B16',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
        }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', borderBottom: '1px solid rgba(30,27,22,0.2)', paddingBottom: '8px' }}>
            🔑 Room PIN Code
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{
              fontSize: '32px',
              fontWeight: '900',
              letterSpacing: '6px',
              color: '#BF3B2B',
              background: '#E7DFCC',
              padding: '6px 16px',
              borderRadius: '8px',
              border: '1.5px solid #1E1B16'
            }}>
              {roomPin}
            </span>
            <button
              onClick={() => {
                setRoomPin(Math.random().toString(36).substring(2, 6).toUpperCase());
                setConnected(false);
              }}
              style={{
                background: '#1E1B16',
                color: '#E7DFCC',
                border: 'none',
                padding: '10px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            >
              New PIN
            </button>
          </div>

          <div style={{
            display: 'inline-block',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
            marginBottom: '16px',
            background: connected ? 'rgba(76, 175, 80, 0.15)' : 'rgba(30,27,22,0.08)',
            color: connected ? '#2E7D32' : 'rgba(30,27,22,0.6)',
            border: '1px solid ' + (connected ? '#4CAF50' : 'rgba(30,27,22,0.2)')
          }}>
            {connected ? '🟢 Mobile Controller Connected' : '⚪ Waiting for controller connection...'}
          </div>

          <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'rgba(30,27,22,0.8)', marginBottom: '16px' }}>
            Open the controller on your smartphone or browser and select slot <b>Player 1-4</b>:
          </p>

          <a
            href="/controller"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'block',
              textAlign: 'center',
              background: '#2B2D31',
              color: '#FFF',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
              textDecoration: 'none',
              marginBottom: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            🕹 Open Mobile Controller (Player 1–4)
          </a>

          <button
            onClick={handleCopyLink}
            style={{
              width: '100%',
              background: '#BF3B2B',
              color: '#FFF',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(191,59,43,0.3)'
            }}
          >
            {copied ? '✓ Link Copied!' : '📋 Copy Direct Controller Link'}
          </button>
        </div>

        {/* Card 2: Interactive Input Tester */}
        <div style={{
          background: 'rgba(242,235,217,0.85)',
          border: '2px solid #1E1B16',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', width: '100%', borderBottom: '1px solid rgba(30,27,22,0.2)', paddingBottom: '8px' }}>
            🕹 Interactive Input Tester
          </h2>

          <canvas
            ref={canvasRef}
            width={160}
            height={160}
            style={{
              borderRadius: '100px',
              border: '2px solid #1E1B16',
              marginBottom: '16px'
            }}
          />

          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <button
              onMouseDown={() => { setLastButton('A (PATA)'); setTestStick({ x: -0.6, y: -0.6 }); }}
              onMouseUp={() => { setTestStick({ x: 0, y: 0 }); }}
              style={{
                background: '#BF3B2B',
                color: '#FFF',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Button A (PATA)
            </button>
            <button
              onMouseDown={() => { setLastButton('B (PON)'); setTestStick({ x: 0.6, y: 0.6 }); }}
              onMouseUp={() => { setTestStick({ x: 0, y: 0 }); }}
              style={{
                background: '#C99B3F',
                color: '#1E1B16',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Button B (PON)
            </button>
          </div>

          {lastButton && (
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#BF3B2B' }}>
              Pressed: {lastButton}
            </div>
          )}
        </div>
      </div>

      {/* Back Button */}
      <div style={{ marginTop: '40px' }}>
        <Link
          to="/"
          style={{
            background: '#1E1B16',
            color: '#E7DFCC',
            padding: '14px 28px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '15px',
            letterSpacing: '1px',
            boxShadow: '0 6px 16px rgba(0,0,0,0.15)'
          }}
        >
          🚀 RETURN TO FLIGHT
        </Link>
      </div>
    </div>
  );
}
