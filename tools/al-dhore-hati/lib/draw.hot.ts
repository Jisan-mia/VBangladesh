// One frame of the board: the paddy sliding by, the ridge, its puddles, goats and bamboo bridge, egrets, wind, rain, the walker and the lantern's dark.
// Runs every frame: no allocation (no literals, closures or template strings in a function here). Board units: 360 wide, `look.bh` tall.
import { PALETTES, skyHeight, TILE, type Palette } from "./art";
import { centreAt, gustAt, MAX_H, safeOffset, steadyAt, W, type Field } from "./field";
import { PH_FELL, PH_SLIP, PH_WALK, SLIP_TIME, STRIDE, type Game } from "./rules";
import type { Look } from "./scene";

const TAU = Math.PI * 2;
const WALKER_SCALE = 1.3;
const LEGS = [-9, -5, 6, 10];
const BANANA = [-0.9, -0.3, 0.4, 1];
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

function drawPond(c: CanvasRenderingContext2D, p: Palette, x: number, y: number, r: number, clock: number, calm: boolean, flip: boolean) {
  c.fillStyle = p.grass; c.beginPath(); c.ellipse(x, y, r * 1.25 + 4, r * 0.85 + 4, 0, 0, TAU); c.fill();
  c.fillStyle = p.water; c.beginPath(); c.ellipse(x, y, r * 1.25, r * 0.85, 0, 0, TAU); c.fill();
  c.strokeStyle = p.waterRim; c.lineWidth = 1.2;
  const ripple = calm ? 0.5 : (clock * 0.5) % 1;
  c.globalAlpha = 1 - ripple; c.beginPath(); c.ellipse(x + (flip ? -6 : 6), y - 3, 4 + ripple * 10, 2 + ripple * 5, 0, 0, TAU); c.stroke(); c.globalAlpha = 1;
  c.fillStyle = "#4f9a4a";
  c.beginPath(); c.arc(x - r * 0.5, y + r * 0.2, 4, 0.3, TAU - 0.3); c.fill();
  c.beginPath(); c.arc(x + r * 0.3, y + r * 0.45, 3, 0.4, TAU - 0.4); c.fill();
  c.fillStyle = "#b9a78f"; c.fillRect(x - 7, y + r * 0.85 - 3, 14, 5);
}

/** The ridge's middle at every row from the bottom of the board up to `top` (rows 8 px apart), kept in look.rowX / rowY. Returns the row count. */
function fillRows(look: Look, field: Field, d: number, top: number) {
  const bottom = look.bh + 8, feetY = look.feetY, rowX = look.rowX, rowY = look.rowY;
  let n = 0;
  for (let y = bottom; ; y -= 8) {
    const row = y < top ? top : y;
    rowY[n] = row; rowX[n] = centreAt(field, d + feetY - row); n++;
    if (row === top || n >= 94) break;
  }
  return n;
}

function band(c: CanvasRenderingContext2D, look: Look, n: number, width: number, shift: number, color: string) {
  const rowX = look.rowX, rowY = look.rowY;
  c.fillStyle = color; c.beginPath();
  for (let i = 0; i < n; i++) c.lineTo(rowX[i] - width + shift, rowY[i]);
  for (let i = n - 1; i >= 0; i--) c.lineTo(rowX[i] + width + shift, rowY[i]);
  c.fill();
}

function drawRidge(c: CanvasRenderingContext2D, look: Look, p: Palette, field: Field, d: number, rain: boolean) {
  const half = field.spec.half, top = Math.max(look.horizon - 4, look.feetY - (field.length - d)), n = fillRows(look, field, d, top);
  band(c, look, n, half + 5, 3, "rgba(40,30,10,0.18)");
  band(c, look, n, half + 5, 0, p.grass);
  band(c, look, n, half, 0, p.earth);
  band(c, look, n, half - 3, -1, p.earthTop);
  band(c, look, n, half * 0.4, 0, rain ? p.waterRim : p.worn);
}

/** The village road across the end of the field, the yard beyond it, and a mud hut with a hurricane lamp. */
function drawRoad(c: CanvasRenderingContext2D, look: Look, p: Palette, field: Field, d: number, dusk: boolean) {
  const HORIZON = look.horizon, y = look.feetY - (field.length - d);
  if (y < HORIZON - 30 || y > look.bh + 30) return;
  const back = Math.max(HORIZON, y - 104);
  c.fillStyle = p.yard; c.fillRect(0, back, W, Math.max(0, y - 12 - back));
  if (y - 104 > HORIZON - 40) {
    c.fillStyle = p.trees;
    for (let x = -10; x < W + 20; x += 34) { c.beginPath(); c.arc(x, y - 104, 18 + ((x * 7) % 9), 0, TAU); c.fill(); }
    c.fillStyle = p.grass;
    for (let x = 6; x < W + 20; x += 34) { c.beginPath(); c.arc(x, y - 98, 12 + ((x * 5) % 7), 0, TAU); c.fill(); }
  }
  c.fillStyle = p.road; c.fillRect(0, y - 14, W, 26);
  c.fillStyle = p.grass; c.fillRect(0, y + 10, W, 3); c.fillRect(0, y - 15, W, 2);
  const ground = y - 20;
  if (ground > HORIZON) {
    c.fillStyle = "rgba(40,30,10,0.18)"; c.fillRect(118, ground - 2, 92, 5);
    c.fillStyle = "#c08a55"; c.fillRect(124, ground - 34, 80, 34);
    c.fillStyle = "#a8743f"; c.fillRect(124, ground - 8, 80, 8);
    c.fillStyle = dusk ? "#ffcf6b" : "#4a3020"; c.fillRect(156, ground - 26, 16, 26);
    c.fillStyle = "#b8893a"; c.beginPath(); c.moveTo(114, ground - 30); c.lineTo(164, ground - 60); c.lineTo(214, ground - 30); c.fill();
    c.strokeStyle = "#946a28"; c.lineWidth = 1.2; c.beginPath();
    for (let i = 0; i < 6; i++) { c.moveTo(124 + i * 16, ground - 32); c.lineTo(140 + i * 8, ground - 50); }
    c.stroke();
    c.fillStyle = "#d4a44c"; c.beginPath(); c.ellipse(62, ground - 2, 22, 26, 0, Math.PI, 0); c.fill();
    c.strokeStyle = "#a07a30"; c.lineWidth = 2; c.beginPath(); c.moveTo(62, ground - 28); c.lineTo(62, ground - 36); c.stroke();
    c.strokeStyle = "#5b8a2a"; c.lineWidth = 3; c.beginPath(); c.moveTo(290, ground); c.lineTo(290, ground - 26); c.stroke();
    c.fillStyle = "#5b8a2a";
    for (let i = 0; i < BANANA.length; i++) { const a = BANANA[i]; c.beginPath(); c.ellipse(290 + Math.sin(a) * 11, ground - 28 + Math.abs(a) * 4, 12, 4, a, 0, TAU); c.fill(); }
    if (dusk) {
      // The hurricane lamp at the door: the walk's goal is the light. Two soft discs, no gradient made per frame.
      c.fillStyle = "rgba(255,214,120,0.18)"; c.beginPath(); c.arc(182, ground - 40, 40, 0, TAU); c.fill();
      c.fillStyle = "rgba(255,214,120,0.32)"; c.beginPath(); c.arc(182, ground - 40, 20, 0, TAU); c.fill();
      c.fillStyle = "#ffe08a"; c.fillRect(179, ground - 44, 6, 9);
    }
  }
}

function drawPuddle(c: CanvasRenderingContext2D, p: Palette, x: number, y: number, rx: number, ry: number, clock: number, calm: boolean, rain: boolean) {
  c.fillStyle = "#5e4128"; c.beginPath(); c.ellipse(x, y, rx + 2.5, ry + 2.5, 0, 0, TAU); c.fill();
  c.fillStyle = p.water; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill();
  c.strokeStyle = p.waterRim; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(x - rx * 0.4, y - ry * 0.3); c.lineTo(x + rx * 0.1, y - ry * 0.3); c.stroke();
  const ripple = calm ? 0.4 : (clock * (rain ? 1.6 : 0.7)) % 1;
  c.globalAlpha = 0.9 - ripple * 0.8; c.beginPath(); c.ellipse(x, y + ry * 0.2, 2 + ripple * rx * 0.6, 1 + ripple * ry * 0.4, 0, 0, TAU); c.stroke(); c.globalAlpha = 1;
}

/** A small white goat with a brown patch, grazing; `facing` 1 looks right. */
export function drawGoat(c: CanvasRenderingContext2D, x: number, y: number, facing: number, clock: number, calm: boolean) {
  const bob = calm ? 0 : Math.sin(clock * 3) * 1.4;
  c.fillStyle = "rgba(40,30,10,0.22)"; c.beginPath(); c.ellipse(x, y + 7, 15, 4, 0, 0, TAU); c.fill();
  c.strokeStyle = "#3b2d22"; c.lineWidth = 2;
  c.beginPath();
  for (let i = 0; i < LEGS.length; i++) { c.moveTo(x + LEGS[i] * facing, y + 2); c.lineTo(x + LEGS[i] * facing, y + 8); }
  c.stroke();
  c.fillStyle = "#f3efe4"; c.beginPath(); c.ellipse(x, y, 14, 7.5, 0, 0, TAU); c.fill();
  c.fillStyle = "#9a6a3e"; c.beginPath(); c.ellipse(x - 3 * facing, y - 2, 6, 4, 0.3, 0, TAU); c.fill();
  c.strokeStyle = "#f3efe4"; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x - 13 * facing, y - 3); c.lineTo(x - 17 * facing, y - 7); c.stroke();
  const hx = x + 15 * facing, hy = y + 1 + bob;
  c.fillStyle = "#f3efe4"; c.beginPath(); c.ellipse(hx, hy, 5.5, 4.2, 0.5 * facing, 0, TAU); c.fill();
  c.fillStyle = "#e8dcc8"; c.beginPath(); c.ellipse(hx - 2 * facing, hy - 4, 2, 4, -0.8 * facing, 0, TAU); c.fill();
  c.strokeStyle = "#6b5a48"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(hx - 1 * facing, hy - 4); c.quadraticCurveTo(hx - 4 * facing, hy - 9, hx - 7 * facing, hy - 8); c.stroke();
  c.fillStyle = "#2b211a"; c.beginPath(); c.arc(hx + 2 * facing, hy - 1, 0.9, 0, TAU); c.fill();
  c.strokeStyle = "#d8ccb6"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(hx + 3 * facing, hy + 3); c.lineTo(hx + 2 * facing, hy + 6); c.stroke();
}

/** An egret: standing in the paddy, or lifting off (`fly` 0..1+), wings beating unless calm. */
export function drawBok(c: CanvasRenderingContext2D, x: number, y: number, facing: number, fly: number, clock: number, calm: boolean) {
  if (fly <= 0) {
    c.strokeStyle = "#2c2a26"; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y + 3); c.lineTo(x, y + 9); c.stroke();
    c.fillStyle = "#fbfbf6"; c.beginPath(); c.ellipse(x, y, 6, 3.6, -0.3 * facing, 0, TAU); c.fill();
    c.strokeStyle = "#fbfbf6"; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 4 * facing, y - 1); c.quadraticCurveTo(x + 2 * facing, y - 6, x + 5 * facing, y - 9); c.stroke();
    c.strokeStyle = "#e8b830"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + 5 * facing, y - 9); c.lineTo(x + 9 * facing, y - 8); c.stroke();
    return;
  }
  const beat = calm ? 0.4 : Math.sin(clock * 13), span = 9 + fly * 4;
  c.fillStyle = "#fbfbf6"; c.beginPath(); c.ellipse(x, y, 5, 2.6, 0, 0, TAU); c.fill();
  c.strokeStyle = "#fbfbf6"; c.lineWidth = 2.2; c.beginPath();
  c.moveTo(x - span, y - beat * 6); c.quadraticCurveTo(x - span / 2, y - 3 - beat * 3, x, y);
  c.quadraticCurveTo(x + span / 2, y - 3 - beat * 3, x + span, y - beat * 6); c.stroke();
  c.strokeStyle = "#e8b830"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + 5 * facing, y - 1); c.lineTo(x + 9 * facing, y - 1); c.stroke();
}

/** A bamboo bridge over a ditch: dark water either side of a strip of lashed poles. `safe` is half the strip's width. */
function drawBridge(c: CanvasRenderingContext2D, p: Palette, field: Field, d: number, feetY: number, from: number, len: number, safe: number, clock: number, calm: boolean) {
  const half = field.spec.half, y0 = feetY - (from + len - d), y1 = feetY - (from - d);
  const steps = Math.max(2, Math.ceil(len / 8));
  c.fillStyle = "#3b4a3c";
  c.beginPath();
  for (let i = 0; i <= steps; i++) { const dd = from + len - (len * i) / steps; c.lineTo(centreAt(field, dd) - half - 6, feetY - (dd - d) - 0); }
  for (let i = steps; i >= 0; i--) { const dd = from + len - (len * i) / steps; c.lineTo(centreAt(field, dd) + half + 6, feetY - (dd - d)); }
  c.fill();
  c.fillStyle = p.water; c.globalAlpha = 0.5;
  c.beginPath();
  for (let i = 0; i <= steps; i++) { const dd = from + len - (len * i) / steps; c.lineTo(centreAt(field, dd) - half - 3, feetY - (dd - d)); }
  for (let i = steps; i >= 0; i--) { const dd = from + len - (len * i) / steps; c.lineTo(centreAt(field, dd) + half + 3, feetY - (dd - d)); }
  c.fill(); c.globalAlpha = 1;
  if (!calm) {
    c.strokeStyle = p.waterRim; c.lineWidth = 1; c.globalAlpha = 0.5;
    const t = (clock * 0.5) % 1;
    c.beginPath(); c.moveTo(centreAt(field, from + len * 0.5) - half - 1, (y0 + y1) / 2 + t * 6); c.lineTo(centreAt(field, from + len * 0.5) - half + 8, (y0 + y1) / 2 + t * 6); c.stroke();
    c.globalAlpha = 1;
  }
  // The poles: three bamboo strips side by side along the bend, with a lashing every 12 px.
  for (let pole = -1; pole <= 1; pole++) {
    c.strokeStyle = pole === 0 ? "#d7b95a" : "#c7a747"; c.lineWidth = (safe * 2) / 3.3; c.lineCap = "butt";
    c.beginPath();
    for (let i = 0; i <= steps; i++) { const dd = from + len - (len * i) / steps; c.lineTo(centreAt(field, dd) + (pole * safe * 2) / 3.1, feetY - (dd - d)); }
    c.stroke();
  }
  c.strokeStyle = "#7a5a1e"; c.lineWidth = 1.3;
  c.beginPath();
  for (let dd = from + 6; dd < from + len; dd += 12) { const cx = centreAt(field, dd), y = feetY - (dd - d); c.moveTo(cx - safe - 1, y); c.lineTo(cx + safe + 1, y); }
  c.stroke();
}

/** Fireflies over the dry lane before an obstacle: they drift in small loops and glow. */
function drawFlies(c: CanvasRenderingContext2D, look: Look, field: Field, d: number, clock: number, calm: boolean) {
  const feetY = look.feetY;
  for (let i = 0; i < field.obstacles.length; i++) {
    const o = field.obstacles[i], mid = o.d + o.len / 2, ahead = mid - d;
    if (ahead < -30 || ahead > 300) continue;
    const base = centreAt(field, mid) + safeOffset(field, mid, 0);
    for (let j = 0; j < 5; j++) {
      const phase = clock * (calm ? 0 : 1.3) + j * 1.7 + i, x = base + Math.sin(phase * 0.9 + j) * 9 + (j - 2) * 4, y = feetY - ahead + Math.cos(phase) * 8 + (j - 2) * 12;
      const glow = 0.55 + (calm ? 0.2 : 0.35 * Math.sin(phase * 2.2));
      c.fillStyle = "rgba(255,238,120,0.28)"; c.globalAlpha = glow; c.beginPath(); c.arc(x, y, 5.5, 0, TAU); c.fill();
      c.globalAlpha = 1; c.fillStyle = "#fff6a8"; c.beginPath(); c.arc(x, y, 1.7, 0, TAU); c.fill();
    }
  }
}

/** Wind streaks across the field; they drift the way it pushes, longer when it pushes harder. */
function drawWind(c: CanvasRenderingContext2D, look: Look, push: number, clock: number) {
  const strength = Math.min(1, Math.abs(push) / 24);
  if (strength < 0.08) return;
  c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 1.4; c.lineCap = "round";
  const length = 8 + 22 * strength, dir = Math.sign(push), drift = look.calm ? 0 : clock * push * 6;
  c.beginPath();
  for (let i = 0; i < 9; i++) {
    const y = look.horizon + 26 + ((i * 41) % Math.max(60, look.bh - look.horizon - 40));
    const x = (((i * 97 + drift) % (W + 80)) + W + 80) % (W + 80) - 40;
    c.moveTo(x, y); c.lineTo(x - dir * length, y);
    c.moveTo(x - dir * length * 0.3, y + 5); c.lineTo(x - dir * length * 0.9, y + 5);
  }
  c.stroke();
}

/** Rain: thin slanted streaks falling over the field, and a grey wash. */
function drawRain(c: CanvasRenderingContext2D, look: Look, clock: number) {
  c.fillStyle = "rgba(70,90,110,0.12)"; c.fillRect(0, 0, W, look.bh);
  c.strokeStyle = "rgba(235,242,250,0.55)"; c.lineWidth = 1; c.lineCap = "round";
  const fall = look.calm ? 0 : clock * 260;
  c.beginPath();
  for (let i = 0; i < 34; i++) {
    const x = ((i * 53) % (W + 40)) - 20, y = (((i * 97) % look.bh) + fall) % (look.bh + 20) - 10;
    c.moveTo(x, y); c.lineTo(x - 3, y + 9);
  }
  c.stroke();
}

/**
 * The walker from behind: a white গেঞ্জি, a checked লুঙ্গি, a red গামছা on the shoulder, a steel tiffin in one hand (a lamp in the dark).
 * `slip` 0..1 tips them into the mud; `wobble` 0..1 flaps the arms; `lean` -1..1 tilts the body towards the held side.
 */
export function drawWalker(
  c: CanvasRenderingContext2D, x: number, y: number, d: number, slip: number, side: number, ghost: boolean, calm: boolean, still: boolean,
  lean: number, wobble: number, edge: number, clock: number, lamp: boolean,
) {
  const swing = still || slip > 0 ? 0 : Math.sin((d / STRIDE) * Math.PI) * 3;
  const flap = calm ? 0 : Math.sin(clock * 26) * wobble;
  c.save();
  if (ghost) c.globalAlpha = 0.6;
  if (slip > 0) {
    const u = Math.min(1, slip * 2.4), t = 1 - (1 - u) * (1 - u);
    c.fillStyle = "#4a3320"; c.beginPath(); c.ellipse(x + side * 5, y + 4, 9 + t * 3, 4 + t, 0, 0, TAU); c.fill();
    if (!calm && slip < 0.6) {
      c.fillStyle = "#5e4128";
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.42 + side * 0.3, r = slip * 60, sx = x + side * 5 + Math.cos(a) * r, sy = y + 2 + Math.sin(a) * r + slip * slip * 90;
        c.beginPath(); c.arc(sx, sy, 2.2 - slip * 2, 0, TAU); c.fill();
      }
    }
    c.translate(x, y + 4); c.rotate(side * 0.45 * t); c.translate(-x, -(y + 4 - t * 4));
  } else {
    c.fillStyle = "rgba(40,30,10,0.25)"; c.beginPath(); c.ellipse(x, y + 5, 9, 3.5, 0, 0, TAU); c.fill();
    // The whole body leans into the held side, and sways towards the edge it is drifting to.
    const tilt = lean * 0.1 + (calm ? Math.sign(edge) * wobble * 0.14 : flap * 0.12 + Math.sign(edge) * wobble * 0.12);
    c.translate(x, y + 3); c.rotate(tilt); c.translate(-x, -(y + 3));
  }
  c.strokeStyle = "#7f4f32"; c.lineWidth = 3; c.lineCap = "round";
  c.beginPath(); c.moveTo(x - 3, y - 3); c.lineTo(x - 3.5, y + 3 + swing); c.moveTo(x + 3, y - 3); c.lineTo(x + 3.5, y + 3 - swing); c.stroke();
  c.fillStyle = "#2f62a8"; c.beginPath(); c.moveTo(x - 6, y - 12); c.lineTo(x + 6, y - 12); c.lineTo(x + 7, y - 1); c.lineTo(x - 7, y - 1); c.fill();
  c.strokeStyle = "#1d3f73"; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 6.5, y - 8); c.lineTo(x + 6.5, y - 8); c.moveTo(x - 7, y - 4); c.lineTo(x + 7, y - 4); c.moveTo(x - 2, y - 12); c.lineTo(x - 2, y - 1); c.moveTo(x + 2.5, y - 12); c.lineTo(x + 2.5, y - 1); c.stroke();
  // Arms: swinging with the stride, or thrown up and out when the feet near the edge.
  const up = wobble * (9 + flap * 4);
  c.strokeStyle = "#7f4f32"; c.lineWidth = 2.6;
  c.beginPath(); c.moveTo(x - 6.5, y - 20); c.lineTo(x - 8.5 - wobble * 6, y - 12 + swing * 0.8 - up); c.moveTo(x + 6.5, y - 20); c.lineTo(x + 8.5 + wobble * 6, y - 12 - swing * 0.8 - up); c.stroke();
  // The tiffin in the left hand, or a hurricane lamp in the right when it is dark.
  c.fillStyle = "#b9c0c7"; c.fillRect(x - 12 - wobble * 6, y - 12 + swing * 0.8 - up, 5, 7);
  c.fillStyle = "#8d959c"; c.fillRect(x - 12 - wobble * 6, y - 10.5 + swing * 0.8 - up, 5, 1);
  if (lamp) {
    const lx = x + 11 + wobble * 6, ly = y - 12 - swing * 0.8 - up;
    c.fillStyle = "rgba(255,214,120,0.5)"; c.beginPath(); c.arc(lx, ly + 2, 7, 0, TAU); c.fill();
    c.fillStyle = "#ffe08a"; c.fillRect(lx - 1.5, ly, 3, 5);
  }
  c.fillStyle = "#f6f3ea"; c.beginPath(); c.ellipse(x, y - 17, 7, 6.5, 0, 0, TAU); c.fill();
  c.strokeStyle = "#c8323c"; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 5, y - 22); c.lineTo(x + 4, y - 12); c.stroke();
  c.fillStyle = "#7f4f32"; c.beginPath(); c.arc(x, y - 26, 5, 0, TAU); c.fill();
  c.fillStyle = "#1e1a17"; c.beginPath(); c.ellipse(x, y - 27.2, 5.2, 4.4, 0, 0, TAU); c.fill();
  c.restore();
}

/** One frame of the whole board. */
export function drawFrame(c: CanvasRenderingContext2D, look: Look, game: Game) {
  const layers = look.layers;
  if (!layers) return;
  const field = game.field, spec = game.spec, d = game.d, clock = game.clock, calm = look.calm, p = PALETTES[spec.scene], bh = look.bh, feetY = look.feetY;
  const walking = game.phase === PH_WALK, slipping = game.phase === PH_SLIP || game.phase === PH_FELL;
  for (let y = ((d + feetY) % TILE) - TILE; y < bh; y += TILE) c.drawImage(layers.tile, 0, y, W, TILE);
  const near = d - (bh - feetY) - 60, far = d + feetY - look.horizon + 60;
  for (let i = 0; i < field.decor.length; i++) {
    const item = field.decor[i];
    if (item.kind !== "pond" || item.d < near || item.d > far || item.d > field.length - 30) continue;
    drawPond(c, p, item.x, feetY - (d - item.d), item.r, clock, calm, item.flip);
  }
  drawRidge(c, look, p, field, d, spec.rain);
  drawRoad(c, look, p, field, d, spec.scene === "evening");
  for (let i = 0; i < field.obstacles.length; i++) {
    const o = field.obstacles[i], mid = o.d + o.len / 2;
    if (mid < near || mid > far) continue;
    if (o.kind === "bridge") { drawBridge(c, p, field, d, feetY, o.d, o.len, o.hi, clock, calm); continue; }
    const x = centreAt(field, mid) + (o.lo + o.hi) / 2, y = feetY - (d - mid);
    if (o.kind === "puddle") drawPuddle(c, p, x, y, (o.hi - o.lo) / 2 + 2, o.len / 2, clock, calm, spec.rain);
    else drawGoat(c, x, y, o.side > 0 ? -1 : 1, clock + o.d, calm);
  }
  for (let i = 0; i < field.decor.length; i++) {
    const item = field.decor[i];
    if (item.kind !== "bok" || item.d > field.length - 30) continue;
    const fly = (d - (item.d - 60)) / 120;
    if (fly <= 0 && (item.d < near || item.d > far)) continue;
    if (fly > 2.2) continue;
    const facing = item.flip ? -1 : 1;
    const x = item.x + (fly > 0 ? facing * fly * 60 : 0), y = feetY - (d - (item.d + (fly > 0 ? fly * 260 : 0))) - (fly > 0 ? fly * 20 : 0);
    if (y < look.horizon - 30 || y > bh + 20) continue;
    drawBok(c, x, y, facing, fly, clock, calm);
  }
  const wx = slipping ? game.slipX : game.x;
  const slip = game.phase === PH_SLIP || (game.phase === PH_FELL && clock - game.slipAt < 3) ? Math.min(1, (clock - game.slipAt) / SLIP_TIME) : 0;
  const wobble = clamp((Math.abs(game.edge) - 0.65) / 0.35, 0, 1) * (walking ? 1 : 0);
  // A third bigger than the collision, so the wobble and the tiffin read on a small phone.
  c.save(); c.translate(wx, feetY); c.scale(WALKER_SCALE, WALKER_SCALE); c.translate(-wx, -feetY);
  drawWalker(c, wx, feetY, d, slip, game.slipSide, walking && d < game.graceTo && game.slips > 0, calm, !walking, game.lean, wobble, game.edge, clock, spec.dark > 0);
  c.restore();
  if (walking) drawWind(c, look, steadyAt(field, d) + gustAt(field, d), clock);
  if (spec.rain) drawRain(c, look, clock);
  c.drawImage(layers.sky, 0, 0, W, skyHeight(look.horizon));
  if (look.dark) {
    c.drawImage(look.dark, wx - W, feetY - 16 - MAX_H, 2 * W, 2 * MAX_H);
  }
  if (spec.flies) drawFlies(c, look, field, d, clock, calm);
}
