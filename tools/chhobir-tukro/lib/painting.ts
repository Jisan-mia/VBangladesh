// The village paintings: a seed picks the layers (sky, sun or moon, river, boat, hut, palms, banana trees, paddy, birds, hill, fog),
// and drawPainting paints them on any 2D context. Pure: no DOM, nothing per frame. The game paints once per level into an offscreen canvas.
import { makeRng, pick } from "../../../shared/game-core";
import type { World } from "./game";

type Rgb = readonly [number, number, number];
const hex = (value: string): Rgb => [parseInt(value.slice(1, 3), 16), parseInt(value.slice(3, 5), 16), parseInt(value.slice(5, 7), 16)];
/** A colour between a and b (t from 0 to 1), with optional alpha. */
export function mix(a: string, b: string, t: number, alpha = 1) {
  const x = hex(a), y = hex(b), at = (index: number) => Math.round(x[index] + (y[index] - x[index]) * t);
  return alpha < 1 ? `rgba(${at(0)},${at(1)},${at(2)},${alpha})` : `rgb(${at(0)},${at(1)},${at(2)})`;
}
const rgba = (value: string, alpha: number) => mix(value, value, 0, Math.min(0.999, alpha));

type Palette = {
  sky: [string, string, string]; orb: string; glow: string; cloud: [string, string]; hill: string; trees: string;
  far: string; near: string; gold: [string, string]; water: [string, string]; bank: string; leaf: [string, string];
  trunk: string; mud: string; thatch: string; hull: string; ink: string; fog: string; plume: string;
};

// Three skies a world: soft dawns, warm dusks, blue moonlight. Never neon.
const PALETTES: readonly (readonly Palette[])[] = [
  [
    { sky: ["#8fb8d8", "#cfe0e8", "#fbe3c4"], orb: "#ffe7a8", glow: "#ffe3b0", cloud: ["#ffffff", "#f1dccd"], hill: "#9fb6c2", trees: "#7d9a86", far: "#a9c08e", near: "#5f9440", gold: ["#d9c46a", "#b99a3e"], water: ["#d3e2ea", "#86aac2"], bank: "#eadcb6", leaf: ["#4f8a3c", "#79b25a"], trunk: "#7a5a40", mud: "#c99360", thatch: "#d8b866", hull: "#5a3a26", ink: "#4d5d6c", fog: "#fffaf0", plume: "#fffdf6" },
    { sky: ["#9ab6de", "#e4d8e4", "#fcd8b4"], orb: "#ffdca8", glow: "#ffd8b8", cloud: ["#fff8f4", "#efcfc6"], hill: "#a9aec8", trees: "#7f948e", far: "#b2c493", near: "#649945", gold: ["#dcc56e", "#bb9b40"], water: ["#e2dbe4", "#8ea6c4"], bank: "#ecdab8", leaf: ["#518c3e", "#7cb45c"], trunk: "#7a5a40", mud: "#cc9564", thatch: "#dbba6a", hull: "#5a3a26", ink: "#56566a", fog: "#fff6f0", plume: "#fffaf6" },
    { sky: ["#78a8cf", "#bdd7e4", "#f2e7c9"], orb: "#fff0b8", glow: "#fff0c8", cloud: ["#ffffff", "#e3e6dc"], hill: "#93b0b9", trees: "#6f917c", far: "#9fbd86", near: "#56903c", gold: ["#d5c266", "#b2963a"], water: ["#cfe3ea", "#7ba6bd"], bank: "#e6dcb8", leaf: ["#4a873a", "#72ad55"], trunk: "#76583e", mud: "#c48f5d", thatch: "#d4b462", hull: "#553824", ink: "#47596a", fog: "#fbfbf4", plume: "#ffffff" },
  ],
  [
    { sky: ["#43578f", "#e8875e", "#ffd27f"], orb: "#ffb23f", glow: "#ffb36a", cloud: ["#ffd7ae", "#e2776c"], hill: "#8e6a83", trees: "#5a3f4a", far: "#9a7c4c", near: "#7f6a2c", gold: ["#e0ac48", "#b98328"], water: ["#f6b072", "#6c5a80"], bank: "#e9b77a", leaf: ["#3f5a2e", "#5f7a3a"], trunk: "#5a3b2c", mud: "#b8784a", thatch: "#cf9c4c", hull: "#3a2420", ink: "#3a2734", fog: "#ffd6a8", plume: "#ffe7cc" },
    { sky: ["#5b4c88", "#ee7e68", "#ffc88a"], orb: "#ffa64a", glow: "#ff9f78", cloud: ["#ffcfb3", "#d96a72"], hill: "#90647f", trees: "#563a48", far: "#9b7650", near: "#7c6430", gold: ["#dfa54a", "#b47a2a"], water: ["#f4a080", "#5f5280"], bank: "#e8ad80", leaf: ["#3d552e", "#5c763a"], trunk: "#583a2c", mud: "#b5744a", thatch: "#cc964e", hull: "#382220", ink: "#382432", fog: "#ffcdb0", plume: "#ffe4d6" },
    { sky: ["#2f5d8a", "#f09a58", "#ffe190"], orb: "#ffc24a", glow: "#ffc77a", cloud: ["#ffe2b0", "#e88a5e"], hill: "#7f7684", trees: "#4c4446", far: "#a08850", near: "#83702e", gold: ["#e6b64c", "#bd8c2c"], water: ["#f8c27a", "#4f6488"], bank: "#ecc27e", leaf: ["#3c5a2e", "#5f7c3a"], trunk: "#583c2a", mud: "#bb7c48", thatch: "#d2a24e", hull: "#382420", ink: "#352a30", fog: "#ffe0ac", plume: "#fff0d4" },
  ],
  [
    { sky: ["#0e1b3c", "#1e3868", "#4a6a9c"], orb: "#fbf3d2", glow: "#cfdcff", cloud: ["#a9b9dc", "#5f709e"], hill: "#2f4670", trees: "#14263a", far: "#2d4c58", near: "#1d3934", gold: ["#5b6a4c", "#45523a"], water: ["#4d6f9f", "#152a4c"], bank: "#40607a", leaf: ["#1d3d36", "#2f5a4c"], trunk: "#2a2a2e", mud: "#5c5a66", thatch: "#6c6a5c", hull: "#14100e", ink: "#0e1a26", fog: "#bcd0f0", plume: "#dde6ff" },
    { sky: ["#111734", "#28356c", "#5d72a8"], orb: "#fff6dc", glow: "#d8d8ff", cloud: ["#b0b4dc", "#646aa0"], hill: "#34406e", trees: "#16203a", far: "#304a5e", near: "#1f3638", gold: ["#5e6650", "#474e3c"], water: ["#566fa4", "#18264c"], bank: "#46587e", leaf: ["#1f3a3a", "#33564e"], trunk: "#2b2a30", mud: "#5e5a6c", thatch: "#6e6a60", hull: "#15100f", ink: "#10182a", fog: "#c4c8f0", plume: "#e2e4ff" },
    { sky: ["#08213b", "#1c4a6f", "#5289a8"], orb: "#f6f7e2", glow: "#cfeaff", cloud: ["#a6c6dc", "#56809e"], hill: "#2a5470", trees: "#0f2a36", far: "#2a5258", near: "#1a3c36", gold: ["#566e4e", "#40543a"], water: ["#4f86a8", "#0f2e48"], bank: "#3e6a7c", leaf: ["#1a403a", "#2c5f50"], trunk: "#28302e", mud: "#566068", thatch: "#66705e", hull: "#121210", ink: "#0a1a24", fog: "#c0dcf0", plume: "#e0f0ff" },
  ],
];

export type Painting = {
  seed: number; world: World; palette: number; horizon: number; name: string;
  orb: { x: number; y: number; r: number };
  clouds: { x: number; y: number; w: number }[];
  birds: { x: number; y: number; s: number }[];
  stars: { x: number; y: number; r: number }[];
  hills: { x: number; w: number; h: number }[];
  river: { top: number; bottom: number; width: number; bend: number };
  hut: { x: number; y: number; w: number; stack: number };
  palms: { x: number; y: number; h: number; lean: number }[];
  bananas: { x: number; y: number; s: number }[];
  boat: { t: number; shift: number; s: number; sail: boolean; dir: 1 | -1 };
  gold: boolean; fog: number;
  kash: { x: number; y: number; w: number } | null;
  fireflies: { x: number; y: number }[];
};

const between = (rng: () => number, low: number, high: number) => low + rng() * (high - low);

/** Where the river runs at depth t (0 at the horizon, 1 at the bottom edge): its centre and half its width, in picture units. */
export function riverAt({ horizon, river }: Pick<Painting, "horizon" | "river">, t: number) {
  const ease = t * t * (3 - 2 * t);
  return { x: river.top + (river.bottom - river.top) * ease + river.bend * Math.sin(Math.PI * t), half: 0.012 + (river.width / 2 - 0.012) * t ** 1.35, y: horizon + t * (1 - horizon) };
}
/** Depth t for a picture height y below the horizon. */
const depthOf = (horizon: number, y: number) => (y - horizon) / (1 - horizon);

/** The painting for a seed and world. Same seed, same painting on every phone. */
export function paintingOf(seed: number, world: World): Painting {
  const rng = makeRng((seed * 2654435761) >>> 0);
  const palette = pick(rng, 3), horizon = between(rng, 0.4, 0.48);
  const river = { top: between(rng, 0.32, 0.68), bottom: 0, width: between(rng, 0.36, 0.5), bend: between(rng, -0.17, 0.17) };
  river.bottom = river.top < 0.5 ? between(rng, 0.56, 0.84) : between(rng, 0.16, 0.44);
  const shape = { horizon, river };

  // The hut sits on the wider bank, a third of the way down the land.
  const hutT = between(rng, 0.3, 0.42), atHut = riverAt(shape, hutT), hutLeft = atHut.x > 0.5;
  const hutW = 0.11 + hutT * 0.12;
  const room = hutLeft ? [0.06 + hutW / 2, atHut.x - atHut.half - hutW / 2 - 0.05] : [atHut.x + atHut.half + hutW / 2 + 0.05, 0.94 - hutW / 2];
  const hut = { x: room[1] > room[0] ? between(rng, room[0], room[1]) : (room[0] + room[1]) / 2, y: atHut.y, w: hutW, stack: rng() < 0.6 ? (rng() < 0.5 ? -1 : 1) : 0 };

  // A tall palm beside the hut always reaches into the sky (so the sky pieces have something to tell them apart).
  const side = hutLeft ? -1 : 1;
  const palms = [{ x: hut.x - side * hut.w * between(rng, 0.75, 1.0), y: hut.y + 0.01, h: between(rng, 0.34, 0.42), lean: between(rng, -0.12, 0.12) }];
  const farCount = 1 + pick(rng, 2);
  for (let index = 0; index < farCount; index++) {
    const t = between(rng, 0.06, 0.22), at = riverAt(shape, t);
    const x = hutLeft ? between(rng, at.x + at.half + 0.05, 0.95) : between(rng, 0.05, at.x - at.half - 0.05);
    palms.push({ x, y: at.y, h: 0.12 + t * 0.6, lean: between(rng, -0.1, 0.1) });
  }
  const bananas = Array.from({ length: 1 + pick(rng, 2) }, (_, index) => ({ x: hut.x + side * hut.w * (0.7 + index * 0.5), y: hut.y + 0.015 + index * 0.01, s: hut.w * between(rng, 1.15, 1.4) }));

  const boatT = between(rng, 0.3, 0.6);
  const boat = { t: boatT, shift: between(rng, -0.35, 0.35), s: 0.1 + boatT * 0.13, sail: rng() < 0.5, dir: (rng() < 0.5 ? 1 : -1) as 1 | -1 };

  const orbLeft = rng() < 0.5;
  const orb = world === 2
    ? { x: orbLeft ? between(rng, 0.14, 0.34) : between(rng, 0.66, 0.86), y: between(rng, 0.1, 0.2), r: between(rng, 0.045, 0.06) }
    : { x: orbLeft ? between(rng, 0.16, 0.4) : between(rng, 0.6, 0.84), y: horizon - between(rng, 0.06, 0.15), r: world === 1 ? between(rng, 0.06, 0.08) : between(rng, 0.045, 0.06) };

  const cloudCount = 2 + pick(rng, 3);
  const clouds = Array.from({ length: cloudCount }, (_, index) => ({
    x: (index + between(rng, 0.2, 0.8)) / cloudCount, y: between(rng, 0.07, horizon - 0.16), w: between(rng, 0.16, 0.28),
  }));
  const flock = { x: between(rng, 0.2, 0.8), y: between(rng, 0.1, horizon - 0.18) };
  const birds = world === 2 ? [] : Array.from({ length: 3 + pick(rng, 4) }, () => ({ x: flock.x + between(rng, -0.12, 0.12), y: flock.y + between(rng, -0.05, 0.05), s: between(rng, 0.009, 0.016) }));
  const stars = world === 2 ? Array.from({ length: 46 }, () => ({ x: rng(), y: between(rng, 0.01, horizon - 0.06), r: between(rng, 0.0012, 0.003) })) : [];
  const hills = rng() < 0.65 ? Array.from({ length: 1 + pick(rng, 2) }, () => ({ x: between(rng, 0.1, 0.9), w: between(rng, 0.35, 0.6), h: between(rng, 0.05, 0.1) })) : [];
  const gold = rng() < [0.3, 0.75, 0.4][world];
  const fog = [between(rng, 0.65, 1), between(rng, 0.2, 0.4), between(rng, 0.3, 0.5)][world];

  // Kash flowers on the near bank across the water from the hut.
  const near = riverAt(shape, 0.93);
  const kashRoom = hutLeft ? [near.x + near.half + 0.06, 0.92] : [0.08, near.x - near.half - 0.06];
  const kash = rng() < 0.7 && kashRoom[1] - kashRoom[0] > 0.08 ? { x: between(rng, kashRoom[0], kashRoom[1]), y: between(rng, 0.92, 0.98), w: between(rng, 0.12, 0.2) } : null;
  const fireflies = world === 2 ? Array.from({ length: 14 }, () => ({ x: rng(), y: between(rng, horizon + 0.08, 0.96) })) : [];

  const features = [boat.sail ? "পালতোলা নৌকা" : "খেয়া নৌকা", "নদীর ধারের ঘর", gold ? "পাকা ধানের খেত" : "সবুজ ধানখেত"];
  if (hills.length) features.push("পাহাড়ের কোলে নদী");
  if (kash) features.push("কাশবন");
  if (hut.stack) features.push("খড়ের গাদা");
  const name = `${["ভোরের", "গোধূলির", "জোছনার"][world]} ${features[pick(rng, features.length)]}`;

  return { seed, world, palette, horizon, name, orb, clouds, birds, stars, hills, river, hut, palms, bananas, boat, gold, fog, kash, fireflies };
}

export const paletteOf = (painting: Painting) => PALETTES[painting.world][painting.palette];

/** The subset of a 2D context the painting uses, so a test can paint onto a recorder. */
type Ink = CanvasRenderingContext2D;

/** Paints the whole picture into the square at (left, top), `size` pixels wide. Safe to call on any 2D context; costs a few ms, so do it once. */
export function drawPainting(c: Ink, painting: Painting, left: number, top: number, size: number) {
  const p = paletteOf(painting), H = painting.horizon, night = painting.world === 2;
  const X = (u: number) => left + u * size, Y = (v: number) => top + v * size, L = (u: number) => u * size;
  const rng = makeRng(painting.seed ^ 0x9e3779b9);
  c.save();
  c.beginPath(); c.rect(left, top, size, size); c.clip();
  c.lineCap = "round"; c.lineJoin = "round";

  // Sky: three soft stops, then the glow around the sun or moon.
  const sky = c.createLinearGradient(0, Y(0), 0, Y(H + 0.02));
  sky.addColorStop(0, p.sky[0]); sky.addColorStop(0.58, p.sky[1]); sky.addColorStop(1, p.sky[2]);
  c.fillStyle = sky; c.fillRect(left, top, size, L(H + 0.03));
  const { orb } = painting;
  const glow = c.createRadialGradient(X(orb.x), Y(orb.y), 0, X(orb.x), Y(orb.y), L(night ? 0.38 : 0.5));
  glow.addColorStop(0, rgba(p.glow, night ? 0.4 : 0.6)); glow.addColorStop(0.3, rgba(p.glow, night ? 0.14 : 0.24)); glow.addColorStop(1, rgba(p.glow, 0));
  c.fillStyle = glow; c.fillRect(left, top, size, L(H + 0.03));

  for (const star of painting.stars) {
    c.fillStyle = rgba("#ffffff", 0.45 + rng() * 0.5);
    c.beginPath(); c.arc(X(star.x), Y(star.y), Math.max(0.6, L(star.r)), 0, Math.PI * 2); c.fill();
  }

  // The sun or moon: a soft disc, the moon with a few faint marks.
  const disc = c.createRadialGradient(X(orb.x - orb.r * 0.3), Y(orb.y - orb.r * 0.3), 0, X(orb.x), Y(orb.y), L(orb.r));
  disc.addColorStop(0, mix(p.orb, "#ffffff", 0.6)); disc.addColorStop(1, p.orb);
  c.fillStyle = disc; c.beginPath(); c.arc(X(orb.x), Y(orb.y), L(orb.r), 0, Math.PI * 2); c.fill();
  if (night) {
    c.fillStyle = rgba("#c9c2a4", 0.35);
    for (const [dx, dy, r] of [[-0.3, -0.2, 0.22], [0.25, 0.1, 0.16], [-0.05, 0.38, 0.12]]) { c.beginPath(); c.arc(X(orb.x + dx * orb.r), Y(orb.y + dy * orb.r), L(r * orb.r), 0, Math.PI * 2); c.fill(); }
  }

  // Clouds: overlapping puffs on a flat base, lit from the top.
  for (const cloud of painting.clouds) {
    const w = cloud.w, cx = cloud.x, cy = cloud.y;
    const shade = c.createLinearGradient(0, Y(cy - w * 0.22), 0, Y(cy + w * 0.08));
    shade.addColorStop(0, rgba(p.cloud[0], night ? 0.5 : 0.95)); shade.addColorStop(1, rgba(p.cloud[1], night ? 0.3 : 0.85));
    c.fillStyle = shade;
    c.beginPath();
    for (const [dx, dy, r] of [[-0.36, 0.01, 0.13], [-0.17, -0.06, 0.18], [0.05, -0.1, 0.21], [0.25, -0.04, 0.16], [0.4, 0.02, 0.11]]) {
      c.moveTo(X(cx + dx * w + r * w), Y(cy + dy * w));
      c.arc(X(cx + dx * w), Y(cy + dy * w), L(r * w), 0, Math.PI * 2);
    }
    c.fill();
    c.beginPath(); c.ellipse(X(cx), Y(cy + 0.03 * w), L(w * 0.5), L(w * 0.08), 0, 0, Math.PI * 2); c.fill();
  }

  // Far hills, hazy with distance.
  painting.hills.forEach((hill, index) => {
    const l = hill.x - hill.w / 2, r = hill.x + hill.w / 2, h = hill.h * (index ? 0.75 : 1);
    c.fillStyle = mix(p.sky[2], p.hill, index ? 0.45 : 0.7);
    c.beginPath(); c.moveTo(X(l), Y(H + 0.01));
    c.bezierCurveTo(X(l + hill.w * 0.25), Y(H - h * 0.2), X(hill.x - hill.w * 0.18), Y(H - h), X(hill.x), Y(H - h));
    c.bezierCurveTo(X(hill.x + hill.w * 0.18), Y(H - h), X(r - hill.w * 0.25), Y(H - h * 0.2), X(r), Y(H + 0.01));
    c.closePath(); c.fill();
  });

  // A far line of village trees along the horizon.
  c.fillStyle = mix(p.sky[2], p.trees, 0.62);
  c.beginPath(); c.moveTo(X(0), Y(H + 0.02));
  for (let u = -0.02; u < 1.04;) {
    const r = 0.012 + rng() * 0.026;
    c.arc(X(u + r), Y(H + 0.004), L(r), Math.PI, 0);
    u += r * (1.4 + rng() * 0.8);
  }
  c.lineTo(X(1.05), Y(H + 0.02)); c.closePath(); c.fill();

  // Land: hazy far, rich near, in paddy strips with raised ridges (আল) between them.
  const field = painting.gold ? p.gold : [p.far, p.near];
  const land = c.createLinearGradient(0, Y(H), 0, Y(1));
  land.addColorStop(0, mix(painting.gold ? field[0] : p.far, p.sky[2], 0.35)); land.addColorStop(1, painting.gold ? field[1] : p.near);
  c.fillStyle = land; c.fillRect(left, Y(H), size, L(1 - H) + 1);
  const rows = 9, vx = painting.river.top + (painting.seed % 7 - 3) * 0.02;
  for (let k = 0; k < rows; k++) {
    const y0 = H + (1 - H) * (k / rows) ** 1.6, y1 = H + (1 - H) * ((k + 1) / rows) ** 1.6;
    // Plots: rays from the vanishing point split each strip into fields of slightly different shades.
    for (let j = -4; j <= 4; j++) {
      const shade = (k * 7 + j * 3 + 20) % 4;
      if (!shade) continue;
      c.fillStyle = shade === 1 ? rgba("#ffffff", night ? 0.025 : 0.055) : shade === 2 ? rgba("#2a1a00", 0.045) : rgba(painting.gold ? "#fff0a0" : "#d8e870", night ? 0.02 : 0.06);
      const ray = (offset: number, y: number) => vx + (offset * 0.2 - 0.0) * ((y - H + 0.04) / (1 - H + 0.04)) * 2.2;
      c.beginPath(); c.moveTo(X(ray(j, y0)), Y(y0)); c.lineTo(X(ray(j + 1, y0)), Y(y0)); c.lineTo(X(ray(j + 1, y1)), Y(y1)); c.lineTo(X(ray(j, y1)), Y(y1)); c.closePath(); c.fill();
    }
    c.strokeStyle = rgba(p.bank, night ? 0.25 : 0.45); c.lineWidth = Math.max(0.6, L(0.0015 + 0.004 * (k / rows)));
    c.beginPath(); c.moveTo(X(0), Y(y1)); c.lineTo(X(1), Y(y1 - 0.004 * (k % 3))); c.stroke();
    if (k >= 4) {
      // Rice shoots: short strokes, a little denser up close.
      c.strokeStyle = rgba(painting.gold ? "#f4d27a" : p.leaf[1], night ? 0.25 : 0.55); c.lineWidth = Math.max(0.6, L(0.002 + 0.0015 * (k - 4)));
      c.beginPath();
      for (let index = 0; index < 18 + k * 2; index++) {
        const x = rng(), y = y0 + (y1 - y0) * (0.3 + rng() * 0.6), h = 0.008 + 0.006 * (k - 4);
        c.moveTo(X(x), Y(y)); c.lineTo(X(x + (rng() - 0.5) * 0.006), Y(y - h));
      }
      c.stroke();
    }
  }

  // The river, winding from the horizon to the near edge, with a sandy bank line.
  const edge = (sign: number) => Array.from({ length: 25 }, (_, index) => { const at = riverAt(painting, (index / 24) * 1.06); return [X(at.x + sign * at.half), Y(at.y)] as const; });
  const leftBank = edge(-1), rightBank = edge(1).reverse();
  const water = c.createLinearGradient(0, Y(H), 0, Y(1));
  water.addColorStop(0, p.water[0]); water.addColorStop(1, p.water[1]);
  c.beginPath(); c.moveTo(...leftBank[0]);
  for (const point of [...leftBank.slice(1), ...rightBank]) c.lineTo(...point);
  c.closePath();
  c.save(); c.fillStyle = water; c.fill(); c.clip();
  // The sun or moon's road on the water, and a few ripples.
  for (let index = 0; index < 16; index++) {
    const y = H + 0.01 + (1 - H) * (index / 16) ** 1.3, w = 0.02 + 0.07 * (index / 16) * rng();
    c.fillStyle = rgba(p.glow, night ? 0.5 : 0.55);
    c.fillRect(X(orb.x - w / 2 + (rng() - 0.5) * 0.02), Y(y), L(w), Math.max(1, L(0.003 + 0.003 * index / 16)));
  }
  c.strokeStyle = rgba("#ffffff", night ? 0.18 : 0.35); c.lineWidth = Math.max(0.6, L(0.0025));
  c.beginPath();
  for (let index = 0; index < 22; index++) {
    const t = 0.1 + rng() * 0.95, at = riverAt(painting, t), x = at.x + (rng() - 0.5) * at.half * 1.6, w = 0.01 + 0.03 * t;
    c.moveTo(X(x - w / 2), Y(at.y)); c.lineTo(X(x + w / 2), Y(at.y));
  }
  c.stroke();
  c.restore();
  c.strokeStyle = rgba(p.bank, 0.75);
  for (const bank of [leftBank, rightBank]) {
    c.lineWidth = Math.max(1, L(0.0045));
    c.beginPath(); c.moveTo(...bank[0]);
    for (const point of bank.slice(1)) c.lineTo(...point);
    c.stroke();
  }

  // Low mist over the far fields.
  if (painting.fog > 0) {
    const mist = c.createLinearGradient(0, Y(H - 0.07), 0, Y(H + 0.1));
    mist.addColorStop(0, rgba(p.fog, 0)); mist.addColorStop(0.45, rgba(p.fog, 0.55 * painting.fog)); mist.addColorStop(1, rgba(p.fog, 0));
    c.fillStyle = mist; c.fillRect(left, Y(H - 0.07), size, L(0.17));
  }

  // Everything standing on the land or water, back to front.
  const things: { y: number; draw: () => void }[] = [
    { y: painting.hut.y, draw: () => drawHut(c, painting, p, X, Y, L) },
    { y: riverAt(painting, painting.boat.t).y, draw: () => drawBoat(c, painting, p, X, Y, L) },
    ...painting.palms.map(palm => ({ y: palm.y, draw: () => drawPalm(c, palm, p, night, X, Y, L, rng) })),
    ...painting.bananas.map(tree => ({ y: tree.y, draw: () => drawBanana(c, tree, p, X, Y, L, rng) })),
    ...(painting.kash ? [{ y: painting.kash.y, draw: () => drawKash(c, painting.kash!, p, X, Y, L, rng) }] : []),
  ];
  things.sort((a, b) => a.y - b.y).forEach(thing => thing.draw());

  // Birds heading home.
  c.strokeStyle = p.ink; c.lineWidth = Math.max(1, L(0.004));
  c.beginPath();
  for (const bird of painting.birds) {
    c.moveTo(X(bird.x - bird.s), Y(bird.y));
    c.quadraticCurveTo(X(bird.x - bird.s / 2), Y(bird.y - bird.s * 0.7), X(bird.x), Y(bird.y));
    c.quadraticCurveTo(X(bird.x + bird.s / 2), Y(bird.y - bird.s * 0.7), X(bird.x + bird.s), Y(bird.y));
  }
  c.stroke();

  for (const fly of painting.fireflies) {
    const light = c.createRadialGradient(X(fly.x), Y(fly.y), 0, X(fly.x), Y(fly.y), L(0.014));
    light.addColorStop(0, "rgba(255,240,150,0.95)"); light.addColorStop(0.35, "rgba(255,220,100,0.35)"); light.addColorStop(1, "rgba(255,220,100,0)");
    c.fillStyle = light; c.fillRect(X(fly.x - 0.015), Y(fly.y - 0.015), L(0.03), L(0.03));
  }

  // A little paper grain and a soft vignette, so it reads as a painting rather than a diagram.
  for (let index = 0; index < 700; index++) {
    c.fillStyle = rng() < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(60,40,20,0.05)";
    c.fillRect(X(rng()), Y(rng()), Math.max(1, L(0.003)), Math.max(1, L(0.003)));
  }
  const vignette = c.createRadialGradient(X(0.5), Y(0.45), L(0.42), X(0.5), Y(0.5), L(0.78));
  vignette.addColorStop(0, "rgba(30,15,0,0)"); vignette.addColorStop(1, night ? "rgba(0,0,10,0.3)" : "rgba(60,30,0,0.16)");
  c.fillStyle = vignette; c.fillRect(left, top, size, size);
  c.restore();
}

type Scale = (u: number) => number;

function drawHut(c: Ink, painting: Painting, p: Palette, X: Scale, Y: Scale, L: Scale) {
  const { x, y, w, stack } = painting.hut, night = painting.world === 2;
  c.fillStyle = "rgba(20,10,0,0.18)";
  c.beginPath(); c.ellipse(X(x), Y(y + w * 0.02), L(w * 0.72), L(w * 0.09), 0, 0, Math.PI * 2); c.fill();
  // Raised mud plinth, walls, door.
  c.fillStyle = mix(p.mud, "#3a2010", 0.25); c.fillRect(X(x - w * 0.56), Y(y - w * 0.08), L(w * 1.12), L(w * 0.1));
  const wall = c.createLinearGradient(X(x - w / 2), 0, X(x + w / 2), 0);
  wall.addColorStop(0, mix(p.mud, "#2a1508", 0.2)); wall.addColorStop(1, p.mud);
  c.fillStyle = wall; c.fillRect(X(x - w / 2), Y(y - w * 0.46), L(w), L(w * 0.39));
  c.fillStyle = night ? "#ffcf6b" : mix(p.mud, "#1a0d05", 0.65);
  c.fillRect(X(x - w * 0.08), Y(y - w * 0.36), L(w * 0.18), L(w * 0.29));
  if (night) {
    const lamp = c.createRadialGradient(X(x), Y(y - w * 0.22), 0, X(x), Y(y - w * 0.22), L(w * 0.6));
    lamp.addColorStop(0, "rgba(255,200,90,0.45)"); lamp.addColorStop(1, "rgba(255,200,90,0)");
    c.fillStyle = lamp; c.fillRect(X(x - w * 0.6), Y(y - w * 0.82), L(w * 1.2), L(w * 0.9));
  }
  // Thatched roof with a gentle sag and straw lines.
  c.fillStyle = p.thatch;
  c.beginPath();
  c.moveTo(X(x - w * 0.66), Y(y - w * 0.4));
  c.quadraticCurveTo(X(x), Y(y - w * 0.34), X(x + w * 0.66), Y(y - w * 0.4));
  c.lineTo(X(x + w * 0.34), Y(y - w * 0.82));
  c.quadraticCurveTo(X(x), Y(y - w * 0.86), X(x - w * 0.34), Y(y - w * 0.82));
  c.closePath(); c.fill();
  c.strokeStyle = mix(p.thatch, "#3a2410", 0.35); c.lineWidth = Math.max(0.6, L(w * 0.012));
  c.beginPath();
  for (let index = 1; index < 12; index++) {
    const u = -0.66 + (1.32 * index) / 12, top = -0.34 + (0.68 * index) / 12;
    c.moveTo(X(x + u * w), Y(y - w * 0.39)); c.lineTo(X(x + top * w), Y(y - w * 0.82));
  }
  c.stroke();
  // A haystack (খড়ের গাদা) with its pole, beside the hut.
  if (stack) {
    const sx = x + stack * w * 1.0, sw = w * 0.5;
    c.strokeStyle = mix(p.trunk, "#000000", 0.2); c.lineWidth = Math.max(1, L(w * 0.025));
    c.beginPath(); c.moveTo(X(sx), Y(y - sw * 1.25)); c.lineTo(X(sx), Y(y - sw * 0.9)); c.stroke();
    c.fillStyle = mix(p.thatch, "#ffffff", night ? 0 : 0.12);
    c.beginPath(); c.moveTo(X(sx - sw / 2), Y(y)); c.bezierCurveTo(X(sx - sw * 0.5), Y(y - sw * 0.8), X(sx - sw * 0.15), Y(y - sw * 1.05), X(sx), Y(y - sw * 1.0));
    c.bezierCurveTo(X(sx + sw * 0.15), Y(y - sw * 1.05), X(sx + sw * 0.5), Y(y - sw * 0.8), X(sx + sw / 2), Y(y)); c.closePath(); c.fill();
    c.strokeStyle = mix(p.thatch, "#3a2410", 0.3); c.lineWidth = Math.max(0.6, L(w * 0.01));
    c.beginPath(); c.moveTo(X(sx - sw * 0.42), Y(y - sw * 0.35)); c.quadraticCurveTo(X(sx), Y(y - sw * 0.25), X(sx + sw * 0.42), Y(y - sw * 0.35)); c.stroke();
  }
}

function drawBoat(c: Ink, painting: Painting, p: Palette, X: Scale, Y: Scale, L: Scale) {
  const { t, shift, s, sail, dir } = painting.boat, at = riverAt(painting, t), night = painting.world === 2;
  const bx = at.x + shift * at.half, by = at.y;
  const hull = (flipY: number) => {
    c.beginPath();
    c.moveTo(X(bx - dir * s / 2), Y(by - flipY * s * 0.09));
    c.quadraticCurveTo(X(bx - dir * s * 0.3), Y(by + flipY * s * 0.12), X(bx), Y(by + flipY * s * 0.12));
    c.quadraticCurveTo(X(bx + dir * s * 0.32), Y(by + flipY * s * 0.12), X(bx + dir * s / 2), Y(by - flipY * s * 0.12));
    c.quadraticCurveTo(X(bx + dir * s * 0.2), Y(by), X(bx), Y(by));
    c.quadraticCurveTo(X(bx - dir * s * 0.2), Y(by), X(bx - dir * s / 2), Y(by - flipY * s * 0.09));
    c.closePath();
  };
  // Its reflection first, faint and a little lower.
  c.save(); c.globalAlpha = 0.22; c.fillStyle = p.hull; c.translate(0, L(s * 0.25)); hull(-1); c.fill(); c.restore();
  if (sail) {
    const mast = bx + dir * s * 0.12;
    c.strokeStyle = p.hull; c.lineWidth = Math.max(1, L(s * 0.02));
    c.beginPath(); c.moveTo(X(mast), Y(by)); c.lineTo(X(mast), Y(by - s * 0.82)); c.stroke();
    c.fillStyle = night ? "#c9c4b4" : "#f0e2c2";
    c.beginPath(); c.moveTo(X(mast + dir * s * 0.02), Y(by - s * 0.8));
    c.quadraticCurveTo(X(mast - dir * s * 0.18), Y(by - s * 0.45), X(mast - dir * s * 0.36), Y(by - s * 0.1));
    c.lineTo(X(mast + dir * s * 0.02), Y(by - s * 0.08)); c.closePath(); c.fill();
    c.fillStyle = night ? "#8f8270" : "#d8a868";
    c.beginPath(); c.moveTo(X(mast), Y(by - s * 0.42)); c.lineTo(X(mast - dir * s * 0.2), Y(by - s * 0.34)); c.lineTo(X(mast - dir * s * 0.26), Y(by - s * 0.22)); c.lineTo(X(mast), Y(by - s * 0.24)); c.closePath(); c.fill();
  } else {
    // The boatman with his long bamboo pole.
    const mx = bx - dir * s * 0.34;
    c.strokeStyle = p.ink; c.lineWidth = Math.max(1, L(s * 0.018));
    c.beginPath(); c.moveTo(X(mx - dir * s * 0.12), Y(by - s * 0.5)); c.lineTo(X(mx + dir * s * 0.18), Y(by + s * 0.22)); c.stroke();
    c.fillStyle = p.ink;
    c.beginPath(); c.moveTo(X(mx - s * 0.035), Y(by - s * 0.04)); c.lineTo(X(mx - s * 0.03), Y(by - s * 0.26)); c.lineTo(X(mx + s * 0.03), Y(by - s * 0.26)); c.lineTo(X(mx + s * 0.035), Y(by - s * 0.04)); c.closePath(); c.fill();
    c.beginPath(); c.arc(X(mx), Y(by - s * 0.31), L(s * 0.04), 0, Math.PI * 2); c.fill();
  }
  // The hull, its gunwale, and the curved bamboo shelter (ছই).
  c.fillStyle = p.hull; hull(1); c.fill();
  c.strokeStyle = mix(p.hull, "#d9a066", 0.45); c.lineWidth = Math.max(1, L(s * 0.018));
  c.beginPath(); c.moveTo(X(bx - dir * s * 0.46), Y(by - s * 0.07)); c.quadraticCurveTo(X(bx), Y(by + s * 0.01), X(bx + dir * s * 0.46), Y(by - s * 0.1)); c.stroke();
  c.fillStyle = night ? "#6a5a44" : "#c58f4a";
  c.beginPath(); c.moveTo(X(bx - s * 0.16), Y(by)); c.bezierCurveTo(X(bx - s * 0.16), Y(by - s * 0.2), X(bx + s * 0.14), Y(by - s * 0.2), X(bx + s * 0.14), Y(by)); c.closePath(); c.fill();
  c.strokeStyle = night ? "#4a3e30" : "#8f5f2c"; c.lineWidth = Math.max(0.6, L(s * 0.01));
  c.beginPath();
  for (const u of [-0.08, 0, 0.07]) { c.moveTo(X(bx + u * s), Y(by)); c.lineTo(X(bx + u * s), Y(by - s * 0.15)); }
  c.stroke();
}

function drawPalm(c: Ink, palm: Painting["palms"][number], p: Palette, night: boolean, X: Scale, Y: Scale, L: Scale, rng: () => number) {
  const { x, y, h, lean } = palm, topX = x + lean * h, topY = y - h, ctrlX = x + lean * h * 0.15;
  // A tapered, slightly bent trunk with growth rings.
  const point = (t: number) => [(1 - t) ** 2 * x + 2 * (1 - t) * t * ctrlX + t * t * topX, (1 - t) ** 2 * y + 2 * (1 - t) * t * (y - h * 0.5) + t * t * topY] as const;
  const width = (t: number) => h * (0.034 - 0.016 * t);
  const left: (readonly [number, number])[] = [], right: (readonly [number, number])[] = [];
  for (let index = 0; index <= 8; index++) {
    const t = index / 8, [px, py] = point(t);
    left.push([px - width(t), py]); right.push([px + width(t), py]);
  }
  const bark = c.createLinearGradient(X(x - h * 0.04), 0, X(x + h * 0.04), 0);
  bark.addColorStop(0, mix(p.trunk, "#000000", 0.25)); bark.addColorStop(0.6, p.trunk); bark.addColorStop(1, mix(p.trunk, "#ffffff", night ? 0 : 0.15));
  c.fillStyle = bark;
  c.beginPath(); c.moveTo(X(left[0][0]), Y(left[0][1]));
  for (const [px, py] of [...left.slice(1), ...right.reverse()]) c.lineTo(X(px), Y(py));
  c.closePath(); c.fill();
  c.strokeStyle = rgba("#000000", 0.18); c.lineWidth = Math.max(0.5, L(h * 0.004));
  c.beginPath();
  for (let index = 1; index < 10; index++) { const t = index / 10, [px, py] = point(t); c.moveTo(X(px - width(t)), Y(py)); c.lineTo(X(px + width(t)), Y(py + h * 0.006)); }
  c.stroke();
  // A round crown of fan leaves (তাল) on short stalks, the lowest ones drooping, a couple of dry ones hanging below.
  const r = h * 0.17;
  const frond = (angle: number, reach: number, color: string) => {
    const sx = topX + Math.cos(angle) * r * 0.45 * reach, sy = topY + Math.sin(angle) * r * 0.45 * reach;
    c.strokeStyle = color; c.lineWidth = Math.max(0.6, L(r * 0.06));
    c.beginPath(); c.moveTo(X(topX), Y(topY)); c.lineTo(X(sx), Y(sy)); c.stroke();
    c.fillStyle = color;
    fan(c, X(sx), Y(sy), L(r * 0.62 * reach), angle, 1.15, rng);
  };
  for (const angle of [1.35, 1.85]) frond(angle, 0.9, mix(p.trunk, p.leaf[0], 0.3));
  const fronds = 11;
  for (let index = 0; index < fronds; index++) {
    const angle = Math.PI * 0.92 + (index / (fronds - 1)) * Math.PI * 1.16 + (rng() - 0.5) * 0.3;
    frond(angle, 0.8 + rng() * 0.35, index % 3 === 0 ? mix(p.leaf[0], "#000000", 0.15) : index % 2 ? p.leaf[0] : p.leaf[1]);
  }
  c.fillStyle = mix(p.leaf[0], "#000000", 0.25);
  c.beginPath(); c.arc(X(topX), Y(topY), L(r * 0.22), 0, Math.PI * 2); c.fill();
}

/** One fan leaf: a wedge whose rim is cut into pointed segments, with ribs. */
function fan(c: Ink, cx: number, cy: number, radius: number, angle: number, spread: number, rng: () => number) {
  const tips = 7;
  c.beginPath(); c.moveTo(cx, cy);
  for (let index = 0; index <= tips * 2; index++) {
    const a = angle - spread / 2 + (spread * index) / (tips * 2), reach = index % 2 ? 0.8 : 1 - rng() * 0.08;
    c.lineTo(cx + Math.cos(a) * radius * reach, cy + Math.sin(a) * radius * reach);
  }
  c.closePath(); c.fill();
  c.save(); c.strokeStyle = "rgba(0,0,0,0.14)"; c.lineWidth = Math.max(0.5, radius * 0.03);
  c.beginPath();
  for (let index = 1; index < tips; index++) { const a = angle - spread / 2 + (spread * index) / tips; c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * radius * 0.78, cy + Math.sin(a) * radius * 0.78); }
  c.stroke(); c.restore();
}

function drawBanana(c: Ink, tree: Painting["bananas"][number], p: Palette, X: Scale, Y: Scale, L: Scale, rng: () => number) {
  const { x, y, s } = tree, topY = y - s * 0.5;
  c.fillStyle = mix(p.leaf[0], p.trunk, 0.45);
  c.beginPath(); c.moveTo(X(x - s * 0.06), Y(y)); c.lineTo(X(x - s * 0.04), Y(topY)); c.lineTo(X(x + s * 0.04), Y(topY)); c.lineTo(X(x + s * 0.06), Y(y)); c.closePath(); c.fill();
  // Broad leaves arching out and drooping, each with a pale midrib.
  for (const base of [-2.75, -0.4, -2.25, -0.85, -1.85, -1.3]) {
    const angle = base + (rng() - 0.5) * 0.2, length = s * (0.5 + rng() * 0.12);
    const ex = x + Math.cos(angle) * length, ey = topY + Math.sin(angle) * length + length * 0.45;
    const mx = x + Math.cos(angle) * length * 0.55, my = topY + Math.sin(angle) * length * 0.55 - length * 0.08;
    const nx = -Math.sin(angle) * length * 0.2, ny = Math.cos(angle) * length * 0.2;
    c.fillStyle = base < -1.6 ? p.leaf[0] : p.leaf[1];
    c.beginPath(); c.moveTo(X(x), Y(topY));
    c.quadraticCurveTo(X(mx + nx), Y(my + ny), X(ex), Y(ey));
    c.quadraticCurveTo(X(mx - nx), Y(my - ny), X(x), Y(topY));
    c.fill();
    c.strokeStyle = rgba("#ffffff", 0.28); c.lineWidth = Math.max(0.5, L(s * 0.012));
    c.beginPath(); c.moveTo(X(x), Y(topY)); c.quadraticCurveTo(X(mx), Y(my), X(ex), Y(ey)); c.stroke();
  }
}

function drawKash(c: Ink, kash: NonNullable<Painting["kash"]>, p: Palette, X: Scale, Y: Scale, L: Scale, rng: () => number) {
  for (let index = 0; index < 16; index++) {
    const bx = kash.x + (rng() - 0.5) * kash.w, h = 0.08 + rng() * 0.08, lean = (rng() - 0.3) * 0.05;
    const tx = bx + lean, ty = kash.y - h;
    c.strokeStyle = mix(p.leaf[0], p.bank, 0.4); c.lineWidth = Math.max(0.6, L(0.0025));
    c.beginPath(); c.moveTo(X(bx), Y(kash.y + 0.02)); c.quadraticCurveTo(X(bx + lean * 0.2), Y(kash.y - h * 0.5), X(tx), Y(ty)); c.stroke();
    // The white plume: two soft feathery ovals leaning with the stem.
    c.save(); c.translate(X(tx), Y(ty)); c.rotate(lean * 6 - 0.15);
    c.fillStyle = rgba(p.plume, 0.55); c.beginPath(); c.ellipse(0, -L(0.012), L(0.012), L(0.03), 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = rgba(p.plume, 0.85); c.beginPath(); c.ellipse(0, -L(0.012), L(0.006), L(0.022), 0, 0, Math.PI * 2); c.fill();
    c.restore();
  }
}
