// The rules of দশ ঘাটের নৌকা: Siegler & Ramani's straight, numbered board as a boat race against আব্বু. Pure, so tests can play it.
import { starsFor } from "../../../shared/game-core";

export const WORDS = ["", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়", "দশ", "এগারো", "বারো", "তেরো", "চৌদ্দ", "পনেরো", "ষোলো", "সতেরো", "আঠারো", "উনিশ", "বিশ"];

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** step: tap every ghat the boat passes. predict: tap the ghat where it will stop, then watch it count there. */
export type Mode = "step" | "predict";
export type Level = { n: number; mode: Mode; glow: boolean; title: string };

export const LEVELS: readonly Level[] = [
  { n: 10, mode: "step", glow: true, title: "১০ ঘাট, আলো দেখে" },
  { n: 10, mode: "step", glow: false, title: "১০ ঘাট, নিজে গুনে" },
  { n: 10, mode: "predict", glow: false, title: "১০ ঘাট, আগে ভাবো কোথায় থামবে" },
  { n: 20, mode: "step", glow: false, title: "২০ ঘাট, নিজে গুনে" },
  { n: 20, mode: "predict", glow: false, title: "২০ ঘাট, আগে ভাবো কোথায় থামবে" },
];
export const LEVEL_COUNT = LEVELS.length;
export const levelOf = (level: number) => LEVELS[Math.min(Math.max(level, 1), LEVEL_COUNT) - 1];

export type Player = 0 | 1;
export type Race = {
  level: number; n: number;
  /** 0 is the start jetty, n the last ghat. */
  pos: [number, number];
  turn: Player;
  spin: number | null;
  target: number | null;
  /** True while the boat counts its own way (আব্বু's turn, or after a right guess in predict mode). */
  auto: boolean;
  tries: number;
  missRun: number; rightRun: number;
  /** The quiet ease after three misses in a row: glow on, predict turns back into one ghat at a time. */
  eased: boolean;
  misses: number; counted: number;
  first: Player | null;
  over: boolean;
};

export function newRace(level: number): Race {
  return { level, n: levelOf(level).n, pos: [0, 0], turn: 0, spin: null, target: null, auto: false, tries: 0, missRun: 0, rightRun: 0, eased: false, misses: 0, counted: 0, first: null, over: false };
}

/** আব্বু (and a grown-up playing the second boat) always taps one ghat at a time, so the child hears every number. */
export const stepMode = (race: Race) => race.turn === 1 || race.eased || levelOf(race.level).mode === "step";

/** The ghat the current player must tap next, or null when there is nothing to tap. */
export function expected(race: Race) {
  if (race.over || race.spin === null || race.target === null || race.auto) return null;
  return stepMode(race) ? race.pos[race.turn] + 1 : race.target;
}

/** 0 no help, 1 a dashed ring on the right ghat, 2 it glows. */
export function hint(race: Race): 0 | 1 | 2 {
  if (race.turn === 1 || race.eased || levelOf(race.level).glow || race.tries >= 2) return 2;
  return race.tries === 1 ? 1 : 0;
}

export const spinValue = (rng: () => number) => (rng() < 0.5 ? 1 : 2);

/** A gentle আব্বু: when he is level or ahead he mostly spins ১, so the child usually catches up but not always. */
export const botSpin = (race: Race, rng: () => number) => (rng() < (race.pos[1] >= race.pos[0] ? 0.7 : 0.5) ? 1 : 2);

export function spin(race: Race, value: number): Race {
  if (race.over || race.spin !== null) return race;
  const from = race.pos[race.turn];
  return { ...race, spin: value, target: Math.min(race.n, from + value), tries: 0 };
}

function endTurn(race: Race): Race {
  const next = { ...race, spin: null, target: null, auto: false, tries: 0 };
  if (next.pos[1] === next.n && next.first === null) next.first = 1;
  if (next.pos[0] === next.n) { next.first ??= 0; next.over = true; return next; }
  // Ease off only between turns, so the rule never changes under a finger.
  if (next.eased && next.rightRun >= 5 && !levelOf(next.level).glow) { next.eased = false; next.rightRun = 0; }
  next.turn = next.turn === 0 && next.pos[1] < next.n ? 1 : 0;
  return next;
}

/** Moves the current boat one ghat. The page calls it for each tap in step mode, and on a timer while `auto`. */
export function step(race: Race): Race {
  if (race.over || race.target === null) return race;
  const pos: [number, number] = [...race.pos];
  pos[race.turn] += 1;
  const moved = { ...race, pos, counted: race.counted + (race.turn === 0 ? 1 : 0) };
  return pos[race.turn] >= race.target ? endTurn(moved) : moved;
}

export type TapResult = { race: Race; outcome: "right" | "miss" | "ignore" };

/** A tap on ghat `ghat` of `player`'s bank. Misses cost nothing but a try; only the child's count for stars and the gentle ease. */
export function tap(race: Race, player: Player, ghat: number): TapResult {
  const want = expected(race);
  if (want === null || player !== race.turn) return { race, outcome: "ignore" };
  const child = player === 0;
  if (ghat !== want) {
    const missRun = child ? race.missRun + 1 : race.missRun;
    return { race: { ...race, tries: race.tries + 1, misses: race.misses + (child ? 1 : 0), missRun, rightRun: child ? 0 : race.rightRun, eased: race.eased || missRun >= 3 }, outcome: "miss" };
  }
  const scored = child ? { ...race, missRun: 0, rightRun: race.rightRun + 1, tries: 0 } : { ...race, tries: 0 };
  return { race: stepMode(race) ? step(scored) : { ...scored, auto: true }, outcome: "right" };
}

/** Stars are a record only: how cleanly the child counted, never who won. */
export const starsOf = (misses: number) => starsFor(misses, 1, 4, true);

export const ghatLabel = (ghat: number) => `${bn(ghat)} নম্বর ঘাট, ${WORDS[ghat]}`;

export function endLine(race: Race, other: string) {
  const at = `${bn(race.n)} নম্বর ঘাটে`;
  return race.first === 1 ? `${other}র নৌকা আগে পৌঁছাল। তোমারটাও এখন ${at}।` : `তোমার নৌকা আগে ${at} পৌঁছাল!`;
}

/** Praise the method, only when it earned it. */
export function methodLine(race: Race) {
  if (race.misses > 0) return `${bn(race.counted)}টা ঘাট গুনে এলে।`;
  return levelOf(race.level).mode === "predict" ? "আগে মনে মনে গুনেছ, তাই নৌকা ঠিক ঘাটে থেমেছে।" : "এক এক করে গুনেছ, তাই একটাও ঘাট ভুল হয়নি।";
}

export type Today = { games: number; counted: number; n: number };
export const cardLine = (today: Today) => `আজ ১ থেকে ${bn(today.n)} গুনে গুনে নৌকা চালালাম`;
export const cardSub = (today: Today) => `${bn(today.games)}টা খেলা, ${bn(today.counted)}টা ঘাট গোনা`;
