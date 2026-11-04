// The challenge link and the words that travel with it. Server-safe: share.ts imports this, so it reaches only game-core,
// the levels and the pure class builder, never React.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { BENCHES, MAX_TENTHS, minTenths, roomOf } from "./class";
import { CLASSIC, OLD_BENCHES, OLD_COUNT, OLD_MIN_TENTHS } from "./legacy";
import { isLevel, isMode, levelDef, LIVES, THROW_TIME, type Mode } from "./levels";

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
const decimal = new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false });
export const bn = (value: number) => numbers.format(value);
/** 224 → "২২.৪" */
export const seconds = (tenths: number) => decimal.format(tenths / 10);

export const MAX_CATCHES = 60;

/**
 * A finished class as the player reports it. `old` is a link from before the rewrite (no `v=2`), which replays the old ten-class
 * ladder; its class 5 links never carried `l`. The time is real-time, so it's their own phone's word.
 */
export type Shared = { seed: number; tenths: number; catches: number; name: string; level: number; mode: Mode; old: boolean };

/** The fastest a level can be done, so a faster link is forged. */
export const fastest = (level: number, old: boolean) => old ? OLD_MIN_TENTHS : minTenths(roomOf(level), THROW_TIME);

/** `#s=<seed>&t=<tenths>&c=<times caught>[&l=<level>][&v=2][&d=e|h]&n=<name>`. Anything else is refused. */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_TENTHS, extraKeys: ["c", "l", "v", "d"] });
  if (!read) return null;
  const { c = "0", l, v, d } = read.extra;
  if (v !== undefined && v !== "2") return null;
  const old = v === undefined;
  if (!/^\d{1,2}$/.test(c) || Number(c) > MAX_CATCHES) return null;
  if (old) {
    const level = l ?? String(CLASSIC);
    if (d !== undefined || !/^[1-9]\d?$/.test(level) || Number(level) > OLD_COUNT || read.target < OLD_MIN_TENTHS) return null;
    return { seed: read.seed, tenths: read.target, catches: Number(c), name: read.name, level: Number(level), mode: "n", old: true };
  }
  if (l === undefined || !/^(1[0-2]|[1-9])$/.test(l) || !isLevel(Number(l))) return null;
  if (d !== undefined && (d === "n" || !isMode(d))) return null;
  const level = Number(l), catches = Number(c);
  // A finale shared as a win ended before its last catch.
  if (levelDef(level).finale && catches >= LIVES) return null;
  if (read.target < fastest(level, false)) return null;
  return { seed: read.seed, tenths: read.target, catches, name: read.name, level, mode: d && isMode(d) ? d : "n", old: false };
}

/** Old links are written back in their old shape (class 5 without `l`); new ones carry `v=2` and a mode other than সাধারণ. */
export function sharedHash({ seed, tenths, catches, name, level, mode, old }: Shared) {
  const extra: Record<string, string | number> = { c: catches };
  if (old) { if (level !== CLASSIC) extra.l = level; }
  else { extra.l = level; extra.v = 2; if (mode !== "n") extra.d = mode; }
  return challengeHash({ seed, target: tenths, name, extra });
}

const who = (name: string) => cleanName(name) || "বন্ধু";
export const benchesOf = (shared: Pick<Shared, "level" | "old">) => shared.old ? OLD_BENCHES : BENCHES - roomOf(shared.level).from;
/** Where on the ladder, as a friend reads it. */
export const whereText = ({ level, old }: Pick<Shared, "level" | "old">) => old ? (level === CLASSIC ? "" : `ক্লাস ${bn(level)}-এ `) : `লেভেল ${bn(level)}-এ `;

export const previewTitle = (shared: Shared) =>
  `${cleanName(shared.name) || "এক বন্ধু"} ${whereText(shared)}${seconds(shared.tenths)} সেকেন্ডে চিরকুট শেষ বেঞ্চে পৌঁছে দিয়েছে। তুমি পারবে?`;
export const friendLine = (shared: Shared) => `${cleanName(shared.name) || "তোমার বন্ধু"} ${seconds(shared.tenths)} সেকেন্ডে চিরকুট শেষ বেঞ্চে পৌঁছে দিয়েছে। একই ক্লাস, এবার তোমার পালা।`;
/** Honest label: a real-time score can't be checked. */
export const friendClaim = ({ name }: Pick<Shared, "name">) => `${possessive(who(name))} নিজের ফোনের সময়`;

/** After a friend's class: kind either way, with the exact gap. */
export function compareLine(mine: number, friend: Pick<Shared, "tenths" | "name">) {
  const name = who(friend.name), gap = Math.abs(mine - friend.tenths);
  if (gap === 0) return `${possessive(name)} সাথে একদম সমান সমান।`;
  if (mine < friend.tenths) return `${possessive(name)} চেয়ে ${seconds(gap)} সেকেন্ড আগে।`;
  if (gap <= 30) return `আর একটু হলেই। ${name} মাত্র ${seconds(gap)} সেকেন্ড এগিয়ে।`;
  return `${name} এবার ${seconds(gap)} সেকেন্ড এগিয়ে। আরেকবার?`;
}

/** The levels a link names, for the card and the banner. */
export const levelName = ({ level, old }: Pick<Shared, "level" | "old">) => old ? "" : levelDef(level).name;
