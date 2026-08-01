import { ProunEngine } from '@proun/engine';

export class MultiplayerClient {
  ws: WebSocket | null = null;
  id: string | null = null;
  netPlayersMap = new Map<string, any>();
  intervalId: any = null;

  constructor(public engine: ProunEngine, public serverUrl?: string) {
    if (!this.serverUrl) {
      const envUrl = (import.meta as any).env?.VITE_WS_URL;
      if (envUrl) {
        this.serverUrl = envUrl;
      } else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        this.serverUrl = 'wss://geometrygamecontroller.onrender.com';
      } else {
        this.serverUrl = 'ws://localhost:8085';
      }
    }
  }

  logDebug(msg: string) {
    if (typeof window !== 'undefined' && window.__PROUN_DEBUG__) {
      window.__PROUN_DEBUG__.log(`[Multiplayer] ${msg}`);
    }
  }

  connect() {
    try {
      this.logDebug(`Connecting to ${this.serverUrl}...`);
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        console.log('[Multiplayer] Connected to Proun Server');
        this.logDebug('Connected to server');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'init') {
            this.id = data.id;
            this.logDebug(`Assigned Pilot ID: ${this.id}`);
          } else if (data.type === 'player_update') {
            if (data.id && data.state && typeof data.state.x === 'number' && typeof data.state.y === 'number') {
              const existing = this.netPlayersMap.get(data.id);
              if (existing) {
                existing.targetX = data.state.x;
                existing.targetY = data.state.y;
                existing.targetVx = data.state.vx || 0;
                existing.targetVy = data.state.vy || 0;
                existing.tanks = data.state.tanks || existing.tanks;
                existing.orbs = data.state.orbs || existing.orbs;
                existing.name = data.state.name || existing.name;
              } else {
                this.netPlayersMap.set(data.id, {
                  id: data.id,
                  x: data.state.x,
                  y: data.state.y,
                  vx: data.state.vx || 0,
                  vy: data.state.vy || 0,
                  targetX: data.state.x,
                  targetY: data.state.y,
                  targetVx: data.state.vx || 0,
                  targetVy: data.state.vy || 0,
                  tanks: data.state.tanks || [6, 6, 6, 6],
                  orbs: data.state.orbs || [],
                  name: data.state.name
                });
              }
              this.updateEngineNetPlayers();
            }
          } else if (data.type === 'controller_status') {
            if (this.engine && data.room) {
              this.engine.activateSlot(data.room);
              this.logDebug(`Controller ${data.connected ? 'connected' : 'disconnected'} to Room ${data.room}`);
            }
          } else if (data.type === 'remote_input') {
            if (this.engine && data.room) {
              this.engine.activateSlot(data.room);
              const slot = this.engine.slots.find(s => s.slotId.toUpperCase() === data.room.toUpperCase());
              if (slot) {
                if (data.vector && typeof data.vector.x === 'number' && typeof data.vector.y === 'number') {
                  slot.remoteStick.x = data.vector.x;
                  slot.remoteStick.y = data.vector.y;
                }
                if (data.buttonTap === 'A') {
                  this.engine.onRhythmTap('KeyJ', data.room);
                }
                if (data.buttonTap === 'B') {
                  this.engine.onRhythmTap('KeyK', data.room);
                }
              }
            }
          } else if (data.type === 'player_leave') {
            this.netPlayersMap.delete(data.id);
            this.updateEngineNetPlayers();
            this.logDebug(`Player left: ${data.id}`);
          }
        } catch (e: any) {
          console.error('[Multiplayer] Message error:', e);
          this.logDebug(`Message error: ${e.message}`);
        }
      };

      this.ws.onerror = () => {
        console.warn('[Multiplayer] Connection error');
        this.logDebug('WebSocket Connection Error');
      };

      this.ws.onclose = () => {
        console.log('[Multiplayer] Disconnected from server');
        this.logDebug('Disconnected from server');
        this.stopSync();
      };

      this.startSync();
    } catch (e: any) {
      console.warn('[Multiplayer] Failed to connect to server:', e);
      this.logDebug(`Failed connect: ${e.message}`);
    }
  }

  startSync() {
    this.intervalId = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN && this.engine && this.engine.player) {
        const px = Number(this.engine.player.x);
        const py = Number(this.engine.player.y);
        const pvx = Number(this.engine.player.vx);
        const pvy = Number(this.engine.player.vy);

        if (!isNaN(px) && !isNaN(py)) {
          const orbsData = this.engine.player.orbs ? this.engine.player.orbs.map(o => ({
            ox: o.ox,
            oy: o.oy,
            energy: o.energy
          })) : [];

          this.ws.send(JSON.stringify({
            type: 'state',
            state: {
              x: px,
              y: py,
              vx: isNaN(pvx) ? 0 : pvx,
              vy: isNaN(pvy) ? 0 : pvy,
              tanks: this.engine.tanks,
              orbs: orbsData,
              name: `${this.engine.roomPin} (${this.id ? this.id.substring(0, 4) : 'local'})`
            }
          }));
        }
      }
    }, 25);
  }

  stopSync() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  updateEngineNetPlayers() {
    if (this.engine) {
      this.engine.netPlayers = Array.from(this.netPlayersMap.values());
    }
  }

  disconnect() {
    this.stopSync();
    if (this.ws) this.ws.close();
  }
}
