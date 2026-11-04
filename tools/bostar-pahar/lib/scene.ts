// The play canvas's setup: sizes, the world's pre-rendered layers (ground, truck, jib, clouds, sacks, the lights-out shade),
// and what happens to the scene on a landing or a miss. draw.hot.ts moves and draws it every frame.
import { LOAD_TOP, LOOKS, PAL, SACK_H, drawBank, drawCloud, drawGodown, drawLampPost, drawLaunch, drawLoad, drawPontoon, drawSack, drawTruckBack, drawTruckFront, skyTable, tintOver } from "./art";
import type { LevelDef } from "./levels";
import { HALF_VIEW, type Game } from "./rules";
import { shout } from "./words";

export type Mood = "idle" | "cheer" | "clap" | "point" | "laugh";
export type Scene = {
  w: number; h: number; ratio: number; u: number; sackH: number;
  /** `bedTop` is where the pile starts: on the row of sacks already in the truck bed (`floor`). */
  groundY: number; floor: number; bedTop: number; targetLine: number; rope: number;
  world: number; night: boolean; pontoon: boolean; gusty: boolean; rain: boolean;
  cam: number; zoom: number; viewTop: number; zoomT: number; settled: boolean;
  trolley: number; squashT: number; ringT: number; ringX: number;
  shout: string; shoutT: number; shoutColor: string;
  mood: Mood; moodT: number; clock: number; slow: boolean;
  /** Seconds since a gust hit (and its side), since a slip splashed (and where). */
  gustT: number; gustSide: number; splashT: number; splashX: number;
  /** Seconds of the end animation: the truck driving off or the pile toppling. */
  endT: number;
  dust: Float32Array; streaks: Float32Array;
  sky: string[];
  ground: HTMLCanvasElement | null; truck: HTMLCanvasElement | null; front: HTMLCanvasElement | null;
  jib: HTMLCanvasElement | null; cloud: HTMLCanvasElement | null; glow: HTMLCanvasElement | null; shade: HTMLCanvasElement | null;
  sacks: HTMLCanvasElement[];
};

export const PULLEY_Y = 30, JIB_H = 50;
export const DUST = 14, STREAKS = 26;
/** Sack sprites carry room for their ears. */
export const SPRITE_W = 1.3, SPRITE_H = 1.7;

export function makeScene(): Scene {
  return {
    w: 0, h: 0, ratio: 1, u: 1, sackH: 1, groundY: 0, floor: 0, bedTop: 0, targetLine: 0, rope: 1,
    world: 0, night: false, pontoon: false, gusty: false, rain: false,
    cam: 0, zoom: 1, viewTop: 0, zoomT: 0, settled: false, trolley: 0, squashT: 9, ringT: 9, ringX: 0,
    shout: "", shoutT: 9, shoutColor: PAL.accentDeep, mood: "idle", moodT: 0, clock: 0, slow: false,
    gustT: 9, gustSide: 1, splashT: 9, splashX: 0, endT: 0,
    dust: new Float32Array(DUST * 5), streaks: new Float32Array(STREAKS * 3), sky: skyTable(LOOKS[0]),
    ground: null, truck: null, front: null, jib: null, cloud: null, glow: null, shade: null, sacks: [],
  };
}

function offscreen(width: number, height: number, ratio: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * ratio)); canvas.height = Math.max(1, Math.round(height * ratio));
  const context = canvas.getContext("2d")!;
  context.scale(ratio, ratio);
  return { canvas, context };
}

/** The level's world and its features decide the layers; call before resizeScene, or call paint() after. */
export function setWorld(scene: Scene, def: LevelDef) {
  scene.world = def.world;
  scene.night = def.world === 2;
  scene.pontoon = def.pontoon > 0;
  scene.gusty = def.gusts > 0;
  scene.rain = def.storm;
  scene.sky = skyTable(LOOKS[def.world]);
  for (let index = 0; index < STREAKS; index++) {
    scene.streaks[index * 3] = (index * 137) % 1000 / 1000;
    scene.streaks[index * 3 + 1] = (index * 389) % 1000 / 1000;
    scene.streaks[index * 3 + 2] = 0.6 + ((index * 53) % 40) / 100;
  }
}

export function resizeScene(scene: Scene, w: number, h: number, ratio: number) {
  scene.w = w; scene.h = h; scene.ratio = ratio;
  scene.u = w / (HALF_VIEW * 2);
  scene.sackH = scene.u * SACK_H;
  scene.groundY = h - 0.22 * scene.u;
  scene.floor = scene.groundY - 0.95 * scene.u - (scene.pontoon ? 0.25 * scene.u : 0);
  scene.bedTop = scene.floor - LOAD_TOP * scene.u;
  // The pile's top settles here once the camera follows: three sacks under the hanging one, however tall the screen.
  scene.targetLine = Math.round(Math.max(h * 0.6, scene.bedTop - 2.3 * scene.sackH));
  scene.rope = scene.targetLine - 1.7 * scene.sackH - PULLEY_Y;
  paint(scene);
}

/** Everything that never moves, painted once per size and world (and again once the Bangla fonts arrive). */
export function paint(scene: Scene) {
  const { w, h, ratio, u, sackH, groundY, floor } = scene;
  if (!w || !h) return;
  const look = LOOKS[scene.world];
  const cx = w / 2, bankY = h * 0.58, ghatTop = h * 0.8;
  const ground = offscreen(w, h, ratio), c = ground.context;
  // The glow over the far bank: a 1-pixel-wide strip, stretched as wide as the view needs.
  const glowH = bankY - h * 0.25 + 2, glow = offscreen(1, glowH, 1), gradient = glow.context.createLinearGradient(0, 0, 0, glowH);
  gradient.addColorStop(0, "rgba(0,0,0,0)"); gradient.addColorStop(1, look.glow);
  glow.context.fillStyle = gradient; glow.context.fillRect(0, 0, 1, glowH);
  scene.glow = glow.canvas;
  const sunX = look.moon ? w * 0.78 : w * 0.3, sunY = look.moon ? h * 0.2 : bankY - u * 0.55;
  c.fillStyle = look.sunHalo; c.beginPath(); c.arc(sunX, sunY, u * 0.55, 0, Math.PI * 2); c.fill();
  c.fillStyle = look.sun; c.beginPath(); c.arc(sunX, sunY, u * (look.moon ? 0.24 : 0.32), 0, Math.PI * 2); c.fill();
  if (look.moon) {
    c.fillStyle = "rgba(255,255,255,0.75)";
    for (let star = 0; star < 18; star++) c.fillRect((star * 97) % w, (star * 53) % Math.round(bankY * 0.8), 1.5, 1.5);
  }
  drawBank(c, w, bankY - u * 0.2, u * 0.55);
  c.fillStyle = look.water; c.fillRect(0, bankY, w, h - bankY);
  c.fillStyle = look.waterLight;
  for (let row = 0; row < 5; row++) for (let x = (row * 37) % 60 - 20; x < w; x += 70) c.fillRect(x, bankY + 6 + row * ((ghatTop - bankY - 10) / 5), 26, 2);
  drawLaunch(c, w * 0.06, bankY + (ghatTop - bankY) * 0.55, w * 0.42);
  // The ghat's stone floor: all the way across, or on a pontoon level only the shore strip the porters stand on.
  const floorW = scene.pontoon ? 1.7 * u : w;
  c.fillStyle = PAL.ghatDark; c.fillRect(0, ghatTop, floorW, h - ghatTop);
  for (let step = 0; step < 3; step++) { c.fillStyle = step % 2 ? PAL.ghat : PAL.ghatLight; c.fillRect(0, ghatTop + step * 4, floorW, 3); }
  c.fillStyle = PAL.ghat; c.fillRect(0, ghatTop + 12, floorW, h - ghatTop - 12);
  c.fillStyle = PAL.ghatDark;
  for (let x = 7; x < floorW; x += 23) c.fillRect(x, ghatTop + 18 + ((x * 13) % 40) * ((h - ghatTop - 24) / 40), 3, 2);
  if (scene.pontoon) {
    c.fillStyle = look.waterLight;
    for (let row = 0; row < 4; row++) for (let x = floorW + ((row * 29) % 40); x < w; x += 64) c.fillRect(x, ghatTop + 10 + row * ((h - ghatTop) / 4.5), 22, 2);
  }
  drawGodown(c, -u * 0.2, u * 1.25, ghatTop + u * 0.25, ghatTop - u * 2.6, u);
  if (scene.night) drawLampPost(c, u * 1.5, ghatTop + u * 0.2, u * 1.6);
  tintOver(c, w, h, look.tint);
  scene.ground = ground.canvas;

  // The truck (and its pontoon) on their own layers, so they can roll and drive off.
  const truck = offscreen(w, h, ratio), t = truck.context;
  if (scene.pontoon) drawPontoon(t, cx + 0.2 * u, floor + 0.95 * u, u);
  else { t.fillStyle = "rgba(40,30,20,0.25)"; t.beginPath(); t.ellipse(cx + 0.5 * u, groundY, 2.5 * u, 0.1 * u, 0, 0, Math.PI * 2); t.fill(); }
  drawTruckBack(t, cx, floor, u);
  drawLoad(t, cx, floor, u);
  tintOver(t, w, h, look.tint);
  scene.truck = truck.canvas;
  const front = offscreen(w, h, ratio);
  drawTruckFront(front.context, cx, floor, u);
  tintOver(front.context, w, h, look.tint);
  scene.front = front.canvas;

  // The jib across the top, with the operator's cabin where it meets the mast.
  const jib = offscreen(w, JIB_H, ratio), j = jib.context;
  j.strokeStyle = PAL.craneDark; j.lineWidth = 1.5; j.fillStyle = PAL.crane;
  j.fillRect(0, 2, w, 4); j.fillRect(0, 17, w, 4); j.strokeRect(0, 2, w, 4); j.strokeRect(0, 17, w, 4);
  j.strokeStyle = PAL.crane; j.lineWidth = 2.5;
  j.beginPath(); for (let x = 0; x < w; x += 16) { j.moveTo(x, 6); j.lineTo(x + 8, 17); j.lineTo(x + 16, 6); } j.stroke();
  const cabX = w - 0.78 * u;
  j.fillStyle = PAL.crane; j.fillRect(cabX, 21, 0.62 * u, 26); j.strokeStyle = PAL.craneDark; j.lineWidth = 1.5; j.strokeRect(cabX, 21, 0.62 * u, 26);
  j.fillStyle = scene.night ? "#ffe3a0" : PAL.glass; j.fillRect(cabX + 4, 25, 0.62 * u - 8, 12);
  j.fillStyle = PAL.skin; j.beginPath(); j.arc(cabX + 0.31 * u, 33, 4.5, 0, Math.PI * 2); j.fill();
  j.fillStyle = PAL.hair; j.beginPath(); j.arc(cabX + 0.31 * u, 32, 4.7, Math.PI * 1.05, Math.PI * 1.95); j.fill();
  tintOver(j, w, JIB_H, look.tint);
  scene.jib = jib.canvas;

  const cloud = offscreen(u * 2, u * 0.7, ratio);
  drawCloud(cloud.context, 0, u * 0.68, u * 2);
  tintOver(cloud.context, u * 2, u * 0.7, look.cloud === "rgba(255,255,255,0.92)" ? "" : look.cloud);
  scene.cloud = cloud.canvas;

  scene.sacks = [0, 1, 2].map(kind => {
    const sprite = offscreen(u * SPRITE_W, sackH * SPRITE_H, ratio);
    drawSack(sprite.context, (u * SPRITE_W) / 2, (sackH * SPRITE_H) / 2, u, sackH, kind);
    tintOver(sprite.context, u * SPRITE_W, sackH * SPRITE_H, look.tint);
    return sprite.canvas;
  });

  // Lights out: a dark sheet twice the view's size with a lantern-sized hole in its middle, slid to wherever the hook is.
  const shade = offscreen(w * 2, h * 2, 1), s = shade.context;
  const hole = s.createRadialGradient(w, h, u * 0.5, w, h, u * 2.2);
  hole.addColorStop(0, "rgba(4,8,22,0)"); hole.addColorStop(1, "rgba(4,8,22,0.86)");
  s.fillStyle = hole; s.fillRect(0, 0, w * 2, h * 2);
  scene.shade = shade.canvas;
}

/** The world y of the middle of the sack at height `index` in the pile (0 is the one on the truck). */
export const sackY = (scene: Scene, index: number) => scene.bedTop - (index + 0.5) * scene.sackH;

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
  scene.shoutColor = verdict === "perfect" ? (scene.night ? "#ffd166" : PAL.accentDeep) : verdict === "wide" ? "#a14a12" : scene.night ? "#ffffff" : PAL.ink;
  scene.squashT = 0;
  scene.mood = verdict === "perfect" ? "cheer" : verdict === "wide" ? "point" : "clap";
  scene.moodT = 0;
  if (verdict === "perfect") { scene.ringT = 0; scene.ringX = game.xs[game.n - 1]; }
  if (scene.slow) return;
  puff(scene, scene.w / 2 + (game.truckX + game.xs[game.n - 1]) * scene.u, sackY(scene, game.n - 1) + scene.sackH / 2, verdict === "perfect" ? 6 : 4, verdict === "perfect" ? 1.4 : 1);
}

/** The sack missed: it tips off the pile into the river. */
export function onMiss(scene: Scene, game: Game) {
  scene.shout = shout(game.verdict ?? "slip", 0);
  scene.shoutT = 0;
  scene.shoutColor = scene.night ? "#ff9b8a" : "#a12a1f";
  scene.mood = "laugh"; scene.moodT = 0;
  scene.splashT = -0.45; scene.splashX = game.dropX + Math.sign(game.offset || 1) * 1.3;
}

/** A gust hits from `side`. */
export function onGust(scene: Scene, side: number) { scene.gustT = 0; scene.gustSide = side; }

export function restartScene(scene: Scene) {
  scene.cam = 0; scene.zoom = 1; scene.viewTop = 0; scene.zoomT = 0; scene.settled = false; scene.endT = 0;
  scene.squashT = 9; scene.ringT = 9; scene.shoutT = 9; scene.gustT = 9; scene.splashT = 9; scene.mood = "idle"; scene.moodT = 0;
  scene.dust.fill(0);
}
