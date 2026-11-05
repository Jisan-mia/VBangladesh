// The per-frame drawing: copy the pre-painted court, then the moving parts (moths, dust, cloth and flag in the wind, the
// neighbour at the window, both players, the shuttle with its trail and shadow, fog, the ring, the bursts and the gust
// chevrons). Allocation-free: no literals, closures or string building in here; everything comes from the View and the Match.
import { DRIVE, DROP, JUMP, LIFT, SMASH } from "./levels";
import { FLY, GAP, PERFECT_SHARE, ringShows, shuttleX, shuttleY, timeToContact, DOWN, SOFT, type Match } from "./match";
import { DT, GROUND, NET_BOTTOM, NET_TOP, NET_X, W } from "./physics";
import { drawPerson, drawShuttle, FLAG, LIGHT, LINE, SIGH_WINDOW, YOU } from "./scene";
import { DUST, TRAIL, type View } from "./view";

const GOLD = "#ffd23f";
const WHITE = "#ffffff";
const AHA = "আহা";
const CLOTH0 = "#3f7a8c", CLOTH1 = "#b85c38", CLOTH2 = "#d8c27a";

const clamp01 = (t: number) => t < 0 ? 0 : t > 1 ? 1 : t;
const ease = (t: number) => 1 - (1 - t) * (1 - t);

/** Decay the juice timers and move the dust (once per frame). `wind` is the air's push now (units a second). */
export function moveView(v: View, dt: number, wind: number) {
  v.clock += dt;
  if (v.flash > 0) v.flash = Math.max(0, v.flash - dt * 4.5);
  if (v.streak > 0) v.streak = Math.max(0, v.streak - dt * 5);
  if (v.bulge > 0) v.bulge = Math.max(0, v.bulge - dt * 2.5);
  if (v.sigh > 0) v.sigh = Math.max(0, v.sigh - dt * 0.75);
  if (v.shake > 0) v.shake = Math.max(0, v.shake - dt * 5);
  if (v.world !== 1 || v.calm) return;
  const top = v.layout.top, push = wind * 1.6;
  for (let i = 0; i < DUST; i++) {
    v.dx[i] += (push + (i % 5) * 4 * (wind >= 0 ? 1 : -1)) * dt;
    v.dy[i] += Math.sin(v.clock * 2 + i) * 6 * dt;
    if (v.dx[i] > W + 10) v.dx[i] -= W + 20;
    if (v.dx[i] < -10) v.dx[i] += W + 20;
    if (v.dy[i] < -top) v.dy[i] = 300;
  }
}

/** Remember where the shuttle is, for the trail. */
export function trackShuttle(v: View, m: Match) {
  if (m.phase !== FLY) { v.tcount = 0; return; }
  v.thead = (v.thead + 1) % TRAIL;
  v.tx[v.thead] = shuttleX(m); v.ty[v.thead] = shuttleY(m);
  if (v.tcount < TRAIL) v.tcount++;
}

/** Spread the dust over the sky once a size is known. */
export function seedDust(v: View) {
  const top = v.layout.top;
  for (let i = 0; i < DUST; i++) { v.dx[i] = ((i * 97) % 360); v.dy[i] = -top + ((i * 53) % (300 + top)); v.ds[i] = 0.8 + (i % 3) * 0.5; }
}

/** Your racket angle: whipping through the shot just played, raised while a finger is down, ready otherwise. */
function yourArm(m: Match, held: boolean) {
  const since = m.clock - m.youSwingAt;
  if (held) return -2.7;
  if (since >= 0 && since < 0.24) {
    const t = ease(since / 0.24);
    if (m.played === DOWN) return -2.9 + t * 3.7;
    if (m.played === SOFT) return -2.0 + t * 1.6;
    if (m.kind === LIFT) return 1.3 - t * 2.9;
    return -2.7 + t * 3.1;
  }
  if (since >= 0.24 && since < 0.5) return 0.4 - ((since - 0.24) / 0.26) * 1.3;
  const t = timeToContact(m);
  return t !== null && t < 0.5 ? -1.6 : -0.9;
}

/** The rival's racket: the telegraph pose for the shot they will play, or the follow-through of the one they just played. */
function rivalArm(m: Match) {
  const p = m.path, since = m.clock - m.rivalSwingAt;
  if (since >= 0 && since < 0.24) return -2.7 + ease(since / 0.24) * 3.1;
  if (m.phase === FLY && p.from === 0 && m.goes && p.contactAt >= 0 && (p.contactAt - m.i) * DT < 0.38) {
    const pose = m.pose;
    if (pose === SMASH || pose === JUMP) return -3.0;
    if (pose === DROP) return -1.9;
    if (pose === DRIVE) return 2.7;
    if (pose === LIFT) return 1.25;
    return -2.5;
  }
  return -0.9;
}
function rivalLift(m: Match) {
  const p = m.path;
  if (m.pose === JUMP && m.phase === FLY && p.from === 0 && m.goes && p.contactAt >= 0) {
    const left = (p.contactAt - m.i) * DT;
    if (left < 0.38 && left > -0.1) return 18 * clamp01(1 - left / 0.38);
  }
  const since = m.clock - m.rivalSwingAt;
  return m.kind === JUMP && since >= 0 && since < 0.3 ? 18 * (1 - since / 0.3) : 0;
}
function rivalCrouch(m: Match) {
  const p = m.path;
  return m.phase === FLY && p.from === 0 && m.goes && p.contactAt >= 0 && (p.contactAt - m.i) * DT < 0.6 && (m.pose === JUMP || m.pose === LIFT) ? 1 : 0;
}

function moths(v: View, c: CanvasRenderingContext2D) {
  const L = LIGHT[v.world];
  c.fillStyle = "#e8dcc0";
  for (let i = 0; i < 3; i++) {
    const t = v.calm ? i * 2.1 : v.clock * (1.3 + i * 0.4) + i * 2.1;
    const mx = L.x + Math.cos(t) * (12 + i * 6), my = L.y + 2 + Math.sin(t * 1.3) * (8 + i * 3);
    const flap = v.calm ? 2 : 1.2 + Math.abs(Math.sin(v.clock * 22 + i)) * 1.6;
    c.fillRect(mx - flap, my - 0.8, flap * 2, 1.6);
  }
}

/** The rooftop's wind made visible: blowing dust, cloth on the line leaning with it, the flag on the pole. */
function windSigns(v: View, c: CanvasRenderingContext2D, wind: number) {
  const push = wind / 50, lean = (push > 1 ? 1 : push < -1 ? -1 : push) * 16;
  if (!v.calm) {
    c.fillStyle = "#f3ede1";
    c.globalAlpha = 0.35 + Math.min(0.4, Math.abs(push) * 0.4);
    for (let i = 0; i < DUST; i++) c.fillRect(v.dx[i], v.dy[i], v.ds[i] + Math.abs(push) * 3, v.ds[i] * 0.6);
    c.globalAlpha = 1;
  }
  for (let i = 0; i < 3; i++) {
    const x = LINE.x0 + 24 + i * 34, y = LINE.y0 + 6 + (i === 1 ? 3 : 0), flap = v.calm ? 0 : Math.sin(v.clock * 6 + i) * Math.abs(push) * 2;
    c.fillStyle = i === 0 ? CLOTH0 : i === 1 ? CLOTH1 : CLOTH2;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + 14, y); c.lineTo(x + 14 + lean + flap, y + 22 - Math.abs(lean) * 0.4); c.lineTo(x + lean + flap, y + 23 - Math.abs(lean) * 0.4); c.closePath(); c.fill();
  }
  // The flag: a triangle that streams out the way the wind blows, longer the harder.
  const dir = wind >= 0 ? 1 : -1, len = 8 + Math.min(1, Math.abs(push)) * 18, wave = v.calm ? 0 : Math.sin(v.clock * 9) * 2;
  c.fillStyle = "#d94f3d";
  c.beginPath(); c.moveTo(FLAG.x, FLAG.y); c.lineTo(FLAG.x + dir * len, FLAG.y + 6 + wave); c.lineTo(FLAG.x, FLAG.y + 12); c.closePath(); c.fill();
}

/** Chevrons at the edge a gust blows towards, a moment before and while it blows. */
function gustSigns(v: View, c: CanvasRenderingContext2D) {
  if (!v.gust) return;
  const right = v.gust > 0, x = right ? W - 14 : 14, dir = right ? 1 : -1, top = v.layout.top;
  c.strokeStyle = "#7cc4ff"; c.lineWidth = 3; c.globalAlpha = 0.45 + 0.5 * v.gustPow;
  const pulse = v.calm ? 0 : Math.sin(v.clock * 10) * 3;
  for (let i = 0; i < 3; i++) {
    const y = 120 - top * 0.3 + i * 34, ox = x - dir * (i % 2) * 4 + dir * pulse;
    c.beginPath(); c.moveTo(ox - dir * 8, y - 9); c.lineTo(ox, y); c.lineTo(ox - dir * 8, y + 9); c.stroke();
  }
  c.globalAlpha = 1;
}

/** The whole frame. `held`: a finger is down on the shuttle. */
export function drawCourt(v: View, m: Match, held: boolean, wind: number) {
  const c = v.context, back = v.back;
  if (!c || !back) return;
  const L = v.layout;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.drawImage(back, 0, 0, back.width, back.height);
  const shake = v.calm || v.shake <= 0 ? 0 : Math.sin(v.clock * 90) * v.shake * 2.2;
  c.setTransform(v.ratio * L.scale, 0, 0, v.ratio * L.scale, v.ratio * (L.ox + shake), v.ratio * L.top * L.scale);
  if (v.world === 0) moths(v, c);
  if (v.world === 1) windSigns(v, c, wind);
  // The net bulges where the shuttle hit it.
  if (v.bulge > 0) {
    c.strokeStyle = "#f3ede1"; c.globalAlpha = v.bulge; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(NET_X, NET_TOP); c.quadraticCurveTo(NET_X + 7 * v.bulge, (NET_TOP + NET_BOTTOM) / 2, NET_X, NET_BOTTOM); c.stroke();
    c.globalAlpha = 1;
  }
  if (v.sigh > 0 && v.world === 0) {
    const { x, y, w, h } = SIGH_WINDOW, a = Math.min(1, v.sigh * 3);
    c.globalAlpha = a; c.fillStyle = "#2a1d1c";
    c.beginPath(); c.arc(x + w / 2, y + h * 0.48, 8, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(x + w / 2, y + h, 15, 14, 0, Math.PI, 0); c.fill();
    c.fillStyle = "#fff7e6"; c.fillRect(x + w + 4, y - 4, 34, 18);
    c.fillStyle = "#5a3a1a"; c.font = "800 12px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(AHA, x + w + 21, y + 5);
    c.globalAlpha = 1;
  }

  const bob = v.calm ? 0 : Math.sin(v.clock * 3.2) * 0.8;
  drawPerson(c, m.youX, 1, YOU.shirt, YOU.cap, yourArm(m, held), bob < 0 ? 0 : bob, 0);
  drawPerson(c, m.rivalX, -1, m.def.rival.shirt, m.def.rival.cap, rivalArm(m), rivalLift(m), rivalCrouch(m));

  // The shuttle: shadow on the ground (small and faint when high), a short trail, then the shuttle itself.
  const sx = shuttleX(m), sy = shuttleY(m), p = m.path;
  const near = clamp01(1 - (GROUND - sy) / 300);
  c.fillStyle = "#0a0814"; c.globalAlpha = 0.25 + near * 0.45;
  c.beginPath(); c.ellipse(sx, GROUND + 6, 4 + near * 8, 1.6 + near * 2.4, 0, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 1;
  if (m.phase === FLY && v.tcount > 1) {
    c.strokeStyle = m.kind === SMASH || m.kind === JUMP ? GOLD : WHITE; c.lineWidth = 2;
    for (let k = 1; k < v.tcount; k++) {
      const a = (v.thead - k + 1 + TRAIL) % TRAIL, b = (v.thead - k + TRAIL) % TRAIL;
      c.globalAlpha = (1 - k / v.tcount) * (v.streak > 0 ? 0.8 : 0.35);
      c.beginPath(); c.moveTo(v.tx[a], v.ty[a]); c.lineTo(v.tx[b], v.ty[b]); c.stroke();
    }
    c.globalAlpha = 1;
  }
  let angle = Math.PI / 2;
  if (m.phase === FLY) {
    const i = m.i < p.n - 1 ? m.i : p.n - 2;
    if (i >= 0) angle = Math.atan2(p.y[i + 1] - p.y[i], p.x[i + 1] - p.x[i]);
  } else if (m.phase !== GAP || m.t < 0.55) angle = Math.PI * 0.6;
  drawShuttle(c, sx, sy > GROUND - 2 ? GROUND - 2 : sy, angle, 1, 1.15);
  if (m.def.fog && v.fog) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = v.calm ? 1 : 0.92 + Math.sin(v.clock * 0.6) * 0.08;
    c.drawImage(v.fog, v.calm ? 0 : Math.sin(v.clock * 0.3) * 6 * v.ratio, 0, v.fog.width, v.fog.height);
    c.globalAlpha = 1;
    c.setTransform(v.ratio * L.scale, 0, 0, v.ratio * L.scale, v.ratio * (L.ox + shake), v.ratio * L.top * L.scale);
  }

  // The ring at your racket: wide while the shuttle is far, tight and gold right on time.
  if (ringShows(m)) {
    const left = timeToContact(m) ?? 0, cx = p.x[p.contactAt], cy = p.y[p.contactAt];
    const gold = Math.abs(left) <= PERFECT_SHARE * m.win, r = 10 + clamp01(left / 0.9) * 40;
    c.strokeStyle = gold ? GOLD : WHITE; c.globalAlpha = gold ? 1 : 0.85; c.lineWidth = gold ? 3.6 : 2.2;
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
    c.globalAlpha = 1;
    c.fillStyle = gold ? GOLD : WHITE;
    c.beginPath(); c.arc(cx, cy, 2.4, 0, Math.PI * 2); c.fill();
  }
  if (v.flash > 0 && !v.calm) {
    c.strokeStyle = GOLD; c.globalAlpha = v.flash; c.lineWidth = 2.5;
    c.beginPath(); c.arc(v.fx, v.fy, 8 + (1 - v.flash) * 34, 0, Math.PI * 2); c.stroke();
    for (let i = 0; i < 6; i++) {
      const a = i * 1.047 + 0.3, r0 = 10 + (1 - v.flash) * 20, r1 = r0 + 8;
      c.beginPath(); c.moveTo(v.fx + Math.cos(a) * r0, v.fy + Math.sin(a) * r0); c.lineTo(v.fx + Math.cos(a) * r1, v.fy + Math.sin(a) * r1); c.stroke();
    }
    c.globalAlpha = 1;
  }
  gustSigns(v, c);
}
