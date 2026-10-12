// Drawing in scene units (480×320): the three places, bricks and steps, the stones, the ball and the aim.
// Callers set the transform; the background is drawn once into an offscreen canvas.
import { makeRng, pick } from "../../../shared/game-core";
import { BALL_R, GROUND, H, HAND_X, HAND_Y, W, WALL_X, type World } from "./physics";

type Ctx = CanvasRenderingContext2D;

export const SCENES = [
  // গলির মোড়: plastered wall, a grilled window, wires overhead, a brick-paved lane.
  { sky: "#f7dcae", wall: "#ecdcbc", wallDark: "#d8c39c", skirt: "#b9a27c", ground: "#b4644a", groundLine: "#8f4a35", corner: "#cdb68e" },
  // স্কুলের মাঠ: a low yellow boundary wall, a tree, grass with a worn path.
  { sky: "#cfe6f2", wall: "#f0dc92", wallDark: "#d9bf68", skirt: "#bfa24f", ground: "#8fb95c", groundLine: "#6f9a42", corner: "#e3cd7c" },
  // বাড়ির উঠান: a mud wall under a tin roof, a clothesline, a smooth clay courtyard.
  { sky: "#fde6bf", wall: "#d8b088", wallDark: "#c09670", skirt: "#a97f58", ground: "#cfa577", groundLine: "#b08657", corner: "#bf9a74" },
] as const;

export const STONE_SHADES = ["#b5582f", "#c46d3f", "#a64b29", "#c97c4d", "#b9643b", "#ad5532", "#c2703f"];
export const ink = "#2b1d14";

function rect(c: Ctx, x: number, y: number, w: number, h: number, fill: string) { c.fillStyle = fill; c.fillRect(x, y, w, h); }

function window_(c: Ctx, x: number, y: number, w: number, h: number, frame: string, glass: string) {
  rect(c, x - 3, y - 3, w + 6, h + 6, frame);
  rect(c, x, y, w, h, glass);
  c.strokeStyle = frame; c.lineWidth = 2;
  c.beginPath();
  for (let gx = x + w / 5; gx < x + w - 1; gx += w / 5) { c.moveTo(gx, y); c.lineTo(gx, y + h); }
  c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h / 2);
  c.stroke();
}

function wire(c: Ctx, y0: number, y1: number, sag: number) {
  c.beginPath(); c.moveTo(0, y0); c.quadraticCurveTo(W / 2, (y0 + y1) / 2 + sag, W, y1); c.stroke();
}

/** A block: a brick pile (red, mortar lines) or, when it reaches the wall, a concrete step. */
export function drawBlock(c: Ctx, x0: number, y0: number, x1: number, y1: number) {
  if (x1 >= WALL_X - 0.5) {
    rect(c, x0, y0, x1 - x0, y1 - y0, "#bdb4a4");
    rect(c, x0, y0, x1 - x0, 3, "#ddd6c8");
    rect(c, x0, y0, 2, y1 - y0, "#9c9282");
    c.fillStyle = "#a99f8e";
    for (let y = y0 + 9; y < y1 - 2; y += 9) c.fillRect(x0 + 6, y, x1 - x0 - 10, 1);
    return;
  }
  rect(c, x0, y0, x1 - x0, y1 - y0, "#b8452f");
  c.fillStyle = "#e3c8a8";
  let row = 0;
  for (let y = y1 - 7; y > y0; y -= 7, row++) {
    c.fillRect(x0, y, x1 - x0, 1.2);
    for (let x = x0 + (row % 2 ? 11 : 0) + 22; x < x1 - 1; x += 22) c.fillRect(x, y, 1.2, 7);
  }
  rect(c, x0, y0, x1 - x0, 1.5, "#d0654b");
}

/** The whole still scene for one place: sky, wall, ground, the far house wall, the blocks and the thrower's arm. */
export function drawBackground(c: Ctx, scene: number, blocks: Float64Array | ReadonlyArray<readonly [number, number, number, number]>) {
  const p = SCENES[scene];
  rect(c, 0, 0, W, H, p.sky);
  if (scene === 0) {
    rect(c, 0, 46, W, GROUND - 46, p.wall);
    // Damp stains and a crack, then a grilled window and a meter box with its wire.
    c.fillStyle = p.wallDark;
    for (const [x, y, w, h] of [[30, 230, 90, 44], [260, 60, 60, 26], [390, 210, 50, 60]]) { c.beginPath(); c.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); c.fill(); }
    window_(c, 112, 104, 64, 70, "#4f7f86", "#2f3f44");
    rect(c, 300, 120, 22, 30, "#e6e1d2"); rect(c, 304, 126, 14, 9, "#7b8a8c");
    c.strokeStyle = "#3a332c"; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(311, 120); c.lineTo(311, 46); c.stroke();
    wire(c, 18, 30, 22); wire(c, 30, 24, 18);
    rect(c, 0, 40, W, 6, p.wallDark);
  } else if (scene === 1) {
    // A tree behind a low boundary wall.
    c.fillStyle = "#5d8f3e";
    for (const [x, y, r] of [[70, 120, 46], [120, 100, 40], [30, 96, 36], [100, 70, 34]]) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
    rect(c, 88, 130, 12, 80, "#6e4a2c");
    rect(c, 0, 168, W, GROUND - 168, p.wall);
    rect(c, 0, 160, W, 10, p.wallDark);
    c.fillStyle = p.skirt;
    for (let x = 60; x < W; x += 120) c.fillRect(x, 170, 6, GROUND - 170);
    rect(c, 0, GROUND - 40, W, 40, "#a9cf73");
  } else {
    rect(c, 0, 64, W, GROUND - 64, p.wall);
    // The tin roof's edge, then a wooden window and a clothesline with a চেক গামছা.
    rect(c, 0, 48, W, 18, "#9aa1a3");
    c.fillStyle = "#7d8587";
    for (let x = 4; x < W; x += 10) c.fillRect(x, 48, 3, 18);
    window_(c, 70, 110, 56, 60, "#7a5232", "#3b2c22");
    c.strokeStyle = "#5a4636"; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(170, 96); c.quadraticCurveTo(320, 128, W, 100); c.stroke();
    c.save(); c.translate(280, 112); c.rotate(0.12);
    rect(c, 0, 0, 34, 40, "#c8322b");
    c.fillStyle = "rgba(255,255,255,0.5)";
    for (let k = 4; k < 34; k += 8) c.fillRect(k, 0, 2, 40);
    for (let k = 4; k < 40; k += 8) c.fillRect(0, k, 34, 2);
    c.restore();
  }
  // Skirting, the ground, its texture, and the far house wall.
  rect(c, 0, GROUND - 10, W, 10, p.skirt);
  rect(c, 0, GROUND, W, H - GROUND, p.ground);
  c.fillStyle = p.groundLine;
  if (scene === 0) {
    for (let y = GROUND + 7, row = 0; y < H; y += 8, row++) {
      c.fillRect(0, y, W, 1);
      for (let x = (row % 2) * 9; x < W; x += 18) c.fillRect(x, y - 7, 1, 7);
    }
  } else {
    const rng = makeRng(scene * 31 + 7);
    for (let k = 0; k < 70; k++) c.fillRect(pick(rng, W), GROUND + 3 + pick(rng, H - GROUND - 4), 3 + pick(rng, 6), 1);
  }
  rect(c, 0, GROUND, W, 1.5, "rgba(0,0,0,0.18)");
  rect(c, WALL_X, 0, W - WALL_X, GROUND, p.corner);
  rect(c, WALL_X, 0, 2, GROUND, "rgba(0,0,0,0.15)");
  // A chalk line to throw from.
  rect(c, HAND_X + 12, GROUND + 1, 3, H - GROUND - 6, "rgba(255,255,255,0.75)");
  if (blocks instanceof Float64Array) { for (let b = 0; b < blocks.length; b += 4) drawBlock(c, blocks[b], blocks[b + 1], blocks[b + 2], blocks[b + 3]); }
  else for (const [x0, y0, x1, y1] of blocks) drawBlock(c, x0, y0, x1, y1);
  drawArm(c);
}

/** A school-shirt sleeve and a hand reaching in from the left, cupped under the ball's spot. */
export function drawArm(c: Ctx) {
  c.fillStyle = "#f3efe4";
  c.beginPath(); c.moveTo(-4, 262); c.lineTo(26, 248); c.lineTo(31, 260); c.lineTo(-4, 280); c.closePath(); c.fill();
  c.strokeStyle = "#cfc8b6"; c.lineWidth = 1; c.stroke();
  c.fillStyle = "#a86f4a";
  c.beginPath(); c.ellipse(HAND_X - 4, HAND_Y + 10, 10, 6, -0.35, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(HAND_X + 4, HAND_Y + 6, 4, 3, -0.9, 0, Math.PI * 2); c.fill();
}

/** One flat clay piece (খোলামকুচি) centred on 0,0: chipped ends, a lit top edge, a dark underside. */
export function drawStone(c: Ctx, w: number, h: number, shade: string, seed: number) {
  const rng = makeRng(seed), chip = () => 0.8 + rng() * 2.4, hw = w / 2, hh = h / 2;
  c.beginPath();
  c.moveTo(-hw + chip(), -hh);
  c.lineTo(-hw * 0.2, -hh - 0.4);
  c.lineTo(hw - chip(), -hh);
  c.lineTo(hw, -hh + chip() * 0.8);
  c.lineTo(hw - chip() * 0.6, hh);
  c.lineTo(-hw + chip() * 0.6, hh);
  c.lineTo(-hw, -hh + chip() * 0.8);
  c.closePath();
  c.fillStyle = shade; c.fill();
  c.strokeStyle = "rgba(60,25,10,0.55)"; c.lineWidth = 0.8; c.stroke();
  c.fillStyle = "rgba(255,225,190,0.45)"; c.fillRect(-hw + 3, -hh + 0.8, w - 6, 1.2);
  c.fillStyle = "rgba(70,25,8,0.35)"; c.fillRect(-hw + 2, hh - 2, w - 4, 1.4);
}

/** A worn red rubber ball with a cream band that turns as it rolls. */
export function drawBall(c: Ctx, x: number, y: number, spin: number, r = BALL_R) {
  c.save(); c.translate(x, y); c.rotate(spin);
  c.fillStyle = "#d8473a"; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#f6e7c8"; c.lineWidth = r * 0.28;
  c.beginPath(); c.arc(0, -r * 1.25, r * 1.05, Math.PI * 0.28, Math.PI * 0.72); c.stroke();
  c.restore();
  c.fillStyle = "rgba(255,255,255,0.45)"; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.4, r * 0.28, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(80,20,10,0.6)"; c.lineWidth = 0.9; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
}

/** The dotted first stretch of the arc: dots shrink as they go. */
export function drawDots(c: Ctx, points: Float32Array, count: number) {
  for (let k = 0; k < count; k++) {
    const r = 3.4 - k * 0.18;
    c.beginPath(); c.arc(points[k * 2], points[k * 2 + 1], r, 0, Math.PI * 2);
    c.fillStyle = "#ffffff"; c.fill();
    c.strokeStyle = "rgba(43,29,20,0.6)"; c.lineWidth = 1; c.stroke();
  }
}

/** The pull: a line from the ball back toward the finger, and a ring round the ball that fills with power. */
export function drawPull(c: Ctx, toX: number, toY: number, power: number, accent: string) {
  c.strokeStyle = "rgba(43,29,20,0.55)"; c.lineWidth = 2; c.setLineDash([4, 4]);
  c.beginPath(); c.moveTo(HAND_X, HAND_Y); c.lineTo(toX, toY); c.stroke();
  c.setLineDash([]);
  powerRing(c, power, accent);
}

export function powerRing(c: Ctx, power: number, accent: string) {
  c.lineWidth = 3;
  c.strokeStyle = "rgba(255,255,255,0.8)";
  c.beginPath(); c.arc(HAND_X, HAND_Y, BALL_R + 5, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = accent;
  c.beginPath(); c.arc(HAND_X, HAND_Y, BALL_R + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * power); c.stroke();
}

/** The tap path's power meter: a short upright bar by the arm. */
export function drawMeter(c: Ctx, power: number, accent: string) {
  const x = 12, top = 168, height = 60;
  c.fillStyle = "rgba(43,29,20,0.55)"; c.fillRect(x - 2, top - 2, 12, height + 4);
  c.fillStyle = "#fff"; c.fillRect(x, top, 8, height);
  c.fillStyle = accent; c.fillRect(x, top + height * (1 - power), 8, height * power);
}

/** Stones in their current place, drawn from pre-rendered sprites (one per stone). */
export function drawStones(c: Ctx, w: World, sprites: ReadonlyArray<HTMLCanvasElement | null>, unit: number) {
  for (let i = 0; i < w.x.length; i++) {
    const sprite = sprites[i];
    if (!sprite) continue;
    const sw = sprite.width / unit, sh = sprite.height / unit;
    c.save(); c.translate(w.x[i], w.y[i]); c.rotate(w.a[i]);
    c.drawImage(sprite, -sw / 2, -sh / 2, sw, sh);
    c.restore();
  }
}
