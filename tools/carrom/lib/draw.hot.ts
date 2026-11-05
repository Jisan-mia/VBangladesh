// One frame of the board: the pre-rendered board, the discs from their sprites, pocket rings, the aim guide and the pops.
// Runs every animation frame: no object or array literals, closures, `new` or string building here (npm run lint:games).
import { traceAim, TRACE, T_COIN_END, T_DISC, T_FOUL, T_NX, T_NY, T_POCKET, T_POINTS, T_XY } from "./physics.hot";
import { BOARD, COUNT, POCKET_X, POCKET_Y, QUEEN, RAIL, STRIKER, TOTAL } from "./table";
import { BOUNCES, LOOK } from "./guide";
import type { Game } from "./game";
import type { View } from "./view";

const TAU = Math.PI * 2;
const FALL_TIME = 0.32;
/** A bounce that touches nothing draws only this much after the cushion (mm). */
const STUB = 140;
export const POP_TIME = 0.9;
const SPRITE_PAD = 1.25;
const DASH = [7, 7];
const DOTS = [2, 9];
const SOLID: number[] = [];
const INK = "rgba(36,20,10,.72)";
const INK_SOLID = "#24140a";
const GLOW = "#fff1c4";
const GOLD = "#f2b630";
const GREEN = "#2f8f5b";
const AMBER = "#e0a020";
const RED = "#d0412f";
const FONT_POP = '800 40px "Display", "Bangla"';
/** +১ for a coin, কুইন! +৩ (দশ চাল), ফাউল!, কুইন! (a board or two players), কালো! (a black on a board). */
export const POP_TEXT = ["+১", "কুইন! +৩", "ফাউল!", "কুইন!", "কালো!"];
const POP_FILL = ["#fff3d6", "#ffd36b", "#ff9a8a", "#ffd36b", "#cfc6bd"];

/** 0 white, 1 black, 2 queen, 3 striker: the sprite to use. */
export const kindOf = (i: number) => i < 9 ? 0 : i < 18 ? 1 : i === QUEEN ? 2 : 3;

let flip = false;
const X = (x: number) => flip ? BOARD - x : x;
const Y = (y: number) => flip ? BOARD - y : y;

function sprite(v: View, c: CanvasRenderingContext2D, kind: number, x: number, y: number, r: number) {
  const s = v.sprites[kind];
  if (!s) return;
  const half = r * SPRITE_PAD;
  c.drawImage(s, x - half, y - half, half * 2, half * 2);
}

function arrowHead(c: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, size: number) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x - dx * size - dy * size * 0.6, y - dy * size + dx * size * 0.6);
  c.lineTo(x - dx * size + dy * size * 0.6, y - dy * size - dx * size * 0.6);
  c.closePath();
  c.fill();
}

/** The colour of the power ring: inside the pot's window green, under it amber, over it (the striker follows) red. */
function ringColour(v: View, power: number) {
  if (v.hi > 0) return power < v.lo ? AMBER : power > v.hi ? RED : GREEN;
  return power < 0.45 ? GREEN : power < 0.8 ? AMBER : RED;
}

function drawAim(v: View, c: CanvasRenderingContext2D, g: Game) {
  const w = g.world, r = w.r[STRIKER];
  const sx = X(w.x[STRIKER]), sy = Y(w.y[STRIKER]);
  // In the shooter's view the shot always goes up the screen; the board is drawn turned round for the top player.
  const dx = Math.sin(v.aim), dy = -Math.cos(v.aim);
  const look = LOOK[v.hand];

  if (v.demo) {
    // The ghost finger: a pull straight back from the aim, the length of a good strike.
    const t = v.calm ? 0.75 : (v.clock % 1.8) / 1.8, reach = 30 + 120 * Math.min(1, t * 1.4);
    c.strokeStyle = "rgba(255,248,232,.85)"; c.lineWidth = 4; c.setLineDash(DASH);
    c.beginPath(); c.moveTo(sx - dx * (r + 4), sy - dy * (r + 4)); c.lineTo(sx - dx * reach, sy - dy * reach); c.stroke();
    c.setLineDash(SOLID);
    c.fillStyle = "rgba(255,248,232,.92)";
    c.beginPath(); c.arc(sx - dx * reach, sy - dy * reach, 10, 0, TAU); c.fill();
  }

  if (v.power > 0) {
    const back = r + 10 + v.power * 150;
    c.strokeStyle = "rgba(36,20,10,.55)"; c.lineWidth = 7; c.lineCap = "round";
    c.beginPath(); c.moveTo(sx - dx * r, sy - dy * r); c.lineTo(sx - dx * back, sy - dy * back); c.stroke();
    c.lineCap = "butt";
    c.strokeStyle = ringColour(v, v.power); c.lineWidth = 5;
    c.beginPath(); c.arc(sx, sy, r + 7, -Math.PI / 2, -Math.PI / 2 + v.power * TAU); c.stroke();
  } else {
    // The power a tap on মারো will use, faint.
    c.globalAlpha = 0.4;
    c.strokeStyle = ringColour(v, v.restPower); c.lineWidth = 4;
    c.beginPath(); c.arc(sx, sy, r + 7, -Math.PI / 2, -Math.PI / 2 + v.restPower * TAU); c.stroke();
    c.globalAlpha = 1;
  }

  c.fillStyle = INK; c.strokeStyle = INK;
  if (!look.path) {
    c.lineWidth = 3.5;
    c.beginPath(); c.moveTo(sx + dx * (r + 4), sy + dy * (r + 4)); c.lineTo(sx + dx * (r + 58), sy + dy * (r + 58)); c.stroke();
    arrowHead(c, sx + dx * (r + 72), sy + dy * (r + 72), dx, dy, 15);
    return;
  }
  const wdx = v.flip ? -dx : dx, wdy = v.flip ? -dy : dy;
  traceAim(w, w.x[STRIKER], w.y[STRIKER], wdx, wdy, r, BOUNCES[v.hand]);
  const points = TRACE[T_POINTS], disc = TRACE[T_DISC];
  if (points === 3 && disc < 0) {
    // A bounce that touches nothing: only a short stub after the cushion, so the line never doubles back over itself.
    const ax = TRACE[T_XY + 2], ay = TRACE[T_XY + 3], bx = TRACE[T_XY + 4] - ax, by = TRACE[T_XY + 5] - ay, length = Math.sqrt(bx * bx + by * by);
    if (length > STUB) { TRACE[T_XY + 4] = ax + (bx / length) * STUB; TRACE[T_XY + 5] = ay + (by / length) * STUB; }
  }
  c.lineWidth = 4; c.lineCap = "round"; c.setLineDash(DOTS);
  c.beginPath();
  c.moveTo(sx + dx * (r + 4), sy + dy * (r + 4));
  for (let k = 1; k < points; k++) c.lineTo(X(TRACE[T_XY + k * 2]), Y(TRACE[T_XY + k * 2 + 1]));
  c.stroke();
  c.lineCap = "butt";
  const hx = X(TRACE[T_XY + (points - 1) * 2]), hy = Y(TRACE[T_XY + (points - 1) * 2 + 1]);
  if (TRACE[T_FOUL]) {
    // The striker itself would drop: a red cross at the pocket.
    c.setLineDash(SOLID); c.strokeStyle = RED; c.lineWidth = 5;
    c.beginPath(); c.moveTo(hx - 12, hy - 12); c.lineTo(hx + 12, hy + 12); c.moveTo(hx + 12, hy - 12); c.lineTo(hx - 12, hy + 12); c.stroke();
    return;
  }
  if (disc < 0) { c.setLineDash(SOLID); return; }
  c.lineWidth = 2.5; c.setLineDash(DASH);
  c.beginPath(); c.arc(hx, hy, r, 0, TAU); c.stroke();
  c.setLineDash(SOLID);
  const cx = X(w.x[disc]), cy = Y(w.y[disc]);
  const nx = v.flip ? -TRACE[T_NX] : TRACE[T_NX], ny = v.flip ? -TRACE[T_NY] : TRACE[T_NY];
  const into = TRACE[T_POCKET];
  const reach = look.coin === "pocket" ? Math.max(40, TRACE[T_COIN_END]) : 86;
  const sure = look.coin === "pocket" && into >= 0;
  for (let pass = 0; pass < 2; pass++) {
    c.strokeStyle = pass ? (sure ? GOLD : GLOW) : INK_SOLID;
    c.fillStyle = c.strokeStyle;
    c.lineWidth = pass ? 3.5 : 7.5;
    c.beginPath(); c.moveTo(cx + nx * 19, cy + ny * 19); c.lineTo(cx + nx * reach, cy + ny * reach); c.stroke();
    arrowHead(c, cx + nx * (reach + (pass ? 13 : 16)), cy + ny * (reach + (pass ? 13 : 16)), nx, ny, pass ? 13 : 17);
  }
  if (sure) {
    c.strokeStyle = GOLD; c.lineWidth = 4;
    c.beginPath(); c.arc(X(POCKET_X[into]), Y(POCKET_Y[into]), 30, 0, TAU); c.stroke();
  }
}

/** Draws one frame. `aiming` is true while a strike may be aimed (the guide shows). */
export function drawFrame(v: View, g: Game) {
  const c = v.context, background = v.background;
  if (!c || !background) return;
  const w = g.world, t = v.clock;
  flip = v.flip;
  c.save();
  c.scale(v.scale, v.scale);
  const shook = t - v.shakeAt;
  if (!v.calm && shook >= 0 && shook < 0.28) c.translate(Math.sin(shook * 70) * 6 * (1 - shook / 0.28), 0);
  c.drawImage(background, 0, 0, TOTAL, TOTAL);
  c.translate(RAIL, RAIL);

  for (let p = 0; p < 4; p++) {
    const since = t - v.popAt[p];
    if (since < 0 || since > POP_TIME) continue;
    const k = since / POP_TIME;
    c.globalAlpha = 1 - k;
    c.strokeStyle = v.popKind[p] === 2 ? "#ff8a7a" : "#fff3d6"; c.lineWidth = 4;
    c.beginPath(); c.arc(X(POCKET_X[p]), Y(POCKET_Y[p]), 26 + (v.calm ? 6 : k * 34), 0, TAU); c.stroke();
    c.globalAlpha = 1;
  }

  for (let i = 0; i < COUNT; i++) {
    if (w.on[i]) {
      if (i === STRIKER && g.phase === "over") continue;
      sprite(v, c, kindOf(i), X(w.x[i]), Y(w.y[i]), w.r[i]);
      continue;
    }
    const since = t - v.fallAt[i], p = w.pocket[i];
    if (since < 0 || since > FALL_TIME || p < 0) continue;
    const k = since / FALL_TIME;
    c.globalAlpha = 1 - k;
    sprite(v, c, kindOf(i), X(w.x[i] + (POCKET_X[p] - w.x[i]) * k), Y(w.y[i] + (POCKET_Y[p] - w.y[i]) * k), w.r[i] * (1 - 0.45 * k));
    c.globalAlpha = 1;
  }

  if (v.aiming && g.phase === "aim") {
    if (v.blocked) {
      c.strokeStyle = RED; c.lineWidth = 4;
      c.beginPath(); c.arc(X(w.x[STRIKER]), Y(w.y[STRIKER]), w.r[STRIKER] + 4, 0, TAU); c.stroke();
    }
    drawAim(v, c, g);
  }

  c.font = FONT_POP; c.textAlign = "center"; c.lineJoin = "round";
  for (let p = 0; p < 4; p++) {
    const since = t - v.popAt[p], kind = v.popKind[p];
    if (since < 0 || since > POP_TIME || (kind === 0 && g.mode === "duo")) continue;
    const px = X(POCKET_X[p]), py = Y(POCKET_Y[p]), lift = v.calm ? 0 : since * 30;
    const tx = px + (px < BOARD / 2 ? 80 : -80), ty = py + (py < BOARD / 2 ? 92 - lift : -66 - lift);
    c.globalAlpha = since < 0.6 ? 1 : 1 - (since - 0.6) / (POP_TIME - 0.6);
    c.lineWidth = 7; c.strokeStyle = "#2a1a10"; c.strokeText(POP_TEXT[kind], tx, ty);
    c.fillStyle = POP_FILL[kind];
    c.fillText(POP_TEXT[kind], tx, ty);
    c.globalAlpha = 1;
  }
  c.restore();
}
