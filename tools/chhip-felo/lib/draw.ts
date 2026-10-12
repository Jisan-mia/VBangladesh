// The water, the bamboo rod, the float and the fish, drawn in code. The scene works in a 360×320 box, scaled to the canvas.
// Per frame: one cached background, then a handful of paths. No allocations in drawScene (ripples live in a fixed Float32Array).
import type { Fish } from "./fish";
import { floatState, greenBand, FLIGHT, RED, type Trip } from "./game";

export const VW = 360, VH = 320;
const WATER_TOP = 72, BANK = 284;

/** Distance 0 (by the bank) .. 1 (far water) to a height in the scene. */
export const waterY = (distance: number) => 268 - distance * 176;
export const sideX = (side: number, distance: number) => 180 + side * 120 * (1 - 0.45 * distance);
const sizeAt = (distance: number) => 1 - 0.45 * distance;

type Place = { sky: [string, string]; water: [string, string]; bank: string; far: string };
export const SCENES: readonly Place[] = [
  { sky: ["#fbefd2", "#d9ecea"], water: ["#2d6a5b", "#4f8f78"], bank: "#6f9a52", far: "#4f7a3c" },
  { sky: ["#fde4bb", "#f2d6a3"], water: ["#4b7a65", "#6f9d84"], bank: "#93a75f", far: "#6f8a48" },
  { sky: ["#dcedf6", "#bfe0ec"], water: ["#3b7290", "#6aa3bd"], bank: "#8fae86", far: "#6f9488" },
];

const RIPPLES = 10;
export type SceneCache = { place: number; ratio: number; bg: HTMLCanvasElement | null; ripples: Float32Array; next: number };
export const newCache = (): SceneCache => ({ place: -1, ratio: 0, bg: null, ripples: new Float32Array(RIPPLES * 4).fill(-1), next: 0 });

/** A ring spreading on the water: x, y, its age (seconds) and how big it gets. */
export function ripple(cache: SceneCache, x: number, y: number, strength = 1) {
  const at = cache.next * 4;
  cache.ripples[at] = x; cache.ripples[at + 1] = y; cache.ripples[at + 2] = 0; cache.ripples[at + 3] = strength;
  cache.next = (cache.next + 1) % RIPPLES;
}

function blob(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, turn = 0) {
  c.beginPath(); c.ellipse(x, y, rx, ry, turn, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
}

function coconut(c: CanvasRenderingContext2D, x: number, base: number, tall: number, lean: number, color: string) {
  c.strokeStyle = color; c.lineWidth = 2.4; c.lineCap = "round";
  c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x + lean * 0.4, base - tall * 0.6, x + lean, base - tall); c.stroke();
  c.lineWidth = 1.6;
  for (let i = 0; i < 6; i++) {
    const angle = -Math.PI + i * (Math.PI / 5), tx = x + lean, ty = base - tall;
    c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + Math.cos(angle) * 9, ty - 5, tx + Math.cos(angle) * 15, ty + 4 + Math.abs(Math.sin(angle)) * -2); c.stroke();
  }
}

/** The far bank, the water and the near bank for one place, drawn once into an offscreen canvas. */
function paintBackground(c: CanvasRenderingContext2D, place: number) {
  const scene = SCENES[place];
  let gradient = c.createLinearGradient(0, 0, 0, WATER_TOP);
  gradient.addColorStop(0, scene.sky[0]); gradient.addColorStop(1, scene.sky[1]);
  c.fillStyle = gradient; c.fillRect(0, 0, VW, WATER_TOP);
  gradient = c.createLinearGradient(0, WATER_TOP, 0, BANK);
  gradient.addColorStop(0, scene.water[0]); gradient.addColorStop(1, scene.water[1]);
  c.fillStyle = gradient; c.fillRect(0, WATER_TOP, VW, BANK - WATER_TOP);

  if (place === 0) {
    // A village pond: coconut palms and bushes on the far bank, কলমি leaves at the edge.
    c.fillStyle = scene.bank; c.fillRect(0, 50, VW, WATER_TOP - 50);
    for (const [x, r] of [[30, 16], [90, 12], [150, 18], [250, 14], [320, 18]] as const) blob(c, x, 54, r, r * 0.6, scene.far);
    coconut(c, 60, 62, 40, 6, "#5b4a2a"); coconut(c, 205, 62, 46, -7, "#5b4a2a"); coconut(c, 288, 62, 36, 5, "#5b4a2a");
    for (const [x, y] of [[16, 250], [34, 262], [330, 240], [346, 258], [22, 96], [340, 100]] as const) blob(c, x, y, 9, 4, "#5f9a4c", 0.2);
  } else if (place === 1) {
    // A বিল: flat land far off, a pair of তাল palms, lily pads and শাপলা on the water.
    c.fillStyle = scene.bank; c.fillRect(0, 60, VW, WATER_TOP - 60);
    c.strokeStyle = "#5b4a2a"; c.lineWidth = 2;
    for (const x of [96, 112]) { c.beginPath(); c.moveTo(x, 64); c.lineTo(x + 2, 30); c.stroke(); blob(c, x + 2, 28, 9, 6, scene.far); }
    for (const [x, y, r] of [[40, 120, 10], [70, 140, 8], [300, 130, 11], [270, 210, 12], [330, 190, 9], [30, 220, 12], [110, 104, 7], [240, 100, 7]] as const) {
      c.beginPath(); c.ellipse(x, y, r, r * 0.38, 0, 0.3, Math.PI * 2 - 0.1); c.lineTo(x, y); c.fillStyle = "#4f8f3e"; c.fill();
    }
    for (const [x, y, color] of [[44, 116, "#f2a5c0"], [302, 126, "#ffffff"], [272, 205, "#f2a5c0"], [34, 216, "#ffffff"]] as const) {
      for (let i = 0; i < 5; i++) blob(c, x + Math.cos(i * 1.26) * 3, y - 2 + Math.sin(i * 1.26) * 1.3, 2.6, 1.6, color, i * 1.26);
      blob(c, x, y - 2, 1.4, 1, "#f2c94c");
    }
  } else {
    // A river: a thin far bank, a sail boat, and the current's long streaks.
    c.fillStyle = scene.bank; c.fillRect(0, 64, VW, WATER_TOP - 64);
    for (const [x, r] of [[20, 10], [70, 8], [130, 12], [300, 10], [345, 8]] as const) blob(c, x, 64, r, r * 0.5, scene.far);
    c.fillStyle = "#5a4630"; c.beginPath(); c.moveTo(214, 86); c.lineTo(250, 86); c.lineTo(244, 91); c.lineTo(220, 91); c.closePath(); c.fill();
    c.strokeStyle = "#5a4630"; c.lineWidth = 1; c.beginPath(); c.moveTo(232, 86); c.lineTo(232, 62); c.stroke();
    c.fillStyle = "#efe2c4"; c.beginPath(); c.moveTo(233, 63); c.lineTo(246, 82); c.lineTo(233, 82); c.closePath(); c.fill();
    c.strokeStyle = "rgba(255,255,255,0.14)"; c.lineWidth = 1.2;
    for (let i = 0; i < 14; i++) { const y = 100 + i * 13, x = (i * 67) % 300; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 40 + (i % 3) * 14, y); c.stroke(); }
  }
  // Sunlight on the water.
  c.strokeStyle = "rgba(255,255,255,0.18)"; c.lineWidth = 1;
  for (let i = 0; i < 9; i++) { const y = 90 + i * 21, x = 20 + ((i * 97) % 300); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 18, y); c.stroke(); }
  // The near bank: an earth lip, grass, and the basket waiting on the right.
  c.fillStyle = "#8b6a3c"; c.beginPath(); c.moveTo(0, BANK - 4); c.quadraticCurveTo(VW / 2, BANK - 12, VW, BANK - 2); c.lineTo(VW, VH); c.lineTo(0, VH); c.closePath(); c.fill();
  c.fillStyle = "#7ea24c"; c.beginPath(); c.moveTo(0, BANK + 6); c.quadraticCurveTo(VW / 2, BANK - 2, VW, BANK + 8); c.lineTo(VW, VH); c.lineTo(0, VH); c.closePath(); c.fill();
  c.strokeStyle = "#5f8a36"; c.lineWidth = 1.4;
  for (let x = 6; x < VW; x += 13) { c.beginPath(); c.moveTo(x, BANK + 10); c.lineTo(x + 3, BANK + 2); c.lineTo(x + 6, BANK + 10); c.stroke(); }
  drawBasket(c, 316, 304, 1);
}

/** A woven bamboo basket (খালুই). */
export function drawBasket(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.fillStyle = "#b9853f";
  c.beginPath(); c.moveTo(x - 22 * s, y - 16 * s); c.lineTo(x + 22 * s, y - 16 * s); c.quadraticCurveTo(x + 24 * s, y + 14 * s, x, y + 14 * s); c.quadraticCurveTo(x - 24 * s, y + 14 * s, x - 22 * s, y - 16 * s); c.fill();
  c.strokeStyle = "#8a5c26"; c.lineWidth = 1.4 * s;
  for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(x - 22 * s + i * 1.5 * s, y - 16 * s + i * 7 * s); c.lineTo(x + 22 * s - i * 1.5 * s, y - 16 * s + i * 7 * s); c.stroke(); }
  blob(c, x, y - 16 * s, 22 * s, 4 * s, "#8a5c26");
}

/** Where the float is now (scene units), and its size. */
type Spot = { x: number; y: number; s: number; flying: boolean };
export function floatAt(trip: Trip, tip: { x: number; y: number }, out: Spot = { x: 0, y: 0, s: 1, flying: false }) {
  const d = trip.phase === "aim" ? 0 : trip.landed;
  const x = sideX(trip.side, d), y = waterY(d);
  if (trip.phase === "fly") {
    const p = Math.min(1, trip.t / (FLIGHT * (trip.slow ? 1.3 : 1)));
    out.x = tip.x + (x - tip.x) * p; out.y = tip.y + (y - tip.y) * p - Math.sin(Math.PI * p) * 70; out.s = sizeAt(d * p); out.flying = true;
  } else { out.x = x; out.y = y; out.s = sizeAt(d); out.flying = false; }
  return out;
}

const tip = { x: 0, y: 0 }, pos = { x: 0, y: 0 }, spot: Spot = { x: 0, y: 0, s: 1, flying: false };
const DASH = [4, 4], SOLID: number[] = [];

/** One frame of the game. `clock` drives the idle bobbing and bubbles. */
export function drawScene(c: CanvasRenderingContext2D, cache: SceneCache, trip: Trip, clock: number, slow: boolean, dt: number) {
  const place = trip.spec.place;
  if (cache.place !== place || !cache.bg) {
    cache.bg ??= document.createElement("canvas");
    cache.bg.width = Math.round(VW * cache.ratio); cache.bg.height = Math.round(VH * cache.ratio);
    const bc = cache.bg.getContext("2d")!;
    bc.setTransform(cache.ratio, 0, 0, cache.ratio, 0, 0);
    paintBackground(bc, place);
    cache.place = place;
  }
  c.drawImage(cache.bg, 0, 0, VW, VH);

  const { phase } = trip, bob = slow ? 0 : Math.sin(clock * 2.4) * 0.8;
  // The rod tip: pulled back while aiming, whipped forward on the cast, bent towards the fish while reeling.
  tip.x = 132; tip.y = 168;
  if (phase === "aim" && trip.charging) { tip.x -= 50 * trip.power; tip.y -= 34 * trip.power; }
  if (phase === "reel") { tip.x += 10 * trip.tension; tip.y += 30 * trip.tension; }

  // Bubbles where the fish are feeding.
  if (phase === "aim" || phase === "fly" || phase === "wait") {
    const s = sizeAt(trip.spot), bx = sideX(trip.side, trip.spot), by = waterY(trip.spot);
    c.globalAlpha = 0.3; blob(c, bx, by + 2, 24 * s, 8 * s, "#123d34"); c.globalAlpha = 1;
    // A feeding ring every couple of seconds (the fish's ঘাই), and bubbles rising.
    const ring = (clock * (slow ? 0.3 : 0.5)) % 1;
    c.globalAlpha = 0.6 * (1 - ring); c.strokeStyle = "#ffffff"; c.lineWidth = 1.2;
    c.beginPath(); c.ellipse(bx, by + 2, (8 + ring * 22) * s, (3 + ring * 7) * s, 0, 0, Math.PI * 2); c.stroke();
    for (let i = 0; i < 5; i++) {
      const p = (clock * (slow ? 0.4 : 0.8) + i * 0.21) % 1;
      c.globalAlpha = 1 - p;
      c.beginPath(); c.arc(bx + Math.sin(i * 2.1 + clock) * 9 * s, by - p * 10 * s, (2.4 + (i % 2) * 1.4) * s, 0, Math.PI * 2);
      c.lineWidth = 1.3; c.stroke();
    }
    c.globalAlpha = 1;
  }

  // Ripples age and fade.
  const r = cache.ripples;
  c.lineWidth = 1.2; c.strokeStyle = "#ffffff";
  for (let i = 0; i < RIPPLES; i++) {
    const at = i * 4;
    if (r[at + 2] < 0) continue;
    r[at + 2] += dt;
    const age = r[at + 2], life = 1.2;
    if (age > life) { r[at + 2] = -1; continue; }
    const rx = 4 + age * 26 * r[at + 3];
    c.globalAlpha = 0.7 * (1 - age / life);
    c.beginPath(); c.ellipse(r[at], r[at + 1], rx, rx * 0.34, 0, 0, Math.PI * 2); c.stroke();
  }
  c.globalAlpha = 1;

  // The aim ring: where the float will land if you let go now. It turns gold over the bubbles.
  if (phase === "aim" && trip.charging) {
    const d = trip.power, s = sizeAt(d), near = Math.abs(d - trip.spot) < 0.08;
    c.setLineDash(DASH); c.lineWidth = near ? 2.5 : 1.6; c.strokeStyle = near ? "#ffd166" : "#ffffff";
    c.beginPath(); c.ellipse(sideX(trip.side, d), waterY(d), 13 * s, 5 * s, 0, 0, Math.PI * 2); c.stroke();
    c.setLineDash(SOLID);
  }

  // The fish on the line: a dark shape swimming towards the bank as you reel.
  let lineX = 0, lineY = 0, taut = false;
  const float = floatAt(trip, tip, spot);
  if (phase === "reel") {
    const from = float, toY = BANK - 8, toX = sideX(trip.side, 0) * 0.6 + 70;
    const thrash = trip.t < trip.surgeEnd ? 3 : 1, len = 18 + 22 * Math.min(1, trip.grams / 3000);
    pos.x = from.x + (toX - from.x) * trip.progress + (slow ? 0 : Math.sin(clock * 9) * 2 * thrash);
    pos.y = from.y + (toY - from.y) * trip.progress;
    c.globalAlpha = 0.4; blob(c, pos.x, pos.y + 3, len * 0.5, len * 0.16, "#0f2a24", Math.sin(clock * 6) * 0.15 * thrash); c.globalAlpha = 1;
    lineX = pos.x; lineY = pos.y; taut = true;
  } else if (phase !== "caught" && phase !== "done") {
    lineX = float.x; lineY = float.y - 12 * float.s;
  }

  // The line.
  if (lineX) {
    c.strokeStyle = "rgba(255,255,255,0.75)"; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(tip.x, tip.y);
    if (taut) c.lineTo(lineX, lineY);
    else c.quadraticCurveTo((tip.x + lineX) / 2, Math.max(tip.y, lineY) + 18, lineX, lineY);
    c.stroke();
  }

  // The float (ফাতনা): a red cap over a white band, bobbing; a nibble tugs it; the real bite pulls it under.
  if (phase === "aim" || phase === "fly" || phase === "wait" || phase === "lost") {
    const state = floatState(trip), under = state === "under";
    const s = float.s * 1.8, dip = typeof state === "number" ? state * 5 * s : 0;
    const x = float.x, y = float.y + (float.flying ? 0 : bob + dip);
    if (!under) {
      c.fillStyle = "#f4f1ea"; c.fillRect(x - 2 * s, y - 6 * s, 4 * s, 6 * s);
      c.fillStyle = "#d6352b"; c.beginPath(); c.ellipse(x, y - 8 * s, 2.6 * s, 4 * s, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#1d1d1d"; c.fillRect(x - 0.6 * s, y - 15 * s, 1.2 * s, 4 * s);
      if (!float.flying) { c.globalAlpha = 0.35; blob(c, x, y + 0.5, 5 * s, 1.6 * s, "#ffffff"); c.globalAlpha = 1; }
    } else if (phase === "wait") {
      // Under: only the tip of the stick shows, with a "!" above so the eye catches it.
      c.fillStyle = "#1d1d1d"; c.fillRect(x - 0.6 * s, y - 3 * s, 1.2 * s, 3 * s);
      c.fillStyle = "#ffd166"; c.font = "800 22px sans-serif"; c.textAlign = "center";
      c.fillText("!", x, y - 12 * s);
    }
  }

  drawRod(c, tip.x, tip.y, phase === "reel" ? trip.tension : 0);

  if (phase === "reel") drawTension(c, trip);
}

/** The bamboo rod from the bottom-left corner, thick at the butt, with nodes; it bends with the line's tension. */
function drawRod(c: CanvasRenderingContext2D, tx: number, ty: number, bend: number) {
  const bx = 10, by = VH + 10, cx = (bx + tx) / 2 + 14 + bend * 26, cy = (by + ty) / 2 - 10 + bend * 30;
  c.lineCap = "round";
  c.strokeStyle = "#8a6a2a"; c.lineWidth = 7;
  c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(cx, cy, tx, ty); c.stroke();
  c.strokeStyle = "#d4ac55"; c.lineWidth = 4.6;
  c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(cx, cy, tx, ty); c.stroke();
  c.strokeStyle = "#8a6a2a"; c.lineWidth = 1.6;
  for (let i = 1; i < 5; i++) {
    const p = i / 5, q = 1 - p;
    const x = q * q * bx + 2 * q * p * cx + p * p * tx, y = q * q * by + 2 * q * p * cy + p * p * ty;
    c.beginPath(); c.moveTo(x - 3, y - 1.5); c.lineTo(x + 3, y + 1.5); c.stroke();
  }
}

/** The tension gauge on the right: red at the top, green in the middle, a marker for the line now, and reel progress beside it. */
function drawTension(c: CanvasRenderingContext2D, trip: Trip) {
  const x = 334, top = 96, h = 170, w = 16, { lo, hi } = greenBand(trip);
  const yOf = (v: number) => top + h * (1 - v);
  c.fillStyle = "rgba(10,30,26,0.55)"; c.fillRect(x - 3, top - 3, w + 6, h + 6);
  c.fillStyle = "#e9e4d6"; c.fillRect(x, top, w, h);
  c.fillStyle = "#d6352b"; c.fillRect(x, top, w, h * (1 - RED));
  c.fillStyle = "#3fae5a"; c.fillRect(x, yOf(hi), w, yOf(lo) - yOf(hi));
  const y = yOf(trip.tension), danger = trip.strain > 0;
  c.fillStyle = danger ? "#d6352b" : "#1d2b2a";
  c.beginPath(); c.moveTo(x - 9, y - 6); c.lineTo(x - 1, y); c.lineTo(x - 9, y + 6); c.closePath(); c.fill();
  c.fillRect(x - 1, y - 1.5, w + 2, 3);
  c.fillStyle = "rgba(10,30,26,0.55)"; c.fillRect(x - 16, top, 5, h);
  c.fillStyle = "#ffd166"; c.fillRect(x - 16, top + h * (1 - trip.progress), 5, h * trip.progress);
}

/** A fish in profile facing right, `len` long, centred on (cx, cy). `flat` paints a silhouette in one colour. */
export function drawFish(c: CanvasRenderingContext2D, cx: number, cy: number, len: number, fish: Fish, flat?: string) {
  const L = fish.look, h = len / L.long, nose = cx + len * 0.5, tailBase = cx - len * 0.3, tailEnd = cx - len * 0.5;
  const top = cy - h / 2, bottom = cy + h / 2, hump = (L.hump ?? 0) * h, head = L.head ?? 0;
  const body = () => {
    c.beginPath();
    c.moveTo(nose, cy + h * 0.06);
    c.bezierCurveTo(nose - len * (0.06 - head * 0.1), top - h * head * 0.3, cx + len * 0.12, top - hump, tailBase, cy - h * 0.14);
    c.lineTo(tailBase, cy + h * 0.14);
    c.bezierCurveTo(cx, bottom + h * 0.05, nose - len * 0.12, bottom, nose, cy + h * 0.06);
    c.closePath();
  };
  const fin = flat ?? L.fin;
  // Tail.
  c.fillStyle = fin; c.beginPath();
  if (L.tail === "fork") {
    c.moveTo(tailBase + len * 0.02, cy); c.lineTo(tailEnd, cy - h * 0.5); c.quadraticCurveTo(tailEnd + len * 0.07, cy, tailEnd, cy + h * 0.5); c.closePath();
  } else {
    const spread = Math.max(h * 0.5, len * 0.08);
    c.moveTo(tailBase + len * 0.03, cy - h * 0.12);
    c.quadraticCurveTo(tailEnd - len * 0.01, cy - spread, tailEnd, cy);
    c.quadraticCurveTo(tailEnd - len * 0.01, cy + spread, tailBase + len * 0.03, cy + h * 0.12);
    c.closePath();
  }
  c.fill();
  // Back fin: a sail on short fish, a long low ridge on long ones.
  c.beginPath();
  if (L.long < 4.4) { c.moveTo(cx + len * 0.08, top - hump * 0.5 + h * 0.22); c.lineTo(cx - len * 0.04, top - hump * 0.7 - h * 0.16); c.lineTo(cx - len * 0.2, top + h * 0.3); }
  else { c.moveTo(cx + len * 0.12, top + h * 0.1); c.quadraticCurveTo(cx - len * 0.05, top - h * 0.28, tailBase, cy - h * 0.12); }
  c.closePath(); c.fill();
  // Body.
  if (flat) c.fillStyle = flat;
  else { const g = c.createLinearGradient(0, top, 0, bottom); g.addColorStop(0, L.body); g.addColorStop(0.55, L.body); g.addColorStop(1, L.belly); c.fillStyle = g; }
  body(); c.fill();
  if (flat) return;
  // Marks, kept inside the body.
  if (L.mark) {
    c.save(); body(); c.clip();
    c.fillStyle = L.markColor ?? "#000"; c.globalAlpha = 0.6;
    if (L.mark === "bars") for (let i = 0; i < 5; i++) c.fillRect(cx + len * (0.22 - i * 0.12), top - hump, len * 0.04, h + hump);
    else if (L.mark === "stripe") c.fillRect(tailBase, cy - h * 0.06, len * 0.8, h * 0.1);
    else for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(cx + len * (0.25 - (i % 5) * 0.11 - (i > 4 ? 0.05 : 0)), cy + h * (i > 4 ? 0.12 : -0.14), Math.max(1, h * 0.07), 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  if (L.spot) { c.fillStyle = "#26231f"; c.beginPath(); c.arc(L.spot === "tail" ? tailBase + len * 0.08 : nose - len * 0.22, cy - h * 0.06, Math.max(1.2, h * 0.1), 0, Math.PI * 2); c.fill(); }
  // Side fin, gill line, eye, mouth.
  c.fillStyle = fin; c.beginPath(); c.ellipse(nose - len * 0.26, cy + h * 0.18, len * 0.06, h * 0.1, 0.5, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(0,0,0,0.25)"; c.lineWidth = Math.max(0.8, len * 0.008);
  c.beginPath(); c.arc(nose - len * 0.36, cy, h * 0.34, -0.9, 0.9); c.stroke();
  const eye = Math.max(1.4, h * 0.1);
  blob(c, nose - len * 0.08, cy - h * 0.12, eye, eye, "#ffffff");
  blob(c, nose - len * 0.075, cy - h * 0.12, eye * 0.55, eye * 0.55, "#141414");
  c.strokeStyle = "rgba(0,0,0,0.45)";
  c.beginPath(); c.moveTo(nose, cy + h * 0.06); c.lineTo(nose - len * (0.04 + head * 0.12), cy + h * 0.1); c.stroke();
  if (L.whiskers) {
    c.strokeStyle = "rgba(30,25,20,0.7)"; c.lineWidth = Math.max(0.7, len * 0.006);
    for (let i = 0; i < L.whiskers; i++) {
      const down = i % 2 ? 1 : -0.4, reach = i < 2 ? 0.22 : 0.14;
      c.beginPath(); c.moveTo(nose - len * 0.02, cy + h * 0.08);
      c.quadraticCurveTo(nose + len * reach * 0.6, cy + h * 0.1 * down, nose + len * reach * 0.4, cy + h * (0.35 + 0.25 * down)); c.stroke();
    }
  }
}

