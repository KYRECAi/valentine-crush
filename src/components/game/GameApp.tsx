import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Heart, Lock, Star, Volume2, VolumeX } from "lucide-react";
import { PlayScreen } from "./PlayScreen";
import { preloadSprites } from "@/lib/game/assets";
import { isMuted, setMuted, sfxUi, sfxWin, startMusic, stopMusic, unlockAudio } from "@/lib/game/audio";
import { LEVELS } from "@/lib/game/levels";
import { applyRunToSave, loadSave } from "@/lib/game/save";
import { FAMILY, type FamilyId, type RunStats, type SaveData, type ScreenId } from "@/lib/game/types";

const EMPTY_SAVE: SaveData = {
  version: 1,
  familyPoints: 2450,
  memberScores: { annie: 2950, michael: 3750, grandma: 3250, kelly: 2900 },
  levelStars: {},
  bestScore: 0,
  totalHearts: 0,
  unlocked: 1,
};

export function GameApp() {
  const [screen, setScreen] = useState<ScreenId>("play");
  const [save, setSave] = useState<SaveData>(EMPTY_SAVE);
  const [levelId, setLevelId] = useState(1);
  const [lastRun, setLastRun] = useState<RunStats | null>(null);
  const [mute, setMute] = useState(false);

  useEffect(() => {
    setSave(loadSave());
    void preloadSprites();
  }, []);

  const go = (next: ScreenId) => {
    sfxUi();
    setScreen(next);
  };

  const playLevel = (id: number) => {
    unlockAudio();
    startMusic();
    sfxUi();
    setLevelId(id);
    setScreen("play");
  };

  const onComplete = useCallback((stats: RunStats, members: Record<FamilyId, number>) => {
    stopMusic();
    sfxWin();
    setLastRun(stats);
    setSave((prev) =>
      applyRunToSave(prev, {
        levelId: stats.levelId,
        score: stats.score,
        hearts: stats.hearts,
        familyPoints: stats.familyPoints,
        stars: stats.stars,
        memberDelta: members,
      }),
    );
    setScreen("results");
  }, []);

  const onExitPlay = useCallback(() => {
    stopMusic();
    setScreen("levels");
  }, []);

  return (
    <Shell
      bg={
        screen === "play"
          ? LEVELS[levelId - 1]?.bg ?? "/sprites/bg/level-1.jpg"
          : screen === "results"
            ? LEVELS[(lastRun?.levelId ?? 1) - 1]?.bg ?? "/sprites/bg/level-1.jpg"
            : "/sprites/bg/level-1.jpg"
      }
    >
      {screen === "title" ? (
        <TitleScreen
          save={save}
          mute={mute}
          onMute={() => {
            const next = !mute;
            setMute(next);
            setMuted(next);
          }}
          onPlay={() => playLevel(Math.min(save.unlocked, 6))}
          onLevels={() => go("levels")}
          onFamily={() => go("family")}
        />
      ) : null}
      {screen === "levels" ? (
        <LevelSelect
          save={save}
          onBack={() => go("title")}
          onPlay={playLevel}
        />
      ) : null}
      {screen === "family" ? (
        <FamilyScreen save={save} onBack={() => go("title")} />
      ) : null}
      {screen === "play" ? (
        <PlayScreen
          levelId={levelId}
          save={save}
          onExit={onExitPlay}
          onComplete={onComplete}
        />
      ) : null}
      {screen === "results" && lastRun ? (
        <ResultsScreen
          run={lastRun}
          save={save}
          onHome={() => go("title")}
          onLevels={() => go("levels")}
          onReplay={() => playLevel(lastRun.levelId)}
          onNext={() => {
            const n = Math.min(6, lastRun.levelId + 1);
            if (n <= save.unlocked) playLevel(n);
            else go("levels");
          }}
        />
      ) : null}
    </Shell>
  );
}

function Shell({ bg, children }: { bg: string; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-dusk-deep">
      <div className="park-fallback relative h-dvh w-full max-w-[430px] overflow-hidden shadow-[0_0_80px_rgb(0_0_0_/_0.45)] sm:h-[min(100dvh-16px,920px)] sm:rounded-[28px]">
        <img
          src={bg}
          alt=""
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
          draggable={false}
        />
        <div className="relative z-10 h-full min-h-0">{children}</div>
      </div>
    </div>
  );
}

function TitleScreen({
  save,
  mute,
  onMute,
  onPlay,
  onLevels,
  onFamily,
}: {
  save: SaveData;
  mute: boolean;
  onMute: () => void;
  onPlay: () => void;
  onLevels: () => void;
  onFamily: () => void;
}) {
  return (
    <div className="relative flex h-full flex-col px-5 pt-[max(1.2rem,env(safe-area-inset-top))] pb-[max(1.2rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between">
        <p className="rounded-full bg-cream/85 px-3 py-1 text-[11px] font-bold tracking-wide text-ink uppercase">
          KYREC Guardian
        </p>
        <button
          type="button"
          aria-label={mute ? "Unmute" : "Mute"}
          onClick={onMute}
          className="grid size-10 place-items-center rounded-full bg-cream/90 text-ink"
        >
          {mute || isMuted() ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      </div>

      <div className="relative mt-6 text-center">
        <p className="text-xs font-bold tracking-[0.22em] text-cream uppercase">It rains love</p>
        <h1 className="font-display mt-1 text-[2.35rem] leading-[0.95] font-semibold text-cream drop-shadow-[0_6px_18px_rgb(35_19_47_/_0.45)]">
          Valentine's
          <br />
          Love Dash
        </h1>
        <p className="mx-auto mt-3 max-w-[16rem] text-sm leading-snug text-cream/90">
          Catch hearts with the family. Stan throws mid-love. Nova points at the high rollers.
        </p>
      </div>

      <div className="relative mt-2 min-h-0 flex-1">
        <img
          src="/sprites/stan/idle.png"
          alt="Stan"
          className="absolute bottom-0 left-[-8%] w-[58%] origin-bottom idle-bob drop-shadow-lg"
        />
        <img
          src="/sprites/nova/cheer.png"
          alt="Nova"
          className="absolute right-[-8%] bottom-0 w-[54%] origin-bottom idle-bob-late drop-shadow-lg"
        />
      </div>

      <div className="relative z-10 space-y-2">
        <div className="glass-panel flex items-center justify-between rounded-full px-4 py-2">
          <span className="text-xs font-bold text-ink-soft">Family points</span>
          <span className="font-display text-lg font-semibold text-love tabular-nums">
            {save.familyPoints.toLocaleString()}
          </span>
        </div>
        <button
          type="button"
          onClick={onPlay}
          className="font-display w-full rounded-full bg-love py-3.5 text-lg font-semibold text-cream shadow-[0_12px_28px_rgb(255_91_138_/_0.38)]"
        >
          Play
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onLevels}
            className="rounded-full bg-cream/92 py-3 text-sm font-bold text-ink"
          >
            6 levels
          </button>
          <button
            type="button"
            onClick={onFamily}
            className="rounded-full bg-cream/92 py-3 text-sm font-bold text-ink"
          >
            Family
          </button>
        </div>
      </div>
    </div>
  );
}

function LevelSelect({
  save,
  onBack,
  onPlay,
}: {
  save: SaveData;
  onBack: () => void;
  onPlay: (id: number) => void;
}) {
  return (
    <div className="flex h-full flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="glass-panel flex items-center gap-2 rounded-[20px] px-2 py-1.5">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-cream-deep px-3 py-2 text-sm font-bold text-ink"
        >
          Back
        </button>
        <h2 className="font-display flex-1 text-center text-base font-semibold text-ink">Choose a sky</h2>
        <span className="w-14" />
      </div>
      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
        {LEVELS.map((lv) => {
          const locked = lv.id > save.unlocked;
          const stars = save.levelStars[String(lv.id)] ?? 0;
          return (
            <button
              key={lv.id}
              type="button"
              disabled={locked}
              onClick={() => onPlay(lv.id)}
              className="relative flex w-full overflow-hidden rounded-[22px] text-left disabled:opacity-70"
            >
              <img src={lv.bg} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="relative flex w-full items-center gap-3 bg-dusk/35 px-3 py-3 backdrop-blur-[2px]">
                <span className="font-display grid size-11 place-items-center rounded-2xl bg-cream/90 text-lg font-semibold text-ink">
                  {lv.id}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-semibold text-cream">{lv.name}</p>
                  <p className="truncate text-xs text-cream/85">{lv.tagline}</p>
                  <div className="mt-1 flex gap-0.5">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`size-3.5 ${s <= stars ? "fill-gold text-gold" : "text-cream/50"}`}
                      />
                    ))}
                  </div>
                </div>
                {locked ? <Lock className="size-5 text-cream" /> : <Heart className="size-5 fill-love text-love" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FamilyScreen({ save, onBack }: { save: SaveData; onBack: () => void }) {
  const entries = FAMILY.map((m) => ({ ...m, score: save.memberScores[m.id] }));
  const top = entries.reduce((a, b) => (a.score >= b.score ? a : b));
  return (
    <div className="flex h-full flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="glass-panel flex items-center gap-2 rounded-[20px] px-2 py-1.5">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-cream-deep px-3 py-2 text-sm font-bold text-ink"
        >
          Back
        </button>
        <h2 className="font-display flex-1 text-center text-base font-semibold text-ink">Family ledger</h2>
        <span className="w-14" />
      </div>
      <div className="glass-panel mt-3 rounded-[24px] p-4">
        <p className="text-[11px] font-bold tracking-wide text-ink-soft uppercase">KYREC Guardian points</p>
        <p className="font-display text-4xl font-semibold text-love tabular-nums">{save.familyPoints.toLocaleString()}</p>
        <p className="mt-1 text-sm text-ink-soft">
          Hearts, notes and stars from Love Dash flow into the family pool. Best run {save.bestScore.toLocaleString()} ·{" "}
          {save.totalHearts.toLocaleString()} hearts all time.
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {entries.map((m) => (
          <div key={m.id} className="glass-panel rounded-[22px] p-3">
            <div className="flex items-center gap-2">
              <img src={m.portrait} alt="" className="size-12 rounded-full object-cover" />
              <div>
                <p className="font-display text-sm font-semibold text-ink">{m.name}</p>
                {top.id === m.id && top.score > 0 ? (
                  <p className="text-[10px] font-bold text-gold">Love lead</p>
                ) : (
                  <p className="text-[10px] font-bold text-ink-soft">Guardian</p>
                )}
              </div>
            </div>
            <p className="font-display mt-2 text-xl font-semibold text-love tabular-nums">{m.score.toLocaleString()}</p>
          </div>
        ))}
      </div>
      <p className="mt-auto pt-4 text-center text-xs leading-relaxed text-cream">
        Stan throws when the love meter glows. Nova never lets a 250-point coin go unnoticed.
      </p>
    </div>
  );
}

function ResultsScreen({
  run,
  save,
  onHome,
  onLevels,
  onReplay,
  onNext,
}: {
  run: RunStats;
  save: SaveData;
  onHome: () => void;
  onLevels: () => void;
  onReplay: () => void;
  onNext: () => void;
}) {
  const level = LEVELS[run.levelId - 1]!;
  const canNext = run.levelId < 6 && run.levelId + 1 <= save.unlocked;
  return (
    <div className="flex h-full flex-col justify-end px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.2rem,env(safe-area-inset-bottom))]">
      <div className="glass-panel rounded-[28px] p-5 text-center">
        <p className="text-[11px] font-bold tracking-wide text-ink-soft uppercase">{level.name}</p>
        <h2 className="font-display text-3xl font-semibold text-ink">So much love</h2>
        <div className="mt-2 flex justify-center gap-1">
          {[1, 2, 3].map((s) => (
            <Star key={s} className={`size-8 ${s <= run.stars ? "fill-gold text-gold" : "text-cream-deep"}`} />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <ResultStat label="Score" value={run.score.toLocaleString()} />
          <ResultStat label="Hearts" value={String(run.hearts)} />
          <ResultStat label="Family" value={`+${run.familyPoints}`} />
        </div>
        <p className="mt-3 text-xs text-ink-soft">
          Combo x{run.maxCombo} · {run.coins} high rollers · {run.notes} love notes
        </p>
        <div className="mt-4 grid gap-2">
          {canNext ? (
            <button
              type="button"
              onClick={onNext}
              className="font-display rounded-full bg-love py-3 font-semibold text-cream"
            >
              Next sky
            </button>
          ) : null}
          <button
            type="button"
            onClick={onReplay}
            className="rounded-full bg-cream-deep py-3 text-sm font-bold text-ink"
          >
            Play again
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onLevels} className="rounded-full bg-cream py-3 text-sm font-bold text-ink">
              Levels
            </button>
            <button type="button" onClick={onHome} className="rounded-full bg-cream py-3 text-sm font-bold text-ink">
              Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-cream-deep/70 px-2 py-2">
      <p className="text-[10px] font-bold tracking-wide text-ink-soft uppercase">{label}</p>
      <p className="font-display text-lg font-semibold text-ink tabular-nums">{value}</p>
    </div>
  );
}
