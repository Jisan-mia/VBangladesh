// The challenge link and the words that travel with it. Server-safe: share.ts imports this, so it reaches only game-core, the
// level data and the word helpers, never React or the DOM.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { CLASSIC, KITCHEN_COUNT, kitchenOf, potsIn, potsPlain, potsWord } from "./kitchens";
import { averageOf, isLevel, isMode, levelDef, type Mode } from "./levels";

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => numbers.format(value);

/**
 * A finished round as a link carries it. `old` is a link from before the rewrite (no `v=2`): `level` is then one of the eight old
 * kitchens (kitchen 3 when the link carries none), averaged with every pot counting the same. The score is real-time, so it is
 * their own phone's word.
 */
export type Shared = { seed: number; total: number; scores: number[]; spills: boolean[]; name: string; slow: boolean; level: number; mode: Mode; old: boolean };

/** The average of a link's pots: old kitchens plainly, the new ladder with the boss pot counted twice. */
export const totalOf = (scores: readonly number[]) => Math.round(scores.reduce((sum, score) => sum + score, 0) / (scores.length || 1));
export const totalFor = (level: number, old: boolean, scores: readonly number[]) => old ? totalOf(scores) : averageOf(level, scores);
export const potsOf = (level: number, old: boolean) => old ? potsIn(level) : levelDef(level).pots;

const potList = (count: number) => new RegExp(`^(?:\\d{1,2}|x)(?:\\.(?:\\d{1,2}|x)){${count - 1}}$`);

/** `#s=<seed>&t=<average>&p=<marks>[&l=<level>][&v=2][&m=e|h][&d=1]&n=<name>`. Anything else is refused. */
export function sharedHash({ seed, scores, spills, name, slow, level, mode, old }: Omit<Shared, "total">) {
  const clean = scores.map((score, index) => spills[index] ? 0 : Math.max(0, Math.min(99, Math.round(score) || 0)));
  const p = clean.map((score, index) => spills[index] ? "x" : String(score)).join(".");
  const extra: Record<string, string | number> = { p };
  if (old) { if (level !== CLASSIC) extra.l = level; }
  else { extra.l = level; extra.v = 2; if (mode !== "n") extra.m = mode; }
  if (slow) extra.d = 1;
  return challengeHash({ seed, target: totalFor(level, old, clean), name, extra });
}

/** Reads a friend's link; null for anything broken, out of range or inconsistent (one mark per pot of that level, and the average must match). */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: 99, extraKeys: ["p", "d", "l", "v", "m"] });
  const list = read?.extra.p;
  if (!read || !list) return null;
  const { l, v, m, d } = read.extra;
  if (d !== undefined && d !== "1") return null;
  const old = v === undefined;
  if (v !== undefined && v !== "2") return null;
  let level: number, mode: Mode = "n";
  if (old) {
    if (m !== undefined) return null;
    const text = l ?? String(CLASSIC);
    if (!/^\d$/.test(text) || Number(text) < 1 || Number(text) > KITCHEN_COUNT) return null;
    level = Number(text);
  } else {
    if (l === undefined || !/^(1[0-2]|[1-9])$/.test(l) || !isLevel(Number(l))) return null;
    if (m !== undefined && (m === "n" || !isMode(m))) return null;
    level = Number(l);
    if (m !== undefined) mode = m as Mode;
  }
  if (!potList(potsOf(level, old)).test(list)) return null;
  const parts = list.split("."), spills = parts.map(part => part === "x"), scores = parts.map(part => part === "x" ? 0 : Number(part));
  if (totalFor(level, old, scores) !== read.target) return null;
  return { seed: read.seed, total: read.target, scores, spills, name: read.name, slow: d === "1", level, mode, old };
}

export const spillCountOf = (spills: readonly boolean[]) => spills.filter(Boolean).length;
const who = (name: string) => cleanName(name) || "বন্ধু";

/** Where on the ladder, as a card and a friend read it. */
export const levelName = ({ level, old }: Pick<Shared, "level" | "old">) => old ? kitchenOf(level).name : levelDef(level).name;
export const whereText = ({ level, old }: Pick<Shared, "level" | "old">) => old ? `পুরোনো রান্নাঘর ${bn(level)} · ${kitchenOf(level).name}` : `লেভেল ${bn(level)} · ${levelDef(level).name}`;

export function caption(shared: Pick<Shared, "total" | "spills" | "level" | "old">) {
  const spilled = spillCountOf(shared.spills);
  return `দুধ উথলানোর আগে, ${whereText(shared)}: ${potsWord(shared.spills.length)} পাতিলে ${bn(shared.total)}%, ${spilled ? `${bn(spilled)}টা উথলে গেছে` : "একটাও উথলায়নি"}। একই পাতিলে তুমি কত পারবে?`;
}
export const previewTitle = ({ total, name }: Pick<Shared, "total" | "name">) => `${name || "এক বন্ধু"} দুধ উথলানোর খেলায় ${bn(total)}% করেছে। তুমি পারবে?`;
export const friendLine = ({ total, name, scores }: Pick<Shared, "total" | "name" | "scores">) => `${name || "তোমার বন্ধু"} ${bn(total)}% করেছে। একই ${potsWord(scores.length)} পাতিল, এবার তোমার পালা।`;
/** Honest label: a real-time score can't be checked. */
export const friendClaim = ({ name, slow }: Pick<Shared, "name" | "slow">) => `${possessive(who(name))} নিজের ফোনের স্কোর${slow ? ", ধীরে খেলায়" : ""}`;

/** After playing a friend's pots: kind either way, with the exact gap. */
export function versusLine(mine: number, theirs: number, name: string, count = 5) {
  const friend = who(name), of = possessive(friend), diff = mine - theirs;
  if (diff > 0) return `${of} চেয়ে ${bn(diff)}% বেশি! এবার লিংকটা ফেরত পাঠাও।`;
  if (diff === 0) return "একদম সমান সমান! আরেকবার খেলে ফয়সালা করো।";
  if (diff >= -5) return `আর একটু হলেই! ${of} চেয়ে মাত্র ${bn(-diff)}% কম।`;
  return `এবার ${friend} এগিয়ে। একই ${potsWord(count)} পাতিল, আরেকবার চেষ্টা করো।`;
}

export { potsPlain, potsWord };
