// The ladder, as data: three houses (worlds) of ten boards. Each house brings one new rule, each level one new thing (its
// `line`, on the start card), and the tenth level of a house is its named finale.
//
// Every board starts from all-lit with `par` switches pressed. Hand-made lessons name those switches; the rest draw them from a
// fixed seed and keep a draw only when the solver proves `par` is the fewest presses and the house's rule is really needed.
// tests/rewrite.test.ts proves every level, and pins every start so a change here can't quietly swap a board behind a link.
import { makeRng, pick } from "../../../shared/game-core";
import { allLit, canPress, isLine, isLit, lineOf, plusMask, pressMask, solutions, switchCount, type Board, type Line } from "./board";

/** `of` is the short name with its genitive ("বারান্দার"), for result lines. */
export type World = { name: string; short: string; of: string; rule: string | null; ruleName: string | null };
export const WORLDS: readonly World[] = [
  { name: "নানাবাড়ির বারান্দা", short: "বারান্দা", of: "বারান্দার", ruleName: null, rule: null },
  { name: "মেসের ঘর", short: "মেস", of: "মেসের", ruleName: "কসটেপ", rule: "কসটেপ মারা সুইচ চাপা যায় না। ওর বাতিতে পৌঁছাও পাশের সুইচ দিয়ে।" },
  { name: "বিয়েবাড়ির প্যান্ডেল", short: "প্যান্ডেল", of: "প্যান্ডেলের", ruleName: "মরিচবাতির লাইন", rule: "সারি বা কলামের মাথার লম্বা সুইচ ওই লাইনের সব বাতি উল্টায়।" },
];
export const PER_WORLD = 10;
export const LEVEL_COUNT = WORLDS.length * PER_WORLD;

/** What a lesson insists on: a dark bulb beside a tape, a line switch in every best answer, or a row and a column line together. */
type Needs = "tape" | "line" | "cross";
type Spec = {
  name: string;
  line: string;
  finale?: string;
  size: 3 | 4 | 5;
  taped?: readonly number[];
  lines?: readonly Line[];
  /** A hand-made lesson's switches; otherwise `par` switches are drawn from `seed`. */
  presses?: readonly number[];
  par?: number;
  seed?: number;
  needs?: Needs;
  /** A first lesson's switch, pulsing until the first press (a nudge, not a hint: stars stay). */
  guide?: number;
};

const row = (at: number): Line => ({ kind: "row", at });
const col = (at: number): Line => ({ kind: "col", at });

const SPECS: readonly Spec[] = [
  // ১ নানাবাড়ির বারান্দা: সোজা তার
  { name: "মাঝের সুইচ", size: 3, presses: [4], guide: 4, line: "মাঝের সুইচটা চাপো। ওর বাতি আর চার পাশের চারটা একসাথে জ্বলবে।" },
  { name: "কোণের সুইচ", size: 3, presses: [0], guide: 0, line: "কোণের সুইচের পাশে বাতি মাত্র দুটো, তাই উল্টায় তিনটা।" },
  { name: "কিনারা", size: 3, presses: [1, 7], line: "কিনারার সুইচ উল্টায় চারটা বাতি। ওপরে এক চাল, নিচে এক চাল।" },
  { name: "জ্বলা বাতিও উল্টায়", size: 3, presses: [0, 4], line: "জ্বলা বাতিতে তার গেলে ওটা নিভে যায়। দুবার উল্টালে আগের মতো।" },
  { name: "আগে-পরে", size: 3, par: 3, seed: 24, line: "কোনটা আগে চাপলে, তাতে কিছু যায় আসে না। কোনগুলো চাপলে, সেটাই আসল।" },
  { name: "ফিরিয়ে আনো", size: 3, par: 3, seed: 2, line: "ভুল চাপলে ‘ফিরিয়ে আনো’ বা Z। ফেরানো চাল গোনা হয় না।" },
  { name: "৪×৪", size: 4, par: 3, seed: 46, line: "বোর্ড বড় হলো, ৪×৪। নিয়ম সেই একই।" },
  { name: "সারি ধরে নামো", size: 4, par: 4, seed: 54, line: "ওপরের সারিতে নেভা বাতি? ঠিক নিচের সুইচটা চাপো। এভাবে সারি ধরে নিচে নামো।" },
  { name: "হিন্ট", size: 4, par: 5, seed: 9, line: "আটকে গেলে ‘হিন্ট’: কোন সুইচ, কয়টা জ্বলবে, কয়টা নিভবে, সব দেখায়। তারা একটা কমে।" },
  { name: "লেভেল ১০", finale: "নানার বোর্ড", size: 4, par: 6, seed: 71, line: "নানা বলতেন, এই বোর্ড তিনি ছয় চালে মেলাতেন। দেখো তো পারো কি না।" },
  // ২ মেসের ঘর: কসটেপ
  { name: "কসটেপ", size: 4, taped: [5], par: 2, seed: 9, needs: "tape", line: "প্রথম কসটেপ। ওই বাতিতে তার যায় চার পাশের চারটা সুইচ থেকে, যেকোনোটা দিয়ে পৌঁছাও।" },
  { name: "কোণে কসটেপ", size: 4, taped: [0], par: 3, seed: 15, needs: "tape", line: "কোণের সুইচে কসটেপ: কোণের বাতিতে পৌঁছায় শুধু পাশের দুটো সুইচ।" },
  { name: "পাশাপাশি দুটো", size: 4, taped: [5, 6], par: 3, seed: 9, needs: "tape", line: "দুটো কসটেপ পাশাপাশি। ওদের বাতিগুলো আগে দেখো, ওদের পথ কম।" },
  { name: "চার কোণ", size: 4, taped: [0, 3, 12, 15], par: 4, seed: 57, needs: "tape", line: "চার কোণেই কসটেপ। প্রতিটা কোণের বাতিতে পথ মাত্র দুটো।" },
  { name: "৫×৫", size: 5, taped: [12], par: 4, seed: 11, needs: "tape", line: "বোর্ড এবার ৫×৫। মাঝখানের সুইচেই কসটেপ।" },
  { name: "টেপের সারি", size: 5, taped: [6, 7, 8], par: 5, seed: 62, needs: "tape", line: "এক সারিতে তিনটা কসটেপ। পাশের সারি দিয়ে ঘুরে আসো।" },
  { name: "কিনারায় টেপ", size: 5, taped: [1, 2, 3], par: 6, seed: 12, needs: "tape", line: "ওপরের কিনারায় কসটেপ। কিনারার বাতি জ্বালাও নিচের সারি দিয়ে।" },
  { name: "ছড়ানো টেপ", size: 5, taped: [3, 9, 11, 15, 21], par: 6, seed: 63, needs: "tape", line: "কসটেপ ছড়ানো। যে বাতিতে পথ একটাই, সেটা আগে।" },
  { name: "সেরার কমে হয় না", size: 5, taped: [6, 8, 16, 18], par: 7, seed: 62, needs: "tape", line: "‘সেরা’ সংখ্যাটা আসলেই সবচেয়ে কম। এর কমে এই বোর্ড মেলে না।" },
  { name: "লেভেল ২০", finale: "পরীক্ষার আগের রাত", size: 5, taped: [1, 7, 11, 13, 17, 23], par: 8, seed: 33, needs: "tape", line: "কাল পরীক্ষা, মেসের ছয়টা সুইচে কসটেপ। আট চালে আলো আনো।" },
  // ৩ বিয়েবাড়ির প্যান্ডেল: মরিচবাতির লাইন
  { name: "লম্বা সুইচ", size: 5, lines: [row(2)], presses: [25], guide: 25, needs: "line", line: "বাম পাশের পিতলের লম্বা সুইচটা চাপো। এক চালে পুরো সারির মরিচবাতি জ্বলবে।" },
  { name: "কলামের সুইচ", size: 5, lines: [col(1)], par: 2, seed: 53, needs: "line", line: "ওপরের লম্বা সুইচ পুরো কলাম উল্টায়।" },
  { name: "লম্বা না ছোট", size: 5, lines: [row(0), col(4)], par: 3, seed: 50, needs: "line", line: "লম্বা সুইচ এক চালে পাঁচটা উল্টায়। কোথায় ওটাই কম চাল, ভাবো।" },
  { name: "দুই সারি", size: 5, lines: [row(1), row(3)], par: 4, seed: 18, needs: "line", line: "দুই সারির মাথায় দুটো লম্বা সুইচ।" },
  { name: "টেপ ফিরল", size: 5, lines: [row(2)], taped: [6, 18], par: 5, seed: 36, needs: "line", line: "মরিচবাতির সাথে কসটেপও ফিরে এল। দুই নিয়ম একসাথে।" },
  { name: "জ্বলাও নেভে", size: 5, lines: [col(2)], par: 5, seed: 82, needs: "line", line: "লম্বা সুইচ জ্বলা বাতিও নিভিয়ে দেয়। আগে গুনে দেখো, লাইনে কয়টা জ্বলছে।" },
  { name: "সারি আর কলাম", size: 5, lines: [row(4), col(0), col(4)], par: 6, seed: 48, needs: "line", line: "সারি আর কলাম, দুই দিকেই লম্বা সুইচ।" },
  { name: "কাটাকুটি", size: 5, lines: [row(1), col(3)], par: 7, seed: 2, needs: "cross", line: "সারি আর কলামের সুইচ দুটোই চাপলে, যেখানে দুই লাইন কাটে, সেই বাতি দুবার উল্টায়।" },
  { name: "তিন লাইন, তিন টেপ", size: 5, lines: [row(0), row(4), col(2)], taped: [6, 8, 16], par: 8, seed: 36, needs: "line", line: "তিনটা লম্বা সুইচ, তিনটা কসটেপ।" },
  { name: "লেভেল ৩০", finale: "বরযাত্রী আসছে", size: 5, lines: [row(1), row(3), col(1), col(3)], taped: [0, 4, 20, 24], par: 9, seed: 12, needs: "line", line: "গেটে বরযাত্রী, প্যান্ডেলের অর্ধেক বাতি নেভা। নয় চালে সব জ্বালাও।" },
];

export type Level = {
  level: number;
  name: string;
  line: string;
  finale?: string;
  board: Board;
  start: number;
  par: number;
  guide?: number;
};

export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
/** 1-based house of a level. */
export const worldOf = (level: number) => Math.min(WORLDS.length, Math.max(1, Math.ceil(level / PER_WORLD)));
export const isFinale = (level: number) => isLevel(level) && level % PER_WORLD === 0;
export const finaleOf = (world: number) => SPECS[world * PER_WORLD - 1].finale!;

const boardOf = (spec: Spec): Board => ({ size: spec.size, taped: (spec.taped ?? []).reduce((mask, at) => mask | (1 << at), 0), lines: spec.lines ?? [] });
const pressAll = (board: Board, presses: readonly number[]) => presses.reduce((lit, id) => lit ^ pressMask(board, id), allLit(board.size));

/** True when the lesson's rule really matters on this start. */
function meets(board: Board, start: number, needs: Needs | undefined, best: number[][]) {
  if (needs === "tape") {
    for (let bulb = 0; bulb < board.size * board.size; bulb++) {
      if (isLit(start, bulb)) continue;
      for (let id = 0; id < board.size * board.size; id++) if (board.taped & (1 << id) && plusMask(board.size, id) & (1 << bulb)) return true;
    }
    return false;
  }
  if (needs === "line") return best.every(answer => answer.some(id => isLine(board, id)));
  if (needs === "cross") return best.every(answer => {
    const kinds = new Set(answer.filter(id => isLine(board, id)).map(id => lineOf(board, id).kind));
    return kinds.size === 2;
  });
  return true;
}

/** Builds a level, or (for tuning) the same level drawn from another seed. */
export function buildLevel(level: number, seed?: number): Level {
  const spec = seed === undefined ? SPECS[level - 1] : { ...SPECS[level - 1], seed }, board = boardOf(spec);
  let presses = spec.presses;
  if (!presses) {
    const k = spec.par!, rng = makeRng(spec.seed ?? level * 7919);
    const pool: number[] = [];
    for (let id = 0; id < switchCount(board); id++) if (canPress(board, id)) pool.push(id);
    for (let tries = 0; !presses; tries++) {
      if (tries > 20_000) throw new Error(`level ${level}: no board with par ${k}`);
      const left = pool.slice(), drawn: number[] = [];
      for (let count = 0; count < k; count++) drawn.push(left.splice(pick(rng, left.length), 1)[0]);
      const start = pressAll(board, drawn), best = solutions(board, start);
      if (start !== allLit(board.size) && best && best[0].length === k && meets(board, start, spec.needs, best)) presses = drawn;
    }
  }
  const start = pressAll(board, presses);
  return { level, name: spec.name, line: spec.line, finale: spec.finale, board, start, par: solutions(board, start)![0].length, guide: spec.guide };
}

const built = new Map<number, Level>();
/** A ladder level, built once. */
export function levelOf(level: number): Level {
  const cached = built.get(level);
  if (cached) return cached;
  const made = buildLevel(level);
  built.set(level, made);
  return made;
}

/** What a lesson insisted on, for the tests. */
export const needsOf = (level: number) => SPECS[level - 1].needs;
