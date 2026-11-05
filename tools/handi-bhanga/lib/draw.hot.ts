// Moves and draws the play canvas every frame: the stall, the swaying ropes and pots, the ball and its trail, the
// লাঠি, the aim's dotted path, shards, chips, rings and the floor chevron. No allocation here: layers and sprites come
// pre-rendered from scene.ts, strings are made when something breaks, and the dash patterns live at module scope.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import { palette } from "./art";
import {
  BALL_R, K_BAMBOO, K_BOSS, SLOW, STICK_H, STICK_Y, W, WALL, potLeftAt, swayAt, windAt, ropeY, type Game,
} from "./rules";
import { MODE_INFO } from "./levels";
import { PAD_TOP, PAD_X, POPS, RINGS, SHARDS, SHARD_COLORS, TRAIL, spriteOf, type Scene } from "./scene";
import { AWNING_H, FLOOR, LOOKS, drawChevron } from "./stall-art";

const DASH = [4, 4], SOLID: number[] = [];
const CHIP_FONT = `800 15px ${DISPLAY_FONT}`;
const TAU = Math.PI * 2;

/** Advances the effects by dt seconds of real time. The last pot's crash plays at a quarter speed for half a second. */
export function updateScene(scene: Scene, game: Game, dt: number, slow: boolean) {
  scene.slow = slow;
  const crash = !slow && game.phase === "end" && game.end === "clear" && game.timer < 0.55;
  const h = dt * (slow ? SLOW : 1) * (crash ? 0.25 : 1);
  scene.clock = game.clock;
  scene.stickT += dt; scene.bellT += dt; scene.bossT += dt; scene.ballT += dt;
  if (scene.shake > 0) scene.shake -= dt;
  for (let i = 0; i < game.n; i++) scene.hitT[i] += dt;
  const shards = scene.shards;
  for (let i = 0; i < SHARDS; i++) {
    const o = i * 9;
    if (shards[o + 7] <= 0) continue;
    shards[o + 7] -= h;
    shards[o + 3] += 420 * h;
    shards[o] += shards[o + 2] * h; shards[o + 1] += shards[o + 3] * h; shards[o + 4] += shards[o + 5] * h;
    if (shards[o + 1] > FLOOR - 3) { shards[o + 1] = FLOOR - 3; shards[o + 3] *= -0.3; shards[o + 2] *= 0.6; shards[o + 5] *= 0.5; }
  }
  const pops = scene.pops;
  for (let i = 0; i < POPS; i++) { const o = i * 4 + 2; if (pops[o] >= 0) { pops[o] += h; if (pops[o] > 1.1) pops[o] = -1; } }
  const rings = scene.rings;
  for (let i = 0; i < RINGS; i++) { const o = i * 4 + 2; if (rings[o] >= 0) { rings[o] += h; if (rings[o] > 0.45) rings[o] = -1; } }
  if (game.phase === "fly") {
    scene.trailAt = (scene.trailAt + 1) % TRAIL;
    scene.trail[scene.trailAt * 2] = game.x; scene.trail[scene.trailAt * 2 + 1] = game.y;
  } else {
    for (let i = 0; i < TRAIL; i++) { scene.trail[i * 2] = game.x; scene.trail[i * 2 + 1] = game.y; }
  }
}

/** A thin string from the rope to a pot's lip. */
function hang(context: CanvasRenderingContext2D, x: number, ropeAt: number, top: number) {
  context.moveTo(x, ropeAt + 0.5); context.lineTo(x, top + 2);
}

export function drawFrame(context: CanvasRenderingContext2D, scene: Scene, game: Game, calm: boolean) {
  const { w, ratio, s } = scene;
  if (!w || !scene.back) return;
  const clock = game.clock, def = game.def;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.globalAlpha = 1;
  context.drawImage(scene.back, 0, 0, w, scene.h);
  const shake = !calm && scene.shake > 0 ? scene.shake * 5 : 0;
  const k = ratio * s, ox = scene.ox + (shake ? Math.sin(clock * 90) * shake : 0), oy = scene.oy + (shake ? Math.cos(clock * 77) * shake * 0.6 : 0);
  context.setTransform(k, 0, 0, k, ratio * ox, ratio * oy);

  // Ropes and strings.
  context.strokeStyle = palette.rope; context.lineCap = "round";
  for (let r = 0; r < scene.ropes; r++) {
    const y = ropeY(game, r), sway = swayAt(def, clock, r);
    context.lineWidth = 1.6;
    context.beginPath(); context.moveTo(WALL, y - 1); context.quadraticCurveTo(W / 2 + sway * 1.6, y + 3, W - WALL, y - 1); context.stroke();
  }
  context.lineWidth = 1.1;
  context.beginPath();
  for (let i = 0; i < game.n; i++) {
    const left = potLeftAt(game, i, clock), ropeAt = ropeY(game, game.rope[i]);
    if (game.kinds[i] === K_BOSS) { hang(context, left + 18, ropeAt, game.py[i]); hang(context, left + game.pw[i] - 18, ropeAt, game.py[i]); }
    else hang(context, left + game.pw[i] / 2, ropeAt, game.py[i]);
  }
  context.stroke();

  // What is left on the string, then the pots.
  for (let i = 0; i < game.n; i++) {
    if (game.hits[i] > 0 || game.kinds[i] === K_BAMBOO || game.kinds[i] === K_BOSS) continue;
    const rim = scene.rims[game.design[i]];
    if (rim) context.drawImage(rim, potLeftAt(game, i, clock) - PAD_X + (game.pw[i] - 36) / 2, game.py[i] - PAD_TOP, 44, 22);
  }
  for (let i = 0; i < game.n; i++) {
    if (game.hits[i] <= 0) continue;
    const boss = game.kinds[i] === K_BOSS, left = potLeftAt(game, i, clock);
    const wear = boss ? Math.min(3, Math.floor((1 - game.hits[i] / game.maxHits[i]) * 3.4)) : 0;
    const sprite = scene.sprites[spriteOf(game.kinds[i], game.design[i], game.hits[i], game.maxHits[i], wear)];
    if (!sprite) continue;
    const width = game.pw[i] + PAD_X * 2, height = game.ph[i] + PAD_TOP + 3;
    const age = boss ? scene.bossT : scene.hitT[i], rocking = !calm && age < 0.45;
    if (rocking) {
      const tilt = Math.sin(age * 38) * 0.14 * (1 - age / 0.45) * (boss ? 0.45 : 1);
      const pivotX = left + game.pw[i] / 2, pivotY = game.py[i];
      const cos = Math.cos(tilt), sin = Math.sin(tilt);
      context.setTransform(k * cos, k * sin, -k * sin, k * cos, ratio * (ox + pivotX * s), ratio * (oy + pivotY * s));
      context.drawImage(sprite, -game.pw[i] / 2 - PAD_X, -PAD_TOP, width, height);
      context.setTransform(k, 0, 0, k, ratio * ox, ratio * oy);
    } else context.drawImage(sprite, left - PAD_X, game.py[i] - PAD_TOP, width, height);
  }

  // The aim: the dotted path, an arrow on কঠিন, and a dashed ring on the pot it will hit.
  if (game.phase === "aim" && game.traceN > 0) {
    const guide = def.old ? 1 : MODE_INFO[game.mode].guide === "full" ? 2 : MODE_INFO[game.mode].guide === "first" ? 1 : 0;
    context.fillStyle = palette.ink;
    for (let i = 0; i < game.traceN; i++) {
      context.globalAlpha = 0.62 * (1 - i / (game.traceN + 12));
      context.beginPath(); context.arc(game.trace[i * 2], game.trace[i * 2 + 1], 2.5 - 1.1 * (i / game.traceN), 0, TAU); context.fill();
    }
    context.globalAlpha = 1;
    if (guide === 0 && game.traceN > 1) {
      const x = game.trace[(game.traceN - 1) * 2], y = game.trace[(game.traceN - 1) * 2 + 1];
      const a = Math.atan2(y - game.trace[(game.traceN - 2) * 2 + 1], x - game.trace[(game.traceN - 2) * 2]);
      context.save(); context.translate(x, y); context.rotate(a);
      context.beginPath(); context.moveTo(8, 0); context.lineTo(-3, -6); context.lineTo(-3, 6); context.closePath(); context.fill();
      context.restore();
    }
    if (game.target >= 0 && game.hits[game.target] > 0) {
      const i = game.target, cx = potLeftAt(game, i, clock) + game.pw[i] / 2, cy = game.py[i] + game.ph[i] / 2;
      context.strokeStyle = game.catching ? "#c1352b" : palette.ink; context.lineWidth = 1.8;
      context.setLineDash(DASH); context.lineDashOffset = -clock * 14;
      context.beginPath(); context.ellipse(cx, cy, game.pw[i] / 2 + 6, game.ph[i] / 2 + 6, 0, 0, TAU); context.stroke();
      context.setLineDash(SOLID);
    }
  }

  // The ball's trail, then the ball.
  const drawBall = game.phase === "aim" || game.phase === "fly" || (game.phase === "end" && game.end === "clear");
  if (game.phase === "fly" && !calm) {
    context.fillStyle = "#2f4a8a";
    for (let j = 1; j < TRAIL; j++) {
      const at = (scene.trailAt - j + TRAIL) % TRAIL;
      context.globalAlpha = 0.34 * (1 - j / TRAIL);
      context.beginPath(); context.arc(scene.trail[at * 2], scene.trail[at * 2 + 1], BALL_R * (1 - j / (TRAIL + 1)), 0, TAU); context.fill();
    }
    context.globalAlpha = 1;
  }
  if (drawBall && scene.ball) {
    const size = BALL_R * 2 + 6;
    context.drawImage(scene.ball, game.x - size / 2, game.y - size / 2, size, size);
  }

  // The লাঠি: it squashes down when it takes the ball.
  if (scene.stick) {
    const press = !calm && scene.stickT < 0.16 ? (1 - scene.stickT / 0.16) * 3 : 0;
    const width = game.stickW + 6;
    context.drawImage(scene.stick, game.stick - width / 2, STICK_Y - 2 + press, width, STICK_H + 4 - press * 0.5);
  }

  // The bell: a gold ripple over the stall when শেষ ডাক rings, and the dashed ring on the stick while it catches.
  if (scene.bellT < 1.1) {
    const t = scene.bellT / 1.1;
    context.strokeStyle = "#e39b00"; context.lineWidth = 3 * (1 - t) + 0.5; context.globalAlpha = 1 - t;
    context.beginPath(); context.arc(game.stick, STICK_Y, 20 + t * 180, Math.PI, TAU); context.stroke();
    context.globalAlpha = 1;
  }
  if (game.catching && game.phase !== "over") {
    context.strokeStyle = "#e39b00"; context.lineWidth = 1.6; context.setLineDash(DASH); context.lineDashOffset = clock * 10;
    context.beginPath(); context.roundRect(game.stick - game.stickW / 2 - 4, STICK_Y - 4, game.stickW + 8, STICK_H + 8, 8); context.stroke();
    context.setLineDash(SOLID);
  }

  // Shards, rings.
  const shards = scene.shards;
  for (let i = 0; i < SHARDS; i++) {
    const o = i * 9;
    if (shards[o + 7] <= 0) continue;
    context.globalAlpha = Math.min(1, shards[o + 7] * 2);
    context.fillStyle = SHARD_COLORS[shards[o + 8]];
    const size = shards[o + 6], a = shards[o + 4], x = shards[o], y = shards[o + 1];
    const ca = Math.cos(a) * size, sa = Math.sin(a) * size;
    context.beginPath();
    context.moveTo(x - ca + sa * 0.3, y - sa - ca * 0.3); context.lineTo(x + ca * 0.2 + sa * 0.7, y + sa * 0.2 - ca * 0.7); context.lineTo(x + ca - sa * 0.4, y + sa + ca * 0.4);
    context.closePath(); context.fill();
  }
  context.globalAlpha = 1;
  const rings = scene.rings;
  context.strokeStyle = "#fff6e2";
  for (let i = 0; i < RINGS; i++) {
    const o = i * 4;
    if (rings[o + 2] < 0) continue;
    const t = rings[o + 2] / 0.45;
    context.globalAlpha = 1 - t; context.lineWidth = 3 * (1 - t) + 0.5;
    context.beginPath(); context.arc(rings[o], rings[o + 1], rings[o + 3] * (0.35 + 0.65 * t), 0, TAU); context.stroke();
  }
  context.globalAlpha = 1;

  // Where a ball the লাঠি won't reach will land.
  if (scene.land === scene.land) {
    context.fillStyle = "#e0452c"; context.globalAlpha = 0.55 + 0.4 * Math.sin(clock * 14);
    drawChevron(context, scene.land, FLOOR - 2, 10); context.fill();
    context.globalAlpha = 1;
  }

  // Wind: a pennant on the awning's peak, longer and flatter as it blows harder.
  if (def.wind) {
    const wind = windAt(game, clock), power = Math.min(1, Math.abs(wind) / def.wind), dir = wind >= 0 ? 1 : -1;
    const px = W - WALL - 18, py = scene.top - AWNING_H - 4, flutter = calm ? 0 : Math.sin(clock * 9) * 2.5 * power;
    context.strokeStyle = palette.ink; context.lineWidth = 1.6;
    context.beginPath(); context.moveTo(px, py); context.lineTo(px, py - 24); context.stroke();
    context.fillStyle = LOOKS[scene.look].awningAlt === "#f2b84b" ? "#f2b84b" : "#e0452c";
    context.beginPath(); context.moveTo(px, py - 24); context.lineTo(px + dir * (10 + 16 * power), py - 20 + flutter); context.lineTo(px, py - 14); context.closePath(); context.fill();
  }

  // Chips float up from what broke.
  const pops = scene.pops;
  context.font = CHIP_FONT; context.textAlign = "center";
  for (let i = 0; i < POPS; i++) {
    const o = i * 4, age = pops[o + 2];
    if (age < 0) continue;
    const t = age / 1.1, up = 26 * (1 - (1 - t) * (1 - t));
    context.globalAlpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
    context.lineWidth = 3; context.strokeStyle = "rgba(43,26,16,0.85)";
    context.strokeText(scene.popText[i], pops[o], pops[o + 1] - up);
    context.fillStyle = pops[o + 3] > 0 ? "#ffd166" : "#fff6e2";
    context.fillText(scene.popText[i], pops[o], pops[o + 1] - up);
  }
  context.globalAlpha = 1;
}
