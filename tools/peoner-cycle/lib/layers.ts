// Sets up the scene for one stage size and one world: every still thing is painted once into offscreen sprites, and every
// string the HUD needs is made here, so draw.hot.ts only stamps sprites and touches preallocated pools.
// The camera is fixed: 360 units across the road (more verge on a wide stage) and at least 640 tall, the front wheel
// BIKE_BOTTOM units above the bottom, so the rider always sees well over 400 units of road ahead.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import { C, drawBike, drawCart, drawCow, drawGoat, drawLetter, drawPuddle, drawBanana, drawBush, drawHay, drawPalm, drawPond, drawRoof, drawMustard } from "./art";
import type { Course } from "./course";
import { LANE_W, LANES, ROAD_L, W } from "./geometry";
import { WORLDS, type Look } from "./levels";
import { bn } from "./link";
import { GATE_W, ROAD, drawBamboo, drawBanner, drawDog, drawGate, drawJute, drawLantern, drawVan, paintMud, paintWorldRoad } from "./world";

export type Sprite = { canvas: HTMLCanvasElement; w: number; h: number; ox: number; oy: number };

export const VIEW_W = W, VIEW_H = 640, BIKE_BOTTOM = 150;
export const TILE_H = 240, SEG = 84;
export const BIKE_SCALE = 1.15;
export const POPS = 8, FLUTTER = 6, FLIES = 6, RING_LIFE = 0.6;
export const FONT_BIG = `800 30px ${DISPLAY_FONT}`;
export const FONT_PILL = `800 17px ${DISPLAY_FONT}`;
export const FONT_SMALL = `700 12px ${DISPLAY_FONT}`;
export const FONT_POP = `800 16px ${DISPLAY_FONT}`;
export const FONT_PLACE = `800 13px ${DISPLAY_FONT}`;

/** Bangla numerals, made once. */
export const NUMBERS: string[] = [];
export const POPTEXT = ["+১০", "+৫", "ক্রিং +৫"] as const;
/** "২/৫" at DELIVERED[done * 21 + of]; "ধাক্কা ২/৩"-style strings are not used (wheels show it). */
export const FRACTIONS: string[] = [];
function strings() {
  if (NUMBERS.length) return;
  for (let value = 0; value <= 999; value++) NUMBERS.push(bn(value));
  for (let done = 0; done <= 20; done++) for (let of = 0; of <= 20; of++) FRACTIONS.push(`${bn(done)}/${bn(of)}`);
}

/** Props for a world: [art, half width, half height, scale]. Chosen per segment by the course's seed. */
type Prop = { draw: (context: CanvasRenderingContext2D) => void; hx: number; hy: number; scale: number; big: boolean };
const PROPS: Record<Look, Prop[]> = {
  dawn: [
    { draw: drawPalm, hx: 30, hy: 30, scale: 1.3, big: false }, { draw: drawBanana, hx: 26, hy: 26, scale: 1.25, big: false }, { draw: drawBush, hx: 16, hy: 14, scale: 1.15, big: false },
    { draw: drawHay, hx: 22, hy: 21, scale: 1.15, big: false }, { draw: drawPond, hx: 29, hy: 39, scale: 1, big: true }, { draw: drawRoof, hx: 36, hy: 30, scale: 1, big: true }, { draw: drawMustard, hx: 25, hy: 31, scale: 1, big: false },
  ],
  noon: [
    { draw: drawBamboo, hx: 28, hy: 24, scale: 1.2, big: false }, { draw: drawJute, hx: 25, hy: 31, scale: 1, big: false }, { draw: drawBush, hx: 16, hy: 14, scale: 1.15, big: false },
    { draw: drawPond, hx: 29, hy: 39, scale: 1, big: true }, { draw: drawBanana, hx: 26, hy: 26, scale: 1.25, big: false }, { draw: drawRoof, hx: 36, hy: 30, scale: 1, big: true }, { draw: drawHay, hx: 22, hy: 21, scale: 1.15, big: false },
  ],
  dusk: [
    { draw: drawPalm, hx: 30, hy: 30, scale: 1.3, big: false }, { draw: drawBush, hx: 16, hy: 14, scale: 1.15, big: false }, { draw: drawRoof, hx: 36, hy: 30, scale: 1, big: true },
    { draw: drawBanana, hx: 26, hy: 26, scale: 1.25, big: false }, { draw: drawPond, hx: 29, hy: 39, scale: 1, big: true }, { draw: drawBamboo, hx: 28, hy: 24, scale: 1.2, big: false },
  ],
};

/** Where each thing's sprite box sits around its origin: [width, height, ox, oy]. */
const THING_BOX = [[72, 46, 34, 40], [42, 56, 19, 52], [68, 92, 32, 86], [60, 114, 28, 108], [44, 34, 22, 28]] as const;
const DRAW_THING = [drawPuddle, drawGoat, drawCart, drawCow, drawLetter] as const;

/** The light of each world on top of everything but the HUD: [top colour, bottom colour] of a gradient over the upper 40%. */
const SKY = [["rgba(255,196,150,0.55)", "rgba(255,226,190,0)"], ["rgba(255,255,255,0.35)", "rgba(255,255,255,0)"], ["rgba(18,28,60,0.62)", "rgba(18,28,60,0)"]] as const;

export type Scene = {
  context: CanvasRenderingContext2D; ratio: number; k: number; cssW: number; cssH: number;
  /** Units across (≥ 360), units tall (≥ 640), the extra verge on each side, where the front wheel stands from the top. */
  viewW: number; viewH: number; xOff: number; bikeY: number;
  look: Look; world: number; storm: boolean;
  road: Sprite; mud: Sprite; props: Sprite[]; things: Sprite[][]; vans: Sprite[]; walkers: Sprite[][]; dogs: Sprite[];
  bike: Sprite[]; gates: Sprite[]; gateX: Float32Array; letter: Sprite; lantern: Sprite; lanternDim: Sprite; banner: Sprite; wheel: Sprite; wheelOff: Sprite;
  sky: Sprite; dark: Sprite | null; rain: Sprite | null;
  edgeTop: Sprite; edgeBottom: Sprite; edgeSide: Sprite; edgeRed: Sprite; rim: Sprite;
  /** The bound route: the props table, the place's name, the gates' sprites. */
  course: Course | null; propKind: Int8Array; propDx: Int8Array; propDy: Uint8Array; propCount: number;
  deliverAt: Float32Array;
  /** Time, the rolling title road, the bike's coast after the place, what the last tick saw of the ride. */
  clock: number; roll: number; coast: number; bikeX: number; bikeD: number; bikeV: number; lean: number; hudTop: number;
  /** Juice. */
  bellAt: number; bumpAt: number; finishAt: number; gustAt: number; gustDir: number; gustWarnAt: number; dangerTop: number; dangerBottom: number; flashRed: number; shake: number;
  popT: Float32Array; popX: Float32Array; popY: Float32Array; popKind: Uint8Array; popNext: number;
  flyT: Float32Array; flyX: Float32Array; flyY: Float32Array; flyTX: Float32Array; flyTY: Float32Array; flyKind: Uint8Array; flyNext: number;
  fluX: Float32Array; fluY: Float32Array; fluVX: Float32Array; fluVY: Float32Array; fluR: Float32Array; fluT: number;
  notchAt: Float32Array;
  shownScore: number; scoreText: string; placeText: string; finaleText: string;
};

/** Paints a `w`×`h` unit box into a canvas at `px` device pixels a unit; (ox, oy) is where the drawing's origin sits in it. */
export function sprite(w: number, h: number, ox: number, oy: number, px: number, paint: (context: CanvasRenderingContext2D) => void): Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(w * px)); canvas.height = Math.max(1, Math.ceil(h * px));
  const context = canvas.getContext("2d")!;
  context.setTransform(px, 0, 0, px, ox * px, oy * px);
  paint(context);
  return { canvas, w, h, ox, oy };
}

const hash = (index: number) => {
  let h = Math.imul(index ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
};

/** A sideways animal: the goat or cow art turned to face `dir` (−1 left, 1 right), fitted into w × len. */
function sideways(context: CanvasRenderingContext2D, paint: (c: CanvasRenderingContext2D, look: number) => void, look: number, dir: number, artLen: number, w: number, len: number) {
  context.translate(0, -len / 2);
  context.rotate(dir * Math.PI / 2);
  context.scale(w / artLen, w / artLen);
  context.translate(0, artLen / 2);
  paint(context, look);
}

function edgeGlow(width: number, height: number, side: "top" | "bottom" | "side" | "rim", colour: string, px: number) {
  return sprite(width, height, 0, 0, px, context => {
    let gradient: CanvasGradient;
    if (side === "top") { gradient = context.createLinearGradient(0, 0, 0, height); gradient.addColorStop(0, colour); gradient.addColorStop(1, "rgba(255,122,26,0)"); }
    else if (side === "bottom") { gradient = context.createLinearGradient(0, height, 0, 0); gradient.addColorStop(0, colour); gradient.addColorStop(1, "rgba(255,122,26,0)"); }
    else if (side === "side") { gradient = context.createLinearGradient(0, 0, width, 0); gradient.addColorStop(0, colour); gradient.addColorStop(1, "rgba(255,122,26,0)"); }
    else {
      gradient = context.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.42, width / 2, height / 2, Math.max(width, height) * 0.7);
      gradient.addColorStop(0, "rgba(255,150,40,0)"); gradient.addColorStop(1, colour);
    }
    context.fillStyle = gradient; context.fillRect(0, 0, width, height);
  });
}

export function makeScene(canvas: HTMLCanvasElement, cssW: number, cssH: number, look: Look, previous: Scene | null): Scene {
  strings();
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(cssW * ratio); canvas.height = Math.round(cssH * ratio);
  const context = canvas.getContext("2d")!;
  const k = Math.min(cssW / VIEW_W, cssH / VIEW_H), viewW = cssW / k, viewH = cssH / k, xOff = (viewW - W) / 2, px = k * ratio;
  const world = WORLDS.findIndex(item => item.id === look), bikeY = viewH - BIKE_BOTTOM;
  const palette = ROAD[world];

  const road = sprite(viewW, TILE_H, 0, 0, px, c => paintWorldRoad(c, palette, world, viewW, TILE_H, ROAD_L + xOff, LANE_W, LANES));
  const mud = sprite(LANES * LANE_W, 140, 0, 0, px, c => paintMud(c, LANES * LANE_W, 140));
  const props = PROPS[look].map(item => sprite((item.hx * 2 + 10) * item.scale, (item.hy * 2 + 10) * item.scale, (item.hx + 3) * item.scale, (item.hy + 3) * item.scale, px, c => { c.scale(item.scale, item.scale); item.draw(c); }));
  const things = THING_BOX.map(([w, h, ox, oy], kind) => [0, 1, 2].map(variant => sprite(w, h, ox, oy, px, c => DRAW_THING[kind](c, variant))));
  const vans = [0, 1].map(variant => sprite(64, 98, 32, 92, px, c => drawVan(c, variant)));
  const walkers = [[-1, 1].map(dir => sprite(52, 48, 26, 42, px, c => sideways(c, drawGoat, 0, dir, 46, 38, 26))), [-1, 1].map(dir => sprite(76, 56, 38, 48, px, c => sideways(c, drawCow, 0, dir, 100, 60, 38)))];
  const dogs = [0, 1].map(frame => sprite(30, 46, 15, 42, px, c => drawDog(c, frame)));
  const bike = [0, 1].map(pedal => sprite(44 * BIKE_SCALE + 10, 72 * BIKE_SCALE + 10, 22 * BIKE_SCALE + 5, 4 * BIKE_SCALE + 5, px, c => { c.scale(BIKE_SCALE, BIKE_SCALE); drawBike(c, pedal); }));
  const gateBox = [GATE_W + 40, 90] as const;
  const gates: Sprite[] = [];
  for (let variant = 0; variant < 3; variant++) for (let side = 0; side < 2; side++) for (let state = 0; state < 4; state++) {
    // States: 0, 1 waiting (two frames of the wave), 2 the letter in the hand, 3 hand down.
    gates.push(sprite(gateBox[0], gateBox[1], gateBox[0] / 2, gateBox[1] / 2, px, c => { c.scale(0.8, 0.8); drawGate(c, variant, side, state === 0 || state === 1 ? 0 : state === 2 ? 1 : 2, state === 0 ? 0.8 : 2.4); }));
  }
  const gateX = new Float32Array(2);
  gateX[0] = ROAD_L - 35; gateX[1] = W - ROAD_L + 35;
  const storm = look === "dusk";
  const sky = sprite(viewW, viewH * 0.4, 0, 0, px, c => {
    const g = c.createLinearGradient(0, 0, 0, viewH * 0.4);
    g.addColorStop(0, SKY[world][0]); g.addColorStop(1, SKY[world][1]);
    c.fillStyle = g; c.fillRect(0, 0, viewW, viewH * 0.4);
  });
  const rain = look === "dusk" ? sprite(viewW, 260, 0, 0, px, c => {
    c.strokeStyle = "rgba(210,225,255,0.5)"; c.lineWidth = 1; c.lineCap = "round";
    let seed = 5;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < viewW / 5; i++) { const x = rand() * viewW, y = rand() * 260; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 5, y + 18); c.stroke(); }
  }) : null;
  const lantern = sprite(60, 60, 30, 30, px, c => drawLantern(c, true));
  const lanternDim = sprite(60, 60, 30, 30, px, c => drawLantern(c, false));
  const banner = sprite(LANES * LANE_W + 24, 70, (LANES * LANE_W + 24) / 2, 62, px, c => drawBanner(c, LANES * LANE_W + 8));
  const wheel = sprite(14, 14, 7, 7, px, c => { c.fillStyle = "#fffaf0"; c.beginPath(); c.arc(0, 0, 5.4, 0, Math.PI * 2); c.fill(); c.strokeStyle = C.ink; c.lineWidth = 1.6; c.beginPath(); c.arc(0, 0, 5.4, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(-5, 0); c.lineTo(5, 0); c.moveTo(0, -5); c.lineTo(0, 5); c.stroke(); });
  const wheelOff = sprite(14, 14, 7, 7, px, c => { c.strokeStyle = "#ffffff66"; c.lineWidth = 1.6; c.setLineDash([2, 2]); c.beginPath(); c.arc(0, 0, 5.4, 0, Math.PI * 2); c.stroke(); });

  const scene: Scene = {
    context, ratio, k, cssW, cssH, viewW, viewH, xOff, bikeY, look, world, storm,
    road, mud, props, things, vans, walkers, dogs, bike, gates, gateX, letter: things[4][1], lantern, lanternDim, banner, wheel, wheelOff, sky,
    dark: null, rain,
    edgeTop: edgeGlow(viewW, 86, "top", "rgba(255,122,26,0.85)", ratio), edgeBottom: edgeGlow(viewW, 86, "bottom", "rgba(255,122,26,0.85)", ratio),
    edgeSide: edgeGlow(60, viewH, "side", "rgba(255,200,80,0.55)", ratio), edgeRed: edgeGlow(viewW, 70, "bottom", "rgba(230,57,70,0.9)", ratio),
    rim: edgeGlow(viewW, viewH, "rim", "rgba(255,140,30,0.5)", ratio),
    course: null, propKind: new Int8Array(0), propDx: new Int8Array(0), propDy: new Uint8Array(0), propCount: 0,
    deliverAt: new Float32Array(24).fill(-9),
    clock: previous?.clock ?? 0, roll: previous?.roll ?? 0, coast: 0, bikeX: 180, bikeD: 0, bikeV: 0, lean: 0, hudTop: previous?.hudTop ?? 10,
    bellAt: -9, bumpAt: -9, finishAt: -9, gustAt: -9, gustDir: 1, gustWarnAt: -9, dangerTop: 0, dangerBottom: 0, flashRed: 0, shake: 0,
    popT: new Float32Array(POPS).fill(-9), popX: new Float32Array(POPS), popY: new Float32Array(POPS), popKind: new Uint8Array(POPS), popNext: 0,
    flyT: new Float32Array(FLIES).fill(-9), flyX: new Float32Array(FLIES), flyY: new Float32Array(FLIES), flyTX: new Float32Array(FLIES), flyTY: new Float32Array(FLIES), flyKind: new Uint8Array(FLIES), flyNext: 0,
    fluX: new Float32Array(FLUTTER), fluY: new Float32Array(FLUTTER), fluVX: new Float32Array(FLUTTER), fluVY: new Float32Array(FLUTTER), fluR: new Float32Array(FLUTTER), fluT: -9,
    notchAt: new Float32Array(16).fill(-9),
    shownScore: -1, scoreText: "", placeText: "", finaleText: "",
  };
  if (previous?.course) bindCourse(scene, previous.course);
  return scene;
}

/** The dusk's fading light: opaque dark beyond `sight` units ahead of the front wheel, clear closer than 55% of it. */
function darkness(scene: Scene, sight: number) {
  const px = scene.k * scene.ratio, top = scene.bikeY;
  return sprite(scene.viewW, scene.viewH, 0, 0, px, c => {
    const g = c.createLinearGradient(0, top, 0, top - sight);
    g.addColorStop(0, "rgba(10,16,38,0)"); g.addColorStop(0.55, "rgba(10,16,38,0)"); g.addColorStop(1, "rgba(10,16,38,0.96)");
    c.fillStyle = g; c.fillRect(0, 0, scene.viewW, top);
    c.fillStyle = "rgba(10,16,38,0.96)"; c.fillRect(0, 0, scene.viewW, Math.max(0, top - sight));
  });
}

/** (Re)binds a route: the props table for its length, the dark for its sight, the place's name and the finale's. */
export function bindCourse(scene: Scene, course: Course | null) {
  scene.course = course;
  scene.dark = null; scene.coast = 0; scene.deliverAt.fill(-9); scene.notchAt.fill(-9);
  if (!course) return;
  const list = PROPS[scene.look], count = Math.ceil((course.end + 2 * 900) / SEG) + 4;
  scene.propKind = new Int8Array(count * 2); scene.propDx = new Int8Array(count * 2); scene.propDy = new Uint8Array(count * 2); scene.propCount = count;
  for (let index = 0; index < count; index++) for (let side = 0; side < 2; side++) {
    const h = hash(course.seed * 31 + index * 2 + side + course.level * 7919), kind = h % 9, slot = index * 2 + side;
    scene.propKind[slot] = kind >= list.length ? -1 : kind;
    scene.propDx[slot] = ((h >>> 8) % 14) - 7;
    scene.propDy[slot] = (h >>> 12) % 50;
  }
  if (course.sight !== Infinity) scene.dark = darkness(scene, course.sight);
  scene.placeText = course.spec.place;
  scene.finaleText = course.spec.boss?.name ?? "";
}

export const propsFor = (look: Look) => PROPS[look];
export const worldName = (world: number) => WORLDS[world].name;
