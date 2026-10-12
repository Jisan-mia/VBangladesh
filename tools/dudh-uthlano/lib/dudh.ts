// Rules for দুধ উথলানোর আগে: five pots from a seed, the foam's rise, scoring, lines and the challenge link.
// Everything random comes from makeRng(seed), so a friend's link replays the same five pots.
import { possessive } from "../../../shared/bangla";
import { makeRng, pick, readLevels, starsFor } from "../../../shared/game-core";
import { kitchenOf, kitchenStars, potsWord, CLASSIC, KITCHEN_COUNT, STAR_MARKS } from "./kitchens";
import { bn, totalOf, type Shared } from "./link";

export * from "./link";
export * from "./kitchens";

/** Slow mode runs the pot's clock at this speed and halves the bubbling. */
export const SLOW = 0.6;
/** How long a pot's result stays before the next pot is put on. */
export const RESULT_SECONDS = 1.4;
/** A press longer than this was a hold: letting go lifts the pot. A shorter one was a tap: the milk keeps heating until the next press. */
export const HOLD_MS = 260;

export type Vessel = "dekchi" | "patil" | "hari";
export type Stove = "gas" | "clay";
export type Pot = {
  vessel: Vessel;
  stove: Stove;
  /** Seconds for the foam to reach the rim, ignoring the bubbling. */
  seconds: number;
  /** >1: creeps first, then climbs fast near the top, the way milk does. */
  power: number;
  /** Bubbling height as a share of the rim, at full boil. */
  wobble: number;
  hz: number;
  phase: number;
  /** Seconds into the boil (on the pot's clock) when the doorbell rings, or -1. Only a distraction: the milk doesn't care. */
  bell: number;
};

export const vesselName: Record<Vessel, string> = { dekchi: "ডেকচি", patil: "পাতিল", hari: "মাটির হাঁড়ি" };
export const stoveName: Record<Stove, string> = { gas: "গ্যাসের চুলায়", clay: "মাটির চুলায়" };

/** A kitchen's pots from a seed. Pot 1 is calm and slow; each later pot climbs faster and bubbles more. */
export function makePots(seed: number, kitchen = CLASSIC): Pot[] {
  const rng = makeRng(seed), { pots, bells } = kitchenOf(kitchen);
  // The doorbell has its own generator, so the pots themselves match the original game's draws exactly.
  const ring = makeRng(seed ^ 0x5bd1e995), rings = new Set<number>();
  while (rings.size < bells) rings.add(1 + pick(ring, pots.length - 1));
  const at = pots.map(() => 0.5 + 0.3 * ring());
  return pots.map((level, index) => {
    // Always the same number of draws per pot, so pot 4 never depends on what pot 2 rolled.
    const kind = pick(rng, 10), time = rng(), curve = rng(), size = rng(), hz = rng(), phase = rng();
    const vessel: Vessel = index === 0 ? "dekchi" : kind < 3 ? "hari" : kind < 7 ? "dekchi" : "patil";
    const stove: Stove = vessel === "hari" ? "clay" : "gas";
    return {
      vessel, stove,
      seconds: level.seconds * (0.92 + 0.16 * time),
      power: level.power + (curve - 0.5) * 0.14,
      // A wood fire flickers more than a gas ring.
      wobble: level.wobble * (0.8 + 0.4 * size) * (stove === "clay" ? 1.2 : 1),
      hz: 0.7 + 0.5 * hz,
      phase: phase * Math.PI * 2,
      bell: rings.has(index) ? at[index] * level.seconds : -1,
    };
  });
}

/** How high the foam is (1 = the rim) after `t` seconds on the pot's own clock. Slow mode shows it in 2% steps and bubbles half as much. */
export function levelAt(pot: Pot, t: number, slow: boolean) {
  const base = Math.pow(Math.max(0, t) / pot.seconds, pot.power);
  const level = base + pot.wobble * (slow ? 0.5 : 1) * base * base * base * Math.sin(2 * Math.PI * pot.hz * t + pot.phase);
  return slow ? Math.floor(level * 50 + 1e-9) / 50 : level;
}

/** Percent of the rim, 0–99; reaching 100 is a spill. */
export const potScore = (level: number) => Math.max(0, Math.min(99, Math.floor(level * 100 + 1e-6)));

export type Phase = "waiting" | "rising" | "result" | "over";
export type Round = {
  seed: number;
  kitchen: number;
  pots: Pot[];
  index: number;
  phase: Phase;
  /** The current pot's clock (slowed in slow mode) and its foam level. */
  t: number;
  level: number;
  /** Seconds the current result has been showing. */
  wait: number;
  scores: number[];
  spills: boolean[];
};

export const newRound = (seed: number, kitchen = CLASSIC): Round => ({ seed, kitchen, pots: makePots(seed, kitchen), index: 0, phase: "waiting", t: 0, level: 0, wait: 0, scores: [], spills: [] });

/** Lights the stove under the waiting pot. */
export function startPot(round: Round) {
  if (round.phase !== "waiting") return false;
  round.phase = "rising";
  round.t = 0;
  round.level = 0;
  return true;
}

/** Takes the pot off the stove: it scores how close the foam got to the rim. */
export function liftPot(round: Round) {
  if (round.phase !== "rising") return false;
  round.scores.push(potScore(round.level));
  round.spills.push(false);
  round.phase = "result";
  round.wait = 0;
  return true;
}

/** Advances the round by dt real seconds. Mutates in place (no allocation in the game loop); returns true when the phase changed. */
export function stepRound(round: Round, dt: number, slow: boolean) {
  if (round.phase === "rising") {
    round.t += dt * (slow ? SLOW : 1);
    round.level = levelAt(round.pots[round.index], round.t, slow);
    if (round.level < 1) return false;
    round.level = 1;
    round.scores.push(0);
    round.spills.push(true);
    round.phase = "result";
    round.wait = 0;
    return true;
  }
  if (round.phase === "result") {
    round.wait += dt;
    if (round.wait < RESULT_SECONDS) return false;
    if (round.index === round.pots.length - 1) round.phase = "over";
    else { round.index++; round.phase = "waiting"; round.t = 0; round.level = 0; }
    return true;
  }
  return false;
}

export const ordinal = (index: number) => `${bn(index + 1)} নম্বর`;

/** The word that pops up over a pot when it comes off the stove. */
export function potWord(score: number, spilled: boolean) {
  if (spilled) return "উথলে গেল!";
  if (score >= 97) return "একদম কিনারায়!";
  if (score >= 90) return "প্রায় কিনারায়!";
  if (score >= 75) return "আরেকটু রাখা যেত";
  if (score >= 40) return "একটু আগেই নামালে";
  return "দুধ তো ফুটলই না!";
}

/** What আম্মু calls from the next room, or nothing. Her lines use তুই, the way she talks to her own child. */
export function ammuLine(round: Pick<Round, "phase" | "index" | "scores" | "spills" | "pots">) {
  if (round.phase === "waiting" && round.index === 0) return "দুধটা দেখিস!";
  if (round.phase !== "result") return "";
  const at = round.scores.length - 1;
  if (round.spills[at]) return round.index === round.pots.length - 1 ? "আহা! যাক, চুলাটা মুছে দিস।" : "আহা! পরেরটা দেখিস কিন্তু।";
  if (round.scores[at] >= 97) return "বাহ্‌, ঠিক সময়ে নামিয়েছিস!";
  return "";
}

export function humanLine(scores: readonly number[], spills: readonly boolean[]) {
  const spilled = spills.filter(Boolean).length, total = totalOf(scores);
  if (spilled === 0 && total >= 95) return "কিনারা ছুঁইছুঁই, তবু একটা ফোঁটাও পড়েনি। এই চুলা তোমার হাতে নিরাপদ।";
  if (spilled === 0 && total >= 85) return "একটা পাতিলও উথলায়নি! আম্মু এবার নিশ্চিন্তে অন্য কাজ ধরতে পারে।";
  if (spilled === 0) return "একটাও উথলায়নি। সাবধানী হাত, শুধু আরেকটু সাহস লাগবে।";
  if (spilled === 1) return "একটা উথলেছে, বাকিগুলো ঠিকঠাক সামলেছ। চুলাটা একটু মুছে নিয়ো।";
  if (spilled <= 3) return "আম্মুর “দুধটা দেখিস!” এবার কানে বাজছে তো?";
  return "চুলাটা আজ দুধে গোসল করেছে! পরের বার পাতিলে চোখ রেখো।";
}

/** After playing a friend's pots: kind either way. */
export function versusLine(mine: number, theirs: number, name: string, count = 5) {
  const who = name || "বন্ধু", of = possessive(who), diff = mine - theirs;
  if (diff > 0) return `${of} চেয়ে ${bn(diff)}% বেশি! এবার লিংকটা ফেরত পাঠাও।`;
  if (diff === 0) return "একদম সমান সমান! আরেকবার খেলে ফয়সালা করো।";
  if (diff >= -5) return `আর একটু হলেই! ${of} চেয়ে মাত্র ${bn(-diff)}% কম।`;
  return `এবার ${who} এগিয়ে। একই ${potsWord(count)} পাতিল, আরেকবার চেষ্টা করো।`;
}

export const friendBanner = ({ total, name, scores }: Pick<Shared, "total" | "name" | "scores">) => `${name || "তোমার বন্ধু"} ${bn(total)}% করেছে। একই ${potsWord(scores.length)} পাতিল, এবার তোমার পালা।`;

/** What the next star needs, as an exact number; "" at three stars. */
export function nearMiss(total: number) {
  const stars = kitchenStars(total);
  if (stars === 3) return "";
  const need = STAR_MARKS[stars] - total;
  return stars ? `গড় আর ${bn(need)}% বেশি হলেই ${bn(stars + 1)} তারা।` : `গড় আর ${bn(need)}% হলেই রান্নাঘর পার।`;
}

/** The line under a kitchen's result: one picture per star count. */
export function clearLine(stars: number) {
  return ["চুলায় দুধের দাগ। আরেকবার, এবার চোখ পাতিলে।", "দুধ বাঁচল, চুলাও মোটামুটি পরিষ্কার।", "আম্মু এসে দেখল চুলা ঝকঝকে।", "একটা ফোঁটাও নষ্ট হয়নি। আম্মু চা বসাতে বলল।"][stars];
}

/**
 * Old phones kept only a best average from the original five pots, which is kitchen 3 now.
 * Run once, before the level store is first read: that best becomes kitchen 3's stars, which opens kitchens 1–4. Returns the new store, or null for nothing to do.
 */
export function migrateLevels(levelsRaw: string | null, bestRaw: string | null) {
  if (levelsRaw !== null || bestRaw === null) return null;
  const best = Number(bestRaw);
  if (!Number.isFinite(best) || best < 50) return null;
  return JSON.stringify(readLevels(JSON.stringify({ [CLASSIC]: starsFor(best, 90, 75) }), KITCHEN_COUNT));
}
