import { loadSave, writeSave, type SaveData } from "./save";
import { pickLine } from "./voice";

export const ROUND_TIME = 90;
export const ROUND_MAX = 20;
export const BONUS_GOAL = 100;
export const BEST_TEAM_BASE = 2800;

const GRAVITY = 28;
const FALL = 0.72;
const STAN_X = 16;
const STAN_Y = 64;

export type Phase = "title" | "playing" | "paused" | "results";
export type Pose = "idle" | "smirk" | "fire" | "win";
export type StanPose = "idle" | "throw" | "follow";
export type NovaPose = "idle" | "point" | "cheer";
export type Kind = "coin" | "gem" | "kcoin" | "bomb";

export type Pickup = {
  id: number;
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  life: number;
  maxLife: number;
  size: number;
  bob: number;
  value: number;
  coins: number;
  fromStan?: boolean;
  z?: number;
  ox?: number;
  oy?: number;
  tx?: number;
  ty?: number;
};

export type Floater = {
  id: number;
  x: number;
  y: number;
  text: string;
  life: number;
  max: number;
  tone: "gold" | "purple" | "fire";
};

export type Spark = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  hue: number;
};

export type Cue =
  | "coin"
  | "gem"
  | "kcoin"
  | "combo"
  | "fire"
  | "rush"
  | "laser"
  | "nuke"
  | "bomb"
  | "bonus"
  | "win"
  | "start"
  | "more"
  | "ching"
  | "keep"
  | "almost"
  | "tick"
  | "taunt"
  | "hurry"
  | "smug"
  | "miss"
  | "tease"
  | "endlow"
  | "endmid"
  | "endhot";

export type Hud = {
  phase: Phase;
  timeLeft: number;
  coinsCollected: number;
  // Read-only demo context. Production authority belongs to KYREC Core.
  familyPoints: number;
  familyGain: number;
  totalCoins: number;
  level: number;
  combo: number;
  comboLabel: string;
  streak: number;
  multiplier: number;
  onFire: boolean;
  teamScore: number;
  bestTeam: number;
  bonusTaps: number;
  pose: Pose;
  // Read-only demo context. Gameplay must never manufacture savings.
  familySaved: number;
  line: string | null;
  shake: number;
  highScore: number;
  roundScore: number;
  bonusHit: boolean;
  mascotFrame: number;
  squashX: number;
  squashY: number;
  pickups: Pickup[];
  floaters: Floater[];
  sparks: Spark[];
  flash: number;
  power: "laser" | "nuke" | null;
  laserReady: boolean;
  nukeReady: boolean;
  catches: number;
  hitHeart: number;
  missHeart: number;
  hitGem: number;
  missGem: number;
  hitK: number;
  missK: number;
  stageNeed: number;
  stageCleared: boolean;
  finale: boolean;
  stanPose: StanPose;
  novaPose: NovaPose;
  novaLine: string | null;
  anim: number;
  stanFrame: number;
  novaFrame: number;
};

const KIND: Record<Kind, { value: number; coins: number; size: number; life: number }> = {
  coin: { value: 10, coins: 1, size: 70, life: 6.4 },
  gem: { value: 40, coins: 3, size: 62, life: 6.2 },
  kcoin: { value: 250, coins: 10, size: 92, life: 6.8 },
  bomb: { value: 0, coins: 0, size: 78, life: 6.4 },
};

function comboLabel(n: number) {
  if (n >= 50) return "Nuke!";
  if (n >= 30) return "Laser!";
  if (n >= 16) return "Legendary!";
  if (n >= 10) return "So much love!";
  if (n >= 6) return "Amazing!";
  if (n >= 3) return "Sweet!";
  return "Ready";
}

export const STAGES = [
  { name: "Cherry Street", id: "01", need: 1600, spawn: 42 },
  { name: "Pagoda Blossoms", id: "02", need: 2000, spawn: 42 },
  { name: "Lantern Street", id: "03", need: 2400, spawn: 42 },
  { name: "Hideyoshi", id: "04", need: 2900, spawn: 44 },
  { name: "Osaka Castle", id: "05", need: 3400, spawn: 44 },
  { name: "Moat at Dusk", id: "06", need: 4000, spawn: 44 },
  { name: "Castle Lights", id: "07", need: 4600, spawn: 46 },
  { name: "Fox Shrine", id: "08", need: 5300, spawn: 46 },
  { name: "Torii Path", id: "09", need: 6000, spawn: 46 },
  { name: "Tokyo Tower", id: "10", need: 6800, spawn: 48 },
  { name: "Rainy Crossing", id: "11", need: 7600, spawn: 48 },
  { name: "Fog City", id: "12", need: 8500, spawn: 48 },
  { name: "Night River", id: "13", need: 9400, spawn: 50 },
  { name: "Night Canal", id: "14", need: 10400, spawn: 50 },
  { name: "Night Blossoms", id: "15", need: 11500, spawn: 50 },
] as const;

export function stageDef(level: number) {
  return STAGES[Math.min(STAGES.length, Math.max(1, level)) - 1]!;
}

export function sceneForLevel(level: number) {
  const place = stageDef(level);
  return {
    name: place.name,
    bg: `/sprites/stages/${place.id}.jpg?v=trip2`,
    need: place.need,
    spawn: place.spawn,
    trip: 1,
  };
}

function multiplierOf(combo: number) {
  return Math.min(5, 1 + Math.floor(combo / 4) * 0.5);
}

export function createBonus() {
  const save0 = loadSave();
  let id = 1;
  let spawnAcc = 0;
  let comboT = 0;
  let laserUsed = false;
  let nukeUsed = false;
  let powerT = 0;
  let poseT = 0;
  let lineT = 999;
  let fireAnnounced = false;
  let almostAnnounced = false;
  let hurryAnnounced = false;
  let keepCount = 0;
  let lastTick = 99;
  let elapsed = 0;
  let duration = ROUND_TIME;
  let antiT = 0;
  let missBank = 0;
  let teaseDone = false;
  let missSaid = 0;
  let reducedShake = save0.reducedShake;
  let releaseIn = 0;
  let handX = 18;
  let handY = 72;
  let novaX = 82;
  let novaY = 70;
  let novaPointed = false;
  let throwHold = 0;
  let spawnBudget = 0;
  let spawnTotal = 42;
  let laneCursor = 0;
  let novaTalk = 0;
  let cheerHold = 0;
  const LANES = 8;
  const NOVA_CHEER = [
    "Aim higher.",
    "Cute. Now reach.",
    "That's not the top.",
    "Go on. Higher.",
    "Little hearts are practice.",
    "I see a bigger one.",
    "Don't settle.",
  ];
  const NOVA_POINT = [
    "That 250. Aim for it.",
    "Eyes up. That's the one.",
    "Higher. Grab it.",
    "The big love. Go.",
  ];
  let cheerI = 0;
  let pointI = 0;

  const hud: Hud = {
    phase: "title",
    timeLeft: ROUND_TIME,
    coinsCollected: 0,
    familyPoints: save0.familyPoints,
    familyGain: 0,
    totalCoins: save0.totalCoins,
    level: save0.stage,
    catches: 0,
    hitHeart: 0,
    missHeart: 0,
    hitGem: 0,
    missGem: 0,
    hitK: 0,
    missK: 0,
    stageNeed: stageDef(save0.stage).need,
    stageCleared: false,
    finale: false,
    combo: 0,
    comboLabel: "Ready",
    streak: save0.streak,
    multiplier: 1,
    onFire: false,
    teamScore: save0.teamScore,
    bestTeam: save0.bestTeam,
    bonusTaps: 0,
    pose: "idle",
    familySaved: save0.familySaved,
    line: pickLine("ready"),
    shake: 0,
    highScore: save0.highScore,
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
  };

  const cues: Cue[] = [];

  function say(line: string, seconds = 2.2) {
    hud.line = line;
    lineT = seconds;
  }

  function pose(next: Pose, hold = 1.4) {
    hud.pose = next;
    poseT = hold;
  }

  function cue(c: Cue) {
    cues.push(c);
  }

  function tickAnim(dt: number) {
    if (antiT > 0) {
      antiT -= dt;
      if (antiT <= 0) {
        hud.squashX = 0.86;
        hud.squashY = 1.16;
      }
    }
    const spring = 1 - Math.exp(-11 * dt);
    hud.squashX += (1 - hud.squashX) * spring;
    hud.squashY += (1 - hud.squashY) * spring;
  }

  function burst(x: number, y: number, n: number, hue: number) {
    if (hud.sparks.length > 16) return;
    const count = Math.min(n, 6);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 160 + Math.random() * 340;
      hud.sparks.push({
        id: id++,
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 50,
        life: 0.28 + Math.random() * 0.28,
        max: 0.56,
        hue,
      });
    }
  }

  function float(x: number, y: number, text: string, tone: Floater["tone"]) {
    hud.floaters.push({ id: id++, x, y, text, life: 0.7, max: 0.7, tone });
  }

  function spawn(kind: Kind, lane = laneCursor++ % LANES) {
    if (kind === "kcoin" && hud.pickups.some((p) => p.kind === "kcoin")) kind = "coin";
    if (kind === "bomb" && hud.pickups.filter((p) => p.kind === "bomb").length >= 4) kind = "coin";
    const spec = KIND[kind];
    const jitter = (Math.random() - 0.5) * 3.2;
    const x = 4 + ((lane + 0.5) / LANES) * 92 + jitter;
    hud.pickups.push({
      id: id++,
      kind,
      x: Math.min(96, Math.max(4, x)),
      y: kind === "bomb" ? 6 + Math.random() * 22 : -12 - (lane % 5) * 8 - Math.random() * 14,
      vx: (Math.random() * 2 - 1) * 2.4,
      vy: (22 + (lane % 3) * 4 + Math.random() * 5 + (hud.onFire ? 5 : 0)) * (0.96 + (hud.level - 1) * 0.01),
      rot: Math.random() * 30 - 15,
      vr: (Math.random() * 2 - 1) * 28,
      life: spec.life,
      maxLife: spec.life,
      size: spec.size * (0.9 + Math.random() * 0.14),
      bob: Math.random() * Math.PI * 2,
      value: spec.value,
      coins: spec.coins,
      fromStan: false,
    });
  }

  function rainFromSky(count: number) {
    const cap = hud.onFire ? 28 : 24;
    const n = Math.min(count, Math.max(0, cap - hud.pickups.length));
    const lanes = Array.from({ length: LANES }, (_, i) => (laneCursor + i) % LANES);
    laneCursor = (laneCursor + 3) % LANES;
    let made = 0;
    for (let i = 0; i < n; i++) {
      spawn(rollKind(hud.combo), lanes[i % LANES]);
      made += 1;
    }
    if (hud.pickups.filter((p) => p.kind === "bomb").length < 2) spawn("bomb");
    return made;
  }

  function shootFrom(fromX: number, fromY: number, targets: number[], heights: number[]) {
    const spec = KIND.coin;
    for (let i = 0; i < targets.length; i++) {
      hud.pickups.push({
        id: id++,
        kind: "coin",
        x: fromX,
        y: fromY,
        vx: 0,
        vy: 0,
        rot: -20,
        vr: 180,
        life: 4.8,
        maxLife: 4.8,
        size: 30,
        bob: i,
        value: spec.value,
        coins: spec.coins,
        fromStan: true,
        z: -0.2 - i * 0.12,
        ox: fromX,
        oy: fromY,
        tx: targets[i],
        ty: heights[i],
      });
    }
    burst(fromX, fromY, 8, 340);
  }

  function shootHearts(fromX: number, fromY: number) {
    hud.shake = Math.min(1, hud.shake + 0.25);
    shootFrom(fromX, fromY, [8, 22, 36, 50, 64, 78, 92, 48], [-12, -4, 2, -10, 6, -2, 8, 0]);
  }

  function rollKind(combo: number): Kind {
    const r = Math.random();
    if (r < 0.14) return "bomb";
    if (r < 0.22 + Math.min(0.07, combo * 0.005)) return "kcoin";
    if (r < 0.4) return "gem";
    return "coin";
  }

  function noteCatch(kind: Kind, hit: boolean) {
    if (kind === "gem") {
      if (hit) hud.hitGem += 1;
      else hud.missGem += 1;
    } else if (kind === "kcoin") {
      if (hit) hud.hitK += 1;
      else hud.missK += 1;
    } else if (kind === "bomb") {
      return;
    } else if (hit) hud.hitHeart += 1;
    else hud.missHeart += 1;
  }

  function detonate(target: Pickup) {
    const gone = hud.pickups.filter((p) => {
      if (p.id === target.id || p.kind !== "coin") return false;
      const dx = p.x - target.x;
      const dy = p.y - target.y;
      return dx * dx + dy * dy < 22 * 22;
    });
    const lost = 200 + gone.length * 25;
    hud.pickups = hud.pickups.filter((p) => p.id !== target.id && !gone.some((g) => g.id === p.id));
    hud.roundScore = Math.max(0, hud.roundScore - lost);
    hud.combo = 0;
    hud.comboLabel = "Ready";
    hud.multiplier = 1;
    hud.onFire = false;
    hud.shake = 1;
    hud.flash = 1;
    float(target.x, target.y, `-${lost}`, "fire");
    burst(target.x, target.y, 36, 18);
    cue("bomb");
  }

  function collect(target: Pickup) {
    if (hud.phase !== "playing") return;
    if (target.kind === "bomb") {
      detonate(target);
      return;
    }
    hud.pickups = hud.pickups.filter((p) => p.id !== target.id);
    const mult = hud.multiplier;
    const scored = Math.round(target.value * mult);
    hud.roundScore += scored;
    hud.coinsCollected += target.coins;
    hud.catches += 1;
    hud.bonusTaps = Math.min(999, hud.bonusTaps + target.coins);
    hud.teamScore += Math.round(6 * mult);
    noteCatch(target.kind, true);
    comboT = 2.2;
    hud.combo += 1;
    hud.comboLabel = comboLabel(hud.combo);
    hud.multiplier = multiplierOf(hud.combo);
    const wasFire = hud.onFire;
    hud.onFire = hud.combo >= 8;
    hud.shake = Math.min(
      1,
      hud.shake + (target.kind === "kcoin" ? 1 : target.kind === "gem" ? 0.5 : 0.32),
    );
    const punch = target.kind === "kcoin" ? 0.34 : target.kind === "gem" ? 0.2 : 0.14;
    hud.squashX = 1 + punch;
    hud.squashY = 1 - punch;
    hud.flash = Math.min(1, hud.flash + (target.kind === "kcoin" ? 1 : target.kind === "gem" ? 0.62 : 0.38));

    float(
      target.x,
      target.y,
      `+${scored}`,
      target.kind === "kcoin" ? "purple" : hud.onFire ? "fire" : "gold",
    );
    burst(
      target.x,
      target.y,
      target.kind === "kcoin" ? 34 : target.kind === "gem" ? 18 : 12,
      target.kind === "kcoin" ? 330 : hud.onFire ? 20 : 350,
    );

    if (hud.combo > 0 && hud.combo % 5 === 0) {
      float(target.x, Math.max(8, target.y - 10), "RUSH", "fire");
      rainFromSky(4);
      burst(target.x, target.y, 20, 12);
      hud.flash = 1;
      cue("rush");
    }

    if (target.kind === "kcoin") {
      pose("smirk", 1.4);
      cue("kcoin");
      shootHearts(target.x, target.y);
    } else if (target.kind === "gem") {
      pose(hud.onFire ? "fire" : "smirk", 0.9);
      cue("gem");
      hud.novaLine = NOVA_CHEER[cheerI++ % NOVA_CHEER.length];
      novaTalk = 3.8;
      cheerHold = 2.2;
    } else {
      cue("coin");
      if (hud.combo > 1) cue("combo");
      if (hud.combo % 3 === 0) {
        hud.novaLine = NOVA_CHEER[cheerI++ % NOVA_CHEER.length];
        novaTalk = 3.8;
        cheerHold = 2.2;
      }
    }

    if (hud.onFire && !wasFire && !fireAnnounced) {
      fireAnnounced = true;
      pose("fire", 1.8);
      cue("fire");
    }

    if (!hud.bonusHit && hud.bonusTaps >= BONUS_GOAL) {
      hud.bonusHit = true;
      duration = ROUND_TIME;
      pose("fire", 1.8);
      cue("bonus");
    }

    if (hud.onFire) pose("fire", Math.max(poseT, 0.7));
    if (hud.combo >= 30 && !laserUsed) hud.laserReady = true;
    if (hud.phase === "playing" && hud.combo >= 50 && !nukeUsed) hud.nukeReady = true;
  }

  function awardOnly(target: Pickup) {
    const scored = Math.round(target.value * hud.multiplier);
    hud.roundScore += scored;
    hud.coinsCollected += target.coins;
    hud.catches += 1;
    hud.bonusTaps = Math.min(999, hud.bonusTaps + target.coins);
    hud.teamScore += Math.round(6 * hud.multiplier);
    noteCatch(target.kind, true);
    float(target.x, target.y, `+${scored}`, "fire");
  }

  function usePower(kind: "laser" | "nuke") {
    if (hud.phase !== "playing") return;
    if (kind === "laser" && hud.laserReady && !laserUsed) {
      hud.laserReady = false;
      fireLaser();
    } else if (kind === "nuke" && hud.nukeReady && !nukeUsed) {
      hud.nukeReady = false;
      fireNuke();
    }
  }

  function fireLaser() {
    laserUsed = true;
    const caught = hud.pickups.splice(0, hud.pickups.length);
    for (const p of caught) awardOnly(p);
    hud.flash = 1;
    hud.shake = 1;
    hud.power = "laser";
    powerT = 0.7;
    float(50, 38, "LASER", "purple");
    burst(50, 46, 40, 200);
    cue("laser");
    pose("fire", 1.4);
  }

  let nukeArm = false;

  function fireNuke() {
    nukeUsed = true;
    hud.nukeReady = false;
    hud.pickups = [];
    hud.roundScore += 800;
    hud.flash = 1;
    hud.shake = 1;
    hud.power = "nuke";
    powerT = 0.9;
    nukeArm = true;
    float(50, 34, "NUKE", "fire");
    burst(50, 50, 48, 40);
    cue("nuke");
  }

  function finish(forced = false) {
    hud.phase = "results";
    pose("win", 99);
    hud.pickups = [];
    hud.totalCoins += hud.coinsCollected;
    hud.stageCleared = forced || hud.roundScore >= hud.stageNeed;
    hud.finale = hud.stageCleared && hud.level >= STAGES.length;
    const nextStage = hud.stageCleared && hud.level < STAGES.length ? hud.level + 1 : hud.level;
    const gained = hud.stageCleared
      ? Math.round(hud.roundScore * 0.2) + hud.level * 100
      : 0;
    hud.familyGain = gained;
    hud.familyPoints += gained;
    const patch: Partial<SaveData> = {
      totalCoins: hud.totalCoins,
      teamScore: hud.teamScore,
      stage: nextStage,
      familyPoints: hud.familyPoints,
      bestCombo: Math.max(loadSave().bestCombo, hud.combo),
    };
    if (hud.roundScore > hud.highScore) {
      hud.highScore = hud.roundScore;
      patch.highScore = hud.roundScore;
    }
    if (hud.teamScore > hud.bestTeam) {
      hud.bestTeam = hud.teamScore;
      patch.bestTeam = hud.teamScore;
    }
    writeSave(patch);
    const endKey = hud.bonusHit ? "endhot" : "endlow";
    say(pickLine(endKey), 2.6);
    cue(endKey);
    cue("win");
  }

  function startOver() {
    writeSave({ stage: 1 });
    start();
  }

  function start() {
    const s = loadSave();
    hud.phase = "playing";
    duration = ROUND_TIME;
    elapsed = 0;
    hud.timeLeft = ROUND_TIME;
    hud.coinsCollected = 0;
    hud.combo = 0;
    hud.comboLabel = "Ready";
    hud.multiplier = 1;
    hud.onFire = false;
    hud.bonusTaps = 0;
    hud.roundScore = 0;
    hud.bonusHit = false;
    hud.pickups = [];
    hud.floaters = [];
    hud.sparks = [];
    hud.familyPoints = s.familyPoints;
    hud.familyGain = 0;
    hud.totalCoins = s.totalCoins;
    hud.level = s.stage;
    hud.catches = 0;
    hud.hitHeart = 0;
    hud.missHeart = 0;
    hud.hitGem = 0;
    hud.missGem = 0;
    hud.hitK = 0;
    hud.missK = 0;
    const stage = stageDef(s.stage);
    hud.stageNeed = stage.need;
    hud.stageCleared = false;
    hud.finale = false;
    spawnTotal = Math.max(stage.spawn, 180);
    spawnBudget = spawnTotal;
    laserUsed = false;
    nukeUsed = false;
    nukeArm = false;
    hud.laserReady = false;
    hud.nukeReady = false;
    powerT = 0;
    hud.power = null;
    hud.familySaved = s.familySaved;
    hud.teamScore = s.teamScore;
    hud.bestTeam = s.bestTeam;
    hud.streak = s.streak;
    hud.highScore = s.highScore;
    hud.shake = 0;
    spawnAcc = 0;
    comboT = 0;
    fireAnnounced = false;
    almostAnnounced = false;
    hurryAnnounced = false;
    keepCount = 0;
    lastTick = 99;
    antiT = 0;
    missBank = 0;
    teaseDone = false;
    missSaid = 0;
    releaseIn = 0;
    throwHold = 0;
    hud.stanPose = "idle";
    hud.novaPose = "idle";
    hud.novaLine = null;
    hud.anim = 0;
    novaTalk = 0;
    cheerHold = 0;
    hud.mascotFrame = 0;
    hud.squashX = 1;
    hud.squashY = 1;
    pose("smirk", 1.6);
    say(pickLine("ready"), 1.9);
    cue("start");
    const opened = rainFromSky(8);
    spawnBudget -= opened;
  }

  function pause() {
    if (hud.phase === "playing") hud.phase = "paused";
  }

  function resume() {
    if (hud.phase === "paused") hud.phase = "playing";
  }

  function toTitle() {
    hud.phase = "title";
    hud.pose = "idle";
    hud.mascotFrame = 0;
    hud.squashX = 1;
    hud.squashY = 1;
    hud.pickups = [];
    hud.floaters = [];
    hud.sparks = [];
    hud.stanPose = "idle";
    hud.novaPose = "idle";
    hud.novaLine = null;
    hud.line = pickLine("ready");
    lineT = 999;
    hud.shake = 0;
    hud.timeLeft = ROUND_TIME;
  }

  function step(dt: number) {
    cues.length = 0;
    if (powerT > 0) {
      powerT -= dt;
      if (powerT <= 0) {
        hud.power = null;
        if (nukeArm) {
          nukeArm = false;
          finish(true);
          return cues;
        }
      }
    }
    if (hud.phase !== "playing") {
      hud.shake = Math.max(0, hud.shake - dt * 2);
      poseT = Math.max(0, poseT - dt);
      if (poseT <= 0 && hud.phase === "title") hud.pose = "idle";
      if (hud.phase !== "title") {
        lineT = Math.max(0, lineT - dt);
        if (lineT <= 0) hud.line = null;
      }
      for (const sp of hud.sparks) {
        sp.life -= dt;
        sp.x += sp.vx * dt * 0.4;
        sp.y += sp.vy * dt * 0.4;
      }
      hud.sparks = hud.sparks.filter((s) => s.life > 0);
      tickAnim(dt);
      hud.anim += dt;
      hud.stanPose = "idle";
      hud.novaPose = "idle";
      hud.stanFrame = Math.floor(hud.anim * 8) % 12;
      hud.novaFrame = Math.floor(hud.anim * 8) % 12;
      return cues;
    }

    elapsed += dt;
    hud.timeLeft = Math.max(0, duration - elapsed);
    if (hud.timeLeft <= 0) {
      hud.timeLeft = 0;
      finish();
      return cues;
    }

    comboT -= dt;
    if (comboT <= 0 && hud.combo > 0) {
      hud.combo = Math.max(0, hud.combo - 1);
      comboT = 0.55;
      hud.comboLabel = comboLabel(hud.combo);
      hud.multiplier = multiplierOf(hud.combo);
      hud.onFire = hud.combo >= 8;
      if (!hud.onFire && hud.pose === "fire" && poseT < 0.4) pose("idle", 0.8);
    }

    poseT -= dt;
    if (poseT <= 0) {
      const next = hud.onFire ? "fire" : "idle";
      if (hud.pose !== next) pose(next, 8);
    }
    lineT -= dt;
    if (lineT <= 0) hud.line = null;

    hud.shake = Math.max(0, hud.shake - dt * (reducedShake ? 3.2 : 2.4));
    hud.flash = Math.max(0, hud.flash - dt * (reducedShake ? 4 : 2.2));
    tickAnim(dt);

    if (hud.timeLeft <= 5 && hud.timeLeft > 0) {
      const s = Math.ceil(hud.timeLeft);
      if (s < lastTick) {
        lastTick = s;
        cue("tick");
      }
      if (!hurryAnnounced && s <= 5) {
        hurryAnnounced = true;
      }
    }

    const hurry = hud.timeLeft <= 5 ? 0.9 : 1;
    const volleyGap = (hud.onFire ? 0.72 : 0.95) * hurry;
    spawnAcc += dt;
    if (spawnAcc >= volleyGap && hud.pickups.length < (hud.onFire ? 32 : 26)) {
      spawnAcc = 0;
      rainFromSky(hud.onFire ? 10 : 8);
    }

    hud.anim += dt;
    throwHold = Math.max(0, throwHold - dt);
    cheerHold = Math.max(0, cheerHold - dt);
    novaTalk = Math.max(0, novaTalk - dt);
    if (throwHold > 0) hud.stanPose = "throw";
    else hud.stanPose = "idle";
    hud.stanFrame = hud.stanPose === "throw"
      ? Math.min(11, Math.floor((1.35 - throwHold) * 9))
      : Math.floor(hud.anim * 8) % 12;

    const hasK = hud.pickups.some((p) => p.kind === "kcoin");
    if (throwHold > 0) {
      hud.novaPose = "cheer";
    } else if (hasK) {
      hud.novaPose = "point";
      if (novaTalk <= 0) {
        hud.novaLine = NOVA_POINT[pointI++ % NOVA_POINT.length];
        novaTalk = 4.2;
      }
    } else if (cheerHold > 0 || hud.onFire) {
      hud.novaPose = "cheer";
      if (novaTalk <= 0) hud.novaLine = null;
    } else {
      hud.novaPose = "idle";
      if (novaTalk <= 0) hud.novaLine = null;
    }
    hud.novaFrame = Math.floor(hud.anim * (hud.novaPose === "cheer" ? 10 : 8)) % 12;

    for (const p of hud.pickups) {
      p.life -= dt;
      p.bob += dt * 6;
      if (p.fromStan && (p.z ?? 0) < 1) {
        p.z = (p.z ?? 0) + dt * 0.95;
        const t = Math.max(0, Math.min(1, p.z ?? 0));
        const e = t * t * (3 - 2 * t);
        const ox = p.ox ?? p.x;
        const oy = p.oy ?? p.y;
        const tx = p.tx ?? 50;
        const ty = p.ty ?? 4;
        p.x = ox + (tx - ox) * e;
        p.y = oy + (ty - oy) * e - Math.sin(t * Math.PI) * 22;
        p.size = 28 + e * e * 70;
        p.rot += 480 * dt;
        if (hud.sparks.length < 12 && Math.random() < 0.12) {
          hud.sparks.push({
            id: id++,
            x: p.x - (tx - ox) * 0.05,
            y: p.y - (ty - oy) * 0.04,
            vx: (ox - p.x) * 1.4,
            vy: (oy - p.y) * 1.4,
            life: 0.28 + Math.random() * 0.12,
            max: 0.4,
            hue: 345,
          });
        }
        continue;
      }
      if (p.fromStan) {
        p.fromStan = false;
        p.vy = 10;
        p.vx = (Math.random() * 2 - 1) * 3;
        p.size = Math.min(p.size, 92);
      }
      p.vx *= Math.max(0, 1 - 0.35 * dt);
      p.x += p.vx * dt + Math.sin(p.bob) * 1.6 * dt;
      p.y += p.vy * dt * FALL;
      p.vy += GRAVITY * dt * FALL;
      p.rot += p.vr * dt;
    }
    hud.pickups = hud.pickups.filter((p) => {
      const live = p.life > 0 && p.x > -18 && p.x < 118 && p.y > -28 && p.y < 114;
      if (!live && (p.y >= 114 || p.life <= 0)) noteCatch(p.kind, false);
      return live;
    });

    for (const f of hud.floaters) {
      f.life -= dt;
      f.y -= 42 * dt;
    }
    hud.floaters = hud.floaters.filter((f) => f.life > 0);

    for (const sp of hud.sparks) {
      sp.life -= dt;
      sp.x += sp.vx * dt * 0.5;
      sp.y += sp.vy * dt * 0.5;
      sp.vy += 90 * dt;
    }
    hud.sparks = hud.sparks.filter((s) => s.life > 0);

    return cues;
  }

  function tapAt(xPct: number, yPct: number): boolean {
    if (hud.phase !== "playing") return false;
    let best: Pickup | null = null;
    let bestD = 1e9;
    for (const p of hud.pickups) {
      const dx = p.x - xPct;
      const dy = p.y - yPct;
      const reach = p.size / 4 + 12;
      const d = dx * dx + dy * dy;
      if (d < reach * reach && d < bestD) {
        best = p;
        bestD = d;
      }
    }
    if (!best) return false;
    collect(best);
    return true;
  }

  function tapId(pid: number) {
    const p = hud.pickups.find((x) => x.id === pid);
    if (p) collect(p);
  }

  function snapshot(): Hud {
    return {
      ...hud,
      pickups: hud.pickups,
      floaters: hud.floaters,
      sparks: hud.sparks,
    };
  }

  function setReducedShake(v: boolean) {
    reducedShake = v;
  }

  function setHands(sx: number, sy: number, nx: number, ny: number) {
    if (Number.isFinite(sx)) handX = sx;
    if (Number.isFinite(sy)) handY = sy;
    if (Number.isFinite(nx)) novaX = nx;
    if (Number.isFinite(ny)) novaY = ny;
  }

  function resetProgress() {
    writeSave({
      totalCoins: 0,
      highScore: 0,
      bestCombo: 0,
      teamScore: 0,
      bestTeam: 0,
      stage: 1,
    });
    hud.totalCoins = 0;
    hud.level = 1;
    hud.catches = 0;
    hud.stageNeed = stageDef(1).need;
    hud.stageCleared = false;
    hud.highScore = 0;
    hud.teamScore = 0;
    hud.bestTeam = 0;
    hud.coinsCollected = 0;
    hud.roundScore = 0;
    hud.combo = 0;
    hud.pickups = [];
    hud.phase = "title";
  }

  return {
    hud,
    start,
    pause,
    resume,
    toTitle,
    step,
    tapAt,
    tapId,
    snapshot,
    setReducedShake,
    setHands,
    usePower,
    resetProgress,
    startOver,
  };
}

export type Bonus = ReturnType<typeof createBonus>;
