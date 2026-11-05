// One frame of the kitchen. Still parts come from cached sprites (art.ts); only the milk, flame, steam, lid and gauge are drawn
// live. No allocation: no literals, closures, templates or `new` inside any function here (npm run lint:games checks).
import { BODY_FONT, DISPLAY_FONT } from "../../../shared/card-canvas";
import { BUBBLES, CX, DRIPS, DY, FOAM, FOAM_LINE, INK, LID_BOX, MILK, MILK_EDGE, MOUND, PCT, SHAPES, TAU, VH, VW, type SceneCache } from "./art";
import { flareTell, heatAt, popSwell, potScore, type Pot, type Stove, type Vessel } from "./pot";
import { RESULT_SECONDS, type Round } from "./round";
import type { View } from "./view";

const LIGHT = "#f4efe2";
const FONT_PCT = `800 17px ${DISPLAY_FONT}`, FONT_RIM = `600 10px ${BODY_FONT}`, FONT_HIDDEN = `800 20px ${DISPLAY_FONT}`;
const easeOut = (value: number) => 1 - (1 - Math.max(0, Math.min(1, value))) ** 3;

function rimPath(context: CanvasRenderingContext2D, vessel: Vessel) {
  const shape = SHAPES[vessel];
  context.beginPath();
  context.ellipse(CX, shape.rimY, shape.rx - 3, shape.ry - 2, 0, 0, TAU);
}

/** The milk's surface and foam, seen inside the rim. `level` 0 is the start, 1 the rim. */
export function drawMilk(context: CanvasRenderingContext2D, vessel: Vessel, level: number, clock: number, jiggle: boolean) {
  const shape = SHAPES[vessel], grow = Math.max(0, Math.min(1, level));
  const y = shape.rimY + shape.depth * (1 - grow);
  context.save();
  rimPath(context, vessel);
  context.clip();
  context.fillStyle = MILK_EDGE;
  context.beginPath(); context.ellipse(CX, y + 2, shape.rx, shape.ry, 0, 0, TAU); context.fill();
  context.fillStyle = MILK;
  context.beginPath(); context.ellipse(CX, y, shape.rx - 2, shape.ry - 2, 0, 0, TAU); context.fill();
  context.lineWidth = 1;
  for (let index = 0; index < BUBBLES.length; index++) {
    const [u, v, size, phase] = BUBBLES[index];
    const radius = shape.rx * (0.02 + 0.075 * grow) * size * (jiggle ? 1 + 0.14 * Math.sin(clock * 7 + phase) : 1);
    context.beginPath();
    context.arc(CX + u * (shape.rx - 8), y + v * (shape.ry - 5), radius, 0, TAU);
    context.fillStyle = FOAM; context.fill();
    context.strokeStyle = FOAM_LINE; context.stroke();
  }
  if (grow > 0.5) {
    // The foam heaves up in the middle as it gets ready to climb out: a mound of bubbles, outlined once.
    const heave = (grow - 0.5) * 2, size = shape.rx * 0.2 * (0.6 + 0.6 * heave);
    for (let pass = 0; pass < 2; pass++) {
      context.fillStyle = pass === 0 ? FOAM_LINE : FOAM;
      for (let index = 0; index < MOUND.length; index++) {
        const [dx, dy, scale] = MOUND[index];
        context.beginPath(); context.arc(CX + dx * size * 2, y - heave * 6 + dy * size, size * scale + (pass === 0 ? 1.2 : 0), 0, TAU); context.fill();
      }
    }
  }
  context.restore();
}

/** A big bubble swelling at the surface (`swell` 0..1) before it bursts, or its spray just after (`spray` 0..1). */
function drawBubble(context: CanvasRenderingContext2D, vessel: Vessel, level: number, swell: number, spray: number) {
  const shape = SHAPES[vessel], y = shape.rimY + shape.depth * (1 - Math.max(0, Math.min(1, level)));
  if (swell > 0) {
    const radius = 6 + 22 * swell;
    context.fillStyle = FOAM; context.strokeStyle = FOAM_LINE; context.lineWidth = 2;
    context.beginPath(); context.ellipse(CX + 18, y - radius * 0.35, radius, radius * 0.82, 0, 0, TAU); context.fill(); context.stroke();
    context.fillStyle = "rgba(255,255,255,.9)";
    context.beginPath(); context.arc(CX + 18 - radius * 0.35, y - radius * 0.7, radius * 0.2, 0, TAU); context.fill();
  }
  if (spray > 0) {
    context.fillStyle = FOAM; context.strokeStyle = FOAM_LINE; context.lineWidth = 1.5;
    for (let drop = 0; drop < 7; drop++) {
      const angle = drop * TAU / 7 + 0.4, reach = 10 + 30 * easeOut(1 - spray);
      context.beginPath(); context.arc(CX + 18 + Math.cos(angle) * reach, y - 12 + Math.sin(angle) * reach * 0.7, 4 * spray + 1, 0, TAU); context.fill(); context.stroke();
    }
  }
}

function blob(context: CanvasRenderingContext2D, x: number, y: number, radius: number, outline: boolean) {
  context.beginPath(); context.arc(x, y, radius + (outline ? 1.6 : 0), 0, TAU); context.fill();
}

/** "উথলে গেল!": a soft cartoon cloud of foam over the rim, a few neat drips and a small puddle. `grow` runs 0→1. */
export function drawSpill(context: CanvasRenderingContext2D, vessel: Vessel, grow: number) {
  const shape = SHAPES[vessel], ease = easeOut(grow);
  if (ease <= 0) return;
  // Two passes, outline then fill, so the cloud reads as one shape with one soft edge.
  for (let pass = 0; pass < 2; pass++) {
    const outline = pass === 0;
    context.fillStyle = outline ? FOAM_LINE : FOAM;
    context.beginPath(); context.ellipse(CX, 216, 30 + 46 * ease + (outline ? 1.6 : 0), 6 + 2 * ease + (outline ? 1.2 : 0), 0, 0, TAU); context.fill();
    for (let drip = 0; drip < DRIPS.length; drip++) {
      const [angle, length] = DRIPS[drip], x = CX + Math.cos(angle) * shape.rx * 0.92, top = shape.rimY + Math.sin(angle) * shape.ry;
      const bottom = top + length * ease, pad = outline ? 1.6 : 0;
      context.beginPath(); context.roundRect(x - 5 - pad, top, 10 + pad * 2, bottom - top + pad, 5 + pad); context.fill();
      blob(context, x, bottom, 6.5 * ease, outline);
    }
    context.beginPath(); context.ellipse(CX, shape.rimY - 3 * ease, shape.rx * 0.96 + (outline ? 1.6 : 0), shape.ry + 6 * ease + (outline ? 1.6 : 0), 0, 0, TAU); context.fill();
    for (let puff = 0; puff <= 8; puff++) {
      const angle = puff * Math.PI / 8;
      blob(context, CX + Math.cos(angle) * shape.rx, shape.rimY + Math.sin(angle) * shape.ry, (8 + (puff % 3) * 3) * ease, outline);
    }
    for (let puff = 0; puff < 5; puff++) blob(context, CX - 48 + puff * 24, shape.rimY - 6 * ease - (puff % 2) * 6 * ease, 11 * ease, outline);
  }
  // A few bubbles on top, so it reads as foam and not a white lid.
  context.strokeStyle = FOAM_LINE;
  context.lineWidth = 1.2;
  for (let index = 0; index < 7; index++) {
    const [u, v, size] = BUBBLES[index];
    context.beginPath(); context.arc(CX + u * shape.rx * 0.7, shape.rimY + v * shape.ry * 0.6, (3 + 3 * size) * ease, 0, TAU); context.stroke();
  }
}

function tongue(context: CanvasRenderingContext2D, x: number, y: number, height: number, width: number) {
  context.beginPath();
  context.moveTo(x - width, y);
  context.quadraticCurveTo(x - width * 0.8, y - height * 0.6, x, y - height);
  context.quadraticCurveTo(x + width * 0.8, y - height * 0.6, x + width, y);
  context.closePath();
  context.fill();
}

/** Blue gas tongues under the pot, or an orange wood fire in the clay stove's mouth. `heat` is 0.15 for a pilot, 1 for a steady boil, up to 1.6 in a flare. */
export function drawFlame(context: CanvasRenderingContext2D, stove: Stove, clock: number, heat: number, flicker: boolean) {
  const sway = flicker ? 0.18 : 0;
  if (stove === "gas") {
    for (let index = 0; index <= 10; index++) {
      const angle = index * Math.PI / 10, x = CX + Math.cos(angle) * 66, y = 220 + Math.sin(angle) * 8;
      const height = (4 + 12 * heat) * (1 + sway * Math.sin(clock * 12 + index * 1.9));
      context.fillStyle = "#3d74e8"; tongue(context, x, y, height, 4.2);
      context.fillStyle = "#a9d3ff"; tongue(context, x, y, height * 0.5, 2.2);
    }
    return;
  }
  context.save();
  context.beginPath(); context.moveTo(CX - 26, 270); context.lineTo(CX - 26, 252); context.arc(CX, 252, 26, Math.PI, 0); context.lineTo(CX + 26, 270); context.closePath(); context.clip();
  context.fillStyle = "#3a1a0c"; context.fillRect(CX - 26, 222, 52, 48);
  for (let index = 0; index < 5; index++) {
    const x = CX - 18 + index * 9, height = (8 + 16 * heat) * (1 + sway * Math.sin(clock * 12 + index * 1.9));
    context.fillStyle = "#f07a22"; tongue(context, x, 268, height, 7);
    context.fillStyle = "#ffd166"; tongue(context, x, 268, height * 0.55, 3.6);
  }
  context.restore();
  // Licks of fire around the pot's base.
  for (let index = 0; index < 4; index++) {
    const side = index < 2 ? -1 : 1, x = CX + side * (48 + (index % 2) * 12), height = (2 + 10 * heat) * (1 + sway * Math.sin(clock * 12 + index * 2.3));
    context.fillStyle = "#f07a22"; tongue(context, x, 216, height, 5);
    context.fillStyle = "#ffd166"; tongue(context, x, 216, height * 0.5, 2.5);
  }
}

/** Steam curling off hot milk, or out round a lid. Still wisps in slow mode. */
export function drawSteam(context: CanvasRenderingContext2D, vessel: Vessel, clock: number, amount: number, drift: boolean) {
  if (amount <= 0.02) return;
  const rimY = SHAPES[vessel].rimY;
  context.strokeStyle = "#ffffff";
  context.lineWidth = 4;
  context.lineCap = "round";
  for (let index = 0; index < 3; index++) {
    const rise = drift ? (clock * 0.45 + index / 3) % 1 : 0.3 + index * 0.12;
    const x = CX - 36 + index * 36 + (drift ? Math.sin(clock * 1.7 + index * 2) * 4 : 0), y = rimY - 18 - rise * 44;
    context.globalAlpha = Math.min(1, amount) * 0.75 * (1 - rise);
    context.beginPath(); context.moveTo(x, y + 16); context.bezierCurveTo(x - 9, y + 8, x + 9, y - 2, x, y - 12); context.stroke();
  }
  context.globalAlpha = 1;
  context.lineCap = "butt";
}

const GAUGE_X = 334, GAUGE_TOP = 70, GAUGE_BOTTOM = 206;

/** The rim gauge: the same height as a number and a bar, so colour is never the only signal. `mark` is a lifted pot's level, or -1; `hidden` under a lid. */
export function drawGauge(context: CanvasRenderingContext2D, level: number, mark: number, hidden: boolean, light: boolean) {
  const x = GAUGE_X, top = GAUGE_TOP, bottom = GAUGE_BOTTOM, span = bottom - top, shown = Math.max(0, Math.min(1, level));
  context.fillStyle = "rgba(255,255,255,.88)";
  context.strokeStyle = "rgba(42,33,28,.35)";
  context.lineWidth = 1;
  context.beginPath(); context.roundRect(x - 8, top - 4, 16, span + 8, 8); context.fill(); context.stroke();
  context.fillStyle = "#ffd9b0";
  context.fillRect(x - 6, top, 12, span * 0.1);
  if (!hidden) {
    context.fillStyle = shown >= 0.9 ? "#d2492a" : "#e99b2e";
    const height = shown * span;
    if (height > 1) { context.beginPath(); context.roundRect(x - 5, bottom - height, 10, height, 5); context.fill(); }
  }
  context.strokeStyle = INK; context.lineWidth = 2;
  context.beginPath(); context.moveTo(x - 11, top); context.lineTo(x + 11, top); context.stroke();
  if (mark >= 0) {
    const markY = bottom - Math.min(1, mark) * span;
    context.fillStyle = INK;
    context.beginPath(); context.moveTo(x - 9, markY); context.lineTo(x - 16, markY - 5); context.lineTo(x - 16, markY + 5); context.closePath(); context.fill();
  }
  context.textAlign = "center";
  context.fillStyle = light ? LIGHT : INK;
  context.font = hidden ? FONT_HIDDEN : FONT_PCT;
  context.fillText(hidden ? "?" : PCT[level >= 1 ? 100 : potScore(level)], x - 4, top - 28);
  context.font = FONT_RIM;
  context.fillText(hidden ? "ঢাকনা" : "কিনারা", x - 2, top - 10);
  context.textAlign = "left";
}

/** One frame of the game. */
export function drawFrame(context: CanvasRenderingContext2D, cache: SceneCache, round: Round, view: View) {
  const pot: Pot = round.pots[round.index], shape = SHAPES[pot.vessel], ratio = cache.ratio, slow = view.slow, clock = view.clock;
  const bg = cache.bg[pot.scene], back = cache.back[pot.vessel], front = cache.front[pot.vessel];
  if (!bg || !back || !front) return;
  const over = round.phase === "over", done = round.phase === "result" || over;
  const wait = over ? RESULT_SECONDS : round.wait;
  const spilled = done && round.spills[round.index];
  const lifted = done && !spilled;
  const rising = round.phase === "rising";
  const lift = lifted ? 22 * easeOut(wait / 0.3) : 0;
  const level = lifted ? round.foam * (1 - 0.3 * easeOut(wait / 0.9)) : round.foam;
  // The pot trembles just under the rim, and rocks once when it boils over.
  const tremble = !slow && rising && level > 0.9 ? Math.sin(clock * 70) * 1.3 * (level - 0.9) * 10 : 0;
  const shake = spilled && !slow && wait < 0.3 ? Math.sin(wait * 70) * 2.5 * (1 - wait / 0.3) : tremble;
  const heat = rising ? heatAt(pot, round.t) * (1 + 0.9 * flareTell(pot, round.t)) : lifted ? 0 : 0.15;

  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.drawImage(bg, 0, 0, VW, VH);
  context.translate(shake, DY - lift);
  context.drawImage(back, shape.box.x, shape.box.y, shape.box.w, shape.box.h);
  drawMilk(context, pot.vessel, level, clock, !slow && !lifted);
  if (rising) {
    const age = clock - view.popAt;
    drawBubble(context, pot.vessel, level, popSwell(pot, round.t), age >= 0 && age < 0.3 ? 1 - age / 0.3 : 0);
  }
  context.drawImage(front, shape.box.x, shape.box.y, shape.box.w, shape.box.h);
  if (spilled) drawSpill(context, pot.vessel, slow ? 1 : wait / 0.4);
  const lid = pot.lid ? cache.lid[pot.vessel] : undefined;
  if (lid) {
    const box = LID_BOX[pot.vessel], away = done ? easeOut(wait / 0.35) : 0, edge = level * level * level;
    const rattle = rising && !slow ? Math.sin(clock * 55) * 2.4 * edge : 0, up = rising && level > 0.85 ? (level - 0.85) * 46 + (slow ? 0 : Math.abs(Math.sin(clock * 38)) * 3 * edge) : 0;
    context.globalAlpha = 1 - away;
    context.drawImage(lid, box.x + rattle, box.y - up - away * 40, box.w, box.h);
    context.globalAlpha = 1;
  }
  context.setTransform(ratio, 0, 0, ratio, 0, DY * ratio);
  drawFlame(context, pot.stove, clock, heat, !slow);
  const lidSteam = lid && rising ? level * level * 1.6 : 0;
  drawSteam(context, pot.vessel, clock, rising ? Math.max(lidSteam, (level - 0.2) * 1.4) : lifted ? 0.6 * (1 - wait / RESULT_SECONDS) : 0, !slow);
  if (pot.dark && cache.night) {
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.globalAlpha = slow ? 1 : 0.94 + 0.06 * Math.sin(clock * 9) * Math.min(1, heat);
    context.drawImage(cache.night, 0, 0, VW, VH);
    context.globalAlpha = 1;
    context.setTransform(ratio, 0, 0, ratio, 0, DY * ratio);
  }
  drawGauge(context, round.foam, lifted ? round.foam : -1, pot.lid && !done, pot.dark);
}
