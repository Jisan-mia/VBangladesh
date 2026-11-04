// The per-frame drawing: the pre-rendered layers, the strings, the kites, the tells and the juice of a cut.
// Runs every animation frame on a cheap phone, so it allocates nothing: every pool is a typed array made in makeFx.
import { controlX, controlY, FALL, FLY, GONE, HI, LANTERNS, LF, LO, RISE, type Game, type Kite, type Rival } from "./kite";
import { BITS, BF, FIREWORKS, FLYERS, FWF, KITE_R, METER, meterX, person, POLE, SF, SNAPS, SPRITE_CY, SPRITE_H, SPRITE_W, TUG, WORD, type Fx, type Layers } from "./sky";

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const DASH = [4, 4];
const SOLID: number[] = [];
const POP_TIME = 1.25;
const TAG_TIME = 0.9;
const SNAP_TIME = 0.5;
const BIT_TIME = 1.1;
const BIT_COLORS = ["#d62828", "#f5bf1f", "#1f8a4c", "#2346a8", "#e64f8a", "#fff1d0"];
const FIRE_COLORS = ["#ffd166", "#ff6b6b", "#7aa2ff", "#06d6a0"];

function random(fx: Fx) {
  fx.seed = (fx.seed * 1103515245 + 12345) % 2147483648;
  return fx.seed / 2147483648;
}

export function resetFx(fx: Fx) {
  fx.shake = 0; fx.jump = 0; fx.popAge = 9; fx.tagAge = 9;
  fx.snaps.fill(0); fx.bits.fill(0); fx.fire.fill(0);
  for (let i = 0; i < SNAPS; i++) fx.snaps[i * SF + 4] = 9;
  for (let i = 0; i < BITS; i++) fx.bits[i * BF + 4] = 9;
  for (let i = 0; i < FIREWORKS; i++) fx.fire[i * FWF + 2] = 9;
}

export function pop(fx: Fx, word: number, x: number, y: number) {
  fx.popWord = word; fx.popAge = 0;
  fx.popX = x < 80 ? 80 : x > 280 ? 280 : x;
  fx.popY = y < 90 ? 90 : y > 300 ? 300 : y;
}
export function tag(fx: Fx, word: number, slot: number) { fx.tagWord = word; fx.tagAge = 0; fx.tagSlot = slot; }

/** The string snaps at the hook: the hand's half whips back towards the roof. */
export function snap(fx: Fx, hx: number, hy: number, x: number, y: number, rival: boolean) {
  for (let i = 0; i < SNAPS; i++) {
    const at = i * SF;
    if (fx.snaps[at + 4] < SNAP_TIME) continue;
    fx.snaps[at] = hx; fx.snaps[at + 1] = hy; fx.snaps[at + 2] = x; fx.snaps[at + 3] = y; fx.snaps[at + 4] = 0; fx.snaps[at + 5] = rival ? 1 : 0;
    return;
  }
}

/** Paper bits burst from the hook. */
export function burst(fx: Fx, x: number, y: number, count: number) {
  let made = 0;
  for (let i = 0; i < BITS && made < count; i++) {
    const at = i * BF;
    if (fx.bits[at + 4] < BIT_TIME) continue;
    const angle = random(fx) * TAU, speed = 40 + random(fx) * 90;
    fx.bits[at] = x; fx.bits[at + 1] = y; fx.bits[at + 2] = Math.cos(angle) * speed; fx.bits[at + 3] = Math.sin(angle) * speed - 40;
    fx.bits[at + 4] = 0; fx.bits[at + 5] = random(fx) * TAU; fx.bits[at + 6] = Math.floor(random(fx) * BIT_COLORS.length);
    made++;
  }
}

/** Advances the frame's own animations by dt seconds of wall time. */
export function tickFx(fx: Fx, dt: number, world: number) {
  fx.clock += dt;
  fx.popAge += dt; fx.tagAge += dt;
  if (fx.shake > 0) fx.shake -= dt;
  if (fx.jump > 0) fx.jump -= dt;
  for (let i = 0; i < SNAPS; i++) fx.snaps[i * SF + 4] += dt;
  for (let i = 0; i < BITS; i++) {
    const at = i * BF, b = fx.bits;
    if (b[at + 4] >= BIT_TIME) continue;
    b[at + 4] += dt; b[at + 3] += 160 * dt; b[at + 2] *= 1 - 1.5 * dt;
    b[at] += b[at + 2] * dt; b[at + 1] += b[at + 3] * dt; b[at + 5] += 7 * dt;
  }
  if (world !== 2 || fx.slow) return;
  for (let i = 0; i < FIREWORKS; i++) fx.fire[i * FWF + 2] += dt;
  fx.fireIn -= dt;
  if (fx.fireIn > 0) return;
  fx.fireIn = 1.4 + random(fx) * 2;
  for (let i = 0; i < FIREWORKS; i++) {
    const at = i * FWF;
    if (fx.fire[at + 2] < 1.2) continue;
    fx.fire[at] = 30 + random(fx) * 300; fx.fire[at + 1] = 70 + random(fx) * 170; fx.fire[at + 2] = 0; fx.fire[at + 3] = Math.floor(random(fx) * FIRE_COLORS.length);
    return;
  }
}

/* ---------- pieces ---------- */

function stroke(c: Ctx, color: string, halo: string, width: number) {
  c.strokeStyle = halo; c.lineWidth = width + 2.2; c.stroke();
  c.strokeStyle = color; c.lineWidth = width; c.stroke();
}

function kiteAngle(k: Kite, fx: Fx, wobble: number, shift: number) {
  if (k.state === FALL) return k.spin;
  let angle = 0.5 * Math.atan2(k.x - k.hx, k.hy - k.y);
  if (!fx.slow) angle += wobble * Math.sin(fx.clock * 2.3 + shift);
  return angle;
}

function sprite(c: Ctx, L: Layers, index: number, x: number, y: number, angle: number, size: number) {
  const s = L.kites[index];
  if (!s) return;
  c.save();
  c.translate(x, y); c.rotate(angle);
  c.drawImage(s, -(SPRITE_W * size) / 2, -SPRITE_CY * size, SPRITE_W * size, SPRITE_H * size);
  c.restore();
}

/** A kite on its string: hand → (hook →) kite while flying, a dangling tail while it falls. */
function kiteOnString(c: Ctx, L: Layers, g: Game, fx: Fx, k: Kite, look: number, size: number, color: string, halo: string, hooked: boolean, wobble: number, shift: number, shiver: number) {
  if (k.state === GONE) return;
  const alpha = k.state === FALL ? Math.min(1, k.timer / 0.5) : 1;
  if (alpha <= 0) return;
  c.globalAlpha = alpha;
  c.beginPath();
  if (k.state === FALL) {
    c.moveTo(k.x, k.y); c.quadraticCurveTo(k.x - k.vx * 0.25, k.y + 20, k.x - k.vx * 0.4 + 5, k.y + 38);
  } else {
    c.moveTo(k.hx, k.hy);
    if (hooked) { c.quadraticCurveTo((k.hx + g.hookX) / 2, (k.hy + g.hookY) / 2 + 6, g.hookX, g.hookY); c.lineTo(k.x, k.y); }
    else c.quadraticCurveTo(controlX(k, g.wind) + shiver, controlY(k) + shiver, k.x, k.y);
  }
  stroke(c, color, halo, 1.7);
  sprite(c, L, look, k.x, k.y, kiteAngle(k, fx, wobble, shift), size);
  c.globalAlpha = 1;
}

function word(c: Ctx, L: Layers, index: number, x: number, y: number, scale: number) {
  const w = L.wordW[index] * scale, h = L.wordH[index] * scale;
  c.drawImage(L.words[index], x - w / 2, y - h / 2, w, h);
}

function rivalLook(r: Rival, you: number, count: number) {
  const look = r.def.look;
  return look === you ? (look + 1) % count : look;
}

/* ---------- the frame ---------- */

export function drawFrame(c: Ctx, L: Layers, g: Game, fx: Fx, youLook: number) {
  const p = L.palette, slow = fx.slow, t = fx.clock;
  c.save();
  c.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
  c.drawImage(L.sky, 0, 0, L.width, L.height);
  const shakeX = fx.shake > 0 && !slow ? Math.sin(t * 93) * 2.4 * (fx.shake / 0.25) : 0;
  const shakeY = fx.shake > 0 && !slow ? Math.cos(t * 71) * 1.6 * (fx.shake / 0.25) : 0;
  c.translate(L.ox + shakeX, L.oy + shakeY);
  c.scale(L.scale, L.scale);

  // Night: fireworks over the far roofs (none in slow mode, which keeps flashes off).
  if (L.world === 2 && !slow) {
    for (let i = 0; i < FIREWORKS; i++) {
      const at = i * FWF, age = fx.fire[at + 2];
      if (age >= 1.2) continue;
      const x = fx.fire[at], y = fx.fire[at + 1], radius = 8 + age * 34;
      c.globalAlpha = Math.max(0, 0.75 - age * 0.62);
      c.fillStyle = FIRE_COLORS[fx.fire[at + 3]];
      for (let ray = 0; ray < 12; ray++) {
        const a = (ray / 12) * TAU;
        c.fillRect(x + Math.cos(a) * radius - 1, y + Math.sin(a) * radius + age * 10 - 1, 2, 2);
      }
    }
    c.globalAlpha = 1;
  }
  // Dusk: fog drifting over the far roofs.
  if (L.fog) {
    const off = slow ? 0 : (t * 5) % 360;
    c.drawImage(L.fog, -off, 300, 360, 60);
    c.drawImage(L.fog, 360 - off, 300, 360, 60);
  }
  // Lanterns rise from behind the houses.
  if (g.def.lanterns) {
    for (let i = 0; i < LANTERNS; i++) {
      const at = i * LF, state = g.lanterns[at + 4];
      if (state === 0) continue;
      const x = g.lanterns[at], y = g.lanterns[at + 1];
      c.globalAlpha = state === 2 ? 0.5 : 1;
      c.drawImage(L.lantern, x - 15, y - 20, 30, 40);
      if (i === g.nearLantern) {
        c.setLineDash(DASH); c.lineWidth = 1.5; c.strokeStyle = "#ffd59a";
        c.beginPath(); c.arc(x, y, 17, 0, TAU); c.stroke(); c.setLineDash(SOLID);
      }
    }
    c.globalAlpha = 1;
  }
  c.restore();
  c.save();
  c.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
  c.drawImage(L.roofs, shakeX, shakeY, L.width, L.height);
  c.translate(L.ox + shakeX, L.oy + shakeY);
  c.scale(L.scale, L.scale);

  // The flyers under each hand: arms up to the নাটাই. Yours jumps when you cut one.
  c.fillStyle = p.mid;
  for (let i = 0; i < 2; i++) {
    const r = g.rivals[i];
    if (r.entry < 0 || r.state === GONE) continue;
    const f = FLYERS[r.roof];
    person(c, f.x, f.y, 1);
    c.strokeStyle = p.mid; c.lineWidth = 2.2; c.lineCap = "round";
    c.beginPath(); c.moveTo(f.x - 3, f.y - 16); c.lineTo(r.hx - 1, r.hy + 1); c.moveTo(f.x + 3, f.y - 16); c.lineTo(r.hx + 1, r.hy + 1); c.stroke();
    c.fillStyle = "#b07a3c"; c.fillRect(r.hx - 3.5, r.hy - 1.5, 7, 4); c.fillStyle = p.mid;
  }
  const lift = fx.jump > 0 && !slow ? Math.abs(Math.sin(fx.jump * 14)) * 5 : 0;
  const me = FLYERS[3], you = g.you;
  c.fillStyle = p.near;
  person(c, me.x, me.y - lift, 1);
  c.strokeStyle = p.near; c.lineWidth = 2.2; c.lineCap = "round";
  c.beginPath(); c.moveTo(me.x - 3, me.y - 16 - lift); c.lineTo(you.hx - 1, you.hy + 1 - (g.pulling ? 3 : 0)); c.moveTo(me.x + 3, me.y - 16 - lift); c.lineTo(you.hx + 1, you.hy + 1 - (g.pulling ? 3 : 0)); c.stroke();
  c.fillStyle = "#b07a3c"; c.fillRect(you.hx - 3.5, you.hy - 1.5 - (g.pulling ? 3 : 0), 7, 4);
  // The wind flag on your roof.
  const lean = Math.max(-1, Math.min(1, g.wind / 14)), flap = slow ? 0 : Math.sin(t * 8) * 2;
  c.fillStyle = "#e0563a";
  c.beginPath(); c.moveTo(POLE.x, POLE.top); c.lineTo(POLE.x + (lean >= 0 ? 1 : -1) * (8 + Math.abs(lean) * 10), POLE.top + 5 + flap); c.lineTo(POLE.x, POLE.top + 10); c.closePath(); c.fill();

  // The rivals first, so your string is always on top.
  const count = L.kites.length - 1;
  for (let i = 0; i < 2; i++) {
    const r = g.rivals[i];
    if (r.entry < 0 || r.state === GONE) continue;
    const hooked = g.hooked === i;
    // The yank's tell: the rival's string glows amber.
    if (r.yankWarn > 0 && hooked) {
      c.globalAlpha = slow ? 0.7 : 0.45 + 0.35 * Math.sin(t * 30);
      c.beginPath(); c.moveTo(r.hx, r.hy); c.quadraticCurveTo((r.hx + g.hookX) / 2, (r.hy + g.hookY) / 2 + 6, g.hookX, g.hookY); c.lineTo(r.x, r.y);
      c.strokeStyle = "#ffb547"; c.lineWidth = 6; c.stroke();
      c.globalAlpha = 1;
    }
    kiteOnString(c, L, g, fx, r, rivalLook(r, youLook, count), r.def.size, p.rival, p.rivalHalo, hooked, 0.08, 1.7 + i, 0);
    if (r.state !== FLY && r.state !== RISE) continue;
    // A champion flies a gold tail.
    if (r.def.notches > 1) {
      c.fillStyle = "#ffd166";
      c.beginPath(); c.moveTo(r.x - 3, r.y + KITE_R * r.def.size); c.lineTo(r.x + 3, r.y + KITE_R * r.def.size); c.lineTo(r.x + (slow ? 0 : Math.sin(t * 6) * 4), r.y + KITE_R * r.def.size + 16); c.closePath(); c.fill();
    }
    // The charge's tell: a red dashed ring round the kite.
    if (r.chargeWarn > 0 || r.attackLeft > 0) {
      c.setLineDash(DASH); c.lineWidth = 2; c.strokeStyle = "#ff5a4a";
      c.beginPath(); c.arc(r.x, r.y, 24 * r.def.size + (slow ? 0 : Math.sin(t * 20) * 1.5), 0, TAU); c.stroke(); c.setLineDash(SOLID);
    }
    // The runner leaves speed lines.
    if (r.fleeing > 0 && !slow) {
      c.strokeStyle = p.rival; c.lineWidth = 1.2; c.globalAlpha = 0.6;
      c.beginPath(); c.moveTo(r.x - r.vx * 0.12, r.y - r.vy * 0.12 - 5); c.lineTo(r.x - r.vx * 0.3, r.y - r.vy * 0.3 - 5);
      c.moveTo(r.x - r.vx * 0.12, r.y - r.vy * 0.12 + 5); c.lineTo(r.x - r.vx * 0.3, r.y - r.vy * 0.3 + 5); c.stroke();
      c.globalAlpha = 1;
    }
  }
  // Yours: brighter and shivering in the red, grey while tangled.
  const tight = you.t > HI && you.state === FLY;
  const shiver = tight && !slow ? Math.sin(t * 70) * 1.6 : 0;
  kiteOnString(c, L, g, fx, you, youLook, 1, g.tangle > 0 ? "#a59db6" : tight ? "#ffffff" : p.you, p.youHalo, g.hooked >= 0, you.t < LO ? 0.14 : 0.05, 0, shiver);

  // The hook: a ring where the strings cross.
  if (g.hooked >= 0) {
    c.beginPath(); c.arc(g.hookX, g.hookY, slow ? 7 : 7 + Math.sin(t * 5) * 1.2, 0, TAU);
    stroke(c, p.cream, p.youHalo, 2);
  }
  // The snapped halves whip back to their roofs.
  for (let i = 0; i < SNAPS; i++) {
    const at = i * SF, age = fx.snaps[at + 4];
    if (age >= SNAP_TIME) continue;
    const u = 1 - age / SNAP_TIME, hx = fx.snaps[at], hy = fx.snaps[at + 1];
    c.globalAlpha = u;
    c.beginPath(); c.moveTo(hx, hy);
    c.lineTo(hx + (fx.snaps[at + 2] - hx) * u * u, hy + (fx.snaps[at + 3] - hy) * u * u + (1 - u) * 14);
    stroke(c, fx.snaps[at + 5] ? p.rival : p.you, p.youHalo, 1.4);
  }
  c.globalAlpha = 1;
  // Paper bits.
  for (let i = 0; i < BITS; i++) {
    const at = i * BF, b = fx.bits, age = b[at + 4];
    if (age >= BIT_TIME) continue;
    c.globalAlpha = Math.min(1, (BIT_TIME - age) * 2.5);
    c.fillStyle = BIT_COLORS[b[at + 6]];
    c.save(); c.translate(b[at], b[at + 1]); c.rotate(b[at + 5]); c.fillRect(-3, -1.5, 6, 3); c.restore();
  }
  c.globalAlpha = 1;
  // A rival's tell, in words, beside its kite.
  if (fx.tagAge < TAG_TIME) {
    const r = g.rivals[fx.tagSlot];
    if (r.state === FLY) {
      c.globalAlpha = fx.tagAge < TAG_TIME - 0.25 ? 1 : (TAG_TIME - fx.tagAge) / 0.25;
      word(c, L, fx.tagWord, Math.max(40, Math.min(320, r.x)), r.y - 30 * r.def.size, 1);
      c.globalAlpha = 1;
    }
  }
  if (g.tangle > 0 && you.state === FLY) word(c, L, WORD.TANGLE, you.x, you.y - 32, 1);
  // ভো-কাট্টা! pops where the strings met, then rises and fades. No flashing.
  if (fx.popAge < POP_TIME) {
    const age = fx.popAge, grow = !slow && age < 0.16 ? 1.4 - (age / 0.16) * 0.4 : 1;
    c.globalAlpha = age < 0.85 ? 1 : 1 - (age - 0.85) / (POP_TIME - 0.85);
    word(c, L, fx.popWord, fx.popX, fx.popY - (slow ? 0 : age * 14), grow);
    c.globalAlpha = 1;
  }

  // The bottom edge: the tension meter, and the tug bar during a প্যাঁচ.
  c.restore();
  c.save();
  c.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
  c.drawImage(L.meter, 0, 0, L.width, L.height);
  c.translate(L.ox, L.oy);
  c.scale(L.scale, L.scale);
  const tension = you.t, nx = meterX(tension);
  const from = tension < LO ? 0 : tension <= HI ? LO : HI, to = tension < LO ? LO : tension <= HI ? HI : 1;
  c.strokeStyle = "#fff"; c.lineWidth = 2;
  c.beginPath(); c.roundRect(METER.x + from * METER.w, METER.y - 1, (to - from) * METER.w, METER.h + 2, 6); c.stroke();
  c.globalAlpha = you.state === FLY ? 1 : 0.45;
  c.fillStyle = p.ink; c.beginPath(); c.roundRect(nx - 4, METER.y - 6, 8, METER.h + 12, 3); c.fill();
  c.fillStyle = "#fff"; c.beginPath(); c.roundRect(nx - 2.5, METER.y - 4.5, 5, METER.h + 9, 2); c.fill();
  c.globalAlpha = 1;
  if (g.hooked >= 0) {
    const x0 = TUG.x, x1 = TUG.x + TUG.w, split = (x0 + x1) / 2 + Math.max(-1, Math.min(1, g.tug)) * TUG.w / 2;
    c.fillStyle = "rgba(10,6,18,0.6)"; c.beginPath(); c.roundRect(x0 - 26, TUG.y - 6, TUG.w + 52, TUG.h + 12, 10); c.fill();
    c.fillStyle = p.you; c.fillRect(x0, TUG.y, split - x0, TUG.h);
    c.fillStyle = p.rival === "#23345f" ? "#7fa3e6" : p.rival; c.fillRect(split, TUG.y, x1 - split, TUG.h);
    c.fillStyle = p.ink; c.fillRect(split - 1.5, TUG.y - 4, 3, TUG.h + 8);
    sprite(c, L, youLook, x0 - 13, TUG.y + 4, 0, 0.5);
    const r = g.rivals[g.hooked];
    sprite(c, L, rivalLook(r, youLook, count), x1 + 13, TUG.y + 4, 0, 0.5);
  }
  c.restore();
}
