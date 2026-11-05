// One frame of the board: the sky and the scrolling wall, every ledge on screen with its pot, marble, laundry, cracks and
// gaps, the glass marble squashing on its landings, the lantern's dark, the awning and its red wash, the edge glows, and the
// HUD in the corners. Allocation-free (npm run lint:games): every sprite and string comes from scene.ts.
import { paintLaundry, paintLedge } from "./art";
import { surfaceY, ALLEY, G, LANDING, R, TOP, W } from "./physics";
import { FONT_HUD, FONT_POP, FONT_SMALL, LEFT, MINUS_ONE, NUMBERS, PLUS_ONE, STREAKS, type Scene, type Sprite } from "./scene";
import type { Game } from "./game";
import { surgeAhead } from "./step.hot";

const HOLE_X = W * 0.72;

/** Board units → device pixels, with the board's top at screen y 0. */
function board(scene: Scene) { const s = scene.k * scene.dpr; scene.context.setTransform(s, 0, 0, s, scene.ox * scene.dpr, 0); }
function screen(scene: Scene) { scene.context.setTransform(scene.dpr, 0, 0, scene.dpr, 0, 0); }
function stamp(scene: Scene, image: Sprite, x: number, y: number) { scene.context.drawImage(image.canvas, x - image.ox, y - image.oy, image.w, image.h); }

/** A glass layer centred at board (x, y), turned by `angle`, stretched sx × sy. */
function glass(scene: Scene, image: Sprite, x: number, y: number, angle: number, sx: number, sy: number) {
  const s = scene.k * scene.dpr, cos = Math.cos(angle), sin = Math.sin(angle);
  scene.context.setTransform(cos * sx * s, sin * sy * s, -sin * sx * s, cos * sy * s, (scene.ox + x * scene.k) * scene.dpr, y * s);
  scene.context.drawImage(image.canvas, -image.ox, -image.oy, image.w, image.h);
}

function pill(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, colour: string) {
  c.fillStyle = colour; c.beginPath(); c.roundRect(x, y, w, h, h / 2); c.fill();
}

/** A ledge on screen at y: its pieces (a gap splits it), a slope, a shaking crack, its pot, marble and laundry. */
function drawLedge(scene: Scene, game: Game, index: number, y: number) {
  const c = scene.context, ledge = game.rows[index], s = scene.k * scene.dpr;
  const w = ledge.x1 - ledge.x0, cx = (ledge.x0 + ledge.x1) / 2;
  if (ledge.gone) {
    // A cracked step falls away in two halves.
    const since = game.t - ledge.goneAt;
    if (since > 0.7) return;
    const drop = 0.5 * G * since * since * 0.4;
    c.globalAlpha = 1 - since / 0.7;
    c.setTransform(s, 0, 0, s, (scene.ox + (ledge.x0 - since * 30) * scene.k) * scene.dpr, (y + drop) * s);
    paintLedge(c, ledge.kind, 0, w / 2, 0, false);
    c.setTransform(s, 0, 0, s, (scene.ox + (cx + since * 30) * scene.k) * scene.dpr, (y + drop * 1.2) * s);
    paintLedge(c, ledge.kind, 0, w / 2, 0, false);
    c.globalAlpha = 1;
    board(scene);
    return;
  }
  let shakeX = 0;
  if (ledge.crackT > 0) shakeX = Math.sin(scene.clock * 70) * 1.6 * (1 - ledge.crackT);
  if (ledge.tilt !== 0) {
    const angle = Math.atan(ledge.tilt), cos = Math.cos(angle), sin = Math.sin(angle);
    c.setTransform(cos * s, sin * s, -sin * s, cos * s, (scene.ox + cx * scene.k) * scene.dpr, y * s);
    const half = w / 2 / cos;
    paintLedge(c, ledge.kind, -half, half * 2, 0, ledge.wet);
    board(scene);
  } else if (!Number.isNaN(ledge.h0)) {
    paintLedge(c, ledge.kind, ledge.x0, ledge.h0 - ledge.x0, y, ledge.wet);
    paintLedge(c, ledge.kind, ledge.h1, ledge.x1 - ledge.h1, y, ledge.wet);
  } else if (shakeX !== 0) {
    paintLedge(c, ledge.kind, ledge.x0 + shakeX, w, y, ledge.wet);
  } else {
    paintLedge(c, ledge.kind, ledge.x0, w, y, ledge.wet);
  }
  if (ledge.crack) {
    c.strokeStyle = ledge.crackT > 0 ? "#2a1a10" : "rgba(42,26,16,0.75)"; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(cx - 10 + shakeX, y + 1); c.lineTo(cx - 3 + shakeX, y + 6); c.lineTo(cx - 7 + shakeX, y + 11);
    c.moveTo(cx + 12 + shakeX, y + 1); c.lineTo(cx + 6 + shakeX, y + 7); c.stroke();
  }
  if (ledge.pot >= 0) stamp(scene, scene.pot, ledge.pot - scene.pot.w / 2, y - 32);
  if (ledge.pick >= 0 && !ledge.picked) {
    const bob = Math.sin(scene.clock * 3 + ledge.row) * 1.2, pick = scene.picks[ledge.row % scene.picks.length];
    c.drawImage(pick.canvas, ledge.pick - 9, surfaceY(ledge, ledge.pick) - 16 + bob, 18, 18);
  }
  if (ledge.gust !== 0) paintLaundry(c, ledge.x0, ledge.x1, y, ledge.gust, (Math.sin(scene.clock * 9 + ledge.row) + 1) / 2);
}

/** Draws the whole frame (`game` null: only the walls). `calm` is ধীরে খেলো; `finishAt` (performance seconds) is when the landing was reached, or -1. */
export function drawFrame(scene: Scene, game: Game | null, calm: boolean, now: number, finishAt: number) {
  const c = scene.context, view = scene.view;
  screen(scene);
  c.fillStyle = scene.palette.sky[1]; c.fillRect(0, 0, scene.cssWidth, scene.cssHeight);
  board(scene);
  stamp(scene, scene.sky, 0, 0);
  const cam = game ? game.cam : 0;
  const offset = (cam * 0.35) % 360;
  for (let y = -offset; y < view; y += 359) stamp(scene, scene.wall, 0, y);
  if (!game) return;

  const rows = game.rows;
  for (let index = game.lo; index < rows.length; index++) {
    const y = rows[index].y - cam;
    if (y > view + 40) break;
    if (y < -60) continue;
    drawLedge(scene, game, index, y);
  }

  // The marble: squashed by its landing, its swirl turned by the distance rolled; on the last floor it rolls into the hole.
  if (game.chances > 0 || game.over === 1) {
    let x = game.x, y = game.y - cam, sink = 0;
    if (game.over === 1 && rows[game.on] && rows[game.on].kind === ALLEY && finishAt >= 0) {
      const t = Math.min(1, (now - finishAt) / 1.4), eased = 1 - (1 - t) * (1 - t);
      x = game.x + (HOLE_X - game.x) * eased;
      if (t >= 1) sink = Math.min(1, (now - finishAt - 1.4) / 0.4);
    }
    const squash = calm ? 0 : game.squash, sy = 1 - 0.3 * squash, sx = 1 + 0.22 * squash;
    const respawn = game.wait > 0 ? 1 - game.wait / 0.7 : 1;
    c.globalAlpha = (0.35 + 0.65 * respawn) * (1 - sink);
    const cy = y + R * (1 - sy) + sink * 6;
    c.fillStyle = "rgba(0,0,0,0.2)"; c.beginPath(); c.ellipse(x + 1.5, y + R - 0.5, R * 0.8 * sx, R * 0.22, 0, 0, 6.2832); c.fill();
    const roll = game.over === 1 ? game.roll + (x - game.x) / R : game.roll;
    glass(scene, scene.body, x, cy, 0, sx, sy);
    glass(scene, scene.swirl, x, cy, roll, sx, sy);
    glass(scene, scene.shine, x, cy, 0, sx, sy);
    board(scene);
    c.globalAlpha = 1;
    if (scene.dark && scene.dim) c.drawImage(scene.dim.canvas, x - W, y - view - 120, W * 2, view * 2 + 240);
  }

  // A picked marble's +১, and the refill's +১ by the chances.
  const sincePick = now - scene.pickAt;
  if (sincePick < 0.6) {
    c.globalAlpha = 1 - sincePick / 0.6; c.font = FONT_POP; c.textAlign = "center"; c.fillStyle = "#fff8d6";
    c.strokeStyle = "rgba(0,0,0,0.45)"; c.lineWidth = 3;
    c.strokeText(PLUS_ONE, scene.pickX, scene.pickY - cam - 14 - sincePick * 30);
    c.fillText(PLUS_ONE, scene.pickX, scene.pickY - cam - 14 - sincePick * 30);
    c.globalAlpha = 1;
  }

  // The awning: amber flashes before a surge; the red wash grows as the marble nears it.
  const surge = surgeAhead(game) > 0 && !calm && ((scene.clock * 6) | 0) % 2 === 0;
  const headroom = game.y - R - cam - TOP;
  if (headroom < 90 && game.chances > 0) { c.globalAlpha = Math.min(1, (90 - headroom) / 90); stamp(scene, scene.warning, 0, TOP); c.globalAlpha = 1; }
  stamp(scene, surge ? scene.awningRush : scene.awning, 0, 0);

  // Edge signals: the last chance glows orange; a lost one flashes red; a gust shows chevrons on the side it blows to.
  const last = game.chances === 1 && !game.over && (game.most > 1 || headroom < 150);
  if (last) { c.globalAlpha = calm ? 0.55 : 0.45 + 0.3 * Math.sin(scene.clock * 5); stamp(scene, scene.edgeOrange, 0, 0); c.globalAlpha = 1; }
  const sinceHit = now - scene.hitAt;
  if (sinceHit < 0.5 && !calm) { c.globalAlpha = 1 - sinceHit / 0.5; stamp(scene, scene.edgeRed, 0, 0); c.globalAlpha = 1; }
  if (game.wind !== 0 && game.on < 0) {
    const side = game.wind, edgeX = side > 0 ? W - 14 : 14, mid = game.y - cam;
    c.fillStyle = "rgba(255,255,255,0.85)";
    for (let i = 0; i < 3; i++) {
      const at = edgeX - side * i * 10;
      c.beginPath(); c.moveTo(at - side * 6, mid - 10); c.lineTo(at + side * 2, mid); c.lineTo(at - side * 6, mid + 10); c.lineTo(at - side * 3, mid); c.closePath(); c.fill();
    }
  }

  // ---- the HUD, in CSS pixels ----
  if (!scene.hud) { c.globalAlpha = 1; return; }
  screen(scene);
  const width = scene.cssWidth, done = game.deepest - game.start;
  if (game.steps) {
    c.fillStyle = "rgba(0,0,0,0.25)"; c.fillRect(0, 0, width, 4);
    c.fillStyle = scene.palette.glow; c.fillRect(0, 0, width * Math.min(1, done / game.steps), 4);
  }
  // Chances, top-right, then the picked marbles under them.
  for (let i = 0; i < game.most; i++) {
    const image = i < game.chances ? scene.dotOn : scene.dotOff;
    c.drawImage(image.canvas, width - 12 - (game.most - i) * 19, 30, 16, 16);
  }
  pill(c, width - 74, 52, 62, 24, scene.palette.panel);
  const pick = scene.picks[0];
  c.drawImage(pick.canvas, width - 70, 55, 18, 18);
  c.font = FONT_HUD; c.textAlign = "right"; c.fillStyle = "#ffffff"; c.fillText(NUMBERS[Math.min(999, game.picks)], width - 20, 70);
  if (game.streak >= 2) {
    pill(c, width - 86, 82, 74, 22, "#1f2b2acc");
    c.font = FONT_SMALL; c.fillStyle = "#ffd166"; c.textAlign = "center"; c.fillText(STREAKS[Math.min(99, game.streak)], width - 49, 98);
  }
  // A finale's named bar top-centre; an old link's steps there instead.
  if (scene.finale) {
    const bw = Math.min(180, width * 0.42), bx = width / 2 - bw / 2;
    pill(c, bx, 12, bw, 30, "#3a0f0ad0");
    c.fillStyle = "rgba(255,255,255,0.18)"; c.fillRect(bx + 10, 34, bw - 20, 4);
    c.fillStyle = "#ff7a5c"; c.fillRect(bx + 10, 34, (bw - 20) * Math.min(1, done / game.steps), 4);
    c.font = FONT_SMALL; c.fillStyle = "#ffffff"; c.textAlign = "center"; c.fillText(scene.finale, width / 2, 29);
  } else if (!game.steps) {
    pill(c, width / 2 - 34, 12, 68, 28, scene.palette.panel);
    c.font = FONT_HUD; c.fillStyle = "#ffffff"; c.textAlign = "center"; c.fillText(NUMBERS[Math.min(999, done)], width / 2, 32);
  }
  // The landing, once it is near but still below the screen.
  if (game.steps) {
    const left = game.steps - done, landing = rows[rows.length - 1];
    if (left > 0 && left <= 6 && (landing.y - cam) > view - 20 && (landing.kind === LANDING || landing.kind === ALLEY)) {
      const y = scene.cssHeight - 40;
      pill(c, width / 2 - 52, y, 104, 26, scene.palette.panel);
      c.font = FONT_SMALL; c.fillStyle = "#ffffff"; c.textAlign = "center"; c.fillText(LEFT[left], width / 2 + 6, y + 18);
      c.beginPath(); c.moveTo(width / 2 - 40, y + 9); c.lineTo(width / 2 - 30, y + 9); c.lineTo(width / 2 - 35, y + 17); c.closePath(); c.fill();
    }
  }
  if (scene.bonusAt > 0 && now - scene.bonusAt < 0.8) {
    c.globalAlpha = 1 - (now - scene.bonusAt) / 0.8; c.font = FONT_POP; c.fillStyle = "#ffd166"; c.textAlign = "right";
    c.fillText(PLUS_ONE, width - 14 - game.most * 19 - 4, 44); c.globalAlpha = 1;
  }
  if (sinceHit < 0.8) {
    c.globalAlpha = 1 - sinceHit / 0.8; c.font = FONT_POP; c.fillStyle = "#ff8a7a"; c.textAlign = "right";
    c.fillText(MINUS_ONE, width - 14 - game.most * 19 - 4, 44); c.globalAlpha = 1;
  }
  board(scene);
  c.globalAlpha = 1;
  c.textAlign = "left";
}

/** Ambient time for bobs, flaps and pulses: frozen in ধীরে খেলো. */
export function tickScene(scene: Scene, dt: number, calm: boolean) { if (!calm) scene.clock += dt; }
