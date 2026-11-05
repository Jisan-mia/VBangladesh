// What the scene is made of: the sprites painted once for a world at the phone's size, and the small effects state (pops, flashes,
// shakes). Built when the river is measured, never per frame. The per-frame drawing is in draw.hot.ts.
import { BANK, BOAT_LEN, H, LANE_W, W } from "./course";
import { DRUM_Y, SCHEMES, drawBoat, drawPatch, drawRope, paintBanks, paintCurrent, paintNight, paintReeds, paintWater } from "./paint";

export type Sprite = { canvas: HTMLCanvasElement; w: number; h: number; ox: number; oy: number };
export const TILE = 480;
/** The night's mask is this many units across, centred on your bow, so it covers the whole river however the bow moves. */
export const NIGHT = 1000;

export type Layers = {
  /** Logical units to CSS px, and where the river's box sits inside the canvas (the box is centred). */
  scale: number; ox: number; oy: number; width: number; height: number; ratio: number;
  /** How many units of river the box shows: the field's 500, plus extra behind the boats when the box is taller. */
  viewH: number;
  world: number; night: boolean;
  water: Sprite; banks: Sprite; boats: Sprite[]; patches: Sprite[]; reeds: Sprite; current: Sprite; rope: Sprite; mask: Sprite | null;
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

/** The sprites for a river box of `width`×`height` CSS px at device pixel ratio `ratio`. The 360×500 field is fitted and centred in it. */
export function buildLayers(width: number, height: number, ratio: number, world: number, night: boolean): Layers {
  const scale = Math.min(width / W, height / H), k = scale * ratio;
  return {
    scale, ox: (width - W * scale) / 2, oy: 0, width, height, ratio, world, night, viewH: Math.min(720, Math.max(H, height / scale)),
    water: sprite(W, TILE, 0, 0, k, c => paintWater(c, W, TILE, world)),
    banks: sprite(W, TILE, 0, 0, k, c => paintBanks(c, W, TILE, world)),
    boats: SCHEMES.map((scheme, index) => sprite(40, 160, 20, 20, k, c => drawBoat(c, scheme, index === 0, index === 4))),
    patches: [0, 1, 2].map(look => sprite(56, 64, 28, 32, k, c => drawPatch(c, look, world === 2))),
    reeds: sprite(LANE_W, 96, 0, 0, k, c => paintReeds(c, world)),
    current: sprite(LANE_W, 96, 0, 0, k, paintCurrent),
    rope: sprite(W, 16, 0, 5, k, c => drawRope(c, W)),
    mask: night ? sprite(NIGHT, NIGHT, 0, 0, k * 0.35, c => paintNight(c, NIGHT)) : null,
  };
}

export const POPS = 6, POP_LIFE = 0.85;
/** Pop words, one per kind: fixed strings so no frame builds one. */
export const POP_TEXT = ["তালে!", "দারুণ!", "বড় টান!", "একটু আগে", "একটু পরে", "পানায় আটকালে", "পাশে নৌকা", "হাওয়া!", "খালে ঢুকলে", "শেষ টান!", "ছন্দ জমেছে"] as const;
export const POP_GOOD = 0, POP_PERFECT = 1, POP_BIG = 2, POP_EARLY = 3, POP_LATE = 4, POP_SNAG = 5, POP_BLOCK = 6, POP_GUST = 7, POP_SQUEEZE = 8, POP_SURGE = 9, POP_RHYTHM = 10;
export const POP_COLOR = ["#ffe08a", "#ffd166", "#ffc247", "#fff6e4", "#fff6e4", "#ffe2c4", "#fff6e4", "#dff1ff", "#ffe9b0", "#ffb3a8", "#ffe08a"] as const;

export type Fx = {
  clock: number; seen: number; slow: boolean;
  popT: Float32Array; popX: Float32Array; popY: Float32Array; popKind: Uint8Array; popNext: number;
  /** When the last catch happened (a ring flash and a wider oar sweep), how big it was (1 good, 2 perfect), and the shake and bump moments. */
  hitAt: number; hitSize: number; shakeAt: number; blockedAt: number; blockedSide: number; gustAt: number; gustDir: number; beatAt: number;
};
export const makeFx = (): Fx => ({
  clock: 0, seen: 0, slow: false,
  popT: new Float32Array(POPS).fill(-9), popX: new Float32Array(POPS), popY: new Float32Array(POPS), popKind: new Uint8Array(POPS), popNext: 0,
  hitAt: -9, hitSize: 0, shakeAt: -9, blockedAt: -9, blockedSide: 0, gustAt: -9, gustDir: 0, beatAt: -9,
});
/** A fresh race: forget the last one's pops and flashes. */
export function resetFx(fx: Fx, eventCount: number) {
  fx.seen = eventCount; fx.popT.fill(-9); fx.hitAt = -9; fx.shakeAt = -9; fx.blockedAt = -9; fx.gustAt = -9; fx.beatAt = -9;
}

export { BANK, BOAT_LEN, DRUM_Y };

/** The pad's drum, painted once at the pad's size. */
export type PadArt = { canvas: HTMLCanvasElement; w: number; h: number; r: number; cx: number; cy: number; ratio: number };
export function buildPad(w: number, h: number, ratio: number): PadArt {
  const r = Math.min(h * 0.34, w * 0.3), cx = w / 2, cy = h * 0.46;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(w * ratio); canvas.height = Math.ceil(h * ratio);
  const c = canvas.getContext("2d")!;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawDrum(c, cx, cy, r);
  return { canvas, w, h, r, cx, cy, ratio };
}
import { drawDrum } from "./paint";

import type { Hud } from "./draw.hot";
import type { PadLook } from "./pad.hot";
export const makeHud = (): Hud => ({ tenths: 0, place: 1, streak: 0, started: false, along: new Uint8Array(4), edge: "", count: 0, surging: false });
export const makePadLook = (): PadLook => ({ delta: Infinity, window: 0.25, accent: false, calm: false, hit: 0, hitKind: 0, word: 0, bump: 0 });
