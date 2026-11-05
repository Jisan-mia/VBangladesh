// The play canvas's setup and its effects: the size and camera, the pre-rendered layers and sprites (backdrop, pots, ball,
// লাঠি), and what a break, a crack, a blast or a catch leaves behind (shards, chips, rings). draw.hot.ts moves and draws
// all of it every frame without allocating.
import { DESIGN_BODY, drawBall, drawBrokenRim, drawPot, drawStick, palette } from "./art";
import type { LevelDef } from "./levels";
import {
  BALL_R, CELL, H, K_BAMBOO, K_BOSS, K_CRACKER, K_TOUGH, MAX_POTS, POT_DROP, POT_H, POT_W, ROPE_DROP, ROW_GAP, STICK_H, STICK_Y, W, WALL, DESIGNS,
  potLeftAt, type Game,
} from "./rules";
import {
  AWNING_H, FLOOR, LOOKS, drawAwning, drawBossPot, drawBunting, drawCloth, drawCrackerPot, drawGround, drawKnot, drawLantern, drawPole, drawWheel,
} from "./stall-art";
import { flightText, popText } from "./words";

export const SHARDS = 72, POPS = 8, RINGS = 8, TRAIL = 7;
/** Sprites carry this much room around a pot for the lip, the fuse and the outline. */
export const PAD_X = 4, PAD_TOP = 7, PAD_BOTTOM = 3;
/** Colours a shard can have: the six pot bodies, then the thick pot, the firecracker and the মটকা. */
export const SHARD_COLORS = [...DESIGN_BODY, palette.toughBody, "#cf3a22", "#e6ad3e"] as const;
/** Sprite indexes: designs 0–5 plain, 6–11 thick, 12–17 thick and cracked, 18–23 firecracker, 24 knot. The মটকা's four wear stages follow. */
export const S_PLAIN = 0, S_TOUGH = DESIGNS, S_CRACKED = DESIGNS * 2, S_CRACKER = DESIGNS * 3, S_KNOT = DESIGNS * 4, S_BOSS = DESIGNS * 4 + 1, SPRITES = S_BOSS + 4;
export const spriteOf = (kind: number, design: number, hits: number, maxHits: number, wear = 0) =>
  kind === K_BOSS ? S_BOSS + wear : kind === K_BAMBOO ? S_KNOT : kind === K_CRACKER ? S_CRACKER + design
    : kind === K_TOUGH ? (hits < maxHits ? S_CRACKED : S_TOUGH) + design : S_PLAIN + design;

export type Scene = {
  w: number; h: number; ratio: number;
  /** World to screen: x * s + ox, y * s + oy (CSS pixels). */
  s: number; ox: number; oy: number;
  look: number; top: number; ropes: number;
  /** The end screen shows only the awning and the ropes, as big as a short box allows. */
  compact: boolean;
  clock: number; slow: boolean;
  /** Seconds since pot i was hit (it jiggles), and since the লাঠি took the ball. */
  hitT: Float32Array; stickT: number; ballT: number;
  /** Time left of the hit-stop, of the screen shake, and since the bell rang (9: not ringing). */
  freeze: number; shake: number; bellT: number; bellX: number;
  /** Shards: x, y, vx, vy, angle, spin, size, life, colour. */
  shards: Float32Array;
  /** Chips: x, y, age, colour (0 plain, 1 gold) and their text. */
  pops: Float32Array; popText: string[];
  /** Rings: x, y, age, size. */
  rings: Float32Array;
  /** The ball's last positions, newest first. */
  trail: Float32Array; trailAt: number;
  /** Seconds since the last blow to the মটকা (it rocks). */
  bossT: number;
  /** Where a falling ball will cross the লাঠি's line (NaN: no warning), for the floor chevron. */
  land: number;
  back: HTMLCanvasElement | null;
  sprites: HTMLCanvasElement[];
  rims: HTMLCanvasElement[];
  ball: HTMLCanvasElement | null;
  stick: HTMLCanvasElement | null; stickW: number;
};

export function makeScene(): Scene {
  return {
    w: 0, h: 0, ratio: 1, s: 1, ox: 0, oy: 0, look: 0, top: 262, ropes: 1, compact: false, clock: 0, slow: false,
    hitT: new Float32Array(MAX_POTS).fill(9), stickT: 9, ballT: 9, freeze: 0, shake: 0, bellT: 9, bellX: 0,
    shards: new Float32Array(SHARDS * 9), pops: new Float32Array(POPS * 4).fill(-1), popText: new Array<string>(POPS).fill(""),
    rings: new Float32Array(RINGS * 4).fill(-1), trail: new Float32Array(TRAIL * 2), trailAt: 0, bossT: 9, land: NaN,
    back: null, sprites: [], rims: [], ball: null, stick: null, stickW: 0,
  };
}

function offscreen(width: number, height: number, ratio: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * ratio)); canvas.height = Math.max(1, Math.round(height * ratio));
  const context = canvas.getContext("2d")!;
  context.scale(ratio, ratio);
  return { canvas, context };
}

/** The stall's world and ceiling decide the layers. Call before resizeScene, or call resizeScene after. */
export function setStall(scene: Scene, def: LevelDef, stickW: number) {
  scene.look = def.world;
  scene.top = def.top;
  scene.ropes = def.rows.length;
  if (scene.stickW !== stickW) { scene.stickW = stickW; if (scene.w) paintStick(scene); }
}

/** Camera: the whole stall from the bunting to the floor fits, as big as the box allows, the floor at the bottom. Compact: only the awning and the ropes. */
export function resizeScene(scene: Scene, w: number, h: number, ratio: number) {
  scene.w = w; scene.h = h; scene.ratio = ratio;
  if (scene.compact) {
    const first = scene.top - AWNING_H - 14, last = scene.top + ROPE_DROP + (scene.ropes - 1) * ROW_GAP + POT_DROP + POT_H + 20, viewH = last - first;
    scene.s = Math.min(w / W, h / viewH);
    scene.ox = (w - W * scene.s) / 2;
    scene.oy = (h - viewH * scene.s) / 2 - first * scene.s;
  } else {
    const viewH = H - scene.top + AWNING_H + 18;
    scene.s = Math.min(w / W, h / viewH);
    scene.ox = (w - W * scene.s) / 2;
    scene.oy = h - H * scene.s;
  }
  paint(scene);
}

function paintStick(scene: Scene) {
  const width = scene.stickW + 6;
  const sprite = offscreen(width * scene.s, (STICK_H + 4) * scene.s, scene.ratio), c = sprite.context;
  c.scale(scene.s, scene.s);
  drawStick(c, width / 2, 2, scene.stickW, STICK_H);
  scene.stick = sprite.canvas;
}

/** Everything that never moves, painted once per size and look (and again once the Bangla fonts arrive). */
export function paint(scene: Scene) {
  const { w, h, ratio, s, ox, oy } = scene;
  if (!w || !h) return;
  const look = LOOKS[scene.look], top = scene.top;
  const back = offscreen(w, h, ratio), c = back.context;
  const yAwn = oy + (top - AWNING_H) * s;
  // Sky.
  const sky = c.createLinearGradient(0, 0, 0, Math.max(40, yAwn + 20));
  sky.addColorStop(0, look.skyTop); sky.addColorStop(1, look.skyLow);
  c.fillStyle = sky; c.fillRect(0, 0, w, h);
  const wheelR = Math.max(34, Math.min(w * 0.19, yAwn * 0.36));
  if (look.moon) {
    c.fillStyle = "rgba(255,255,255,0.8)";
    for (let k = 0; k < 28; k++) c.fillRect((k * 97 + 13) % Math.max(1, w), (k * 53 + 7) % Math.max(1, yAwn * 0.9), k % 3 ? 1.4 : 2.2, k % 3 ? 1.4 : 2.2);
  }
  const sunX = look.moon ? w * 0.82 : w * 0.78, sunY = Math.max(40, yAwn * (look.moon ? 0.22 : 0.42));
  c.fillStyle = look.sunHalo; c.beginPath(); c.arc(sunX, sunY, 34, 0, Math.PI * 2); c.fill();
  c.fillStyle = look.sun; c.beginPath(); c.arc(sunX, sunY, look.moon ? 15 : 21, 0, Math.PI * 2); c.fill();
  // Far hills, near hills, and the wheel and tents of the fair.
  const horizon = yAwn + 6;
  c.fillStyle = look.hillFar;
  c.beginPath(); c.moveTo(0, horizon);
  for (let x = 0; x <= w + 20; x += 20) c.lineTo(x, horizon - 18 - 14 * Math.sin(x * 0.021 + 1) - 8 * Math.sin(x * 0.07));
  c.lineTo(w, horizon); c.closePath(); c.fill();
  drawWheel(c, w * 0.2, horizon - wheelR * 1.05, wheelR, look.wheel, look.hill);
  c.fillStyle = look.hill;
  c.beginPath(); c.moveTo(0, horizon);
  for (let x = 0; x <= w + 20; x += 20) c.lineTo(x, horizon - 6 - 9 * Math.sin(x * 0.033 + 4) - 5 * Math.sin(x * 0.09));
  c.lineTo(w, horizon); c.closePath(); c.fill();
  if (look.river) {
    c.fillStyle = "rgba(255,255,255,0.22)";
    for (let row = 0; row < 3; row++) for (let x = (row * 31) % 50; x < w; x += 58) c.fillRect(x, horizon - 4 + row * 3, 24, 1.5);
  }
  // The fair beside the stall (when the box is wider than the stall).
  c.fillStyle = look.hillFar;
  c.fillRect(0, horizon, w, h - horizon);
  c.fillStyle = look.hill;
  for (const side of [0, 1]) {
    const x0 = side ? ox + W * s : 0, x1 = side ? w : ox;
    if (x1 - x0 < 8) continue;
    c.fillRect(x0, horizon, x1 - x0, h - horizon);
    c.fillStyle = look.awning;
    for (let tx = x0 + 10; tx < x1 - 10; tx += 46) { c.beginPath(); c.moveTo(tx, oy + (top + 20) * s); c.lineTo(tx + 18, oy + (top - 20) * s); c.lineTo(tx + 36, oy + (top + 20) * s); c.closePath(); c.fill(); }
    c.fillStyle = look.hill;
  }

  // The stall, in world units.
  c.save();
  c.translate(ox, oy); c.scale(s, s);
  drawCloth(c, look, top, FLOOR);
  drawGround(c, look, -ox / s, (w - ox) / s, FLOOR, (h - oy) / s + 2);
  drawPole(c, 0, WALL, top - AWNING_H, H);
  drawPole(c, W - WALL, WALL, top - AWNING_H, H);
  drawAwning(c, look, 0, W, top);
  if (look.lanterns) for (const x of [WALL + 20, W / 2, W - WALL - 20]) drawLantern(c, x, top + 6, 7);
  drawBunting(c, 0, W, top - AWNING_H, 9, look.moon ? ["#f2b84b", "#e6559b", "#6fd0c4"] : look.river ? ["#fff1c4", "#f2845c", "#1f7a78"] : ["#f6c945", "#2f6b3a", "#fff1c4"]);
  c.restore();
  scene.back = back.canvas;

  // Pots, the rims left on the string, the ball and the লাঠি.
  const sprites: HTMLCanvasElement[] = [];
  const spriteW = POT_W + PAD_X * 2, spriteH = POT_H + PAD_TOP + PAD_BOTTOM;
  const make = (width: number, height: number, draw: (c: CanvasRenderingContext2D) => void) => {
    const sprite = offscreen(width * s, height * s, ratio);
    sprite.context.scale(s, s);
    draw(sprite.context);
    return sprite.canvas;
  };
  for (let d = 0; d < DESIGNS; d++) sprites[S_PLAIN + d] = make(spriteW, spriteH, g => drawPot(g, spriteW / 2, PAD_TOP, POT_W, d, false, false));
  for (let d = 0; d < DESIGNS; d++) sprites[S_TOUGH + d] = make(spriteW, spriteH, g => drawPot(g, spriteW / 2, PAD_TOP, POT_W, d, true, false));
  for (let d = 0; d < DESIGNS; d++) sprites[S_CRACKED + d] = make(spriteW, spriteH, g => drawPot(g, spriteW / 2, PAD_TOP, POT_W, d, true, true));
  for (let d = 0; d < DESIGNS; d++) sprites[S_CRACKER + d] = make(spriteW, spriteH, g => drawCrackerPot(g, spriteW / 2, PAD_TOP, POT_W, d));
  sprites[S_KNOT] = make(spriteW, spriteH, g => drawKnot(g, spriteW / 2, PAD_TOP, POT_W, POT_H));
  const bossW = CELL * 3 - 12, bossH = ROW_GAP + POT_H - 2;
  for (let wear = 0; wear < 4; wear++) sprites[S_BOSS + wear] = make(bossW + PAD_X * 2, bossH + PAD_TOP + PAD_BOTTOM, g => drawBossPot(g, PAD_X, PAD_TOP, bossW, bossH, wear / 3.4));
  scene.sprites = sprites;
  scene.rims = [];
  for (let d = 0; d < DESIGNS; d++) scene.rims[d] = make(spriteW, 22, g => drawBrokenRim(g, spriteW / 2, PAD_TOP, POT_W, 0, DESIGN_BODY[d]));
  scene.ball = make(BALL_R * 2 + 6, BALL_R * 2 + 6, g => drawBall(g, BALL_R + 3, BALL_R + 3, BALL_R));
  if (scene.stickW) paintStick(scene);
}

/* ---------- effects (raised by the component from game.events; none of this runs per frame) ---------- */

function pop(scene: Scene, x: number, y: number, text: string, gold: number) {
  let slot = 0, oldest = -1;
  for (let i = 0; i < POPS; i++) {
    const age = scene.pops[i * 4 + 2];
    if (age < 0) { slot = i; oldest = 9; break; }
    if (age > oldest) { oldest = age; slot = i; }
  }
  scene.pops[slot * 4] = x; scene.pops[slot * 4 + 1] = y; scene.pops[slot * 4 + 2] = 0; scene.pops[slot * 4 + 3] = gold;
  scene.popText[slot] = text;
}

function ring(scene: Scene, x: number, y: number, size: number) {
  let slot = 0, oldest = -1;
  for (let i = 0; i < RINGS; i++) {
    const age = scene.rings[i * 4 + 2];
    if (age < 0) { slot = i; break; }
    if (age > oldest) { oldest = age; slot = i; }
  }
  scene.rings[slot * 4] = x; scene.rings[slot * 4 + 1] = y; scene.rings[slot * 4 + 2] = 0; scene.rings[slot * 4 + 3] = size;
}

/** Shards burst from (x, y); `big` for the মটকা. Counted down in draw.hot.ts. */
export function burst(scene: Scene, x: number, y: number, count: number, spread: number, color: number) {
  const shards = scene.shards;
  for (let made = 0, i = 0; i < SHARDS && made < count; i++) {
    const o = i * 9;
    if (shards[o + 7] > 0) continue;
    const a = (made / count) * Math.PI * 2 + made * 0.7, v = (60 + ((made * 47) % 90)) * spread;
    shards[o] = x; shards[o + 1] = y; shards[o + 2] = Math.cos(a) * v; shards[o + 3] = Math.sin(a) * v - 70;
    shards[o + 4] = made; shards[o + 5] = ((made % 2) * 2 - 1) * (3 + (made % 5)); shards[o + 6] = 3 + (made % 4) * 1.4 * spread;
    shards[o + 7] = 1.1 + (made % 3) * 0.2; shards[o + 8] = color;
    made++;
  }
}

const colorOf = (game: Game, i: number) => game.kinds[i] === K_BOSS ? 8 : game.kinds[i] === K_CRACKER ? 7 : game.kinds[i] === K_TOUGH ? 6 : game.design[i];

/** Pot `i` broke. `points` is what it earned, `flight` the run of pots in this flight. */
export function onBreak(scene: Scene, game: Game, i: number, points: number, flight: number) {
  const cx = potLeftAt(game, i, game.clock) + game.pw[i] / 2, cy = game.py[i] + game.ph[i] / 2, boss = game.kinds[i] === K_BOSS;
  scene.hitT[i] = 9;
  scene.bossT = boss ? 0 : scene.bossT;
  if (!scene.slow) {
    burst(scene, cx, cy, boss ? 26 : 9, boss ? 1.7 : 1, colorOf(game, i));
    scene.freeze = Math.max(scene.freeze, boss ? 0.16 : flight >= 3 ? 0.055 : 0.035);
    if (boss) scene.shake = 0.5;
  } else burst(scene, cx, cy, boss ? 10 : 4, 0.6, colorOf(game, i));
  pop(scene, cx, game.py[i] - 2, popText(points), flight >= 3 || boss ? 1 : 0);
  ring(scene, cx, cy, boss ? 60 : 26);
}

/** A thick pot or the মটকা took a blow and held. */
export function onCrack(scene: Scene, game: Game, i: number) {
  scene.hitT[i] = 0;
  if (game.kinds[i] === K_BOSS) scene.bossT = 0;
  const cx = potLeftAt(game, i, game.clock) + game.pw[i] / 2, cy = game.py[i] + game.ph[i] / 2;
  if (!scene.slow) { burst(scene, cx, cy, 3, 0.55, colorOf(game, i)); scene.freeze = Math.max(scene.freeze, 0.03); }
  ring(scene, cx, cy, 18);
}

/** A knot knocked the ball away. */
export function onKnot(scene: Scene, x: number, y: number) { ring(scene, x, y, 14); }

/** A firecracker went off at pot `i`. */
export function onBlast(scene: Scene, game: Game, i: number) {
  const cx = potLeftAt(game, i, game.clock) + game.pw[i] / 2, cy = game.py[i] + game.ph[i] / 2;
  ring(scene, cx, cy, 78);
  if (!scene.slow) scene.shake = Math.max(scene.shake, 0.2);
}

/** The লাঠি took the ball. */
export function onStick(scene: Scene) { scene.stickT = 0; }

/** শেষ ডাক: the bell rings over the stall. */
export function onBell(scene: Scene, x: number) { scene.bellT = 0; scene.bellX = x; }

/** The flight's chip: a run of pots in one throw. */
export function onFlight(scene: Scene, x: number, y: number, count: number) { pop(scene, x, y - 14, flightText(count), 1); }

/** A fresh stall or a restart: nothing left over. */
export function restartScene(scene: Scene) {
  scene.hitT.fill(9); scene.stickT = 9; scene.ballT = 9; scene.freeze = 0; scene.shake = 0; scene.bellT = 9; scene.bossT = 9;
  scene.shards.fill(0); scene.pops.fill(-1); scene.rings.fill(-1); scene.trail.fill(0); scene.trailAt = 0;
}

export const GROUND_Y = STICK_Y + STICK_H;
