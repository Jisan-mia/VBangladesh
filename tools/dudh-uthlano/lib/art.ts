// The kitchen's still art, drawn in code: three kitchens (morning gas, dusk clay, night gas), three vessels with their lids, and the
// data the live drawing (draw.hot.ts) reads. Painted once into offscreen canvases (prepare) at the screen's pixel ratio.
// All in a 360×380 virtual space: the pot sits at the old coordinates, shifted down by DY under a taller wall.
import { bn } from "./challenge";
import type { Pot, Stove, Vessel } from "./pot";

export const VW = 360, VH = 380, DY = 80;
export const CX = 168, TAU = Math.PI * 2;

export type Shape = { rimY: number; rx: number; ry: number; baseY: number; rxb: number; depth: number; box: { x: number; y: number; w: number; h: number } };
// Every pot's bottom sits at y≈215 on the burner; `depth` is how far the foam climbs on screen from the start to the rim.
export const SHAPES: Record<Vessel, Shape> = {
  dekchi: { rimY: 122, rx: 98, ry: 43, baseY: 181, rxb: 84, depth: 58, box: { x: 50, y: 70, w: 236, h: 152 } },
  patil: { rimY: 132, rx: 86, ry: 36, baseY: 181, rxb: 80, depth: 54, box: { x: 74, y: 88, w: 240, h: 134 } },
  hari: { rimY: 108, rx: 70, ry: 30, baseY: 191, rxb: 56, depth: 46, box: { x: 56, y: 70, w: 224, h: 154 } },
};
export const LID_BOX: Record<Vessel, { x: number; y: number; w: number; h: number }> = {
  dekchi: { x: 40, y: 70, w: 256, h: 110 },
  patil: { x: 66, y: 86, w: 256, h: 100 },
  hari: { x: 48, y: 54, w: 240, h: 100 },
};

export const MILK = "#fffaf0", MILK_EDGE = "#eadcc2", FOAM = "#ffffff", FOAM_LINE = "#e3d4b8", INK = "#2a211c";
export const PCT = Array.from({ length: 101 }, (_, value) => `${bn(value)}%`);

// Same foam every time: a fixed scatter of bubbles on the milk, denser near the pot wall where foam gathers.
export const BUBBLES = (() => {
  let seed = 11;
  const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 18 }, () => {
    const angle = next() * TAU, reach = Math.sqrt(0.25 + 0.75 * next());
    return [Math.cos(angle) * reach, Math.sin(angle) * reach, 0.6 + next() * 0.8, next() * TAU] as const;
  });
})();
export const MOUND = [[0, 0, 1], [-0.5, 0.2, 0.75], [0.5, 0.15, 0.8], [-0.22, -0.4, 0.62], [0.28, -0.35, 0.66], [-0.9, 0.3, 0.5], [0.95, 0.28, 0.52]] as const;
export const DRIPS = [[0.55, 30], [1.25, 44], [1.9, 26], [2.5, 36]] as const;

function rimPath(context: CanvasRenderingContext2D, shape: Shape) {
  context.beginPath();
  context.ellipse(CX, shape.rimY, shape.rx - 3, shape.ry - 2, 0, 0, TAU);
}

/** Inside the pot: the far wall and the back half of the lip. */
export function drawPotBack(context: CanvasRenderingContext2D, vessel: Vessel) {
  const shape = SHAPES[vessel], clay = vessel === "hari";
  const wall = context.createLinearGradient(0, shape.rimY - shape.ry, 0, shape.rimY + shape.ry);
  wall.addColorStop(0, clay ? "#3e1a0c" : "#737c83");
  wall.addColorStop(1, clay ? "#80401f" : "#c9cfd3");
  rimPath(context, shape);
  context.fillStyle = wall;
  context.fill();
  context.lineWidth = clay ? 8 : 6;
  context.strokeStyle = clay ? "#a64d29" : "#dfe4e7";
  context.beginPath();
  context.ellipse(CX, shape.rimY, shape.rx, shape.ry, 0, Math.PI, TAU);
  context.stroke();
}

/** The pot's outside, the front half of the lip and its handles. */
export function drawPotFront(context: CanvasRenderingContext2D, vessel: Vessel) {
  const shape = SHAPES[vessel], { rimY, rx, ry, baseY, rxb } = shape, ryb = rxb * ry / rx, clay = vessel === "hari";
  const body = context.createLinearGradient(CX - rx - 36, 0, CX + rx + 36, 0);
  const stops = clay
    ? [[0, "#6e2a14"], [0.24, "#c0603a"], [0.36, "#de8a5c"], [0.55, "#b8552e"], [1, "#6b2812"]] as const
    : [[0, "#7f888f"], [0.2, "#d3d8db"], [0.33, "#f6f8f9"], [0.5, "#c2c8cc"], [0.84, "#99a1a7"], [1, "#6d767d"]] as const;
  for (const [at, color] of stops) body.addColorStop(at, color);

  context.beginPath();
  context.moveTo(CX - rx, rimY);
  if (clay) {
    context.bezierCurveTo(CX - rx - 4, rimY + 22, CX - 104, rimY + 22, CX - 104, 160);
    context.bezierCurveTo(CX - 104, 180, CX - 80, baseY - 4, CX - rxb, baseY);
  } else context.lineTo(CX - rxb, baseY);
  context.ellipse(CX, baseY, rxb, ryb, 0, Math.PI, 0, true);
  if (clay) {
    context.bezierCurveTo(CX + 80, baseY - 4, CX + 104, 180, CX + 104, 160);
    context.bezierCurveTo(CX + 104, rimY + 22, CX + rx + 4, rimY + 22, CX + rx, rimY);
  } else context.lineTo(CX + rx, rimY);
  context.ellipse(CX, rimY, rx, ry, 0, 0, Math.PI);
  context.closePath();
  context.fillStyle = body;
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = clay ? "#55220f" : "#4f565c";
  context.stroke();

  if (clay) {
    // The painted rings village potters put on a হাঁড়ি.
    context.save();
    context.clip();
    context.strokeStyle = "#f3dcc0";
    context.lineWidth = 2.5;
    for (const ringY of [148, 158]) { context.beginPath(); context.ellipse(CX, ringY, 106, 16, 0, 0.08, Math.PI - 0.08); context.stroke(); }
    context.fillStyle = "#f3dcc0";
    for (let dot = 0; dot < 9; dot++) {
      const angle = 0.35 + dot * (Math.PI - 0.7) / 8;
      context.beginPath(); context.arc(CX + Math.cos(angle) * 104, 153 + Math.sin(angle) * 16, 2.2, 0, TAU); context.fill();
    }
    context.restore();
  } else {
    // A soft dent of light down the metal.
    context.fillStyle = "rgba(255,255,255,.35)";
    context.beginPath(); context.ellipse(CX - rx * 0.42, (rimY + ry + baseY) / 2 + 4, 7, (baseY - rimY) * 0.38, 0.06, 0, TAU); context.fill();
  }

  context.lineCap = "round";
  if (vessel === "dekchi") {
    context.strokeStyle = "#868f95"; context.lineWidth = 5;
    for (const side of [-1, 1]) { context.beginPath(); context.ellipse(CX + side * (rx + 1), rimY + 14, 11, 6, 0, side < 0 ? Math.PI * 0.5 : -Math.PI * 0.5, side < 0 ? Math.PI * 1.5 : Math.PI * 0.5); context.stroke(); }
  } else if (vessel === "patil") {
    context.strokeStyle = "#9aa2a8"; context.lineWidth = 7;
    context.beginPath(); context.moveTo(CX + rx - 8, rimY + 16); context.lineTo(CX + rx + 30, rimY + 8); context.stroke();
    context.strokeStyle = "#6b4226"; context.lineWidth = 11;
    context.beginPath(); context.moveTo(CX + rx + 28, rimY + 8); context.lineTo(CX + rx + 52, rimY + 3); context.stroke();
  }
  context.lineWidth = clay ? 8 : 6;
  context.strokeStyle = clay ? "#b5582f" : "#eef1f3";
  context.beginPath(); context.ellipse(CX, rimY, rx, ry, 0, 0, Math.PI); context.stroke();
  context.lineWidth = 1.5;
  context.strokeStyle = clay ? "#55220f" : "#5c646a";
  context.beginPath(); context.ellipse(CX, rimY, rx + (clay ? 4 : 3), ry + (clay ? 4 : 3), 0, 0, TAU); context.stroke();
  context.lineCap = "butt";
}

/** The lid: a steel dome with a knob, or a clay plate (সরা). Drawn closed on the rim, in pot space. */
export function drawLid(context: CanvasRenderingContext2D, vessel: Vessel) {
  const { rimY, rx, ry } = SHAPES[vessel], clay = vessel === "hari", top = rimY - 30;
  const body = context.createLinearGradient(CX - rx, 0, CX + rx, 0);
  const stops = clay ? [[0, "#7a3318"], [0.3, "#d98458"], [0.55, "#b8552e"], [1, "#6b2812"]] as const : [[0, "#8a939a"], [0.28, "#f2f4f5"], [0.5, "#c5cbcf"], [1, "#7a838a"]] as const;
  for (const [at, color] of stops) body.addColorStop(at, color);
  context.beginPath();
  context.ellipse(CX, rimY, rx + 3, ry + 3, 0, Math.PI, TAU);
  context.quadraticCurveTo(CX + rx * 0.5, top - 4, CX, top);
  context.quadraticCurveTo(CX - rx * 0.5, top - 4, CX - rx - 3, rimY);
  context.closePath();
  context.fillStyle = body; context.fill();
  context.beginPath();
  context.ellipse(CX, rimY, rx + 3, ry + 3, 0, 0, Math.PI);
  context.quadraticCurveTo(CX, rimY + ry + 3, CX - rx - 3, rimY);
  context.fillStyle = body; context.fill();
  context.lineWidth = 2; context.strokeStyle = clay ? "#55220f" : "#4f565c";
  context.beginPath(); context.ellipse(CX, rimY, rx + 3, ry + 3, 0, 0, TAU); context.stroke();
  context.beginPath(); context.moveTo(CX - rx - 3, rimY); context.quadraticCurveTo(CX - rx * 0.5, top - 4, CX, top); context.quadraticCurveTo(CX + rx * 0.5, top - 4, CX + rx + 3, rimY); context.stroke();
  context.fillStyle = clay ? "#8e3d1d" : "#4a3322";
  context.beginPath(); context.roundRect(CX - 7, top - 12, 14, 12, 4); context.fill();
  context.fillStyle = "rgba(255,255,255,.4)";
  context.beginPath(); context.ellipse(CX - rx * 0.4, rimY - 8, 8, 14, 0.5, 0, TAU); context.fill();
}

// A tiny fixed-seed scatter for granite speckle and mud smears, so the background never changes between draws.
function scatter(seed: number) {
  return () => (seed = (seed * 48271) % 2147483647) / 2147483647;
}

type Palette = { wall: string; tile: string; counter: string; cabinet: string; cabinetLine: string; stove: string; jars: string[]; sky: string };
const PALETTES: Palette[] = [
  { wall: "#dcefe8", tile: "#c4e0d6", counter: "#4f5c57", cabinet: "#9b7350", cabinetLine: "#7c5a3c", stove: "#b8bfc3", jars: ["#efb62f", "#c8392b", "#b98a4e"], sky: "#bfe6ff" },
  { wall: "#e3b47f", tile: "#c9976a", counter: "#c08a55", cabinet: "#c08a55", cabinetLine: "#7a4022", stove: "#9c5a32", jars: ["#efb62f", "#c8392b", "#b98a4e"], sky: "#f6a55f" },
  { wall: "#2c3b5e", tile: "#243252", counter: "#1d242a", cabinet: "#5a4330", cabinetLine: "#3f2f20", stove: "#7d868c", jars: ["#a8802a", "#8a2f26", "#7b6139"], sky: "#0f1633" },
];

function windowPane(context: CanvasRenderingContext2D, scene: number, sky: string) {
  const x = 26, y = 12, w = 112, h = 82;
  context.fillStyle = scene === 1 ? "#7a4a2a" : scene === 2 ? "#4a3a2c" : "#f2efe4";
  context.beginPath(); context.roundRect(x - 6, y - 6, w + 12, h + 12, 8); context.fill();
  context.fillStyle = sky; context.fillRect(x, y, w, h);
  if (scene === 0) {
    context.fillStyle = "#fff3b0"; context.beginPath(); context.arc(x + 78, y + 28, 15, 0, TAU); context.fill();
    context.strokeStyle = "#ffe27a"; context.lineWidth = 3; context.lineCap = "round";
    for (let ray = 0; ray < 8; ray++) { const a = ray * TAU / 8; context.beginPath(); context.moveTo(x + 78 + Math.cos(a) * 20, y + 28 + Math.sin(a) * 20); context.lineTo(x + 78 + Math.cos(a) * 27, y + 28 + Math.sin(a) * 27); context.stroke(); }
    context.fillStyle = "#6bb36b"; context.fillRect(x, y + h - 14, w, 14);
    context.fillStyle = "rgba(255,255,255,.55)"; context.beginPath(); context.ellipse(x + 30, y + 22, 18, 7, 0, 0, TAU); context.fill();
  } else if (scene === 1) {
    context.fillStyle = "#ffd98a"; context.beginPath(); context.arc(x + 60, y + h - 14, 22, Math.PI, TAU); context.fill();
    context.fillStyle = "#3d5a2a"; context.fillRect(x, y + h - 12, w, 12);
    context.fillStyle = "#2e4620"; context.beginPath(); context.moveTo(x + 8, y + h - 12); context.lineTo(x + 18, y + h - 36); context.lineTo(x + 28, y + h - 12); context.fill();
  } else {
    context.fillStyle = "#f6f1c9"; context.beginPath(); context.arc(x + 80, y + 26, 12, 0, TAU); context.fill();
    context.fillStyle = sky; context.beginPath(); context.arc(x + 86, y + 22, 11, 0, TAU); context.fill();
    context.fillStyle = "#ffffffcc";
    for (const [sx, sy] of [[16, 14], [40, 30], [58, 12], [28, 52], [96, 56], [104, 14]]) context.fillRect(x + sx, y + sy, 2, 2);
  }
  context.strokeStyle = scene === 1 ? "#7a4a2a" : scene === 2 ? "#4a3a2c" : "#f2efe4"; context.lineWidth = 4;
  context.beginPath(); context.moveTo(x + w / 2, y); context.lineTo(x + w / 2, y + h); context.moveTo(x, y + h / 2); context.lineTo(x + w, y + h / 2); context.stroke();
}

/** The static kitchen behind the pot, edge to edge in the virtual space. */
export function drawBackground(context: CanvasRenderingContext2D, scene: 0 | 1 | 2) {
  const P = PALETTES[scene], random = scatter(5 + scene * 4);
  if (scene === 1) {
    // A mud kitchen: লেপা wall and floor, a window, a string of chillies, a little niche and a মাটির চুলা.
    context.fillStyle = P.wall; context.fillRect(0, 0, VW, DY + 236);
    context.strokeStyle = "rgba(170,110,60,.28)"; context.lineWidth = 3; context.lineCap = "round";
    for (let smear = 0; smear < 22; smear++) {
      const x = random() * VW, y = 6 + random() * (DY + 220), length = 30 + random() * 60;
      context.beginPath(); context.moveTo(x, y); context.quadraticCurveTo(x + length / 2, y - 6, x + length, y); context.stroke();
    }
    context.lineCap = "butt";
    windowPane(context, 1, P.sky);
    context.strokeStyle = "#7a5a3a"; context.lineWidth = 2;
    context.beginPath(); context.moveTo(268, 8); context.lineTo(268, 18); context.stroke();
    for (let chilli = 0; chilli < 7; chilli++) {
      context.fillStyle = chilli % 3 === 1 ? "#b3261e" : "#d6382a";
      context.beginPath(); context.ellipse(268 + (chilli % 2 ? 6 : -6), 24 + chilli * 9, 4, 8, chilli % 2 ? 0.3 : -0.3, 0, TAU); context.fill();
    }
    context.save(); context.translate(0, DY);
    context.fillStyle = "#a8703f"; context.beginPath(); context.moveTo(26, 96); context.lineTo(26, 52); context.arc(54, 52, 28, Math.PI, 0); context.lineTo(82, 96); context.closePath(); context.fill();
    context.fillStyle = "#b5582f"; context.beginPath(); context.ellipse(54, 82, 13, 12, 0, 0, TAU); context.fill();
    context.fillStyle = "#8e3d1d"; context.fillRect(48, 66, 12, 6);
    context.fillStyle = "#c08a55"; context.fillRect(0, 236, VW, 64);
    context.strokeStyle = "rgba(120,70,30,.25)"; context.lineWidth = 2;
    for (let line = 0; line < 6; line++) { const y = 246 + line * 9; context.beginPath(); context.moveTo(0, y); context.quadraticCurveTo(VW / 2, y + 4, VW, y); context.stroke(); }
    context.fillStyle = "#9c5a32"; context.beginPath(); context.roundRect(CX - 92, 210, 184, 64, [26, 26, 6, 6]); context.fill();
    context.fillStyle = "#b46a3c"; context.beginPath(); context.ellipse(CX, 214, 90, 14, 0, 0, TAU); context.fill();
    context.fillStyle = "#6b3518"; context.beginPath(); context.ellipse(CX, 215, 60, 8, 0, 0, TAU); context.fill();
    context.strokeStyle = "#7a4022"; context.lineWidth = 2; context.beginPath(); context.roundRect(CX - 92, 210, 184, 64, [26, 26, 6, 6]); context.stroke();
    context.strokeStyle = "#5c3a1e"; context.lineWidth = 7; context.lineCap = "round";
    context.beginPath(); context.moveTo(CX - 8, 266); context.lineTo(CX - 54, 290); context.moveTo(CX + 6, 268); context.lineTo(CX + 40, 292); context.stroke();
    context.restore();
    return;
  }
  // A gas kitchen: tiles, a window, a spice shelf, a ladle, the counter and a glass-top stove.
  context.fillStyle = P.wall; context.fillRect(0, 0, VW, DY + 210);
  context.strokeStyle = P.tile; context.lineWidth = 1;
  for (let y = 18; y < DY + 210; y += 26) { context.beginPath(); context.moveTo(0, y + 0.5); context.lineTo(VW, y + 0.5); context.stroke(); }
  for (let row = 0; row < 12; row++) for (let x = (row % 2) * 13; x < VW; x += 26) { context.beginPath(); context.moveTo(x + 0.5, row * 26 - 8 + 18); context.lineTo(x + 0.5, row * 26 + 18 + 18); context.stroke(); }
  windowPane(context, scene, P.sky);
  context.save(); context.translate(0, DY);
  context.fillStyle = "#9b6a40"; context.fillRect(14, 54, 104, 6);
  P.jars.forEach((spice, index) => {
    const x = 22 + index * 32;
    context.fillStyle = scene === 2 ? "rgba(255,255,255,.4)" : "rgba(255,255,255,.75)"; context.beginPath(); context.roundRect(x, 24, 24, 30, 5); context.fill();
    context.fillStyle = spice; context.beginPath(); context.roundRect(x + 2, 34, 20, 18, 4); context.fill();
    context.fillStyle = "#47555d"; context.fillRect(x + 1, 19, 22, 6);
  });
  context.strokeStyle = "#7d868c"; context.lineWidth = 3; context.lineCap = "round";
  context.beginPath(); context.moveTo(258, 12); context.lineTo(258, 50); context.stroke();
  context.fillStyle = "#9aa2a8"; context.beginPath(); context.ellipse(258, 57, 10, 8, 0, 0, TAU); context.fill();
  context.strokeStyle = "#5c646a"; context.lineWidth = 2; context.beginPath(); context.arc(258, 8, 4, 0, TAU); context.stroke();
  context.lineCap = "butt";
  context.fillStyle = P.counter; context.fillRect(0, 204, VW, 20);
  context.fillStyle = "rgba(255,255,255,.18)";
  for (let speck = 0; speck < 70; speck++) context.fillRect(random() * VW, 205 + random() * 18, 1.5, 1.5);
  context.fillStyle = P.cabinet; context.fillRect(0, 224, VW, 156);
  context.strokeStyle = P.cabinetLine; context.lineWidth = 2;
  for (const x of [120, 240]) { context.beginPath(); context.moveTo(x, 252); context.lineTo(x, 380); context.stroke(); }
  context.fillStyle = "#24292d"; context.beginPath(); context.roundRect(56, 200, 248, 22, 6); context.fill();
  context.fillStyle = P.stove; context.beginPath(); context.roundRect(60, 222, 240, 26, [0, 0, 8, 8]); context.fill();
  for (const knobX of [104, 232]) {
    context.fillStyle = "#1e2226"; context.beginPath(); context.arc(knobX, 235, 8, 0, TAU); context.fill();
    context.strokeStyle = "#f2f2f2"; context.lineWidth = 2; context.beginPath(); context.moveTo(knobX, 235); context.lineTo(knobX, 228); context.stroke();
  }
  context.fillStyle = "#121517"; context.beginPath(); context.ellipse(CX, 216, 52, 9, 0, 0, TAU); context.fill();
  context.fillStyle = "#3a4045"; context.beginPath(); context.ellipse(CX, 215, 30, 5, 0, 0, TAU); context.fill();
  context.fillStyle = "#121517"; context.beginPath(); context.ellipse(272, 211, 22, 5, 0, 0, TAU); context.fill();
  context.restore();
}

/** The lights-out layer: black everywhere but a warm pool round the stove. */
export function drawNight(context: CanvasRenderingContext2D) {
  const glow = context.createRadialGradient(CX, DY + 190, 24, CX, DY + 190, 250);
  glow.addColorStop(0, "rgba(6,8,22,0)");
  glow.addColorStop(0.35, "rgba(6,8,22,.45)");
  glow.addColorStop(1, "rgba(6,8,22,.93)");
  context.fillStyle = glow;
  context.fillRect(0, 0, VW, VH);
}

export type SceneCache = {
  ratio: number;
  bg: (HTMLCanvasElement | undefined)[];
  back: Partial<Record<Vessel, HTMLCanvasElement>>;
  front: Partial<Record<Vessel, HTMLCanvasElement>>;
  lid: Partial<Record<Vessel, HTMLCanvasElement>>;
  night?: HTMLCanvasElement;
};
export const newCache = (ratio: number): SceneCache => ({ ratio, bg: [], back: {}, front: {}, lid: {} });

function sprite(ratio: number, box: { x: number; y: number; w: number; h: number }, paint: (context: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(box.w * ratio);
  canvas.height = Math.ceil(box.h * ratio);
  const context = canvas.getContext("2d")!;
  context.setTransform(ratio, 0, 0, ratio, -box.x * ratio, -box.y * ratio);
  paint(context);
  return canvas;
}
const FULL = { x: 0, y: 0, w: VW, h: VH };

/** Paints whatever this pot needs and the cache doesn't hold yet. Called when a pot comes on, never inside a frame. */
export function prepare(cache: SceneCache, pot: Pick<Pot, "scene" | "vessel" | "lid" | "dark">) {
  const { ratio } = cache, shape = SHAPES[pot.vessel];
  cache.bg[pot.scene] ??= sprite(ratio, FULL, paint => drawBackground(paint, pot.scene));
  cache.back[pot.vessel] ??= sprite(ratio, shape.box, paint => drawPotBack(paint, pot.vessel));
  cache.front[pot.vessel] ??= sprite(ratio, shape.box, paint => drawPotFront(paint, pot.vessel));
  if (pot.lid) cache.lid[pot.vessel] ??= sprite(ratio, LID_BOX[pot.vessel], paint => drawLid(paint, pot.vessel));
  if (pot.dark) cache.night ??= sprite(ratio, FULL, drawNight);
}

export type { Stove, Vessel };
