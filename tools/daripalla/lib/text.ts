// The words around a pan, and today's counts for the parent card. Pure strings; plain Bangla, never a scolding.
import { bn, levelOf } from "./levels";
import { FRUITS, PAN_MAX, sum, type Piece, type Puzzle } from "./puzzle";
import { ST, totals, type Outcome, type Run } from "./sim";

const firstFruit = (puzzle: Puzzle) => { const piece = puzzle.left.find(each => each.kind === "fruit"); return piece?.kind === "fruit" ? piece.fruit : undefined; };
const fruitName = (puzzle: Puzzle) => FRUITS[firstFruit(puzzle) ?? "kola"];
const fruitCount = (puzzle: Puzzle) => puzzle.left.filter(piece => piece.kind === "fruit").length;

/** What the child is asked to do now. */
export function prompt(run: Run) {
  const { puzzle } = run;
  if (puzzle.kind === "guess") return "★ কত হলে পাল্লা সমান হবে?";
  if (run.stage === ST.ASK || (run.stage === ST.DONE && puzzle.kind === "find")) {
    return fruitCount(puzzle) === 2 ? `একটা ${fruitName(puzzle).of} ওজন কত?` : `${fruitName(puzzle).name}টার ওজন কত?`;
  }
  if (puzzle.kind === "find") return "বাটখারা দিয়ে পাল্লা সমান করো";
  if (run.level === 3) return "ফল দিয়ে দুই দিক সমান করো";
  return "বাটখারা দিয়ে দুই দিক সমান করো";
}

/** The finished pan as one line: "৪ + ৩ = ৭", "কলা + ২ = ৫ + ৪", "★ + ★ + ৩ = ১১". */
export function solvedText(run: Run) {
  const { puzzle } = run;
  const term = (piece: Piece) => piece.kind === "fruit" ? (piece.hidden ? FRUITS[piece.fruit].name : bn(piece.value)) : piece.kind === "star" ? "★" : bn(piece.value);
  const side = (pieces: Piece[]) => pieces.map(term).join(" + ");
  if (puzzle.kind === "fill") return `${side([...puzzle.start, ...run.added])} = ${side(puzzle.left)}`;
  if (puzzle.kind === "find") return `${side(puzzle.left)} = ${side(run.added)}`;
  return `${side(puzzle.left)} = ${side(puzzle.start)}`;
}

/** One calm line after a move: why a number doesn't fit. Empty when the pan says enough. */
export function feedback(run: Run, outcome: Outcome, value?: number) {
  const { puzzle } = run, { left, right } = totals(run), fruit = fruitName(puzzle);
  if (outcome === "full") return `পাল্লায় ${bn(PAN_MAX)}টার বেশি ধরে না। বড় কিছু দিয়ে দেখো।`;
  if (outcome === "over" && puzzle.kind === "fill") return `ডানে ${bn(right)}, বামে ${bn(left)}। ${bn(right - left)} বেশি হলো, একটা তুলে নাও।`;
  if (outcome === "over") return "ডান দিক ভারী হয়ে গেল। একটা তুলে নাও।";
  if (outcome === "level" && puzzle.kind === "fill") return `পাল্লা সমান: ${solvedText(run)}`;
  if (outcome === "level") return "পাল্লা সমান। এবার নিচে ওজনটা বেছে নাও।";
  if (outcome === "right" && puzzle.kind === "guess") return `★ = ${bn(puzzle.answer)}। পাল্লা সমান।`;
  if (outcome === "right") return `${fruit.name} = ${bn(puzzle.answer)}।`;
  if (outcome !== "again" || value === undefined) return "";
  const known = puzzle.left.find(piece => piece.kind === "weight")?.value ?? 0;
  const twins = fruitCount(puzzle) === 2;
  if (puzzle.kind === "guess") {
    const stars = puzzle.left.filter(piece => piece.kind === "star").length, made = stars * value + known, target = sum(puzzle.start);
    const parts = [...Array.from({ length: stars }, () => bn(value)), ...(known ? [bn(known)] : [])].join(" + ");
    return `★ = ${bn(value)} হলে ${parts} = ${bn(made)}, ${bn(target)}-এর চেয়ে ${made > target ? "বেশি" : "কম"}।`;
  }
  if (twins && known) {
    if (value === right) return `${bn(right)} হলো দুটো ${fruit.name} আর ${bn(known)} মিলে। একটা কত?`;
    if (value === right - known) return `${bn(value)} হলো দুটো ${fruit.name} মিলে। একটা কত?`;
    return `${bn(value)} + ${bn(value)} + ${bn(known)} = ${bn(value * 2 + known)}, ${bn(right)} নয়।`;
  }
  if (twins) return value === right ? `${bn(right)} হলো দুটো ${fruit.name} মিলে। একটা কত?` : `${bn(value)} আর ${bn(value)} মিলে ${bn(value * 2)}, ${bn(right)} নয়।`;
  if (known) return value === right ? `${fruit.name} আর ${bn(known)} মিলে ${bn(right)}। শুধু ${fruit.name}টা কত?` : `${bn(value)} + ${bn(known)} = ${bn(value + known)}, ${bn(right)} নয়।`;
  return `ডানে মোট ${bn(right)}, তাই ${bn(value)} হবে না।`;
}

export function endLine(level: number, solved: number) {
  const kind = levelOf(level).kind;
  if (kind === "guess") return `${bn(solved)}টা ছবির অঙ্ক মেলালে।`;
  if (kind === "find") return `${bn(solved)}টা ফলের ওজন বের করলে।`;
  return `${bn(solved)}বার পাল্লা সমান করলে।`;
}

/** Praise the method, and only when it earned it (at most one miss). */
export function praiseLine(level: number, misses: number) {
  if (misses > 1) return "";
  const kind = levelOf(level).kind;
  if (kind === "guess") return "★ বসিয়ে মিলিয়ে দেখলে, তাই ঠিকটা পেলে।";
  if (kind === "find") return "পাল্লা সমান মানে দুই দিক একই, সেটা কাজে লাগালে।";
  return "কত লাগবে আগে ভেবে নিলে, তাই বেশি হয়নি।";
}

export type Today = { balanced: number; found: number; pictures: number; last: string };
export const EMPTY_TODAY: Today = { balanced: 0, found: 0, pictures: 0, last: "" };
/** Counts one finished pan into today's card. */
export function addToday(today: Today, run: Run): Today {
  const kind = run.puzzle.kind;
  return {
    balanced: today.balanced + (kind === "guess" ? 0 : 1),
    found: today.found + (kind === "find" ? 1 : 0),
    pictures: today.pictures + (kind === "guess" ? 1 : 0),
    last: kind === "fill" ? solvedText(run) : `${solvedText(run)}, ${kind === "guess" ? "★" : fruitName(run.puzzle).name} = ${bn(run.puzzle.answer)}`,
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
