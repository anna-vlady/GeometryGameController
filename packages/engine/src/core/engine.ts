import { Player, FxState } from '../physics/types';
import { createPlayer } from '../physics/player';
import { WorldGenerator } from '../world/generator';
import { WORLD_SEED } from '../world/constants';
import { updateEngine } from '../physics/update';
import { AudioManager } from '../audio/audioManager';
import { Renderer } from '../renderer/renderer';
import { Mech } from '../world/types';
import { MAXTANK } from '../physics/constants';
// TODO: import physics update function when it's fully extracted

export interface EngineConfig {
  canvas: HTMLCanvasElement;
  seed?: number;
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
  
  lastT = 0;
  frameId = 0;
  notesBudget = 14;
  nearbyCache: Mech[] = [];
  evCd = 0;
  keys = new Set<string>();
  
  constructor(config: EngineConfig) {
    this.canvas = config.canvas;
    const seed = config.seed || WORLD_SEED;
    this.world = new WorldGenerator(seed);
    this.audio = new AudioManager();
    this.renderer = new Renderer(this.canvas);
    this.player = createPlayer();
    this.fx = { strobe: 0, distort: 0, stutter: 0, shocks: [] };
    
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
  }

  handleKeyDown(e: KeyboardEvent) {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
    if (e.code === 'KeyM') this.audio.toggleMute();
    this.keys.add(e.code);
    this.start();
  }

  handleKeyUp(e: KeyboardEvent) {
    this.keys.delete(e.code);
  }

  handlePointerDown() {
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
  }

  start() {
    if (!this.started) {
      this.started = true;
      this.audio.init();
      this.lastT = performance.now();
      requestAnimationFrame(this.loop.bind(this));
    }
  }

  loop(now: number) {
    if (!this.started) return;
    requestAnimationFrame(this.loop.bind(this));
    
    const dt = Math.min((now - this.lastT) / 1000, 0.05);
    this.lastT = now;
    
    if (this.fx.stutter > 0) {
      this.fx.stutter -= dt;
      this.renderer.draw(
        now / 1000, this.audio.clockNow(), this.player, this.fx,
        this.world.chunks, this.world.farChunks, this.dominant,
        this.tanks, this.collectFlash, this.world.seed
      );
      return;
    }
    
    updateEngine(this, dt);
    
    this.renderer.draw(
      now / 1000, this.audio.clockNow(), this.player, this.fx,
      this.world.chunks, this.world.farChunks, this.dominant,
      this.tanks, this.collectFlash, this.world.seed
    );
  }

  fxShock(x: number, y: number, r0: number) {
    this.fx.shocks.push({ x, y, r: r0 * 0.4, v: 900, life: 1 });
    if (this.fx.shocks.length > 8) this.fx.shocks.shift();
  }

  gestureCapture(o: any) {
    this.fxShock(o.x, o.y, o.outerR);
    this.fx.strobe = Math.max(this.fx.strobe, 0.45);
    this.fx.distort = Math.max(this.fx.distort, 0.5);
    o.act = 1;
    if (this.audio.isAudioOn() && this.audio.ac) {
      // modeFreq(o.energy, o.rootDeg, 2)
      // TODO: port voice
    }
  }

  gestureSwitch(o: any) {
    this.fx.strobe = 1; this.fx.distort = 1; this.fx.stutter = 0.07;
    this.fxShock(this.player.x, this.player.y, 60);
    this.fxShock(o.x, o.y, o.outerR);
    o.act = 1;
  }

  gestureRelease() {
    this.fx.distort = Math.max(this.fx.distort, 0.25);
  }

  gestureCollision(o: any) {
    this.fx.strobe = 1; this.fx.distort = 1.2; this.fx.stutter = 0.055;
    this.fxShock(this.player.x, this.player.y, 40);
  }

  playRev(i: number, orb: any) {
    // ...
  }

  collect(e: number) {
    this.tanks[e] = Math.min(MAXTANK, this.tanks[e] + 1);
    this.collectFlash[e] = 1;
  }

  finale() {
    // ...
  }

  scheduleRing(o: any, ring: any, T: number) {
    // ...
  }

  setMasterVol(v: number) { this.audio.setMasterVol(v); }
  setObjVol(v: number) { this.audio.setObjVol(v); }
  setPlrVol(v: number) { this.audio.setPlrVol(v); }
}
