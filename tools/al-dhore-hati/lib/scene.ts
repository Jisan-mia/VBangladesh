// The drawing state around the walk: the painted layers (sky, paddy tile, the lantern's dark), the board's height and scale.
// draw.hot.ts reads it every frame; this file builds it, so nothing here runs per frame.
import { makeLayers, type Layers } from "./art";
import { AHEAD, FEET_UP, horizonFor, MAX_H, MIN_H, W } from "./field";
import type { Scene } from "./levels";

export type Look = {
  layers: Layers | null;
  scene: Scene | null;
  /** The lantern's dark, one soft radial layer drawn around the walker; null in daylight. */
  dark: HTMLCanvasElement | null;
  darkRadius: number;
  /** Board height in board units (MIN_H..MAX_H) and the walker's feet height. */
  bh: number;
  feetY: number;
  /** Where the sky ends and the field begins, y in board units. */
  horizon: number;
  /** Canvas px per board unit, and the device pixel ratio folded in. */
  scale: number;
  k: number;
  /** Slow mode or reduced motion: no flapping, pulsing or streak drift. */
  calm: boolean;
  /** The ridge's middle at each drawn row, filled every frame. */
  rowX: Float32Array;
  rowY: Float32Array;
};

export const makeLook = (): Look => ({
  layers: null, scene: null, dark: null, darkRadius: 0, bh: MIN_H, feetY: MIN_H - FEET_UP, horizon: MIN_H - FEET_UP - AHEAD, scale: 1, k: 1, calm: false,
  rowX: new Float32Array(96), rowY: new Float32Array(96),
});

/** The board's height for a stage `width` × `height` px: as tall as fits, between `min` and MAX_H. */
export const boardHeight = (width: number, height: number, min = MIN_H) => Math.round(Math.min(MAX_H, Math.max(min, (height / Math.max(1, width)) * W)));

/** Sets the board's size and the canvas scale. `scale` is CSS px per board unit; `ratio` is the device pixel ratio (capped at 2). */
export function sizeLook(look: Look, bh: number, scale: number, ratio: number) {
  look.bh = bh; look.feetY = bh - FEET_UP; look.horizon = horizonFor(bh); look.scale = scale; look.k = scale * ratio;
}

/** The soft dark with a lit hole `radius` px wide: warm at the lamp, black far out. Drawn small and scaled up, as it is smooth. */
function paintDark(look: Look, radius: number) {
  const q = 0.3, k = look.k * q, layer = look.dark ?? document.createElement("canvas");
  layer.width = Math.round(2 * W * k); layer.height = Math.round(2 * MAX_H * k);
  const c = layer.getContext("2d");
  if (!c) return layer;
  c.setTransform(k, 0, 0, k, 0, 0);
  const g = c.createRadialGradient(W, MAX_H, 0, W, MAX_H, radius * 1.7);
  g.addColorStop(0, "rgba(255,206,130,0.14)");
  g.addColorStop(0.42, "rgba(60,40,60,0.04)");
  g.addColorStop(0.75, "rgba(18,12,38,0.6)");
  g.addColorStop(1, "rgba(10,7,28,0.9)");
  c.fillStyle = g; c.fillRect(0, 0, 2 * W, 2 * MAX_H);
  return layer;
}

/** Paints the layers again for a scene, a lantern radius and the current scale. Called on a new scene or a resize. */
export function paintLook(look: Look, scene: Scene, darkRadius: number) {
  look.layers = makeLayers(scene, look.k, look.horizon, look.scene === scene ? look.layers : null);
  look.scene = scene;
  look.darkRadius = darkRadius;
  look.dark = darkRadius > 0 ? paintDark(look, darkRadius) : null;
}
