// One frame of the lane: the cached place, the clothesline, the cousins, the seven pieces, the ball, the arm, the aim dots,
// the dust and the shout. Plus the per-frame upkeep of the view (puffs, shiver, shake, the sweeping aim).
// Runs every animation frame: no object or array literals, closures, `new` or string building here (npm run lint:games).
import { meterPower, shownDots, sweepAngle } from "./aim";
import type { Round } from "./game";
import { guardLift, guardTop, trace } from "./physics.hot";
import type { Hand } from "./save";
import { DOT_GAP, MAX_DOTS, type View } from "./view";
import { BALL_R, GROUND, H, HAND_X, HAND_Y, STANDING, STONES, W } from "./world";

const TAU = Math.PI * 2;
const DOT_FILL = "#ffffff";
const DOT_EDGE = "rgba(43,29,20,0.6)";
const PUFF = "#e9dcc4";
const RING_BACK = "rgba(255,255,255,0.85)";
const RING_FULL = "#f2a900";
const ROPE = "#5a4636";
const GAMCHA = "#c8322b";
const GAMCHA_CHECK = "rgba(255,255,255,0.5)";
const SHOUT_FONT = '800 22px "Display", "Bangla", sans-serif';
const SHOUT = "সাতটাই!";
const SHOUT_FILL = "#fff3d6";
const SHOUT_EDGE = "#2b1d14";
const BACK_STEPS = 18;

/** Per frame: sweep the tap path's aim, trace the dots, and age the puffs, shiver, shake and shout. */
export function tickView(v: View, r: Round, dt: number, slow: boolean, hand: Hand, ticking: boolean) {
  const s = slow ? 0.6 : 1;
  if (ticking) v.clock += dt * s;
  for (let i = 0; i < v.plife.length; i++) {
    if (v.plife[i] <= 0) continue;
    v.px[i] += v.pvx[i] * dt; v.py[i] += v.pvy[i] * dt; v.pvy[i] += 30 * dt; v.plife[i] -= dt;
  }
  for (let i = 0; i < STONES; i++) v.wob[i] *= Math.max(0, 1 - 7 * dt);
  if (v.shakeT > 0) { v.shakeT -= dt; if (v.shakeT <= 0) v.shakeAmp = 0; }
  if (v.lineWob > 0) v.lineWob = Math.max(0, v.lineWob - dt * 1.6);
  if (v.shout > 0) v.shout = Math.max(0, v.shout - dt);
  if (v.follow > 0) v.follow = Math.max(0, v.follow - dt * 4);
  const w = r.world;
  if (r.phase === "aim") {
    if (ticking && v.mode === "sweep") { v.aim.angle = sweepAngle(v.clock - v.since, slow); v.aim.power = 0.62; }
    else if (ticking && v.mode === "power") v.aim.power = meterPower(v.clock - v.since, slow);
    v.dotCount = trace(w, v.aim.angle, v.aim.power, v.dots, MAX_DOTS, DOT_GAP);
    v.dotsShown = shownDots(hand, v.dotCount);
    const target = v.mode === "pull" ? Math.min(1, v.aim.power) : v.mode === "power" || v.mode === "keys" ? v.aim.power * 0.6 : 0;
    v.armBack += (target - v.armBack) * Math.min(1, dt * 18);
  } else {
    v.dotsShown = 0;
    v.armBack += (0 - v.armBack) * Math.min(1, dt * 18);
  }
}

function drawLine(c: CanvasRenderingContext2D, v: View, r: Round) {
  const w = r.world, mid = (w.lineX0 + w.lineX1) / 2, sway = v.lineWob * Math.sin(v.clock * 30) * 5;
  c.strokeStyle = ROPE; c.lineWidth = 1.3;
  c.beginPath(); c.moveTo(w.lineX0, w.lineY - 3); c.quadraticCurveTo(mid, w.lineY + 4 + v.lineWob * 6, w.lineX1, w.lineY - 3); c.stroke();
  c.save();
  c.translate(mid + 40, w.lineY + 1); c.rotate(0.08 + sway * 0.02);
  c.fillStyle = GAMCHA; c.fillRect(-15, 0, 30, 34 + sway);
  c.fillStyle = GAMCHA_CHECK;
  for (let k = -11; k < 15; k += 7) c.fillRect(k, 0, 2, 34 + sway);
  for (let k = 4; k < 34; k += 7) c.fillRect(-15, k, 30, 2);
  c.restore();
}

function dots(c: CanvasRenderingContext2D, v: View) {
  for (let k = 0; k < v.dotsShown; k++) {
    const r = Math.max(1.4, 3.4 - k * 0.09);
    c.beginPath(); c.arc(v.dots[k * 2], v.dots[k * 2 + 1], r, 0, TAU);
    c.fillStyle = DOT_FILL; c.fill();
    c.strokeStyle = DOT_EDGE; c.lineWidth = 1; c.stroke();
  }
}

function ring(c: CanvasRenderingContext2D, x: number, y: number, power: number, accent: string) {
  c.lineWidth = 3;
  c.strokeStyle = RING_BACK;
  c.beginPath(); c.arc(x, y, BALL_R + 5, 0, TAU); c.stroke();
  c.strokeStyle = power > 0.97 ? RING_FULL : accent;
  c.beginPath(); c.arc(x, y, BALL_R + 5, -Math.PI / 2, -Math.PI / 2 + TAU * power); c.stroke();
}

function ball(c: CanvasRenderingContext2D, v: View, x: number, y: number, spin: number) {
  const s = v.sprites.ball;
  if (!s) return;
  c.save(); c.translate(x, y); c.rotate(spin);
  c.drawImage(s, -BALL_R - 1, -BALL_R - 1, BALL_R * 2 + 2, BALL_R * 2 + 2);
  c.restore();
}

/** Draws the whole lane for a round. `accent` colours the power ring; `t` is real seconds for idle motion. */
export function drawFrame(c: CanvasRenderingContext2D, v: View, r: Round, accent: string) {
  const sp = v.sprites, w = r.world;
  if (!sp.background) return;
  c.save();
  c.scale(v.scale, v.scale);
  c.translate(0, v.extra);
  if (v.shakeAmp > 0) c.translate(Math.sin(v.clock * 90) * v.shakeAmp * (v.shakeT / 0.28), 0);
  c.drawImage(sp.background, 0, -v.extra, W, H + v.extra);
  if (w.hasLine) drawLine(c, v, r);

  // টুনি squats by the far wall, reaching out while she puts a piece back.
  if (w.hasRebuild) {
    let busy = false;
    for (let i = 0; i < STONES; i++) if (w.backAt[i] >= 0 && w.clock - w.backAt[i] < BACK_STEPS + 8) busy = true;
    const t = busy ? sp.tuni[1] : sp.tuni[0];
    if (t) c.drawImage(t, 455 - 22, GROUND - 30, 34, 32);
  }

  for (let i = 0; i < STONES; i++) {
    const s = sp.stones[i];
    if (!s) continue;
    let x = w.x[i], y = w.y[i], a = w.a[i];
    const since = w.backAt[i] >= 0 ? w.clock - w.backAt[i] : BACK_STEPS;
    if (since < BACK_STEPS) {
      // Lifted back from where it lay, along a little arc.
      const u = since / BACK_STEPS, e = u * u * (3 - 2 * u);
      x = w.fx[i] + (w.hx[i] - w.fx[i]) * e; y = w.fy[i] + (w.hy[i] - w.fy[i]) * e - Math.sin(Math.PI * u) * 14; a = w.fa[i] * (1 - e);
    } else if (w.state[i] === STANDING && v.wob[i] !== 0) a = v.wob[i] * Math.sin(v.clock * 48 + i);
    const sw = w.w[i] + 4, sh = w.h[i] + 4;
    c.save(); c.translate(x, y); c.rotate(a);
    c.drawImage(s, -sw / 2, -sh / 2, sw, sh);
    c.restore();
  }

  if (w.hasGuard) {
    const lift = guardLift(w, w.clock), top = guardTop(w, w.clock), feet = GROUND - (GROUND - w.guardTall - top);
    const m = w.held ? sp.mithu[2] : lift > 0.05 ? sp.mithu[1] : sp.mithu[0];
    if (m) c.drawImage(m, w.guardX - 12, feet - 56, 24, 58);
  }

  const arm = sp.arm[v.armBack > 0.66 ? 2 : v.armBack > 0.25 ? 1 : 0];
  if (r.phase === "aim") {
    dots(c, v);
    const bx = HAND_X - v.armBack * 12, by = HAND_Y + v.armBack * 6;
    if (arm) c.drawImage(arm, -4, 220, 80, 70);
    ball(c, v, bx, by, 0);
    if (v.mode !== "sweep") ring(c, bx, by, v.aim.power, accent);
  } else {
    if (arm) c.drawImage(arm, -4 + v.follow * 6, 220 - v.follow * 4, 80, 70);
    if (!w.held && (w.ball === 1 || (w.ball === 2 && w.bx > -BALL_R))) ball(c, v, w.bx, w.by, v.calm ? 0 : w.spin);
  }

  c.fillStyle = PUFF;
  for (let i = 0; i < v.plife.length; i++) {
    const life = v.plife[i];
    if (life <= 0) continue;
    c.globalAlpha = Math.min(0.55, life * 1.6);
    c.beginPath(); c.arc(v.px[i], v.py[i], 2.5 + (0.45 - life) * 9, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;

  if (v.shout > 0) {
    const u = 1 - v.shout / 0.9;
    c.globalAlpha = Math.min(1, v.shout * 3);
    c.font = SHOUT_FONT; c.textAlign = "center"; c.textBaseline = "middle";
    c.lineWidth = 4; c.strokeStyle = SHOUT_EDGE; c.strokeText(SHOUT, v.shoutX, v.shoutY - u * 24);
    c.fillStyle = SHOUT_FILL; c.fillText(SHOUT, v.shoutX, v.shoutY - u * 24);
    c.globalAlpha = 1;
  }
  c.restore();
}
