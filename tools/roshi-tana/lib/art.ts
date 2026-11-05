// The school field from above, in code: grass and a worn dirt strip, chalk lines, bunting and the crowd along both touchlines,
// one palette per world (morning, afternoon dust, floodlit night). Also the pullers, the title drum and the story panels.
// Everything here runs once per resize or level and is drawn onto offscreen canvases; draw.hot.ts puts them on screen each frame.
import { makeRng } from "../../../shared/game-core";

export type Field = {
  w: number; h: number;
  /** The rope's x, the middle line's y, and how far each side's line sits from it. */
  cx: number; cy: number; gap: number;
  /** Space between pullers along the rope, and a scale for every drawn size (1 at a 300 px-wide field). */
  spacing: number; size: number;
  font: string; small: string;
};

export function makeField(w: number, h: number, gap: number, spacing: number, size: number): Field {
  return { w, h, cx: w / 2, cy: h / 2, gap, spacing, size, font: `800 ${Math.round(22 * size)}px "Display", "Bangla", sans-serif`, small: `700 ${Math.round(14 * size)}px "Bangla", sans-serif` };
}
/** The solo field: whatever box the stage gives it, portrait or a little wide. */
export function soloField(w: number, h: number) {
  const size = Math.min(w / 250, h / 330);
  return makeField(w, h, h * 0.13, Math.min(h * 0.072, 30 * size), size);
}
/** The two-player field fills the stage; the middle line is the line between the two players' halves. */
export const duoField = (w: number, h: number) => makeField(w, h, Math.min(h * 0.1, 80), Math.min(h * 0.045, 34), Math.min(w / 340, h / 600) * 1.15);
/** A drum pad's own field (only its fonts and size matter). */
export const padField = (w: number, h: number) => makeField(w, h, 0, 0, h / 190);

export type Palette = {
  grass: string; stripe: string; dirt: string; dirtEdge: string; chalk: string;
  /** A warm wash over everything (afternoon), and floodlights with a dark rim (night). */
  wash: string | null; night: boolean;
  bunting: readonly string[]; crowd: readonly string[];
};
export const PALETTES: readonly Palette[] = [
  { grass: "#6fae4a", stripe: "#79b754", dirt: "#cdb17c", dirtEdge: "#b99a63", chalk: "#fbfaf3", wash: null, night: false,
    bunting: ["#f2b705", "#e63946", "#2a9d8f", "#ffffff"], crowd: ["#e76f51", "#f4a261", "#2a9d8f", "#e9c46a", "#457b9d", "#f1faee", "#9b5de5", "#ef476f"] },
  { grass: "#86a33c", stripe: "#90ad45", dirt: "#d9a766", dirtEdge: "#bd8a4b", chalk: "#fff3df", wash: "#ff8a3d1f", night: false,
    bunting: ["#e85d04", "#ffba08", "#9d0208", "#ffffff"], crowd: ["#d62828", "#f77f00", "#fcbf49", "#eae2b7", "#6a994e", "#bc4749", "#3d405b", "#f2cc8f"] },
  { grass: "#2f6a3b", stripe: "#357442", dirt: "#9d865a", dirtEdge: "#806b45", chalk: "#eef3ff", wash: null, night: true,
    bunting: ["#ffd166", "#06d6a0", "#ef476f", "#ffffff"], crowd: ["#577590", "#f9c74f", "#90be6d", "#f94144", "#43aa8b", "#f8f9fa", "#9b5de5", "#f3722c"] },
];

export const SKIN = "#c68b59", HAIR = "#2a1d14", ROPE = "#b08552", ROPE_DARK = "#7a5631", RIBBON = "#d62828", GOLD = "#ffd166";

export function offscreen(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w)); canvas.height = Math.max(1, Math.round(h));
  return canvas;
}

const stripWidth = (f: Field) => Math.min(f.w * 0.42, 160 * f.size);

/** The parts that never move: grass, the dirt strip, the chalk lines, bunting and the world's light. Not the crowd (it bobs). */
export function drawGround(c: CanvasRenderingContext2D, f: Field, pal: Palette) {
  const { w, h, cx, cy, gap, size } = f;
  c.fillStyle = pal.grass; c.fillRect(0, 0, w, h);
  c.fillStyle = pal.stripe;
  const band = Math.max(18, h * 0.07);
  for (let y = 0; y < h; y += band * 2) c.fillRect(0, y, w, band);
  const strip = stripWidth(f);
  c.fillStyle = pal.dirtEdge; c.beginPath(); c.roundRect(cx - strip / 2 - 3, -10, strip + 6, h + 20, strip / 2); c.fill();
  c.fillStyle = pal.dirt; c.beginPath(); c.roundRect(cx - strip / 2, -10, strip, h + 20, strip / 2); c.fill();
  // scuffed dirt: a few darker footprints near each line, where the anchors dig in
  const rng = makeRng(7310);
  c.fillStyle = "#00000014";
  for (let i = 0; i < 26; i++) {
    const y = cy + (rng() < 0.5 ? -1 : 1) * (gap + rng() * h * 0.3), x = cx + (rng() - 0.5) * strip * 0.7;
    c.beginPath(); c.ellipse(x, y, 4 * size, 2.2 * size, rng() * Math.PI, 0, Math.PI * 2); c.fill();
  }
  // chalk: the middle line dashed, each side's line solid
  c.strokeStyle = pal.chalk; c.lineCap = "round";
  c.lineWidth = 3 * size;
  c.setLineDash([8 * size, 7 * size]);
  c.beginPath(); c.moveTo(cx - strip * 0.62, cy); c.lineTo(cx + strip * 0.62, cy); c.stroke();
  c.setLineDash([]);
  c.lineWidth = 4 * size;
  c.beginPath(); c.moveTo(cx - strip * 0.62, cy - gap); c.lineTo(cx + strip * 0.62, cy - gap); c.stroke();
  c.beginPath(); c.moveTo(cx - strip * 0.62, cy + gap); c.lineTo(cx + strip * 0.62, cy + gap); c.stroke();
  // bunting across the top
  c.strokeStyle = "#5a4630"; c.lineWidth = 1.2 * size;
  c.beginPath(); c.moveTo(0, 6 * size); c.quadraticCurveTo(w / 2, 16 * size, w, 6 * size); c.stroke();
  for (let i = 0, x = 6 * size; x < w; x += 16 * size, i++) {
    const t = x / w, y = 6 * size + 4 * t * (1 - t) * 10 * size;
    c.fillStyle = pal.bunting[i % pal.bunting.length];
    c.beginPath(); c.moveTo(x - 5 * size, y); c.lineTo(x + 5 * size, y); c.lineTo(x, y + 9 * size); c.closePath(); c.fill();
  }
  if (pal.wash) {
    c.fillStyle = pal.wash; c.fillRect(0, 0, w, h);
    // the low sun from the right: a long soft shade along the left touchline
    const shade = c.createLinearGradient(0, 0, w * 0.4, 0);
    shade.addColorStop(0, "#3b1d0a33"); shade.addColorStop(1, "#3b1d0a00");
    c.fillStyle = shade; c.fillRect(0, 0, w * 0.4, h);
  }
  if (pal.night) {
    const rim = c.createRadialGradient(cx, cy, Math.min(w, h) * 0.25, cx, cy, Math.max(w, h) * 0.75);
    rim.addColorStop(0, "#0b1a3a00"); rim.addColorStop(1, "#0b1a3acc");
    c.fillStyle = rim; c.fillRect(0, 0, w, h);
    for (const [lx, ly] of [[w * 0.12, h * 0.08], [w * 0.88, h * 0.92]]) {
      const pool = c.createRadialGradient(lx, ly, 0, lx, ly, Math.max(w, h) * 0.6);
      pool.addColorStop(0, "#fff6d433"); pool.addColorStop(1, "#fff6d400");
      c.fillStyle = pool; c.fillRect(0, 0, w, h);
      c.fillStyle = "#fff6d4"; c.beginPath(); c.arc(lx, ly, 5 * size, 0, Math.PI * 2); c.fill();
    }
  }
}

/** One touchline crowd strip: shoulders and heads from above, in two rows (`row` 0 or 1) so the rows can bob out of step. */
export function drawCrowd(c: CanvasRenderingContext2D, f: Field, pal: Palette, side: 0 | 1, row: 0 | 1) {
  const r = 5 * f.size, step = r * 3.1, rng = makeRng(20261012 + side * 31 + row * 7);
  const edge = side === 0 ? r * 2.2 : f.w - r * 2.2;
  const shift = row ? step / 2 : 0, out = (side === 0 ? -1 : 1) * (row ? r * 1.6 : 0);
  for (let y = r * 2 + shift; y < f.h + r * 2; y += step) {
    const x = edge + out + (rng() - 0.5) * r * 1.2, yy = y + (rng() - 0.5) * r;
    c.fillStyle = pal.crowd[Math.floor(rng() * pal.crowd.length)];
    c.beginPath(); c.ellipse(x, yy, r * 1.4, r, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = HAIR; c.beginPath(); c.arc(x, yy, r * 0.75, 0, Math.PI * 2); c.fill();
    // a raised arm here and there: a hand waving over the head
    if (rng() < 0.25) { c.fillStyle = SKIN; c.beginPath(); c.arc(x + (side === 0 ? r : -r), yy - r * 1.3, r * 0.42, 0, Math.PI * 2); c.fill(); }
  }
}

/**
 * One puller from above, leaning back from the rope: both hands on it, shirt on the shoulders, hair on top.
 * `dir` 1 faces up (our team, below the middle), -1 faces down. `toLeft` puts the rope on the kid's left (its x is `ropeX`).
 */
export function drawKid(c: CanvasRenderingContext2D, s: number, kx: number, ky: number, dir: number, ropeX: number, shirt: string, captain = false) {
  c.strokeStyle = SKIN; c.lineWidth = 3.2 * s; c.lineCap = "round";
  c.beginPath(); c.moveTo(kx - 6 * s, ky - dir * 2 * s); c.lineTo(ropeX, ky - dir * 8 * s); c.moveTo(kx + 6 * s, ky - dir * 2 * s); c.lineTo(ropeX, ky - dir * 13 * s); c.stroke();
  c.fillStyle = shirt; c.strokeStyle = "#00000040"; c.lineWidth = 1;
  c.beginPath(); c.ellipse(kx, ky, (captain ? 12 : 10) * s, (captain ? 7.6 : 6.5) * s, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = SKIN;
  c.beginPath(); c.arc(kx, ky - dir * 1.5 * s, 5.4 * s, 0, Math.PI * 2); c.fill();
  c.fillStyle = HAIR;
  c.beginPath(); c.arc(kx, ky + dir * 0.2 * s, 4.9 * s, 0, Math.PI * 2); c.fill();
  if (captain) {
    // the captain's cap and the whistle cord
    c.fillStyle = GOLD; c.beginPath(); c.arc(kx, ky + dir * 0.2 * s, 5 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#b07d00"; c.beginPath(); c.ellipse(kx, ky - dir * 4.6 * s, 4 * s, 1.8 * s, 0, 0, Math.PI * 2); c.fill();
  }
}

/** A kid sprite: dir 1 or -1, rope on the right (+1) or left (-1). Drawn at `ratio` for crispness; `ox`/`oy` is the body centre. */
export type Sprite = { canvas: HTMLCanvasElement; w: number; h: number; ox: number; oy: number };
export function kidSprite(s: number, ratio: number, dir: number, ropeSide: number, shirt: string, captain = false): Sprite {
  const w = 36 * s, h = 40 * s, ox = ropeSide > 0 ? 12 * s : w - 12 * s, oy = dir > 0 ? h - 13 * s : 13 * s;
  const canvas = offscreen(w * ratio, h * ratio), c = canvas.getContext("2d")!;
  c.scale(ratio, ratio);
  drawKid(c, s, ox, oy, dir, ox + ropeSide * 11 * s, shirt, captain);
  return { canvas, w, h, ox, oy };
}

/** How wide each touchline's crowd strip is. */
export const crowdWidth = (f: Field) => 34 * f.size;

/** Every pre-rendered layer of one solo or two-player field. */
export type Layers = {
  field: Field;
  ground: HTMLCanvasElement;
  /** Crowd strips (crowdWidth wide, 10 × size taller than the field at each end): [left row 0, left row 1, right row 0, right row 1]. */
  crowd: HTMLCanvasElement[];
  /** Kid sprites by team (0 us at the bottom, 1 them at the top) and rope side (0 rope on the right, 1 on the left), plus their captain. */
  kids: Sprite[][];
  captain: Sprite | null;
  night: boolean;
};

export function buildLayers(f: Field, ratio: number, world: number, bottomShirt: string, topShirt: string, captain: boolean): Layers {
  const pal = PALETTES[Math.max(0, Math.min(PALETTES.length - 1, world))];
  const ground = offscreen(f.w * ratio, f.h * ratio), g = ground.getContext("2d")!;
  g.scale(ratio, ratio);
  drawGround(g, f, pal);
  const crowd: HTMLCanvasElement[] = [], sw = crowdWidth(f), pad = 10 * f.size;
  for (const side of [0, 1] as const) for (const row of [0, 1] as const) {
    const strip = offscreen(sw * ratio, (f.h + 2 * pad) * ratio), sc = strip.getContext("2d")!;
    sc.scale(ratio, ratio);
    sc.translate(side === 0 ? 0 : sw - f.w, pad);
    drawCrowd(sc, f, pal, side, row);
    crowd.push(strip);
  }
  const s = f.size;
  const kids = [
    [kidSprite(s, ratio, 1, 1, bottomShirt), kidSprite(s, ratio, 1, -1, bottomShirt)],
    [kidSprite(s, ratio, -1, 1, topShirt), kidSprite(s, ratio, -1, -1, topShirt)],
  ];
  return { field: f, ground, crowd, kids, captain: captain ? kidSprite(s, ratio, -1, 1, topShirt, true) : null, night: pal.night };
}

/* ---------- what draw.hot.ts reads each frame (made once here, mutated in place) ---------- */

/** Everything the field draws this frame, mutated in place by the component. */
export type Scene = {
  /** Ribbon position (1 = on our line at the bottom), its velocity, and each team leaning back (0..1). */
  x: number; v: number; lean0: number; lean1: number;
  /** 0 slack .. 1 taut, a perfect pull's twang (1 fading to 0), a heave landing and a heave held (1 fading). */
  tension: number; twang: number; heave: number; hold: number;
  /** Seconds since the match began (for the wobble and the crowd), and how excited the crowd is (0..1). */
  time: number; excite: number;
  /** Slow mode or reduced motion: no bob, no wobble, no dust. */
  calm: boolean;
};
export const createScene = (): Scene => ({ x: 0, v: 0, lean0: 0, lean1: 0, tension: 0.4, twang: 0, heave: 0, hold: 0, time: 0, excite: 0, calm: false });

/** What the next beat is, as the ring shows it. */
export const RING_PLAIN = 0, RING_BIG = 1, RING_REST = 2, RING_QUIET = 3, RING_HEAVE = 4, RING_NONE = 5;
/** How the last tap's flash looks: none, a little off (green), right on (gold with rays), wrong (red with a crack). */
export const HIT_NONE = 0, HIT_GOOD = 1, HIT_PERFECT = 2, HIT_BAD = 3;

export type DrumLook = {
  /** 0 right on the beat, rising to 1 just before the next. */
  phase: number;
  /** Which stick strikes this beat (0 or 1). */
  stick: number;
  ring: number;
  /** 1 right after this player's tap, fading to 0, and how it looks. */
  hit: number; hitKind: number;
  /** Big word in the middle ("৩", "ঠিক তালে") and a small one under it. Both from fixed tables. */
  word: string; sub: string;
  calm: boolean;
};
export const createLook = (): DrumLook => ({ phase: 0, stick: 0, ring: RING_PLAIN, hit: 0, hitKind: HIT_NONE, word: "", sub: "", calm: false });

/* ---------- the title drum and the story panels ---------- */

/** The ঢোল from the side: a barrel with two skins, laced, a strap, two sticks. Centred at (x, y), `s` = 1 at 200 px wide. */
function drawDholSide(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const bw = 170 * s, bh = 104 * s;
  // strap
  c.strokeStyle = "#7a1f1f"; c.lineWidth = 7 * s; c.lineCap = "round";
  c.beginPath(); c.moveTo(x - bw * 0.36, y - bh * 0.42); c.quadraticCurveTo(x, y - bh * 1.15, x + bw * 0.36, y - bh * 0.42); c.stroke();
  // barrel
  const body = c.createLinearGradient(0, y - bh / 2, 0, y + bh / 2);
  body.addColorStop(0, "#a4572c"); body.addColorStop(0.5, "#7b3f22"); body.addColorStop(1, "#5a2c16");
  c.fillStyle = body;
  c.beginPath();
  c.moveTo(x - bw / 2, y - bh * 0.38);
  c.quadraticCurveTo(x, y - bh * 0.62, x + bw / 2, y - bh * 0.38);
  c.lineTo(x + bw / 2, y + bh * 0.38);
  c.quadraticCurveTo(x, y + bh * 0.62, x - bw / 2, y + bh * 0.38);
  c.closePath(); c.fill();
  // lacing: a zigzag of rope across the barrel
  c.strokeStyle = "#e8d3a6"; c.lineWidth = 2.6 * s;
  c.beginPath();
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, xx = x - bw * 0.44 + t * bw * 0.88, top = i % 2 === 0;
    const yy = top ? y - bh * 0.4 - Math.sin(t * Math.PI) * bh * 0.08 : y + bh * 0.4 + Math.sin(t * Math.PI) * bh * 0.08;
    if (i === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy);
  }
  c.stroke();
  // the two skins (ellipses at the ends)
  for (const side of [-1, 1]) {
    c.fillStyle = "#5a2c16"; c.beginPath(); c.ellipse(x + side * bw / 2, y, 14 * s, bh * 0.42, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#f3e2bd"; c.beginPath(); c.ellipse(x + side * bw / 2, y, 10 * s, bh * 0.36, 0, 0, Math.PI * 2); c.fill();
  }
  // a gold band round the middle
  c.fillStyle = GOLD; c.fillRect(x - 4 * s, y - bh * 0.5, 8 * s, bh);
}

/** The title's start button: the rope and ribbon across the back, the ঢোল, its sticks, and `word` on the barrel. */
export const TITLE_ASPECT = 0.62;
export function drawTitleDrum(canvas: HTMLCanvasElement, cssWidth: number, ratio: number, word: string, world: number) {
  const w = Math.round(cssWidth * ratio), h = Math.round(cssWidth * TITLE_ASPECT * ratio), s = cssWidth / 220;
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const c = canvas.getContext("2d")!;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  const cw = cssWidth, ch = cssWidth * TITLE_ASPECT, pal = PALETTES[world] ?? PALETTES[0];
  c.clearRect(0, 0, cw, ch);
  // the rope behind, sagging, with the ribbon
  c.strokeStyle = ROPE_DARK; c.lineWidth = 9 * s; c.lineCap = "round";
  c.beginPath(); c.moveTo(-10, ch * 0.3); c.quadraticCurveTo(cw / 2, ch * 0.42, cw + 10, ch * 0.3); c.stroke();
  c.strokeStyle = ROPE; c.lineWidth = 6 * s; c.setLineDash([6 * s, 5 * s]);
  c.beginPath(); c.moveTo(-10, ch * 0.3); c.quadraticCurveTo(cw / 2, ch * 0.42, cw + 10, ch * 0.3); c.stroke();
  c.setLineDash([]);
  c.fillStyle = RIBBON;
  c.beginPath(); c.moveTo(cw / 2, ch * 0.36); c.lineTo(cw / 2 - 10 * s, ch * 0.36 + 22 * s); c.lineTo(cw / 2 + 10 * s, ch * 0.36 + 22 * s); c.closePath(); c.fill();
  // the shadow on the grass
  c.fillStyle = pal.night ? "#00000055" : "#2a1d1426";
  c.beginPath(); c.ellipse(cw / 2, ch * 0.9, 88 * s, 9 * s, 0, 0, Math.PI * 2); c.fill();
  drawDholSide(c, cw / 2, ch * 0.62, s);
  // the sticks, crossed above the drum
  c.strokeStyle = "#e9c46a"; c.lineWidth = 5 * s;
  c.beginPath(); c.moveTo(cw / 2 - 74 * s, ch * 0.2); c.lineTo(cw / 2 - 26 * s, ch * 0.4); c.moveTo(cw / 2 + 74 * s, ch * 0.2); c.lineTo(cw / 2 + 26 * s, ch * 0.4); c.stroke();
  c.fillStyle = "#e9c46a";
  c.beginPath(); c.arc(cw / 2 - 74 * s, ch * 0.2, 5 * s, 0, Math.PI * 2); c.arc(cw / 2 + 74 * s, ch * 0.2, 5 * s, 0, Math.PI * 2); c.fill();
  // the word on the barrel, in a cream plate
  c.fillStyle = "#fbf6e9"; c.strokeStyle = "#2a1d14"; c.lineWidth = 2.5 * s;
  c.beginPath(); c.roundRect(cw / 2 - 52 * s, ch * 0.62 - 22 * s, 104 * s, 44 * s, 14 * s); c.fill(); c.stroke();
  c.fillStyle = "#2a1d14"; c.textAlign = "center"; c.textBaseline = "middle";
  c.font = `800 ${Math.round(30 * s)}px "Display", "Bangla", sans-serif`;
  c.fillText(word, cw / 2, ch * 0.62 + 2 * s, 96 * s);
}

export const STORY_ASPECT = 2 / 3;
/** The three intro panels: the field at dawn, the মাইক, the drum and a tapping hand. */
export function drawStoryPanel(canvas: HTMLCanvasElement, cssWidth: number, ratio: number, panel: number) {
  const w = Math.round(cssWidth * ratio), h = Math.round(cssWidth * STORY_ASPECT * ratio), s = cssWidth / 300;
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const c = canvas.getContext("2d")!;
  c.setTransform(ratio * s, 0, 0, ratio * s, 0, 0);
  if (panel === 0) {
    // the field, rotated to run across the panel: chalk lines, rope, ribbon, nobody yet
    const f = makeField(200, 300, 30, 20, 1);
    c.save(); c.translate(0, 200); c.rotate(-Math.PI / 2);
    drawGround(c, f, PALETTES[0]);
    c.restore();
    c.strokeStyle = ROPE; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 100); c.lineTo(300, 100); c.stroke();
    c.fillStyle = RIBBON; c.fillRect(146, 92, 8, 16);
    return;
  }
  if (panel === 1) {
    // the মাইক on its stand, a speech mark, bunting
    c.fillStyle = "#e8f0da"; c.fillRect(0, 0, 300, 200);
    c.fillStyle = "#cfe0b8"; c.fillRect(0, 150, 300, 50);
    for (let i = 0, x = 8; x < 300; x += 18, i++) { c.fillStyle = PALETTES[0].bunting[i % 4]; c.beginPath(); c.moveTo(x - 6, 10); c.lineTo(x + 6, 10); c.lineTo(x, 22); c.closePath(); c.fill(); }
    c.strokeStyle = "#3d3d3d"; c.lineWidth = 4; c.beginPath(); c.moveTo(110, 160); c.lineTo(110, 92); c.stroke();
    c.beginPath(); c.moveTo(92, 160); c.lineTo(128, 160); c.stroke();
    c.fillStyle = "#2b2b2b"; c.beginPath(); c.roundRect(98, 58, 24, 40, 12); c.fill();
    c.fillStyle = "#6b6b6b"; for (let y = 64; y < 92; y += 6) c.fillRect(101, y, 18, 2);
    c.fillStyle = "#ffffff"; c.strokeStyle = "#2a1d14"; c.lineWidth = 2.5;
    c.beginPath(); c.roundRect(150, 48, 128, 64, 16); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(152, 92); c.lineTo(132, 104); c.lineTo(160, 104); c.closePath(); c.fill();
    c.fillStyle = "#2a1d14"; c.font = `800 22px "Display", "Bangla", sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("হলুদ দল!", 214, 80);
    return;
  }
  // the drum from above with its closing ring, and a finger coming down on it
  c.fillStyle = "#fbf6e9"; c.fillRect(0, 0, 300, 200);
  c.strokeStyle = "#c2410c"; c.lineWidth = 4; c.globalAlpha = 0.8;
  c.beginPath(); c.arc(150, 104, 74, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1;
  c.fillStyle = "#7b3f22"; c.beginPath(); c.arc(150, 104, 62, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#f3e2bd"; c.beginPath(); c.arc(150, 104, 50, 0, Math.PI * 2); c.fill();
  c.fillStyle = SKIN; c.strokeStyle = "#8a5a35"; c.lineWidth = 2;
  c.beginPath(); c.roundRect(186, 30, 26, 70, 13); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(199, 96, 13, 10, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.strokeStyle = GOLD; c.lineWidth = 3;
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.45; c.beginPath(); c.moveTo(150 + Math.cos(a) * 82, 104 + Math.sin(a) * 82); c.lineTo(150 + Math.cos(a) * 94, 104 + Math.sin(a) * 94); c.stroke(); }
}

/** A still of the field for the share card: the ground, the crowd, both teams and a taut rope, the ribbon at `x`. */
export function drawStill(c: CanvasRenderingContext2D, f: Field, world: number, x: number, bottomShirt: string, topShirt: string, lean0: number, lean1: number) {
  const pal = PALETTES[Math.max(0, Math.min(PALETTES.length - 1, world))];
  drawGround(c, f, pal);
  for (const side of [0, 1] as const) for (const row of [0, 1] as const) drawCrowd(c, f, pal, side, row);
  const { cx, cy, gap, spacing, size, h } = f, ry = cy + x * gap, front = gap + 16 * size;
  c.lineCap = "butt"; c.strokeStyle = ROPE; c.lineWidth = 5 * size;
  c.beginPath(); c.moveTo(cx, -4); c.lineTo(cx, h + 4); c.stroke();
  c.strokeStyle = ROPE_DARK; c.setLineDash([3 * size, 4 * size]); c.lineDashOffset = -x * gap;
  c.beginPath(); c.moveTo(cx, -4); c.lineTo(cx, h + 4); c.stroke();
  c.setLineDash([]); c.lineDashOffset = 0;
  for (let side = 0; side < 2; side++) {
    const dir = side === 0 ? 1 : -1, lean = side === 0 ? lean0 : lean1;
    for (let i = 0; i < 5; i++) {
      const ky = ry + dir * (front + i * spacing + lean * 3.5 * size), kx = cx + (i % 2 ? 11 : -11) * size;
      drawKid(c, size, kx, ky, dir, cx, side === 0 ? bottomShirt : topShirt);
    }
  }
  c.fillStyle = RIBBON;
  c.beginPath(); c.moveTo(cx - 3 * size, ry); c.lineTo(cx - 12 * size, ry - 6 * size); c.lineTo(cx - 12 * size, ry + 6 * size); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(cx + 3 * size, ry); c.lineTo(cx + 12 * size, ry - 6 * size); c.lineTo(cx + 12 * size, ry + 6 * size); c.closePath(); c.fill();
  c.fillRect(cx - 3.5 * size, ry - 3.5 * size, 7 * size, 7 * size);
}
