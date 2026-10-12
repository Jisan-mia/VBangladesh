// The school field from above: a worn dirt strip, chalk lines, a jute rope with a red ribbon, two teams of five and the crowd.
// Also the ঢোল that shows the beat. All drawing is in CSS pixels of whatever canvas it gets; no allocation per frame.
import { makeRng } from "../../../shared/game-core";

export type Field = {
  w: number; h: number;
  /** The rope's x, the middle line's y, and how far each side's line sits from it. */
  cx: number; cy: number; gap: number;
  /** Space between pullers along the rope, and a scale for every drawn size (1 at a 320px-tall field). */
  spacing: number; size: number;
  dash: number[];
  font: string; small: string;
};

export function makeField(w: number, h: number, gap: number, spacing: number, size: number): Field {
  return { w, h, cx: w / 2, cy: h / 2, gap, spacing, size, dash: [3 * size, 4 * size], font: `800 ${Math.round(22 * size)}px "Display", "Bangla", sans-serif`, small: `700 ${Math.round(15 * size)}px "Bangla", sans-serif` };
}

/** The solo field: a little wider than tall. */
export const soloField = (w: number, h: number) => makeField(w, h, h * 0.12, h * 0.088, h / 220);
/** The two-player field fills the phone; the middle line is the line between the two players' halves. */
export const duoField = (w: number, h: number) => makeField(w, h, Math.min(h * 0.1, 80), Math.min(h * 0.045, 34), Math.min(w / 340, h / 600) * 1.15);

const GRASS = "#6fae4a", STRIPE = "#79b754", DIRT = "#cdb17c", DIRT_EDGE = "#b99a63", CHALK = "#fbfaf3";
const SKIN = "#c68b59", HAIR = "#2a1d14", ROPE = "#b08552", ROPE_DARK = "#7a5631", RIBBON = "#d62828";
const NO_DASH: number[] = [];
const CROWD = ["#e76f51", "#f4a261", "#2a9d8f", "#e9c46a", "#457b9d", "#f1faee", "#9b5de5", "#ef476f"];

/** The parts that never move: grass, the dirt strip, the chalk lines, bunting and the crowd. Drawn once onto an offscreen canvas. */
export function drawBackground(c: CanvasRenderingContext2D, f: Field) {
  const { w, h, cx, cy, gap, size } = f;
  c.fillStyle = GRASS; c.fillRect(0, 0, w, h);
  c.fillStyle = STRIPE;
  const band = Math.max(18, h * 0.08);
  for (let y = 0; y < h; y += band * 2) c.fillRect(0, y, w, band);
  const strip = Math.min(w * 0.36, 150 * size);
  c.fillStyle = DIRT_EDGE; c.beginPath(); c.roundRect(cx - strip / 2 - 3, -10, strip + 6, h + 20, strip / 2); c.fill();
  c.fillStyle = DIRT; c.beginPath(); c.roundRect(cx - strip / 2, -10, strip, h + 20, strip / 2); c.fill();
  // chalk: the middle line dashed, each side's line solid
  c.strokeStyle = CHALK; c.lineCap = "round";
  c.lineWidth = 3 * size;
  c.setLineDash([8 * size, 7 * size]);
  c.beginPath(); c.moveTo(cx - strip * 0.62, cy); c.lineTo(cx + strip * 0.62, cy); c.stroke();
  c.setLineDash(NO_DASH);
  c.lineWidth = 4 * size;
  for (const y of [cy - gap, cy + gap]) { c.beginPath(); c.moveTo(cx - strip * 0.62, y); c.lineTo(cx + strip * 0.62, y); c.stroke(); }
  // the crowd along both touchlines: shoulders and heads from above
  const rng = makeRng(20261012), r = 5 * size, step = r * 3.1;
  for (const edge of [r * 2.2, w - r * 2.2]) {
    for (let y = r * 2; y < h; y += step) {
      const x = edge + (rng() - 0.5) * r * 1.4, yy = y + (rng() - 0.5) * r;
      c.fillStyle = CROWD[Math.floor(rng() * CROWD.length)];
      c.beginPath(); c.ellipse(x, yy, r * 1.4, r, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = HAIR; c.beginPath(); c.arc(x, yy, r * 0.75, 0, Math.PI * 2); c.fill();
    }
  }
  // bunting across the top
  c.strokeStyle = "#5a4630"; c.lineWidth = 1.2 * size;
  c.beginPath(); c.moveTo(0, 6 * size); c.quadraticCurveTo(w / 2, 16 * size, w, 6 * size); c.stroke();
  for (let i = 0, x = 6 * size; x < w; x += 16 * size, i++) {
    const t = x / w, y = 6 * size + 4 * t * (1 - t) * 10 * size;
    c.fillStyle = CROWD[i % CROWD.length];
    c.beginPath(); c.moveTo(x - 5 * size, y); c.lineTo(x + 5 * size, y); c.lineTo(x, y + 9 * size); c.closePath(); c.fill();
  }
}

export type Pose = { x: number; lean0: number; lean1: number };

/** One puller from above, leaning back from the rope: both hands on it ahead, shirt on the shoulders, a face turned to the middle. */
function drawKid(c: CanvasRenderingContext2D, f: Field, kx: number, ky: number, dir: number, shirt: string) {
  const s = f.size;
  c.strokeStyle = SKIN; c.lineWidth = 3.2 * s; c.lineCap = "round";
  c.beginPath(); c.moveTo(kx - 6 * s, ky - dir * 2 * s); c.lineTo(f.cx, ky - dir * 8 * s); c.moveTo(kx + 6 * s, ky - dir * 2 * s); c.lineTo(f.cx, ky - dir * 13 * s); c.stroke();
  c.fillStyle = shirt; c.strokeStyle = "#00000040"; c.lineWidth = 1;
  c.beginPath(); c.ellipse(kx, ky, 10 * s, 6.5 * s, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = SKIN;
  c.beginPath(); c.arc(kx, ky - dir * 1.5 * s, 5.4 * s, 0, Math.PI * 2); c.fill();
  c.fillStyle = HAIR;
  c.beginPath(); c.arc(kx, ky + dir * 0.2 * s, 4.9 * s, 0, Math.PI * 2); c.fill();
}

/**
 * The moving parts: the rope (its twist slides with it), both teams and the ribbon.
 * `pose.x` is where the ribbon is (1 = on side 0's line, at the bottom); `lean` 0..1 is a team leaning back on a pull.
 */
export function drawScene(c: CanvasRenderingContext2D, f: Field, pose: Pose, bottomShirt: string, topShirt: string) {
  const { cx, cy, gap, spacing, size, h } = f, shift = pose.x * gap;
  c.lineCap = "butt";
  c.strokeStyle = ROPE; c.lineWidth = 5 * size;
  c.beginPath(); c.moveTo(cx, -4); c.lineTo(cx, h + 4); c.stroke();
  c.strokeStyle = ROPE_DARK; c.lineWidth = 5 * size;
  c.setLineDash(f.dash); c.lineDashOffset = -shift;
  c.beginPath(); c.moveTo(cx, -4); c.lineTo(cx, h + 4); c.stroke();
  c.setLineDash(NO_DASH); c.lineDashOffset = 0;
  for (let side = 0; side < 2; side++) {
    const dir = side === 0 ? 1 : -1, lean = side === 0 ? pose.lean0 : pose.lean1, shirt = side === 0 ? bottomShirt : topShirt;
    for (let i = 0; i < 5; i++) {
      const ky = cy + shift + dir * (gap + 16 * size + i * spacing + lean * 3.5 * size);
      drawKid(c, f, cx + (i % 2 ? 11 : -11) * size, ky, dir, shirt);
    }
  }
  const ry = cy + shift;
  c.fillStyle = RIBBON;
  c.beginPath(); c.moveTo(cx - 3 * size, ry); c.lineTo(cx - 12 * size, ry - 6 * size); c.lineTo(cx - 12 * size, ry + 6 * size); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(cx + 3 * size, ry); c.lineTo(cx + 12 * size, ry - 6 * size); c.lineTo(cx + 12 * size, ry + 6 * size); c.closePath(); c.fill();
  c.fillRect(cx - 3.5 * size, ry - 3.5 * size, 7 * size, 7 * size);
}

export type DrumLook = {
  /** 0 right on the beat, rising to 1 just before the next. */
  phase: number;
  /** 1 right after this player's tap, fading to 0, and the colour of that tap's grade. */
  hit: number; hitColor: string;
  /** Big word in the middle ("৩", "শুরু করো", "ঠিক তালে") and a small one under it. */
  word: string; sub: string;
  accent: string; calm: boolean;
};

/**
 * The ঢোল from above: a skin head, a wooden rim with laces, and a ring that closes in to meet the rim on every beat.
 * Tap when the ring touches the rim. `rotate` turns it for the far player in a two-player match.
 */
export function drawDrum(c: CanvasRenderingContext2D, x: number, y: number, r: number, look: DrumLook, f: Field, rotate = 0) {
  c.save();
  c.translate(x, y);
  if (rotate) c.rotate(rotate);
  const onBeat = look.phase < 0.14 ? 1 - look.phase / 0.14 : 0;
  const bump = look.calm ? 1 : 1 + 0.05 * onBeat + 0.04 * look.hit;
  // the closing ring: wide right after a beat, on the rim at the next
  c.globalAlpha = 0.25 + 0.75 * look.phase;
  c.strokeStyle = look.accent; c.lineWidth = Math.max(3, r * 0.07);
  c.beginPath(); c.arc(0, 0, r * (1.06 + 0.9 * (1 - look.phase)), 0, Math.PI * 2); c.stroke();
  c.globalAlpha = 1;
  c.scale(bump, bump);
  c.fillStyle = "#7b3f22"; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#e8d3a6"; c.lineWidth = Math.max(1.5, r * 0.035);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, b = a + Math.PI / 12;
    c.beginPath(); c.moveTo(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98); c.lineTo(Math.cos(b) * r * 0.82, Math.sin(b) * r * 0.82); c.stroke();
  }
  c.fillStyle = "#f3e2bd"; c.beginPath(); c.arc(0, 0, r * 0.8, 0, Math.PI * 2); c.fill();
  if (onBeat > 0) { c.globalAlpha = onBeat * 0.55; c.fillStyle = "#fff6d8"; c.beginPath(); c.arc(0, 0, r * 0.8, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
  if (look.hit > 0) { c.globalAlpha = look.hit * 0.75; c.fillStyle = look.hitColor; c.beginPath(); c.arc(0, 0, r * 0.8, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
  c.fillStyle = "#2a1d14"; c.textAlign = "center"; c.textBaseline = "middle";
  if (look.word) { c.font = f.font; c.fillText(look.word, 0, look.sub ? -r * 0.12 : 0, r * 1.5); }
  if (look.sub) { c.font = f.small; c.fillStyle = "#5b4a36"; c.fillText(look.sub, 0, r * 0.3, r * 1.5); }
  c.restore();
}
