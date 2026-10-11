// Draws the play canvas: a village field seen from the side, a camera that follows the কাঠি, and the kids on the side.
// The hot path allocates nothing: labels, fonts and dash patterns are built once, the backdrop is painted once per size.
import { BODY_FONT, DISPLAY_FONT } from "../../../shared/card-canvas";
import { BATTER, LOOKS, PAL, drawBall, drawBatter, drawCow, drawGamchha, drawKid, drawPond, type Pose } from "./art";
import { BALL_X, GOOD, SWEET_Y, ballAt, popTime, popY, type Game, type Shot } from "./game";
import { bn, shout } from "./result";

export type Mood = "idle" | "watch" | "cheer" | "groan";
export type Scene = {
  w: number; h: number; ground: number; unit: number; ratio: number;
  camX: number; zoom: number; shake: number; clock: number; slow: boolean;
  mood: Mood; shout: string; shoutTime: number; shoutWidth: number; cowAlert: number;
  ball: { x: number; y: number }; spin: number;
  sky: HTMLCanvasElement | null; far: HTMLCanvasElement | null; farWidth: number;
  /** Dust or splash: DUST particles of [x, y, vx, vy, life] in world units. */
  dust: Float32Array; dustColor: string;
  coach: boolean;
  /** The how-to box, fitted to the canvas once per size. */
  coachFont: string; coachWidth: number;
};

const HOME = -1.5;
const BATTER_X = -0.55;
const DUST = 14;
/** Seconds between the dots of the trail that draws the arc. */
const TRAIL_GAP = 0.07;
const trailPoint = { x: 0, y: 0 };
const AIM = 1.05, BACK = 3.5, FOLLOW = -1.05;
const LABELS = Array.from({ length: 61 }, (_, index) => `${bn(index)} ডাং`);
const PEGS = Array.from({ length: 13 }, (_, index) => bn(index * 5));
const labelWidths = new Float32Array(61);
const PEG_FONT = `700 12px ${DISPLAY_FONT}`, LABEL_FONT = `800 17px ${DISPLAY_FONT}`, SHOUT_FONT = `800 16px ${DISPLAY_FONT}`;
const SMALL_FONT = `600 11px ${BODY_FONT}`;
const COACH = ["১. চাপো, কাঠি লাফাবে", "২. নামার সময় হলুদে চাপো", "নামার সময় হলুদে চাপো!"];

export function makeScene(): Scene {
  return {
    w: 0, h: 0, ground: 0, unit: 1, ratio: 1, camX: HOME, zoom: 1, shake: 0, clock: 0, slow: false,
    mood: "idle", shout: "", shoutTime: 0, shoutWidth: 0, cowAlert: 0, ball: { x: 0.08, y: 0.04 }, spin: -0.25,
    sky: null, far: null, farWidth: 0, dust: new Float32Array(DUST * 5), dustColor: PAL.mud, coach: true, coachFont: "", coachWidth: 0,
  };
}

export function resizeScene(scene: Scene, w: number, h: number, ratio: number) {
  scene.w = w; scene.h = h; scene.ratio = ratio;
  scene.ground = Math.round(h * 0.72);
  scene.unit = w / 10;
  scene.coachFont = "";
  paintBackdrop(scene);
}

function offscreen(width: number, height: number, ratio: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const context = canvas.getContext("2d")!;
  context.scale(ratio, ratio);
  return { canvas, context };
}

/** Sky with the afternoon sun, and a wrap-around strip of trees and huts for the far side of the field. */
function paintBackdrop(scene: Scene) {
  const { w, ground, ratio } = scene;
  const sky = offscreen(w, ground, ratio);
  const gradient = sky.context.createLinearGradient(0, 0, 0, ground);
  gradient.addColorStop(0, PAL.skyTop); gradient.addColorStop(1, PAL.skyLow);
  sky.context.fillStyle = gradient; sky.context.fillRect(0, 0, w, ground);
  sky.context.fillStyle = "#fff6d888"; sky.context.beginPath(); sky.context.arc(w * 0.8, ground * 0.24, 34, 0, Math.PI * 2); sky.context.fill();
  sky.context.fillStyle = "#fffbe9"; sky.context.beginPath(); sky.context.arc(w * 0.8, ground * 0.24, 20, 0, Math.PI * 2); sky.context.fill();
  scene.sky = sky.canvas;

  const width = Math.round(w * 1.6);
  const far = offscreen(width, ground, ratio);
  const c = far.context, base = ground;
  const tree = (x: number, size: number, dark: boolean) => {
    for (const offset of [-width, 0, width]) {
      const cx = x + offset;
      c.fillStyle = "#5a4630"; c.fillRect(cx - 2, base - size * 0.9, 4, size * 0.9);
      c.fillStyle = dark ? PAL.farDark : PAL.far;
      c.beginPath(); c.arc(cx, base - size * 1.1, size * 0.62, 0, Math.PI * 2); c.arc(cx - size * 0.5, base - size * 0.8, size * 0.45, 0, Math.PI * 2); c.arc(cx + size * 0.5, base - size * 0.85, size * 0.48, 0, Math.PI * 2); c.fill();
    }
  };
  const palm = (x: number, size: number) => {
    c.strokeStyle = "#6e5638"; c.lineWidth = 3; c.lineCap = "round";
    c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x + size * 0.15, base - size, x + size * 0.3, base - size * 1.9); c.stroke();
    c.strokeStyle = PAL.far; c.lineWidth = 4;
    for (let leaf = 0; leaf < 6; leaf++) {
      const a = Math.PI + (leaf / 5) * Math.PI, tx = x + size * 0.3, ty = base - size * 1.9;
      c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + Math.cos(a) * size * 0.5, ty + Math.sin(a) * size * 0.5 - 6, tx + Math.cos(a) * size * 0.8, ty + Math.sin(a) * size * 0.5 + 10); c.stroke();
    }
  };
  const hut = (x: number, size: number) => {
    c.fillStyle = PAL.hut; c.fillRect(x, base - size * 0.7, size * 1.3, size * 0.7);
    c.fillStyle = "#5b3a22"; c.fillRect(x + size * 0.5, base - size * 0.45, size * 0.28, size * 0.45);
    c.fillStyle = PAL.roof; c.beginPath(); c.moveTo(x - size * 0.15, base - size * 0.68); c.lineTo(x + size * 0.2, base - size * 1.1); c.lineTo(x + size * 1.1, base - size * 1.1); c.lineTo(x + size * 1.45, base - size * 0.68); c.closePath(); c.fill();
  };
  for (let index = 0; index < 9; index++) tree((index + 0.3) * (width / 9) + Math.sin(index * 7.3) * 14, 22 + (index * 37 % 13), index % 3 === 1);
  hut(width * 0.18, 30); hut(width * 0.63, 26);
  palm(width * 0.42, 34); palm(width * 0.86, 30);
  c.fillStyle = PAL.farDark; c.fillRect(0, base - 6, width, 6);
  scene.far = far.canvas; scene.farWidth = width;
}

function spawnDust(scene: Scene, x: number, y: number, color: string) {
  if (scene.slow) return;
  scene.dustColor = color;
  for (let index = 0; index < DUST; index++) {
    const at = index * 5, a = Math.PI * (0.15 + 0.7 * (index / (DUST - 1)));
    scene.dust[at] = x; scene.dust[at + 1] = y;
    scene.dust[at + 2] = Math.cos(a) * (1.2 + (index % 3) * 0.5); scene.dust[at + 3] = Math.sin(a) * (1.6 + (index % 4) * 0.4);
    scene.dust[at + 4] = 0.5 + (index % 5) * 0.08;
  }
}

/** Called once when a hit ends: the kids react, the cow looks up, dust or water flies. */
export function react(scene: Scene, shot: Shot) {
  const good = (shot.kind === "clean" && shot.distance >= 12) || shot.kind === "cow";
  scene.mood = good ? "cheer" : shot.kind === "clean" ? "idle" : "groan";
  scene.shout = shout(shot); scene.shoutTime = 1.9; scene.shoutWidth = 0;
  scene.cowAlert = shot.kind === "cow" ? 2.4 : 0;
  scene.coach = false;
  if (shot.kind === "pond") spawnDust(scene, shot.land, 0.05, PAL.waterLight);
  else if (shot.kind === "clean" || shot.kind === "cow") spawnDust(scene, shot.land, 0.05, PAL.mud);
}

/** A big, clean strike: a tiny shake (never in slow mode). */
export function strikeFeel(scene: Scene, shot: Shot) {
  if (!scene.slow && shot.quality > 0.88) scene.shake = 0.22;
}

/** Visual-only update at the fixed step: ball position, camera, particles and timers. */
export function updateScene(scene: Scene, game: Game, dt: number, slow: boolean) {
  scene.slow = slow;
  scene.clock += dt;
  scene.shake = Math.max(0, scene.shake - dt);
  scene.shoutTime = Math.max(0, scene.shoutTime - dt);
  scene.cowAlert = Math.max(0, scene.cowAlert - dt);
  const { phase, t, hit, field } = game;
  const shot = game.shots[hit];
  // The kids keep their last reaction until their shout fades, and watch while the কাঠি is up.
  if (phase === "aim") { scene.ball.x = 0.08; scene.ball.y = 0.04; scene.spin = -0.25; if (scene.shoutTime <= 0) scene.mood = "idle"; }
  else if (phase === "pop") { scene.ball.x = 0.08 + (BALL_X - 0.08) * Math.min(1, t * 5); scene.ball.y = Math.max(0.03, popY(field.pops[hit], t)); scene.spin = t * 13; scene.mood = "watch"; }
  else if (shot) {
    ballAt(shot, phase === "fly" || (phase === "rest" && shot.kind === "whiff") ? t : 99, scene.ball);
    if (phase === "fly" && t < shot.flyTime) scene.spin += dt * 16;
  }

  const flying = shot && phase !== "aim" && phase !== "pop" && shot.kind !== "ground" && shot.kind !== "whiff";
  const zoomTarget = flying && phase === "fly" ? Math.min(1, Math.max(0.5, (scene.ground - 34) / (Math.max(0.01, scene.ball.y) * scene.unit))) : 1;
  scene.zoom += (zoomTarget - scene.zoom) * (1 - Math.exp(-dt * 5));
  const visible = scene.w / (scene.unit * scene.zoom);
  // Side-scroller camera: it follows the কাঠি exactly once it passes the middle, and eases home for the next hit.
  if (flying) scene.camX = Math.max(scene.camX, HOME, scene.ball.x - visible * 0.5);
  else scene.camX += (HOME - scene.camX) * (1 - Math.exp(-dt * 4));

  for (let index = 0; index < DUST; index++) {
    const at = index * 5;
    if (scene.dust[at + 4] <= 0) continue;
    scene.dust[at] += scene.dust[at + 2] * dt; scene.dust[at + 1] += scene.dust[at + 3] * dt;
    scene.dust[at + 3] -= 9 * dt; scene.dust[at + 4] -= dt;
  }
}

function moodPose(mood: Mood): Pose {
  return mood === "cheer" ? "cheer" : mood === "groan" ? "groan" : mood === "watch" ? "watch" : "idle";
}

function bubble(context: CanvasRenderingContext2D, x: number, y: number, width: number, text: string, color: string) {
  context.fillStyle = "#fffdf6"; context.strokeStyle = PAL.ink; context.lineWidth = 2;
  context.beginPath(); context.roundRect(x - width / 2, y - 15, width, 28, 9); context.fill(); context.stroke();
  context.fillStyle = color; context.textAlign = "center"; context.fillText(text, x, y + 5);
}

export function drawScene(context: CanvasRenderingContext2D, scene: Scene, game: Game) {
  const { w, h, ground, camX: cam } = scene;
  const k = scene.unit * scene.zoom;
  const { phase, t, hit, field } = game;
  const shot = game.shots[hit];
  context.save();
  if (scene.shake > 0) context.translate(Math.sin(scene.clock * 83) * 3 * (scene.shake / 0.22), 0);
  if (scene.sky) context.drawImage(scene.sky, 0, 0, w, ground);
  if (scene.far) {
    const tile = scene.farWidth;
    const offset = scene.slow ? 0 : (((cam - HOME) * scene.unit * 0.25) % tile + tile) % tile;
    context.drawImage(scene.far, -offset, 0, tile, ground);
    context.drawImage(scene.far, tile - offset, 0, tile, ground);
  }

  context.fillStyle = PAL.grass; context.fillRect(-4, ground, w + 8, h - ground);
  context.fillStyle = PAL.grassLight;
  for (let strip = Math.floor(cam / 2); (strip * 2 - cam) * k < w; strip++) if ((strip & 1) === 0) context.fillRect((strip * 2 - cam) * k, ground, 2 * k, h - ground);
  context.fillStyle = PAL.grassDark; context.fillRect(-4, ground - 1, w + 8, 3);

  context.font = PEG_FONT; context.textAlign = "center";
  for (let peg = 1; peg < PEGS.length; peg++) {
    const x = (peg * 5 - cam) * k;
    if (x < -20 || x > w + 20) continue;
    context.fillStyle = "#f4ead0"; context.fillRect(x - 1.5, ground - 0.3 * k, 3, 0.3 * k + 3);
    context.fillStyle = "#ffffffd0"; context.fillText(PEGS[peg], x, ground + 17);
  }

  context.fillStyle = "#3a2a1a";
  context.beginPath(); context.ellipse((0.08 - cam) * k, ground + 1, 0.2 * k, 0.06 * k, 0, 0, Math.PI * 2); context.fill();

  const pondLeft = (field.pond.from - cam) * k, pondRight = (field.pond.to - cam) * k;
  if (pondRight > -20 && pondLeft < w + 20) drawPond(context, pondLeft, pondRight, ground, k);
  const cowX = (field.cow - cam) * k;
  if (cowX > -2 * k && cowX < w + 2 * k) drawCow(context, cowX, ground, k, scene.cowAlert > 0, scene.clock);
  if (scene.cowAlert > 0 && cowX > 0 && cowX < w) { context.font = SHOUT_FONT; bubble(context, cowX - 0.6 * k, ground - 1.9 * k, 64, "হাম্বা!", PAL.ink); }

  // Earlier hits stay marked with a small stake.
  const shown = phase === "rest" || phase === "over" ? hit + 1 : hit;
  for (let index = 0; index < shown; index++) {
    const earlier = game.shots[index];
    if (!earlier || index === hit || earlier.distance <= 0) continue;
    const x = (earlier.rest - cam) * k;
    if (x < -30 || x > w + 30) continue;
    context.fillStyle = PAL.stickDark; context.fillRect(x - 1.5, ground - 0.55 * k, 3, 0.55 * k);
    context.fillStyle = LOOKS[index].shirt; context.fillRect(x + 1.5, ground - 0.55 * k, 0.32 * k, 0.2 * k);
  }

  for (let index = 0; index < field.fielders.length; index++) {
    const fielder = field.fielders[index];
    let x = fielder.x, pose: Pose = "ready";
    if (shot && shot.kind === "caught" && shot.catcher === index && phase !== "aim" && phase !== "pop") {
      const u = phase === "fly" ? Math.min(1, Math.max(0, (t - 0.4) / Math.max(0.01, shot.flyTime - 0.4))) : 1;
      x = fielder.x + (shot.land + 0.35 - fielder.x) * u;
      pose = u < 1 ? "run" : "catch";
    }
    const sx = (x - cam) * k;
    if (sx > -k && sx < w + k) drawKid(context, sx, ground, k, LOOKS[3 + index], pose, scene.clock + index, -1);
  }

  const batterX = (BATTER_X - cam) * k;
  if (batterX > -2 * k) {
    if (phase === "aim" || phase === "pop") {
      const inBand = phase === "pop" && t > popTime(field.pops[hit]) / 2 && Math.abs(scene.ball.y - SWEET_Y) <= GOOD;
      context.fillStyle = inBand ? "#ffd166" : "#ffd166a8";
      context.strokeStyle = inBand ? "#b86e00" : "#ffffffd0"; context.lineWidth = 2;
      context.beginPath(); context.roundRect((-0.2 - cam) * k, ground - (SWEET_Y + GOOD) * k, 1.1 * k, 2 * GOOD * k, 8); context.fill(); context.stroke();
      context.fillStyle = inBand ? "#d98e04" : "#d98e0466";
      context.fillRect((-0.2 - cam) * k, ground - SWEET_Y * k - 1, 1.1 * k, 2);
    }
    let angle = FOLLOW;
    if (phase === "aim") angle = AIM;
    else if (phase === "pop") angle = t < 0.08 ? AIM - t * 5 : AIM + (BACK - AIM) * Math.min(1, (t - 0.08) / 0.22);
    else if (shot && shot.kind === "ground") angle = BACK;
    else if (shot && (phase === "fly" || (phase === "rest" && shot.kind === "whiff"))) {
      const u = Math.min(1, t / 0.16);
      angle = BACK - (BACK - FOLLOW) * (1 - (1 - u) * (1 - u));
    }
    drawBatter(context, batterX, ground, k, angle);
  }

  // A dotted trail makes the arc readable; it stays until the next flick.
  if (shot && shot.flyTime > 0 && (phase === "fly" || phase === "rest" || phase === "over")) {
    const until = phase === "fly" ? Math.min(t, shot.flyTime) : shot.flyTime;
    context.fillStyle = "#ffffffd9";
    for (let at = TRAIL_GAP; at < until; at += TRAIL_GAP) {
      ballAt(shot, at, trailPoint);
      context.beginPath(); context.arc((trailPoint.x - cam) * k, ground - trailPoint.y * k, 2.4, 0, Math.PI * 2); context.fill();
    }
  }

  if (scene.ball.y >= 0) {
    const caughtNow = shot && shot.kind === "caught" && phase !== "fly" && phase !== "aim" && phase !== "pop";
    drawBall(context, (scene.ball.x - cam) * k, ground - (caughtNow ? 0.95 : scene.ball.y) * k - (scene.ball.y < 0.06 ? 0.04 * k : 0), k, scene.spin);
  }
  else if (phase === "rest" && !scene.slow) {
    context.strokeStyle = "#e6f6ff"; context.lineWidth = 2;
    const r = (0.2 + t * 0.9) * k;
    context.globalAlpha = Math.max(0, 1 - t / 1.4);
    context.beginPath(); context.ellipse((scene.ball.x - cam) * k, ground + 0.08 * k, r, r * 0.25, 0, 0, Math.PI * 2); context.stroke();
    context.globalAlpha = 1;
  }

  for (let index = 0; index < DUST; index++) {
    const at = index * 5, life = scene.dust[at + 4];
    if (life <= 0) continue;
    context.globalAlpha = Math.min(1, life * 2);
    context.fillStyle = scene.dustColor;
    context.beginPath(); context.arc((scene.dust[at] - cam) * k, ground - scene.dust[at + 1] * k, 2.5, 0, Math.PI * 2); context.fill();
  }
  context.globalAlpha = 1;

  if (shot && (phase === "rest" || phase === "over") && shot.distance > 0) {
    const x = Math.min(w - 44, Math.max(44, (shot.rest - cam) * k));
    context.fillStyle = PAL.accent; context.fillRect((shot.rest - cam) * k - 1.5, ground - 0.7 * k, 3, 0.7 * k);
    context.font = LABEL_FONT;
    if (!labelWidths[shot.distance]) labelWidths[shot.distance] = context.measureText(LABELS[shot.distance]).width + 22;
    bubble(context, x, ground - 0.7 * k - 22, labelWidths[shot.distance], LABELS[shot.distance], PAL.accent);
  }
  context.restore();

  // Screen-space layer: the wind cloth, the kids on the side, the how-to.
  drawGamchha(context, 18, 12, field.winds[Math.min(hit, field.winds.length - 1)], scene.clock);
  context.font = SMALL_FONT; context.textAlign = "left"; context.fillStyle = PAL.ink;
  context.fillText("বাতাস", 10, 72);

  const pose = moodPose(scene.mood);
  for (let index = 0; index < 3; index++) drawKid(context, 20 + index * 28, h - 5, 23, LOOKS[index], pose, scene.clock + index * 0.37, 1);
  if (scene.shoutTime > 0 && scene.shout) {
    context.font = SHOUT_FONT;
    if (!scene.shoutWidth) scene.shoutWidth = context.measureText(scene.shout).width + 24;
    const x = Math.max(scene.shoutWidth / 2 + 6, 44);
    bubble(context, x, h - 74, scene.shoutWidth, scene.shout, scene.mood === "groan" ? PAL.ink : PAL.accent);
  }

  if (scene.coach && hit === 0 && (phase === "aim" || phase === "pop")) {
    const room = w - 70;
    if (!scene.coachFont) {
      let size = 15;
      for (; size > 11; size--) { context.font = `700 ${size}px ${DISPLAY_FONT}`; if (Math.max(context.measureText(COACH[0]).width, context.measureText(COACH[1]).width) + 24 <= room) break; }
      scene.coachFont = context.font;
      scene.coachWidth = Math.min(room, Math.max(context.measureText(COACH[0]).width, context.measureText(COACH[1]).width) + 28);
    }
    context.font = scene.coachFont; context.textAlign = "center";
    const top = 14, x = 60 + room / 2, lines = phase === "aim" ? 2 : 1;
    context.fillStyle = "#fffdf6e6"; context.strokeStyle = PAL.ink; context.lineWidth = 1.5;
    context.beginPath(); context.roundRect(x - scene.coachWidth / 2, top, scene.coachWidth, lines * 24 + 12, 12); context.fill(); context.stroke();
    context.fillStyle = PAL.ink;
    if (phase === "aim") { context.fillText(COACH[0], x, top + 26); context.fillText(COACH[1], x, top + 50); }
    else context.fillText(COACH[2], x, top + 26);
  }
}
