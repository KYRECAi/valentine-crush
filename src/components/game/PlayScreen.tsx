import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Clock, Gem, Pause, Pointer, Star, Trophy, X } from "lucide-react";
import { sfxCollect, sfxPower, sfxPulse, sfxThrow, startMusic, unlockAudio } from "@/lib/game/audio";
import { renderWorld } from "@/lib/game/render";
import { LoveWorld, type HudSnap } from "@/lib/game/sim";
import { FAMILY, type RunStats, type SaveData } from "@/lib/game/types";
import { LEVELS } from "@/lib/game/levels";

function fmtTime(t: number) {
  const s = Math.max(0, Math.ceil(t));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function fmt(n: number) {
  return Math.round(n).toLocaleString();
}

const STAN: Record<string, string> = {
  idle: "/sprites/stan/idle.png",
  throw: "/sprites/stan/throw.png",
  follow: "/sprites/stan/follow.png",
};
const NOVA: Record<string, string> = {
  idle: "/sprites/nova/idle.png",
  point: "/sprites/nova/point.png",
  cheer: "/sprites/nova/cheer.png",
};

const emptyHud = (): HudSnap => ({
  timeLeft: 0,
  hearts: 0,
  familyPoints: 0,
  bonus: 1,
  score: 0,
  scoreDelta: 0,
  combo: 0,
  comboLabel: "",
  loveMeter: 0,
  members: { annie: 0, michael: 0, grandma: 0, kelly: 0 },
  feed: null,
  stanPose: "idle",
  novaPose: "idle",
  stanLine: null,
  novaLine: null,
  magnetCharges: 3,
  gemCharges: 2,
  burstReady: true,
  heartGoal: 40,
  magnetActive: false,
  gemActive: false,
  shake: 0,
  pulseActive: false,
  pulseScale: 1,
  moneybags: false,
  moneybagsLeft: 0,
});

function initialHud(save: SaveData, levelId: number): HudSnap {
  const level = LEVELS[levelId - 1] ?? LEVELS[0]!;
  return {
    ...emptyHud(),
    timeLeft: level.duration,
    familyPoints: save.familyPoints,
    members: { ...save.memberScores },
    heartGoal: level.heartGoal,
    feed: "Kelly sent a love note to Grandma",
  };
}

export function PlayScreen(props: {
  levelId: number;
  save: SaveData;
  onExit: () => void;
  onComplete: (stats: RunStats, members: HudSnap["members"]) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<LoveWorld | null>(null);
  const [hud, setHud] = useState<HudSnap>(() => initialHud(props.save, props.levelId));
  const [paused, setPaused] = useState(false);
  const [hint, setHint] = useState(true);
  const pausedRef = useRef(false);
  const musicRef = useRef(false);
  pausedRef.current = paused;

  useEffect(() => {
    const world = new LoveWorld(
      props.levelId,
      Date.now(),
      props.save.memberScores,
      props.save.familyPoints,
    );
    worldRef.current = world;
    setHud(world.snapshot());
    setHint(true);
    const hide = window.setTimeout(() => setHint(false), 2800);

    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const fit = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      world.resize(r.width, r.height);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);

    let last = performance.now();
    let hudAcc = 0;
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!pausedRef.current) {
        const prevStan = world.stanPose;
        world.step(dt);
        if (prevStan !== "throw" && world.stanPose === "throw") sfxThrow();
        hudAcc += dt;
        if (hudAcc >= 0.08) {
          hudAcc = 0;
          setHud(world.snapshot());
        }
        if (world.over) {
          setHud(world.snapshot());
          props.onComplete(world.stats(), world.members);
          return;
        }
      }
      renderWorld(ctx, world, now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.clearTimeout(hide);
    };
  }, [props.levelId, props.onComplete]);

  const pointer = (e: PointerEvent<HTMLCanvasElement>) => {
    const world = worldRef.current;
    const canvas = canvasRef.current;
    if (!world || !canvas || paused) return;
    unlockAudio();
    if (!musicRef.current) {
      musicRef.current = true;
      startMusic();
    }
    if (hint) setHint(false);
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const hit = world.tap(x, y);
    if (hit) {
      if (hit.kind === "pulse") sfxPulse();
      else sfxCollect(hit.kind, world.combo);
      setHud(world.snapshot());
    }
  };

  const leader = (Object.entries(hud.members) as [keyof typeof hud.members, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0];

  const shake = hud.shake * hud.shake * 7;
  const sx = shake ? (Math.random() - 0.5) * shake : 0;
  const sy = shake ? (Math.random() - 0.5) * shake : 0;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div
        ref={wrapRef}
        className="absolute inset-0"
        style={shake ? { transform: `translate(${sx}px, ${sy}px)` } : undefined}
      >
        <img
          src={LEVELS[props.levelId - 1]?.bg ?? "/sprites/bg/level-1.jpg"}
          alt=""
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
          draggable={false}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-20 h-full w-full touch-none bg-transparent"
          onPointerDown={pointer}
        />
        <img
          src={STAN[hud.stanPose]}
          alt="Stan"
          className="pointer-events-none absolute bottom-[31%] left-[-2%] z-10 w-[26%] max-w-32 origin-bottom idle-bob select-none"
          draggable={false}
        />
        <img
          src={NOVA[hud.novaPose]}
          alt="Nova"
          className="pointer-events-none absolute right-[-2%] bottom-[31%] z-10 w-[24%] max-w-32 origin-bottom idle-bob-late select-none"
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-x-0 top-[13%] z-[12]">
          <img src="/sprites/items/lantern.png" alt="" className="lantern-hang absolute left-[12%] w-10" />
          <img src="/sprites/items/lantern.png" alt="" className="lantern-hang-late absolute left-[28%] w-9" />
          <img src="/sprites/items/heart.png" alt="" className="absolute top-8 left-[46%] w-8 opacity-90" />
          <img src="/sprites/items/lantern.png" alt="" className="lantern-hang absolute right-[26%] w-10" />
          <img src="/sprites/items/lantern.png" alt="" className="lantern-hang-late absolute right-[10%] w-9" />
        </div>
        {hint ? (
          <div
            className="pointer-events-none absolute left-1/2 z-30 text-cream"
            style={{ top: "40%", transform: `translate(-10%, 18%) scale(${hud.pulseScale})` }}
          >
            <Pointer className="tap-finger size-8 drop-shadow-md" strokeWidth={2.4} />
          </div>
        ) : null}
        {hud.stanLine ? (
          <Speech side="left" text={hud.stanLine} who="Stan" />
        ) : null}
        {hud.novaLine ? (
          <Speech side="right" text={hud.novaLine} who="Nova" />
        ) : null}
      </div>

      <header className="relative z-30 px-3 pt-[max(0.45rem,env(safe-area-inset-top))]">
        <div className="glass-panel flex items-center gap-2 rounded-[18px] px-1.5 py-1">
          <IconBtn onClick={() => setPaused(true)} label="Pause">
            <Pause className="size-4" />
          </IconBtn>
          <h1 className="font-display min-w-0 flex-1 text-center text-[14px] font-semibold tracking-tight text-ink">
            Valentine's Love Dash
          </h1>
          <IconBtn onClick={props.onExit} label="Exit">
            <X className="size-4" />
          </IconBtn>
        </div>
        <div className="mt-1.5 grid grid-cols-4 gap-1">
          <Stat chip="time" label="Time Left" value={fmtTime(hud.timeLeft)} icon={<Clock className="size-3.5" />} />
          <Stat chip="heart" label="Hearts" value={String(hud.hearts)} />
          <Stat chip="star" label="Family Points" value={fmt(hud.familyPoints)} icon={<Star className="size-3.5 fill-gold text-gold" />} />
          <Stat chip="gem" label="Bonus" value={`x${hud.bonus}`} icon={<Gem className="size-3.5" />} hot={hud.gemActive} />
        </div>
        {hud.feed ? (
          <div className="glass-panel mt-1.5 flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold text-ink">
            <img src="/sprites/items/note.png" alt="" className="size-5" />
            <span className="truncate">{hud.feed}</span>
          </div>
        ) : null}
      </header>

      <div className="relative z-0 min-h-0 flex-1 pointer-events-none" />

      <footer className="relative z-30 space-y-1.5 px-3 pb-[max(0.45rem,env(safe-area-inset-bottom))]">
        <div className="glass-panel flex items-center gap-2 rounded-[16px] px-2.5 py-1.5">
          <img src="/sprites/items/heart.png" alt="" className="size-6" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-ink">Collect {hud.heartGoal} hearts for family bonus</p>
            <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-cream-deep">
              <div
                className="h-full rounded-full bg-love transition-[width] duration-300"
                style={{ width: `${Math.min(100, (hud.hearts / hud.heartGoal) * 100)}%` }}
              />
            </div>
          </div>
          <p className="font-display text-[11px] font-semibold text-ink-soft tabular-nums">
            {hud.hearts}/{hud.heartGoal}
          </p>
          <img src="/sprites/items/gift.png" alt="" className="size-6" />
        </div>

        <div className="glass-panel rounded-[18px] px-2.5 py-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <p className="flex items-center gap-1 text-[9px] font-bold tracking-wide text-ink-soft uppercase">
                <Trophy className="size-3 text-gold" /> Team Score
              </p>
              <p className="font-display text-lg leading-none font-semibold text-ink tabular-nums">{fmt(hud.score)}</p>
              <p className="text-[10px] font-bold text-love">+{Math.round(hud.scoreDelta)}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-bold tracking-wide text-ink-soft uppercase">Kindness Combo</p>
              <p className="font-display text-lg leading-none font-semibold text-love">x{hud.combo}</p>
              <p className="text-[10px] font-bold text-ink-soft">{hud.comboLabel || "Tap to start"}</p>
            </div>
            <div>
              <p className="text-right text-[9px] font-bold tracking-wide text-ink-soft uppercase">Love Meter</p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream-deep">
                <div
                  className="h-full rounded-full bg-gem transition-[width] duration-300"
                  style={{ width: `${Math.round(hud.loveMeter * 100)}%` }}
                />
              </div>
              <p className="mt-0.5 text-right text-[10px] font-bold text-gem">
                {Math.round(hud.loveMeter * 100)}% {hud.loveMeter > 0.55 ? "So much love!" : "Warming up"}
              </p>
            </div>
          </div>
          <div className="mt-1.5 flex justify-between gap-1">
            {FAMILY.map((m) => (
              <div key={m.id} className="flex min-w-0 flex-1 flex-col items-center">
                <div className="relative">
                  <img
                    src={m.portrait}
                    alt={m.name}
                    className="size-9 rounded-full border-2 border-white object-cover shadow-sm"
                  />
                  {leader === m.id ? (
                    <span className="absolute -top-1 -right-1 grid size-3.5 place-items-center rounded-full bg-gold text-[8px] text-ink">
                      <Star className="size-2 fill-ink text-ink" />
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-[9px] font-bold text-ink">{m.name}</p>
                <p className="text-[9px] font-semibold text-love tabular-nums">{fmt(hud.members[m.id])}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-end justify-between px-5">
          <PowerBtn
            label="Magnet"
            count={hud.magnetCharges}
            active={hud.magnetActive}
            disabled={hud.magnetCharges <= 0}
            onClick={() => {
              if (worldRef.current?.useMagnet()) {
                sfxPower();
                setHud(worldRef.current.snapshot());
              }
            }}
          >
            <img src="/sprites/items/magnet.png" alt="" className="size-8" />
          </PowerBtn>
          <button
            type="button"
            disabled={!hud.burstReady}
            onClick={() => {
              if (worldRef.current?.useBurst()) {
                sfxPulse();
                setHud(worldRef.current.snapshot());
              }
            }}
            className="pulse-glow grid size-14 place-items-center rounded-full border-4 border-white bg-love shadow-[0_10px_24px_rgb(255_91_138_/_0.45)] disabled:opacity-50"
            aria-label="Love burst"
          >
            <img src="/sprites/items/heart.png" alt="" className="size-8" />
          </button>
          <PowerBtn
            label="Gem"
            count={hud.gemCharges}
            active={hud.gemActive}
            disabled={hud.gemCharges <= 0}
            onClick={() => {
              if (worldRef.current?.useGem()) {
                sfxPower();
                setHud(worldRef.current.snapshot());
              }
            }}
          >
            <img src="/sprites/items/gem.png" alt="" className="size-8" />
          </PowerBtn>
        </div>
      </footer>

      {paused ? (
        <div className="absolute inset-0 z-50 grid place-items-center bg-dusk/70 px-8 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-xs rounded-[28px] p-5 text-center">
            <p className="font-display text-2xl font-semibold text-ink">Paused</p>
            <p className="mt-1 text-sm text-ink-soft">The family can wait a beat.</p>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                className="rounded-full bg-love px-4 py-3 font-display text-sm font-semibold text-cream"
                onClick={() => setPaused(false)}
              >
                Keep catching
              </button>
              <button
                type="button"
                className="rounded-full bg-cream-deep px-4 py-3 text-sm font-bold text-ink"
                onClick={props.onExit}
              >
                Leave run
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Speech({ side, text, who }: { side: "left" | "right"; text: string; who: string }) {
  return (
    <div
      className={`absolute bottom-[48%] z-30 max-w-[42%] rounded-2xl bg-cream/95 px-2.5 py-1.5 text-[11px] font-bold text-ink shadow-glass ${
        side === "left" ? "left-[4%]" : "right-[4%]"
      }`}
    >
      <p className="text-[8px] tracking-wide text-love uppercase">{who}</p>
      <p>{text}</p>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-full bg-cream-deep text-ink"
    >
      {children}
    </button>
  );
}

function Stat({
  label,
  value,
  icon,
  chip,
  hot,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  chip: "time" | "heart" | "star" | "gem";
  hot?: boolean;
}) {
  return (
    <div className={`glass-panel rounded-[12px] px-1 py-1 text-center ${hot ? "ring-2 ring-gem" : ""}`}>
      <p className="flex items-center justify-center gap-0.5 text-[9px] font-bold tracking-wide text-ink-soft uppercase">
        {chip === "heart" ? (
          <img src="/sprites/items/heart.png" alt="" className="size-3.5" />
        ) : (
          icon
        )}
        {label}
      </p>
      <p className="font-display text-sm font-semibold text-ink tabular-nums">{value}</p>
    </div>
  );
}

function PowerBtn({
  children,
  label,
  count,
  active,
  disabled,
  onClick,
}: {
  children: ReactNode;
  label: string;
  count: number;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`relative grid size-14 place-items-center rounded-full border-2 bg-cream/90 shadow-glass disabled:opacity-45 ${
        active ? "border-love" : "border-white"
      }`}
    >
      {children}
      <span className="absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full bg-love text-[10px] font-bold text-cream">
        {count}
      </span>
    </button>
  );
}
