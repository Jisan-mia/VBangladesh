// One frame of the water. Runs every animation frame on a cheap phone: it blits the layers art.ts built, draws a handful
// of paths and mutates the juice state in place. No allocation here (scratch numbers live at module scope).
import { POPS, RAIN, RIPPLES, sizeAt, xOf, yOf, type Fx, type Layers } from "./art";
import { fight } from "./species";
import { floatState, FLIGHT, onPad, P, SHOW_CATCH, TRICK, type Trip } from "./trip";

const TAU = Math.PI * 2;
const DASH = [5, 5], SOLID: number[] = [];
let tipX = 0, tipY = 0, fx0 = 0, fy0 = 0, fsz = 1, fishX = 0, fishY = 0, fxCatchX = 0, fxCatchY = 0;

/** A ring spreading on the water. */
export function ripple(fx: Fx, x: number, y: number, strength: number) {
  const at = fx.next * 4;
  fx.ripples[at] = x; fx.ripples[at + 1] = y; fx.ripples[at + 2] = 0; fx.ripples[at + 3] = strength;
  fx.next = (fx.next + 1) % RIPPLES;
}
/** A word that rises and fades (an index into layers.words). */
export function pop(fx: Fx, word: number, x: number, y: number) {
  const at = fx.popNext * 4;
  fx.pops[at] = word; fx.pops[at + 1] = x; fx.pops[at + 2] = y; fx.pops[at + 3] = 0;
  fx.popNext = (fx.popNext + 1) % POPS;
}
export function resetFx(fx: Fx) {
  fx.ripples.fill(-1); fx.pops.fill(-1); fx.shake = 0; fx.whip = 0; fx.leap = 0;
}

function ellipse(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU);
}

/** Where the float is now (into fx0, fy0, fsz). */
function placeFloat(L: Layers, trip: Trip) {
  const d = trip.phase === P.AIM ? 0 : trip.landed, x = xOf(L, trip.side, d), y = yOf(L, d);
  if (trip.phase === P.AIM) { fx0 = tipX + 4; fy0 = tipY + 44; fsz = 1; return; }
  if (trip.phase === P.FLY) {
    const p = Math.min(1, trip.t / FLIGHT);
    fx0 = tipX + (x - tipX) * p; fy0 = tipY + (y - tipY) * p - Math.sin(Math.PI * p) * 80; fsz = sizeAt(d * p);
    return;
  }
  fx0 = x; fy0 = y; fsz = sizeAt(d);
}

function drawRod(c: CanvasRenderingContext2D, L: Layers, bend: number) {
  const bx = -8, by = L.wh + 8, cx = (bx + tipX) / 2 + 16 + bend * 30, cy = (by + tipY) / 2 - 12 + bend * 34;
  c.lineCap = "round";
  c.strokeStyle = "#7a5c22"; c.lineWidth = 8;
  c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(cx, cy, tipX, tipY); c.stroke();
  c.strokeStyle = "#d4ac55"; c.lineWidth = 5;
  c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(cx, cy, tipX, tipY); c.stroke();
  c.strokeStyle = "#8a6a2a"; c.lineWidth = 1.6;
  for (let i = 1; i < 5; i++) {
    const p = i / 5, q = 1 - p, x = q * q * bx + 2 * q * p * cx + p * p * tipX, y = q * q * by + 2 * q * p * cy + p * p * tipY;
    c.beginPath(); c.moveTo(x - 3.4, y - 1.6); c.lineTo(x + 3.4, y + 1.6); c.stroke();
  }
}

function drawFloat(c: CanvasRenderingContext2D, trip: Trip, bob: number, showMark: boolean, lit: boolean) {
  const state = floatState(trip), s = fsz * 2.3, flying = trip.phase === P.FLY;
  const dip = state < 2 ? state * 5 * s : 0, x = fx0, y = fy0 + (flying ? 0 : bob + dip);
  if (state < 2) {
    c.fillStyle = "#f4f1ea"; c.fillRect(x - 2 * s, y - 6 * s, 4 * s, 6 * s);
    c.fillStyle = "#d6352b"; ellipse(c, x, y - 8 * s, 2.6 * s, 4 * s); c.fill();
    c.fillStyle = "#1d1d1d"; c.fillRect(x - 0.6 * s, y - 15 * s, 1.2 * s, 4 * s);
    if (!flying) { c.globalAlpha = 0.35; c.fillStyle = "#ffffff"; ellipse(c, x, y + 0.5, 5 * s, 1.6 * s); c.fill(); c.globalAlpha = 1; }
  } else if (trip.phase === P.WAIT) {
    // Under: only the tip of the stick shows; early waters add a "!" so the eye catches it.
    c.fillStyle = "#1d1d1d"; c.fillRect(x - 0.6 * s, y - 3 * s, 1.2 * s, 3 * s);
    if (showMark) { c.fillStyle = "#ffd166"; c.font = "800 22px sans-serif"; c.textAlign = "center"; c.textBaseline = "alphabetic"; c.fillText("!", x, y - 12 * s); }
  }
  if (lit) {
    // Dusk: the float's tip glows (a firefly-green bead), so it reads through the dark.
    c.globalAlpha = 0.9; c.fillStyle = "#d8ff8a"; ellipse(c, x, y - (state < 2 ? 15 : 3) * s, 1.6 * s, 1.6 * s); c.fill();
    c.globalAlpha = 0.25; ellipse(c, x, y - (state < 2 ? 14 : 2) * s, 6 * s, 6 * s); c.fill(); c.globalAlpha = 1;
  }
}

function drawBubbles(c: CanvasRenderingContext2D, L: Layers, trip: Trip, clock: number, slow: boolean) {
  const s = sizeAt(trip.spot) * 1.25, bx = xOf(L, trip.side, trip.spot), by = yOf(L, trip.spot);
  c.globalAlpha = 0.3; c.fillStyle = "#0e2f28"; ellipse(c, bx, by + 2, 26 * s, 8 * s); c.fill();
  const ring = (clock * (slow ? 0.3 : 0.5)) % 1;
  c.globalAlpha = 0.6 * (1 - ring); c.strokeStyle = "#ffffff"; c.lineWidth = 1.2;
  ellipse(c, bx, by + 2, (8 + ring * 24) * s, (3 + ring * 8) * s); c.stroke();
  for (let i = 0; i < 5; i++) {
    const p = (clock * (slow ? 0.4 : 0.8) + i * 0.21) % 1;
    c.globalAlpha = 1 - p;
    c.beginPath(); c.arc(bx + Math.sin(i * 2.1 + clock) * 9 * s, by - p * 10 * s, (2.4 + (i % 2) * 1.4) * s, 0, TAU); c.stroke();
  }
  c.globalAlpha = 1;
}

function drawPads(c: CanvasRenderingContext2D, L: Layers, trip: Trip) {
  for (let i = 0; i < 2; i++) {
    const d = trip.pads[i];
    if (d < 0) continue;
    const w = 52 * sizeAt(d);
    c.drawImage(L.pad, xOf(L, trip.side, d) - w / 2, yOf(L, d) - w * 0.22, w, w * 0.45);
  }
}

function drawAim(c: CanvasRenderingContext2D, L: Layers, trip: Trip) {
  const d = trip.power, s = sizeAt(d), near = Math.abs(d - trip.spot) < 0.08, pad = onPad(trip, d);
  c.setLineDash(DASH); c.lineWidth = near || pad ? 2.6 : 1.7; c.strokeStyle = pad ? "#ff6b5a" : near ? "#ffd166" : "#ffffff";
  ellipse(c, xOf(L, trip.side, d), yOf(L, d), 14 * s, 5.4 * s); c.stroke();
  c.setLineDash(SOLID);
  // The path the ring travels, faint, so you see where it's going.
  c.globalAlpha = 0.22; c.strokeStyle = "#ffffff"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(xOf(L, trip.side, 0.05), yOf(L, 0.05)); c.lineTo(xOf(L, trip.side, 1), yOf(L, 1)); c.stroke();
  c.globalAlpha = 1;
}

/** The fish on the line: a shadow swimming to the bank as the reel fills, showing its tricks' tells. */
function drawFishShadow(c: CanvasRenderingContext2D, L: Layers, trip: Trip, fx: Fx, clock: number, slow: boolean) {
  const d = trip.landed * (1 - trip.progress), size = sizeAt(d);
  const surging = trip.t < trip.surgeEnd, rushing = trip.t < trip.rushEnd;
  const telling = trip.warned && trip.trick !== TRICK.NONE ? trip.trick : TRICK.NONE;
  const wiggle = slow ? 0 : Math.sin(clock * (surging ? 22 : 9)) * (surging ? 5 : 2);
  fishX = xOf(L, trip.side * (1 - trip.progress * 0.5), d) + wiggle;
  fishY = yOf(L, d) + (rushing ? 8 : 0);
  let w = (trip.isBoss ? 120 : 34 + 60 * fight(trip.grams)) * size;
  if (telling === TRICK.JUMP) w *= 1 + 0.5 * Math.max(0, 1 - (trip.trickAt - trip.t) / trip.warnFor);
  c.globalAlpha = telling === TRICK.JUMP ? 0.65 : 1;
  c.drawImage(L.shadow, fishX - w / 2, fishY - w * 0.2, w, w * 0.4);
  c.globalAlpha = 1;
  if (telling === TRICK.SURGE || surging) {
    // The water boils over a fish about to run.
    c.strokeStyle = "#ffffff"; c.lineWidth = 1.4;
    for (let i = 0; i < 2; i++) {
      const p = (clock * 2.4 + i * 0.5) % 1;
      c.globalAlpha = 0.75 * (1 - p); ellipse(c, fishX, fishY, (6 + p * 26) * size, (2 + p * 9) * size); c.stroke();
    }
    c.globalAlpha = 1;
  }
  if (telling === TRICK.RUSH || rushing) {
    // It turns towards you: a chevron under the shadow.
    c.strokeStyle = "#9fd8ff"; c.lineWidth = 2.4; c.globalAlpha = 0.9;
    c.beginPath(); c.moveTo(fishX - 9, fishY + 10); c.lineTo(fishX, fishY + 18); c.lineTo(fishX + 9, fishY + 10); c.stroke();
    c.globalAlpha = 1;
  }
  fx.fishX = fishX; fx.fishY = fishY;
}

function drawLeap(c: CanvasRenderingContext2D, L: Layers, trip: Trip, fx: Fx, dt: number) {
  const sprite = L.fish[trip.fish];
  fx.leap -= dt;
  if (fx.leap <= 0) { fx.leap = 0; ripple(fx, fx.leapX, fx.leapY, 1.5); return; }
  if (!sprite) return;
  const p = 1 - fx.leap / 0.6, len = (trip.isBoss ? 110 : 40 + 50 * fight(trip.grams)) * sizeAt(trip.landed * (1 - trip.progress));
  c.save();
  c.translate(fx.leapX + (p - 0.5) * 30, fx.leapY - Math.sin(Math.PI * p) * 46);
  c.rotate(-0.9 + p * 1.8);
  c.drawImage(sprite, -len / 2, -len * 0.27, len, len * 0.54);
  c.restore();
}

/** A caught fish: lifted out on the line, swinging under the rod tip with its tag, then dropped into the basket. */
function drawCatch(c: CanvasRenderingContext2D, L: Layers, trip: Trip, clock: number, slow: boolean) {
  const sprite = L.fish[trip.fish];
  if (!sprite) return;
  const t = trip.t, len = trip.isBoss ? 130 : 58 + 76 * fight(trip.grams);
  let x = tipX, y = tipY + 28 + len * 0.3, turn = 0, scale = 1;
  if (t < 0.45) {
    const p = t / 0.45, e = 1 - (1 - p) * (1 - p);
    x = fxCatchX + (x - fxCatchX) * e; y = fxCatchY + (y - fxCatchY) * e - Math.sin(Math.PI * p) * 22; turn = (1 - e) * -0.8;
  } else if (t < SHOW_CATCH - 0.35) turn = slow ? 0 : Math.sin(clock * 7) * 0.22;
  else {
    const p = (t - (SHOW_CATCH - 0.35)) / 0.35, e = p * p;
    x = x + (L.basketX - x) * e; y = y + (L.basketY - 12 - y) * e; scale = 1 - 0.55 * e; turn = e * 1.2;
  }
  // The line from the tip down to its mouth.
  c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(tipX, tipY); c.lineTo(x + len * 0.45 * scale, y - 2); c.stroke();
  c.save(); c.translate(x, y); c.rotate(turn - 0.25);
  c.drawImage(sprite, (-len / 2) * scale, -len * 0.27 * scale, len * scale, len * 0.54 * scale);
  c.restore();
  const tag = L.tag;
  if (tag && t > 0.3 && t < SHOW_CATCH - 0.3) {
    c.globalAlpha = Math.min(1, (t - 0.3) * 5);
    const tx = Math.min(L.ww - tag.w - 6, Math.max(6, x + len * 0.35)), ty = Math.max(L.waterTop + 4, y - len * 0.3 - tag.h - 6);
    c.drawImage(tag.canvas, tx, ty, tag.w, tag.h);
    c.globalAlpha = 1;
  }
}

/** The tension meter on the right edge (green band, red top, the needle now), and the reel's progress on the bottom edge. */
function drawMeter(c: CanvasRenderingContext2D, L: Layers, trip: Trip, clock: number, slow: boolean) {
  const x = L.meterX, top = L.meterTop, h = L.meterH, w = 12;
  const yLo = top + h * (1 - trip.lo), yHi = top + h * (1 - trip.hi), danger = trip.strain > 0;
  c.globalAlpha = 0.6; c.fillStyle = "#0a1e1a"; c.fillRect(x - 3, top - 3, w + 6, h + 6); c.globalAlpha = 1;
  c.fillStyle = "#e9e4d6"; c.fillRect(x, top, w, h);
  c.fillStyle = danger && !slow && Math.sin(clock * 30) > 0 ? "#ff4a3a" : "#d6352b"; c.fillRect(x, top, w, h * (1 - trip.red));
  c.fillStyle = "#3fae5a"; c.fillRect(x, yHi, w, yLo - yHi);
  // Hatching on the red zone, so it differs by shape and not only colour.
  c.strokeStyle = "rgba(255,255,255,0.5)"; c.lineWidth = 1;
  for (let yy = top + 4; yy < top + h * (1 - trip.red); yy += 5) { c.beginPath(); c.moveTo(x, yy + 3); c.lineTo(x + w, yy - 3); c.stroke(); }
  const y = top + h * (1 - trip.tension);
  c.fillStyle = danger ? "#d6352b" : trip.tension < trip.lo ? "#2f6fa8" : "#14231f";
  c.beginPath(); c.moveTo(x - 10, y - 7); c.lineTo(x - 1, y); c.lineTo(x - 10, y + 7); c.closePath(); c.fill();
  c.fillRect(x - 1, y - 1.5, w + 2, 3);
  // Progress along the bottom edge; a boss's notches sit on it.
  c.globalAlpha = 0.55; c.fillStyle = "#0a1e1a"; c.fillRect(0, L.wh - 6, L.ww, 6); c.globalAlpha = 1;
  c.fillStyle = "#ffd166"; c.fillRect(0, L.wh - 5, L.ww * trip.progress, 4);
  if (trip.isBoss && trip.boss) {
    c.fillStyle = "#0a1e1a";
    for (let i = 1; i < trip.boss.notches; i++) c.fillRect((L.ww * i) / trip.boss.notches - 1, L.wh - 7, 2, 7);
  }
}

function drawRipples(c: CanvasRenderingContext2D, fx: Fx, dt: number) {
  const r = fx.ripples;
  c.lineWidth = 1.2; c.strokeStyle = "#ffffff";
  for (let i = 0; i < RIPPLES; i++) {
    const at = i * 4;
    if (r[at + 2] < 0) continue;
    r[at + 2] += dt;
    const age = r[at + 2], life = 1.2;
    if (age > life) { r[at + 2] = -1; continue; }
    const rx = 4 + age * 28 * r[at + 3];
    c.globalAlpha = 0.7 * (1 - age / life);
    ellipse(c, r[at], r[at + 1], rx, rx * 0.34); c.stroke();
  }
  c.globalAlpha = 1;
}

function drawPops(c: CanvasRenderingContext2D, L: Layers, fx: Fx, dt: number) {
  const p = fx.pops;
  for (let i = 0; i < POPS; i++) {
    const at = i * 4;
    if (p[at + 3] < 0) continue;
    p[at + 3] += dt;
    const age = p[at + 3];
    if (age > 1) { p[at + 3] = -1; continue; }
    const word = L.words[p[at]];
    if (!word) continue;
    c.globalAlpha = age < 0.7 ? 1 : (1 - age) / 0.3;
    const grow = age < 0.12 ? 0.7 + age * 2.5 : 1;
    const x = Math.min(L.ww - word.w * grow / 2 - 4, Math.max(word.w * grow / 2 + 4, p[at + 1]));
    c.drawImage(word.canvas, x - (word.w * grow) / 2, p[at + 2] - age * 26 - (word.h * grow) / 2, word.w * grow, word.h * grow);
  }
  c.globalAlpha = 1;
}

function drawRain(c: CanvasRenderingContext2D, L: Layers, fx: Fx, dt: number) {
  const rain = fx.rain;
  c.strokeStyle = "rgba(230,245,245,0.35)"; c.lineWidth = 1;
  c.beginPath();
  for (let i = 0; i < RAIN; i++) {
    let y = rain[i * 2 + 1] + dt * 1.1;
    if (y > 1) y -= 1;
    rain[i * 2 + 1] = y;
    const x = rain[i * 2] * L.ww, yy = y * L.wh;
    c.moveTo(x, yy); c.lineTo(x - 3, yy + 11);
  }
  c.stroke();
}

/** One frame. `dt` is real seconds since the last frame (0 while paused, so nothing ages). */
export function drawFrame(c: CanvasRenderingContext2D, L: Layers, trip: Trip, fx: Fx, dt: number) {
  const k = L.s * L.dpr, slow = fx.slow;
  fx.clock += dt;
  const clock = fx.clock;
  let ox = 0, oy = 0;
  if (fx.shake > 0) { fx.shake -= dt; if (!slow) { ox = Math.sin(clock * 71) * fx.shake * 10; oy = Math.cos(clock * 53) * fx.shake * 6; } }
  c.setTransform(k, 0, 0, k, ox * k, oy * k);
  c.drawImage(L.bg, 0, 0, L.ww, L.wh);
  const def = trip.def, phase = trip.phase;
  // Waves on the হাওর: long light lines rolling across.
  if (def.waves) {
    c.strokeStyle = "rgba(255,255,255,0.14)"; c.lineWidth = 1.4;
    for (let i = 0; i < 7; i++) {
      const y = L.waterTop + 30 + i * (L.bankY - L.waterTop - 50) / 7, x = ((clock * (slow ? 8 : 18) + i * 77) % (L.ww + 120)) - 60;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 25, y - 3, x + 60, y); c.stroke();
    }
  }
  // The rod tip: pulled back while aiming, whipped forward on the cast, bent towards the fish on the reel.
  tipX = L.tipX; tipY = L.tipY;
  if (phase === P.AIM && trip.charging) { tipX -= 56 * trip.power; tipY -= 40 * trip.power; }
  if (fx.whip > 0) { fx.whip -= dt; tipX += fx.whip * 30; tipY += fx.whip * 10; }
  if (phase === P.REEL) { tipX += 10 * trip.tension; tipY += 34 * trip.tension; }
  if (phase === P.AIM || phase === P.FLY || phase === P.WAIT) drawBubbles(c, L, trip, clock, slow);
  if (phase !== P.OVER) drawPads(c, L, trip);
  drawRipples(c, fx, dt);
  if (phase === P.AIM && trip.charging) drawAim(c, L, trip);
  placeFloat(L, trip);
  fx.floatX = fx0; fx.floatY = fy0;
  const bob = slow ? 0 : def.waves ? Math.sin(clock * 2.1) * 2.4 + Math.sin(clock * 3.3) * 1.2 : Math.sin(clock * 2.4) * 0.8;
  let lineX = 0, lineY = 0, taut = false;
  if (phase === P.REEL) {
    drawFishShadow(c, L, trip, fx, clock, slow);
    lineX = fishX; lineY = fishY; taut = true;
    if (fx.leap > 0) drawLeap(c, L, trip, fx, dt);
    fxCatchX = fishX; fxCatchY = fishY;
  } else if (phase === P.AIM || phase === P.FLY || phase === P.WAIT || phase === P.MISS) {
    lineX = fx0; lineY = fy0 - 12 * fsz + (phase === P.FLY ? 0 : bob);
  }
  if (lineX) {
    const shiver = taut && trip.strain > 0 && !slow ? Math.sin(clock * 90) * 1.4 : 0;
    c.strokeStyle = taut && trip.strain > 0 ? "rgba(255,190,180,0.95)" : "rgba(255,255,255,0.78)"; c.lineWidth = taut ? 1 : 0.8;
    c.beginPath(); c.moveTo(tipX, tipY);
    if (taut) c.quadraticCurveTo((tipX + lineX) / 2 + shiver, (tipY + lineY) / 2 + shiver + (1 - trip.tension) * 26, lineX, lineY);
    else c.quadraticCurveTo((tipX + lineX) / 2, Math.max(tipY, lineY) + 18, lineX, lineY);
    c.stroke();
  }
  if (phase === P.AIM || phase === P.FLY || phase === P.WAIT || phase === P.MISS) drawFloat(c, trip, bob, !def.waves, false);
  if (phase === P.CATCH) drawCatch(c, L, trip, clock, slow);
  drawRod(c, L, phase === P.REEL ? trip.tension : 0);
  if (L.dusk) {
    const focusX = phase === P.REEL ? fishX : fx0, focusY = phase === P.REEL ? fishY : fy0;
    c.drawImage(L.dusk, focusX - L.ww, focusY - L.wh, L.ww * 2, L.wh * 2);
    if (phase === P.AIM || phase === P.FLY || phase === P.WAIT || phase === P.MISS) drawFloat(c, trip, bob, false, true);
  }
  if (L.world === 3 && !slow) drawRain(c, L, fx, dt);
  if (phase === P.REEL) drawMeter(c, L, trip, clock, slow);
  drawPops(c, L, fx, dt);
}
