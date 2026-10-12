// Draws the river on the play canvas. The banks, chars and water are painted once per river into an offscreen canvas;
// floaters, mangoes and the kid are pre-painted sprites, so a frame is a handful of drawImage calls and no allocations.
import { BODY_FONT } from "../../../shared/card-canvas";
import { fitCanvas } from "../../../shared/game-kit";
import { C, drawBell, drawFerry, drawKash, drawKid, drawMango, drawNouka, drawPana, drawSteps, drawTree, drawVela } from "./art";
import { dipOf, leftOf, mangoX, mod, BANK, CHAR, COLS, FERRY, HOP_T, NOUKA, PANA, RESPAWN_T, START_X, VELA, WATER, type River, type Run } from "./river";

/** Rows on screen at once. */
export const VIEW = 10;

type Sprite = { canvas: HTMLCanvasElement; w: number; h: number; pad: number };
type Popup = { text: string; x: number; row: number; age: number; color: string };

export type Scene = {
  canvas: HTMLCanvasElement; context: CanvasRenderingContext2D; width: number; height: number; cell: number; ratio: number;
  river: River; bg: HTMLCanvasElement; rows: number;
  sprites: { nouka: Sprite; vela: Sprite; pana: Sprite; smallPana: Sprite; ferryR: Sprite; ferryL: Sprite; mango: Sprite; kid: Sprite };
  cam: number; clock: number; rain: Float32Array; popups: Popup[]; bellAt: number; respawnAt: number;
  hud: { tenths: number; text: string; got: number; mangoText: string; timeW: number; mangoW: number };
  fonts: { popup: string; hud: string };
};

const bn = new Intl.NumberFormat("bn-BD", { useGrouping: false });

function sprite(w: number, h: number, pad: number, cell: number, ratio: number, paint: (context: CanvasRenderingContext2D) => void): Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil((w + pad * 2) * cell * ratio); canvas.height = Math.ceil((h + pad * 2) * cell * ratio);
  const context = canvas.getContext("2d")!;
  context.scale(cell * ratio, cell * ratio); context.translate(pad, pad);
  paint(context);
  return { canvas, w, h, pad };
}

function place(context: CanvasRenderingContext2D, s: Sprite, x: number, y: number, cell: number) {
  context.drawImage(s.canvas, x - s.pad * cell, y - s.pad * cell, (s.w + s.pad * 2) * cell, (s.h + s.pad * 2) * cell);
}

const waterOf = (river: River) => river.rain ? C.monsoon : river.level > 10 ? C.river : C.canal;

/** Paints the whole river column (banks, chars, water, ghats, trees) once, three land rows past each bank. */
function paintBackground(river: River, width: number, cell: number, ratio: number) {
  // Land past each bank: at least 3 rows, more when the river is shorter than the screen.
  const n = river.lanes.length - 1, pad = landPad(n), rows = n + pad * 2 + 1;
  const bg = document.createElement("canvas");
  bg.width = Math.ceil(width * ratio); bg.height = Math.ceil(rows * cell * ratio);
  const c = bg.getContext("2d")!;
  c.scale(ratio * cell, ratio * cell); // from here on, units are cells
  const top = (row: number) => n + pad - row;
  const water = waterOf(river), cols = width / cell;
  c.fillStyle = C.grass; c.fillRect(0, 0, cols, rows);
  // A dirt path down to the near ghat, and one up from the far ghat.
  c.fillStyle = "#c9a77a"; c.fillRect(3.6, top(-1), 1.8, pad); c.fillRect(3.6, 0, 1.8, top(n));
  for (let row = -pad; row <= n + pad; row++) {
    const y = top(row), lane = river.lanes[row];
    if (!lane || lane.type === BANK) {
      c.fillStyle = "rgba(255,255,255,0.05)";
      for (let x = (row * 7) % 3 * 0.4 + 0.2; x < cols; x += 1.3) c.fillRect(x, y + 0.3 + (x % 0.5), 0.08, 0.08);
      continue;
    }
    if (lane.type === CHAR) {
      c.fillStyle = C.sand; c.fillRect(0, y, cols, 1);
      c.fillStyle = "#cdb47c"; c.fillRect(0, y, cols, 0.1); c.fillRect(0, y + 0.9, cols, 0.1);
      continue;
    }
    c.fillStyle = water; c.fillRect(0, y, cols, 1);
    // Lanes flowing right are a shade lighter than lanes flowing left, so the eye reads the current.
    c.fillStyle = lane.dir > 0 ? "rgba(255,255,255,0.07)" : "rgba(0,30,40,0.07)"; c.fillRect(0, y, cols, 1);
    c.fillStyle = "rgba(255,255,255,0.05)"; c.fillRect(0, y + 0.47, cols, 0.04);
  }
  // Muddy edges where land meets water.
  c.fillStyle = C.mud;
  c.fillRect(0, top(0), cols, 0.16); c.fillRect(0, top(n) + 0.84, cols, 0.16);
  // The near ghat: steps going down into the water at the top of the start bank. The far ghat: steps coming down at the bottom of the goal bank.
  c.save(); c.translate(3, top(0) - 0.02); drawSteps(c, 3, 0.5, false); c.restore();
  c.save(); c.translate(3, top(n) + 0.52); drawSteps(c, 3, 0.5, true); c.restore();
  // Chars get কাশফুল along their length.
  river.lanes.forEach((lane, row) => {
    if (lane.type !== CHAR) return;
    for (const x of [0.6, 2.1, 6.9, 8.4]) { c.save(); c.translate(x, top(row) + 0.85); drawKash(c); c.restore(); }
  });
  for (const [x, row, size] of [[0.9, n + 2, 1.1], [7.8, n + 2, 1.2], [2.2, n + 1, 0.9], [8.3, n + 1, 0.8], [0.6, -1, 1], [8.2, -2, 1.2], [1.8, -3, 1], [6.9, -1, 0.85]] as const) {
    c.save(); c.translate(x, top(row) + 0.9); drawTree(c, size); c.restore();
  }
  if (river.rain) { c.fillStyle = "rgba(28,48,66,0.16)"; c.fillRect(0, 0, cols, rows); }
  return { bg, rows };
}

const landPad = (n: number) => Math.max(3, Math.ceil((VIEW - n - 1) / 2) + 2);

/** Builds the scene for a river at this width (also on a resize or a new river). */
export function makeScene(canvas: HTMLCanvasElement, width: number, river: River, previous?: Scene | null): Scene {
  const cell = width / COLS, height = Math.round(cell * VIEW), ratio = Math.min(2, window.devicePixelRatio || 1);
  const context = fitCanvas(canvas, width, height);
  const { bg, rows } = paintBackground(river, width, cell, ratio);
  const make = (w: number, paint: (context: CanvasRenderingContext2D) => void, h = 1, pad = 0.15) => sprite(w, h, pad, cell, ratio, paint);
  const rain = new Float32Array(150);
  for (let i = 0; i < rain.length; i++) rain[i] = mod(Math.sin(i * 12.9898) * 43758.5453, 1);
  return {
    canvas, context, width, height, cell, ratio, river, bg, rows,
    sprites: {
      nouka: make(3, c => drawNouka(c, 3)), vela: make(2, c => drawVela(c, 2)), pana: make(2, c => drawPana(c, 2)), smallPana: make(1.5, c => drawPana(c, 1.5)),
      ferryR: make(5, c => drawFerry(c, 5, 1)), ferryL: make(5, c => drawFerry(c, 5, -1)),
      mango: make(0.6, c => { c.translate(0.3, 0.3); drawMango(c); }, 0.6),
      kid: make(0.8, c => { c.translate(0.4, 0.95); drawKid(c); }, 1.05),
    },
    cam: previous && previous.river === river ? previous.cam : -1, clock: 0, rain,
    popups: previous?.popups ?? Array.from({ length: 4 }, () => ({ text: "", x: 0, row: 0, age: 9, color: "" })),
    bellAt: -9, respawnAt: -9,
    hud: { tenths: -1, text: "", got: -1, mangoText: "", timeW: 0, mangoW: 0 },
    fonts: { popup: `700 ${Math.round(cell * 0.42)}px ${BODY_FONT}`, hud: `700 ${Math.round(cell * 0.36)}px ${BODY_FONT}` },
  };
}

/** A short word that floats up from a spot and fades (ছপাৎ!, +১ আম, ভোঁ!). */
export function popup(scene: Scene, text: string, x: number, row: number, color = "#ffffff") {
  let slot = scene.popups[0];
  for (const each of scene.popups) if (each.age > slot.age) slot = each;
  slot.text = text; slot.x = x; slot.row = row; slot.age = 0; slot.color = color;
}

export const ringBell = (scene: Scene) => { scene.bellAt = scene.clock; };
export const markRespawn = (scene: Scene) => { scene.respawnAt = scene.clock; };

function camRange(scene: Scene) {
  const n = scene.river.lanes.length - 1, low = -1, high = n + 2 - VIEW;
  return high < low ? [(low + high) / 2, (low + high) / 2] : [low, high];
}

/** Moves the camera towards the kid and ages the floating words. */
export function tickScene(scene: Scene, dt: number, run: Run | null) {
  scene.clock += dt;
  const [low, high] = camRange(scene);
  const row = run ? (run.down > 0 ? run.splashRow : run.row) : 0;
  const goal = Math.max(low, Math.min(high, row - 2.5));
  scene.cam += (goal - scene.cam) * Math.min(1, dt * 6);
  for (const each of scene.popups) each.age += dt;
}

/** Puts the camera where it belongs at once (a new river, a restart). */
export function settleCamera(scene: Scene, row = 0) {
  const [low, high] = camRange(scene);
  scene.cam = Math.max(low, Math.min(high, row - 2.5));
}

const ease = (p: number) => 1 - (1 - p) * (1 - p);

/** One frame. `run` is null on the ready screen (the river shown at its starting moment, the kid on the near ghat). */
export function drawScene(scene: Scene, run: Run | null, slow: boolean) {
  const { context: c, width, height, cell, river, sprites } = scene;
  const n = river.lanes.length - 1, t = run ? run.t : 0, clock = scene.clock;
  const rowTop = (row: number) => height - (row + 1 - scene.cam) * cell;
  // The visible slice of the painted river.
  const sy = (n + landPad(n) + 1 - scene.cam - VIEW) * cell;
  c.drawImage(scene.bg, 0, sy * scene.ratio, scene.bg.width, height * scene.ratio, 0, 0, width, height);

  const first = Math.max(1, Math.floor(scene.cam)), last = Math.min(n - 1, Math.ceil(scene.cam + VIEW));
  // Ripples that travel with each lane's current (and crests in a ferry's wake).
  c.strokeStyle = C.ripple; c.lineWidth = Math.max(1, cell * 0.04); c.lineCap = "round";
  c.beginPath();
  for (let row = first; row <= last; row++) {
    const lane = river.lanes[row];
    if (lane.type !== WATER) continue;
    const y = rowTop(row), drift = lane.dir * lane.speed * (run ? t : clock * 0.6);
    for (let k = 0; k < 4; k++) {
      const x = (mod(k * 2.4 + (row % 3) * 0.7 + drift, COLS + 1) - 0.5) * cell, yy = y + cell * (0.22 + ((k + row) % 3) * 0.26);
      c.moveTo(x, yy); c.lineTo(x + cell * 0.32, yy);
    }
    if (lane.wake) for (let k = 0; k < 6; k++) {
      const x = (mod(k * 1.6 - drift * 1.4, COLS + 1) - 0.5) * cell, yy = y + cell * (0.3 + (k % 2) * 0.4);
      c.moveTo(x - cell * 0.12, yy + cell * 0.08); c.lineTo(x, yy - cell * 0.04); c.lineTo(x + cell * 0.12, yy + cell * 0.08);
    }
  }
  c.stroke();

  // What floats.
  for (let row = first; row <= last; row++) {
    const lane = river.lanes[row];
    if (lane.type !== WATER) continue;
    const y = rowTop(row);
    for (const floater of lane.floaters) {
      const left = leftOf(lane, floater, t);
      if (left > COLS || left + floater.len < 0) continue;
      const x = left * cell;
      if (floater.kind === FERRY) {
        // The wake: white lines fanning out behind the stern.
        const stern = lane.dir > 0 ? x : x + floater.len * cell, back = -lane.dir * cell * 2.2;
        c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = Math.max(1.5, cell * 0.06);
        c.beginPath(); c.moveTo(stern, y + cell * 0.25); c.lineTo(stern + back, y - cell * 0.25); c.moveTo(stern, y + cell * 0.75); c.lineTo(stern + back, y + cell * 1.25); c.stroke();
        place(c, lane.dir > 0 ? sprites.ferryR : sprites.ferryL, x, y, cell);
        continue;
      }
      const s = floater.kind === NOUKA ? sprites.nouka : floater.kind === VELA ? sprites.vela : floater.len < 2 ? sprites.smallPana : sprites.pana;
      const dip = floater.kind === PANA ? dipOf(floater, t) : 0;
      if (dip === 0) { place(c, s, x, y, cell); continue; }
      if (dip < 1) {
        // Sinking: smaller and paler, so you see it going before it's gone.
        const k = 1 - 0.3 * dip, cx = x + floater.len * cell / 2, cy = y + cell / 2;
        c.globalAlpha = 1 - 0.55 * dip;
        c.save(); c.translate(cx, cy); c.scale(k, k); c.translate(-cx, -cy); place(c, s, x, y, cell); c.restore();
        c.globalAlpha = 1;
      }
      c.strokeStyle = "rgba(255,255,255,0.5)"; c.lineWidth = Math.max(1, cell * 0.035);
      c.beginPath(); c.ellipse(x + floater.len * cell / 2, y + cell / 2, floater.len * cell * 0.38, cell * 0.28, 0, 0, Math.PI * 2); c.stroke();
    }
  }

  // Mangoes still to pick.
  for (let index = 0; index < river.mangoes.length; index++) {
    const mango = river.mangoes[index];
    if (run && run.taken & (1 << index)) continue;
    if (mango.row < first - 1 || mango.row > last + 1) continue;
    const x = mangoX(river, mango, t);
    if (x < -0.5 || x > COLS + 0.5) continue;
    const bob = slow ? 0 : Math.sin(clock * 4 + index) * cell * 0.04;
    place(c, sprites.mango, (x - 0.3) * cell, rowTop(mango.row) + cell * 0.12 + bob, cell);
  }

  // The far ghat's bell (it swings when you arrive).
  const since = clock - scene.bellAt, swing = since < 2.5 && !slow ? Math.sin(since * 14) * 0.45 * Math.exp(-since * 2) : 0;
  c.save(); c.translate(6.75 * cell, rowTop(n) + cell * 0.55); c.scale(cell, cell); drawBell(c, swing); c.restore();

  // The kid.
  const kidRow = run ? run.row : 0, kidX = run ? run.x : START_X;
  if (!run || run.down <= 0) {
    let row = kidRow, x = kidX, lift = 0, scale = 1;
    if (run && run.hop > 0) {
      const p = ease(1 - run.hop / HOP_T);
      row = run.fromRow + (run.row - run.fromRow) * p; x = run.fromX + (run.x - run.fromX) * p; lift = Math.sin(Math.PI * p) * 0.32;
    }
    const sinceBack = clock - scene.respawnAt;
    if (sinceBack < 0.25 && !slow) scale = 0.6 + 0.4 * ease(sinceBack / 0.25);
    const feetX = x * cell, feetY = rowTop(row) + cell * 0.8;
    if (lift > 0) { c.fillStyle = "rgba(0,0,0,0.18)"; c.beginPath(); c.ellipse(feetX, feetY, cell * 0.2, cell * 0.07, 0, 0, Math.PI * 2); c.fill(); }
    const s = sprites.kid, w = (s.w + s.pad * 2) * cell * scale, h = (s.h + s.pad * 2) * cell * scale * (1 + lift * 0.25);
    c.drawImage(s.canvas, feetX - w / 2, feetY - (0.95 + s.pad) * cell * scale * (1 + lift * 0.25) - lift * cell, w, h);
    // Near the edge while the current pulls that way: a warning strip on that side of the kid's row.
    if (run && !run.done && run.hop === 0) {
      const lane = river.lanes[run.row];
      if (lane.type === WATER && ((lane.dir < 0 && run.x < 1.4) || (lane.dir > 0 && run.x > COLS - 1.4))) {
        c.fillStyle = "rgba(200,50,58,0.75)";
        c.fillRect(lane.dir < 0 ? 0 : width - cell * 0.12, rowTop(run.row), cell * 0.12, cell);
      }
    }
  } else {
    // In the water: rings spread from the splash (no drama, just water).
    const p = 1 - run.down / RESPAWN_T, x = run.splashX * cell, y = rowTop(run.splashRow) + cell * 0.55;
    c.strokeStyle = "rgba(255,255,255,0.85)"; c.lineWidth = Math.max(1.5, cell * 0.06);
    c.beginPath(); c.ellipse(x, y, cell * (0.15 + p * 0.55), cell * (0.08 + p * 0.25), 0, 0, Math.PI * 2); c.stroke();
    if (p > 0.25) { c.globalAlpha = 1 - p; c.beginPath(); c.ellipse(x, y, cell * (p * 0.9), cell * (p * 0.4), 0, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1; }
    if (!slow && p < 0.6) {
      c.fillStyle = "rgba(255,255,255,0.9)";
      for (let k = 0; k < 6; k++) { const a = -Math.PI * (0.15 + k * 0.14), r = cell * (0.2 + p * 0.6); c.fillRect(x + Math.cos(a) * r, y + Math.sin(a) * r * 1.3 + p * p * cell * 0.8, cell * 0.06, cell * 0.06); }
    }
  }

  // Rain on the monsoon rivers: slanted streaks (no flashes).
  if (river.rain) {
    c.strokeStyle = "rgba(225,238,246,0.45)"; c.lineWidth = 1;
    c.beginPath();
    const fall = slow ? clock * 0.25 : clock * 0.9;
    for (let i = 0; i < scene.rain.length; i += 3) {
      const x = mod(scene.rain[i] + fall * 0.25, 1) * width, y = mod(scene.rain[i + 1] + fall, 1) * height, len = cell * (0.3 + scene.rain[i + 2] * 0.3);
      c.moveTo(x, y); c.lineTo(x - len * 0.3, y + len);
    }
    c.stroke();
  }

  // Floating words.
  c.textAlign = "center"; c.lineJoin = "round";
  for (const each of scene.popups) {
    if (each.age > 0.9) continue;
    const p = each.age / 0.9;
    c.globalAlpha = 1 - p * p;
    c.font = scene.fonts.popup;
    const x = Math.max(cell * 1.2, Math.min(width - cell * 1.2, each.x * cell)), y = rowTop(each.row) - p * cell * 0.7;
    c.lineWidth = Math.max(3, cell * 0.1); c.strokeStyle = "rgba(30,40,40,0.75)"; c.strokeText(each.text, x, y);
    c.fillStyle = each.color; c.fillText(each.text, x, y);
  }
  c.globalAlpha = 1;

  // The clock and the mango count (text and widths are only remade when they change).
  const hud = scene.hud;
  c.font = scene.fonts.hud; c.textAlign = "left";
  const tenths = run ? Math.round((run.done ? run.time : t) * 10) : 0, got = run ? run.got : 0;
  if (tenths !== hud.tenths) { hud.tenths = tenths; hud.text = `${bn.format(Math.floor(tenths / 10))}.${bn.format(tenths % 10)} সে`; hud.timeW = c.measureText(hud.text).width + cell * 0.5; }
  if (got !== hud.got) { hud.got = got; hud.mangoText = `${bn.format(got)}/${bn.format(river.mangoes.length)}`; hud.mangoW = c.measureText(hud.mangoText).width + cell * 0.95; }
  const pill = cell * 0.62, timeW = hud.timeW, mangoW = hud.mangoW;
  c.fillStyle = "rgba(32,40,38,0.62)";
  c.beginPath(); c.roundRect(cell * 0.15, cell * 0.15, timeW, pill, pill / 2); c.roundRect(width - cell * 0.15 - mangoW, cell * 0.15, mangoW, pill, pill / 2); c.fill();
  c.fillStyle = "#fff8e6";
  c.fillText(scene.hud.text, cell * 0.4, cell * 0.15 + pill * 0.68);
  c.fillText(scene.hud.mangoText, width - cell * 0.15 - mangoW + cell * 0.72, cell * 0.15 + pill * 0.68);
  place(c, sprites.mango, width - cell * 0.15 - mangoW + cell * 0.06, cell * 0.16, cell);
}
