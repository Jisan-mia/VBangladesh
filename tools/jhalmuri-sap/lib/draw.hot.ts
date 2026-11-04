// The per-frame drawing: copy the pre-painted board, then food, crows, the gate, the snake easing between cells, juice, the dark
// and the danger rim. Allocation-free: no literals, closures or string building in here; everything comes from the View.
import { BONUS_LIFE } from "./rules";
import { CELLS, COLS } from "./levels";
import { CROW_LEFT, CROW_RIGHT } from "./board";
import { palette, drawHead } from "./art";
import { Look, PARTICLES, type View } from "./view";
import { deadAhead, gateWarning } from "./step.hot";
import type { Game } from "./game";

const HUES = ["#e7a91f", "#f4c534", "#e0533e", "#fdf6e1"] as const;
const FOOD_FRAME: Record<string, number> = { muri: 0, chanachur: 1, peyaj: 2, morich: 3, tetul: 4 };
const TAU = Math.PI * 2;

const cx = (view: View, cell: number) => view.fence + (cell % COLS + 0.5) * view.cell;
const cy = (view: View, cell: number) => view.fence + (Math.floor(cell / COLS) + 0.5) * view.cell;
/** Two cells next to each other (a pipe jump is not). */
const beside = (a: number, b: number) => a === b || Math.abs(a - b) === COLS || (Math.abs(a - b) === 1 && Math.floor(a / COLS) === Math.floor(b / COLS));

function noise(view: View) {
  view.noise = (Math.imul(view.noise, 1103515245) + 12345) >>> 0;
  return (view.noise >>> 8) / 16777216;
}

/** A spray of crumbs from (x, y); none in ধীরে খেলো. */
export function burst(view: View, x: number, y: number, count: number, hue: number) {
  if (view.calm) return;
  for (let i = 0, made = 0; i < PARTICLES && made < count; i++) {
    if (view.life[i] > 0) continue;
    view.px[i] = x; view.py[i] = y; view.hue[i] = hue;
    view.vx[i] = (noise(view) - 0.5) * view.cell * 9; view.vy[i] = -(0.4 + noise(view)) * view.cell * 6;
    view.life[i] = 0.45; made++;
  }
}

export function moveParticles(view: View, dt: number) {
  for (let i = 0; i < PARTICLES; i++) {
    if (view.life[i] <= 0) continue;
    view.px[i] += view.vx[i] * dt; view.py[i] += view.vy[i] * dt; view.vy[i] += view.cell * 30 * dt; view.life[i] -= dt;
  }
}

/** Remember the body and the crows before a move, so the frame can ease from there. */
export function beforeMove(view: View, game: Game) {
  for (let i = 0; i < game.length; i++) view.prev[i] = game.ring[(game.head + i) % CELLS];
  view.prevLength = game.length;
  for (let i = 0; i < game.crows; i++) view.crowPrev[i] = game.crowAt[i];
}

export function resetMotion(view: View, game: Game) {
  view.acc = 0; view.prevLength = 0; view.dangerSince = -1;
  view.bulges.fill(-1); view.life.fill(0);
  for (let i = 0; i < game.crows; i++) view.crowPrev[i] = game.crowAt[i];
}

function drawGate(view: View, c: CanvasRenderingContext2D, game: Game, now: number) {
  const warn = gateWarning(game), shut = game.gateShut, cell = view.cell;
  if (!shut && !warn) return;
  const blink = view.calm ? 1 : 0.5 + 0.5 * Math.sin(now / 90);
  for (let i = 0; i < CELLS; i++) {
    if (game.gateCell[i] !== 1) continue;
    const x = cx(view, i) - cell / 2, y = cy(view, i) - cell * 0.32;
    c.globalAlpha = shut ? 1 : 0.28 + 0.3 * blink;
    c.fillStyle = "#f5f1e6"; c.fillRect(x, y, cell, cell * 0.64);
    c.fillStyle = palette.chilli;
    c.fillRect(x + cell * 0.08, y, cell * 0.34, cell * 0.64); c.fillRect(x + cell * 0.58, y, cell * 0.34, cell * 0.64);
    c.globalAlpha = 1;
    c.strokeStyle = "#2a1d14"; c.lineWidth = 1.5; c.strokeRect(x + 0.75, y + 0.75, cell - 1.5, cell * 0.64 - 1.5);
  }
}

/** The two lamps at the gate's ends: green while open, blinking red before it shuts, steady red while shut. */
function drawLamps(view: View, c: CanvasRenderingContext2D, game: Game, now: number, first: number, last: number) {
  const warn = gateWarning(game), on = game.gateShut || (warn && (view.calm || Math.sin(now / 110) > 0));
  c.fillStyle = on ? "#ff3b2f" : warn ? "#5a1a14" : "#3fb950";
  c.strokeStyle = "#1b1712"; c.lineWidth = 1.5;
  for (let k = 0; k < 2; k++) {
    const at = k ? last : first;
    c.beginPath(); c.arc(cx(view, at) + (k ? 0.5 : -0.5) * view.cell, cy(view, at) - view.cell * 0.5, view.cell * 0.2, 0, TAU); c.fill(); c.stroke();
  }
}

export function drawFrame(view: View, game: Game, now: number) {
  const c = view.context, atlas = view.atlas, background = view.background;
  if (!c || !atlas || !background) return;
  const { width, height, cell, sprite } = view, calm = view.calm, look = view.look;
  const playing = look === Look.Playing;
  c.save();
  if (now < view.shakeUntil) c.translate(Math.sin(now * 0.09) * 4 * (view.shakeUntil - now) / 260, 0);
  c.drawImage(background, 0, 0, width, height);
  const half = cell / 2;

  if (game.gatePeriod) {
    drawGate(view, c, game, now);
    let first = -1, last = -1;
    for (let i = 0; i < CELLS; i++) if (game.gateCell[i] === 1) { if (first < 0) first = i; last = i; }
    drawLamps(view, c, game, now, first, last);
  }
  if (game.food >= 0) c.drawImage(atlas, FOOD_FRAME[game.kind] * sprite, 0, sprite, sprite, cx(view, game.food) - half, cy(view, game.food) - half, cell, cell);
  if (game.bonus >= 0) {
    const bx = cx(view, game.bonus), by = cy(view, game.bonus), grow = calm ? 1 : 1 + 0.07 * Math.sin(now / 240);
    c.drawImage(atlas, 5 * sprite, 0, sprite, sprite, bx - half * grow, by - half * grow, cell * grow, cell * grow);
    c.strokeStyle = "#b07d00"; c.lineWidth = Math.max(2, cell * 0.08); c.lineCap = "round";
    c.beginPath(); c.arc(bx, by, cell * 0.5, -Math.PI / 2, -Math.PI / 2 + TAU * game.bonusLife / BONUS_LIFE); c.stroke();
  }

  // Ease between cells: the fraction of the current move already done.
  const t = playing ? Math.max(0, Math.min(1, view.acc / view.every)) : 1;
  const ease = t * t * (3 - 2 * t);

  for (let i = 0; i < game.crows; i++) {
    const from = view.crowPrev[i], to = game.crowAt[i], u = from === to ? 1 : ease;
    const x = cx(view, from) + (cx(view, to) - cx(view, from)) * u;
    const hop = calm || from === to ? 0 : Math.sin(u * Math.PI) * cell * 0.22;
    const y = cy(view, from) + (cy(view, to) - cy(view, from)) * u - hop - (calm ? 0 : Math.abs(Math.sin(now / 300 + i)) * cell * 0.04);
    const sign = game.crowTo[i] >= game.crowFrom[i] ? game.crowWay[i] : -game.crowWay[i];
    c.drawImage(atlas, (sign > 0 ? CROW_RIGHT : CROW_LEFT) * sprite, 0, sprite, sprite, x - half * 1.1, y - half * 1.1, cell * 1.1, cell * 1.1);
  }

  // The snake: each segment eases from where it was; a pipe jump breaks the line instead of drawing across the board.
  const length = game.length, points = view.points;
  for (let i = 0; i < length; i++) {
    const to = game.ring[(game.head + i) % CELLS], from = i < view.prevLength ? view.prev[i] : to;
    const u = beside(from, to) ? ease : 1;
    let x = cx(view, from) + (cx(view, to) - cx(view, from)) * u;
    const y = cy(view, from) + (cy(view, to) - cy(view, from)) * u;
    if (look === Look.Title && !calm) x += Math.sin(now / 260 + i * 1.4) * cell * 0.09;
    points[i * 2] = x; points[i * 2 + 1] = y;
  }
  const hot = game.hot > 0;
  c.lineCap = "round"; c.lineJoin = "round";
  for (let pass = 0; pass < 2; pass++) {
    c.beginPath(); c.moveTo(points[0], points[1]);
    for (let i = 1; i < length; i++) {
      const a = game.ring[(game.head + i - 1) % CELLS], b = game.ring[(game.head + i) % CELLS];
      if (beside(a, b)) c.lineTo(points[i * 2], points[i * 2 + 1]); else c.moveTo(points[i * 2], points[i * 2 + 1]);
    }
    c.lineWidth = cell * (pass ? 0.68 : 0.86);
    c.strokeStyle = pass ? (hot ? view.colors.snakeHot : palette.snake) : palette.snakeEdge;
    c.stroke();
    for (let k = 0; k < view.bulges.length; k++) {
      const b = view.bulges[k];
      if (b > 0 && b < length) { c.fillStyle = c.strokeStyle; c.beginPath(); c.arc(points[b * 2], points[b * 2 + 1], cell * (pass ? 0.4 : 0.5), 0, TAU); c.fill(); }
    }
  }
  c.fillStyle = palette.spot;
  c.beginPath();
  for (let i = 1; i < length; i += 2) { c.moveTo(points[i * 2] + cell * 0.12, points[i * 2 + 1]); c.arc(points[i * 2], points[i * 2 + 1], cell * 0.12, 0, TAU); }
  c.fill();

  const crashed = look === Look.Over && !game.won;
  const bump = crashed ? Math.max(0, 1 - (now - view.crashAt) / 220) * cell * 0.16 : 0;
  const angle = (game.dir - 1) * Math.PI / 2;
  const hx = points[0] + Math.cos(angle) * bump, hy = points[1] + Math.sin(angle) * bump;
  drawHead(c, hx, hy, cell * 0.5, angle, crashed || hot, !crashed && now % 1700 < 280);
  if ((crashed || hot) && !calm) {
    // Steam from a too-hot bite; slow loops (about one puff a second) so nothing flickers.
    for (let k = 0; k < 3; k++) {
      const p = (now / 1100 + k / 3) % 1;
      c.globalAlpha = 0.75 * (1 - p);
      c.fillStyle = "#ffffff";
      c.beginPath(); c.arc(hx + (k - 1) * cell * 0.38, hy - cell * 0.55 - p * cell * 1.1, cell * (0.12 + p * 0.14), 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
  }
  for (let i = 0; i < PARTICLES; i++) if (view.life[i] > 0) { c.fillStyle = HUES[view.hue[i]]; c.fillRect(view.px[i] - 2, view.py[i] - 2, 4, 4); }

  if (view.dark) {
    // লোডশেডিং: the dark sheet slides with the head; food and the chilli glow through it, faintly.
    const flicker = calm ? 0 : Math.sin(now / 130) * cell * 0.08;
    c.drawImage(view.dark, hx - width - flicker, hy - height - flicker, width * 2 + flicker * 2, height * 2 + flicker * 2);
    c.globalAlpha = 0.55;
    if (game.food >= 0) c.drawImage(atlas, FOOD_FRAME[game.kind] * sprite, 0, sprite, sprite, cx(view, game.food) - half, cy(view, game.food) - half, cell, cell);
    if (game.bonus >= 0) c.drawImage(atlas, 5 * sprite, 0, sprite, sprite, cx(view, game.bonus) - half, cy(view, game.bonus) - half, cell, cell);
    c.globalAlpha = 1;
  }

  // Danger lives at the edge: the rim glows while the next move would end the run (steady in ধীরে খেলো).
  if (playing && view.danger && deadAhead(game)) {
    if (view.dangerSince < 0) view.dangerSince = now;
    c.globalAlpha = calm ? 0.7 : Math.min(1, (now - view.dangerSince) / 90) * (0.75 + 0.25 * Math.sin(now / 70));
    c.drawImage(view.danger, 0, 0, width, height);
    c.globalAlpha = 1;
  } else view.dangerSince = -1;
  c.restore();
}
