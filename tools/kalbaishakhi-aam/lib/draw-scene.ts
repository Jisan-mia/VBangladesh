// Draws the courtyard under the mango tree. Everything still is painted once into offscreen canvases;
// each frame only stamps sprites, so a cheap phone keeps 60 fps. Slow mode drops rain, leaves, cloud drift, lightning and shake.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import { drawBranch, drawDalaBack, drawDalaFront, drawHeart, drawMango, pileSlots } from "./art";
import {
  bn, dropX, dropY, lightningTimes, progress, BASKET_Y, BRANCH, CAUGHT, DURATION, GROUND_Y, H, HIT, RIPE, SPAWN_Y, U_CATCH, W, WARN,
  type Game, type Storm,
} from "./storm";

type Sprite = { canvas: HTMLCanvasElement; w: number; h: number };
type Popup = { x: number; t: number; text: string; color: string };

const LEAVES = 9, RAIN = 44, DALA = 96, MANGO = 20, BRANCH_LEN = 42, PILE = 15;
const SLOTS = pileSlots(PILE, DALA);
const POINT_TEXT = ["+৫", "+১০"];

export type Scene = {
  context: CanvasRenderingContext2D; k: number;
  bg: Sprite; trunk: Sprite; clouds: Sprite; canopy: Sprite; leaf: Sprite; mangoes: [Sprite, Sprite]; branch: Sprite; dalaBack: Sprite; dalaFront: Sprite; hearts: [Sprite, Sprite];
  clock: number; wind: number; leaves: Float32Array; rain: Float32Array;
  popups: Popup[]; seen: number; catchAt: number; hitAt: number; game: Game | null;
  bolts: number[]; boltsFor: Storm | null;
  scoreShown: number; scoreText: string; timeShown: number; timeText: string;
};

/** Paints `w`×`h` logical units, centred on the origin, into a canvas at `k` device pixels per unit. */
function sprite(w: number, h: number, k: number, paint: (context: CanvasRenderingContext2D) => void, origin: [number, number] = [w / 2, h / 2]): Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(w * k); canvas.height = Math.ceil(h * k);
  const context = canvas.getContext("2d")!;
  context.setTransform(k, 0, 0, k, origin[0] * k, origin[1] * k);
  paint(context);
  return { canvas, w, h };
}

function paintBackground(context: CanvasRenderingContext2D) {
  const sky = context.createLinearGradient(0, 0, 0, 300);
  sky.addColorStop(0, "#2e3a49"); sky.addColorStop(0.42, "#575c64"); sky.addColorStop(0.8, "#b9895a"); sky.addColorStop(1, "#eab56a");
  context.fillStyle = sky; context.fillRect(0, 0, W, 302);
  // Far storm clouds, heavy and slate, lit underneath by the low afternoon sun.
  const puffs = [[20, 196, 46], [80, 182, 54], [150, 192, 48], [215, 176, 58], [290, 188, 52], [350, 200, 44]];
  context.fillStyle = "#3e4854";
  for (const [x, y, r] of puffs) { context.beginPath(); context.arc(x, y, r, 0, Math.PI * 2); context.fill(); }
  context.fillRect(0, 196, W, 26);
  context.fillStyle = "#d39a5f55";
  for (const [x, y, r] of puffs) { context.beginPath(); context.ellipse(x, y + r * 0.62, r * 0.8, r * 0.18, 0, 0, Math.PI * 2); context.fill(); }
  const glow = context.createLinearGradient(0, 214, 0, 300);
  glow.addColorStop(0, "#c48d5800"); glow.addColorStop(1, "#f2c27a");
  context.fillStyle = glow; context.fillRect(0, 214, W, 88);

  // The village line: palms, a bamboo clump, round trees and a tin-roofed hut.
  context.fillStyle = "#2f4535";
  for (const [x, top] of [[30, 256], [205, 250], [245, 262]]) {
    context.fillRect(x - 1.5, top, 3, 302 - top);
    for (let leaf = 0; leaf < 6; leaf++) { const a = -Math.PI / 2 + (leaf - 2.5) * 0.55; context.beginPath(); context.ellipse(x + Math.cos(a) * 9, top + Math.sin(a) * 5 + 3, 11, 2.6, a, 0, Math.PI * 2); context.fill(); }
  }
  for (const [x, r] of [[60, 18], [96, 24], [140, 20], [176, 16], [340, 22]]) { context.beginPath(); context.arc(x, 300 - r * 0.7, r, 0, Math.PI * 2); context.fill(); }
  context.strokeStyle = "#2f4535"; context.lineWidth = 2;
  for (let x = 118; x < 132; x += 3) { context.beginPath(); context.moveTo(x, 300); context.quadraticCurveTo(x + 4, 268, x + 12, 250 + (x % 7)); context.stroke(); }
  context.fillStyle = "#6f5640"; context.fillRect(276, 280, 46, 22);
  context.fillStyle = "#7d8a90";
  context.beginPath(); context.moveTo(268, 283); context.lineTo(282, 266); context.lineTo(318, 266); context.lineTo(330, 283); context.closePath(); context.fill();
  context.strokeStyle = "#5d686e"; context.lineWidth = 0.8;
  context.beginPath(); for (let x = 284; x < 318; x += 4) { context.moveTo(x, 267); context.lineTo(x - 4, 282); } context.stroke();
  context.fillStyle = "#3a2c20"; context.fillRect(293, 288, 10, 14);

  // Paddy field, then the earthen courtyard where the mangoes land.
  const field = context.createLinearGradient(0, 300, 0, 372);
  field.addColorStop(0, "#86a243"); field.addColorStop(1, "#5e7d2c");
  context.fillStyle = field; context.fillRect(0, 300, W, 76);
  context.strokeStyle = "#a9c25a55"; context.lineWidth = 1;
  context.beginPath(); for (let y = 306; y < 370; y += 7 + (y - 300) * 0.08) { context.moveTo(0, y); context.lineTo(W, y); } context.stroke();
  const yard = context.createLinearGradient(0, 366, 0, H);
  yard.addColorStop(0, "#c38a52"); yard.addColorStop(1, "#a36c3c");
  context.fillStyle = yard;
  context.beginPath(); context.moveTo(0, 372);
  for (let x = 0; x <= W; x += 30) context.quadraticCurveTo(x + 15, 364 + (x % 60 ? 3 : -2), x + 30, 370);
  context.lineTo(W, H); context.lineTo(0, H); context.closePath(); context.fill();
  context.fillStyle = "#a06c3a55";
  for (let index = 0; index < 26; index++) { const x = (index * 97) % W, y = 384 + ((index * 53) % 62); context.beginPath(); context.ellipse(x, y, 3 + (index % 3), 1.2, 0, 0, Math.PI * 2); context.fill(); }

}

function paintTrunk(context: CanvasRenderingContext2D) {
  // The mango tree's trunk, roots flaring into the courtyard.
  context.fillStyle = "#5a3a24";
  context.beginPath();
  context.moveTo(44, 404); context.quadraticCurveTo(62, 396, 64, 340); context.lineTo(68, 120); context.lineTo(90, 120); context.lineTo(90, 340);
  context.quadraticCurveTo(92, 394, 112, 404); context.quadraticCurveTo(78, 398, 44, 404); context.fill();
  context.strokeStyle = "#3f2717"; context.lineWidth = 1.4;
  context.beginPath(); context.moveTo(72, 150); context.lineTo(70, 360); context.moveTo(83, 170); context.lineTo(85, 330); context.moveTo(77, 230); context.lineTo(76, 300); context.stroke();
  context.fillStyle = "#00000022";
  context.beginPath(); context.ellipse(78, 405, 44, 5, 0, 0, Math.PI * 2); context.fill();
}

function paintClouds(context: CanvasRenderingContext2D) {
  // Two screen-widths of loose dark cloud that drift across the gap below the canopy (tiled).
  context.fillStyle = "#3a4452";
  context.globalAlpha = 0.5;
  for (let index = 0; index < 14; index++) {
    const x = index * 52 + (index % 3) * 9, y = 40 + ((index * 37) % 34), r = 22 + ((index * 13) % 16);
    context.beginPath(); context.ellipse(x, y, r * 1.5, r * 0.62, 0, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.ellipse(x - W * 2, y, r * 1.5, r * 0.62, 0, 0, Math.PI * 2); context.fill();
  }
  context.globalAlpha = 1;
}

function paintCanopy(context: CanvasRenderingContext2D) {
  const blobs: Array<[number, number, number, string]> = [];
  const shades = ["#24481f", "#2f5a26", "#3b6c2d", "#4c8236"];
  for (let layer = 0; layer < 4; layer++) {
    for (let index = 0; index < 11; index++) {
      const x = -30 + index * 40 + ((index * 17 + layer * 23) % 22), y = -10 + layer * 30 + ((index * 29 + layer * 11) % 26) - (layer === 3 ? 6 : 0);
      blobs.push([x, y, 30 - layer * 3 + ((index * 7) % 9), shades[layer]]);
    }
  }
  for (const [x, y, r, color] of blobs) { context.fillStyle = color; context.beginPath(); context.arc(x, y, r, 0, Math.PI * 2); context.fill(); }
  // Long mango leaves hanging off the lower edge.
  context.fillStyle = "#3f7430";
  for (let index = 0; index < 24; index++) {
    const x = -20 + index * 17, y = 112 + ((index * 31) % 24), a = 1.2 + ((index * 7) % 5) * 0.12;
    context.beginPath(); context.ellipse(x, y, 13, 3.4, a, 0, Math.PI * 2); context.fill();
  }
  context.fillStyle = "#5e9a3f";
  for (let index = 0; index < 18; index++) { const x = -6 + index * 22, y = 40 + ((index * 41) % 70); context.beginPath(); context.ellipse(x, y, 9, 2.6, 0.5 + (index % 4) * 0.3, 0, Math.PI * 2); context.fill(); }
  // Still-hanging mangoes, for the eye.
  for (const [x, y, ripe] of [[24, 96, 0], [118, 108, 1], [176, 84, 0], [236, 104, 1], [300, 92, 0], [342, 112, 1], [150, 54, 1]] as const) {
    context.save(); context.translate(x, y); drawMango(context, 15, ripe === 1); context.restore();
  }
}

export function makeScene(canvas: HTMLCanvasElement, cssWidth: number, previous?: Scene | null): Scene {
  const ratio = Math.min(2, window.devicePixelRatio || 1), cssHeight = cssWidth * H / W;
  canvas.width = Math.round(cssWidth * ratio); canvas.height = Math.round(cssHeight * ratio);
  const k = cssWidth / W * ratio;
  const leaves = new Float32Array(LEAVES * 6), rain = new Float32Array(RAIN * 3);
  for (let index = 0; index < LEAVES; index++) leaves.set([Math.random() * W, 60 + Math.random() * 300, 0, 0, Math.random() * 6, (Math.random() - 0.5) * 4], index * 6);
  for (let index = 0; index < RAIN; index++) rain.set([Math.random() * W, Math.random() * H, 9 + Math.random() * 9], index * 3);
  return {
    context: canvas.getContext("2d")!, k,
    bg: sprite(W, H, k, paintBackground, [0, 0]),
    trunk: sprite(90, 305, k, paintTrunk, [-30, -110]),
    clouds: sprite(W * 2, 90, k, paintClouds, [0, 0]),
    canopy: sprite(W + 60, 160, k, paintCanopy, [30, 20]),
    leaf: sprite(12, 6, k, context => { context.fillStyle = "#4f8a36"; context.beginPath(); context.ellipse(0, 0, 5.5, 2.2, 0, 0, Math.PI * 2); context.fill(); }),
    mangoes: [sprite(MANGO * 1.1, MANGO * 1.5, k, context => drawMango(context, MANGO, false)), sprite(MANGO * 1.1, MANGO * 1.5, k, context => drawMango(context, MANGO, true))],
    branch: sprite(BRANCH_LEN * 1.1, BRANCH_LEN * 0.8, k, context => drawBranch(context, BRANCH_LEN)),
    dalaBack: sprite(DALA * 1.1, DALA * 0.3, k, context => drawDalaBack(context, DALA)),
    dalaFront: sprite(DALA * 1.1, DALA * 0.44, k, context => drawDalaFront(context, DALA), [DALA * 0.55, DALA * 0.14]),
    hearts: [sprite(18, 18, k, context => drawHeart(context, 15, false)), sprite(18, 18, k, context => drawHeart(context, 15, true))],
    clock: previous?.clock ?? 0, wind: previous?.wind ?? 0, leaves, rain,
    popups: Array.from({ length: 6 }, () => ({ x: 0, t: -9, text: "", color: "" })),
    seen: previous?.seen ?? 0, catchAt: -9, hitAt: -9, game: previous?.game ?? null, bolts: [], boltsFor: null,
    scoreShown: -1, scoreText: "", timeShown: -1, timeText: "",
  };
}

/** Ambient motion: the clock, the eased wind the tree leans to, rain and loose leaves. */
export function tickScene(scene: Scene, dt: number, wind: number, slow: boolean) {
  scene.clock += dt;
  scene.wind += (wind - scene.wind) * Math.min(1, dt * 2.5);
  if (slow) return;
  const { leaves, rain } = scene, push = scene.wind * 160;
  for (let index = 0; index < LEAVES * 6; index += 6) {
    leaves[index + 2] += ((push + Math.sin(scene.clock * 2 + index) * 30) - leaves[index + 2]) * dt * 2;
    leaves[index] += leaves[index + 2] * dt;
    leaves[index + 1] += (26 + Math.sin(scene.clock * 3 + index) * 18) * dt;
    leaves[index + 4] += leaves[index + 5] * dt;
    if (leaves[index] < -20 || leaves[index] > W + 20 || leaves[index + 1] > H) {
      leaves[index] = push >= 0 ? -10 : W + 10; leaves[index + 1] = 70 + Math.random() * 220;
    }
  }
  for (let index = 0; index < RAIN * 3; index += 3) {
    rain[index + 1] += 420 * dt; rain[index] += push * 1.2 * dt;
    if (rain[index + 1] > H) { rain[index + 1] -= H + 20; rain[index] = Math.random() * W; }
    if (rain[index] < 0) rain[index] += W; else if (rain[index] > W) rain[index] -= W;
  }
}

function stamp(scene: Scene, image: Sprite, x: number, y: number, angle = 0, scaleY = 1) {
  const { context, k } = scene;
  const cos = Math.cos(angle) * k, sin = Math.sin(angle) * k;
  context.setTransform(cos, sin, -sin * scaleY, cos * scaleY, x * k, y * k);
  context.drawImage(image.canvas, -image.w / 2, -image.h / 2, image.w, image.h);
}

function pill(context: CanvasRenderingContext2D, x: number, y: number, w: number) {
  context.fillStyle = "#1c1611a6";
  context.beginPath(); context.roundRect(x, y, w, 32, 16); context.fill();
}

/** One frame. `game` is null on the ready screen (the storm is gathering, nothing falls yet). */
export function drawScene(scene: Scene, game: Game | null, slow: boolean) {
  const { context, k } = scene;
  const t = game?.t ?? 0;
  context.setTransform(k, 0, 0, k, 0, 0);
  context.drawImage(scene.bg.canvas, 0, 0, W, H);

  // A rare, soft glow behind the clouds with the strongest gusts: one pulse each, a third of a second, never a strobe.
  if (game && !slow) {
    if (scene.boltsFor !== game.storm) { scene.bolts = lightningTimes(game.storm); scene.boltsFor = game.storm; }
    for (let index = 0; index < scene.bolts.length; index++) {
      const since = t - scene.bolts[index];
      if (since < 0 || since > 0.34) continue;
      const glow = since < 0.06 ? since / 0.06 : 1 - (since - 0.06) / 0.28;
      context.globalAlpha = 0.2 * glow;
      context.fillStyle = "#ffeecd"; context.fillRect(0, 0, W, 300);
      const x = 130 + ((index * 83) % 160);
      context.globalAlpha = 0.55 * glow;
      context.strokeStyle = "#fffaeb"; context.lineWidth = 1.6;
      context.beginPath(); context.moveTo(x, 150); context.lineTo(x - 8, 182); context.lineTo(x + 4, 188); context.lineTo(x - 6, 226); context.stroke();
      context.globalAlpha = 1;
    }
  }

  const drift = slow ? 0 : (scene.clock * 7) % (W * 2);
  context.drawImage(scene.clouds.canvas, -drift, 150, W * 2, 90);
  if (drift > W) context.drawImage(scene.clouds.canvas, W * 2 - drift, 150, W * 2, 90);
  context.drawImage(scene.trunk.canvas, 30, 110, 90, 305);

  if (!slow) {
    const { rain } = scene, slant = scene.wind * 7;
    context.strokeStyle = "#dfe8f04d"; context.lineWidth = 1;
    context.beginPath();
    for (let index = 0; index < RAIN * 3; index += 3) { context.moveTo(rain[index], rain[index + 1]); context.lineTo(rain[index] + slant, rain[index + 1] + rain[index + 2]); }
    context.stroke();
  }

  // The canopy leans with the wind; out of slow mode it also sways a little.
  const lean = scene.wind * 9 + (slow ? 0 : Math.sin(scene.clock * 1.7) * 2.2);
  context.setTransform(k, 0, 0, k, lean * k, 0);
  context.drawImage(scene.canopy.canvas, -30, -20, W + 60, 160);
  context.setTransform(k, 0, 0, k, 0, 0);

  // Grass at the courtyard's edge bends the way the wind blows.
  context.strokeStyle = "#4f6e27"; context.lineWidth = 1.5; context.lineCap = "round";
  context.beginPath();
  for (let x = 4; x < W; x += 13) {
    const base = 371 + ((x * 7) % 5), bend = scene.wind * 7 + (slow ? 0 : Math.sin(scene.clock * 3.1 + x * 0.3) * 1.4);
    for (let blade = -1; blade <= 1; blade++) { context.moveTo(x + blade * 2.5, base); context.quadraticCurveTo(x + blade * 3 + bend * 0.4, base - 6, x + blade * 4 + bend, base - 9 - Math.abs(blade)); }
  }
  context.stroke();

  if (game) drawDrops(scene, game, slow);

  // Fresh catches and bumps, read from the game's event ring.
  if (game) {
    if (scene.game !== game) { scene.game = game; scene.seen = 0; scene.catchAt = -9; scene.hitAt = -9; for (const popup of scene.popups) popup.t = -9; }
    for (; scene.seen < game.eventCount; scene.seen++) {
      const event = game.events[scene.seen % game.events.length];
      if (!event.caught) continue;
      const popup = scene.popups[scene.seen % scene.popups.length];
      popup.x = event.x; popup.t = event.t;
      if (event.kind === BRANCH) { scene.hitAt = event.t; popup.text = "উফ!"; popup.color = "#ffd2c4"; }
      else { scene.catchAt = event.t; popup.text = POINT_TEXT[event.kind]; popup.color = event.kind === RIPE ? "#ffd75e" : "#d8f08a"; }
    }
  }

  // The ডালা: a squash on each catch, a short shake when a twig lands in it.
  const x = (game?.basket ?? W / 2) + (!slow && t - scene.hitAt < 0.3 ? Math.sin((t - scene.hitAt) * 70) * 4 * (1 - (t - scene.hitAt) / 0.3) : 0);
  const squash = t - scene.catchAt < 0.16 ? 1 - 0.12 * Math.sin((t - scene.catchAt) / 0.16 * Math.PI) : 1;
  context.fillStyle = "#4a2c1426";
  context.beginPath(); context.ellipse(x, GROUND_Y + 12, 38, 5, 0, 0, Math.PI * 2); context.fill();
  stamp(scene, scene.dalaBack, x, BASKET_Y, 0, squash);
  if (game) {
    let filled = 0;
    for (const drop of game.storm.drops) {
      if (filled === PILE) break;
      if (drop.state !== CAUGHT) continue;
      const [dx, dy] = SLOTS[filled++];
      stamp(scene, scene.mangoes[drop.kind], x + dx, BASKET_Y + dy * squash, ((filled * 37) % 9 - 4) * 0.08);
    }
  }
  context.setTransform(k, 0, 0, k * squash, x * k, BASKET_Y * k);
  context.drawImage(scene.dalaFront.canvas, -DALA * 0.55, -DALA * 0.14, scene.dalaFront.w, scene.dalaFront.h);
  context.setTransform(k, 0, 0, k, 0, 0);

  if (!slow) {
    const { leaves } = scene;
    for (let index = 0; index < LEAVES * 6; index += 6) stamp(scene, scene.leaf, leaves[index], leaves[index + 1], leaves[index + 4]);
    context.setTransform(k, 0, 0, k, 0, 0);
  }

  context.textAlign = "center"; context.lineJoin = "round";
  context.font = `800 20px ${DISPLAY_FONT}`;
  for (const popup of scene.popups) {
    const age = t - popup.t;
    if (age < 0 || age > 0.75) continue;
    const y = BASKET_Y - 30 - (slow ? 0 : age * 34);
    context.globalAlpha = 1 - age / 0.75;
    context.strokeStyle = "#2a1a0e"; context.lineWidth = 4; context.strokeText(popup.text, popup.x, y);
    context.fillStyle = popup.color; context.fillText(popup.text, popup.x, y);
  }
  context.globalAlpha = 1;
  drawHud(scene, game);
}

function drawDrops(scene: Scene, game: Game, slow: boolean) {
  const t = game.t;
  for (const drop of game.storm.drops) {
    const u = progress(drop, t);
    if (t < drop.t0 - WARN || u > 1 + 1.3 / drop.fall) continue;
    const image = drop.kind === BRANCH ? scene.branch : scene.mangoes[drop.kind];
    if (t < drop.t0) {
      // Hanging, shaking loose: the warning before every drop.
      const shake = slow ? 0 : Math.sin(t * 34) * 0.22 * (1 - (drop.t0 - t) / WARN);
      scene.context.globalAlpha = Math.min(1, (t - drop.t0 + WARN) / 0.15);
      stamp(scene, image, drop.x0, SPAWN_Y, shake + (drop.kind === BRANCH ? 0.3 : 0));
      scene.context.globalAlpha = 1;
      continue;
    }
    if (drop.state === CAUGHT && u >= U_CATCH) continue;
    if (drop.state === HIT && u >= U_CATCH) {
      // The twig bounces out of the ডালা and away.
      const age = t - drop.tc;
      if (age > 0.7) continue;
      const side = drop.xc < W / 2 ? 1 : -1;
      scene.context.globalAlpha = 1 - age / 0.7;
      stamp(scene, image, drop.xc + side * 90 * age, BASKET_Y - 60 * age + 220 * age * age, drop.spin * 3 * age);
      scene.context.globalAlpha = 1;
      continue;
    }
    if (u <= 1) { stamp(scene, image, dropX(drop, u), dropY(u), drop.spin * (t - drop.t0)); continue; }
    // Missed: it rests in the courtyard a moment, then fades.
    const rest = (t - drop.t0 - drop.fall) / 1.3;
    scene.context.globalAlpha = Math.max(0, 1 - rest);
    stamp(scene, image, drop.x0 + drop.drift, GROUND_Y + 4, drop.kind === BRANCH ? 0.1 : 1.3, 0.9);
    scene.context.globalAlpha = 1;
  }
  scene.context.setTransform(scene.k, 0, 0, scene.k, 0, 0);
}

function drawHud(scene: Scene, game: Game | null) {
  const { context } = scene;
  const score = game?.score ?? 0, left = Math.ceil(DURATION - (game?.t ?? 0)), lives = game?.lives ?? 3;
  if (score !== scene.scoreShown) { scene.scoreShown = score; scene.scoreText = bn(score); }
  if (left !== scene.timeShown) { scene.timeShown = left; scene.timeText = bn(left); }
  context.setTransform(scene.k, 0, 0, scene.k, 0, 0);
  pill(context, 10, 10, 96);
  stamp(scene, scene.mangoes[1], 30, 27, 0.2);
  context.setTransform(scene.k, 0, 0, scene.k, 0, 0);
  context.font = `800 21px ${DISPLAY_FONT}`; context.textAlign = "left"; context.fillStyle = "#fff4dc";
  context.fillText(scene.scoreText, 46, 34);
  pill(context, W - 82, 10, 72);
  // A small clock face that empties as the storm runs out.
  const fraction = Math.max(0, left / DURATION);
  context.strokeStyle = "#fff4dc55"; context.lineWidth = 3;
  context.beginPath(); context.arc(W - 62, 26, 8, 0, Math.PI * 2); context.stroke();
  context.strokeStyle = left <= 10 && game ? "#ffb35c" : "#fff4dc";
  context.beginPath(); context.arc(W - 62, 26, 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fraction); context.stroke();
  context.fillStyle = left <= 10 && game ? "#ffb35c" : "#fff4dc";
  context.fillText(scene.timeText, W - 48, 34);
  pill(context, W / 2 - 40, 10, 80);
  for (let index = 0; index < 3; index++) stamp(scene, scene.hearts[index < lives ? 1 : 0], W / 2 - 22 + index * 22, 26);
  context.setTransform(scene.k, 0, 0, scene.k, 0, 0);
}
