let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfx: GainNode | null = null;
let music: GainNode | null = null;
let musicTimer: number | null = null;
let muted = false;
let musicOn = true;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    sfx = ctx.createGain();
    music = ctx.createGain();
    master.gain.value = 0.85;
    sfx.gain.value = 0.7;
    music.gain.value = 0.22;
    sfx.connect(master);
    music.connect(master);
    master.connect(ctx.destination);
  }
  return ctx;
}

export function unlockAudio() {
  const c = ac();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && c.state === "suspended") void c.resume();
  });
}

export function setMuted(v: boolean) {
  muted = v;
  if (master && ctx) master.gain.setTargetAtTime(v ? 0 : 0.85, ctx.currentTime, 0.04);
}

export function isMuted() {
  return muted;
}

export function setMusicOn(v: boolean) {
  musicOn = v;
  if (music && ctx) music.gain.setTargetAtTime(v && !muted ? 0.22 : 0, ctx.currentTime, 0.08);
}

function envGain(duration: number, peak: number, start: number) {
  const c = ctx!;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + 0.018);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  return g;
}

function tone(freq: number, duration: number, type: OscillatorType, peak: number, detune = 0) {
  const c = ac();
  if (!c || !sfx || muted) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (detune) o.detune.setValueAtTime(detune, t);
  const g = envGain(duration, peak, t);
  o.connect(g);
  g.connect(sfx);
  o.start(t);
  o.stop(t + duration + 0.02);
}

function noiseBurst(duration: number, peak: number, hp = 800) {
  const c = ac();
  if (!c || !sfx || muted) return;
  const n = Math.floor(c.sampleRate * duration);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = hp;
  const t = c.currentTime;
  const g = envGain(duration, peak, t);
  src.connect(filter);
  filter.connect(g);
  g.connect(sfx);
  src.start(t);
  src.stop(t + duration + 0.02);
}

export function sfxCollect(kind: string, combo: number) {
  const bump = 1 + Math.min(combo, 12) * 0.012;
  if (kind === "coin") {
    tone(523.25 * bump, 0.12, "triangle", 0.22);
    tone(659.25 * bump, 0.16, "sine", 0.16);
    tone(783.99 * bump, 0.22, "triangle", 0.18);
    tone(1046.5 * bump, 0.28, "sine", 0.12);
    return;
  }
  if (kind === "rainbow") {
    [523, 659, 784, 988, 1174].forEach((f, i) => {
      const c = ac();
      if (!c) return;
      setTimeout(() => tone(f, 0.14, "sine", 0.1), i * 40);
    });
    return;
  }
  if (kind === "note") {
    tone(698.46, 0.14, "sine", 0.16);
    tone(880, 0.2, "triangle", 0.12);
    return;
  }
  if (kind === "gem") {
    tone(987.77, 0.1, "triangle", 0.14);
    tone(1318.5, 0.18, "sine", 0.1);
    return;
  }
  const base = 523.25 * bump;
  tone(base, 0.09, "sine", 0.16, (Math.random() * 2 - 1) * 18);
  tone(base * 1.5, 0.14, "triangle", 0.08);
}

export function sfxMiss() {
  tone(196, 0.16, "sine", 0.08);
}

export function sfxThrow() {
  noiseBurst(0.18, 0.12, 400);
  tone(392, 0.2, "triangle", 0.1);
  tone(659, 0.24, "sine", 0.08);
}

export function sfxPulse() {
  tone(440, 0.12, "sine", 0.14);
  tone(880, 0.2, "triangle", 0.12);
  noiseBurst(0.12, 0.06, 1200);
}

export function sfxPower() {
  tone(523, 0.1, "square", 0.06);
  tone(784, 0.18, "sine", 0.1);
}

export function sfxWin() {
  const notes = [523, 659, 784, 1046, 784, 1318];
  notes.forEach((f, i) => setTimeout(() => tone(f, 0.22, "triangle", 0.14), i * 90));
}

export function sfxUi() {
  tone(660, 0.07, "sine", 0.08);
}

export function startMusic() {
  stopMusic();
  const c = ac();
  if (!c || !music || !musicOn || muted) return;
  const pattern = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 349.23, 440.0];
  let i = 0;
  const beat = 0.55;
  const tick = () => {
    if (!ctx || !music || !musicOn || muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(pattern[i % pattern.length]!, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + beat * 0.95);
    const o2 = ctx.createOscillator();
    o2.type = "triangle";
    o2.frequency.setValueAtTime(pattern[i % pattern.length]! * 2, t);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(0.03, t + 0.03);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + beat * 0.7);
    o.connect(g);
    g.connect(music);
    o2.connect(g2);
    g2.connect(music);
    o.start(t);
    o.stop(t + beat);
    o2.start(t);
    o2.stop(t + beat);
    i += 1;
    musicTimer = window.setTimeout(tick, beat * 1000);
  };
  tick();
}

export function stopMusic() {
  if (musicTimer != null) {
    clearTimeout(musicTimer);
    musicTimer = null;
  }
}
