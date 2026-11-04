// One frame of the field: copy the pre-painted field, then the কাকতাড়ুয়া, the shadows, the birds, the front paddy, the clap
// rings, the pops, the arrival chevrons, the dusk, the edge signals and the HUD in the corners. Allocation-free
// (npm run lint:games): no literals, closures or string building in here; every sprite and string comes from scene.ts.
import { flight, posOf } from "./step.hot";
import { H, HAT_X, HAT_Y, HIT_R, HOP, PERCH, SCARECROW, TO_HAT, WARN, depth } from "./field";
import { FLYING, GONE, HOPPING, PERCHED, SHOOED, SITTING, WAIT, DUSK, type Game } from "./afternoon";
import { FONT_BIG, FONT_HUD, FONT_NAME, FONT_POP, FONT_SMALL, NUMBERS, PERCENTS, SHOOS, STREAKS, type Scene, type Sprite } from "./scene";

const TAU = Math.PI * 2;
const SIT = 0, PECK = 1, UP = 2, DOWN = 3;

function field(scene: Scene) { const r = scene.ratio, k = scene.s * r; scene.context.setTransform(k, 0, 0, k, scene.ox * r, scene.oy * r); }
function screen(scene: Scene) { const r = scene.ratio; scene.context.setTransform(r, 0, 0, r, 0, 0); }

/** Draws `image` centred at field point (x, y), mirrored when `flip` is −1, scaled, turned by `angle`. */
function stamp(scene: Scene, image: Sprite, x: number, y: number, flip: number, scale: number, angle: number) {
  const r = scene.ratio, k = scene.s * r * scale, cos = Math.cos(angle) * k, sin = Math.sin(angle) * k;
  scene.context.setTransform(cos * flip, sin * flip, -sin, cos, (scene.ox + x * scene.s) * r, (scene.oy + y * scene.s) * r);
  scene.context.drawImage(image.canvas, -image.w / 2, -image.h / 2, image.w, image.h);
}

function pill(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  context.fillStyle = color;
  context.beginPath(); context.roundRect(x, y, w, h, h / 2); context.fill();
}

const smooth = (u: number) => u * u * (3 - 2 * u);
const easeOut = (u: number) => 1 - (1 - u) * (1 - u);
/** How far into the afternoon (0..1) the light is: full at dusk, and held full while a boss keeps the dusk back. */
const duskOf = (game: Game | null) => (!game ? 0.05 : game.over === DUSK || game.duskHeld ? 1 : Math.min(1, game.t / game.row.length));
const bossUp = (game: Game) => game.boss >= 0 && (game.duskHeld || (game.state[game.boss] !== WAIT && game.state[game.boss] !== SHOOED));

/** One frame. `game` is null on the title (the field waits, nothing flies yet). */
export function drawScene(scene: Scene, game: Game | null, calm: boolean, hud: boolean) {
  const context = scene.context;
  screen(scene);
  context.globalAlpha = 1;
  context.drawImage(scene.bg, 0, 0, scene.cssW, scene.cssH);
  if (scene.mist) { context.globalAlpha = calm ? 0.8 : 0.72 + 0.12 * Math.sin(scene.clock * 0.4); context.drawImage(scene.mist, 0, 0, scene.cssW, scene.cssH); context.globalAlpha = 1; }

  if (game) drawScarecrow(scene, game, calm); // the title has its own, bigger, in the start button
  if (game) {
    if (scene.game !== game) { scene.game = game; scene.seen = game.eventCount; }
    drawShadows(scene, game);
    drawBirds(scene, game, calm);
  }
  // The front paddy sways a touch.
  const sway = calm ? 0 : Math.sin(scene.clock * 1.3) * 0.03, r = scene.ratio, k = scene.s * r;
  context.setTransform(k, 0, sway * k, k, (scene.ox + scene.left * scene.s - sway * 80 * scene.s) * r, (scene.oy + (H - 80) * scene.s) * r);
  context.drawImage(scene.front.canvas, 0, 0, scene.front.w, scene.front.h);

  drawRipples(scene, calm);
  if (scene.handOn && game) { field(scene); stamp(scene, scene.hand, scene.handX, scene.handY, 1, 1.1, 0); }
  drawPops(scene, calm);
  if (game && hud) drawArrivals(scene, game, calm);

  // The light goes rose towards dusk.
  screen(scene);
  const dusk = duskOf(game) * 0.34;
  if (dusk > 0.01) { context.globalAlpha = dusk; context.drawImage(scene.dusk, 0, 0, scene.cssW, scene.cssH); context.globalAlpha = 1; }
  if (game && hud) { drawEdges(scene, game, calm); drawHud(scene, game); }
  screen(scene);
  context.globalAlpha = 1;
}

/** The কাকতাড়ুয়া frets as the grain goes, and gives a little jig with each fresh shoo. The ঝুঁটি শালিক may sit on its মাথাল. */
function drawScarecrow(scene: Scene, game: Game | null, calm: boolean) {
  const grain = game ? game.grain : 100, mood = grain > 70 ? 0 : grain > 40 ? 1 : 2, since = scene.clock - scene.jigT;
  const jig = !calm && since < 0.4 ? Math.sin(since * 30) * 0.05 * (1 - since / 0.4) : 0;
  const image = scene.scarecrow[mood], r = scene.ratio, k = scene.s * r;
  const cos = Math.cos(jig) * k, sin = Math.sin(jig) * k;
  scene.context.setTransform(cos, sin, -sin, cos, (scene.ox + SCARECROW.x * scene.s) * r, (scene.oy + SCARECROW.base * scene.s) * r);
  scene.context.drawImage(image.canvas, -image.w / 2, -image.h, image.w, image.h);
}

function spriteOf(scene: Scene, game: Game, i: number, pose: number) {
  return i === game.boss ? scene.boss[pose] : scene.birds[game.kind[i] * 4 + pose];
}

/** Where each bird will sit, as a shadow on the paddy: growing as it flies in. This is where to tap. */
function drawShadows(scene: Scene, game: Game) {
  const context = scene.context;
  field(scene);
  context.fillStyle = "#4a2a10";
  for (let i = 0; i < game.n; i++) {
    const state = game.state[i];
    if (state !== FLYING && state !== SITTING && state !== HOPPING) continue;
    const u = state === FLYING ? flight(game, i) : 1, big = i === game.boss ? scene.bossSize : 1, scale = depth(game.y[i]) * big;
    const x = state === HOPPING ? posOf(game, i, 0) : game.x[i], y = state === HOPPING ? posOf(game, i, 1) : game.y[i];
    context.globalAlpha = 0.3 * u;
    context.beginPath(); context.ellipse(x, y + 16 * scale, 13 * scale * (0.55 + 0.45 * u), 3.6 * scale * (0.55 + 0.45 * u), 0, 0, TAU); context.fill();
    if (state === FLYING && u < 1) {
      // A faint ring where it will land, so the spot reads even before the shadow darkens.
      context.globalAlpha = 0.2 + 0.25 * u;
      context.strokeStyle = "#fff4d8"; context.lineWidth = 1.4;
      context.beginPath(); context.ellipse(x, y + 16 * scale, 16 * scale, 5 * scale, 0, 0, TAU); context.stroke();
    }
  }
  context.globalAlpha = 1;
}

function drawBirds(scene: Scene, game: Game, calm: boolean) {
  const context = scene.context, t = game.t, clock = scene.clock, fog = game.row.fog;
  for (let i = 0; i < game.n; i++) {
    const state = game.state[i];
    if (state === WAIT) continue;
    const scale = depth(game.y[i]), wing = Math.floor(clock * 14 + i) % 2 ? UP : DOWN;
    if (state === FLYING) {
      const u = flight(game, i);
      const fromX = game.via[i] ? game.fromX[i] : game.side[i] === -1 ? scene.left - 30 : scene.right + 30;
      const fromY = game.via[i] ? game.fromY[i] : game.skyY[i];
      let alpha = fog ? Math.min(1, Math.max(0, (u - 0.55) / 0.3)) : 1;
      if (calm) {
        // Reduced motion: it fades in where it will sit.
        context.globalAlpha = u * alpha;
        stamp(scene, spriteOf(scene, game, i, SIT), game.x[i], game.y[i], game.side[i] === -1 ? 1 : -1, scale, 0);
        context.globalAlpha = 1;
        continue;
      }
      if (alpha <= 0) continue;
      const eased = easeOut(u), x = fromX + (game.x[i] - fromX) * eased;
      const y = fromY + (game.y[i] - fromY) * smooth(u) - (game.via[i] ? 40 : 24) * Math.sin(Math.PI * u);
      alpha = Math.max(0, Math.min(1, alpha));
      context.globalAlpha = alpha;
      stamp(scene, spriteOf(scene, game, i, u > 0.9 ? SIT : wing), x, y, game.x[i] >= fromX ? 1 : -1, scale, 0);
      context.globalAlpha = 1;
    } else if (state === SITTING) {
      const since = t - game.lastPeck[i], facing = game.side[i] === -1 ? 1 : -1;
      const turn = !calm && Math.floor((clock + i * 0.77) / 1.9) % 3 === 2 ? -1 : 1;
      stamp(scene, spriteOf(scene, game, i, since >= 0 && since < 0.2 ? PECK : SIT), game.x[i], game.y[i], facing * turn, scale, 0);
      if (!calm && since >= 0 && since < 0.45) {
        // A few grains fall from the beak.
        field(scene);
        context.fillStyle = scene.palette.gold;
        for (let grain = 0; grain < 3; grain++) {
          const gx = game.x[i] + facing * turn * (14 + grain * 3) * scale, gy = game.y[i] + (6 + grain * 2) * scale + 70 * since * since * (1 + grain * 0.4);
          context.beginPath(); context.ellipse(gx, gy, 1.6, 2.3, 0.5, 0, TAU); context.fill();
        }
      }
    } else if (state === HOPPING) {
      const u = Math.min(1, Math.max(0, (t - game.moveAt[i]) / HOP));
      stamp(scene, spriteOf(scene, game, i, calm ? SIT : wing), posOf(game, i, 0), posOf(game, i, 1) - (calm ? 0 : 16 * Math.sin(Math.PI * u)), game.flee[i], scale, 0);
    } else if (state === PERCHED) {
      // Up onto the মাথাল, then a smug rest there, out of reach.
      const since = t - (game.moveAt[i] - PERCH - TO_HAT), u = Math.min(1, Math.max(0, since / TO_HAT));
      const x = game.fromX[i] + (HAT_X - game.fromX[i]) * easeOut(u), y = game.fromY[i] + (HAT_Y - 12 - game.fromY[i]) * smooth(u);
      stamp(scene, spriteOf(scene, game, i, u < 1 && !calm ? wing : SIT), x, y, HAT_X >= game.fromX[i] ? 1 : -1, 0.82, 0);
    } else if (state === SHOOED || state === GONE) {
      const age = t - game.shooAt[i], last = state === GONE ? 1.4 : 1;
      if (age < 0 || age > last) continue;
      if (calm) {
        if (age > 0.45) continue;
        context.globalAlpha = 1 - age / 0.45;
        stamp(scene, spriteOf(scene, game, i, SIT), game.x[i], game.y[i], game.flee[i], scale, 0);
        context.globalAlpha = 1;
        continue;
      }
      // A cheerful hop, then away and up, flapping, away from the hand (at dusk, unhurried, home).
      const slow = state === GONE ? 0.55 : 1, a = age * slow;
      const x = game.x[i] + game.flee[i] * (70 * a + 260 * a * a), y = game.y[i] - 12 * Math.sin(Math.min(1, a / 0.14) * Math.PI / 2) - 150 * a - 90 * a * a;
      context.globalAlpha = age < last * 0.7 ? 1 : 1 - (age - last * 0.7) / (last * 0.3);
      stamp(scene, spriteOf(scene, game, i, Math.floor(age * 16) % 2 ? UP : DOWN), x, y, game.flee[i], scale, -0.25 * game.flee[i]);
      context.globalAlpha = 1;
    }
  }
}

/** Each clap: a ring where you tapped, and three clap marks when it reached a bird. */
function drawRipples(scene: Scene, calm: boolean) {
  const context = scene.context;
  field(scene);
  context.strokeStyle = "#fffbe8"; context.lineWidth = 3.5; context.lineCap = "round";
  for (let index = 0; index < scene.ripples.length; index++) {
    const ripple = scene.ripples[index], age = scene.clock - ripple.t;
    if (age < 0 || age > 0.35) continue;
    const u = age / 0.35, r = calm ? 18 : 10 + 22 * u;
    context.globalAlpha = 1 - u;
    context.beginPath(); context.arc(ripple.x, ripple.y, r, 0, TAU); context.stroke();
    if (ripple.hit) {
      context.beginPath();
      for (let mark = 0; mark < 3; mark++) {
        const a = -Math.PI / 2 + (mark - 1) * 0.7;
        context.moveTo(ripple.x + Math.cos(a) * (r + 4), ripple.y + Math.sin(a) * (r + 4));
        context.lineTo(ripple.x + Math.cos(a) * (r + 11), ripple.y + Math.sin(a) * (r + 11));
      }
      context.stroke();
    }
  }
  if (scene.handOn) {
    context.globalAlpha = 0.6; context.lineWidth = 2;
    context.beginPath(); context.arc(scene.handX, scene.handY, HIT_R, 0, TAU); context.stroke();
  }
  context.globalAlpha = 1;
}

function drawPops(scene: Scene, calm: boolean) {
  const context = scene.context, pops = scene.pops;
  field(scene);
  context.textAlign = "center"; context.lineJoin = "round";
  for (let i = 0; i < pops.length; i++) {
    const pop = pops[i], age = scene.clock - pop.t;
    if (age < 0 || age > 0.8) continue;
    const y = pop.y - (calm ? 0 : age * 30);
    context.globalAlpha = age < 0.55 ? 1 : 1 - (age - 0.55) / 0.25;
    context.font = pop.big ? FONT_BIG : FONT_POP;
    context.strokeStyle = "#4a240e"; context.lineWidth = 5; context.strokeText(pop.text, pop.x, y);
    context.fillStyle = pop.color; context.fillText(pop.text, pop.x, y);
  }
  context.globalAlpha = 1;
}

/** A chevron at the left or right edge, at the bird's height, just before it flies in: what the edge is about to send. */
function drawArrivals(scene: Scene, game: Game, calm: boolean) {
  const context = scene.context;
  field(scene);
  context.lineCap = "round"; context.lineJoin = "round";
  for (let i = 0; i < game.n; i++) {
    if (game.state[i] !== WAIT || game.via[i]) continue;
    const ahead = game.t0[i] - game.t;
    if (ahead > WARN || ahead < 0) continue;
    const side = game.side[i], boss = i === game.boss, x = side === -1 ? scene.left + 8 : scene.right - 8, y = game.skyY[i];
    const d = -side, bob = calm ? 0 : Math.sin(scene.clock * 10) * 2 * d, size = boss ? 13 : 8;
    context.globalAlpha = 0.4 + 0.6 * (1 - ahead / WARN);
    context.strokeStyle = boss ? "#e5483a" : game.kind[i] === 1 ? "#2a1a10" : "#fff6dc"; context.lineWidth = boss ? 4 : 3;
    context.beginPath();
    context.moveTo(x - d * size * 0.5 + bob, y - size); context.lineTo(x + d * size * 0.5 + bob, y); context.lineTo(x - d * size * 0.5 + bob, y + size);
    context.stroke();
  }
  context.globalAlpha = 1;
}

/** Danger at the edges only: grain under the pass mark (orange, red under 20%), and a short warm pulse for each tenth lost. */
function drawEdges(scene: Scene, game: Game, calm: boolean) {
  const context = scene.context, clock = scene.clock, w = scene.cssW, h = scene.cssH;
  screen(scene);
  if (game.grain < game.row.pass) {
    context.globalAlpha = calm ? 0.75 : 0.72 + 0.28 * Math.sin(clock * 5);
    context.drawImage(game.grain < 20 ? scene.edgeRed : scene.edgeOrange, 0, 0, w, h);
  }
  const since = clock - scene.tenthT;
  if (since >= 0 && since < 0.45) {
    context.globalAlpha = calm ? 0.55 : 0.9 * (1 - since / 0.45);
    context.drawImage(scene.edgeWarm, 0, 0, w, h);
  }
  context.globalAlpha = 1;
}

function drawHud(scene: Scene, game: Game) {
  const context = scene.context, w = scene.cssW, p = scene.palette, row = game.row;
  screen(scene);
  // The dusk line along the very top.
  context.fillStyle = "#00000047"; context.fillRect(0, 0, w, 4);
  context.fillStyle = p.gold; context.fillRect(0, 0, w * duskOf(game), 4);

  context.textBaseline = "middle"; context.textAlign = "center";
  const boss = game.boss;
  if (bossUp(game)) {
    // A boss: its name and one pip per clap left, top centre on a second row (clear of the badge and the grain).
    const hp = game.hp[boss], full = row.boss, hit = scene.clock - scene.bossHitT < 0.3;
    pill(context, w / 2 - 64, 46, 128, 40, hit ? "#7a2a1ad8" : p.pill);
    context.font = FONT_NAME; context.fillStyle = "#ffe2b0"; context.fillText(scene.bossName, w / 2, 59);
    for (let i = 0; i < full; i++) {
      context.fillStyle = i < hp ? "#e5483a" : "#ffffff30";
      context.beginPath(); context.arc(w / 2 - (full - 1) * 8 + i * 16, 75, 4.5, 0, TAU); context.fill();
    }
  }
  {
    const left = Math.max(0, Math.ceil(row.length - game.t)), low = left <= 3;
    pill(context, w / 2 - 34, 10, 68, 30, p.pill);
    // A sun that sinks behind a short horizon line as dusk nears.
    const sink = Math.min(1, game.t / row.length);
    context.save();
    context.beginPath(); context.rect(w / 2 - 26, 12, 20, 19); context.clip();
    context.fillStyle = low ? "#ff8a4a" : p.gold;
    context.beginPath(); context.arc(w / 2 - 16, 20 + sink * 10, 6, 0, TAU); context.fill();
    context.restore();
    context.strokeStyle = p.ink; context.lineWidth = 1.5;
    context.beginPath(); context.moveTo(w / 2 - 26, 31); context.lineTo(w / 2 - 6, 31); context.stroke();
    context.font = FONT_HUD; context.fillStyle = low ? p.gold : p.ink;
    context.fillText(NUMBERS[Math.min(NUMBERS.length - 1, left)], w / 2 + 11, 26);
  }

  // The grain: a sheaf, a line with a notch at each star mark, and the percent, top right; the birds shooed under it.
  const x0 = w - 152;
  pill(context, x0, 10, 142, 30, p.pill);
  const r = scene.ratio;
  context.setTransform(r, 0, 0, r, 0, 0);
  context.drawImage(scene.sheaf.canvas, x0 + 6, 13, 24, 24);
  const barX = x0 + 34, barW = 56, fraction = Math.max(0, game.grain / 100);
  context.fillStyle = "#ffffff2a";
  context.beginPath(); context.roundRect(barX, 20, barW, 10, 5); context.fill();
  context.fillStyle = game.grain >= row.two ? p.gold : game.grain >= row.pass ? "#ffad42" : "#ff6a4a";
  if (fraction > 0.02) { context.beginPath(); context.roundRect(barX, 20, barW * fraction, 10, 5); context.fill(); }
  context.fillStyle = p.ink;
  context.fillRect(barX + barW * row.pass / 100 - 0.75, 17, 1.5, 16);
  context.fillRect(barX + barW * row.two / 100 - 0.75, 17, 1.5, 16);
  context.fillRect(barX + barW * row.three / 100 - 0.75, 17, 1.5, 16);
  context.textAlign = "right"; context.font = FONT_HUD; context.fillStyle = p.ink;
  context.fillText(PERCENTS[Math.max(0, Math.min(100, game.grain))], w - 18, 26);
  context.font = FONT_SMALL; context.strokeStyle = "#2a160acc"; context.lineWidth = 3; context.lineJoin = "round";
  const shoos = SHOOS[Math.min(SHOOS.length - 1, game.shooed)];
  context.strokeText(shoos, w - 14, 52); context.fillStyle = p.ink; context.fillText(shoos, w - 14, 52);
  if (game.combo >= 3) {
    const text = STREAKS[Math.min(STREAKS.length - 1, game.combo)];
    context.fillStyle = p.gold; context.strokeText(text, w - 14, 70); context.fillText(text, w - 14, 70);
  }
  context.textBaseline = "alphabetic";
}
