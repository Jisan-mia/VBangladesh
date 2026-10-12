// Rules for দুধ উথলানোর আগে: five pots from a seed, the foam's rise, scoring, lines and the challenge link.
// Everything random comes from makeRng(seed), so a friend's link replays the same five pots.
import { possessive } from "../../../shared/bangla";
import { makeRng, pick } from "../../../shared/game-core";
import { bn, POTS, totalOf, type Shared } from "./link";

export * from "./link";

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
};

// Pot 1 is calm and slow so the first seconds are easy; each later pot climbs faster and bubbles more.
const LEVELS = [
  { seconds: 5.2, power: 1.15, wobble: 0.01 },
  { seconds: 4.7, power: 1.25, wobble: 0.016 },
  { seconds: 4.3, power: 1.34, wobble: 0.02 },
  { seconds: 4.0, power: 1.42, wobble: 0.023 },
  { seconds: 3.7, power: 1.5, wobble: 0.026 },
];

export const vesselName: Record<Vessel, string> = { dekchi: "ডেকচি", patil: "পাতিল", hari: "মাটির হাঁড়ি" };
export const stoveName: Record<Stove, string> = { gas: "গ্যাসের চুলায়", clay: "মাটির চুলায়" };

export function makePots(seed: number): Pot[] {
  const rng = makeRng(seed);
  return LEVELS.map((level, index) => {
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

export const newRound = (seed: number): Round => ({ seed, pots: makePots(seed), index: 0, phase: "waiting", t: 0, level: 0, wait: 0, scores: [], spills: [] });

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
    if (round.index === POTS - 1) round.phase = "over";
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
export function ammuLine(round: Pick<Round, "phase" | "index" | "scores" | "spills">) {
  if (round.phase === "waiting" && round.index === 0) return "দুধটা দেখিস!";
  if (round.phase !== "result") return "";
  const at = round.scores.length - 1;
  if (round.spills[at]) return round.index === POTS - 1 ? "আহা! যাক, চুলাটা মুছে দিস।" : "আহা! পরেরটা দেখিস কিন্তু।";
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
export function versusLine(mine: number, theirs: number, name: string) {
  const who = name || "বন্ধু", of = possessive(who), diff = mine - theirs;
  if (diff > 0) return `${of} চেয়ে ${bn(diff)}% বেশি! এবার লিংকটা ফেরত পাঠাও।`;
  if (diff === 0) return "একদম সমান সমান! আরেকবার খেলে ফয়সালা করো।";
  if (diff >= -5) return `আর একটু হলেই! ${of} চেয়ে মাত্র ${bn(-diff)}% কম।`;
  return `এবার ${who} এগিয়ে। একই পাঁচটা পাতিল, আরেকবার চেষ্টা করো।`;
}

export const friendBanner = ({ total, name }: Pick<Shared, "total" | "name">) => `${name || "তোমার বন্ধু"} ${bn(total)}% করেছে। একই পাঁচটা পাতিল, এবার তোমার পালা।`;
