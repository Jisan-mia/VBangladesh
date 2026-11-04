// Every frame of the shelf: the pre-rendered shop, then each thing's pre-rendered sprite moved from where it was to
// where it goes (the reveal slides moved things back, drops the gone ones in, lifts newcomers away), then the rings.
// Bitmaps only, read from buffers lib/scene.ts filled at setup: nothing is allocated here (npm run lint:games checks it).
import { clamp01, easeBack, easeInOut } from "./tick.hot";

/** Scene buffers: entry i draws sprite[i] from (x0, y0) to (x1, y1), alpha a0 → a1, starting at `delay` of the way. */
export type Scene = {
  n: number;
  sprite: Int16Array;
  x0: Float32Array; y0: Float32Array; x1: Float32Array; y1: Float32Array;
  a0: Float32Array; a1: Float32Array; delay: Float32Array; bounce: Uint8Array;
  rings: number; rx: Float32Array; ry: Float32Array; rgood: Uint8Array;
};

export function drawFrame(
  c: CanvasRenderingContext2D, back: CanvasImageSource, width: number, height: number,
  sprites: readonly (CanvasImageSource | null)[], sw: number, sh: number,
  ringGood: CanvasImageSource, ringBad: CanvasImageSource, rw: number, rh: number,
  scene: Scene, t: number,
) {
  c.clearRect(0, 0, width, height);
  c.drawImage(back, 0, 0, width, height);
  const ringAlpha = clamp01(t * 2.5);
  for (let i = 0; i < scene.rings; i++) {
    c.globalAlpha = ringAlpha;
    c.drawImage(scene.rgood[i] ? ringGood : ringBad, scene.rx[i], scene.ry[i], rw, rh);
  }
  for (let i = 0; i < scene.n; i++) {
    const image = sprites[scene.sprite[i]];
    if (!image) continue;
    const d = scene.delay[i], k = clamp01(d < 1 ? (t - d) / (1 - d) : 1);
    const e = scene.bounce[i] ? easeBack(k) : easeInOut(k);
    const alpha = scene.a0[i] + (scene.a1[i] - scene.a0[i]) * clamp01(k * 1.6);
    if (alpha <= 0.01) continue;
    c.globalAlpha = alpha;
    c.drawImage(image, scene.x0[i] + (scene.x1[i] - scene.x0[i]) * e, scene.y0[i] + (scene.y1[i] - scene.y0[i]) * e, sw, sh);
  }
  c.globalAlpha = 1;
}
