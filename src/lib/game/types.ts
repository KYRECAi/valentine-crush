export type ScreenId = "title" | "levels" | "play" | "results" | "family";

export type ItemKind =
  | "heart"
  | "star"
  | "gem"
  | "note"
  | "coin"
  | "rainbow"
  | "lantern"
  | "gift"
  | "bag";

export type StanPose = "idle" | "throw" | "follow";
export type NovaPose = "idle" | "point" | "cheer";

export type FamilyId = "annie" | "michael" | "grandma" | "kelly";

export interface FamilyMember {
  id: FamilyId;
  name: string;
  portrait: string;
  color: string;
}

export interface LevelDef {
  id: number;
  name: string;
  tagline: string;
  duration: number;
  heartGoal: number;
  spawnPerSec: number;
  fallSpeed: number;
  coinEvery: number;
  rainbowChance: number;
  bg: string;
}

export interface FallingItem {
  id: number;
  kind: ItemKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  born: number;
  fromStan: boolean;
  magnetImmune: boolean;
  scale: number;
  grow: number;
  atYou: boolean;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  kind: "petal" | "spark" | "pop" | "text";
  color: string;
  text?: string;
  rot: number;
  vr: number;
}

export interface PulseHeart {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  scale: number;
  punch: number;
}

export interface LoveNote {
  from: FamilyId;
  to: FamilyId;
}

export interface RunStats {
  levelId: number;
  score: number;
  hearts: number;
  familyPoints: number;
  maxCombo: number;
  coins: number;
  notes: number;
  lovePeak: number;
  stars: number;
}

export interface SaveData {
  version: 1;
  familyPoints: number;
  memberScores: Record<FamilyId, number>;
  levelStars: Record<string, number>;
  bestScore: number;
  totalHearts: number;
  unlocked: number;
}

export const FAMILY: FamilyMember[] = [
  { id: "annie", name: "Annie", portrait: "/sprites/family/annie.png", color: "var(--color-love)" },
  { id: "michael", name: "Michael", portrait: "/sprites/family/michael.png", color: "var(--color-sky)" },
  { id: "grandma", name: "Grandma", portrait: "/sprites/family/grandma.png", color: "var(--color-gem)" },
  { id: "kelly", name: "Kelly", portrait: "/sprites/family/kelly.png", color: "var(--color-gold)" },
];

export const ITEM_SCORE: Record<ItemKind, number> = {
  heart: 50,
  star: 100,
  gem: 80,
  note: 70,
  coin: 250,
  rainbow: 120,
  lantern: 90,
  gift: 180,
  bag: 250,
};

export const ITEM_SIZE: Record<ItemKind, number> = {
  heart: 44,
  star: 40,
  gem: 38,
  note: 42,
  coin: 58,
  rainbow: 54,
  lantern: 46,
  gift: 44,
  bag: 72,
};
