export const BANKS = {
  ready: [
    "We're right here with you.",
    "Love is falling. Take your time.",
    "Steady. The family is with you.",
    "Breathe. Catch what comes to you.",
  ],
  start: [
    "We're right here with you.",
    "Love is falling. Take your time.",
    "Steady. The family is with you.",
    "Breathe. Catch what comes to you.",
  ],
  endlow: [
    "You showed up. That is enough.",
    "We're still here. No rush.",
    "Love doesn't keep a score.",
    "Rest. We'll rain again.",
  ],
  endhot: [
    "We felt that with you.",
    "You stayed. We're proud.",
    "That love landed. Thank you.",
    "Held together. That's the gift.",
  ],
} as const;

export type LineKey = keyof typeof BANKS;

export const LINES: Record<LineKey, string> = Object.fromEntries(
  (Object.keys(BANKS) as LineKey[]).map((k) => [k, BANKS[k][0]]),
) as Record<LineKey, string>;

const decks: Partial<Record<LineKey, string[]>> = {};
const recent: string[] = [];
let lastAt = 0;
let lastKey: LineKey | null = null;

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function pickLine(key: LineKey): string {
  const bank = BANKS[key] as readonly string[];
  if (bank.length === 1) return bank[0];
  let deck = decks[key];
  if (!deck || deck.length === 0) {
    deck = shuffle([...bank]);
    decks[key] = deck;
  }
  const line = deck.pop()!;
  recent.push(line);
  if (recent.length > 8) recent.shift();
  return line;
}

const CLIPS = Object.fromEntries(
  (Object.keys(BANKS) as LineKey[]).map((key) => [
    key,
    BANKS[key].map((_, index) => `/voice/${key}-${index}.mp3`),
  ]),
) as Record<LineKey, string[]>;

let current: HTMLAudioElement | null = null;

function playClip(src: string | undefined, muted: boolean) {
  if (!src || muted || typeof window === "undefined") return;
  const now = performance.now();
  if (now - lastAt < 900) return;
  lastAt = now;
  if (current) {
    current.pause();
    current = null;
  }
  const audio = new Audio(src);
  audio.volume = 0.92;
  current = audio;
  void audio.play().catch(() => {});
}

export function speak(key: LineKey, muted: boolean, text?: string) {
  const bank: readonly string[] = BANKS[key];
  const index = text === undefined ? 0 : Math.max(0, bank.indexOf(text));
  playClip(CLIPS[key][index], muted);
}

export function speakNova(which: "height" | "higher", muted: boolean) {
  playClip(`/voice/${which}.mp3`, muted);
}

export function silence() {
  if (current) {
    current.pause();
    current = null;
  }
}

export function preloadVoices() {
  if (typeof window === "undefined") return;
  Object.values(CLIPS).flat().forEach((src) => {
    new Audio(src).load();
  });
  // Nova's optional height/higher recordings are not bundled or used by the
  // current game. Do not request them eagerly on every title-screen visit.
}
