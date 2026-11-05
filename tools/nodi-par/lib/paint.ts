// Builds the river's picture once: the banks, chars and water painted into one tall offscreen canvas, every floater, the mango, the boy
// and the edge pointers as pre-painted sprites, and the glows as gradients. A frame (draw.hot.ts) is then a handful of drawImage calls.
import { BODY_FONT } from "../../../shared/card-canvas";
import { fitCanvas } from "../../../shared/game-kit";
import { makeRng } from "../../../shared/game-core";
import { LOOKS, drawBell, drawBush, drawHut, drawChevron, drawFerry, drawKash, drawKid, drawMango, drawNouka, drawPana, drawSteps, drawTree, drawVela, type LookName } from "./art";
import { FINALES, WORLDS, worldOf } from "./levels";
import { BANK, CHAR, COLS, mod, type River } from "./river";

type Sprite = { canvas: HTMLCanvasElement; w: number; h: number; pad: number };
type Popup = { text: string; x: number; row: number; age: number; color: string };

export type Scene = {
  canvas: HTMLCanvasElement; context: CanvasRenderingContext2D; width: number; height: number; cell: number; ratio: number;
  /** Rows on screen at once (fractional: the stage decides). */
  view: number; land: number;
  river: River; look: LookName; bg: HTMLCanvasElement; rows: number;
  sprites: { nouka: Sprite; vela: Sprite; pana: Sprite; smallPana: Sprite; ferryR: Sprite; ferryL: Sprite; mango: Sprite; kid: Sprite; chevR: Sprite; chevL: Sprite; chevGold: Sprite };
  glows: { left: CanvasGradient; right: CanvasGradient; bottom: CanvasGradient };
  cam: number; clock: number; rain: Float32Array; popups: Popup[]; bellAt: number; respawnAt: number;
  hud: { tenths: number; text: string; timeW: number; got: number; mangoText: string; mangoW: number; chain: number; chainText: string; row: number; rowText: string };
  fonts: { popup: string; hud: string; small: string };
  finale: string;
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

/** Land rows kept past each bank: at least 3, more when the river is shorter than the stage is tall. */
export const landPad = (n: number, view: number) => Math.max(3, Math.ceil((view - n - 1) / 2) + 2);

/** Paints the whole river column (banks, chars, water, ghats, trees, the exit arrows) once. */
function paintBackground(river: River, look: LookName, width: number, view: number, cell: number, ratio: number) {
  const n = river.lanes.length - 1, pad = landPad(n, view), rows = n + pad * 2 + 1, palette = LOOKS[look];
  const bg = document.createElement("canvas");
  bg.width = Math.ceil(width * ratio); bg.height = Math.ceil(rows * cell * ratio);
  const c = bg.getContext("2d")!;
  c.scale(ratio * cell, ratio * cell); // from here on, units are cells
  const top = (row: number) => n + pad - row, cols = width / cell;
  c.fillStyle = palette.grass; c.fillRect(0, 0, cols, rows);
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
      c.fillStyle = palette.sand; c.fillRect(0, y, cols, 1);
      c.fillStyle = "#cdb47c"; c.fillRect(0, y, cols, 0.1); c.fillRect(0, y + 0.9, cols, 0.1);
      continue;
    }
    c.fillStyle = palette.water; c.fillRect(0, y, cols, 1);
    // Lanes flowing right are a shade lighter than lanes flowing left, so the eye reads the current.
    c.fillStyle = lane.dir > 0 ? "rgba(255,255,255,0.07)" : "rgba(0,30,40,0.07)"; c.fillRect(0, y, cols, 1);
    c.fillStyle = "rgba(255,255,255,0.05)"; c.fillRect(0, y + 0.47, cols, 0.04);
    // The exit: a faint arrow at the edge this lane's current runs to, so "where you get swept" is always in sight.
    const ex = lane.dir > 0 ? cols - 0.34 : 0.34, point = lane.dir;
    c.strokeStyle = "rgba(255,255,255,0.4)"; c.lineWidth = 0.07; c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); c.moveTo(ex - point * 0.1, y + 0.3); c.lineTo(ex + point * 0.08, y + 0.5); c.lineTo(ex - point * 0.1, y + 0.7); c.stroke();
  }
  c.lineCap = "butt";
  // Muddy edges where land meets water.
  c.fillStyle = palette.mud;
  c.fillRect(0, top(0), cols, 0.16); c.fillRect(0, top(n) + 0.84, cols, 0.16);
  c.save(); c.translate(3, top(0) - 0.02); drawSteps(c, 3, 0.5, false); c.restore();
  c.save(); c.translate(3, top(n) + 0.52); drawSteps(c, 3, 0.5, true); c.restore();
  river.lanes.forEach((lane, row) => {
    if (lane.type !== CHAR) return;
    for (const x of [0.6, 2.1, 6.9, 8.4]) { c.save(); c.translate(x, top(row) + 0.85); drawKash(c); c.restore(); }
  });
  for (const [x, row, size] of [[0.9, n + 2, 1.1], [7.8, n + 2, 1.2], [2.2, n + 1, 0.9], [8.3, n + 1, 0.8], [0.6, -1, 1], [8.2, -2, 1.2], [1.8, -3, 1], [6.9, -1, 0.85]] as const) {
    c.save(); c.translate(x, top(row) + 0.9); drawTree(c, size); c.restore();
  }
  // More of the village on the long land rows when the stage is tall: trees, bushes and a hut, scattered from the river's seed (the same every time).
  const rng = makeRng(river.seed + 17);
  for (let row = -pad; row <= n + pad; row++) {
    if (row >= -1 && row <= n + 1) continue;
    for (let k = 0; k < 3; k++) {
      const x = 0.4 + rng() * (cols - 0.8), kind = rng();
      if (Math.abs(x - 4.5) < 1.5 || kind > 0.75) continue;
      c.save(); c.translate(x, top(row) + 0.9);
      if (kind < 0.45) drawTree(c, 0.8 + rng() * 0.4); else drawBush(c);
      c.restore();
    }
  }
  c.save(); c.translate(7.4, top(n + 3) + 0.9); drawHut(c); c.restore();
  c.fillStyle = palette.tint; c.fillRect(0, 0, cols, rows);
  return { bg, rows, pad };
}

/** Builds the scene for a river at this stage size (also on a resize or a new river). */
export function makeScene(canvas: HTMLCanvasElement, width: number, height: number, river: River, previous?: Scene | null): Scene {
  const cell = width / COLS, view = height / cell, ratio = Math.min(2, window.devicePixelRatio || 1);
  const look = WORLDS[worldOf(river.level)].look;
  const context = fitCanvas(canvas, width, height);
  const { bg, rows, pad } = paintBackground(river, look, width, view, cell, ratio);
  const make = (w: number, paint: (context: CanvasRenderingContext2D) => void, h = 1, margin = 0.15) => sprite(w, h, margin, cell, ratio, paint);
  const rain = new Float32Array(150);
  for (let i = 0; i < rain.length; i++) rain[i] = mod(Math.sin(i * 12.9898) * 43758.5453, 1);
  const side = (from: number, to: number, red: string) => {
    const gradient = context.createLinearGradient(from, 0, to, 0);
    gradient.addColorStop(0, red); gradient.addColorStop(1, "rgba(214,40,40,0)");
    return gradient;
  };
  const reach = cell * 1.5, bottom = context.createLinearGradient(0, height, 0, height - reach);
  bottom.addColorStop(0, "rgba(255,150,20,1)"); bottom.addColorStop(1, "rgba(255,170,30,0)");
  return {
    canvas, context, width, height, cell, ratio, view, land: pad,
    river, look, bg, rows,
    sprites: {
      nouka: make(3, c => drawNouka(c, 3)), vela: make(2, c => drawVela(c, 2)), pana: make(2, c => drawPana(c, 2)), smallPana: make(1.5, c => drawPana(c, 1.5)),
      ferryR: make(5, c => drawFerry(c, 5, 1)), ferryL: make(5, c => drawFerry(c, 5, -1)),
      mango: make(0.6, c => { c.translate(0.3, 0.3); drawMango(c); }, 0.6),
      kid: make(0.8, c => { c.translate(0.4, 0.95); drawKid(c); }, 1.05),
      chevR: make(1, c => { c.translate(0.5, 0.5); drawChevron(c, "#c8323a"); }, 1, 0.1),
      chevL: make(1, c => { c.translate(0.5, 0.5); c.scale(-1, 1); drawChevron(c, "#c8323a"); }, 1, 0.1),
      chevGold: make(1, c => { c.translate(0.5, 0.5); c.rotate(-Math.PI / 2); drawChevron(c, "#d9962b"); }, 1, 0.1),
    },
    glows: { left: side(0, reach, "rgba(214,40,40,0.9)"), right: side(width, width - reach, "rgba(214,40,40,0.9)"), bottom },
    cam: previous && previous.river === river && previous.height === height ? previous.cam : -9, clock: 0, rain,
    popups: previous?.popups ?? Array.from({ length: 4 }, () => ({ text: "", x: 0, row: 0, age: 9, color: "" })),
    bellAt: -9, respawnAt: -9,
    hud: { tenths: -1, text: "", timeW: 0, got: -1, mangoText: "", mangoW: 0, chain: -1, chainText: "", row: -1, rowText: "" },
    fonts: { popup: `700 ${Math.round(cell * 0.4)}px ${BODY_FONT}`, hud: `700 ${Math.round(cell * 0.36)}px ${BODY_FONT}`, small: `700 ${Math.round(cell * 0.28)}px ${BODY_FONT}` },
    finale: FINALES[river.level] ?? "",
  };
}

/** A short word that floats up from a spot and fades (ছপাৎ!, +১). */
export function popup(scene: Scene, text: string, x: number, row: number, color = "#ffffff") {
  let slot = scene.popups[0];
  for (const each of scene.popups) if (each.age > slot.age) slot = each;
  slot.text = text; slot.x = x; slot.row = row; slot.age = 0; slot.color = color;
}

export const ringBell = (scene: Scene) => { scene.bellAt = scene.clock; };
export const markRespawn = (scene: Scene) => { scene.respawnAt = scene.clock; };

/** The HUD's words and the widths of their pills, remade only when a number changes (so a frame builds no strings). */
export function refreshHud(scene: Scene, tenths: number, got: number, chain: number, row: number) {
  const hud = scene.hud, c = scene.context;
  c.font = scene.fonts.hud;
  if (tenths !== hud.tenths) { hud.tenths = tenths; hud.text = `${bn.format(Math.floor(tenths / 10))}.${bn.format(tenths % 10)} সে`; hud.timeW = Math.max(scene.cell * 2.6, c.measureText(hud.text).width + scene.cell * 0.6); }
  if (got !== hud.got) { hud.got = got; hud.mangoText = `${bn.format(got)}/${bn.format(scene.river.mangoes.length)}`; hud.mangoW = c.measureText(hud.mangoText).width + scene.cell * 1.05; }
  if (chain !== hud.chain) { hud.chain = chain; hud.chainText = chain >= 4 ? `টানা ${bn.format(chain)}` : ""; }
  if (row !== hud.row) { hud.row = row; hud.rowText = `${bn.format(row)}/${bn.format(scene.river.lanes.length - 1)}`; }
}

/** Forget the cached HUD text (a font arrived late and the pills were measured in the fallback). */
export function resetHud(scene: Scene) { scene.hud.tenths = -1; scene.hud.got = -1; scene.hud.chain = -1; scene.hud.row = -1; }
