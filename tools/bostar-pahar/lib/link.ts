// The challenge link. Server-safe: share.ts (and so /api/share and /api/tally) imports this, so it reaches only
// shared/game-core, shared/bangla and levels.ts, never React.
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { isMode, LEVEL_COUNT, LEVELS, OLD_COUNT, OLD_GHATS, oldStarsOf, starsOf, type Kind, type Mode } from "./levels";

export const SLUG = "bostar-pahar";
export const MAX_SACKS = 999;

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);
export const sacksLabel = (count: number) => `${bn(count)}টা বস্তা`;

/** What a link carries: the seed (the same swings), what was played, sacks stacked, "ঠিক মাঝে" drops, the longest run of them, and a name. */
export type Card = { seed: number; sacks: number; perfect: number; streak: number; name: string; level: number; kind: Kind; mode: Mode };

const COUNT = /^(0|[1-9]\d{0,2})$/;

/**
 * Reads `s`, `t` (sacks), `p` (perfect drops), `c` (longest streak), `l`, `v`, `d`, `k` and `n`. Counts must fit inside each other: c ≤ p ≤ t.
 * - no `v`: a link from before the rewrite. `l` is the old ghat (none is ghat 1); it replays the old rules.
 * - `v=2`: `l` is a level 1–12 (its `t` never past the goal), or `k=1` is খোলা ঘাট; `d=e|h` is the mode.
 */
export function parseCard(hash: string): Card | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SACKS, extraKeys: ["p", "c", "l", "v", "d", "k"] });
  if (!challenge) return null;
  const { p = "0", c = "0", l, v, d, k } = challenge.extra;
  if (!COUNT.test(p) || !COUNT.test(c)) return null;
  const perfect = Number(p), streak = Number(c), sacks = challenge.target;
  if (perfect > sacks || streak > perfect || (perfect > 0) !== (streak > 0)) return null;
  const base = { seed: challenge.seed, sacks, perfect, streak, name: challenge.name };
  if (v === undefined) {
    if (d !== undefined || k !== undefined) return null;
    const raw = l ?? "1", level = Number(raw);
    if (!/^[1-9]\d?$/.test(raw) || level > OLD_COUNT) return null;
    return { ...base, level, kind: "old", mode: "n" };
  }
  if (v !== "2") return null;
  const mode = d ?? "n";
  if (!isMode(mode) || d === "n") return null;
  if (k !== undefined) {
    if (k !== "1" || l !== undefined) return null;
    return { ...base, level: 1, kind: "endless", mode };
  }
  if (l === undefined || !/^[1-9]\d?$/.test(l) || Number(l) > LEVEL_COUNT) return null;
  const level = Number(l);
  if (sacks > LEVELS[level - 1].goal) return null;
  return { ...base, level, kind: "level", mode };
}

/** Old links write exactly the old format (ghat 1 leaves `l` out); new ones add `v=2`, `k=1` for খোলা ঘাট and `d` off সাধারণ. */
export function cardHash(card: Card) {
  const { seed, sacks, perfect, streak, name, level, kind, mode } = card;
  const counts = { p: perfect, c: streak };
  const extra = kind === "old" ? { ...counts, ...(level > 1 && { l: level }) }
    : { ...counts, ...(kind === "level" ? { l: level } : {}), v: 2, ...(kind === "endless" ? { k: 1 } : {}), ...(mode === "n" ? {} : { d: mode }) };
  return challengeHash({ seed, target: sacks, name, extra });
}

/** Stars a card shows: a level's by ঠিক মাঝে, an old ghat's by height as before, খোলা ঘাট none. */
export function cardStars(card: Card) {
  if (card.kind === "old") return oldStarsOf(card.level, card.sacks);
  if (card.kind === "endless") return 0;
  return starsOf(card.level, card.sacks >= LEVELS[card.level - 1].goal, card.perfect, card.mode);
}

/** "লেভেল ৪ · সন্ধ্যার লঞ্চ", "খোলা ঘাট", or the old "ঘাট ৩ · নারায়ণগঞ্জ". */
export function playLabel(card: Pick<Card, "kind" | "level">) {
  if (card.kind === "endless") return "খোলা ঘাট";
  if (card.kind === "old") return `ঘাট ${bn(card.level)} · ${OLD_GHATS[card.level - 1].name}`;
  return `লেভেল ${bn(card.level)} · ${LEVELS[card.level - 1].name}`;
}

const who = (name: string) => name || "বন্ধু";

/** What the friend did, in one line: a level filled (or how far they got), or a height. */
export function feat(card: Card) {
  if (card.kind !== "level") return `${sacksLabel(card.sacks)} সাজিয়েছে`;
  const def = LEVELS[card.level - 1];
  return card.sacks >= def.goal ? `${def.name} পার করেছে, ${bn(card.perfect)} বার ঠিক মাঝে` : `${def.name}-এ ${sacksLabel(card.sacks)} তুলেছে`;
}
export const friendLine = (card: Card) => `${card.name || "তোমার বন্ধু"} ${feat(card)}। একই দোল, এবার তোমার পালা।`;
export const friendClaim = (card: Card) => `${possessive(who(card.name))} নিজের ফোনের স্কোর`;
export const previewTitle = (card: Card) => `${card.name || "এক বন্ধু"} ${feat(card)}। তুমি পারবে?`;
export const caption = (card: Card) => card.kind === "level"
  ? `বস্তার পাহাড়ে ${playLabel(card)}: ${sacksLabel(card.sacks)}, ${bn(card.perfect)} বার ঠিক মাঝে। একই দোলে তুমি পারবে?`
  : `বস্তার পাহাড়ে ${sacksLabel(card.sacks)} সাজালাম! একই দোলে তুমি কয়টা পারো?`;

/** Kind comparison after playing a friend's swings: by sacks, and on a level both filled, by ঠিক মাঝে. */
export function versusLine(mine: Pick<Card, "sacks" | "perfect">, theirs: Card) {
  const name = who(theirs.name), both = theirs.kind === "level" && mine.sacks === theirs.sacks;
  const [a, b] = both ? [mine.perfect, theirs.perfect] : [mine.sacks, theirs.sacks];
  const unit = (count: number) => both ? `${bn(count)} বার ঠিক মাঝে` : sacksLabel(count);
  const diff = Math.abs(a - b);
  if (a > b) return `${possessive(name)} চেয়ে ${unit(diff)} বেশি।`;
  if (a === b) return `সমান সমান। দুজনেরই ${unit(a)}।`;
  if (diff <= 2) return `আর একটু হলেই। ${possessive(name)} চেয়ে মাত্র ${bn(diff)}টা কম।`;
  return `${name} এগিয়ে, ${unit(diff)}। আরেকবার দেখো।`;
}
