// The art, drawn in code in scene units (480×320, y down) and pre-rendered once into canvases at the current size:
// the three places, bricks, steps and the stool, mud, the seven pieces, the ball, the thrower's arm and the two cousins.
// draw.hot.ts puts the cached pieces together every frame.
import { makeRng, pick } from "../../../shared/game-core";
import { BALL_R, GROUND, H, HAND_X, HAND_Y, STONES, W, WALL_X, type World } from "./world";

type Ctx = CanvasRenderingContext2D;

export const SCENES = [
  // গলির মোড়: plastered wall, a grilled window, wires overhead, a brick-paved lane. Afternoon.
  { sky: "#f7dcae", wall: "#ecdcbc", wallDark: "#d8c39c", skirt: "#b9a27c", ground: "#b4644a", groundLine: "#8f4a35", corner: "#cdb68e", ink: "#2b1d14", accent: "#b4472a" },
  // স্কুলের মাঠ: a low yellow boundary wall, a tree, grass with a worn path. Tiffin break.
  { sky: "#cfe6f2", wall: "#f0dc92", wallDark: "#d9bf68", skirt: "#bfa24f", ground: "#8fb95c", groundLine: "#6f9a42", corner: "#e3cd7c", ink: "#1f2d1a", accent: "#2f6f8f" },
  // নানুবাড়ির উঠান: a mud wall under a tin roof, a smooth clay courtyard. Dusk.
  { sky: "#f6c99a", wall: "#d2a47c", wallDark: "#b98a63", skirt: "#a17552", ground: "#c99a6b", groundLine: "#a97c50", corner: "#b78f6a", ink: "#2e1a10", accent: "#a3402a" },
] as const;

export const STONE_SHADES = ["#b5582f", "#c46d3f", "#a64b29", "#c97c4d", "#b9643b", "#ad5532", "#c2703f"];
export const HEAVY_SHADE = "#8a4a2e";
export const INK = "#2b1d14";

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

/** A block: a brick pile, a concrete veranda step (it reaches the wall), or a জলচৌকি (a low wooden stool). */
export function drawBlock(c: Ctx, x0: number, y0: number, x1: number, y1: number, look: number) {
  if (look === 1) {
    rect(c, x0, y0, x1 - x0, y1 - y0, "#bdb4a4");
    rect(c, x0, y0, x1 - x0, 3, "#ddd6c8");
    rect(c, x0, y0, 2, y1 - y0, "#9c9282");
    c.fillStyle = "#a99f8e";
    for (let y = y0 + 9; y < y1 - 2; y += 9) c.fillRect(x0 + 6, y, x1 - x0 - 10, 1);
    return;
  }
  if (look === 2) {
    // The stool: a thick plank on four short legs, its front edge lit.
    rect(c, x0, y0, x1 - x0, 7, "#8a5a32");
    rect(c, x0, y0, x1 - x0, 2, "#b07a48");
    rect(c, x0 + 3, y0 + 7, 6, y1 - y0 - 7, "#6e4524");
    rect(c, x1 - 9, y0 + 7, 6, y1 - y0 - 7, "#6e4524");
    rect(c, x0 + 14, y0 + 7, 4, y1 - y0 - 9, "#5a381d");
    rect(c, x1 - 18, y0 + 7, 4, y1 - y0 - 9, "#5a381d");
    rect(c, x0 + 3, y0 + 7, x1 - x0 - 6, 3, "#5a381d");
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

/** A muddy stretch of lane: dark wet earth with a few puddle glints. */
function drawMud(c: Ctx, x0: number, x1: number) {
  c.fillStyle = "#6b4a2e";
  c.beginPath(); c.ellipse((x0 + x1) / 2, GROUND + 3, (x1 - x0) / 2, 7, 0, 0, Math.PI * 2); c.fill();
  rect(c, x0 + 6, GROUND - 1, x1 - x0 - 12, 4, "#5b3d24");
  c.fillStyle = "rgba(190,215,230,0.55)";
  for (let x = x0 + 18; x < x1 - 14; x += 34) { c.beginPath(); c.ellipse(x, GROUND + 2, 7, 1.6, 0, 0, Math.PI * 2); c.fill(); }
}

function cloud(c: Ctx, x: number, y: number, r: number) {
  c.fillStyle = "rgba(255,255,255,0.85)";
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.arc(x + r * 0.9, y + r * 0.2, r * 0.75, 0, Math.PI * 2); c.arc(x - r * 0.9, y + r * 0.25, r * 0.65, 0, Math.PI * 2); c.fill();
}
function kite(c: Ctx, x: number, y: number, tilt: number, fill: string) {
  c.save(); c.translate(x, y); c.rotate(tilt);
  c.fillStyle = fill; c.beginPath(); c.moveTo(0, -14); c.lineTo(11, 0); c.lineTo(0, 14); c.lineTo(-11, 0); c.closePath(); c.fill();
  c.strokeStyle = "rgba(43,29,20,0.5)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, -14); c.lineTo(0, 14); c.moveTo(-11, 0); c.lineTo(11, 0); c.stroke();
  c.restore();
  c.strokeStyle = "rgba(43,29,20,0.35)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, y + 14); c.quadraticCurveTo(x - 60, y + 90, x - 140, y + 200); c.stroke();
}
function bird(c: Ctx, x: number, y: number) {
  c.strokeStyle = "rgba(60,35,25,0.6)"; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(x - 6, y); c.quadraticCurveTo(x - 3, y - 4, x, y); c.quadraticCurveTo(x + 3, y - 4, x + 6, y); c.stroke();
}

/** What a tall phone shows above the lane: the alley's upper floors and a kite, the school's flag and clouds, the courtyard's dusk sky and a palm. */
function drawAbove(c: Ctx, scene: number, extra: number) {
  if (extra < 4) return;
  const p = SCENES[scene];
  if (scene === 0) {
    // The building goes on up: a floor line, grilled windows, a balcony with a plant and a hanging গামছা, then sky.
    const roof = -Math.min(extra, 300) + 40;
    for (let floor = 0, y = -20; y > roof + 40; floor++, y -= 120) {
      rect(c, 0, y, WALL_X, 5, p.wallDark);
      window_(c, 60 + (floor % 2) * 40, y - 92, 52, 62, "#4f7f86", "#2f3f44");
      window_(c, 300 - (floor % 2) * 30, y - 92, 52, 62, "#4f7f86", "#2f3f44");
      if (floor === 0) {
        rect(c, 196, y - 34, 86, 4, "#5b5b5b");
        for (let x = 198; x < 282; x += 8) rect(c, x, y - 32, 1.6, 26, "#5b5b5b");
        c.fillStyle = "#4e8a3a"; c.beginPath(); c.arc(210, y - 40, 9, 0, Math.PI * 2); c.fill(); rect(c, 205, y - 36, 10, 8, "#b45a35");
        rect(c, 250, y - 30, 16, 22, "#2f6f8f");
      }
    }
    if (extra > 180) { rect(c, 0, -extra, W, extra - Math.min(extra, 300) + 40, "#bfe0ef"); cloud(c, 110, roof - 40, 16); kite(c, 360, roof - 50, 0.3, "#d8473a"); }
    return;
  }
  if (scene === 1) {
    c.fillStyle = "#cfe6f2"; c.fillRect(0, -extra, W, extra + 60);
    cloud(c, 90, 30 - extra * 0.6, 18); cloud(c, 170, 10 - extra * 0.3, 14); if (extra > 160) cloud(c, 220, -extra + 50, 20);
    // The school's second floor rises behind, with the flag on its roof.
    rect(c, 230, Math.max(-extra + 30, -40), 230, 104, "#c46a4a");
    for (let x = 246; x < 450; x += 40) rect(c, x, Math.max(-extra + 30, -40) + 22, 22, 30, "#3f7a52");
    const pole = Math.max(-extra + 30, -40);
    rect(c, 300, pole - 90, 2.5, 90, "#8a8a8a");
    rect(c, 302, pole - 88, 40, 24, "#1f7a4a");
    c.fillStyle = "#d8342b"; c.beginPath(); c.arc(320, pole - 76, 7.5, 0, Math.PI * 2); c.fill();
    return;
  }
  // The courtyard at dusk: a sky that warms toward the roof, a coconut palm over the wall, birds going home, a kite.
  const sky = c.createLinearGradient(0, -extra, 0, 64);
  sky.addColorStop(0, "#e9a07a"); sky.addColorStop(0.6, "#f6c99a"); sky.addColorStop(1, "#fbe0b8");
  c.fillStyle = sky; c.fillRect(0, -extra, W, extra + 64);
  c.fillStyle = "#fff1d0"; c.beginPath(); c.arc(380, Math.max(-extra + 40, 10), 18, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#6b4a2e"; c.lineWidth = 7;
  const top = Math.max(-extra + 60, -120);
  c.beginPath(); c.moveTo(430, 64); c.quadraticCurveTo(410, (64 + top) / 2, 420, top); c.stroke();
  c.fillStyle = "#3f6b34";
  for (let k = 0; k < 7; k++) { c.save(); c.translate(420, top); c.rotate(-2.6 + k * 0.75); c.beginPath(); c.ellipse(26, 0, 30, 6, 0.25, 0, Math.PI * 2); c.fill(); c.restore(); }
  bird(c, 150, top + 20); bird(c, 172, top + 8); bird(c, 190, top + 26);
  if (extra > 150) kite(c, 250, -extra + 60, -0.25, "#f2c94c");
}

/**
 * The whole still scene for a place, `extra` units of wall or sky above the lane (a phone held upright shows more of it):
 * sky, wall, ground, the far house wall, the blocks, the mud and the thrower's arm.
 */
export function drawBackground(c: Ctx, scene: number, w: World, extra: number) {
  const p = SCENES[scene];
  rect(c, 0, -extra, W, H + extra, p.sky);
  if (scene === 0) {
    rect(c, 0, -extra, W, GROUND + extra, p.wall);
    drawAbove(c, 0, extra);
    c.fillStyle = p.wallDark;
    for (const [x, y, ww, hh] of [[30, 230, 90, 44], [260, 60, 60, 26], [390, 210, 50, 60], [150, -60, 70, 30]]) { c.beginPath(); c.ellipse(x + ww / 2, y + hh / 2, ww / 2, hh / 2, 0, 0, Math.PI * 2); c.fill(); }
    window_(c, 112, 104, 64, 70, "#4f7f86", "#2f3f44");
    if (extra > 60) window_(c, 300, 20 - Math.min(extra, 140), 56, 60, "#4f7f86", "#2f3f44");
    rect(c, 300, 120, 22, 30, "#e6e1d2"); rect(c, 304, 126, 14, 9, "#7b8a8c");
    c.strokeStyle = "#3a332c"; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(311, 120); c.lineTo(311, 46); c.stroke();
    wire(c, 18, 30, 22); wire(c, 30, 24, 18);
    rect(c, 0, 40, W, 6, p.wallDark);
  } else if (scene === 1) {
    drawAbove(c, 1, extra);
    c.fillStyle = "#5d8f3e";
    for (const [x, y, r] of [[70, 120, 46], [120, 100, 40], [30, 96, 36], [100, 70, 34], [60, 40, 30]]) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
    rect(c, 88, 130, 12, 80, "#6e4a2c");
    // The school building behind: a red-brick block with green shutters.
    rect(c, 230, 64, 230, 104, "#c46a4a");
    for (let x = 246; x < 450; x += 40) rect(c, x, 82, 22, 30, "#3f7a52");
    rect(c, 0, 168, W, GROUND - 168, p.wall);
    rect(c, 0, 160, W, 10, p.wallDark);
    c.fillStyle = p.skirt;
    for (let x = 60; x < W; x += 120) c.fillRect(x, 170, 6, GROUND - 170);
    rect(c, 0, GROUND - 40, W, 40, "#a9cf73");
  } else {
    rect(c, 0, 64, W, GROUND - 64, p.wall);
    // The tin roof's edge, a wooden window, a হারিকেন on a nail. The sky above is dusk.
    drawAbove(c, 2, extra);
    rect(c, 0, 48, W, 18, "#9aa1a3");
    c.fillStyle = "#7d8587";
    for (let x = 4; x < W; x += 10) c.fillRect(x, 48, 3, 18);
    window_(c, 70, 110, 56, 60, "#7a5232", "#3b2c22");
    rect(c, 200, 120, 2, 8, "#3a2a1c");
    c.fillStyle = "#d6a23a"; c.fillRect(194, 128, 14, 16);
    c.fillStyle = "#ffe8a8"; c.beginPath(); c.arc(201, 136, 4, 0, Math.PI * 2); c.fill();
  }
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
  rect(c, WALL_X, -extra, W - WALL_X, GROUND + extra, p.corner);
  rect(c, WALL_X, -extra, 2, GROUND + extra, "rgba(0,0,0,0.15)");
  // A chalk line to throw from.
  rect(c, HAND_X + 12, GROUND + 1, 3, H - GROUND - 6, "rgba(255,255,255,0.75)");
  for (let k = 0; k < w.mud.length; k += 2) drawMud(c, w.mud[k], w.mud[k + 1]);
  for (let b = 0; b < w.blocks.length; b += 4) drawBlock(c, w.blocks[b], w.blocks[b + 1], w.blocks[b + 2], w.blocks[b + 3], w.looks[b / 4]);
}

/** A school-shirt sleeve and a hand reaching in from the left; `back` (0–1) draws it pulled back for a throw. */
export function drawArm(c: Ctx, back: number, x = HAND_X, y = HAND_Y) {
  const dx = -back * 12, dy = back * 6;
  c.fillStyle = "#f3efe4";
  c.beginPath(); c.moveTo(-4, 262 + dy); c.lineTo(26 + dx, 248 + dy); c.lineTo(31 + dx, 260 + dy); c.lineTo(-4, 280 + dy); c.closePath(); c.fill();
  c.strokeStyle = "#cfc8b6"; c.lineWidth = 1; c.stroke();
  c.fillStyle = "#a86f4a";
  c.beginPath(); c.ellipse(x - 4 + dx, y + 10 + dy, 10, 6, -0.35, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(x + 4 + dx, y + 6 + dy, 4, 3, -0.9, 0, Math.PI * 2); c.fill();
}

/** One flat clay piece (খোলামকুচি) centred on 0,0: chipped ends, a lit top edge, a dark underside. A heavy one is a darker, thicker কলসির কানা with a rim line. */
export function drawStone(c: Ctx, w: number, h: number, shade: string, seed: number, heavy: boolean) {
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
  c.fillStyle = heavy ? HEAVY_SHADE : shade; c.fill();
  c.strokeStyle = "rgba(60,25,10,0.55)"; c.lineWidth = 0.8; c.stroke();
  c.fillStyle = "rgba(255,225,190,0.45)"; c.fillRect(-hw + 3, -hh + 0.8, w - 6, 1.2);
  c.fillStyle = "rgba(70,25,8,0.35)"; c.fillRect(-hw + 2, hh - 2, w - 4, 1.4);
  if (heavy) { c.fillStyle = "rgba(255,210,160,0.35)"; c.fillRect(-hw + 4, -1, w - 8, 1.4); c.fillRect(-hw + 4, 2, w - 8, 0.8); }
}

/** A worn red rubber ball with a cream band, drawn at 0,0 (draw.hot.ts rotates it as it rolls). */
export function drawBallSprite(c: Ctx, r = BALL_R) {
  c.fillStyle = "#d8473a"; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
  c.save(); c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.clip();
  c.strokeStyle = "#f6e7c8"; c.lineWidth = r * 0.28;
  c.beginPath(); c.arc(0, -r * 1.25, r * 1.05, Math.PI * 0.28, Math.PI * 0.72); c.stroke();
  c.restore();
  c.strokeStyle = "rgba(80,20,10,0.6)"; c.lineWidth = 0.9; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke();
}

/** মিঠু, seen from the side, standing on 0,0 (his feet): a boy in a striped shirt and shorts. `up` raises his arms (a catch, a hop). */
export function drawMithu(c: Ctx, up: boolean, holding: boolean) {
  c.fillStyle = "#3b2a1e"; c.fillRect(-5, -10, 3, 10); c.fillRect(2, -10, 3, 10);
  c.fillStyle = "#2f4a7a"; c.fillRect(-6, -16, 12, 7);
  c.fillStyle = "#e9e2d0"; c.fillRect(-6, -28, 12, 13);
  c.fillStyle = "#c8322b"; for (let y = -27; y < -16; y += 4) c.fillRect(-6, y, 12, 1.6);
  c.fillStyle = "#a86f4a";
  if (up) { c.fillRect(-8, -42, 3, 15); c.fillRect(5, -42, 3, 15); }
  else { c.fillRect(-9, -26, 3, 11); c.fillRect(6, -26, 3, 11); }
  c.beginPath(); c.arc(0, -33, 5.5, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#1e140e"; c.beginPath(); c.arc(0, -35, 5.6, Math.PI, Math.PI * 2); c.fill();
  c.fillStyle = "#1e140e"; c.fillRect(-4, -34, 1.6, 1.6);
  if (holding) { c.save(); c.translate(0, -45); drawBallSprite(c, BALL_R * 0.9); c.restore(); }
}

/** টুনি, squatting by the wall on 0,0: a girl in a yellow frock with two braids. `reach` stretches her arm out to the pile. */
export function drawTuni(c: Ctx, reach: boolean) {
  c.fillStyle = "#e0a93a";
  c.beginPath(); c.moveTo(-8, 0); c.lineTo(8, 0); c.lineTo(5, -16); c.lineTo(-5, -16); c.closePath(); c.fill();
  c.fillStyle = "#c98f24"; c.fillRect(-8, -2, 16, 2);
  c.fillStyle = "#a86f4a";
  if (reach) c.fillRect(-20, -12, 15, 3); else c.fillRect(-7, -12, 3, 9);
  c.beginPath(); c.arc(0, -21, 5.5, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#1e140e";
  c.beginPath(); c.arc(0, -23, 5.6, Math.PI, Math.PI * 2); c.fill();
  c.fillRect(4, -23, 2, 10); c.fillRect(-6, -23, 2, 10);
  c.fillStyle = "#d8473a"; c.fillRect(3.5, -14, 3, 2); c.fillRect(-6.5, -14, 3, 2);
}

/** A fresh canvas holding one drawing, `size` units across, at `k` pixels per unit. */
function sprite(width: number, height: number, k: number, paint: (c: Ctx) => void, ox: number, oy: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * k); canvas.height = Math.ceil(height * k);
  const c = canvas.getContext("2d");
  if (c) { c.setTransform(k, 0, 0, k, ox * k, oy * k); paint(c); }
  return canvas;
}

export type Sprites = {
  background: HTMLCanvasElement | null;
  stones: (HTMLCanvasElement | null)[];
  ball: HTMLCanvasElement | null;
  /** মিঠু standing, hopping, holding the ball; টুনি squatting, reaching. */
  mithu: (HTMLCanvasElement | null)[];
  tuni: (HTMLCanvasElement | null)[];
  arm: (HTMLCanvasElement | null)[];
  /** Pixels per scene unit the sprites were painted at. */
  k: number;
};
export const makeSprites = (): Sprites => ({ background: null, stones: Array(STONES).fill(null), ball: null, mithu: [null, null, null], tuni: [null, null], arm: [null, null, null], k: 1 });

/** Paints every cached piece for a world at `k` pixels per unit, with `extra` units of scene above the lane. */
export function paintSprites(s: Sprites, scene: number, w: World, seed: number, k: number, extra: number) {
  s.k = k;
  s.background = sprite(W, H + extra, k, c => drawBackground(c, scene, w, extra), 0, extra);
  for (let i = 0; i < STONES; i++) {
    const shade = STONE_SHADES[i], heavy = w.m[i] > 1;
    s.stones[i] = sprite(w.w[i] + 4, w.h[i] + 4, k, c => drawStone(c, w.w[i], w.h[i], shade, seed + i, heavy), (w.w[i] + 4) / 2, (w.h[i] + 4) / 2);
  }
  s.ball = sprite(BALL_R * 2 + 2, BALL_R * 2 + 2, k, c => drawBallSprite(c), BALL_R + 1, BALL_R + 1);
  s.mithu = [false, true, true].map((up, n) => sprite(24, 58, k, c => drawMithu(c, up, n === 2), 12, 56));
  s.tuni = [false, true].map(reach => sprite(34, 32, k, c => drawTuni(c, reach), 22, 30));
  s.arm = [0, 0.5, 1].map(back => sprite(80, 70, k, c => drawArm(c, back), 4, -220));
}
