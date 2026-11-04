// What the bed shows and how it moves: pre-rendered plates and a bed bitmap, plus fixed pools of tracks (a plate's path
// through a swipe) and particles. Built once per swipe here; lib/draw.hot.ts reads the pools every frame and allocates
// nothing. Browser-only drawing (canvas) but no game rules.
import { CROW, TOP, type Slide } from "./board";
import { drawBed, drawStage } from "./art";
import { E_PEAK, type Game } from "./rules";

export const MAX_TRACKS = 96;
export const MAX_PARTS = 160;
const NEVER = 1e9;

/** Particle colours: 0–2 leaves, 3 petals, 4 gold, 5 ice, 6 rain, 7 feathers, 8 soil, 9 white. */
export const PART_COLORS = ["#4b9a3f", "#6fb544", "#86c653", "#f4dc84", "#f2b632", "#d8f0ff", "#7cc4f0", "#26272e", "#7a5233", "#fffaf0"] as const;

export type Scene = {
  side: number; ratio: number; size: number; world: number; pad: number; cell: number; slow: boolean;
  bed: HTMLCanvasElement | null;
  /** Plate bitmaps by `spriteOf(cell value)`. */
  sprites: (HTMLCanvasElement | null)[];
  stonesKey: string;
  // tracks: a plate's path, f → m during the swipe, m → t during a gust, shown between born and die (ms after t0)
  n: number; sprite: Int8Array; fx: Float32Array; fy: Float32Array; mx: Float32Array; my: Float32Array; tx: Float32Array; ty: Float32Array;
  born: Float32Array; die: Float32Array; pop: Uint8Array;
  // particles, each starting `pdelay` ms after t0
  pn: number; px: Float32Array; py: Float32Array; pvx: Float32Array; pvy: Float32Array; plife: Float32Array; page: Float32Array; pdelay: Float32Array; pcolor: Uint8Array; psize: Float32Array;
  /** A ring burst for a new stage: cell (−1 none), time and colour. */
  ring: number; ringAt: number; ringColor: number;
  t0: number; slideMs: number; popMs: number; end: number; lastNow: number;
  // markers that sit on the board between swipes
  hailCell: number; hailLeft: number; shadow: number;
};

export const spriteOf = (value: number) => value + 3;

export function makeScene(): Scene {
  return {
    side: 0, ratio: 1, size: 4, world: 0, pad: 0, cell: 0, slow: false, bed: null, sprites: [], stonesKey: "",
    n: 0, sprite: new Int8Array(MAX_TRACKS), fx: new Float32Array(MAX_TRACKS), fy: new Float32Array(MAX_TRACKS), mx: new Float32Array(MAX_TRACKS),
    my: new Float32Array(MAX_TRACKS), tx: new Float32Array(MAX_TRACKS), ty: new Float32Array(MAX_TRACKS), born: new Float32Array(MAX_TRACKS),
    die: new Float32Array(MAX_TRACKS), pop: new Uint8Array(MAX_TRACKS),
    pn: 0, px: new Float32Array(MAX_PARTS), py: new Float32Array(MAX_PARTS), pvx: new Float32Array(MAX_PARTS), pvy: new Float32Array(MAX_PARTS),
    plife: new Float32Array(MAX_PARTS), page: new Float32Array(MAX_PARTS), pdelay: new Float32Array(MAX_PARTS), pcolor: new Uint8Array(MAX_PARTS), psize: new Float32Array(MAX_PARTS),
    ring: -1, ringAt: 0, ringColor: 4, t0: 0, slideMs: 120, popMs: 220, end: 0, lastNow: 0, hailCell: -1, hailLeft: 0, shadow: -1,
  };
}

/** Draws the bed and every plate bitmap for this size, season and stones (only when one of them changed). */
export function resizeScene(sc: Scene, side: number, ratio: number, size: number, world: number, stones: readonly number[]) {
  const key = `${side}|${ratio}|${size}|${world}|${stones.join(",")}`;
  if (key === sc.stonesKey) return;
  sc.stonesKey = key; sc.side = side; sc.ratio = ratio; sc.size = size; sc.world = world;
  const bed = document.createElement("canvas");
  bed.width = Math.round(side * ratio); bed.height = Math.round(side * ratio);
  const c = bed.getContext("2d");
  if (!c) return;
  c.scale(ratio, ratio);
  const { pad, cell } = drawBed(c, side, size, world, stones);
  sc.bed = bed; sc.pad = pad; sc.cell = cell;
  const px = Math.ceil(cell * 0.92 * ratio);
  sc.sprites = [];
  for (let value = -3; value <= TOP; value++) {
    if (value === 0 || value === -1) { sc.sprites.push(null); continue; }
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = px;
    const sc2 = sprite.getContext("2d");
    if (sc2) drawStage(sc2, value, 0, 0, px);
    sc.sprites.push(sprite);
  }
}

function track(sc: Scene, value: number, from: number, to: number, born: number, die: number, pop: number) {
  if (sc.n >= MAX_TRACKS || value === 0 || value === -1) return -1;
  const i = sc.n++, size = sc.size;
  sc.sprite[i] = spriteOf(value);
  sc.fx[i] = from % size; sc.fy[i] = Math.floor(from / size);
  sc.mx[i] = sc.tx[i] = to % size; sc.my[i] = sc.ty[i] = Math.floor(to / size);
  sc.born[i] = born; sc.die[i] = die; sc.pop[i] = pop;
  return i;
}

/** A small burst of particles from a cell's centre. */
export function burst(sc: Scene, cell: number, count: number, color: number, spread: number, delay: number, speed = 1) {
  if (sc.slow) return;
  const size = sc.size, cx = (cell % size) + 0.5, cy = Math.floor(cell / size) + 0.5;
  for (let k = 0; k < count; k++) {
    const i = sc.pn < MAX_PARTS ? sc.pn++ : (k % MAX_PARTS);
    const angle = (k / count) * Math.PI * 2 + (cell * 1.7 + k * 0.9) % 1;
    const v = (0.9 + ((k * 37) % 10) / 10) * speed;
    sc.px[i] = cx; sc.py[i] = cy;
    sc.pvx[i] = Math.cos(angle) * v * spread; sc.pvy[i] = Math.sin(angle) * v * spread - 0.6 * speed;
    sc.plife[i] = 520 + ((k * 53) % 260); sc.page[i] = 0; sc.pdelay[i] = delay;
    sc.pcolor[i] = color === 0 ? k % 3 : color; sc.psize[i] = 0.05 + ((k * 13) % 5) / 100;
  }
}

/** The board as it stands, nothing moving: after a load, ফেরত নাও or a মালির থলে pick. */
export function settle(sc: Scene, game: Game, now: number) {
  sc.n = 0; sc.pn = 0; sc.ring = -1; sc.t0 = now; sc.end = now;
  for (let cell = 0; cell < game.cells.length; cell++) track(sc, game.cells[cell], cell, cell, 0, NEVER, 0);
  markers(sc, game);
}

function markers(sc: Scene, game: Game) {
  sc.hailCell = game.hailAt ? game.hailCell : -1;
  sc.hailLeft = game.hailAt ? game.hailAt - game.moves.length : 0;
  sc.shadow = game.shadow;
}

/** One swipe: the plates' paths and the weather, timed one after another. */
export function stageMove(sc: Scene, before: Game, after: Game, now: number) {
  const S = sc.slow ? 60 : 120, size = after.size, cells = size * size;
  sc.slideMs = S; sc.popMs = sc.slow ? 0 : 220;
  sc.n = 0; sc.t0 = now; sc.ring = -1;
  if (sc.pn > 0 && now - sc.lastNow > 900) sc.pn = 0;
  const at = new Int16Array(cells).fill(-1);
  const last = after.last as Slide;
  // the swipe: every plate and weed goes from → to; a merged pair fades under the plate it grew
  for (const path of last.paths) {
    const i = track(sc, before.cells[path.from], path.from, path.to, 0, path.merged ? S : NEVER, 0);
    if (!path.merged && i >= 0) at[path.to] = i;
  }
  for (const grown of last.grown) { at[grown.cell] = track(sc, grown.stage, grown.cell, grown.cell, S, NEVER, 1); burst(sc, grown.cell, 5, 0, 1.1, S, 0.7); }
  for (const cell of last.pulled) burst(sc, cell, 8, 8, 1.3, S);
  // a crow that sat through the swipe
  if (before.crowCell >= 0 && after.crowGone !== before.crowCell) at[before.crowCell] = track(sc, CROW, before.crowCell, before.crowCell, 0, NEVER, 0);
  if (after.crowGone >= 0) { track(sc, CROW, after.crowGone, after.crowGone, 0, S, 0); burst(sc, after.crowGone, 7, 7, 1.6, S, 1.4); }
  if (after.crowLanded >= 0) at[after.crowLanded] = track(sc, CROW, after.crowLanded, after.crowLanded, S, NEVER, 2);
  if (after.shooed >= 0) burst(sc, after.shooed, 6, 7, 1.8, S, 1.6);
  // hail: what sat there shrinks
  const hit = after.hailHit;
  if (hit) {
    const old = at[hit.cell];
    if (old >= 0) sc.die[old] = S;
    at[hit.cell] = hit.to ? track(sc, hit.to, hit.cell, hit.cell, S, NEVER, 1) : -1;
    burst(sc, hit.cell, 10, 5, 1.4, S, 1.2);
  }
  let T = S;
  // a gust: everything slides once more
  if (after.gust) {
    const moved = new Int16Array(cells).fill(-1);
    for (const path of after.gust.paths) {
      const i = at[path.from];
      if (i < 0) continue;
      sc.tx[i] = path.to % size; sc.ty[i] = Math.floor(path.to / size);
      if (path.merged) sc.die[i] = 2 * S; else moved[path.to] = i;
    }
    for (const grown of after.gust.grown) moved[grown.cell] = track(sc, grown.stage, grown.cell, grown.cell, 2 * S, NEVER, 1);
    for (const cell of after.gust.pulled) burst(sc, cell, 8, 8, 1.3, 2 * S);
    // anything that didn't move in the gust (a crow) stays where it was
    for (let cell = 0; cell < cells; cell++) if (at[cell] >= 0 && moved[cell] < 0 && sc.tx[at[cell]] === cell % size && sc.ty[at[cell]] === Math.floor(cell / size)) moved[cell] = at[cell];
    at.set(moved);
    T = 2 * S;
  }
  // rain: every আঁটি turns into a চারা
  for (const cell of after.rained) {
    const old = at[cell];
    if (old >= 0) sc.die[old] = T;
    at[cell] = track(sc, 2, cell, cell, T, NEVER, 1);
    burst(sc, cell, 4, 6, 0.6, T - 40, 0.5);
  }
  // the next drop
  if (after.spawned) track(sc, after.spawned.stage, after.spawned.cell, after.spawned.cell, T + 30, NEVER, 2);
  // a new stage: a ring and a burst in its colours (petals for মুকুল, gold for আম)
  if (after.events & E_PEAK) {
    let cell = -1;
    for (let k = 0; k < after.cells.length; k++) if (after.cells[k] === after.peak) { cell = k; break; }
    if (cell >= 0 && !sc.slow) {
      const color = after.peak === 4 ? 3 : after.peak >= 7 ? 4 : 0;
      sc.ring = cell; sc.ringAt = T; sc.ringColor = color;
      burst(sc, cell, after.peak >= 7 ? 22 : 14, color, 2.2, T, 1.5);
    }
  }
  markers(sc, after);
  sc.end = now + T + 30 + sc.popMs + 700;
}
