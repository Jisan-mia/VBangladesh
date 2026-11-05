// Challenge links, preview text and the words around a result. Server-safe: the share routes load this file, so it imports
// only pure modules. Old links (s t r p n) open খোলা পাটি exactly as before; new ones add l=1..12 for a পাটি.
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { LEVEL_COUNT, LEVELS } from "./levels";

/** Points for weaving 1, 2, 3 or 4 rows with one strip: several at once earn a bonus. A gold row doubles them. */
export const ROW_POINTS = [0, 10, 25, 45, 70] as const;
/** The card shows the newest 14 woven rows (one mat-frame tall); older ones are rolled up. */
export const MAT_ROWS = 14;
export const MAX_ROWS = 9999;
// 9999 rows woven four at a time come to 174,975 points.
export const MAX_SCORE = 175_000;

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** `pattern` holds one 16-bit number per woven row, oldest first: 2 bits of cane colour per column. `level` is absent for খোলা পাটি. */
export type Shared = { seed: number; score: number; rows: number; pattern: number[]; name: string; level?: number };

/**
 * Can `rows` woven rows add up to exactly `score` points in খোলা পাটি? Every row is worth 10, and a clear of 2, 3 or 4 rows adds 5, 15 or 30 more.
 * The cheapest way to earn an extra 5·e uses as many 4-row clears as fit, then at most one 3-row and two 2-row clears.
 */
export function reachable(score: number, rows: number) {
  if (score % 5 !== 0 || score < rows * ROW_POINTS[1]) return false;
  const extra = (score - rows * ROW_POINTS[1]) / 5;
  return 4 * Math.floor(extra / 6) + [0, 2, 4, 3, 5, 7][extra % 6] <= rows;
}

/** A পাটি's points: every row 10 to 17.5, doubled by gold, and a run never weaves more than 3 rows past its goal. */
export function plausible(level: number, score: number, rows: number) {
  const goal = LEVELS[level - 1].goal;
  return rows <= goal + 3 && score % 5 === 0 && score >= rows * 10 && score <= rows * 35;
}

/** Reads a challenge link. Points that `rows` can't add up to, or a pattern of the wrong size, mean a forged link. */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SCORE, extraKeys: ["r", "p", "l"] });
  const rowsText = challenge?.extra.r ?? "", hex = challenge?.extra.p ?? "", levelText = challenge?.extra.l;
  if (!challenge || !/^\d{1,4}$/.test(rowsText)) return null;
  const rows = Number(rowsText);
  if (!/^[0-9a-f]*$/.test(hex) || hex.length !== 4 * Math.min(rows, MAT_ROWS)) return null;
  const pattern = (hex.match(/.{4}/g) ?? []).map(chunk => parseInt(chunk, 16));
  const base = { seed: challenge.seed, score: challenge.target, rows, pattern, name: challenge.name };
  if (levelText === undefined) return reachable(challenge.target, rows) ? base : null;
  if (!/^\d{1,2}$/.test(levelText)) return null;
  const level = Number(levelText);
  if (level < 1 || level > LEVEL_COUNT || !plausible(level, challenge.target, rows)) return null;
  return { ...base, level };
}

export const sharedHash = ({ seed, score, rows, pattern, name, level }: Shared) =>
  challengeHash({ seed, target: score, name, extra: { r: rows, p: pattern.slice(-MAT_ROWS).map(row => row.toString(16).padStart(4, "0")).join(""), ...(level ? { l: level } : {}) } });

const levelName = (level?: number) => level ? LEVELS[level - 1].name : "";

export function banner({ score, rows, name, level }: Shared) {
  if (level) return `${name || "বন্ধু"} ‘${levelName(level)}’ বুনে ${bn(score)} পয়েন্ট পেয়েছে। একই ফালি, এবার তোমার পালা।`;
  return `${name || "বন্ধু"} ${bn(rows)} সারি বুনে ${bn(score)} করেছে। একই বেতের গোছা, এবার তোমার পালা।`;
}
export function previewTitle({ score, rows, name, level }: Shared) {
  if (level) return name ? `${name} ‘${levelName(level)}’ বুনে ${bn(score)} পয়েন্ট পেয়েছে। তুমি পারবে?` : `পাটি বুনিতে ‘${levelName(level)}’: ${bn(rows)} সারি, ${bn(score)} পয়েন্ট। তুমি পারবে?`;
  return name ? `${name} ${bn(rows)} সারি বুনে ${bn(score)} করেছে। তুমি পারবে?` : `পাটি বুনিতে ${bn(rows)} সারি, ${bn(score)} পয়েন্ট! তুমি পারবে?`;
}
export function caption({ score, rows, level }: Pick<Shared, "score" | "rows" | "level">) {
  if (level) return `পাটি বুনিতে ‘${levelName(level)}’ বুনলাম, ${bn(rows)} সারিতে ${bn(score)} পয়েন্ট। একই ফালি তোমার জন্য রাখলাম, দেখি কত পারো!`;
  return `পাটি বুনিতে ${bn(rows)} সারি বুনলাম, ${bn(score)} পয়েন্ট। একই বেতের গোছা তোমার জন্য রাখলাম, দেখি কত পারো!`;
}

/** The mats you weave on the way in খোলা পাটি: each is a milestone, celebrated in play and named on the card. */
export const bands = [
  { min: 0, name: "", line: "প্রথম কয় সারিই সবচেয়ে কঠিন।" },
  { min: 5, name: "ছোট আসন", line: "ছোট্ট একটা আসন হয়ে গেল!" },
  { min: 15, name: "দুজনের পাটি", line: "এই পাটিতে দুজন আরাম করে বসবে।" },
  { min: 30, name: "পরিবারের পাটি", line: "গরমের দুপুরে পুরো পরিবারের পাটি!" },
  { min: 50, name: "উঠানজোড়া পাটি", line: "উঠান ভরে গেল, পুরো বাড়ি বসবে।" },
] as const;
export const humanLine = (rows: number) => bands.findLast(band => rows >= band.min)!.line;
/** The mat these rows make ("" under five rows), and the next one still to weave (null after the biggest). */
export const matName = (rows: number) => bands.findLast(band => rows >= band.min)!.name;
export const nextMat = (rows: number) => bands.find(band => band.min > rows) ?? null;

/** One near-miss line after খোলা পাটি, with the exact gap: a best within reach first, then the next mat; "" when nothing was close. */
export function nearLine(score: number, rows: number, before: number | null) {
  if (before !== null && score > 0 && score <= before && before - score <= Math.max(30, Math.round(before * 0.2))) {
    return score === before ? "সেরার সমান। আর এক সারি হলেই নতুন সেরা।" : `সেরা ${bn(before)} থেকে মাত্র ${bn(before - score)} পয়েন্ট দূরে।`;
  }
  const next = nextMat(rows);
  return next && next.min - rows <= 3 ? `আর ${bn(next.min - rows)} সারি হলেই ${next.name}।` : "";
}

/** After a পাটি: the exact gap to what was missed (the goal, or the next star). "" for ★★★. */
export function levelNear(level: number, rows: number, score: number, stars: number) {
  const row = LEVELS[level - 1];
  if (!stars) return row.goal - rows > 0 ? `আর ${bn(row.goal - rows)} সারি বাকি ছিল।` : "";
  if (stars === 1) return `আর ${bn(row.two - score)} পয়েন্ট হলেই ★★।`;
  if (stars === 2) return `আর ${bn(row.three - score)} পয়েন্ট হলেই ★★★।`;
  return "";
}

/** After a friend's challenge: kind either way. */
export function compareLine(score: number, target: number, name: string) {
  const who = name || "বন্ধু";
  if (score > target) return `${possessive(who)} চেয়ে ${bn(score - target)} বেশি!`;
  if (score === target) return `একদম সমান! ${who}ও ${bn(target)}।`;
  const gap = target - score;
  if (gap <= Math.max(20, Math.round(target * 0.15))) return `আর একটু হলেই! মাত্র ${bn(gap)} কম।`;
  return `${who} এখনো ${bn(gap)} এগিয়ে। আরেকবার?`;
}
