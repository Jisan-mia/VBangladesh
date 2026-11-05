// One frame of the yard: copy the pre-painted sky, clouds, trunk and canopy, then the drops and their shadows, the ডালা and
// its pile, the pops, the edge signals and the HUD in the corners. Allocation-free (npm run lint:games): no literals,
// closures or string building in here; every sprite and string comes from scene.ts.
import { dropX, dropY, progress, windAt, BASKET_Y, BIG, BRANCH, CAUGHT, GROUND_Y, HAIL, HIT, RIPE, SPAWN_Y, U_CATCH, W, WARN } from "./physics";
import { FONT_HUD, FONT_NAME, FONT_POP, FONT_SMALL, LEAVES, MINUS, NUMBERS, PILE, PLUS, RAIN, SLOTS, STREAKS, DALA, type Scene, type Sprite } from "./scene";
import type { Game } from "./game";

const TAU = Math.PI * 2;
const POP_COLORS = ["#d8f08a", "#ffd75e", "#ffd2c4", "#ffe680", "#dff1ff", "#ffd2c4"];

function noise(scene: Scene) {
  scene.noise = (Math.imul(scene.noise, 1103515245) + 12345) >>> 0;
  return (scene.noise >>> 8) / 16777216;
}

/** Ambient motion: the clock, the eased wind the tree leans to, rain and loose leaves. Nothing moves in ধীরে খেলো but the lean. */
export function tickScene(scene: Scene, dt: number, wind: number, calm: boolean) {
  scene.clock += dt;
  scene.wind += (wind - scene.wind) * Math.min(1, dt * 2.5);
  if (calm) return;
  const leaves = scene.leaves, rain = scene.rain, push = scene.wind * 160, top = -scene.oy;
  for (let index = 0; index < LEAVES * 6; index += 6) {
    leaves[index + 2] += ((push + Math.sin(scene.clock * 2 + index) * 30) - leaves[index + 2]) * dt * 2;
    leaves[index] += leaves[index + 2] * dt;
    leaves[index + 1] += (26 + Math.sin(scene.clock * 3 + index) * 18) * dt;
    leaves[index + 4] += leaves[index + 5] * dt;
    if (leaves[index] < -20 || leaves[index] > W + 20 || leaves[index + 1] > 450) {
      leaves[index] = push >= 0 ? -10 : W + 10; leaves[index + 1] = 70 + noise(scene) * 220;
    }
  }
  for (let index = 0; index < RAIN * 3; index += 3) {
    rain[index + 1] += 420 * dt; rain[index] += push * 1.2 * dt;
    if (rain[index + 1] > 450) { rain[index + 1] = top - 20; rain[index] = noise(scene) * W; }
    if (rain[index] < 0) rain[index] += W; else if (rain[index] > W) rain[index] -= W;
  }
}

/** Draws `image` centred at field point (x, y), turned by `angle`, squashed vertically by `scaleY`. */
function stamp(scene: Scene, image: Sprite, x: number, y: number, angle: number, scaleY: number) {
  const k = scene.k, cos = Math.cos(angle) * k, sin = Math.sin(angle) * k;
  scene.context.setTransform(cos, sin, -sin * scaleY, cos * scaleY, x * k, (y + scene.oy) * k);
  scene.context.drawImage(image.canvas, -image.w / 2, -image.h / 2, image.w, image.h);
}
/** Where a falling drop is drawn: the fall from the lifted canopy is stretched so it meets the rim exactly at its catch time. */
function fallY(scene: Scene, y: number) { return y >= BASKET_Y ? y : BASKET_Y - (BASKET_Y - y) * scene.stretch; }
function field(scene: Scene) { scene.context.setTransform(scene.k, 0, 0, scene.k, 0, scene.oy * scene.k); }
function screen(scene: Scene) { scene.context.setTransform(scene.k, 0, 0, scene.k, 0, 0); }

function pill(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  context.fillStyle = color;
  context.beginPath(); context.roundRect(x, y, w, h, h / 2); context.fill();
}

/** How hard the tree is shaking now (0..1): it builds for a second before each finale shake and settles after. */
function shakeAt(game: Game) {
  const shakes = game.storm.shakes;
  for (let index = 0; index < shakes.length; index++) {
    const since = game.t - shakes[index];
    if (since > -1 && since < 0.9) return since < 0 ? 1 + since * 0.6 : 1 - since / 0.9;
  }
  return 0;
}

/** One frame. `game` is null on the title (the storm gathers, nothing falls yet). `danger` is the side a hazard is about to land on. */
export function drawScene(scene: Scene, game: Game | null, calm: boolean, danger: number, hud: boolean) {
  const context = scene.context, k = scene.k, t = game ? game.t : 0, oy = scene.oy;
  screen(scene);
  context.globalAlpha = 1;
  context.drawImage(scene.bg.canvas, 0, 0, W, scene.hs);

  // A rare, soft glow behind the clouds: one pulse each, a third of a second, never a strobe, none in ধীরে খেলো.
  if (game && !calm) {
    const bolts = scene.bolts;
    for (let index = 0; index < bolts.length; index++) {
      const since = t - bolts[index];
      if (since < 0 || since > 0.34) continue;
      const glow = since < 0.06 ? since / 0.06 : 1 - (since - 0.06) / 0.28;
      context.globalAlpha = (game.storm.dark ? 0.3 : 0.2) * glow;
      context.fillStyle = scene.palette.flash; context.fillRect(0, 0, W, oy + 300);
      const x = 130 + ((index * 83) % 160);
      field(scene);
      context.globalAlpha = 0.55 * glow;
      context.strokeStyle = "#fffaeb"; context.lineWidth = 1.6;
      context.beginPath(); context.moveTo(x, 150 - scene.lift * 0.3); context.lineTo(x - 8, 182); context.lineTo(x + 4, 188); context.lineTo(x - 6, 226); context.stroke();
      screen(scene);
      context.globalAlpha = 1;
    }
  }

  field(scene);
  const drift = calm ? 0 : (scene.clock * 7) % (W * 2);
  context.drawImage(scene.clouds.canvas, -drift, 150, W * 2, 90);
  if (drift > W) context.drawImage(scene.clouds.canvas, W * 2 - drift, 150, W * 2, 90);
  context.drawImage(scene.trunk.canvas, 30, 110 - oy, 90, scene.trunk.h);

  if (!calm) {
    const rain = scene.rain, slant = scene.wind * 7;
    context.strokeStyle = "#dfe8f04d"; context.lineWidth = 1;
    context.beginPath();
    for (let index = 0; index < RAIN * 3; index += 3) { context.moveTo(rain[index], rain[index + 1]); context.lineTo(rain[index] + slant, rain[index + 1] + rain[index + 2]); }
    context.stroke();
  }

  // The canopy leans with the wind; in a finale's shake it rocks hard (gently in ধীরে খেলো).
  const shake = game ? shakeAt(game) : 0;
  const lean = scene.wind * 9 + (calm ? 0 : Math.sin(scene.clock * 1.7) * 2.2 + Math.sin(scene.clock * 31) * 5 * shake);
  context.setTransform(k, 0, 0, k, lean * k, (oy - scene.lift) * k);
  context.drawImage(scene.canopy.canvas, -30, -20 - (oy - scene.lift), W + 60, scene.canopy.h);
  field(scene);

  // Grass at the courtyard's edge bends the way the wind blows.
  context.strokeStyle = "#00000030"; context.lineWidth = 1.5; context.lineCap = "round";
  context.beginPath();
  for (let x = 4; x < W; x += 13) {
    const base = 371 + ((x * 7) % 5), bend = scene.wind * 7 + (calm ? 0 : Math.sin(scene.clock * 3.1 + x * 0.3) * 1.4);
    for (let blade = -1; blade <= 1; blade++) { context.moveTo(x + blade * 2.5, base); context.quadraticCurveTo(x + blade * 3 + bend * 0.4, base - 6, x + blade * 4 + bend, base - 9 - Math.abs(blade)); }
  }
  context.stroke();

  if (game) {
    if (scene.game !== game) { scene.game = game; scene.seen = 0; }
    readEvents(scene, game);
    drawShadows(scene, game);
    drawDrops(scene, game, calm);
  }
  drawDala(scene, game, calm, t);

  if (!calm) {
    const leaves = scene.leaves;
    for (let index = 0; index < LEAVES * 6; index += 6) stamp(scene, scene.leaf, leaves[index], leaves[index + 1], leaves[index + 4], 1);
  }
  field(scene);
  drawPops(scene, t, calm);
  if (game && hud) { drawEdges(scene, game, calm, danger, shake); drawHud(scene, game); }
  screen(scene);
  context.globalAlpha = 1;
}

/** Fresh catches, hits and knocks, read from the game's event ring into pops and timestamps. */
function readEvents(scene: Scene, game: Game) {
  for (; scene.seen < game.eventCount; scene.seen++) {
    const event = game.events[scene.seen % game.events.length];
    if (!event.caught) continue;
    const popup = scene.popups[scene.seen % scene.popups.length];
    popup.x = event.x; popup.t = event.t;
    if (event.kind === HAIL) {
      if (event.lost < 0) { popup.t = -9; continue; }
      scene.knockAt = event.t; scene.knockKind = event.lost; scene.knockX = event.x;
      popup.text = MINUS[event.lost]; popup.color = POP_COLORS[4];
    } else if (event.kind === BRANCH || event.kind === BIG) {
      scene.hitAt = event.t; popup.text = "উফ!"; popup.color = POP_COLORS[2];
    } else {
      scene.catchAt = event.t; popup.text = PLUS[event.kind]; popup.color = POP_COLORS[event.kind];
    }
  }
}

/** A hazard's shadow on the ground under where it will land, darker as it nears. */
function drawShadows(scene: Scene, game: Game) {
  const context = scene.context, drops = game.drops;
  for (let index = game.next; index < drops.length; index++) {
    const drop = drops[index], kind = drop.kind;
    if (kind !== BRANCH && kind !== BIG && kind !== HAIL) continue;
    const u = progress(drop, game.t);
    if (u < 0.15) { if (drop.tc > game.t + 3) break; continue; }
    const near = Math.min(1, (u - 0.15) / (U_CATCH - 0.15));
    context.globalAlpha = 0.18 + 0.32 * near;
    context.fillStyle = "#1a0c04";
    const half = kind === BIG ? 44 : kind === HAIL ? 6 : 18;
    context.beginPath(); context.ellipse(drop.xc, GROUND_Y + 8, half * (0.6 + 0.4 * near), 3.2, 0, 0, TAU); context.fill();
  }
  context.globalAlpha = 1;
}

function drawDrops(scene: Scene, game: Game, calm: boolean) {
  const context = scene.context, t = game.t, drops = game.drops, dark = game.storm.dark;
  for (let index = 0; index < drops.length; index++) {
    const drop = drops[index], u = progress(drop, t);
    if (t < drop.t0 - WARN) continue;
    if (u > 1 + 1.3 / drop.fall) continue;
    const image = scene.kinds[drop.kind];
    if (t < drop.t0) {
      // Hanging and shaking loose: the warning before every drop, hidden in the dark.
      if (dark) continue;
      const wobble = calm ? 0 : Math.sin(t * 34) * 0.22 * (1 - (drop.t0 - t) / WARN);
      context.globalAlpha = Math.min(1, (t - drop.t0 + WARN) / 0.15);
      stamp(scene, image, drop.x0, SPAWN_Y - scene.lift, wobble + (drop.kind === BRANCH || drop.kind === BIG ? 0.3 : 0), 1);
      context.globalAlpha = 1;
      continue;
    }
    if (drop.state === CAUGHT && u >= U_CATCH) continue;
    if (drop.state === HIT && u >= U_CATCH) {
      const age = t - drop.tc;
      if (age > 0.7) continue;
      context.globalAlpha = 1 - age / 0.7;
      if (drop.kind === HAIL) stamp(scene, image, drop.xc + (drop.xc < W / 2 ? 1 : -1) * 40 * age, BASKET_Y - 30 * age + 200 * age * age, 0, 1);
      else stamp(scene, image, drop.xc + (drop.xc < W / 2 ? 1 : -1) * 90 * age, BASKET_Y - 60 * age + 220 * age * age, drop.spin * 3 * age, 1);
      context.globalAlpha = 1;
      continue;
    }
    if (u <= 1) { stamp(scene, image, dropX(drop, u), fallY(scene, dropY(u)), drop.kind === HAIL ? 0 : drop.spin * (t - drop.t0), 1); continue; }
    // Missed: it rests in the courtyard a moment, then fades (hail melts faster).
    const rest = (t - drop.t0 - drop.fall) / (drop.kind === HAIL ? 0.5 : 1.3);
    if (rest > 1) continue;
    context.globalAlpha = Math.max(0, 1 - rest);
    stamp(scene, image, drop.x0 + drop.drift, GROUND_Y + 4, drop.kind === BRANCH || drop.kind === BIG ? 0.1 : drop.kind === HAIL ? 0 : 1.3, 0.9);
    context.globalAlpha = 1;
  }
}

/** The ডালা: a squash on each catch, a short shake when a hazard lands in it, the pile of the last fifteen mangoes. */
function drawDala(scene: Scene, game: Game | null, calm: boolean, t: number) {
  const context = scene.context, k = scene.k;
  const hitAge = t - scene.hitAt, x = (game ? game.basket : W / 2) + (!calm && hitAge < 0.3 ? Math.sin(hitAge * 70) * 4 * (1 - hitAge / 0.3) : 0);
  const catchAge = t - scene.catchAt, squash = !calm && catchAge < 0.16 ? 1 - 0.12 * Math.sin(catchAge / 0.16 * Math.PI) : 1;
  field(scene);
  context.fillStyle = "#4a2c1426";
  context.beginPath(); context.ellipse(x, GROUND_Y + 12, 38, 5, 0, 0, TAU); context.fill();
  stamp(scene, scene.dalaBack, x, BASKET_Y, 0, squash);
  if (game) {
    const shown = Math.min(PILE, game.pileCount), from = game.pileCount - shown;
    for (let slot = 0; slot < shown; slot++) {
      const kind = game.pile[from + slot], place = SLOTS[slot];
      stamp(scene, scene.kinds[kind], x + place[0], BASKET_Y + place[1] * squash, ((slot * 37) % 9 - 4) * 0.08, 1);
    }
    // A mango knocked out by hail arcs away.
    const knockAge = t - scene.knockAt;
    if (knockAge >= 0 && knockAge < 0.6) {
      context.globalAlpha = 1 - knockAge / 0.6;
      stamp(scene, scene.kinds[scene.knockKind], scene.knockX + (scene.knockX < W / 2 ? 1 : -1) * 120 * knockAge, BASKET_Y - 20 - 90 * knockAge + 260 * knockAge * knockAge, knockAge * 8, 1);
      context.globalAlpha = 1;
    }
  }
  context.setTransform(k, 0, 0, k * squash, x * k, (BASKET_Y + scene.oy) * k);
  context.drawImage(scene.dalaFront.canvas, -DALA * 0.55, -DALA * 0.14, scene.dalaFront.w, scene.dalaFront.h);
  field(scene);
}

function drawPops(scene: Scene, t: number, calm: boolean) {
  const context = scene.context;
  context.textAlign = "center"; context.lineJoin = "round"; context.font = FONT_POP;
  for (let index = 0; index < scene.popups.length; index++) {
    const popup = scene.popups[index], age = t - popup.t;
    if (age < 0 || age > 0.75) continue;
    const y = BASKET_Y - 30 - (calm ? 0 : age * 34);
    context.globalAlpha = 1 - age / 0.75;
    context.strokeStyle = "#2a1a0e"; context.lineWidth = 4; context.strokeText(popup.text, popup.x, y);
    context.fillStyle = popup.color; context.fillText(popup.text, popup.x, y);
  }
  context.globalAlpha = 1;
}

/** Danger and what's coming, at the edges only: the last জান, a hit, a hazard about to land, a gust, hail, the tree's shake. */
function drawEdges(scene: Scene, game: Game, calm: boolean, danger: number, shake: number) {
  const context = scene.context, hs = scene.hs, t = game.t, clock = scene.clock;
  screen(scene);
  if (game.lives === 1 && game.hearts > 1) {
    context.globalAlpha = calm ? 0.6 : 0.45 + 0.3 * Math.sin(clock * 5);
    context.drawImage(scene.edgeOrange.canvas, 0, 0, W, hs);
  }
  const hitAge = t - scene.hitAt;
  if (hitAge >= 0 && hitAge < 0.4) {
    context.globalAlpha = calm ? 0.7 : 0.9 * (1 - hitAge / 0.4);
    context.drawImage(scene.edgeRed.canvas, 0, 0, W, hs);
  }
  if (danger) {
    // Only the bottom corner on the hazard's side, so it reads as "step aside", not as an alarm.
    context.globalAlpha = calm ? 0.5 : 0.35 + 0.25 * Math.sin(clock * 14);
    const x = danger < 0 ? 0 : W / 2;
    context.drawImage(scene.edgeRed.canvas, danger < 0 ? 0 : scene.edgeRed.canvas.width / 2, scene.edgeRed.canvas.height * 0.6, scene.edgeRed.canvas.width / 2, scene.edgeRed.canvas.height * 0.4, x, hs * 0.6, W / 2, hs * 0.4);
  }
  // Hail sweeps glow at the side they come from, a second ahead.
  const sweeps = game.storm.sweeps;
  for (let index = 0; index < sweeps.length; index++) {
    const ahead = sweeps[index] - t;
    if (ahead > 1.2 || ahead < -0.6) continue;
    context.globalAlpha = calm ? 0.6 : 0.4 + 0.3 * Math.sin(clock * 12);
    const fromLeft = game.storm.sweepDirs[index] > 0, image = scene.edgeIce.canvas;
    context.drawImage(image, fromLeft ? 0 : image.width * 0.75, 0, image.width * 0.25, image.height, fromLeft ? 0 : W * 0.75, 0, W * 0.25, hs);
  }
  if (shake > 0) {
    context.globalAlpha = (calm ? 0.5 : 0.8) * Math.min(1, shake);
    context.drawImage(scene.edgeTop.canvas, 0, 0, W, 80);
  }
  context.globalAlpha = 1;
  // The wind's way, as chevrons on the edge it blows toward (a gust shows a second before it arrives).
  let wind = windAt(game.storm.gusts, t + 0.8, game.storm.steady);
  if (Math.abs(scene.wind) > Math.abs(wind)) wind = scene.wind;
  const strength = Math.abs(wind);
  if (strength > 0.3) {
    const side = wind > 0 ? 1 : -1, x = side > 0 ? W - 14 : 14, y = scene.oy + 250;
    context.globalAlpha = Math.min(0.85, (strength - 0.3) * 2.2);
    context.strokeStyle = "#fff4dc"; context.lineWidth = 3; context.lineCap = "round"; context.lineJoin = "round";
    for (let index = 0; index < 3; index++) {
      const shift = calm ? 0 : ((clock * 2 + index * 0.33) % 1) * 6 * side, cx = x - side * index * 9 + shift;
      context.beginPath(); context.moveTo(cx - side * 6, y - 9); context.lineTo(cx, y); context.lineTo(cx - side * 6, y + 9); context.stroke();
    }
    context.globalAlpha = 1;
  }
}

function drawHud(scene: Scene, game: Game) {
  const context = scene.context, storm = game.storm;
  screen(scene);
  // The catch line along the very top, with a notch at each star.
  context.fillStyle = "#00000059"; context.fillRect(0, 0, W, 4);
  context.fillStyle = "#ffd75e"; context.fillRect(0, 0, W * Math.min(1, game.caught / Math.max(1, storm.mangoes)), 4);
  context.fillStyle = "#fff4dc";
  if (storm.pass) context.fillRect(W * storm.pass / storm.mangoes - 1, 0, 2, 7);
  context.fillRect(W * storm.two / storm.mangoes - 1, 0, 2, 7);
  context.fillRect(W * storm.three / storm.mangoes - 1, 0, 2, 7);

  const left = Math.max(0, Math.ceil(storm.duration - game.t));
  context.textAlign = "center"; context.textBaseline = "middle";
  const finale = storm.level > 0 && storm.level % 4 === 0;
  if (finale) {
    // A named storm: its name and a bar that drains as it passes, top centre, like a boss.
    pill(context, W / 2 - 66, 10, 132, 34, "#1c1611b3");
    context.font = FONT_NAME; context.fillStyle = "#ffd2a0"; context.fillText(storm.name, W / 2, 21);
    context.fillStyle = "#ffffff26"; context.fillRect(W / 2 - 54, 31, 108, 6);
    context.fillStyle = left <= 5 ? "#ffd75e" : "#e5483a"; context.fillRect(W / 2 - 54, 31, 108 * left / storm.duration, 6);
  } else {
    pill(context, W / 2 - 34, 10, 68, 30, "#1c1611a6");
    const fraction = left / storm.duration, low = left <= 5;
    context.strokeStyle = "#fff4dc55"; context.lineWidth = 3;
    context.beginPath(); context.arc(W / 2 - 16, 25, 7, 0, TAU); context.stroke();
    context.strokeStyle = low ? "#ffb35c" : "#fff4dc";
    context.beginPath(); context.arc(W / 2 - 16, 25, 7, -Math.PI / 2, -Math.PI / 2 + TAU * fraction); context.stroke();
    context.font = FONT_HUD; context.fillStyle = low ? "#ffb35c" : "#fff4dc";
    context.fillText(NUMBERS[left], W / 2 + 10, 26);
  }

  // Points and জান, top right; the streak under them.
  pill(context, W - 98, 10, 88, 30, "#1c1611a6");
  stamp(scene, scene.kinds[RIPE], W - 82, 25 - scene.oy, 0.2, 1);
  screen(scene);
  context.font = FONT_HUD; context.textAlign = "right"; context.fillStyle = "#fff4dc";
  context.fillText(NUMBERS[Math.max(0, Math.min(NUMBERS.length - 1, game.score))], W - 20, 26);
  for (let index = 0; index < game.hearts; index++) stamp(scene, scene.hearts[index < game.lives ? 1 : 0], W - 20 - index * 18, 52 - scene.oy, 0, 1);
  screen(scene);
  if (game.streak >= 3) {
    context.font = FONT_SMALL; context.fillStyle = "#ffd75e"; context.strokeStyle = "#1c1611"; context.lineWidth = 3;
    const text = STREAKS[Math.min(STREAKS.length - 1, game.streak)];
    context.strokeText(text, W - 12, 74); context.fillText(text, W - 12, 74);
  }
  context.textBaseline = "alphabetic";
}
