// Sets up the field for one stage size and world: every still thing is painted once into offscreen canvases here, and the
// strings the HUD needs are made here too, so draw.hot.ts only stamps sprites. The field (field.ts) is scaled to fit the
// stage, anchored to its bottom edge; more sky (and more paddy to the sides) fills whatever is left.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import { drawBird, drawScarecrow, drawSheaf, LOOKS, PECK, SIT, WINGS_DOWN, WINGS_UP, type BirdLook } from "./art";
import { H, SCARECROW, TOP, W } from "./field";
import { WORLDS, type Look } from "./levels";
import { bn, hitWord } from "./lines";
import { PALETTES, paintEdge, paintField, paintFront, paintMist, type Palette } from "./paint";
import { EV_BOSS_GONE, EV_BOSS_HIT, EV_BOSS_IN, EV_HOP, EV_LAND, EV_MISS, EV_NEAR, EV_PECK, EV_SHOO, EV_TENTH, type Game } from "./afternoon";

export type Sprite = { canvas: HTMLCanvasElement; w: number; h: number };
export type Pop = { x: number; y: number; t: number; text: string; color: string; big: boolean };
export type Ripple = { x: number; y: number; t: number; hit: boolean };

export const POPS = 8, RIPPLES = 6;
export const FONT_HUD = `800 17px ${DISPLAY_FONT}`;
export const FONT_SMALL = `700 13px ${DISPLAY_FONT}`;
export const FONT_POP = `800 21px ${DISPLAY_FONT}`;
export const FONT_BIG = `800 24px ${DISPLAY_FONT}`;
export const FONT_NAME = `800 14px ${DISPLAY_FONT}`;
/** Bangla numerals 0..199, the grain percents, the shoo tallies and the streak labels, made once. */
export const NUMBERS: string[] = [];
export const PERCENTS: string[] = [];
export const SHOOS: string[] = [];
export const STREAKS: string[] = [];
function numbers() {
  if (NUMBERS.length) return;
  for (let value = 0; value < 200; value++) { NUMBERS.push(bn(value)); PERCENTS.push(`${bn(value)}%`); SHOOS.push(`হুশ ${bn(value)}`); STREAKS.push(`টানা ${bn(value)}`); }
}

/** Bird sprites: three kinds × four poses, then the world's boss × four poses. Sizes in field units. */
export const BIRD = 40;
const KIND_LOOKS: readonly BirdLook[] = [LOOKS.sparrow, LOOKS.shalik, LOOKS.munia];
export const KIND_SIZE = [1, 1.08, 0.78] as const;
const BOSS_LOOKS: readonly BirdLook[] = [LOOKS.godha, LOOKS.jhunti, LOOKS.parrot];
export const BOSS_SIZE = [1.55, 1.45, 1.35] as const;
export const POSES = [SIT, PECK, WINGS_UP, WINGS_DOWN] as const;

export type Scene = {
  context: CanvasRenderingContext2D; ratio: number; cssW: number; cssH: number;
  /** CSS px per field unit, the field's origin on the canvas (CSS px), and the field extents the canvas shows. */
  s: number; ox: number; oy: number; left: number; top: number; right: number;
  world: number; look: Look; palette: Palette;
  bg: HTMLCanvasElement; mist: HTMLCanvasElement | null; dusk: HTMLCanvasElement; front: Sprite;
  birds: Sprite[]; boss: Sprite[]; bossSize: number; scarecrow: Sprite[]; sheaf: Sprite; hand: Sprite;
  edgeOrange: HTMLCanvasElement; edgeRed: HTMLCanvasElement; edgeWarm: HTMLCanvasElement;
  clock: number;
  game: Game | null; seen: number;
  bossName: string; total: string;
  pops: Pop[]; pop: number; ripples: Ripple[]; ripple: number; turn: number;
  /** When the last tenth of grain went (the bottom pulse), the boss was last hit, the last bird was shooed (the কাকতাড়ুয়া's jig). */
  tenthT: number; bossHitT: number; jigT: number;
  /** The keyboard's hand: shown once an arrow key is used. */
  handX: number; handY: number; handOn: boolean;
};

function sprite(w: number, h: number, k: number, paint: (context: CanvasRenderingContext2D) => void, origin?: readonly [number, number]): Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(w * k)); canvas.height = Math.max(1, Math.ceil(h * k));
  const context = canvas.getContext("2d")!;
  context.setTransform(k, 0, 0, k, (origin ? origin[0] : w / 2) * k, (origin ? origin[1] : h / 2) * k);
  paint(context);
  return { canvas, w, h };
}
function layer(width: number, height: number, paint: (context: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width)); canvas.height = Math.max(1, Math.round(height));
  paint(canvas.getContext("2d")!);
  return canvas;
}
const birdSprite = (size: number, k: number, look: BirdLook, pose: number) => sprite(size * 2.6, size * 1.8, k, context => drawBird(context, size, pose, look));

export function makeScene(canvas: HTMLCanvasElement, cssW: number, cssH: number, world: number, previous?: Scene | null): Scene {
  numbers();
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(cssW * ratio); canvas.height = Math.round(cssH * ratio);
  const s = Math.min(cssW / W, cssH / (H - TOP)), ox = (cssW - W * s) / 2, oy = cssH - H * s, k = s * ratio;
  const left = -ox / s, right = (cssW - ox) / s, top = -oy / s;
  const look = WORLDS[world].look, p = PALETTES[look];
  const onField = (context: CanvasRenderingContext2D) => context.setTransform(k, 0, 0, k, ox * ratio, oy * ratio);
  const bg = layer(cssW * ratio, cssH * ratio, context => { onField(context); paintField(context, p, left, top, right); });
  const mist = p.mist ? layer(cssW * ratio, cssH * ratio, context => { onField(context); paintMist(context, left, top, right); }) : null;
  const dusk = layer(cssW * ratio / 2, cssH * ratio / 2, context => {
    const g = context.createLinearGradient(0, 0, 0, cssH * ratio / 2);
    g.addColorStop(0, p.dusk[0]); g.addColorStop(1, p.dusk[1]);
    context.fillStyle = g; context.fillRect(0, 0, cssW * ratio, cssH * ratio);
  });
  const birds: Sprite[] = [];
  for (let kind = 0; kind < KIND_LOOKS.length; kind++) for (const pose of POSES) birds.push(birdSprite(BIRD * KIND_SIZE[kind], k * 1.1, KIND_LOOKS[kind], pose));
  const boss: Sprite[] = [];
  for (const pose of POSES) boss.push(birdSprite(BIRD * BOSS_SIZE[world], k * 1.1, BOSS_LOOKS[world], pose));
  const half = ratio / 2;
  return {
    context: canvas.getContext("2d")!, ratio, cssW, cssH, s, ox, oy, left, top, right, world, look, palette: p,
    bg, mist, dusk,
    front: sprite(right - left, 80, k, context => paintFront(context, p, 0, right - left), [0, 0]),
    birds, boss, bossSize: BOSS_SIZE[world],
    scarecrow: [0, 1, 2].map(mood => sprite(SCARECROW.height, SCARECROW.height * 1.02, k, context => drawScarecrow(context, SCARECROW.height, mood), [SCARECROW.height / 2, SCARECROW.height])),
    sheaf: sprite(26, 26, k * 1.2, context => drawSheaf(context, 24)),
    hand: sprite(30, 30, k, paintHand),
    edgeOrange: layer(cssW * half, cssH * half, context => paintEdge(context, cssW * half, cssH * half, "#ef5a0af2")),
    edgeRed: layer(cssW * half, cssH * half, context => paintEdge(context, cssW * half, cssH * half, "#e5302ae8")),
    edgeWarm: layer(cssW * half, cssH * half, context => paintEdge(context, cssW * half, cssH * half, "#ff7a3cd0", true)),
    clock: previous?.clock ?? 0,
    game: null, seen: 0, bossName: WORLDS[world].boss, total: "",
    pops: Array.from({ length: POPS }, () => ({ x: 0, y: 0, t: -9, text: "", color: "", big: false })), pop: 0,
    ripples: Array.from({ length: RIPPLES }, () => ({ x: 0, y: 0, t: -9, hit: false })), ripple: 0, turn: 0,
    tenthT: -9, bossHitT: -9, jigT: -9,
    handX: previous?.handX ?? W / 2, handY: previous?.handY ?? 400, handOn: previous?.handOn ?? false,
  };
}

function paintHand(context: CanvasRenderingContext2D) {
  // An open palm, for the keyboard's clap.
  context.fillStyle = "#ffe3c6"; context.strokeStyle = "#6b3f22"; context.lineWidth = 1.4;
  for (const [x, top] of [[-6, -12], [-2, -14], [2, -13.5], [6, -11]]) { context.beginPath(); context.roundRect(x - 1.8, top, 3.6, 12, 1.8); context.fill(); context.stroke(); }
  context.beginPath(); context.roundRect(-8, -4, 16, 13, 5); context.fill(); context.stroke();
  context.beginPath(); context.roundRect(-13, -2, 8, 3.6, 1.8); context.fill(); context.stroke();
}

/** A new afternoon on this scene: forget the last one's pops and ripples. */
export function bindGame(scene: Scene, game: Game | null) {
  scene.game = game; scene.seen = game ? game.eventCount : 0;
  scene.total = game ? `/${bn(game.n)}` : "";
  scene.tenthT = -9; scene.bossHitT = -9; scene.jigT = -9;
  for (const pop of scene.pops) pop.t = -9;
  for (const ripple of scene.ripples) ripple.t = -9;
}

function addPop(scene: Scene, x: number, y: number, text: string, color: string, big = false) {
  const pop = scene.pops[scene.pop = (scene.pop + 1) % scene.pops.length];
  pop.x = x; pop.y = y; pop.t = scene.clock; pop.text = text; pop.color = color; pop.big = big;
}

/** The clap itself, drawn at once: a ring where you tapped. */
export function showClap(scene: Scene, x: number, y: number, hits: number) {
  const ripple = scene.ripples[scene.ripple = (scene.ripple + 1) % scene.ripples.length];
  ripple.x = x; ripple.y = y; ripple.t = scene.clock; ripple.hit = hits > 0;
}

/** What the afternoon's new events were, for the sounds: a bit for each kind of event, and the kind of the last bird to land. */
export const MASK = { shoo: 1, hop: 2, bossHit: 4, bossGone: 8, near: 16, land: 32, peck: 64, bossIn: 128, tenth: 256, miss: 512 } as const;
export type Heard = { mask: number; landed: number; hits: number };

/** Reads the afternoon's new events into pops and pulses. `calm` (ধীরে খেলো) changes nothing here; draw.hot.ts calms the motion. */
export function readEvents(scene: Scene, game: Game, heard: Heard) {
  heard.mask = 0; heard.landed = 0; heard.hits = 0;
  for (; scene.seen < game.eventCount; scene.seen++) {
    const event = game.events[scene.seen % game.events.length];
    if (event.kind === EV_SHOO) {
      heard.mask |= MASK.shoo; heard.hits = event.n; scene.jigT = scene.clock;
      addPop(scene, event.x, event.y - 34, hitWord(event.n, game.combo, scene.turn++), scene.palette.gold, event.n > 1);
    } else if (event.kind === EV_HOP) {
      heard.mask |= MASK.hop;
      addPop(scene, event.x, event.y - 30, "আরেকবার!", "#fff2c8");
    } else if (event.kind === EV_BOSS_HIT) {
      heard.mask |= MASK.bossHit; scene.bossHitT = scene.clock;
      addPop(scene, event.x, event.y - 44, `আর ${bn(event.n)} তালি!`, "#ffd166", true);
    } else if (event.kind === EV_BOSS_GONE) {
      heard.mask |= MASK.bossGone; scene.bossHitT = scene.clock;
      addPop(scene, event.x, event.y - 44, `${scene.bossName} পালাল!`, "#ffd166", true);
    } else if (event.kind === EV_NEAR) {
      heard.mask |= MASK.near;
      addPop(scene, event.x, event.y - 30, "একটুর জন্য", "#f2ead8");
    } else if (event.kind === EV_MISS) heard.mask |= MASK.miss;
    else if (event.kind === EV_LAND) { heard.mask |= MASK.land; heard.landed = event.n; }
    else if (event.kind === EV_PECK) heard.mask |= MASK.peck;
    else if (event.kind === EV_BOSS_IN) heard.mask |= MASK.bossIn;
    else if (event.kind === EV_TENTH) { heard.mask |= MASK.tenth; scene.tenthT = scene.clock; }
  }
  return heard;
}

export function tickScene(scene: Scene, dt: number) { scene.clock += dt; }
