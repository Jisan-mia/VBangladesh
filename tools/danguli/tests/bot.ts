// A headless player for tuning and fairness tests. It sees what a person sees: the band, the rings, the pond and the sand, the
// গামছা and the gust chevrons. A reader picks the part of the band that plays best on this field (it tries each against the
// real flight, the way a practised player knows what each shot does); otherwise it aims the middle. It taps with a human
// wobble, flicks after a human pause, and sometimes doesn't swing at all.
import { makeRng } from "../../../shared/game-core";
import { type Mode } from "../lib/levels";
import {
  createRound, distanceOf, integrate, launch, popTimeAt, press,
  AIM, CONTACT, DONE, DT, E_PASS, K_CAUGHT, POP, SWEET, type Round,
} from "../lib/round";
import { advance } from "../lib/step.hot";

export type Skill = {
  name: string;
  /** Mean and spread of the tap around the planned moment (seconds). */
  bias: number; sigma: number;
  /** Chance it reads the field and picks the best part of the band (else the middle). */
  read: number;
  /** Chance of no swing at all. */
  skip: number;
};
export const SHARP: Skill = { name: "sharp", bias: 0.004, sigma: 0.022, read: 0.95, skip: 0 };
export const STEADY: Skill = { name: "steady", bias: 0.008, sigma: 0.036, read: 0.8, skip: 0.01 };
export const CASUAL: Skill = { name: "casual", bias: 0.015, sigma: 0.055, read: 0.6, skip: 0.02 };
/** Never reads the field: always aims the middle of the band. */
export const MIDDLE: Skill = { name: "middle", bias: 0.008, sigma: 0.036, read: 0, skip: 0.01 };

const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
/** Where in the band a reader may aim (× the band's half-height): high, upper, middle, lower, low. */
const AIMS = [0.75, 0.4, 0, -0.4, -0.75];
const WOBBLE = [-1.2, -0.5, 0, 0.5, 1.2];

/** What a strike at height `y` would come to, `wait` seconds from now (the reader's judgement). */
function judge(r: Round, y: number, wait: number) {
  launch(r, y);
  integrate(r, y, r.clock + wait);
  return r.kind === K_CAUGHT ? 0 : distanceOf(r);
}

/** Plays a whole round; returns it with the time it first passed the neighbour (-1 if never). */
export function botRound(level: number, seed: number, skill: Skill, mode: Mode = "n", slow = false) {
  const r = createRound(seed, level, mode, slow), rng = makeRng(seed * 7919 + 17);
  let flickAt = rng() * 0.3 + 0.25, tapAt = -1, planned = -1, passedAt = -1, steps = 0;
  for (; r.phase !== DONE && steps < 60 * 120; steps++) {
    if (r.phase === AIM) { flickAt -= DT; if (flickAt <= 0) { flickAt = rng() * 0.3 + 0.25; press(r); } }
    if (r.phase === POP && planned !== r.hit) {
      planned = r.hit;
      tapAt = -1;
      if (rng() >= skill.skip) {
        let off = 0;
        if (rng() < skill.read) {
          // A careful player keeps a margin: each aim is judged over its own wobble, not at its exact best.
          const spread = skill.sigma * 4.4;
          let best = -1;
          for (const aim of AIMS) {
            const y = SWEET + aim * r.band, at = popTimeAt(r, y);
            let value = 0;
            for (const k of WOBBLE) value += judge(r, Math.min(SWEET + CONTACT - 0.01, y + k * spread), at - r.t) / WOBBLE.length;
            if (value > best) { best = value; off = aim * r.band; }
          }
        }
        const y = Math.min(SWEET + CONTACT - 0.01, SWEET + off);
        tapAt = popTimeAt(r, y) + skill.bias + skill.sigma * gauss(rng);
      }
    }
    if (r.phase === POP && tapAt >= 0 && r.t >= tapAt) { tapAt = -1; press(r); }
    advance(r);
    for (let e = 0; e < r.evN; e++) if (r.evType[e] === E_PASS && passedAt < 0) passedAt = r.clock;
    r.evN = 0;
  }
  return { r, passedAt, time: r.clock };
}

/** Taps every 0.1–0.3 s, never looking. */
export function mashRound(level: number, seed: number) {
  const r = createRound(seed, level), rng = makeRng(seed);
  let next = 0;
  for (let steps = 0; r.phase !== DONE && steps < 60 * 120; steps++) {
    if (r.clock >= next) { next = r.clock + 0.1 + rng() * 0.2; press(r); }
    advance(r);
    r.evN = 0;
  }
  return r;
}

export const SEEDS = Array.from({ length: 60 }, (_, index) => index * 97 + 13);
export const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
export const rate = (values: boolean[]) => values.filter(Boolean).length / values.length;
