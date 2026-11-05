// Every animation frame of the pictures: still layers and moving sprites blitted in drawing order, and the লোডশেডিং dark
// with the হারিকেন's hole. Numbers and prebuilt canvases in; no objects, arrays, closures or strings made here.

/** Floats per part in Layers.data: kind (0 still layer, 1 bob, 2 drift, 3 sway), anchor x/y, sprite x/y/w/h, amp, period, phase. */
export const STRIDE = 10;
const TAU = Math.PI * 2;

/** Paints one picture at scene time `t` seconds. `scale` is device pixels per scene unit; `speed` slows motion (ধীরে খেলো). */
export function paintPicture(c: CanvasRenderingContext2D, width: number, height: number, images: readonly CanvasImageSource[], data: Float64Array, count: number, scale: number, t: number, speed: number) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, width, height);
  for (let index = 0; index < count; index++) {
    const at = index * STRIDE, kind = data[at];
    if (kind === 0) { c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(images[index], 0, 0); continue; }
    const wave = Math.sin((TAU * t * speed) / data[at + 8] + data[at + 9]), amp = data[at + 7];
    const dx = kind === 2 ? amp * wave : 0, dy = kind === 1 ? amp * wave : 0, turn = kind === 3 ? (amp * wave * Math.PI) / 180 : 0;
    const cos = Math.cos(turn), sin = Math.sin(turn);
    c.setTransform(scale * cos, scale * sin, -scale * sin, scale * cos, scale * (data[at + 1] + dx), scale * (data[at + 2] + dy));
    c.drawImage(images[index], data[at + 3], data[at + 4], data[at + 5], data[at + 6]);
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
}

/**
 * The dark over one picture: night everywhere, cut away round the lamp (radius `r` scene units) and, a little, round each
 * found difference (`found` holds x, y, w, h per find). `hole` is a soft white disc, drawn with destination-out.
 */
export function paintDark(c: CanvasRenderingContext2D, width: number, height: number, scale: number, night: string, hole: CanvasImageSource, lampX: number, lampY: number, r: number, found: Float64Array, foundCount: number) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = "source-over";
  c.clearRect(0, 0, width, height);
  c.fillStyle = night;
  c.fillRect(0, 0, width, height);
  c.globalCompositeOperation = "destination-out";
  c.drawImage(hole, (lampX - r) * scale, (lampY - r) * scale, r * 2 * scale, r * 2 * scale);
  for (let index = 0; index < foundCount; index++) {
    const at = index * 4, w = found[at + 2], h = found[at + 3], size = (w > h ? w : h) * 0.9;
    c.drawImage(hole, (found[at] + w / 2 - size / 2) * scale, (found[at + 1] + h / 2 - size / 2) * scale, size * scale, size * scale);
  }
  c.globalCompositeOperation = "source-over";
}
