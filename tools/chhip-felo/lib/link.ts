// Challenge links and every line of result text. Server-safe: share.ts loads this, so it reaches only game-core and the rules.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { FISH, MAX_GRAMS, PLACES } from "./fish";
import { fishToNext, isLevel, placeOf, specOf, starsOf, LEVEL_COUNT, type Miss } from "./game";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** A finished trip as the player reports it. The water is rebuilt from seed and level; the weight is their phone's count. */
export type Shared = { level: number; seed: number; grams: number; catches: number; big: number; name: string };

/** `#s=<seed>&t=<grams>&l=<level>&c=<fish caught>&b=<biggest fish, if any>&n=<name>`. Anything else is refused. */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_GRAMS * 6, extraKeys: ["l", "c", "b"] });
  if (!read) return null;
  const { l = "", c = "", b = "" } = read.extra;
  if (!/^[1-9]\d?$/.test(l) || !/^\d$/.test(c) || !/^(|0|[1-9]\d?)$/.test(b)) return null;
  const level = Number(l), catches = Number(c), grams = read.target;
  if (!isLevel(level) || catches > specOf(level).casts) return null;
  if (!catches) return grams === 0 && b === "" ? { level, seed: read.seed, grams: 0, catches: 0, big: -1, name: read.name } : null;
  const big = Number(b);
  if (b === "" || big >= FISH.length || !FISH[big].places.includes(placeOf(level))) return null;
  // Plausible weights only: at least the lightest fish each, at most the biggest one's top weight each.
  if (grams < catches * 20 || grams > catches * FISH[big].grams[1]) return null;
  return { level, seed: read.seed, grams, catches, big, name: read.name };
}

export function sharedHash({ level, seed, grams, catches, big, name }: Shared) {
  return challengeHash({ seed, target: grams, name, extra: { l: level, c: catches, ...(catches ? { b: big } : {}) } });
}

/** "৮৫০ গ্রাম", "১ কেজি ২৪০ গ্রাম", "২ কেজি" */
export function weightText(grams: number) {
  const g = Math.max(0, Math.round(grams)), kilos = Math.floor(g / 1000), rest = g % 1000;
  if (!kilos) return `${bn(rest)} গ্রাম`;
  return rest ? `${bn(kilos)} কেজি ${bn(rest)} গ্রাম` : `${bn(kilos)} কেজি`;
}

export const placeName = (level: number) => PLACES[placeOf(level)].name;
export const levelLabel = (level: number) => `লেভেল ${bn(level)} · ${placeName(level)}`;
export const castsLabel = (level: number, catches: number) => `${bn(specOf(level).casts)} বার ছিপ ফেলে ${bn(catches)}টা মাছ`;

const CLEAR_LINES = [
  ["পুকুরঘাটে বিকেলের রোদ। ঝুড়িতে মাছ লাফাচ্ছে।", "আম্মু বলেছে, আজ রাতে মাছ ভাজা।", "পাশের বাড়ির চাচা পাড় থেকে উঁকি দিলেন।", "ঘাটের সিঁড়িতে বসে একটু জিরিয়ে নাও।"],
  ["শাপলার ফাঁক দিয়ে ফাতনাটা ঠিকই চোখে পড়ছিল।", "বিলের ধারে একটা বক দাঁড়িয়ে। আজ ওর ঠোঁট খালি।", "ঝুড়িটা নৌকার গলুইয়ে রেখে দাও।", "কচুরিপানার নিচেও মাছ থাকে, আজ জানা হলো।"],
  ["খেয়ানৌকার মাঝি ঝুড়িতে উঁকি দিলেন।", "স্রোতের মধ্যেও ফাতনা থেকে চোখ সরাওনি।", "সন্ধ্যার আগে ঘাটে ফিরছ, ঝুড়ি ভারী।"],
] as const;

/** The level-clear line: one small scene by the water. A place's last level and the very last one get their own. */
export function clearLine(level: number) {
  if (level === LEVEL_COUNT) return "নদীর শেষ ঘাটেও ঝুড়ি ভরল। ১৫টা লেভেল শেষ।";
  const place = placeOf(level);
  if (level < LEVEL_COUNT && placeOf(level + 1) !== place) return `${PLACES[place].long} সব লেভেল শেষ। এবার ${PLACES[place + 1].of} দিকে।`;
  const lines = CLEAR_LINES[place];
  return lines[(level - 1) % lines.length];
}

/** Why a fish got away: what happened, then what to do next time. */
export const MISS_LINES: Record<Miss, string> = {
  early: "ফাতনা ডোবার আগেই টান দিলে। মাছ টের পেয়ে সরে গেল।",
  nibble: "ওটা ছিল ঠোকর। ফাতনা পুরো ডুবলে টান দিয়ো।",
  late: "ফাতনা ডুবেছিল, টান দিতে দেরি হলো। টোপ খেয়ে পালাল।",
  snap: "বেশি টান, সুতো ছিঁড়ে গেল! দাগ লালে গেলে আঙুল ছাড়ো।",
  slip: "সুতো ঢিলা পেয়ে মাছ ছুটে গেল। দাগটা সবুজে রাখো।",
};
export const HUSH_LINE = "এখনো না। ফাতনা পুরো ডুবলে চাপো।";

/** "আর ১টা মাছ হলে ৩ তারা।" or, short of clearing, "আর ১টা মাছ হলেই লেভেল পার।" Empty at three stars. */
export function nearMissLine(level: number, catches: number) {
  const next = fishToNext(catches, specOf(level));
  if (!next) return "";
  if (starsOf(catches, specOf(level)) === 0) return `আর ${bn(next.fish)}টা মাছ হলেই লেভেল পার।`;
  return `আর ${bn(next.fish)}টা মাছ হলে ${bn(next.goal)} তারা।`;
}

/** The line on the card, seen by friends: first person, one image. A rare fish gets the line to itself. */
export function humanLine({ level, catches, big }: Pick<Shared, "level" | "catches" | "big">) {
  if (!catches) return "আজ মাছেরা ছুটিতে। ফাতনাটা অবশ্য খুব সুন্দর দুলছিল।";
  if (FISH[big]?.rarity === 2) return `ছিপে ${FISH[big].name} উঠেছে। পাড়ে লোক জমে গেছে।`;
  const stars = starsOf(catches, specOf(level));
  if (stars === 3) return "একটা টোপও নষ্ট হয়নি।";
  if (stars === 2) return "একটা ফসকেছে, বাকিগুলো ঝুড়িতে।";
  return "ঝুড়ি পুরো ভরেনি, তবু আজ রাতে মাছ-ভাত।";
}

/** "রাফি লেভেল ৫-এ ছিপ ফেলে ১ কেজি ২৪০ গ্রাম মাছ তুলেছে" */
export function feat({ level, grams, name }: Pick<Shared, "level" | "grams" | "name">) {
  return `${cleanName(name) || "এক বন্ধু"} লেভেল ${bn(level)}-এ ছিপ ফেলে ${weightText(grams)} মাছ তুলেছে`;
}
export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

export function bannerNote({ name }: Pick<Shared, "name">) {
  const who = cleanName(name) || "বন্ধু";
  return `ওজনটা ${possessive(who)} নিজের ফোনের হিসাব। একই ঘাট, বুদবুদও একই জায়গায়। এবার তোমার পালা।`;
}

/** After a friend's trip: more fish by weight is better. Kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু";
  if (mine > theirs) return `${possessive(who)} চেয়ে ${weightText(mine - theirs)} বেশি!`;
  if (mine === theirs) return `একদম সমান! ${who}ও ${weightText(theirs)} তুলেছিল।`;
  if (theirs - mine <= Math.max(200, theirs * 0.15)) return `আর একটু হলেই! মাত্র ${weightText(theirs - mine)} কম।`;
  return `${who} এখনো ${weightText(theirs - mine)} এগিয়ে। আরেকবার?`;
}

export function caption({ level, grams, catches, big }: Pick<Shared, "level" | "grams" | "catches" | "big">) {
  if (!catches) return `ছিপ ফেলোর লেভেল ${bn(level)}-এ আজ একটা মাছও উঠল না। তুমি কয়টা তুলবে?`;
  return `ছিপ ফেলোর লেভেল ${bn(level)}, ${PLACES[placeOf(level)].at} ${bn(catches)}টা মাছ, মোট ${weightText(grams)}। সবচেয়ে বড়টা ${FISH[big].name}। তুমি কত তুলবে?`;
}
