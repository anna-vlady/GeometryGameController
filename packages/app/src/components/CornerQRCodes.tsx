import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export function CornerQRCodes() {
  const STORAGE_HOST = 'proun_controller_host';

  const [controllerHost] = useState(() => {
    const saved = localStorage.getItem(STORAGE_HOST);
    if (saved) return saved;
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${window.location.protocol}//192.168.1.213:${window.location.port || '5173'}`;
      }
      return window.location.origin;
    }
    return 'http://192.168.1.213:5173';
  });

  // Auto-join player 1 when scanning QR code
  const controllerUrl = `${controllerHost.replace(/\/$/, '')}/#/controller?player=1`;

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        right: '60px',
        background: '#E7DFCC',
        border: '2px solid #1E1B16',
        borderRadius: '8px',
        padding: '8px 10px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'auto',
        zIndex: 15
      }}
    >
      <div
        style={{
          fontSize: '9px',
          fontWeight: '900',
          color: '#1E1B16',
          letterSpacing: '0.5px',
          marginBottom: '4px',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '3px'
        }}
      >
        <span style={{ color: '#BF3B2B' }}>🕹</span> CONTROLLER
      </div>
      <div
        style={{
          background: '#FFF',
          padding: '5px',
          borderRadius: '4px',
          border: '1.5px solid #1E1B16',
          display: 'flex'
        }}
        title={`Scan to connect controller: ${controllerUrl}`}
      >
        <QRCodeSVG
          value={controllerUrl}
          size={84}
          bgColor="#FFFFFF"
          fgColor="#1E1B16"
          level="L"
        />
      </div>
    </div>
  );
}
