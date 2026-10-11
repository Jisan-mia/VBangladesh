// The kitchen drawn on canvas: two stoves, three pots, the milk and its foam, the flame and the gauge.
// All in a 360×300 virtual space; the game scales it to the canvas and the card scales it up.
import { BODY_FONT, DISPLAY_FONT } from "../../../shared/card-canvas";
import { bn, potScore, RESULT_SECONDS, type Round, type Stove, type Vessel } from "./dudh";

export const VW = 360, VH = 300;
const CX = 168, TAU = Math.PI * 2;

type Shape = { rimY: number; rx: number; ry: number; baseY: number; rxb: number; depth: number; box: { x: number; y: number; w: number; h: number } };
// Every pot's bottom sits at y≈215 on the burner; `depth` is how far the foam climbs on screen from the start to the rim.
export const SHAPES: Record<Vessel, Shape> = {
  dekchi: { rimY: 122, rx: 98, ry: 43, baseY: 181, rxb: 84, depth: 58, box: { x: 50, y: 70, w: 236, h: 152 } },
  patil: { rimY: 132, rx: 86, ry: 36, baseY: 181, rxb: 80, depth: 54, box: { x: 74, y: 88, w: 240, h: 134 } },
  hari: { rimY: 108, rx: 70, ry: 30, baseY: 191, rxb: 56, depth: 46, box: { x: 56, y: 70, w: 224, h: 154 } },
};

const MILK = "#fffaf0", MILK_EDGE = "#eadcc2", FOAM = "#ffffff", FOAM_LINE = "#e3d4b8", INK = "#2a211c";
const PCT = Array.from({ length: 101 }, (_, value) => `${bn(value)}%`);

// Same foam every time: a fixed scatter of bubbles on the milk, denser near the pot wall where foam gathers.
const BUBBLES = (() => {
  let seed = 11;
  const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 18 }, () => {
    const angle = next() * TAU, reach = Math.sqrt(0.25 + 0.75 * next());
    return [Math.cos(angle) * reach, Math.sin(angle) * reach, 0.6 + next() * 0.8, next() * TAU] as const;
  });
})();

const MOUND = [[0, 0, 1], [-0.5, 0.2, 0.75], [0.5, 0.15, 0.8], [-0.22, -0.4, 0.62], [0.28, -0.35, 0.66], [-0.9, 0.3, 0.5], [0.95, 0.28, 0.52]] as const;

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

/** The milk's surface and foam, seen inside the rim. `level` 0 is the start, 1 the rim. */
export function drawMilk(context: CanvasRenderingContext2D, vessel: Vessel, level: number, clock: number, jiggle: boolean) {
  const shape = SHAPES[vessel], grow = Math.max(0, Math.min(1, level));
  const y = shape.rimY + shape.depth * (1 - grow);
  context.save();
  rimPath(context, shape);
  context.clip();
  context.fillStyle = MILK_EDGE;
  context.beginPath(); context.ellipse(CX, y + 2, shape.rx, shape.ry, 0, 0, TAU); context.fill();
  context.fillStyle = MILK;
  context.beginPath(); context.ellipse(CX, y, shape.rx - 2, shape.ry - 2, 0, 0, TAU); context.fill();
  context.lineWidth = 1;
  for (let index = 0; index < BUBBLES.length; index++) {
    const [u, v, size, phase] = BUBBLES[index];
    const radius = shape.rx * (0.02 + 0.075 * grow) * size * (jiggle ? 1 + 0.14 * Math.sin(clock * 7 + phase) : 1);
    context.beginPath();
    context.arc(CX + u * (shape.rx - 8), y + v * (shape.ry - 5), radius, 0, TAU);
    context.fillStyle = FOAM; context.fill();
    context.strokeStyle = FOAM_LINE; context.stroke();
  }
  if (grow > 0.5) {
    // The foam heaves up in the middle as it gets ready to climb out: a mound of bubbles, outlined once.
    const heave = (grow - 0.5) * 2, size = shape.rx * 0.2 * (0.6 + 0.6 * heave);
    for (let pass = 0; pass < 2; pass++) {
      context.fillStyle = pass === 0 ? FOAM_LINE : FOAM;
      for (let index = 0; index < MOUND.length; index++) {
        const [dx, dy, scale] = MOUND[index];
        context.beginPath(); context.arc(CX + dx * size * 2, y - heave * 6 + dy * size, size * scale + (pass === 0 ? 1.2 : 0), 0, TAU); context.fill();
      }
    }
  }
  context.restore();
}

const DRIPS = [[0.55, 30], [1.25, 44], [1.9, 26], [2.5, 36]] as const;

function blob(context: CanvasRenderingContext2D, x: number, y: number, radius: number, outline: boolean) {
  context.beginPath(); context.arc(x, y, radius + (outline ? 1.6 : 0), 0, TAU); context.fill();
}

/** "উথলে গেল!": a soft cartoon cloud of foam over the rim, a few neat drips and a small puddle. `grow` runs 0→1. */
export function drawSpill(context: CanvasRenderingContext2D, vessel: Vessel, grow: number) {
  const shape = SHAPES[vessel], ease = 1 - (1 - Math.max(0, Math.min(1, grow))) ** 3;
  if (ease <= 0) return;
  // Two passes, outline then fill, so the cloud reads as one shape with one soft edge.
  for (let pass = 0; pass < 2; pass++) {
    const outline = pass === 0;
    context.fillStyle = outline ? FOAM_LINE : FOAM;
    context.beginPath(); context.ellipse(CX, 216, 30 + 46 * ease + (outline ? 1.6 : 0), 6 + 2 * ease + (outline ? 1.2 : 0), 0, 0, TAU); context.fill();
    for (let drip = 0; drip < DRIPS.length; drip++) {
      const [angle, length] = DRIPS[drip], x = CX + Math.cos(angle) * shape.rx * 0.92, top = shape.rimY + Math.sin(angle) * shape.ry;
      const bottom = top + length * ease, pad = outline ? 1.6 : 0;
      context.beginPath(); context.roundRect(x - 5 - pad, top, 10 + pad * 2, bottom - top + pad, 5 + pad); context.fill();
      blob(context, x, bottom, 6.5 * ease, outline);
    }
    context.beginPath(); context.ellipse(CX, shape.rimY - 3 * ease, shape.rx * 0.96 + (outline ? 1.6 : 0), shape.ry + 6 * ease + (outline ? 1.6 : 0), 0, 0, TAU); context.fill();
    for (let puff = 0; puff <= 8; puff++) {
      const angle = puff * Math.PI / 8;
      blob(context, CX + Math.cos(angle) * shape.rx, shape.rimY + Math.sin(angle) * shape.ry, (8 + (puff % 3) * 3) * ease, outline);
    }
    for (let puff = 0; puff < 5; puff++) blob(context, CX - 48 + puff * 24, shape.rimY - 6 * ease - (puff % 2) * 6 * ease, 11 * ease, outline);
  }
  // A few bubbles on top, so it reads as foam and not a white lid.
  context.strokeStyle = FOAM_LINE;
  context.lineWidth = 1.2;
  for (let index = 0; index < 7; index++) {
    const [u, v, size] = BUBBLES[index];
    context.beginPath(); context.arc(CX + u * shape.rx * 0.7, shape.rimY + v * shape.ry * 0.6, (3 + 3 * size) * ease, 0, TAU); context.stroke();
  }
}

function tongue(context: CanvasRenderingContext2D, x: number, y: number, height: number, width: number) {
  context.beginPath();
  context.moveTo(x - width, y);
  context.quadraticCurveTo(x - width * 0.8, y - height * 0.6, x, y - height);
  context.quadraticCurveTo(x + width * 0.8, y - height * 0.6, x + width, y);
  context.closePath();
  context.fill();
}

/** Blue gas tongues under the pot, or an orange wood fire in the clay stove's mouth. `heat` 0 is a low flame, 1 full. */
export function drawFlame(context: CanvasRenderingContext2D, stove: Stove, clock: number, heat: number, flicker: boolean) {
  const sway = flicker ? 0.18 : 0;
  if (stove === "gas") {
    for (let index = 0; index <= 10; index++) {
      const angle = index * Math.PI / 10, x = CX + Math.cos(angle) * 66, y = 220 + Math.sin(angle) * 8;
      const height = (5 + 12 * heat) * (1 + sway * Math.sin(clock * 12 + index * 1.9));
      context.fillStyle = "#3d74e8"; tongue(context, x, y, height, 4.2);
      context.fillStyle = "#a9d3ff"; tongue(context, x, y, height * 0.5, 2.2);
    }
    return;
  }
  context.save();
  context.beginPath(); context.moveTo(CX - 26, 270); context.lineTo(CX - 26, 252); context.arc(CX, 252, 26, Math.PI, 0); context.lineTo(CX + 26, 270); context.closePath(); context.clip();
  context.fillStyle = "#3a1a0c"; context.fillRect(CX - 26, 222, 52, 48);
  for (let index = 0; index < 5; index++) {
    const x = CX - 18 + index * 9, height = (12 + 16 * heat) * (1 + sway * Math.sin(clock * 12 + index * 1.9));
    context.fillStyle = "#f07a22"; tongue(context, x, 268, height, 7);
    context.fillStyle = "#ffd166"; tongue(context, x, 268, height * 0.55, 3.6);
  }
  context.restore();
  // Licks of fire around the pot's base.
  for (let index = 0; index < 4; index++) {
    const side = index < 2 ? -1 : 1, x = CX + side * (48 + (index % 2) * 12), height = (4 + 10 * heat) * (1 + sway * Math.sin(clock * 12 + index * 2.3));
    context.fillStyle = "#f07a22"; tongue(context, x, 216, height, 5);
    context.fillStyle = "#ffd166"; tongue(context, x, 216, height * 0.5, 2.5);
  }
}

/** Steam curling off hot milk. Still wisps in slow mode. */
export function drawSteam(context: CanvasRenderingContext2D, vessel: Vessel, clock: number, amount: number, drift: boolean) {
  if (amount <= 0.02) return;
  const rimY = SHAPES[vessel].rimY;
  context.strokeStyle = "#ffffff";
  context.lineWidth = 4;
  context.lineCap = "round";
  for (let index = 0; index < 3; index++) {
    const rise = drift ? (clock * 0.45 + index / 3) % 1 : 0.3 + index * 0.12;
    const x = CX - 36 + index * 36 + (drift ? Math.sin(clock * 1.7 + index * 2) * 4 : 0), y = rimY - 18 - rise * 44;
    context.globalAlpha = Math.min(1, amount) * 0.75 * (1 - rise);
    context.beginPath(); context.moveTo(x, y + 16); context.bezierCurveTo(x - 9, y + 8, x + 9, y - 2, x, y - 12); context.stroke();
  }
  context.globalAlpha = 1;
  context.lineCap = "butt";
}

const GAUGE = { x: 334, top: 70, bottom: 206 };

/** The rim gauge: the same height as a number and a bar, so colour is never the only signal. `mark` is a lifted pot's level, or -1. */
export function drawGauge(context: CanvasRenderingContext2D, level: number, mark: number) {
  const { x, top, bottom } = GAUGE, span = bottom - top, shown = Math.max(0, Math.min(1, level));
  context.fillStyle = "rgba(255,255,255,.82)";
  context.strokeStyle = "rgba(42,33,28,.35)";
  context.lineWidth = 1;
  context.beginPath(); context.roundRect(x - 8, top - 4, 16, span + 8, 8); context.fill(); context.stroke();
  context.fillStyle = "#ffd9b0";
  context.fillRect(x - 6, top, 12, span * 0.1);
  context.fillStyle = shown >= 0.9 ? "#d2492a" : "#e99b2e";
  const height = shown * span;
  if (height > 1) { context.beginPath(); context.roundRect(x - 5, bottom - height, 10, height, 5); context.fill(); }
  context.strokeStyle = INK; context.lineWidth = 2;
  context.beginPath(); context.moveTo(x - 11, top); context.lineTo(x + 11, top); context.stroke();
  if (mark >= 0) {
    const markY = bottom - Math.min(1, mark) * span;
    context.fillStyle = INK;
    context.beginPath(); context.moveTo(x - 9, markY); context.lineTo(x - 16, markY - 5); context.lineTo(x - 16, markY + 5); context.closePath(); context.fill();
  }
  context.textAlign = "center";
  context.fillStyle = INK;
  context.font = `800 17px ${DISPLAY_FONT}`;
  context.fillText(PCT[level >= 1 ? 100 : potScore(level)], x - 4, top - 28);
  context.font = `600 10px ${BODY_FONT}`;
  context.fillText("কিনারা", x - 2, top - 10);
  context.textAlign = "left";
}

// A tiny fixed-seed scatter for granite speckle and mud smears, so the background never changes between draws.
function scatter(seed: number) {
  return () => (seed = (seed * 48271) % 2147483647) / 2147483647;
}

/** The static kitchen behind the pot. Drawn once per stove into an offscreen canvas. */
export function drawBackground(context: CanvasRenderingContext2D, stove: Stove) {
  const random = scatter(stove === "gas" ? 5 : 9);
  if (stove === "gas") {
    context.fillStyle = "#dcefe8"; context.fillRect(0, 0, VW, 210);
    context.strokeStyle = "#c4e0d6"; context.lineWidth = 1;
    for (let y = 18; y < 210; y += 26) { context.beginPath(); context.moveTo(0, y + 0.5); context.lineTo(VW, y + 0.5); context.stroke(); }
    for (let row = 0; row < 9; row++) for (let x = (row % 2) * 13; x < VW; x += 26) { context.beginPath(); context.moveTo(x + 0.5, row * 26 - 8); context.lineTo(x + 0.5, row * 26 + 18); context.stroke(); }
    // A spice shelf: হলুদ, মরিচ, জিরা.
    context.fillStyle = "#9b6a40"; context.fillRect(14, 54, 104, 6);
    ["#efb62f", "#c8392b", "#b98a4e"].forEach((spice, index) => {
      const x = 22 + index * 32;
      context.fillStyle = "rgba(255,255,255,.75)"; context.beginPath(); context.roundRect(x, 24, 24, 30, 5); context.fill();
      context.fillStyle = spice; context.beginPath(); context.roundRect(x + 2, 34, 20, 18, 4); context.fill();
      context.fillStyle = "#47555d"; context.fillRect(x + 1, 19, 22, 6);
    });
    // A হাতা hanging from a hook.
    context.strokeStyle = "#7d868c"; context.lineWidth = 3; context.lineCap = "round";
    context.beginPath(); context.moveTo(258, 12); context.lineTo(258, 50); context.stroke();
    context.fillStyle = "#9aa2a8"; context.beginPath(); context.ellipse(258, 57, 10, 8, 0, 0, TAU); context.fill();
    context.strokeStyle = "#5c646a"; context.lineWidth = 2; context.beginPath(); context.arc(258, 8, 4, 0, TAU); context.stroke();
    context.lineCap = "butt";
    // Counter, glass-top gas stove, knobs and the burner the pot sits on.
    context.fillStyle = "#4f5c57"; context.fillRect(0, 204, VW, 20);
    context.fillStyle = "rgba(255,255,255,.18)";
    for (let speck = 0; speck < 70; speck++) context.fillRect(random() * VW, 205 + random() * 18, 1.5, 1.5);
    context.fillStyle = "#9b7350"; context.fillRect(0, 224, VW, 76);
    context.strokeStyle = "#7c5a3c"; context.lineWidth = 2;
    for (const x of [120, 240]) { context.beginPath(); context.moveTo(x, 252); context.lineTo(x, 300); context.stroke(); }
    context.fillStyle = "#24292d"; context.beginPath(); context.roundRect(56, 200, 248, 22, 6); context.fill();
    context.fillStyle = "#b8bfc3"; context.beginPath(); context.roundRect(60, 222, 240, 26, [0, 0, 8, 8]); context.fill();
    for (const knobX of [104, 232]) {
      context.fillStyle = "#1e2226"; context.beginPath(); context.arc(knobX, 235, 8, 0, TAU); context.fill();
      context.strokeStyle = "#f2f2f2"; context.lineWidth = 2; context.beginPath(); context.moveTo(knobX, 235); context.lineTo(knobX, 228); context.stroke();
    }
    context.fillStyle = "#121517"; context.beginPath(); context.ellipse(CX, 216, 52, 9, 0, 0, TAU); context.fill();
    context.fillStyle = "#3a4045"; context.beginPath(); context.ellipse(CX, 215, 30, 5, 0, 0, TAU); context.fill();
    context.fillStyle = "#121517"; context.beginPath(); context.ellipse(272, 211, 22, 5, 0, 0, TAU); context.fill();
    return;
  }
  // A mud kitchen: লেপা wall and floor, a little niche, and a মাটির চুলা.
  context.fillStyle = "#e3b47f"; context.fillRect(0, 0, VW, 236);
  context.strokeStyle = "rgba(170,110,60,.28)"; context.lineWidth = 3; context.lineCap = "round";
  for (let smear = 0; smear < 16; smear++) {
    const x = random() * VW, y = 10 + random() * 210, length = 30 + random() * 60;
    context.beginPath(); context.moveTo(x, y); context.quadraticCurveTo(x + length / 2, y - 6, x + length, y); context.stroke();
  }
  context.lineCap = "butt";
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
  // Firewood sticking out of the mouth.
  context.strokeStyle = "#5c3a1e"; context.lineWidth = 7; context.lineCap = "round";
  context.beginPath(); context.moveTo(CX - 8, 266); context.lineTo(CX - 54, 290); context.moveTo(CX + 6, 268); context.lineTo(CX + 40, 292); context.stroke();
  context.lineCap = "butt";
}

export type SceneCache = { ratio: number; bg: Partial<Record<Stove, HTMLCanvasElement>>; back: Partial<Record<Vessel, HTMLCanvasElement>>; front: Partial<Record<Vessel, HTMLCanvasElement>> };
export const newCache = (ratio: number): SceneCache => ({ ratio, bg: {}, back: {}, front: {} });

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
const easeOut = (value: number) => 1 - (1 - Math.max(0, Math.min(1, value))) ** 3;

/** One frame of the game. Static parts come from cached sprites; only the milk, flame, steam and gauge are drawn live. */
export function drawScene(context: CanvasRenderingContext2D, cache: SceneCache, round: Round, slow: boolean, clock: number) {
  const pot = round.pots[round.index], shape = SHAPES[pot.vessel], { ratio } = cache;
  const bg = cache.bg[pot.stove] ??= sprite(ratio, FULL, paint => drawBackground(paint, pot.stove));
  const back = cache.back[pot.vessel] ??= sprite(ratio, shape.box, paint => drawPotBack(paint, pot.vessel));
  const front = cache.front[pot.vessel] ??= sprite(ratio, shape.box, paint => drawPotFront(paint, pot.vessel));
  const done = round.phase === "result" || round.phase === "over";
  const wait = round.phase === "over" ? RESULT_SECONDS : round.wait;
  const spilled = done && round.spills[round.scores.length - 1] === true;
  const lifted = done && !spilled;
  const lift = lifted ? 22 * easeOut(wait / 0.3) : 0;
  const shake = spilled && !slow && wait < 0.3 ? Math.sin(wait * 70) * 2.5 * (1 - wait / 0.3) : 0;
  const level = lifted ? round.level * (1 - 0.3 * easeOut(wait / 0.9)) : round.level;
  const heat = round.phase === "rising" ? 1 : 0.15;

  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.drawImage(bg, 0, 0, VW, VH);
  context.translate(shake, -lift);
  context.drawImage(back, shape.box.x, shape.box.y, shape.box.w, shape.box.h);
  drawMilk(context, pot.vessel, level, clock, !slow && !lifted);
  context.drawImage(front, shape.box.x, shape.box.y, shape.box.w, shape.box.h);
  if (spilled) drawSpill(context, pot.vessel, slow ? 1 : wait / 0.4);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawFlame(context, pot.stove, clock, lifted ? 0 : heat, !slow);
  drawSteam(context, pot.vessel, clock, round.phase === "rising" ? (level - 0.2) * 1.4 : lifted ? 0.6 * (1 - wait / RESULT_SECONDS) : 0, !slow);
  drawGauge(context, round.level, lifted ? round.level : -1);
}
