import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  ChevronLeft,
  Gift,
  Heart,
  Music,
  Settings,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { createAudio } from "@/game/audio";
import { createBonus, BONUS_GOAL, ROUND_TIME, sceneForLevel, type Cue, type Hud } from "@/game/bonus";
import { loadSave, writeSave } from "@/game/save";
import { BANKS, preloadVoices, silence, speak } from "@/game/voice";

const HEART = "/sprites/items/heart.png";
const STAR = "/sprites/items/star.png";
const GEM = "/sprites/items/gem.png";

const KCOIN_SPIN = [
  "/sprites/moneybags/kcoin-1.png",
  "/sprites/moneybags/kcoin-2.png",
  "/sprites/moneybags/kcoin-3.png",
  "/sprites/moneybags/kcoin-4.png",
];

const SPARK_FX = [
  "/sprites/moneybags/spark-1.png",
  "/sprites/moneybags/spark-2.png",
  "/sprites/moneybags/spark-3.png",
  "/sprites/moneybags/spark-4.png",
];

const ART = {
  bg: "/sprites/bg/level-1.jpg",
  coin: "/sprites/items/heart.png",
  gem: "/sprites/items/rainbow.png",
  stan: "/art/stan.png",
  nova: "/art/nova.png",
  annie: "/sprites/family/annie.png",
  michael: "/sprites/family/michael.png",
  grandma: "/sprites/family/grandma.png",
  kelly: "/sprites/family/kelly.png",
};

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

function clock(t: number) {
  const s = Math.max(0, Math.ceil(t));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function applyCues(
  cues: Cue[],
  audio: ReturnType<typeof createAudio> | null,
  muted: boolean,
  line: string | null,
) {
  const said = line ?? undefined;
  for (const c of cues) {
    if (c === "coin") audio?.coin();
    else if (c === "gem") audio?.gem();
    else if (c === "kcoin") audio?.kcoin(); else if (c === "combo") audio?.combo(8);
    else if (c === "rush") audio?.rush();
    else if (c === "laser") audio?.laser();
    else if (c === "nuke") audio?.nuke();
    else if (c === "bomb") audio?.fire();
    else if (c === "fire") {
      audio?.fire();
    } else if (c === "bonus") {
      audio?.bonus();
    } else if (c === "win") {
      audio?.win();
    } else if (c === "tick") audio?.tick();
    else if (c === "start") speak("start", muted, said);
    else if (c === "endlow") speak("endlow", muted, said);
    else if (c === "endhot") speak("endhot", muted, said);
  }
}

const emptyHud = (): Hud => ({
  phase: "title",
  timeLeft: ROUND_TIME,
  coinsCollected: 0,
  familyPoints: 2450,
  familyGain: 0,
  totalCoins: 0,
  level: 1,
  catches: 0,
  hitHeart: 0,
  missHeart: 0,
  hitGem: 0,
  missGem: 0,
  hitK: 0,
  missK: 0,
  stageNeed: 10,
  stageCleared: false,
  finale: false,
  combo: 0,
  comboLabel: "Ready",
  streak: 7,
  multiplier: 1,
  onFire: false,
  teamScore: 1250,
  bestTeam: 2800,
  bonusTaps: 0,
  pose: "idle",
  familySaved: 42,
  line: BANKS.ready[0],
  shake: 0,
  highScore: 0,
  roundScore: 0,
  bonusHit: false,
  mascotFrame: 0,
  squashX: 1,
  squashY: 1,
  pickups: [],
  floaters: [],
  sparks: [],
  flash: 0,
  power: null,
  laserReady: false,
  nukeReady: false,
  stanPose: "idle",
  novaPose: "idle",
  novaLine: null,
  anim: 0,
  stanFrame: 0,
  novaFrame: 0,
});

export function BonusView() {
  const gameRef = useRef<ReturnType<typeof createBonus> | null>(null);
  const audioRef = useRef<ReturnType<typeof createAudio> | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const voiceOffRef = useRef(false);
  const [hud, setHud] = useState<Hud>(emptyHud);
  const [musicOn, setMusicOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [names, setNames] = useState(["Annie", "Michael", "Grandma", "Kelly"]);
  const [bgSeed, setBgSeed] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const actionRef = useRef<HTMLButtonElement>(null);
  const resumeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (hud.phase === "paused" || hud.phase === "results") resumeRef.current?.focus();
    else actionRef.current?.focus();
  }, [hud.phase]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key.toLowerCase() === "p") {
        const game = gameRef.current;
        if (game?.hud.phase === "playing") { event.preventDefault(); game.pause(); }
        else if (game?.hud.phase === "paused") { event.preventDefault(); game.resume(); }
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  useEffect(() => {
    const saved = loadSave();
    if (!saved.bgSeed) {
      const next = 1 + Math.floor(Math.random() * 3);
      writeSave({ bgSeed: next });
      setBgSeed(next);
    } else {
      setBgSeed(saved.bgSeed);
    }
  }, []);

  useEffect(() => {
    voiceOffRef.current = !voiceOn;
  }, [voiceOn]);

  useEffect(() => {
    const game = createBonus();
    const audio = createAudio();
    gameRef.current = game;
    audioRef.current = audio;
    preloadVoices();
    const saved = loadSave();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotion = () => {
      const reduced = loadSave().reducedShake || motion.matches;
      setReducedMotion(reduced);
      game.setReducedShake(reduced);
    };
    applyMotion();
    motion.addEventListener("change", applyMotion);
    audio.setMusicOn(saved.musicOn);
    setMusicOn(saved.musicOn);
    setVoiceOn(saved.voiceOn);
    setNames(saved.names);
    voiceOffRef.current = !saved.voiceOn;

    [HEART, STAR, GEM, ...KCOIN_SPIN, ...SPARK_FX].forEach((src) => {
      const im = new Image();
      im.src = src;
    });
    Object.values(ART).forEach((src) => {
      const im = new Image();
      im.src = src;
    });

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let painted = 0;
    let lastPhase = "title";
    const STEP = 1 / 60;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      try {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      acc += dt;
      let cues: Cue[] = [];
      let steps = 0;
      while (acc >= STEP && steps < 2) {
        cues = cues.concat(game.step(STEP));
        acc -= STEP;
        steps += 1;
      }
      if (acc > STEP) acc = 0;
      if (cues.length) applyCues(cues, audio, voiceOffRef.current, game.hud.line);
      const phase = game.hud.phase;
      if (phase !== lastPhase || now - painted > 32) {
        lastPhase = phase;
        painted = now;
        const snap = game.snapshot();
        audio?.setHeat(phase === "playing" ? (snap.onFire ? snap.combo + 8 : snap.combo) : 0);
        setHud(snap);
      }
      } catch {
        /* keep the screen up if one frame fails */
      }
    };
    raf = requestAnimationFrame(loop);

    const vis = () => {
      if (document.hidden) {
        game.pause();
        silence();
      } else {
        audio.unlock();
      }
    };
    document.addEventListener("visibilitychange", vis);

    return () => {
      motion.removeEventListener("change", applyMotion);
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", vis);
      silence();
      audio.dispose();
    };
  }, []);

  function begin() {
    const audio = audioRef.current;
    audio?.unlock();
    audio?.setMusicOn(musicOn);
    if (musicOn) audio?.startMusic();
    gameRef.current?.start();
    speak("start", !voiceOn, gameRef.current?.hud.line ?? undefined);
  }

  function startAgain() {
    const audio = audioRef.current;
    audio?.unlock();
    audio?.setMusicOn(musicOn);
    if (musicOn) audio?.startMusic();
    gameRef.current?.startOver();
    speak("start", !voiceOn, gameRef.current?.hud.line ?? undefined);
  }

  function toggleMusic() {
    const next = !musicOn;
    setMusicOn(next);
    audioRef.current?.setMusicOn(next);
    if (next) audioRef.current?.startMusic();
    writeSave({ musicOn: next });
  }

  function toggleVoice() {
    const next = !voiceOn;
    setVoiceOn(next);
    voiceOffRef.current = !next;
    writeSave({ voiceOn: next });
    if (!next) silence();
  }

  function onFieldPointer(e: PointerEvent<HTMLDivElement>) {
    if (hud.phase === "title") {
      begin();
      return;
    }
    if (hud.phase !== "playing") return;
    const el = fieldRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    gameRef.current?.tapAt(x, y);
  }

  const playing = hud.phase === "playing";
  const bonusPct = Math.min(100, (hud.bonusTaps / BONUS_GOAL) * 100);
  const lovePct = Math.min(100, Math.round(hud.combo * 7 + bonusPct * 0.3));
  const shake = hud.shake * hud.shake;
  const sx = playing && !reducedMotion ? (Math.random() * 2 - 1) * 18 * shake : 0;
  const sy = playing && !reducedMotion ? (Math.random() * 2 - 1) * 14 * shake : 0;
  const progressLabel = hud.bonusTaps >= BONUS_GOAL ? `${BONUS_GOAL} / ${BONUS_GOAL}` : `${hud.bonusTaps} / ${BONUS_GOAL}`;
  const family = [
    { name: names[0], img: ART.annie, pts: 2950 },
    { name: names[1], img: ART.michael, pts: 3750 },
    { name: names[2], img: ART.grandma, pts: 3250 },
    { name: names[3], img: ART.kelly, pts: 2900, crown: true },
  ];
  const scene = sceneForLevel(hud.level);
  const stageLook = ((Math.max(1, hud.level) - 1) % 15) + 1;

  return (
    <div className={`shell${reducedMotion ? " reduced-motion" : ""}`}>
      <div
        className={`phone${hud.onFire ? " is-fire" : ""}${hud.bonusHit ? " is-bonus" : ""}${playing && hud.combo >= 5 ? " is-hot" : ""}`}
        style={{ transform: `translate(${sx}px, ${sy}px)` }}
      >
        {hud.phase !== "title" && (
          <img className="phone-bg" src={scene.bg} alt="" draggable={false} />
        )}
        {hud.phase !== "title" && (
        <div className="sky-motes" aria-hidden>
          {Array.from({ length: 5 }, (_, i) => (
            <img
              key={i}
              className="mote"
              src={i % 5 === 0 ? STAR : HEART}
              alt=""
              style={{
                left: `${(i * 7.3) % 100}%`,
                animationDuration: `${7 + (i % 5) * 1.4}s`,
                animationDelay: `${-i * 0.8}s`,
                width: 18 + (i % 4) * 10,
              }}
            />
          ))}
        </div>
        )}
        <div className="hit-flash" style={{ opacity: reducedMotion ? 0 : hud.flash * 0.72 }} />
        {hud.power === "laser" && <div className="laser-beam" />}
        {hud.power === "nuke" && <div className="nuke-blast" />}
        {hud.phase === "title" && (
          <button type="button" className="cover-splash" onClick={begin}>
            <img src="/cover/title.jpg?v=load" alt="Valentine Crush" draggable={false} />
            <span>Tap to play</span>
          </button>
        )}
        <div className="phone-wash" />

        <header className="love-top">
          <button
            type="button"
            className="ghost-round"
            aria-label={playing ? "Pause" : "Back"}
            onClick={() => {
              if (playing) gameRef.current?.pause();
              else if (hud.phase === "paused" || hud.phase === "results") {
                gameRef.current?.toTitle();
                speak("ready", !voiceOn, gameRef.current?.hud.line ?? undefined);
              }
            }}
          >
            <ChevronLeft size={18} strokeWidth={2.4} />
          </button>
          <div className={`time-pill${playing && hud.timeLeft <= 5 ? " hurry" : ""}`}>
            <b className="tabular">{clock(hud.phase === "title" ? ROUND_TIME : hud.timeLeft)}</b>
          </div>
          <div className="sound-pair">
            <button
              type="button"
              className={`ghost-round${musicOn ? "" : " is-off"}`}
              aria-pressed={musicOn}
              aria-label={musicOn ? "Turn music off" : "Turn music on"}
              onClick={toggleMusic}
            >
              <Music size={14} strokeWidth={2.4} />
            </button>
            <button
              type="button"
              className="ghost-round"
              aria-label="Settings"
              onClick={() => {
                setConfirmReset(false);
                setSettingsOpen(true);
              }}
            >
              <Settings size={14} strokeWidth={2.4} />
            </button>
          </div>
        </header>
        {hud.phase !== "title" && (
          <h1 className={`stage-title s${stageLook}`}>{scene.name}</h1>
        )}

        <p className="demo-disclaimer">Demo game only. Game score is separate from Family Points. Savings, Family Points and streaks are read-only simulated context — no real money, rewards or family account is connected.</p>
        <div className="game-controls">
          <button ref={actionRef} type="button" disabled={hud.phase === "paused" || hud.phase === "results"} onClick={() => {
            if (hud.phase === "title") begin();
            else { const target = gameRef.current?.hud.pickups[0]; if (target) gameRef.current?.tapId(target.id); }
          }}>{hud.phase === "title" ? "Start game" : "Catch next coin"}</button>
          <button type="button" aria-pressed={reducedMotion} onClick={() => {
            const next = !reducedMotion;
            setReducedMotion(next); gameRef.current?.setReducedShake(next); writeSave({ reducedShake: next });
          }}>{reducedMotion ? "Enable effects" : "Reduce motion"}</button>
        </div>
        <p className="keyboard-help">Tab to controls · Enter/Space to catch · P or Escape to pause/resume</p>
        <p className="level-progress" aria-live="polite">Stage {hud.level} of 15. Score {fmt(hud.stageNeed)} points to pass.</p>

        <div
          ref={fieldRef}
          className={`field${hud.phase === "title" ? " is-start" : ""}`}
          onPointerDown={onFieldPointer}
        >
          {hud.phase === "title" &&
            [
              [18, 16, 54],
              [42, 8, 70],
              [68, 18, 48],
              [84, 34, 40],
              [30, 36, 36],
              [58, 28, 44],
            ].map(([x, y, size], i) => (
              <img
                key={i}
                className="title-heart"
                src={i === 4 ? STAR : HEART}
                alt=""
                style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
                draggable={false}
              />
            ))}
          {hud.phase === "title" && (
            <button type="button" className="title-play" onClick={begin}>
              Tap to play
            </button>
          )}
          {hud.pickups.map((p) => (
            <button
              key={p.id}
              disabled={!playing}
              type="button"
              className={`pickup pickup-${p.kind}${p.fromStan ? " from-stan" : ""}`}
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                transform: `translate(-50%, -50%) rotate(${p.rot}deg)`,
                opacity: Math.min(1, p.life / 0.35),
                zIndex: p.fromStan ? 8 : p.kind === "kcoin" ? 6 : 5,
              }}
              aria-label={p.kind === "bomb" ? "Bomb" : p.kind === "kcoin" ? "250 love coin" : p.kind === "gem" ? "Diamond" : "Heart"}
              onClick={(e) => { if (e.detail === 0) gameRef.current?.tapId(p.id); }}
              onPointerDown={(e) => {
                e.stopPropagation();
                gameRef.current?.tapId(p.id);
              }}
            >
              {p.kind === "bomb" ? (
                <svg className="bomb-svg" viewBox="0 0 64 64" aria-hidden>
                  <circle cx="32" cy="40" r="18" fill="#141414" stroke="#ff2a2a" strokeWidth="3" />
                  <ellipse cx="24" cy="34" rx="5" ry="3.5" fill="#6e6e6e" />
                  <path d="M42 28c6-8 12-12 16-16" fill="none" stroke="#6a4630" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="58" cy="10" r="4.5" fill="#ffe14a" />
                  <circle cx="58" cy="10" r="2" fill="#ff5a12" />
                </svg>
              ) : p.kind !== "gem" ? (
                <img
                  src={
                    p.kind === "kcoin"
                      ? KCOIN_SPIN[((Math.floor(p.bob * 4) % 4) + 4) % 4]
                      : HEART
                  }
                  alt=""
                  draggable={false}
                />
              ) : (
                <img className="gem-face" src={GEM} alt="" draggable={false} />
              )}
              {p.kind === "gem" && (
                <span className="diamond" aria-hidden>
                  <b />
                  <em />
                </span>
              )}
              {p.fromStan && <span className="star-streak" aria-hidden />}
              {p.kind === "kcoin" && (
                <span className="kcoin-tag">
                  <b>{p.value}</b>
                </span>
              )}
            </button>
          ))}

          {hud.floaters.map((f) => (
            <span
              key={f.id}
              className={`floater tone-${f.tone}`}
              style={{
                left: `${f.x}%`,
                top: `${f.y}%`,
                opacity: f.life / f.max,
              }}
            >
              {f.text}
            </span>
          ))}

          {hud.sparks.map((s) => {
            const fi = Math.min(3, Math.max(0, Math.floor((1 - s.life / s.max) * 4)));
            return (
              <img
                key={s.id}
                className="spark-img"
                src={SPARK_FX[fi]}
                alt=""
                draggable={false}
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  width: 28,
                  height: 28,
                  opacity: Math.min(1, s.life / s.max + 0.15),
                }}
              />
            );
          })}

          {playing && (
            <div className="power-rail">
              <button
                type="button"
                className={`power-icon laser${hud.laserReady ? " is-on" : ""}`}
                disabled={!hud.laserReady}
                aria-label="Laser special"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  gameRef.current?.usePower("laser");
                }}
              >
                <i />
              </button>
              <button
                type="button"
                className={`power-icon nuke${hud.nukeReady ? " is-on" : ""}`}
                disabled={!hud.nukeReady}
                aria-label="Nuke special"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  gameRef.current?.usePower("nuke");
                }}
              >
                <i />
              </button>
            </div>
          )}
        </div>

        <section
          className={`bonus-card${hud.bonusHit ? " filled" : ""}${hud.phase === "title" ? " is-start" : ""}`}
          onClick={hud.phase === "title" ? begin : undefined}
        >
          <img src={ART.coin} alt="" className="bonus-heart" />
          <div className="bonus-copy">
            <p>{hud.phase === "title" ? "Tap to start" : `Collect ${BONUS_GOAL} hearts for family bonus`}</p>
            <div className="track">
              <div className="fill" style={{ width: `${bonusPct}%` }} />
            </div>
          </div>
          <b className="bonus-count tabular">{progressLabel}</b>
          <Gift size={28} className={`gift${hud.bonusHit ? " pop" : ""}`} strokeWidth={1.8} />
        </section>

        <section className="score-card">
          <div className="score-grid">
            <div className="meter">
              <p className="meter-kicker">
                <Trophy size={12} strokeWidth={2.4} /> Team Score
              </p>
              <p className="meter-val tabular">{fmt(hud.teamScore)}</p>
              <p className="meter-sub good">{hud.roundScore > 0 ? `+${fmt(hud.roundScore)}` : "to the family"}</p>
            </div>
            <div className="meter">
              <p className="meter-kicker">
                <Heart size={12} strokeWidth={2.4} /> Kindness Combo
              </p>
              <p className="meter-val tabular">{hud.combo}</p>
              <p className="meter-sub good">
                {hud.nukeReady ? "Nuke ready" : hud.laserReady ? "Laser ready" : hud.combo >= 30 ? `${Math.max(0, 50 - hud.combo)} to nuke` : `${Math.max(0, 30 - hud.combo)} to laser`}
              </p>
            </div>
            <div className="meter">
              <p className="meter-kicker">Family Love Meter</p>
              <div className="love-meter">
                <span style={{ width: `${lovePct}%` }} />
              </div>
              <p className="meter-sub">{lovePct}% · {lovePct >= 70 ? "So much love!" : lovePct >= 35 ? "Amazing!" : "Building"}</p>
            </div>
          </div>
          <div className="family-row" aria-label="Family">
            {family.map((mate) => (
              <figure key={mate.img} className={`mate${mate.crown ? " crown" : ""}`}>
                <img src={mate.img} alt="" />
                <figcaption>
                  <b>{mate.name}</b>
                  <span className="tabular">{fmt(mate.pts)}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {hud.phase !== "playing" && hud.phase !== "title" && (
          <div className={`veil veil-${hud.phase}`}>
            {hud.phase === "paused" && (
              <div className="panel">
                <p className="eyebrow">Paused</p>
                <h2>We'll hold this with you.</h2>
                <p className="lede">{clock(hud.timeLeft)} left on the clock.</p>
                <div className="actions">
                  <button ref={resumeRef} type="button" className="btn-primary" onClick={() => gameRef.current?.resume()}>
                    Resume
                  </button>
                  <button type="button" className="btn-ghost" onClick={begin}>
                    Restart
                  </button>
                  <button type="button" className="btn-ghost" onClick={toggleMusic}>
                    {musicOn ? "Music on" : "Music off"}
                  </button>
                  <button type="button" className="btn-ghost" onClick={toggleVoice}>
                    {voiceOn ? "Voice on" : "Voice off"}
                  </button>
                </div>
              </div>
            )}

            {hud.phase === "results" && hud.finale && (
              <div className="fireworks" aria-hidden>
                {Array.from({ length: 36 }, (_, i) => (
                  <span
                    key={`fw-${i}`}
                    className={`fw${i % 3 === 0 ? " fw-big" : ""}`}
                    style={{
                      left: `${4 + ((i * 17) % 92)}%`,
                      animationDelay: `${(i % 9) * 0.22}s`,
                      animationDuration: `${1.7 + (i % 5) * 0.28}s`,
                      color: ["#ff4d7a", "#ffe56a", "#fff", "#c9a4ff", "#7ad0ff", "#ffd36a", "#ff9ad8"][i % 7],
                    }}
                  >
                    <i />
                  </span>
                ))}
                {Array.from({ length: 26 }, (_, i) => (
                  <img
                    key={`kc-${i}`}
                    className="kyrec-shot"
                    src={KCOIN_SPIN[i % KCOIN_SPIN.length]}
                    alt=""
                    draggable={false}
                    style={{
                      left: `${3 + ((i * 13) % 90)}%`,
                      animationDelay: `${(i % 8) * 0.18}s`,
                      animationDuration: `${2.1 + (i % 4) * 0.35}s`,
                      width: 28 + (i % 4) * 14,
                      height: 28 + (i % 4) * 14,
                    }}
                  />
                ))}
              </div>
            )}
            {hud.phase === "results" && (
              <div className="panel">
                {hud.finale ? (
                  <>
                    <p className="eyebrow">Level 15 cleared</p>
                    <h2>Valentine Crush</h2>
                    <p className="result tabular">{fmt(hud.familyPoints)}</p>
                    <p className="lede">Family points gathered. This round added {fmt(hud.familyGain)}.</p>
                  </>
                ) : (
                  <>
                    <p className="eyebrow">{hud.power === "nuke" ? "Nuke cleared the stage" : hud.bonusHit ? "Family bonus unlocked" : "Round done."}</p>
                    <h2>{hud.stageCleared ? "Stage cleared." : "Not this time."}</h2>
                    <p className="result tabular">{fmt(hud.roundScore)}</p>
                    <p className="lede">
                      {hud.stageCleared
                        ? `Stage cleared. +${fmt(hud.familyGain)} family points. Miss the stage and that payout is gone.`
                        : `No family points. Clear the stage to bank them. This one needs ${fmt(hud.stageNeed)}.`}
                    </p>
                  </>
                )}
                <p className="best">Hearts {hud.hitHeart} hit, {hud.missHeart} missed · Diamonds {hud.hitGem} hit, {hud.missGem} missed · 250s {hud.hitK} hit, {hud.missK} missed</p>
                <p className="best">Team level {hud.level} · {scene.name} · {hud.totalCoins} lifetime hearts</p>
                <div className="actions">
                  <button ref={resumeRef} type="button" className="btn-primary" onClick={hud.finale ? startAgain : begin}>
                    {hud.finale ? "Start again" : "Play again"}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => gameRef.current?.toTitle()}>
                    Home
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {settingsOpen && (
          <div className="settings-veil" role="dialog" aria-label="Settings">
            <div className="panel">
              <p className="eyebrow">Settings</p>
              <h2>Stage {hud.level} of 15</h2>
              <p className="lede">{scene.name}. Score {fmt(scene.need)} points to pass. Ninety seconds. Streak 30 is a laser. Streak 50 is a nuke and it clears the stage.</p>
              <div className="name-edit">
                {family.map((mate, i) => (
                  <label key={mate.img}>
                    <img src={mate.img} alt="" />
                    <input
                      value={names[i]}
                      maxLength={16}
                      aria-label={`Name for avatar ${i + 1}`}
                      onChange={(e) => {
                        const next = names.slice();
                        next[i] = e.target.value.slice(0, 16);
                        setNames(next);
                        writeSave({ names: next as [string, string, string, string] });
                      }}
                    />
                  </label>
                ))}
              </div>
              <p className="best">One picture per stage. Fifteen stages, then it stops. Your stage stays on this device until you start again.</p>
              {confirmReset ? (
                <div className="actions">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      gameRef.current?.resetProgress();
                      setConfirmReset(false);
                      setSettingsOpen(false);
                    }}
                  >
                    Yes, level 1
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setConfirmReset(false)}>
                    Keep my level
                  </button>
                </div>
              ) : (
                <div className="actions">
                  <button type="button" className="btn-primary" onClick={() => setSettingsOpen(false)}>
                    Keep going
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setConfirmReset(true)}>
                    Start again at level 1
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
