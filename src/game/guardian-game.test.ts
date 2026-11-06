import test from "node:test";
import assert from "node:assert/strict";
import { createBonus, ROUND_TIME } from "./bonus.ts";
import { loadSave, writeSave } from "./save.ts";
import { createAudio } from "./audio.ts";

function withDevice(run: (data: Map<string, string>) => void) {
  const prior = Object.getOwnPropertyDescriptor(globalThis, "window");
  const data = new Map<string, string>();
  const device: any = { location: { href: "https://kyrecai.github.io/" }, localStorage: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  } };
  device.parent = device;
  Object.defineProperty(globalThis, "window", { configurable: true, value: device });
  try { run(data); } finally { if (prior) Object.defineProperty(globalThis, "window", prior); else Reflect.deleteProperty(globalThis, "window"); }
}

test("real gameplay starts, collects, pauses, finishes and replays", () => withDevice(() => {
  const game = createBonus();
  assert.equal(game.hud.phase, "title"); game.start();
  assert.equal(game.hud.phase, "playing");
  for (let i=0;i<60;i++) game.step(1/60);
  for (const item of [...game.hud.pickups]) game.tapId(item.id);
  assert.ok(game.hud.roundScore > 0);
  game.pause(); const remaining = game.hud.timeLeft; const score = game.hud.roundScore;
  for (let i=0;i<120;i++) game.step(1/60);
  assert.equal(game.hud.timeLeft, remaining); assert.equal(game.hud.roundScore, score);
  game.resume(); assert.equal(game.hud.phase, "playing");
  for (let i=0;i<(ROUND_TIME+15)*60 && game.hud.phase === "playing";i++) {
    game.step(1/60);
    for (const item of [...game.hud.pickups]) game.tapId(item.id);
  }
  assert.equal(game.hud.phase, "results");
  assert.ok(game.hud.roundScore > score);
  const completed = game.hud as { stageCleared?: boolean; levelCleared?: boolean };
  assert.ok(completed.stageCleared ?? completed.levelCleared);
  game.start(); assert.equal(game.hud.phase, "playing"); assert.equal(game.hud.roundScore, 0);
  assert.ok(game.hud.timeLeft>0);
}));

test("a missed round finishes safely without unlocking a later level", () => withDevice(() => {
  const game = createBonus();game.start();
  const level=game.hud.level;
  for(let i=0;i<(ROUND_TIME+15)*60&&game.hud.phase === "playing";i++) game.step(1/60);
  assert.equal(game.hud.phase,"results");assert.equal(game.hud.roundScore,0);
  assert.equal(loadSave().stage,level);
}));

test("stored progress survives a new engine and corrupt storage recovers", () => withDevice(data => {
  writeSave({ stage: 4, highScore: 321 });
  const game=createBonus();game.start();assert.equal(game.hud.level,4);assert.equal(game.hud.highScore,321);
  for(const key of data.keys()) data.set(key,"{broken");
  assert.equal(loadSave().stage,1);assert.equal(loadSave().highScore,0);
}));

test("audio unavailable does not stop the game", () => withDevice(() => {
  const audio=createAudio();assert.doesNotThrow(()=>audio.unlock());assert.doesNotThrow(()=>audio.dispose());
  const game=createBonus();game.start();game.step(1/60);assert.equal(game.hud.phase,"playing");
}));
