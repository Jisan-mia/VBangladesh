// One class as the rules see it: the teacher's seeded routine, a second watcher's, the lights', the chit's path and its
// sleepers, all as typed arrays the step reads without allocating. Old links (no `v=2`) build the same shape from the
// untouched old generator in legacy.ts, so one step plays both. Pure: no DOM, no Math.random.
import { makeRng, pick } from "../../../shared/game-core";
import { oldClass, OLD_BENCHES, OLD_GRACE, OLD_SPEED, type OldKind } from "./legacy";
import { levelDef, LIVES, MODE_INFO, type Mode } from "./levels";

/** What the teacher is doing. Safe kinds let the chit move; TELL, LENS and BACK warn that a LOOK comes next. */
export const WRITE = 0, TELL = 1, LOOK = 2, COUGH = 3, DROP = 4, PEEK = 5, BLIND = 6, LENS = 7, WIPE = 8, BACK = 9;
/** A second watcher (the captain, the headmaster at the door). */
export const AWAY = 0, W_TELL = 1, W_LOOK = 2;
/** The lights. DIM still counts as lit; FLICK (the tube light coming back) is the warning. */
export const LIT = 0, DIM = 1, DARK = 2, FLICK = 3;

/** 1 for the kinds the chit may move through without being seen. */
export const SAFE_KIND = Uint8Array.of(1, 0, 0, 1, 1, 1, 1, 0, 1, 0);
/** 1 for the kinds that end in a look. */
export const WARN_KIND = Uint8Array.of(0, 1, 0, 0, 0, 0, 0, 1, 0, 1);
/** 1 for the harmless moments that look like danger: moving through one is "brave". */
export const FAKE_KIND = Uint8Array.of(0, 0, 0, 1, 1, 1, 1, 0, 0, 0);

export type Teacher = "sir" | "madam" | "head";
export const TITLE: Record<Teacher, string> = { sir: "স্যার", madam: "ম্যাডাম", head: "হেডস্যার" };

/** The last bench, where the friend waits. The chit starts on bench `from` = BENCHES − benches. */
export const BENCHES = 8, LAST = BENCHES - 1;
export const SEATS = 2;

/** Playful notes between classmates; never anything about tests or answers. The first 8 are the old list, in order. */
export const CHITS = [
  "টিফিনে ঝালমুড়ি?",
  "ছুটির পর মাঠে ক্রিকেট?",
  "জানালায় দেখো, বৃষ্টি আসছে!",
  "কাল টিফিনে আচার আনব",
  "ছুটির পর আইসক্রিমওয়ালা আসবে!",
  "টিফিনের ঘণ্টায় কানামাছি?",
  "আজ টিফিনে পরোটা-ডিম, ভাগ হবে",
  "ছুটির পর লাটিম খেলবে?",
  "ছুটির পর ফুচকা?",
  "বৃষ্টি থামলে মাঠে ফুটবল?",
  "কাল ঘুড়ি ওড়াতে যাবে?",
  "টিফিনে আমার চানাচুর ভাগ হবে",
] as const;
/** The first 5 are the old list, in order. */
export const REPLIES = ["পাক্কা!", "আমিও আছি!", "অবশ্যই!", "দারুণ!", "হ্যাঁ হ্যাঁ!", "চলো!", "টিফিনে দেখা হবে"] as const;
/** What each class writes on the board: ordinary lessons. The first list is the old one, in order. */
export const BOARDS: readonly (readonly (readonly [string, string, string])[])[] = [
  [
    ["বাংলা", "পাঠ ৭: আমাদের গ্রাম", "নতুন শব্দ: মেঠোপথ, খেয়াঘাট"],
    ["গণিত", "৩৬ + ২৭ = ৬৩", "৭ × ৮ = ৫৬"],
    ["বিজ্ঞান", "পানির তিন রূপ:", "বরফ, পানি, বাষ্প"],
    ["ভূগোল", "বাংলাদেশের বড় নদী:", "পদ্মা, মেঘনা, যমুনা"],
    ["রচনা: বর্ষাকাল", "আষাঢ় আর শ্রাবণ,", "এই দুই মাস বর্ষাকাল।"],
  ],
  [
    ["গণিত: ভগ্নাংশ", "১/২ + ১/৪ = ৩/৪", "৩/৫ × ১০ = ৬"],
    ["গণিত: ল.সা.গু.", "৪ আর ৬ এর ল.সা.গু. = ১২", "৯ আর ১২ এর গ.সা.গু. = ৩"],
    ["গণিত: শতকরা", "৫০ এর ২০% = ১০", "২০০ এর ১৫% = ৩০"],
    ["গণিত: ক্ষেত্রফল", "আয়ত = দৈর্ঘ্য × প্রস্থ", "৮ × ৫ = ৪০ বর্গমিটার"],
  ],
  [
    ["বিজ্ঞান: আলো", "আলো সরল পথে চলে", "ছায়া পড়ে উল্টো দিকে"],
    ["বিজ্ঞান: বিদ্যুৎ", "তড়িৎ বর্তনী:", "ব্যাটারি → তার → বাল্ব"],
    ["বিজ্ঞান: পানিচক্র", "বাষ্প → মেঘ → বৃষ্টি", "বৃষ্টি → নদী → সাগর"],
    ["ভূগোল: বর্ষা", "মৌসুমি বায়ু আনে বৃষ্টি", "জুন থেকে সেপ্টেম্বর"],
  ],
];

export type Klass = {
  seed: number; level: number; mode: Mode;
  /** Built from the old ladder (a link without `v=2`). */
  old: boolean;
  world: number;
  teacher: Teacher; chit: number; reply: number; board: number;
  /** The first bench, the seat (0 left, 1 right) that holds the chit on each bench, and 1 where the kid sleeps. */
  from: number; path: Uint8Array; sleeper: Uint8Array;
  /** 1 on a bench the chit is thrown from (the next kid sleeps, the one after is awake). */
  throwAt: Uint8Array;
  speed: number; grace: number;
  /** A finale ends on this many catches; 0 never ends early. A catch sends the chit back `back` benches. */
  lives: number; back: number;
  kinds: Uint8Array; durs: Float64Array; loopFrom: number;
  /** The second watcher's track (empty for none), and its kind for the drawing. */
  wKinds: Uint8Array; wDurs: Float64Array; watcher: "" | "monitor" | "door";
  /** The lights' track (empty for no load-shedding). */
  dKinds: Uint8Array; dDurs: Float64Array;
};

const SCHEDULE_SECONDS = 720;
/** In a room with sleepers, the first stretch of writing after a look lasts at least this long. */
export const LEAD = 1.6;
/** Cycles before the routine starts again at loopFrom (a phone left open stays sane). */
const LOOP_CYCLE = 3;
const r2 = (value: number) => Math.round(value * 100) / 100;
const OLD_KIND: Record<OldKind, number> = { write: WRITE, tell: TELL, look: LOOK, cough: COUGH, drop: DROP, peek: PEEK };
const EMPTY_U8 = new Uint8Array(0), EMPTY_F64 = new Float64Array(0);

function throwsFor(from: number, sleeper: Uint8Array) {
  const at = new Uint8Array(BENCHES);
  for (let bench = from; bench + 2 <= LAST; bench++) if (sleeper[bench + 1] && !sleeper[bench] && !sleeper[bench + 2]) at[bench] = 1;
  return at;
}

/** The room a level plays in: where the chit starts, how fast it walks, and the sleepers it is thrown over. */
export function roomOf(level: number) {
  const L = levelDef(level), from = BENCHES - L.benches, sleeper = new Uint8Array(BENCHES);
  for (const bench of L.sleepers) if (bench > from && bench < LAST) sleeper[bench] = 1;
  return { from, speed: L.speed, sleeper, throwAt: throwsFor(from, sleeper) };
}

/** A class from the old ladder, routine draw for draw. */
function fromOld(seed: number, level: number): Klass {
  const old = oldClass(seed, level);
  return {
    seed, level, mode: "n", old: true, world: 0, teacher: old.teacher, chit: old.chit, reply: old.reply, board: old.board,
    from: BENCHES - OLD_BENCHES, path: Uint8Array.from(old.path), sleeper: new Uint8Array(BENCHES), throwAt: new Uint8Array(BENCHES),
    speed: OLD_SPEED, grace: OLD_GRACE, lives: 0, back: 1,
    kinds: Uint8Array.from(old.segments, segment => OLD_KIND[segment.kind]), durs: Float64Array.from(old.segments, segment => segment.dur), loopFrom: old.loopFrom,
    wKinds: EMPTY_U8, wDurs: EMPTY_F64, watcher: "", dKinds: EMPTY_U8, dDurs: EMPTY_F64,
  };
}

/** The seed fixes the teacher, the note, the board, the path and every routine, so a friend gets the same class. */
export function makeClass(seed: number, level: number, mode: Mode = "n", old = false): Klass {
  if (old) return fromOld(seed, level);
  const rng = makeRng(seed), L = levelDef(level), M = MODE_INFO[mode];
  const teacher: Teacher = L.head ? "head" : rng() < 0.5 ? "sir" : "madam";
  const chit = pick(rng, CHITS.length), reply = pick(rng, REPLIES.length), board = pick(rng, BOARDS[L.world].length);
  const { from, sleeper, throwAt } = roomOf(level), path = new Uint8Array(BENCHES);
  path[from] = pick(rng, SEATS);
  for (let bench = from + 1; bench < BENCHES; bench++) path[bench] = rng() < 0.65 ? SEATS - 1 - path[bench - 1] : path[bench - 1];
  const grace = r2(L.grace + M.grace), tell = (scale = 1, min = 0.4) => Math.max(min, (L.tell[0] + rng() * L.tell[1]) * scale * M.tell);
  const look = (scale = 1) => (L.look[0] + rng() * L.look[1]) * scale * M.look;

  const kinds: number[] = [], durs: number[] = [];
  let total = 0, loopFrom = 0;
  const add = (kind: number, dur: number) => { kinds.push(kind); durs.push(r2(dur)); total += r2(dur); };
  // After a look, the writing lasts long enough before anything else that a throw begun right away always lands.
  const lead = L.sleepers.length ? LEAD : 0.8;
  for (let cycle = 0; total < SCHEDULE_SECONDS; cycle++) {
    if (cycle === LOOP_CYCLE) loopFrom = kinds.length;
    const write = cycle === 0 ? L.first[0] + rng() * L.first[1] : L.write[0] + rng() * L.write[1];
    const turn = rng(), inside = rng();
    const variant = cycle === 0 ? 0 : turn < L.glasses ? 1 : turn < L.glasses + L.duster ? 2 : turn < L.glasses + L.duster + L.double ? 3 : 0;
    const fake = cycle === 0 ? -1 : inside < L.cough ? COUGH : inside < L.cough + L.peek ? PEEK : -1;
    if (fake >= 0) {
      const before = lead + rng() * 0.6;
      add(WRITE, before);
      add(fake, fake === COUGH ? 1.0 : 0.6 + rng() * 0.25);
      add(WRITE, Math.max(0.9, write - before));
    } else add(WRITE, Math.max(lead + 0.4, write));
    if (variant === 1) {
      // Turns round, then wipes the glasses: blind until they go back on (the warning), then a short look.
      add(TELL, tell()); add(BLIND, 1.4 + rng() * 0.8); add(LENS, tell(0.8, 0.55)); add(LOOK, look(0.6));
    } else if (variant === 2) {
      // The duster sweeps the board; the turn right after it is quick.
      add(WIPE, 1.3 + rng() * 0.5); add(TELL, tell(0.55, 0.45)); add(LOOK, look());
    } else if (variant === 3) {
      // A look, back to the board with the hand down, and a second look.
      add(TELL, tell()); add(LOOK, look(0.8)); add(BACK, tell(0.8, 0.55)); add(LOOK, look(0.6));
    } else { add(TELL, tell()); add(LOOK, look()); }
  }

  let wKinds = EMPTY_U8, wDurs = EMPTY_F64;
  const W = L.finale?.watcher ?? null;
  if (W) {
    const wk: number[] = [], wd: number[] = [];
    let wt = 0, away = W.first + rng() * 2;
    while (wt < SCHEDULE_SECONDS) {
      // With sleepers in the room a throw (THROW_TIME) begun just as the warning starts, seen 0.35 s late, still lands before the look counts.
      const parts = [away, Math.max(L.sleepers.length ? 1.15 : 0.5, (W.tell[0] + rng() * W.tell[1]) * M.tell), (W.look[0] + rng() * W.look[1]) * M.look];
      for (let i = 0; i < 3; i++) { wk.push(i); wd.push(r2(parts[i])); wt += r2(parts[i]); }
      away = W.away[0] + rng() * W.away[1];
    }
    wKinds = Uint8Array.from(wk); wDurs = Float64Array.from(wd);
  }

  let dKinds = EMPTY_U8, dDurs = EMPTY_F64;
  if (L.dark) {
    const dk: number[] = [], dd: number[] = [];
    let dt = 0, lit = Math.max(4, L.dark[0] * 0.5) + rng() * 2;
    while (dt < SCHEDULE_SECONDS) {
      // A tube light takes a moment to start: its flicker outlasts a throw seen 0.35 s late.
      const parts = [lit, 0.5, L.blackout[0] + rng() * L.blackout[1], Math.max(1.1, 1.1 * M.tell)];
      for (let i = 0; i < 4; i++) { dk.push(i); dd.push(r2(parts[i])); dt += r2(parts[i]); }
      lit = L.dark[0] + rng() * L.dark[1];
    }
    dKinds = Uint8Array.from(dk); dDurs = Float64Array.from(dd);
  }

  return {
    seed, level, mode, old: false, world: L.world, teacher, chit, reply, board, from, path, sleeper, throwAt,
    speed: L.speed, grace, lives: L.finale ? LIVES : 0, back: L.finale ? 2 : 1,
    kinds: Uint8Array.from(kinds), durs: Float64Array.from(durs), loopFrom,
    wKinds, wDurs, watcher: W ? W.kind : "", dKinds, dDurs,
  };
}

export type Phase = "ready" | "playing" | "over";

/** Who caught the chit, for the drawing and the words. */
export const BY_TEACHER = 0, BY_WATCHER = 1;

export type Game = {
  klass: Klass;
  phase: Phase;
  /** Reached the last bench (false: a finale ended on its last catch). */
  won: boolean;
  /** Benches from the front, `from` to LAST. */
  pos: number;
  /** Real seconds on the clock (from the first press). */
  time: number;
  /** Each track's place: the teacher, the watcher, the lights. */
  seg: number; segT: number; wSeg: number; wT: number; dSeg: number; dT: number;
  /** Seconds of scolding left: nothing moves meanwhile, and the chit slides back. */
  scold: number; scoldBy: number; backFrom: number; backTo: number;
  catches: number;
  /** After a catch the finger must lift before the chit moves again. */
  needRelease: boolean;
  /** The chit moved in the last step. */
  moving: boolean;
  /** A throw over a sleeper in the air, from this bench. */
  throwing: boolean; throwFrom: number;
  /** Seconds of chalk on the board, and how far the duster has swept (0–1), for the drawing. */
  ink: number; wipe: number;
  /** Stops in the last moment before a look (and when the last one was), fakes moved through, throws landed. */
  close: number; closeAt: number; braved: number; bravedSeg: number; bravedDark: number; throws: number;
  /** Right now: would a moving chit be seen, and seconds until it would be (Infinity for no warning). */
  watched: boolean; dangerIn: number;
};

export function createGame(klass: Klass): Game {
  return {
    klass, phase: "ready", won: false, pos: klass.from, time: 0,
    seg: 0, segT: 0, wSeg: 0, wT: 0, dSeg: 0, dT: 0,
    scold: 0, scoldBy: BY_TEACHER, backFrom: klass.from, backTo: klass.from, catches: 0, needRelease: false, moving: false,
    throwing: false, throwFrom: 0, ink: 0, wipe: 0,
    close: 0, closeAt: -9, braved: 0, bravedSeg: -1, bravedDark: -1, throws: 0, watched: false, dangerIn: Infinity,
  };
}

/** Benches the chit has fully reached, counted from its first one (1 to benches). */
export const benchesReached = (game: Game) => Math.min(BENCHES - game.klass.from, Math.floor(game.pos + 1e-9) - game.klass.from + 1);
export const benchCount = (klass: Klass) => BENCHES - klass.from;
export const MAX_TENTHS = 6000;
/** The fastest a class can be done: walking every hop without a stop, and throwing over every sleeper. */
export function minTenths(klass: Pick<Klass, "from" | "speed" | "throwAt">, throwTime: number) {
  let seconds = 0;
  for (let bench = klass.from; bench < LAST;) {
    if (klass.throwAt[bench]) { seconds += throwTime; bench += 2; } else { seconds += 1 / klass.speed; bench++; }
  }
  return Math.floor(seconds * 10);
}
export const tenthsOf = (time: number) => Math.min(MAX_TENTHS, Math.max(1, Math.round(time * 10)));
