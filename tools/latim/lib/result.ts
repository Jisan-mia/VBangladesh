// Words, score bands and the challenge link. Server-safe: share.ts imports this, so it uses game-core, never React or game-kit.
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { BADGE_IDS, BONUS, LEVEL_COUNT, LEVELS, SURFACES, badgesOf, starsOf, type Badge } from "./game";

/** The longest score a link may carry, in tenths (99.9 s). */
export const MAX_SCORE = 999;

const whole = new Intl.NumberFormat("bn-BD", { useGrouping: false });
const tenth = new Intl.NumberFormat("bn-BD", { useGrouping: false, minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const bn = (value: number) => whole.format(value);
/** Tenths of a second as "১২.৪". */
export const secs = (tenths: number) => tenth.format(Math.floor(tenths) / 10);

export type Card = { seed: number; level: number; score: number; palm: boolean; badges: Badge[]; name: string };

/**
 * Reads a challenge link: `s` seed, `t` score in tenths, `l` stage, `p` 1 for the palm trick, `b` badges, `n` name.
 * Time badges must match the time, and the palm badge must match `p`, so a card never shows a milestone its own number contradicts.
 */
export function parseCard(hash: string): Card | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SCORE, extraKeys: ["l", "p", "b"] });
  if (!challenge) return null;
  const rawLevel = challenge.extra.l ?? "1", rawPalm = challenge.extra.p ?? "0";
  if (!/^[1-9]$/.test(rawLevel) || Number(rawLevel) > LEVEL_COUNT || !/^[01]$/.test(rawPalm)) return null;
  const palm = rawPalm === "1", spun = challenge.target - (palm ? BONUS : 0);
  if (spun < 0) return null;
  const tokens = challenge.extra.b ? challenge.extra.b.split("-") : [];
  if (tokens.some(token => !(BADGE_IDS as string[]).includes(token)) || new Set(tokens).size !== tokens.length) return null;
  const badges = BADGE_IDS.filter(id => tokens.includes(id));
  const expected = badgesOf(spun, palm, 0, 1);
  for (const id of ["t10", "t20", "t30", "palm"] as const) if (badges.includes(id) !== expected.includes(id)) return null;
  return { seed: challenge.seed, level: Number(rawLevel), score: challenge.target, palm, badges, name: challenge.name };
}

export const cardHash = (card: Card) => challengeHash({
  seed: card.seed, target: card.score, name: card.name,
  extra: { l: card.level, ...(card.palm && { p: 1 }), ...(card.badges.length && { b: card.badges.join("-") }) },
});

const ground = (level: number) => ({ mati: "উঠান", mejhe: "মেঝে", tin: "চাল" })[LEVELS[level - 1].surface];
export const stageLabel = (level: number) => `${SURFACES[LEVELS[level - 1].surface]} · ${LEVELS[level - 1].name}`;

export type Band = "short" | "warm" | "good" | "great" | "master";
export function bandOf(tenths: number): Band {
  if (tenths < 60) return "short";
  if (tenths < 120) return "warm";
  if (tenths < 180) return "good";
  if (tenths < 250) return "great";
  return "master";
}
const lines: Record<Band, string> = {
  short: "ঘুরল, তবে তাড়াতাড়ি শুয়ে পড়ল। এবার আরেকটু জোরে টানো।",
  warm: "ভালোই ঘুরল। টলতে দেখলেই টোকা দিও।",
  good: "এতক্ষণ ঘুরলে পাশের বাসার ছেলেটাও দাঁড়িয়ে দেখে।",
  great: "ঘোরা দেখতে উঠানে ছোটখাটো ভিড় জমে গেছে।",
  master: "আধা মিনিটের কাছাকাছি। এমন হাত পাড়ায় একজনেরই থাকে।",
};
export const humanLine = (tenths: number) => lines[bandOf(tenths)];

/** After a stage: cleared or not, and with how many stars. */
export function stageLine(tenths: number, level: number) {
  const stars = starsOf(tenths, level), need = LEVELS[level - 1].stars[0] * 10;
  if (!stars) return `${bn(need / 10)} সেকেন্ড ঘুরলে এই লেভেল পার। আর ${secs(need - tenths)} সেকেন্ড লাগত।`;
  return stars === 3 ? `${LEVELS[level - 1].name} পার, পুরো ৩ তারা।` : `${LEVELS[level - 1].name} পার, ${bn(stars)} তারা।`;
}

/** Why it stopped, said plainly. */
export const fallLine = (fall: "wobble" | "slow" | "drop" | null, palm: boolean) =>
  palm ? "ঘুরন্ত লাটিম হাতের তালুতে উঠে এল!" : fall === "drop" ? "হাতে তুলতে গিয়ে ফসকে গেল। টলমল কম থাকলে তুলো।"
    : fall === "wobble" ? "টলতে টলতে কাত হয়ে পড়ল।" : "ঘুরতে ঘুরতে থেমে গেল।";

const who = (name: string) => name || "বন্ধু";

/** Kind comparison after playing a friend's stage. */
export function versusLine(mine: number, theirs: number, name: string) {
  const gap = Math.abs(mine - theirs);
  if (mine > theirs) return `${possessive(who(name))} চেয়ে ${secs(gap)} সেকেন্ড বেশি!`;
  if (mine === theirs) return `সমান সমান! দুজনেরই ${secs(mine)} সেকেন্ড।`;
  if (gap <= 20) return `আর একটু হলেই! ${possessive(who(name))} চেয়ে মাত্র ${secs(gap)} সেকেন্ড কম।`;
  return `${who(name)} এগিয়ে, ${secs(gap)} সেকেন্ড। আরেকবার ছোড়ো!`;
}

export const friendBanner = (card: Card) => `${possessive(card.name || "তোমার বন্ধু")} লাটিম ${secs(card.score)} সেকেন্ড ঘুরেছে। একই ${ground(card.level)}, এবার তোমার পালা।`;
export const friendNote = (card: Card) => `${possessive(who(card.name))} নিজের ফোনের স্কোর · ${stageLabel(card.level)}`;
export const previewTitle = (card: Card) => `${possessive(card.name || "এক বন্ধু")} লাটিম ${secs(card.score)} সেকেন্ড ঘুরেছে। তুমি পারবে?`;
export const caption = (card: Card) => `আমার লাটিম ${secs(card.score)} সেকেন্ড ঘুরল, ${({ mati: "মাটির উঠানে", mejhe: "পাকা মেঝেতে", tin: "টিনের চালে" })[LEVELS[card.level - 1].surface]}। তোমারটা কতক্ষণ ঘুরবে?`;
