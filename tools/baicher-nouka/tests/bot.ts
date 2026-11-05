// Headless rowers for tuning and fairness tests. They play the same pure rules the page uses, at 60 steps a second:
// taps on the drum a little late on average, with a wobble, sometimes not at all; and they steer the way a person does,
// noticing a row of কচুরিপানা only once it is on screen, then a reaction time later moving one lane at a time.
import { makeRng } from "../../../shared/game-core";
import { BOAT_LEN, FRONT_Y, LANES, laneX } from "../lib/course";
import type { Mode } from "../lib/levels";
import { closed, createRace, roomIn, steer, tapBeat, type Race } from "../lib/rowing";
import { stepRace } from "../lib/step.hot";

export type Skill = {
  name: string;
  /** Seconds after the beat on average, and the spread of a tap around it. */
  mean: number; spread: number;
  /** Chance per beat of no tap at all. */
  skip: number;
  /** Seconds from seeing a row to starting to move, and the chance of tapping the wrong way. */
  react: number; wrong: number;
  /** Does it steer at all, and does it tap the drum at all, and taps a second if it only mashes. */
  dodge: boolean; drum: boolean; mash: number;
};
export const SHARP: Skill = { name: "sharp", mean: 0.02, spread: 0.035, skip: 0, react: 0.24, wrong: 0.01, dodge: true, drum: true, mash: 0 };
export const STEADY: Skill = { name: "steady", mean: 0.03, spread: 0.07, skip: 0.05, react: 0.32, wrong: 0.03, dodge: true, drum: true, mash: 0 };
export const SHAKY: Skill = { name: "shaky", mean: 0.04, spread: 0.11, skip: 0.12, react: 0.38, wrong: 0.06, dodge: true, drum: true, mash: 0 };
export const IDLE: Skill = { ...STEADY, name: "idle", drum: false };
export const MASHER: Skill = { ...STEADY, name: "masher", drum: false, mash: 6 };
export const BLIND: Skill = { ...SHARP, name: "blind", dodge: false };

const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
const DT = 1 / 60;

/** The lanes the next row of live patches covers (a bitmask) and its index, among those ahead of the bow and within `sight`. */
function rowAhead(race: Race, sight: number, from: number) {
  const you = race.boats[0];
  let row = -1, mask = 0;
  for (let index = race.firstPatch; index < race.patches.length; index++) {
    const patch = race.patches[index];
    if (patch.hitBy >= 0 || patch.row < from || patch.y <= you.y) continue;
    if (patch.y - you.y > sight) break;
    if (row === -1) row = patch.row;
    if (patch.row !== row) break;
    mask |= 1 << patch.lane;
  }
  return { row, mask };
}

export function rowRace(level: number, seed: number, skill: Skill, mode: Mode = "n", old = false, scale = 1) {
  const race = createRace(seed, level, mode, old, 0, scale);
  // A person's times are real seconds; the race runs at `scale` game seconds a second.
  const react = skill.react * scale, mean = skill.mean * scale, spread = skill.spread * scale;
  const r = makeRng(seed * 7919 + 17);
  const sight = race.def.dark ? 240 : FRONT_Y - 20;
  let nextBeat = 0, planned = -1e9, mashAt = 0;
  const noticed = new Map<number, number>();
  let blindUntil = 0, lastLane = race.boats[0].lane, tapAt = 0;
  for (let steps = 0; !race.over && steps < 60 * 120; steps++) {
    const you = race.boats[0];
    if (race.t >= 0) {
      if (skill.drum) {
        while (nextBeat < race.beats.length && race.beats[nextBeat] + mean <= race.t - 0.3 * scale) { nextBeat++; planned = -1e9; }
        if (nextBeat < race.beats.length) {
          if (planned < 0 || planned < race.beats[nextBeat] - 0.5) planned = r() < skill.skip ? Infinity : race.beats[nextBeat] + mean + spread * gauss(r);
          if (race.t >= planned) { tapBeat(race); nextBeat++; planned = -1e9; }
        }
      } else if (skill.mash) {
        while (race.t >= mashAt) { tapBeat(race); mashAt += (scale / skill.mash) * (0.6 + 0.8 * r()); }
      }
      if (skill.dodge) {
        if (you.lane !== lastLane) { lastLane = you.lane; }
        const { row, mask } = rowAhead(race, sight, 0);
        if (row >= 0 && !noticed.has(row)) noticed.set(row, race.t);
        const settled = Math.abs(you.x - laneX(you.lane)) < 0.5 || race.t - tapAt > 0.12 * scale;
        const ready = row >= 0 && race.t >= (noticed.get(row) ?? 0) + react && race.t >= blindUntil;
        const stuck = you.held > 0.3;
        if (settled && (ready || stuck) && (mask & (1 << you.lane) || stuck)) {
          const second = rowAhead(race, sight + 400, row + 1);
          let best = -1, bestScore = Infinity;
          for (let lane = 0; lane < LANES; lane++) {
            if (mask & (1 << lane)) continue;
            const score = Math.abs(lane - you.lane) * 2 + (second.mask & (1 << lane) ? 3 : 0) + (closed(race, you.y, lane) ? 99 : 0);
            if (score < bestScore) { bestScore = score; best = lane; }
          }
          if (stuck && best < 0) best = you.lane;
          if (best >= 0 && best !== you.lane) {
            let towards: -1 | 1 = best > you.lane ? 1 : -1;
            if (r() < skill.wrong) towards = -towards as -1 | 1;
            if (roomIn(race, 0, you.lane + towards)) { steer(race, towards); tapAt = race.t; }
          } else if (stuck) {
            const towards: -1 | 1 = you.lane < 2 ? 1 : -1;
            if (roomIn(race, 0, you.lane + towards)) { steer(race, towards); tapAt = race.t; }
          }
        }
      }
    }
    stepRace(race, DT);
    // A gust is seen a moment late: look again after it.
    if (race.gustNext > 0 && race.boats[0].lane !== lastLane) { blindUntil = race.t + react * 0.6; lastLane = race.boats[0].lane; }
    void BOAT_LEN;
  }
  return race;
}

export const SEEDS = Array.from({ length: 40 }, (_, index) => index * 97 + 13);
export const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
