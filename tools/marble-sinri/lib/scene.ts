// Sets up the board for one stage size and one look: the sky, the scrolling wall, the awning, the washes and glows, the
// pots, the picks and the marble's three layers are painted once into offscreen canvases here, and every string the HUD
// needs is made here too, so draw.hot.ts only stamps sprites and rectangles.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import { bn } from "./link";
import { LEVELS, MARBLES } from "./levels";
import { PALETTES, paintAwning, paintMarbleBody, paintPick, paintPot, paintShine, paintSky, paintSwirl, paintWallTile, paintWarning, type Look, type Palette } from "./art";
import { H, POT, R, TOP, W } from "./physics";
import type { Game } from "./game";

export type Sprite = { canvas: HTMLCanvasElement; w: number; h: number; ox: number; oy: number };

/** Bangla numerals for every count the HUD shows, made once. */
export const NUMBERS: string[] = [];
export const STREAKS: string[] = [];
export const LEFT: string[] = [];
function numbers() {
  if (NUMBERS.length) return;
  for (let value = 0; value <= 999; value++) NUMBERS.push(bn(value));
  for (let value = 0; value <= 99; value++) { STREAKS.push(`টানা ${bn(value)}`); LEFT.push(`আর ${bn(value)} ধাপ`); }
}
export const FONT_HUD = `800 17px ${DISPLAY_FONT}`;
export const FONT_SMALL = `700 13px ${DISPLAY_FONT}`;
export const FONT_POP = `800 16px ${DISPLAY_FONT}`;
export const PLUS_ONE = "+১";
export const MINUS_ONE = "−১";
export const PICKS = [3, 2, 1, 5, 8] as const;

export type Scene = {
  context: CanvasRenderingContext2D;
  /** Device pixels per CSS pixel, CSS pixels per board unit, the board's left edge in CSS px, the viewport's height in board units. */
  dpr: number; k: number; ox: number; view: number; cssWidth: number; cssHeight: number;
  look: Look; palette: Palette; dark: boolean; colour: number;
  sky: Sprite; wall: Sprite; awning: Sprite; awningRush: Sprite; warning: Sprite; dim: Sprite | null;
  edgeOrange: Sprite; edgeRed: Sprite; edgeBlue: Sprite;
  pot: Sprite; picks: Sprite[]; body: Sprite; swirl: Sprite; shine: Sprite; dotOn: Sprite; dotOff: Sprite;
  /** The finale bar's name, or "". */
  finale: string;
  /** Draw the HUD: off on the title, where the start card speaks for the floor. */
  hud: boolean;
  clock: number; hitAt: number; pickAt: number; pickX: number; pickY: number; bonusAt: number; gustAt: number; gustSide: number;
  game: Game | null;
};

function sprite(w: number, h: number, k: number, paint: (context: CanvasRenderingContext2D) => void, ox = 0, oy = 0): Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(w * k)); canvas.height = Math.max(1, Math.ceil(h * k));
  const context = canvas.getContext("2d")!;
  context.setTransform(k, 0, 0, k, ox * k, oy * k);
  paint(context);
  return { canvas, w, h, ox, oy };
}

/** An edge glow on all four sides of the viewport, in board units. */
function edge(view: number, colour: string) {
  return (c: CanvasRenderingContext2D) => {
    const depth = 46;
    const sides: Array<[number, number, number, number, number, number, number, number]> = [
      [0, 0, 0, depth, 0, 0, W, depth], [0, view, 0, view - depth, 0, view - depth, W, depth],
      [0, 0, depth, 0, 0, 0, depth, view], [W, 0, W - depth, 0, W - depth, 0, depth, view],
    ];
    for (const [x0, y0, x1, y1, rx, ry, rw, rh] of sides) {
      const glow = c.createLinearGradient(x0, y0, x1, y1);
      glow.addColorStop(0, colour); glow.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = glow; c.fillRect(rx, ry, rw, rh);
    }
  };
}

/** The board for a canvas `cssWidth` × `cssHeight`: 360 units wide when the stage is tall enough, else 600 units tall. */
export function makeScene(canvas: HTMLCanvasElement, cssWidth: number, cssHeight: number, look: Look, dark: boolean, level: number, colour: number): Scene {
  numbers();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(cssWidth * dpr); canvas.height = Math.round(cssHeight * dpr);
  const context = canvas.getContext("2d")!;
  const k = Math.min(cssWidth / W, cssHeight / H), view = cssHeight / k, ox = (cssWidth - W * k) / 2, s = k * dpr;
  const palette = PALETTES[look];
  const glass = (paint: (c: CanvasRenderingContext2D) => void, size: number) => sprite(size * 2, size * 2, s * 1.6, paint, size, size);
  const spec = LEVELS[Math.max(1, Math.min(LEVELS.length, level)) - 1];
  return {
    context, dpr, k, ox, view, cssWidth, cssHeight, look, palette, dark, colour,
    sky: sprite(W + 2 * Math.ceil(ox / k + 1), view, s, c => paintSky(c, palette, view), Math.ceil(ox / k + 1), 0),
    wall: sprite(W + 2 * Math.ceil(ox / k + 1), 360, s, c => { paintWallTile(c, look, palette); c.translate(-W, 0); paintWallTile(c, look, palette); c.translate(2 * W, 0); paintWallTile(c, look, palette); }, Math.ceil(ox / k + 1), 0),
    awning: sprite(W, TOP + 10, s, c => paintAwning(c)),
    awningRush: sprite(W, TOP + 10, s, c => paintAwning(c, "#e8b923")),
    warning: sprite(W, 90, s, paintWarning),
    dim: dark ? sprite(W * 2, view * 2 + 240, s * 0.5, c => {
      // The lights are out: a dark sheet with a lantern's soft hole in its middle (stamped centred on the marble).
      const cx = W, cy = view + 120, glow = c.createRadialGradient(cx, cy, 30, cx, cy, 190);
      glow.addColorStop(0, "rgba(10,8,6,0)"); glow.addColorStop(0.55, "rgba(10,8,6,0.55)"); glow.addColorStop(1, "rgba(10,8,6,0.93)");
      c.fillStyle = glow; c.fillRect(0, 0, W * 2, view * 2 + 240);
    }) : null,
    edgeOrange: sprite(W, view, s * 0.5, edge(view, "rgba(255,140,40,0.75)")),
    edgeRed: sprite(W, view, s * 0.5, edge(view, "rgba(214,40,40,0.8)")),
    edgeBlue: sprite(W, view, s * 0.5, edge(view, "rgba(120,190,255,0.6)")),
    pot: sprite(POT + 12, 34, s, c => paintPot(c, (POT + 12) / 2, 32)),
    picks: PICKS.map(index => sprite(18, 18, s * 1.5, c => paintPick(c, 9, 9, index))),
    body: glass(c => paintMarbleBody(c, colour, R), R + 2),
    swirl: glass(c => paintSwirl(c, colour, R), R + 2),
    shine: glass(c => paintShine(c, R), R + 2),
    dotOn: sprite(16, 16, s * 1.5, c => { c.translate(8, 8); paintMarbleBody(c, colour, 6.5); paintShine(c, 6.5); }),
    dotOff: sprite(16, 16, s * 1.5, c => { c.strokeStyle = "rgba(255,255,255,0.7)"; c.setLineDash([2, 2]); c.lineWidth = 1.5; c.beginPath(); c.arc(8, 8, 6, 0, Math.PI * 2); c.stroke(); }),
    finale: level % 4 === 0 ? spec.name : "",
    hud: false, clock: 0, hitAt: -9, pickAt: -9, pickX: 0, pickY: 0, bonusAt: -9, gustAt: -9, gustSide: 0,
    game: null,
  };
}

/** Which look a floor uses: its world's, and the alley at night for the last floor. */
export const lookOf = (level: number): Look => level === LEVELS.length ? "alley" : (["roof", "stairs", "scaffold"] as const)[LEVELS[Math.max(1, Math.min(LEVELS.length, level)) - 1].world];
export const MARBLE_COUNT = MARBLES.length;
