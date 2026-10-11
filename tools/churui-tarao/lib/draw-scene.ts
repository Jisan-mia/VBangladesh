// Draws the paddy field at golden hour. Everything still is painted once into offscreen canvases;
// each frame only stamps sprites, so a cheap phone keeps 60 fps. Slow mode drops flapping, sway, grain bits and wobble:
// sparrows fade in and out instead.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import { drawPaddy, drawScarecrow, drawSheaf, drawSparrow, PECK, SIT, WINGS_DOWN, WINGS_UP } from "./art";
import { bn, flight, DURATION, FIELD, GRAIN, H, SCARECROW, SHOOED, SITTING, FLYING, W, type Game } from "./game";

type Sprite = { canvas: HTMLCanvasElement; w: number; h: number };
type Ripple = { x: number; y: number; at: number; hit: boolean };

/** Sparrow sprite size; each is scaled by depth (farther = smaller) when stamped. */
const BIRD = 44;
const WORDS = ["হুশ!", "হুশ!", "যাহ্!", "হুশ!", "হুশ হুশ!"];
const POP_FONT = `800 23px ${DISPLAY_FONT}`, HUD_FONT = `800 20px ${DISPLAY_FONT}`;

export type Scene = {
  context: CanvasRenderingContext2D; k: number;
  bg: Sprite; front: Sprite; birds: Sprite[]; scarecrow: Sprite[]; sheaf: Sprite; hand: Sprite;
  dusk: CanvasGradient;
  clock: number; meter: number; ripples: Ripple[]; ripple: number;
  /** Keyboard hand: shown once an arrow key is used. */
  handX: number; handY: number; handShown: boolean;
  meterShown: number; meterText: string; countShown: number; countText: string; timeShown: number; timeText: string;
};

function sprite(w: number, h: number, k: number, paint: (context: CanvasRenderingContext2D) => void, origin: [number, number] = [w / 2, h / 2]): Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(w * k); canvas.height = Math.ceil(h * k);
  const context = canvas.getContext("2d")!;
  context.setTransform(k, 0, 0, k, origin[0] * k, origin[1] * k);
  paint(context);
  return { canvas, w, h };
}

function paintBackground(context: CanvasRenderingContext2D) {
  // Golden-hour sky, the sun low over the village.
  const sky = context.createLinearGradient(0, 0, 0, 214);
  sky.addColorStop(0, "#f39a6b"); sky.addColorStop(0.45, "#f8b878"); sky.addColorStop(1, "#ffe0a0");
  context.fillStyle = sky; context.fillRect(0, 0, W, 216);
  const glow = context.createRadialGradient(84, 186, 10, 84, 186, 120);
  glow.addColorStop(0, "#fff4c8"); glow.addColorStop(0.3, "#ffe29a99"); glow.addColorStop(1, "#ffd28a00");
  context.fillStyle = glow; context.fillRect(0, 60, 220, 156);
  context.fillStyle = "#fff6d6";
  context.beginPath(); context.arc(84, 188, 22, 0, Math.PI * 2); context.fill();
  // Long soft clouds lit pink from below.
  for (const [x, y, w] of [[230, 92, 70], [300, 120, 52], [60, 112, 46], [170, 70, 40]]) {
    context.fillStyle = "#f7c0a2aa"; context.beginPath(); context.ellipse(x, y, w, 7, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#ffd9b8cc"; context.beginPath(); context.ellipse(x - 6, y - 3, w * 0.7, 4, 0, 0, Math.PI * 2); context.fill();
  }

  // The village line, hazy in the warm light: palms, a bamboo clump, round trees and a tin-roofed hut.
  context.fillStyle = "#a07c4e";
  for (const [x, r] of [[20, 14], [140, 18], [176, 13], [236, 16], [330, 20], [356, 14]]) { context.beginPath(); context.arc(x, 210 - r * 0.5, r, 0, Math.PI * 2); context.fill(); }
  context.fillStyle = "#8a6a40";
  for (const [x, top] of [[46, 168], [118, 160], [262, 172], [318, 164]]) {
    context.fillRect(x - 1.2, top, 2.4, 212 - top);
    for (let leaf = 0; leaf < 7; leaf++) { const a = -Math.PI / 2 + (leaf - 3) * 0.48; context.beginPath(); context.ellipse(x + Math.cos(a) * 9, top + Math.sin(a) * 6 + 3, 11, 2.4, a, 0, Math.PI * 2); context.fill(); }
  }
  context.strokeStyle = "#8a6a40"; context.lineWidth = 1.8;
  context.beginPath(); for (let x = 196; x < 214; x += 3) { context.moveTo(x, 212); context.quadraticCurveTo(x + 3, 186, x + 11, 168 + (x % 7)); } context.stroke();
  context.fillStyle = "#7a5e3c"; context.fillRect(282, 196, 30, 16);
  context.fillStyle = "#b9a58a";
  context.beginPath(); context.moveTo(276, 198); context.lineTo(286, 186); context.lineTo(308, 186); context.lineTo(318, 198); context.closePath(); context.fill();
  context.fillStyle = "#fff0c6"; context.fillRect(290, 187, 12, 2);

  // The field: far rows hazy and fine, near rows deeper gold.
  const field = context.createLinearGradient(0, 208, 0, H);
  field.addColorStop(0, "#f0c35c"); field.addColorStop(0.35, "#e2a83e"); field.addColorStop(1, "#c4862a");
  context.fillStyle = field; context.fillRect(0, 208, W, H - 208);
  // An আল (earthen ridge) runs across the far field.
  context.fillStyle = "#b98a4e";
  context.beginPath(); context.moveTo(0, 226); context.quadraticCurveTo(180, 214, W, 222); context.lineTo(W, 226); context.quadraticCurveTo(180, 219, 0, 231); context.closePath(); context.fill();
  // Row striations, tighter toward the horizon.
  context.strokeStyle = "#c8902e66"; context.lineWidth = 1;
  context.beginPath();
  for (let y = 212; y < H; y += 3 + (y - 208) * 0.06) { context.moveTo(0, y); context.lineTo(W, y + 2); }
  context.stroke();
  // Tiny far heads, then clumps growing with depth.
  context.fillStyle = "#ffd46a99";
  for (let index = 0; index < 160; index++) {
    const x = (index * 47) % W, y = 210 + ((index * 29) % 40);
    context.beginPath(); context.ellipse(x, y, 1.6, 1, 0.4, 0, Math.PI * 2); context.fill();
  }
  for (let row = 0; row < 10; row++) {
    const y = 236 + row * 21, size = 14 + row * 4, step = 22 + row * 3.2;
    for (let index = 0, x = ((row * 37) % 17) - 10; x < W + 20; index++, x += step * (0.75 + ((index * 13 + row * 7) % 10) / 20)) {
      context.save(); context.translate(x, y + ((index * 7 + row * 3) % 6) - 3); drawPaddy(context, size, (((index * 5 + row) % 5) - 2) * 0.14, index + row * 11); context.restore();
    }
  }
}

function paintFront(context: CanvasRenderingContext2D) {
  // The nearest clumps, drawn over the sparrows so they sit down in the paddy.
  for (let index = 0; index < 13; index++) {
    context.save(); context.translate(index * 30 - 6 + (index % 3) * 7, 76 + (index % 2) * 4); drawPaddy(context, 36 + ((index * 5) % 3) * 6, (((index * 3) % 5) - 2) * 0.16, index * 7 + 3); context.restore();
  }
}

function paintHand(context: CanvasRenderingContext2D) {
  // An open palm, for the keyboard's clap.
  context.fillStyle = "#ffe3c6"; context.strokeStyle = "#6b3f22"; context.lineWidth = 1.4;
  for (const [x, top] of [[-6, -12], [-2, -14], [2, -13.5], [6, -11]]) { context.beginPath(); context.roundRect(x - 1.8, top, 3.6, 12, 1.8); context.fill(); context.stroke(); }
  context.beginPath(); context.roundRect(-8, -4, 16, 13, 5); context.fill(); context.stroke();
  context.beginPath(); context.roundRect(-13, -2, 8, 3.6, 1.8); context.fill(); context.stroke();
}

export function makeScene(canvas: HTMLCanvasElement, cssWidth: number, previous?: Scene | null): Scene {
  const ratio = Math.min(2, window.devicePixelRatio || 1), cssHeight = cssWidth * H / W;
  canvas.width = Math.round(cssWidth * ratio); canvas.height = Math.round(cssHeight * ratio);
  const k = cssWidth / W * ratio;
  const context = canvas.getContext("2d")!;
  const dusk = context.createLinearGradient(0, 0, 0, H);
  dusk.addColorStop(0, "#6a2c5a"); dusk.addColorStop(0.5, "#a0484033"); dusk.addColorStop(1, "#5a2a2a55");
  const bird = (pose: number) => sprite(BIRD * 1.5, BIRD * 1.5, k * 1.15, c => drawSparrow(c, BIRD, pose));
  return {
    context, k, dusk,
    bg: sprite(W, H, k, paintBackground, [0, 0]),
    front: sprite(W, 80, k, paintFront, [0, 0]),
    birds: [bird(SIT), bird(PECK), bird(WINGS_UP), bird(WINGS_DOWN)],
    scarecrow: [0, 1, 2].map(mood => sprite(SCARECROW.height, SCARECROW.height * 1.02, k, c => drawScarecrow(c, SCARECROW.height, mood), [SCARECROW.height / 2, SCARECROW.height])),
    sheaf: sprite(26, 26, k * 1.2, c => drawSheaf(c, 24)),
    hand: sprite(30, 30, k, paintHand),
    clock: previous?.clock ?? 0, meter: previous?.meter ?? GRAIN,
    ripples: Array.from({ length: 6 }, () => ({ x: 0, y: 0, at: -9, hit: false })), ripple: 0,
    handX: previous?.handX ?? W / 2, handY: previous?.handY ?? (FIELD.top + FIELD.bottom) / 2, handShown: previous?.handShown ?? false,
    meterShown: -1, meterText: "", countShown: -1, countText: "", timeShown: -1, timeText: "",
  };
}

export function tickScene(scene: Scene, dt: number, game: Game | null) {
  scene.clock += dt;
  const target = game?.grain ?? GRAIN;
  scene.meter += (target - scene.meter) * Math.min(1, dt * 6);
}

export function addRipple(scene: Scene, x: number, y: number, hit: boolean) {
  const ripple = scene.ripples[scene.ripple++ % scene.ripples.length];
  ripple.x = x; ripple.y = y; ripple.at = scene.clock; ripple.hit = hit;
}

/** Draws a sprite centred at (x, y), scaled, mirrored when `facing` is -1. */
function stamp(scene: Scene, image: Sprite, x: number, y: number, scale: number, facing = 1, angle = 0) {
  const { context, k } = scene;
  const cos = Math.cos(angle) * k * scale, sin = Math.sin(angle) * k * scale;
  context.setTransform(cos * facing, sin * facing, -sin, cos, x * k, y * k);
  context.drawImage(image.canvas, -image.w / 2, -image.h / 2, image.w, image.h);
}

const depth = (y: number) => 0.82 + 0.3 * (y - FIELD.top) / (FIELD.bottom - FIELD.top);
const smooth = (u: number) => u * u * (3 - 2 * u);

function pill(context: CanvasRenderingContext2D, x: number, w: number) {
  context.fillStyle = "#3a2112b3";
  context.beginPath(); context.roundRect(x, 10, w, 34, 17); context.fill();
}

/** One frame. `game` is never null once the scene exists; on the ready screen its clock is still before or at 0. */
export function drawScene(scene: Scene, game: Game, slow: boolean) {
  const { context, k } = scene;
  const t = game.t, clock = scene.clock;
  context.setTransform(k, 0, 0, k, 0, 0);
  context.globalAlpha = 1;
  context.drawImage(scene.bg.canvas, 0, 0, W, H);

  // The কাকতাড়ুয়া frets as the field empties, and gives a little jig with each fresh shoo.
  let lastShoo = -9;
  for (let index = 0; index < game.birds.length; index++) if (game.birds[index].state === SHOOED) lastShoo = Math.max(lastShoo, game.birds[index].shooAt);
  const jig = !slow && t - lastShoo < 0.4 ? Math.sin((t - lastShoo) * 30) * 0.05 * (1 - (t - lastShoo) / 0.4) : 0;
  const mood = scene.meter > 70 ? 0 : scene.meter > 40 ? 1 : 2;
  const crow = scene.scarecrow[mood];
  context.setTransform(Math.cos(jig) * k, Math.sin(jig) * k, -Math.sin(jig) * k, Math.cos(jig) * k, SCARECROW.x * k, SCARECROW.base * k);
  context.drawImage(crow.canvas, -crow.w / 2, -crow.h, crow.w, crow.h);

  // Sparrows, back to front (the schedule is in landing order, close enough for depth here).
  for (let index = 0; index < game.birds.length; index++) {
    const bird = game.birds[index];
    if (bird.state === FLYING || bird.state === SITTING) drawBird(scene, index, t, clock, slow, game);
    else if (bird.state === SHOOED && t - bird.shooAt < 1) drawShooed(scene, index, t, slow, game);
  }

  // Front paddy sways a touch.
  const sway = slow ? 0 : Math.sin(clock * 1.3) * 0.03;
  context.setTransform(k, 0, sway * k, k, -sway * 80 * k, (H - 80) * k);
  context.drawImage(scene.front.canvas, 0, 0, W, 80);

  // "হুশ!" over each sparrow just shooed.
  context.setTransform(k, 0, 0, k, 0, 0);
  context.textAlign = "center"; context.lineJoin = "round";
  context.font = POP_FONT;
  for (let index = 0; index < game.birds.length; index++) {
    const bird = game.birds[index];
    if (bird.state !== SHOOED) continue;
    const age = t - bird.shooAt;
    if (age < 0 || age > 0.8) continue;
    const y = bird.y - 30 - (slow ? 0 : age * 30);
    context.globalAlpha = age < 0.55 ? 1 : 1 - (age - 0.55) / 0.25;
    context.strokeStyle = "#4a240e"; context.lineWidth = 5;
    context.strokeText(WORDS[index % WORDS.length], bird.x, y);
    context.fillStyle = "#fff6d8";
    context.fillText(WORDS[index % WORDS.length], bird.x, y);
  }
  context.globalAlpha = 1;

  // Tap ripples: a ring, and three clap marks when a sparrow went.
  for (const ripple of scene.ripples) {
    const age = clock - ripple.at;
    if (age < 0 || age > 0.35) continue;
    const u = age / 0.35, r = slow ? 18 : 10 + 22 * u;
    context.globalAlpha = 1 - u;
    context.strokeStyle = "#fffbe8"; context.lineWidth = 3.5;
    context.beginPath(); context.arc(ripple.x, ripple.y, r, 0, Math.PI * 2); context.stroke();
    if (ripple.hit) {
      context.beginPath();
      for (let mark = 0; mark < 3; mark++) {
        const a = -Math.PI / 2 + (mark - 1) * 0.7;
        context.moveTo(ripple.x + Math.cos(a) * (r + 4), ripple.y + Math.sin(a) * (r + 4));
        context.lineTo(ripple.x + Math.cos(a) * (r + 11), ripple.y + Math.sin(a) * (r + 11));
      }
      context.stroke();
    }
  }
  context.globalAlpha = 1;

  if (scene.handShown) stamp(scene, scene.hand, scene.handX, scene.handY, 1.1);
  context.setTransform(k, 0, 0, k, 0, 0);

  // Dusk comes on slowly over the 45 seconds.
  const dusk = Math.min(1, Math.max(0, t) / DURATION) * 0.32;
  if (dusk > 0.01) { context.globalAlpha = dusk; context.fillStyle = scene.dusk; context.fillRect(0, 0, W, H); context.globalAlpha = 1; }
  drawHud(scene, game);
}

function drawBird(scene: Scene, index: number, t: number, clock: number, slow: boolean, game: Game) {
  const bird = game.birds[index], { context } = scene;
  const scale = depth(bird.y), facing = bird.side === -1 ? 1 : -1;
  const u = flight(bird, t);
  // The landing spot's shadow shows where to tap while it flies in.
  context.setTransform(scene.k, 0, 0, scene.k, 0, 0);
  context.globalAlpha = bird.state === SITTING ? 0.28 : 0.28 * u;
  context.fillStyle = "#5a3412";
  context.beginPath(); context.ellipse(bird.x, bird.y + 16 * scale, 13 * scale, 3.5 * scale, 0, 0, Math.PI * 2); context.fill();
  context.globalAlpha = 1;
  if (bird.state === FLYING) {
    if (slow) { context.globalAlpha = u; stamp(scene, scene.birds[SIT], bird.x, bird.y, scale, facing); context.globalAlpha = 1; return; }
    const from = bird.side === -1 ? -26 : W + 26, eased = 1 - (1 - u) * (1 - u);
    const x = from + (bird.x - from) * eased, y = bird.skyY + (bird.y - bird.skyY) * smooth(u) - 24 * Math.sin(Math.PI * u);
    const pose = u > 0.88 ? SIT : (Math.floor(clock * 14 + index) % 2 ? WINGS_UP : WINGS_DOWN);
    stamp(scene, scene.birds[pose], x, y, scale, facing);
    return;
  }
  const since = t - bird.lastPeck;
  // Sitting sparrows look about: an occasional turn (not in slow mode).
  const turn = !slow && Math.floor((clock + index * 0.77) / 1.9) % 3 === 2 ? -1 : 1;
  stamp(scene, scene.birds[since >= 0 && since < 0.2 ? PECK : SIT], bird.x, bird.y, scale, facing * turn);
  if (!slow && since >= 0 && since < 0.45) {
    // A few grains fall from the beak.
    context.setTransform(scene.k, 0, 0, scene.k, 0, 0);
    context.fillStyle = "#ffd257";
    for (let grain = 0; grain < 3; grain++) {
      const gx = bird.x + facing * turn * (14 + grain * 3) * scale, gy = bird.y + (6 + grain * 2) * scale + 70 * since * since * (1 + grain * 0.4);
      context.beginPath(); context.ellipse(gx, gy, 1.6, 2.3, 0.5, 0, Math.PI * 2); context.fill();
    }
  }
}

function drawShooed(scene: Scene, index: number, t: number, slow: boolean, game: Game) {
  const bird = game.birds[index], scale = depth(bird.y), age = t - bird.shooAt;
  if (age < 0) return;
  if (slow) {
    // Reduced motion: it simply fades where it sat.
    if (age > 0.45) return;
    scene.context.globalAlpha = 1 - age / 0.45;
    stamp(scene, scene.birds[SIT], bird.x, bird.y, scale, bird.flee);
    scene.context.globalAlpha = 1;
    return;
  }
  // A cheerful hop, then away and up, flapping, away from the hand.
  const x = bird.x + bird.flee * (70 * age + 260 * age * age), y = bird.y - 12 * Math.sin(Math.min(1, age / 0.14) * Math.PI / 2) - 150 * age - 90 * age * age;
  scene.context.globalAlpha = age < 0.7 ? 1 : 1 - (age - 0.7) / 0.3;
  stamp(scene, scene.birds[Math.floor(age * 16) % 2 ? WINGS_UP : WINGS_DOWN], x, y, scale, bird.flee, -0.25 * bird.flee);
  scene.context.globalAlpha = 1;
}

function drawHud(scene: Scene, game: Game) {
  const { context } = scene;
  const meter = Math.round(scene.meter), left = Math.ceil(DURATION - Math.max(0, game.t));
  if (meter !== scene.meterShown) { scene.meterShown = meter; scene.meterText = `${bn(meter)}%`; }
  if (game.shooed !== scene.countShown) { scene.countShown = game.shooed; scene.countText = bn(game.shooed); }
  if (left !== scene.timeShown) { scene.timeShown = left; scene.timeText = bn(left); }
  context.setTransform(scene.k, 0, 0, scene.k, 0, 0);

  // The grain meter: a sheaf, a bar that slides down as sparrows nibble, the percent.
  pill(context, 8, 200);
  stamp(scene, scene.sheaf, 27, 27, 1);
  context.setTransform(scene.k, 0, 0, scene.k, 0, 0);
  context.fillStyle = "#fff3d433";
  context.beginPath(); context.roundRect(44, 21, 100, 12, 6); context.fill();
  const fraction = Math.max(0, scene.meter / GRAIN);
  context.fillStyle = scene.meter > 70 ? "#ffd257" : scene.meter > 40 ? "#ffad42" : "#ff7a4d";
  if (fraction > 0.02) { context.beginPath(); context.roundRect(44, 21, 100 * fraction, 12, 6); context.fill(); }
  context.font = HUD_FONT; context.textAlign = "right"; context.fillStyle = "#fff6dc";
  context.fillText(scene.meterText, 200, 34);

  // Sparrows shooed so far.
  pill(context, 214, 64);
  stamp(scene, scene.birds[SIT], 234, 27, 0.62);
  context.setTransform(scene.k, 0, 0, scene.k, 0, 0);
  context.textAlign = "left"; context.fillStyle = "#fff6dc";
  context.fillText(scene.countText, 250, 34);

  // Time: a small clock face that empties as the light goes.
  pill(context, W - 76, 68);
  const fractionLeft = Math.max(0, left / DURATION), urgent = left <= 10 && game.t > 0;
  context.strokeStyle = "#fff3d455"; context.lineWidth = 3;
  context.beginPath(); context.arc(W - 57, 27, 8, 0, Math.PI * 2); context.stroke();
  context.strokeStyle = urgent ? "#ffc56a" : "#fff6dc";
  context.beginPath(); context.arc(W - 57, 27, 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fractionLeft); context.stroke();
  context.fillStyle = urgent ? "#ffc56a" : "#fff6dc";
  context.fillText(scene.timeText, W - 43, 34);
}

