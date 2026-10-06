type Bus = { master: GainNode; sfx: GainNode; music: GainNode };

export function createAudio() {
  let ctx: AudioContext | null = null;
  let bus: Bus | null = null;
  let musicOn = true;
  let musicTimer: number | null = null;
  let musicStep = 0;
  let heat = 0;
  let noiseBuf: AudioBuffer | null = null;

  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC({ latencyHint: "interactive" });
    const master = ctx.createGain();
    const sfx = ctx.createGain();
    const music = ctx.createGain();
    sfx.gain.value = 0.72;
    music.gain.value = musicOn ? 0.28 : 0;
    master.gain.value = 0.9;
    sfx.connect(master);
    music.connect(master);
    master.connect(ctx.destination);
    bus = { master, sfx, music };
  }

  function unlock() {
    ensure();
    if (ctx && ctx.state === "suspended") void ctx.resume();
  }

  function setMusicOn(next: boolean) {
    musicOn = next;
    if (bus && ctx) {
      bus.music.gain.setTargetAtTime(next ? 0.28 : 0, ctx.currentTime, 0.01);
    }
  }

  function beep(
    freq: number,
    dur: number,
    type: OscillatorType = "sine",
    gain = 0.12,
    dest: "sfx" | "music" = "sfx",
    slide?: number,
  ) {
    if (!ctx || !bus) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest === "sfx" ? bus.sfx : bus.music);
    o.start(t);
    o.stop(t + dur + 0.03);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }

  function noise(dur: number, gain: number, highpass = 0) {
    if (!ctx || !bus) return;
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node: AudioNode = src;
    if (highpass > 0) {
      const f = ctx.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = highpass;
      src.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(bus.sfx);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  function setHeat(n: number) {
    heat = Math.max(0, n);
  }

  function startMusic() {
    if (musicTimer != null) return;
    const bass = [98, 98, 123, 146, 110, 98, 131, 164];
    const lead = [523, 659, 784, 880, 1046, 880, 784, 659];
    const tick = () => {
      if (!ctx || !musicOn) {
        musicTimer = window.setTimeout(tick, 140);
        return;
      }
      const beat = musicStep % 16;
      const tempo = 168;
      if (beat % 8 === 0) {
        beep(130, 0.08, "sine", 0.12, "music", 55);
        noise(0.03, 0.035, 180);
      }
      if (beat % 8 === 4) noise(0.04, 0.02, 900);
      if (beat % 4 === 0) {
        const b = bass[(musicStep / 4) % bass.length]!;
        beep(b, 0.1, "triangle", 0.03, "music");
      }
      if (beat % 2 === 0) {
        const n = lead[(musicStep / 2) % lead.length]!;
        beep(n, 0.09, "sine", 0.02, "music");
      }
      musicStep++;
      musicTimer = window.setTimeout(tick, tempo);
    };
    musicTimer = window.setTimeout(tick, 2200);
  }

  function stopMusic() {
    if (musicTimer != null) {
      clearTimeout(musicTimer);
      musicTimer = null;
    }
  }

  return {
    unlock,
    setMusicOn,
    setHeat,
    startMusic,
    stopMusic,
    coin() {
      const lift = 1 + Math.min(0.45, heat * 0.02);
      noise(0.02, 0.08, 1800);
      beep(980 * lift, 0.04, "square", 0.08);
    },
    gem() {
      noise(0.03, 0.07, 1000);
      beep(880, 0.04, "square", 0.07);
      beep(1320, 0.05, "square", 0.06);
    },
    kcoin() {
      noise(0.08, 0.14, 600);
      beep(220, 0.08, "square", 0.1, "sfx", 880);
      beep(1320, 0.07, "square", 0.08);
    },
    combo(n: number) {
      beep(720 + Math.min(n, 24) * 28, 0.035, "square", 0.07);
    },
    rush() {
      noise(0.05, 0.1, 700);
      beep(520, 0.04, "square", 0.08);
      beep(1040, 0.05, "square", 0.07);
    },
    laser() {
      noise(0.12, 0.16, 900);
      beep(180, 0.1, "sawtooth", 0.08, "sfx", 2400);
    },
    nuke() {
      noise(0.22, 0.2, 200);
      beep(90, 0.16, "sawtooth", 0.12, "sfx", 70);
      beep(440, 0.08, "square", 0.1);
    },
    fire() {
      noise(0.08, 0.1, 400);
      beep(180, 0.07, "square", 0.08, "sfx", 900);
      beep(1400, 0.06, "square", 0.07);
    },
    bonus() {
      [392, 523, 659, 784, 1046].forEach((f, i) => {
        window.setTimeout(() => beep(f, 0.2, "triangle", 0.1), i * 85);
      });
    },
    win() {
      [523, 659, 784, 1046, 1318].forEach((f, i) => {
        window.setTimeout(() => beep(f, 0.22, "triangle", 0.11), i * 90);
      });
    },
    tick() {
      beep(880, 0.05, "square", 0.04);
    },
    dispose() {
      stopMusic();
      void ctx?.close();
      ctx = null;
      bus = null;
    },
  };
}

export type AudioApi = ReturnType<typeof createAudio>;
