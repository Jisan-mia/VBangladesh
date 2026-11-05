// The per-frame drawing: stamps the sprites built in view.ts, strokes the oars and draws the pointers on the river's edges. Runs every
// animation frame on a cheap phone, so it allocates nothing: no literals, closures or string building in a frame.
import { BANK, FRONT_Y, LANE_W, W, laneX } from "./course";
import { DRUM_Y, oarPath } from "./paint";
import {
  BEAT, BLOCKED, GUST, GUST_WARN, HIT, NARROW_WARN, OFF, PATCH, SHOVED, SURGE, SURGE_WARN, beatBefore, pending, type Race,
} from "./rowing";
import { PALETTE } from "./paint";
import {
  NIGHT, POPS, POP_BIG, POP_BLOCK, POP_COLOR, POP_EARLY, POP_GOOD, POP_GUST, POP_LATE, POP_LIFE, POP_PERFECT, POP_SNAG, POP_SQUEEZE, POP_TEXT,
  TILE, type Fx, type Layers, type Sprite,
} from "./view";

/** What happened since the last frame, for sounds the scene itself doesn't make. */
export const F_SNAG = 1, F_GUST = 2, F_GUST_WARN = 4, F_SURGE_WARN = 8, F_SURGE = 16, F_NARROW = 32, F_SHOVED = 64, F_BEAT = 128;
const APPROACH = 1.1;
const FONT_POP = '800 16px "Display", "Bangla"', FONT_FINISH = '800 12px "Display", "Bangla"';
const TWO_PI = Math.PI * 2;

function pop(fx: Fx, kind: number, x: number, y: number) {
  const slot = fx.popNext++ % POPS;
  fx.popT[slot] = fx.clock; fx.popX[slot] = x; fx.popY[slot] = y; fx.popKind[slot] = kind;
}

/** Turns the race's new events into pops, flashes and flags. A caught beat sounds from the tap itself; the drum sounds are scheduled by the page. */
export function absorb(fx: Fx, race: Race) {
  let flags = 0;
  const you = race.boats[0], popY = FRONT_Y + DRUM_Y - 18;
  for (; fx.seen < race.eventCount; fx.seen++) {
    if (race.eventCount - fx.seen > race.events.length) continue;
    const event = race.events[fx.seen % race.events.length];
    const type = event.type;
    if (type === BEAT) { fx.beatAt = fx.clock; flags |= F_BEAT; }
    else if (type === HIT) {
      const perfect = event.n % 2 === 0, big = event.n > 2;
      fx.hitAt = fx.clock; fx.hitSize = perfect ? 2 : 1;
      pop(fx, perfect ? (big ? POP_BIG : POP_PERFECT) : POP_GOOD, Math.min(W - 70, you.x + 44), popY);
    } else if (type === OFF) pop(fx, event.v < 0 ? POP_EARLY : POP_LATE, Math.min(W - 70, you.x + 44), popY);
    else if (type === PATCH && event.n === 0) { fx.shakeAt = fx.clock; pop(fx, POP_SNAG, Math.max(90, Math.min(W - 90, you.x)), FRONT_Y - 22); flags |= F_SNAG; }
    else if (type === BLOCKED) { fx.blockedAt = fx.clock; fx.blockedSide = event.n; pop(fx, POP_BLOCK, Math.max(64, Math.min(W - 64, you.x + event.n * 40)), FRONT_Y + 30); }
    else if (type === GUST) { fx.gustAt = fx.clock; fx.gustDir = event.n; pop(fx, POP_GUST, Math.max(64, Math.min(W - 64, you.x)), FRONT_Y - 22); flags |= F_GUST; }
    else if (type === GUST_WARN) flags |= F_GUST_WARN;
    else if (type === SURGE_WARN) flags |= F_SURGE_WARN;
    else if (type === SURGE) flags |= F_SURGE;
    else if (type === NARROW_WARN) flags |= F_NARROW;
    else if (type === SHOVED) { pop(fx, POP_SQUEEZE, Math.max(64, Math.min(W - 64, you.x)), FRONT_Y - 22); flags |= F_SHOVED; }
  }
  return flags;
}

function stamp(c: CanvasRenderingContext2D, s: Sprite, x: number, y: number) { c.drawImage(s.canvas, x - s.ox, y - s.oy, s.w, s.h); }

/** The stroke phase for your oars: two strokes a beat, the blades catching right on the beat. */
function strokeOf(race: Race, t: number) {
  const index = beatBefore(race, t);
  const from = index >= 0 ? race.beats[index] : race.beats[0] - race.def.gap, to = index + 1 < race.beats.length ? race.beats[index + 1] : from + race.def.gap;
  return ((t - from) / (to - from) * 2) % 1;
}

function ring(c: CanvasRenderingContext2D, x: number, y: number, delta: number, window: number, live: boolean, accent: boolean) {
  c.lineWidth = 1.6; c.strokeStyle = "rgba(255,250,235,0.6)";
  c.beginPath(); c.arc(x, y, 10, 0, TWO_PI); c.stroke();
  if (!live) return;
  if (Math.abs(delta) <= window) {
    c.fillStyle = "rgba(242,194,48,0.5)"; c.beginPath(); c.arc(x, y, 11, 0, TWO_PI); c.fill();
    c.lineWidth = accent ? 4.4 : 3.2; c.strokeStyle = "#ffd166"; c.beginPath(); c.arc(x, y, 11, 0, TWO_PI); c.stroke();
  } else if (delta > 0 && delta < APPROACH) {
    const left = delta / APPROACH;
    c.globalAlpha = 0.35 + 0.65 * (1 - left);
    c.lineWidth = accent ? 3.6 : 2.6; c.strokeStyle = accent ? "#ffd166" : "#fff6dc";
    c.beginPath(); c.arc(x, y, 10 + 56 * left, 0, TWO_PI); c.stroke();
    c.globalAlpha = 1;
  }
}

function pointer(c: CanvasRenderingContext2D, x: number, y: number, up: boolean, fill: string) {
  const dy = up ? 1 : -1;
  c.beginPath(); c.moveTo(x - 7, y + dy * -5); c.lineTo(x + 7, y + dy * -5); c.lineTo(x, y + dy * 6); c.closePath();
  c.lineWidth = 2.2; c.strokeStyle = "rgba(14,24,34,0.8)"; c.stroke();
  c.fillStyle = fill; c.fill();
}

/** Draws one frame. `playing` is false on the calibration screen (the boats wait at the rope). */
export function drawFrame(c: CanvasRenderingContext2D, L: Layers, race: Race, fx: Fx, playing: boolean) {
  const slow = fx.slow, you = race.boats[0], course = race.plan.course, clock = fx.clock;
  c.setTransform(L.ratio, 0, 0, L.ratio, 0, 0);
  c.fillStyle = PALETTE[L.world].grass; c.fillRect(0, 0, L.width, L.height);
  c.save();
  c.translate(L.ox, L.oy); c.scale(L.scale, L.scale);
  const VH = L.viewH;
  c.beginPath(); c.rect(0, 0, W, VH); c.clip();
  if (!slow && clock - fx.shakeAt < 0.3) {
    const fade = 1 - (clock - fx.shakeAt) / 0.3;
    c.translate(Math.sin(clock * 70) * 3 * fade, Math.cos(clock * 55) * 2 * fade);
  }
  // After the finish the camera settles just past the rope, so the others are seen crossing it.
  const camY = race.over ? Math.min(you.y, course + 120) : you.y;
  const base = ((camY + FRONT_Y) % TILE + TILE) % TILE - TILE;
  for (let y = slow ? 0 : base; y < VH; y += TILE) { stamp(c, L.water, 0, y); stamp(c, L.banks, 0, y); }

  const start = FRONT_Y + camY, finish = FRONT_Y - (course - camY);
  if (start > -20 && start < VH + 20) stamp(c, L.rope, 0, start);
  if (finish > -20 && finish < VH + 20) {
    stamp(c, L.rope, 0, finish);
    c.fillStyle = "#fff6e4"; c.beginPath(); c.roundRect(W - BANK - 4, finish - 24, 30, 17, 5); c.fill();
    c.font = FONT_FINISH; c.textAlign = "center"; c.fillStyle = "#7a2e1d"; c.fillText("শেষ", W - BANK + 11, finish - 11);
  }

  // Fast lanes (their streaks run up the river) and the reed beds that close the edge lanes.
  for (let index = 0; index < race.currents.length; index++) {
    const seg = race.currents[index], top = FRONT_Y - (seg.y1 - camY), bottom = FRONT_Y - (seg.y0 - camY);
    if (bottom < -4 || top > VH + 4) continue;
    const from = Math.max(top, -4), to = Math.min(bottom, VH + 4), x = BANK + LANE_W * seg.lane;
    const shift = slow ? 0 : (clock * 70) % 96;
    c.save(); c.beginPath(); c.rect(x, from, LANE_W, to - from); c.clip();
    for (let y = top - 96 + shift; y < to; y += 96) if (y + 96 > from) c.drawImage(L.current.canvas, x, y, LANE_W, 96);
    c.restore();
  }
  for (let index = 0; index < race.narrows.length; index++) {
    const seg = race.narrows[index], top = FRONT_Y - (seg.y1 - camY), bottom = FRONT_Y - (seg.y0 - camY);
    if (bottom < -4 || top > VH + 4) continue;
    const from = Math.max(top, -4), to = Math.min(bottom, VH + 4);
    c.save(); c.beginPath(); c.rect(BANK, from, LANE_W, to - from); c.rect(BANK + LANE_W * 4, from, LANE_W, to - from); c.clip();
    for (let y = top; y < to; y += 96) if (y + 96 > from) { c.drawImage(L.reeds.canvas, BANK, y, LANE_W, 96); c.drawImage(L.reeds.canvas, BANK + LANE_W * 4, y, LANE_W, 96); }
    c.restore();
  }

  // কচুরিপানা: a scattered one drifts apart in two halves.
  for (let index = race.firstPatch; index < race.patches.length; index++) {
    const patch = race.patches[index], y = FRONT_Y - (patch.y + patch.len / 2 - camY);
    if (y < -50) break;
    if (y > VH + 50) continue;
    const art = L.patches[patch.look], height = art.h * patch.len / 52;
    if (patch.hitBy < 0) { c.drawImage(art.canvas, patch.x - art.ox, y - height / 2, art.w, height); continue; }
    const drift = slow ? 0.4 : Math.min(1, (race.t - patch.hitAt) / 0.7);
    c.globalAlpha = 0.75 - 0.3 * drift;
    c.drawImage(art.canvas, patch.x - 6 - 14 * drift - art.ox * 0.7, y - height * 0.35, art.w * 0.7, height * 0.7);
    c.drawImage(art.canvas, patch.x + 6 + 14 * drift - art.ox * 0.7, y - height * 0.35, art.w * 0.7, height * 0.7);
    c.globalAlpha = 1;
  }

  // Wakes behind the moving boats.
  if (!slow) {
    c.lineWidth = 1.5; c.lineCap = "round"; c.strokeStyle = "#e8f6f0";
    for (let index = 0; index < race.boats.length; index++) {
      const it = race.boats[index], y = FRONT_Y - (it.y - camY);
      if (y > VH || y + 170 < 0 || it.speed < 30) continue;
      c.globalAlpha = Math.min(0.45, it.speed / 700);
      c.beginPath();
      c.moveTo(it.x - 7, y + 96); c.lineTo(it.x - 22, y + 156);
      c.moveTo(it.x + 7, y + 96); c.lineTo(it.x + 22, y + 156);
      c.moveTo(it.x - 6, y + 4); c.quadraticCurveTo(it.x, y - 6, it.x + 6, y + 4);
      c.stroke();
    }
    c.globalAlpha = 1;
  }

  // The boats, yours on top. Your oars follow the drum and bite wider on a caught beat; the rivals row to their own count.
  const sweep = playing ? 1 + 0.55 * Math.max(0, 1 - (clock - fx.hitAt) / 0.4) * fx.hitSize / 2 : 1;
  const t = playing ? race.t : clock;
  for (let index = race.boats.length - 1; index >= 0; index--) {
    const it = race.boats[index], y = FRONT_Y - (it.y - camY);
    if (y > VH + 20 || y + 140 < 0) continue;
    let x = it.x, tilt = (laneX(it.lane) - it.x) / LANE_W * 0.16;
    if (index === 0 && !slow) {
      const since = clock - fx.blockedAt;
      if (since < 0.25) x += fx.blockedSide * 4 * Math.sin(Math.PI * since / 0.25);
      if (clock - fx.shakeAt < 0.5) tilt += Math.sin((clock - fx.shakeAt) * 30) * 0.05;
    }
    const phase = index === 0 ? (playing && race.t >= 0 ? strokeOf(race, t) : (t / race.def.gap * 2) % 1) : (t * 1.15 + it.phase) % 1;
    c.save(); c.translate(x, y); if (tilt) c.rotate(tilt);
    c.strokeStyle = "#ead3a2"; c.lineWidth = 1.4; c.lineCap = "round";
    c.beginPath(); oarPath(c, 0, 0, phase < 0 ? 0 : phase, index === 0 ? sweep : 1); c.stroke();
    stamp(c, L.boats[it.boss ? 4 : it.kind], 0, 0);
    c.restore();
  }

  if (L.night && L.mask) {
    const mask = L.mask, y = FRONT_Y;
    c.drawImage(mask.canvas, you.x - NIGHT / 2, y - NIGHT / 2, NIGHT, NIGHT);
    // The mask is a square; keep it from leaving bright corners beyond its edge.
    c.fillStyle = "rgba(4,10,30,0.84)";
    const left = you.x - NIGHT / 2, right = you.x + NIGHT / 2, top = y - NIGHT / 2, bottom = y + NIGHT / 2;
    if (left > 0) c.fillRect(0, 0, left, VH);
    if (right < W) c.fillRect(right, 0, W - right, VH);
    if (top > 0) c.fillRect(0, 0, W, top);
    if (bottom < VH) c.fillRect(0, bottom, W, VH - bottom);
  }

  // The ring on your boat's drum: it closes in on the ঢোল and glows gold on the beat.
  const ringX = you.x, ringY = FRONT_Y + DRUM_Y;
  const window = race.window * race.scale;
  if (playing) {
    const index = race.over || race.t < 0 ? -1 : pending(race);
    ring(c, ringX, ringY, index >= 0 ? (race.beats[index] - race.t) / race.scale : Infinity, race.window, index >= 0, index >= 0 && race.accents[index] === 1);
  }
  const burst = clock - fx.hitAt;
  if (burst < 0.4) {
    c.globalAlpha = 1 - burst / 0.4;
    c.lineWidth = 3; c.strokeStyle = "#ffd166";
    c.beginPath(); c.arc(ringX, ringY, 11 + (slow ? 8 : 34 * burst / 0.4), 0, TWO_PI); c.stroke();
    c.globalAlpha = 1;
  }
  void window;

  // Pops.
  c.font = FONT_POP; c.textAlign = "center"; c.lineJoin = "round";
  for (let slot = 0; slot < POPS; slot++) {
    const age = clock - fx.popT[slot];
    if (age < 0 || age > POP_LIFE) continue;
    const kind = fx.popKind[slot], y = fx.popY[slot] - (slow ? 0 : age * 26);
    c.globalAlpha = Math.min(1, 2.4 * (1 - age / POP_LIFE));
    c.lineWidth = 4; c.strokeStyle = "rgba(20,30,34,0.75)";
    c.strokeText(POP_TEXT[kind], fx.popX[slot], y);
    c.fillStyle = POP_COLOR[kind]; c.fillText(POP_TEXT[kind], fx.popX[slot], y);
  }
  c.globalAlpha = 1;

  // Pointers on the edge: rivals off the top or bottom of the river, and in the dark the lanes of rows you can't see yet.
  if (playing) {
    for (let index = 1; index < race.boats.length; index++) {
      const it = race.boats[index], y = FRONT_Y - (it.y - camY);
      const color = it.boss ? "#e2b53b" : index === 1 ? "#d9503f" : index === 2 ? "#4fa365" : "#e9b73a";
      if (y < -6 && !race.over) pointer(c, Math.max(BANK + 10, Math.min(W - BANK - 10, it.x)), 12, false, color);
      else if (y > VH + 6) pointer(c, Math.max(BANK + 10, Math.min(W - BANK - 10, it.x)), VH - 12, true, color);
      else if (L.night && y < FRONT_Y - 150 && y > -6) pointer(c, Math.max(BANK + 10, Math.min(W - BANK - 10, it.x)), 12, false, color);
    }
    if (L.night) {
      c.fillStyle = "#ff8f7a";
      for (let index = race.firstPatch; index < race.patches.length; index++) {
        const patch = race.patches[index], distance = patch.y - you.y;
        if (distance > FRONT_Y + 220) break;
        if (distance < 150 || patch.hitBy >= 0) continue;
        c.globalAlpha = distance < FRONT_Y ? 1 : 0.55;
        c.beginPath(); c.moveTo(patch.x - 8, 20); c.lineTo(patch.x + 8, 20); c.lineTo(patch.x, 32); c.closePath(); c.fill();
      }
      c.globalAlpha = 1;
    }
  }
  c.restore();
}

/** What the page shows in the corners and on the edges, worked out once a frame and written into this struct. */
export type Hud = {
  /** Time on the clock in tenths (0 before the start). */
  tenths: number; place: number; streak: number; started: boolean;
  /** Each boat's progress along the course in half percents (0..200). */
  along: Uint8Array;
  /** The edge to light: "", patch, surge, gust-left, gust-right, narrow, faster, behind, last. */
  edge: string;
  /** Count-in digit (3, 2, 1, or 0 for none). */
  count: number;
  /** The champion's pull has been flagged or is on. */
  surging: boolean;
};

/** Fills `hud` from the race. Allocation-free. */
export function readHud(race: Race, hud: Hud) {
  const you = race.boats[0], course = race.plan.course;
  hud.started = race.t >= 0;
  hud.tenths = race.over ? race.tenths : race.t > 0 ? Math.floor(race.t * 10) : 0;
  let place = 1;
  if (race.over) place = race.rank;
  else for (let index = 1; index < race.boats.length; index++) if (race.boats[index].done >= 0 || race.boats[index].y > you.y) place++;
  hud.place = place;
  hud.streak = race.streak;
  for (let index = 0; index < race.boats.length; index++) hud.along[index] = Math.round(Math.min(1, Math.max(0, race.boats[index].y / course)) * 200);
  hud.count = race.t >= 0 || race.old ? 0 : race.t < -1.2 ? 3 : race.t < -0.6 ? 2 : 1;
  hud.surging = race.boss >= 0 && (race.surgeWarned || race.boats[race.boss].surge > 0);

  let edge = "";
  if (race.over || race.t < 0) edge = "";
  else if (race.surgeWarned || (race.boss >= 0 && race.boats[race.boss].surge > 0)) edge = "surge";
  else {
    let ahead = false;
    for (let index = race.firstPatch; index < race.patches.length; index++) {
      const patch = race.patches[index], distance = patch.y - you.y;
      if (distance > you.speed + 30) break;
      if (distance > 0 && patch.hitBy < 0 && patch.lane === you.lane) { ahead = true; break; }
    }
    if (ahead) edge = "patch";
    else if (race.gustNext < race.gusts.length && race.gustWarned === race.gustNext) edge = race.gusts[race.gustNext].dir > 0 ? "gust-left" : "gust-right";
    else if (you.nar < race.narrows.length && race.narrowWarned === you.nar) edge = "narrow";
    else if (race.def.quicken && race.tick >= race.def.quicken[0] - 3 && race.tick < race.def.quicken[0]) edge = "faster";
    else {
      let near = false;
      for (let index = 1; index < race.boats.length; index++) {
        const it = race.boats[index];
        if (it.done < 0 && it.y < you.y && you.y - it.y < 150 && it.speed > you.speed - 5) near = true;
      }
      if (near) edge = "behind";
      else if (place === 4 && race.lastFor > 2) edge = "last";
    }
  }
  hud.edge = edge;
}
