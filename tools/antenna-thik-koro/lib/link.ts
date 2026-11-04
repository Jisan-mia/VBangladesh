// Server-safe: share.ts (and so /api/share and /api/tally) imports this, so it reaches only shared/game-core and levels.ts, never React.
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { isMode, LEVEL_COUNT, levelDef, type Mode } from "./levels";

/** Seconds the antenna must stay in the sweet spot before the picture locks (normal mode). */
export const DWELL = 0.45;
/** Score is tenths of a second. Five dwells alone take 2.25 s; no real evening is faster, so a faster link is forged. */
export const MIN_TENTHS = 23;
export const MAX_TENTHS = 6000;

const numbers = new Intl.NumberFormat("bn-BD");
const decimal = new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const bn = (value: number) => numbers.format(value);
/** 473 → "৪৭.৩" */
export const seconds = (tenths: number) => decimal.format(tenths / 10);

/** `old`: a link from before v=2, which replays the old level table. */
export type Shared = { seed: number; tenths: number; name: string; level: number; mode: Mode; old: boolean };

/**
 * A friend's link `#s=<seed>&t=<tenths>&l=<level>&v=2&d=<mode>&n=<name>`: the seed, level and mode replay the same channels;
 * the time is their own phone's claim. Links without `v` were made before the rewrite and replay the old levels
 * (no `l` at all is the original one-level game, old level 1).
 */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_TENTHS, extraKeys: ["l", "v", "d"] });
  if (!challenge || challenge.target < MIN_TENTHS) return null;
  const raw = challenge.extra.l ?? "1", level = Number(raw);
  if (!/^[1-9]\d?$/.test(raw) || level > LEVEL_COUNT) return null;
  const version = challenge.extra.v, mode = challenge.extra.d ?? "n";
  if (version !== undefined && version !== "2") return null;
  if (!isMode(mode) || (mode !== "n" && version !== "2")) return null;
  return { seed: challenge.seed, tenths: challenge.target, name: challenge.name, level, mode, old: version !== "2" };
}

/** Old links write exactly the old format (level 1 leaves `l` out); new ones add `v=2` and, off normal, `d`. */
export const sharedHash = ({ seed, tenths, name, level, mode, old }: Shared) => challengeHash({
  seed, target: tenths, name,
  extra: old ? (level > 1 ? { l: level } : {}) : { l: level, v: 2, ...(mode === "n" ? {} : { d: mode }) },
});

export const channelsOf = ({ level, old }: Pick<Shared, "level" | "old">) => levelDef(level, old).channels;
export const previewTitle = (shared: Shared) => `${shared.name || "এক বন্ধু"} ${seconds(shared.tenths)} সেকেন্ডে ${bn(channelsOf(shared))}টা চ্যানেলের ছবি এনেছে। তুমি পারবে?`;
