// One frame of the room: copy the pre-painted room, brighten the window towards dawn, then the mosquitoes, the arrival
// chevrons, the bat, the sparks, the pops, the edge signals and the HUD in the corners. Allocation-free (npm run lint:games):
// no literals, closures or string building in here; every sprite and string comes from scene.ts.
import { BOSS, GHOST, SWARM } from "./levels";
import { ENTRY_X, ENTRY_Y, HIT_R, WINDOW } from "./room";
import { DIVING, FLY, TELLING, WAIT, WON, ZAPPED, type Game } from "./game";
import { bugFrame, FONT_BIG, FONT_HUD, FONT_NAME, FONT_POP, FONT_SMALL, NUMBERS, SPARKS, STREAKS, type Scene, type Sprite } from "./scene";
import { patternOf } from "./step.hot";

const TAU = Math.PI * 2;
/** A mosquito this close to what it's after warms the bottom edge and rings the pillow. */
const DANGER = 130;

function field(scene: Scene) { const r = scene.ratio, k = scene.s * r; scene.context.setTransform(k, 0, 0, k, scene.ox * r, scene.oy * r); }
function screen(scene: Scene) { const r = scene.ratio; scene.context.setTransform(r, 0, 0, r, 0, 0); }

/** Draws `image` centred at field point (x, y), mirrored when `flip` is −1, scaled by `scale`. */
function stamp(scene: Scene, image: Sprite, x: number, y: number, flip: number, scale: number) {
  const r = scene.ratio, k = scene.s * r * scale;
  scene.context.setTransform(k * flip, 0, 0, k, (scene.ox + x * scene.s) * r, (scene.oy + y * scene.s) * r);
  scene.context.drawImage(image.canvas, -image.w / 2, -image.h / 2, image.w, image.h);
}

function pill(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  context.fillStyle = color;
  context.beginPath(); context.roundRect(x, y, w, h, h / 2); context.fill();
}

/** How far into the night (0..1) the window's sky is: full at dawn, and held full while a boss keeps the dawn back. */
const dawnOf = (game: Game | null) => (!game ? 0.06 : game.over === WON || game.dawnHeld ? 1 : Math.min(1, game.t / game.row.length));

/** One frame. `game` is null on the title (the room waits, nothing flies yet). */
export function drawScene(scene: Scene, game: Game | null, calm: boolean, hud: boolean) {
  const context = scene.context, clock = scene.clock, t = game ? game.t : 0;
  screen(scene);
  context.globalAlpha = 1;
  context.drawImage(scene.bg, 0, 0, scene.cssW, scene.cssH);

  // The window brightens towards dawn; rain streaks on বৃষ্টির রাত.
  field(scene);
  const dawn = dawnOf(game);
  context.drawImage(scene.glassNight.canvas, WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h);
  context.globalAlpha = dawn * dawn;
  context.drawImage(scene.glassDawn.canvas, WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h);
  context.globalAlpha = 1;
  if (scene.palette.rain && !calm) {
    context.strokeStyle = "rgba(200,225,240,0.5)"; context.lineWidth = 1;
    context.beginPath();
    for (let i = 0; i < 9; i++) { const x = WINDOW.x + 4 + ((i * 23) % (WINDOW.w - 8)), y = WINDOW.y + ((i * 29 + clock * 150) % (WINDOW.h - 10)); context.moveTo(x, y); context.lineTo(x - 3, y + 9); }
    context.stroke();
  }

  if (game) {
    if (scene.game !== game) { scene.game = game; scene.seen = game.eventCount; }
    drawDanger(scene, game, calm);
    drawArrivals(scene, game, calm);
    drawBugs(scene, game, calm);
  }
  drawBat(scene);
  drawSparks(scene, calm);
  drawPops(scene, calm);
  if (game && hud) { drawEdges(scene, game, calm); drawHud(scene, game); }
  screen(scene);
  context.globalAlpha = 1;
}

/** A ring around what the nearest mosquito is after, pulsing harder as it closes in (the whine's visible twin). */
function drawDanger(scene: Scene, game: Game, calm: boolean) {
  const i = game.near;
  if (i < 0 || game.nearD > DANGER) return;
  const context = scene.context, close = 1 - game.nearD / DANGER, pulse = calm ? 0.5 : 0.5 + 0.5 * Math.sin(scene.clock * (6 + close * 8));
  field(scene);
  context.globalAlpha = 0.25 + 0.55 * close * (0.6 + 0.4 * pulse);
  context.strokeStyle = close > 0.6 ? "#ff8f6a" : "#ffd278"; context.lineWidth = 2 + close * 1.5;
  context.beginPath(); context.arc(game.tx[i], game.ty[i], 20 + pulse * 5 + (1 - close) * 6, 0, TAU); context.stroke();
  context.globalAlpha = 1;
}

/** A small chevron at the window, the door or the ঘুলঘুলি, 0.7 s before a mosquito comes through it. */
function drawArrivals(scene: Scene, game: Game, calm: boolean) {
  const context = scene.context;
  field(scene);
  context.strokeStyle = scene.palette.gold; context.lineWidth = 2.5; context.lineCap = "round"; context.lineJoin = "round";
  for (let i = 0; i < game.n; i++) {
    if (game.state[i] !== WAIT) continue;
    const ahead = game.at[i] - game.t;
    if (ahead > 0.7 || ahead < 0) continue;
    const door = game.door[i], x = ENTRY_X[door], y = ENTRY_Y[door], bob = calm ? 0 : Math.sin(scene.clock * 10) * 2;
    context.globalAlpha = 0.35 + 0.6 * (1 - ahead / 0.7);
    context.beginPath();
    if (door === 1) { context.moveTo(x + 4 + bob, y - 8); context.lineTo(x + 12 + bob, y); context.lineTo(x + 4 + bob, y + 8); }
    else { context.moveTo(x - 8, y + bob); context.lineTo(x, y + 8 + bob); context.lineTo(x + 8, y + bob); }
    context.stroke();
  }
  context.globalAlpha = 1;
}

function drawBugs(scene: Scene, game: Game, calm: boolean) {
  const context = scene.context, t = game.t;
  for (let i = 0; i < game.n; i++) {
    const state = game.state[i], kind = game.kind[i];
    if (state === ZAPPED) {
      const age = t - game.ended[i];
      if (age > 0.6 || calm) continue;
      context.globalAlpha = 1 - age / 0.6;
      stamp(scene, scene.speck, game.x[i] + Math.sin(age * 9) * 3, game.y[i] + age * age * 120, 1, kind === BOSS ? 2 : 1);
      context.globalAlpha = 1;
      continue;
    }
    if (state !== FLY) continue;
    const dx = game.x[i] - game.px[i];
    if (dx > 0.05) scene.facing[i] = 1; else if (dx < -0.05) scene.facing[i] = -1;
    const part = game.part[i], diving = part === DIVING || (part === TELLING && patternOf(game, i) !== GHOST && (calm || Math.sin(scene.clock * 30) > 0));
    const wing = calm ? 1 : (Math.floor(scene.clock * 38 + i) % 3 + 3) % 3;
    let alpha = game.vis[i];
    if (kind === BOSS && game.immune[i] > t && !calm) alpha *= 0.4 + 0.6 * (Math.sin(scene.clock * 50) > 0 ? 1 : 0);
    context.globalAlpha = alpha;
    const image = kind === BOSS ? scene.boss[(diving ? 3 : 0) + wing] : scene.bugs[bugFrame(kind === SWARM ? 3 : kind, diving, wing)];
    stamp(scene, image, game.x[i], game.y[i], scene.facing[i], 1);
    context.globalAlpha = 1;
  }
}

function drawBat(scene: Scene) {
  if (scene.batT >= 0.3) return;
  const context = scene.context;
  context.globalAlpha = scene.batT < 0.14 ? 1 : 1 - (scene.batT - 0.14) / 0.16;
  stamp(scene, scene.batHit ? scene.batLit : scene.bat, scene.batX, scene.batY + 20, 1, 1);
  context.globalAlpha = 1;
}

function drawSparks(scene: Scene, calm: boolean) {
  const context = scene.context, sparks = scene.sparks;
  field(scene);
  if (scene.aimOn && scene.batT >= 0.3) {
    context.strokeStyle = scene.palette.gold; context.lineWidth = 2; context.globalAlpha = 0.9;
    context.beginPath(); context.arc(scene.aimX, scene.aimY, HIT_R, 0, TAU); context.stroke();
    context.globalAlpha = 1;
  }
  if (calm) return;
  context.lineWidth = 2; context.lineCap = "round"; context.strokeStyle = "#d6f0ff";
  context.beginPath();
  for (let i = 0; i < SPARKS * 5; i += 5) {
    if (sparks[i + 4] <= 0) continue;
    context.moveTo(sparks[i], sparks[i + 1]); context.lineTo(sparks[i] - sparks[i + 2] * 0.04, sparks[i + 1] - sparks[i + 3] * 0.04);
  }
  context.stroke();
}

function drawPops(scene: Scene, calm: boolean) {
  const context = scene.context, pops = scene.pops;
  field(scene);
  context.textAlign = "center"; context.lineJoin = "round";
  for (let i = 0; i < pops.length; i++) {
    const pop = pops[i], age = scene.clock - pop.t;
    if (age < 0 || age > 0.8) continue;
    const y = pop.y - (calm ? 0 : age * 30);
    context.globalAlpha = 1 - age / 0.8;
    context.font = pop.big ? FONT_BIG : FONT_POP;
    context.strokeStyle = "#0a0f20"; context.lineWidth = 4; context.strokeText(pop.text, pop.x, y);
    context.fillStyle = pop.color; context.fillText(pop.text, pop.x, y);
  }
  context.globalAlpha = 1;
}

/** Danger at the edges only: one bite left (orange), a bite or slap (a red pulse), a mosquito close to the pillow (the bottom warms). */
function drawEdges(scene: Scene, game: Game, calm: boolean) {
  const context = scene.context, clock = scene.clock, w = scene.cssW, h = scene.cssH;
  screen(scene);
  if (game.hearts > 1 && game.bites === game.hearts - 1) {
    context.globalAlpha = calm ? 0.8 : 0.65 + 0.35 * Math.sin(clock * 5);
    context.drawImage(scene.edgeOrange, 0, 0, w, h);
  }
  const hurt = clock - scene.hurtT;
  if (hurt >= 0 && hurt < 0.45) {
    context.globalAlpha = calm ? 0.7 : 0.95 * (1 - hurt / 0.45);
    context.drawImage(scene.edgeRed, 0, 0, w, h);
  }
  if (game.near >= 0 && game.nearD < DANGER && game.part[game.near] === DIVING) {
    const close = 1 - game.nearD / DANGER;
    context.globalAlpha = calm ? 0.5 * close : close * (0.55 + 0.25 * Math.sin(clock * 12));
    context.drawImage(scene.edgeWarm, 0, 0, w, h);
  }
  context.globalAlpha = 1;
}

function drawHud(scene: Scene, game: Game) {
  const context = scene.context, w = scene.cssW, p = scene.palette;
  screen(scene);
  // The dawn line along the very top.
  context.fillStyle = "#00000059"; context.fillRect(0, 0, w, 4);
  context.fillStyle = p.dawn; context.fillRect(0, 0, w * dawnOf(game), 4);

  context.textAlign = "center"; context.textBaseline = "middle";
  const boss = game.boss, bossUp = boss >= 0 && (game.state[boss] === FLY || game.dawnHeld);
  if (bossUp) {
    // A boss: its name and one pip per hit left, top centre.
    const hp = game.hp[boss], full = game.row.boss, hit = scene.clock - scene.bossHitT < 0.3;
    pill(context, w / 2 - 70, 10, 140, 40, hit ? "#5a1f1fd0" : p.pill);
    context.font = FONT_NAME; context.fillStyle = "#ffd2a0"; context.fillText(scene.bossName, w / 2, 23);
    for (let i = 0; i < full; i++) {
      context.fillStyle = i < hp ? "#e5483a" : "#ffffff30";
      context.beginPath(); context.arc(w / 2 - (full - 1) * 8 + i * 16, 39, 4.5, 0, TAU); context.fill();
    }
  } else {
    const left = Math.max(0, Math.ceil(game.row.length - game.t)), low = left <= 3;
    pill(context, w / 2 - 34, 10, 68, 30, p.pill);
    // A moon that fills towards the sun as dawn nears.
    const fraction = Math.min(1, game.t / game.row.length);
    context.strokeStyle = "#ffffff40"; context.lineWidth = 3;
    context.beginPath(); context.arc(w / 2 - 16, 25, 7, 0, TAU); context.stroke();
    context.strokeStyle = p.dawn;
    context.beginPath(); context.arc(w / 2 - 16, 25, 7, -Math.PI / 2, -Math.PI / 2 + TAU * fraction); context.stroke();
    context.font = FONT_HUD; context.fillStyle = low ? p.gold : p.ink;
    context.fillText(NUMBERS[Math.min(NUMBERS.length - 1, left)], w / 2 + 10, 26);
  }

  // Mosquitoes zapped and the bites, top right; the streak under them.
  pill(context, w - 104, 10, 94, 30, p.pill);
  context.textAlign = "right"; context.font = FONT_HUD; context.fillStyle = p.ink;
  context.fillText(scene.tallies[Math.min(scene.tallies.length - 1, game.zaps)] ?? "", w - 18, 26);
  context.textAlign = "left"; context.font = FONT_SMALL; context.fillStyle = "#ffffffb0";
  context.fillText("মশা", w - 96, 26);
  const hearts = game.hearts, gap = 15, x0 = w - 18 - (hearts - 1) * gap;
  for (let i = 0; i < hearts; i++) {
    // A bite is a red drop; the ones left are pale rings.
    const used = i < game.bites, x = x0 + i * gap, y = 54;
    context.fillStyle = used ? "#e5483a" : "#00000066";
    context.beginPath(); context.moveTo(x, y - 7); context.quadraticCurveTo(x + 6, y, x, y + 5); context.quadraticCurveTo(x - 6, y, x, y - 7); context.fill();
    if (!used) { context.strokeStyle = "#ffffffaa"; context.lineWidth = 1.4; context.stroke(); }
  }
  if (game.combo >= 3) {
    context.textAlign = "right"; context.font = FONT_SMALL; context.fillStyle = p.gold; context.strokeStyle = "#0a0f20"; context.lineWidth = 3;
    const text = STREAKS[Math.min(STREAKS.length - 1, game.combo)];
    context.strokeText(text, w - 12, 76); context.fillText(text, w - 12, 76);
  }
  context.textBaseline = "alphabetic";
}

