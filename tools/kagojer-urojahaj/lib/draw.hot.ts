// One frame: the sky and the slow backdrop, the floor, the wind you can see (streaks that move the way the air pushes),
// benches, fans, roofs, boats, kites and herons, the landing place with its red ring, the candies, the plane and its trail,
// sparks, the danger glow at the edge, and the HUD in the corners. Allocation-free (npm run lint:games): no literals,
// closures or string building in here; every sprite and string comes from layers.ts.
import { DOWN, EV, LANDED, type Game } from "./flight";
import { A, BIRD, FLOOR, RECT, STREET, STRING, WATER, WIND, WINDF, padX } from "./physics";
import { birdX, birdY, kiteX, kiteY, tailX, windLevel } from "./step.hot";
import { FONT_HUD, FONT_POP, FONT_SMALL, FRACTIONS, METERS, PLANE_LEN, PLUS, POPUPS, SPARKS, TRAIL, CANDY_SIZE, KITE_SIZE, BIRD_SIZE, type Scene, type Sprite } from "./layers";

const TAU = Math.PI * 2;
const SPARK_COLOURS = ["#ffb43c", "#fbfaf3", "#e9e2cf", "#bfe3ff", "#ff6b6b"];

function noise(scene: Scene) {
  scene.noise = (Math.imul(scene.noise, 1103515245) + 12345) >>> 0;
  return (scene.noise >>> 8) / 16777216;
}
const frac = (value: number) => value - Math.floor(value);

/** Units on screen: x from the camera, y down from the top. */
function units(scene: Scene) { const r = scene.ratio * scene.k; scene.context.setTransform(r, 0, 0, r, 0, 0); }
function sx(scene: Scene, x: number) { return x - scene.camX; }
function sy(scene: Scene, y: number) { return scene.top - y; }

function stamp(scene: Scene, image: Sprite, x: number, y: number, ox: number, oy: number, angle: number) {
  const r = scene.ratio * scene.k, cos = Math.cos(angle) * r, sin = Math.sin(angle) * r;
  scene.context.setTransform(cos, sin, -sin, cos, sx(scene, x) * r, sy(scene, y) * r);
  scene.context.drawImage(image.canvas, -ox, -oy, image.w, image.h);
}

function spark(scene: Scene, x: number, y: number, vx: number, vy: number, kind: number, life: number) {
  const pool = scene.spark;
  for (let index = 0; index < SPARKS * 6; index += 6) {
    if (pool[index] > 0) continue;
    pool[index] = life; pool[index + 1] = x; pool[index + 2] = y; pool[index + 3] = vx; pool[index + 4] = vy; pool[index + 5] = kind;
    return;
  }
}

/** Juice for one game event (sound is the component's). Nothing flashes or shakes in ধীরে খেলো. */
export function sceneEvent(scene: Scene, kind: number, x: number, y: number, n: number, calm: boolean) {
  if (kind === EV.candy) {
    for (let k = 0; k < (calm ? 4 : 10); k++) { const a = noise(scene) * TAU, speed = 40 + noise(scene) * 70; spark(scene, x, y, Math.cos(a) * speed, Math.sin(a) * speed, 0, 0.5); }
    const pool = scene.pop;
    for (let index = 0; index < POPUPS * 4; index += 4) {
      if (pool[index] > 0) continue;
      pool[index] = 0.8; pool[index + 1] = x; pool[index + 2] = y + 12; pool[index + 3] = n > 60 ? 60 : n;
      break;
    }
  } else if (kind === EV.crash) {
    for (let k = 0; k < (calm ? 5 : 14); k++) { const a = noise(scene) * TAU, speed = 30 + noise(scene) * 90; spark(scene, x, y, Math.cos(a) * speed, Math.abs(Math.sin(a)) * speed, n === 2 ? 3 : 1, 0.9); }
    if (!calm) { scene.shake = 0.3; scene.flash = 0.35; }
  } else if (kind === EV.land) {
    for (let k = 0; k < (calm ? 4 : 12); k++) spark(scene, x + (noise(scene) - 0.5) * 20, y, (noise(scene) - 0.5) * 80, 20 + noise(scene) * 50, n === 2 ? 0 : 2, 0.7);
    scene.landGlow = n === 2 ? 1 : 0.5;
  } else if (kind === EV.bump && !calm) scene.shake = 0.12;
  else if (kind === EV.rethrow) scene.trailCount = 0;
}

/** Moves the camera, the clock, the trail and the sparks. `game` is null on the title (the plane waits at the back of the room). */
export function tickScene(scene: Scene, game: Game | null, dt: number, calm: boolean) {
  scene.clock += dt;
  if (scene.shake > 0) scene.shake = Math.max(0, scene.shake - dt);
  if (scene.flash > 0) scene.flash = Math.max(0, scene.flash - dt);
  if (scene.landGlow > 0) scene.landGlow = Math.max(0, scene.landGlow - dt * 0.6);
  const course = scene.course;
  if (course) {
    const x = game ? (game.state === DOWN ? game.downX : game.x) : course.startX;
    let target = x - scene.viewW * 0.3;
    const low = -40, high = course.length + 70 - scene.viewW;
    if (target > high) target = high;
    if (target < low) target = low;
    scene.camX += (target - scene.camX) * Math.min(1, dt * (calm ? 4 : 6));
  }
  if (game && game.state === 0) {
    const head = scene.trailHead;
    scene.trail[head * 2] = game.x; scene.trail[head * 2 + 1] = game.y;
    scene.trailHead = (head + 1) % TRAIL;
    if (scene.trailCount < TRAIL) scene.trailCount++;
  }
  const pool = scene.spark;
  for (let index = 0; index < SPARKS * 6; index += 6) {
    if (pool[index] <= 0) continue;
    pool[index] -= dt;
    pool[index + 1] += pool[index + 3] * dt; pool[index + 2] += pool[index + 4] * dt;
    pool[index + 4] -= (pool[index + 5] === 0 ? 40 : 160) * dt;
  }
  const pops = scene.pop;
  for (let index = 0; index < POPUPS * 4; index += 4) if (pops[index] > 0) { pops[index] -= dt; pops[index + 2] += 26 * dt; }
}

function streaksFor(scene: Scene, game: Game | null, index: number, t: number, calm: boolean) {
  const course = scene.course!, winds = course.winds, base = index * WINDF, context = scene.context;
  const x0 = winds[base], x1 = winds[base + 2], y0 = winds[base + 1], y1 = winds[base + 3] > 600 ? 600 : winds[base + 3];
  if (x1 < scene.camX - 20 || x0 > scene.camX + scene.viewW + 20) return;
  const art = winds[base + 9], period = winds[base + 6];
  let level = windLevel(winds, index, t);
  // A gust or a bell shows faint streaks a second before it blows: the warning you can see.
  if (period && level === 0) { const soon = windLevel(winds, index, t + 1); if (soon > 0) level = 0.25; }
  if (level <= 0) return;
  const w = x1 - x0, h = y1 - y0, wx = winds[base + 4], wy = winds[base + 5];
  const speed = calm ? 0.3 : 1;
  if (art === WIND.warm) {
    context.globalAlpha = 0.14 * level; context.fillStyle = scene.palette.warm; context.fillRect(sx(scene, x0), sy(scene, y1), w, h);
    context.globalAlpha = 0.7 * level; context.strokeStyle = scene.palette.warm; context.lineWidth = 1.6; context.lineCap = "round";
    context.beginPath();
    for (let k = 0; k < 9; k++) {
      const px = x0 + (frac(k * 0.618 + 0.13) * 0.8 + 0.1) * w, py = y0 + frac(k * 0.37 + t * speed * 0.45) * h;
      const qx = sx(scene, px), qy = sy(scene, py);
      context.moveTo(qx, qy);
      context.quadraticCurveTo(qx + 5 * Math.sin(t * 3 + k), qy - 9, qx, qy - 18);
      context.quadraticCurveTo(qx - 5 * Math.sin(t * 3 + k), qy - 27, qx, qy - 36);
    }
    context.stroke();
  } else if (art === WIND.rain) {
    context.globalAlpha = 0.18; context.fillStyle = "#3d4f66"; context.fillRect(sx(scene, x0), sy(scene, y1), w, h);
    context.globalAlpha = 0.5; context.strokeStyle = "#cfe0f2"; context.lineWidth = 1;
    context.beginPath();
    for (let k = 0; k < 40; k++) {
      const px = x0 + frac(k * 0.618) * w, py = y0 + frac(k * 0.271 - t * speed * 1.6) * h;
      context.moveTo(sx(scene, px), sy(scene, py)); context.lineTo(sx(scene, px - 3), sy(scene, py - 14));
    }
    context.stroke();
  } else {
    // Fans and bells push down, gusts push across: short dashes moving with the air.
    const down = wy < 0, colour = art === WIND.gust ? scene.palette.streak : art === WIND.bell ? "#c2361f" : "#5d7f95";
    context.globalAlpha = (art === WIND.bell ? 0.75 : 0.55) * level; context.strokeStyle = colour; context.lineWidth = art === WIND.bell ? 2.4 : 1.8; context.lineCap = "round"; context.lineJoin = "round";
    context.beginPath();
    const count = art === WIND.gust ? 14 : 8;
    for (let k = 0; k < count; k++) {
      if (down) {
        const px = x0 + (frac(k * 0.618 + 0.2) * 0.9 + 0.05) * w, py = y1 - frac(k * 0.41 + t * speed * (art === WIND.bell ? 1.4 : 0.8)) * h;
        const qx = sx(scene, px), qy = sy(scene, py);
        context.moveTo(qx, qy - 14); context.lineTo(qx, qy + 10);
        context.moveTo(qx - 5, qy + 4); context.lineTo(qx, qy + 10); context.lineTo(qx + 5, qy + 4);
      } else {
        const dir = wx < 0 ? -1 : 1, px = x0 + (dir > 0 ? frac(k * 0.37 + t * speed * 0.9) : 1 - frac(k * 0.37 + t * speed * 0.9)) * w;
        const py = y0 + (frac(k * 0.618 + 0.31) * 0.8 + 0.1) * h * 0.9;
        context.moveTo(sx(scene, px), sy(scene, py)); context.lineTo(sx(scene, px - dir * 26), sy(scene, py));
        context.moveTo(sx(scene, px - dir * 4), sy(scene, py + 4)); context.lineTo(sx(scene, px - dir * 14), sy(scene, py + 4));
      }
    }
    context.stroke();
  }
  context.globalAlpha = 1;
}

function surfaceUnder(scene: Scene, x: number, y: number) {
  const course = scene.course!, rects = course.rects;
  let top = 0;
  for (let index = 0; index < course.rectCount; index++) {
    const base = index * RECT;
    if (x >= rects[base] && x <= rects[base + 2] && rects[base + 3] <= y && rects[base + 3] > top && rects[base + 4] !== A.fan) top = rects[base + 3];
  }
  return top;
}

/** One frame. `game` is null on the title. `hud` hides the corners under a cover or the story. */
export function drawScene(scene: Scene, game: Game | null, calm: boolean, hud: boolean) {
  const context = scene.context, course = scene.course, t = game ? game.t : scene.clock;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalAlpha = 1;
  context.drawImage(scene.bg, 0, 0);
  if (!course) return;
  const shakeX = scene.shake > 0 && !calm ? Math.sin(scene.clock * 70) * scene.shake * 10 : 0;
  scene.camX += shakeX;
  units(scene);

  // The slow backdrop (windows and posters, a skyline, the far bank), repeated.
  const tileW = scene.backdrop.w, offset = frac((scene.camX * 0.35) / tileW) * tileW;
  for (let x = -offset; x < scene.viewW; x += tileW) context.drawImage(scene.backdrop.canvas, x, sy(scene, 600), tileW, scene.backdrop.h);

  // The floor under everything: classroom tiles, the street, the river.
  const floorY = sy(scene, 0);
  context.fillStyle = scene.palette.ground; context.fillRect(0, floorY, scene.viewW, scene.viewH);
  context.strokeStyle = scene.palette.groundLine; context.lineWidth = 1.2;
  context.beginPath();
  if (course.floor === WATER) {
    for (let k = 0; k < 14; k++) { const px = frac(k * 0.618 - scene.clock * (calm ? 0.01 : 0.04)) * (scene.viewW + 40) - 20; context.moveTo(px, floorY + 6 + (k % 3) * 7); context.lineTo(px + 18, floorY + 6 + (k % 3) * 7); }
  } else {
    const step = course.floor === FLOOR ? 40 : 60, start = -frac(scene.camX / step) * step;
    for (let x = start; x < scene.viewW; x += step) { context.moveTo(x, floorY); context.lineTo(x - 18, floorY + 30); }
    context.moveTo(0, floorY + 1); context.lineTo(scene.viewW, floorY + 1);
  }
  context.stroke();
  if (course.floor === STREET) { context.fillStyle = "#f2e6c8"; for (let x = -frac(scene.camX / 90) * 90; x < scene.viewW; x += 90) context.fillRect(x, floorY + 14, 30, 3); }

  // Indoors: the whitewashed ceiling, its beam and the tube lights (only for looks; the ceiling knocks the nose down).
  if (course.ceiling < 1000) {
    const ceilY = sy(scene, course.ceiling);
    context.fillStyle = "#f6f1e2"; context.fillRect(0, 0, scene.viewW, ceilY);
    context.fillStyle = "#d8cfb8"; context.fillRect(0, ceilY - 3, scene.viewW, 6);
    for (let x = 160 - frac((scene.camX - 160) / 420) * 420 - 160; x < scene.viewW + 60; x += 420) {
      context.fillStyle = "#8d969a"; context.fillRect(x + 6, ceilY + 3, 2, 8); context.fillRect(x + 56, ceilY + 3, 2, 8);
      context.fillStyle = "#ffffff"; context.beginPath(); context.roundRect(x, ceilY + 10, 64, 6, 3); context.fill();
      context.globalAlpha = 0.18; context.fillStyle = "#fff8d0"; context.beginPath(); context.ellipse(x + 32, ceilY + 22, 50, 14, 0, 0, TAU); context.fill(); context.globalAlpha = 1;
    }
  }

  // The far wall.
  const wallX = sx(scene, course.length);
  if (wallX < scene.viewW) context.drawImage(scene.farWall.canvas, wallX, sy(scene, 600) - 40, scene.farWall.w, scene.farWall.h);

  // The wind.
  for (let index = 0; index < course.windCount; index++) streaksFor(scene, game, index, t, calm);

  // Solid shapes; fans are drawn turning.
  const rects = course.rects, left = scene.camX - 40, right = scene.camX + scene.viewW + 40;
  for (let index = 0; index < course.rectCount; index++) {
    const base = index * RECT;
    if (rects[base + 2] < left || rects[base] > right) continue;
    const art = rects[base + 4], image = scene.rectSprites[index];
    if (art === A.rod) {
      context.fillStyle = "#7d8689"; context.fillRect(sx(scene, rects[base]) + 2, sy(scene, rects[base + 3] > 600 ? 600 : rects[base + 3]), 2, rects[base + 3] - rects[base + 1]);
    } else if (art === A.fan) {
      const cx = (rects[base] + rects[base + 2]) / 2, cy = (rects[base + 1] + rects[base + 3]) / 2, r = scene.ratio * scene.k;
      const spin = (calm ? 6 : 16) * t + index;
      context.setTransform(r, 0, 0, r, sx(scene, cx) * r, sy(scene, cy) * r);
      for (let blade = 0; blade < 3; blade++) {
        const a = spin + (blade * TAU) / 3, reach = Math.cos(a) * 55, depth = Math.sin(a);
        context.fillStyle = depth > 0 ? "#c4ccce" : "#eef2f2";
        context.beginPath(); context.ellipse(reach / 2, 0, Math.abs(reach) / 2 + 2, 2.8 + depth * 1.3, 0, 0, TAU); context.fill();
      }
      context.fillStyle = "#8d969a"; context.beginPath(); context.roundRect(-8, -5, 16, 10, 3); context.fill();
      units(scene);
    } else if (image) context.drawImage(image.canvas, sx(scene, rects[base]) - 8, sy(scene, rects[base + 3]) - 8, image.w, image.h);
  }

  // The landing place, its red ring (the bullseye) and a little flag.
  const pad = course.pad, px0 = padX(pad, t), pw = pad.x1 - pad.x0, centre = px0 + pw / 2;
  if (scene.padBody) context.drawImage(scene.padBody.canvas, sx(scene, px0) - 8, sy(scene, pad.y) - 8, scene.padBody.w, scene.padBody.h);
  if (scene.padTop) context.drawImage(scene.padTop.canvas, sx(scene, px0) - 8, sy(scene, pad.y) - 16, scene.padTop.w, scene.padTop.h);
  context.globalAlpha = 0.85 + 0.15 * Math.sin(scene.clock * 4);
  context.strokeStyle = "#e63946"; context.lineWidth = 2.4;
  context.beginPath(); context.ellipse(sx(scene, centre), sy(scene, pad.y) - 1, pad.bull, 4.5, 0, 0, TAU); context.stroke();
  context.fillStyle = "#e63946"; context.beginPath(); context.ellipse(sx(scene, centre), sy(scene, pad.y) - 1, 4, 1.6, 0, 0, TAU); context.fill();
  context.globalAlpha = 1;
  if (scene.landGlow > 0) {
    context.globalAlpha = scene.landGlow * 0.6; context.fillStyle = "#ffe066";
    context.beginPath(); context.ellipse(sx(scene, centre), sy(scene, pad.y), pad.bull * 1.6, 14, 0, 0, TAU); context.fill(); context.globalAlpha = 1;
  }

  // Checkpoints ahead: a dashed ring with a folded page, where the next page would be thrown from.
  const at = game ? game.checkpoint : 0;
  context.setLineDash(DASH);
  for (let index = 1; index < course.checkpointCount; index++) {
    const cx = course.checkpoints[index * 2], cy = course.checkpoints[index * 2 + 1];
    if (cx < left || cx > right) continue;
    context.globalAlpha = index <= at ? 0.25 : 0.6; context.strokeStyle = "#ffffff"; context.lineWidth = 1.4;
    context.beginPath(); context.arc(sx(scene, cx), sy(scene, cy), 12, 0, TAU); context.stroke();
  }
  context.setLineDash(NO_DASH);
  context.globalAlpha = 1;

  // Candies, bobbing.
  const candies = course.candies;
  for (let index = 0; index < course.candyCount; index++) {
    if (game && game.taken[index] === 1) continue;
    const cx = candies[index * 2], cy = candies[index * 2 + 1];
    if (cx < left || cx > right) continue;
    const bob = calm ? 0 : Math.sin(scene.clock * 3 + index) * 2.5;
    context.drawImage(scene.candy.canvas, sx(scene, cx) - CANDY_SIZE * 2, sy(scene, cy + bob) - CANDY_SIZE * 1.2, scene.candy.w, scene.candy.h);
  }

  // Cut kites with their strings hanging, and herons on their loops.
  const strings = course.strings;
  for (let index = 0; index < course.stringCount; index++) {
    const kx = kiteX(strings, index, t), ky = kiteY(strings, index, t), tx = tailX(strings, index, t), ty = ky - strings[index * STRING + 2];
    if (kx < left - 40 || kx > right + 40) continue;
    context.strokeStyle = "#3a3a3a"; context.lineWidth = 1.1;
    context.beginPath(); context.moveTo(sx(scene, kx), sy(scene, ky)); context.quadraticCurveTo(sx(scene, (kx + tx) / 2 + 8), sy(scene, (ky + ty) / 2), sx(scene, tx), sy(scene, ty)); context.stroke();
    stamp(scene, scene.kites[index % 5], kx, ky, KITE_SIZE, KITE_SIZE * 1.1, Math.sin(t * 1.7 + index) * 0.25);
    units(scene);
  }
  const birds = course.birds;
  for (let index = 0; index < course.birdCount; index++) {
    const bx = birdX(birds, index, t), by = birdY(birds, index, t);
    if (bx < left || bx > right) continue;
    const dir = Math.cos(birds[index * BIRD + 4] * t + birds[index * BIRD + 5]) >= 0 ? 1 : -1;
    const image = frac(t * 2.2 + index * 0.3) < 0.5 ? scene.birdUp : scene.birdDown;
    const r = scene.ratio * scene.k;
    context.setTransform(-dir * r, 0, 0, r, sx(scene, bx) * r, sy(scene, by) * r);
    context.drawImage(image.canvas, -BIRD_SIZE * 0.65, -BIRD_SIZE * 0.5, image.w, image.h);
    units(scene);
  }

  // The plane: its shadow, a dotted trail, then the paper itself (a crumpled ball after a crash).
  {
    const flying = !game || game.state === 0, landed = game && game.state === LANDED;
    const x = game ? (game.state === DOWN ? game.downX : landed ? padX(pad, t) + game.landX : game.x) : course.startX;
    const y = game ? (game.state === DOWN ? game.downY : game.y) : course.startY;
    const ground = surfaceUnder(scene, x, y), height = y - ground;
    context.globalAlpha = Math.max(0.05, 0.28 - height / 1400); context.fillStyle = "#000000";
    context.beginPath(); context.ellipse(sx(scene, x), sy(scene, ground) - 1, 12 - Math.min(8, height / 60), 2.6, 0, 0, TAU); context.fill();
    context.globalAlpha = 1;
    if (game && scene.trailCount > 1 && flying) {
      context.fillStyle = "#ffffff";
      for (let k = 0; k < scene.trailCount; k += 2) {
        const slot = ((scene.trailHead - 1 - k + TRAIL * 2) % TRAIL) * 2;
        context.globalAlpha = 0.5 * (1 - k / TRAIL);
        context.fillRect(sx(scene, scene.trail[slot]) - 1, sy(scene, scene.trail[slot + 1]) - 1, 2, 2);
      }
      context.globalAlpha = 1;
    }
    if (game && game.state === DOWN) {
      const since = game.t - game.downAt;
      stamp(scene, scene.crumple, x, y - Math.min(since, 0.4) * 30, 10, 10, since * 6);
    } else {
      const wobble = game && game.stalled && !calm ? Math.sin(scene.clock * 30) * 0.08 : 0;
      const angle = game ? -game.a + wobble : -0.12 + (calm ? 0 : Math.sin(scene.clock * 2) * 0.04);
      stamp(scene, game && game.wet > 0.3 ? scene.planeWet : scene.plane, x, y + (game ? 0 : Math.sin(scene.clock * 2.4) * 2), PLANE_LEN / 2 + 2, PLANE_LEN * 0.32, landed ? 0 : angle);
    }
    units(scene);
  }

  // Sparks and the "+১০" pops.
  const pool = scene.spark;
  for (let index = 0; index < SPARKS * 6; index += 6) {
    if (pool[index] <= 0) continue;
    const kind = pool[index + 5];
    context.globalAlpha = pool[index] > 0.4 ? 1 : pool[index] / 0.4; context.fillStyle = SPARK_COLOURS[kind];
    const size = kind === 0 ? 2.4 : 3;
    context.fillRect(sx(scene, pool[index + 1]) - size / 2, sy(scene, pool[index + 2]) - size / 2, size, size);
  }
  context.globalAlpha = 1;
  const pops = scene.pop;
  context.font = FONT_POP; context.textAlign = "center"; context.textBaseline = "middle";
  for (let index = 0; index < POPUPS * 4; index += 4) {
    if (pops[index] <= 0) continue;
    context.globalAlpha = Math.min(1, pops[index] / 0.3);
    context.lineWidth = 3; context.strokeStyle = "#5a2a00"; context.strokeText(PLUS[1], sx(scene, pops[index + 1]), sy(scene, pops[index + 2]));
    context.fillStyle = "#ffcf4a"; context.fillText(PLUS[1], sx(scene, pops[index + 1]), sy(scene, pops[index + 2]));
  }
  context.globalAlpha = 1;
  scene.camX -= shakeX;

  if (!game || !hud) return;
  drawEdges(scene, game, calm);
  drawHud(scene, game);
}

const DASH = [4, 4];
const NO_DASH: number[] = [];

function drawEdges(scene: Scene, game: Game, calm: boolean) {
  const context = scene.context;
  units(scene);
  // About to hit: the edge it will hit glows, stronger the sooner. The last page: a soft orange rim all round.
  const strength = calm ? (game.danger > 0 ? 0.55 : 0) : game.danger;
  if (strength > 0 && game.state === 0) {
    context.globalAlpha = strength;
    if (game.dangerEdge === 1) context.drawImage(scene.edgeBottom.canvas, 0, scene.viewH - 70, scene.viewW, 70);
    else if (game.dangerEdge === 3) context.drawImage(scene.edgeTop.canvas, 0, 0, scene.viewW, 70);
    else context.drawImage(scene.edgeRight.canvas, scene.viewW - 60, 0, 60, scene.viewH);
  }
  if (game.left === 1 && game.pages > 1 && game.state === 0) {
    context.globalAlpha = calm ? 0.35 : 0.25 + 0.15 * Math.sin(scene.clock * 5);
    context.strokeStyle = "#ff7a1a"; context.lineWidth = 6; context.strokeRect(3, 3, scene.viewW - 6, scene.viewH - 6);
  }
  if (scene.flash > 0) { context.globalAlpha = scene.flash * 1.6; context.drawImage(scene.edgeRed.canvas, 0, scene.viewH - 70, scene.viewW, 70); }
  context.globalAlpha = 1;
}

function pill(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  context.beginPath(); context.roundRect(x, y, w, h, h / 2); context.fill();
}

function drawHud(scene: Scene, game: Game) {
  const context = scene.context, course = game.course, w = scene.viewW;
  units(scene);
  // The flight line along the very top edge, with the landing place's notch.
  const progress = game.maxX / Math.max(1, (course.pad.x0 + course.pad.x1) / 2);
  context.fillStyle = "#00000033"; context.fillRect(0, 0, w, 3);
  context.fillStyle = "#ffcf4a"; context.fillRect(0, 0, w * (progress > 1 ? 1 : progress), 3);

  // Top-right: candies, then the pages left as little folded sheets.
  context.font = FONT_HUD; context.textBaseline = "middle"; context.textAlign = "right";
  context.fillStyle = "#1d1a14a0"; pill(context, w - 92, 8, 84, 28);
  context.drawImage(scene.candy.canvas, w - 90, 22 - CANDY_SIZE * 0.85, CANDY_SIZE * 2.8, CANDY_SIZE * 1.7);
  context.fillStyle = game.candies >= course.goal ? "#ffd166" : "#ffffff";
  context.fillText(FRACTIONS[game.candies * 41 + course.candyCount], w - 16, 23);
  const pagesW = 12 + game.pages * 15;
  context.fillStyle = "#1d1a14a0"; pill(context, w - 8 - pagesW, 40, pagesW, 20);
  for (let page = 0; page < game.pages; page++) {
    const x = w - 8 - pagesW + 7 + page * 15;
    context.globalAlpha = page < game.left ? 1 : 0.28;
    context.fillStyle = "#fbfaf3"; context.beginPath(); context.moveTo(x, 44); context.lineTo(x + 12, 50); context.lineTo(x, 56); context.lineTo(x + 2.5, 50); context.closePath(); context.fill();
  }
  context.globalAlpha = 1;

  // The landing place off screen: a pointer on the right edge with how far it is.
  const centre = (padX(course.pad, game.t) + (course.pad.x1 - course.pad.x0) / 2);
  if (sx(scene, centre) > w + 4 && game.state === 0) {
    const meters = Math.max(0, Math.min(200, Math.round((centre - game.x) / 50)));
    let y = sy(scene, course.pad.y + 30);
    if (y < 70) y = 70; else if (y > scene.viewH - 30) y = scene.viewH - 30;
    context.fillStyle = "#e63946"; context.beginPath(); context.moveTo(w - 4, y); context.lineTo(w - 16, y - 9); context.lineTo(w - 16, y + 9); context.closePath(); context.fill();
    context.font = FONT_SMALL; context.textAlign = "right"; context.lineWidth = 3; context.strokeStyle = "#00000088";
    context.strokeText(METERS[meters], w - 20, y); context.fillStyle = "#ffffff"; context.fillText(METERS[meters], w - 20, y);
  }
  context.textAlign = "left";
}

/** The finale's named bar at the top centre (drawn by the component's words in HTML would cover play; here it is canvas). */
export function drawFinaleBar(scene: Scene, game: Game, name: string, warn: boolean, calm: boolean) {
  const context = scene.context, w = scene.viewW;
  units(scene);
  const barW = Math.min(170, w * 0.46), x = (w - barW) / 2, progress = game.maxX / Math.max(1, (game.course.pad.x0 + game.course.pad.x1) / 2);
  const top = 42;
  context.fillStyle = warn ? "#7a1e14d0" : "#1d1a14b0"; pill(context, x - 6, top, barW + 12, 28);
  context.font = FONT_SMALL; context.textAlign = "center"; context.textBaseline = "middle";
  context.fillStyle = warn && (calm || frac(scene.clock * 3) < 0.6) ? "#ffd166" : "#ffffff";
  context.fillText(name, w / 2, top + 10);
  context.fillStyle = "#ffffff33"; context.fillRect(x, top + 19, barW, 4);
  context.fillStyle = "#e63946"; context.fillRect(x, top + 19, barW * (progress > 1 ? 1 : progress), 4);
  context.textAlign = "left";
}

