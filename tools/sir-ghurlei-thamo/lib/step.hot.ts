// The per-step rules: 60 times a second on a cheap phone, so it mutates the game in place and allocates nothing.
// With an old-ladder class (no watcher, no lights, no sleepers) this is the old stepGame exactly, so old links replay the same
// (tests/levels.test.ts plays both side by side).
import { AWAY, BY_TEACHER, BY_WATCHER, DARK, DIM, FAKE_KIND, FLICK, LAST, LIT, LOOK, W_LOOK, W_TELL, WARN_KIND, WIPE, WRITE, type Game } from "./class";
import { SCOLD, THROW_TIME } from "./levels";

const THROW_SPEED = 2 / THROW_TIME;
/** A stop this close to being seen counts as "অল্পের জন্য". */
export const CLOSE = 0.35;

const nextSeg = (count: number, loopFrom: number, seg: number) => (seg + 1 < count ? seg + 1 : loopFrom);

/** Seconds until a moving chit would be seen (0: it is now), from what the class shows. Writes watched and dangerIn. */
export function lookAround(g: Game) {
  const k = g.klass, kind = k.kinds[g.seg], rem = k.durs[g.seg] - g.segT, grace = k.grace;
  let teacher = Infinity;
  if (kind === LOOK) teacher = g.segT >= grace ? 0 : grace - g.segT;
  else if (WARN_KIND[kind]) teacher = rem + grace;
  // The duster's last stroke is visible: the quick turn comes right after it.
  else if (kind === WIPE) teacher = rem + k.durs[nextSeg(k.kinds.length, k.loopFrom, g.seg)] + grace;
  if (teacher < Infinity && k.dKinds.length > 0) {
    const light = k.dKinds[g.dSeg], drem = k.dDurs[g.dSeg] - g.dT;
    const lit = light === DIM ? 0 : light === LIT ? (g.dT >= grace ? 0 : grace - g.dT) : light === FLICK ? drem + grace : Infinity;
    teacher = lit > teacher ? lit : teacher;
  }
  let watcher = Infinity;
  if (k.wKinds.length > 0) {
    const w = k.wKinds[g.wSeg];
    if (w === W_LOOK) watcher = g.wT >= grace ? 0 : grace - g.wT;
    else if (w === W_TELL) watcher = k.wDurs[g.wSeg] - g.wT + grace;
  }
  g.dangerIn = teacher < watcher ? teacher : watcher;
  g.watched = g.dangerIn <= 0;
  return g.dangerIn;
}

function caught(g: Game) {
  const k = g.klass;
  g.catches++;
  g.scold = SCOLD;
  g.scoldBy = lookAroundBy(g);
  g.backFrom = g.pos;
  let back = g.throwing ? g.throwFrom - k.back : Math.floor(g.pos + 1e-9) - k.back;
  if (back > k.from && k.sleeper[back]) back--;
  g.backTo = back < k.from ? k.from : back;
  g.throwing = false;
  g.needRelease = true;
  g.moving = false;
  if (k.lives > 0 && g.catches >= k.lives) { g.phase = "over"; g.won = false; }
}

/** Who is looking: the teacher, unless only the watcher sees. */
function lookAroundBy(g: Game) {
  const k = g.klass;
  if (k.wKinds.length > 0 && k.wKinds[g.wSeg] === W_LOOK && g.wT >= k.grace && !(k.kinds[g.seg] === LOOK && g.segT >= k.grace)) return BY_WATCHER;
  return BY_TEACHER;
}

/** The scolding is over: the teacher turns back to the board (the rest of that look is skipped) and the watcher looks away. */
function afterScold(g: Game) {
  const k = g.klass, count = k.kinds.length;
  g.seg = nextSeg(count, k.loopFrom, g.seg);
  while (k.kinds[g.seg] !== WRITE) { if (k.kinds[g.seg] === WIPE) g.ink = 0; g.seg = nextSeg(count, k.loopFrom, g.seg); }
  g.segT = 0;
  if (k.wKinds.length > 0 && k.wKinds[g.wSeg] !== AWAY) {
    while (k.wKinds[g.wSeg] !== AWAY) g.wSeg = (g.wSeg + 1) % k.wKinds.length;
    g.wT = 0;
  }
}

/**
 * Advances dt real seconds. `holding` is the finger (or key) on the pass control. Before the first press the teacher just writes;
 * the routine and the clock wait.
 */
export function stepGame(g: Game, holding: boolean, dt: number) {
  const wasMoving = g.moving;
  g.moving = false;
  if (g.phase === "over") return;
  if (!holding) g.needRelease = false;
  if (g.phase === "ready") {
    g.ink += dt;
    if (!holding) { lookAround(g); return; }
    g.phase = "playing";
  }
  g.time += dt;
  const k = g.klass;
  if (g.scold > 0) {
    g.scold = Math.max(0, g.scold - dt);
    // The chit slides back over the first half of the scolding.
    const slide = Math.min(1, (SCOLD - g.scold) / (SCOLD / 2));
    g.pos = g.backFrom + (g.backTo - g.backFrom) * slide;
    if (g.scold === 0) afterScold(g);
    g.watched = false; g.dangerIn = Infinity;
    return;
  }

  g.segT += dt;
  while (g.segT >= k.durs[g.seg]) {
    if (k.kinds[g.seg] === WIPE) g.ink = 0;
    g.segT -= k.durs[g.seg];
    g.seg = nextSeg(k.kinds.length, k.loopFrom, g.seg);
  }
  if (k.wKinds.length > 0) {
    g.wT += dt;
    while (g.wT >= k.wDurs[g.wSeg]) { g.wT -= k.wDurs[g.wSeg]; g.wSeg = (g.wSeg + 1) % k.wKinds.length; }
  }
  if (k.dKinds.length > 0) {
    g.dT += dt;
    while (g.dT >= k.dDurs[g.dSeg]) { g.dT -= k.dDurs[g.dSeg]; g.dSeg = (g.dSeg + 1) % k.dKinds.length; }
  }
  const kind = k.kinds[g.seg];
  if (kind === WRITE) g.ink += dt;
  g.wipe = kind === WIPE ? g.segT / k.durs[g.seg] : 0;
  lookAround(g);

  const wants = g.throwing || (holding && !g.needRelease);
  if (!wants) {
    if (wasMoving && g.dangerIn <= CLOSE) { g.close++; g.closeAt = g.time; }
    return;
  }
  if (g.watched) { caught(g); return; }

  if (g.throwing) {
    g.pos += THROW_SPEED * dt;
    if (g.pos >= g.throwFrom + 2) { g.pos = g.throwFrom + 2; g.throwing = false; g.throws++; }
  } else {
    const bench = Math.floor(g.pos + 1e-9);
    if (k.throwAt[bench] && g.pos - bench < 1e-6) {
      g.throwing = true; g.throwFrom = bench;
      g.pos += THROW_SPEED * dt;
    } else {
      let next = g.pos + k.speed * dt;
      // Walking stops on a bench the chit must be thrown from; the next held step throws.
      if (bench + 1 <= LAST && k.throwAt[bench + 1] && next > bench + 1) next = bench + 1;
      g.pos = next < LAST ? next : LAST;
    }
  }
  g.moving = true;
  if (FAKE_KIND[kind] && g.bravedSeg !== g.seg) { g.braved++; g.bravedSeg = g.seg; }
  if (k.dKinds.length > 0 && kind === LOOK && k.dKinds[g.dSeg] === DARK && g.bravedDark !== g.dSeg) { g.braved++; g.bravedDark = g.dSeg; }
  if (g.pos >= LAST) { g.pos = LAST; g.phase = "over"; g.won = true; }
}
