// Challenge links and preview text. Server-safe: the share routes load this file, so it imports only pure game-core.
import { challengeHash, readChallenge } from "../../../shared/game-core";

/** Points for weaving 1, 2, 3 or 4 rows with one strip: several at once earn a bonus. */
export const ROW_POINTS = [0, 10, 25, 45, 70] as const;
/** The card shows the newest 14 woven rows (one mat-frame tall); older ones are rolled up. */
export const MAT_ROWS = 14;
export const MAX_ROWS = 9999;
// 9999 rows woven four at a time come to 174,975 points.
export const MAX_SCORE = 175_000;

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** `pattern` holds one 16-bit number per woven row, oldest first: 2 bits of cane colour per column. */
export type Shared = { seed: number; score: number; rows: number; pattern: number[]; name: string };

/**
 * Can `rows` woven rows add up to exactly `score` points? Every row is worth 10, and a clear of 2, 3 or 4 rows adds 5, 15 or 30 more.
 * The cheapest way to earn an extra 5·e uses as many 4-row clears as fit, then at most one 3-row and two 2-row clears.
 */
export function reachable(score: number, rows: number) {
  if (score % 5 !== 0 || score < rows * ROW_POINTS[1]) return false;
  const extra = (score - rows * ROW_POINTS[1]) / 5;
  return 4 * Math.floor(extra / 6) + [0, 2, 4, 3, 5, 7][extra % 6] <= rows;
}

/** Reads a challenge link. Points that `rows` can't add up to, or a pattern of the wrong size, mean a forged link. */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SCORE, extraKeys: ["r", "p"] });
  const rowsText = challenge?.extra.r ?? "", hex = challenge?.extra.p ?? "";
  if (!challenge || !/^\d{1,4}$/.test(rowsText)) return null;
  const rows = Number(rowsText);
  if (!reachable(challenge.target, rows) || !/^[0-9a-f]*$/.test(hex) || hex.length !== 4 * Math.min(rows, MAT_ROWS)) return null;
  const pattern = (hex.match(/.{4}/g) ?? []).map(chunk => parseInt(chunk, 16));
  return { seed: challenge.seed, score: challenge.target, rows, pattern, name: challenge.name };
}

export const sharedHash = ({ seed, score, rows, pattern, name }: Shared) =>
  challengeHash({ seed, target: score, name, extra: { r: rows, p: pattern.slice(-MAT_ROWS).map(row => row.toString(16).padStart(4, "0")).join("") } });

export const banner = ({ score, rows, name }: Shared) => `${name || "বন্ধু"} ${bn(rows)} সারি বুনে ${bn(score)} করেছে। একই বেতের গোছা, এবার তোমার পালা।`;
export const previewTitle = ({ score, rows, name }: Shared) => name ? `${name} ${bn(rows)} সারি বুনে ${bn(score)} করেছে। তুমি পারবে?` : `পাটি বুনিতে ${bn(rows)} সারি, ${bn(score)} পয়েন্ট! তুমি পারবে?`;
export const caption = ({ score, rows }: Pick<Shared, "score" | "rows">) => `পাটি বুনিতে ${bn(rows)} সারি বুনলাম, ${bn(score)} পয়েন্ট। একই বেতের গোছা তোমার জন্য রাখলাম, দেখি কত পারো!`;
