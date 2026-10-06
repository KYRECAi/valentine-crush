import { LEVELS } from "./levels";
import {
  FAMILY,
  ITEM_SCORE,
  ITEM_SIZE,
  type FallingItem,
  type FamilyId,
  type ItemKind,
  type LevelDef,
  type LoveNote,
  type NovaPose,
  type Particle,
  type PulseHeart,
  type RunStats,
  type StanPose,
} from "./types";

export interface HudSnap {
  timeLeft: number;
  hearts: number;
  familyPoints: number;
  bonus: number;
  score: number;
  scoreDelta: number;
  combo: number;
  comboLabel: string;
  loveMeter: number;
  members: Record<FamilyId, number>;
  feed: string | null;
  stanPose: StanPose;
  novaPose: NovaPose;
  stanLine: string | null;
  novaLine: string | null;
  magnetCharges: number;
  gemCharges: number;
  burstReady: boolean;
  heartGoal: number;
  magnetActive: boolean;
  gemActive: boolean;
  shake: number;
  pulseActive: boolean;
  pulseScale: number;
  moneybags: boolean;
  moneybagsLeft: number;
}

const KINDS: ItemKind[] = ["heart", "rainbow", "note", "star", "lantern", "gem", "gift"];
const KIND_W = [40, 24, 12, 10, 4, 6, 4];
const COMBO_LABELS = ["Nice", "Sweet", "Lovely", "Amazing", "Radiant", "Unstoppable"];
const STAN_LINES = ["Love incoming!", "Hearts for you!", "Catch these!", "Mid-love special!"];
const NOVA_POINT = ["Moneybags! 250!", "That's the bag!", "High roller — grab it!", "Bag in the sky!"];
const NOVA_CHEER = ["You've got this!", "So much love!", "Family's cheering!", "Keep going!"];
const NOVA_BAGS = ["MONEYBAGS BONUS!", "Get every bag!", "Go for the lot!", "This is the big one!"];
const STAN_BAGS = ["Bags incoming!", "Catch the gold!", "Moneybags for the family!"];

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function weightedKind(rng: () => number): ItemKind {
  const total = KIND_W.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < KINDS.length; i++) {
    r -= KIND_W[i]!;
    if (r <= 0) return KINDS[i]!;
  }
  return "heart";
}

function otherMember(id: FamilyId, rng: () => number): FamilyId {
  const rest = FAMILY.map((m) => m.id).filter((x) => x !== id);
  return pick(rest, rng);
}

export class LoveWorld {
  w = 390;
  h = 844;
  level: LevelDef;
  items: FallingItem[] = [];
  particles: Particle[] = [];
  pulse: PulseHeart | null = null;
  timeLeft: number;
  hearts = 0;
  familyPoints = 0;
  score = 0;
  scoreDelta = 0;
  combo = 0;
  maxCombo = 0;
  loveMeter = 0.18;
  lovePeak = 0.18;
  coins = 0;
  notes = 0;
  members: Record<FamilyId, number> = { annie: 0, michael: 0, grandma: 0, kelly: 0 };
  feed: LoveNote | null = null;
  feedTimer = 0;
  stanPose: StanPose = "idle";
  novaPose: NovaPose = "idle";
  stanLine: string | null = null;
  novaLine: string | null = null;
  stanTimer = 0;
  novaTimer = 0;
  magnetCharges = 3;
  gemCharges = 2;
  burstCd = 0;
  magnetT = 0;
  gemT = 0;
  spawnAcc = 0;
  coinAcc = 0;
  pulseAcc = 0;
  throwCd = 0;
  cheerCd = 0;
  elapsed = 0;
  over = false;
  shake = 0;
  nextId = 1;
  moneybagsT = 0;
  bags = 0;
  bagSeen = false;
  jackpotFired = false;
  rng: () => number;
  playTop: number;
  playBottom: number;
  reduced = false;
  pulsePunch = 0;

  constructor(
    levelId: number,
    seed = Date.now(),
    members?: Record<FamilyId, number>,
    familyPoints = 0,
  ) {
    this.level = LEVELS[levelId - 1] ?? LEVELS[0]!;
    this.timeLeft = this.level.duration;
    this.playTop = 0.18;
    this.playBottom = 0.56;
    this.familyPoints = familyPoints;
    if (members) this.members = { ...members };
    this.pulse = {
      x: this.w * 0.5,
      y: this.h * 0.4,
      life: 9999,
      maxLife: 9999,
      scale: 1,
      punch: 0,
    };
    this.feed = { from: "kelly", to: "grandma" };
    this.feedTimer = 5;
    this.coinAcc = Math.max(0, this.level.coinEvery - 3);
    let s = seed >>> 0;
    this.rng = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0xffffffff;
    };
    if (typeof window !== "undefined") {
      this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    if (this.pulse) {
      this.pulse.x = w * 0.5;
      this.pulse.y = h * 0.4;
    }
  }

  bonus(): number {
    if (this.moneybagsT > 0) return this.gemT > 0 ? 6 : 5;
    return this.gemT > 0 ? 2 : 1;
  }

  comboLabel(): string {
    if (this.combo < 3) return "";
    const i = Math.min(COMBO_LABELS.length - 1, Math.floor((this.combo - 3) / 3));
    return COMBO_LABELS[i]!;
  }

  snapshot(): HudSnap {
    const feed = this.feed
      ? `${FAMILY.find((m) => m.id === this.feed!.from)?.name} sent a love note to ${FAMILY.find((m) => m.id === this.feed!.to)?.name}`
      : null;
    return {
      timeLeft: this.timeLeft,
      hearts: this.hearts,
      familyPoints: this.familyPoints,
      bonus: this.bonus(),
      score: this.score,
      scoreDelta: this.scoreDelta,
      combo: this.combo,
      comboLabel: this.comboLabel(),
      loveMeter: this.loveMeter,
      members: { ...this.members },
      feed,
      stanPose: this.stanPose,
      novaPose: this.novaPose,
      stanLine: this.stanLine,
      novaLine: this.novaLine,
      magnetCharges: this.magnetCharges,
      gemCharges: this.gemCharges,
      burstReady: this.burstCd <= 0,
      heartGoal: this.level.heartGoal,
      magnetActive: this.magnetT > 0,
      gemActive: this.gemT > 0,
      shake: this.shake,
      pulseActive: !!this.pulse,
      pulseScale: this.pulse?.scale ?? 1,
      moneybags: this.moneybagsT > 0,
      moneybagsLeft: this.moneybagsT,
    };
  }

  stats(): RunStats {
    const lovePeak = this.lovePeak;
    const hearts = this.hearts;
    const goal = this.level.heartGoal;
    let stars = 1;
    if (hearts >= goal) stars = 2;
    if (hearts >= goal && (this.maxCombo >= 8 || lovePeak >= 0.72)) stars = 3;
    return {
      levelId: this.level.id,
      score: this.score,
      hearts,
      familyPoints: this.familyPoints,
      maxCombo: this.maxCombo,
      coins: this.coins,
      notes: this.notes,
      lovePeak,
      stars,
    };
  }

  step(dt: number) {
    if (this.over) return;
    const cap = Math.min(dt, 0.1);
    this.elapsed += cap;
    this.timeLeft = Math.max(0, this.timeLeft - cap);
    if (this.timeLeft <= 0) {
      this.over = true;
      return;
    }

    this.spawnAcc += cap;
    const interval = 1 / this.level.spawnPerSec;
    while (this.spawnAcc >= interval) {
      this.spawnAcc -= interval;
      this.spawnFalling();
    }
    if (this.elapsed < 0.1 && this.items.length < 6) {
      const kinds: ItemKind[] = ["heart", "rainbow", "note", "heart", "lantern", "star"];
      for (let i = 0; i < kinds.length; i++) {
        this.spawnKind(
          kinds[i]!,
          this.w * (0.3 + (i % 3) * 0.16 + this.rng() * 0.04),
          this.h * (this.playTop + 0.04 + Math.floor(i / 3) * 0.12),
        );
      }
    }

    this.coinAcc += cap;
    if (this.coinAcc >= this.level.coinEvery) {
      this.coinAcc = 0;
      if (this.moneybagsT <= 0) this.spawnBag();
    }
    if (!this.bagSeen && this.elapsed >= 3.2) {
      this.bagSeen = true;
      this.spawnBag();
    }

    if (this.moneybagsT > 0) {
      const prev = this.moneybagsT;
      this.moneybagsT = Math.max(0, this.moneybagsT - cap);
      if (this.rng() < cap * 4.2) {
        const kind = this.rng() < 0.55 ? "bag" : this.rng() < 0.75 ? "coin" : "star";
        this.spawnKind(kind);
      }
      if (prev > 0 && this.moneybagsT <= 0 && !this.jackpotFired) {
        this.finishMoneybags();
      }
    }

    if (this.level.rainbowChance > 0 && this.items.length < 11 && this.rng() < this.level.rainbowChance * cap * 0.7) {
      this.spawnKind("rainbow");
    }

    this.throwCd = Math.max(0, this.throwCd - cap);
    this.cheerCd = Math.max(0, this.cheerCd - cap);
    this.stanTimer = Math.max(0, this.stanTimer - cap);
    this.novaTimer = Math.max(0, this.novaTimer - cap);
    this.magnetT = Math.max(0, this.magnetT - cap);
    this.gemT = Math.max(0, this.gemT - cap);
    this.burstCd = Math.max(0, this.burstCd - cap);
    this.feedTimer = Math.max(0, this.feedTimer - cap);
    this.shake = Math.max(0, this.shake - cap * 2.4);
    if (this.stanTimer <= 0) {
      this.stanPose = "idle";
      this.stanLine = null;
    } else if (this.stanPose === "throw" && this.stanTimer < 0.55) {
      this.stanPose = "follow";
    }
    if (this.novaTimer <= 0) {
      this.novaPose = "idle";
      this.novaLine = null;
    }
    if (this.feedTimer <= 0) this.feed = null;

    this.loveMeter = Math.max(0, this.loveMeter - cap * 0.008);
    this.scoreDelta = Math.max(0, this.scoreDelta - cap * 180);
    this.pulsePunch = Math.max(0, this.pulsePunch - cap * 4.5);

    if (this.pulse) {
      this.pulse.x = this.w * 0.5;
      this.pulse.y = this.h * 0.4;
      this.pulse.scale = 1 + Math.sin(this.elapsed * 3.2) * 0.07 + this.pulsePunch * 0.35;
      this.pulse.punch = this.pulsePunch;
    }

    const gravity = 38;
    const magOn = this.magnetT > 0;
    const magX = this.w * 0.5;
    const magY = this.h * 0.4;
    const bottom = this.h * this.playBottom;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i]!;
      if (it.atYou) {
        it.scale = Math.min(1.18, it.scale + it.grow * cap);
        it.x += it.vx * cap;
        it.y += it.vy * cap;
        it.rot += it.vr * cap;
        const dx = this.w * 0.5 - it.x;
        const dy = this.h * 0.4 - it.y;
        if (it.scale >= 1.12 || dx * dx + dy * dy < 36 * 36) {
          this.collectItem(it);
        }
        continue;
      }
      if (magOn && !it.magnetImmune) {
        const dx = magX - it.x;
        const dy = magY - it.y;
        it.vx += dx * 2.1 * cap;
        it.vy += dy * 1.4 * cap;
      }
      it.vy += gravity * cap;
      it.x += it.vx * cap;
      it.y += it.vy * cap;
      it.rot += it.vr * cap;
      if (it.x < it.size * 0.4) {
        it.x = it.size * 0.4;
        it.vx *= -0.4;
      }
      if (it.x > this.w - it.size * 0.4) {
        it.x = this.w - it.size * 0.4;
        it.vx *= -0.4;
      }
      if (it.y > bottom + it.size) {
        this.items.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.life -= cap;
      p.x += p.vx * cap;
      p.y += p.vy * cap;
      p.vy += 40 * cap;
      p.rot += p.vr * cap;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    if (this.rng() < cap * 5) this.spawnPetal(this.rng() * this.w, -12, false);
  }

  spawnFalling() {
    if (this.items.length >= 11) return;
    const kind = weightedKind(this.rng);
    this.spawnKind(kind);
  }

  spawnKind(kind: ItemKind, x?: number, y?: number, vx?: number, vy?: number, fromStan = false) {
    if (!fromStan && kind !== "coin" && kind !== "bag" && this.items.length >= 12) {
      return this.items[this.items.length - 1]!;
    }
    const size = ITEM_SIZE[kind];
    const speed = this.level.fallSpeed * (0.78 + this.rng() * 0.45);
    const lane = 0.3 + this.rng() * 0.4;
    const item: FallingItem = {
      id: this.nextId++,
      kind,
      x: x ?? this.w * lane,
      y: y ?? this.h * this.playTop - 28 - this.rng() * 36,
      vx: vx ?? (this.rng() - 0.5) * 36,
      vy: vy ?? speed * (0.35 + this.rng() * 0.2),
      rot: this.rng() * Math.PI * 2,
      vr: (this.rng() - 0.5) * 2.2,
      size,
      born: this.elapsed,
      fromStan,
      magnetImmune: kind === "coin" || kind === "bag",
      scale: 1,
      grow: 0,
      atYou: false,
    };
    this.items.push(item);
    return item;
  }

  spawnCoin() {
    this.spawnKind("coin", this.w * (0.28 + this.rng() * 0.44), this.h * this.playTop - 20, (this.rng() - 0.5) * 18, this.level.fallSpeed * 0.22);
    this.novaPose = "point";
    this.novaLine = pick(NOVA_POINT, this.rng);
    this.novaTimer = 3.2;
  }

  spawnBag() {
    this.spawnKind(
      "bag",
      this.w * (0.34 + this.rng() * 0.32),
      this.h * this.playTop - 16,
      (this.rng() - 0.5) * 14,
      this.level.fallSpeed * 0.18,
    );
    this.novaPose = "point";
    this.novaLine = pick(NOVA_POINT, this.rng);
    this.novaTimer = 4;
  }

  startMoneybags() {
    if (this.moneybagsT > 0.6) return;
    this.moneybagsT = 10;
    this.jackpotFired = false;
    this.novaPose = "cheer";
    this.novaLine = pick(NOVA_BAGS, this.rng);
    this.novaTimer = 4.5;
    this.stanPose = "throw";
    this.stanLine = pick(STAN_BAGS, this.rng);
    this.stanTimer = 2.4;
    this.shake = 0.35;
    for (let i = 0; i < 5; i++) {
      this.spawnKind("bag", this.w * (0.28 + this.rng() * 0.44), this.h * (this.playTop + this.rng() * 0.08));
    }
  }

  finishMoneybags() {
    this.jackpotFired = true;
    const jack = 500;
    this.familyPoints += jack;
    this.score += jack;
    this.scoreDelta = jack;
    for (const m of FAMILY) this.members[m.id] += Math.round(jack / FAMILY.length);
    this.popText(this.w * 0.5, this.h * 0.38, "Family jackpot +500!", "#f0b429");
    this.novaPose = "cheer";
    this.novaLine = "That's the family bag!";
    this.novaTimer = 3;
  }

  spawnPetal(x: number, y: number, burst: boolean) {
    if (this.particles.length > 90) return;
    this.particles.push({
      id: this.nextId++,
      x,
      y,
      vx: (this.rng() - 0.5) * (burst ? 140 : 28),
      vy: burst ? -40 - this.rng() * 80 : 18 + this.rng() * 30,
      life: burst ? 0.7 + this.rng() * 0.4 : 3.2,
      maxLife: 3.2,
      size: 10 + this.rng() * 10,
      kind: "petal",
      color: "#ff8fb3",
      rot: this.rng() * 6,
      vr: (this.rng() - 0.5) * 4,
    });
  }

  popText(x: number, y: number, text: string, color: string) {
    this.particles.push({
      id: this.nextId++,
      x,
      y,
      vx: 0,
      vy: -52,
      life: 0.7,
      maxLife: 0.7,
      size: 18,
      kind: "text",
      color,
      text,
      rot: 0,
      vr: 0,
    });
  }

  sparks(x: number, y: number, color: string) {
    const n = this.reduced ? 4 : 10;
    for (let i = 0; i < n; i++) {
      const a = this.rng() * Math.PI * 2;
      const sp = 40 + this.rng() * 90;
      this.particles.push({
        id: this.nextId++,
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 30,
        life: 0.35 + this.rng() * 0.25,
        maxLife: 0.5,
        size: 3 + this.rng() * 4,
        kind: "spark",
        color,
        rot: 0,
        vr: 0,
      });
    }
  }

  collectItem(it: FallingItem) {
    const idx = this.items.findIndex((x) => x.id === it.id);
    if (idx < 0) return null;
    this.items.splice(idx, 1);
    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const add = Math.round(ITEM_SCORE[it.kind] * this.bonus() * (1 + Math.min(this.combo, 12) * 0.04));
    this.score += add;
    this.scoreDelta = add;
    const who = pick(FAMILY, this.rng).id;
    this.members[who] += it.kind === "star" || it.kind === "note" || it.kind === "gift" ? add : Math.round(add * 0.35);

    if (it.kind === "heart") {
      this.hearts += 1;
      this.loveMeter = Math.min(1, this.loveMeter + 0.028);
      if (this.hearts > 0 && this.hearts % 100 === 0) {
        this.familyPoints += 400;
        this.score += 400;
        this.popText(it.x, it.y - 24, "Family bonus!", "#f0b429");
      }
    } else if (it.kind === "star") {
      this.familyPoints += 80;
    } else if (it.kind === "note") {
      this.notes += 1;
      this.familyPoints += 60;
      this.feed = { from: who, to: otherMember(who, this.rng) };
      this.feedTimer = 3.4;
    } else if (it.kind === "coin") {
      this.coins += 1;
      this.familyPoints += Math.round(40 * this.bonus());
      this.novaPose = "cheer";
      this.novaLine = pick(NOVA_CHEER, this.rng);
      this.novaTimer = 2.4;
      this.startMoneybags();
    } else if (it.kind === "bag") {
      this.bags += 1;
      this.familyPoints += Math.round(80 * this.bonus());
      this.startMoneybags();
      this.novaPose = "cheer";
      this.novaLine = pick(NOVA_BAGS, this.rng);
      this.novaTimer = 3.2;
    } else if (it.kind === "rainbow") {
      this.loveMeter = Math.min(1, this.loveMeter + 0.14);
      for (let i = 0; i < 14; i++) this.spawnPetal(it.x, it.y, true);
    } else if (it.kind === "gem") {
      this.gemT = Math.max(this.gemT, 3.2);
    } else if (it.kind === "gift") {
      this.familyPoints += 120;
      this.hearts += 3;
    } else if (it.kind === "lantern") {
      this.familyPoints += 40;
    }

    this.lovePeak = Math.max(this.lovePeak, this.loveMeter);
    this.shake = Math.min(0.35, this.shake + (it.kind === "bag" || it.kind === "coin" ? 0.22 : 0.08));
    this.sparks(it.x, it.y, it.kind === "bag" || it.kind === "coin" ? "#f0b429" : it.kind === "gem" ? "#9b6dff" : "#ff6b9a");
    this.popText(it.x, it.y - 10, `+${add}`, it.kind === "bag" || it.kind === "coin" ? "#f0b429" : "#fff7fa");
    this.maybeStanThrow();
    if (this.combo === 6 || this.combo === 12 || this.combo === 18) this.maybeNovaCheer();
    return { kind: it.kind, add };
  }

  maybeStanThrow() {
    const midLove = this.loveMeter >= 0.36;
    const comboHit = this.combo === 4 || this.combo === 8 || this.combo === 12 || this.combo === 16;
    if (this.throwCd > 0) return;
    if (!midLove && !comboHit) return;
    this.throwCd = 7.2;
    this.stanPose = "throw";
    this.stanLine = pick(STAN_LINES, this.rng);
    this.stanTimer = 2.1;
    const ox = this.w * 0.2;
    const oy = this.h * 0.5;
    const cx = this.w * 0.5;
    const cy = this.h * 0.4;
    for (let i = 0; i < 5; i++) {
      const spread = (i - 2) * 22;
      const it = this.spawnKind(
        "heart",
        ox,
        oy,
        (cx - ox) * (0.85 + this.rng() * 0.2) + spread,
        (cy - oy) * (0.7 + this.rng() * 0.25) - 18,
        true,
      );
      it.atYou = true;
      it.scale = 0.42 + i * 0.05;
      it.grow = 0.72 + this.rng() * 0.2;
      it.magnetImmune = true;
    }
  }

  maybeNovaCheer() {
    if (this.cheerCd > 0) return;
    this.cheerCd = 6;
    this.novaPose = "cheer";
    this.novaLine = pick(NOVA_CHEER, this.rng);
    this.novaTimer = 2.2;
  }

  tap(x: number, y: number) {
    if (this.over) return null;
    if (this.pulse) {
      const dx = x - this.pulse.x;
      const dy = y - this.pulse.y;
      const r = 72 * Math.max(0.7, this.pulse.scale);
      if (dx * dx + dy * dy <= r * r) {
        this.pulsePunch = 1;
        this.hearts += 1;
        this.combo += 1;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        const add = Math.round(50 * this.bonus() * (1 + Math.min(this.combo, 12) * 0.04));
        this.score += add;
        this.scoreDelta = add;
        this.loveMeter = Math.min(1, this.loveMeter + 0.04);
        this.lovePeak = Math.max(this.lovePeak, this.loveMeter);
        this.shake = Math.min(0.28, this.shake + 0.12);
        for (let i = 0; i < 8; i++) this.spawnPetal(x, y, true);
        this.popText(x, y - 18, `+${add}`, "#ff6b9a");
        this.maybeStanThrow();
        if (this.combo === 6 || this.combo === 12 || this.combo === 18) this.maybeNovaCheer();
        return { kind: "pulse" as const, add };
      }
    }
    let best: FallingItem | null = null;
    let bestD = 1e9;
    for (const it of this.items) {
      const dx = x - it.x;
      const dy = y - it.y;
      const rad = it.size * 0.58 * Math.max(0.7, it.scale);
      const d = dx * dx + dy * dy;
      if (d <= rad * rad && d < bestD) {
        best = it;
        bestD = d;
      }
    }
    if (!best) return null;
    return this.collectItem(best);
  }

  useMagnet() {
    if (this.magnetCharges <= 0 || this.magnetT > 0) return false;
    this.magnetCharges -= 1;
    this.magnetT = 5.2;
    return true;
  }

  useGem() {
    if (this.gemCharges <= 0 || this.gemT > 1) return false;
    this.gemCharges -= 1;
    this.gemT = 8;
    return true;
  }

  useBurst() {
    if (this.burstCd > 0) return false;
    this.burstCd = 11;
    const cx = this.w * 0.5;
    const cy = this.h * 0.42;
    const r2 = 130 * 130;
    const hits = this.items.filter((it) => {
      const dx = it.x - cx;
      const dy = it.y - cy;
      return dx * dx + dy * dy <= r2;
    });
    hits.forEach((it) => this.collectItem(it));
    for (let i = 0; i < 18; i++) this.spawnPetal(cx, cy, true);
    this.shake = Math.min(1, this.shake + 0.4);
    return true;
  }
}
