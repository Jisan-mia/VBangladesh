// Sets up the scene for one stage size, world and flight: every still thing is painted once into offscreen canvases here,
// and every string the HUD needs is made here too, so draw.hot.ts only stamps sprites and touches preallocated pools.
// The camera fits 300 u across and the whole 630 u height (from just under the floor to the ceiling) on any stage.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import type { Course } from "./physics";
import { A, RECT, WORLD_H } from "./physics";
import { WORLDS, type Look } from "./levels";
import { bn } from "./link";
import {
  PALETTES, paintBackdrop, paintBench, paintBird, paintCandy, paintChhoi, paintCrumple, paintEdge, paintFarWall, paintGhat, paintHull, paintKite,
  paintPadTop, paintPlane, paintRoof, paintShelf, paintTank, type Palette,
} from "./paint";

export type Sprite = { canvas: HTMLCanvasElement; w: number; h: number };

export const VIEW_MIN_W = 300, BELOW = 30, VIEW_H = WORLD_H + BELOW;
export const PLANE_LEN = 40, CANDY_SIZE = 9, KITE_SIZE = 14, BIRD_SIZE = 34;
export const SPARKS = 72, POPUPS = 8, TRAIL = 28;
export const FONT_HUD = `800 17px ${DISPLAY_FONT}`;
export const FONT_SMALL = `700 12px ${DISPLAY_FONT}`;
export const FONT_POP = `800 16px ${DISPLAY_FONT}`;

/** Bangla numerals, "+১০" pops and "১২ মি." distances, made once. */
export const NUMBERS: string[] = [];
export const PLUS: string[] = [];
export const METERS: string[] = [];
/** "৩/৮" for every candy count over every total, at FRACTIONS[count * 41 + total]. */
export const FRACTIONS: string[] = [];
function strings() {
  if (NUMBERS.length) return;
  for (let count = 0; count <= 40; count++) for (let total = 0; total <= 40; total++) FRACTIONS.push(`${bn(count)}/${bn(total)}`);
  for (let value = 0; value <= 999; value++) NUMBERS.push(bn(value));
  for (let value = 0; value <= 60; value++) PLUS.push(`+${bn(value * 10)}`);
  for (let value = 0; value <= 200; value++) METERS.push(`${bn(value)} মি.`);
}

export type Scene = {
  context: CanvasRenderingContext2D; ratio: number; k: number; cssW: number; cssH: number;
  /** Units across, units tall, and the world y at the top of the screen (the bottom is y = −30). */
  viewW: number; viewH: number; top: number;
  look: Look; palette: Palette;
  bg: HTMLCanvasElement; backdrop: Sprite; farWall: Sprite;
  plane: Sprite; planeWet: Sprite; crumple: Sprite; candy: Sprite; kites: Sprite[]; birdUp: Sprite; birdDown: Sprite;
  edgeBottom: Sprite; edgeTop: Sprite; edgeRight: Sprite; edgeRed: Sprite;
  /** One sprite per solid shape of the bound flight (null for fans and rods, drawn live). */
  rectSprites: (Sprite | null)[]; padBody: Sprite | null; padTop: Sprite | null; course: Course | null;
  camX: number; clock: number; shake: number; flash: number; landGlow: number;
  trail: Float32Array; trailHead: number; trailCount: number;
  spark: Float32Array; pop: Float32Array;
  noise: number;
};

/** Paints `w`×`h` units into a canvas at `px` device pixels per unit. */
export function sprite(w: number, h: number, px: number, paint: (context: CanvasRenderingContext2D) => void, ox = 0, oy = 0): Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(w * px)); canvas.height = Math.max(1, Math.ceil(h * px));
  const context = canvas.getContext("2d")!;
  context.setTransform(px, 0, 0, px, ox * px, oy * px);
  paint(context);
  return { canvas, w, h };
}

function rectSprite(course: Course, index: number, px: number, palette: Palette, look: Look): Sprite | null {
  const base = index * RECT, rects = course.rects, w = rects[base + 2] - rects[base], h = rects[base + 3] - rects[base + 1], art = rects[base + 4];
  if (art === A.fan || art === A.rod) return null;
  const pad = 8;
  return sprite(w + pad * 2, h + pad, px, context => {
    context.translate(pad, pad);
    if (art === A.bench) paintBench(context, w, h, palette);
    else if (art === A.shelf) paintShelf(context, w, h);
    else if (art === A.roof) paintRoof(context, w, h, palette, index);
    else if (art === A.tank) paintTank(context, w, h);
    else if (art === A.hull) paintHull(context, w, h, palette);
    else if (art === A.chhoi) paintChhoi(context, w, h, palette);
    else if (art === A.ghat) paintGhat(context, w, h);
    else { context.fillStyle = palette.solid; context.fillRect(0, 0, w, h); }
    void look;
  });
}

/** (Re)binds a flight: one sprite per solid shape and the landing place. */
export function bindCourse(scene: Scene, course: Course | null) {
  scene.course = course;
  scene.rectSprites = [];
  scene.padBody = null; scene.padTop = null;
  if (!course) return;
  const px = scene.k * scene.ratio;
  for (let index = 0; index < course.rectCount; index++) scene.rectSprites.push(rectSprite(course, index, px, scene.palette, scene.look));
  const pad = course.pad, w = pad.x1 - pad.x0;
  if (scene.look === "roof") scene.padBody = sprite(w + 16, pad.depth + 8, px, context => { context.translate(8, 8); paintRoof(context, w, pad.depth, scene.palette, 3); });
  else if (scene.look === "river") scene.padBody = sprite(w + 16, pad.depth + 8, px, context => {
    context.translate(8, 8);
    paintChhoi(context, w * 0.62, pad.depth - 26, scene.palette);
    context.translate(-w * 0.19, pad.depth - 26); paintHull(context, w, 26, scene.palette);
  });
  else scene.padBody = sprite(w + 16, pad.depth + 8, px, context => {
    // The teacher's table: a thick top on four legs, a drawer.
    context.translate(8, 8);
    context.fillStyle = "#5a3418"; context.fillRect(w * 0.04, 8, 10, pad.depth - 8); context.fillRect(w * 0.92, 8, 10, pad.depth - 8);
    context.fillStyle = "#7a4a26"; context.fillRect(w * 0.25, 10, w * 0.5, 22); context.fillStyle = "#e9d28a"; context.fillRect(w * 0.48, 19, 12, 4);
  });
  scene.padTop = sprite(w + 16, 24, px, context => { context.translate(8, 16); paintPadTop(context, w, scene.look); });
}

export function makeScene(canvas: HTMLCanvasElement, cssW: number, cssH: number, look: Look, previous: Scene | null): Scene {
  strings();
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(cssW * ratio); canvas.height = Math.round(cssH * ratio);
  const context = canvas.getContext("2d")!;
  const k = Math.min(cssW / VIEW_MIN_W, cssH / VIEW_H), viewW = cssW / k, viewH = cssH / k, top = viewH - BELOW;
  const palette = PALETTES[look], px = k * ratio;

  const bg = document.createElement("canvas");
  bg.width = canvas.width; bg.height = canvas.height;
  const g = bg.getContext("2d")!, sky = g.createLinearGradient(0, 0, 0, bg.height);
  sky.addColorStop(0, palette.sky[0]); sky.addColorStop(0.55, palette.sky[1]); sky.addColorStop(1, palette.sky[2]);
  g.fillStyle = sky; g.fillRect(0, 0, bg.width, bg.height);
  if (look === "roof") { g.fillStyle = "#fff3c4"; g.beginPath(); g.arc(bg.width * 0.78, bg.height * 0.18, 34 * px, 0, Math.PI * 2); g.fill(); }
  if (look === "river") { g.fillStyle = "#ffd9a0"; g.globalAlpha = 0.7; g.beginPath(); g.arc(bg.width * 0.3, bg.height * 0.62, 26 * px, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }

  const tile = 600;
  const backdrop = sprite(tile, WORLD_H, px * 0.75, context => paintBackdrop(context, tile, WORLD_H, look, palette));
  const farWall = sprite(260, WORLD_H + 40, px, context => paintFarWall(context, 260, WORLD_H + 40, look));
  const plane = sprite(PLANE_LEN + 4, PLANE_LEN * 0.6, px * 1.5, context => paintPlane(context, PLANE_LEN, 0), PLANE_LEN / 2 + 2, PLANE_LEN * 0.32);
  const planeWet = sprite(PLANE_LEN + 4, PLANE_LEN * 0.6, px * 1.5, context => paintPlane(context, PLANE_LEN, 1), PLANE_LEN / 2 + 2, PLANE_LEN * 0.32);
  const crumple = sprite(20, 20, px, context => paintCrumple(context, 8), 10, 10);
  const candy = sprite(CANDY_SIZE * 4, CANDY_SIZE * 2.4, px * 1.5, context => paintCandy(context, CANDY_SIZE), CANDY_SIZE * 2, CANDY_SIZE * 1.2);
  const kites: Sprite[] = [];
  for (let colour = 0; colour < 5; colour++) kites.push(sprite(KITE_SIZE * 2, KITE_SIZE * 2.2, px, context => paintKite(context, KITE_SIZE, colour), KITE_SIZE, KITE_SIZE * 1.1));
  const birdUp = sprite(BIRD_SIZE * 1.3, BIRD_SIZE, px, context => paintBird(context, BIRD_SIZE, true), BIRD_SIZE * 0.65, BIRD_SIZE * 0.55);
  const birdDown = sprite(BIRD_SIZE * 1.3, BIRD_SIZE, px, context => paintBird(context, BIRD_SIZE, false), BIRD_SIZE * 0.65, BIRD_SIZE * 0.45);
  const edge = (side: "bottom" | "right" | "top", colour: string) => {
    const w = side === "right" ? 60 : viewW, h = side === "right" ? viewH : 70;
    return sprite(w, h, ratio, context => paintEdge(context, w, h, side, colour));
  };

  const scene: Scene = {
    context, ratio, k, cssW, cssH, viewW, viewH, top, look, palette, bg, backdrop, farWall,
    plane, planeWet, crumple, candy, kites, birdUp, birdDown,
    edgeBottom: edge("bottom", "#ff7a1ad0"), edgeTop: edge("top", "#ff7a1ad0"), edgeRight: edge("right", "#ff7a1ad0"), edgeRed: edge("bottom", "#e63946e0"),
    rectSprites: [], padBody: null, padTop: null, course: null,
    camX: previous?.camX ?? -40, clock: previous?.clock ?? 0, shake: 0, flash: 0, landGlow: 0,
    trail: new Float32Array(TRAIL * 2), trailHead: 0, trailCount: 0,
    // Sparks: life, x, y, vx, vy, kind. Pops: life, x, y, value.
    spark: new Float32Array(SPARKS * 6), pop: new Float32Array(POPUPS * 4),
    noise: 12345,
  };
  if (previous?.course) bindCourse(scene, previous.course);
  return scene;
}

export const lookOf = (world: number) => WORLDS[world].look;
