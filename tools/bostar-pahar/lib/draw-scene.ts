// Draws the play canvas: a river ghat seen from the side, the truck, the pile, and the crane's swinging sack. The camera rises with the pile.
// The hot path allocates nothing: sprites are painted once per size, strings are made once per landing.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import { LOAD_TOP, PAL, SACK_H, WORKERS, drawBank, drawCloud, drawGodown, drawLaunch, drawLoad, drawSack, drawTruckBack, drawTruckFront, drawWorker, type Pose } from "./art";
import { DROP_TIME, HALF_VIEW, LEAN_MAX, SLOW_DROP, swingX, type Game } from "./game";
import { shout } from "./result";

export type Mood = "idle" | "cheer" | "clap" | "point" | "laugh";
export type Scene = {
  w: number; h: number; ratio: number; u: number; sackH: number;
  /** `bedTop` is where the pile starts: on the row of sacks already in the truck bed (`floor`). */
  groundY: number; floor: number; bedTop: number; targetLine: number; rope: number;
  cam: number; zoom: number; viewTop: number; zoomT: number; settled: boolean;
  trolley: number; sway: number; swayV: number; squashT: number;
  shout: string; shoutT: number; shoutColor: string;
  mood: Mood; moodT: number; clock: number; slow: boolean;
  dust: Float32Array;
  ground: HTMLCanvasElement | null; front: HTMLCanvasElement | null; jib: HTMLCanvasElement | null; cloud: HTMLCanvasElement | null; glow: HTMLCanvasElement | null;
  sacks: HTMLCanvasElement[];
};

const PULLEY_Y = 30, JIB_H = 50;
const DUST = 14;
const ZOOM_TIME = 1.1;
/** Sack sprites carry room for their ears. */
const SPRITE_W = 1.3, SPRITE_H = 1.7;
const SKY_STOPS: [number, number, number, number][] = [[0, 0xcf, 0xe8, 0xf3], [600, 0xa6, 0xd4, 0xec], [2000, 0x82, 0xc0, 0xe5], [5000, 0x5f, 0xa8, 0xdc]];
const SKY = Array.from({ length: 41 }, (_, index) => {
  const altitude = index * 125;
  const at = SKY_STOPS.findIndex(stop => stop[0] >= altitude);
  const [a, b] = at <= 0 ? [SKY_STOPS[0], SKY_STOPS[0]] : [SKY_STOPS[at - 1], SKY_STOPS[at]];
  const k = b[0] === a[0] ? 0 : (altitude - a[0]) / (b[0] - a[0]);
  const mix = (i: number) => Math.round(a[i] + (b[i] - a[i]) * k).toString(16).padStart(2, "0");
  return `#${mix(1)}${mix(2)}${mix(3)}`;
});
const DASH = [5, 7], SOLID: number[] = [], SIDES = [-1, 1];
const SHOUT_FONT = `800 17px ${DISPLAY_FONT}`, COACH_FONT = `700 15px ${DISPLAY_FONT}`;
const COACH = "নিচের বস্তার ঠিক ওপরে এলেই চাপো";
const CLOUD_GAP = 130, FLOCK_GAP = 460;

export function makeScene(): Scene {
  return {
    w: 0, h: 0, ratio: 1, u: 1, sackH: 1, groundY: 0, floor: 0, bedTop: 0, targetLine: 0, rope: 1,
    cam: 0, zoom: 1, viewTop: 0, zoomT: 0, settled: false, trolley: 0, sway: 0, swayV: 0, squashT: 9,
    shout: "", shoutT: 9, shoutColor: PAL.accentDeep, mood: "idle", moodT: 0, clock: 0, slow: false,
    dust: new Float32Array(DUST * 5), ground: null, front: null, jib: null, cloud: null, glow: null, sacks: [],
  };
}

function offscreen(width: number, height: number, ratio: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * ratio)); canvas.height = Math.max(1, Math.round(height * ratio));
  const context = canvas.getContext("2d")!;
  context.scale(ratio, ratio);
  return { canvas, context };
}

export function resizeScene(scene: Scene, w: number, h: number, ratio: number) {
  scene.w = w; scene.h = h; scene.ratio = ratio;
  scene.u = w / (HALF_VIEW * 2);
  scene.sackH = scene.u * SACK_H;
  scene.groundY = h - 0.22 * scene.u;
  scene.floor = scene.groundY - 0.95 * scene.u;
  scene.bedTop = scene.floor - LOAD_TOP * scene.u;
  scene.targetLine = Math.round(h * 0.6);
  scene.rope = scene.targetLine - 1.7 * scene.sackH - PULLEY_Y;
  paint(scene);
}

/** Everything that never moves, painted once per size (and again once the Bangla fonts arrive). */
export function paint(scene: Scene) {
  const { w, h, ratio, u, sackH, groundY, floor } = scene;
  if (!w || !h) return;
  const cx = w / 2, bankY = h * 0.58, ghatTop = h * 0.8;
  const ground = offscreen(w, h, ratio), c = ground.context;
  // The evening glow over the far bank: a 1-pixel-wide strip, stretched as wide as the view needs.
  const glow = offscreen(1, bankY - h * 0.25 + 2, 1), gradient = glow.context.createLinearGradient(0, 0, 0, bankY - h * 0.25 + 2);
  gradient.addColorStop(0, "rgba(255,217,176,0)"); gradient.addColorStop(1, "rgba(255,217,176,0.75)");
  glow.context.fillStyle = gradient; glow.context.fillRect(0, 0, 1, bankY - h * 0.25 + 2);
  scene.glow = glow.canvas;
  c.fillStyle = "rgba(255,243,214,0.55)"; c.beginPath(); c.arc(w * 0.3, bankY - u * 0.55, u * 0.55, 0, Math.PI * 2); c.fill();
  c.fillStyle = PAL.sun; c.beginPath(); c.arc(w * 0.3, bankY - u * 0.55, u * 0.32, 0, Math.PI * 2); c.fill();
  drawBank(c, w, bankY - u * 0.2, u * 0.55);
  c.fillStyle = PAL.water; c.fillRect(0, bankY, w, ghatTop - bankY);
  c.fillStyle = PAL.waterLight;
  for (let row = 0; row < 5; row++) for (let x = (row * 37) % 60 - 20; x < w; x += 70) c.fillRect(x, bankY + 6 + row * ((ghatTop - bankY - 10) / 5), 26, 2);
  drawLaunch(c, w * 0.06, bankY + (ghatTop - bankY) * 0.55, w * 0.42);
  c.fillStyle = PAL.ghatDark; c.fillRect(0, ghatTop, w, h - ghatTop);
  for (let step = 0; step < 3; step++) { c.fillStyle = step % 2 ? PAL.ghat : PAL.ghatLight; c.fillRect(0, ghatTop + step * 4, w, 3); }
  c.fillStyle = PAL.ghat; c.fillRect(0, ghatTop + 12, w, h - ghatTop - 12);
  c.fillStyle = PAL.ghatDark;
  for (let x = 7; x < w; x += 23) c.fillRect(x, ghatTop + 18 + ((x * 13) % 40) * ((h - ghatTop - 24) / 40), 3, 2);
  drawGodown(c, -u * 0.2, u * 1.25, ghatTop + u * 0.25, ghatTop - u * 2.6, u);
  drawTruckBack(c, cx, floor, u);
  drawLoad(c, cx, floor, u);
  c.fillStyle = "rgba(40,30,20,0.25)"; c.beginPath(); c.ellipse(cx + 0.5 * u, groundY, 2.5 * u, 0.1 * u, 0, 0, Math.PI * 2); c.fill();
  scene.ground = ground.canvas;

  const front = offscreen(w, h, ratio);
  drawTruckFront(front.context, cx, floor, u);
  scene.front = front.canvas;

  // The jib across the top, with the operator's cabin where it meets the mast.
  const jib = offscreen(w, JIB_H, ratio), j = jib.context;
  j.strokeStyle = PAL.craneDark; j.lineWidth = 1.5; j.fillStyle = PAL.crane;
  j.fillRect(0, 2, w, 4); j.fillRect(0, 17, w, 4); j.strokeRect(0, 2, w, 4); j.strokeRect(0, 17, w, 4);
  j.strokeStyle = PAL.crane; j.lineWidth = 2.5;
  j.beginPath(); for (let x = 0; x < w; x += 16) { j.moveTo(x, 6); j.lineTo(x + 8, 17); j.lineTo(x + 16, 6); } j.stroke();
  const cabX = w - 0.78 * u;
  j.fillStyle = PAL.crane; j.fillRect(cabX, 21, 0.62 * u, 26); j.strokeStyle = PAL.craneDark; j.lineWidth = 1.5; j.strokeRect(cabX, 21, 0.62 * u, 26);
  j.fillStyle = PAL.glass; j.fillRect(cabX + 4, 25, 0.62 * u - 8, 12);
  j.fillStyle = PAL.skin; j.beginPath(); j.arc(cabX + 0.31 * u, 33, 4.5, 0, Math.PI * 2); j.fill();
  j.fillStyle = PAL.hair; j.beginPath(); j.arc(cabX + 0.31 * u, 32, 4.7, Math.PI * 1.05, Math.PI * 1.95); j.fill();
  scene.jib = jib.canvas;

  const cloud = offscreen(u * 2, u * 0.7, ratio);
  drawCloud(cloud.context, 0, u * 0.68, u * 2);
  scene.cloud = cloud.canvas;

  scene.sacks = [0, 1, 2].map(kind => {
    const sprite = offscreen(u * SPRITE_W, sackH * SPRITE_H, ratio);
    drawSack(sprite.context, (u * SPRITE_W) / 2, (sackH * SPRITE_H) / 2, u, sackH, kind);
    return sprite.canvas;
  });
}

/** The world y of the middle of the sack at height `index` in the pile (0 is the one on the truck). */
const sackY = (scene: Scene, index: number) => scene.bedTop - (index + 0.5) * scene.sackH;

function puff(scene: Scene, x: number, y: number, count: number, spread: number) {
  const dust = scene.dust;
  for (let made = 0, index = 0; index < DUST && made < count; index++) {
    if (dust[index * 5 + 4] > 0) continue;
    const side = made % 2 ? 1 : -1;
    dust[index * 5] = x + side * scene.u * 0.45; dust[index * 5 + 1] = y;
    dust[index * 5 + 2] = side * (20 + ((made * 37) % 30)) * spread; dust[index * 5 + 3] = -(10 + ((made * 53) % 25)) * spread;
    dust[index * 5 + 4] = 0.5;
    made++;
  }
}

/** A sack has just landed on the pile. */
export function onLand(scene: Scene, game: Game) {
  const verdict = game.verdict ?? "good";
  scene.shout = shout(verdict, game.combo);
  scene.shoutT = 0;
  scene.shoutColor = verdict === "perfect" ? PAL.accentDeep : verdict === "wide" ? "#a14a12" : PAL.ink;
  scene.squashT = 0;
  scene.mood = verdict === "perfect" ? "cheer" : verdict === "wide" ? "point" : "clap";
  scene.moodT = 0;
  if (scene.slow) return;
  scene.swayV += Math.max(-1, Math.min(1, game.offset)) * scene.u * 2.2;
  puff(scene, scene.w / 2 + game.xs[game.xs.length - 1] * scene.u, sackY(scene, game.xs.length - 1) + scene.sackH / 2, verdict === "perfect" ? 6 : 4, verdict === "perfect" ? 1.4 : 1);
}

/** The sack missed: it tips off the pile. */
export function onMiss(scene: Scene, game: Game) {
  scene.shout = shout(game.verdict ?? "slip", 0);
  scene.shoutT = 0;
  scene.shoutColor = "#a12a1f";
  scene.mood = "laugh"; scene.moodT = 0;
  if (!scene.slow) scene.swayV -= Math.sign(game.offset || 1) * scene.u * 1.2;
}

export function restartScene(scene: Scene) {
  scene.cam = 0; scene.zoom = 1; scene.viewTop = 0; scene.zoomT = 0; scene.settled = false;
  scene.sway = 0; scene.swayV = 0; scene.squashT = 9; scene.shoutT = 9; scene.mood = "idle"; scene.moodT = 0;
  scene.dust.fill(0);
}

export function updateScene(scene: Scene, game: Game, dt: number, slow: boolean) {
  scene.slow = slow;
  scene.clock += dt; scene.squashT += dt; scene.shoutT += dt; scene.moodT += dt;
  const cx = scene.w / 2, n = game.xs.length;
  if (game.phase !== "fall" && game.phase !== "over") {
    const goal = Math.max(0, scene.targetLine - (scene.bedTop - n * scene.sackH));
    scene.cam += (goal - scene.cam) * Math.min(1, dt * 6);
    scene.viewTop = -scene.cam;
  }
  const pivot = cx + game.pivot * scene.u;
  if (game.phase === "settle") scene.trolley += (pivot - scene.trolley) * Math.min(1, dt * 14);
  else if (game.phase !== "drop") scene.trolley = pivot;
  if (slow) { scene.sway = 0; scene.swayV = 0; }
  else { scene.swayV += (-70 * scene.sway - 5 * scene.swayV) * dt; scene.sway += scene.swayV * dt; }
  if (scene.mood !== "laugh" && scene.moodT > 1.1 && game.phase !== "over") scene.mood = "idle";
  const dust = scene.dust;
  for (let index = 0; index < DUST; index++) {
    const o = index * 5;
    if (dust[o + 4] <= 0) continue;
    dust[o + 4] -= dt; dust[o] += dust[o + 2] * dt; dust[o + 1] += dust[o + 3] * dt; dust[o + 3] += 40 * dt;
  }
  if (game.phase === "over" && !scene.settled) {
    // Pull back to show the whole pile, from the jib to the ghat.
    scene.zoomT = slow ? ZOOM_TIME : Math.min(ZOOM_TIME, scene.zoomT + dt);
    const k = scene.zoomT / ZOOM_TIME, ease = k * k * (3 - 2 * k);
    const fit = scene.h / (scene.h + scene.cam + 4);
    scene.zoom = 1 + (fit - 1) * ease;
    scene.viewTop = -scene.cam + (scene.h - scene.h / fit + scene.cam) * ease;
    if (k >= 1) { scene.settled = true; scene.mood = n - 1 >= 8 ? "cheer" : "laugh"; }
  }
}

function drawSprite(context: CanvasRenderingContext2D, scene: Scene, kind: number, x: number, y: number, stretchW = 1, stretchH = 1) {
  const sprite = scene.sacks[kind] ?? scene.sacks[0];
  if (!sprite) return;
  const width = scene.u * SPRITE_W * stretchW, height = scene.sackH * SPRITE_H * stretchH;
  context.drawImage(sprite, x - width / 2, y - height / 2, width, height);
}

function drawHook(context: CanvasRenderingContext2D, x: number, y: number) {
  context.fillStyle = PAL.steel; context.fillRect(x - 3, y - 6, 6, 6);
  context.strokeStyle = PAL.steel; context.lineWidth = 2.2;
  context.beginPath(); context.arc(x, y + 3, 3.5, -Math.PI / 2, Math.PI * 0.9); context.stroke();
}

export function drawScene(context: CanvasRenderingContext2D, scene: Scene, game: Game) {
  const { w, h, ratio, u, sackH, cam } = scene;
  if (!w || !scene.ground) return;
  const cx = w / 2, n = game.xs.length, phase = game.phase;

  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.fillStyle = SKY[Math.min(SKY.length - 1, Math.floor(cam / 125))];
  context.fillRect(0, 0, w, h);
  // Clouds drift past slower than the pile (no parallax or drift in slow mode).
  if (scene.cloud) {
    const lift = cam * (scene.slow ? 1 : 0.55), drift = scene.slow ? 0 : scene.clock * 5;
    const first = Math.max(0, Math.ceil((lift - h - 150) / CLOUD_GAP)), last = Math.floor((lift - 90) / CLOUD_GAP);
    for (let index = first; index <= last; index++) {
      const size = 0.7 + ((index * 7) % 5) * 0.12;
      const x = ((index * 151 + drift) % (w + 2.4 * u)) - 1.4 * u;
      context.drawImage(scene.cloud, x, -120 - index * CLOUD_GAP + lift, 2 * u * size, 0.7 * u * size);
    }
  }
  // Now and then a few birds cross the sky, higher up the pile.
  const flockLift = cam * (scene.slow ? 1 : 0.8);
  const firstFlock = Math.max(0, Math.ceil((flockLift - h - 300) / FLOCK_GAP)), lastFlock = Math.floor((flockLift - 200) / FLOCK_GAP);
  context.strokeStyle = "#41525b"; context.lineWidth = 1.8; context.lineCap = "round";
  for (let flock = firstFlock; flock <= lastFlock; flock++) {
    const way = flock % 2 ? -1 : 1, run = scene.slow ? flock * 97 : scene.clock * 16 + flock * 97;
    const fx = way > 0 ? (run % (w + 120)) - 60 : w + 60 - (run % (w + 120)), fy = -200 - flock * FLOCK_GAP + flockLift;
    context.beginPath();
    for (let bird = 0; bird < 3; bird++) {
      const bx = fx - way * bird * 16, by = fy + (bird % 2) * 9 - bird * 2, flap = scene.slow ? 2 : Math.sin(scene.clock * 9 + bird * 1.7) * 3;
      context.moveTo(bx - 7, by - flap); context.quadraticCurveTo(bx - 3, by - 3 - flap, bx, by); context.quadraticCurveTo(bx + 3, by - 3 - flap, bx + 7, by - flap);
    }
    context.stroke();
  }

  const zoom = scene.zoom, top = scene.viewTop;
  context.setTransform(ratio * zoom, 0, 0, ratio * zoom, ratio * cx * (1 - zoom), -ratio * top * zoom);
  const bottom = top + h / zoom;
  const jibY = -cam;
  const span = w / zoom;
  if (scene.glow) context.drawImage(scene.glow, cx - span, h * 0.25, span * 2, h * 0.33 + 2);
  if (zoom < 1) {
    // Beyond the painted ghat, when pulled back: river and ghat run on to the sides.
    context.fillStyle = PAL.bankDark; context.fillRect(cx - span, h * 0.58 - u * 0.3, span * 2, u * 0.4);
    context.fillStyle = PAL.water; context.fillRect(cx - span, h * 0.58, span * 2, h * 0.22);
    context.fillStyle = PAL.ghatLight; context.fillRect(cx - span, h * 0.8, span * 2, 3);
    context.fillStyle = PAL.ghatDark; context.fillRect(cx - span, h * 0.8 + 3, span * 2, 9);
    context.fillStyle = PAL.ghat; context.fillRect(cx - span, h * 0.8 + 12, span * 2, h * 0.2);
  }
  context.drawImage(scene.ground, 0, 0, w, h);

  // The crane's mast, from the jib down to the ghat.
  const mast = w - 0.3 * u, mastTop = Math.max(jibY + 20, top - 20), mastBottom = Math.min(scene.groundY - 0.3 * u, bottom);
  if (mastBottom > mastTop) {
    context.strokeStyle = PAL.crane; context.lineWidth = 2.5;
    context.beginPath();
    context.moveTo(mast - 0.14 * u, mastTop); context.lineTo(mast - 0.14 * u, mastBottom);
    context.moveTo(mast + 0.14 * u, mastTop); context.lineTo(mast + 0.14 * u, mastBottom);
    const stride = 0.4 * u;
    for (let y = mastBottom - ((mastBottom - jibY) % stride); y > mastTop; y -= stride) { context.moveTo(mast - 0.14 * u, y); context.lineTo(mast + 0.14 * u, y - stride / 2); context.lineTo(mast - 0.14 * u, y - stride); }
    context.stroke();
  }

  // The ওলন: a plumb line over the bottom sack, and dashed limits one sack width either side.
  const lean = game.xs[n - 1] - game.xs[0], danger = Math.abs(lean) > 0.55;
  const lineTop = jibY + JIB_H - 4, lineBottom = sackY(scene, 0) - sackH / 2;
  context.lineWidth = 1.5; context.setLineDash(DASH);
  for (const side of SIDES) {
    const hot = danger && Math.sign(lean) === side;
    context.strokeStyle = hot ? "#d4561f" : "rgba(255,255,255,0.75)"; context.lineWidth = hot ? 2.5 : 1.5;
    context.beginPath(); context.moveTo(cx + side * LEAN_MAX * u, lineTop); context.lineTo(cx + side * LEAN_MAX * u, lineBottom); context.stroke();
  }
  context.strokeStyle = "rgba(59,47,34,0.45)"; context.lineWidth = 1;
  context.beginPath(); context.moveTo(cx, lineTop + 30); context.lineTo(cx, lineBottom); context.stroke();
  context.setLineDash(SOLID);
  context.strokeStyle = PAL.plumb; context.beginPath(); context.moveTo(cx, jibY + 20); context.lineTo(cx, lineTop + 22); context.stroke();
  context.fillStyle = PAL.brass; context.beginPath(); context.moveTo(cx - 5, lineTop + 22); context.lineTo(cx + 5, lineTop + 22); context.lineTo(cx, lineTop + 32); context.closePath(); context.fill();

  // The pile, bottom to top, leaning a little with the sway.
  const wobble = !scene.slow && danger ? Math.sin(scene.clock * 4) * (Math.abs(lean) - 0.55) * 0.14 * u : 0;
  const first = Math.max(0, Math.floor((scene.bedTop - bottom) / sackH) - 1), last = Math.min(n - 1, Math.ceil((scene.bedTop - top) / sackH));
  for (let index = first; index <= last; index++) {
    const share = n > 1 ? index / (n - 1) : 0;
    const x = cx + game.xs[index] * u + (scene.sway + wobble) * share;
    if (index === n - 1 && scene.squashT < 0.22 && !scene.slow && phase !== "ready") {
      const k = Math.sin((Math.PI * scene.squashT) / 0.22) * 0.16;
      drawSprite(context, scene, game.kinds[index], x, sackY(scene, index) + (sackH * k) / 2, 1 + k * 0.6, 1 - k);
    } else drawSprite(context, scene, game.kinds[index], x, sackY(scene, index));
  }

  if (phase === "fall") {
    // The missed sack tips off the side it hung over and fades as it drops away.
    const tau = game.timer, side = Math.sign(game.verdict === "lean" ? game.dropX - game.xs[0] : game.offset) || 1;
    const tip = Math.min(1, tau / 0.25), away = Math.max(0, tau - 0.25), drop = Math.max(0, tau - 0.15);
    context.save();
    context.globalAlpha = Math.max(0, 1 - Math.max(0, tau - 0.45) / 0.4);
    context.translate(cx + game.dropX * u + side * (0.22 * tip + 1.1 * away) * u, sackY(scene, n) + 1200 * drop * drop);
    context.rotate(side * (0.55 * tip + 2.4 * away));
    drawSprite(context, scene, game.swing.kind, 0, 0);
    context.restore();
  }

  context.drawImage(scene.front!, 0, 0, w, h);

  if (bottom > scene.groundY - 1.6 * u) {
    const mood = scene.mood, t = scene.clock;
    const poseA: Pose = mood === "idle" ? "count" : mood === "point" ? "clap" : mood;
    const poseB: Pose = mood === "idle" ? (phase === "ready" ? "point" : "idle") : mood;
    drawWorker(context, 0.42 * u, scene.groundY - 0.05 * u, 1.3 * u, WORKERS[1], poseA, t, 1);
    drawWorker(context, 1.05 * u, scene.groundY, 1.36 * u, WORKERS[0], poseB, t + 0.4, 1);
  }

  // Rope, hook and the hanging sack.
  const pulleyX = scene.trolley, pulleyY = jibY + PULLEY_Y;
  context.strokeStyle = PAL.rope; context.lineWidth = 2;
  if (phase === "ready" || phase === "swing" || phase === "drop") {
    const free = phase === "drop";
    const x = cx + (free ? game.dropX : swingX(game)) * u;
    const lower = phase === "swing" ? Math.min(1, game.t / 0.2) : 1;
    const length = scene.rope * (0.8 + 0.2 * lower * (2 - lower));
    const reach = Math.max(-0.95, Math.min(0.95, (x - pulleyX) / length));
    const angle = Math.asin(reach), along = length - sackH / 2 - 0.3 * u;
    const hangY = pulleyY + Math.cos(angle) * length;
    if (!free) {
      const hx = pulleyX + reach * along, hy = pulleyY + Math.cos(angle) * along;
      context.beginPath(); context.moveTo(pulleyX, pulleyY); context.lineTo(hx, hy); context.stroke();
      context.save(); context.translate(x, hangY); context.rotate(-angle);
      context.strokeStyle = PAL.rope; context.lineWidth = 1.5;
      context.beginPath(); context.moveTo(-0.34 * u, -sackH * 0.42); context.lineTo(0, -sackH / 2 - 0.3 * u); context.lineTo(0.34 * u, -sackH * 0.42); context.stroke();
      drawSprite(context, scene, game.swing.kind, 0, 0);
      context.restore();
      drawHook(context, hx, hy);
    } else {
      const tau = Math.min(1, game.timer / (scene.slow ? SLOW_DROP : DROP_TIME));
      const y = hangY + (sackY(scene, n) - hangY) * tau * tau;
      context.save(); context.translate(x, y); context.rotate(-angle * (1 - Math.min(1, tau * 2)));
      drawSprite(context, scene, game.swing.kind, 0, 0);
      context.restore();
      // The empty hook springs back up under the pulley.
      const hx = pulleyX + (x - pulleyX) * (1 - tau) * 0.6, hy = pulleyY + 0.5 * u + (along - 0.5 * u) * (1 - tau) * 0.7;
      context.strokeStyle = PAL.rope; context.lineWidth = 2;
      context.beginPath(); context.moveTo(pulleyX, pulleyY); context.lineTo(hx, hy); context.stroke();
      drawHook(context, hx, hy);
    }
  } else {
    context.beginPath(); context.moveTo(pulleyX, pulleyY); context.lineTo(pulleyX, pulleyY + 0.5 * u); context.stroke();
    drawHook(context, pulleyX, pulleyY + 0.5 * u);
  }

  context.drawImage(scene.jib!, 0, jibY, w, JIB_H);
  context.fillStyle = PAL.steel; context.fillRect(pulleyX - 9, jibY + 18, 18, 7);
  context.fillStyle = PAL.ink; context.beginPath(); context.arc(pulleyX, pulleyY - 1, 4, 0, Math.PI * 2); context.fill();

  const dust = scene.dust;
  context.fillStyle = "rgba(200,180,140,0.7)";
  for (let index = 0; index < DUST; index++) {
    const o = index * 5;
    if (dust[o + 4] <= 0) continue;
    context.globalAlpha = Math.min(1, dust[o + 4] * 2);
    context.beginPath(); context.arc(dust[o], dust[o + 1], 2 + (0.5 - dust[o + 4]) * 6, 0, Math.PI * 2); context.fill();
  }
  context.globalAlpha = 1;

  if (scene.shoutT < 0.9 && scene.shout) {
    const rise = scene.slow ? 0 : scene.shoutT * 28;
    const sx = Math.max(70, Math.min(w - 70, cx + game.xs[n - 1] * u));
    const sy = sackY(scene, n - 1) - sackH * 1.1 - rise;
    context.globalAlpha = Math.min(1, (0.9 - scene.shoutT) * 4);
    context.font = SHOUT_FONT; context.textAlign = "center";
    context.lineWidth = 4; context.strokeStyle = "rgba(255,255,255,0.9)"; context.lineJoin = "round";
    context.strokeText(scene.shout, sx, sy);
    context.fillStyle = scene.shoutColor; context.fillText(scene.shout, sx, sy);
    context.globalAlpha = 1;
  }

  if (phase === "ready") {
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.font = COACH_FONT; context.textAlign = "center";
    const boxW = Math.min(w - 24, context.measureText(COACH).width + 28), boxY = scene.targetLine - 0.75 * sackH;
    context.fillStyle = "rgba(31,42,38,0.82)";
    context.beginPath(); context.roundRect(cx - boxW / 2, boxY, boxW, 32, 16); context.fill();
    context.fillStyle = "#ffffff"; context.fillText(COACH, cx, boxY + 21);
  }
}
