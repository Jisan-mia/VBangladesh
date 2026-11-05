// Paints everything still once into small offscreen sprites, sized for this phone and this world, so each frame
// (draw.hot.ts) only stamps them. Rebuilt on a resize, a new world, the kid changing, or the Bangla font arriving.
import { BODY_FONT, DISPLAY_FONT } from "../../../shared/card-canvas";
import {
  drawBasket, drawBell, drawBike, drawBranch, drawCow, drawGateFrame, drawGateLeaf, drawGuard, drawKid, drawLine, drawMilestone, drawMud, drawPage,
  drawPuddle, drawSign, drawSitting, drawTiffin, drawTire, duckPose, jumpDownPose, jumpUpPose, paintBrickTile, paintDirtTile, paintPavement,
  paintSeamTree, paintTown, paintVillageField, paintVillageLane, paintWetDirt, paintWorldSky, runPose, STRIP_H, STRIP_W, TILE, TILE_H, WORLD_ART,
} from "./art";
import { KINDS, W } from "./course";

export type Sprite = { canvas: HTMLCanvasElement; w: number; h: number; ox: number; oy: number };

export const RUN_FRAMES = 8;
/** Words that pop over the kid, by number. */
export const WORD = { OOF: 0, GO: 1, TIFFIN: 2, SAVED: 3, GATE: 4, SPLASH: 5, LATE: 6, MADE_IT: 7 } as const;
const WORDS = ["উফ!", "চলো!", "টিফিন!", "বাঁচলে!", "গেট পার!", "ছপাৎ!", "ঢং ঢং!", "ঠিক সময়ে!"];
const WORD_COLORS = ["#ffd2c4", "#ffffff", "#ffe38a", "#ffe38a", "#ffe38a", "#cfe8ff", "#ffd2c4", "#ffe38a"];
/** Lessons over a level's new thing (index = the piece's hint). */
const HINTS = ["", "লাফ দাও! ↑", "নিচু হও! ↓", "লাফ দিয়ে চেপে ধরো!", "চাকা আসছে! লাফ ↑"];
const HINT_COLORS = ["", "#2b4c8ce6", "#b23a2ee6", "#7a4a1ee6", "#2f6b4fe6"];
/** The signboards say different shops; one is chosen per board from its spot on the road. */
export const SIGN_WORDS = ["চা", "মুদি", "দর্জি"];
export const PUFFS = 12, DROPS = 10, POPS = 3;

export type Scene = {
  context: CanvasRenderingContext2D;
  /** Device pixels per unit, the view's height in units, the road line, the far strip's foot. */
  k: number; viewH: number; groundY: number; back: number;
  world: number; girl: boolean; fonts: boolean;
  sky: Sprite; far: Sprite[]; ground: Sprite[]; tree: Sprite; rain: Sprite | null;
  kidRun: Sprite[]; kidUp: Sprite; kidDown: Sprite; kidDuck: Sprite[]; kidSit: Sprite; kidStand: Sprite;
  puddles: Sprite[]; muds: Sprite[]; things: (Sprite | null)[]; signs: Sprite[];
  tiffin: Sprite; page: Sprite; milestone: Sprite; gateFrame: Sprite; gateLeaf: Sprite; guard: Sprite; bell: Sprite;
  chipJump: Sprite; chipDuck: Sprite; chipTire: Sprite;
  hints: Sprite[]; words: Sprite[]; milestones: Map<number, Sprite>; flag: Sprite | null; flagMeters: number;
  /** Ambient seconds, and how far the road has rolled on the ready screen. */
  clock: number; idle: number;
  /** Juice: dust puffs, splash drops, popped words, pages flying to the HUD. Pre-allocated, mutated in place. */
  puffX: Float32Array; puffY: Float32Array; puffT: Float32Array; puffR: Float32Array; puffNext: number;
  dropX: Float32Array; dropY: Float32Array; dropVX: Float32Array; dropVY: Float32Array; dropT: Float32Array; dropNext: number;
  popWord: Int8Array; popT: Float32Array; popNext: number;
  pageT: Float32Array; pageX: Float32Array; pageY: Float32Array; pageNext: number;
  landAt: number; takeoffAt: number; shakeAt: number;
};

function sprite(w: number, h: number, k: number, ox: number, oy: number, paint: (context: CanvasRenderingContext2D) => void): Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(w * k)); canvas.height = Math.max(1, Math.ceil(h * k));
  const context = canvas.getContext("2d")!;
  context.setTransform(k, 0, 0, k, ox * k, oy * k);
  paint(context);
  return { canvas, w, h, ox, oy };
}

function pill(text: string, k: number, size: number, fill: string, ink = "#ffffff") {
  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = `800 ${size}px ${DISPLAY_FONT}`;
  const w = Math.ceil(probe.measureText(text).width) + 18, h = size + 10;
  return sprite(w, h, k, w / 2, h / 2, context => {
    context.fillStyle = fill; context.beginPath(); context.roundRect(-w / 2, -h / 2, w, h, h / 2); context.fill();
    context.font = `800 ${size}px ${DISPLAY_FONT}`; context.fillStyle = ink; context.textAlign = "center"; context.textBaseline = "middle";
    context.fillText(text, 0, 1);
  });
}

function outlined(text: string, k: number, size: number, color: string) {
  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = `800 ${size}px ${DISPLAY_FONT}`;
  const w = Math.ceil(probe.measureText(text).width) + 10, h = size + 10;
  return sprite(w, h, k, w / 2, h / 2, context => {
    context.font = `800 ${size}px ${DISPLAY_FONT}`; context.textAlign = "center"; context.textBaseline = "middle"; context.lineJoin = "round";
    context.strokeStyle = "#14213d"; context.lineWidth = 4; context.strokeText(text, 0, 1);
    context.fillStyle = color; context.fillText(text, 0, 1);
  });
}

function chip(k: number, color: string, paint: (context: CanvasRenderingContext2D) => void) {
  return sprite(28, 28, k, 14, 14, context => {
    context.fillStyle = color; context.beginPath(); context.arc(0, 0, 12, 0, Math.PI * 2); context.fill();
    context.strokeStyle = "#ffffff"; context.lineWidth = 2; context.stroke();
    paint(context);
  });
}

const kidSprite = (k: number, paint: (context: CanvasRenderingContext2D) => void) => sprite(64, 62, k, 30, 56, paint);

/** Sizes the canvas to `cssW` × `cssH` and paints every sprite for this world. The road always shows W units across. */
export function makeScene(canvas: HTMLCanvasElement, cssW: number, cssH: number, ratio: number, world: number, girl: boolean, fonts: boolean, previous?: Scene | null): Scene {
  canvas.width = Math.round(cssW * ratio); canvas.height = Math.round(cssH * ratio);
  const k = (cssW / W) * ratio, viewH = Math.max(240, (cssH / cssW) * W);
  // The road sits about two thirds down on a tall stage, above the verge and the two thumb pads; on a short stage it drops to the bottom.
  const pads = viewH > 420 ? Math.min(240, viewH * 0.32) : Math.max(TILE_H, viewH * 0.2);
  const groundY = Math.round(viewH - pads), back = groundY - 14;
  const font = (size: number) => `700 ${size}px ${fonts ? BODY_FONT : "sans-serif"}`;
  const far = world === 1
    ? [sprite(STRIP_W, STRIP_H, k, 0, 0, context => paintTown(context, STRIP_W, STRIP_H, font(7.5)))]
    : [sprite(STRIP_W, STRIP_H, k, 0, 0, paintVillageLane), sprite(STRIP_W, STRIP_H, k, 0, 0, paintVillageField)];
  const wash = WORLD_ART[world].wash;
  if (wash) for (const strip of far) { const c = strip.canvas.getContext("2d")!; c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = "source-atop"; c.fillStyle = wash; c.fillRect(0, 0, strip.canvas.width, strip.canvas.height); }
  const ground = world === 1 ? [sprite(TILE, TILE_H, k, 0, 0, context => paintPavement(context, TILE))]
    : world === 2 ? [sprite(TILE, TILE_H, k, 0, 0, context => paintWetDirt(context, TILE))]
    : [sprite(TILE, TILE_H, k, 0, 0, paintBrickTile), sprite(TILE, TILE_H, k, 0, 0, paintDirtTile)];
  const things: (Sprite | null)[] = Array.from({ length: KINDS }, () => null);
  things[1] = sprite(42, 32, k, 21, 28, drawBasket);
  things[2] = sprite(60, 40, k, 30, 37, drawBike);
  things[3] = sprite(76, 40, k, 38, 35, drawCow);
  things[4] = sprite(52, 100, k, 26, 97, drawLine);
  things[5] = sprite(72, 128, k, 38, 124, drawBranch);
  things[9] = sprite(24, 24, k, 12, 12, drawTire);
  const scene: Scene = {
    context: canvas.getContext("2d")!, k, viewH, groundY, back, world, girl, fonts,
    sky: sprite(W, back + 2, k, 0, 0, context => paintWorldSky(context, W, back + 2, world)),
    far, ground, tree: sprite(100, 136, k, 50, 132, paintSeamTree),
    rain: world === 2 ? sprite(120, 120, k, 0, 0, context => {
      context.strokeStyle = "#dfe8f3aa"; context.lineWidth = 0.7; context.lineCap = "round";
      context.beginPath();
      for (let i = 0; i < 26; i++) { const x = (i * 47) % 120, y = (i * 83) % 120; context.moveTo(x, y); context.lineTo(x - 4, y + 11); }
      context.stroke();
    }) : null,
    kidRun: [], kidUp: null!, kidDown: null!, kidDuck: [], kidSit: null!, kidStand: null!,
    puddles: [0, 1, 2, 3].map(step => sprite(80, 14, k, 40, 8, context => drawPuddle(context, 44 + step * 6))),
    muds: [0, 1, 2, 3].map(step => sprite(132, 16, k, 66, 9, context => drawMud(context, 84 + step * 8))),
    things,
    signs: SIGN_WORDS.map(word => sprite(76, 118, k, 36, 114, context => drawSign(context, word, font(13)))),
    tiffin: sprite(32, 32, k, 16, 24, context => drawTiffin(context)),
    page: sprite(32, 32, k, 16, 24, context => drawPage(context)),
    milestone: sprite(20, 26, k, 10, 23, drawMilestone),
    gateFrame: sprite(140, 156, k, 70, 152, context => drawGateFrame(context, "স্কুল", font(9))),
    gateLeaf: sprite(52, 74, k, 1, 72, drawGateLeaf),
    guard: sprite(36, 60, k, 18, 58, drawGuard),
    bell: sprite(18, 18, k, 9, 9, context => drawBell(context, 0, 0, 6.4)),
    chipJump: chip(k, "#f28c28", context => { context.fillStyle = "#fff"; context.beginPath(); context.moveTo(-6, 4); context.lineTo(0, -6); context.lineTo(6, 4); context.closePath(); context.fill(); }),
    chipDuck: chip(k, "#d94b3d", context => { context.fillStyle = "#fff"; context.beginPath(); context.moveTo(-6, -4); context.lineTo(0, 6); context.lineTo(6, -4); context.closePath(); context.fill(); }),
    chipTire: chip(k, "#2f6b4f", context => { context.strokeStyle = "#fff"; context.lineWidth = 2.4; context.beginPath(); context.arc(0, 0, 6, 0, Math.PI * 2); context.stroke(); context.fillStyle = "#fff"; context.beginPath(); context.arc(0, 0, 1.6, 0, Math.PI * 2); context.fill(); }),
    hints: HINTS.map((text, index) => text ? pill(text, k, 14, HINT_COLORS[index]) : sprite(1, 1, k, 0, 0, () => {})),
    words: WORDS.map((text, index) => outlined(text, k, 15, WORD_COLORS[index])),
    milestones: new Map(), flag: null, flagMeters: -1,
    clock: previous?.clock ?? 0, idle: previous?.idle ?? 0,
    puffX: new Float32Array(PUFFS), puffY: new Float32Array(PUFFS), puffT: new Float32Array(PUFFS).fill(-9), puffR: new Float32Array(PUFFS), puffNext: 0,
    dropX: new Float32Array(DROPS), dropY: new Float32Array(DROPS), dropVX: new Float32Array(DROPS), dropVY: new Float32Array(DROPS), dropT: new Float32Array(DROPS).fill(-9), dropNext: 0,
    popWord: new Int8Array(POPS).fill(-1), popT: new Float32Array(POPS).fill(-9), popNext: 0,
    pageT: new Float32Array(3).fill(-9), pageX: new Float32Array(3), pageY: new Float32Array(3), pageNext: 0,
    landAt: -9, takeoffAt: -9, shakeAt: -9,
  };
  buildKid(scene, girl);
  return scene;
}

function buildKid(scene: Scene, girl: boolean) {
  const k = scene.k;
  scene.girl = girl;
  scene.kidRun = Array.from({ length: RUN_FRAMES }, (_, frame) => kidSprite(k, context => drawKid(context, runPose(frame / RUN_FRAMES), girl)));
  scene.kidUp = kidSprite(k, context => drawKid(context, jumpUpPose, girl));
  scene.kidDown = kidSprite(k, context => drawKid(context, jumpDownPose, girl));
  scene.kidDuck = [kidSprite(k, context => drawKid(context, duckPose(0), girl)), kidSprite(k, context => drawKid(context, duckPose(1), girl))];
  scene.kidSit = kidSprite(k, context => drawSitting(context, girl));
  scene.kidStand = kidSprite(k, context => drawKid(context, { ...runPose(0), thighF: 0.1, thighB: -0.05, bendF: 0.2, bendB: 0.2, armF: 0.2, armB: -0.2, mouth: 2 }, girl));
}

export function setKid(scene: Scene, girl: boolean) { if (scene.girl !== girl) buildKid(scene, girl); }

/** A friend's flag on the road side, with their name, where they stopped. */
export function setFlag(scene: Scene, meters: number, name: string) {
  scene.flagMeters = meters;
  scene.flag = pill(name || "বন্ধু", scene.k, 11, "#14213dcc", "#fff4dc");
}
export function clearFlag(scene: Scene) { scene.flag = null; scene.flagMeters = -1; }

/** The "300 মিটার!" word on the endless road, painted the first time it's needed. */
export function milestoneWord(scene: Scene, meters: number, text: string) {
  let word = scene.milestones.get(meters);
  if (!word) { word = outlined(text, scene.k, 15, "#ffffff"); scene.milestones.set(meters, word); }
  return word;
}

/* ---------- juice: called on events (rare), never per frame ---------- */

export function puff(scene: Scene, x: number, y: number, t: number, r: number) {
  const i = scene.puffNext++ % PUFFS;
  scene.puffX[i] = x; scene.puffY[i] = y; scene.puffT[i] = t; scene.puffR[i] = r;
}
export function splash(scene: Scene, x: number, y: number, t: number) {
  for (let n = 0; n < 6; n++) {
    const i = scene.dropNext++ % DROPS;
    scene.dropX[i] = x; scene.dropY[i] = y; scene.dropT[i] = t;
    scene.dropVX[i] = -40 + n * 18; scene.dropVY[i] = 90 + (n % 3) * 30;
  }
}
export function say(scene: Scene, word: number, t: number) {
  const i = scene.popNext++ % POPS;
  scene.popWord[i] = word; scene.popT[i] = t;
}
export function flyPage(scene: Scene, x: number, y: number, t: number) {
  const i = scene.pageNext++ % 3;
  scene.pageX[i] = x; scene.pageY[i] = y; scene.pageT[i] = t;
}
export function resetFx(scene: Scene) {
  scene.puffT.fill(-9); scene.dropT.fill(-9); scene.popT.fill(-9); scene.pageT.fill(-9);
  scene.landAt = -9; scene.takeoffAt = -9; scene.shakeAt = -9;
}
