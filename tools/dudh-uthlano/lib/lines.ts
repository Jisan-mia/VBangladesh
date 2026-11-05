// Everything the game says during and after a round: what the button reads right now, the danger at the edge, the lines for a
// clear or a loss, the near miss and the card's lines. Pure, so tests read every line.
import { bn } from "./challenge";
import { collapsed, flareTell, FLARE_DUR, popSwell, type Pot } from "./pot";
import { LEVEL_COUNT, levelDef, MODE_INFO, STAR_MARKS, type Mode } from "./levels";

/** What the player should know right now, from what the stove shows. */
export type Status = "ready" | "heat" | "tap" | "danger" | "flare" | "pop" | "again" | "lid" | "wait" | "done" | "lost";

export function statusOf(phase: "waiting" | "rising" | "result" | "over", pot: Pot, t: number, foam: number, holding: boolean, won: boolean): Status {
  if (phase === "waiting") return "ready";
  if (phase === "result") return "wait";
  if (phase === "over") return won ? "done" : "lost";
  if (!pot.lid && foam >= 0.9) return "danger";
  if (flareTell(pot, t) > 0 || (pot.flareAt >= 0 && t >= pot.flareAt && t < pot.flareAt + FLARE_DUR)) return "flare";
  if (popSwell(pot, t) > 0) return "pop";
  if (collapsed(pot, t) && foam < 0.75) return "again";
  if (pot.lid) return "lid";
  return holding ? "heat" : "tap";
}

/** The big button's two lines for a status: what to do, and why. */
export function coach(status: Status): [string, string] {
  switch (status) {
    case "ready": return ["চেপে ধরো", "ছাড়লেই পাতিল নামবে"];
    case "heat": return ["ধরে রাখো…", "কিনারার ঠিক আগে ছাড়ো"];
    case "tap": return ["নামাও!", "চাপলেই পাতিল নামবে"];
    case "danger": return ["এখনই!", "ফেনা কিনারায়"];
    case "flare": return ["তৈরি!", "শিখা লাফাচ্ছে, ফেনা ছুটবে"];
    case "pop": return ["ধরে রাখো", "বুদবুদ ফাটবে, ওটা চূড়া না"];
    case "again": return ["ধরে রাখো", "ফেনা বসে গেছে, আবার উঠবে"];
    case "lid": return ["ঢাকনা দেখো", "যত কাঁপে, তত কাছে"];
    case "wait": return ["পরের পাতিল আসছে…", ""];
    case "done": return ["শেষ", ""];
    case "lost": return ["শেষ", ""];
  }
}

/** The danger the edge shows: "" (calm), "warn" (the foam is high), "danger" (just under the rim). */
export const edgeOf = (foam: number): "" | "warn" | "danger" => foam >= 0.92 ? "danger" : foam >= 0.8 ? "warn" : "";
/** How strong the glow is, 0..1 in steps of 0.1 (so the DOM changes only when it moves). */
export const glowOf = (foam: number) => Math.round(Math.max(0, Math.min(1, (foam - 0.78) / 0.2)) * 10) / 10;

/** The word that pops up over a pot when it comes off the stove. */
export function potWord(score: number, spilled: boolean) {
  if (spilled) return "উথলে গেল!";
  if (score >= 97) return "একদম কিনারায়!";
  if (score >= 90) return "প্রায় কিনারায়!";
  if (score >= 75) return "আরেকটু রাখা যেত";
  if (score >= 40) return "একটু আগেই নামালে";
  return "দুধ তো ফুটলই না!";
}

const CALLERS = [
  { who: "আম্মু, পাশের ঘর থেকে", first: "দুধটা দেখিস!", spill: "আহা! পরেরটা দেখিস কিন্তু।", spillLast: "আহা! যাক, চুলাটা মুছে দিস।", great: "বাহ্‌, ঠিক সময়ে নামিয়েছিস!" },
  { who: "নানি, বারান্দা থেকে", first: "হাঁড়িটা একটু দেখিস।", spill: "আহা! আঁচটা কমিয়ে ধর।", spillLast: "আহা! উঠোনটা ধুয়ে দিস।", great: "ঠিক জানি, তুই পারবি।" },
  { who: "বাবুর্চি, উঠোন থেকে", first: "ডেকচিটা দেখো, অনেক মানুষ খাবে।", spill: "ইস! পরেরটায় সাবধান।", spillLast: "যাক, বাকিটা চলবে।", great: "ঠিক সময়ে নামিয়েছ।" },
] as const;

/** What someone calls from the next room, or nothing. */
export function callerLine(world: number, phase: string, index: number, last: number, spilled: boolean, isLastPot: boolean) {
  const c = CALLERS[Math.max(0, Math.min(2, world))];
  if (phase === "waiting" && index === 0) return { who: c.who, text: c.first };
  if (phase !== "result") return null;
  if (spilled) return { who: c.who, text: isLastPot ? c.spillLast : c.spill };
  if (last >= 97) return { who: c.who, text: c.great };
  return null;
}

const CLEAR_LINES = [
  "দুই পাতিলই নামল। চুলা পরিষ্কার।",
  "ফেনা ঢেউ তুলল, তুমি সামলে নিলে।",
  "বেল বাজল। দুধ বাঁচল।",
  "প্রথম চূড়ায় ছাড়োনি। বড় ডেকচির দুধ বাঁচল।",
  "কাঠের আঁচ কমল-বাড়ল, শিখাটা তুমি দেখেছ।",
  "ঢাকনা কাঁপল, ফেনা দেখা গেল না। তবু নামালে।",
  "শিখা লাফাল। তুমি তৈরিই ছিলে।",
  "নানির হাঁড়ি পার। চুলার ছাইটুকুও ওড়েনি।",
  "বাতি গেল, দুধ রইল।",
  "বুদবুদ ফাটল। তুমি ওটাকে চূড়া ভাবোনি।",
  "ছোট পাতিল, ছোট সময়। তবু ধরে ফেলেছ।",
  "মেজবানের ডেকচি নামল। পাতে পাতে পায়েস।",
] as const;
export function clearLine(level: number, old = false) {
  if (old) return "পুরোনো রান্নাঘরের পাতিল সব নামল।";
  return CLEAR_LINES[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];
}
export const clearKicker = (level: number, old = false) => old ? `পুরোনো রান্নাঘর ${bn(level)} পার` : `লেভেল ${bn(level)} পার · ${levelDef(level).name}`;

/** A failed round: how many boiled over, and the one thing to try. */
export function lossLine(level: number, spills: number, old = false) {
  const tip = old ? "কিনারার ঠিক আগে ছাড়ো।" : levelDef(level).teach;
  if (spills > 0) return `${bn(spills)}টা উথলে গেছে। ${tip}`;
  return "দুধ কিনারার অনেক আগেই নামিয়েছ। আরেকটু সাহস দাও।";
}

/** What one more try would change, as an exact number; "" at the top. */
export function nearMiss(average: number, stars: number, mode: Mode, slow: boolean) {
  const top = slow ? 2 : MODE_INFO[mode].maxStars;
  if (stars >= top) return top < 3 ? (slow ? "ধীরে খেলায় বড়জোর ২ তারা। ৩ তারা পেতে ধীরে খেলো বন্ধ করো।" : "সহজে বড়জোর ২ তারা। ৩ তারা পেতে সাধারণে খেলো।") : "";
  const need = STAR_MARKS[stars] - average;
  return stars ? `গড় আর ${bn(need)}% বেশি হলেই ${bn(stars + 1)} তারা।` : `গড় আর ${bn(need)}% হলেই লেভেল পার।`;
}

export function humanLine(scores: readonly number[], spills: readonly boolean[], total: number) {
  const spilled = spills.filter(Boolean).length;
  if (spilled === 0 && total >= 95) return "কিনারা ছুঁইছুঁই, তবু একটা ফোঁটাও পড়েনি। এই চুলা তোমার হাতে নিরাপদ।";
  if (spilled === 0 && total >= 85) return "একটা পাতিলও উথলায়নি! আম্মু এবার নিশ্চিন্তে অন্য কাজ ধরতে পারে।";
  if (spilled === 0) return "একটাও উথলায়নি। সাবধানী হাত, শুধু আরেকটু সাহস লাগবে।";
  if (spilled === 1) return "একটা উথলেছে, বাকিগুলো ঠিকঠাক সামলেছ। চুলাটা একটু মুছে নিয়ো।";
  if (spilled <= 3) return "আম্মুর “দুধটা দেখিস!” এবার কানে বাজছে তো?";
  return "চুলাটা আজ দুধে গোসল করেছে! পরের বার পাতিলে চোখ রেখো।";
}

/** What the card says about the stars. */
export const cardStars = (stars: number) => ["এবার হলো না", "দুধ বাঁচল", "চুলা ঝকঝকে", "একটা ফোঁটাও নষ্ট হয়নি"][stars];
