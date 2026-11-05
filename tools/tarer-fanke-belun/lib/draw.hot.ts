// The per-frame drawing: the pre-rendered layers, the crossings, the crows and their edge pointers, the balloon and the
// juice. Runs every animation frame on a cheap phone, so it allocates nothing: every pool is a typed array made in makeFx.
import { BOSS_CROW, BX, CEIL, FLYER, FLYING, gateY, GROUND, lowWire, POP, POP_TIME, R, READY, topWire, WARN, type Game, type Gate } from "./belun";
import {
  BALLOON_CX, BALLOON_CY, BALLOON_H, BALLOON_W, BF, BITS, CROW_FRAMES, FAR_TOP, MESH_H, MESH_TOP, PALETTES, PF, POINTER_H, POINTER_W,
  PUFFS, RAIN, SF, SHOPS_H, SPARKS, TILE, type Fx, type Layers, type Palette,
} from "./art";

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const BIT_TIME = 0.9, PUFF_TIME = 0.35, SPARK_TIME = 0.4, WORD_TIME = 0.8, SHIVER_TIME = 0.45;
/** The words that may pop over the street. */
export const WORD = { POP: 0, SCRAPE: 1, CAW: 2, KNOT: 3 } as const;
const WORDS = ["ফটাস!", "ঘষা!", "কা!", "জট খুলল!"];
const WORD_COLORS = ["#ffffff", "#ffe08a", "#ffffff", "#ffe08a"];
const WORD_FONT = '800 18px "Display", "Bangla"';
const STRING = "#6b5a4e";
const BIT_COLOR = "#e2364f";

function random(fx: Fx) {
  fx.seed = (fx.seed * 1103515245 + 12345) % 2147483648;
  return fx.seed / 2147483648;
}

export function resetFx(fx: Fx) {
  fx.shake = 0; fx.flash = 0; fx.nextFlash = 3 + random(fx) * 4; fx.word = -1; fx.wordAge = 9; fx.shiver = -1; fx.shiverAge = 9; fx.squash = 0;
  for (let i = 0; i < BITS; i++) fx.bits[i * BF + 4] = 9;
  for (let i = 0; i < PUFFS; i++) fx.puffs[i * PF + 2] = 9;
  for (let i = 0; i < SPARKS; i++) fx.sparks[i * SF + 4] = 9;
}

/** The balloon bursts: rubber bits fly out from (x, y). */
export function burst(fx: Fx, x: number, y: number) {
  for (let i = 0; i < BITS; i++) {
    const at = i * BF, angle = random(fx) * TAU, speed = 50 + random(fx) * 110;
    fx.bits[at] = x; fx.bits[at + 1] = y; fx.bits[at + 2] = Math.cos(angle) * speed; fx.bits[at + 3] = Math.sin(angle) * speed - 30;
    fx.bits[at + 4] = 0; fx.bits[at + 5] = random(fx) * TAU;
  }
}
/** A breath of air under the knot. */
export function puff(fx: Fx, x: number, y: number) {
  fx.squash = 1;
  for (let i = 0; i < PUFFS; i++) {
    const at = i * PF;
    if (fx.puffs[at + 2] < PUFF_TIME) continue;
    fx.puffs[at] = x; fx.puffs[at + 1] = y; fx.puffs[at + 2] = 0;
    return;
  }
}
/** Sparks of rubber off a wire. */
export function spark(fx: Fx, x: number, y: number, up: boolean, gate: number) {
  fx.shiver = gate; fx.shiverAge = 0;
  let made = 0;
  for (let i = 0; i < SPARKS && made < 6; i++) {
    const at = i * SF;
    if (fx.sparks[at + 4] < SPARK_TIME) continue;
    fx.sparks[at] = x; fx.sparks[at + 1] = y + (up ? -R : R);
    fx.sparks[at + 2] = -30 - random(fx) * 60; fx.sparks[at + 3] = (up ? -1 : 1) * (20 + random(fx) * 50);
    fx.sparks[at + 4] = 0;
    made++;
  }
}
export function say(fx: Fx, word: number, x: number, y: number) {
  fx.word = word; fx.wordAge = 0;
  fx.wordX = x < 60 ? 60 : x > 320 ? 320 : x;
  fx.wordY = y < CEIL + 30 ? CEIL + 30 : y > GROUND - 40 ? GROUND - 40 : y;
}

/** Advances the frame's own animations by dt seconds of wall time. */
export function tickFx(fx: Fx, dt: number, night: boolean) {
  if (fx.shake > 0) fx.shake = Math.max(0, fx.shake - dt);
  if (fx.squash > 0) fx.squash = Math.max(0, fx.squash - dt * 6);
  fx.wordAge += dt; fx.shiverAge += dt;
  for (let i = 0; i < BITS; i++) {
    const at = i * BF;
    if (fx.bits[at + 4] >= BIT_TIME) continue;
    fx.bits[at + 4] += dt; fx.bits[at + 3] += 260 * dt;
    fx.bits[at] += fx.bits[at + 2] * dt; fx.bits[at + 1] += fx.bits[at + 3] * dt; fx.bits[at + 5] += 9 * dt;
  }
  for (let i = 0; i < PUFFS; i++) if (fx.puffs[i * PF + 2] < PUFF_TIME) { fx.puffs[i * PF + 2] += dt; fx.puffs[i * PF + 1] += 40 * dt; }
  for (let i = 0; i < SPARKS; i++) {
    const at = i * SF;
    if (fx.sparks[at + 4] >= SPARK_TIME) continue;
    fx.sparks[at + 4] += dt; fx.sparks[at] += fx.sparks[at + 2] * dt; fx.sparks[at + 1] += fx.sparks[at + 3] * dt;
  }
  if (night && !fx.slow) {
    if (fx.flash > 0) fx.flash = Math.max(0, fx.flash - dt);
    fx.nextFlash -= dt;
    if (fx.nextFlash <= 0) { fx.flash = 0.28; fx.nextFlash = 5 + random(fx) * 5; }
  } else fx.flash = 0;
}

function sagLine(c: Ctx, left: number, right: number, a: number, b: number, d: number) {
  c.beginPath();
  c.moveTo(left, a);
  c.quadraticCurveTo((left + right) * 0.5, 2 * b - (a + d) * 0.5, right, d);
  c.stroke();
}

/** One crossing, the way art.drawGate draws it, plus the shiver after a scrape and the perched crows hopping off. */
function gate(c: Ctx, p: Palette, g: Gate, cy: number, sx: number, near: number, shiver: number, time: number, L: Layers) {
  const left = sx - g.w, right = sx + g.w;
  for (let side = -1; side <= 1; side += 2) {
    const x = side < 0 ? left : right, top = lowWire(g, cy, side) - 5;
    c.fillStyle = p.pole; c.fillRect(x - 3.5, top, 7, GROUND - top + 3);
    c.fillStyle = p.poleSide; c.fillRect(x + 1, top, 2.5, GROUND - top + 3);
    c.fillStyle = p.bundle; c.fillRect(x - 4.5, top - 1, 9, 3);
  }
  const la = lowWire(g, cy, -1), lb = lowWire(g, cy, 0), lc = lowWire(g, cy, 1);
  const ta = topWire(g, cy, -1), tb = topWire(g, cy, 0), tc = topWire(g, cy, 1);
  if (p.halo) {
    c.strokeStyle = p.halo; c.lineWidth = 5;
    sagLine(c, left, right, la, lb + shiver, lc);
    sagLine(c, left, right, ta, tb - shiver, tc);
  }
  for (let j = 3; j >= 0; j--) {
    c.strokeStyle = p.wire[j]; c.lineWidth = j ? 1.5 : 2.6;
    const drop = j * 9;
    sagLine(c, left, right, la + drop, lb + drop + j * 3 + (j ? 0 : shiver), lc + drop);
  }
  const twist = (g.perch * 6) | 0;
  for (let j = 6; j >= 0; j--) {
    const lift = j ? j * 7.5 + ((j * 7 + twist * 5) % 7) - 3 : 0, loosen = g.sagTop * 0.08 * j * (j % 2 ? 1.3 : 0.6);
    c.strokeStyle = j === 3 ? p.poleSide : p.wire[(j + twist) % 4];
    c.lineWidth = j ? 1.1 + (j % 3) * 0.4 : 2.6;
    sagLine(c, left, right, ta - lift + loosen, tb - lift - (j ? 0 : shiver), tc - lift + loosen);
  }
  // The thick bundles from the mesh down to the loop's ends, and the clumps where loose cables meet them.
  c.strokeStyle = p.bundle; c.lineWidth = 5; c.lineCap = "round";
  c.beginPath();
  c.moveTo(left + 3, CEIL - 6); c.quadraticCurveTo(left + 6, (ta + CEIL) * 0.5, left + 3, ta - 3);
  c.moveTo(right - 3, CEIL - 6); c.quadraticCurveTo(right - 6, (tc + CEIL) * 0.5, right - 3, tc - 3);
  c.stroke();
  c.lineCap = "butt";
  c.fillStyle = p.bundle;
  const clump = g.knot ? 1.6 : 1;
  c.beginPath(); c.ellipse(left + 5, ta - 9, 5 * clump, 7 * clump, 0.3, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(right - 5, tc - 9, 5 * clump, 7 * clump, -0.3, 0, TAU); c.fill();
  c.strokeStyle = p.thread; c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(left + 3, ta - 60); c.lineTo(right - 3, tc - 14); c.stroke();
  // Crows on the pole wire take off once the balloon is about three-quarters of a second away.
  for (let k = 0; k < g.sitters; k++) {
    const u = k === 0 ? -0.6 + g.perch * (g.sitters === 1 ? 1.2 : 0.3) : 0.2 + g.perch * 0.3;
    const x = sx + u * g.w, y = lowWire(g, cy, u) - 9;
    const gone = (90 - (near + u * g.w)) / 90;
    if (gone <= 0) c.drawImage(L.perched, x - 10, y - 12, 20, 20);
    else if (gone < 1) {
      const cell = L.crows.width / CROW_FRAMES;
      c.drawImage(L.crows, ((((time * 12 + k) | 0) % CROW_FRAMES) * cell), 0, cell, L.crows.height, x + gone * 60 - 10, y - 8 - gone * 120, 20, 20);
    }
  }
}

/** One frame. `time` is the frame's own clock (seconds), for wings, rain and the bob. */
export function drawFrame(c: Ctx, L: Layers, g: Game, fx: Fx, time: number) {
  const p = PALETTES[L.world], px = L.scale * L.dpr, slow = fx.slow;
  let shx = 0, shy = 0;
  if (fx.shake > 0 && !slow) { shx = (random(fx) * 2 - 1) * fx.shake * 14; shy = (random(fx) * 2 - 1) * fx.shake * 10; }
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.drawImage(L.sky, 0, 0);
  c.setTransform(px, 0, 0, px, shx * px, L.oy * L.dpr + shy * px);
  const view = L.viewW;
  if (fx.flash > 0) {
    c.globalAlpha = fx.flash * 2.2 > 0.6 ? 0.6 : fx.flash * 2.2;
    c.fillStyle = "#dfe8ff"; c.fillRect(-10, -L.above - 10, view + 20, GROUND + L.above + 10);
    c.globalAlpha = 1;
  }
  const farX = -(((g.dist * (slow ? 0 : 0.2)) % TILE) * px | 0) / px;
  for (let x = farX; x < view; x += TILE) c.drawImage(L.far, x, FAR_TOP, TILE, GROUND - FAR_TOP);
  const shopX = -(((g.dist * 0.6) % TILE) * px | 0) / px;
  for (let x = shopX; x < view; x += TILE) c.drawImage(L.shops, x, GROUND - SHOPS_H, TILE, SHOPS_H);
  c.fillStyle = p.lane;
  for (let lane = -(g.dist % 60); lane < view; lane += 60) c.fillRect(lane, GROUND + 22, 26, 2.5);
  if (g.dist < 160) c.drawImage(L.stick, 4 - g.dist, GROUND - 160, 60, 170);
  const meshX = -((g.dist % TILE) * px | 0) / px;
  for (let x = meshX; x < view; x += TILE) c.drawImage(L.mesh, x, MESH_TOP, TILE, MESH_H);
  const bx = g.dist + BX;
  for (let i = g.next > 1 ? g.next - 2 : 0; i < g.gates.length; i++) {
    const it = g.gates[i], sx = it.x - g.dist;
    if (sx - it.w > view + 20) break;
    if (sx + it.w < -40) continue;
    const shiver = i === fx.shiver && fx.shiverAge < SHIVER_TIME && !slow ? Math.sin(fx.shiverAge * 50) * 3 * (1 - fx.shiverAge / SHIVER_TIME) : 0;
    gate(c, p, it, gateY(it, g.dist), sx, it.x - bx, shiver, time, L);
  }
  // The wind: streaks slanting the way it pushes, and the night's rain.
  const strength = g.wind < 0 ? -g.wind / 300 : g.wind / 300;
  if (strength > 0.06 && !slow) {
    const slope = g.wind > 0 ? 0.45 : -0.45, speed = 150 + 160 * strength, length = 16 + 22 * strength, span = view + 80, rise = GROUND - 150;
    c.strokeStyle = p.night ? "#c9d4ea" : "#ffffff"; c.globalAlpha = 0.2 + 0.5 * (strength > 1 ? 1 : strength);
    c.lineWidth = 1 + strength; c.lineCap = "round";
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const travel = time * speed + i * 131, x = span - 40 - (travel % span), y = 24 + ((i * 47 + travel * slope) % rise + rise) % rise;
      c.moveTo(x, y); c.lineTo(x + length, y - slope * length);
    }
    c.stroke(); c.lineCap = "butt"; c.globalAlpha = 1;
  }
  if (p.night && !slow) {
    c.strokeStyle = "#9fb4e6"; c.globalAlpha = 0.45; c.lineWidth = 1;
    c.beginPath();
    const tilt = 0.25 + g.wind / 900;
    for (let i = 0; i < RAIN; i++) {
      const x = ((fx.rain[i * 2] - time * 60 - g.dist * 0.3) % (view + 40) + view + 40) % (view + 40) - 20;
      const y = ((fx.rain[i * 2 + 1] + time * 420) % (GROUND + L.above + 40)) - L.above - 20;
      c.moveTo(x, y); c.lineTo(x - 10 * tilt, y + 11);
    }
    c.stroke(); c.globalAlpha = 1;
  }
  // Crows in the air, and the edge pointers for the ones still coming.
  const cw = L.crows.width / CROW_FRAMES, ch = L.crows.height;
  for (let i = 0; i < g.crows.length; i++) {
    const state = g.cState[i], plan = g.crows[i];
    const boss = plan.kind === BOSS_CROW, size = boss ? 1.6 : 1;
    if (state === WARN || (state === FLYING && g.cX[i] - g.dist > view - 6)) {
      const pulse = slow ? 1 : 0.7 + 0.3 * Math.sin(time * 14);
      c.globalAlpha = pulse;
      c.drawImage(boss ? L.pointerBoss : L.pointer, view - POINTER_W - 4, g.cTy[i] - POINTER_H / 2, POINTER_W, POINTER_H);
      c.globalAlpha = 1;
      if (state === WARN) continue;
    }
    if (state < FLYING || state > 4) continue;
    const x = g.cX[i] - g.dist;
    if (x < -30 || x > view + 30) continue;
    const frame = ((time * (boss ? 9 : 13) + i * 1.7) | 0) % CROW_FRAMES;
    c.save();
    c.translate(x, g.cY[i]);
    // A diver comes down nose first.
    if (plan.kind !== FLYER && state === FLYING) c.rotate(-0.35);
    const w = 38 * size;
    c.drawImage(L.crows, frame * cw, 0, cw, ch, -w / 2, -w / 2, w, w);
    c.restore();
  }
  // The balloon, or what's left of it.
  if (g.phase === POP) {
    const t = (g.time - g.popAt) / POP_TIME, fall = t * t * 70;
    c.strokeStyle = STRING; c.lineWidth = 1;
    c.beginPath(); c.moveTo(BX, g.y + 14 + fall); c.quadraticCurveTo(BX - 5, g.y + 28 + fall, BX - 1, g.y + 44 + fall); c.stroke();
  } else if (!(g.phase === 4 && !g.won)) {
    const bob = g.phase === READY && !slow ? Math.sin(time * 2.6) * 4 : 0, y = g.y + bob;
    const tilt = slow ? 0 : g.vy > 220 ? 0.2 : g.vy < -176 ? -0.16 : g.vy / 1100;
    const squash = slow ? 0 : fx.squash * 0.09;
    const sway = slow ? 0 : Math.sin(time * 3) * 2 + (g.vy > 200 ? 4 : g.vy < -200 ? -4 : g.vy / 50);
    c.save();
    c.translate(BX, y);
    c.rotate(tilt);
    c.strokeStyle = p.night ? "#d8c9c0" : STRING; c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, R * 1.2 + 3);
    c.quadraticCurveTo(-6 + sway, R * 1.2 + 14, -2 - sway * 0.6, R * 1.2 + 24);
    c.quadraticCurveTo(3 + sway * 0.5, R * 1.2 + 32, -4 - sway, R * 1.2 + 40);
    c.stroke();
    c.scale(1 + squash, 1 - squash);
    c.drawImage(L.balloon, -BALLOON_CX, -BALLOON_CY, BALLOON_W, BALLOON_H);
    c.restore();
    if (g.phase === READY && g.respawn && !slow) {
      c.strokeStyle = "#ffffff"; c.globalAlpha = 0.5 + 0.3 * Math.sin(time * 6); c.lineWidth = 2;
      c.beginPath(); c.arc(BX, y, R + 7 + Math.sin(time * 6) * 2, 0, TAU); c.stroke();
      c.globalAlpha = 1;
    }
  }
  // Juice: the puffs under the knot, the rubber sparks, the burst.
  c.strokeStyle = "#ffffffcc"; c.lineWidth = 1.5;
  for (let i = 0; i < PUFFS; i++) {
    const at = i * PF, age = fx.puffs[at + 2];
    if (age >= PUFF_TIME || slow) continue;
    const spread = 4 + age * 50, y = fx.puffs[at + 1];
    c.globalAlpha = 1 - age / PUFF_TIME;
    c.beginPath();
    c.moveTo(fx.puffs[at] - spread, y); c.lineTo(fx.puffs[at] - spread - 3, y + 6);
    c.moveTo(fx.puffs[at] + spread, y); c.lineTo(fx.puffs[at] + spread + 3, y + 6);
    c.stroke();
  }
  c.globalAlpha = 1;
  c.fillStyle = "#ffe08a";
  for (let i = 0; i < SPARKS; i++) {
    const at = i * SF, age = fx.sparks[at + 4];
    if (age >= SPARK_TIME) continue;
    c.globalAlpha = 1 - age / SPARK_TIME;
    c.fillRect(fx.sparks[at] - 1.2, fx.sparks[at + 1] - 1.2, 2.4, 2.4);
  }
  c.globalAlpha = 1;
  c.fillStyle = BIT_COLOR;
  for (let i = 0; i < BITS; i++) {
    const at = i * BF, age = fx.bits[at + 4];
    if (age >= BIT_TIME) continue;
    c.globalAlpha = 1 - age / BIT_TIME;
    c.save(); c.translate(fx.bits[at], fx.bits[at + 1]); c.rotate(fx.bits[at + 5]); c.fillRect(-3.5, -1.5, 7, 3); c.restore();
  }
  c.globalAlpha = 1;
  if (fx.word >= 0 && fx.wordAge < WORD_TIME) {
    const t = fx.wordAge / WORD_TIME, rise = slow ? 0 : t * 22;
    c.globalAlpha = t < 0.7 ? 1 : (1 - t) / 0.3;
    c.font = WORD_FONT; c.textAlign = "center"; c.textBaseline = "middle";
    c.lineWidth = 4; c.strokeStyle = "#241d1c"; c.strokeText(WORDS[fx.word], fx.wordX, fx.wordY - 26 - rise);
    c.fillStyle = WORD_COLORS[fx.word]; c.fillText(WORDS[fx.word], fx.wordX, fx.wordY - 26 - rise);
    c.globalAlpha = 1; c.textAlign = "left"; c.textBaseline = "alphabetic";
  }
}
