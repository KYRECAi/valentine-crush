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
import { BANKS, preloadVoices, silence, speak, speakNova } from "@/game/voice";

const STAN_IMG = {
  idle: "/sprites/companions/stan-idle.png?v=5",
  follow: "/sprites/companions/stan-idle.png?v=5",
  throw: "/sprites/companions/stan-throw.png?v=5",
};

const NOVA_IMG = {
  idle: "/sprites/companions/nova-idle.png?v=3",
  point: "/sprites/companions/nova-point.png?v=3",
  cheer: "/sprites/companions/nova-cheer.png?v=3",
};

const HEART = "/sprites/items/heart.png";
const STAR = "/sprites/items/star.png";
const NOTE = "/sprites/items/note.png?v=3";

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
    else if (c === "kcoin") {
      audio?.kcoin();
      speakNova("height", muted);
    } else if (c === "combo") audio?.combo(8);
    else if (c === "rush") audio?.rush();
    else if (c === "laser") audio?.laser();
    else if (c === "nuke") audio?.nuke();
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
  totalCoins: 0,
  level: 1,
  catches: 0,
  stageNeed: 10,
  stageCleared: false,
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
  const handRef = useRef<HTMLSpanElement>(null);
  const voiceOffRef = useRef(false);
  const [hud, setHud] = useState<Hud>(emptyHud);
  const [musicOn, setMusicOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [names, setNames] = useState(["Annie", "Michael", "Grandma", "Kelly"]);
  const [bgSeed, setBgSeed] = useState(0);
  const [throwFilm, setThrowFilm] = useState(0);
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
    if (!throwFilm) return;
    const timer = window.setTimeout(() => setThrowFilm(0), 3400);
    return () => window.clearTimeout(timer);
  }, [throwFilm]);


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

    Object.values(STAN_IMG).forEach((src) => {
      const im = new Image();
      im.src = src;
    });
    Object.values(NOVA_IMG).forEach((src) => {
      const im = new Image();
      im.src = src;
    });
    [HEART, STAR, NOTE, ...KCOIN_SPIN, ...SPARK_FX].forEach((src) => {
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
    const STEP = 1 / 60;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      try {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.1) dt = 0.1;
      acc += dt;
      const hand = handRef.current;
      const field = fieldRef.current;
      if (hand && field) {
        const hr = hand.getBoundingClientRect();
        const fr = field.getBoundingClientRect();
        if (fr.width > 0 && fr.height > 0) {
          game.setHand(
            ((hr.left + hr.width / 2 - fr.left) / fr.width) * 100,
            ((hr.top + hr.height / 2 - fr.top) / fr.height) * 100,
          );
        }
      }
      let cues: Cue[] = [];
      while (acc >= STEP) {
        cues = cues.concat(game.step(STEP));
        acc -= STEP;
      }
      if (cues.length) applyCues(cues, audio, voiceOffRef.current, game.snapshot().line);
      const snap = game.snapshot();
      audio?.setHeat(snap.phase === "playing" ? (snap.onFire ? snap.combo + 8 : snap.combo) : 0);
      if (cues.includes("kcoin")) setThrowFilm((n) => n + 1);
      setHud((prev) => (snap.phase === "title" && prev.phase === "title" ? prev : snap));
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
  const when = new Date();
  const dateLabel = when.toLocaleDateString("en-AU", { day: "numeric", month: "long" });
  const timeLabel = when.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });
  const notes = [
    { img: ART.kelly, text: `${names[3]} sent a love note to ${names[2]}` },
    { img: ART.annie, text: `${names[0]} sent a love note to ${names[1]}` },
    { img: ART.michael, text: `${names[1]} sent a love note to ${names[0]}` },
    { img: ART.grandma, text: `${names[2]} sent a love note to ${names[3]}` },
  ];
  const note = notes[Math.floor(hud.anim / 4) % notes.length] ?? notes[0];
  const family = [
    { name: names[0], img: ART.annie, pts: 2950 },
    { name: names[1], img: ART.michael, pts: 3750 },
    { name: names[2], img: ART.grandma, pts: 3250 },
    { name: names[3], img: ART.kelly, pts: 2900, crown: true },
  ];
  const scene = sceneForLevel(hud.level);
  const goal = playing ? hud.stageNeed : scene.need;
  const scored = playing ? hud.roundScore : 0;
  const left = Math.max(0, goal - scored);

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
          {Array.from({ length: 14 }, (_, i) => (
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
            <ChevronLeft size={22} strokeWidth={2.4} />
          </button>
          <div className={`time-pill${playing && hud.timeLeft <= 5 ? " hurry" : ""}`}>
            <span>Time Left</span>
            <b className="tabular">{clock(hud.phase === "title" ? ROUND_TIME : hud.timeLeft)}</b>
          </div>
          <div className="love-pill">
            <span className="love-bit">
              <img src={ART.coin} alt="" />
              <b className="tabular">{fmt(hud.coinsCollected)}</b>
            </span>
            <span className="love-when">
              <b>{dateLabel}</b>
              <small>{timeLabel}</small>
            </span>
            <span className="love-bit">
              <b className="tabular">{fmt(hud.familyPoints)}</b>
            </span>
          </div>
          <div className="sound-pair">
            <button
              type="button"
              className={`ghost-round${musicOn ? "" : " is-off"}`}
              aria-pressed={musicOn}
              aria-label={musicOn ? "Turn music off" : "Turn music on"}
              onClick={toggleMusic}
            >
              <Music size={16} strokeWidth={2.4} />
            </button>
            <button
              type="button"
              className={`ghost-round${voiceOn ? "" : " is-off"}`}
              aria-pressed={voiceOn}
              aria-label={voiceOn ? "Turn voice off" : "Turn voice on"}
              onClick={toggleVoice}
            >
              {voiceOn ? <Volume2 size={16} strokeWidth={2.4} /> : <VolumeX size={16} strokeWidth={2.4} />}
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
              <Settings size={16} strokeWidth={2.4} />
            </button>
          </div>
        </header>
        <p className="level-chip">
          Stage {Math.min(15, hud.level)} of 15 · {scene.name}
          <span>{left === 0 && playing ? "Stage ready" : `${fmt(scored)} / ${fmt(goal)} pts to pass`}</span>
        </p>

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
          <p className="love-note">
            <img src={note.img} alt="" />
            <span>{note.text}</span>
            <Heart size={14} />
          </p>
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
              aria-label={p.kind === "kcoin" ? "250 love coin" : p.kind === "gem" ? "Rainbow" : "Heart"}
              onClick={(e) => { if (e.detail === 0) gameRef.current?.tapId(p.id); }}
              onPointerDown={(e) => {
                e.stopPropagation();
                gameRef.current?.tapId(p.id);
              }}
            >
              <img
                src={
                  p.kind === "kcoin"
                    ? KCOIN_SPIN[((Math.floor(p.bob * 4) % 4) + 4) % 4]
                    : p.kind === "gem"
                      ? (Math.floor(p.bob) % 2 === 0 ? STAR : NOTE)
                      : HEART
                }
                alt=""
                draggable={false}
              />
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

          <div className="ground" aria-hidden="true">
            <span className="ground-floor" />
            <span className="ground-edge" />
            <span className="ground-disc" />
          </div>

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
          <div className={`stan-anchor pose-${hud.stanPose}`}>
            <img
              className="stan-field"
              src={STAN_IMG[hud.stanPose]}
              alt="Stan"
              draggable={false}
            />
            <span ref={handRef} className="stan-hand" aria-hidden />
          </div>
          <div className="nova-anchor">
            <img
              className={`nova-field pose-${hud.novaPose}${hud.novaPose === "point" ? " glow" : ""}`}
              src={NOVA_IMG[hud.novaPose]}
              alt="Nova"
              draggable={false}
            />
            {hud.novaLine && playing && <p className="nova-bubble">{hud.novaLine}</p>}
          </div>
          {throwFilm > 0 && playing && (
            <video
              key={throwFilm}
              className="throw-film"
              src="/video/stan-throw.mp4"
              autoPlay
              muted
              playsInline
            />
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

            {hud.phase === "results" && (
              <div className="panel">
                <p className="eyebrow">{hud.power === "nuke" ? "Nuke cleared the stage" : hud.bonusHit ? "Family bonus unlocked" : "Round done."}</p>
                <h2>{hud.stageCleared ? "Stage cleared." : "Not this time."}</h2>
                <p className="result tabular">{fmt(hud.roundScore)}</p>
                <p className="lede">
                  {hud.stageCleared
                    ? hud.level >= 15
                      ? `You scored ${fmt(hud.roundScore)}. Stage 15 stays open.`
                      : `You scored ${fmt(hud.roundScore)}. Next stage is ready.`
                    : `You scored ${fmt(hud.roundScore)}. This stage needs ${fmt(hud.stageNeed)}.`}
                </p>
                <p className="best">Family points stay with KYREC Core. This is a love round.</p>
                <p className="best">Team level {hud.level} · {scene.name} · {hud.totalCoins} lifetime hearts</p>
                <div className="actions">
                  <button ref={resumeRef} type="button" className="btn-primary" onClick={begin}>
                    Play again
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
