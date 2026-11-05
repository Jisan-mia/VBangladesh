// Every line of words around a trip: weights, why a fish got away, the end screen, the card, a friend's claim.
// Server-safe (share.ts reads the preview title from here).
import { possessive } from "../../../shared/bangla";
import { cleanName } from "../../../shared/game-core";
import type { Shared } from "./challenge";
import { bossOf, levelDef, MODE_INFO, starsOf, WORLDS, type Mode } from "./levels";
import { BOSSES, FISH, WATERS } from "./species";
import { MISS } from "./trip";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);
const decimal = new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false });
/** 2.34 → "২.৩" */
export const secondsText = (value: number) => decimal.format(Math.round(value * 10) / 10);

/** "৮৫০ গ্রাম", "১ কেজি ২৪০ গ্রাম", "২ কেজি" */
export function weightText(grams: number) {
  const g = Math.max(0, Math.round(grams)), kilos = Math.floor(g / 1000), rest = g % 1000;
  if (!kilos) return `${bn(rest)} গ্রাম`;
  return rest ? `${bn(kilos)} কেজি ${bn(rest)} গ্রাম` : `${bn(kilos)} কেজি`;
}

export const waterName = (level: number) => WATERS[WORLDS[levelDef(level).world].water].name;
export const levelLabel = (level: number) => `লেভেল ${bn(level)} · ${levelDef(level).title}`;

/** Why a fish got away: what happened, then what to do next time. */
export const MISS_LINES: Record<number, string> = {
  [MISS.EARLY]: "ফাতনা ডোবার আগেই টান দিলে। মাছ টের পেয়ে সরে গেল।",
  [MISS.NIBBLE]: "ওটা ছিল ঠোকর। ফাতনা পুরো ডুবলে টান দিয়ো।",
  [MISS.LATE]: "ফাতনা ডুবেছিল, টান দিতে দেরি হলো। টোপ খেয়ে পালাল।",
  [MISS.SNAP]: "বেশি টান, সুতো ছিঁড়ে গেল। কিনারা লাল হলেই আঙুল তোলো।",
  [MISS.SLIP]: "সুতো ঢিলা পেয়ে মাছ ছুটে গেল। কাঁটা সবুজে রাখো।",
  [MISS.SNAG]: "টোপ শাপলা পাতায় আটকে গেল। ফাঁকা পানিতে ফেলো।",
  [MISS.LEAP]: "লাফের সময় সুতো টানটান ছিল, ছিঁড়ে গেল। ছায়া উঠলে ঢিল দাও।",
  [MISS.TEAR]: "নরম মুখ ছিঁড়ে মাছ পালাল। লালের অনেক আগেই ঢিল দাও।",
};
export const HUSH_LINE = "এখনো না। ফাতনা পুরো ডুবলে চাপো।";
export const SHORT_LINE = "আঙুল একটু চেপে ধরে রাখো, তারপর ছাড়ো।";
export const bossAway = (level: number) => `${bossOf(levelDef(level))?.name ?? "মাছটা"} ছুটে গেল, তবে দম কমেছে। আবার আসবে।`;

/** What the line under the pond says in each moment of a cast. */
export const PHASE_LINES = {
  aim: "আঙুল চেপে ধরো। বৃত্তটা বুদবুদে এলে ছেড়ে দাও।",
  charging: "বুদবুদের ওপর এলেই ছাড়ো।",
  wait: "ফাতনায় চোখ রাখো। পুরো ডুবলেই চাপো।",
  under: "ডুবেছে! এখনই চাপো।",
  reel: "চেপে ধরলে গোটাবে, তুললে ঢিল। কাঁটা সবুজে রাখো।",
} as const;

/** The line on the card and the end screen, seen by friends: first person, one image. */
export function humanLine({ level, catches, big, won, lost, boss, mode }: Pick<Shared, "level" | "catches" | "big" | "won" | "lost" | "boss" | "mode">) {
  if (!won) return catches ? `ঝুড়িতে ${bn(catches)}টা মাছ। টোপ ফুরিয়ে গেল।` : "আজ মাছেরা ছুটিতে। ফাতনাটা অবশ্য খুব সুন্দর দুলছিল।";
  const def = levelDef(level);
  if (boss && def.boss >= 0) return BOSS_LINES[def.boss];
  if (FISH[big]?.rarity === 2) return `ছিপে ${FISH[big].name} উঠেছে। পাড়ে লোক জমে গেছে।`;
  const stars = starsOf(true, lost, mode);
  if (stars === 3) return "একটা টোপও নষ্ট হয়নি।";
  if (stars === 2) return "একটা টোপ গেছে, বাকিগুলো ঝুড়িতে।";
  return "টোপ লেগেছে অনেক, তবু আজ রাতে মাছ-ভাত।";
}
const BOSS_LINES = [
  "বুড়ো রুই উঠেছে। নানা ঘাটে দাঁড়িয়ে অনেকক্ষণ চুপ করে রইলেন।",
  "রাক্ষুসে বোয়াল উঠেছে। ডিঙিটা একটু কাত হয়ে গিয়েছিল।",
  "কুঁজো চিতল উঠেছে। ঘাটের মাঝিরা বৈঠা নামিয়ে দেখলেন।",
  "হাওরের রাজা আইড় উঠেছে। গোঁফ অবশ্য দুই হাত না, দেড় হাত।",
] as const;

/** Short of three stars, or of clearing: exactly what would have done it. Empty at the best the mode allows. */
export function nearLine(level: number, won: boolean, catches: number, lost: number, mode: Mode) {
  const def = levelDef(level), stars = starsOf(won, lost, mode), cap = MODE_INFO[mode].maxStars;
  if (!won) return `আর ${bn(def.need - catches)}টা মাছ হলেই পার।`;
  if (stars === cap && cap < 3) return "সহজে বড়জোর ২ তারা। ৩ তারা পেতে স্বাভাবিকে খেলো।";
  if (stars === 3) return "";
  return lost === 1 ? "একটাও টোপ না হারালে ৩ তারা।" : `আর ${bn(lost - 1)}টা টোপ কম হারালে ২ তারা।`;
}

/** "রাফি লেভেল ৫-এ ছিপ ফেলে ১ কেজি ২৪০ গ্রাম মাছ তুলেছে" */
export function feat({ level, grams, name, boss }: Pick<Shared, "level" | "grams" | "name" | "boss">) {
  const who = cleanName(name) || "এক বন্ধু", def = levelDef(level);
  if (boss && def.boss >= 0) return `${who} ছিপে ${BOSSES[def.boss].name} তুলেছে, ঝুড়িতে ${weightText(grams)}`;
  return `${who} লেভেল ${bn(level)}-এ ছিপ ফেলে ${weightText(grams)} মাছ তুলেছে`;
}
export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

/** The friend's line over the title: their weight is their own phone's count, the water is the same. */
export function friendClaim({ name, old }: Pick<Shared, "name" | "old">) {
  const who = cleanName(name) || "বন্ধু";
  if (old) return `ওজনটা ${possessive(who)} পুরোনো খেলার হিসাব। একই ঘাট, বুদবুদও একই জায়গায়।`;
  return `ওজনটা ${possessive(who)} নিজের ফোনের হিসাব। একই ঘাট, বুদবুদও একই জায়গায়। এবার তোমার পালা।`;
}

/** After a friend's trip on the same water: more fish by weight is better. Kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু";
  if (mine > theirs) return `${possessive(who)} চেয়ে ${weightText(mine - theirs)} বেশি!`;
  if (mine === theirs) return `একদম সমান! ${who}ও ${weightText(theirs)} তুলেছিল।`;
  if (theirs - mine <= Math.max(200, theirs * 0.15)) return `আর একটু হলেই! মাত্র ${weightText(theirs - mine)} কম।`;
  return `${who} এখনো ${weightText(theirs - mine)} এগিয়ে। আরেকবার?`;
}

export function caption({ level, grams, catches, big, boss }: Pick<Shared, "level" | "grams" | "catches" | "big" | "boss">) {
  const def = levelDef(level), water = WATERS[WORLDS[def.world].water];
  if (!catches) return `ছিপ ফেলোর লেভেল ${bn(level)}-এ আজ একটা মাছও উঠল না। তুমি কয়টা তুলবে?`;
  if (boss && def.boss >= 0) return `ছিপ ফেলোয় ${water.at} ${BOSSES[def.boss].name} তুললাম, ঝুড়িতে মোট ${weightText(grams)}। তুমি পারবে?`;
  return `ছিপ ফেলোর লেভেল ${bn(level)}, ${water.at} ${bn(catches)}টা মাছ, মোট ${weightText(grams)}। সবচেয়ে বড়টা ${FISH[big].name}। তুমি কত তুলবে?`;
}

/** The world's place in words, for the end screen's kicker. */
export const worldName = (level: number) => WORLDS[levelDef(level).world].name;
