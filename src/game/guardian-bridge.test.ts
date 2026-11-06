import test from "node:test";
import assert from "node:assert/strict";
import { readEmbedContext, emitArcade, listenForPause, createGameStorage } from "./guardian-bridge.ts";

const session = "0123456789abcdef0123456789abcdef";
const href = `https://kyrecai.github.io/?embed=1&origin=https%3A%2F%2Fkyrec.au&session=${session}`;

test("embed context requires an exact safe origin and opaque session", () => {
  assert.deepEqual(readEmbedContext(href), { origin: "https://kyrec.au", session });
  for (const origin of ["*", "null", "javascript:alert(1)", "https://kyrec.au/path", "https://u:p@kyrec.au", "file:///app"]) {
    assert.equal(readEmbedContext(href.replace("https%3A%2F%2Fkyrec.au", encodeURIComponent(origin))), null);
  }
  assert.equal(readEmbedContext(href.replace(session, "short")), null);
  assert.equal(readEmbedContext("https://kyrecai.github.io/"), null);
});

test("transport pins parent, origin, game and session and carries no reward authority", () => {
  const sent: unknown[] = [];
  let receive: ((event: unknown) => void) | undefined;
  const parent = { postMessage: (message: unknown, origin: string) => sent.push({ message, origin }) };
  const prior = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    parent, location: { href }, addEventListener: (_: string, fn: (event: unknown) => void) => { receive = fn; },
    removeEventListener: () => { receive = undefined; },
  } });
  try {
    emitArcade("moneybags", "ready");
    assert.deepEqual(sent[0], { origin: "https://kyrec.au", message: { type: "kyrec.arcade", version: 1, game: "moneybags", session, event: "ready" } });
    let paused = 0;
    const detach = listenForPause("moneybags", () => paused++);
    const good = { source: parent, origin: "https://kyrec.au", data: { type: "kyrec.arcade", version: 1, game: "moneybags", session, event: "pause" } };
    for (const bad of [{ ...good, source: {} }, { ...good, origin: "https://evil.test" }, { ...good, data: { ...good.data, session: "wrong" } }, { ...good, data: { ...good.data, game: "valentine" } }]) receive?.(bad);
    assert.equal(paused, 0);
    receive?.(good); assert.equal(paused, 1);
    emitArcade("moneybags", "result", { run: "test-run", score: 100, coins: 10, level: 1, cleared: false });
    assert.ok(!JSON.stringify(sent).includes("familyPoints"));
    assert.ok(!sent.some((entry: any) => entry.origin === "*"));
    detach(); assert.equal(receive, undefined);
  } finally {
    if (prior) Object.defineProperty(globalThis, "window", prior); else Reflect.deleteProperty(globalThis, "window");
  }
});

test("save data is isolated by game and embedded session, with private-mode fallback", () => {
  const map = new Map<string, string>();
  const storage = { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => { map.set(k, v); } };
  const win: any = { parent: {}, location: { href }, sessionStorage: storage, localStorage: storage };
  const prior = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: win });
  try {
    const a = createGameStorage("moneybags"), b = createGameStorage("valentine");
    a.setItem("ignored", "score-a"); b.setItem("ignored", "score-b");
    assert.equal(a.getItem("ignored"), "score-a"); assert.equal(b.getItem("ignored"), "score-b");
    win.location.href = href.replace(session, "abcdef0123456789abcdef0123456789");
    assert.equal(a.getItem("ignored"), null);
    Object.defineProperty(win, "sessionStorage", { configurable: true, get() { throw new Error("private mode"); } });
    a.setItem("ignored", "memory-only"); assert.equal(a.getItem("ignored"), "memory-only");
  } finally { if (prior) Object.defineProperty(globalThis, "window", prior); else Reflect.deleteProperty(globalThis, "window"); }
});
