// Moves and draws the play canvas every frame: a river ghat seen from the side, the truck, the swaying pile, the crane's
// swinging sack, and the world's weather. No allocation here: layers come pre-rendered from scene.ts, strings are made on
// landings (scene.ts onLand), and the dash patterns live at module scope.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import { PAL, WORKERS, drawLantern, drawWorker, type Pose } from "./art";
import { DANGER, DROP_TIME, END_TIME, isDark, pivotOf, SLOW, swingX, type Game } from "./rules";
import { DUST, JIB_H, PULLEY_Y, sackY, SPRITE_H, SPRITE_W, STREAKS, type Scene } from "./scene";

const ZOOM_TIME = 1.1;
const DASH = [5, 7], SOLID: number[] = [];
const SHOUT_FONT = `800 17px ${DISPLAY_FONT}`, COACH_FONT = `700 15px ${DISPLAY_FONT}`;
const COACH = "নিচের বস্তার ঠিক ওপরে এলেই চাপো";
const CLOUD_GAP = 130, FLOCK_GAP = 460;

export function updateScene(scene: Scene, game: Game, dt: number, slow: boolean) {
  scene.slow = slow;
  const h = slow ? dt * SLOW : dt;
  scene.clock += h; scene.squashT += h; scene.shoutT += h; scene.moodT += h; scene.ringT += h; scene.gustT += h; scene.splashT += h;
  const cx = scene.w / 2, n = game.n, ending = game.phase === "end" || game.phase === "over";
  if (game.phase === "end") scene.endT += h;
  if (!ending || game.end === "clear") {
    const goal = Math.max(0, scene.targetLine - (scene.bedTop - n * scene.sackH));
    scene.cam += (goal - scene.cam) * Math.min(1, dt * 6);
    scene.viewTop = -scene.cam;
  }
  const pivot = cx + pivotOf(game) * scene.u;
  if (game.phase === "settle" || game.phase === "fall") scene.trolley += (pivot - scene.trolley) * Math.min(1, dt * 14);
  else if (game.phase !== "drop") scene.trolley = pivot;
  if (scene.mood !== "laugh" && scene.moodT > 1.1 && !ending) scene.mood = "idle";
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
    if (k >= 1) { scene.settled = true; scene.mood = game.end === "clear" || n - 1 >= 8 ? "cheer" : "laugh"; }
  }
}

function drawSprite(context: CanvasRenderingContext2D, scene: Scene, kind: number, x: number, y: number, stretchW: number, stretchH: number) {
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

/** The sky: altitude colour, clouds drifting slower than the pile, and now and then a few birds (no drift in slow mode). */
function drawSky(context: CanvasRenderingContext2D, scene: Scene, cam: number) {
  const { w, h, u } = scene;
  context.fillStyle = scene.sky[Math.min(scene.sky.length - 1, Math.floor(cam / 125))];
  context.fillRect(0, 0, w, h);
  if (scene.cloud) {
    const lift = cam * (scene.slow ? 1 : 0.55), drift = scene.slow ? 0 : scene.clock * (scene.gusty ? 14 : 5);
    const first = Math.max(0, Math.ceil((lift - h - 150) / CLOUD_GAP)), last = Math.floor((lift - 90) / CLOUD_GAP);
    for (let index = first; index <= last; index++) {
      const size = 0.7 + ((index * 7) % 5) * 0.12;
      const x = ((index * 151 + drift) % (w + 2.4 * u)) - 1.4 * u;
      context.drawImage(scene.cloud, x, -120 - index * CLOUD_GAP + lift, 2 * u * size, 0.7 * u * size);
    }
  }
  if (scene.night) return;
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
}

export function drawFrame(context: CanvasRenderingContext2D, scene: Scene, game: Game) {
  const { w, h, ratio, u, sackH, cam } = scene;
  if (!w || !scene.ground) return;
  const cx = w / 2, n = game.n, phase = game.phase, ended = phase === "end" || phase === "over";

  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawSky(context, scene, cam);

  const zoom = scene.zoom, top = scene.viewTop;
  context.setTransform(ratio * zoom, 0, 0, ratio * zoom, ratio * cx * (1 - zoom), -ratio * top * zoom);
  const bottom = top + h / zoom, jibY = -cam, span = w / zoom;
  if (scene.glow) context.drawImage(scene.glow, cx - span, h * 0.25, span * 2, h * 0.33 + 2);
  if (zoom < 1) {
    // Beyond the painted ghat, when pulled back: the sky colour, the river and the ghat run on to the sides.
    context.fillStyle = scene.sky[0]; context.fillRect(cx - span, top, span * 2, h * 0.58 - top);
    context.fillStyle = PAL.ghatDark; context.fillRect(cx - span, h * 0.8, span * 2, h * 0.2 + 2);
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

  // The truck drives off at a clear; the pontoon rocks it.
  const roll = Math.min(1, scene.endT / END_TIME.clear), drive = game.end === "clear" && ended ? roll * roll * (3 - 2 * roll) * 0.9 * u : 0;
  const truckPx = game.truckX * u + drive;

  // The ওলন: a plumb line over the bottom sack, and dashed limits either side (red on the side the pile strains toward).
  const tension = n > 1 ? game.xs[n - 1] - game.xs[0] + game.sway : 0, strain = Math.abs(tension) / game.limit, danger = strain > DANGER && !ended;
  const lineTop = jibY + JIB_H - 4, lineBottom = sackY(scene, 0) - sackH / 2, plumb = cx + game.xs[0] * u + truckPx;
  context.setLineDash(DASH);
  for (let side = -1; side <= 1; side += 2) {
    const hot = danger && Math.sign(tension) === side;
    context.strokeStyle = hot ? "#e0452c" : scene.night ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.75)"; context.lineWidth = hot ? 2.5 : 1.5;
    context.beginPath(); context.moveTo(plumb + side * game.limit * u, lineTop); context.lineTo(plumb + side * game.limit * u, lineBottom); context.stroke();
  }
  context.strokeStyle = scene.night ? "rgba(255,255,255,0.3)" : "rgba(59,47,34,0.45)"; context.lineWidth = 1;
  context.beginPath(); context.moveTo(plumb, lineTop + 30); context.lineTo(plumb, lineBottom); context.stroke();
  context.setLineDash(SOLID);
  context.strokeStyle = PAL.plumb; context.beginPath(); context.moveTo(cx, jibY + 20); context.lineTo(cx, lineTop + 22); context.stroke();
  context.fillStyle = PAL.brass; context.beginPath(); context.moveTo(cx - 5, lineTop + 22); context.lineTo(cx + 5, lineTop + 22); context.lineTo(cx, lineTop + 32); context.closePath(); context.fill();

  if (scene.truck) context.drawImage(scene.truck, truckPx, 0, w, h);

  // The pile, bottom to top, sheared by the sway; trembling when strained; toppling about its bottom corner at the end.
  const wobble = !scene.slow && danger && !ended ? Math.sin(scene.clock * (14 + 10 * strain)) * (strain - DANGER) * 0.12 * u : 0;
  const toppling = game.end === "topple" && ended;
  const fallSide = tension >= 0 ? 1 : -1;
  const tip = toppling ? Math.min(1.5, Math.pow(scene.endT / END_TIME.topple, 2) * 1.9) : 0;
  const pivotX = cx + game.xs[0] * u + truckPx + fallSide * 0.5 * u, pivotY = sackY(scene, 0) + sackH / 2;
  // The bottom sack stays on the truck whatever happens above it.
  drawSprite(context, scene, game.kinds[0], cx + game.xs[0] * u + truckPx, sackY(scene, 0), 1, 1);
  if (toppling) { context.save(); context.translate(pivotX, pivotY); context.rotate(fallSide * tip); context.translate(-pivotX, -pivotY + scene.endT * scene.endT * 60); }
  const first = toppling ? 1 : Math.max(1, Math.floor((scene.bedTop - bottom) / sackH) - 1), last = Math.min(n - 1, Math.ceil((scene.bedTop - top) / sackH) + 2);
  for (let index = first; index <= last; index++) {
    const share = n > 1 ? index / (n - 1) : 0;
    const x = cx + game.xs[index] * u + truckPx + (game.sway * u + wobble) * share;
    if (index === n - 1 && scene.squashT < 0.22 && !scene.slow && phase !== "ready") {
      const k = Math.sin((Math.PI * scene.squashT) / 0.22) * 0.16;
      drawSprite(context, scene, game.kinds[index], x, sackY(scene, index) + (sackH * k) / 2, 1 + k * 0.6, 1 - k);
    } else drawSprite(context, scene, game.kinds[index], x, sackY(scene, index), 1, 1);
  }
  if (toppling) context.restore();

  // A ঠিক মাঝে ring: a gold halo that opens round the sack that just landed.
  if (scene.ringT < 0.45 && !scene.slow) {
    const k = scene.ringT / 0.45;
    context.globalAlpha = 1 - k; context.strokeStyle = "#ffd166"; context.lineWidth = 3;
    context.beginPath(); context.ellipse(cx + (scene.ringX + game.sway) * u + truckPx, sackY(scene, n - 1), u * (0.6 + k * 0.6), sackH * (0.6 + k * 0.7), 0, 0, Math.PI * 2); context.stroke();
    context.globalAlpha = 1;
  }

  if (phase === "fall") {
    // The missed sack tips off the side it hung over and drops into the river.
    const tau = game.timer, side = Math.sign(game.offset) || 1;
    const tipK = Math.min(1, tau / 0.25), away = Math.max(0, tau - 0.25), drop = Math.max(0, tau - 0.15);
    context.save();
    context.globalAlpha = Math.max(0, 1 - Math.max(0, tau - 0.5) / 0.35);
    context.translate(cx + game.dropX * u + side * (0.22 * tipK + 1.1 * away) * u, sackY(scene, n) + 1200 * drop * drop);
    context.rotate(side * (0.55 * tipK + 2.4 * away));
    drawSprite(context, scene, game.swing.kind, 0, 0, 1, 1);
    context.restore();
  }
  if (scene.splashT > 0 && scene.splashT < 0.6 && !scene.slow) {
    // White drops where the sack hit the water.
    const k = scene.splashT / 0.6, sx = cx + scene.splashX * u, sy = h * 0.86;
    context.fillStyle = "rgba(255,255,255,0.85)"; context.globalAlpha = 1 - k;
    for (let drop = 0; drop < 6; drop++) {
      const a = -Math.PI * (0.15 + drop * 0.14), r = u * (0.2 + k * 0.7);
      context.beginPath(); context.arc(sx + Math.cos(a) * r, sy + Math.sin(a) * r * 1.4 + k * k * u, 2.5, 0, Math.PI * 2); context.fill();
    }
    context.globalAlpha = 1;
  }

  if (scene.front) context.drawImage(scene.front, truckPx, 0, w, h);

  if (bottom > scene.groundY - 1.6 * u) {
    const mood = scene.mood, t = scene.slow ? 0 : scene.clock;
    const poseA: Pose = mood === "idle" ? "count" : mood === "point" ? "clap" : mood;
    const poseB: Pose = mood === "idle" ? (phase === "ready" ? "point" : "idle") : mood;
    drawWorker(context, 0.42 * u, scene.groundY - 0.05 * u, 1.3 * u, WORKERS[1], poseA, t, 1);
    drawWorker(context, 1.05 * u, scene.groundY, 1.36 * u, WORKERS[0], poseB, t + 0.4, 1);
  }

  // Rope, hook and the hanging sack (with a lantern on the hook at night).
  const pulleyX = scene.trolley, pulleyY = jibY + PULLEY_Y;
  let lampX = pulleyX, lampY = pulleyY + 0.5 * u;
  context.strokeStyle = scene.night ? "#c9b48e" : PAL.rope; context.lineWidth = 2;
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
      context.lineWidth = 1.5;
      context.beginPath(); context.moveTo(-0.34 * u, -sackH * 0.42); context.lineTo(0, -sackH / 2 - 0.3 * u); context.lineTo(0.34 * u, -sackH * 0.42); context.stroke();
      drawSprite(context, scene, game.swing.kind, 0, 0, 1, 1);
      context.restore();
      drawHook(context, hx, hy);
      lampX = hx; lampY = hy;
    } else {
      const tau = Math.min(1, game.timer / DROP_TIME);
      const y = hangY + (sackY(scene, n) - hangY) * tau * tau;
      context.save(); context.translate(x, y); context.rotate(-angle * (1 - Math.min(1, tau * 2)));
      drawSprite(context, scene, game.swing.kind, 0, 0, 1, 1);
      context.restore();
      // The empty hook springs back up under the pulley.
      const hx = pulleyX + (x - pulleyX) * (1 - tau) * 0.6, hy = pulleyY + 0.5 * u + (along - 0.5 * u) * (1 - tau) * 0.7;
      context.lineWidth = 2;
      context.beginPath(); context.moveTo(pulleyX, pulleyY); context.lineTo(hx, hy); context.stroke();
      drawHook(context, hx, hy);
      lampX = x; lampY = y - sackH * 0.6;
    }
  } else {
    context.beginPath(); context.moveTo(pulleyX, pulleyY); context.lineTo(pulleyX, pulleyY + 0.5 * u); context.stroke();
    drawHook(context, pulleyX, pulleyY + 0.5 * u);
  }
  if (scene.night) drawLantern(context, lampX + 0.42 * u, lampY + 0.32 * u, 0.32 * u);

  if (scene.jib) context.drawImage(scene.jib, 0, jibY, w, JIB_H);
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
    const sx = Math.max(70, Math.min(w - 70, cx + (game.xs[n - 1] + game.sway) * u + truckPx));
    const sy = sackY(scene, n - 1) - sackH * 1.1 - rise;
    context.globalAlpha = Math.min(1, (0.9 - scene.shoutT) * 4);
    context.font = SHOUT_FONT; context.textAlign = "center";
    context.lineWidth = 4; context.strokeStyle = scene.night ? "rgba(10,16,40,0.9)" : "rgba(255,255,255,0.9)"; context.lineJoin = "round";
    context.strokeText(scene.shout, sx, sy);
    context.fillStyle = scene.shoutColor; context.fillText(scene.shout, sx, sy);
    context.globalAlpha = 1;
  }

  // Screen space from here: lights out, the wind and the rain, the first-sack coach.
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (isDark(game) && scene.shade && !ended) {
    const lx = (lampX - cx) * zoom + cx, ly = (lampY - top) * zoom;
    context.drawImage(scene.shade, lx - w, ly - h, w * 2, h * 2);
  }
  const windy = scene.gusty && !scene.slow && (scene.gustT < 0.6 || scene.rain);
  if (windy) {
    const streaks = scene.streaks, push = scene.gustT < 0.6 ? 1 - scene.gustT / 0.6 : 0.35;
    context.strokeStyle = scene.rain ? "rgba(200,220,255,0.55)" : "rgba(255,255,255,0.6)"; context.lineWidth = scene.rain ? 1.2 : 1.5;
    context.beginPath();
    for (let index = 0; index < STREAKS; index++) {
      const o = index * 3, speed = streaks[o + 2];
      const x = ((streaks[o] * w + scene.clock * speed * 420 * scene.gustSide) % w + w) % w, y = ((streaks[o + 1] * h + (scene.rain ? scene.clock * 520 * speed : 0)) % h + h) % h;
      const len = (scene.rain ? 10 : 24) * speed * (0.4 + push);
      context.moveTo(x, y); context.lineTo(x - scene.gustSide * len, y - (scene.rain ? len * 1.6 : 0));
    }
    context.stroke();
  }

  if (phase === "ready" && game.level === 1 && game.kind === "level") {
    context.font = COACH_FONT; context.textAlign = "center";
    const boxW = Math.min(w - 24, context.measureText(COACH).width + 28), boxY = scene.targetLine - 0.75 * sackH;
    context.fillStyle = "rgba(31,42,38,0.82)";
    context.beginPath(); context.roundRect(cx - boxW / 2, boxY, boxW, 32, 16); context.fill();
    context.fillStyle = "#ffffff"; context.fillText(COACH, cx, boxY + 21);
  }
}
