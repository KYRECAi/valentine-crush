import type { FamilyId, SaveData } from "./types";

const KEY = "kyrec-love-dash-v2";

const EMPTY: SaveData = {
  version: 1,
  familyPoints: 2450,
  memberScores: { annie: 2950, michael: 3750, grandma: 3250, kelly: 2900 },
  levelStars: {},
  bestScore: 0,
  totalHearts: 0,
  unlocked: 1,
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY, memberScores: { ...EMPTY.memberScores } };
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      ...EMPTY,
      ...parsed,
      version: 1,
      memberScores: { ...EMPTY.memberScores, ...parsed.memberScores },
      levelStars: { ...parsed.levelStars },
      unlocked: Math.max(1, Math.min(6, parsed.unlocked ?? 1)),
    };
  } catch {
    return { ...EMPTY, memberScores: { ...EMPTY.memberScores } };
  }
}

export function writeSave(data: SaveData) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function applyRunToSave(
  save: SaveData,
  input: {
    levelId: number;
    score: number;
    hearts: number;
    familyPoints: number;
    stars: number;
    memberDelta: Record<FamilyId, number>;
  },
): SaveData {
  const stars = Math.max(save.levelStars[String(input.levelId)] ?? 0, input.stars);
  const unlocked =
    input.stars >= 1 ? Math.max(save.unlocked, Math.min(6, input.levelId + 1)) : save.unlocked;
  const memberScores = { ...save.memberScores };
  (Object.keys(memberScores) as FamilyId[]).forEach((id) => {
    memberScores[id] += input.memberDelta[id] ?? 0;
  });
  const next: SaveData = {
    version: 1,
    familyPoints: save.familyPoints + input.familyPoints,
    memberScores,
    levelStars: { ...save.levelStars, [String(input.levelId)]: stars },
    bestScore: Math.max(save.bestScore, input.score),
    totalHearts: save.totalHearts + input.hearts,
    unlocked,
  };
  writeSave(next);
  return next;
}
