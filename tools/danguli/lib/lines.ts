// Every line of words the game says: calls under the field, the end screen, the friend's banner, the card and the caption.
// Server-safe (share.ts reads the preview title through here). Copy says "কাঠি" for the small stick, never "গুলি" alone.
import { possessive } from "../../../shared/bangla";
import { cleanName } from "../../../shared/game-core";
import type { Shared } from "./challenge";
import { levelDef, WORLDS } from "./levels";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);
export const ordinal = (index: number) => ["১ম", "২য়", "৩য়"][index] ?? bn(index + 1);
export const levelLabel = (level: number) => `${WORLDS[levelDef(level).world].name} · লেভেল ${bn(level)}`;
const who = (name: string) => cleanName(name) || "বন্ধু";

/** A hit as the HUD and the card show it. */
export const hitLabel = (token: string) => token === "c" ? "ক্যাচ" : token === "m" ? "ফসকে" : `${bn(Number(token))} ডাং`;

// ---- the friend's link ----
export const feat = (shared: Pick<Shared, "level" | "total" | "name">) =>
  `${cleanName(shared.name) || "এক বন্ধু"} ${levelDef(shared.level).rival.obj} হারাতে তিন মারে ${bn(shared.total)} ডাং মেরেছে`;
export const previewTitle = (shared: Shared) => `${cleanName(shared.name) || "এক বন্ধু"} ডাংগুলিতে ${bn(shared.total)} ডাং মেরেছে। তুমি পারবে?`;
export const bannerNote = (name: string) => `এটা ${possessive(who(name))} নিজের ফোনের স্কোর। একই মাঠ, একই বাতাস, এবার তোমার পালা।`;

/** After a friend's field: more ডাং is better. Kind either way. */
export function versusLine(mine: number, theirs: number, name: string) {
  const friend = who(name), diff = Math.abs(mine - theirs);
  if (mine > theirs) return `${possessive(friend)} চেয়ে ${bn(diff)} ডাং বেশি।`;
  if (mine === theirs) return `সমান সমান। দুজনেরই ${bn(mine)} ডাং।`;
  if (diff <= 5) return `${possessive(friend)} চেয়ে মাত্র ${bn(diff)} ডাং কম।`;
  return `${friend} এগিয়ে, ${bn(diff)} ডাং। আরেকবার?`;
}

export const caption = (shared: Pick<Shared, "level" | "total">) =>
  `ডাংগুলিতে ${levelDef(shared.level).rival.obj} হারালাম, তিন মারে ${bn(shared.total)} ডাং। একই মাঠে তুমি কত পারো?`;

/** The card's own line, seen by friends. */
export function humanLine(total: number) {
  if (total <= 0) return "তিনবারই ফসকাল। হলুদ দাগ আসা পর্যন্ত একটু সবুর।";
  if (total < 30) return "হাত সবে গরম হচ্ছে।";
  if (total < 60) return "পাড়ার মাঠে নাম ছড়াবে।";
  if (total < 90) return "ফিল্ডাররা দৌড়ে হয়রান।";
  return "এমন মার পাড়ায় কেউ ভোলে না।";
}

const CLEAR_LINES = [
  "টুটুল নিজেই কাঠিটা কুড়িয়ে এনে দিল।",
  "রনি দোকানে ফিরে গেল, এক হাতে লজেন্স।",
  "মিলির কাঠি পুকুরে, তোমারটা ওপারে।",
  "সাকিব ভাই দৌড়ে দৌড়ে হাঁপিয়ে গেছে।",
  "রাজু নৌকায় ফিরে বৈঠা হাতে নিল।",
  "শিউলির কাঠি বালুতে আটকে রইল।",
  "জনি এবার ঘুড়ির সুতা গোটাচ্ছে।",
  "বাবলু ভাইয়ের লম্বা হাতও পৌঁছাল না।",
  "বাবু চায়ের কাপ এগিয়ে দিল।",
  "রিয়া আপু ভেজা কাঠি মুছে তোমার হাতে দিল।",
  "শুভ ভাই হাঁটা থামিয়ে হাততালি দিল।",
  "রহিম চাচা ডাংটা তোমার হাতে তুলে দিলেন। ঝড় থামল।",
] as const;
export const clearLine = (level: number) => CLEAR_LINES[Math.min(CLEAR_LINES.length, Math.max(1, level)) - 1];

// ---- calls under the field ----
// Fixed strings, so a frame never builds one.
export const CALL = {
  flick: "নামার সময় হলুদে চাপো।",
  gold: "সোনালি মার!",
  loft: "উঁচু মার!",
  drive: "নিচু মার, মাটি ঘেঁষে।",
  weak: "ছুঁয়ে গেল, জোর পেল না।",
  early: "আগেই মারলে, কাঠি তখনো উঠছিল।",
  reach: "নাগাল পেল না।",
  fall: "দেরি হলো, কাঠি মাটিতে।",
  caught: "ক্যাচ! আউট, এবার ০ ডাং।",
  pond: "পুকুরে! গোনা হলো পাড় পর্যন্ত।",
  sand: "বালুতে থেমে গেল।",
  gust: "দমকা হাওয়া!",
  run: "সাকিব ভাই দৌড়ে গেল ওখানে।",
  pass: "পার হয়ে গেলে!",
} as const;

/** The call when a hit comes to rest. */
export function restCall(kind: number, dist: number, zone: number, short: string, catcher: string) {
  if (kind === 2) return catcher ? `${catcher} ধরে ফেলেছে। আউট, এবার ০ ডাং।` : CALL.caught;
  if (kind === 3) return CALL.fall;
  if (kind === 4) return "ফসকে গেল, এবার ০ ডাং।";
  if (kind === 1) return `পুকুরে! পাড় পর্যন্ত ${bn(dist)} ডাং।`;
  if (zone === 1) return `বালুতে থামল, ${bn(dist)} ডাং।`;
  if (dist >= 35) return `${bn(dist)} ডাং! ${short} হাঁ করে দেখছে।`;
  if (dist >= 20) return `${bn(dist)} ডাং।`;
  return `মোটে ${bn(dist)} ডাং।`;
}

/** What the next hit asks, before the flick. */
export function aimCall(hit: number, need: number, target: number, wind: number, gust: number) {
  const where = hit === 0 ? "প্রথম মার" : hit === 1 ? "২য় মার" : "শেষ মার";
  const air = gust ? " কিনারায় তীর: দমকা আসছে।" : wind > 2.5 ? " বাতাস পিঠে।" : wind < -2.5 ? " বাতাস সামনে থেকে।" : "";
  if (need <= 0) return `${where}। ${bn(target)} পার, এবার তারার জন্য।${air}`;
  return `${where}। আর ${bn(need)} ডাং লাগবে।${air}`;
}

/** Under the stars of a win short of the most: the exact ডাং still to find. */
export const nearLine = (gap: number, next: number) => gap > 0 ? `আর ${bn(gap)} ডাং হলেই ${bn(next)} তারা।` : "";

/** After a lost round: the gap, then one exact, kind tip from how most ডাং were lost. */
export function lossLine(gap: number, lost: { caught: number; fall: number; whiff: number; pond: number; sand: number; weak: number }) {
  const top = Math.max(lost.caught, lost.fall, lost.whiff, lost.pond, lost.sand, lost.weak);
  const lead = gap <= 3 ? `আর ${bn(gap)} ডাং হলেই জিতে যেতে। ` : "";
  if (top === 0) return `${lead}মাঝের সোনালি দাগে চাপলে সবচেয়ে দূরে যায়।`;
  if (top === lost.caught) return `${lead}দাগ-কাটা বৃত্তের কাছে উঁচু মার ধরা পড়ে। ওদিকে একটু দেরিতে মারো, নিচু দিয়ে যাবে।`;
  if (top === lost.pond) return `${lead}নিচু মার গড়িয়ে পুকুরে যায়। একটু আগে চাপো, উঁচু মারে পার হবে।`;
  if (top === lost.sand) return `${lead}বালুতে কাঠি থেমে যায়। উঁচু মারে বালু পার করো।`;
  if (top === lost.whiff) return `${lead}কাঠি উঠতে উঠতে চাপলে ফাঁকা যায়। নামা শুরু হলে চাপো।`;
  if (top === lost.fall) return `${lead}হলুদ দাগ পার হলে আর দেরি নয়, তখনই চাপো।`;
  return `${lead}হলুদের বাইরে মারলে জোর কমে যায়। দাগের ভেতরে চাপো।`;
}
