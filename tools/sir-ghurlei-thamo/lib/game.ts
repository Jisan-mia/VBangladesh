// Rules for স্যার ঘুরলেই থামো: the teacher's seeded routine at the blackboard, the chit moving bench to bench,
// what happens when the teacher looks, and how the time is scored. Pure and allocation-free in the step, so tests can play whole games.
import { makeRng, pick, starsFor } from "../../../shared/game-core";
import { BENCHES, CLASSIC, LEVEL_COUNT, MAX_TENTHS, MIN_TENTHS, SPEED } from "./link";

export { BENCHES, bn, CLASSIC, LEVEL_COUNT, MAX_CATCHES, MAX_TENTHS, MIN_TENTHS, parseShared, previewTitle, seconds, sharedHash, SLUG, SPEED, type Shared } from "./link";

/** write: back to the class. tell: chalk stops, head tilts, then a real turn. look: facing the class.
 *  cough and drop: harmless (a cough; a dropped chalk picked up from the floor). peek: looks like a tell, then back to writing. */
export type Kind = "write" | "tell" | "look" | "cough" | "drop" | "peek";
export type Segment = { kind: Kind; dur: number };
export type Teacher = "sir" | "madam";

export const TITLE: Record<Teacher, string> = { sir: "স্যার", madam: "ম্যাডাম" };
/** Playful notes between classmates; never anything about tests or answers. */
export const CHITS = [
  "টিফিনে ঝালমুড়ি?",
  "ছুটির পর মাঠে ক্রিকেট?",
  "জানালায় দেখো, বৃষ্টি আসছে!",
  "কাল টিফিনে আচার আনব",
  "ছুটির পর আইসক্রিমওয়ালা আসবে!",
  "টিফিনের ঘণ্টায় কানামাছি?",
  "আজ টিফিনে পরোটা-ডিম, ভাগ হবে",
  "ছুটির পর লাটিম খেলবে?",
] as const;
export const REPLIES = ["পাক্কা!", "আমিও আছি!", "অবশ্যই!", "দারুণ!", "হ্যাঁ হ্যাঁ!"] as const;
/** What the teacher writes on the board: ordinary lessons. */
export const BOARDS = [
  ["বাংলা", "পাঠ ৭: আমাদের গ্রাম", "নতুন শব্দ: মেঠোপথ, খেয়াঘাট"],
  ["গণিত", "৩৬ + ২৭ = ৬৩", "৭ × ৮ = ৫৬"],
  ["বিজ্ঞান", "পানির তিন রূপ:", "বরফ, পানি, বাষ্প"],
  ["ভূগোল", "বাংলাদেশের বড় নদী:", "পদ্মা, মেঘনা, যমুনা"],
  ["রচনা: বর্ষাকাল", "আষাঢ় আর শ্রাবণ,", "এই দুই মাস বর্ষাকাল।"],
] as const;

/** Teacher-seconds into a look before moving counts: the turn itself is still happening. */
export const GRACE = 0.18;
/** Teacher-seconds of the raised eyebrow and "এইদিকে তাকাও" after a catch; nothing moves meanwhile. Longer than most looks, so pushing on never pays. */
export const SCOLD = 2;
/** Fixed lengths of the harmless moments, in teacher-seconds. */
export const FAKE: Record<"cough" | "drop", number> = { cough: 1.0, drop: 1.7 };
/** Cycles until the routine reaches full difficulty. */
export const RAMP = 6;
const SCHEDULE_SECONDS = 720;
/** Children per bench in the middle row; the chit holder on each bench is one of them. */
export const SEATS = 2;

/**
 * The classes, from a teacher who writes long and slow to one who turns fast and fakes it. Each adds one thing.
 * write = w0 + wd·d + rng·wr seconds (d ramps 0 → 1 over RAMP cycles); a harmless moment splits the writing from cycle `fakeFrom`
 * with chance f0 + fd·d (a cough with chance `cough`, else a dropped chalk), and is a peek (a fake turn) from cycle `peekFrom` with chance `peek`;
 * tell = t0 + td·d + rng·tr; look = l0 + rng·(lr + ld·d). Class 5 is the original game's routine, draw for draw, so old links replay it exactly.
 */
export type Level = {
  name: string; first: [number, number]; write: [number, number, number];
  fakeFrom: number; fake: [number, number]; cough: number; peekFrom: number; peek: number;
  tell: [number, number, number]; look: [number, number, number];
};
const BASE: Level = { name: "", first: [2.6, 0.8], write: [2.3, -0.8, 1.3], fakeFrom: 1, fake: [0.2, 0.3], cough: 0.5, peekFrom: 3, peek: 0.4, tell: [0.8, -0.3, 0.08], look: [1.1, 0.5, 0.7] };
export const LEVELS: readonly Level[] = [
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
export const levelOf = (level: number) => LEVELS[Math.max(1, Math.min(LEVEL_COUNT, level)) - 1];

export type Klass = {
  seed: number;
  /** Which class (1..LEVEL_COUNT) the routine belongs to. */
  level: number;
  teacher: Teacher;
  chit: number;
  reply: number;
  board: number;
  /** Which seat (0 left, 1 right) holds the chit on each bench. */
  path: number[];
  segments: Segment[];
  /** Where the routine starts again after the end (never reached in a real game, but a phone left open stays sane). */
  loopFrom: number;
};

const r2 = (value: number) => Math.round(value * 100) / 100;

/** The seed fixes the teacher, the note, the board, the chit's path and the whole routine, so a friend gets the same class. */
export function makeClass(seed: number, level = CLASSIC): Klass {
  const rng = makeRng(seed), L = levelOf(level);
  const teacher: Teacher = rng() < 0.5 ? "sir" : "madam";
  const chit = pick(rng, CHITS.length), reply = pick(rng, REPLIES.length), board = pick(rng, BOARDS.length);
  // Mostly zig-zag across the bench, so every hand-off is easy to see.
  const path = [pick(rng, SEATS)];
  for (let bench = 1; bench < BENCHES; bench++) path.push(rng() < 0.65 ? SEATS - 1 - path[bench - 1] : path[bench - 1]);
  const segments: Segment[] = [];
  let total = 0, loopFrom = 0;
  const add = (kind: Kind, dur: number) => { segments.push({ kind, dur: r2(dur) }); total += r2(dur); };
  for (let cycle = 0; total < SCHEDULE_SECONDS; cycle++) {
    if (cycle === RAMP) loopFrom = segments.length;
    const d = Math.min(1, cycle / RAMP);
    // The first stretch is long and calm so the first seconds are fun; later ones are shorter and less even.
    const write = cycle === 0 ? L.first[0] + rng() * L.first[1] : L.write[0] + L.write[1] * d + rng() * L.write[2];
    // A harmless moment may split the writing (in the original class from the second cycle); a peek (looks like a turn, isn't) only later.
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

export type Phase = "ready" | "playing" | "over";

export type Game = {
  klass: Klass;
  phase: Phase;
  /** Benches travelled from the first one, 0 to BENCHES − 1. */
  pos: number;
  /** Real seconds on the clock (from the first press). */
  time: number;
  /** The teacher's place in the routine. */
  seg: number;
  segT: number;
  /** Teacher-seconds of scolding left; while above 0 nothing moves and the chit slides back. */
  scold: number;
  backFrom: number;
  backTo: number;
  catches: number;
  /** After a catch the finger must lift before the chit moves again. */
  needRelease: boolean;
  /** The chit moved in the last step. */
  moving: boolean;
  /** Teacher-seconds of chalk on the board, for the drawing. */
  ink: number;
};

export function createGame(seed: number, level = CLASSIC): Game {
  return { klass: makeClass(seed, level), phase: "ready", pos: 0, time: 0, seg: 0, segT: 0, scold: 0, backFrom: 0, backTo: 0, catches: 0, needRelease: false, moving: false, ink: 0 };
}

const nextSeg = (klass: Klass, seg: number) => (seg + 1 < klass.segments.length ? seg + 1 : klass.loopFrom);
export const kindOf = (game: Game): Kind => game.klass.segments[game.seg].kind;

/** Where the chit goes back to when caught: the bench before the one it last reached. */
export const backBench = (pos: number) => Math.max(0, Math.floor(pos + 1e-9) - 1);

/**
 * Advances dt real seconds. `holding` is the finger (or key) on the pass control; `rate` slows the whole class in slow mode.
 * Mutates in place and allocates nothing, so it can run 60 times a second on a cheap phone.
 */
export function stepGame(game: Game, holding: boolean, dt: number, rate = 1) {
  game.moving = false;
  if (game.phase === "over") return;
  if (!holding) game.needRelease = false;
  const t = dt * rate;
  if (game.phase === "ready") {
    // Before the first press the teacher just writes; the routine and the clock wait.
    game.ink += t;
    if (!holding) return;
    game.phase = "playing";
  }
  game.time += dt;
  if (game.scold > 0) {
    game.scold = Math.max(0, game.scold - t);
    // The chit slides back over the first half of the scolding.
    const slide = Math.min(1, (SCOLD - game.scold) / (SCOLD / 2));
    game.pos = game.backFrom + (game.backTo - game.backFrom) * slide;
    // Then the teacher turns back to the board: the rest of that look is skipped, so nobody is ever stuck under a stare.
    if (game.scold === 0) { game.seg = nextSeg(game.klass, game.seg); game.segT = 0; }
    return;
  }
  const segments = game.klass.segments;
  game.segT += t;
  while (game.segT >= segments[game.seg].dur) { game.segT -= segments[game.seg].dur; game.seg = nextSeg(game.klass, game.seg); }
  const kind = segments[game.seg].kind;
  if (kind === "write") game.ink += t;
  if (!holding || game.needRelease) return;
  if (kind === "look" && game.segT >= GRACE) {
    game.catches++;
    game.scold = SCOLD;
    game.backFrom = game.pos;
    game.backTo = backBench(game.pos);
    game.needRelease = true;
    return;
  }
  game.pos = Math.min(BENCHES - 1, game.pos + SPEED * t);
  game.moving = true;
  if (game.pos >= BENCHES - 1) game.phase = "over";
}

export const tenthsOf = (time: number) => Math.min(MAX_TENTHS, Math.max(MIN_TENTHS, Math.round(time * 10)));
/** Benches the chit has fully reached, 1 to BENCHES (it starts on the first). */
export const benchesReached = (pos: number) => Math.min(BENCHES, Math.floor(pos + 1e-9) + 1);

export type Status = "ready" | "write" | "tell" | "look" | "cough" | "drop" | "scold" | "lift" | "done";

/** What the player should know right now, from what is visible. A peek looks exactly like a real tell. */
export function statusOf(game: Game, holding: boolean): Status {
  if (game.phase === "ready") return "ready";
  if (game.phase === "over") return "done";
  if (game.scold > 0) return "scold";
  const kind = kindOf(game);
  if (kind === "peek") return "tell";
  if (game.needRelease && holding && kind !== "look") return "lift";
  return kind;
}

/** How quickly a player can see things change and react, for the star targets. */
export const REACTION = 0.25;

/**
 * A sharp, careful classmate: moves while the teacher writes (or coughs, or picks up the chalk) and stops at every tell,
 * each change seen `reaction` seconds late. Returns the finishing time in tenths and how often they were caught.
 */
export function carefulRun(klass: Pick<Klass, "seed" | "level">, reaction = REACTION, rate = 1) {
  const game = createGame(klass.seed, klass.level);
  let seen: string = "write", heard: string = "write", timer = 0, steps = 0;
  stepGame(game, true, 1 / 60, rate);
  while (game.phase !== "over" && steps++ < 60 * 600) {
    const kind = game.scold > 0 ? "scold" : kindOf(game);
    if (kind !== heard) { heard = kind; timer = reaction; }
    if (timer > 0 && (timer -= 1 / 60) <= 0) seen = heard;
    stepGame(game, !game.needRelease && (seen === "write" || seen === "cough" || seen === "drop"), 1 / 60, rate);
  }
  return { tenths: tenthsOf(game.time), catches: game.catches };
}

/** Star targets for a class: three for the careful classmate's time plus one second, two for five seconds more. Finishing is one. */
export function starTargets(klass: Pick<Klass, "seed" | "level">) {
  const three = carefulRun(klass).tenths + 10;
  return { three, two: three + 50 };
}
/** Stars for a finished class. Slow mode runs the class at `rate`, so its real seconds count at that rate. */
export const classStars = (tenths: number, targets: { three: number; two: number }, rate = 1) => starsFor(Math.round(tenths * rate), targets.three, targets.two, true);
