// Draws the road to school. Everything still is painted once into offscreen sprites; each frame only stamps them,
// so a cheap phone keeps its frame rate. Slow mode drops parallax, dust, shake and the bell's swing.
import { BODY_FONT, DISPLAY_FONT } from "../../../shared/card-canvas";
import {
  drawBasket, drawBell, drawBike, drawBranch, drawCow, drawGate, drawKid, drawLine, drawMilestone, drawPuddle, drawSitting, drawTiffin,
  duckPose, jumpDownPose, jumpUpPose, runPose,
} from "./art";
import {
  pieceAt, AHEAD, GATE, GATE_M, GOT_TIFFIN, GROUND, H, KID_X, LANDED, MILESTONE, PUDDLE, SAVED, TAKEN, TIFFIN, UNIT, W, ZONE_M, zoneOf, type Run,
} from "./road";
import { bn } from "./result";

type Sprite = { canvas: HTMLCanvasElement; w: number; h: number; ox: number; oy: number };
type Popup = { t: number; text: string; color: string };
type Puff = { x: number; y: number; t: number; r: number };

export const FAR = 720, FAR_H = 118, TILE = 96, BACK = GROUND - 14;
const PARALLAX = 0.3, RUN_FRAMES = 8, STRIDE = 9;
const PUFFS = 10;

export type Scene = {
  context: CanvasRenderingContext2D; k: number; girl: boolean;
  sky: Sprite; far: [Sprite, Sprite]; ground: [Sprite, Sprite]; tree: Sprite;
  kidRun: Sprite[]; kidUp: Sprite; kidDown: Sprite; kidDuck: [Sprite, Sprite]; kidSit: Sprite;
  puddles: Sprite[]; things: Sprite[]; tiffin: Sprite; tiffinIcon: Sprite; milestone: Sprite; bell: Sprite; gate: Sprite | null;
  clock: number; idle: number; landAt: number; shakeAt: number; savedAt: number;
  popups: Popup[]; puffs: Puff[]; seen: number; run: Run | null;
  metersShown: number; metersText: string; gateText: string; markText: string; markFor: number;
};

/** Paints a `w`×`h` unit area into a canvas at `k` device pixels a unit; (ox, oy) is where the drawing's origin sits. */
function sprite(w: number, h: number, k: number, ox: number, oy: number, paint: (context: CanvasRenderingContext2D) => void): Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(w * k); canvas.height = Math.ceil(h * k);
  const context = canvas.getContext("2d")!;
  context.setTransform(k, 0, 0, k, ox * k, oy * k);
  paint(context);
  return { canvas, w, h, ox, oy };
}

export function paintSky(context: CanvasRenderingContext2D) {
  const sky = context.createLinearGradient(0, 0, 0, BACK);
  sky.addColorStop(0, "#8ccbe9"); sky.addColorStop(0.55, "#cde8f0"); sky.addColorStop(1, "#fff0cf");
  context.fillStyle = sky; context.fillRect(0, 0, W, BACK + 2);
  const glow = context.createRadialGradient(306, 70, 6, 306, 70, 54);
  glow.addColorStop(0, "#fffbe8"); glow.addColorStop(1, "#fffbe800");
  context.fillStyle = glow; context.fillRect(240, 10, 130, 120);
  context.fillStyle = "#fff6cf"; context.beginPath(); context.arc(306, 70, 14, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#ffffffd9";
  for (const [x, y, s] of [[70, 62, 1], [196, 84, 0.8], [250, 50, 0.6]] as const) {
    for (const [dx, dy, r] of [[-14, 4, 9], [-2, -2, 12], [12, 3, 9], [0, 6, 10]] as const) { context.beginPath(); context.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); context.fill(); }
  }
  // A paper kite with its tail, the kind every lane has in the sky.
  context.save(); context.translate(214, 40); context.rotate(0.2);
  context.fillStyle = "#e5483b"; context.beginPath(); context.moveTo(0, -9); context.lineTo(7, 0); context.lineTo(0, 9); context.lineTo(-7, 0); context.closePath(); context.fill();
  context.fillStyle = "#ffd166"; context.beginPath(); context.moveTo(0, -9); context.lineTo(7, 0); context.lineTo(0, 0); context.closePath(); context.fill();
  context.strokeStyle = "#7a2b22"; context.lineWidth = 0.6; context.beginPath(); context.moveTo(0, 9); context.quadraticCurveTo(-4, 16, 2, 22); context.stroke();
  context.restore();
  context.strokeStyle = "#4a5b6a88"; context.lineWidth = 0.5; context.beginPath(); context.moveTo(216, 50); context.quadraticCurveTo(160, 120, 120, BACK); context.stroke();
  context.strokeStyle = "#4a5b6a"; context.lineWidth = 1; context.lineCap = "round";
  context.beginPath();
  for (const [x, y] of [[130, 74], [142, 68], [152, 76]] as const) { context.moveTo(x - 4, y - 2); context.quadraticCurveTo(x - 2, y - 3.5, x, y); context.quadraticCurveTo(x + 2, y - 3.5, x + 4, y - 2); }
  context.stroke();
}

function palm(context: CanvasRenderingContext2D, x: number, base: number, height: number, color: string) {
  context.strokeStyle = color; context.lineWidth = 2.2; context.lineCap = "round";
  context.beginPath(); context.moveTo(x, base); context.quadraticCurveTo(x + 4, base - height * 0.6, x + 2, base - height); context.stroke();
  context.fillStyle = color;
  for (let leaf = 0; leaf < 7; leaf++) {
    const a = -Math.PI / 2 + (leaf - 3) * 0.5;
    context.beginPath(); context.ellipse(x + 2 + Math.cos(a) * 9, base - height + Math.sin(a) * 4 + 3, 11, 2.6, a, 0, Math.PI * 2); context.fill();
  }
}

function hut(context: CanvasRenderingContext2D, x: number, w: number, wall: string, roof: string) {
  const b = FAR_H;
  context.fillStyle = wall; context.fillRect(x, b - 30, w, 30);
  context.fillStyle = roof;
  context.beginPath(); context.moveTo(x - 6, b - 28); context.lineTo(x + 8, b - 48); context.lineTo(x + w - 8, b - 48); context.lineTo(x + w + 6, b - 28); context.closePath(); context.fill();
  context.strokeStyle = "#00000026"; context.lineWidth = 0.8;
  context.beginPath(); for (let rx = x + 10; rx < x + w - 6; rx += 4) { context.moveTo(rx, b - 47); context.lineTo(rx - 5, b - 29); } context.stroke();
  context.fillStyle = "#4a5a6a"; context.fillRect(x + w * 0.2, b - 20, 9, 20);
  context.fillStyle = "#3d7d86"; context.fillRect(x + w * 0.6, b - 22, 12, 9);
  context.fillStyle = "#2e5f66"; context.fillRect(x + w * 0.6 + 5.4, b - 22, 1.2, 9);
}

export function paintLane(context: CanvasRenderingContext2D) {
  const b = FAR_H;
  context.fillStyle = "#8db38a";
  for (let x = -10; x < FAR + 20; x += 34) { context.beginPath(); context.arc(x, b - 34 - ((x * 7) % 13), 22, 0, Math.PI * 2); context.fill(); }
  context.fillRect(0, b - 34, FAR, 34);
  hut(context, 22, 70, "#e7c27a", "#8c9aa3");
  palm(context, 108, b, 74, "#4f7a46");
  // A two-storey house with grilled windows and the black water tank on its roof.
  context.fillStyle = "#f1ead8"; context.fillRect(130, b - 72, 88, 72);
  context.fillStyle = "#e2d9c2"; context.fillRect(126, b - 76, 96, 5); context.fillRect(126, b - 40, 96, 3);
  context.fillStyle = "#3d6470";
  for (const wy of [b - 66, b - 32]) for (const wx of [140, 168, 196]) context.fillRect(wx, wy, 14, 14);
  context.strokeStyle = "#d9d1bd"; context.lineWidth = 0.8;
  context.beginPath(); for (const wy of [b - 66, b - 32]) for (const wx of [140, 168, 196]) for (let bar = 3; bar < 14; bar += 3.5) { context.moveTo(wx + bar, wy); context.lineTo(wx + bar, wy + 14); } context.stroke();
  context.fillStyle = "#2b2b2b"; context.beginPath(); context.roundRect(190, b - 92, 16, 16, 2); context.fill();
  context.fillStyle = "#444"; context.fillRect(188, b - 94, 20, 3);
  // A low brick wall in front.
  context.fillStyle = "#b9614a"; context.fillRect(120, b - 13, 116, 13);
  context.strokeStyle = "#94473a"; context.lineWidth = 0.6;
  context.beginPath(); for (let wy = b - 9; wy < b; wy += 4) { context.moveTo(120, wy); context.lineTo(236, wy); } context.stroke();
  // Banana plant.
  context.fillStyle = "#5f9a4a";
  context.fillRect(244, b - 30, 3, 30);
  for (const a of [-2.4, -1.9, -1.2, -0.7]) { context.beginPath(); context.ellipse(245 + Math.cos(a) * 11, b - 30 + Math.sin(a) * 9, 13, 4, a, 0, Math.PI * 2); context.fill(); }
  hut(context, 266, 66, "#9cc3a8", "#a5583c");
  // The tea stall: a wooden box, an awning, a bench, a kettle on the counter.
  context.fillStyle = "#8a5a36"; context.fillRect(352, b - 34, 62, 34);
  context.fillStyle = "#d9a441"; context.fillRect(350, b - 30, 66, 4);
  context.fillStyle = "#c2453a";
  context.beginPath(); context.moveTo(344, b - 36); context.lineTo(422, b - 36); context.lineTo(416, b - 46); context.lineTo(350, b - 46); context.closePath(); context.fill();
  context.fillStyle = "#f4ede0"; for (let sx = 356; sx < 414; sx += 12) context.fillRect(sx, b - 46, 5, 10);
  context.fillStyle = "#555"; context.beginPath(); context.ellipse(370, b - 32, 4, 3, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#6e4628"; context.fillRect(424, b - 9, 30, 3); context.fillRect(426, b - 6, 2, 6); context.fillRect(450, b - 6, 2, 6);
  palm(context, 468, b, 66, "#4f7a46");
  hut(context, 486, 62, "#e4a9a0", "#7f8f98");
  context.strokeStyle = "#5d8f4a"; context.lineWidth = 2;
  context.beginPath(); for (let bx = 566; bx < 586; bx += 3) { context.moveTo(bx, b); context.quadraticCurveTo(bx + 5, b - 40, bx + 14 - (bx % 7), b - 66 + (bx % 9)); } context.stroke();
  hut(context, 610, 80, "#a9c6de", "#8c9aa3");
  // Electric poles every 240 units with two sagging wires, so the strip tiles.
  context.fillStyle = "#5a5a5a";
  for (const px of [120, 360, 600]) { context.fillRect(px - 1.2, b - 98, 2.4, 98); context.fillRect(px - 8, b - 94, 16, 2); }
  context.strokeStyle = "#3e3e3e88"; context.lineWidth = 0.7;
  context.beginPath();
  for (const px of [-120, 120, 360, 600]) for (const wx of [-7, 7]) { context.moveTo(px + wx, b - 93); context.quadraticCurveTo(px + 120 + wx, b - 80, px + 240 + wx, b - 93); }
  context.stroke();
}

function paintField(context: CanvasRenderingContext2D) {
  const b = FAR_H;
  context.fillStyle = "#93b98f";
  for (let x = -10; x < FAR + 20; x += 26) { context.beginPath(); context.arc(x, b - 30 - ((x * 11) % 12), 16, 0, Math.PI * 2); context.fill(); }
  context.fillStyle = "#9aa7ad";
  for (const rx of [120, 380, 610]) { context.beginPath(); context.moveTo(rx, b - 36); context.lineTo(rx + 5, b - 42); context.lineTo(rx + 17, b - 42); context.lineTo(rx + 22, b - 36); context.closePath(); context.fill(); }
  for (const [px, ph] of [[80, 70], [300, 82], [520, 64], [668, 76]] as const) palm(context, px, b - 22, ph, "#5c8656");
  const field = context.createLinearGradient(0, b - 28, 0, b);
  field.addColorStop(0, "#a9cf62"); field.addColorStop(1, "#7aa43c");
  context.fillStyle = field; context.fillRect(0, b - 28, FAR, 28);
  context.strokeStyle = "#c4de8255"; context.lineWidth = 0.8;
  context.beginPath(); for (let y = b - 24; y < b; y += 5) { context.moveTo(0, y); context.lineTo(FAR, y); } context.stroke();
  // A haystack round its pole, a pond and a cow grazing far off.
  context.fillStyle = "#d9b25a";
  context.beginPath(); context.moveTo(184, b - 18); context.quadraticCurveTo(186, b - 52, 204, b - 54); context.quadraticCurveTo(222, b - 52, 224, b - 18); context.closePath(); context.fill();
  context.strokeStyle = "#b48d3c"; context.lineWidth = 0.7;
  context.beginPath(); for (let y = b - 46; y < b - 20; y += 6) { context.moveTo(188, y); context.quadraticCurveTo(204, y + 3, 221, y); } context.stroke();
  context.fillStyle = "#6b4a2e"; context.fillRect(203, b - 62, 2, 10);
  context.fillStyle = "#6f9a4a"; context.beginPath(); context.ellipse(470, b - 12, 58, 11, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#8cc0d6"; context.beginPath(); context.ellipse(470, b - 12, 50, 8, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#c9e3ee"; context.fillRect(440, b - 15, 34, 1.4); context.fillRect(470, b - 10, 22, 1.2);
  context.fillStyle = "#7d5436";
  context.beginPath(); context.ellipse(612, b - 20, 9, 4.5, 0, 0, Math.PI * 2); context.fill();
  context.beginPath(); context.ellipse(602, b - 17, 3.2, 2.6, 0.5, 0, Math.PI * 2); context.fill();
  context.fillRect(606, b - 17, 1.4, 6); context.fillRect(617, b - 17, 1.4, 6);
}

export function paintBrick(context: CanvasRenderingContext2D) {
  context.fillStyle = "#7fae4b"; context.fillRect(0, 0, TILE, 5);
  context.strokeStyle = "#5f8d33"; context.lineWidth = 0.8;
  context.beginPath(); for (let x = 2; x < TILE; x += 6) { context.moveTo(x, 4); context.lineTo(x + 1.4, 0.6); } context.stroke();
  context.fillStyle = "#86452f"; context.fillRect(0, 4, TILE, 37);
  const colors = ["#b4553a", "#a64b33", "#c0623f", "#ad5136"];
  for (let row = 0; row < 8; row++) {
    for (let col = -1; col < TILE / 12 + 1; col++) {
      const x = col * 12 + (row % 2) * 6;
      context.fillStyle = colors[(col * 7 + row * 13 + 64) % 4];
      context.fillRect(x + 0.5, 4.5 + row * 4, 11, 3.2);
    }
  }
  context.fillStyle = "#9a4a33";
  for (let x = 0; x < TILE; x += 4) context.fillRect(x + 0.4, 37, 3.2, 4);
  const verge = context.createLinearGradient(0, 41, 0, 60);
  verge.addColorStop(0, "#8bb055"); verge.addColorStop(1, "#6f9440");
  context.fillStyle = verge; context.fillRect(0, 41, TILE, 22);
  context.strokeStyle = "#5c8433"; context.lineWidth = 1;
  context.beginPath(); for (let x = 3; x < TILE; x += 9) { context.moveTo(x, 50 + (x % 5)); context.lineTo(x - 1, 45 + (x % 4)); context.moveTo(x + 2, 50 + (x % 5)); context.lineTo(x + 4, 46); } context.stroke();
}

function paintDirt(context: CanvasRenderingContext2D) {
  context.fillStyle = "#7aa43c"; context.fillRect(0, 0, TILE, 6);
  context.strokeStyle = "#5f8a2c"; context.lineWidth = 1;
  context.beginPath(); for (let x = 1; x < TILE; x += 4) { context.moveTo(x, 6); context.lineTo(x + 1, -1 + (x % 3)); } context.stroke();
  const path = context.createLinearGradient(0, 5, 0, 37);
  path.addColorStop(0, "#d4ab72"); path.addColorStop(1, "#c39761");
  context.fillStyle = path; context.fillRect(0, 5, TILE, 32);
  context.strokeStyle = "#ad8350"; context.lineWidth = 1.2;
  context.beginPath(); context.moveTo(0, 14); context.lineTo(TILE, 14); context.moveTo(0, 28); context.lineTo(TILE, 28); context.stroke();
  context.fillStyle = "#a57c4c";
  for (let index = 0; index < 9; index++) { const x = (index * 37) % TILE, y = 8 + ((index * 23) % 26); context.beginPath(); context.ellipse(x, y, 1.6, 0.9, 0, 0, Math.PI * 2); context.fill(); }
  context.fillStyle = "#6f9a3a"; context.fillRect(0, 37, TILE, 26);
  context.strokeStyle = "#8fbf4a"; context.lineWidth = 1.1;
  context.beginPath(); for (let x = 2; x < TILE; x += 5) { const y = 58 - (x % 3); context.moveTo(x, y); context.quadraticCurveTo(x - 1, y - 8, x - 3, y - 14); context.moveTo(x, y); context.quadraticCurveTo(x + 2, y - 9, x + 4, y - 13); } context.stroke();
}

function paintTree(context: CanvasRenderingContext2D) {
  // A big mango tree that stands where the lane gives way to the field (it hides the seam between the two strips).
  context.fillStyle = "#5a3d26"; context.fillRect(-5, -70, 10, 70);
  for (const [x, y, r, c] of [[-22, -84, 22, "#2f5a26"], [18, -88, 24, "#2f5a26"], [0, -104, 26, "#3b6c2d"], [-12, -76, 18, "#3b6c2d"], [14, -72, 18, "#4c8236"], [-4, -90, 20, "#4c8236"]] as const) {
    context.fillStyle = c; context.beginPath(); context.arc(x, y, r, 0, Math.PI * 2); context.fill();
  }
}

function kidSprite(k: number, paint: (context: CanvasRenderingContext2D) => void) { return sprite(64, 62, k, 30, 56, paint); }

function buildKid(scene: Pick<Scene, "kidRun" | "kidUp" | "kidDown" | "kidDuck" | "kidSit">, k: number, girl: boolean) {
  scene.kidRun = Array.from({ length: RUN_FRAMES }, (_, frame) => kidSprite(k, context => drawKid(context, runPose(frame / RUN_FRAMES), girl)));
  scene.kidUp = kidSprite(k, context => drawKid(context, jumpUpPose, girl));
  scene.kidDown = kidSprite(k, context => drawKid(context, jumpDownPose, girl));
  scene.kidDuck = [kidSprite(k, context => drawKid(context, duckPose(0), girl)), kidSprite(k, context => drawKid(context, duckPose(1), girl))];
  scene.kidSit = kidSprite(k, context => drawSitting(context, girl));
}

export function makeScene(canvas: HTMLCanvasElement, cssWidth: number, girl: boolean, previous?: Scene | null): Scene {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(cssWidth * ratio); canvas.height = Math.round(cssWidth * H / W * ratio);
  const k = cssWidth / W * ratio;
  const scene = {
    context: canvas.getContext("2d")!, k, girl,
    sky: sprite(W, BACK + 2, k, 0, 0, paintSky),
    far: [sprite(FAR, FAR_H, k, 0, 0, paintLane), sprite(FAR, FAR_H, k, 0, 0, paintField)] as [Sprite, Sprite],
    ground: [sprite(TILE, H - BACK + 4, k, 0, 0, paintBrick), sprite(TILE, H - BACK + 4, k, 0, 0, paintDirt)] as [Sprite, Sprite],
    tree: sprite(100, 136, k, 50, 132, paintTree),
    puddles: [0, 1, 2, 3].map(step => sprite(80, 14, k, 40, 8, context => drawPuddle(context, 44 + step * 6))),
    things: [
      sprite(4, 4, k, 2, 2, () => {}),
      sprite(42, 32, k, 21, 28, drawBasket),
      sprite(60, 40, k, 30, 37, drawBike),
      sprite(76, 40, k, 38, 35, drawCow),
      sprite(52, 100, k, 26, 97, drawLine),
      sprite(72, 128, k, 38, 124, drawBranch),
    ],
    tiffin: sprite(32, 32, k, 16, 24, context => drawTiffin(context)),
    tiffinIcon: sprite(18, 22, k, 9, 20, context => drawTiffin(context, false)),
    milestone: sprite(20, 26, k, 10, 23, drawMilestone),
    bell: sprite(18, 18, k, 9, 9, context => drawBell(context, 0, 0, 6.4)),
    gate: previous?.gate ?? null,
    clock: previous?.clock ?? 0, idle: previous?.idle ?? 0, landAt: -9, shakeAt: -9, savedAt: -9,
    popups: Array.from({ length: 4 }, () => ({ t: -9, text: "", color: "" })),
    puffs: Array.from({ length: PUFFS }, () => ({ x: 0, y: 0, t: -9, r: 0 })),
    seen: 0, run: null, metersShown: -1, metersText: "", gateText: "", markText: "", markFor: -1,
  } as Omit<Scene, "kidRun" | "kidUp" | "kidDown" | "kidDuck" | "kidSit"> as Scene;
  buildKid(scene, k, girl);
  return scene;
}

/** The gate's sign is text, so it is painted once the Bangla font has loaded. */
export function paintGate(scene: Scene) {
  scene.gate = sprite(180, 156, scene.k, 90, 152, context => drawGate(context, "স্কুল", `700 9px ${BODY_FONT}`));
}

export function setKid(scene: Scene, girl: boolean) {
  if (scene.girl === girl) return;
  scene.girl = girl;
  buildKid(scene, scene.k, girl);
}

/** Ambient time: the clock, and the road rolling slowly on the ready screen. */
export function tickScene(scene: Scene, dt: number, idle: boolean) {
  scene.clock += dt;
  if (idle) scene.idle += 110 * dt;
}

function stamp(scene: Scene, image: Sprite, x: number, y: number, scaleY = 1) {
  const { context, k } = scene;
  context.setTransform(k, 0, 0, k * scaleY, x * k, y * k);
  context.drawImage(image.canvas, -image.ox, -image.oy, image.w, image.h);
}

function pill(context: CanvasRenderingContext2D, x: number, y: number, w: number, h = 30) {
  context.fillStyle = "#14213dcc";
  context.beginPath(); context.roundRect(x, y, w, h, h / 2); context.fill();
}

function label(context: CanvasRenderingContext2D, text: string, x: number, y: number, fill: string) {
  context.font = `800 15px ${DISPLAY_FONT}`;
  const w = context.measureText(text).width + 18;
  context.fillStyle = fill;
  context.beginPath(); context.roundRect(x - w / 2, y - 13, w, 24, 12); context.fill();
  context.fillStyle = "#ffffff"; context.textAlign = "center";
  context.fillText(text, x, y + 4);
}

/** The strips behind the road: lane or field, with a seam where the zone changes (hidden behind a big tree). */
function drawBackdrop(scene: Scene, d: number, slow: boolean) {
  const { context, k } = scene;
  const zone = zoneOf(d / UNIT), seam = Math.ceil((d + 1) / (ZONE_M * UNIT)) * ZONE_M * UNIT - d;
  const farShift = slow ? 0 : (d * PARALLAX) % FAR, groundShift = d % TILE;
  context.setTransform(k, 0, 0, k, 0, 0);
  if (seam >= W) paintStrip(scene, zone, 0, W, farShift, groundShift);
  else { paintStrip(scene, zone, 0, seam, farShift, groundShift); paintStrip(scene, 1 - zone, seam, W, farShift, groundShift); }
  if (seam < W + 60) stamp(scene, scene.tree, seam, BACK + 1);
}

function paintStrip(scene: Scene, which: number, from: number, to: number, farShift: number, groundShift: number) {
  const { context } = scene;
  if (to <= from) return;
  context.save();
  context.beginPath(); context.rect(from, 0, to - from, H); context.clip();
  // A hair of overlap hides the seams between tiles at fractional device pixels.
  for (let x = -farShift; x < W; x += FAR) context.drawImage(scene.far[which].canvas, x, BACK - FAR_H, FAR + 0.6, FAR_H);
  for (let x = -groundShift; x < W; x += TILE) context.drawImage(scene.ground[which].canvas, x, BACK - 4, TILE + 0.6, H - BACK + 4);
  context.restore();
}

function drawPieces(scene: Scene, run: Run) {
  for (let index = run.first; index < run.count; index++) {
    const piece = pieceAt(run, index), x = piece.x - run.d;
    if (x > W + 60) break;
    if (x + piece.w < -60 || piece.state === TAKEN) continue;
    const cx = x + piece.w / 2;
    if (piece.kind === TIFFIN) stamp(scene, scene.tiffin, cx, GROUND - piece.y + Math.sin(scene.clock * 4 + index) * 1.5);
    else if (piece.kind === PUDDLE) stamp(scene, scene.puddles[Math.min(3, Math.max(0, Math.round((piece.w - 44) / 6)))], cx, GROUND);
    else stamp(scene, scene.things[piece.kind], cx, GROUND);
  }
}

function drawHints(scene: Scene, run: Run) {
  const { context, k } = scene;
  context.setTransform(k, 0, 0, k, 0, 0);
  for (let index = run.first; index < run.count; index++) {
    const piece = pieceAt(run, index), x = piece.x - run.d + piece.w / 2;
    if (x > W - 30) break;
    if (!piece.hint || piece.state !== AHEAD || x < KID_X + 10) continue;
    if (piece.hint === 1) label(context, "লাফ দাও! ↑", x, GROUND - 58, "#2b4c8ce6");
    else label(context, "নিচু হও! ↓", x, GROUND - 106, "#b23a2ee6");
  }
}

/** Markers on the far side of the lane: a stone every 100 m, the school gate at 1000 m and a friend's flag. */
function drawMarkers(scene: Scene, d: number, friend: { meters: number; name: string } | null) {
  const { context, k } = scene;
  const near = Math.floor(d / UNIT / 100) * 100;
  for (const meters of [near, near + 100]) {
    const x = meters * UNIT + KID_X - d;
    if (meters <= 0 || meters === GATE_M || x < -20 || x > W + 20) continue;
    stamp(scene, scene.milestone, x, BACK + 2);
    if (scene.markFor !== meters) { scene.markFor = meters; scene.markText = bn(meters); }
    context.setTransform(k, 0, 0, k, 0, 0);
    context.font = `700 7px ${BODY_FONT}`; context.fillStyle = "#3a3226"; context.textAlign = "center";
    context.fillText(scene.markText, x, BACK - 6);
  }
  const gateX = GATE_M * UNIT + KID_X - d;
  if (scene.gate && gateX > -90 && gateX < W + 90) stamp(scene, scene.gate, gateX, BACK + 2);
  if (friend) {
    const x = friend.meters * UNIT + KID_X - d;
    if (x > -40 && x < W + 60) {
      context.setTransform(k, 0, 0, k, 0, 0);
      context.strokeStyle = "#8a6a3a"; context.lineWidth = 1.6;
      context.beginPath(); context.moveTo(x, BACK + 2); context.lineTo(x, BACK - 52); context.stroke();
      context.fillStyle = "#ff7b54";
      context.beginPath(); context.moveTo(x, BACK - 52); context.lineTo(x + 18, BACK - 46); context.lineTo(x, BACK - 40); context.closePath(); context.fill();
      context.font = `700 11px ${BODY_FONT}`;
      const text = friend.name || "বন্ধু", w = context.measureText(text).width + 12;
      pill(context, x - w / 2, BACK - 72, w, 17);
      context.fillStyle = "#fff4dc"; context.textAlign = "center"; context.fillText(text, x, BACK - 60);
    }
  }
}

export function popup(scene: Scene, t: number, text: string, color: string) {
  const slot = scene.popups.reduce((oldest, item) => item.t < oldest.t ? item : oldest, scene.popups[0]);
  slot.t = t; slot.text = text; slot.color = color;
}

/** Turns the run's new events into dust, pops and shakes (events are rare, so this is not per-frame work). */
function readEvents(scene: Scene, run: Run, slow: boolean) {
  if (scene.run !== run) {
    scene.run = run; scene.seen = 0; scene.landAt = -9; scene.shakeAt = -9; scene.savedAt = -9;
    for (const item of scene.popups) item.t = -9;
    for (const puff of scene.puffs) puff.t = -9;
  }
  for (; scene.seen < run.eventCount; scene.seen++) {
    const event = run.events[scene.seen % run.events.length];
    if (event.type === LANDED) {
      scene.landAt = event.t;
      if (!slow) for (let index = 0; index < 3; index++) {
        const puff = scene.puffs[(scene.seen * 3 + index) % PUFFS];
        puff.x = event.at + KID_X - 6 + index * 6; puff.y = GROUND - 1; puff.t = event.t; puff.r = 2.5 + index;
      }
    } else if (event.type === GOT_TIFFIN) popup(scene, event.t, "টিফিন পেলে! একটা ধাক্কা মাফ", "#ffe38a");
    else if (event.type === SAVED) { scene.savedAt = event.t; if (!slow) scene.shakeAt = event.t; popup(scene, event.t, "বাঁচলে! টিফিনটা গেল", "#ffd2c4"); }
    else if (event.type === MILESTONE) popup(scene, event.t, `${bn(Math.floor(event.at / UNIT / 100) * 100)} মিটার!`, "#ffffff");
    else if (event.type === GATE) popup(scene, event.t, "গেটে পৌঁছে গেছ! ঘণ্টা পড়েনি!", "#ffe38a");
  }
}

function drawKidNow(scene: Scene, run: Run | null) {
  const t = run?.t ?? scene.clock;
  if (run?.over) { stamp(scene, scene.kidSit, KID_X, GROUND); return; }
  const d = run ? run.d : scene.idle;
  let image = scene.kidRun[Math.floor(d / STRIDE) % RUN_FRAMES];
  if (run && run.ducking) image = scene.kidDuck[Math.floor(d / (STRIDE * 3)) % 2];
  else if (run && run.air >= 0) image = run.vy > 0 ? scene.kidUp : scene.kidDown;
  const squash = run && run.air < 0 && t - scene.landAt < 0.1 ? 0.9 : 1;
  scene.context.globalAlpha = run && run.t < run.safeUntil ? 0.55 : 1;
  scene.context.fillStyle = "#3a2a1a22";
  scene.context.setTransform(scene.k, 0, 0, scene.k, 0, 0);
  const lift = run ? run.y : 0;
  scene.context.beginPath(); scene.context.ellipse(KID_X, GROUND + 1, Math.max(5, 11 - lift * 0.06), 2.2, 0, 0, Math.PI * 2); scene.context.fill();
  stamp(scene, image, KID_X, GROUND - lift, squash);
  scene.context.globalAlpha = 1;
}

/** One frame. `run` is null on the ready screen (the kid runs in place on an empty road). */
export function drawScene(scene: Scene, run: Run | null, slow: boolean, friend: { meters: number; name: string } | null) {
  const { context, k } = scene;
  if (run) readEvents(scene, run, slow);
  const t = run?.t ?? 0;
  const d = run ? run.d : scene.idle;
  const shake = !slow && run && t - scene.shakeAt < 0.3 ? Math.sin((t - scene.shakeAt) * 70) * 3 * (1 - (t - scene.shakeAt) / 0.3) : 0;
  context.setTransform(k, 0, 0, k, shake * k, 0);
  context.drawImage(scene.sky.canvas, 0, 0, W, BACK + 2);
  drawBackdrop(scene, d, slow);
  drawMarkers(scene, d, friend);
  if (run) drawPieces(scene, run);
  drawKidNow(scene, run);

  context.setTransform(k, 0, 0, k, 0, 0);
  if (run && !slow) {
    context.fillStyle = "#d9c3a0";
    for (const puff of scene.puffs) {
      const age = t - puff.t;
      if (age < 0 || age > 0.4) continue;
      context.globalAlpha = 0.7 * (1 - age / 0.4);
      context.beginPath(); context.arc(puff.x - d, puff.y - age * 10, puff.r + age * 10, 0, Math.PI * 2); context.fill();
    }
    context.globalAlpha = 1;
  }
  if (run && !run.over) drawHints(scene, run);

  context.setTransform(k, 0, 0, k, 0, 0);
  context.textAlign = "center"; context.lineJoin = "round";
  context.font = `800 17px ${DISPLAY_FONT}`;
  for (const item of scene.popups) {
    const age = t - item.t;
    if (age < 0 || age > 1.4) continue;
    const y = 82 - (slow ? 0 : Math.min(age, 0.3) * 20);
    context.globalAlpha = age < 1 ? 1 : 1 - (age - 1) / 0.4;
    context.strokeStyle = "#14213d"; context.lineWidth = 4; context.strokeText(item.text, W / 2, y);
    context.fillStyle = item.color; context.fillText(item.text, W / 2, y);
  }
  context.globalAlpha = 1;
  drawHud(scene, run, slow);
}

function drawHud(scene: Scene, run: Run | null, slow: boolean) {
  const { context } = scene;
  const meters = run?.meters ?? 0;
  if (meters !== scene.metersShown) {
    scene.metersShown = meters;
    scene.metersText = `${bn(meters)} মি`;
    scene.gateText = meters >= GATE_M ? "গেট পার!" : `গেট ${bn(GATE_M - meters)} মি`;
  }
  context.setTransform(scene.k, 0, 0, scene.k, 0, 0);
  context.textAlign = "left";
  pill(context, 10, 10, 92);
  context.font = `800 18px ${DISPLAY_FONT}`; context.fillStyle = "#fff4dc";
  context.fillText(scene.metersText, 22, 31);
  if (run?.tiffin) { pill(context, 108, 10, 34); stamp(scene, scene.tiffinIcon, 125, 34); }
  context.setTransform(scene.k, 0, 0, scene.k, 0, 0);
  pill(context, W - 130, 10, 120);
  // The school bell swings for half a second every two and a half (it rings; it never flashes).
  const ring = scene.clock % 2.5;
  const swing = !slow && meters < GATE_M && ring < 0.6 ? Math.sin(ring * 22) * 0.4 * (1 - ring / 0.6) : 0;
  const { k } = scene, cos = Math.cos(swing) * k, sin = Math.sin(swing) * k;
  context.setTransform(cos, sin, -sin, cos, (W - 113) * k, 18 * k);
  context.drawImage(scene.bell.canvas, -scene.bell.ox, -scene.bell.oy + 6, scene.bell.w, scene.bell.h);
  context.setTransform(k, 0, 0, k, 0, 0);
  context.font = `700 14px ${BODY_FONT}`; context.fillStyle = meters >= GATE_M ? "#ffe38a" : "#fff4dc"; context.textAlign = "left";
  context.fillText(scene.gateText, W - 99, 30);
}

