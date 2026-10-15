// দাঁড়িপাল্লা's rules as pure functions: a shop balance with the given side on the left and the child's pan on the right.
// Levels: the missing addend to 10 and 20 (৪ + ? = ৭), fruits of known weight, an unknown fruit found by balancing, an unknown
// plus a weight, two of the same unknown, then the balance as a picture equation (★ + ★ + ৩ = ১১). Weights are plain numbers,
// never কেজি or গ্রাম. Three misses in a row quietly ease the next puzzles, five clean puzzles in a row step them up.
import { makeRng, starsFor } from "../../../shared/game-core";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export type FruitId = "lichu" | "peyara" | "aam" | "pepe" | "kola" | "anaros" | "komola" | "dab";
/** name, and the form before "র/এর" ("কলার ওজন"). */
export const FRUITS: Record<FruitId, { name: string; of: string }> = {
  lichu: { name: "লিচু", of: "লিচুর" },
  peyara: { name: "পেয়ারা", of: "পেয়ারার" },
  aam: { name: "আম", of: "আমের" },
  pepe: { name: "পেঁপে", of: "পেঁপের" },
  kola: { name: "কলা", of: "কলার" },
  anaros: { name: "আনারস", of: "আনারসের" },
  komola: { name: "কমলা", of: "কমলার" },
  dab: { name: "ডাব", of: "ডাবের" },
};
/** Level 3's fruits with a weight tag. Small to big, so the tags never contradict the pictures. */
export const KNOWN_FRUITS: { fruit: FruitId; value: number }[] = [{ fruit: "lichu", value: 1 }, { fruit: "peyara", value: 2 }, { fruit: "aam", value: 3 }, { fruit: "pepe", value: 5 }];
/** Fruits whose weight is the question. Never one of the tagged ones, so "পেয়ারা ২" is never contradicted later. */
export const UNKNOWN_FRUITS: FruitId[] = ["kola", "anaros", "komola", "dab"];

export type Piece = { kind: "weight"; value: number } | { kind: "fruit"; fruit: FruitId; value: number; hidden: boolean } | { kind: "star"; value: number };
const weight = (value: number): Piece => ({ kind: "weight", value });
export const WEIGHTS_10 = [1, 2, 5].map(weight);
export const WEIGHTS_20 = [1, 2, 5, 10].map(weight);

/** The child's pan holds six pieces at most (a fixed starter counts), so the pans stay readable on a small phone. */
export const PAN_MAX = 6;

export type Kind = "fill" | "find" | "guess";
export type LevelSpec = { kind: Kind; label: string; puzzles: number };
export const LEVELS: LevelSpec[] = [
  { kind: "fill", label: "১০-এর মধ্যে", puzzles: 5 },
  { kind: "fill", label: "২০-এর মধ্যে", puzzles: 5 },
  { kind: "fill", label: "ফল দিয়ে মেলাও", puzzles: 5 },
  { kind: "find", label: "কলাটার ওজন কত?", puzzles: 5 },
  { kind: "find", label: "ফল আর বাটখারা", puzzles: 5 },
  { kind: "find", label: "দুটো একই ফল", puzzles: 5 },
  { kind: "guess", label: "ছবির অঙ্ক", puzzles: 5 },
];
export const LEVEL_COUNT = LEVELS.length;
export const specOf = (level: number) => LEVELS[level - 1];

/** -1 eased, 0 as the level says, 1 brisk. Never announced. */
export type Pace = -1 | 0 | 1;

export type Puzzle = {
  kind: Kind;
  /** The given side (left). */
  left: Piece[];
  /** Fixed pieces already on the child's pan (right): the "৪" of ৪ + ? = ৭, or the total of a picture equation. */
  start: Piece[];
  /** What the child may add. Empty for a picture equation. */
  tray: Piece[];
  /** find: asked once the pan is level; guess: asked from the start. */
  answer: number;
  choices: number[];
};

const between = (rng: () => number, low: number, high: number) => low + Math.floor(rng() * (high - low + 1));
const sum = (pieces: Piece[]) => pieces.reduce((total, piece) => total + piece.value, 0);

/** The fewest tray pieces that make `need` exactly (Infinity if they can't). */
export function fewestPieces(need: number, values: number[]) {
  const best = [0];
  for (let total = 1; total <= need; total++) best[total] = Math.min(Infinity, ...values.filter(value => value <= total).map(value => best[total - value] + 1));
  return need < 0 ? Infinity : best[need];
}

/** Two near misses and the answer, small to big, all at least 1. `trap` is the tempting wrong one (the whole pan, not half). */
export function choicesFor(answer: number, rng: () => number, trap?: number) {
  const picks = new Set([answer]);
  if (trap && trap !== answer) picks.add(trap);
  const near = [answer + 1, answer - 1, answer + 2, answer - 2].filter(value => value >= 1);
  if (rng() < 0.5) near.reverse();
  for (const value of near) { if (picks.size >= 3) break; picks.add(value); }
  return [...picks].sort((a, b) => a - b);
}

/** One puzzle for a level at a pace. `index` 0 is a little gentler on the picture-equation level. */
export function makePuzzle(level: number, pace: Pace, rng: () => number, index = 0, avoid?: FruitId): Puzzle {
  const fruitPick = () => { const pool = UNKNOWN_FRUITS.filter(fruit => fruit !== avoid); return pool[Math.floor(rng() * pool.length)]; };
  const unknown = (fruit: FruitId, value: number): Piece => ({ kind: "fruit", fruit, value, hidden: true });
  switch (level) {
    case 1: {
      const total = pace === -1 ? between(rng, 3, 6) : pace === 1 ? between(rng, 7, 10) : between(rng, 5, 10);
      const start = pace === -1 ? between(rng, Math.max(1, total - 4), total - 1) : pace === 1 ? between(rng, 1, total - 3) : between(rng, 1, total - 1);
      return { kind: "fill", left: [weight(total)], start: [weight(start)], tray: WEIGHTS_10, answer: total - start, choices: [] };
    }
    case 2: {
      const total = pace === -1 ? between(rng, 11, 14) : pace === 1 ? between(rng, 15, 20) : between(rng, 11, 20);
      const start = pace === -1 ? between(rng, total - 6, total - 2) : pace === 1 ? between(rng, 2, total - 8) : between(rng, 2, Math.min(10, total - 2));
      return { kind: "fill", left: [weight(total)], start: [weight(start)], tray: WEIGHTS_20, answer: total - start, choices: [] };
    }
    case 3: {
      const total = pace === -1 ? between(rng, 3, 6) : pace === 1 ? between(rng, 9, 15) : between(rng, 6, 12);
      return { kind: "fill", left: [weight(total)], start: [], tray: KNOWN_FRUITS.map(({ fruit, value }) => ({ kind: "fruit", fruit, value, hidden: false })), answer: total, choices: [] };
    }
    case 4: {
      const value = pace === -1 ? between(rng, 2, 6) : pace === 1 ? between(rng, 6, 14) : between(rng, 3, 9);
      return { kind: "find", left: [unknown(fruitPick(), value)], start: [], tray: WEIGHTS_20, answer: value, choices: choicesFor(value, rng) };
    }
    case 5: {
      const value = pace === -1 ? between(rng, 2, 5) : pace === 1 ? between(rng, 5, 12) : between(rng, 3, 9);
      const known = pace === -1 ? between(rng, 1, 2) : pace === 1 ? between(rng, 2, 8) : between(rng, 1, 5);
      return { kind: "find", left: [unknown(fruitPick(), value), weight(known)], start: [], tray: WEIGHTS_20, answer: value, choices: choicesFor(value, rng, value + known) };
    }
    case 6: {
      const value = pace === -1 ? between(rng, 2, 4) : pace === 1 ? between(rng, 4, 9) : between(rng, 2, 7), fruit = fruitPick();
      return { kind: "find", left: [unknown(fruit, value), unknown(fruit, value)], start: [], tray: WEIGHTS_20, answer: value, choices: choicesFor(value, rng, value * 2) };
    }
    default: {
      // ★ + n = T, then ★ + ★ + n = T, then ★ + ★ + ★ (+ n) = T.
      const form = Math.max(0, pace + 1 - (index === 0 ? 1 : 0)), stars = form + 1;
      const value = between(rng, 2, stars === 1 ? 8 : 6), extra = stars === 3 ? between(rng, 0, 4) : between(rng, 1, 6);
      const left: Piece[] = [...Array.from({ length: stars }, (): Piece => ({ kind: "star", value })), ...(extra ? [weight(extra)] : [])];
      return { kind: "guess", left, start: [weight(sum(left))], tray: [], answer: value, choices: choicesFor(value, rng) };
    }
  }
}

/** The weight on the child's pan still missing for level (negative when it is too heavy). */
export const need = (puzzle: Puzzle) => sum(puzzle.left) - sum(puzzle.start);

export type Round = {
  level: number; seed: number; index: number; puzzle: Puzzle; pace: Pace;
  /** Pieces the child put on the right pan, in order. */
  added: Piece[];
  stage: "balance" | "ask" | "done";
  /** The ★ value being tried (guess), or the fruit's answer once found. */
  guess: number | null;
  tries: number; clean: boolean; missRun: number; cleanRun: number;
  misses: number; solved: number;
};

const puzzleRng = (seed: number, index: number) => makeRng(seed + index * 7919);
const firstFruit = (puzzle: Puzzle) => { const piece = puzzle.left.find(each => each.kind === "fruit"); return piece?.kind === "fruit" ? piece.fruit : undefined; };

export function newRound(level: number, pace: Pace = 0, seed = 1 + Math.floor(Math.random() * 1e9)): Round {
  const puzzle = makePuzzle(level, pace, puzzleRng(seed, 0), 0);
  return { level, seed, index: 0, puzzle, pace, added: [], stage: puzzle.kind === "guess" ? "ask" : "balance", guess: null, tries: 0, clean: true, missRun: 0, cleanRun: 0, misses: 0, solved: 0 };
}

/** Left and right totals as they weigh now. A picture equation's ★ weighs what is being tried; before a try the pan is held level. */
export function totals(round: Round) {
  const { puzzle } = round;
  if (puzzle.kind === "guess") {
    const right = sum(puzzle.start);
    if (round.guess === null) return { left: right, right };
    return { left: puzzle.left.reduce((total, piece) => total + (piece.kind === "star" ? round.guess! : piece.value), 0), right };
  }
  return { left: sum(puzzle.left), right: sum(puzzle.start) + sum(round.added) };
}

/** The beam's tilt in degrees: positive lowers the right pan. A difference of 1 still shows; big ones level off at 14°. */
export const MAX_TILT = 14;
export function tiltFor(round: Round) {
  const { left, right } = totals(round);
  return MAX_TILT * Math.tanh((right - left) / 3);
}

/** A damped spring toward the target angle: the wobble when the pan settles. */
export function springStep(state: { angle: number; speed: number }, target: number, dt: number) {
  const stiffness = 64, damping = 3.2;
  const speed = state.speed + (-stiffness * (state.angle - target) - damping * state.speed) * dt;
  return { angle: state.angle + speed * dt, speed };
}
export const settled = (state: { angle: number; speed: number }, target: number) => Math.abs(state.angle - target) < 0.02 && Math.abs(state.speed) < 0.05;

function miss(round: Round): Round {
  const missRun = round.missRun + 1, down = missRun >= 3;
  return { ...round, misses: round.misses + 1, clean: false, cleanRun: 0, missRun: down ? 0 : missRun, pace: down ? Math.max(-1, round.pace - 1) as Pace : round.pace };
}

function finish(round: Round): Round {
  let { cleanRun, pace } = round;
  cleanRun = round.clean ? cleanRun + 1 : 0;
  if (cleanRun >= 5) { cleanRun = 0; pace = Math.min(1, pace + 1) as Pace; }
  return { ...round, stage: "done", cleanRun, pace, missRun: round.clean ? 0 : round.missRun, solved: round.solved + 1 };
}

export type Outcome = "ignore" | "full" | "added" | "over" | "removed" | "level" | "right" | "again";

/** Puts tray piece `index` on the child's pan. Going past the other side on a puzzle with a known target is a miss. */
export function add(round: Round, index: number): { round: Round; outcome: Outcome } {
  const piece = round.puzzle.tray[index];
  if (round.stage !== "balance" || !piece) return { round, outcome: "ignore" };
  if (round.puzzle.start.length + round.added.length >= PAN_MAX) return { round, outcome: "full" };
  const before = totals(round);
  let next: Round = { ...round, added: [...round.added, piece] };
  const after = totals(next);
  if (after.right === after.left) return { round: balanced(next), outcome: "level" };
  // Only crossing over counts as a miss; adding more to a pan that's already heavy just repeats the hint.
  if (after.right > after.left && before.right <= before.left && round.puzzle.kind === "fill") next = miss(next);
  return { round: next, outcome: after.right > after.left ? "over" : "added" };
}

/** Takes piece `index` off the child's pan. Fixed pieces never come off. */
export function remove(round: Round, index: number): { round: Round; outcome: Outcome } {
  if (round.stage !== "balance" || index < 0 || index >= round.added.length) return { round, outcome: "ignore" };
  const next: Round = { ...round, added: round.added.filter((_, at) => at !== index) };
  const after = totals(next);
  if (after.right === after.left) return { round: balanced(next), outcome: "level" };
  return { round: next, outcome: "removed" };
}

/** Level: a filled pan is done; an unknown is asked about next. */
const balanced = (round: Round): Round => round.puzzle.kind === "find" ? { ...round, stage: "ask" } : finish(round);

/** A number tapped: the fruit's weight (find), or a try for ★ (guess). Two wrong tries make the right one glow. */
export function choose(round: Round, value: number): { round: Round; outcome: Outcome } {
  if (round.stage !== "ask" || !round.puzzle.choices.includes(value)) return { round, outcome: "ignore" };
  if (value === round.puzzle.answer) return { round: finish({ ...round, guess: value }), outcome: "right" };
  const next = miss({ ...round, tries: round.tries + 1, guess: round.puzzle.kind === "guess" ? value : round.guess });
  return { round: next, outcome: "again" };
}
export const glows = (round: Round) => round.tries >= 2;

/** The next puzzle, or null when the round is over. A round never moves on to the next level by itself. */
export function nextPuzzle(round: Round): Round | null {
  if (round.stage !== "done" || round.index + 1 >= specOf(round.level).puzzles) return null;
  const index = round.index + 1, puzzle = makePuzzle(round.level, round.pace, puzzleRng(round.seed, index), index, firstFruit(round.puzzle));
  return { ...round, index, puzzle, added: [], stage: puzzle.kind === "guess" ? "ask" : "balance", guess: null, tries: 0, clean: true };
}

/** Where the ghost finger points: the next useful tray piece, the piece to lift off, or the right number. */
export function hint(round: Round): { tray: number } | { pan: number } | { choice: number } | null {
  if (round.stage === "ask") return { choice: round.puzzle.answer };
  if (round.stage !== "balance") return null;
  const { left, right } = totals(round), missing = left - right;
  if (missing < 0) return { pan: round.added.length - 1 };
  const values = round.puzzle.tray.map(piece => piece.value);
  // The biggest piece that still leaves a reachable rest.
  const best = values.map((value, index) => ({ value, index })).filter(({ value }) => value <= missing && fewestPieces(missing - value, values) < Infinity).sort((a, b) => b.value - a.value)[0];
  return best ? { tray: best.index } : null;
}

/** Stars only record the round: no miss or one → 3, up to three → 2, else 1. */
export const roundStars = (round: Round) => starsFor(round.misses, 1, 3, true);

const fruitName = (puzzle: Puzzle) => FRUITS[firstFruit(puzzle) ?? "kola"];

/** What the child is asked to do now, for a parent to read aloud. */
export function prompt(round: Round) {
  const { puzzle } = round;
  if (puzzle.kind === "guess") return "★ কত হলে পাল্লা সমান হবে?";
  if (round.stage === "ask" || (round.stage === "done" && puzzle.kind === "find")) {
    return puzzle.left.filter(piece => piece.kind === "fruit").length === 2 ? `একটা ${fruitName(puzzle).of} ওজন কত?` : `${fruitName(puzzle).name}টার ওজন কত?`;
  }
  if (puzzle.kind === "find") return "বাটখারা দিয়ে পাল্লা সমান করো";
  if (round.level === 3) return "ফল দিয়ে দুই দিক সমান করো";
  return "বাটখারা দিয়ে দুই দিক সমান করো";
}

/** One calm line after a move: why a number doesn't fit, never a scolding. Empty when the pan says enough. */
export function feedback(round: Round, outcome: Outcome, value?: number) {
  const { puzzle } = round, { left, right } = totals(round), fruit = fruitName(puzzle);
  if (outcome === "full") return `পাল্লায় ${bn(PAN_MAX)}টার বেশি ধরে না। বড় কিছু দিয়ে দেখো।`;
  if (outcome === "over" && puzzle.kind === "fill") return `ডানে ${bn(right)}, বামে ${bn(left)}। ${bn(right - left)} বেশি হলো, একটা তুলে নাও।`;
  if (outcome === "over") return "ডান দিক ভারী হয়ে গেল। একটা তুলে নাও।";
  if (outcome === "level" && puzzle.kind === "fill") return `পাল্লা সমান: ${solvedText(round)}`;
  if (outcome === "level") return "পাল্লা সমান। এবার নিচে ওজনটা বেছে নাও।";
  if (outcome === "right" && puzzle.kind === "guess") return `★ = ${bn(puzzle.answer)}। পাল্লা সমান।`;
  if (outcome === "right") return `${fruit.name} = ${bn(puzzle.answer)}।`;
  if (outcome !== "again" || value === undefined) return "";
  const known = puzzle.left.find(piece => piece.kind === "weight")?.value ?? 0;
  const twins = puzzle.left.filter(piece => piece.kind === "fruit").length === 2;
  if (puzzle.kind === "guess") {
    const stars = puzzle.left.filter(piece => piece.kind === "star").length, made = stars * value + known, target = sum(puzzle.start);
    const parts = [...Array.from({ length: stars }, () => bn(value)), ...(known ? [bn(known)] : [])].join(" + ");
    return `★ = ${bn(value)} হলে ${parts} = ${bn(made)}, ${bn(target)}-এর চেয়ে ${made > target ? "বেশি" : "কম"}।`;
  }
  if (twins) return value === right ? `${bn(right)} হলো দুটো ${fruit.name} মিলে। একটা কত?` : `${bn(value)} আর ${bn(value)} মিলে ${bn(value * 2)}, ${bn(right)} নয়।`;
  if (known) return value === right ? `${fruit.name} আর ${bn(known)} মিলে ${bn(right)}। শুধু ${fruit.name}টা কত?` : `${bn(value)} + ${bn(known)} = ${bn(value + known)}, ${bn(right)} নয়।`;
  return `ডানে মোট ${bn(right)}, তাই ${bn(value)} হবে না।`;
}

/** The finished puzzle as one line: "৪ + ৩ = ৭", "কলা + ২ = ৫ + ৪", "★ + ★ + ৩ = ১১". */
export function solvedText(round: Round) {
  const { puzzle } = round;
  const term = (piece: Piece) => piece.kind === "fruit" ? (piece.hidden ? FRUITS[piece.fruit].name : bn(piece.value)) : piece.kind === "star" ? "★" : bn(piece.value);
  const side = (pieces: Piece[]) => pieces.map(term).join(" + ");
  if (puzzle.kind === "fill") return `${side([...puzzle.start, ...round.added])} = ${side(puzzle.left)}`;
  if (puzzle.kind === "find") return `${side(puzzle.left)} = ${side(round.added)}`;
  return `${side(puzzle.left)} = ${side(puzzle.start)}`;
}

export function endLine(round: Round) {
  const kind = specOf(round.level).kind;
  if (kind === "guess") return `${bn(round.solved)}টা ছবির অঙ্ক মেলালে।`;
  if (kind === "find") return `${bn(round.solved)}টা ফলের ওজন বের করলে।`;
  return `${bn(round.solved)}বার পাল্লা সমান করলে।`;
}

/** Praise the method, and only when it earned it (at most one miss). */
export function praiseLine(round: Round) {
  if (round.misses > 1) return "";
  const kind = specOf(round.level).kind;
  if (kind === "guess") return "★ বসিয়ে মিলিয়ে দেখলে, তাই ঠিকটা পেলে।";
  if (kind === "find") return "পাল্লা সমান মানে দুই দিক একই, সেটা কাজে লাগালে।";
  return "কত লাগবে আগে ভেবে নিলে, তাই বেশি হয়নি।";
}

export type Today = { balanced: number; found: number; pictures: number; last: string };
export const EMPTY_TODAY: Today = { balanced: 0, found: 0, pictures: 0, last: "" };
/** Counts one finished puzzle into today's card. */
export function addToday(today: Today, round: Round): Today {
  const kind = round.puzzle.kind;
  return {
    balanced: today.balanced + (kind === "guess" ? 0 : 1),
    found: today.found + (kind === "find" ? 1 : 0),
    pictures: today.pictures + (kind === "guess" ? 1 : 0),
    last: kind === "fill" ? solvedText(round) : `${solvedText(round)}, ${kind === "guess" ? "★" : fruitName(round.puzzle).name} = ${bn(round.puzzle.answer)}`,
  };
}

/** The card's lines for the parent: what was done today, first person, no name. */
export function cardLines(today: Today) {
  const lines = [
    today.balanced ? `${bn(today.balanced)}বার পাল্লা সমান করলাম` : "",
    today.found ? `${bn(today.found)}টা ফলের ওজন বের করলাম` : "",
    today.pictures ? `${bn(today.pictures)}টা ছবির অঙ্ক মেলালাম` : "",
  ].filter(Boolean);
  if (lines.length) lines[0] = `আজ ${lines[0]}`;
  return lines;
}

/** The fixed result the #og preview draws: never read from or written to the phone. */
export const OG_TODAY: Today = { balanced: 12, found: 5, pictures: 0, last: "৪ + ৩ = ৭" };
