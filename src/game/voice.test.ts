import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { after, afterEach, beforeEach, mock, test } from "node:test";
import { BANKS, preloadVoices, silence, speak, type LineKey } from "./voice.ts";

class FakeAudio {
  static created: FakeAudio[] = [];
  src: string;
  volume = 1;
  loaded = false;
  played = false;
  paused = false;

  constructor(src: string) {
    this.src = src;
    FakeAudio.created.push(this);
  }

  load() { this.loaded = true; }
  play() { this.played = true; return Promise.resolve(); }
  pause() { this.paused = true; }
}

const priorWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const priorAudio = Object.getOwnPropertyDescriptor(globalThis, "Audio");
Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
Object.defineProperty(globalThis, "Audio", { configurable: true, value: FakeAudio });

after(() => {
  silence();
  if (priorWindow) Object.defineProperty(globalThis, "window", priorWindow);
  else Reflect.deleteProperty(globalThis, "window");
  if (priorAudio) Object.defineProperty(globalThis, "Audio", priorAudio);
  else Reflect.deleteProperty(globalThis, "Audio");
});

let now = 10_000;
beforeEach(() => {
  silence();
  FakeAudio.created = [];
  now += 10_000;
  mock.method(performance, "now", () => now);
});

afterEach(() => mock.restoreAll());

function assertBundled(src: string) {
  const asset = new URL(`../../public${src}`, import.meta.url);
  assert.ok(statSync(asset).size > 0, `${src} must be a bundled recording`);
}

test("each displayed line plays its matching bundled recording", () => {
  for (const key of Object.keys(BANKS) as LineKey[]) {
    BANKS[key].forEach((line, index) => {
      now += 1_000;
      speak(key, false, line);
      const audio = FakeAudio.created.at(-1)!;
      assert.equal(audio.src, `/voice/${key}-${index}.mp3`);
      assert.equal(audio.played, true);
      assertBundled(audio.src);
    });
  }
  assert.equal(FakeAudio.created.length, 16);
});

test("missing or unknown display text falls back to the cue's first recording", () => {
  speak("start", false);
  assert.equal(FakeAudio.created.at(-1)!.src, "/voice/start-0.mp3");
  now += 1_000;
  speak("endlow", false, "Unrecognised caption");
  assert.equal(FakeAudio.created.at(-1)!.src, "/voice/endlow-0.mp3");
});

test("preloading requests each bundled routine recording exactly once", () => {
  preloadVoices();
  const sources = FakeAudio.created.map((audio) => audio.src);
  const expected = (Object.keys(BANKS) as LineKey[]).flatMap((key) =>
    BANKS[key].map((_, index) => `/voice/${key}-${index}.mp3`),
  );
  assert.deepEqual(sources, expected);
  assert.equal(new Set(sources).size, 16);
  for (const audio of FakeAudio.created) {
    assert.equal(audio.loaded, true);
    assert.equal(audio.played, false);
    assertBundled(audio.src);
  }
});

test("muting does not create or play a voice recording", () => {
  speak("endhot", true, BANKS.endhot[2]);
  assert.deepEqual(FakeAudio.created, []);
});

test("voice cooldown and silence still prevent overlapping playback", () => {
  speak("ready", false, BANKS.ready[0]);
  const first = FakeAudio.created[0]!;
  now += 100;
  speak("start", false, BANKS.start[1]);
  assert.equal(FakeAudio.created.length, 1);
  now += 900;
  speak("start", false, BANKS.start[1]);
  assert.equal(first.paused, true);
  assert.equal(FakeAudio.created.length, 2);
  silence();
  assert.equal(FakeAudio.created[1]!.paused, true);
});
