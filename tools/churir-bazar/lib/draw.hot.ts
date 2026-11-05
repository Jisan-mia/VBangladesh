// The tray, every frame: the tray bitmap, dust, the bangles on the timeline lib/scene.ts built, blast lanes, rings, shards
// and floating points. Reads the pools and allocates nothing. Returns whether anything is still moving.
import { GOLD } from "./art";
import { CELLS, LOCK, SIZE } from "./board";
import {
  MAX_PARTS, SEG_FALL, SEG_HOLD, SEG_POP, SEG_SHAKE, SEG_SWAP, SEG_WRONG, SHAKE_MS, SHARD_COLORS, type Scene,
} from "./scene";

const easeOut = (k: number) => 1 - (1 - k) * (1 - k) * (1 - k);
/** 0 → 1 with a small overshoot, for a special growing out of a line. */
const easeBack = (k: number) => 1 + 2.2 * (k - 1) * (k - 1) * (k - 1) + 1.2 * (k - 1) * (k - 1);
const DROP_RING = "#e0302a";
const SELECT_FILL = "#fff0be";
const CURSOR = "#ffffff";

function blit(c: CanvasRenderingContext2D, sprite: HTMLCanvasElement | null, x: number, y: number, size: number, scale: number, alpha: number) {
  if (!sprite || alpha <= 0) return;
  c.globalAlpha = alpha > 1 ? 1 : alpha;
  if (scale === 1) c.drawImage(sprite, x, y, size, size);
  else { const s = size * scale; c.drawImage(sprite, x + (size - s) / 2, y + (size - s) / 2, s, s); }
}

export function drawScene(c: CanvasRenderingContext2D, sc: Scene, now: number) {
  const side = sc.side, cell = sc.cell, slow = sc.slow, ratio = sc.ratio;
  const t = now - sc.t0, dt = Math.min(50, Math.max(0, now - sc.lastNow));
  sc.lastNow = now;

  // which segment is on
  let s = -1, pops = 0;
  for (let i = 0; i < sc.n; i++) {
    if (sc.kind[i] === SEG_POP && sc.from[i] <= t) pops++;
    if (s < 0 && t >= sc.from[i] && t < sc.to[i]) s = i;
  }
  sc.popsShown = pops;
  const kind = s >= 0 ? sc.kind[s] : -1;
  sc.inShake = kind === SEG_SHAKE;
  const p = s >= 0 ? (t - sc.from[s]) / (sc.to[s] - sc.from[s]) : 1;
  let cells = sc.rest;
  let dustA = sc.restDust, dustB = sc.restDust;
  if (s >= 0) {
    const shown = sc.segCells[s];
    if (shown) cells = shown;
    const a = sc.segDustA[s], b = sc.segDustB[s];
    if (a) dustA = a;
    if (b) dustB = b;
  }
  const step = s >= 0 ? sc.segStep[s] : null;
  let shakeX = 0;
  if (kind === SEG_SHAKE && p < 0.3 && !slow) { shakeX = Math.sin(p * 90) * 5 * (1 - p / 0.3); if (sc.pre) cells = sc.pre; }
  else if (sc.shakeAmp > 0 && t >= sc.shakeAt && t - sc.shakeAt < 220 && !slow) { const k = (t - sc.shakeAt) / 220; shakeX = Math.sin(k * 38) * sc.shakeAmp * (1 - k); }
  else if (kind === SEG_SHAKE && sc.pre && p < 0.3) cells = sc.pre;

  c.clearRect(0, 0, side, side);
  c.save();
  c.translate(shakeX, 0);
  if (sc.tray) c.drawImage(sc.tray, 0, 0, side, side);
  c.beginPath(); c.rect(0, 0, side, side); c.clip();

  // dust on the velvet, under the bangles; a layer that is wiped fades into the next
  for (let i = 0; i < CELLS; i++) {
    const la = dustA[i], lb = kind === SEG_POP ? dustB[i] : la;
    if (la === 0 && lb === 0) continue;
    const x = (i % SIZE) * cell, y = Math.floor(i / SIZE) * cell;
    if (la === lb) blit(c, sc.dustSprites[la], x, y, cell, 1, 1);
    else {
      if (la > 0) blit(c, sc.dustSprites[la], x, y, cell, 1, 1 - p);
      if (lb > 0) blit(c, sc.dustSprites[lb], x, y, cell, 1, p);
    }
  }
  c.globalAlpha = 1;

  // selection under the bangle
  if (sc.selected >= 0 && !slow) {
    c.fillStyle = SELECT_FILL; c.globalAlpha = 0.34;
    c.beginPath(); c.roundRect((sc.selected % SIZE) * cell + 2, Math.floor(sc.selected / SIZE) * cell + 2, cell - 4, cell - 4, cell * 0.2); c.fill();
    c.globalAlpha = 1;
  } else if (sc.selected >= 0) {
    c.strokeStyle = SELECT_FILL; c.lineWidth = 3;
    c.beginPath(); c.roundRect((sc.selected % SIZE) * cell + 3, Math.floor(sc.selected / SIZE) * cell + 3, cell - 6, cell - 6, cell * 0.2); c.stroke();
  }

  // blast lanes: a gold cross that fades as the pop runs
  if (kind === SEG_POP && step) {
    const fade = 1 - p;
    c.fillStyle = GOLD; c.globalAlpha = 0.5 * fade;
    for (let k = 0; k < step.blasts.length; k++) {
      const at = step.blasts[k], col = at % SIZE, row = Math.floor(at / SIZE), left = Math.max(0, col - 2), top = Math.max(0, row - 2);
      c.fillRect(left * cell, (row + 0.3) * cell, (Math.min(SIZE - 1, col + 2) - left + 1) * cell, cell * 0.4);
      c.fillRect((col + 0.3) * cell, top * cell, cell * 0.4, (Math.min(SIZE - 1, row + 2) - top + 1) * cell);
    }
    c.globalAlpha = 1;
  }

  // the bangles
  sc.mark.fill(0);
  if (kind === SEG_POP && step) {
    for (let k = 0; k < step.cleared.length; k++) sc.mark[step.cleared[k]] = 1;
    for (let k = 0; k < step.made.length; k++) sc.mark[step.made[k].cell] = 2;
  }
  const lockK = sc.lockCell >= 0 && t >= sc.lockAt ? Math.min(1, (t - sc.lockAt) / (slow ? 80 : 240)) : 1;
  for (let i = 0; i < CELLS; i++) {
    const piece = cells[i];
    if (piece < 0) continue;
    let ox = 0, oy = 0, scale = 1, alpha = 1;
    if (kind === SEG_SWAP || kind === SEG_WRONG) {
      if (i === sc.swapA || i === sc.swapB) {
        const other = i === sc.swapA ? sc.swapB : sc.swapA;
        const dx = (other % SIZE) - (i % SIZE), dy = Math.floor(other / SIZE) - Math.floor(i / SIZE);
        const e = kind === SEG_SWAP ? easeOut(p) : Math.sin(p * Math.PI) * 0.45;
        ox = dx * e; oy = dy * e;
        if (kind === SEG_SWAP) scale = 1 + 0.08 * Math.sin(p * Math.PI);
      }
    } else if (kind === SEG_POP) {
      if (sc.mark[i] === 1) { scale = 1 + 0.4 * p; alpha = 1 - p; }
      else if (sc.mark[i] === 2) continue;
    } else if (kind === SEG_FALL && step) {
      oy = -step.fall[i] * (1 - (0.2 * p + 0.8 * p * p));
    } else if (kind === SEG_SHAKE && sc.order && p >= 0.3) {
      const old = sc.order[i], e = easeOut((p - 0.3) / 0.7);
      ox = ((old % SIZE) - (i % SIZE)) * (1 - e); oy = (Math.floor(old / SIZE) - Math.floor(i / SIZE)) * (1 - e);
    }
    if (i === sc.lockCell && lockK < 1) scale *= 1 + 0.5 * (1 - lockK) * (1 - lockK);
    if (i === sc.hint0 || i === sc.hint1) if (sc.hintOn && !slow && s < 0) scale *= 1 + 0.07 * Math.sin(now / 160);
    if (i === sc.selected && !slow) scale *= 1.08;
    const y = (Math.floor(i / SIZE) + oy) * cell;
    if (y <= -cell) continue;
    blit(c, sc.sprites[piece], (i % SIZE + ox) * cell, y, cell, scale, alpha);
    if (piece >= 10 && piece < LOCK && !slow && alpha === 1) {
      // a glint that breathes on the special bangles
      const r = cell * (0.08 + 0.06 * Math.abs(Math.sin(now / 300 + i))), gx = (i % SIZE + ox) * cell + cell * 0.78, gy = y + cell * 0.22;
      c.fillStyle = "#fff6cf";
      c.beginPath(); c.moveTo(gx, gy - r); c.lineTo(gx + r * 0.3, gy - r * 0.3); c.lineTo(gx + r, gy); c.lineTo(gx + r * 0.3, gy + r * 0.3); c.lineTo(gx, gy + r); c.lineTo(gx - r * 0.3, gy + r * 0.3); c.lineTo(gx - r, gy); c.lineTo(gx - r * 0.3, gy - r * 0.3); c.closePath(); c.fill();
    }
  }
  // specials growing out of the line they came from
  if (kind === SEG_POP && step) {
    for (let k = 0; k < step.made.length; k++) {
      const item = step.made[k];
      blit(c, sc.sprites[item.piece], (item.cell % SIZE) * cell, Math.floor(item.cell / SIZE) * cell, cell, Math.max(0.05, 0.3 + 0.7 * easeBack(p)), 1);
    }
  }
  c.globalAlpha = 1;

  // the hint: a gold ring on both bangles of the swap, pulsing (still in ধীরে খেলো)
  if (sc.hintOn && s < 0) {
    c.strokeStyle = GOLD; c.lineWidth = 3; c.globalAlpha = slow ? 1 : 0.55 + 0.45 * Math.sin(now / 160);
    for (let k = 0; k < 2; k++) {
      const at = k === 0 ? sc.hint0 : sc.hint1;
      if (at < 0) continue;
      c.beginPath(); c.roundRect((at % SIZE) * cell + 3, Math.floor(at / SIZE) * cell + 3, cell - 6, cell - 6, cell * 0.22); c.stroke();
    }
    c.globalAlpha = 1;
  }

  // the next তালা: a red ring on the cell it will fall on
  if (sc.dropCell >= 0 && s < 0) {
    const x = (sc.dropCell % SIZE + 0.5) * cell, y = (Math.floor(sc.dropCell / SIZE) + 0.5) * cell, pulse = slow ? 0 : 0.5 + 0.5 * Math.sin(now / 170);
    c.strokeStyle = DROP_RING; c.lineWidth = Math.max(2.5, cell * (0.06 + 0.025 * pulse));
    c.beginPath(); c.arc(x, y, cell * 0.45, 0, Math.PI * 2); c.stroke();
    c.fillStyle = DROP_RING;
    c.beginPath(); c.moveTo(x - cell * 0.13, y - cell * 0.5); c.lineTo(x + cell * 0.13, y - cell * 0.5); c.lineTo(x, y - cell * 0.34); c.closePath(); c.fill();
  }

  // the keyboard's cursor
  if (sc.keyboard && s < 0) {
    c.strokeStyle = CURSOR; c.lineWidth = 3;
    c.beginPath(); c.roundRect((sc.cursor % SIZE) * cell + 3, Math.floor(sc.cursor / SIZE) * cell + 3, cell - 6, cell - 6, cell * 0.2); c.stroke();
  }

  // rings: a new special, a blast, a তালা landing
  for (let i = 0; i < sc.rn; i++) {
    const age = t - sc.rdelay[i];
    if (age < 0 || age > 460) continue;
    const k = age / 460;
    c.globalAlpha = 1 - k; c.strokeStyle = SHARD_COLORS[sc.rcolor[i]]; c.lineWidth = cell * 0.09 * (1 - k) + 1;
    c.beginPath(); c.arc(sc.rx[i] * cell, sc.ry[i] * cell, cell * (0.35 + 0.55 * sc.rbig[i] * easeOut(k)), 0, Math.PI * 2); c.stroke();
  }
  c.globalAlpha = 1;

  // shards
  let alive = false;
  const step2 = dt / 1000;
  for (let i = 0; i < sc.pn && i < MAX_PARTS; i++) {
    if (t < sc.pdelay[i] || sc.page[i] >= sc.plife[i]) continue;
    alive = true;
    sc.page[i] += dt;
    sc.px[i] += sc.pvx[i] * step2; sc.py[i] += sc.pvy[i] * step2;
    sc.pvy[i] += 5.5 * step2; sc.pvx[i] *= 0.985; sc.prot[i] += sc.pvr[i] * step2;
    const r = cell * sc.psize[i];
    c.globalAlpha = Math.max(0, 1 - (sc.page[i] / sc.plife[i]) ** 2);
    c.fillStyle = SHARD_COLORS[sc.pcolor[i]];
    // one setTransform instead of save/translate/rotate/restore: cheaper for a few hundred shards, and it allocates nothing
    const cos = Math.cos(sc.prot[i]) * ratio, sin = Math.sin(sc.prot[i]) * ratio;
    c.setTransform(cos, sin, -sin, cos, (sc.px[i] * cell + shakeX) * ratio, sc.py[i] * cell * ratio);
    c.beginPath(); c.moveTo(0, -r * 1.3); c.lineTo(r, r * 0.8); c.lineTo(-r * 0.9, r * 0.6); c.closePath(); c.fill();
  }
  c.setTransform(ratio, 0, 0, ratio, shakeX * ratio, 0);
  c.globalAlpha = 1;

  // points rising from each lift
  if (sc.fn > 0) {
    c.textAlign = "center"; c.font = sc.font;
    for (let i = 0; i < sc.fn; i++) {
      const age = (t - sc.fdelay[i]) / 800;
      if (age < 0 || age >= 1) continue;
      c.globalAlpha = 1 - age;
      c.fillStyle = "rgba(0,0,0,0.5)"; c.fillText(sc.ftext[i], sc.fx[i] * cell + 1, sc.fy[i] * cell - age * cell * 0.9 + 2);
      c.fillStyle = GOLD; c.fillText(sc.ftext[i], sc.fx[i] * cell, sc.fy[i] * cell - age * cell * 0.9);
    }
    c.globalAlpha = 1;
  }
  c.restore();
  return alive || now < sc.end || (!slow && (sc.hintOn || sc.dropCell >= 0));
}
