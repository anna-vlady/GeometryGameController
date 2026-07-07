import { VoiceOptions } from './types';
import { modeFreq } from './utils';
import { DRIVE, OCT, ROOT, VOWELS, MODES } from '../world/constants';

const curveCache: Record<string, Float32Array> = {};

function driveCurve(k: number): Float32Array {
  const key = k.toFixed(1);
  if (curveCache[key]) return curveCache[key];
  const n = 1024, c = new Float32Array(n);
  const norm = Math.tanh(k);
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1) * 2 - 1;
    c[i] = Math.tanh(k * x) / norm;
  }
  return (curveCache[key] = c);
}

function makeReverb(ac: AudioContext, seconds: number): ConvolverNode {
  const rate = ac.sampleRate, len = (rate * seconds) | 0;
  const buf = ac.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.1) * 0.4;
  }
  const conv = ac.createConvolver();
  conv.buffer = buf;
  return conv;
}

export class AudioManager {
  ac: AudioContext | null = null;
  bus: GainNode | null = null;
  masterMute: GainNode | null = null;
  objGain: GainNode | null = null;
  plrGain: GainNode | null = null;
  masterVol: GainNode | null = null;
  sfxOut: GainNode | null = null;
  delayIn: GainNode | null = null;
  reverbIn: ConvolverNode | null = null;
  windGain: GainNode | null = null;
  thrust: any = null;
  sus: Array<{ g: GainNode, o1: OscillatorNode, def: any }> = [];
  noiseBuf: AudioBuffer | null = null;

  muted = false;
  uiObjVol = 1.0;
  uiPlrVol = 1.0;
  uiMaster = 0.85;

  init() {
    if (this.ac) return;
    this.ac = new (window.AudioContext || (window as any).webkitAudioContext)();

    const comp = this.ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 5; comp.attack.value = 0.004;
    comp.connect(this.ac.destination);

    this.masterMute = this.ac.createGain(); this.masterMute.gain.value = this.muted ? 0 : 1;
    this.masterMute.connect(comp);

    this.masterVol = this.ac.createGain(); this.masterVol.gain.value = this.uiMaster;
    this.masterVol.connect(this.masterMute);

    this.bus = this.ac.createGain(); this.bus.gain.value = 1;
    this.bus.connect(this.masterVol);

    this.objGain = this.ac.createGain(); this.objGain.gain.value = this.uiObjVol; this.objGain.connect(this.bus);
    this.plrGain = this.ac.createGain(); this.plrGain.gain.value = this.uiPlrVol; this.plrGain.connect(this.bus);
    this.sfxOut = this.objGain;

    this.reverbIn = makeReverb(this.ac, 1.35);
    const revOut = this.ac.createGain(); revOut.gain.value = 0.32;
    this.reverbIn.connect(revOut); revOut.connect(this.bus);

    const dly = this.ac.createDelay(1.0); dly.delayTime.value = 0.34;
    const fbLp = this.ac.createBiquadFilter(); fbLp.type = 'lowpass'; fbLp.frequency.value = 1850;
    const fbHp = this.ac.createBiquadFilter(); fbHp.type = 'highpass'; fbHp.frequency.value = 240;
    const fb = this.ac.createGain(); fb.gain.value = 0.42;
    dly.connect(fbLp); fbLp.connect(fbHp); fbHp.connect(fb); fb.connect(dly);
    this.delayIn = this.ac.createGain(); this.delayIn.gain.value = 1;
    this.delayIn.connect(dly);
    const dlyOut = this.ac.createGain(); dlyOut.gain.value = 0.7;
    dly.connect(dlyOut); dlyOut.connect(this.bus);
    dly.connect(this.reverbIn);

    const nLen = this.ac.sampleRate * 2;
    this.noiseBuf = this.ac.createBuffer(1, nLen, this.ac.sampleRate);
    const nd = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < nLen; i++) nd[i] = Math.random() * 2 - 1;

    const b1 = this.ac.createOscillator(); b1.type = 'sine'; b1.frequency.value = ROOT * 2;
    const b1g = this.ac.createGain(); b1g.gain.value = 0;
    b1g.gain.setTargetAtTime(0.016, this.ac.currentTime, 4);
    b1.connect(b1g); b1g.connect(this.objGain); b1.start();

    const bn = this.ac.createBufferSource(); bn.buffer = this.noiseBuf; bn.loop = true;
    const bnf = this.ac.createBiquadFilter(); bnf.type = 'bandpass'; bnf.frequency.value = 110; bnf.Q.value = 1.8;
    const bng = this.ac.createGain(); bng.gain.value = 0.011;
    bn.connect(bnf); bnf.connect(bng); bng.connect(this.objGain); bn.start();

    const wn = this.ac.createBufferSource(); wn.buffer = this.noiseBuf; wn.loop = true;
    const wlp = this.ac.createBiquadFilter(); wlp.type = 'lowpass'; wlp.frequency.value = 420;
    this.windGain = this.ac.createGain(); this.windGain.gain.value = 0;
    wn.connect(wlp); wlp.connect(this.windGain); this.windGain.connect(this.plrGain); wn.start();

    const mvLp = this.ac.createBiquadFilter(); mvLp.type = 'lowpass'; mvLp.frequency.value = 320; mvLp.Q.value = 0.8;
    const mvAmp = this.ac.createGain(); mvAmp.gain.value = 0;
    mvLp.connect(mvAmp); mvAmp.connect(this.plrGain);
    const mvSend = this.ac.createGain(); mvSend.gain.value = 0.12; mvAmp.connect(mvSend); mvSend.connect(this.reverbIn);
    const ped1 = this.ac.createOscillator(); ped1.type = 'sawtooth'; ped1.frequency.value = ROOT * 2;
    const ped2 = this.ac.createOscillator(); ped2.type = 'sawtooth'; ped2.frequency.value = ROOT * 2; ped2.detune.value = -8;
    const pedG = this.ac.createGain(); pedG.gain.value = 0.55;
    ped1.connect(pedG); ped2.connect(pedG); pedG.connect(mvLp);
    ped1.start(); ped2.start();
    const glide = this.ac.createOscillator(); glide.type = 'triangle'; glide.frequency.value = ROOT * 3;
    const glideG = this.ac.createGain(); glideG.gain.value = 0;
    glide.connect(glideG); glideG.connect(mvLp); glide.start();
    const trem = this.ac.createOscillator(); trem.type = 'sine'; trem.frequency.value = 4;
    const tremD = this.ac.createGain(); tremD.gain.value = 0;
    trem.connect(tremD); tremD.connect(mvAmp.gain); trem.start();
    this.thrust = { lp: mvLp, amp: mvAmp, glide, glideG, trem, tremD };

    const susDef = [
      { g: 0.075, type: 'triangle' as OscillatorType },
      { g: 0.120, type: 'sine' as OscillatorType },
      { g: 0.055, type: 'triangle' as OscillatorType },
      { g: 0.035, type: 'sine' as OscillatorType }
    ];
    this.sus = susDef.map((def, i) => {
      const vg = this.ac!.createGain(); vg.gain.value = 0;
      const o1 = this.ac!.createOscillator(); o1.type = def.type;
      o1.frequency.value = modeFreq(i, 0, OCT[i]);
      const bp = this.ac!.createBiquadFilter(); bp.type = 'bandpass';
      bp.frequency.value = VOWELS[i][0]; bp.Q.value = 2.6;
      const direct = this.ac!.createGain(); direct.gain.value = 0.5;
      o1.connect(bp); bp.connect(vg); o1.connect(direct); direct.connect(vg);
      vg.connect(this.plrGain!);
      const rs = this.ac!.createGain(); rs.gain.value = 0.2; vg.connect(rs); rs.connect(this.reverbIn!);
      o1.start();
      return { g: vg, o1, def };
    });
  }

  isAudioOn() {
    return !!this.ac && this.ac.state === 'running' && !this.muted;
  }

  clockNow() {
    return this.ac ? this.ac.currentTime : performance.now() / 1000;
  }

  voice(opt: VoiceOptions) {
    if (!this.isAudioOn() || !this.ac) return;
    const { f, when, dur, e } = opt;
    const g = opt.g, gliss = opt.gliss || 0, vib = opt.vib || 0, send = opt.send || 0.1;
    const t0 = Math.max(when, this.ac.currentTime + 0.003);
    const t1 = t0 + dur;

    const o1 = this.ac.createOscillator(); o1.type = 'sawtooth';
    o1.frequency.setValueAtTime(Math.max(f * 0.972, 20), t0);
    o1.frequency.exponentialRampToValueAtTime(f, t0 + Math.min(0.04, dur * 0.3));
    if (gliss) o1.frequency.exponentialRampToValueAtTime(Math.max(f * Math.pow(2, gliss / 12), 20), t1);

    if (vib) {
      const lfo = this.ac.createOscillator(); lfo.type = 'sine';
      lfo.frequency.setValueAtTime(3.4, t0);
      lfo.frequency.linearRampToValueAtTime(6.8, t1);
      const vd = this.ac.createGain();
      vd.gain.setValueAtTime(0, t0);
      vd.gain.linearRampToValueAtTime(9 * vib, t0 + dur * 0.5);
      lfo.connect(vd); vd.connect(o1.detune);
      lfo.start(t0); lfo.stop(t1 + 0.1);
    }

    const sh = this.ac.createWaveShaper(); sh.curve = driveCurve(DRIVE[e]) as any;
    const F = VOWELS[e];
    const f1 = this.ac.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 8;
    const f2 = this.ac.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 11;
    f1.frequency.setValueAtTime(F[0], t0);
    f1.frequency.exponentialRampToValueAtTime(F[0] * 1.35, t1);
    f2.frequency.setValueAtTime(F[1] * 1.12, t0);
    f2.frequency.exponentialRampToValueAtTime(F[1] * 0.82, t1);
    const g2 = this.ac.createGain(); g2.gain.value = 0.7;

    const amp = this.ac.createGain();
    amp.gain.setValueAtTime(0, t0);
    amp.gain.linearRampToValueAtTime(g, t0 + 0.007);
    amp.gain.exponentialRampToValueAtTime(0.0006, t1);

    o1.connect(sh);
    sh.connect(f1); f1.connect(amp);
    sh.connect(g2); g2.connect(f2); f2.connect(amp);
    amp.connect(opt.out || this.sfxOut!);
    if (send > 0.01) { const s = this.ac.createGain(); s.gain.value = send; amp.connect(s); s.connect(this.delayIn!); }
    const rs = this.ac.createGain(); rs.gain.value = 0.16; amp.connect(rs); rs.connect(this.reverbIn!);
    o1.start(t0); o1.stop(t1 + 0.12);
  }

  click(f: number, when: number, g: number) {
    if (!this.isAudioOn() || !this.ac || !this.noiseBuf) return;
    const t0 = Math.max(when, this.ac.currentTime + 0.003);
    const src = this.ac.createBufferSource(); src.buffer = this.noiseBuf;
    const bp = this.ac.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.value = Math.min(f * 2.5, 5200); bp.Q.value = 13;
    const amp = this.ac.createGain();
    amp.gain.setValueAtTime(0, t0);
    amp.gain.linearRampToValueAtTime(g, t0 + 0.003);
    amp.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.06);
    src.connect(bp); bp.connect(amp); amp.connect(this.sfxOut!);
    src.start(t0, Math.random() * 1.5); src.stop(t0 + 0.08);
    const th = this.ac.createOscillator(); th.type = 'sine';
    th.frequency.setValueAtTime(Math.max(f * 0.5, 28), t0);
    th.frequency.exponentialRampToValueAtTime(Math.max(f * 0.25, 24), t0 + 0.07);
    const tg2 = this.ac.createGain();
    tg2.gain.setValueAtTime(0, t0);
    tg2.gain.linearRampToValueAtTime(g * 0.8, t0 + 0.004);
    tg2.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.09);
    th.connect(tg2); tg2.connect(this.sfxOut!);
    th.start(t0); th.stop(t0 + 0.1);
  }

  birdBurst(fBase: number, when: number, g: number) {
    if (!this.isAudioOn() || !this.ac) return;
    let t = Math.max(when, this.ac.currentTime + 0.003);
    const n = 3 + ((Math.random() * 4) | 0);
    let deg = 0;
    const m = MODES[3];
    for (let i = 0; i < n; i++) {
      const last = i === n - 1;
      deg += ((Math.random() * 5) | 0) - 2 + (last ? -3 : 1);
      const semis = m[((deg % m.length) + m.length) % m.length];
      const f = Math.min(fBase * Math.pow(2, semis / 12) * (1 + (i % 2) * 0.5), 6000);
      const dur = last ? 0.12 : 0.035 + Math.random() * 0.05;
      const o = this.ac.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(f * 1.06, t);
      o.frequency.exponentialRampToValueAtTime(last ? f * 0.84 : f, t + dur);
      const bp = this.ac.createBiquadFilter(); bp.type = 'bandpass';
      bp.frequency.value = 2600; bp.Q.value = 1.6;
      const amp = this.ac.createGain();
      amp.gain.setValueAtTime(0, t);
      amp.gain.linearRampToValueAtTime(g, t + 0.005);
      amp.gain.exponentialRampToValueAtTime(0.0005, t + dur + 0.02);
      o.connect(bp); bp.connect(amp); amp.connect(this.sfxOut!);
      const s = this.ac.createGain(); s.gain.value = 0.25; amp.connect(s); s.connect(this.delayIn!);
      o.start(t); o.stop(t + dur + 0.05);
      t += dur + 0.02 + Math.random() * 0.05;
    }
  }

  noiseBurst(when: number, g: number) {
    if (!this.isAudioOn() || !this.ac || !this.noiseBuf) return;
    const t0 = Math.max(when, this.ac.currentTime + 0.003);
    const src = this.ac.createBufferSource(); src.buffer = this.noiseBuf;
    const hp = this.ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
    const amp = this.ac.createGain();
    amp.gain.setValueAtTime(0, t0);
    amp.gain.linearRampToValueAtTime(g, t0 + 0.004);
    amp.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.13);
    src.connect(hp); hp.connect(amp); amp.connect(this.sfxOut!);
    src.start(t0, Math.random()); src.stop(t0 + 0.16);
  }

  chirp(e: number, fill: number) {
    if (!this.isAudioOn() || !this.ac) return;
    const t0 = this.ac.currentTime;
    const f = Math.min(modeFreq(e, (fill * 7) | 0, OCT[e] + 2), 5200);
    const o = this.ac.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(f * 0.94, t0);
    o.frequency.exponentialRampToValueAtTime(f, t0 + 0.05);
    const amp = this.ac.createGain();
    amp.gain.setValueAtTime(0, t0);
    amp.gain.linearRampToValueAtTime(0.06, t0 + 0.006);
    amp.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.11);
    o.connect(amp); amp.connect(this.plrGain!);
    o.start(t0); o.stop(t0 + 0.15);
  }

  bell(f: number, when: number, g: number, decay: number) {
    if (!this.isAudioOn() || !this.ac) return;
    const t0 = Math.max(when, this.ac.currentTime + 0.003);
    const dur = decay || 1.0;
    const o1 = this.ac.createOscillator(); o1.type = 'sine'; o1.frequency.value = f;
    const o2 = this.ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2.76;
    const g2 = this.ac.createGain(); g2.gain.value = 0.2;
    const amp = this.ac.createGain();
    amp.gain.setValueAtTime(0, t0);
    amp.gain.linearRampToValueAtTime(g, t0 + 0.004);
    amp.gain.exponentialRampToValueAtTime(0.0004, t0 + dur);
    o1.connect(amp); o2.connect(g2); g2.connect(amp); amp.connect(this.sfxOut!);
    const rs = this.ac.createGain(); rs.gain.value = 0.22; amp.connect(rs); rs.connect(this.reverbIn!);
    const sd = this.ac.createGain(); sd.gain.value = 0.14; amp.connect(sd); sd.connect(this.delayIn!);
    o1.start(t0); o2.start(t0); o1.stop(t0 + dur + 0.1); o2.stop(t0 + dur + 0.1);
  }

  pluck(f: number, when: number, g: number) {
    if (!this.isAudioOn() || !this.ac) return;
    const t0 = Math.max(when, this.ac.currentTime + 0.003);
    const o1 = this.ac.createOscillator(); o1.type = 'triangle';
    o1.frequency.setValueAtTime(f * 1.012, t0);
    o1.frequency.exponentialRampToValueAtTime(f, t0 + 0.03);
    const o2 = this.ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 3.01;
    const g2 = this.ac.createGain(); g2.gain.value = 0.28;
    const amp = this.ac.createGain();
    amp.gain.setValueAtTime(0, t0);
    amp.gain.linearRampToValueAtTime(g, t0 + 0.002);
    amp.gain.exponentialRampToValueAtTime(0.0004, t0 + 0.26);
    o1.connect(amp); o2.connect(g2); g2.connect(amp); amp.connect(this.sfxOut!);
    const rs = this.ac.createGain(); rs.gain.value = 0.12; amp.connect(rs); rs.connect(this.reverbIn!);
    o1.start(t0); o2.start(t0); o1.stop(t0 + 0.32); o2.stop(t0 + 0.32);
  }

  duck(depth: number, hold: number) {
    if (!this.isAudioOn() || !this.ac || !this.bus) return;
    const t = this.ac.currentTime;
    this.bus.gain.cancelScheduledValues(t);
    this.bus.gain.setValueAtTime(this.bus.gain.value, t);
    this.bus.gain.linearRampToValueAtTime(depth, t + 0.015);
    this.bus.gain.setTargetAtTime(1, t + hold, 0.13);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterMute && this.ac) {
      this.masterMute.gain.setTargetAtTime(this.muted ? 0 : 1, this.ac.currentTime, 0.05);
    }
  }

  setMasterVol(v: number) {
    this.uiMaster = v;
    if (this.masterVol && this.ac) this.masterVol.gain.setTargetAtTime(v, this.ac.currentTime, 0.03);
  }
  setObjVol(v: number) {
    this.uiObjVol = v;
    if (this.objGain && this.ac) this.objGain.gain.setTargetAtTime(v, this.ac.currentTime, 0.03);
  }
  setPlrVol(v: number) {
    this.uiPlrVol = v;
    if (this.plrGain && this.ac) this.plrGain.gain.setTargetAtTime(v, this.ac.currentTime, 0.03);
  }

  // освобождает AudioContext при размонтировании (иначе он продолжает жить
  // в фоне после ухода со страницы игры — и StrictMode-ремаунт, и обычная
  // навигация Меню↔Игра иначе оставляют висящий контекст)
  dispose() {
    if (this.ac) {
      this.ac.close().catch(() => {});
      this.ac = null;
    }
  }
}
