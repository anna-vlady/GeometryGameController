import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeModal({ isOpen, onClose }: QRCodeModalProps) {
  // Local storage keys
  const STORAGE_SSID = 'proun_wifi_ssid';
  const STORAGE_PASS = 'proun_wifi_pass';
  const STORAGE_ENC = 'proun_wifi_enc';
  const STORAGE_HOST = 'proun_controller_host';

  const [ssid, setSsid] = useState(() => localStorage.getItem(STORAGE_SSID) || 'Proun-WiFi');
  const [password, setPassword] = useState(() => localStorage.getItem(STORAGE_PASS) || '');
  const [encryption, setEncryption] = useState<'WPA' | 'WEP' | 'nopass'>(
    () => (localStorage.getItem(STORAGE_ENC) as any) || 'WPA'
  );

  const [controllerHost, setControllerHost] = useState(() => {
    const saved = localStorage.getItem(STORAGE_HOST);
    if (saved) return saved;
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  });

  const [activeTab, setActiveTab] = useState<'both' | 'controller' | 'wifi'>('both');
  const [copied, setCopied] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_SSID, ssid);
  }, [ssid]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PASS, password);
  }, [password]);

  useEffect(() => {
    localStorage.setItem(STORAGE_ENC, encryption);
  }, [encryption]);

  useEffect(() => {
    localStorage.setItem(STORAGE_HOST, controllerHost);
  }, [controllerHost]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Construct QR strings
  const wifiQrString = encryption === 'nopass'
    ? `WIFI:S:${ssid};T:nopass;;`
    : `WIFI:S:${ssid};T:${encryption};P:${password};;`;

  const controllerUrl = `${controllerHost.replace(/\/$/, '')}/controller`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(controllerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(18, 16, 13, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#E7DFCC',
          border: '2px solid #1E1B16',
          borderRadius: '12px',
          width: '100%',
          maxWidth: activeTab === 'both' ? '680px' : '400px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: 'max-width 0.3s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: '#1E1B16',
            color: '#E7DFCC',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #BF3B2B'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', letterSpacing: '1px', fontSize: '13px' }}>
            <span style={{ color: '#BF3B2B' }}>✦</span>
            <span>ПРОУН // QR ПОДКЛЮЧЕНИЕ</span>
          </div>

          {/* View Tab Selector */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', padding: '2px' }}>
            <button
              onClick={() => setActiveTab('both')}
              style={{
                background: activeTab === 'both' ? '#BF3B2B' : 'transparent',
                color: '#FFF',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ВСЁ
            </button>
            <button
              onClick={() => setActiveTab('controller')}
              style={{
                background: activeTab === 'controller' ? '#BF3B2B' : 'transparent',
                color: '#FFF',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🕹 ДЖОЙСТИК
            </button>
            <button
              onClick={() => setActiveTab('wifi')}
              style={{
                background: activeTab === 'wifi' ? '#BF3B2B' : 'transparent',
                color: '#FFF',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              📶 WI-FI
            </button>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#E7DFCC',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px 8px',
              borderRadius: '4px'
            }}
            title="Закрыть (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          
          {/* Card 1: Mobile Joystick QR */}
          {(activeTab === 'both' || activeTab === 'controller') && (
            <div
              style={{
                flex: 1,
                minWidth: '280px',
                background: '#F2EBD9',
                border: '1px solid rgba(30,27,22,0.2)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '900', color: '#BF3B2B', letterSpacing: '1px', marginBottom: '4px', textTransform: 'uppercase' }}>
                1. Мобильный Веб-Джойстик
              </div>
              <div style={{ fontSize: '11px', color: '#555', textAlign: 'center', marginBottom: '12px' }}>
                Отсканируйте камерой смартфона для управления кораблём
              </div>

              {/* QR Code Container */}
              <div
                style={{
                  background: '#FFF',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #1E1B16',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  marginBottom: '12px'
                }}
              >
                <QRCodeSVG
                  value={controllerUrl}
                  size={160}
                  bgColor="#FFFFFF"
                  fgColor="#1E1B16"
                  level="M"
                />
              </div>

              {/* Editable Host URL */}
              <div style={{ width: '100%', marginTop: 'auto' }}>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: '900', color: '#666', marginBottom: '3px' }}>
                  АДРЕС СЕРВЕРА (URL / IP):
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    value={controllerHost}
                    onChange={(e) => setControllerHost(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      border: '1px solid #1E1B16',
                      borderRadius: '4px',
                      background: '#FFF',
                      color: '#1E1B16'
                    }}
                  />
                  <button
                    onClick={handleCopyUrl}
                    style={{
                      background: copied ? '#4CAF50' : '#1E1B16',
                      color: '#FFF',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    {copied ? '✓' : 'Копия'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Card 2: Wi-Fi Quick Connect QR */}
          {(activeTab === 'both' || activeTab === 'wifi') && (
            <div
              style={{
                flex: 1,
                minWidth: '280px',
                background: '#F2EBD9',
                border: '1px solid rgba(30,27,22,0.2)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '900', color: '#C99B3F', letterSpacing: '1px', marginBottom: '4px', textTransform: 'uppercase' }}>
                2. Подключение к Wi-Fi Без Пароля
              </div>
              <div style={{ fontSize: '11px', color: '#555', textAlign: 'center', marginBottom: '12px' }}>
                Сканирование подставит сеть и пароль автоматически
              </div>

              {/* QR Code Container */}
              <div
                style={{
                  background: '#FFF',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #1E1B16',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  marginBottom: '12px'
                }}
              >
                <QRCodeSVG
                  value={wifiQrString}
                  size={160}
                  bgColor="#FFFFFF"
                  fgColor="#1E1B16"
                  level="M"
                />
              </div>

              {/* Wi-Fi Configuration Inputs */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: '9px', fontWeight: '900', color: '#666', marginBottom: '2px' }}>
                      ИМЯ СЕТИ (SSID):
                    </label>
                    <input
                      type="text"
                      value={ssid}
                      onChange={(e) => setSsid(e.target.value)}
                      placeholder="Имя сети Wi-Fi"
                      style={{
                        width: '100%',
                        padding: '5px 8px',
                        fontSize: '11px',
                        border: '1px solid #1E1B16',
                        borderRadius: '4px',
                        background: '#FFF',
                        color: '#1E1B16'
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '9px', fontWeight: '900', color: '#666', marginBottom: '2px' }}>
                      ШИФРОВАНИЕ:
                    </label>
                    <select
                      value={encryption}
                      onChange={(e) => setEncryption(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '5px 4px',
                        fontSize: '11px',
                        border: '1px solid #1E1B16',
                        borderRadius: '4px',
                        background: '#FFF',
                        color: '#1E1B16'
                      }}
                    >
                      <option value="WPA">WPA/WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">Открытая</option>
                    </select>
                  </div>
                </div>

                {encryption !== 'nopass' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '9px', fontWeight: '900', color: '#666', marginBottom: '2px' }}>
                      ПАРОЛЬ WI-FI:
                    </label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Пароль сети (если есть)"
                      style={{
                        width: '100%',
                        padding: '5px 8px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        border: '1px solid #1E1B16',
                        borderRadius: '4px',
                        background: '#FFF',
                        color: '#1E1B16'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div
          style={{
            background: 'rgba(30,27,22,0.06)',
            borderTop: '1px solid rgba(30,27,22,0.1)',
            padding: '10px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '10px',
            color: '#666'
          }}
        >
          <span>💡 Подключите телефон к Wi-Fi сети, затем откройте джойстик</span>
          <button
            onClick={onClose}
            style={{
              background: '#1E1B16',
              color: '#E7DFCC',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '4px',
              fontWeight: 'bold',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            ЗАКРЫТЬ
          </button>
        </div>
      </div>
    </div>
  );
}
