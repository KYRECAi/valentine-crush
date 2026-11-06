/** Arcade transport only. This protocol never grants Family Points or budget authority. */
export const ARCADE_CHANNEL = "kyrec.arcade";
export const ARCADE_VERSION = 1;
export type ArcadeGame = "moneybags" | "valentine";
export type EmbedContext = { origin: string; session: string };

export function readEmbedContext(href: string): EmbedContext | null {
  try {
    const q = new URL(href).searchParams;
    if (q.get("embed") !== "1") return null;
    const session = q.get("session") ?? "";
    const raw = q.get("origin");
    if (!raw || !/^[a-zA-Z0-9_-]{16,96}$/.test(session)) return null;
    const url = new URL(raw);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.origin !== raw) return null;
    return { origin: url.origin, session };
  } catch { return null; }
}

function context() {
  if (typeof window === "undefined" || window.parent === window) return null;
  return readEmbedContext(window.location.href);
}

export function emitArcade(
  game: ArcadeGame,
  event: "ready" | "result" | "close" | "paused",
  result?: { run: string; score: number; coins: number; level: number; cleared: boolean },
) {
  const embed = context();
  if (!embed) return;
  window.parent.postMessage({
    type: ARCADE_CHANNEL, version: ARCADE_VERSION, game, session: embed.session, event,
    ...(result ? { result } : {}),
  }, embed.origin);
}

export function listenForPause(game: ArcadeGame, pause: () => void) {
  const embed = context();
  if (!embed) return () => {};
  const receive = (event: MessageEvent) => {
    const msg = event.data;
    if (event.source !== window.parent || event.origin !== embed.origin || !msg ||
        msg.type !== ARCADE_CHANNEL || msg.version !== ARCADE_VERSION || msg.game !== game ||
        msg.session !== embed.session || msg.event !== "pause") return;
    pause();
    emitArcade(game, "paused");
  };
  window.addEventListener("message", receive);
  return () => window.removeEventListener("message", receive);
}

export function createGameStorage(namespace: string) {
  const memory = new Map<string, string>();
  function memoryKey() {
    if (typeof window === "undefined" || window.parent === window) return namespace;
    return namespace + ":" + (context()?.session ?? "unbound");
  }
  function binding() {
    if (typeof window === "undefined") return null;
    if (window.parent !== window) {
      const embed = context();
      return embed ? { store: window.sessionStorage, key: namespace + ":" + embed.session } : null;
    }
    return { store: window.localStorage, key: namespace };
  }
  return {
    getItem(_key: string) {
      try { const b = binding(); return b ? b.store.getItem(b.key) : memory.get(memoryKey()) ?? null; }
      catch { return memory.get(memoryKey()) ?? null; }
    },
    setItem(_key: string, value: string) {
      memory.set(memoryKey(), value);
      try { const b = binding(); b?.store.setItem(b.key, value); } catch { /* private mode / quota */ }
    },
  };
}

export function newRunId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID() : "run_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
}

export function portraitRequired() {
  return typeof window !== "undefined" && window.matchMedia("(max-height: 500px) and (orientation: landscape)").matches;
}

export function listenForPortrait(pause: () => void) {
  const orientation = window.matchMedia("(max-height: 500px) and (orientation: landscape)");
  const change = () => { if (orientation.matches) pause(); };
  orientation.addEventListener("change", change); change();
  return () => orientation.removeEventListener("change", change);
}
