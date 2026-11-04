// The per-frame drawing: the pre-rendered layers, the picture under soft snow, the weather and the antenna.
// Runs every animation frame, so it allocates nothing: the weather's drops are made once at module load.
import type { PictureId } from "./levels";

export const SCENE_W = 360;
export const SCENE_H = 290;
/** The TV in scene units: drawn at TV_X/TV_Y, 1.08× its own 240×150 units. */
export const TV_X = 50, TV_Y = 98, TV_S = 1.08;
/** The screen inside the TV's own units, and in scene units. */
export const TV_SCREEN = { x: 20, y: 28, w: 152, h: 98, r: 14 } as const;
export const SCREEN = { x: TV_X + TV_SCREEN.x * TV_S, y: TV_Y + TV_SCREEN.y * TV_S, w: TV_SCREEN.w * TV_S, h: TV_SCREEN.h * TV_S, r: TV_SCREEN.r * TV_S } as const;
export const POLE_X = 268;
export const ANTENNA_Y = 28;
/** Seconds per snow crossfade. Each pixel drifts one way per period, far under 3 changes a second. */
export const NOISE_PERIOD = 0.9;

type Ctx = CanvasRenderingContext2D;

/** What drawFrame needs, updated in place by the component. `label` is made once per game so a frame builds no strings. */
export type FrameState = {
  angle: number; quality: number; picture: PictureId; time: number; frozen: boolean; label: string;
  /** 1 → 0 after a lock: the picture rolls once and settles (0 in slow mode). */
  roll: number;
  /** 1 → 0 after a lock: a soft white flash on the glass. */
  flash: number;
  /** 0 calm, 1 wind lines in the sky, 2 rain. */
  weather: number;
};

export type FrameLayers = {
  scale: number;
  bg: HTMLCanvasElement;
  glass: HTMLCanvasElement;
  pictures: Record<PictureId, HTMLCanvasElement>;
  noise: HTMLCanvasElement[];
  mix: HTMLCanvasElement;
  mixCtx: CanvasRenderingContext2D;
};

// Rain drops and wind lines: x, y, speed, made once from a fixed sequence.
const DROPS = 40;
const RAIN = new Float32Array(DROPS * 3);
{
  let state = 977;
  for (let index = 0; index < RAIN.length; index++) {
    state = (state * 1103515245 + 12345) % 2147483648;
    RAIN[index] = state / 2147483648;
  }
}

/**
 * The Yagi antenna on its pole, seen from the side with a little tilt so you can tell where it points.
 * `angle` 0 points away from you; it turns clockwise.
 */
export function drawAntenna(ctx: Ctx, cx: number, cy: number, s: number, angle: number) {
  const rad = angle * Math.PI / 180, sin = Math.sin(rad), cos = Math.cos(rad);
  const bx = sin * 56 * s, by = -cos * 56 * s * 0.32, ex = cos * s, ey = sin * s * 0.32;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#5f6a70"; ctx.lineWidth = 2.2 * s;
  ctx.beginPath(); ctx.moveTo(cx - bx, cy - by); ctx.lineTo(cx + bx, cy + by); ctx.stroke();
  ctx.strokeStyle = "#8d989e"; ctx.lineWidth = 1.6 * s;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const t = -0.9 + i * 0.33, half = 25 - i * 2.6;
    const px = cx + bx * t, py = cy + by * t;
    ctx.moveTo(px - ex * half, py - ey * half); ctx.lineTo(px + ex * half, py + ey * half);
  }
  ctx.stroke();
  ctx.fillStyle = "#2b2b2b";
  ctx.fillRect(cx - bx * 0.57 - 2.5 * s, cy - by * 0.57 - 2 * s, 5 * s, 4 * s);
  ctx.fillStyle = "#5f6a70";
  ctx.beginPath(); ctx.arc(cx, cy, 2.6 * s, 0, Math.PI * 2); ctx.fill();
}

function drawWeather(ctx: Ctx, kind: number, time: number) {
  if (kind === 2) {
    ctx.strokeStyle = "rgba(200,214,240,.55)"; ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let i = 0; i < DROPS; i++) {
      const x = RAIN[i * 3] * SCENE_W, speed = 140 + RAIN[i * 3 + 2] * 80;
      const y = (RAIN[i * 3 + 1] * 90 + time * speed) % 90 - 6;
      ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 8);
    }
    ctx.stroke();
    return;
  }
  ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const y = 10 + RAIN[i * 3 + 1] * 56, speed = 50 + RAIN[i * 3 + 2] * 40;
    const x = (RAIN[i * 3] * (SCENE_W + 60) + time * speed) % (SCENE_W + 60) - 40;
    ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 12, y - 3, x + 26, y);
  }
  ctx.stroke();
}

/** One frame: background, weather, the screen (picture under soft snow, a faint ghost image when weak), glass, antenna. */
export function drawFrame(ctx: Ctx, layers: FrameLayers, frame: FrameState) {
  const scale = layers.scale;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(layers.bg, 0, 0);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  if (frame.weather && !frame.frozen) drawWeather(ctx, frame.weather, frame.time);
  const q = frame.quality, picture = layers.pictures[frame.picture];
  ctx.save();
  ctx.beginPath(); ctx.roundRect(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, SCREEN.r); ctx.clip();
  if (frame.roll > 0) {
    // The old vertical hold: the picture slides up once and settles on the lock.
    const shift = SCREEN.h * frame.roll * frame.roll * 0.9;
    ctx.drawImage(picture, SCREEN.x, SCREEN.y - shift, SCREEN.w, SCREEN.h);
    ctx.drawImage(picture, SCREEN.x, SCREEN.y + SCREEN.h - shift + 3, SCREEN.w, SCREEN.h);
    ctx.fillStyle = "#1c1f20"; ctx.fillRect(SCREEN.x, SCREEN.y + SCREEN.h - shift, SCREEN.w, 3);
  } else ctx.drawImage(picture, SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h);
  if (q < 0.98) {
    ctx.globalAlpha = 0.3 * (1 - q);
    ctx.drawImage(picture, SCREEN.x + (1 - q) * 12, SCREEN.y, SCREEN.w, SCREEN.h);
    const mix = layers.mixCtx;
    if (frame.frozen) { mix.globalAlpha = 1; mix.drawImage(layers.noise[0], 0, 0); }
    else {
      const phase = frame.time / NOISE_PERIOD, step = Math.floor(phase), blend = phase - step;
      mix.globalAlpha = 1; mix.drawImage(layers.noise[step % 4], 0, 0);
      mix.globalAlpha = blend; mix.drawImage(layers.noise[(step + 1) % 4], 0, 0);
    }
    ctx.globalAlpha = Math.pow(1 - q, 0.75);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(layers.mix, SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h);
    ctx.globalAlpha = 1;
  }
  if (frame.flash > 0) {
    ctx.globalAlpha = frame.flash * 0.55; ctx.fillStyle = "#ffffff";
    ctx.fillRect(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h);
    ctx.globalAlpha = 1;
  }
  ctx.drawImage(layers.glass, SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h);
  ctx.font = "700 10px Bangla, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillText(frame.label, SCREEN.x + 9.6, SCREEN.y + 16.6);
  ctx.fillStyle = "#8dfca6"; ctx.fillText(frame.label, SCREEN.x + 9, SCREEN.y + 16);
  ctx.restore();
  drawAntenna(ctx, POLE_X, ANTENNA_Y, 1.2, frame.angle);
}
