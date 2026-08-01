import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export function CornerQRCodes() {
  const STORAGE_SSID = 'proun_wifi_ssid';
  const STORAGE_PASS = 'proun_wifi_pass';
  const STORAGE_ENC = 'proun_wifi_enc';
  const STORAGE_HOST = 'proun_controller_host';

  const [ssid, setSsid] = useState(() => localStorage.getItem(STORAGE_SSID) || 'hosq_2floor');
  const [password, setPassword] = useState(() => localStorage.getItem(STORAGE_PASS) || 'hosqhosq');
  const [encryption] = useState<'WPA' | 'WEP' | 'nopass'>(
    () => (localStorage.getItem(STORAGE_ENC) as any) || 'WPA'
  );

  const [controllerHost] = useState(() => {
    const saved = localStorage.getItem(STORAGE_HOST);
    if (saved) return saved;
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // If opened on localhost on host PC, replace localhost with network IP so mobile camera scan works
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${window.location.protocol}//192.168.1.213:${window.location.port || '5173'}`;
      }
      return window.location.origin;
    }
    return 'http://192.168.1.213:5173';
  });

  // Listen to storage changes if updated in Settings
  useEffect(() => {
    const handleStorage = () => {
      setSsid(localStorage.getItem(STORAGE_SSID) || 'hosq_2floor');
      setPassword(localStorage.getItem(STORAGE_PASS) || 'hosqhosq');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const wifiQrString = encryption === 'nopass'
    ? `WIFI:S:${ssid};T:nopass;;`
    : `WIFI:S:${ssid};T:${encryption};P:${password};;`;

  const controllerUrl = `${controllerHost.replace(/\/$/, '')}/controller`;

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        right: '60px', // Positioned nicely near top-right corner without covering altimeter top label
        background: '#E7DFCC',
        border: '2px solid #1E1B16',
        borderRadius: '8px',
        padding: '8px 10px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        pointerEvents: 'auto',
        zIndex: 15
      }}
    >
      {/* 1. Wi-Fi QR Code */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
          <span style={{ color: '#C99B3F' }}>📶</span> WI-FI
        </div>
        <div
          style={{
            background: '#FFF',
            padding: '5px',
            borderRadius: '4px',
            border: '1.5px solid #1E1B16',
            display: 'flex'
          }}
          title={`Connect to Wi-Fi: ${ssid}`}
        >
          <QRCodeSVG
            value={wifiQrString}
            size={76}
            bgColor="#FFFFFF"
            fgColor="#1E1B16"
            level="L"
          />
        </div>
      </div>

      {/* Suprematist Divider Line */}
      <div style={{ width: '1px', height: '80px', backgroundColor: 'rgba(30,27,22,0.25)' }} />

      {/* 2. Controller QR Code */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
          title={`Open Controller: ${controllerUrl}`}
        >
          <QRCodeSVG
            value={controllerUrl}
            size={76}
            bgColor="#FFFFFF"
            fgColor="#1E1B16"
            level="L"
          />
        </div>
      </div>
    </div>
  );
}
