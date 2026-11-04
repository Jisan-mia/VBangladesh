// One frame of the board: the cached maze, gates and keys, the pencil line, the walker, a ride's arc, the lantern's fog and
// the edge pointer. Runs every animation frame, so it allocates nothing: every buffer is made in art.ts's buildLayers.
import { DX, DY, SIDE, type Dir } from "./board";
import { THEMES, drawGate, wallWidth, type Layers } from "./art";
import type { Game } from "./game";
import { walkerAt } from "./step.hot";

const DASH = [3, 5], SOLID: number[] = [];
const pos = new Float64Array(2);

/** The viewport onto the board: its side in CSS px, and the camera's top-left corner in board px. */
export type View = { side: number; camX: number; camY: number };
/** Per-frame inputs: the time (for bobs and flicker), slow mode, and the easy hint's side (0–3, or -1). */
export type Frame = { time: number; slow: boolean; hint: number };

const cx = (layers: Layers, size: number, col: number) => wallWidth(layers.cell) / 2 + col * layers.cell + layers.cell / 2;

/** Keeps the walker in view on a board bigger than the screen: slides there, or jumps with `snap`. */
export function follow(view: View, layers: Layers, game: Game, dt: number, snap: boolean) {
  const spare = layers.px - view.side;
  if (spare <= 0) { view.camX = view.camY = spare / 2; return; }
  walkerAt(game, pos);
  const size = game.board.size, x = cx(layers, size, pos[0]), y = cx(layers, size, pos[1]);
  const goalX = Math.max(0, Math.min(spare, x - view.side / 2)), goalY = Math.max(0, Math.min(spare, y - view.side / 2));
  const k = snap ? 1 : Math.min(1, dt * 7);
  view.camX += (goalX - view.camX) * k;
  view.camY += (goalY - view.camY) * k;
}

function gates(c: CanvasRenderingContext2D, layers: Layers, game: Game, slow: boolean) {
  const { board } = game, { gateList, cell } = layers, size = board.size;
  for (let i = 0; i < gateList.length; i += 2) {
    const at = gateList[i], dir = gateList[i + 1] as Dir, colour = board.gate[at * 4 + SIDE[dir]];
    const open = (game.mask & colour) !== 0;
    const swing = !open ? 0 : game.opened === colour && game.openAge < 0.35 && !slow ? game.openAge / 0.35 : 1;
    const x = cx(layers, size, at % size) + DX[dir] * cell / 2, y = cx(layers, size, Math.floor(at / size)) + DY[dir] * cell / 2;
    drawGate(c, x, y, cell, colour, DX[dir] !== 0, swing);
  }
}

function keys(c: CanvasRenderingContext2D, layers: Layers, game: Game, frame: Frame, overFog: boolean) {
  const { board } = game, size = board.size, cell = layers.cell;
  for (let i = 0; i < layers.keyCells.length; i++) {
    const at = layers.keyCells[i], colour = board.key[at];
    if (game.mask & colour) continue;
    const x = cx(layers, size, at % size), y = cx(layers, size, Math.floor(at / size));
    if (overFog) {
      // A glint through the dark, so a key is never lost for good.
      if (game.lit[at]) continue;
      c.globalAlpha = frame.slow ? 0.7 : 0.45 + 0.35 * Math.sin(frame.time * 4 + i);
      c.fillStyle = "#ffe08a";
      c.beginPath(); c.arc(x, y, cell * 0.12, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1;
      continue;
    }
    const bob = frame.slow ? 0 : Math.sin(frame.time * 3 + i) * cell * 0.05;
    c.drawImage(layers.keys[colour - 1], x - cell / 2, y - cell / 2 + bob, cell, cell);
  }
}

function pencil(c: CanvasRenderingContext2D, layers: Layers, game: Game, tipX: number, tipY: number) {
  const size = game.board.size, trail = game.trail, cell = layers.cell;
  c.strokeStyle = THEMES[game.board.world].trail; c.lineWidth = Math.max(4, cell * 0.3); c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath();
  c.moveTo(cx(layers, size, trail[0] % size), cx(layers, size, Math.floor(trail[0] / size)));
  for (let i = 1; i < game.trailLen; i++) {
    const from = trail[i - 1], to = trail[i], step = from > to ? from - to : to - from;
    const x = cx(layers, size, to % size), y = cx(layers, size, Math.floor(to / size));
    if (step === size || (step === 1 && Math.floor(from / size) === Math.floor(to / size))) c.lineTo(x, y); else c.moveTo(x, y);
  }
  if (game.ride <= 0) c.lineTo(tipX, tipY);
  c.stroke();
}

function walker(c: CanvasRenderingContext2D, layers: Layers, game: Game, x: number, y: number, frame: Frame) {
  const cell = layers.cell, r = Math.max(7, cell * 0.33);
  const bump = game.bumpAge > 0 && !frame.slow ? Math.sin((1 - game.bumpAge / 0.2) * Math.PI) : 0;
  const pop = game.ride > 0 && !frame.slow ? 1 + Math.sin((1 - game.ride / 0.35) * Math.PI) * 0.25 : 1;
  const bx = x + DX[game.bumpDir] * bump * cell * 0.16, by = y + DY[game.bumpDir] * bump * cell * 0.16;
  const lookX = DX[game.heading], lookY = DY[game.heading];
  const sx = (1 + bump * 0.2 * Math.abs(lookY) - bump * 0.14 * Math.abs(lookX)) * pop, sy = (1 + bump * 0.2 * Math.abs(lookX) - bump * 0.14 * Math.abs(lookY)) * pop;
  c.fillStyle = "#e4572e";
  c.beginPath(); c.ellipse(bx, by, r * sx, r * sy, 0, 0, Math.PI * 2); c.fill();
  c.lineWidth = Math.max(2, r * 0.22); c.strokeStyle = "#fffaf0"; c.stroke();
  const ex = bx + lookX * r * 0.3, ey = by + lookY * r * 0.3, px = -lookY * r * 0.36, py = lookX * r * 0.36, eye = Math.max(1.6, r * 0.17);
  c.fillStyle = "#2b2118";
  c.beginPath(); c.arc(ex + px, ey + py, eye, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(ex - px, ey - py, eye, 0, Math.PI * 2); c.fill();
}

/** The easy mode's glow: a pulsing chevron beside the walker on the side that leads to the shop. */
function hint(c: CanvasRenderingContext2D, layers: Layers, x: number, y: number, side: number, frame: Frame) {
  const dir = (1 << side) as Dir, cell = layers.cell, reach = cell * (0.62 + (frame.slow ? 0 : Math.sin(frame.time * 6) * 0.06));
  const hx = x + DX[dir] * reach, hy = y + DY[dir] * reach, s = cell * 0.2;
  c.strokeStyle = "#f2a900"; c.lineWidth = Math.max(3, cell * 0.11); c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath();
  c.moveTo(hx - DX[dir] * s - DY[dir] * s, hy - DY[dir] * s + DX[dir] * s);
  c.lineTo(hx, hy);
  c.lineTo(hx - DX[dir] * s + DY[dir] * s, hy - DY[dir] * s - DX[dir] * s);
  c.stroke();
}

/** Lanes the lantern has shown stay faintly lit: carve them into the memory layer as they're first seen. */
function remember(layers: Layers, game: Game) {
  const memory = layers.memoryContext;
  if (!memory) return;
  const { size } = game.board, cell = layers.cell, wall = wallWidth(cell);
  for (let at = 0; at < game.lit.length; at++) {
    if (!game.lit[at] || layers.drawnLit[at]) continue;
    layers.drawnLit[at] = 1;
    const x = (at % size) * cell, y = Math.floor(at / size) * cell;
    memory.clearRect(x, y, cell + wall, cell + wall);
    memory.globalAlpha = 0.55;
    memory.fillRect(x, y, cell + wall, cell + wall);
    memory.globalAlpha = 1;
  }
}

function fog(c: CanvasRenderingContext2D, layers: Layers, game: Game, x: number, y: number, frame: Frame) {
  const f = layers.fogContext, lantern = layers.lantern;
  if (!f || !layers.memory || !layers.fog || !lantern) return;
  remember(layers, game);
  const px = layers.px, radius = (game.dark + 0.6) * layers.cell * (frame.slow ? 1 : 1 + Math.sin(frame.time * 9) * 0.025);
  f.globalCompositeOperation = "copy";
  f.drawImage(layers.memory, 0, 0, px, px);
  f.globalCompositeOperation = "destination-out";
  f.drawImage(lantern, x - radius, y - radius, radius * 2, radius * 2);
  f.globalCompositeOperation = "source-over";
  c.drawImage(layers.fog, 0, 0, px, px);
  const exit = game.board.exit, size = game.board.size, g = layers.cell * 1.3;
  if (layers.glow) c.drawImage(layers.glow, cx(layers, size, exit % size) - g, cx(layers, size, Math.floor(exit / size)) - g, g * 2, g * 2);
}

function rideArc(c: CanvasRenderingContext2D, layers: Layers, game: Game) {
  const size = game.board.size, from = game.rideFrom, to = game.at;
  const x0 = cx(layers, size, from % size), y0 = cx(layers, size, Math.floor(from / size)), x1 = cx(layers, size, to % size), y1 = cx(layers, size, Math.floor(to / size));
  c.globalAlpha = Math.min(1, game.ride / 0.35 + 0.2);
  c.strokeStyle = "#2b2118"; c.lineWidth = Math.max(2, layers.cell * 0.08);
  c.setLineDash(DASH);
  c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - layers.cell * 1.5, x1, y1); c.stroke();
  c.setLineDash(SOLID);
  c.globalAlpha = 1;
}

/** A small arrow on the viewport's edge pointing at the shop, when the board pans and the shop is out of view. */
function pointer(c: CanvasRenderingContext2D, layers: Layers, game: Game, view: View) {
  const size = game.board.size, exit = game.board.exit;
  const x = cx(layers, size, exit % size) - view.camX, y = cx(layers, size, Math.floor(exit / size)) - view.camY, side = view.side, pad = 14;
  if (x >= 0 && x <= side && y >= 0 && y <= side) return;
  const px = Math.max(pad, Math.min(side - pad, x)), py = Math.max(pad, Math.min(side - pad, y)), angle = Math.atan2(y - py, x - px);
  c.save();
  c.translate(px, py); c.rotate(angle);
  c.fillStyle = "#d8342b";
  c.beginPath(); c.moveTo(10, 0); c.lineTo(-6, -8); c.lineTo(-6, 8); c.closePath(); c.fill();
  c.restore();
}

export function drawFrame(c: CanvasRenderingContext2D, layers: Layers, game: Game, view: View, frame: Frame) {
  const theme = THEMES[game.board.world];
  c.fillStyle = theme.floor;
  c.fillRect(0, 0, view.side, view.side);
  c.save();
  c.translate(-view.camX, -view.camY);
  c.drawImage(layers.maze, 0, 0, layers.px, layers.px);
  gates(c, layers, game, frame.slow);
  keys(c, layers, game, frame, false);
  walkerAt(game, pos);
  const size = game.board.size, x = cx(layers, size, pos[0]), y = cx(layers, size, pos[1]);
  pencil(c, layers, game, x, y);
  if (game.ride > 0) rideArc(c, layers, game);
  if (frame.hint >= 0) hint(c, layers, x, y, frame.hint, frame);
  walker(c, layers, game, x, y, frame);
  if (game.dark > 0) { fog(c, layers, game, x, y, frame); keys(c, layers, game, frame, true); }
  c.restore();
  pointer(c, layers, game, view);
}
