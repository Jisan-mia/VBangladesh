// A headless classmate who sees what a person sees, `reaction` seconds late. The careful one sets each class's star times;
// tests/bot.ts builds sloppier ones on the same eyes. Pure: it only steps the same rules the page runs.
import { AWAY, BLIND, COUGH, createGame, DARK, DROP, FAKE_KIND, FLICK, LEAD, LIT, LOOK, makeClass, minTenths, PEEK, SAFE_KIND, tenthsOf, W_TELL, WARN_KIND, WRITE, type Game, type Klass } from "./class";
import { OLD_MIN_TENTHS } from "./legacy";
import { THROW_TIME, type Mode } from "./levels";
import { stepGame } from "./step.hot";

export const DT = 1 / 60;
/** How quickly a careful player sees a change and reacts, for the star targets. */
export const REACTION = 0.25;
/** A slower classmate the two-star time still has to fit. */
export const SLOW_REACTION = 0.35;

/** Would a person who reads every tell keep the chit moving right now? */
export function looksSafe(g: Game) {
  const k = g.klass, kind = k.kinds[g.seg];
  if (g.scold > 0) return false;
  let teacher = SAFE_KIND[kind] === 1;
  if (k.dKinds.length > 0 && k.dKinds[g.dSeg] === DARK) teacher = true;
  const watcher = k.wKinds.length === 0 || k.wKinds[g.wSeg] === AWAY;
  return teacher && watcher;
}

/**
 * A throw now (as seen `reaction` late) would land before anyone could look. A throw is only caught when it starts inside a
 * warning, so the careful classmate keeps a margin: early in a stretch of writing (a stretch after a look lasts LEAD seconds,
 * one after a cough or peek at least 0.9), during a cough or peek, or early in a blackout.
 */
export function freshStart(g: Game, reaction = REACTION) {
  const k = g.klass, kind = k.kinds[g.seg];
  if (k.wKinds.length > 0 && k.wKinds[g.wSeg] !== AWAY) return false;
  if (k.dKinds.length > 0) {
    const light = k.dKinds[g.dSeg];
    // The tube light flickers for longer than a throw takes (plus a slow eye), so any throw in the dark lands.
    if (light === DARK) return true;
    if (light === FLICK || (light === LIT && g.dT < k.grace)) return false;
  }
  if (kind === COUGH || kind === PEEK || kind === DROP) return true;
  // The glasses come off for at least 1.4 s, and going back on is a warning of its own.
  if (kind === BLIND) return g.segT <= 1.4 - MARGIN - reaction;
  if (kind !== WRITE) return false;
  const afterFake = g.seg > 0 && FAKE_KIND[k.kinds[g.seg - 1]] === 1;
  return g.segT <= (afterFake ? 0.9 : LEAD) - MARGIN - reaction;
}
/** Seconds of writing the careful classmate leaves after a throw would start. */
const MARGIN = 0.3;

export const atThrow = (g: Game) => { const bench = Math.floor(g.pos + 1e-9); return g.klass.throwAt[bench] === 1 && g.pos - bench < 1e-6 && !g.throwing; };

/** The score for a finished class, in tenths: never under what the room allows (old links keep their old floor). */
export const scoreOf = (g: Game) => Math.max(g.klass.old ? OLD_MIN_TENTHS : minTenths(g.klass, THROW_TIME), tenthsOf(g.time));

/** Seconds the shortest warning of each kind lasts in this class (the teacher's, the watcher's, the flicker): a sharp player learns them. */
export function shortestWarnings(k: Klass) {
  const teacher = new Float64Array(10).fill(Infinity);
  for (let i = 0; i < k.kinds.length; i++) if (WARN_KIND[k.kinds[i]] && k.durs[i] < teacher[k.kinds[i]]) teacher[k.kinds[i]] = k.durs[i];
  let watcher = Infinity, flick = Infinity;
  for (let i = 0; i < k.wKinds.length; i++) if (k.wKinds[i] === W_TELL && k.wDurs[i] < watcher) watcher = k.wDurs[i];
  for (let i = 0; i < k.dKinds.length; i++) if (k.dKinds[i] === FLICK && k.dDurs[i] < flick) flick = k.dDurs[i];
  return { teacher, watcher, flick };
}

/** How far into the warning now showing the chit may still move: the warning's shortest length, plus the grace, minus a margin. */
function dareLeft(g: Game, short: ReturnType<typeof shortestWarnings>) {
  const k = g.klass, kind = k.kinds[g.seg], margin = 0.12;
  if (g.scold > 0) return -1;
  let left = Infinity;
  const dark = k.dKinds.length > 0 ? k.dKinds[g.dSeg] : LIT;
  if (dark !== DARK) {
    if (WARN_KIND[kind]) left = short.teacher[kind] + k.grace - margin - g.segT;
    else if (kind === LOOK) left = -1;
    if (dark === FLICK && !SAFE_KIND[kind]) left = Math.min(left, short.flick + k.grace - margin - g.dT);
  }
  if (k.wKinds.length > 0) {
    const w = k.wKinds[g.wSeg];
    if (w === W_TELL) left = Math.min(left, short.watcher + k.grace - margin - g.wT);
    else if (w !== AWAY) left = -1;
  }
  return left;
}

/**
 * Plays a whole class. The careful classmate stops at every warning it sees, `reaction` late. A daring one (`dare`) holds on into a
 * warning for as long as the class's shortest one allows, then stops: the red-light skill the three stars ask for.
 * Returns the finishing time in tenths, the catches and whether it got there.
 */
export function carefulRun(klass: Klass, reaction = REACTION, dare = false) {
  const game = createGame(klass), lag = Math.max(1, Math.round(reaction / DT)), short = shortestWarnings(klass);
  const go = new Uint8Array(lag), fresh = new Uint8Array(lag);
  let steps = 0;
  stepGame(game, true, DT);
  while (game.phase !== "over" && steps++ < 60 * 600) {
    const slot = steps % lag, seenGo = go[slot], seenFresh = fresh[slot];
    go[slot] = looksSafe(game) ? 1 : 0; fresh[slot] = freshStart(game, reaction) ? 1 : 0;
    // The daring one holds on only while it was already moving: it never starts into a warning.
    const daring = dare && game.moving && dareLeft(game, short) > 0;
    const hold = !game.needRelease && (seenGo === 1 || daring) && (!atThrow(game) || seenFresh === 1);
    stepGame(game, hold, DT);
  }
  return { tenths: scoreOf(game), catches: game.catches, won: game.won };
}

export type Targets = { three: number; two: number };
/** Star times for a class: three for the daring classmate's time plus half a second, two for a slower careful one's (0.35 s) plus one second, so every careful player earns two. */
export function starTargets(seed: number, level: number, mode: Mode = "n", old = false): Targets {
  const klass = makeClass(seed, level, mode, old);
  const three = carefulRun(klass, REACTION, true).tenths + 5;
  return { three, two: Math.max(three + 10, carefulRun(klass, SLOW_REACTION).tenths + 10) };
}
