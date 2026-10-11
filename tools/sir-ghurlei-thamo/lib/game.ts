// Rules for স্যার ঘুরলেই থামো: the teacher's seeded routine at the blackboard, the chit moving bench to bench,
// what happens when the teacher looks, and how the time is scored. Pure and allocation-free in the step, so tests can play whole games.
import { makeRng, pick } from "../../../shared/game-core";
import { BENCHES, MAX_TENTHS, MIN_TENTHS, SPEED } from "./link";

export { BENCHES, bn, MAX_CATCHES, MAX_TENTHS, MIN_TENTHS, parseShared, previewTitle, seconds, sharedHash, SLUG, SPEED, type Shared } from "./link";

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

export type Klass = {
  seed: number;
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
export function makeClass(seed: number): Klass {
  const rng = makeRng(seed);
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
    const write = cycle === 0 ? 2.6 + rng() * 0.8 : 2.3 - 0.8 * d + rng() * 1.3;
    // From the second cycle a harmless moment may split the writing; a peek (looks like a turn, isn't) only from the fourth.
    if (cycle >= 1 && rng() < 0.2 + 0.3 * d) {
      const kind = cycle >= 3 && rng() < 0.4 ? "peek" : rng() < 0.5 ? "cough" : "drop";
      const before = 0.8 + rng() * 0.6;
      add("write", before);
      add(kind, kind === "peek" ? 0.55 + rng() * 0.25 : FAKE[kind]);
      add("write", Math.max(0.9, write - before));
    } else add("write", write);
    add("tell", 0.8 - 0.3 * d + rng() * 0.08);
    add("look", 1.1 + rng() * (0.5 + 0.7 * d));
  }
  return { seed, teacher, chit, reply, board, path, segments, loopFrom };
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

export function createGame(seed: number): Game {
  return { klass: makeClass(seed), phase: "ready", pos: 0, time: 0, seg: 0, segT: 0, scold: 0, backFrom: 0, backTo: 0, catches: 0, needRelease: false, moving: false, ink: 0 };
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
