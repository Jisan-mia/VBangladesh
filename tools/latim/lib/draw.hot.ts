// The per-frame drawing: copy the pre-painted backdrop, then what is sliding in with its edge pointers, the top (in the hand,
// spinning, tipping over or on the palm), dust, the ring at a good touch, floating text, the lean gauge along the bottom and
// the wind's chevrons. Allocation-free: no literals, closures or string building in here; everything comes from the View and
// the Top, and the text from cached strings.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import { fromSide, K_PUDDLE, K_CRACK, K_RIDGE } from "./levels";
import { paintPalm, paintSpots, paintString, PAL, THING_H, THING_W } from "./figures";
import { DROP, LEAD, lean, gust, P_DONE, P_FALL, P_PALM, P_READY, P_SPIN, windPower, type Top } from "./top";
import { DUST, LEAVES, POPS, type View } from "./view";

const POP_FONT = "800 18px " + DISPLAY_FONT;
const DASH = [2, 9], NO_DASH: number[] = [];
const TIP = 0.35;
const GOOD_C = "#b6f5c4", OK_C = "#ffe08a", BAD_C = "#ffb3a8";

const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

/** A little puff of dust at (x, y) (never in ধীরে খেলো). */
export function spawnDust(v: View, x: number, y: number, count: number) {
  if (v.calm) return;
  const n = count < DUST ? count : DUST;
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i / (n > 1 ? n - 1 : 1)) * Math.PI;
    v.dx[i] = x; v.dy[i] = y; v.dvx[i] = Math.cos(a) * (30 + i * 6); v.dvy[i] = Math.sin(a) * 14 - 6; v.dl[i] = 0.5;
  }
}

/** Floating text above the top for a moment: "ঠিক সময়ে!" and its colour. */
export function pop(v: View, text: string, color: string) {
  const i = v.popNext;
  v.popNext = (i + 1) % POPS;
  v.popText[i] = text; v.popColor[i] = color; v.popAge[i] = 0; v.popX[i] = v.cx;
}
export const POP_GOOD = GOOD_C, POP_OK = OK_C, POP_BAD = BAD_C;

/** Moves the view's timers, particles and leaves (once per frame; `dt` is 0 while the round is stopped). */
export function moveView(v: View, top: Top, dt: number) {
  v.clock += dt;
  const phase = top.phase;
  if (phase === P_SPIN) v.landT += dt;
  if (phase === P_FALL) {
    v.endT += dt;
    v.spinLeft = v.spinLeft > dt * 0.8 ? v.spinLeft - dt * 0.8 : 0;
    v.turn += v.spinLeft * 10 * dt;
  } else if (phase === P_PALM) {
    v.endT += dt;
    v.turn += (6 + 18 * v.spinLeft) * dt;
  } else v.turn = top.turn;
  if (v.flash > 0) v.flash = v.flash > dt * 3 ? v.flash - dt * 3 : 0;
  if (v.shake > 0) v.shake = v.shake > dt ? v.shake - dt : 0;
  for (let i = 0; i < POPS; i++) if (v.popAge[i] < 1) v.popAge[i] += dt;
  for (let i = 0; i < DUST; i++) if (v.dl[i] > 0) { v.dl[i] -= dt; v.dx[i] += v.dvx[i] * dt; v.dy[i] += v.dvy[i] * dt; v.dvy[i] += 40 * dt; }
  const windy = top.def.wind > 0 && !v.calm && phase === P_SPIN;
  const push = windy ? 0.3 + gust(top, top.t) : 0;
  for (let i = 0; i < LEAVES; i++) {
    if (!windy) { v.lp[i] = -1; continue; }
    if (v.lp[i] < 0 || v.lx[i] > v.width + 20) { v.lx[i] = -20 - i * 40; v.ly[i] = v.height * (0.25 + 0.1 * i); v.lp[i] = i; }
    v.lx[i] += (40 + 140 * push) * dt; v.lp[i] += dt * 3; v.ly[i] += Math.sin(v.lp[i]) * 12 * dt;
  }
}

function drawTop(v: View, x: number, y: number, s: number, tilt: number, turn: number, speed: number) {
  const c = v.context!;
  c.save();
  c.translate(x, y); c.rotate(tilt);
  if (v.sprite) c.drawImage(v.sprite, -0.4 * s, -0.98 * s, 0.8 * s, s);
  paintSpots(c, s, turn, speed);
  c.restore();
}

/** A pointer at the edge a thing is coming from, with the thing's picture beside it. */
function pointer(v: View, kind: number, side: number, alpha: number) {
  const c = v.context!, x = side < 0 ? 12 : v.width - 12, pulse = 0.7 + 0.3 * Math.sin(v.clock * 14);
  c.globalAlpha = alpha * pulse;
  c.fillStyle = "#ffffff"; c.strokeStyle = PAL.ink; c.lineWidth = 2;
  c.beginPath(); c.moveTo(x - side * 6, v.cy - 24); c.lineTo(x + side * 8, v.cy - 24 + 12); c.lineTo(x - side * 6, v.cy - 24 + 24); c.closePath(); c.fill(); c.stroke();
  const unit = v.size * 0.1, spr = v.things[kind];
  if (spr) { const w = THING_W[kind] * unit, h = THING_H[kind] * unit; c.drawImage(spr, side < 0 ? x + 10 : x - 10 - w, v.cy - 24 - h * 0.6, w, h); }
  c.globalAlpha = 1;
}

/** What is sliding in or scrolling down towards the ring, from the Top's timeline. */
function drawThings(v: View, top: Top) {
  const c = v.context!, s = v.size, unit = s * 0.2;
  let k = top.next - 3;
  if (k < 0) k = 0;
  for (; k < top.n; k++) {
    const p = 1 - (top.at[k] - top.t) / LEAD;
    if (p < 0) break;
    if (p > 1.25) continue;
    const kind = top.kind[k], spr = v.things[kind];
    if (!spr) continue;
    const q = p < 1 ? p : 1, alpha = p < 1 ? 1 : 1 - (p - 1) * 4;
    c.globalAlpha = alpha;
    if (fromSide(kind)) {
      const side = top.side[k], w = THING_W[kind] * unit, h = THING_H[kind] * unit;
      const from = side < 0 ? -w : v.width + w, to = v.cx + side * s * 0.16;
      const x = from + (to - from) * q;
      c.save();
      c.translate(x, v.cy + s * 0.03);
      if (side > 0) c.scale(-1, 1);
      c.drawImage(spr, -w / 2, -h, w, h);
      c.restore();
      if (p < 0.4) pointer(v, kind, side, 1 - p * 2.2);
    } else {
      const grow = 0.3 + 0.7 * q * q, y = v.horizon + (v.cy - v.horizon) * q * Math.pow(q, 0.7);
      let w = THING_W[kind] * unit * grow, h = THING_H[kind] * unit * grow;
      let x = v.cx - w / 2;
      if (kind === K_RIDGE) { w = v.width * (0.45 + 0.55 * q); x = (v.width - w) / 2; h = unit * 0.3 * grow; }
      else if (kind === K_PUDDLE || kind === K_CRACK) x += (((k * 53) % 7) - 3) * s * 0.05 * grow;
      c.drawImage(spr, x, y - h, w, h);
    }
  }
  c.globalAlpha = 1;
}

function drawLean(v: View, top: Top) {
  const c = v.context!, gx = v.cx, gy = v.height - 20, half = v.width * 0.3, where = lean(top), edge = where < 0 ? -where : where;
  const ok = top.ok, good = top.good, slope = top.def.slope;
  c.fillStyle = "#0000004d"; c.beginPath(); c.roundRect(gx - half - 16, gy - 13, half * 2 + 32, 26, 6); c.fill();
  c.fillStyle = "#ffffff4d"; c.fillRect(gx - half, gy - 2, half * 2, 4);
  c.fillStyle = PAL.warn; c.fillRect(gx - half, gy - 3, half * (1 - ok), 6); c.fillRect(gx + half * ok, gy - 3, half * (1 - ok), 6);
  c.fillStyle = PAL.good; c.fillRect(gx - half - 6, gy - 5, half * (1 - good) + 6, 10); c.fillRect(gx + half * good, gy - 5, half * (1 - good) + 6, 10);
  // a slope hides the green on the uphill side: dim the end the lean can never reach
  if (slope > 0 && -1 + slope > -good) { c.fillStyle = "#3a3a3acc"; c.fillRect(gx - half - 8, gy - 6, half * (1 - good) + 8, 12); }
  else if (slope < 0 && 1 + slope < good) { c.fillStyle = "#3a3a3acc"; c.fillRect(gx + half * good, gy - 6, half * (1 - good) + 8, 12); }
  const inGood = edge >= good;
  c.fillStyle = inGood ? PAL.good : "#fff"; c.strokeStyle = PAL.ink; c.lineWidth = 2;
  c.beginPath(); c.arc(gx + where * half, gy, (inGood ? 10 : 7) + v.flash * 4, 0, Math.PI * 2); c.fill(); c.stroke();
}

function drawChevrons(v: View, top: Top) {
  const c = v.context!, push = gust(top, top.t), alpha = push * 1.6 > 1 ? 1 : push * 1.6;
  if (alpha < 0.08) return;
  c.globalAlpha = alpha; c.strokeStyle = "#ffffff"; c.lineWidth = 3; c.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const x = 8 + i * 9, y = v.cy - 10;
    c.beginPath(); c.moveTo(x, y - 9); c.lineTo(x + 7, y); c.lineTo(x, y + 9); c.stroke();
  }
  c.globalAlpha = 1;
}

export function drawFrame(v: View, top: Top, held: number) {
  const c = v.context;
  if (!c || !v.width || !v.height) return;
  const W = v.width, H = v.height, cx = v.cx, cy = v.cy, s = v.size;
  // Once the result is in, the stage keeps showing how it ended.
  const phase = top.phase === P_DONE ? (top.bonus > 0 ? P_PALM : P_FALL) : top.phase;
  c.save();
  if (v.shake > 0 && !v.calm) c.translate(Math.sin(v.shake * 90) * 3, 0);
  c.clearRect(-4, 0, W + 8, H);
  if (v.bg) c.drawImage(v.bg, 0, 0, W, H);

  for (let i = 0; i < LEAVES; i++) {
    if (v.lp[i] < 0) continue;
    c.fillStyle = "#6d8f2e"; c.beginPath(); c.ellipse(v.lx[i], v.ly[i], 6, 2.5, v.lp[i], 0, Math.PI * 2); c.fill();
  }

  if (phase === P_READY) {
    const power = top.winding ? windPower(held) : 0;
    const lowered = v.drag > power * 0.35 ? v.drag : power * 0.35;
    const y = H * 0.44 + lowered * H * 0.16, wiggle = top.winding ? Math.sin(held * 40) * 0.03 : 0;
    c.save(); c.translate(cx, y); c.rotate(wiggle + 0.12);
    paintString(c, s * 0.8, top.wraps, v.drag);
    c.restore();
    drawTop(v, cx, y, s * 0.8, wiggle + 0.12, 0, 0);
    c.fillStyle = "#00000026"; c.beginPath(); c.ellipse(cx, cy, s * 0.14, s * 0.04, 0, 0, Math.PI * 2); c.fill();
    if (!top.winding && v.drag === 0) {
      // the pull hint: a dashed arrow down beside the top
      c.strokeStyle = "#ffffffd9"; c.lineWidth = 4; c.lineCap = "round"; c.setLineDash(DASH);
      const ax = cx + s * 0.62;
      c.beginPath(); c.moveTo(ax, H * 0.3); c.lineTo(ax, H * 0.62); c.stroke(); c.setLineDash(NO_DASH);
      c.beginPath(); c.moveTo(ax - 10, H * 0.58); c.lineTo(ax, H * 0.64); c.lineTo(ax + 10, H * 0.58); c.stroke();
    }
    if (top.winding) {
      // the bar of the wind, along the string: a ring that fills with the power
      c.strokeStyle = "#ffffff55"; c.lineWidth = 6; c.beginPath(); c.arc(cx, y - s * 0.4, s * 0.62, Math.PI * 0.75, Math.PI * 2.25); c.stroke();
      c.strokeStyle = power > 0.92 ? PAL.good : "#ffd166"; c.beginPath(); c.arc(cx, y - s * 0.4, s * 0.62, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * power)); c.stroke();
    }
  } else if (phase === P_SPIN) {
    drawThings(v, top);
    const drop = v.landT / DROP < 1 ? v.landT / DROP : 1, tilt = top.wobble * lean(top) * 0.55;
    const x = cx + top.wobble * Math.cos(top.sway) * s * 0.12;
    const y = drop < 1 ? H * 0.44 + (cy - H * 0.44) * drop * drop : cy;
    c.fillStyle = "#00000038"; c.beginPath(); c.ellipse(x, cy, s * (0.14 + top.wobble * 0.08), s * 0.04, 0, 0, Math.PI * 2); c.fill();
    drawTop(v, x, y, s, tilt, top.turn, top.omega);
  } else if (phase === P_FALL) {
    const k = v.endT / TIP < 1 ? v.endT / TIP : 1;
    const settle = v.endT > TIP ? Math.sin((v.endT - TIP) * 18) * 0.08 * Math.exp(-(v.endT - TIP) * 4) : 0;
    const angle = v.fallTilt + (v.fallDir * 1.3 - v.fallTilt) * k * k + settle;
    c.fillStyle = "#00000030"; c.beginPath(); c.ellipse(cx + v.fallDir * s * 0.4 * k, cy, s * (0.14 + 0.3 * k), s * 0.05, 0, 0, Math.PI * 2); c.fill();
    drawTop(v, cx + v.fallDir * s * 0.08 * k, cy - s * 0.12 * k, s, angle, v.turn, v.spinLeft * 0.5);
  } else if (phase === P_PALM) {
    const rise = v.endT / 0.35 < 1 ? v.endT / 0.35 : 1, lift = Math.min(1, Math.max(0, (v.endT - 0.35) / 0.3));
    const handY = H + s * 0.3 - (H + s * 0.3 - cy - s * 0.02) * (1 - (1 - rise) * (1 - rise)) - lift * H * 0.12;
    drawTop(v, cx, handY < cy ? handY : cy, s, 0, v.turn, v.spinLeft);
    paintPalm(c, cx, handY, s * 0.85);
  }

  for (let i = 0; i < DUST; i++) {
    if (v.dl[i] <= 0) continue;
    c.globalAlpha = v.dl[i] * 1.6 > 1 ? 1 : v.dl[i] * 1.6; c.fillStyle = "#e9d2b0";
    c.beginPath(); c.arc(v.dx[i], v.dy[i], 3 + (0.5 - v.dl[i]) * 8, 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
  if (v.flash > 0 && !v.calm) {
    c.globalAlpha = v.flash; c.strokeStyle = v.flashSide > 0 ? "#b6f5c4" : "#ffe08a"; c.lineWidth = 4;
    c.beginPath(); c.ellipse(cx, cy - s * 0.4, s * (0.3 + (1 - v.flash) * 0.5), s * (0.45 + (1 - v.flash) * 0.4), 0, 0, Math.PI * 2); c.stroke();
    c.globalAlpha = 1;
  }
  c.font = POP_FONT; c.textAlign = "center"; c.lineWidth = 4; c.strokeStyle = "#000000a0";
  for (let i = 0; i < POPS; i++) {
    const age = v.popAge[i];
    if (age >= 0.8) continue;
    const k = age / 0.8, y = cy - s * 1.05 - easeOut(k) * 26;
    c.globalAlpha = age < 0.12 ? age / 0.12 : (k > 0.55 ? (1 - k) / 0.45 : 1);
    c.strokeText(v.popText[i], v.popX[i], y);
    c.fillStyle = v.popColor[i]; c.fillText(v.popText[i], v.popX[i], y);
  }
  c.globalAlpha = 1;
  c.restore();

  if (phase === P_SPIN) {
    drawLean(v, top);
    if (top.def.wind > 0) drawChevrons(v, top);
  }
}
