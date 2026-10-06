const KEY = "moneybags-bonus-v1";
const SAVE_VERSION = 1;

export type SaveData = {
  version: number;
  totalCoins: number;
  highScore: number;
  bestCombo: number;
  familyPoints: number;
  familySaved: number;
  teamScore: number;
  bestTeam: number;
  streak: number;
  muted: boolean;
  musicOn: boolean;
  voiceOn: boolean;
  reducedShake: boolean;
  bgSeed: number;
  stage: number;
  names: [string, string, string, string];
};

const defaults: SaveData = {
  version: SAVE_VERSION,
  totalCoins: 0,
  highScore: 0,
  bestCombo: 0,
  familyPoints: 2450,
  familySaved: 42,
  teamScore: 1250,
  bestTeam: 2800,
  streak: 7,
  muted: false,
  musicOn: true,
  voiceOn: true,
  reducedShake: false,
  bgSeed: 0,
  stage: 1,
  names: ["Annie", "Michael", "Grandma", "Kelly"],
};

function migrate(raw: Partial<SaveData>): SaveData {
  const totalCoins = Number.isFinite(raw.totalCoins) ? Math.max(0, Math.floor(raw.totalCoins!)) : 0;
  const musicOn = typeof raw.musicOn === "boolean" ? raw.musicOn : !raw.muted;
  const voiceOn = typeof raw.voiceOn === "boolean" ? raw.voiceOn : !raw.muted;
  const bgSeed = typeof raw.bgSeed === "number" ? raw.bgSeed : 0;
  const fromHearts = 1 + Math.floor(totalCoins / 25);
  const stage = typeof raw.stage === "number"
    ? Math.min(15, Math.max(1, Math.floor(raw.stage)))
    : Math.min(15, Math.max(1, fromHearts));
  const fallback = defaults.names;
  const names = Array.isArray(raw.names) && raw.names.length === 4
    ? (raw.names.map((n, i) => (typeof n === "string" && n.trim() ? n.trim().slice(0, 16) : fallback[i])) as [string, string, string, string])
    : fallback;
  return { ...defaults, ...raw, totalCoins, musicOn, voiceOn, bgSeed, stage, names, version: SAVE_VERSION };
}

export function loadSave(): SaveData {
  if (typeof window === "undefined") return { ...defaults };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    return migrate(JSON.parse(raw) as Partial<SaveData>);
  } catch {
    return { ...defaults };
  }
}

export function writeSave(patch: Partial<SaveData>): SaveData {
  const next = { ...loadSave(), ...patch, version: SAVE_VERSION };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota */
  }
  return next;
}

export const COINS_PER_LEVEL = 25;
export function levelForCoins(totalCoins: number) { return 1 + Math.floor(totalCoins / COINS_PER_LEVEL); }
