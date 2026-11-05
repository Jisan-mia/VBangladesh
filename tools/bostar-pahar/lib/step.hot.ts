// One fixed step of the game, and the drop. Runs 60 times a second: no allocation here (no literals, closures or strings);
// everything lives in the Game made by rules.ts createGame. The judging matches rules.ts judge() (tests check they agree).
import { MODE_INFO } from "./levels";
import {
  BRUSH, DANGER, DARK_MIN, DARK_SPREAD, DARK_TIME, DROP_TIME, E_CLEAR, E_DANGER, E_DARK, E_DROP, E_GUST, E_GUST_WARN, E_LAND, E_LATE,
  E_LIGHT, E_NEXT, E_OVER, E_PERFECT, E_SLIP, E_TOPPLE, END_TIME, FALL_TIME, filled, GUST_KICK, GUST_MIN, GUST_SPREAD, GUST_WARN, hangSwing,
  HEAVY, JUTE, KICK, MIN_SWING, perfectWindow, placePivot, PONTOON_T, ROCK, SETTLE_TIME, SLIP, SLOW, STRAIGHTEN, SWAY_DAMP, swayOmega, swingX,
  WIDE, type End, type Game,
} from "./rules";

const TAU = 2 * Math.PI;

/** One tap: drop the hanging sack. Returns false when a tap does nothing right now. */
export function tap(game: Game) {
  if ((game.phase !== "ready" && game.phase !== "swing") || game.t < MIN_SWING) return false;
  game.dropX = swingX(game);
  game.phase = "drop";
  game.timer = 0;
  game.started = true;
  game.events |= E_DROP;
  return true;
}

function endWith(game: Game, end: End) {
  game.phase = "end";
  game.end = end;
  game.timer = 0;
  game.events |= end === "clear" ? E_CLEAR : end === "late" ? E_LATE : E_TOPPLE;
}

/** The next sack goes on the hook, and the trolley heads for it. */
function nextSack(game: Game) {
  game.hung++;
  hangSwing(game, game.hung);
  game.pivot = placePivot(game.xs[game.n - 1], game.swing, game.def.roll);
  game.events |= E_NEXT;
}

function land(game: Game, slow: boolean) {
  const n = game.n, top = game.xs[n - 1], base = game.xs[0];
  const sway = n > 1 ? game.sway : 0;
  // Where the sack meets the pile, in the pile's own frame (the truck may have rolled, the pile may have swayed).
  const x = game.dropX - game.truckX - sway, off = x - top, gap = Math.abs(off);
  game.offset = off;
  game.timer = 0;
  if (gap > SLIP || (gap > perfectWindow(slow) && Math.abs(x - base + sway) > game.limit)) {
    game.verdict = gap > SLIP ? "slip" : "lean";
    game.combo = 0;
    // A sack that would tip the pile topples it (the old rules: it just slides off and the run ends).
    if (game.verdict === "lean" && !game.old) { endWith(game, "topple"); return; }
    game.lost++;
    game.phase = "fall";
    game.events |= E_SLIP;
    if (!game.old && n > 1) game.swayV += Math.sign(off) * BRUSH * game.def.sway * MODE_INFO[game.mode].sway;
    if (game.lost <= game.spares) nextSack(game);
    return;
  }
  let placed = x;
  if (gap <= perfectWindow(slow)) {
    const lean = top - base;
    placed = top - Math.sign(lean) * Math.min(Math.abs(lean), STRAIGHTEN);
    game.verdict = "perfect";
    game.perfect++; game.combo++;
    if (game.combo > game.bestCombo) game.bestCombo = game.combo;
    game.events |= E_PERFECT;
  } else {
    game.verdict = gap > WIDE ? "wide" : "good";
    game.combo = 0;
  }
  game.xs[n] = placed;
  game.kinds[n] = game.swing.kind;
  game.n = n + 1;
  game.events |= E_LAND;
  if (!game.old) {
    const heavy = game.def.heavy && game.swing.kind === JUTE ? HEAVY : 1;
    game.swayV += KICK * off * game.def.sway * MODE_INFO[game.mode].sway * heavy * (0.7 + 0.05 * n);
    if (game.verdict === "perfect") game.swayV *= 0.5;
  }
  game.phase = "settle";
  if (!filled(game)) nextSack(game);
}

/** Advances the game by `dt` real seconds (slow mode runs it at SLOW). Sets `game.events`; the caller clears them. */
export function stepGame(game: Game, dt: number, slow = false) {
  if (game.phase === "over") return;
  const h = slow ? dt * SLOW : dt, def = game.def, standing = game.phase !== "end";

  if (game.started && standing) {
    game.time += h;
    if (def.clock > 0) {
      game.left -= h;
      if (game.left <= 0) { game.left = 0; if (game.phase !== "drop" && !filled(game)) { endWith(game, "late"); return; } }
    }
  }

  game.rollT += h;
  let rock = 0;
  if (def.pontoon > 0) {
    const w = TAU / PONTOON_T, s = Math.sin(w * game.rollT);
    game.truckX = def.pontoon * s;
    rock = -def.pontoon * w * w * s;
  }

  if (!game.old && game.n > 1 && standing) {
    const w = swayOmega(game.n);
    const a = -w * w * game.sway - 2 * SWAY_DAMP * w * game.swayV - rock * ROCK;
    game.swayV += a * h;
    game.sway += game.swayV * h;

    if (def.gusts > 0 && game.started) {
      const before = game.gustAt;
      game.gustAt -= h;
      if (before > GUST_WARN && game.gustAt <= GUST_WARN) game.events |= E_GUST_WARN;
      if (game.gustAt <= 0) {
        const storm = def.storm ? 0.55 + 0.11 * (game.n - 1) : 1;
        game.swayV += game.gustSide * def.gusts * GUST_KICK * storm * MODE_INFO[game.mode].sway;
        game.gusted++;
        game.gustHit = game.gustSide;
        game.events |= E_GUST;
        game.gustAt = GUST_MIN + GUST_SPREAD * game.rng();
        game.gustSide = game.rng() < 0.5 ? -1 : 1;
      }
    }
  }

  if (def.dark && game.started && standing) {
    if (game.darkLeft > 0) {
      game.darkLeft -= h;
      if (game.darkLeft <= 0) { game.darkLeft = 0; game.darkAt = DARK_MIN + DARK_SPREAD * game.rng(); game.events |= E_LIGHT; }
    } else {
      game.darkAt -= h;
      if (game.darkAt <= 0) { game.darkLeft = DARK_TIME; game.events |= E_DARK; }
    }
  }

  switch (game.phase) {
    case "ready": case "swing":
      game.t += h;
      break;
    case "drop":
      game.timer += h;
      if (game.timer >= DROP_TIME) land(game, slow);
      break;
    case "settle":
      game.timer += h;
      if (game.timer >= SETTLE_TIME) {
        if (filled(game)) { endWith(game, "clear"); return; }
        game.phase = "swing"; game.t = 0;
      }
      break;
    case "fall":
      game.timer += h;
      if (game.timer >= FALL_TIME) {
        if (game.lost > game.spares) { game.phase = "over"; game.end = "spent"; game.events |= E_OVER; return; }
        game.phase = "swing"; game.t = 0;
      }
      break;
    case "end":
      game.timer += h;
      if (game.end !== null && game.timer >= END_TIME[game.end === "spent" ? "topple" : game.end]) { game.phase = "over"; game.events |= E_OVER; }
      return;
  }

  // The pile's tension, checked every step while it stands.
  if (!game.old && game.n > 1 && game.end === null) {
    const strain = Math.abs(game.xs[game.n - 1] - game.xs[0] + game.sway) / game.limit;
    if (strain > game.peak) game.peak = strain;
    if (strain > 1) { endWith(game, "topple"); return; }
    if (!game.danger && strain > DANGER) { game.danger = true; game.events |= E_DANGER; }
    else if (game.danger && strain < DANGER - 0.08) game.danger = false;
  }
}
