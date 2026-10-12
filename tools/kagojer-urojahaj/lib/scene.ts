// Draws a frame: the offscreen sky, telegraphed rain lanes, clouds, drops, রোদ, paper balls, the plane and a few sparks.
// Sprites and the sky are painted once per size; a frame only blits them and touches preallocated pools.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import { PAL, paintBall, paintCloud, paintDrop, paintFarClouds, paintPlane, paintSky, paintStorm, paintSun } from "./art";
import { EV, HITS_MAX, progressOf, type Game } from "./game";
import { isStorm, worldOf } from "./levels";
import { DROP_R, H, LANE, PLANE_Y, STORM, W, stormActive } from "./wave";

const bn = new Intl.NumberFormat("bn-BD", { useGrouping: false });
/** "+১০" strings made once, so floating points never build a string mid-game. */
const PLUS = Array.from({ length: 200 }, (_, value) => `+${bn.format(value)}`);
const SPARKS = 72, FLOATS = 10, DRIP_AHEAD = 0.45, PLANE_SIZE = 15;

type Sprite = { canvas: HTMLCanvasElement; w: number; h: number };
export type Scene = {
  width: number; height: number; ratio: number; scale: number; key: string;
  sky: HTMLCanvasElement | null; far: HTMLCanvasElement | null; sprites: Record<string, Sprite>;
  scroll: number; flash: number; wobble: number;
  sparkLife: Float32Array; sparkX: Float32Array; sparkY: Float32Array; sparkVx: Float32Array; sparkVy: Float32Array; sparkKind: Uint8Array;
  floatLife: Float32Array; floatX: Float32Array; floatY: Float32Array; floatN: Uint8Array;
  font: string;
};

export const makeScene = (): Scene => ({
  width: 0, height: 0, ratio: 1, scale: 1, key: "", sky: null, far: null, sprites: {}, scroll: 0, flash: 0, wobble: 0,
  sparkLife: new Float32Array(SPARKS), sparkX: new Float32Array(SPARKS), sparkY: new Float32Array(SPARKS), sparkVx: new Float32Array(SPARKS), sparkVy: new Float32Array(SPARKS), sparkKind: new Uint8Array(SPARKS),
  floatLife: new Float32Array(FLOATS), floatX: new Float32Array(FLOATS), floatY: new Float32Array(FLOATS), floatN: new Uint8Array(FLOATS),
  font: "",
});

function sprite(scene: Scene, w: number, h: number, paint: (context: CanvasRenderingContext2D, unit: number) => void): Sprite {
  const canvas = document.createElement("canvas"), px = scene.scale * scene.ratio;
  canvas.width = Math.ceil(w * px); canvas.height = Math.ceil(h * px);
  const context = canvas.getContext("2d")!;
  context.translate(canvas.width / 2, canvas.height / 2);
  paint(context, px);
  return { canvas, w, h };
}

/** Re-paints the sky and sprites for a new size or level (never during a frame). */
export function prepareScene(scene: Scene, width: number, height: number, ratio: number, level: number) {
  const key = `${width}x${height}@${ratio}:${worldOf(level).id}:${isStorm(level)}`;
  if (key === scene.key) return;
  const sizeChanged = !scene.key.startsWith(`${width}x${height}@${ratio}:`);
  scene.key = key; scene.width = width; scene.height = height; scene.ratio = ratio; scene.scale = width / W;
  scene.font = `800 ${Math.round(4.2 * scene.scale)}px ${DISPLAY_FONT}, sans-serif`;
  const make = (paint: (context: CanvasRenderingContext2D, w: number, h: number) => void) => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    paint(canvas.getContext("2d")!, canvas.width, canvas.height);
    return canvas;
  };
  scene.sky = make((context, w, h) => paintSky(context, worldOf(level).id, isStorm(level), w, h));
  scene.far = make((context, w, h) => paintFarClouds(context, w, h, isStorm(level)));
  if (!sizeChanged && scene.sprites.plane) return;
  const s = scene.sprites;
  s.plane = sprite(scene, PLANE_SIZE + 6, PLANE_SIZE + 6, (c, u) => paintPlane(c, PLANE_SIZE * u, 0, true));
  s.wet = sprite(scene, PLANE_SIZE + 6, PLANE_SIZE + 6, (c, u) => paintPlane(c, PLANE_SIZE * u, 1));
  for (const [name, kind, w, h, cracked, lit] of [["puff", "puff", 16, 11, false, false], ["puffLit", "puff", 16, 11, false, true], ["dark", "dark", 19, 13, false, false],
    ["cracked", "dark", 19, 13, true, false], ["crackedLit", "dark", 19, 13, true, true], ["spit", "spit", 12, 9, false, false]] as const) {
    s[name] = sprite(scene, w + 3, h + 3, (c, u) => paintCloud(c, kind, w * u, h * u, cracked, lit));
  }
  s.storm = sprite(scene, 62, 30, (c, u) => paintStorm(c, 60 * u, 26 * u));
  s.stormLit = sprite(scene, 62, 30, (c, u) => paintStorm(c, 60 * u, 26 * u, true));
  s.sun = sprite(scene, 10, 10, (c, u) => paintSun(c, 3.2 * u));
  s.ball = sprite(scene, 4, 4, (c, u) => paintBall(c, 1.6 * u));
  s.drop = sprite(scene, 4, 5, (c, u) => { c.translate(0, 0.6 * u); paintDrop(c, DROP_R * u); });
}

/** Sparks and floating points for an event (visual only; skipped in slow mode except the points). */
export function sceneEvent(scene: Scene, type: number, x: number, y: number, n: number, slow: boolean) {
  if (type === EV.pop || type === EV.burst || type === EV.stormPop) {
    const free = scene.floatLife.findIndex(life => life <= 0);
    const points = type === EV.stormPop ? 150 : n;
    if (free >= 0 && points < PLUS.length) { scene.floatLife[free] = 0.8; scene.floatX[free] = x; scene.floatY[free] = y; scene.floatN[free] = points; }
  }
  if (type === EV.wet) scene.wobble = 0.6;
  if (type === EV.thunder && !slow) scene.flash = 0.35;
  if (slow) return;
  const count = type === EV.stormPop ? 28 : type === EV.burst ? 14 : type === EV.pop ? 9 : type === EV.wet ? 8 : type === EV.crack ? 4 : 0;
  for (let made = 0, index = 0; index < SPARKS && made < count; index++) {
    if (scene.sparkLife[index] > 0) continue;
    const angle = Math.random() * Math.PI * 2, speed = 10 + Math.random() * (type === EV.stormPop ? 40 : 22);
    const rain = type === EV.burst || type === EV.wet || (type === EV.stormPop && made % 2 === 0);
    scene.sparkLife[index] = 0.5 + Math.random() * 0.3; scene.sparkKind[index] = rain ? 1 : 0;
    scene.sparkX[index] = x + (Math.random() - 0.5) * 6; scene.sparkY[index] = y + (Math.random() - 0.5) * 4;
    scene.sparkVx[index] = rain ? (Math.random() - 0.5) * 8 : Math.cos(angle) * speed; scene.sparkVy[index] = rain ? 30 + Math.random() * 25 : Math.sin(angle) * speed;
    made++;
  }
}

export function updateScene(scene: Scene, dt: number, slow: boolean, moving: boolean) {
  if (!slow && moving) scene.scroll = (scene.scroll + dt * 7) % H;
  if (scene.flash > 0) scene.flash -= dt;
  if (scene.wobble > 0) scene.wobble -= dt;
  for (let index = 0; index < SPARKS; index++) {
    if (scene.sparkLife[index] <= 0) continue;
    scene.sparkLife[index] -= dt;
    scene.sparkX[index] += scene.sparkVx[index] * dt; scene.sparkY[index] += scene.sparkVy[index] * dt;
    if (!scene.sparkKind[index]) { scene.sparkVx[index] *= 0.92; scene.sparkVy[index] *= 0.92; }
  }
  for (let index = 0; index < FLOATS; index++) if (scene.floatLife[index] > 0) { scene.floatLife[index] -= dt; scene.floatY[index] -= dt * 12; }
}

function blit(context: CanvasRenderingContext2D, scene: Scene, s: Sprite, x: number, y: number, scale = 1) {
  const k = scene.scale, w = s.w * k * scale, h = s.h * k * scale;
  context.drawImage(s.canvas, x * k - w / 2, y * k - h / 2, w, h);
}

export function drawScene(context: CanvasRenderingContext2D, scene: Scene, game: Game, slow: boolean) {
  const { width, height, scale: k, sprites: s } = scene;
  if (!scene.sky || !s.plane) return;
  const { wave, t } = game, storm = wave.storm;
  context.drawImage(scene.sky, 0, 0, width, height);
  if (scene.far) {
    const offset = (scene.scroll / H) * height;
    context.drawImage(scene.far, 0, offset - height, width, height);
    context.drawImage(scene.far, 0, offset, width, height);
  }

  // The storm: a darker sky while it's here, then lanes that shade in before the rain comes down them.
  if (storm && game.stormState === 1) {
    context.globalAlpha = 0.18; context.fillStyle = "#1c2236"; context.fillRect(0, 0, width, height);
    for (let index = 0; index < storm.curtains.length; index++) {
      const curtain = storm.curtains[index], ahead = curtain.t - t;
      if (ahead > curtain.warn || ahead < -1.6 || !stormActive(storm, curtain.t)) continue;
      context.globalAlpha = ahead > 0 ? 0.08 + 0.2 * (1 - ahead / curtain.warn) : Math.max(0, 0.28 + ahead * 0.17);
      context.fillStyle = "#1c2440";
      for (let slot = 0; slot < curtain.slots.length; slot++) context.fillRect((LANE(curtain.slots[slot]) - 5) * k, (game.stormY + 8) * k, 10 * k, height);
    }
    context.globalAlpha = 1;
    blit(context, scene, game.stormFlash > 0 ? s.stormLit : s.storm, game.stormX, game.stormY);
  }

  // Clouds, then a drop swelling under each dark cloud just before it falls.
  for (let index = 0; index < game.nextCloud; index++) {
    if (game.cloudState[index] !== 1) continue;
    const c = wave.clouds[index], lit = game.cloudFlash[index] > 0;
    const sp = c.kind === "puff" ? s.puff : c.kind === "spit" ? s.spit : game.cloudHp[index] < c.hp ? (lit ? s.crackedLit : s.cracked) : s.dark;
    blit(context, scene, sp, game.cloudX[index], game.cloudY[index]);
  }
  for (let index = game.nextDrop; index < wave.drops.length; index++) {
    const drop = wave.drops[index], ahead = drop.t - t;
    if (ahead > DRIP_AHEAD) break;
    if (drop.source === STORM || game.cloudState[drop.source] !== 1) continue;
    blit(context, scene, s.drop, game.cloudX[drop.source], game.cloudY[drop.source] + wave.clouds[drop.source].rh * 0.6, 0.3 + 0.7 * (1 - ahead / DRIP_AHEAD));
  }
  for (let index = 0; index < game.dropAlive.length; index++) if (game.dropAlive[index]) blit(context, scene, s.drop, game.dropX[index], game.dropY[index]);
  for (let index = 0; index < game.sunAlive.length; index++) if (game.sunAlive[index]) blit(context, scene, s.sun, game.sunX[index], game.sunY[index]);
  for (let index = 0; index < game.ballAlive.length; index++) if (game.ballAlive[index]) blit(context, scene, s.ball, game.ballX[index], game.ballY[index]);

  // The plane banks as it moves, wobbles when wet, and darkens a little with each soaking.
  const bank = Math.max(-1, Math.min(1, game.vx / 90));
  const wobble = scene.wobble > 0 && !slow ? Math.sin(scene.wobble * 30) * 0.12 * scene.wobble : 0;
  const bob = slow || game.phase !== "play" ? 0 : Math.sin(t * 3) * 0.6;
  context.save();
  context.translate(game.px * k, (PLANE_Y + bob) * k);
  context.rotate(bank * 0.12 + wobble);
  context.scale(1 - Math.abs(bank) * 0.22, 1);
  blit(context, scene, s.plane, 0, 0);
  if (game.hits) { context.globalAlpha = Math.min(1, game.hits / HITS_MAX); blit(context, scene, s.wet, 0, 0); context.globalAlpha = 1; }
  context.restore();

  // Sparks: white puffs for a pop, short blue streaks for rain.
  context.fillStyle = "#ffffff"; context.strokeStyle = PAL.drop; context.lineWidth = Math.max(1, 0.5 * k);
  for (let index = 0; index < SPARKS; index++) {
    const life = scene.sparkLife[index];
    if (life <= 0) continue;
    context.globalAlpha = Math.min(1, life * 2);
    const x = scene.sparkX[index] * k, y = scene.sparkY[index] * k;
    if (scene.sparkKind[index]) { context.beginPath(); context.moveTo(x, y); context.lineTo(x, y + 2.2 * k); context.stroke(); }
    else { context.beginPath(); context.arc(x, y, (0.8 + life * 1.6) * k, 0, Math.PI * 2); context.fill(); }
  }
  context.globalAlpha = 1;
  if (scene.font) {
    context.font = scene.font; context.textAlign = "center"; context.fillStyle = PAL.ink;
    for (let index = 0; index < FLOATS; index++) {
      if (scene.floatLife[index] <= 0) continue;
      context.globalAlpha = Math.min(1, scene.floatLife[index] * 2.5);
      context.fillText(PLUS[scene.floatN[index]], scene.floatX[index] * k, scene.floatY[index] * k);
    }
    context.globalAlpha = 1;
  }

  // Thunder brightens the sky once (at most every couple of seconds, never in slow mode).
  if (scene.flash > 0 && !slow) { context.globalAlpha = Math.min(0.22, scene.flash * 0.7); context.fillStyle = "#f4f1ff"; context.fillRect(0, 0, width, height); context.globalAlpha = 1; }

  // How far along the wave is, and the storm's strength.
  context.fillStyle = "#ffffff55"; context.fillRect(0, 0, width, 0.9 * k);
  context.fillStyle = PAL.sun; context.fillRect(0, 0, width * (game.phase === "clear" ? 1 : progressOf(game)), 0.9 * k);
  if (storm && game.stormState === 1) {
    const left = game.stormHp / storm.hp;
    context.fillStyle = "#1c223680"; context.fillRect(25 * k, 12 * k, 50 * k, 1.6 * k);
    context.fillStyle = "#f2cf6b"; context.fillRect(25 * k, 12 * k, 50 * k * left, 1.6 * k);
  }
}
