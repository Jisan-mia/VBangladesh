// The play area, drawn each frame from the pure game state. Browser-only (it makes offscreen canvases). No allocation per frame.
import { paintGround, paintPalm, paintSpots, paintString, PAL, topSprite } from "./art";
import { GOOD_SWAY, LEVELS, OK_SWAY, PICK_STEADY, canPick, gust, lean, scoreOf, type Game, type Nudge } from "./game";
import { secs } from "./result";

const FONT = '"Bangla", "Noto Sans Bengali", sans-serif';
const DROP = 0.2, TIP = 0.35;
// Fonts built once: no string building per frame.
const F11 = `600 11px ${FONT}`, F12 = `600 12px ${FONT}`, F14 = `14px ${FONT}`, F14B = `700 14px ${FONT}`, F15B = `700 15px ${FONT}`, F20 = `800 20px ${FONT}`, F26 = `800 26px ${FONT}`;

type Bit = { x: number; y: number; vx: number; vy: number; life: number };

export type Scene = {
  width: number; height: number; ratio: number;
  /** Where the top spins, its height, and the far edge; set on resize. */
  cx: number; cy: number; s: number; horizon: number;
  bg: HTMLCanvasElement | null; bgLevel: number; sprite: HTMLCanvasElement | null; spriteFor: number;
  /** Seconds since the throw, the fall and the palm trick began (for their little animations). */
  landT: number; fallT: number; palmT: number; fallDir: number; fallTilt: number;
  /** How far the finger has pulled the hanging top (0..1), while it's still in the hand. */
  drag: number;
  shake: number; popText: string; popColor: string; popT: number;
  turn: number; spinLeft: number;
  dust: Bit[]; leaves: Bit[];
  label: string; labelFor: number;
};

export function makeScene(): Scene {
  const bit = () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0 });
  return {
    width: 0, height: 0, ratio: 1, cx: 0, cy: 0, s: 0, horizon: 0, bg: null, bgLevel: 0, sprite: null, spriteFor: 0,
    landT: 0, fallT: 0, palmT: 0, fallDir: 1, fallTilt: 0, drag: 0,
    shake: 0, popText: "", popColor: PAL.good, popT: 0, turn: 0, spinLeft: 0,
    dust: Array.from({ length: 10 }, bit), leaves: Array.from({ length: 6 }, bit),
    label: secs(0), labelFor: 0,
  };
}

export function resizeScene(scene: Scene, width: number, height: number, ratio: number) {
  scene.width = width; scene.height = height; scene.ratio = ratio; scene.bgLevel = 0;
  scene.cx = width / 2; scene.cy = height * 0.64; scene.s = height * 0.36; scene.horizon = height * 0.2;
}

function ensureArt(scene: Scene, level: number) {
  const { cx, cy, s, horizon } = scene;
  if (scene.bgLevel !== level) {
    const canvas = scene.bg ?? document.createElement("canvas");
    canvas.width = Math.round(scene.width * scene.ratio); canvas.height = Math.round(scene.height * scene.ratio);
    const context = canvas.getContext("2d");
    if (context) { context.setTransform(scene.ratio, 0, 0, scene.ratio, 0, 0); paintGround(context, LEVELS[level - 1].surface, level, scene.width, scene.height, horizon, cx, cy); }
    scene.bg = canvas; scene.bgLevel = level;
  }
  if (scene.spriteFor !== s * scene.ratio) { scene.sprite = topSprite(s, scene.ratio); scene.spriteFor = s * scene.ratio; }
}

function puff(scene: Scene, x: number, y: number, count: number) {
  for (let index = 0; index < count && index < scene.dust.length; index++) {
    const bit = scene.dust[index], angle = Math.PI + (index / (count - 1 || 1)) * Math.PI;
    bit.x = x; bit.y = y; bit.vx = Math.cos(angle) * (30 + index * 6); bit.vy = Math.sin(angle) * 14 - 6; bit.life = 0.5;
  }
}

/** The page tells the scene what just happened, for its little reactions. */
export function sceneThrow(scene: Scene, slow: boolean) { scene.landT = 0; scene.drag = 0; scene.popT = 0; if (!slow) { const { cx, cy } = scene; puff(scene, cx, cy, 6); } }
export function sceneNudge(scene: Scene, result: Nudge, combo: number) {
  scene.popText = result === "good" ? (combo >= 2 ? `টানা ${new Intl.NumberFormat("bn-BD").format(combo)}!` : "ঠিক সময়ে!") : result === "ok" ? "চলবে" : "আগে-পরে হলো";
  scene.popColor = result === "good" ? PAL.good : result === "ok" ? PAL.warn : PAL.bad;
  scene.popT = 0.8;
}
export function sceneBump(scene: Scene, slow: boolean) { if (!slow) scene.shake = 0.15; }
export function sceneFall(scene: Scene, game: Game, slow: boolean) {
  scene.fallT = 0; scene.fallTilt = game.wobble * lean(game) * 0.55;
  scene.fallDir = lean(game) >= 0 ? 1 : -1; scene.turn = game.turn; scene.spinLeft = Math.max(0, game.omega);
  if (!slow) { const { cx, cy, s } = scene; puff(scene, cx + scene.fallDir * s * 0.4, cy, 8); }
}
export function scenePalm(scene: Scene, game: Game) { scene.palmT = 0; scene.turn = game.turn; scene.spinLeft = Math.max(0.15, game.omega); }

export function updateScene(scene: Scene, game: Game, dt: number, slow: boolean) {
  scene.landT += dt; scene.popT = Math.max(0, scene.popT - dt); scene.shake = Math.max(0, scene.shake - dt);
  if (game.phase === "fallen") { scene.fallT += dt; scene.spinLeft = Math.max(0, scene.spinLeft - dt * 0.8); scene.turn += scene.spinLeft * 10 * dt; }
  if (game.phase === "palm") { scene.palmT += dt; scene.turn += (6 + 18 * scene.spinLeft) * dt; }
  for (const bit of scene.dust) if (bit.life > 0) { bit.life -= dt; bit.x += bit.vx * dt; bit.y += bit.vy * dt; bit.vy += 40 * dt; }
  const windy = LEVELS[game.level - 1].wind > 0 && !slow;
  const push = windy ? 0.3 + gust(game, game.t) : 0;
  for (let index = 0; index < scene.leaves.length; index++) {
    const leaf = scene.leaves[index];
    if (!windy) { leaf.life = 0; continue; }
    if (leaf.life <= 0 || leaf.x > scene.width + 20) { leaf.x = -20 - index * 40; leaf.y = scene.height * (0.25 + 0.12 * index); leaf.life = 1; leaf.vy = index; }
    leaf.x += (40 + 140 * push) * dt; leaf.vy += dt * 3; leaf.y += Math.sin(leaf.vy) * 12 * dt;
  }
}

/** True once a fall or the palm trick has finished playing out, so the page can show the result. */
export const sceneSettled = (scene: Scene, game: Game) => (game.phase === "fallen" && scene.fallT > 1.1) || (game.phase === "palm" && scene.palmT > 1.1);

function drawTop(context: CanvasRenderingContext2D, scene: Scene, x: number, y: number, s: number, tilt: number, turn: number, speed: number) {
  context.save();
  context.translate(x, y); context.rotate(tilt);
  if (scene.sprite) context.drawImage(scene.sprite, -0.4 * s, -0.98 * s, 0.8 * s, s);
  paintSpots(context, s, turn, speed);
  context.restore();
}

function bar(context: CanvasRenderingContext2D, x: number, y: number, width: number, value: number, color: string, label: string) {
  context.fillStyle = "#00000059"; context.fillRect(x, y, width, 7);
  context.fillStyle = color; context.fillRect(x, y, width * Math.max(0, Math.min(1, value)), 7);
  context.fillStyle = "#fff"; context.font = F11; context.textAlign = "right";
  context.fillText(label, x - 6, y + 8);
}

export function drawScene(context: CanvasRenderingContext2D, scene: Scene, game: Game, hold: number) {
  const { width, height } = scene;
  if (!width || !height) return;
  ensureArt(scene, game.level);
  const { cx, cy, s } = scene;
  const jolt = scene.shake > 0 ? Math.sin(scene.shake * 90) * 3 : 0;
  context.save();
  context.translate(jolt, 0);
  context.clearRect(-4, 0, width + 8, height);
  if (scene.bg) context.drawImage(scene.bg, 0, 0, width, height);

  for (const leaf of scene.leaves) if (leaf.life > 0) { context.fillStyle = "#6d8f2e"; context.beginPath(); context.ellipse(leaf.x, leaf.y, 6, 2.5, leaf.vy, 0, Math.PI * 2); context.fill(); }

  if (game.phase === "ready") {
    const y = height * 0.44 + (scene.drag || hold * 0.35) * height * 0.16, wiggle = hold > 0 ? Math.sin(hold * 40) * 0.03 : 0;
    context.save(); context.translate(cx, y); context.rotate(wiggle + 0.12); paintString(context, s * 0.8); context.restore();
    drawTop(context, scene, cx, y, s * 0.8, wiggle + 0.12, 0, 0);
    context.fillStyle = "#00000026"; context.beginPath(); context.ellipse(cx, cy, s * 0.14, s * 0.04, 0, 0, Math.PI * 2); context.fill();
    // the pull hint: an arrow down beside the top
    context.strokeStyle = "#ffffffd9"; context.lineWidth = 4; context.lineCap = "round"; context.setLineDash([2, 9]);
    const ax = cx + s * 0.62;
    context.beginPath(); context.moveTo(ax, height * 0.3); context.lineTo(ax, height * 0.62); context.stroke(); context.setLineDash([]);
    context.beginPath(); context.moveTo(ax - 10, height * 0.58); context.lineTo(ax, height * 0.64); context.lineTo(ax + 10, height * 0.58); context.stroke();
    context.fillStyle = "#fff"; context.font = F15B; context.textAlign = "center";
    context.fillText("নিচে টানো", ax, height * 0.7);
  } else if (game.phase === "spin") {
    const drop = Math.min(1, scene.landT / DROP), tilt = game.wobble * lean(game) * 0.55;
    const x = cx + game.wobble * Math.cos(game.sway) * s * 0.12;
    const y = drop < 1 ? height * 0.44 + (cy - height * 0.44) * drop * drop : cy;
    context.fillStyle = "#00000038"; context.beginPath(); context.ellipse(x, cy, s * (0.14 + game.wobble * 0.08), s * 0.04, 0, 0, Math.PI * 2); context.fill();
    drawTop(context, scene, x, y, s, tilt, game.turn, game.omega);
  } else if (game.phase === "fallen") {
    const k = Math.min(1, scene.fallT / TIP), settle = scene.fallT > TIP ? Math.sin((scene.fallT - TIP) * 18) * 0.08 * Math.exp(-(scene.fallT - TIP) * 4) : 0;
    const angle = scene.fallTilt + (scene.fallDir * 1.3 - scene.fallTilt) * k * k + settle;
    context.fillStyle = "#00000030"; context.beginPath(); context.ellipse(cx + scene.fallDir * s * 0.4 * k, cy, s * (0.14 + 0.3 * k), s * 0.05, 0, 0, Math.PI * 2); context.fill();
    drawTop(context, scene, cx + scene.fallDir * s * 0.08 * k, cy - s * 0.12 * k, s, angle, scene.turn, scene.spinLeft * 0.5);
  } else {
    const rise = Math.min(1, scene.palmT / 0.35), lift = Math.min(1, Math.max(0, (scene.palmT - 0.35) / 0.3));
    const handY = height + s * 0.3 - (height + s * 0.3 - cy - s * 0.02) * (1 - (1 - rise) * (1 - rise)) - lift * height * 0.12;
    drawTop(context, scene, cx, Math.min(cy, handY), s, 0, scene.turn, scene.spinLeft);
    paintPalm(context, cx, handY, s * 0.85);
  }

  for (const bit of scene.dust) if (bit.life > 0) { context.globalAlpha = bit.life * 1.6; context.fillStyle = "#e9d2b0"; context.beginPath(); context.arc(bit.x, bit.y, 3 + (0.5 - bit.life) * 8, 0, Math.PI * 2); context.fill(); }
  context.globalAlpha = 1;
  context.restore();

  // The clock and the star track, top left and right.
  const score = scoreOf(game);
  if (score !== scene.labelFor) { scene.labelFor = score; scene.label = secs(score); }
  context.fillStyle = "#0000004d"; context.beginPath(); context.roundRect(8, 8, 116, 44, 12); context.fill();
  context.fillStyle = "#fff"; context.textAlign = "left";
  context.font = F26; context.fillText(scene.label, 16, 39);
  const labelWidth = context.measureText(scene.label).width;
  context.font = F12; context.fillText("সেকেন্ড", 20 + labelWidth, 39);
  const marks = LEVELS[game.level - 1].stars, trackX = width - 132, trackW = 118, full = marks[2] * 1.08;
  context.fillStyle = "#0000004d"; context.beginPath(); context.roundRect(trackX - 8, 8, trackW + 16, 30, 10); context.fill();
  context.fillStyle = "#ffffff59"; context.fillRect(trackX, 25, trackW, 6);
  context.fillStyle = "#ffd166"; context.fillRect(trackX, 25, trackW * Math.min(1, score / 10 / full), 6);
  context.font = F14; context.textAlign = "center";
  for (let index = 0; index < 3; index++) { context.fillStyle = score / 10 >= marks[index] ? "#ffd166" : "#ffffffb3"; context.fillText("★", trackX + trackW * marks[index] / full, 21); }

  if (game.phase === "spin") {
    bar(context, width - 74, 50, 60, game.omega, "#7fd1ff", "ঘোরা");
    bar(context, width - 74, 66, 60, game.wobble, game.wobble >= PICK_STEADY ? PAL.bad : game.wobble > 0.35 ? PAL.warn : PAL.good, "টলমল");
    // The nudge gauge: the dot swings with the lean; tap when it reaches a green end.
    const gx = cx, gy = height - 20, half = width * 0.3, where = lean(game), edge = Math.abs(where);
    context.fillStyle = "#0000004d"; context.beginPath(); context.roundRect(gx - half - 16, gy - 13, half * 2 + 32, 26, 13); context.fill();
    context.fillStyle = "#ffffff4d"; context.fillRect(gx - half, gy - 2, half * 2, 4);
    context.fillStyle = PAL.warn; context.fillRect(gx - half, gy - 3, half * (1 - OK_SWAY), 6); context.fillRect(gx + half * OK_SWAY, gy - 3, half * (1 - OK_SWAY), 6);
    context.fillStyle = PAL.good; context.fillRect(gx - half - 6, gy - 5, half * (1 - GOOD_SWAY) + 6, 10); context.fillRect(gx + half * GOOD_SWAY, gy - 5, half * (1 - GOOD_SWAY) + 6, 10);
    context.fillStyle = edge >= GOOD_SWAY ? PAL.good : "#fff";
    context.strokeStyle = PAL.ink; context.lineWidth = 2;
    context.beginPath(); context.arc(gx + where * half, gy, edge >= GOOD_SWAY ? 10 : 7, 0, Math.PI * 2); context.fill(); context.stroke();
    if (canPick(game)) { context.fillStyle = "#fff"; context.font = F14B; context.textAlign = "center"; context.fillText(game.wobble < PICK_STEADY ? "এখন হাতে তোলা যায়" : "বেশি টলছে, তুললে পড়বে", cx, height * 0.27); }
  }
  if (scene.popT > 0) {
    context.globalAlpha = Math.min(1, scene.popT * 3);
    context.font = F20; context.textAlign = "center";
    context.lineWidth = 4; context.strokeStyle = "#000000a0"; context.strokeText(scene.popText, cx, cy - s * 1.05 - (0.8 - scene.popT) * 30);
    context.fillStyle = scene.popColor === PAL.bad ? "#ffb3a8" : scene.popColor === PAL.warn ? "#ffe08a" : "#b6f5c4";
    context.fillText(scene.popText, cx, cy - s * 1.05 - (0.8 - scene.popT) * 30);
    context.globalAlpha = 1;
  }
}
