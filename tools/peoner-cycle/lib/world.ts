// What is new in the rewrite, drawn from plain shapes: the three worlds' palettes and road, the ভ্যান, the dog, the gate with
// the waiting hand, the lantern, a bamboo clump and a jute patch. The old drawings (bike, cow, goat, cart, puddle, letter,
// props) stay in art.ts. Same conventions: logical units, a thing's near edge at y = 0 with the rest going up (negative y).
import { C } from "./art";

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

export type RoadPalette = {
  grass: string; grassDeep: string; grassLight: string; road: string; rut: string; cell: string; edge: string; speck: string; speckLight: string;
};
/** One per world: dawn (pink-gold, dusty), noon (white, river verge), dusk (blue, wet). */
export const ROAD: readonly RoadPalette[] = [
  { grass: C.grass, grassDeep: C.grassDeep, grassLight: C.grassLight, road: C.road, rut: "rgba(190,140,90,0.22)", cell: C.cell, edge: C.grassDeep, speck: "#c9a07a", speckLight: "#f6dfc0" },
  { grass: "#7fb06a", grassDeep: "#5f9455", grassLight: "#a2cc84", road: "#efe0bf", rut: "rgba(170,140,90,0.22)", cell: "#b79c6a", edge: "#5f9455", speck: "#cdb48a", speckLight: "#fff3d6" },
  { grass: "#3f5f4d", grassDeep: "#2f4a3d", grassLight: "#58796a", road: "#6c7a88", rut: "rgba(30,40,56,0.34)", cell: "#4d5b69", edge: "#2f4a3d", speck: "#58677a", speckLight: "#8fa0b3" },
];

function ellipse(c: Ctx, x: number, y: number, rx: number, ry: number, color: string, rotation = 0) {
  c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, rotation, 0, TAU); c.fill();
}
function rounded(c: Ctx, x: number, y: number, w: number, h: number, r: number, color: string) {
  c.fillStyle = color; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
}
function stroke(c: Ctx, points: number[], color: string, width: number) {
  c.strokeStyle = color; c.lineWidth = width; c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath(); c.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
  c.stroke();
}

/**
 * The road tile for a world: verges with grass, a dusty (or wet) road with ruts and lane cells. `width` is the whole view
 * width, the road sits at [roadLeft, roadLeft + lanes × laneWidth]. Tiles repeat cleanly (a seeded scatter).
 */
export function paintWorldRoad(c: Ctx, p: RoadPalette, world: number, width: number, height: number, roadLeft: number, laneWidth: number, lanes: number) {
  const roadRight = roadLeft + laneWidth * lanes;
  c.fillStyle = p.grass; c.fillRect(0, 0, width, height);
  let seed = 7 + world * 31;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 90 + width / 3; i++) {
    const left = i % 2 === 0, x = left ? rand() * (roadLeft - 4) : roadRight + 4 + rand() * (width - roadRight - 4), y = rand() * height, tone = rand();
    c.strokeStyle = tone < 0.5 ? p.grassDeep : p.grassLight; c.lineWidth = 1;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x - 1.5, y - 4); c.moveTo(x, y); c.lineTo(x + 1.5, y - 4); c.stroke();
    if (tone > 0.94 && world < 2) ellipse(c, x + 3, y - 2, 1.2, 1.2, tone > 0.97 ? "#fff3c4" : "#f0b8c8");
  }
  c.fillStyle = p.road; c.fillRect(roadLeft, 0, roadRight - roadLeft, height);
  c.fillStyle = world === 2 ? "rgba(255,255,255,0.05)" : "rgba(160,110,60,0.07)";
  for (let x = roadLeft + 2; x < roadRight; x += 12) c.fillRect(x, 0, 1, height);
  for (let y = 0; y < height; y += 12) c.fillRect(roadLeft, y, roadRight - roadLeft, 1);
  for (let lane = 0; lane < lanes; lane++) {
    const mid = roadLeft + laneWidth * (lane + 0.5);
    c.fillStyle = p.rut; c.fillRect(mid - 15, 0, 5, height); c.fillRect(mid + 10, 0, 5, height);
  }
  for (let i = 0; i < 60; i++) ellipse(c, roadLeft + 4 + rand() * (roadRight - roadLeft - 8), rand() * height, 0.6 + rand() * 1.2, 0.5 + rand() * 0.8, rand() < 0.5 ? p.speck : p.speckLight);
  if (world === 2) for (let i = 0; i < 7; i++) {
    const x = roadLeft + 12 + rand() * (roadRight - roadLeft - 24), y = rand() * height;
    ellipse(c, x, y, 7 + rand() * 6, 2.4 + rand() * 1.6, "#8ea3b866");
  }
  for (let lane = 1; lane < lanes; lane++) {
    const x = roadLeft + laneWidth * lane;
    for (let y = 2; y < height; y += 48) for (let k = 0; k < 3; k++) {
      rounded(c, x - 4, y + k * 10, 8, 8, 1.5, p.cell);
      c.fillStyle = "#ffffff33"; c.fillRect(x - 3, y + k * 10 + 1, 3, 1.5);
    }
  }
  for (const edge of [roadLeft, roadRight]) {
    c.fillStyle = p.edge; c.fillRect(edge - 2, 0, 4, height);
    for (let y = 0; y < height; y += 6) ellipse(c, edge + (edge === roadLeft ? -2 : 2), y + rand() * 4, 2.6 + rand() * 1.4, 2.2, rand() < 0.5 ? p.grass : p.grassDeep);
  }
}

/** Mud: a brown wet stretch across the whole road, `height` long, with ruts and a few shine marks. */
export function paintMud(c: Ctx, width: number, height: number) {
  let seed = 91;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  c.fillStyle = "#8a6444"; c.beginPath(); c.roundRect(0, 0, width, height, 14); c.fill();
  c.fillStyle = "#74502f";
  for (let i = 0; i < 26; i++) ellipse(c, rand() * width, rand() * height, 5 + rand() * 9, 2.4 + rand() * 3, "#74502f", rand() * 3);
  c.strokeStyle = "#5a3d24"; c.lineWidth = 2;
  for (const x of [width * 0.22, width * 0.5, width * 0.78]) { c.beginPath(); c.moveTo(x - 7, 4); c.lineTo(x - 5, height - 4); c.moveTo(x + 7, 4); c.lineTo(x + 5, height - 4); c.stroke(); }
  for (let i = 0; i < 9; i++) ellipse(c, rand() * width, rand() * height, 4 + rand() * 4, 1.4, "#c9a47c88", 0.1);
}

/**
 * A ভ্যান (the flat-bed rickshaw van) coming straight at you: wide wooden bed with sacks, the puller on the seat, a red
 * headlamp-band and a horn. Seen from the front: about 50 wide, 84 long. Near edge at y = 0.
 */
export function drawVan(c: Ctx, look: number) {
  ellipse(c, 6, -42, 27, 42, C.shadow);
  rounded(c, -26, -20, 7, 18, 3, C.tyre); rounded(c, 19, -20, 7, 18, 3, C.tyre);
  rounded(c, -26, -76, 7, 18, 3, C.tyre); rounded(c, 19, -76, 7, 18, 3, C.tyre);
  rounded(c, -23, -82, 46, 70, 4, look % 2 ? "#3f7d6e" : "#b8452f");
  rounded(c, -23, -82, 46, 6, 3, "#00000022");
  c.fillStyle = "#ffffff44"; for (let y = -72; y < -16; y += 11) c.fillRect(-21, y, 42, 1.3);
  // sacks on the bed
  for (const [x, y] of [[-11, -64], [10, -62], [-9, -46], [11, -44]] as const) { rounded(c, x - 8, y - 9, 16, 18, 6, "#dcc196"); rounded(c, x - 5, y - 10, 10, 3, 1.5, "#b99c6e"); }
  // the puller: head, shoulders, handlebar, a gamchha
  stroke(c, [-17, -12, 17, -12], "#3b4246", 2.4);
  ellipse(c, 0, -26, 10, 7, look % 2 ? "#e0b84c" : "#4a6fa5");
  ellipse(c, 0, -34, 5.6, 6, "#a8724a");
  ellipse(c, 0, -37, 5.8, 4.2, C.hair);
  rounded(c, -3, -28, 6, 3, 1.5, C.gamchha);
  // the front: a headlamp band that reads as a warning, and the horn
  rounded(c, -14, -6, 28, 5, 2.5, "#ffd166"); rounded(c, -14, -6, 9, 5, 2.5, "#e5483b"); rounded(c, 5, -6, 9, 5, 2.5, "#e5483b");
  ellipse(c, 16, -17, 3.4, 3.4, C.steel); ellipse(c, 15.4, -17.6, 1, 1, "#ffffff");
}

/** A dog running up behind you: a lean village dog seen from above, ears back. About 20 wide, 34 long, rear end at y = 0. */
export function drawDog(c: Ctx, frame: number) {
  ellipse(c, 4, -16, 10, 16, C.shadow);
  const swing = frame ? 3 : -3;
  stroke(c, [-5, -5, -6.5, -5 + swing], "#6b4a2e", 2.6); stroke(c, [5, -5, 6.5, -5 - swing], "#6b4a2e", 2.6);
  stroke(c, [-5, -22, -6.5, -22 - swing], "#6b4a2e", 2.6); stroke(c, [5, -22, 6.5, -22 + swing], "#6b4a2e", 2.6);
  stroke(c, [0, -3, frame ? 4 : -4, 4], "#8a5f38", 2.4);
  ellipse(c, 0, -14, 6.6, 14, "#a3703f");
  ellipse(c, 0, -18, 4.4, 8, "#c28a54");
  ellipse(c, 0, -30, 5.2, 5.4, "#a3703f");
  ellipse(c, -4.6, -28.5, 2.2, 3.6, "#6b4a2e", 0.4); ellipse(c, 4.6, -28.5, 2.2, 3.6, "#6b4a2e", -0.4);
  ellipse(c, 0, -34.6, 2.6, 2.2, "#3a2d24");
  ellipse(c, -2, -31.4, 0.9, 0.9, C.ink); ellipse(c, 2, -31.4, 0.9, 0.9, C.ink);
}

/** A hurricane lantern (লণ্ঠন) with its glow, centred at (0, 0). */
export function drawLantern(c: Ctx, glow: boolean) {
  if (glow) {
    const g = c.createRadialGradient(0, 0, 1, 0, 0, 26);
    g.addColorStop(0, "rgba(255,214,120,0.85)"); g.addColorStop(1, "rgba(255,214,120,0)");
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 26, 0, TAU); c.fill();
  }
  rounded(c, -3.4, -6, 6.8, 2.6, 1, "#3b4246"); rounded(c, -3.4, 3.4, 6.8, 2.4, 1, "#3b4246");
  rounded(c, -2.8, -4, 5.6, 8, 2.4, glow ? "#ffe9a8" : "#d8cfa8");
  stroke(c, [-2.4, -6, 0, -9, 2.4, -6], "#3b4246", 1);
}

export type GateLook = { wall: string; roof: string; door: string };
const GATES: readonly GateLook[] = [
  { wall: "#e9d8b8", roof: "#a85a3a", door: "#7a4f2b" },
  { wall: "#d9e4cf", roof: "#9eabb0", door: "#6b4a2e" },
  { wall: "#f1dfc2", roof: "#8f6a4a", door: "#5a3b28" },
];
export const GATE_W = 64, GATE_H = 78;

/**
 * A village gate on the verge, seen from above at a slight tilt: a hut with a tin or tile roof, a bamboo gate, and a person
 * at the road edge. `state` 0 waiting (hand raised and waving), 1 delivered (the letter in the raised hand), 2 missed
 * (hand down). `side` 0 left, 1 right: the person stands on the road side. Centred on (0, 0); the hand is at (± 24, 6).
 */
export function drawGate(c: Ctx, look: number, side: number, state: number, wave: number) {
  const g = GATES[look % 3], dir = side ? -1 : 1; // towards the road
  ellipse(c, 4, 6, 28, 32, C.shadow);
  // the hut and its roof
  rounded(c, -dir * 6 - 22, -32, 44, 50, 3, g.wall);
  rounded(c, -dir * 6 - 26, -36, 52, 28, 4, g.roof);
  c.fillStyle = "#00000022"; for (let x = -dir * 6 - 24; x < -dir * 6 + 26; x += 5) c.fillRect(x, -36, 1.2, 28);
  rounded(c, -dir * 6 - 5, -2, 12, 20, 2, g.door);
  // a bamboo fence along the road edge
  stroke(c, [dir * 22, -24, dir * 22, 22], "#b89a5e", 2.4);
  for (let y = -20; y < 22; y += 8) stroke(c, [dir * 22, y, dir * 29, y], "#c9ac70", 1.6);
  // the person: head, shoulders, an arm
  const px = dir * 31, py = 4;
  ellipse(c, px - dir * 2, py + 9, 7.4, 5.4, look % 2 ? "#e0b84c" : "#c8463d");
  ellipse(c, px - dir * 2, py + 2, 4.6, 5, "#a8724a");
  ellipse(c, px - dir * 2, py - 0.6, 4.8, 3.4, C.hair);
  if (state === 2) {
    stroke(c, [px - dir * 2, py + 8, px - dir * 3, py + 16], "#a8724a", 3);
    ellipse(c, px - dir * 3, py + 17, 2.1, 2.1, "#a8724a");
  } else {
    const sway = state === 0 ? Math.sin(wave) * 3 : 0;
    stroke(c, [px - dir * 2, py + 7, px + dir * 3 + sway * 0.4, py - 8], "#a8724a", 3);
    ellipse(c, px + dir * 3 + sway * 0.4, py - 9.5, 2.6, 2.6, "#a8724a");
    if (state === 1) {
      c.save(); c.translate(px + dir * 3.5, py - 13); c.rotate(dir * 0.3);
      rounded(c, -7, -4.5, 14, 9, 1, C.paper); c.strokeStyle = "#c9a77a"; c.lineWidth = 0.7;
      c.beginPath(); c.moveTo(-7, -4.5); c.lineTo(0, 0.5); c.lineTo(7, -4.5); c.stroke();
      rounded(c, 2, -3.6, 3.4, 3.6, 0.4, C.stamp);
      c.restore();
    }
  }
}

/** A bamboo clump: tall canes from above, leaves splayed. Spans about 44. */
export function drawBamboo(c: Ctx) {
  ellipse(c, 6, 5, 22, 18, C.shadow);
  for (let i = 0; i < 9; i++) {
    c.save(); c.rotate(i * TAU / 9);
    ellipse(c, 13, 0, 14, 3.2, i % 2 ? "#6f9d48" : "#86b25a");
    stroke(c, [3, 0, 26, 0], "#c9d98c", 0.7);
    c.restore();
  }
  ellipse(c, 0, 0, 4.4, 4.4, "#b7c76a"); ellipse(c, 0, 0, 2, 2, "#d9e49a");
}

/** A patch of jute (পাট): tall green stalks in rows from above. About 44 by 56. */
export function drawJute(c: Ctx) {
  rounded(c, -22, -28, 44, 56, 6, "#6f9d48");
  for (let x = -17; x <= 17; x += 8) for (let y = -23; y <= 24; y += 8) {
    ellipse(c, x, y, 3.8, 3.2, (x + y) % 16 ? "#86b25a" : "#9ac368");
    ellipse(c, x - 0.8, y - 0.8, 1.2, 1, "#c9e0a0");
  }
}

/** A bamboo-pole banner for the place: two poles and a cloth with room for the name (the scene writes it). Centred on x = 0, base at y = 0. */
export function drawBanner(c: Ctx, width: number) {
  stroke(c, [-width / 2, 0, -width / 2, -54], "#a8865a", 3); stroke(c, [width / 2, 0, width / 2, -54], "#a8865a", 3);
  rounded(c, -width / 2, -54, width, 26, 4, "#e5483b");
  c.fillStyle = "#ffd166"; c.fillRect(-width / 2 + 4, -51, width - 8, 2); c.fillRect(-width / 2 + 4, -33, width - 8, 2);
}
