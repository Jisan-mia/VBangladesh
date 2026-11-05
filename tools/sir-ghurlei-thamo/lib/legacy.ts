// The ten-class ladder from before the rewrite, kept draw for draw so every link shared without `v=2` replays the same
// teacher, note, board, path and routine. Nothing here may change: tests/levels.test.ts fingerprints it.
import { makeRng, pick } from "../../../shared/game-core";

/** Classes on the old ladder; class 5 is the original routine, and links without a class open it. */
export const OLD_COUNT = 10, CLASSIC = 5;
/** The old room: 8 benches, the chit at 0.75 benches a second, 0.18 s of grace into a look. */
export const OLD_BENCHES = 8, OLD_SPEED = 0.75, OLD_GRACE = 0.18;
/** Even a never-stopping chit needed this long on the old ladder, so a faster old link is forged. */
export const OLD_MIN_TENTHS = Math.ceil(((OLD_BENCHES - 1) / OLD_SPEED) * 10);

export type OldKind = "write" | "tell" | "look" | "cough" | "drop" | "peek";
export type OldSegment = { kind: OldKind; dur: number };

/** The first 8 notes, 5 replies and 5 boards are the old lists in their old order (the seed picks by index). */
export const OLD_CHITS = 8, OLD_REPLIES = 5, OLD_BOARDS = 5;

const FAKE: Record<"cough" | "drop", number> = { cough: 1.0, drop: 1.7 };
const RAMP = 6;
const SCHEDULE_SECONDS = 720;
const SEATS = 2;

type OldLevel = {
  name: string; first: [number, number]; write: [number, number, number];
  fakeFrom: number; fake: [number, number]; cough: number; peekFrom: number; peek: number;
  tell: [number, number, number]; look: [number, number, number];
};
const BASE: OldLevel = { name: "", first: [2.6, 0.8], write: [2.3, -0.8, 1.3], fakeFrom: 1, fake: [0.2, 0.3], cough: 0.5, peekFrom: 3, peek: 0.4, tell: [0.8, -0.3, 0.08], look: [1.1, 0.5, 0.7] };
export const OLD_LEVELS: readonly OldLevel[] = [
  { ...BASE, name: "ধীরে ধীরে লেখা", first: [3.2, 0.6], write: [3.0, -0.4, 1.0], fakeFrom: Infinity, peekFrom: Infinity, tell: [1.0, -0.1, 0.1], look: [1.0, 0.4, 0.3] },
  { ...BASE, name: "মাঝে মাঝে কাশি", first: [3.0, 0.6], write: [2.8, -0.6, 1.1], fake: [0.25, 0.15], cough: 1, peekFrom: Infinity, tell: [0.95, -0.2, 0.08], look: [1.05, 0.4, 0.4] },
  { ...BASE, name: "চক পড়ে যায়", write: [2.6, -0.7, 1.2], fake: [0.25, 0.2], peekFrom: Infinity, tell: [0.9, -0.25, 0.08], look: [1.1, 0.5, 0.5] },
  { ...BASE, name: "হঠাৎ থেমে যাওয়া", write: [2.4, -0.8, 1.3], peekFrom: 2, peek: 0.35, tell: [0.85, -0.3, 0.08], look: [1.1, 0.5, 0.6] },
  { ...BASE, name: "রোজকার ক্লাস" },
  { ...BASE, name: "তাড়াতাড়ি ঘোরা", tell: [0.7, -0.3, 0.08] },
  { ...BASE, name: "বারবার থামা", fake: [0.3, 0.3], peekFrom: 1, peek: 0.55, tell: [0.7, -0.3, 0.08] },
  { ...BASE, name: "অনেকক্ষণ তাকানো", fake: [0.3, 0.3], peekFrom: 1, peek: 0.55, tell: [0.7, -0.3, 0.08], look: [1.3, 0.6, 0.9] },
  { ...BASE, name: "ছোট ছোট লেখা", write: [1.9, -0.7, 1.1], fake: [0.3, 0.3], peekFrom: 1, peek: 0.55, tell: [0.65, -0.25, 0.06], look: [1.3, 0.6, 0.9] },
  { ...BASE, name: "শেষ পিরিয়ড", write: [1.8, -0.7, 1.0], fake: [0.35, 0.3], peekFrom: 1, peek: 0.6, tell: [0.6, -0.25, 0.06], look: [1.3, 0.6, 1.0] },
];
const oldLevelOf = (level: number) => OLD_LEVELS[Math.max(1, Math.min(OLD_COUNT, level)) - 1];

export type OldClass = {
  seed: number; level: number; teacher: "sir" | "madam"; chit: number; reply: number; board: number;
  path: number[]; segments: OldSegment[]; loopFrom: number;
};

const r2 = (value: number) => Math.round(value * 100) / 100;

/** The old makeClass, unchanged. */
export function oldClass(seed: number, level = CLASSIC): OldClass {
  const rng = makeRng(seed), L = oldLevelOf(level);
  const teacher = rng() < 0.5 ? "sir" : "madam";
  const chit = pick(rng, OLD_CHITS), reply = pick(rng, OLD_REPLIES), board = pick(rng, OLD_BOARDS);
  const path = [pick(rng, SEATS)];
  for (let bench = 1; bench < OLD_BENCHES; bench++) path.push(rng() < 0.65 ? SEATS - 1 - path[bench - 1] : path[bench - 1]);
  const segments: OldSegment[] = [];
  let total = 0, loopFrom = 0;
  const add = (kind: OldKind, dur: number) => { segments.push({ kind, dur: r2(dur) }); total += r2(dur); };
  for (let cycle = 0; total < SCHEDULE_SECONDS; cycle++) {
    if (cycle === RAMP) loopFrom = segments.length;
    const d = Math.min(1, cycle / RAMP);
    const write = cycle === 0 ? L.first[0] + rng() * L.first[1] : L.write[0] + L.write[1] * d + rng() * L.write[2];
    if (cycle >= L.fakeFrom && rng() < L.fake[0] + L.fake[1] * d) {
      const kind = cycle >= L.peekFrom && rng() < L.peek ? "peek" : rng() < L.cough ? "cough" : "drop";
      const before = 0.8 + rng() * 0.6;
      add("write", before);
      add(kind, kind === "peek" ? 0.55 + rng() * 0.25 : FAKE[kind]);
      add("write", Math.max(0.9, write - before));
    } else add("write", write);
    add("tell", L.tell[0] + L.tell[1] * d + rng() * L.tell[2]);
    add("look", L.look[0] + rng() * (L.look[1] + L.look[2] * d));
  }
  return { seed, level, teacher, chit, reply, board, path, segments, loopFrom };
}

export const oldName = (level: number) => oldLevelOf(level).name;
