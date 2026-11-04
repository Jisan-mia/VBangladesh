// Challenge links and the words around a result. Server-safe: share.ts imports this, so it uses game-core, never React.
// New links carry `s t w c m n` (seed, points, flight, candies, landing). Old links from the cloud-popping game (`s t l c r h n`)
// still parse: they are checked against the old sky, bit for bit (legacy.ts), and open the nearest new flight.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { makeCourse } from "./course";
import { LEVEL_COUNT, isFinale, levelOf } from "./levels";
import { LEGACY_COUNT, SUN_POINTS, legacyStars, makeLegacyWave } from "./legacy";
import { scoreOf, starsFor } from "./physics";

const whole = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => whole.format(value);

/** A finished flight on a link: points, candies, and how it ended (0 never landed, 1 landed, 2 on the bullseye). */
export type Flight = { kind: "flight"; seed: number; level: number; score: number; candies: number; landing: number; name: string };
/** A card from the old game: its wave, points, clouds popped, রোদ caught and times wet. */
export type OldCard = { kind: "old"; seed: number; wave: number; score: number; popped: number; suns: number; hits: number; name: string };
export type Shared = Flight | OldCard;
export const MAX_SCORE = 9999;

/** The new flight an old link opens: the same place in the ladder (old wave 1..20 → flight 1..12). */
export const flightOfWave = (wave: number) => Math.max(1, Math.min(LEVEL_COUNT, Math.ceil((wave * LEVEL_COUNT) / LEGACY_COUNT)));
export const levelOfShared = (shared: Shared) => (shared.kind === "flight" ? shared.level : flightOfWave(shared.wave));

export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SCORE, extraKeys: ["w", "c", "m", "l", "r", "h"] });
  if (!challenge) return null;
  const { seed, target: score, name } = challenge, extra = challenge.extra;
  if (extra.w !== undefined) {
    const { w, c = "", m = "" } = extra;
    if (!/^[1-9]\d?$/.test(w) || Number(w) > LEVEL_COUNT || !/^(0|[1-9]\d?)$/.test(c) || !/^[012]$/.test(m)) return null;
    const level = Number(w), candies = Number(c), landing = Number(m), course = makeCourse(seed, level);
    if (candies > course.candyCount) return null;
    // The points must be exactly what those candies, that landing and some distance make.
    const meters = score - scoreOf(candies, 0, landing);
    if (meters < 0 || meters > course.meters || (landing > 0 && meters !== course.meters)) return null;
    return { kind: "flight", seed, level, score, candies, landing, name };
  }
  const { l = "", c = "0", r = "0", h = "0" } = extra;
  if (!/^[1-9]\d?$/.test(l) || Number(l) > LEGACY_COUNT || !/^(0|[1-9]\d?)$/.test(c) || !/^(0|[1-9]\d?)$/.test(r) || !/^[0-3]$/.test(h)) return null;
  const wave = Number(l), popped = Number(c), suns = Number(r), hits = Number(h), sky = makeLegacyWave(seed, wave);
  if (popped > sky.total || suns > sky.suns || score > sky.maxScore || score < suns * SUN_POINTS) return null;
  return { kind: "old", seed, wave, score, popped, suns, hits, name };
}

export const sharedHash = (shared: Shared) => shared.kind === "flight"
  ? challengeHash({ seed: shared.seed, target: shared.score, name: shared.name, extra: { w: shared.level, c: shared.candies, m: shared.landing } })
  : challengeHash({ seed: shared.seed, target: shared.score, name: shared.name, extra: { l: shared.wave, c: shared.popped, r: shared.suns, h: shared.hits } });

export const sharedStars = (shared: Shared) => shared.kind === "flight"
  ? starsFor(shared.landing, shared.candies, makeCourse(shared.seed, shared.level).goal)
  : legacyStars(makeLegacyWave(shared.seed, shared.wave), shared.popped, shared.hits);

/** "লেভেল ৬ · কাটা ঘুড়ি" */
export const levelLabel = (level: number) => `লেভেল ${bn(level)} · ${levelOf(level).name}`;

const who = (name: string) => name || "বন্ধু";
const whose = (name: string) => (name ? possessive(name) : "বন্ধুর");

/** The preview title on Facebook. Old links keep their old words, so an old preview stays the same. */
export function previewTitle(shared: Shared) {
  if (shared.kind === "old") return `${shared.name || "এক বন্ধু"} কাগজের প্লেনে ${bn(shared.score)} পয়েন্ট করেছে। তুমি পারবে?`;
  const where = `‘${levelOf(shared.level).name}’`;
  if (!shared.landing) return `${shared.name || "এক বন্ধু"} কাগজের প্লেনে ${where} উড়ানে ${bn(shared.score)} পয়েন্ট করেছে। তুমি নামাতে পারবে?`;
  return `${shared.name || "এক বন্ধু"} কাগজের প্লেন নামাল ${where} উড়ানে, ${bn(shared.candies)}টা লজেন্স, ${bn(shared.score)} পয়েন্ট। তুমি পারবে?`;
}

export function caption(shared: Flight) {
  const how = shared.landing === 2 ? "ঠিক মাঝখানে নামিয়েছি" : shared.landing ? "নামিয়েছি" : "নামাতে পারিনি";
  return `কাগজের প্লেনে ‘${levelOf(shared.level).name}’ উড়ানে ${bn(shared.candies)}টা লজেন্স, ${bn(shared.score)} পয়েন্ট, ${how}। একই উড়ানে তুমি কতদূর?`;
}

/** The banner on a friend's link. */
export function friendLine(shared: Shared) {
  if (shared.kind === "old") return `${shared.name || "তোমার বন্ধু"} আগের কাগজের প্লেনে লেভেল ${bn(shared.wave)}-এ ${bn(shared.score)} পয়েন্ট করেছিল। এবার নতুন উড়ানে তোমার পালা।`;
  return `${shared.name || "তোমার বন্ধু"} ${bn(shared.score)} পয়েন্ট করেছে। একই উড়ান, একই লজেন্স, এবার তোমার পালা।`;
}
/** Real-time scores are each phone's own claim. */
export const friendNote = (shared: Shared) => `স্কোরটা ${whose(shared.name)} নিজের ফোনের, আমরা যাচাই করি না।`;

/** After a friend's flight: kind, exact, never a scold. */
export function compareLine(mine: number, theirs: number, name: string) {
  if (mine > theirs) return `${whose(name)} চেয়ে ${bn(mine - theirs)} পয়েন্ট বেশি।`;
  if (mine === theirs) return `${who(name)} আর তুমি একদম সমান সমান।`;
  if (theirs - mine <= Math.max(20, theirs * 0.15)) return `আর একটু হলেই! ${whose(name)} চেয়ে মাত্র ${bn(theirs - mine)} কম।`;
  return `${who(name)} এবার ${bn(theirs - mine)} পয়েন্ট এগিয়ে। একই উড়ানে আরেকবার?`;
}

export type Outcome = { landing: number; candies: number; total: number; goal: number; meters: number; full: number; crashes: number; level: number };

/** One dry line about this flight, from what happened in it. */
export function resultLine(r: Outcome) {
  if (!r.landing) return `${bn(r.full)} মিটারের মধ্যে ${bn(r.meters)} মিটার। পাতা ফুরিয়ে গেল।`;
  if (r.landing === 2 && r.candies === r.total) return `সব লজেন্স, ঠিক মাঝখানে। ${isFinale(r.level) ? "পুরো ক্লাস তাকিয়ে আছে।" : "স্যার টেরও পাননি।"}`;
  if (r.landing === 2) return "ঠিক মাঝখানে নামল, যেন মেপে রাখা জায়গা।";
  if (!r.crashes && r.candies >= r.goal) return "একটা পাতাতেই পুরো উড়ান। লজেন্সও পকেটে।";
  if (r.candies >= r.goal) return "লজেন্স পকেটে। এবার মাঝখানটা বাকি।";
  return "নামল ঠিকই, পকেটে আরও লজেন্সের জায়গা ছিল।";
}

/** What one more try would change, with the exact number; "" when there's nothing close to chase. */
export function nearMiss(r: Outcome & { bullMiss: number }) {
  if (!r.landing) return r.full - r.meters <= 15 ? `আর ${bn(r.full - r.meters)} মিটার গেলেই নামার জায়গা।` : "";
  if (r.candies < r.goal) return `আর ${bn(r.goal - r.candies)}টা লজেন্স হলেই আরেকটা তারা।`;
  if (r.landing === 1 && r.bullMiss > 0 && r.bullMiss <= 60) return `মাঝখানের দাগ থেকে মাত্র ${bn(Math.max(1, Math.ceil(r.bullMiss / 11)))} বিঘত দূরে নামল।`;
  return "";
}

export { cleanName };
