// Draws the dawn road. Everything still is painted once into offscreen sprites; each frame only stamps them,
// so a cheap phone keeps its frame rate. Slow mode drops the wobble, the flying letters, the bob and the rising pops.
import { BODY_FONT, DISPLAY_FONT } from "../../../shared/card-canvas";
import { fitCanvas } from "../../../shared/game-kit";
import { C, DRAW_PROP, DRAW_THING, PROP_HALF, drawBike, drawFlag, drawLetter, drawMilestone, paintRoad } from "./art";
import { pieceAt, laneX, AHEAD, BELL, CRASH, FRONT_Y, GOT_LETTER, H, LANE_W, LANES, LETTER, MILESTONE, ROAD_L, TAKEN, UNIT, W, type Run } from "./ride";
import { bn } from "./result";

type Sprite = { canvas: HTMLCanvasElement; w: number; h: number; ox: number; oy: number };

const TILE_H = 240, SEG = 84, MILE = 100 * UNIT;
/** Props are drawn a little larger than their art; the bike too (its hit box stays the same). */
const PROP_SCALE = [1.3, 1.25, 1.15, 1.15, 1, 1, 1] as const, BIKE_SCALE = 1.3;
const FLUTTER = 9, POPS = 6, POP_LIFE = 0.8, RING_LIFE = 0.6, CRASH_LIFE = 2.2;
/** Where each thing's sprite box sits around its origin: [width, height, ox, oy]. Shadows fall right, so boxes lean right. */
const THING_BOX = [[72, 46, 34, 40], [42, 56, 19, 52], [68, 92, 32, 86], [60, 114, 28, 108], [44, 34, 22, 28]] as const;
const HINTS = ["", "পাশে সরো!", "চিঠি তোলো!"] as const;
const FONT_STONE = `800 9px ${DISPLAY_FONT}`, FONT_FLAG = `700 11px ${BODY_FONT}`, FONT_HINT = `700 13px ${BODY_FONT}`;
const FONT_POP = `800 16px ${DISPLAY_FONT}`, FONT_MILE = `800 20px ${DISPLAY_FONT}`, FONT_SCORE = `800 26px ${DISPLAY_FONT}`, FONT_PILL = `700 15px ${DISPLAY_FONT}`;
const POP_TEXT = ["+১০", "ক্রিং! +৫"] as const;
const POP_COLOR = ["#1d5f50", "#b4532a", "#2b2118"] as const;
/** Where the letters land in slow mode (no flying), around the bike. */
const STILL = [[-52, -12], [48, -22], [-42, 40], [56, 30], [-68, 14], [38, 58], [-24, -40], [74, -4], [-30, 66]] as const;

export type Scene = {
  context: CanvasRenderingContext2D; k: number;
  road: Sprite; bike: [Sprite, Sprite]; things: Sprite[][]; props: Sprite[]; stone: Sprite; flag: Sprite; halves: Sprite; top: Sprite; flutter: Sprite;
  clock: number; roll: number; seen: number;
  popT: Float32Array; popX: Float32Array; popY: Float32Array; popKind: Uint8Array; popNext: number; mileText: string;
  ringAt: number; crashAt: number;
  fx: Float32Array; fy: Float32Array; fvx: Float32Array; fvy: Float32Array; fr: Float32Array;
  shownScore: number; scoreText: string; shownMeters: number; metersText: string; shownLetters: number; lettersText: string;
  stoneFor: number; stoneText: string; friendText: string;
};

/** Paints a `w`×`h` unit box into a canvas at `k` device pixels a unit; (ox, oy) is where the drawing's origin sits in the box. */
function sprite(w: number, h: number, ox: number, oy: number, k: number, paint: (context: CanvasRenderingContext2D) => void): Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(w * k); canvas.height = Math.ceil(h * k);
  const context = canvas.getContext("2d")!;
  context.setTransform(k, 0, 0, k, ox * k, oy * k);
  paint(context);
  return { canvas, w, h, ox, oy };
}

const stamp = (c: CanvasRenderingContext2D, s: Sprite, x: number, y: number) => c.drawImage(s.canvas, x - s.ox, y - s.oy, s.w, s.h);

function chevron(c: CanvasRenderingContext2D, x: number, y: number, towards: number) {
  c.lineCap = "round"; c.lineJoin = "round";
  for (const [color, width] of [["#2b211866", 11], ["#fffaf0", 6.5]] as const) {
    c.strokeStyle = color; c.lineWidth = width;
    c.beginPath(); c.moveTo(x - 9 * towards, y - 18); c.lineTo(x + 9 * towards, y); c.lineTo(x - 9 * towards, y + 18); c.stroke();
  }
}

function paintHalves(c: CanvasRenderingContext2D) {
  for (const [x, towards] of [[6, -1], [W / 2 + 3, 1]] as const) {
    c.fillStyle = "rgba(255,247,226,0.28)";
    c.beginPath(); c.roundRect(x, 58, W / 2 - 9, H - 72, 18); c.fill();
    chevron(c, x + (W / 2 - 9) / 2 + towards * 30, FRONT_Y + 10, towards);
  }
}

/** The dawn light at the top and the score pills on it. */
function paintTop(c: CanvasRenderingContext2D) {
  const light = c.createLinearGradient(0, 0, 0, 130);
  light.addColorStop(0, "rgba(255,206,160,0.75)"); light.addColorStop(0.45, "rgba(255,226,190,0.32)"); light.addColorStop(1, "rgba(255,236,210,0)");
  c.fillStyle = light; c.fillRect(0, 0, W, 130);
  const sun = c.createRadialGradient(24, 0, 4, 24, 0, 120);
  sun.addColorStop(0, "rgba(255,240,200,0.9)"); sun.addColorStop(0.25, "rgba(255,214,150,0.45)"); sun.addColorStop(1, "rgba(255,214,150,0)");
  c.fillStyle = sun; c.fillRect(0, 0, 150, 130);
  c.fillStyle = "rgba(255,250,240,0.9)";
  c.beginPath(); c.roundRect(W / 2 - 48, 7, 96, 38, 14); c.fill();
  c.fillStyle = "rgba(255,250,240,0.82)";
  c.beginPath(); c.roundRect(10, 12, 70, 28, 12); c.fill();
  c.beginPath(); c.roundRect(W - 92, 12, 82, 28, 12); c.fill();
  c.save(); c.translate(31, 36); c.scale(0.95, 0.95); drawLetter(c, 1); c.restore();
}

export function makeScene(canvas: HTMLCanvasElement, cssWidth: number, previous: Scene | null): Scene {
  const scale = cssWidth / W, ratio = Math.min(2, window.devicePixelRatio || 1), k = scale * ratio;
  const context = fitCanvas(canvas, cssWidth, cssWidth * H / W);
  const things = THING_BOX.map(([w, h, ox, oy], kind) => [0, 1, 2].map(look => sprite(w, h, ox, oy, k, c => DRAW_THING[kind](c, look))));
  const props = PROP_HALF.map(([hx, hy], index) => {
    const s = PROP_SCALE[index];
    return sprite((hx * 2 + 10) * s, (hy * 2 + 10) * s, (hx + 3) * s, (hy + 3) * s, k, c => { c.scale(s, s); DRAW_PROP[index](c); });
  });
  const scene: Scene = {
    context, k,
    road: sprite(W, TILE_H, 0, 0, k, c => paintRoad(c, W, TILE_H, ROAD_L, LANE_W, LANES)),
    bike: [0, 1].map(pedal => sprite(44 * BIKE_SCALE, 72 * BIKE_SCALE, 22 * BIKE_SCALE, 4 * BIKE_SCALE, k, c => { c.scale(BIKE_SCALE, BIKE_SCALE); drawBike(c, pedal); })) as [Sprite, Sprite],
    things, props,
    stone: sprite(34, 32, 13, 26, k, drawMilestone),
    flag: sprite(30, 46, 5, 42, k, drawFlag),
    halves: sprite(W, H, 0, 0, k, paintHalves),
    top: sprite(W, 130, 0, 0, k, paintTop),
    flutter: things[LETTER][1],
    clock: 0, roll: 0, seen: 0,
    popT: new Float32Array(POPS).fill(-9), popX: new Float32Array(POPS), popY: new Float32Array(POPS), popKind: new Uint8Array(POPS), popNext: 0, mileText: "",
    ringAt: -9, crashAt: -9,
    fx: new Float32Array(FLUTTER), fy: new Float32Array(FLUTTER), fvx: new Float32Array(FLUTTER), fvy: new Float32Array(FLUTTER), fr: new Float32Array(FLUTTER),
    shownScore: -1, scoreText: "", shownMeters: -1, metersText: "", shownLetters: -1, lettersText: "", stoneFor: -1, stoneText: "", friendText: "",
  };
  if (previous) {
    const { clock, roll, seen, popNext, mileText, ringAt, crashAt, friendText } = previous;
    Object.assign(scene, { clock, roll, seen, popNext, mileText, ringAt, crashAt, friendText });
    for (const key of ["popT", "popX", "popY", "popKind", "fx", "fy", "fvx", "fvy", "fr"] as const) scene[key].set(previous[key]);
  }
  return scene;
}

/** A fresh ride: forget the last one's pops, rings and flying letters. */
export function resetScene(scene: Scene) {
  scene.seen = 0; scene.popT.fill(-9); scene.ringAt = -9; scene.crashAt = -9;
}

export const setFriendName = (scene: Scene, name: string) => { scene.friendText = name; };

function pop(scene: Scene, kind: number, x: number, y: number) {
  const slot = scene.popNext++ % POPS;
  scene.popT[slot] = scene.clock; scene.popX[slot] = x; scene.popY[slot] = y; scene.popKind[slot] = kind;
}

/** Shows `text` in the milestone banner (a route's goal or a star on the way). */
export function announce(scene: Scene, text: string) { scene.mileText = text; pop(scene, 2, W / 2, 96); }

export const LETTER_TAKEN = 1, BELL_RANG = 2, CRASHED = 4;

/** Turns the ride's new events into pops, rings and flying letters. Returns what happened (for sound and buzz). */
export function absorb(scene: Scene, run: Run) {
  let happened = 0;
  for (; scene.seen < run.eventCount; scene.seen++) {
    if (run.eventCount - scene.seen > run.events.length) continue;
    const event = run.events[scene.seen % run.events.length];
    if (event.type === GOT_LETTER) { pop(scene, 0, event.x, FRONT_Y - 14); happened |= LETTER_TAKEN; }
    else if (event.type === BELL) { scene.ringAt = scene.clock; pop(scene, 1, Math.min(W - 50, run.x + 34), FRONT_Y + 4); happened |= BELL_RANG; }
    else if (event.type === MILESTONE) { scene.mileText = `${bn(Math.floor(event.y / MILE) * 100)} মিটার!`; pop(scene, 2, W / 2, 96); }
    else if (event.type === CRASH) {
      scene.crashAt = scene.clock;
      for (let i = 0; i < FLUTTER; i++) {
        scene.fx[i] = run.x + (i - 4) * 3; scene.fy[i] = FRONT_Y + 40;
        scene.fvx[i] = (i - 4) * 20 + (((i * 37) % 11) - 5) * 4; scene.fvy[i] = -110 - ((i * 53) % 50); scene.fr[i] = i * 0.7;
      }
      happened |= CRASHED;
    }
  }
  return happened;
}

/** Scene time: the ready screen's slow roll, the flying letters. */
export function tickScene(scene: Scene, dt: number, slow: boolean, rolling: boolean) {
  scene.clock += dt;
  if (rolling) scene.roll += 140 * dt;
  if (slow || scene.clock - scene.crashAt > CRASH_LIFE) return;
  for (let i = 0; i < FLUTTER; i++) {
    scene.fx[i] += (scene.fvx[i] + Math.sin(scene.clock * 5 + i * 1.7) * 30) * dt;
    scene.fy[i] += scene.fvy[i] * dt;
    scene.fvy[i] += 70 * dt;
    scene.fvx[i] *= 1 - 0.9 * dt;
    scene.fr[i] += ((i % 3) - 1) * 2.6 * dt;
  }
}

function hash(index: number) {
  let h = Math.imul(index ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}

function outlined(c: CanvasRenderingContext2D, text: string, x: number, y: number, fill: string) {
  c.lineWidth = 4; c.strokeStyle = "#fffaf0"; c.lineJoin = "round";
  c.strokeText(text, x, y); c.fillStyle = fill; c.fillText(text, x, y);
}

/**
 * One frame. `run` is null on the ready screen (an empty road rolling by). `friendMeters` puts a flag where a friend stopped,
 * and `goal` draws a rope across the road with its name where the route's letters are due.
 * The two halves glow on the ready screen and fade out over a ride's first two seconds.
 */
export function drawScene(scene: Scene, run: Run | null, slow: boolean, friendMeters: number, goal?: { meters: number; name: string }) {
  const c = scene.context, d = run ? run.d : scene.roll, clock = scene.clock;
  c.setTransform(scene.k, 0, 0, scene.k, 0, 0);
  c.globalAlpha = 1;

  // The road: a repeating tile, then the roadside things for each stretch, both sides.
  for (let bottom = (((FRONT_Y + d) % TILE_H) + TILE_H) % TILE_H; bottom - TILE_H < H; bottom += TILE_H) c.drawImage(scene.road.canvas, 0, bottom - TILE_H, W, TILE_H);
  const low = Math.floor((d - (H - FRONT_Y) - 60) / SEG), high = Math.floor((d + FRONT_Y + 60) / SEG);
  for (let index = high; index >= low; index--) {
    for (let side = 0; side < 2; side++) {
      const h = hash(index * 2 + side), kind = h % 9;
      if (kind >= DRAW_PROP.length) continue;
      const big = kind === 4 || kind === 5, jitter = ((h >>> 8) % 14) - 7;
      const x = side ? W - ROAD_L / 2 + (big ? 8 : 0) + jitter : ROAD_L / 2 - (big ? 8 : 0) + jitter;
      stamp(c, scene.props[kind], x, FRONT_Y - (index * SEG + ((h >>> 12) % 50) - d));
    }
  }

  // A milestone every 100 m on the right, and the friend's flag on the left.
  const mile = Math.floor((d + FRONT_Y + 40) / MILE);
  const stoneY = FRONT_Y - (mile * MILE - d);
  if (mile > 0 && stoneY < H + 30) {
    if (scene.stoneFor !== mile) { scene.stoneFor = mile; scene.stoneText = bn(mile * 100); }
    const x = ROAD_L + LANES * LANE_W + 16;
    stamp(c, scene.stone, x, stoneY);
    c.font = FONT_STONE; c.textAlign = "center"; c.fillStyle = C.ink;
    c.fillText(scene.stoneText, x, stoneY - 3);
  }
  if (friendMeters > 0) {
    const flagY = FRONT_Y - (friendMeters * UNIT - d);
    if (flagY > -10 && flagY < H + 50) {
      stamp(c, scene.flag, ROAD_L - 18, flagY);
      if (scene.friendText) { c.font = FONT_FLAG; c.textAlign = "right"; outlined(c, scene.friendText, ROAD_L - 22, flagY - 44, "#b23a2e"); }
    }
  }

  if (run && goal) {
    const goalY = FRONT_Y - (goal.meters * UNIT - d);
    if (goalY > -10 && goalY < H + 20) {
      c.fillStyle = C.ink; c.fillRect(ROAD_L - 6, goalY - 2, LANES * LANE_W + 12, 4);
      c.font = FONT_FLAG; c.textAlign = "center"; outlined(c, goal.name, W / 2, goalY - 8, "#b23a2e");
    }
  }

  // The things on the road, far ones first, so a near one overlaps a far one.
  if (run) {
    for (let index = run.count - 1; index >= run.first; index--) {
      const piece = pieceAt(run, index);
      if (piece.state === TAKEN) continue;
      const y = FRONT_Y - (piece.y - d);
      if (y < -4 || y - piece.len - 20 > H) continue;
      const bob = piece.kind === LETTER && !slow ? Math.sin(clock * 4 + index) * 1.5 : 0;
      stamp(c, scene.things[piece.kind][piece.look], piece.x, y + bob);
      // The first puddle and the first letter say what to do, just under them, until they're close.
      if (piece.hint && !run.over && piece.state === AHEAD && y > 50 && y < FRONT_Y - 60) {
        const top = y + 22;
        c.fillStyle = "#2b2118e6"; c.beginPath(); c.roundRect(piece.x - 44, top - 15, 88, 24, 10); c.fill();
        c.font = FONT_HINT; c.textAlign = "center"; c.fillStyle = "#fff4dc"; c.fillText(HINTS[piece.hint], piece.x, top + 2);
      }
    }
  }

  // The bike: leans into a lane change; after a bump it wobbles (just a tilt in slow mode).
  const x = run ? run.x : laneX(1), since = clock - scene.crashAt;
  let angle = 0, drop = 0;
  if (run && !run.over) angle = (laneX(run.lane) - run.x) / LANE_W * 0.35;
  if (run && run.over) {
    angle = slow ? 0.24 : Math.sin(since * 14) * 0.4 * Math.exp(-since * 2.2) + 0.12 * Math.min(1, since * 3);
    drop = slow ? 4 : Math.min(1, since * 4) * 6;
  }
  const bike = scene.bike[run && run.over ? 0 : Math.floor(d / 22) & 1];
  c.save(); c.translate(x, FRONT_Y + 36 + drop); c.rotate(angle);
  c.drawImage(bike.canvas, -bike.ox, -36 - bike.oy, bike.w, bike.h);
  c.restore();

  // The bell: two rings beside it, a still pair in slow mode. Never more than one flash: the rings just fade.
  const rang = clock - scene.ringAt;
  if (rang < RING_LIFE) {
    const p = rang / RING_LIFE, bx = x + 9 * BIKE_SCALE, by = FRONT_Y + 13.6 * BIKE_SCALE;
    c.globalAlpha = 1 - p; c.strokeStyle = "#b4532a"; c.lineWidth = 2; c.lineCap = "round";
    for (let ring = 0; ring < 2; ring++) {
      const r = slow ? 9 + ring * 7 : 7 + ring * 7 + p * 10;
      c.beginPath(); c.arc(bx, by, r, -1.1, 0.5); c.stroke();
    }
    c.globalAlpha = 1;
  }

  // Letters flying off the bag after a bump (lying still around the bike in slow mode).
  if (run && run.over) {
    for (let i = 0; i < FLUTTER; i++) {
      const lx = slow ? x + STILL[i][0] : scene.fx[i], ly = slow ? FRONT_Y + 30 + STILL[i][1] : scene.fy[i];
      c.globalAlpha = slow ? 1 : Math.max(0, Math.min(1, (CRASH_LIFE - since) / 0.6));
      if (c.globalAlpha <= 0) break;
      c.save(); c.translate(lx, ly); c.rotate(slow ? i * 0.6 : scene.fr[i]);
      stamp(c, scene.flutter, 0, 10);
      c.restore();
    }
    c.globalAlpha = 1;
  }

  // Pops: +১০, ক্রিং! +৫, a milestone. They rise and fade; in slow mode they only fade.
  c.textAlign = "center";
  for (let slot = 0; slot < POPS; slot++) {
    const age = clock - scene.popT[slot];
    if (age < 0 || age > POP_LIFE) continue;
    const kind = scene.popKind[slot];
    c.globalAlpha = Math.min(1, (POP_LIFE - age) / 0.3);
    c.font = kind === 2 ? FONT_MILE : FONT_POP;
    outlined(c, kind === 2 ? scene.mileText : POP_TEXT[kind], scene.popX[slot], scene.popY[slot] - (slow ? 0 : age * 28), POP_COLOR[kind]);
  }
  c.globalAlpha = 1;

  // The two glowing halves: on the ready screen, then fading out over the first two seconds of a ride.
  const glow = run ? Math.max(0, Math.min(1, 2.2 - run.t)) : 1;
  if (glow > 0) { c.globalAlpha = glow * 0.9; c.drawImage(scene.halves.canvas, 0, 0, W, H); c.globalAlpha = 1; }

  // Dawn light and the score.
  c.drawImage(scene.top.canvas, 0, 0, W, 130);
  const score = run ? run.score : 0, meters = run ? run.meters : 0, letters = run ? run.letters : 0;
  if (score !== scene.shownScore) { scene.shownScore = score; scene.scoreText = bn(score); }
  if (meters !== scene.shownMeters) { scene.shownMeters = meters; scene.metersText = `${bn(meters)} মি`; }
  if (letters !== scene.shownLetters) { scene.shownLetters = letters; scene.lettersText = bn(letters); }
  c.fillStyle = C.ink;
  c.font = FONT_SCORE; c.textAlign = "center"; c.fillText(scene.scoreText, W / 2, 37);
  c.font = FONT_PILL; c.textAlign = "left"; c.fillText(scene.lettersText, 46, 32);
  c.textAlign = "right"; c.fillText(scene.metersText, W - 20, 32);
}
