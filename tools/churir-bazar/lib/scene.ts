// What the tray shows and how it moves: pre-rendered bangles and a tray bitmap, a timeline of segments for the last move
// (swap, then pop and fall for each step of the cascade, then maybe a shake), and fixed pools of shards, floating points and
// rings. Built once per move here; lib/draw.hot.ts reads the pools every frame and allocates nothing.
// Browser-only drawing (canvas) but no game rules.
import { drawBangle, drawDust, drawTray, GLASS, GOLD } from "./art";
import { CELLS, LOCK, RAINBOW, SIZE, SPARKLE, colourOf, type Outcome, type Step } from "./board";
import { bn } from "./words";

export const MAX_SEG = 48;
export const MAX_PARTS = 240;
export const MAX_FLOATS = 8;
export const MAX_RINGS = 10;
/** Segment kinds. */
export const SEG_SWAP = 0, SEG_POP = 1, SEG_FALL = 2, SEG_SHAKE = 3, SEG_WRONG = 4, SEG_HOLD = 5;

/** Shard colours: 0–5 the glass colours, 6–11 their light edges, 12 gold, 13 white, 14 steel, 15 dust. */
export const SHARD_COLORS: string[] = [...GLASS.map(g => g[0]), ...GLASS.map(g => g[1]), GOLD, "#fffaf0", "#9aa0ad", "#cdb98f"];
export const PIECES = [0, 1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15, RAINBOW, LOCK, LOCK + 1, LOCK + 2, LOCK + 3, LOCK + 4, LOCK + 5];

export type Scene = {
  side: number; ratio: number; cell: number; world: number; slow: boolean; trayKey: string; font: string;
  tray: HTMLCanvasElement | null;
  sprites: (HTMLCanvasElement | null)[];
  dustSprites: (HTMLCanvasElement | null)[];
  /** The tray as it rests (after the last move), and its dust. */
  rest: number[]; restDust: number[];
  // timeline
  t0: number; end: number; n: number;
  kind: Uint8Array; from: Float32Array; to: Float32Array;
  /** Per segment: the cells it shows, the step it belongs to, and the dust before and after (null on a level without dust). */
  segCells: (number[] | null)[]; segStep: (Step | null)[]; segDustA: (number[] | null)[]; segDustB: (number[] | null)[];
  swapA: number; swapB: number;
  /** The shake: where each cell's piece came from, and the tray just before it. */
  order: number[] | null; pre: number[] | null;
  /** How many pops have started at the last drawn frame, for the HUD's counting. */
  popsShown: number; pops: number;
  /** The shake segment is on (the rattle plays), and whether a hint is drawn. */
  inShake: boolean;
  // shards
  pn: number; px: Float32Array; py: Float32Array; pvx: Float32Array; pvy: Float32Array; prot: Float32Array; pvr: Float32Array;
  plife: Float32Array; page: Float32Array; pdelay: Float32Array; pcolor: Uint8Array; psize: Float32Array;
  // floating points
  fn: number; ftext: string[]; fx: Float32Array; fy: Float32Array; fdelay: Float32Array;
  // rings: a flash at a cell
  rn: number; rx: Float32Array; ry: Float32Array; rdelay: Float32Array; rcolor: Uint8Array; rbig: Float32Array;
  // the board's own nudge
  shakeAt: number; shakeAmp: number;
  // a তালা landing
  lockCell: number; lockAt: number;
  // between moves
  selected: number; cursor: number; keyboard: boolean; hint0: number; hint1: number; hintOn: boolean; dropCell: number; lastNow: number;
  /** Scratch: marks for the cells being cleared in a frame. */
  mark: Uint8Array;
};

export function makeScene(): Scene {
  return {
    side: 0, ratio: 1, cell: 0, world: 0, slow: false, trayKey: "", font: "800 14px sans-serif", tray: null, sprites: [], dustSprites: [], rest: [], restDust: [],
    t0: 0, end: 0, n: 0, kind: new Uint8Array(MAX_SEG), from: new Float32Array(MAX_SEG), to: new Float32Array(MAX_SEG),
    segCells: Array<number[] | null>(MAX_SEG).fill(null), segStep: Array<Step | null>(MAX_SEG).fill(null),
    segDustA: Array<number[] | null>(MAX_SEG).fill(null), segDustB: Array<number[] | null>(MAX_SEG).fill(null),
    swapA: -1, swapB: -1, order: null, pre: null, popsShown: 0, pops: 0, inShake: false,
    pn: 0, px: new Float32Array(MAX_PARTS), py: new Float32Array(MAX_PARTS), pvx: new Float32Array(MAX_PARTS), pvy: new Float32Array(MAX_PARTS),
    prot: new Float32Array(MAX_PARTS), pvr: new Float32Array(MAX_PARTS), plife: new Float32Array(MAX_PARTS), page: new Float32Array(MAX_PARTS),
    pdelay: new Float32Array(MAX_PARTS), pcolor: new Uint8Array(MAX_PARTS), psize: new Float32Array(MAX_PARTS),
    fn: 0, ftext: Array<string>(MAX_FLOATS).fill(""), fx: new Float32Array(MAX_FLOATS), fy: new Float32Array(MAX_FLOATS), fdelay: new Float32Array(MAX_FLOATS),
    rn: 0, rx: new Float32Array(MAX_RINGS), ry: new Float32Array(MAX_RINGS), rdelay: new Float32Array(MAX_RINGS), rcolor: new Uint8Array(MAX_RINGS), rbig: new Float32Array(MAX_RINGS),
    shakeAt: 0, shakeAmp: 0, lockCell: -1, lockAt: 0,
    selected: -1, cursor: 24, keyboard: false, hint0: -1, hint1: -1, hintOn: false, dropCell: -1, lastNow: 0,
    mark: new Uint8Array(CELLS),
  };
}

/** Draws the tray and every bangle bitmap for this size and mél (only when one of them changed). */
export function resizeScene(sc: Scene, side: number, ratio: number, world: number) {
  const key = `${side}|${ratio}|${world}`;
  if (key === sc.trayKey) return;
  sc.trayKey = key; sc.side = side; sc.ratio = ratio; sc.world = world; sc.cell = side / SIZE;
  sc.font = `800 ${Math.round(sc.cell * 0.36)}px "Display", "Bangla", sans-serif`;
  const tray = document.createElement("canvas");
  tray.width = tray.height = Math.round(side * ratio);
  const c = tray.getContext("2d");
  if (!c) return;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawTray(c, side, world);
  sc.tray = tray;
  const px = Math.ceil(sc.cell * ratio);
  for (const piece of PIECES) {
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = px;
    const s = sprite.getContext("2d");
    if (s) drawBangle(s, piece, 0, 0, px);
    sc.sprites[piece] = sprite;
  }
  for (const layers of [1, 2]) {
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = px;
    const s = sprite.getContext("2d");
    if (s) drawDust(s, 0, 0, px, layers);
    sc.dustSprites[layers] = sprite;
  }
}

const easeSq = (k: number) => k * k;
const centre = (cell: number) => [(cell % SIZE) + 0.5, Math.floor(cell / SIZE) + 0.5] as const;

/** A burst of shards from a cell's centre. `weight` sets how many and how fast. */
export function shatter(sc: Scene, cell: number, piece: number, count: number, delay: number, speed = 1) {
  if (sc.slow) return;
  const [cx, cy] = centre(cell), base = colourOf(piece);
  for (let k = 0; k < count; k++) {
    const i = sc.pn < MAX_PARTS ? sc.pn++ : (k * 7 + cell) % MAX_PARTS;
    const angle = (k / count) * Math.PI * 2 + (cell * 1.7 + k * 0.9) % 1;
    const v = (1.4 + ((k * 37 + cell * 11) % 10) / 6) * speed;
    sc.px[i] = cx; sc.py[i] = cy; sc.pvx[i] = Math.cos(angle) * v; sc.pvy[i] = Math.sin(angle) * v - 1.2 * speed;
    sc.prot[i] = k * 1.3; sc.pvr[i] = (k % 2 ? 1 : -1) * (6 + (k % 5));
    sc.plife[i] = 480 + ((k * 53) % 300); sc.page[i] = 0; sc.pdelay[i] = delay;
    const c = piece === RAINBOW ? k % 6 : base < 0 ? 13 : base;
    sc.pcolor[i] = k % 3 === 0 ? c + 6 : k % 7 === 0 ? 12 : c;
    sc.psize[i] = 0.07 + ((k * 13) % 5) / 90;
  }
}

/** A small burst of a single kind (dust, steel, gold). */
export function puff(sc: Scene, cell: number, color: number, count: number, delay: number, speed = 0.7) {
  if (sc.slow) return;
  const [cx, cy] = centre(cell);
  for (let k = 0; k < count; k++) {
    const i = sc.pn < MAX_PARTS ? sc.pn++ : (k * 5 + cell) % MAX_PARTS;
    const angle = (k / count) * Math.PI * 2 + k * 0.7, v = (0.8 + ((k * 31) % 10) / 10) * speed;
    sc.px[i] = cx; sc.py[i] = cy; sc.pvx[i] = Math.cos(angle) * v; sc.pvy[i] = Math.sin(angle) * v - 0.5 * speed;
    sc.prot[i] = k; sc.pvr[i] = 4; sc.plife[i] = 420 + ((k * 41) % 200); sc.page[i] = 0; sc.pdelay[i] = delay; sc.pcolor[i] = color; sc.psize[i] = 0.05 + ((k * 7) % 4) / 100;
  }
}

function ring(sc: Scene, cell: number, color: number, delay: number, big: number) {
  if (sc.slow || sc.rn >= MAX_RINGS) return;
  const [cx, cy] = centre(cell), i = sc.rn++;
  sc.rx[i] = cx; sc.ry[i] = cy; sc.rdelay[i] = delay; sc.rcolor[i] = color; sc.rbig[i] = big;
}

function floatText(sc: Scene, text: string, cells: readonly number[], delay: number) {
  if (!cells.length || sc.fn >= MAX_FLOATS) return;
  let x = 0, y = 0;
  for (const cell of cells) { x += cell % SIZE; y += Math.floor(cell / SIZE); }
  const i = sc.fn++;
  sc.ftext[i] = text; sc.fx[i] = x / cells.length + 0.5; sc.fy[i] = y / cells.length + 0.5; sc.fdelay[i] = delay;
}

/** A new timeline starts: shards already in the air keep flying (they start "at once" now); those that were still waiting are dropped. */
function keepFlying(sc: Scene) {
  let kept = 0;
  for (let i = 0; i < sc.pn; i++) {
    if (!(sc.page[i] > 0 && sc.page[i] < sc.plife[i])) continue;
    sc.px[kept] = sc.px[i]; sc.py[kept] = sc.py[i]; sc.pvx[kept] = sc.pvx[i]; sc.pvy[kept] = sc.pvy[i]; sc.prot[kept] = sc.prot[i]; sc.pvr[kept] = sc.pvr[i];
    sc.plife[kept] = sc.plife[i]; sc.page[kept] = sc.page[i]; sc.pdelay[kept] = -1; sc.pcolor[kept] = sc.pcolor[i]; sc.psize[kept] = sc.psize[i];
    kept++;
  }
  sc.pn = kept;
}

function reset(sc: Scene, now: number) {
  keepFlying(sc);
  sc.t0 = now; sc.n = 0; sc.pops = 0; sc.popsShown = 0; sc.fn = 0; sc.rn = 0; sc.shakeAmp = 0; sc.lockCell = -1;
  sc.order = null; sc.pre = null; sc.swapA = sc.swapB = -1;
}

function seg(sc: Scene, kind: number, from: number, to: number, cells: number[] | null, step: Step | null, dustA: number[] | null, dustB: number[] | null) {
  const i = sc.n++;
  sc.kind[i] = kind; sc.from[i] = from; sc.to[i] = to; sc.segCells[i] = cells; sc.segStep[i] = step; sc.segDustA[i] = dustA; sc.segDustB[i] = dustB;
}

/** Durations in ms: a swap, a pop, and a fall of `rows` rows. */
export const swapMs = (slow: boolean) => (slow ? 70 : 110);
export const popMs = (slow: boolean) => (slow ? 70 : 150);
export const fallMs = (slow: boolean, rows: number) => (slow ? 0.6 : 1) * (70 + 55 * Math.sqrt(rows));
export const SHAKE_MS = 800;

/** The tray as it stands, nothing moving: after a load, a restart or a skipped animation. */
export function settle(sc: Scene, cells: number[], dust: number[], now: number) {
  reset(sc, now);
  sc.rest = cells; sc.restDust = dust; sc.end = now;
}

/** A swap that makes no line: the two bangles slide out and back. */
export function stageWrong(sc: Scene, cells: number[], dust: number[], a: number, b: number, now: number) {
  reset(sc, now);
  sc.rest = cells; sc.restDust = dust; sc.swapA = a; sc.swapB = b;
  seg(sc, SEG_WRONG, 0, sc.slow ? 120 : 240, cells, null, dust, dust);
  sc.end = now + (sc.slow ? 120 : 240);
}

/** One move: the swap, then a pop and a fall for each step, then the lock landing and the shake. `before` is the tray the player saw. */
export function stageMove(sc: Scene, before: { cells: number[]; dust: number[] }, outcome: Outcome, a: number, b: number, now: number, number: (n: number) => string = bn) {
  reset(sc, now);
  const slow = sc.slow, steps = outcome.steps;
  sc.swapA = a; sc.swapB = b;
  const swapped = before.cells.slice();
  [swapped[a], swapped[b]] = [swapped[b], swapped[a]];
  const dusty = outcome.dust !== null;
  let t = swapMs(slow);
  let dustBefore: number[] | null = dusty ? before.dust : null;
  seg(sc, SEG_SWAP, 0, t, before.cells, null, dustBefore, dustBefore);
  steps.forEach((step, index) => {
    const cellsBefore = index === 0 ? swapped : steps[index - 1].cells;
    const pop = popMs(slow);
    seg(sc, SEG_POP, t, t + pop, cellsBefore, step, dustBefore, step.dust);
    sc.pops++;
    // weight: shards from every cleared bangle, a ring at each new special, points rising, the board nudged by big lifts
    const many = step.cleared.length + step.made.length;
    for (const cell of step.cleared) shatter(sc, cell, cellsBefore[cell], many >= 5 ? 6 : 5, t, 1 + Math.min(0.6, many / 20));
    for (const cell of step.blasts) { ring(sc, cell, 12, t, 1.6); }
    for (const item of step.made) ring(sc, item.cell, item.piece === RAINBOW ? 13 : 12, t + pop * 0.6, item.piece === RAINBOW ? 2.2 : 1.5);
    for (const cell of step.wipedCells) puff(sc, cell, 15, 6, t, 0.8);
    for (const cell of step.cleared) if (cellsBefore[cell] >= LOCK) puff(sc, cell, 14, 8, t, 1.1);
    floatText(sc, `+${number(step.points)}`, step.cleared.length ? step.cleared : step.made.map(item => item.cell), t);
    if (!slow && (many >= 5 || step.blasts.length || index > 1)) { sc.shakeAt = t; sc.shakeAmp = Math.max(sc.shakeAmp, Math.min(6, 1.6 + many * 0.35 + step.blasts.length * 1.5)); }
    t += pop;
    let rows = 0;
    for (let i = 0; i < CELLS; i++) if (step.fall[i] > rows) rows = step.fall[i];
    const fall = fallMs(slow, rows);
    seg(sc, SEG_FALL, t, t + fall, step.cells, step, step.dust, step.dust);
    t += fall;
    dustBefore = step.dust;
  });
  const finalDust = dusty ? steps[steps.length - 1].dust : null;
  const last = steps[steps.length - 1].cells.slice();
  if (outcome.lockedAt >= 0) {
    last[outcome.lockedAt] += LOCK;
    sc.lockCell = outcome.lockedAt; sc.lockAt = t; ring(sc, outcome.lockedAt, 14, t, 1.3); puff(sc, outcome.lockedAt, 14, 8, t, 0.9);
    const hold = slow ? 80 : 240;
    seg(sc, SEG_HOLD, t, t + hold, last, null, finalDust, finalDust);
    t += hold;
  }
  if (outcome.shuffle) {
    sc.pre = last; sc.order = outcome.shuffle;
    seg(sc, SEG_SHAKE, t, t + SHAKE_MS, outcome.cells, null, finalDust, finalDust);
    t += SHAKE_MS;
  }
  sc.rest = outcome.cells; sc.restDust = outcome.dust ?? before.dust;
  sc.end = now + t + 40;
}

/** Jumps to the end of whatever is animating, so a new press is answered at once. The shards already in the air finish on their own. */
export function skipToEnd(sc: Scene, now: number) {
  if (now < sc.end) { sc.t0 = now - 1e6; sc.end = now; }
}
