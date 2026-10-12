// Drawing the street: a dusk sky, flats with water tanks, a row of shop signs, and the wire crossings. Browser only.
// Every function draws in play-area units (see VW/VH); the caller scales the context. The card reuses the same pieces.
import { makeRng } from "../../../shared/game-core";
import { BX, GROUND, POP_SECONDS, R, VH, VW, lowWire, topWire, type Gate, type Run } from "./game";

const INK = "#241d1c", WIRE = ["#241d1c", "#3a302c", "#2c2522", "#4a3b33"], THREAD = "#fff6ea";
const POLE = "#b3aa9e", POLE_SIDE = "#8d857a";
export const BALLOON = { body: "#e2364f", light: "#ff8f9b", deep: "#a3172f" };
const KITES = ["#ec5b2f", "#1f9a8a", "#f2bd2c"];
/** The background strips repeat every TILE units. */
const TILE = 720;

/** A warm, hazy late-afternoon sky with a pale sun, and the street's static asphalt. */
export function paintSky(context: CanvasRenderingContext2D, width: number, height: number, ground: number) {
  const sky = context.createLinearGradient(0, 0, 0, ground);
  sky.addColorStop(0, "#f7b98a");
  sky.addColorStop(0.55, "#fbd6a8");
  sky.addColorStop(1, "#fde9cc");
  context.fillStyle = sky;
  context.fillRect(0, 0, width, ground);
  const sun = context.createRadialGradient(width * 0.78, ground * 0.22, 0, width * 0.78, ground * 0.22, 70);
  sun.addColorStop(0, "#fff7e3");
  sun.addColorStop(0.35, "#fff1d0");
  sun.addColorStop(1, "#fff1d000");
  context.fillStyle = sun;
  context.fillRect(0, 0, width, ground);
  context.fillStyle = "#fffaf0";
  context.beginPath(); context.arc(width * 0.78, ground * 0.22, 19, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#cfc4b6"; context.fillRect(0, ground, width, 7);
  context.fillStyle = "#5d5651"; context.fillRect(0, ground + 7, width, height - ground - 7);
}

/** Flats in the haze: balconies, window grids and black water tanks on the roofs. Fixed pattern, wraps at `width`. */
export function paintFar(context: CanvasRenderingContext2D, width: number, ground: number) {
  const rng = makeRng(20261);
  const walls = ["#e3a98a", "#d9b79a", "#c9a48f", "#e8c3a0", "#cfae9b", "#dba487"];
  for (let x = 0; x < width;) {
    const w = Math.min(width - x, 44 + Math.floor(rng() * 40)), h = 120 + Math.floor(rng() * 110), top = ground - h;
    context.fillStyle = walls[Math.floor(rng() * walls.length)];
    context.fillRect(x, top, w, h);
    context.fillStyle = "#00000014";
    context.fillRect(x + w - 4, top, 4, h);
    for (let floor = top + 12; floor < ground - 70; floor += 16) {
      context.fillStyle = "#6f5a4f55";
      for (let wx = x + 6; wx < x + w - 10; wx += 11) context.fillRect(wx, floor, 6, 7);
      context.fillStyle = "#ffffff40";
      context.fillRect(x + 3, floor + 9, w - 7, 1.5);
    }
    if (rng() < 0.7) {
      context.fillStyle = "#3b3a3f";
      const tx = x + 6 + rng() * Math.max(1, w - 20);
      context.fillRect(tx, top - 9, 11, 9);
      context.fillRect(tx + 1, top - 10, 9, 1.5);
    }
    x += w;
  }
  // Haze: the far flats sit back in the dusty air.
  context.fillStyle = "#fde3c266";
  context.fillRect(0, 0, width, ground);
}

const SHOPS: Array<[string, string, string]> = [
  ["চা-নাশতা", "#2f7a4b", "#fff6e0"], ["ফটোকপি", "#f2c230", "#9b1f1f"], ["টেইলার্স", "#2b5a8a", "#ffffff"],
  ["ফার্মেসি", "#ffffff", "#1d7a46"], ["মিষ্টি ঘর", "#c2412d", "#ffe28a"], ["লন্ড্রি", "#3d8fb5", "#ffffff"],
  ["মোবাইল সার্ভিসিং", "#1f2b4d", "#ffd166"], ["জুতা ঘর", "#7d3c98", "#ffffff"], ["ভাত-মাছ হোটেল", "#e9e1cf", "#a3172f"],
];

/** The shop row along the pavement: shutters, striped awnings and hand-painted signboards. Wraps at `width`. */
export function paintShops(context: CanvasRenderingContext2D, width: number, ground: number) {
  const rng = makeRng(5150);
  const stripes = ["#d9473a", "#2f7a4b", "#2b5a8a", "#e0a526"];
  const each = width / SHOPS.length;
  SHOPS.forEach(([name, board, letters], index) => {
    const x = index * each;
    context.fillStyle = index % 2 ? "#efe2cf" : "#e6d3bc";
    context.fillRect(x, ground - 96, each, 96);
    // Rolled-up shutter and the dark shop inside.
    context.fillStyle = "#4b3f3a"; context.fillRect(x + 6, ground - 44, each - 12, 44);
    context.fillStyle = "#9c948b"; context.fillRect(x + 6, ground - 50, each - 12, 7);
    context.fillStyle = "#c9a36b"; context.fillRect(x + 12, ground - 22, each - 24, 4);
    const stripe = stripes[Math.floor(rng() * stripes.length)];
    for (let sx = x + 3; sx < x + each - 3; sx += 8) {
      context.fillStyle = Math.round((sx - x) / 8) % 2 ? stripe : "#fbf3e3";
      context.beginPath(); context.moveTo(sx, ground - 56); context.lineTo(sx + 8, ground - 56); context.lineTo(sx + 9, ground - 49); context.lineTo(sx - 1, ground - 49); context.fill();
    }
    context.fillStyle = board;
    context.fillRect(x + 4, ground - 80, each - 8, 21);
    context.strokeStyle = "#00000026"; context.lineWidth = 1; context.strokeRect(x + 4.5, ground - 79.5, each - 9, 20);
    context.fillStyle = letters;
    context.textAlign = "center"; context.textBaseline = "middle";
    let size = 11;
    context.font = `700 ${size}px "Bangla"`;
    while (context.measureText(name).width > each - 14 && size > 6) { size -= 0.5; context.font = `700 ${size}px "Bangla"`; }
    context.fillText(name, x + each / 2, ground - 69);
    context.fillStyle = "#6f5a4f40"; context.fillRect(x + 10, ground - 92, each - 20, 8);
  });
  context.textAlign = "left"; context.textBaseline = "alphabetic";
}

const TIED: Array<[number, number, string]> = [[-14, -138, "#f2bd2c"], [12, -142, "#1f9a8a"], [-2, -156, "#e2364f"], [-20, -118, "#7b4bb5"], [18, -120, "#ec5b2f"]];

/** A bunch of balloons tied to the seller's bamboo stick, where the runaway balloon came from. */
export function drawStick(context: CanvasRenderingContext2D, x: number, ground: number) {
  context.strokeStyle = "#a8834a"; context.lineWidth = 3;
  context.beginPath(); context.moveTo(x, ground + 4); context.lineTo(x + 2, ground - 112); context.stroke();
  context.lineWidth = 0.8; context.strokeStyle = "#5b4a3e";
  for (const [dx, dy] of TIED) { context.beginPath(); context.moveTo(x + 2, ground - 110); context.lineTo(x + dx, ground + dy + 11); context.stroke(); }
  for (const [dx, dy, color] of TIED) {
    context.fillStyle = color;
    context.beginPath(); context.ellipse(x + dx, ground + dy, 10, 11.5, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#ffffff66";
    context.beginPath(); context.ellipse(x + dx - 3.5, ground + dy - 4, 2.5, 3.5, -0.5, 0, Math.PI * 2); context.fill();
  }
}

/** Strokes the parabola through (left, a), (mid, b), (right, c) as one quadratic curve (exact for a parabola). */
function sag(context: CanvasRenderingContext2D, left: number, right: number, a: number, b: number, c: number) {
  context.beginPath();
  context.moveTo(left, a);
  context.quadraticCurveTo((left + right) / 2, 2 * b - (a + c) / 2, right, c);
  context.stroke();
}

/** A perched house crow (grey nape and all), or a flying one when `flap` is a number. */
export function drawCrow(context: CanvasRenderingContext2D, x: number, y: number, facing: 1 | -1, flap: number | null) {
  context.save();
  context.translate(x, y);
  context.scale(facing, 1);
  context.fillStyle = INK;
  if (flap === null) {
    context.beginPath(); context.moveTo(-5, -5); context.lineTo(-13, -1); context.lineTo(-11, -4.5); context.fill();
    context.beginPath(); context.ellipse(-1, -6, 7, 4.6, -0.3, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.arc(5, -11, 3.4, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#7d7873";
    context.beginPath(); context.ellipse(3.2, -8.6, 2.6, 2.8, 0.4, 0, Math.PI * 2); context.fill();
    context.fillStyle = INK;
    context.beginPath(); context.moveTo(7.8, -12); context.lineTo(12, -10.4); context.lineTo(7.8, -9.6); context.fill();
    context.strokeStyle = INK; context.lineWidth = 1;
    context.beginPath(); context.moveTo(-1, -2); context.lineTo(-1, 0.5); context.moveTo(2, -2); context.lineTo(2, 0.5); context.stroke();
    context.fillStyle = "#fff"; context.beginPath(); context.arc(6, -11.6, 0.8, 0, Math.PI * 2); context.fill();
  } else {
    const lift = Math.sin(flap) * 7;
    context.beginPath(); context.ellipse(0, 0, 7, 3.6, -0.1, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.arc(7, -1.5, 3, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.moveTo(9.5, -2.2); context.lineTo(13, -1); context.lineTo(9.5, -0.2); context.fill();
    context.beginPath(); context.moveTo(-6, -1); context.lineTo(-12, 1); context.lineTo(-6, 2); context.fill();
    context.beginPath(); context.moveTo(-3, -1); context.lineTo(2, -12 + lift * 1.2); context.lineTo(4, -1); context.fill();
  }
  context.restore();
}

function drawKite(context: CanvasRenderingContext2D, x: number, y: number, color: string) {
  context.save();
  context.translate(x, y);
  context.rotate(-0.5);
  context.fillStyle = color;
  context.beginPath(); context.moveTo(0, -11); context.lineTo(8, 0); context.lineTo(0, 11); context.lineTo(-8, 0); context.closePath(); context.fill();
  context.strokeStyle = "#00000040"; context.lineWidth = 0.8;
  context.beginPath(); context.moveTo(0, -11); context.lineTo(0, 11); context.moveTo(-8, 0); context.lineTo(8, 0); context.stroke();
  context.strokeStyle = color; context.lineWidth = 1.2;
  context.beginPath(); context.moveTo(0, 11); context.quadraticCurveTo(5, 15, 1, 19); context.stroke();
  context.restore();
}

const LIFTS = [0, 7, 14, 21, 29, 37, 46], WIDTHS = [2.4, 1.2, 1.8, 1.1, 1.6, 1.2, 2];

/**
 * One crossing at screen x `sx`: poles and taut wires below the gap, a hanging loop of cables above it, a stray kite string,
 * maybe a caught kite, and crows that hop off the wire when the balloon gets close (`near` is the balloon's distance in units).
 */
export function drawGate(context: CanvasRenderingContext2D, gate: Gate, sx: number, ground: number, near: number, clock: number) {
  const left = sx - gate.w, right = sx + gate.w;
  // Poles, standing on the pavement up to the wire.
  for (let side = -1; side <= 1; side += 2) {
    const px = side < 0 ? left : right, top = lowWire(gate, side) - 5;
    context.fillStyle = POLE; context.fillRect(px - 3.5, top, 7, ground - top + 3);
    context.fillStyle = POLE_SIDE; context.fillRect(px + 1, top, 2.5, ground - top + 3);
    context.fillStyle = "#57504a"; context.fillRect(px - 4.5, top - 1, 9, 3);
  }
  // A coil of spare cable on the left pole, the way every Dhaka pole has one.
  const coilY = lowWire(gate, -1) + 24;
  context.strokeStyle = WIRE[0]; context.lineWidth = 1.6;
  for (let ring = 0; ring < 3; ring++) { context.beginPath(); context.ellipse(left + 3 + ring, coilY + ring * 2, 7, 4.5, 0.2, 0, Math.PI * 2); context.stroke(); }
  // Wires between the poles: the top one is the edge of the gap.
  for (let j = 3; j >= 0; j--) {
    context.strokeStyle = WIRE[j]; context.lineWidth = j ? 1.5 : 2.4;
    const drop = j * 9, extra = j * 3;
    sag(context, left, right, lowWire(gate, -1) + drop, lowWire(gate, 0) + drop + extra, lowWire(gate, 1) + drop);
  }
  // The hanging tangle: two thick cable bundles drop from the roofs at the edges, loose cables slung between them.
  const a0 = topWire(gate, -1), b0 = topWire(gate, 0), c0 = topWire(gate, 1);
  const twist = Math.floor(gate.perch * 6);
  for (let j = LIFTS.length - 1; j >= 0; j--) {
    const lift = j ? LIFTS[j] + ((j * 7 + twist * 5) % 7) - 3 : 0;
    const loosen = gate.sagTop * 0.08 * j * (j % 2 ? 1.3 : 0.6); // always less than lift, so no cable dips under the lowest one
    context.strokeStyle = j === 3 ? "#6d6560" : WIRE[(j + twist) % 4];
    context.lineWidth = WIDTHS[j];
    sag(context, left, right, a0 - lift + loosen, b0 - lift, c0 - lift + loosen);
  }
  context.strokeStyle = INK; context.lineWidth = 5; context.lineCap = "round";
  context.beginPath();
  context.moveTo(left + 3, -12); context.quadraticCurveTo(left + 5, a0 * 0.5, left + 3, a0 - 3);
  context.moveTo(right - 3, -12); context.quadraticCurveTo(right - 5, c0 * 0.5, right - 3, c0 - 3);
  context.stroke();
  context.lineCap = "butt";
  // The knotted clump where the loose cables meet each bundle.
  context.fillStyle = INK;
  context.beginPath(); context.ellipse(left + 5, a0 - 9, 5, 7, 0.3, 0, Math.PI * 2); context.fill();
  context.beginPath(); context.ellipse(right - 5, c0 - 9, 5, 7, -0.3, 0, Math.PI * 2); context.fill();
  // Diagonals through the tangle, one of them a pale kite string. Chords above a hanging curve stay inside it.
  context.lineWidth = 1.3; context.strokeStyle = WIRE[1];
  context.beginPath(); context.moveTo(left + 2, a0 - 24); context.lineTo(right - 2, c0 - 64); context.stroke();
  context.strokeStyle = "#5a514c"; context.lineWidth = 1;
  context.beginPath(); context.moveTo(left + 2, a0 - 92); context.lineTo(right - 2, c0 - 40); context.stroke();
  context.strokeStyle = THREAD; context.lineWidth = 0.9;
  context.beginPath(); context.moveTo(left + 3, a0 - 66); context.lineTo(right - 3, c0 - 16); context.stroke();
  if (twist % 2) {
    context.strokeStyle = WIRE[0]; context.lineWidth = 1.4;
    for (let ring = 0; ring < 3; ring++) { context.beginPath(); context.ellipse(right - 4 - ring, c0 - 52 + ring * 2, 6, 4, -0.2, 0, Math.PI * 2); context.stroke(); }
  }
  if (gate.kite >= 0) drawKite(context, sx + gate.w * 0.35, topWire(gate, 0.35) - 26, KITES[gate.kite]);
  // Crows on the pole wire; they take off once the balloon is about three-quarters of a second away.
  for (let index = 0; index < gate.crows; index++) {
    const u = index === 0 ? -0.6 + gate.perch * (gate.crows === 1 ? 1.2 : 0.3) : -0.6 + gate.perch * 0.3 + 0.8;
    const cx = sx + u * gate.w, cy = lowWire(gate, u) - 0.5;
    const facing = (index + Math.floor(gate.perch * 10)) % 2 ? 1 : -1;
    const gone = (90 - (near + u * gate.w)) / 90;
    if (gone <= 0) drawCrow(context, cx, cy, facing, null);
    else if (gone < 1) drawCrow(context, cx + gone * 70, cy - 8 - gone * 130, 1, clock * 22 + index);
  }
}

export type SceneCache = { scale: number; sky: HTMLCanvasElement; far: HTMLCanvasElement; shops: HTMLCanvasElement; shine: CanvasGradient | null };

function layer(width: number, height: number, scale: number, paint: (context: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  const context = canvas.getContext("2d")!;
  context.scale(scale, scale);
  paint(context);
  return canvas;
}

/** Pre-renders everything that never changes, at the canvas's real pixel scale. Rebuild when the size or the fonts change. */
export function newCache(scale: number): SceneCache {
  return {
    scale,
    sky: layer(VW, VH, scale, context => paintSky(context, VW, VH, GROUND)),
    far: layer(TILE, GROUND, scale, context => paintFar(context, TILE, GROUND)),
    shops: layer(TILE, 100, scale, context => { context.translate(0, 100 - GROUND); paintShops(context, TILE, GROUND); }),
    shine: null,
  };
}

/** The balloon: knot, a string that trails behind as it climbs, a soft highlight. (x, y) is its centre. */
export function drawBalloon(context: CanvasRenderingContext2D, x: number, y: number, squash: number, tilt: number, sway: number, fill: string | CanvasGradient) {
  context.save();
  context.translate(x, y);
  context.rotate(tilt);
  context.strokeStyle = "#6b5a4e"; context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, R * 1.2 + 3);
  context.quadraticCurveTo(-6 + sway, R * 1.2 + 14, -2 - sway * 0.6, R * 1.2 + 24);
  context.quadraticCurveTo(3 + sway * 0.5, R * 1.2 + 32, -4 - sway, R * 1.2 + 40);
  context.stroke();
  context.scale(1 + squash, 1 - squash);
  context.fillStyle = BALLOON.deep;
  context.beginPath(); context.moveTo(0, R * 1.12); context.lineTo(3.5, R * 1.2 + 4); context.lineTo(-3.5, R * 1.2 + 4); context.fill();
  context.fillStyle = fill;
  context.beginPath(); context.ellipse(0, 0, R, R * 1.17, 0, 0, Math.PI * 2); context.fill();
  context.strokeStyle = BALLOON.deep; context.lineWidth = 1.2; context.stroke();
  context.fillStyle = "#ffffffa6";
  context.beginPath(); context.ellipse(-5.5, -7, 3, 5.5, 0.45, 0, Math.PI * 2); context.fill();
  context.restore();
}

/** Bits of rubber flying out and the string dropping: p runs 0 → 1 over the pop. */
function drawPop(context: CanvasRenderingContext2D, x: number, y: number, p: number, slow: boolean) {
  context.strokeStyle = "#6b5a4e"; context.lineWidth = 1;
  const fall = p * p * 70;
  context.beginPath(); context.moveTo(x, y + 14 + fall); context.quadraticCurveTo(x - 5, y + 28 + fall, x - 1, y + 44 + fall); context.stroke();
  context.fillStyle = BALLOON.deep;
  context.beginPath(); context.moveTo(x, y + 12 + fall); context.lineTo(x + 3, y + 17 + fall); context.lineTo(x - 3, y + 17 + fall); context.fill();
  if (slow) return;
  context.globalAlpha = 1 - p;
  context.fillStyle = BALLOON.body;
  for (let i = 0; i < 7; i++) {
    const angle = i * 0.9 + 0.4, reach = 8 + p * 30;
    context.save();
    context.translate(x + Math.cos(angle) * reach, y + Math.sin(angle) * reach + p * p * 20);
    context.rotate(angle + p * 3);
    context.fillRect(-3.5, -1.5, 7, 3);
    context.restore();
  }
  context.globalAlpha = 1;
}

/**
 * Wind streaks across the sky, slanting the way the wind pushes (down or up), thicker and faster the stronger it blows.
 * The HUD says the same thing in words. `clock` 0 holds them still (slow mode).
 */
function drawWind(context: CanvasRenderingContext2D, wind: number, clock: number) {
  const strength = Math.min(1, Math.abs(wind) / 280);
  if (strength < 0.06) return;
  const slope = wind > 0 ? 0.45 : -0.45, speed = 150 + 160 * strength, length = 16 + 22 * strength, span = VW + 80, rise = GROUND - 150;
  context.strokeStyle = "#ffffff";
  context.globalAlpha = 0.2 + 0.5 * strength;
  context.lineWidth = 1 + strength;
  context.lineCap = "round";
  context.beginPath();
  for (let i = 0; i < 10; i++) {
    const travel = clock * speed + i * 131;
    const x = span - 40 - (travel % span), y = 24 + ((i * 47 + travel * slope) % rise + rise) % rise;
    context.moveTo(x, y);
    context.lineTo(x + length, y - slope * length);
  }
  context.stroke();
  context.lineCap = "butt";
  context.globalAlpha = 1;
}

/** One frame. `clock` is real seconds, for the string's sway and the crows' wings. */
export function drawScene(context: CanvasRenderingContext2D, cache: SceneCache, run: Run, slow: boolean, clock: number) {
  const { scale } = cache;
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.drawImage(cache.sky, 0, 0, VW, VH);
  const snap = (value: number) => Math.round(value * scale) / scale;
  const farX = slow ? 0 : -snap((run.dist * 0.15) % TILE), shopX = -snap((run.dist * (slow ? 1 : 0.5)) % TILE);
  context.drawImage(cache.far, farX, 0, TILE, GROUND);
  context.drawImage(cache.far, farX + TILE, 0, TILE, GROUND);
  context.drawImage(cache.shops, shopX, GROUND - 100, TILE, 100);
  context.drawImage(cache.shops, shopX + TILE, GROUND - 100, TILE, 100);
  context.fillStyle = "#e9e1d4";
  for (let lane = -((run.dist) % 60); lane < VW; lane += 60) context.fillRect(lane, GROUND + 22, 26, 2.5);
  if (run.dist < 80) drawStick(context, 34 - run.dist, GROUND);
  const bx = run.dist + BX;
  for (let i = Math.max(0, run.next - 2); i < run.gates.length; i++) {
    const gate = run.gates[i], sx = gate.x - run.dist;
    if (sx - gate.w > VW + 20) break;
    if (sx + gate.w < -40) continue;
    drawGate(context, gate, sx, GROUND, gate.x - bx, clock);
  }
  drawWind(context, run.wind, slow ? 0 : clock);
  if (run.phase === "pop" || (run.phase === "over" && !run.cleared)) {
    if (run.phase === "pop") drawPop(context, BX, run.y, Math.min(1, (run.t - run.popAt) / POP_SECONDS), slow);
    return;
  }
  cache.shine ??= makeShine(context);
  const since = run.t - run.puffAt;
  const squash = slow || run.puffAt < 0 || since > 0.16 ? 0 : 0.09 * (1 - since / 0.16);
  const tilt = slow ? 0 : Math.max(-0.16, Math.min(0.2, run.vy / 1100));
  const sway = slow ? 0 : Math.sin(clock * 3) * 2 + Math.max(-4, Math.min(4, run.vy / 50));
  drawBalloon(context, BX, run.y, squash, tilt, sway, cache.shine);
  // A little puff of air under the knot right after each tap.
  if (run.puffAt >= 0 && since < 0.18) {
    context.strokeStyle = "#ffffffcc"; context.lineWidth = 1.5;
    const spread = 4 + since * 60;
    context.beginPath();
    context.moveTo(BX - spread, run.y + R * 1.3 + 4); context.lineTo(BX - spread - 3, run.y + R * 1.3 + 10);
    context.moveTo(BX + spread, run.y + R * 1.3 + 4); context.lineTo(BX + spread + 3, run.y + R * 1.3 + 10);
    context.stroke();
  }
}

/** The balloon's soft shading, made once (gradients are objects; the hot loop must not allocate). */
export function makeShine(context: CanvasRenderingContext2D) {
  const shine = context.createRadialGradient(-5, -7, 1, 0, 0, R * 1.25);
  shine.addColorStop(0, BALLOON.light);
  shine.addColorStop(0.45, BALLOON.body);
  shine.addColorStop(1, BALLOON.deep);
  return shine;
}
