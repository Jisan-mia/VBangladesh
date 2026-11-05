// One frame of the road: it only stamps the sprites scene.ts painted, so a cheap phone keeps its frame rate.
// Runs every frame: no allocation, no closures, no string building (lint-games checks).
import { AHEAD, isOver, KID_X, MUD, PAGE, PUDDLE, SIGN, TAKEN, TIFFIN, TIRE, UNIT, W, ZONE_M } from "./course";
import { ARRIVED, END, LATE, pieceAt, READY, STOP, type Run } from "./game";
import { STRIP_H, STRIP_W, TILE, TILE_H, WORLD_ART } from "./art";
import { DROPS, POPS, PUFFS, RUN_FRAMES, type Scene, type Sprite } from "./scene";
import { enterIn, LEAD, POINTER_SPEED } from "./step.hot";

const PARALLAX = 0.3, STRIDE = 9;
/** Where a page flies to: its slot in the HUD's top-left corner (units). */
const SLOT_X = 22, SLOT_Y = 40;

function stamp(scene: Scene, image: Sprite, x: number, y: number, scaleX: number, scaleY: number) {
  const k = scene.k;
  scene.context.setTransform(k * scaleX, 0, 0, k * scaleY, x * k, y * k);
  scene.context.drawImage(image.canvas, -image.ox, -image.oy, image.w, image.h);
}

function strip(scene: Scene, which: number, from: number, to: number, farShift: number, groundShift: number) {
  const c = scene.context, far = scene.far[which % scene.far.length], ground = scene.ground[which % scene.ground.length];
  if (to <= from) return;
  c.save();
  c.beginPath(); c.rect(from, 0, to - from, scene.viewH); c.clip();
  // A hair of overlap hides the seams between tiles at fractional device pixels.
  for (let x = -farShift; x < W; x += STRIP_W) c.drawImage(far.canvas, x, scene.back - STRIP_H, STRIP_W + 0.6, STRIP_H);
  for (let x = -groundShift; x < W; x += TILE) c.drawImage(ground.canvas, x, scene.back - 4, TILE + 0.6, TILE_H);
  c.restore();
}

/** The strips behind the road: in the village and the rain, lane or field by zone, with a big tree hiding the seam. */
function backdrop(scene: Scene, d: number, slow: boolean) {
  const c = scene.context, k = scene.k;
  const farShift = slow ? 0 : (d * PARALLAX) % STRIP_W, groundShift = d % TILE;
  c.setTransform(k, 0, 0, k, 0, 0);
  c.fillStyle = WORLD_ART[scene.world].verge;
  c.fillRect(0, scene.back - 4 + TILE_H - 1, W, scene.viewH - scene.back - TILE_H + 6);
  if (scene.far.length < 2) { strip(scene, 0, 0, W, farShift, groundShift); return; }
  const meters = d / UNIT, zone = Math.floor(Math.max(0, meters) / ZONE_M) % 2;
  const seam = Math.ceil((d + 1) / (ZONE_M * UNIT)) * ZONE_M * UNIT - d;
  if (seam >= W) strip(scene, zone, 0, W, farShift, groundShift);
  else { strip(scene, zone, 0, seam, farShift, groundShift); strip(scene, 1 - zone, seam, W, farShift, groundShift); }
  if (seam < W + 60) stamp(scene, scene.tree, seam, scene.back + 1, 1, 1);
}

/** How far shut the school gate is (0 open, 1 shut): it starts to close in the bell's last 3 s, slams when you're late, swings shut behind you. */
function shut(run: Run) {
  if (run.endless) return 0;
  if (run.phase === END) {
    const age = run.t - run.endAt;
    if (run.endKind === ARRIVED) { if (age < 0.35) return 0; if (age > 0.85) return 1; const k = (age - 0.35) / 0.5; return k * k * (3 - 2 * k); }
    if (run.endKind === LATE) return age > 0.35 ? 1 : 0.55 + age / 0.35 * 0.45;
  }
  const left = run.bell - run.t;
  return left < 3 ? (3 - left) / 3 * 0.55 : 0;
}

function gate(scene: Scene, run: Run | null, d: number, gateM: number) {
  const x = gateM * UNIT + KID_X - d;
  if (x < -100 || x > W + 100) return;
  const ground = scene.back + 2;
  stamp(scene, scene.gateFrame, x, ground, 1, 1);
  const s = run ? shut(run) : 0, wide = 0.14 + 0.86 * s;
  stamp(scene, scene.gateLeaf, x - 48, ground, wide, 1);
  stamp(scene, scene.gateLeaf, x + 48, ground, -wide, 1);
  // The bell swings while it rings.
  const k = scene.k, ring = run && run.phase === END ? run.t - run.endAt : 9, swing = ring < 1 ? Math.sin(ring * 20) * 0.5 * (1 - ring) : 0;
  const cos = Math.cos(swing) * k, sin = Math.sin(swing) * k;
  scene.context.setTransform(cos, sin, -sin, cos, x * k, (ground - 120) * k);
  scene.context.drawImage(scene.bell.canvas, -scene.bell.ox, -scene.bell.oy + 6, scene.bell.w, scene.bell.h);
  if (run && !run.endless) stamp(scene, scene.guard, x + 70 - s * 6, ground, -1, 1);
}

function markers(scene: Scene, run: Run | null, d: number, gateM: number) {
  if (!run || run.endless) {
    const near = Math.floor(d / UNIT / 100) * 100;
    for (let meters = near; meters <= near + 100; meters += 100) {
      const x = meters * UNIT + KID_X - d;
      if (meters <= 0 || meters === gateM || x < -20 || x > W + 20) continue;
      stamp(scene, scene.milestone, x, scene.back + 2, 1, 1);
    }
  }
  gate(scene, run, d, gateM);
  if (scene.flag && scene.flagMeters > 0) {
    const x = scene.flagMeters * UNIT + KID_X - d, c = scene.context, k = scene.k;
    if (x > -40 && x < W + 60) {
      c.setTransform(k, 0, 0, k, 0, 0);
      c.strokeStyle = "#8a6a3a"; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(x, scene.back + 2); c.lineTo(x, scene.back - 52); c.stroke();
      c.fillStyle = "#ff7b54";
      c.beginPath(); c.moveTo(x, scene.back - 52); c.lineTo(x + 18, scene.back - 46); c.lineTo(x, scene.back - 40); c.closePath(); c.fill();
      stamp(scene, scene.flag, x, scene.back - 64, 1, 1);
    }
  }
}

function pieces(scene: Scene, run: Run) {
  const g = scene.groundY;
  for (let index = run.first; index < run.count; index++) {
    const piece = pieceAt(run, index), x = piece.x - run.d;
    if (x > W + 60) break;
    if (x + piece.w < -60 || piece.state === TAKEN || piece.w <= 0) continue;
    const cx = x + piece.w / 2;
    if (piece.kind === TIFFIN) stamp(scene, scene.tiffin, cx, g - piece.y + Math.sin(scene.clock * 4 + index) * 1.5, 1, 1);
    else if (piece.kind === PAGE) stamp(scene, scene.page, cx, g - piece.y + Math.sin(scene.clock * 3 + index) * 2, 1, 1);
    else if (piece.kind === PUDDLE) stamp(scene, scene.puddles[Math.min(3, Math.max(0, Math.round((piece.w - 44) / 6)))], cx, g, 1, 1);
    else if (piece.kind === MUD) stamp(scene, scene.muds[Math.min(3, Math.max(0, Math.round((piece.w - 84) / 8)))], cx, g, 1, 1);
    else if (piece.kind === SIGN) stamp(scene, scene.signs[Math.floor(Math.abs(piece.x) / 97) % scene.signs.length], cx, g, 1, 1);
    else if (piece.kind === TIRE) {
      // Rolling: the tyre turns as it travels (a hop and a wobble once it's bumped the kid).
      const sprite = scene.things[TIRE]!, k = scene.k, turn = piece.x / 9, cos = Math.cos(turn) * k, sin = Math.sin(turn) * k;
      scene.context.setTransform(cos, sin, -sin, cos, cx * k, (g - 10) * k);
      scene.context.drawImage(sprite.canvas, -sprite.ox, -sprite.oy, sprite.w, sprite.h);
    } else {
      const sprite = scene.things[piece.kind];
      if (sprite) stamp(scene, sprite, cx, g, 1, 1);
    }
  }
}

function kid(scene: Scene, run: Run | null) {
  const c = scene.context, k = scene.k, g = scene.groundY;
  const t = run ? run.t : scene.clock;
  let image = scene.kidRun[Math.floor((run ? run.d : scene.idle) / STRIDE) % RUN_FRAMES];
  let rise = 0, scaleY = 1;
  if (run) {
    rise = run.y;
    const down = run.t - run.stumbleAt < STOP + 0.15;
    if (run.phase === READY) image = scene.kidStand;
    else if (run.phase === END && run.endKind !== ARRIVED) image = run.endKind === LATE ? scene.kidStand : scene.kidSit;
    else if (down) image = scene.kidSit;
    else if (run.ducking) image = scene.kidDuck[Math.floor(run.d / (STRIDE * 3)) % 2];
    else if (run.air >= 0) image = run.vy > 0 ? scene.kidUp : scene.kidDown;
    // Stretch on takeoff and squash on landing ease out to nothing (never a snap back).
    const lift = t - scene.takeoffAt, drop = t - scene.landAt;
    if (run.air >= 0 && lift >= 0 && lift < 0.14) { const left = 1 - lift / 0.14; scaleY = 1 + 0.1 * left * left; }
    else if (run.air < 0 && drop >= 0 && drop < 0.16) { const left = 1 - drop / 0.16; scaleY = 1 - 0.14 * left * left; }
    c.globalAlpha = run.t < run.safeUntil && !down && Math.floor(run.t * 10) % 2 === 0 ? 0.45 : 1;
  }
  c.setTransform(k, 0, 0, k, 0, 0);
  c.fillStyle = "#3a2a1a26";
  c.beginPath(); c.ellipse(KID_X, g + 1, Math.max(5, 11 - rise * 0.06), 2.2, 0, 0, Math.PI * 2); c.fill();
  stamp(scene, image, KID_X, g - rise, 1, scaleY);
  c.globalAlpha = 1;
}

function juice(scene: Scene, run: Run, slow: boolean) {
  const c = scene.context, k = scene.k, t = run.t, g = scene.groundY;
  c.setTransform(k, 0, 0, k, 0, 0);
  if (!slow) {
    c.fillStyle = scene.world === 1 ? "#cfc8bd" : "#d9c3a0";
    for (let i = 0; i < PUFFS; i++) {
      const age = t - scene.puffT[i];
      if (age < 0 || age > 0.4) continue;
      c.globalAlpha = 0.7 * (1 - age / 0.4);
      c.beginPath(); c.arc(scene.puffX[i] - run.d, scene.puffY[i] - age * 10, scene.puffR[i] + age * 10, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = "#8fb2c9";
    for (let i = 0; i < DROPS; i++) {
      const age = t - scene.dropT[i];
      if (age < 0 || age > 0.5) continue;
      c.globalAlpha = 1 - age / 0.5;
      const x = scene.dropX[i] - run.d + scene.dropVX[i] * age, y = scene.dropY[i] - scene.dropVY[i] * age + 300 * age * age;
      c.beginPath(); c.arc(x, y, 1.8, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
  }
  // Pages fly up to their slot in the corner.
  for (let i = 0; i < 3; i++) {
    const age = t - scene.pageT[i];
    if (age < 0 || age > 0.55) continue;
    const p = age / 0.55, ease = 1 - (1 - p) * (1 - p);
    const x = scene.pageX[i] - run.d + (SLOT_X - (scene.pageX[i] - run.d)) * ease, y = scene.pageY[i] + (SLOT_Y - scene.pageY[i]) * ease - Math.sin(p * Math.PI) * 40;
    stamp(scene, scene.page, x, y, 1 - 0.4 * p, 1 - 0.4 * p);
  }
  // Words over the kid's head.
  for (let i = 0; i < POPS; i++) {
    const age = t - scene.popT[i], word = scene.popWord[i];
    if (age < 0 || age > 1 || word < 0) continue;
    c.globalAlpha = age < 0.7 ? 1 : 1 - (age - 0.7) / 0.3;
    const settle = age < 0.3 ? 1 - age / 0.3 : 0;
    stamp(scene, scene.words[word], KID_X + 16, g - run.y - 70 - (slow ? 0 : 24 * (1 - settle * settle)), 1, 1);
  }
  c.globalAlpha = 1;
}

/** Lessons over a level's new thing, and edge pointers for what's coming in fast from the right. */
function signals(scene: Scene, run: Run, slow: boolean) {
  const g = scene.groundY;
  for (let index = run.first; index < run.count; index++) {
    const piece = pieceAt(run, index), x = piece.x - run.d;
    if (x > W + 400) break;
    if (piece.state !== AHEAD || piece.w <= 0 || piece.kind === PAGE || piece.kind === TIFFIN) continue;
    const cx = x + piece.w / 2;
    if (piece.hint && cx > KID_X + 10 && cx < W - 30) stamp(scene, scene.hints[piece.hint], cx, isOver(piece.kind) ? g - 116 : g - 60, 1, 1);
    if (x <= W - 6 || (piece.vx <= 0 && run.nominal < POINTER_SPEED)) continue;
    const soon = enterIn(run, index);
    if (soon >= LEAD || soon < 0) continue;
    const chip = piece.kind === TIRE ? scene.chipTire : isOver(piece.kind) ? scene.chipDuck : scene.chipJump;
    scene.context.globalAlpha = slow ? 1 : 0.6 + 0.4 * Math.abs(Math.sin(run.t * 9));
    stamp(scene, chip, W - 16, isOver(piece.kind) ? g - 58 : g - 18, 1, 1);
    scene.context.globalAlpha = 1;
  }
}

function rain(scene: Scene, t: number) {
  const tile = scene.rain;
  if (!tile) return;
  const c = scene.context;
  c.setTransform(scene.k, 0, 0, scene.k, 0, 0);
  const ox = (t * 40) % 120, oy = (t * 260) % 120;
  for (let y = -120 + oy; y < scene.viewH; y += 120) for (let x = -120 + ox; x < W + 120; x += 120) c.drawImage(tile.canvas, x, y, 120, 120);
}

/** One frame. `run` is null behind the title (the kid runs in place on an empty road). */
export function drawFrame(scene: Scene, run: Run | null, slow: boolean, mile: Sprite | null, mileAt: number) {
  const c = scene.context, k = scene.k;
  const t = run ? run.t : scene.clock, d = run ? run.d : scene.idle;
  const shakeAge = t - scene.shakeAt, sx = !slow && run && shakeAge >= 0 && shakeAge < 0.28 ? Math.sin(shakeAge * 70) * 3 * (1 - shakeAge / 0.28) : 0;
  c.setTransform(k, 0, 0, k, sx * k, 0);
  c.drawImage(scene.sky.canvas, 0, 0, W, scene.back + 2);
  backdrop(scene, d, slow);
  markers(scene, run, d, run ? run.gateM : 1000);
  if (run) pieces(scene, run);
  kid(scene, run);
  if (!run) return;
  juice(scene, run, slow);
  if (run.phase !== END) signals(scene, run, slow);
  if (mile && t - mileAt >= 0 && t - mileAt < 1.2) {
    c.globalAlpha = t - mileAt < 0.9 ? 1 : 1 - (t - mileAt - 0.9) / 0.3;
    stamp(scene, mile, W / 2, scene.groundY - 170, 1, 1);
    c.globalAlpha = 1;
  }
  if (!slow) rain(scene, t);
}
