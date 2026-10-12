// Draws the race. Everything still is painted once into offscreen sprites; each frame only stamps them and strokes the oars,
// so a cheap phone keeps its frame rate. Slow mode keeps the water still and drops the wakes, the shake and the drifting pops.
import { BODY_FONT, DISPLAY_FONT } from "../../../shared/card-canvas";
import { fitCanvas } from "../../../shared/game-kit";
import { DRUM_Y, SCHEMES, drawBoat, drawPatch, drawRope, oarPath, paintBanks, paintWater } from "./art";
import {
  beatBefore, laneX, placeNow, BANK, BEAT, BEATS_PER_LINE, BLOCKED, COURSE, FRONT_Y, H, HIT, LANE_W, OFF, PATCH, STREAK_MAX, W, WINDOW,
  type Race,
} from "./race";
import { ordinal, secs } from "./result";

type Sprite = { canvas: HTMLCanvasElement; w: number; h: number; ox: number; oy: number };

const TILE = 480, APPROACH = 1.1, DEMO_GAP = 2.2, POPS = 6, POP_LIFE = 0.85;
/** Our own চার লাইনের সারি: one word a beat, a line of four beats. */
export const CHANT = [
  ["হেঁইয়ো,", "টান", "দে", "জোরে,"],
  ["ঢোলের", "তালে", "বৈঠা", "ধরে।"],
  ["পানা", "কাটিয়ে", "এগিয়ে", "যাই,"],
  ["সবার", "আগে", "ঘাটে", "পৌঁছাই!"],
] as const;
const POP_TEXT = ["তালে!", "একদম!", "একটু আগে", "একটু পরে", "পানায় আটকালে!", "পাশে নৌকা!"] as const;
const POP_COLOR = ["#ffe08a", "#ffd166", "#fff6e4", "#fff6e4", "#ffe2c4", "#fff6e4"] as const;
const FONT_TIME = `800 19px ${DISPLAY_FONT}`, FONT_PILL = `700 14px ${DISPLAY_FONT}`, FONT_CHANT = `700 14px ${BODY_FONT}`;
const FONT_POP = `800 16px ${DISPLAY_FONT}`, FONT_HINT = `700 13px ${BODY_FONT}`, FONT_FINISH = `800 12px ${DISPLAY_FONT}`;

export type Scene = {
  context: CanvasRenderingContext2D;
  water: Sprite; banks: Sprite; boats: Sprite[]; patches: Sprite[]; rope: Sprite; top: Sprite;
  clock: number; seen: number;
  popT: Float32Array; popX: Float32Array; popY: Float32Array; popKind: Uint8Array; popNext: number;
  ringAt: number; shakeAt: number; blockedAt: number; blockedSide: number;
  chantX: Float32Array; chantMeasured: boolean;
  shownTenths: number; timeText: string; shownPlace: number; placeText: string; sideText: string;
};

/** Paints a `w`×`h` unit box into a canvas at `k` device pixels a unit; (ox, oy) is where the drawing's origin sits in the box. */
function sprite(w: number, h: number, ox: number, oy: number, k: number, paint: (context: CanvasRenderingContext2D) => void): Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(w * k); canvas.height = Math.ceil(h * k);
  const context = canvas.getContext("2d")!;
  context.setTransform(k, 0, 0, k, ox * k, oy * k);
  paint(context);
  return { canvas, w, h, ox, oy };
}

const stamp = (c: CanvasRenderingContext2D, s: Sprite, x: number, y: number) => c.drawImage(s.canvas, x - s.ox, y - s.oy, s.w, s.h);

function paintTop(c: CanvasRenderingContext2D) {
  c.fillStyle = "rgba(255,250,240,0.92)";
  c.beginPath(); c.roundRect(8, 8, 74, 30, 12); c.fill();
  c.beginPath(); c.roundRect(W / 2 - 50, 6, 100, 34, 14); c.fill();
  c.fillStyle = "rgba(16,34,44,0.58)";
  c.beginPath(); c.roundRect(W / 2 - 112, 46, 224, 34, 12); c.fill();
}

export function makeScene(canvas: HTMLCanvasElement, cssWidth: number, previous: Scene | null): Scene {
  const ratio = Math.min(2, window.devicePixelRatio || 1), k = cssWidth / W * ratio;
  const context = fitCanvas(canvas, cssWidth, cssWidth * H / W);
  context.scale(cssWidth / W, cssWidth / W);
  const scene: Scene = {
    context,
    water: sprite(W, TILE, 0, 0, k, c => paintWater(c, W, TILE)),
    banks: sprite(W, TILE, 0, 0, k, c => paintBanks(c, W, TILE)),
    boats: SCHEMES.map((scheme, index) => sprite(34, 150, 17, 17, k, c => drawBoat(c, scheme, index === 0))),
    patches: [0, 1, 2].map(look => sprite(56, 64, 28, 32, k, c => drawPatch(c, look))),
    rope: sprite(W, 16, 0, 5, k, c => drawRope(c, W)),
    top: sprite(W, 84, 0, 0, k, paintTop),
    clock: 0, seen: 0,
    popT: new Float32Array(POPS).fill(-9), popX: new Float32Array(POPS), popY: new Float32Array(POPS), popKind: new Uint8Array(POPS), popNext: 0,
    ringAt: -9, shakeAt: -9, blockedAt: -9, blockedSide: 0,
    chantX: new Float32Array(16), chantMeasured: false,
    shownTenths: -1, timeText: "", shownPlace: -1, placeText: "", sideText: "",
  };
  if (previous) {
    const { clock, seen, popNext, ringAt, shakeAt, blockedAt, blockedSide, sideText } = previous;
    Object.assign(scene, { clock, seen, popNext, ringAt, shakeAt, blockedAt, blockedSide, sideText });
    for (const key of ["popT", "popX", "popY", "popKind"] as const) scene[key].set(previous[key]);
  }
  return scene;
}

/** A fresh race: forget the last one's pops and bursts. */
export function resetScene(scene: Scene, race: Race) {
  scene.seen = race.eventCount; scene.popT.fill(-9); scene.ringAt = -9; scene.shakeAt = -9; scene.blockedAt = -9;
}

/** The card fonts arrived: measure the chant again in the real font. */
export const fontsReady = (scene: Scene) => { scene.chantMeasured = false; scene.shownTenths = -1; scene.shownPlace = -1; };

/** The right-hand pill: the friend's time to beat, or this phone's best. */
export const setSideText = (scene: Scene, text: string) => { scene.sideText = text; };

function pop(scene: Scene, kind: number, x: number, y: number) {
  const slot = scene.popNext++ % POPS;
  scene.popT[slot] = scene.clock; scene.popX[slot] = x; scene.popY[slot] = y; scene.popKind[slot] = kind;
}

export const DRUM = 1, SNAGGED = 2;

/** Turns the race's new events into pops and bursts. Returns what happened, for the drum sounds (a caught beat sounds from the tap itself). */
export function absorb(scene: Scene, race: Race) {
  let happened = 0;
  const you = race.boats[0], ringY = FRONT_Y + DRUM_Y;
  for (; scene.seen < race.eventCount; scene.seen++) {
    if (race.eventCount - scene.seen > race.events.length) continue;
    const event = race.events[scene.seen % race.events.length];
    if (event.type === BEAT) happened |= DRUM;
    else if (event.type === HIT) { scene.ringAt = scene.clock; pop(scene, event.n === 2 ? 1 : 0, Math.min(W - 70, you.x + 44), ringY - 18); }
    else if (event.type === OFF) pop(scene, event.v < 0 ? 2 : 3, Math.min(W - 70, you.x + 44), ringY - 18);
    else if (event.type === PATCH && event.n === 0) { scene.shakeAt = scene.clock; pop(scene, 4, Math.max(90, Math.min(W - 90, you.x)), FRONT_Y - 22); happened |= SNAGGED; }
    else if (event.type === BLOCKED) { scene.blockedAt = scene.clock; scene.blockedSide = event.n; pop(scene, 5, Math.max(64, Math.min(W - 64, you.x + event.n * 40)), FRONT_Y + 30); }
  }
  return happened;
}

export const tickScene = (scene: Scene, dt: number) => { scene.clock += dt; };

/** The beat the drum ring is closing in on: the next one not yet caught or missed (still inside its window counts); -1 if none. */
export function pending(race: Race) {
  for (let index = Math.max(0, race.next - 1); index < race.beats.length; index++) {
    const delta = race.beats[index] - race.t;
    if (delta < -WINDOW) continue;
    if (race.marks[index] !== 0) continue;
    return index;
  }
  return -1;
}

function ring(c: CanvasRenderingContext2D, x: number, y: number, delta: number, live: boolean) {
  c.lineWidth = 1.6; c.strokeStyle = "rgba(255,250,235,0.6)";
  c.beginPath(); c.arc(x, y, 10, 0, Math.PI * 2); c.stroke();
  if (!live) return;
  if (Math.abs(delta) <= WINDOW) {
    c.fillStyle = "rgba(242,194,48,0.5)"; c.beginPath(); c.arc(x, y, 11, 0, Math.PI * 2); c.fill();
    c.lineWidth = 3.2; c.strokeStyle = "#ffd166"; c.beginPath(); c.arc(x, y, 11, 0, Math.PI * 2); c.stroke();
  } else if (delta > 0 && delta < APPROACH) {
    const left = delta / APPROACH;
    c.globalAlpha = 0.35 + 0.65 * (1 - left);
    c.lineWidth = 2.6; c.strokeStyle = "#fff6dc";
    c.beginPath(); c.arc(x, y, 10 + 56 * left, 0, Math.PI * 2); c.stroke();
    c.globalAlpha = 1;
  }
}

/** The stroke phase for your oars: two strokes a beat, the blades catching right on the beat. */
function strokeOf(race: Race, t: number) {
  const index = beatBefore(race, t);
  const from = index >= 0 ? race.beats[index] : race.beats[0] - 2.2, to = index + 1 < race.beats.length ? race.beats[index + 1] : from + 2;
  return ((t - from) / (to - from) * 2) % 1;
}

export type View = { phase: string; slow: boolean; calibT: number; calibBeats: readonly number[] };

export function drawScene(scene: Scene, race: Race, view: View) {
  const c = scene.context, slow = view.slow, you = race.boats[0];
  const playing = view.phase === "playing" || view.phase === "paused" || view.phase === "over";
  // After the finish the camera settles just past the rope, so the others are seen crossing it.
  const camY = race.over ? Math.min(you.y, COURSE + 120) : you.y, sy = (worldY: number) => FRONT_Y - (worldY - camY);
  c.save();
  if (!slow && scene.clock - scene.shakeAt < 0.3) {
    const fade = 1 - (scene.clock - scene.shakeAt) / 0.3;
    c.translate(Math.sin(scene.clock * 70) * 3 * fade, Math.cos(scene.clock * 55) * 2 * fade);
  }
  const base = ((camY + FRONT_Y) % TILE + TILE) % TILE - TILE;
  if (slow) c.drawImage(scene.water.canvas, 0, 0, W, TILE);
  else { stamp(c, scene.water, 0, base); stamp(c, scene.water, 0, base + TILE); }
  stamp(c, scene.banks, 0, base); stamp(c, scene.banks, 0, base + TILE);

  const start = sy(0), finish = sy(COURSE);
  if (start > -20 && start < H + 20) stamp(c, scene.rope, 0, start);
  if (finish > -20 && finish < H + 20) {
    stamp(c, scene.rope, 0, finish);
    c.fillStyle = "#fff6e4"; c.beginPath(); c.roundRect(W - BANK - 4, finish - 24, 30, 17, 5); c.fill();
    c.font = FONT_FINISH; c.textAlign = "center"; c.fillStyle = "#7a2e1d"; c.fillText("শেষ", W - BANK + 11, finish - 11);
  }

  // কচুরিপানা: a scattered one drifts apart in two halves.
  for (let index = race.firstPatch; index < race.patches.length; index++) {
    const patch = race.patches[index], y = sy(patch.y + patch.len / 2);
    if (y < -50) break;
    if (y > H + 50) continue;
    const sprite = scene.patches[patch.look], height = sprite.h * patch.len / 52;
    if (patch.hitBy < 0) { c.drawImage(sprite.canvas, patch.x - sprite.ox, y - height / 2, sprite.w, height); continue; }
    const drift = slow ? 0.4 : Math.min(1, (race.t - patch.hitAt) / 0.7);
    c.globalAlpha = 0.75 - 0.3 * drift;
    for (const side of [-1, 1]) c.drawImage(sprite.canvas, patch.x + side * (6 + 14 * drift) - sprite.ox * 0.7, y - height * 0.35, sprite.w * 0.7, height * 0.7);
    c.globalAlpha = 1;
  }
  if (playing && race.rows > 0 && race.patches[0].hitBy < 0 && you.lane === race.patches[0].lane) {
    const y = sy(race.patches[0].y + race.patches[0].len) - 12;
    if (y > 90 && y < FRONT_Y - 20) hint(c, "পানা! পাশে সরো", race.patches[0].x, y);
  }

  // Wakes behind the moving boats.
  if (!slow) {
    c.lineWidth = 1.5; c.lineCap = "round";
    for (const it of race.boats) {
      const y = sy(it.y);
      if (y > H || y + 170 < 0 || it.speed < 30) continue;
      c.globalAlpha = Math.min(0.45, it.speed / 700);
      c.strokeStyle = "#e8f6f0";
      c.beginPath();
      c.moveTo(it.x - 7, y + 96); c.lineTo(it.x - 22, y + 156);
      c.moveTo(it.x + 7, y + 96); c.lineTo(it.x + 22, y + 156);
      c.moveTo(it.x - 6, y + 4); c.quadraticCurveTo(it.x, y - 6, it.x + 6, y + 4);
      c.stroke();
    }
    c.globalAlpha = 1;
  }

  // The boats, yours on top. Your oars follow the drum; the rivals row to their own count.
  const t = view.phase === "calib" ? view.calibT : playing ? race.t : scene.clock;
  for (let index = race.boats.length - 1; index >= 0; index--) {
    const it = race.boats[index], y = sy(it.y);
    if (y > H + 20 || y + 140 < 0) continue;
    let x = it.x, tilt = (laneX(it.lane) - it.x) / LANE_W * 0.16;
    if (index === 0 && !slow) {
      const since = scene.clock - scene.blockedAt;
      if (since < 0.25) x += scene.blockedSide * 4 * Math.sin(Math.PI * since / 0.25);
      if (scene.clock - scene.shakeAt < 0.5) tilt += Math.sin((scene.clock - scene.shakeAt) * 30) * 0.05;
    }
    const stroke = index === 0 ? (playing ? strokeOf(race, t) : (t / DEMO_GAP * 2) % 1) : (t * 1.15 + it.phase) % 1;
    c.save(); c.translate(x, y); if (tilt) c.rotate(tilt);
    c.strokeStyle = "#ead3a2"; c.lineWidth = 1.4; c.lineCap = "round";
    c.beginPath(); oarPath(c, 0, 0, stroke); c.stroke();
    stamp(c, scene.boats[index], 0, 0);
    c.restore();
  }

  if (!playing || race.t < 3) hint(c, "তুমি", you.x, sy(you.y) - 22);

  // The drum ring on your boat: it closes in on the ঢোল and glows gold on the beat.
  const ringX = you.x, ringY = sy(you.y) + DRUM_Y;

  if (view.phase === "calib") {
    let delta = Infinity;
    for (const beat of view.calibBeats) if (beat - view.calibT >= -WINDOW) { delta = beat - view.calibT; break; }
    ring(c, ringX, ringY, delta, delta !== Infinity);
  } else if (playing) {
    const index = race.over ? -1 : pending(race);
    ring(c, ringX, ringY, index >= 0 ? race.beats[index] - race.t : Infinity, index >= 0);
    if (index >= 0 && index < 3 && race.hits === 0 && Math.abs(race.beats[index] - race.t) <= WINDOW) hint(c, "এখন চাপো!", ringX, ringY - 30);
  } else ring(c, ringX, ringY, DEMO_GAP - (scene.clock % DEMO_GAP), true);
  const burst = scene.clock - scene.ringAt;
  if (burst < 0.4) {
    c.globalAlpha = 1 - burst / 0.4;
    c.lineWidth = 3; c.strokeStyle = "#ffd166";
    c.beginPath(); c.arc(ringX, ringY, 11 + (slow ? 8 : 34 * burst / 0.4), 0, Math.PI * 2); c.stroke();
    c.globalAlpha = 1;
  }
  if (playing && !race.over && you.held > 0.4) hint(c, "সামনে নৌকা, পাশ কাটাও", Math.max(96, Math.min(W - 96, you.x)), FRONT_Y - 24);

  // Pops.
  c.font = FONT_POP; c.textAlign = "center";
  for (let slot = 0; slot < POPS; slot++) {
    const age = scene.clock - scene.popT[slot];
    if (age < 0 || age > POP_LIFE) continue;
    const kind = scene.popKind[slot], y = scene.popY[slot] - (slow ? 0 : age * 26);
    c.globalAlpha = Math.min(1, 2.4 * (1 - age / POP_LIFE));
    c.lineWidth = 4; c.strokeStyle = "rgba(20,30,34,0.75)"; c.lineJoin = "round";
    c.strokeText(POP_TEXT[kind], scene.popX[slot], y);
    c.fillStyle = POP_COLOR[kind]; c.fillText(POP_TEXT[kind], scene.popX[slot], y);
  }
  c.globalAlpha = 1;
  c.restore();

  if (playing) drawHud(scene, race);
}

function hint(c: CanvasRenderingContext2D, text: string, x: number, y: number) {
  c.font = FONT_HINT; c.textAlign = "center";
  const width = c.measureText(text).width + 16;
  c.fillStyle = "rgba(255,250,240,0.94)"; c.beginPath(); c.roundRect(x - width / 2, y - 15, width, 22, 9); c.fill();
  c.fillStyle = "#7a2e1d"; c.fillText(text, x, y + 1);
}

function drawHud(scene: Scene, race: Race) {
  const c = scene.context;
  stamp(c, scene.top, 0, 0);
  const tenths = race.over ? race.tenths : Math.floor(race.t * 10);
  if (tenths !== scene.shownTenths) { scene.shownTenths = tenths; scene.timeText = `${secs(tenths)} সে`; }
  const place = placeNow(race);
  if (place !== scene.shownPlace) { scene.shownPlace = place; scene.placeText = `এখন ${ordinal(place)}`; }
  c.textAlign = "center";
  c.font = FONT_TIME; c.fillStyle = "#1b2a33"; c.fillText(scene.timeText, W / 2, 30);
  c.font = FONT_PILL; c.fillStyle = place === 1 ? "#a2620f" : "#1b2a33"; c.fillText(scene.placeText, 45, 28);
  if (scene.sideText) {
    const width = c.measureText(scene.sideText).width + 18;
    c.fillStyle = "rgba(255,250,240,0.92)"; c.beginPath(); c.roundRect(W - 8 - width, 8, width, 30, 12); c.fill();
    c.fillStyle = "#1d5c8a"; c.fillText(scene.sideText, W - 8 - width / 2, 28);
  }

  // The chant: one word a beat; caught beats glow gold, missed ones fade.
  c.font = FONT_CHANT;
  if (!scene.chantMeasured) {
    CHANT.forEach((line, row) => {
      let total = 0;
      const widths = line.map(word => c.measureText(word).width);
      for (const width of widths) total += width;
      total += 9 * (line.length - 1);
      let x = W / 2 - total / 2;
      widths.forEach((width, index) => { scene.chantX[row * 4 + index] = x + width / 2; x += width + 9; });
    });
    scene.chantMeasured = true;
  }
  const current = race.over ? race.beats.length : pending(race);
  const lineStart = current >= 0 ? current - (current % BEATS_PER_LINE) : 0, row = Math.floor(lineStart / BEATS_PER_LINE) % CHANT.length;
  for (let word = 0; word < BEATS_PER_LINE; word++) {
    const index = lineStart + word, mark = index < race.marks.length ? race.marks[index] : 0;
    c.fillStyle = mark > 0 ? "#ffd166" : mark < 0 ? "rgba(255,255,255,0.38)" : index === current ? "#ffffff" : "rgba(255,255,255,0.72)";
    c.fillText(CHANT[row][word], scene.chantX[row * 4 + word], 66);
  }
  for (let dotIndex = 0; dotIndex < STREAK_MAX; dotIndex++) {
    c.fillStyle = dotIndex < race.streak ? "#ffd166" : "rgba(255,255,255,0.28)";
    c.beginPath(); c.arc(W / 2 - 25 + dotIndex * 10, 75, 2.6, 0, Math.PI * 2); c.fill();
  }

  // How far along each boat is, on a strip down the right bank.
  const top = 96, bottom = H - 22, x = W - 9;
  c.fillStyle = "rgba(255,250,240,0.85)"; c.beginPath(); c.roundRect(x - 3.5, top - 4, 7, bottom - top + 8, 4); c.fill();
  c.fillStyle = "#7a2e1d"; c.beginPath(); c.moveTo(x, top - 16); c.lineTo(x + 9, top - 12); c.lineTo(x, top - 8); c.closePath(); c.fill();
  c.fillRect(x - 0.75, top - 16, 1.5, 12);
  for (let index = race.boats.length - 1; index >= 0; index--) {
    const along = Math.min(1, Math.max(0, race.boats[index].y / COURSE)), y = bottom - along * (bottom - top);
    c.fillStyle = index === 0 ? "#10202a" : "rgba(16,32,42,0.4)";
    c.beginPath(); c.arc(x, y, index === 0 ? 5.6 : 4.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = SCHEMES[index].paint; c.beginPath(); c.arc(x, y, index === 0 ? 4 : 3, 0, Math.PI * 2); c.fill();
  }
}

