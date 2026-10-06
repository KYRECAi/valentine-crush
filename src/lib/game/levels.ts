import type { LevelDef } from "./types";

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    name: "Blossom Park",
    tagline: "Where love first rains",
    duration: 90,
    heartGoal: 40,
    spawnPerSec: 2.15,
    fallSpeed: 78,
    coinEvery: 11,
    rainbowChance: 0.2,
    bg: "/sprites/bg/level-1.jpg",
  },
  {
    id: 2,
    name: "Rainbow Canal",
    tagline: "Follow the bright ribbons",
    duration: 85,
    heartGoal: 55,
    spawnPerSec: 2.35,
    fallSpeed: 86,
    coinEvery: 10,
    rainbowChance: 0.24,
    bg: "/sprites/bg/level-2.jpg",
  },
  {
    id: 3,
    name: "Starlight Plaza",
    tagline: "Wish on every star",
    duration: 80,
    heartGoal: 70,
    spawnPerSec: 2.55,
    fallSpeed: 94,
    coinEvery: 9,
    rainbowChance: 0.18,
    bg: "/sprites/bg/level-3.jpg",
  },
  {
    id: 4,
    name: "Heart Harbor",
    tagline: "Notes across the water",
    duration: 75,
    heartGoal: 85,
    spawnPerSec: 2.75,
    fallSpeed: 102,
    coinEvery: 8,
    rainbowChance: 0.22,
    bg: "/sprites/bg/level-4.jpg",
  },
  {
    id: 5,
    name: "Crystal Clouds",
    tagline: "High rolling in the sky",
    duration: 70,
    heartGoal: 95,
    spawnPerSec: 2.95,
    fallSpeed: 110,
    coinEvery: 7,
    rainbowChance: 0.26,
    bg: "/sprites/bg/level-5.jpg",
  },
  {
    id: 6,
    name: "Forever City",
    tagline: "The whole family, all at once",
    duration: 95,
    heartGoal: 120,
    spawnPerSec: 3.2,
    fallSpeed: 118,
    coinEvery: 6,
    rainbowChance: 0.3,
    bg: "/sprites/bg/level-6.jpg",
  },
];

export function starsEarned(hearts: number, goal: number, maxCombo: number, lovePeak: number) {
  let s = 1;
  if (hearts >= goal) s = 2;
  if (hearts >= goal && (maxCombo >= 8 || lovePeak >= 0.72)) s = 3;
  return s;
}
