// Per-frame drawing: the field (pre-rendered ground and crowd, the rope under tension, both teams, the ribbon, dust) and the ঢোল
// pad. Runs every frame on a cheap phone: no allocation, no closures, no string building. Words come from fixed tables.
import { crowdWidth, GOLD, HIT_BAD, HIT_PERFECT, RIBBON, RING_BIG, RING_HEAVE, RING_NONE, RING_QUIET, RING_REST, ROPE, ROPE_DARK, type DrumLook, type Field, type Layers, type Scene } from "./art";


const DASH_SCALE = [3, 4];
const dash: number[] = [3, 4];
const NO_DASH: number[] = [];

/* ---------- dust: a fixed pool of puffs at the pullers' feet ---------- */
const DUST = 32;
/** x, y, vx, vy, life (s) per puff. */
export const dust = new Float32Array(DUST * 5);
let dustNext = 0;
export function puff(x: number, y: number, dir: number, size: number, count: number) {
  for (let n = 0; n < count; n++) {
    const i = dustNext * 5, a = (n / Math.max(1, count)) * Math.PI - Math.PI / 2;
    dust[i] = x + Math.cos(a) * 6 * size; dust[i + 1] = y;
    dust[i + 2] = Math.cos(a) * 24 * size; dust[i + 3] = dir * (18 + 10 * Math.sin(a * 3)) * size; dust[i + 4] = 0.45;
    dustNext = (dustNext + 1) % DUST;
  }
}
export function clearDust() { dust.fill(0); }

/** A point on the rope's slack bow between the two front pullers (t 0..1 from the top front to the bottom front). */
function bowX(cx: number, bow: number, t: number) { return cx + 4 * bow * t * (1 - t); }

/** The solo or two-player field. `dt` is seconds since the last frame (for dust). */
export function drawField(c: CanvasRenderingContext2D, L: Layers, sc: Scene, dt: number) {
  const f: Field = L.field, { w, h, cx, cy, gap, spacing, size } = f;
  c.drawImage(L.ground, 0, 0, w, h);

  // the crowd: two rows a side, bobbing out of step, harder as it gets close
  const sw = crowdWidth(f), pad = 10 * size;
  for (let i = 0; i < 4; i++) {
    const dy = sc.calm ? 0 : Math.sin(sc.time * (5 + sc.excite * 7) + (i % 2) * Math.PI) * (0.6 + sc.excite * 3.4) * size;
    c.drawImage(L.crowd[i], i < 2 ? 0 : w - sw, -pad + dy, sw, h + 2 * pad);
  }

  const shift = sc.x * gap, ry = cy + shift, front = gap + 16 * size;
  // the line the ribbon is closing on glows: ours gold, theirs red
  if (sc.x > 0.55 || sc.x < -0.55) {
    const near = Math.min(1, (Math.abs(sc.x) - 0.55) / 0.45), ly = sc.x > 0 ? cy + gap : cy - gap;
    c.globalAlpha = 0.25 + 0.6 * near;
    c.strokeStyle = sc.x > 0 ? GOLD : "#ff4d4d"; c.lineWidth = 9 * size; c.lineCap = "round";
    c.beginPath(); c.moveTo(cx - 70 * size, ly); c.lineTo(cx + 70 * size, ly); c.stroke();
    c.globalAlpha = 1;
  }

  // The rope: straight through each team, bowing sideways between the fronts when slack. A twang shivers it.
  const slack = 1 - sc.tension;
  const wobble = sc.calm ? 0 : sc.twang * Math.sin(sc.time * 46) * 5 * size + sc.heave * Math.sin(sc.time * 31) * 4 * size;
  const bow = slack * gap * 0.28 * (0.8 + 0.2 * Math.sin(sc.time * 1.7)) + wobble;
  const top = ry - front, bottom = ry + front;
  c.lineCap = "butt";
  for (let pass = 0; pass < 2; pass++) {
    c.strokeStyle = pass === 0 ? ROPE : ROPE_DARK; c.lineWidth = 5 * size;
    if (pass === 1) { dash[0] = DASH_SCALE[0] * size; dash[1] = DASH_SCALE[1] * size; c.setLineDash(dash); c.lineDashOffset = -shift; }
    c.beginPath(); c.moveTo(cx, -4); c.lineTo(cx, top);
    c.quadraticCurveTo(cx + 2 * bow, ry, cx, bottom);
    c.lineTo(cx, h + 4); c.stroke();
  }
  c.setLineDash(NO_DASH); c.lineDashOffset = 0;
  // strain ticks along the bow as the rope tightens
  if (sc.tension > 0.6) {
    c.globalAlpha = Math.min(1, (sc.tension - 0.6) / 0.3);
    c.strokeStyle = "#fff4d6"; c.lineWidth = 1.6 * size;
    for (let k = 1; k < 6; k++) {
      const t = k / 6, y = top + (bottom - top) * t, x = bowX(cx, bow, t);
      c.beginPath(); c.moveTo(x - 5 * size, y); c.lineTo(x + 5 * size, y); c.stroke();
    }
    c.globalAlpha = 1;
  }

  // both teams: five each, alternating sides of the rope, leaning back on a pull
  for (let side = 0; side < 2; side++) {
    const dir = side === 0 ? 1 : -1, lean = side === 0 ? sc.lean0 : sc.lean1 + sc.heave * 0.8;
    for (let i = 0; i < 5; i++) {
      const ky = ry + dir * (front + i * spacing + lean * 3.5 * size), right = i % 2 === 1;
      const sprite = side === 1 && i === 4 && L.captain ? L.captain : L.kids[side][right ? 1 : 0];
      const kx = cx + (right ? 11 : -11) * size;
      c.drawImage(sprite.canvas, kx - sprite.ox, ky - sprite.oy, sprite.w, sprite.h);
    }
  }

  // dust
  if (!sc.calm) {
    c.fillStyle = "#e8d6ae";
    for (let i = 0; i < DUST * 5; i += 5) {
      const life = dust[i + 4];
      if (life <= 0) continue;
      dust[i + 4] = life - dt; dust[i] += dust[i + 2] * dt; dust[i + 1] += dust[i + 3] * dt;
      c.globalAlpha = Math.max(0, life / 0.45) * 0.7;
      c.beginPath(); c.arc(dust[i], dust[i + 1], (3 + (0.45 - life) * 10) * size, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
  }

  // the ribbon, on the bow's middle
  const rx = cx + bow;
  if (sc.hold > 0.02) {
    c.globalAlpha = sc.hold; c.strokeStyle = "#ffffff"; c.lineWidth = 3 * size;
    c.beginPath(); c.arc(rx, ry, (14 + (1 - sc.hold) * 22) * size, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1;
  }
  if (sc.twang > 0.05 && !sc.calm) {
    c.globalAlpha = sc.twang * 0.8; c.fillStyle = GOLD;
    c.beginPath(); c.arc(rx, ry, 13 * size, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
  }
  c.fillStyle = RIBBON;
  c.beginPath(); c.moveTo(rx - 3 * size, ry); c.lineTo(rx - 12 * size, ry - 6 * size); c.lineTo(rx - 12 * size, ry + 6 * size); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(rx + 3 * size, ry); c.lineTo(rx + 12 * size, ry - 6 * size); c.lineTo(rx + 12 * size, ry + 6 * size); c.closePath(); c.fill();
  c.fillRect(rx - 3.5 * size, ry - 3.5 * size, 7 * size, 7 * size);
}

/* ---------- the ঢোল pad ---------- */


const RING_DASH = [10, 9];
const RING_DOTS = [2, 10];
const HIT_FILL = ["#ffffff", "#a7d98a", "#f2b705", "#d9534f"];
const RING_COLOR = ["#c2410c", "#e39b00", "#8a8172", "#8a8172", "#d62828", "#c2410c"];

/**
 * The ঢোল from above: a skin head, a wooden rim with laces, two sticks, and a ring that closes in to meet the rim on every beat.
 * Tap when the ring touches the rim. `rotate` turns it for the far player in a two-player match.
 */
export function drawDrum(c: CanvasRenderingContext2D, x: number, y: number, r: number, look: DrumLook, f: Field, rotate: number) {
  c.save();
  c.translate(x, y);
  if (rotate) c.rotate(rotate);
  const onBeat = look.phase < 0.14 ? 1 - look.phase / 0.14 : 0;
  const bump = look.calm ? 1 : 1 + 0.05 * onBeat + 0.04 * look.hit;
  // the closing ring: wide right after a beat, on the rim at the next; its look says what the next beat is
  if (look.ring !== RING_NONE) {
    const big = look.ring === RING_BIG || look.ring === RING_HEAVE;
    c.globalAlpha = (look.ring === RING_QUIET ? 0.12 : 0.25) + (look.ring === RING_QUIET ? 0.2 : 0.75) * look.phase;
    c.strokeStyle = RING_COLOR[look.ring]; c.lineWidth = Math.max(3, r * (big ? 0.13 : 0.07));
    if (look.ring === RING_REST) c.setLineDash(RING_DASH); else if (look.ring === RING_QUIET) c.setLineDash(RING_DOTS);
    c.beginPath(); c.arc(0, 0, r * (1.06 + 0.9 * (1 - look.phase)), 0, Math.PI * 2); c.stroke();
    c.setLineDash(NO_DASH);
    c.globalAlpha = 1;
  }
  // the sticks: the striking one comes down on the beat, the other rests up
  const lift = look.calm ? 0.5 : look.phase;
  c.strokeStyle = "#e9c46a"; c.lineWidth = Math.max(3, r * 0.07); c.lineCap = "round";
  for (let s = 0; s < 2; s++) {
    const side = s === 0 ? -1 : 1, up = s === look.stick ? lift : 1;
    const tipX = side * r * (0.42 + 0.5 * up), tipY = -r * (0.15 + 0.85 * up);
    c.beginPath(); c.moveTo(side * r * 1.45, -r * 1.05); c.lineTo(tipX, tipY); c.stroke();
  }
  c.scale(bump, bump);
  c.fillStyle = "#7b3f22"; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#e8d3a6"; c.lineWidth = Math.max(1.5, r * 0.035);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, b = a + Math.PI / 12;
    c.beginPath(); c.moveTo(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98); c.lineTo(Math.cos(b) * r * 0.82, Math.sin(b) * r * 0.82); c.stroke();
  }
  c.fillStyle = "#f3e2bd"; c.beginPath(); c.arc(0, 0, r * 0.8, 0, Math.PI * 2); c.fill();
  if (onBeat > 0 && look.ring !== RING_QUIET) { c.globalAlpha = onBeat * 0.55; c.fillStyle = "#fff6d8"; c.beginPath(); c.arc(0, 0, r * 0.8, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
  if (look.hit > 0) {
    c.globalAlpha = look.hit * 0.75; c.fillStyle = HIT_FILL[look.hitKind]; c.beginPath(); c.arc(0, 0, r * 0.8, 0, Math.PI * 2); c.fill();
    c.globalAlpha = look.hit;
    if (look.hitKind === HIT_PERFECT) {
      // rays: the shape says "right on", not only the colour
      c.strokeStyle = "#b07d00"; c.lineWidth = Math.max(2, r * 0.05);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86); c.lineTo(Math.cos(a) * r * 1.0, Math.sin(a) * r * 1.0); c.stroke(); }
    } else if (look.hitKind === HIT_BAD) {
      // a crack across the skin
      c.strokeStyle = "#7a1f1f"; c.lineWidth = Math.max(2, r * 0.04);
      c.beginPath(); c.moveTo(-r * 0.5, -r * 0.35); c.lineTo(-r * 0.12, -r * 0.05); c.lineTo(-r * 0.2, r * 0.18); c.lineTo(r * 0.45, r * 0.4); c.stroke();
    }
    c.globalAlpha = 1;
  }
  c.fillStyle = "#2a1d14"; c.textAlign = "center"; c.textBaseline = "middle";
  if (look.word) { c.font = f.font; c.fillText(look.word, 0, look.sub ? -r * 0.12 : 0, r * 1.5); }
  if (look.sub) { c.font = f.small; c.fillStyle = "#5b4a36"; c.fillText(look.sub, 0, r * 0.3, r * 1.5); }
  c.restore();
}
