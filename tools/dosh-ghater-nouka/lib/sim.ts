// The rules of দশ ঘাটের নৌকা, pure and deterministic (makeRng only). One mutable Race per game; the clock (clock.hot.ts)
// moves it by milliseconds and the page drains its events. Nothing here uses a timer, so a paused or hidden page cannot
// move a boat: the page's fixed-step loop is the only clock. Spec: ai_docs/statecharts/dosh-ghater-nouka/Nouka.tla.
import { makeRng } from "../../../shared/game-core";
import { levelOf, starsOf, type Dir } from "./levels";

/** How long the চরকি turns, a boat takes to count one ghat on its own, and how long the finish lasts before the end page. */
export const SPIN_MS = 450, SPIN_SLOW_MS = 150, RIVAL_GAP_MS = 420, AUTO_GAP_MS = 360, FINISH_MS = 1300, FINISH_FINALE_MS = 2100, IDLE_MS = 5000;

/** Event codes the page reads after a step. They carry no payload: the page reads the numbers from the race. */
export const EV = { SPIN_START: 1, SPIN_LAND: 2, STEP: 3, STEP_OTHER: 4, RIVAL_SPIN: 5, RIVAL_LAND: 6, RIVAL_STEP: 7, RIVAL_HOME: 8, ARRIVED: 9, CARD: 10, IDLE: 11, TURN: 12, MISS: 13 } as const;

export type Race = {
  level: number; n: number; dir: Dir; rival: boolean; duo: boolean; predict: boolean; glow: boolean; faces: number; odds: readonly number[]; finale: boolean;
  spinMs: number;
  rng: () => number; rrng: () => number;
  /** Progress of each boat: 0 is the jetty, n the last ghat. Going back, ghat number = n + 1 - progress. */
  pos: [number, number];
  /** Whose hand is on the ghats: 0 you, 1 the second player (পালা করে only). */
  turn: 0 | 1;
  /** The face the চরকি is turning to (0 before the first spin), the face it landed on (0 = none to count), ms left of the turn. */
  face: number; spin: number; spinT: number;
  target: number;
  /** The boat counting its own way after a right guess in predict mode. */
  auto: boolean; autoT: number;
  tries: number; missRun: number; rightRun: number; eased: boolean;
  misses: number; counted: number; spins: number; turns: number; exact: number; firstTry: number; turnMiss: number;
  /** আব্বু's boat: his চরকি turning, the ghats he still owes, ms to his next hop. */
  rFace: number; rSpinT: number; rOwed: number; rT: number; rSpins: number;
  over: boolean; endT: number; ended: boolean;
  time: number; idleT: number;
  evs: Uint8Array; nev: number;
};

export function newRace(level: number, seed: number, options: { duo?: boolean; slow?: boolean } = {}): Race {
  const spec = levelOf(level);
  return {
    level: spec.id, n: spec.n, dir: spec.dir, rival: spec.rival, duo: Boolean(options.duo) && spec.rival, predict: spec.predict, glow: spec.glow,
    faces: spec.faces, odds: spec.odds, finale: Boolean(spec.finale), spinMs: options.slow ? SPIN_SLOW_MS : SPIN_MS,
    rng: makeRng(seed), rrng: makeRng((seed ^ 0x9e3779b1) >>> 0),
    pos: [0, 0], turn: 0, face: 0, spin: 0, spinT: 0, target: 0, auto: false, autoT: 0,
    tries: 0, missRun: 0, rightRun: 0, eased: false, misses: 0, counted: 0, spins: 0, turns: 0, exact: 0, firstTry: 0, turnMiss: 0,
    rFace: 0, rSpinT: 0, rOwed: 0, rT: 0, rSpins: 0,
    over: false, endT: 0, ended: false, time: 0, idleT: 0,
    evs: new Uint8Array(32), nev: 0,
  };
}

export function push(race: Race, code: number) { if (race.nev < race.evs.length) race.evs[race.nev++] = code; }

const draw = (rng: () => number, odds: readonly number[]) => {
  const roll = rng();
  let sum = 0;
  for (let face = 0; face < odds.length; face++) { sum += odds[face]; if (roll < sum) return face + 1; }
  return odds.length;
};

/** আব্বু (the phone's boat) is gentle: when he is level or ahead he mostly spins ১, so you usually catch up but not always. */
export function rivalFace(race: Race) {
  const ahead = race.pos[1] + race.rOwed >= race.pos[0], roll = race.rrng();
  if (race.faces === 2) return roll < (ahead ? 0.7 : 0.5) ? 1 : 2;
  return ahead ? (roll < 0.5 ? 1 : roll < 0.8 ? 2 : 3) : (roll < 1 / 3 ? 1 : roll < 2 / 3 ? 2 : 3);
}

/** The phone's boat races beside you (not in পালা করে, where a person sails it by turns). */
export const botRaces = (race: Race) => race.rival && !race.duo;

/** Can the hand on the ghats spin the চরকি now? */
export const canSpin = (race: Race) => !race.over && race.spin === 0 && race.spinT <= 0 && !race.auto && (race.turn === 0 || race.duo);

/** Press the চরকি. In the phone-boat race, আব্বু's চরকি turns at the same moment. */
export function spinNow(race: Race) {
  if (!canSpin(race)) return false;
  race.face = draw(race.rng, race.odds);
  race.spinT = race.spinMs;
  race.idleT = 0;
  if (race.turn === 0) race.spins++;
  push(race, EV.SPIN_START);
  if (botRaces(race) && race.rSpinT <= 0 && race.pos[1] + race.rOwed < race.n) {
    race.rFace = rivalFace(race);
    race.rSpinT = race.spinMs;
    race.rSpins++;
    push(race, EV.RIVAL_SPIN);
  }
  return true;
}

/** The চরকি stops: its face is the number of ghats to count. */
export function landSpin(race: Race) {
  race.spinT = 0;
  race.spin = race.face;
  race.target = Math.min(race.n, race.pos[race.turn] + race.spin);
  race.idleT = 0;
  push(race, EV.SPIN_LAND);
}

/** আব্বু's চরকি stops: he now owes that many hops (never past the last ghat). */
export function rivalLand(race: Race) {
  race.rSpinT = 0;
  const room = race.n - race.pos[1] - race.rOwed;
  if (room <= 0) return;
  if (race.rOwed === 0) race.rT = 160;
  race.rOwed += Math.min(race.rFace, room);
  push(race, EV.RIVAL_LAND);
}

export function rivalHop(race: Race) {
  race.pos[1]++;
  race.rOwed--;
  push(race, EV.RIVAL_STEP);
  if (race.pos[1] >= race.n) push(race, EV.RIVAL_HOME);
}

/** Ghat-by-ghat (step) or the whole turn in one go (predict). Tapping a step only counts when it is the one wanted. */
export const stepMode = (race: Race) => race.turn === 1 || race.eased || !race.predict;

/** The progress the hand must tap next, or 0 when there is nothing to tap. */
export function expected(race: Race) {
  if (race.over || race.spin === 0 || race.auto) return 0;
  return stepMode(race) ? race.pos[race.turn] + 1 : race.target;
}

/** 0 no help, 1 a dashed ring on the right ghat, 2 it glows. */
export function hintOf(race: Race): 0 | 1 | 2 {
  if (race.turn === 1 || race.eased || race.glow || race.tries >= 2) return 2;
  return race.tries === 1 ? 1 : 0;
}

function arrive(race: Race) {
  race.over = true;
  race.endT = race.finale ? FINISH_FINALE_MS : FINISH_MS;
  push(race, EV.ARRIVED);
}

function endTurn(race: Race) {
  race.spin = 0; race.target = 0; race.auto = false; race.tries = 0; race.idleT = 0;
  if (race.turn === 0) { race.turns++; if (race.turnMiss === 0) race.exact++; race.turnMiss = 0; }
  if (race.pos[0] >= race.n) { arrive(race); return; }
  // Ease off only between turns, so the rule never changes under a finger.
  if (race.eased && race.rightRun >= 5 && !race.glow) { race.eased = false; race.rightRun = 0; }
  if (race.duo) race.turn = race.turn === 0 && race.pos[1] < race.n ? 1 : 0;
  push(race, EV.TURN);
}

/** The hand's boat counts one ghat. */
export function hop(race: Race) {
  const mine = race.turn;
  race.pos[mine]++;
  if (mine === 0) race.counted++;
  push(race, mine === 0 ? EV.STEP : EV.STEP_OTHER);
  if (race.pos[mine] >= race.target) endTurn(race);
}

export const IGNORE = 0, RIGHT = 1, MISS = 2;
/** A tap on the ghat with progress `k`. A wrong tap costs nothing but a try; only your own taps count for stars and the gentle ease. */
export function tap(race: Race, k: number) {
  const want = expected(race);
  if (want === 0) return IGNORE;
  race.idleT = 0;
  const mine = race.turn === 0;
  if (k !== want) {
    race.tries++;
    if (mine) { race.misses++; race.turnMiss++; race.missRun++; race.rightRun = 0; if (race.missRun >= 3) race.eased = true; }
    push(race, EV.MISS);
    return MISS;
  }
  if (mine) { race.missRun = 0; race.rightRun++; if (race.tries === 0) race.firstTry++; }
  race.tries = 0;
  if (stepMode(race)) hop(race); else { race.auto = true; race.autoT = 0; }
  return RIGHT;
}

export type Result = { level: number; stars: number; n: number; spins: number; exact: number; turns: number; misses: number; rivalAt: number; duo: boolean; rival: boolean; dir: Dir };
export const resultOf = (race: Race): Result => ({
  level: race.level, stars: starsOf(race.misses, race.n), n: race.n, spins: race.spins, exact: race.exact, turns: race.turns, misses: race.misses,
  rivalAt: race.pos[1], duo: race.duo, rival: race.rival, dir: race.dir,
});

/** The line for the end page and the card: no winner, only what the child did. */
export const endLine = (race: Pick<Result, "n" | "dir">, bnFn: (value: number) => string) => race.dir > 0 ? `তোমার নৌকা ${bnFn(race.n)} নম্বর ঘাটে পৌঁছাল।` : `তোমার নৌকা ঘরের ঘাটে ফিরল।`;
