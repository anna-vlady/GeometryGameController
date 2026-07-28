import { Player, FxState } from '../physics/types';
import { createPlayer } from '../physics/player';
import { WorldGenerator, ringPos } from '../world/generator';
import { WORLD_SEED } from '../world/constants';
import { updateEngine } from '../physics/update';
import { AudioManager } from '../audio/audioManager';
import { modeFreq } from '../audio/utils';
import { Renderer } from '../renderer/renderer';
import { Mech, Voice, PlayerSlot } from '../world/types';
import { MAXTANK, SPAWN, SINGLE_BOOST_DUR, RHYTHM_BOOST_DUR, RHYTHM_TOLERANCE } from '../physics/constants';
import { OCT } from '../world/constants';
import { levelRegistry, LevelConfig } from '../levels';



export interface EngineConfig {
  canvas: HTMLCanvasElement;
  seed?: number;
}

const TAU = Math.PI * 2;

import { Shockwave, NetPlayer } from '../world/types';

declare global {
  interface Window {
    __PROUN_DEBUG__?: {
      fps: number;
      loopCount: number;
      errorCount: number;
      lastError: string | null;
      audioState: string;
      playerPos: { x: number; y: number };
      logs: string[];
      log: (msg: string) => void;
    };
  }
}

if (typeof window !== 'undefined' && !window.__PROUN_DEBUG__) {
  window.__PROUN_DEBUG__ = {
    fps: 0,
    loopCount: 0,
    errorCount: 0,
    lastError: null,
    audioState: 'unknown',
    playerPos: { x: 0, y: 0 },
    logs: [],
    log: (msg: string) => {
      const dbg = window.__PROUN_DEBUG__;
      if (dbg) {
        dbg.logs.push(`[${new Date().toISOString().substring(11, 19)}] ${msg}`);
        if (dbg.logs.length > 50) dbg.logs.shift();
      }
    }
  };

  window.addEventListener('error', (e) => {
    if (window.__PROUN_DEBUG__) {
      window.__PROUN_DEBUG__.errorCount++;
      window.__PROUN_DEBUG__.lastError = `${e.message} at ${e.filename}:${e.lineno}`;
      window.__PROUN_DEBUG__.log(`UNCAUGHT ERROR: ${e.message}`);
    }
  });
}

export class ProunEngine {
  canvas: HTMLCanvasElement;
  world: WorldGenerator;
  audio: AudioManager;
  renderer: Renderer;
  player: Player;
  fx: FxState;

  tanks: number[] = [0, 0, 0, 0];
  collectFlash: number[] = [0, 0, 0, 0];
  dominant: Mech | null = null;
  started = false;
  won = false;
  t0 = 0;
  particleFrac = 0.7;

  lastT = 0;
  frameId = 0;
  notesBudget = 14;
  nearbyCache: Mech[] = [];
  evCd = 0;
  keys = new Set<string>();

  shockwaves: Shockwave[] = [];
  netPlayers: NetPlayer[] = [];
  tapHistory: Array<{ key: string; time: number }> = [];
  comboFeedback = '';
  comboFlash = 0;
  coopTandem = false;
  coopBeam = false;
  slots: PlayerSlot[] = [];
  roomPin = 'SLOT-1';
  controllerConnected = false;

  constructor(config: EngineConfig) {
    this.canvas = config.canvas;
    const seed = config.seed || WORLD_SEED;

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('player')) {
        const p = parseInt(params.get('player') || '1', 10);
        this.roomPin = `SLOT-${Math.max(1, Math.min(4, p))}`;
      } else if (params.has('slot')) {
        const s = parseInt(params.get('slot') || '1', 10);
        this.roomPin = `SLOT-${Math.max(1, Math.min(4, s))}`;
      } else if (params.has('room')) {
        this.roomPin = (params.get('room') || 'SLOT-1').toUpperCase();
      }
    }

    const slotColors = ['#BF3B2B', '#1E1B16', '#C99B3F', '#3F5666'];
    this.slots = [1, 2, 3, 4].map(num => ({
      slotId: `SLOT-${num}`,
      num,
      name: `Игрок ${num}`,
      color: slotColors[num - 1],
      active: num === 1,
      connected: false,
      player: createPlayer(),
      tanks: [0, 0, 0, 0],
      collectFlash: [0, 0, 0, 0],
      remoteStick: { x: 0, y: 0 },
      boostTimer: 0,
      magnetTimer: 0
    }));

    this.world = new WorldGenerator(seed);
    this.audio = new AudioManager();
    this.renderer = new Renderer(this.canvas);
    this.player = this.slots[0].player;
    this.tanks = this.slots[0].tanks;
    this.collectFlash = this.slots[0].collectFlash;
    this.fx = { strobe: 0, distort: 0, stutter: 0, shocks: [] };

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
  }

  activateSlot(slotId: string) {
    const s = this.slots.find(x => x.slotId.toUpperCase() === slotId.toUpperCase());
    if (s) {
      if (!s.active) {
        s.active = true;
        s.player.x = this.slots[0].player.x + (s.num - 1) * 45;
        s.player.y = this.slots[0].player.y;
      }
      s.connected = true;
    }
  }

  handleKeyDown(e: KeyboardEvent) {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
    if (e.code === 'KeyM') this.audio.toggleMute();
    if (e.code === 'KeyR') this.restart();

    if (e.code === 'KeyJ' || e.code === 'KeyK') {
      this.onRhythmTap(e.code);
    }

    this.keys.add(e.code);
    this.start();
  }

  onRhythmTap(key: string, slotId?: string) {
    const now = performance.now();
    const targetSlot = this.slots.find(s => s.slotId.toUpperCase() === (slotId || this.roomPin).toUpperCase()) || this.slots[0];

    this.tapHistory.push({ key, time: now });
    if (this.tapHistory.length > 8) this.tapHistory.shift();

    // 1. Single-tap action effects
    if (key === 'KeyJ') {
      this.audio.playPata();
      this.fx.shocks.push({ x: targetSlot.player.x, y: targetSlot.player.y, r: 15, v: 320, life: 0.35 });
      this.comboFeedback = 'PATA!';
      this.comboFlash = 0.5;
      targetSlot.collectFlash[0] = 1;
    } else if (key === 'KeyK') {
      this.audio.playPon();
      this.fx.shocks.push({ x: targetSlot.player.x, y: targetSlot.player.y, r: 25, v: 450, life: 0.45 });
      this.comboFeedback = 'PON!';
      this.comboFlash = 0.5;
      // Single button B (PON) triggers short boost (0.6–0.8s)
      targetSlot.boostTimer = SINGLE_BOOST_DUR;
    }

    const n = this.tapHistory.length;
    if (n >= 4) {
      const h = this.tapHistory.slice(n - 4);
      const k0 = h[0].key, k1 = h[1].key, k2 = h[2].key, k3 = h[3].key;

      const iti1 = h[1].time - h[0].time;
      const iti2 = h[2].time - h[1].time;
      const iti3 = h[3].time - h[2].time;

      if (iti1 >= 100 && iti1 <= 1400) {
        const err1 = Math.abs(iti1 - iti2) / iti1;
        const err2 = Math.abs(iti2 - iti3) / iti2;

        if (err1 <= RHYTHM_TOLERANCE && err2 <= RHYTHM_TOLERANCE) {
          // Pattern A: PATA - PATA - PATA - PON (Sprint 1.5–1.7s)
          if (k0 === 'KeyJ' && k1 === 'KeyJ' && k2 === 'KeyJ' && k3 === 'KeyK') {
            this.audio.playComboFanfare();
            targetSlot.boostTimer = RHYTHM_BOOST_DUR;

            [30, 60, 90].forEach((r0, idx) => {
              this.shockwaves.push({
                x: targetSlot.player.x, y: targetSlot.player.y,
                r: r0, maxR: 900, speed: 750 + idx * 80, power: 120, life: 1.8
              });
            });

            this.comboFeedback = '🔥 PATA PATA PATA PON — РЫВОК 1.6с! 🔥';
            this.comboFlash = 2.2;
            this.fx.strobe = 0.55;
            this.fx.distort = 0.35;
            this.tapHistory = [];
          }
          // Pattern B: PON - PON - PATA - PATA (Magnetism x2.7)
          else if (k0 === 'KeyK' && k1 === 'KeyK' && k2 === 'KeyJ' && k3 === 'KeyJ') {
            this.audio.playComboFanfare();
            targetSlot.magnetTimer = 3.5;

            [40, 80, 120].forEach((r0, idx) => {
              this.shockwaves.push({
                x: targetSlot.player.x, y: targetSlot.player.y,
                r: r0, maxR: 1200, speed: 650 + idx * 70, power: 150, life: 2.2
              });
            });

            this.comboFeedback = '⚡ PON PON PATA PATA — МАГНЕТИЗМ ×2.7! ⚡';
            this.comboFlash = 2.5;
            this.fx.strobe = 0.65;
            this.fx.distort = 0.40;
            this.tapHistory = [];
          }
        }
      }
    }
  }

  handleKeyUp(e: KeyboardEvent) {
    this.keys.delete(e.code);
  }

  handlePointerDown() {
    this.audio.resume();
    this.start();
  }

  mount() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('pointerdown', this.handlePointerDown);
  }

  unmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('pointerdown', this.handlePointerDown);
    this.audio.dispose();
  }

  start() {
    this.audio.resume();
    if (!this.started) {
      this.started = true;
      this.audio.init();
      this.t0 = this.audio.clockNow();
      this.lastT = performance.now();
      requestAnimationFrame(this.loop.bind(this));
    }
  }

  restart() {
    for (const slot of this.slots) {
      slot.player.x = SPAWN.x + (slot.num - 1) * 45;
      slot.player.y = SPAWN.y;
      slot.player.vx = 0; slot.player.vy = 0;
      for (let i = 0; i < 4; i++) {
        slot.tanks[i] = 0; slot.collectFlash[i] = 0;
        slot.player.orbs[i].trail.length = 0;
      }
    }
    this.dominant = null;
    this.won = false;
    this.t0 = this.audio.clockNow();
    this.fx.strobe = 0; this.fx.distort = 0; this.fx.stutter = 0; this.fx.shocks.length = 0;
  }

  setSeed(seed: number) {
    this.world.seed = seed;
    this.world.clear();
  }

  climbSeconds() {
    return Math.max(0, this.audio.clockNow() - this.t0);
  }

  loop(now: number) {
    if (!this.started) return;
    requestAnimationFrame(this.loop.bind(this));

    const dbg = typeof window !== 'undefined' ? window.__PROUN_DEBUG__ : undefined;

    try {
      const dt = Math.min((now - (this.lastT || now)) / 1000, 0.05);
      this.lastT = now;

      if (dbg) {
        dbg.loopCount++;
        dbg.fps = Math.round(1 / Math.max(dt, 0.001));
        dbg.audioState = this.audio.ac ? this.audio.ac.state : 'none';
        dbg.playerPos = { x: Math.round(this.player.x), y: Math.round(this.player.y) };
      }

      if (this.fx.stutter > 0) {
        this.fx.stutter -= dt;
        this.renderer.draw(
          now / 1000, this.audio.clockNow(), this.player, this.fx,
          this.world.chunks, this.world.farChunks, this.dominant,
          this.tanks, this.collectFlash, this.world.seed, this.particleFrac,
          this.shockwaves, this.netPlayers, this.slots
        );
        return;
      }

      updateEngine(this, dt);

      this.renderer.draw(
        now / 1000, this.audio.clockNow(), this.player, this.fx,
        this.world.chunks, this.world.farChunks, this.dominant,
        this.tanks, this.collectFlash, this.world.seed, this.particleFrac,
        this.shockwaves, this.netPlayers, this.slots
      );
    } catch (err: any) {
      console.error('[PROUN ENGINE RUNTIME ERROR]', err);
      if (dbg) {
        dbg.errorCount++;
        dbg.lastError = err?.stack || String(err);
        dbg.log(`LOOP ERROR: ${err?.message || err}`);
      }
    }
  }

  fxShock(x: number, y: number, r0: number) {
    this.fx.shocks.push({ x, y, r: r0 * 0.4, v: 900, life: 1 });
    if (this.fx.shocks.length > 8) this.fx.shocks.shift();
  }

  gestureCapture(o: Mech) {
    this.fxShock(o.x, o.y, o.outerR);
    this.fx.strobe = Math.max(this.fx.strobe, 0.45);
    this.fx.distort = Math.max(this.fx.distort, 0.5);
    o.act = 1;
    if (this.audio.isAudioOn() && this.audio.ac) {
      // падение тритоном — существо признаёт спутника
      this.audio.voice({ f: modeFreq(o.energy, o.rootDeg, 2), when: this.audio.ac.currentTime, dur: 0.7,
        e: o.energy, g: 0.17, gliss: -6, vib: 1.4, send: 0.5 });
    }
  }

  gestureSwitch(o: Mech) {
    this.fx.strobe = 1; this.fx.distort = 1; this.fx.stutter = 0.07;
    this.fxShock(this.player.x, this.player.y, 60);
    this.fxShock(o.x, o.y, o.outerR);
    o.act = 1;
    if (this.audio.isAudioOn() && this.audio.ac) {
      this.audio.duck(0.16, 0.1);
      this.audio.voice({ f: modeFreq(o.energy, o.rootDeg, 3), when: this.audio.ac.currentTime, dur: 0.22,
        e: o.energy, g: 0.2, gliss: 6, vib: 0, send: 0.7 });
      this.audio.click(modeFreq(o.energy, o.rootDeg, 4), this.audio.ac.currentTime + 0.05, 0.12);
    }
  }

  gestureRelease() {
    this.fx.distort = Math.max(this.fx.distort, 0.25);
    if (this.audio.isAudioOn() && this.audio.ac) this.audio.noiseBurst(this.audio.ac.currentTime, 0.05);
  }

  gestureCollision(o: Mech) {
    this.fx.strobe = 1; this.fx.distort = 1.2; this.fx.stutter = 0.055;
    this.fxShock(this.player.x, this.player.y, 40);
    if (this.audio.isAudioOn() && this.audio.ac) {
      this.audio.duck(0.1, 0.07);
      const t = this.audio.ac.currentTime;
      for (const dd of [0, 1, 6])   // кластер: секунда и тритон
        this.audio.voice({ f: modeFreq(o.energy, o.rootDeg + dd, 2), when: t, dur: 0.3,
          e: o.energy, g: 0.12, gliss: -2, vib: 0, send: 0.4 });
      this.audio.noiseBurst(t, 0.14);
    }
  }

  playRev(i: number, orb: { target: Mech | null }) {
    if (!this.audio.isAudioOn() || !this.audio.ac) return;
    const fill = this.tanks[i] / MAXTANK;
    const deg = orb.target ? orb.target.rootDeg : 0;
    this.audio.voice({ f: modeFreq(i, deg, OCT[i] + 1), when: this.audio.ac.currentTime,
      dur: 0.16 + fill * 0.3, e: i, g: 0.045 + fill * 0.04, vib: 0.4, send: 0.05, out: this.audio.plrGain || undefined });
  }

  collect(e: number) {
    this.tanks[e] = Math.min(MAXTANK, this.tanks[e] + 1);
    this.collectFlash[e] = 1;
    if (this.started) this.audio.chirp(e, this.tanks[e] / MAXTANK);
  }

  finale() {
    this.fx.strobe = 1; this.fx.distort = 1;
    this.fxShock(this.player.x, this.player.y, 120);
    if (this.audio.isAudioOn() && this.audio.ac) {
      const t = this.audio.ac.currentTime;
      let i = 0;
      for (let e = 0; e < 4; e++)
        for (const dg of [0, 2, 4, 6])
          this.audio.voice({ f: modeFreq(e, dg, OCT[e] + (e === 1 ? 1 : 0)), when: t + i++ * 0.085,
            dur: 2.2, e, g: 0.07, vib: 0.8, send: 0.3 });
      setTimeout(() => { if (this.audio.isAudioOn() && this.audio.ac) this.audio.birdBurst(2200, this.audio.ac.currentTime, 0.08); }, 1700);
    }
  }

  // ── планировщик ритмических колёс: необратимый ритм Мессиана ──
  private resyncRing(ring: Voice, T: number) {
    const spp = ring.pulse / ring.tempoMul;
    const p = ringPos(ring, T);
    let i = 0;
    while (i < ring.talea.length && ring.cum[i] <= p + 1e-6) i++;
    if (i >= ring.talea.length) {
      ring.nextIdx = 0;
      ring.nextT = T + (ring.total - p) * spp;
    } else {
      ring.nextIdx = i;
      ring.nextT = T + (ring.cum[i] - p) * spp;
    }
    ring.pending.length = 0;
  }

  scheduleRing(o: Mech, ring: Voice, T: number) {
    if (ring.nextT === undefined || ring.nextT < T - 0.35) this.resyncRing(ring, T);
    let guard = 0;
    while (ring.nextT! < T + 0.13 && guard++ < 10) {
      const idx = ring.nextIdx;
      const dur = ring.talea[idx];
      const deg = ring.colorSeq[ring.colorPos % ring.colorSeq.length];
      ring.colorPos++;
      this.playWheelNote(o, ring, idx === 0, deg, dur, ring.nextT!);
      ring.pending.push({ at: ring.nextT!, idx });
      const spp = ring.pulse / ring.tempoMul;
      ring.nextIdx = (idx + 1) % ring.talea.length;
      ring.nextT = ring.nextT! + dur * spp;
      if (ring.nextIdx === 0 && ring.persona !== 0) {
        // ритмический персонаж: цикл кончился — темп дышит
        ring.tempoMul *= ring.persona > 0 ? 1.0595 : 1 / 1.0595;
        if (ring.tempoMul > 1.6)  { ring.tempoMul = 1.6;  ring.persona = -1; }
        if (ring.tempoMul < 0.63) { ring.tempoMul = 0.63; ring.persona = 1; }
        ring.refT = ring.nextT;
      }
    }
  }

  private playWheelNote(o: Mech, ring: Voice, accent: boolean, deg: number, dur: number, when: number) {
    const hear = o._hear;
    if (hear < 0.04 || this.notesBudget <= 0) return;
    this.notesBudget--;
    const e = o.energy;
    const f = modeFreq(e, o.rootDeg + deg, ring.oct);
    const spp = ring.pulse / ring.tempoMul;
    const secs = Math.min(dur * spp * 0.92, 1.5);
    const amp = (accent ? 1.3 : 1) * hear * hear;

    // тембр по роли элемента в композиции (плоскость/балка/диск/клин/игла)
    switch (ring.instr) {
      case 'plane':   // масса — длинный формантный пад с падающим глиссандо
        this.audio.voice({ f, when, dur: Math.min(secs, 1.4), e, g: 0.12 * amp,
          gliss: dur >= 3 ? -5 : -2, vib: 0.9, send: 0.2 });
        return;
      case 'bar':     // ритмический хребет — деревянное пиццикато
        this.audio.pluck(f, when, 0.16 * amp);
        return;
      case 'disc':    // парящий диск — колокол
        this.audio.bell(f, when, 0.12 * amp, 0.7 + dur * 0.28);
        return;
      case 'wedge':   // яркий акцент — короткий стаб
        this.audio.voice({ f, when, dur: Math.min(secs, 0.42), e, g: 0.12 * amp,
          gliss: 3, vib: 0, send: 0.3 });
        return;
      case 'needle':  // тонкая игла — высокий тик
        this.audio.click(Math.min(f * 2, 6000), when, 0.07 * amp);
        return;
    }

    // 'creature' — радиальные кольца: тембр по длительности
    if (e === 3 && dur >= 2) { this.audio.birdBurst(f, when, 0.10 * amp); return; }
    if (dur >= 3) {
      this.audio.voice({ f, when, dur: secs, e, g: 0.15 * amp, gliss: -4, vib: 1, send: accent ? 0.35 : 0.1 });
    } else if (dur === 2) {
      this.audio.voice({ f, when, dur: Math.min(secs, 0.55), e, g: 0.13 * amp, gliss: 0, vib: 0.5, send: 0.08 });
    } else if (dur === 1.5) {
      // добавленная длительность = орнамент: форшлаг ступенью выше
      this.audio.voice({ f: f * Math.pow(2, 2 / 12), when: when - 0.07, dur: 0.09, e, g: 0.07 * amp, vib: 0 });
      this.audio.voice({ f, when, dur: 0.22, e, g: 0.12 * amp, vib: 0 });
    } else {
      this.audio.click(f, when, 0.10 * amp);
    }
  }

  setMasterVol(v: number) { this.audio.setMasterVol(v); }
  setObjVol(v: number) { this.audio.setObjVol(v); }
  setPlrVol(v: number) { this.audio.setPlrVol(v); }
  setParticleFrac(v: number) { this.particleFrac = v; }

  getLevelId(): number {
    return levelRegistry.getActiveLevelId();
  }

  getLevelConfig(): LevelConfig {
    return levelRegistry.getActiveConfig();
  }

  setLevel(id: number): LevelConfig {
    const config = levelRegistry.setActiveLevelId(id);
    return config;
  }

  setUsePrimitives(id: number, usePrimitives: boolean): void {
    levelRegistry.setUsePrimitives(id, usePrimitives);
  }

  nextLevel(): LevelConfig {
    const nextId = (levelRegistry.getActiveLevelId() % 5) + 1;
    this.won = false;
    this.player.x = SPAWN.x;
    this.player.y = SPAWN.y;
    return this.setLevel(nextId);
  }
}

