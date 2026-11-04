// The per-frame drawing: copy the pre-painted sky and far strip, then the ground and its zones, pegs, the fielders with their
// dashed catch rings, the batter and the ডাং, the yellow band, the কাঠি with its trail and count, dust, rain, the kids on the
// side, the গামছা, edge pointers for what lies beyond the screen, and gust chevrons. Allocation-free: no literals, closures
// or string building in here; everything comes from the View and the Round.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import { LOOKS, PAL, drawBall, drawBatter, drawGamchha, drawKid } from "./art";
import { MAX_HIT } from "./levels";
import {
  fielderX, kathiAt, popY, reachAt, windAt,
  AIM, BALL_X, DT, FLY, GOLD, HOLE_X, K_CAUGHT, K_FALL, K_WHIFF, POP, REST, RING_T, SWEET,
  type Round,
} from "./round";
import { PALETTES, SAND, SAND_DARK, WATER, WATER_LIGHT, WET, WET_LIGHT } from "./scene";
import { DUST, RAIN, type View } from "./view";

const HOME = -1.6, BATTER_X = -0.55;
const AIM_A = 1.05, BACK_A = 3.5, FOLLOW_A = -1.05;
const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
const LABELS = Array.from({ length: MAX_HIT + 1 }, (_, n) => digits.format(n) + " ডাং");
const NUMS = Array.from({ length: MAX_HIT + 2 }, (_, n) => digits.format(n));
const labelWidth = new Float32Array(MAX_HIT + 1);
const PEG_FONT = "700 12px " + DISPLAY_FONT, LABEL_FONT = "800 16px " + DISPLAY_FONT, EDGE_FONT = "800 11px " + DISPLAY_FONT;
const DASH = [5, 5], NO_DASH: number[] = [];
const trail = { x: 0, y: 0 };
const GOLD_C = "#ffd23f", RING_C = "#ffffffc0", LONG_RING = "#ffb4a2", CAPTAIN = "#7a4fa3";

const clamp01 = (t: number) => t < 0 ? 0 : t > 1 ? 1 : t;
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

/** Spreads the rain over the canvas once a size is known. */
export function seedRain(v: View) {
  for (let i = 0; i < RAIN; i++) { v.rx[i] = (i * 53) % Math.max(1, v.width); v.ry[i] = (i * 97) % Math.max(1, v.height); }
}

/** Dust, sand or a splash where the কাঠি lands (never in ধীরে খেলো). */
export function spawnDust(v: View, x: number, color: string) {
  if (v.calm) return;
  v.dustColor = color;
  for (let i = 0; i < DUST; i++) {
    const a = Math.PI * (0.15 + 0.7 * (i / (DUST - 1)));
    v.dx[i] = x; v.dy[i] = 0.05;
    v.dvx[i] = Math.cos(a) * (1.2 + (i % 3) * 0.5); v.dvy[i] = Math.sin(a) * (1.6 + (i % 4) * 0.4);
    v.dl[i] = 0.5 + (i % 5) * 0.08;
  }
}

/** Moves the camera, the কাঠি, the particles and the juice timers (once per frame; `dt` is 0 while the round is stopped). */
export function moveView(v: View, r: Round, dt: number) {
  v.clock += dt;
  if (v.flash > 0) v.flash = Math.max(0, v.flash - dt * 3);
  if (v.shake > 0) v.shake = Math.max(0, v.shake - dt * 4);
  if (v.swing >= 0) v.swing += dt;
  if (v.moodTime > 0) v.moodTime -= dt;
  if (v.moodTime <= 0) v.mood = r.phase === POP || r.phase === FLY ? 1 : 0;
  kathiAt(r, v.ball);
  if (r.phase === POP) v.spin += dt * 13;
  else if (r.phase === FLY && r.hold === 0 && v.ball.y > 0) v.spin += dt * 16;
  v.late = r.phase === POP && !r.swung && r.t > 0.3 && popY(r, r.t) < SWEET - r.band;

  const flying = r.phase === FLY || (r.phase === REST && r.kinds[r.hit] !== K_FALL && r.kinds[r.hit] !== K_WHIFF);
  const k = v.unit * v.zoom;
  const high = r.phase === FLY && v.ball.y > 0 ? (v.ground - 46) / (v.ball.y * v.unit) : 1;
  const zoomTo = high < 0.45 ? 0.45 : high > 1 ? 1 : high;
  v.zoom += (zoomTo - v.zoom) * (1 - Math.exp(-dt * (zoomTo < v.zoom ? 5 : 2)));
  const visible = v.width / k;
  // A side-scroller camera: it follows the কাঠি once it passes the middle, holds where it stopped, then eases home.
  if (flying) { const want = v.ball.x - visible * 0.45; if (want > v.camX) v.camX = want; if (v.camX < HOME) v.camX = HOME; }
  else v.camX += (HOME - v.camX) * (1 - Math.exp(-dt * 4));

  for (let i = 0; i < DUST; i++) {
    if (v.dl[i] <= 0) continue;
    v.dx[i] += v.dvx[i] * dt; v.dy[i] += v.dvy[i] * dt; v.dvy[i] -= 9 * dt; v.dl[i] -= dt;
  }
  if (v.world === 2 && !v.calm) {
    for (let i = 0; i < RAIN; i++) {
      v.ry[i] += 420 * dt; v.rx[i] -= 60 * dt;
      if (v.ry[i] > v.height) { v.ry[i] -= v.height + 20; v.rx[i] = (v.rx[i] + 137) % Math.max(1, v.width + 40); }
      if (v.rx[i] < -10) v.rx[i] += v.width + 20;
    }
  }
}

function bubble(c: CanvasRenderingContext2D, x: number, y: number, width: number, text: string, color: string) {
  c.fillStyle = "#fffdf6"; c.strokeStyle = PAL.ink; c.lineWidth = 2;
  c.beginPath(); c.roundRect(x - width / 2, y - 14, width, 26, 9); c.fill(); c.stroke();
  c.fillStyle = color; c.textAlign = "center"; c.textBaseline = "alphabetic"; c.fillText(text, x, y + 5);
}

/** The batter's ডাং angle: resting on the কাঠি, the flick, raised, then the swing through. */
function batAngle(v: View, r: Round) {
  if (v.swing >= 0) return BACK_A - (BACK_A - FOLLOW_A) * easeOut(clamp01(v.swing / 0.16));
  if (r.phase === AIM) return AIM_A;
  if (r.phase === POP) return r.t < 0.08 ? AIM_A - r.t * 5 : AIM_A + (BACK_A - AIM_A) * clamp01((r.t - 0.08) / 0.22);
  return r.kinds[r.hit] === K_FALL ? BACK_A : FOLLOW_A;
}

export function drawField(v: View, r: Round) {
  const c = v.context;
  if (!c) return;
  const p = PALETTES[v.world < 0 ? 0 : v.world], w = v.width, h = v.height, ground = v.ground, cam = v.camX, k = v.unit * v.zoom;
  c.save();
  if (v.shake > 0 && !v.calm) c.translate(Math.sin(v.clock * 83) * 3 * v.shake, Math.cos(v.clock * 67) * 1.5 * v.shake);
  if (v.sky) c.drawImage(v.sky, 0, 0, w, ground);
  if (v.far) {
    const tile = v.farWidth, offset = ((((cam - HOME) * v.unit * 0.25) % tile) + tile) % tile;
    c.drawImage(v.far, -offset, 0, tile, ground);
    c.drawImage(v.far, tile - offset, 0, tile, ground);
  }

  // ---- the ground, its zones and the pegs ----
  c.fillStyle = p.grass; c.fillRect(-6, ground, w + 12, h - ground + 6);
  c.fillStyle = p.grassLight;
  for (let strip = Math.floor(cam / 2); (strip * 2 - cam) * k < w; strip++) if ((strip & 1) === 0) c.fillRect((strip * 2 - cam) * k, ground, 2 * k, h - ground);
  if (r.sandTo > 0) {
    const a = (r.sandFrom - cam) * k, b = (r.sandTo - cam) * k;
    if (b > -10 && a < w + 10) {
      c.fillStyle = SAND; c.fillRect(a, ground - 2, b - a, h - ground + 2);
      c.fillStyle = SAND_DARK;
      for (let x = Math.ceil(r.sandFrom); x < r.sandTo; x++) c.fillRect((x - cam) * k, ground + 6 + (x % 3) * 5, 0.25 * k, 2);
    }
  }
  if (r.wetTo > 0) {
    const a = (r.wetFrom - cam) * k, b = (r.wetTo - cam) * k;
    if (b > -10 && a < w + 10) {
      c.fillStyle = WET; c.fillRect(a, ground, b - a, Math.min(14, h - ground));
      c.fillStyle = WET_LIGHT;
      for (let x = Math.ceil(r.wetFrom); x < r.wetTo; x += 2) c.fillRect((x - cam) * k, ground + 3, 0.8 * k, 2);
    }
  }
  c.fillStyle = p.grassDark; c.fillRect(-6, ground - 1, w + 12, 3);
  if (r.pondTo > 0) {
    const a = (r.pondFrom - cam) * k, b = (r.pondTo - cam) * k;
    if (b > -20 && a < w + 20) {
      const cx = (a + b) / 2, rx = (b - a) / 2;
      c.fillStyle = PAL.mud; c.beginPath(); c.ellipse(cx, ground + 0.1 * k, rx + 0.12 * k, 0.34 * k, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = WATER; c.beginPath(); c.ellipse(cx, ground + 0.1 * k, rx, 0.26 * k, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = WATER_LIGHT; c.beginPath(); c.ellipse(cx - rx * 0.2, ground + 0.04 * k, rx * 0.45, 0.07 * k, 0, 0, Math.PI * 2); c.fill();
    }
  }
  c.font = PEG_FONT; c.textAlign = "center"; c.textBaseline = "alphabetic";
  for (let peg = 5; peg <= MAX_HIT; peg += 5) {
    const x = (peg - cam) * k;
    if (x < -20 || x > w + 20) continue;
    c.fillStyle = p.peg; c.fillRect(x - 1.5, ground - 0.3 * k, 3, 0.3 * k + 3);
    c.fillStyle = "#ffffffd8"; c.fillText(NUMS[peg], x, ground + 17);
  }
  c.fillStyle = "#3a2a1a";
  c.beginPath(); c.ellipse((HOLE_X - cam) * k, ground + 1, 0.2 * k, 0.06 * k, 0, 0, Math.PI * 2); c.fill();

  // Earlier hits stay marked with a small stake in their colour.
  for (let i = 0; i < r.hit; i++) {
    if (r.dists[i] <= 0) continue;
    const x = (r.rests[i] - cam) * k;
    if (x < -30 || x > w + 30) continue;
    c.fillStyle = PAL.stickDark; c.fillRect(x - 1.5, ground - 0.55 * k, 3, 0.55 * k);
    c.fillStyle = LOOKS[i].shirt; c.fillRect(x + 1.5, ground - 0.55 * k, 0.32 * k, 0.2 * k);
  }

  // ---- fielders and their catch rings ----
  const flightT = r.phase === FLY ? r.pi * DT : 0;
  for (let i = 0; i < r.fn; i++) {
    let x = fielderX(r, i, r.clock), pose = 3;
    const catcher = r.catcher === i && r.catchAt >= 0 && (r.phase === FLY || (r.phase === REST && r.kinds[r.hit] === K_CAUGHT));
    if (catcher) {
      const u = r.phase === FLY ? clamp01((flightT - r.def.react) / Math.max(0.01, r.catchAt * DT - r.def.react)) : 1;
      x = x + (r.restX + 0.3 - x) * u;
      pose = u < 1 ? 5 : 6;
    } else if (i === r.cap && Math.abs(x - r.capTo) > 0.05) pose = 5;
    else if (r.famp[i]) pose = 5;
    const sx = (x - cam) * k, big = i === r.longArm ? 1.25 : 1;
    if (sx < -2 * k || sx > w + 2 * k) continue;
    if (r.phase === AIM || r.phase === POP) {
      const reach = reachAt(r, i, RING_T) * k;
      c.setLineDash(DASH); c.lineWidth = 2; c.strokeStyle = i === r.longArm ? LONG_RING : RING_C;
      c.beginPath(); c.ellipse(sx, ground + 0.05 * k, reach, 0.16 * k + 2, 0, 0, Math.PI * 2); c.stroke();
      c.setLineDash(NO_DASH);
    }
    const look = i === r.cap ? 4 : 3 + (i % 2);
    drawKid(c, sx, ground, k * big, LOOKS[look], pose === 5 ? "run" : pose === 6 ? "catch" : "ready", v.clock * (r.famp[i] ? 0.5 : 1) + i, -1);
    if (i === r.cap) { c.fillStyle = CAPTAIN; c.fillRect(sx - 0.22 * k, ground - 1.62 * k, 0.44 * k, 0.08 * k); }
  }

  // ---- the batter, the ডাং and the band ----
  const bx = (BATTER_X - cam) * k;
  if (bx > -2 * k) {
    if (r.phase === AIM || (r.phase === POP && !r.swung)) {
      const top = ground - (SWEET + r.band) * k, mid = ground - SWEET * k, height = 2 * r.band * k;
      const inBand = r.phase === POP && r.t > 0.3 && Math.abs(v.ball.y - SWEET) <= r.band;
      const left = (-0.25 - cam) * k, width = 1.15 * k;
      c.fillStyle = v.late ? "#ff8a6a66" : inBand ? "#ffe08acc" : "#ffe08a80";
      c.beginPath(); c.roundRect(left, top, width, height / 2, 6); c.fill();
      c.fillStyle = v.late ? "#e5383b55" : inBand ? "#ffc145cc" : "#ffc14580";
      c.beginPath(); c.roundRect(left, mid, width, height / 2, 6); c.fill();
      c.strokeStyle = v.late ? "#c62828" : inBand ? "#b86e00" : "#ffffffd0"; c.lineWidth = 2;
      c.beginPath(); c.roundRect(left, top, width, height, 6); c.stroke();
      c.fillStyle = GOLD_C; c.fillRect(left, mid - 1.5, width, 3);
    }
    drawBatter(c, bx, ground, k, batAngle(v, r));
  }

  // ---- the arc, the কাঠি, its shadow and its count ----
  const kind = r.kinds[r.hit], flew = (r.phase === FLY || r.phase === REST) && kind !== K_FALL && kind !== K_WHIFF && r.pn > 0;
  if (flew) {
    const until = r.phase === FLY ? r.pi : r.pn - 1;
    c.fillStyle = "#ffffffd0";
    for (let i = 4; i < until; i += 4) { c.beginPath(); c.arc((r.px[i] - cam) * k, ground - r.py[i] * k, 2.2, 0, Math.PI * 2); c.fill(); }
  }
  const ballX = (v.ball.x - cam) * k;
  if (v.ball.y >= 0) {
    c.fillStyle = "#00000030";
    c.beginPath(); c.ellipse(ballX, ground + 2, Math.max(3, 0.22 * k - v.ball.y * 1.5), 2.5, 0, 0, Math.PI * 2); c.fill();
    const caughtNow = r.phase === REST && kind === K_CAUGHT;
    drawBall(c, caughtNow ? ((r.restX + 0.3 - cam) * k) : ballX, ground - (caughtNow ? 1.0 : v.ball.y) * k - (v.ball.y < 0.06 ? 0.04 * k : 0), k, v.spin);
  } else if (r.phase === REST && !v.calm) {
    trail.x = ballX; trail.y = clamp01(r.t / 1.4);
    c.strokeStyle = "#e6f6ff"; c.lineWidth = 2; c.globalAlpha = 1 - trail.y;
    c.beginPath(); c.ellipse(trail.x, ground + 0.08 * k, (0.2 + r.t * 0.9) * k, (0.2 + r.t * 0.9) * k * 0.25, 0, 0, Math.PI * 2); c.stroke();
    c.globalAlpha = 1;
  }
  for (let i = 0; i < DUST; i++) {
    if (v.dl[i] <= 0) continue;
    c.globalAlpha = clamp01(v.dl[i] * 2);
    c.fillStyle = v.dustColor;
    c.beginPath(); c.arc((v.dx[i] - cam) * k, ground - v.dy[i] * k, 2.5, 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
  if (v.flash > 0 && !v.calm) {
    const fx = (BALL_X - cam) * k, fy = ground - r.hitY * k, radius = (1 - v.flash) * 1.4 * k + 6;
    c.strokeStyle = GOLD_C; c.lineWidth = 4 * v.flash + 1; c.globalAlpha = v.flash;
    c.beginPath(); c.arc(fx, fy, radius, 0, Math.PI * 2); c.stroke();
    c.globalAlpha = 1;
  }
  // The count rides on the কাঠি while it flies, and stays where it stopped.
  let count = -1;
  if (r.phase === FLY && v.ball.x > 0.5 && (r.catchAt < 0 || r.pi < r.catchAt)) count = Math.min(MAX_HIT, Math.floor(v.ball.x));
  else if (r.phase === REST && kind !== K_CAUGHT && kind !== K_FALL && kind !== K_WHIFF) count = r.dists[r.hit];
  v.shownDist = count;
  if (count >= 0) {
    c.font = LABEL_FONT;
    if (!labelWidth[count]) labelWidth[count] = c.measureText(LABELS[count]).width + 20;
    const atX = r.phase === REST ? (r.restX - cam) * k : ballX;
    const lx = atX < labelWidth[count] / 2 + 4 ? labelWidth[count] / 2 + 4 : atX > w - labelWidth[count] / 2 - 4 ? w - labelWidth[count] / 2 - 4 : atX;
    const ly = r.phase === REST ? ground - 0.8 * k - 20 : Math.max(22, ground - v.ball.y * k - 0.5 * k - 16);
    if (r.phase === REST) { c.fillStyle = "#b4372a"; c.fillRect(atX - 1.5, ground - 0.8 * k, 3, 0.8 * k); }
    bubble(c, lx, ly, labelWidth[count], LABELS[count], r.phase === REST ? "#b4372a" : PAL.ink);
  }
  c.restore();

  // ---- screen space: rain, the গামছা, the kids, edge pointers, gust chevrons ----
  if (v.world === 2 && !v.calm) {
    c.strokeStyle = "#ffffff55"; c.lineWidth = 1.2;
    c.beginPath();
    for (let i = 0; i < RAIN; i++) { c.moveTo(v.rx[i], v.ry[i]); c.lineTo(v.rx[i] - 3, v.ry[i] + 11); }
    c.stroke();
  }
  if (r.def.wind > 0 || r.def.gusts > 0) drawGamchha(c, 18, 10, r.phase === FLY ? windAt(r, r.pi * DT) : r.winds[r.hit], v.clock);
  const mood = v.mood;
  for (let i = 0; i < 3; i++) drawKid(c, 18 + i * 26, h - 4, 21, LOOKS[i], mood === 2 ? "cheer" : mood === 3 ? "groan" : mood === 1 ? "watch" : "idle", v.clock + i * 0.37, 1);

  // What lies past the right edge, with its distance: fielders, the pond, the sand.
  if (r.phase === AIM || r.phase === POP) {
    c.font = EDGE_FONT; c.textAlign = "right"; c.textBaseline = "middle";
    let row = 0;
    for (let i = 0; i < r.fn; i++) {
      const fx = fielderX(r, i, r.clock);
      if ((fx - cam) * k < w - 6) continue;
      edgeMark(c, w, ground - 1.5 * k - row * 22, i === r.longArm ? LONG_RING : LOOKS[i === r.cap ? 4 : 3 + (i % 2)].shirt, NUMS[Math.min(MAX_HIT + 1, Math.round(fx))]);
      row++;
    }
    if (r.pondTo > 0 && (r.pondFrom - cam) * k > w - 6) { edgeMark(c, w, ground - 0.35 * k, WATER, NUMS[Math.min(MAX_HIT + 1, Math.round(r.pondFrom))]); }
    if (r.sandTo > 0 && (r.sandFrom - cam) * k > w - 6) { edgeMark(c, w, ground - 0.35 * k - (r.pondTo > 0 ? 22 : 0), SAND_DARK, NUMS[Math.min(MAX_HIT + 1, Math.round(r.sandFrom))]); }
  }
  // A gust: chevrons on the edge it blows towards, before the flick and while it blows.
  const gustAt = r.gustAt[r.hit];
  const blowing = r.phase === FLY && gustAt >= 0 && windAt(r, r.pi * DT) !== r.winds[r.hit];
  if (gustAt >= 0 && (r.phase === AIM || r.phase === POP || blowing)) {
    const dir = r.gustPow[r.hit] > 0 ? 1 : -1, x0 = dir > 0 ? w - 30 : 30, wave = v.calm ? 0 : (v.clock * 3) % 1;
    c.strokeStyle = blowing ? "#ffffff" : "#ffffffb0"; c.lineWidth = 4; c.lineCap = "round";
    for (let i = 0; i < 3; i++) {
      const x = x0 + dir * (i * 9 - 9 + wave * 6), y = h * 0.42;
      c.beginPath(); c.moveTo(x - dir * 6, y - 10); c.lineTo(x + dir * 2, y); c.lineTo(x - dir * 6, y + 10); c.stroke();
    }
  }
}

function edgeMark(c: CanvasRenderingContext2D, w: number, y: number, color: string, label: string) {
  c.fillStyle = "#1b2238cc";
  c.beginPath(); c.roundRect(w - 46, y - 10, 40, 20, 8); c.fill();
  c.fillStyle = color;
  c.beginPath(); c.moveTo(w - 2, y); c.lineTo(w - 9, y - 7); c.lineTo(w - 9, y + 7); c.closePath(); c.fill();
  c.beginPath(); c.arc(w - 37, y, 5, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#ffffff"; c.fillText(label, w - 12, y + 1);
}

/** The gold ring and a little shake for a strong strike (never in ধীরে খেলো). */
export function strikeJuice(v: View, r: Round) {
  v.swing = 0;
  if (r.grade === GOLD && !v.calm) { v.flash = 1; v.shake = 1; }
}
