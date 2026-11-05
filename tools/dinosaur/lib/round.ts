// A round: one level from the first dig to the last dinosaur's facts. Pure and deterministic (a seed makes every pit), so the
// statechart's bug paths replay in node tests (tests/round.test.ts) and a bot can play it (tests/bot.ts).
// Spec: ai_docs/statecharts/dinosaur/Dinosaur.tla.
import { starsFor } from "../../../shared/game-core";
import type { BoneKind } from "./art";
import { dinoOf, type Diet, type Dino } from "./dinos";
import { FINALE_BONES, levelOf, type LevelSpec } from "./worlds";

export type Phase = "dig" | "build" | "meet" | "facts";

/**
 * Sweet-spot difficulty, never announced: three slips in a row ease the next dinosaur (one bone fewer, and the right place
 * glows); five right in a row step it up (one bone more). `help` is -1 (harder), 0 or 1 (easier).
 */
export type Pace = { right: number; wrong: number; help: -1 | 0 | 1 };
export const FRESH_PACE: Pace = { right: 0, wrong: 0, help: 0 };
export function nextPace(pace: Pace, correct: boolean): Pace {
  if (correct) { const right = pace.right + 1; return { right, wrong: 0, help: right >= 5 ? -1 : pace.help === 1 ? 0 : pace.help }; }
  const wrong = pace.wrong + 1;
  return { right: 0, wrong, help: wrong >= 3 ? 1 : pace.help === -1 ? 0 : pace.help };
}
/** Bones for the next dinosaur: the level's count, one fewer when eased, one more when stepped up (3 to 6). A finale is always six. */
export const bonesFor = (spec: LevelSpec, pace: Pace) => spec.finale ? FINALE_BONES : Math.max(3, Math.min(6, spec.bones - pace.help));
/** The right place glows once the child has tried twice, or straight away when eased. */
export const shouldGlow = (pace: Pace, tries: number) => pace.help === 1 || tries >= 2;
/** Stars are a record only: 3 with no slip, 2 with up to two, else 1. A finished round always earns one. ধীরে খেলো changes nothing. */
export const starsOf = (slips: number) => starsFor(slips, 0, 2, true);

export type Round = {
  level: number; seed: number;
  /** Which dinosaur of the level, and which pit of it (a finale digs two). */
  index: number; dig: number;
  phase: Phase;
  /** This dinosaur's bones in the order they are dug, the ones found so far, the ones placed, the tray's pick. */
  kinds: BoneKind[]; found: BoneKind[]; placed: BoneKind[]; picked: BoneKind | null;
  /** Mistakes on the step in hand (for the glow) and in the whole round (for the stars). */
  tries: number; slips: number;
  /** Bones that went to the right place first time, bones dug in all, and dinosaurs done. */
  firstTry: number; bones: number; done: string[];
  wrongDiet: Diet[];
  pace: Pace;
  /** The last dinosaur's food was right: the round is won. */
  won: boolean;
};

export const dinosOf = (level: number): Dino[] => levelOf(level).dinos.map(id => dinoOf(id)!);
export const dinoNow = (round: Round): Dino => dinoOf(levelOf(round.level).dinos[round.index])!;
export const isLastDino = (round: Round) => round.index >= levelOf(round.level).dinos.length - 1;
const kindsOf = (level: number, index: number, pace: Pace): BoneKind[] => dinosOf(level)[index].parts.slice(0, bonesFor(levelOf(level), pace)).map(part => part[0]);

export function createRound(level: number, seed: number, pace: Pace = FRESH_PACE): Round {
  return { level, seed, index: 0, dig: 0, phase: "dig", kinds: kindsOf(level, 0, pace), found: [], placed: [], picked: null, tries: 0, slips: 0, firstTry: 0, bones: 0, done: [], wrongDiet: [], pace, won: false };
}

/** The bones lying in this pit: all of them, or half of a finale's (the first three, then the last three). */
export function pitKinds(round: Round): BoneKind[] {
  const spec = levelOf(round.level);
  if (spec.digs === 1) return round.kinds;
  const half = round.kinds.length / 2;
  return round.kinds.slice(round.dig * half, (round.dig + 1) * half);
}
/** The seed of the pit now open: a different one for each dinosaur and each pit. */
export const pitSeed = (round: Round) => (round.seed + round.index * 7919 + round.dig * 104729) >>> 0;

/** A bone came out of the sand. Returns the same round when it isn't a bone of this pit, or when it was found already. */
export function boneFound(round: Round, kind: BoneKind): Round {
  if (round.phase !== "dig" || round.found.includes(kind) || !pitKinds(round).includes(kind)) return round;
  return { ...round, found: [...round.found, kind], bones: round.bones + 1 };
}
export const pitDone = (round: Round) => pitKinds(round).every(kind => round.found.includes(kind));

/** Every bone of the pit is out: the next pit (a finale's second), or the skeleton board. */
export function afterDig(round: Round): Round {
  if (round.phase !== "dig" || !pitDone(round)) return round;
  if (round.dig + 1 < levelOf(round.level).digs) return { ...round, dig: round.dig + 1 };
  return { ...round, phase: "build", picked: null, tries: 0 };
}

/** A tray bone picked up, or put back when it is picked again. */
export function pick(round: Round, kind: BoneKind): Round {
  if (round.phase !== "build" || !round.found.includes(kind) || round.placed.includes(kind)) return round;
  return { ...round, picked: round.picked === kind ? null : kind };
}

export type Placed = { round: Round; result: "none" | "pick-first" | "slip" | "right" | "stands" };
/** A tap on a place of the skeleton (the nearest empty one, from skeleton.ts), with the picked bone. */
export function place(round: Round, slot: BoneKind | null): Placed {
  if (round.phase !== "build" || !slot) return { round, result: "none" };
  if (!round.picked) return { round, result: "pick-first" };
  if (slot !== round.picked) return { round: { ...round, tries: round.tries + 1, slips: round.slips + 1, pace: nextPace(round.pace, false) }, result: "slip" };
  const placed = [...round.placed, round.picked], first = round.tries === 0 ? 1 : 0;
  const next: Round = { ...round, placed, picked: null, tries: 0, firstTry: round.firstTry + first, pace: nextPace(round.pace, true) };
  if (placed.length < round.kinds.length) return { round: next, result: "right" };
  return { round: { ...next, phase: "meet" }, result: "stands" };
}

export type Chose = { round: Round; result: "none" | "slip" | "right" };
/** "ও কী খেত?" The right answer shows the facts; on the last dinosaur it wins the round (the caller saves the stars in this very tap). */
export function chooseDiet(round: Round, diet: Diet): Chose {
  if (round.phase !== "meet" || round.wrongDiet.includes(diet)) return { round, result: "none" };
  if (diet !== dinoNow(round).diet) return { round: { ...round, wrongDiet: [...round.wrongDiet, diet], tries: round.tries + 1, slips: round.slips + 1, pace: nextPace(round.pace, false) }, result: "slip" };
  const last = isLastDino(round);
  return { round: { ...round, phase: "facts", tries: 0, pace: nextPace(round.pace, true), done: [...round.done, dinoNow(round).id], won: last }, result: "right" };
}

/** ▶ after the facts: the next dinosaur's dig, or null after the last (the end screen). */
export function nextDino(round: Round): Round | null {
  if (round.phase !== "facts") return round;
  if (isLastDino(round)) return null;
  const index = round.index + 1;
  return { ...round, index, dig: 0, phase: "dig", kinds: kindsOf(round.level, index, round.pace), found: [], placed: [], picked: null, tries: 0, wrongDiet: [] };
}

export const glowOn = (round: Round) => shouldGlow(round.pace, round.tries);

export type Result = { level: number; stars: number; slips: number; bones: number; firstTry: number; dinos: string[] };
export function resultOf(round: Round): Result {
  return { level: round.level, stars: starsOf(round.slips), slips: round.slips, bones: round.bones, firstTry: round.firstTry, dinos: round.done };
}

/** The end screen and the parent card: what was done, with no name. */
export const doneLine = (level: number) => {
  const count = levelOf(level).dinos.length, spec = levelOf(level);
  return spec.finale ? `আজ ${dinoOf(spec.dinos[0])!.name}-এর কঙ্কাল জোড়া দিলাম` : `আজ ${new Intl.NumberFormat("bn-BD").format(count)}টা ডাইনোসর খুঁজে পেলাম`;
};
