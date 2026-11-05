// The bed, every frame: the bed bitmap, the hail ring and the crow's shadow, the plates on their tracks, a ring burst and
// the particles. Reads the pools lib/scene.ts filled; allocates nothing. Returns whether anything is still moving.
import { MAX_PARTS, PART_COLORS, type Scene } from "./scene";

const NEVER = 1e9;
const HAIL = "#e0452c";
const SHADOW = "#1a1c2266";
const easeOut = (k: number) => 1 - (1 - k) * (1 - k) * (1 - k);
/** 0 → 1 with a small overshoot, for a plate dropping in. */
const easeBack = (k: number) => 1 + 2.2 * (k - 1) * (k - 1) * (k - 1) + 1.2 * (k - 1) * (k - 1);

export function drawScene(c: CanvasRenderingContext2D, sc: Scene, now: number) {
  const side = sc.side, pad = sc.pad, cell = sc.cell, size = sc.size, S = sc.slideMs, P = sc.popMs;
  const t = now - sc.t0, dt = Math.min(50, Math.max(0, now - sc.lastNow));
  sc.lastNow = now;
  c.clearRect(0, 0, side, side);
  if (sc.bed) c.drawImage(sc.bed, 0, 0, side, side);

  // the crow's shadow on the plate it will land on
  if (sc.shadow >= 0) {
    const x = pad + (sc.shadow % size + 0.5) * cell, y = pad + (Math.floor(sc.shadow / size) + 0.5) * cell;
    const breathe = sc.slow ? 1 : 0.9 + 0.1 * Math.sin(now / 220);
    c.fillStyle = SHADOW;
    c.beginPath(); c.ellipse(x, y + cell * 0.08, cell * 0.34 * breathe, cell * 0.16 * breathe, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(x - cell * 0.42, y - cell * 0.02); c.lineTo(x, y + cell * 0.06); c.lineTo(x + cell * 0.42, y - cell * 0.02); c.lineTo(x, y + cell * 0.12); c.closePath(); c.fill();
  }

  // the plates: those fading under a merge first, then the rest
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < sc.n; i++) {
      const dying = sc.die[i] < NEVER;
      if ((pass === 0) !== dying || t < sc.born[i] || t >= sc.die[i]) continue;
      let x = sc.tx[i], y = sc.ty[i];
      if (t < S) { const k = easeOut(t / S); x = sc.fx[i] + (sc.mx[i] - sc.fx[i]) * k; y = sc.fy[i] + (sc.my[i] - sc.fy[i]) * k; }
      else if (t < 2 * S) { const k = easeOut((t - S) / S); x = sc.mx[i] + (sc.tx[i] - sc.mx[i]) * k; y = sc.my[i] + (sc.ty[i] - sc.my[i]) * k; }
      let scale = 1;
      const age = t - sc.born[i];
      if (P > 0 && sc.pop[i] === 1 && age < P) scale = 1 + 0.18 * Math.sin(Math.PI * (age / P));
      else if (P > 0 && sc.pop[i] === 2 && age < P * 0.8) scale = Math.max(0.05, easeBack(age / (P * 0.8)));
      const sprite = sc.sprites[sc.sprite[i]];
      if (!sprite) continue;
      const w = cell * 0.92 * scale;
      c.drawImage(sprite, pad + (x + 0.5) * cell - w / 2, pad + (y + 0.5) * cell - w / 2, w, w);
    }
  }

  // hail: a red ring with a dot for each move left, on top of what it will hit
  if (sc.hailCell >= 0) {
    const x = pad + (sc.hailCell % size + 0.5) * cell, y = pad + (Math.floor(sc.hailCell / size) + 0.5) * cell;
    const pulse = sc.slow ? 0 : 0.5 + 0.5 * Math.sin(now / 160);
    c.strokeStyle = HAIL;
    c.lineWidth = Math.max(2, cell * (0.05 + 0.02 * pulse));
    c.beginPath(); c.arc(x, y, cell * 0.44, 0, Math.PI * 2); c.stroke();
    c.lineWidth = Math.max(1.5, cell * 0.03);
    c.beginPath(); c.moveTo(x - cell * 0.12, y - cell * 0.44); c.lineTo(x, y - cell * 0.3); c.lineTo(x + cell * 0.12, y - cell * 0.44); c.stroke();
    c.fillStyle = HAIL;
    for (let k = 0; k < sc.hailLeft; k++) { c.beginPath(); c.arc(x + (k - (sc.hailLeft - 1) / 2) * cell * 0.16, y + cell * 0.36, cell * 0.05, 0, Math.PI * 2); c.fill(); }
  }

  // a new stage's ring
  if (sc.ring >= 0 && t >= sc.ringAt && t < sc.ringAt + 520) {
    const k = (t - sc.ringAt) / 520, x = pad + (sc.ring % size + 0.5) * cell, y = pad + (Math.floor(sc.ring / size) + 0.5) * cell;
    c.globalAlpha = 1 - k;
    c.strokeStyle = PART_COLORS[sc.ringColor];
    c.lineWidth = cell * 0.08 * (1 - k) + 1;
    c.beginPath(); c.arc(x, y, cell * (0.42 + 0.8 * easeOut(k)), 0, Math.PI * 2); c.stroke();
    c.globalAlpha = 1;
  }

  // particles: leaves, petals, ice, rain, feathers, soil
  let alive = false;
  for (let i = 0; i < sc.pn && i < MAX_PARTS; i++) {
    if (t < sc.pdelay[i] || sc.page[i] >= sc.plife[i]) continue;
    alive = true;
    const step = dt / 1000;
    sc.page[i] += dt;
    sc.px[i] += sc.pvx[i] * step; sc.py[i] += sc.pvy[i] * step;
    sc.pvy[i] += 2.4 * step; sc.pvx[i] *= 0.985;
    c.globalAlpha = Math.max(0, 1 - sc.page[i] / sc.plife[i]);
    c.fillStyle = PART_COLORS[sc.pcolor[i]];
    const r = cell * sc.psize[i];
    c.beginPath(); c.ellipse(pad + sc.px[i] * cell, pad + sc.py[i] * cell, r * 1.5, r, sc.page[i] / 90, 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
  return alive || now < sc.end || (!sc.slow && (sc.hailCell >= 0 || sc.shadow >= 0));
}
