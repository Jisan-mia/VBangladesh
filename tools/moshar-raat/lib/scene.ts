// Sets up the room for one stage size and world: every still thing is painted once into offscreen canvases here, and the
// strings the HUD needs are made here too, so draw.hot.ts only stamps sprites. The field (room.ts) is scaled to fit the stage,
// anchored to the floor; the walls, the ceiling and its stopped fan fill whatever is left.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import { FAST, GHOST, PLAIN, SWARM, WORLDS, type Look } from "./levels";
import { bn, hitWord } from "./lines";
import { BOSS_LOOKS, BUG_LOOKS, PALETTES, paintBat, paintBug, paintEdge, paintGlass, paintRoom, paintSpeck, type Palette } from "./paint";
import { H, HEAD_X, HEAD_Y, TOP, W, WINDOW } from "./room";
import { EV_BITE, EV_BOSS_DOWN, EV_BOSS_HIT, EV_NEAR, EV_SLAP, EV_ZAP, type Game } from "./game";

export type Sprite = { canvas: HTMLCanvasElement; w: number; h: number };
export type Pop = { x: number; y: number; t: number; text: string; color: string; big: boolean };

export const SPARKS = 32, POPS = 8;
export const FONT_HUD = `800 17px ${DISPLAY_FONT}`;
export const FONT_SMALL = `700 13px ${DISPLAY_FONT}`;
export const FONT_POP = `800 18px ${DISPLAY_FONT}`;
export const FONT_BIG = `800 24px ${DISPLAY_FONT}`;
export const FONT_NAME = `800 14px ${DISPLAY_FONT}`;
/** Bangla numerals 0..199 and the streak labels, made once. */
export const NUMBERS: string[] = [];
export const STREAKS: string[] = [];
function numbers() {
  if (NUMBERS.length) return;
  for (let value = 0; value < 200; value++) { NUMBERS.push(bn(value)); STREAKS.push(`টানা ${bn(value)}`); }
}
/** Sprites per kind: [kind 0..3][diving 0/1][wing 0..2]; the boss has its own 6. */
export const bugFrame = (kind: number, diving: boolean, wing: number) => kind * 6 + (diving ? 3 : 0) + wing;

export type Scene = {
  context: CanvasRenderingContext2D; ratio: number; cssW: number; cssH: number;
  /** CSS px per field unit, the field's origin on the canvas (CSS px), and the field extents the canvas shows. */
  s: number; ox: number; oy: number; left: number; top: number; right: number;
  look: Look; world: number; palette: Palette; holes: readonly number[];
  bg: HTMLCanvasElement; glassNight: Sprite; glassDawn: Sprite;
  bugs: Sprite[]; boss: Sprite[]; bat: Sprite; batLit: Sprite; speck: Sprite;
  edgeOrange: HTMLCanvasElement; edgeRed: HTMLCanvasElement; edgeWarm: HTMLCanvasElement;
  clock: number;
  game: Game | null; facing: Int8Array; seen: number;
  /** "৩/১২" for every zap count of this night, made when the night is bound. */
  tallies: string[]; bossName: string;
  sparks: Float32Array; spark: number;
  pops: Pop[]; pop: number;
  batX: number; batY: number; batT: number; batHit: boolean;
  hurtT: number; bossHitT: number;
  aimX: number; aimY: number; aimOn: boolean;
};

function sprite(w: number, h: number, k: number, paint: (context: CanvasRenderingContext2D) => void): Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(w * k)); canvas.height = Math.max(1, Math.ceil(h * k));
  const context = canvas.getContext("2d")!;
  context.setTransform(k, 0, 0, k, (w / 2) * k, (h / 2) * k);
  paint(context);
  return { canvas, w, h };
}
function layer(width: number, height: number, paint: (context: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width)); canvas.height = Math.max(1, Math.round(height));
  paint(canvas.getContext("2d")!);
  return canvas;
}

export function makeScene(canvas: HTMLCanvasElement, cssW: number, cssH: number, world: number, holes: readonly number[], previous?: Scene | null): Scene {
  numbers();
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(cssW * ratio); canvas.height = Math.round(cssH * ratio);
  const s = Math.min(cssW / W, cssH / (H - TOP)), ox = (cssW - W * s) / 2, oy = cssH - H * s, k = s * ratio;
  const left = -ox / s, right = (cssW - ox) / s, top = -oy / s;
  const look = WORLDS[world].look, p = PALETTES[look];
  const bg = layer(cssW * ratio, cssH * ratio, context => { context.setTransform(k, 0, 0, k, ox * ratio, oy * ratio); paintRoom(context, p, holes, left, top, right); });
  const bugs: Sprite[] = [];
  for (const kind of [PLAIN, FAST, GHOST, SWARM]) for (const diving of [false, true]) for (let wing = 0; wing < 3; wing++) {
    const look = BUG_LOOKS[kind === SWARM ? 3 : kind];
    bugs.push(sprite(30 * look.scale, 30 * look.scale, k, context => paintBug(context, look, wing / 2, diving)));
  }
  const bossLook = BOSS_LOOKS[world], boss: Sprite[] = [];
  for (const diving of [false, true]) for (let wing = 0; wing < 3; wing++) boss.push(sprite(30 * bossLook.scale, 30 * bossLook.scale, k, context => paintBug(context, bossLook, wing / 2, diving)));
  const half = ratio / 2;
  return {
    context: canvas.getContext("2d")!, ratio, cssW, cssH, s, ox, oy, left, top, right, look, world, palette: p, holes,
    bg,
    glassNight: sprite(WINDOW.w, WINDOW.h, k, context => { context.translate(-WINDOW.x - WINDOW.w / 2, -WINDOW.y - WINDOW.h / 2); paintGlass(context, p, false); }),
    glassDawn: sprite(WINDOW.w, WINDOW.h, k, context => { context.translate(-WINDOW.x - WINDOW.w / 2, -WINDOW.y - WINDOW.h / 2); paintGlass(context, p, true); }),
    bugs, boss,
    bat: sprite(100, 140, k, context => { context.translate(0, -20); paintBat(context, false); }),
    batLit: sprite(100, 140, k, context => { context.translate(0, -20); paintBat(context, true); }),
    speck: sprite(16, 16, k, paintSpeck),
    edgeOrange: layer(cssW * half, cssH * half, context => paintEdge(context, cssW * half, cssH * half, "#ff7a14f5")),
    edgeRed: layer(cssW * half, cssH * half, context => paintEdge(context, cssW * half, cssH * half, "#e5302ae0")),
    edgeWarm: layer(cssW * half, cssH * half, context => paintEdge(context, cssW * half, cssH * half, "#ff7a3cc8", true)),
    clock: previous?.clock ?? 0,
    game: null, facing: new Int8Array(1), seen: 0, tallies: [], bossName: WORLDS[world].boss,
    sparks: new Float32Array(SPARKS * 5), spark: 0,
    pops: Array.from({ length: POPS }, () => ({ x: 0, y: 0, t: -9, text: "", color: "", big: false })), pop: 0,
    batX: W / 2, batY: H / 2, batT: 9, batHit: false, hurtT: 9, bossHitT: 9,
    aimX: previous?.aimX ?? W / 2, aimY: previous?.aimY ?? 260, aimOn: previous?.aimOn ?? false,
  };
}

/** A new night on this scene: forget the last night's pops and sparks, make this night's tallies. */
export function bindGame(scene: Scene, game: Game | null) {
  scene.game = game; scene.seen = game ? game.eventCount : 0;
  scene.facing = new Int8Array(Math.max(1, game?.n ?? 1)).fill(1);
  scene.tallies = game ? Array.from({ length: game.count + 1 }, (_, zaps) => `${bn(zaps)}/${bn(game.count)}`) : [];
  scene.sparks.fill(0); scene.batT = 9; scene.hurtT = 9; scene.bossHitT = 9;
  for (const pop of scene.pops) pop.t = -9;
}

function addPop(scene: Scene, x: number, y: number, text: string, color: string, big = false) {
  const pop = scene.pops[scene.pop = (scene.pop + 1) % scene.pops.length];
  pop.x = x; pop.y = y; pop.t = scene.clock; pop.text = text; pop.color = color; pop.big = big;
}

function burst(scene: Scene, x: number, y: number, count: number) {
  const sparks = scene.sparks;
  for (let k = 0; k < count; k++) {
    const i = (scene.spark = (scene.spark + 1) % SPARKS) * 5, a = (k / count) * Math.PI * 2 + scene.clock * 3, v = 70 + (k % 3) * 40;
    sparks[i] = x; sparks[i + 1] = y; sparks[i + 2] = Math.cos(a) * v; sparks[i + 3] = Math.sin(a) * v; sparks[i + 4] = 0.32;
  }
}

/** The swing itself, drawn at once: the bat comes down where you tapped. */
export function showSwing(scene: Scene, x: number, y: number, hits: number) {
  scene.batX = x; scene.batY = y; scene.batT = 0; scene.batHit = hits > 0;
}

/**
 * Reads the night's new events into pops, sparks and edge pulses. Returns a bit mask of what happened, for the sounds:
 * 1 zap, 2 bite, 4 slap, 8 boss hit, 16 boss down, 32 near miss. `calm` (ধীরে খেলো) leaves out the sparks.
 */
export function readEvents(scene: Scene, game: Game, calm: boolean) {
  let mask = 0;
  for (; scene.seen < game.eventCount; scene.seen++) {
    const event = game.events[scene.seen % game.events.length];
    if (event.kind === EV_ZAP) {
      mask |= 1;
      if (!calm) burst(scene, event.x, event.y, 6 + event.n * 3);
      addPop(scene, event.x, event.y - 36, hitWord(event.n, game.combo), "#ffe27a", event.n > 1);
    } else if (event.kind === EV_BITE) {
      mask |= 2; scene.hurtT = scene.clock;
      addPop(scene, event.x - 34, event.y - 20, "উঁহু!", "#ffd2d2");
    } else if (event.kind === EV_SLAP) {
      mask |= 4; scene.hurtT = scene.clock;
      addPop(scene, HEAD_X, HEAD_Y - 34, "ঠাস! চড় লাগল", "#ffd2d2");
    } else if (event.kind === EV_BOSS_HIT) {
      mask |= 8; scene.bossHitT = scene.clock;
      if (!calm) burst(scene, event.x, event.y, 12);
      addPop(scene, event.x, event.y - 46, `আর ${bn(event.n)} চাপ!`, "#ffd166", true);
    } else if (event.kind === EV_BOSS_DOWN) {
      mask |= 16; scene.bossHitT = scene.clock;
      if (!calm) burst(scene, event.x, event.y, 20);
      addPop(scene, event.x, event.y - 46, `${scene.bossName} কাত!`, "#ffd166", true);
    } else if (event.kind === EV_NEAR) {
      mask |= 32;
      addPop(scene, event.x, event.y - 36, "একটুর জন্য", "#cfd8f0");
    }
  }
  return mask;
}

/** Ambient time and the sparks: the room's clock and the bat's fade. */
export function tickScene(scene: Scene, dt: number) {
  scene.clock += dt;
  scene.batT += dt;
  const sparks = scene.sparks;
  for (let i = 0; i < SPARKS * 5; i += 5) {
    if (sparks[i + 4] <= 0) continue;
    sparks[i + 4] -= dt; sparks[i] += sparks[i + 2] * dt; sparks[i + 1] += sparks[i + 3] * dt;
  }
}

