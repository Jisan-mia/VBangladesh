// Draws one frame of the classroom: reveals chalk (and sweeps it off), poses the teacher, turns the captain's head, shows the
// headmaster at the door, lays the blackout over the room, and moves the chit. Runs every frame, so it allocates nothing:
// poses, views and dash patterns are made once at module scope, and every string drawn is a constant.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import {
  AWAY, BACK, BLIND, BY_WATCHER, COUGH, DARK, DIM, DROP, LAST, LENS, LIT, LOOK, PEEK, TELL, W_LOOK, WIPE, WRITE,
  type Game, type Klass, type Teacher,
} from "./class";
import {
  BOARD, BUBBLE_FONT, CAPTAIN_X, CAPTAIN_Y, CHALK, HAIR, lineY, PALETTES, PANE, PEN, rowScale, rowY, SCENE_H, SCENE_W, seatX, SKIN, SKIN_T, WINDOW, type Layers,
} from "./scene";

const INK_SPEED = 28;
export const OPEN_FONT = `700 19px ${DISPLAY_FONT}`;
const REPLY_FONT = `700 17px ${DISPLAY_FONT}`;
const SCOLD_WORDS = "এইদিকে তাকাও!";
const COUGH_WORDS = "খুক খুক";
const DROP_WORDS = "টুক!";
const PHEW = "উফ!";
const LABEL = "চিরকুট";
const Z = "z";

export { makeView, type View } from "./scene";
import type { View } from "./scene";

const ease = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

// Reused every frame instead of allocating.
const pose = { turn: 0, arm: 1, bend: 0, cough: 0, brow: 0, bubble: "", drop: -1, glasses: 0, blind: 0, duster: -1, dy: 0 };
const hand = { x: 0, y: 0 };
const RING_DASH = [3, 3];
const PATH_DASH = [2, 5];
const NO_DASH: number[] = [];

function chalkPoint(layers: Layers, ink: number) {
  const ends = layers.lineEnds, total = ends[ends.length - 1];
  // The board fills up, stays a moment, and starts fresh if a long class outlasts it.
  const p = (ink * INK_SPEED) % (total + INK_SPEED * 3);
  let line = 0;
  while (line < ends.length - 1 && p > ends[line]) line++;
  const start = line === 0 ? 0 : ends[line - 1];
  hand.x = BOARD.x + 12 + Math.min(ends[line] - start - 14, Math.max(0, p - start));
  hand.y = lineY(line) - 5;
  return p;
}

function setPose(game: Game, clock: number) {
  pose.turn = 0; pose.arm = 1; pose.bend = 0; pose.cough = 0; pose.brow = 0; pose.bubble = ""; pose.drop = -1; pose.glasses = 0; pose.blind = 0; pose.duster = -1; pose.dy = 0;
  if (game.phase === "ready") return;
  if (game.phase === "over") { if (!game.won) { pose.turn = 1; pose.arm = 0; pose.brow = 1; } return; }
  if (game.scold > 0) { pose.turn = 1; pose.arm = 0; pose.brow = 1; pose.bubble = SCOLD_WORDS; return; }
  const k = game.klass, kind = k.kinds[game.seg], dur = k.durs[game.seg], t = game.segT / dur, before = game.seg > 0 ? k.kinds[game.seg - 1] : WRITE;
  switch (kind) {
    case WRITE: pose.arm = clamp01(game.segT / 0.3); break;
    case TELL: pose.arm = 1 - clamp01(t / 0.4); pose.turn = 0.35 * ease(clamp01(t / 0.5)); break;
    case PEEK: {
      // The head comes round, but the chalk hand never leaves the board.
      const back = clamp01((t - 0.6) / 0.4);
      pose.turn = 0.35 * ease(clamp01(t / 0.35)) * (1 - back); break;
    }
    case LOOK: {
      const from = before === LENS ? 1 : before === BACK ? 0.3 : 0.35;
      const turning = clamp01(game.segT / k.grace), leaving = clamp01((dur - game.segT) / 0.2);
      pose.arm = 0; pose.turn = (from + (1 - from) * ease(turning)) * leaving; break;
    }
    case COUGH: pose.arm = 0.35; pose.cough = t < 0.85 ? 1 : 0; pose.bubble = t < 0.75 ? COUGH_WORDS : ""; break;
    case DROP:
      pose.arm = 1 - clamp01(t / 0.1); pose.drop = t < 0.14 ? t / 0.14 : -1; pose.bubble = t < 0.3 ? DROP_WORDS : "";
      pose.bend = 48 * ease(clamp01((t - 0.14) / 0.18)) * (1 - ease(clamp01((t - 0.72) / 0.22))); break;
    case BLIND: pose.turn = 1; pose.arm = 0; pose.glasses = 1; pose.blind = 1; pose.dy = Math.sin(clock * 11) * 2; break;
    case LENS: pose.turn = 1; pose.arm = 0; pose.glasses = 1 - ease(t); pose.blind = t < 0.75 ? 1 : 0; break;
    case WIPE: pose.arm = 1; pose.duster = game.wipe; break;
    case BACK: pose.arm = 0; pose.turn = 1 - 0.75 * ease(clamp01(t / 0.4)); if (pose.turn < 0.5) pose.turn = 0.25; break;
  }
}

function limb(c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number, color: string) {
  c.strokeStyle = color; c.lineWidth = width;
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
}

function spectacles(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.strokeStyle = "#3d3d3d"; c.lineWidth = 1.1;
  c.beginPath(); c.arc(x - 4.5, y, r, 0, Math.PI * 2); c.moveTo(x + 4.5 + r, y); c.arc(x + 4.5, y, r, 0, Math.PI * 2); c.moveTo(x - 4.5 + r, y); c.lineTo(x + 4.5 - r, y); c.stroke();
}

/** The teacher at (tx), the chalk hand reaching (chalkX, chalkY). The headmaster wears a white panjabi and has grey hair. */
function drawTeacher(c: CanvasRenderingContext2D, teacher: Teacher, world: number, tx: number, chalkX: number, chalkY: number, bob: number) {
  const top = 60 + pose.bend + bob, hx = tx, hy = top + 12, front = pose.turn >= 0.5;
  const head = teacher === "head", madam = teacher === "madam";
  const body = head ? "#efe8d6" : madam ? "#8c2f4b" : "#9cc1e4", sleeve = head ? "#efe8d6" : madam ? "#d9a640" : "#9cc1e4";
  const hair = head ? "#a39d94" : HAIR, specs = !madam || world >= 1;
  c.save();
  // The front bench hides everything below the desk line.
  c.beginPath(); c.rect(0, 0, SCENE_W, 198); c.clip();
  c.lineCap = "round";
  c.fillStyle = madam ? body : head ? "#d9d2c0" : "#4a4f5a";
  c.fillRect(hx - 20, top + 120, 40, 40);
  c.fillStyle = body;
  c.beginPath(); c.moveTo(hx - 19, top + 30); c.quadraticCurveTo(hx, top + 25, hx + 19, top + 30); c.lineTo(hx + 23, top + 130); c.lineTo(hx - 23, top + 130); c.closePath(); c.fill();
  if (madam) {
    // The saree's end over one shoulder, with its border.
    c.fillStyle = "#e0b04a";
    c.beginPath(); c.moveTo(hx - 19, top + 31); c.lineTo(hx - 9, top + 28); c.lineTo(hx + 23, top + 96); c.lineTo(hx + 23, top + 112); c.closePath(); c.fill();
    c.fillStyle = "#a63d5c";
    c.beginPath(); c.moveTo(hx - 13, top + 31); c.lineTo(hx - 9, top + 29); c.lineTo(hx + 23, top + 98); c.lineTo(hx + 23, top + 106); c.closePath(); c.fill();
  } else if (head) {
    // The panjabi's placket and a black waistcoat.
    c.fillStyle = "#3b3b40"; c.fillRect(hx - 19, top + 34, 9, 80); c.fillRect(hx + 10, top + 34, 9, 80);
    if (front) { c.fillStyle = "#c9bfa8"; c.fillRect(hx - 1, top + 30, 2, 30); }
  } else if (front) {
    c.fillStyle = "#e9f1f9"; c.beginPath(); c.moveTo(hx - 7, top + 27); c.lineTo(hx, top + 36); c.lineTo(hx + 7, top + 27); c.closePath(); c.fill();
    c.fillStyle = "#6c8db0"; for (let by = top + 44; by < top + 110; by += 14) { c.beginPath(); c.arc(hx, by, 1.3, 0, Math.PI * 2); c.fill(); }
  }
  // Arms. Writing: the right hand at the chalk (or the duster). Wiping glasses: both hands at the chest, rising as they go back on.
  const restX = hx + 22, restY = top + 82;
  if (front && pose.glasses > 0) {
    const gy = hy + 2 + (top + 56 - hy - 2) * pose.glasses + pose.dy, gx = hx + 0.5;
    limb(c, hx + 17, top + 34, hx + 16, top + 58, 8, sleeve); limb(c, hx + 16, top + 58, gx + 9, gy + 3, 6, SKIN_T);
    limb(c, hx - 17, top + 34, hx - 16, top + 58, 8, sleeve); limb(c, hx - 16, top + 58, gx - 9, gy + 3, 6, SKIN_T);
    if (pose.glasses > 0.15) {
      spectacles(c, gx, gy, 3.4);
      if (pose.blind) { c.fillStyle = "#fbfbf7"; c.fillRect(gx - 7, gy + 2, 14, 7); }
    }
  } else {
    const ax = restX + (chalkX - restX) * pose.arm, ay = restY + (chalkY - restY) * pose.arm;
    const ex = (hx + 20 + ax) / 2 + 9 * pose.arm, ey = (top + 34 + ay) / 2 + 10;
    limb(c, hx + 17, top + 34, ex, ey, 8, sleeve);
    limb(c, ex, ey, ax, ay, 6, SKIN_T);
    c.fillStyle = SKIN_T; c.beginPath(); c.arc(ax, ay, 3.6, 0, Math.PI * 2); c.fill();
    if (pose.duster >= 0) { c.fillStyle = "#6b4b2e"; c.fillRect(ax - 9, ay - 4, 18, 8); c.fillStyle = "#b9b9b0"; c.fillRect(ax - 9, ay + 3, 18, 2); }
    else if (pose.arm > 0.6 && !front) { c.fillStyle = CHALK; c.fillRect(ax - 1, ay - 5, 2.4, 4); }
    if (pose.cough) {
      limb(c, hx - 17, top + 34, hx - 22, top + 52, 8, sleeve);
      limb(c, hx - 22, top + 52, hx - 6, top + 22, 6, SKIN_T);
    } else {
      limb(c, hx - 17, top + 34, hx - 24, top + 62, 8, sleeve);
      limb(c, hx - 24, top + 62, hx - 23, top + 84, 6, SKIN_T);
    }
  }
  c.fillStyle = SKIN_T; c.fillRect(hx - 4, hy + 8, 8, 8);
  if (!front) {
    // Turning: the head tilts toward the class and a cheek, an ear and one eye come round the side.
    const peek = pose.turn / 0.5;
    c.save();
    c.translate(hx, hy + 10); c.rotate(peek * 0.26); c.translate(-hx, -hy - 10);
    c.fillStyle = SKIN_T;
    c.beginPath(); c.arc(hx - 12, hy + 1, 2.8, 0, Math.PI * 2); c.fill();
    if (peek > 0.05) { c.beginPath(); c.ellipse(hx + 5 + 3 * peek, hy + 2, 3 + 6 * peek, 10.5, 0, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = hair; c.beginPath(); c.ellipse(hx - 3 * peek, hy - 1, 12, 12.5, 0, 0, Math.PI * 2); c.fill();
    if (head) { c.fillStyle = SKIN_T; c.beginPath(); c.ellipse(hx - 3 * peek, hy - 7, 7, 5, 0, 0, Math.PI * 2); c.fill(); }
    if (madam) { c.fillStyle = hair; c.beginPath(); c.arc(hx - 4 * peek, hy + 10, 6.5, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = SKIN_T; c.beginPath(); c.arc(hx + 11.5 - 6 * peek, hy + 2, 2.8, 0, Math.PI * 2); c.fill();
    if (peek > 0.35) {
      c.fillStyle = "#2b2b2b"; c.beginPath(); c.arc(hx + 10 + 2 * peek, hy + 2, 1.5, 0, Math.PI * 2); c.fill();
      limb(c, hx + 7 + 2 * peek, hy - 3, hx + 13 + 2 * peek, hy - 3.5, 1.5, hair);
      if (specs) { c.strokeStyle = "#3d3d3d"; c.lineWidth = 1.1; c.beginPath(); c.arc(hx + 10 + 2 * peek, hy + 2, 3.2, 0, Math.PI * 2); c.stroke(); }
    }
    c.restore();
  } else {
    const off = (1 - pose.turn) * 8;
    c.fillStyle = SKIN_T; c.beginPath(); c.arc(hx + off * 0.3, hy + 1, 12, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(hx - 12 + off * 0.3, hy + 2, 2.6, 0, Math.PI * 2); c.arc(hx + 12 + off * 0.3, hy + 2, 2.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = hair;
    if (head) { c.fillRect(hx - 12.5 + off * 0.3, hy - 6, 3.5, 9); c.fillRect(hx + 9 + off * 0.3, hy - 6, 3.5, 9); }
    else if (!madam) { c.beginPath(); c.ellipse(hx + off * 0.3, hy - 8, 12.5, 6.5, 0, Math.PI, Math.PI * 2); c.fill(); c.fillRect(hx - 12 + off * 0.3, hy - 9, 24, 3); }
    else { c.beginPath(); c.ellipse(hx + off * 0.3, hy - 6, 13, 8, 0, Math.PI, Math.PI * 2); c.fill(); c.fillRect(hx - 13 + off * 0.3, hy - 7, 4, 12); c.fillRect(hx + 9 + off * 0.3, hy - 7, 4, 12); }
    const fx = hx + off;
    if (pose.blind) {
      // Without the glasses the eyes squint shut.
      limb(c, fx - 6, hy + 2, fx - 3, hy + 2, 1.4, "#2b2b2b"); limb(c, fx + 3, hy + 2, fx + 6, hy + 2, 1.4, "#2b2b2b");
    } else {
      c.fillStyle = "#2b2b2b";
      c.beginPath(); c.arc(fx - 4.5, hy + 2, 1.5, 0, Math.PI * 2); c.arc(fx + 4.5, hy + 2, 1.5, 0, Math.PI * 2); c.fill();
    }
    // Eyebrows: one goes up when someone is caught. That's the whole scolding.
    limb(c, fx - 7, hy - 3 - pose.brow * 3, fx - 2, hy - 3 - pose.brow * 4.5, 1.6, hair);
    limb(c, fx + 2, hy - 3, fx + 7, hy - 3, 1.6, hair);
    if (specs && pose.glasses < 0.15) spectacles(c, fx, hy + 2, 3.4);
    if (head) { limb(c, fx - 5, hy + 7, fx + 5, hy + 7, 2.4, "#8f8a82"); }
    else if (!madam) limb(c, fx - 3.5, hy + 7, fx + 3.5, hy + 7, 1.8, "#3a2a22");
    c.strokeStyle = "#7a3b2a"; c.lineWidth = 1.4;
    c.beginPath(); if (pose.brow) c.arc(fx, hy + 10.5, 1.8, 0, Math.PI * 2); else { c.moveTo(fx - 2.5, hy + 9.5); c.quadraticCurveTo(fx, hy + 10.8, fx + 2.5, hy + 9.5); } c.stroke();
  }
  c.restore();
  if (pose.drop >= 0) { c.fillStyle = CHALK; c.fillRect(chalkX - 1, chalkY + pose.drop * (180 - chalkY), 3, 5); }
}

/** The teacher at the board, back turned and writing, for the card and the title: scene units scaled by `scale` from (ox, oy). */
export function drawTeacherWriting(c: CanvasRenderingContext2D, teacher: Teacher, world: number, ox: number, oy: number, scale: number) {
  pose.turn = 0; pose.arm = 1; pose.bend = 0; pose.cough = 0; pose.brow = 0; pose.bubble = ""; pose.drop = -1; pose.glasses = 0; pose.blind = 0; pose.duster = -1; pose.dy = 0;
  c.save();
  c.translate(ox, oy); c.scale(scale, scale);
  drawTeacher(c, teacher, world, 180, 214, 60, 0);
  c.restore();
}

function drawBubble(c: CanvasRenderingContext2D, layers: Layers, text: string, x: number, y: number, warm: boolean) {
  const w = (layers.bubble[text] ?? 60) + 16, left = Math.min(SCENE_W - w - 4, Math.max(4, x - w / 2));
  c.fillStyle = warm ? "#ffd166" : "#ffffff";
  c.beginPath(); c.roundRect(left, y - 22, w, 24, 12); c.fill();
  c.beginPath(); c.moveTo(x - 4, y + 1); c.lineTo(x + 4, y + 1); c.lineTo(x - 2, y + 8); c.closePath(); c.fill();
  c.fillStyle = "#1f2a24"; c.font = BUBBLE_FONT; c.textAlign = "left"; c.textBaseline = "alphabetic";
  c.fillText(text, left + 8, y - 5.5);
}

function drawFan(c: CanvasRenderingContext2D, angle: number) {
  c.lineCap = "round";
  for (let blade = 0; blade < 3; blade++) {
    const a = angle + blade * 2.0944, dx = Math.cos(a) * 38, dy = Math.sin(a) * 38 * 0.22;
    limb(c, 180, 14, 180 + dx, 14 + dy, 6.5, dy < 0 ? "#8e999c" : "#a7b1b3");
  }
  c.fillStyle = "#5d6668"; c.beginPath(); c.ellipse(180, 14, 7, 4.5, 0, 0, Math.PI * 2); c.fill();
}

/** A still ceiling fan for the card: the scene's fan and rod, scaled from (cx, top). */
export function drawCeilingFan(c: CanvasRenderingContext2D, cx: number, top: number, scale: number) {
  c.save();
  c.translate(cx - 180 * scale, top); c.scale(scale, scale);
  c.fillStyle = "#6d7678"; c.fillRect(178.5, 0, 3, 12);
  drawFan(c, 0.6);
  c.restore();
}

/** The captain on the front bench: straightens up to warn, then turns round and looks. */
function drawCaptain(c: CanvasRenderingContext2D, game: Game, clock: number, slow: boolean) {
  const k = game.klass, w = k.wKinds[game.wSeg], s = rowScale(0), x = CAPTAIN_X, y = CAPTAIN_Y - 37 * s;
  const looking = w === W_LOOK || (game.scold > 0 && game.scoldBy === BY_WATCHER);
  if (w === AWAY && !looking) return;
  const t = game.wT / k.wDurs[game.wSeg], up = looking ? 3 : 3 * ease(clamp01(t / 0.4));
  // Sitting up straight: the head rises out of the row.
  c.fillStyle = SKIN; c.fillRect(x - 3.5 * s, y + 6 * s - up, 7 * s, 6 * s);
  if (looking) {
    c.fillStyle = SKIN; c.beginPath(); c.arc(x, y - up, 11.5 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = HAIR; c.beginPath(); c.ellipse(x, y - up - 6 * s, 12.5 * s, 7 * s, 0, Math.PI, Math.PI * 2); c.fill();
    c.fillRect(x - 12.5 * s, y - up - 6 * s, 3.5 * s, 14 * s); c.fillRect(x + 9 * s, y - up - 6 * s, 3.5 * s, 14 * s);
    c.fillStyle = "#2b2b2b"; c.beginPath(); c.arc(x - 4 * s, y - up + 1 * s, 1.6 * s, 0, Math.PI * 2); c.arc(x + 4 * s, y - up + 1 * s, 1.6 * s, 0, Math.PI * 2); c.fill();
    limb(c, x - 2.5 * s, y - up + 6 * s, x + 2.5 * s, y - up + 6 * s, 1.2, "#7a3b2a");
    c.strokeStyle = "#e5383b"; c.lineWidth = 2; c.setLineDash(RING_DASH);
    c.beginPath(); c.arc(x, y - up, 17 * s + (slow ? 0 : Math.sin(clock * 8) * 1.2), 0, Math.PI * 2); c.stroke(); c.setLineDash(NO_DASH);
  } else {
    const turn = ease(clamp01(t / 0.7));
    c.fillStyle = HAIR; c.beginPath(); c.arc(x, y - up, 12.5 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = SKIN; c.beginPath(); c.ellipse(x + 9 * s * turn, y - up + 2 * s, 3 * s + 4 * s * turn, 8 * s, 0, 0, Math.PI * 2); c.fill();
  }
}

/** The headmaster at the door: a shadow in the glass, then his face. */
function drawDoor(c: CanvasRenderingContext2D, game: Game) {
  const k = game.klass, w = k.wKinds[game.wSeg];
  const looking = w === W_LOOK || (game.scold > 0 && game.scoldBy === BY_WATCHER);
  if (w === AWAY && !looking) return;
  c.save();
  c.beginPath(); c.rect(PANE.x, PANE.y, PANE.w, PANE.h); c.clip();
  const cx = PANE.x + PANE.w / 2;
  if (!looking) {
    const t = game.wT / k.wDurs[game.wSeg], slide = (1 - ease(clamp01(t / 0.8))) * 18;
    c.fillStyle = "rgba(40,40,48,.55)";
    c.beginPath(); c.arc(cx + slide, PANE.y + 16, 8, 0, Math.PI * 2); c.fill();
    c.fillRect(cx + slide - 11, PANE.y + 24, 22, 20);
  } else {
    c.fillStyle = "#efe8d6"; c.fillRect(cx - 11, PANE.y + 27, 22, 16);
    c.fillStyle = SKIN_T; c.beginPath(); c.arc(cx, PANE.y + 16, 8.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#a39d94"; c.fillRect(cx - 9, PANE.y + 10, 3, 7); c.fillRect(cx + 6, PANE.y + 10, 3, 7);
    c.fillStyle = "#2b2b2b"; c.beginPath(); c.arc(cx - 3, PANE.y + 16, 1.2, 0, Math.PI * 2); c.arc(cx + 3, PANE.y + 16, 1.2, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#3d3d3d"; c.lineWidth = 0.9;
    c.beginPath(); c.arc(cx - 3, PANE.y + 16, 2.6, 0, Math.PI * 2); c.moveTo(cx + 5.6, PANE.y + 16); c.arc(cx + 3, PANE.y + 16, 2.6, 0, Math.PI * 2); c.stroke();
    limb(c, cx - 4, PANE.y + 20.5, cx + 4, PANE.y + 20.5, 1.8, "#8f8a82");
  }
  c.restore();
  if (looking) { c.strokeStyle = "#e5383b"; c.lineWidth = 2; c.strokeRect(PANE.x - 3, PANE.y - 3, PANE.w + 6, PANE.h + 6); }
}

function drawRain(c: CanvasRenderingContext2D, clock: number) {
  c.save();
  c.beginPath(); c.rect(WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h); c.clip();
  c.strokeStyle = "rgba(225,235,245,.75)"; c.lineWidth = 1;
  c.beginPath();
  for (let i = 0; i < 14; i++) {
    const x = WINDOW.x + ((i * 7.3 + 3) % WINDOW.w), y = WINDOW.y - 10 + ((clock * 150 + i * 37) % (WINDOW.h + 12));
    c.moveTo(x, y); c.lineTo(x - 2, y + 7);
  }
  c.stroke();
  c.restore();
}

/** How dark the room is (0 lit .. 0.62), and the tube light's state (on, off). */
function darkness(game: Game, slow: boolean) {
  const k = game.klass;
  if (k.dKinds.length === 0) return 0;
  const light = k.dKinds[game.dSeg], t = game.dT / k.dDurs[game.dSeg];
  if (light === LIT) return 0;
  if (light === DIM) return 0.45 * ease(t);
  if (light === DARK) return 0.45 + 0.29 * ease(Math.min(1, game.dT / 0.35));
  // The tube light flickers back: in ধীরে খেলো a calm fade instead.
  if (slow) return 0.74 * (1 - t);
  if (t > 0.8) return 0.08;
  return ((game.dT * 9) | 0) % 2 === 0 ? 0.74 : 0.2;
}

/** Where the chit rests on bench k: on the holder's shoulder, where the next child can reach it. */
const restX = (klass: Klass, k: number) => seatX(k, klass.path[k]) + 14 * rowScale(k);
const restY = (k: number) => rowY(k) - 25 * rowScale(k);
const headY = (k: number) => rowY(k) - 37 * rowScale(k);

function drawChit(c: CanvasRenderingContext2D, x: number, y: number, s: number, tilt: number, glow: number) {
  c.fillStyle = glow > 0.5 ? "rgba(255,209,102,.85)" : "rgba(255,209,102,.5)";
  c.beginPath(); c.arc(x, y, 10 * s + glow * 3, 0, Math.PI * 2); c.fill();
  c.save();
  c.translate(x, y); c.rotate(tilt);
  c.fillStyle = "#fff6c4"; c.strokeStyle = "#6f5f30"; c.lineWidth = 1.1;
  c.beginPath(); c.rect(-6.5 * s, -4.5 * s, 13 * s, 9 * s); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-6.5 * s, -4.5 * s); c.lineTo(0, 0.8 * s); c.lineTo(6.5 * s, -4.5 * s); c.stroke();
  c.restore();
}

/** One frame. `view` carries the smoothed bits (the teacher's x, the fan, the shake) between frames. */
export function drawFrame(c: CanvasRenderingContext2D, layers: Layers, game: Game, view: View, dt: number) {
  const klass = game.klass, k = layers.k, p = PALETTES[layers.world], slow = view.slow;
  const dark = darkness(game, slow);
  view.clock += dt;
  view.fan += slow ? 0 : dt * (dark > 0.3 ? 2 : 9);
  c.setTransform(k, 0, 0, k, 0, 0);
  c.drawImage(layers.back, 0, 0, SCENE_W, SCENE_H);
  if (layers.world === 2) drawRain(c, slow ? 0.4 : view.clock);
  if (p.tube && dark < 0.3) { c.fillStyle = "#fbfdff"; c.fillRect(147, 22.5, 66, 4); c.fillStyle = "rgba(240,250,255,.18)"; c.fillRect(120, 22, 120, 14); }
  drawFan(c, view.fan);

  // Chalk appears as the teacher writes; the duster sweeps it off from the left.
  const ends = layers.lineEnds, ink = chalkPoint(layers, game.ink);
  const wipeX = game.wipe > 0 ? BOARD.x + 4 + game.wipe * (BOARD.w - 8) : BOARD.x;
  let start = 0;
  for (let line = 0; line < ends.length && ink > start; line++) {
    const shown = Math.min(ends[line] - start, ink - start);
    const sy = lineY(line) - BOARD.y - 18;
    const w = Math.min(BOARD.w, 12 + shown);
    const from = wipeX - BOARD.x;
    if (w > from) c.drawImage(layers.board, from * k, sy * k, (w - from) * k, 24 * k, BOARD.x + from, BOARD.y + sy, w - from, 24);
    start = ends[line];
  }
  if (game.wipe > 0) { c.fillStyle = "rgba(255,255,255,.07)"; c.fillRect(BOARD.x, BOARD.y, wipeX - BOARD.x, BOARD.h); }

  if (klass.watcher === "door") drawDoor(c, game);
  setPose(game, view.clock);
  let reachX = hand.x, reachY = hand.y;
  if (pose.duster >= 0) {
    reachX = BOARD.x + 12 + pose.duster * (BOARD.w - 24);
    reachY = BOARD.y + 18 + (BOARD.h - 36) * (0.5 + 0.5 * Math.sin(pose.duster * Math.PI * 7));
  }
  const target = Math.min(262, Math.max(134, reachX - 30));
  view.tx += (target - view.tx) * Math.min(1, dt * (pose.arm > 0.5 ? 3 : 1));
  const bob = !slow && pose.arm > 0.9 && game.phase !== "over" ? Math.sin(view.clock * 7) * 0.8 : 0;
  drawTeacher(c, klass.teacher, klass.world, view.tx, reachX, reachY, bob);

  c.drawImage(layers.rows, 0, 0, SCENE_W, SCENE_H);
  if (klass.watcher === "monitor") drawCaptain(c, game, view.clock, slow);

  // A sleeper's z's float up from his desk.
  c.font = BUBBLE_FONT; c.textAlign = "left"; c.textBaseline = "alphabetic";
  for (let bench = klass.from; bench < LAST; bench++) {
    if (!klass.sleeper[bench]) continue;
    const s = rowScale(bench), x = seatX(bench, klass.path[bench]) + 8 * s, y = rowY(bench) - 34 * s;
    for (let i = 0; i < 3; i++) {
      const f = slow ? i / 3 : (view.clock * 0.5 + i / 3) % 1;
      c.globalAlpha = 1 - f;
      c.fillStyle = "#3c4a63";
      c.fillText(Z, x + f * 10, y - f * 22);
    }
    c.globalAlpha = 1;
  }

  // The chit's way to the friend on the last bench, who waits inside a ring. A throw over a sleeper is an arc.
  const lastX = seatX(LAST, klass.path[LAST]), lastY = headY(LAST), ringR = 13 * rowScale(LAST) + 5;
  let cx = 0, cy = 0, s = 1;
  const flying = game.throwing, bench = Math.min(LAST, Math.floor(game.pos + 1e-9));
  if (flying) {
    const b = game.throwFrom, f = clamp01((game.pos - b) / 2), e = ease(f);
    const ax = restX(klass, b), ay = restY(b), bx = restX(klass, b + 2), by = restY(b + 2);
    s = rowScale(b) + (rowScale(b + 2) - rowScale(b)) * e;
    cx = ax + (bx - ax) * e; cy = ay + (by - ay) * e - Math.sin(Math.PI * f) * 46 * s;
  } else {
    const f = game.pos - bench, e = ease(f), next = bench < LAST ? bench + 1 : bench;
    const ax = restX(klass, bench), ay = restY(bench), bx = restX(klass, next), by = restY(next);
    s = rowScale(bench) + (rowScale(next) - rowScale(bench)) * e;
    cx = ax + (bx - ax) * e; cy = ay + (by - ay) * e - Math.sin(Math.PI * f) * 14 * s;
  }
  if (game.phase !== "over") {
    c.strokeStyle = "rgba(255,255,255,.8)"; c.lineWidth = 1.8; c.setLineDash(PATH_DASH);
    c.beginPath(); c.moveTo(cx, cy);
    for (let next = bench + 1; next <= LAST; next++) {
      if (klass.sleeper[next] && next < LAST) {
        const tx = restX(klass, next + 1), ty = restY(next + 1);
        c.quadraticCurveTo((restX(klass, next - 1) + tx) / 2, Math.min(restY(next - 1), ty) - 60 * rowScale(next), tx, ty);
        next++;
      } else c.lineTo(restX(klass, next), restY(next));
    }
    c.stroke();
    c.strokeStyle = "#ffd166"; c.lineWidth = 2.4; c.setLineDash(RING_DASH);
    c.beginPath(); c.arc(lastX, lastY, ringR, 0, Math.PI * 2); c.stroke();
    c.setLineDash(NO_DASH);
  }

  // The arms passing it.
  const f = game.pos - bench, passing = !flying && f > 0.02 && game.scold === 0 && game.phase === "playing";
  c.lineCap = "round";
  if (passing && f < 0.7) {
    const ks = rowScale(bench), kx = seatX(bench, klass.path[bench]);
    limb(c, kx + 15 * ks, rowY(bench) - 22 * ks, cx, cy, 5 * ks, p.shirts[0]);
    c.fillStyle = SKIN; c.beginPath(); c.arc(cx, cy, 3 * ks, 0, Math.PI * 2); c.fill();
  }
  if (passing && f > 0.35 && bench < LAST) {
    const ks = rowScale(bench + 1), kx = seatX(bench + 1, klass.path[bench + 1]);
    limb(c, kx + 15 * ks, rowY(bench + 1) - 22 * ks, cx + 2, cy + 2, 5 * ks, p.shirts[0]);
    c.fillStyle = SKIN; c.beginPath(); c.arc(cx + 2, cy + 2, 3 * ks, 0, Math.PI * 2); c.fill();
  }
  if (game.catches !== view.seenCatches) { view.seenCatches = game.catches; view.caughtAt = view.clock; }
  const shake = !slow && view.clock - view.caughtAt < 0.3 ? Math.sin(view.clock * 60) * 2 : 0;
  if (game.phase === "over" && !game.won) drawChit(c, 66, 140, 1.1, 0.2, 0);
  else if (game.phase !== "over") drawChit(c, cx + shake, cy, 0.75 + 0.5 * s, game.moving && !slow ? Math.sin(view.clock * 12) * 0.25 : -0.15, dark);

  c.font = BUBBLE_FONT; c.textAlign = "left"; c.textBaseline = "alphabetic";
  if (game.phase === "ready") {
    const tx = cx + 12, ty = cy - 14;
    c.fillStyle = "#ffffff"; c.beginPath(); c.roundRect(tx - 4, ty - 15, (layers.bubble[LABEL] ?? 46) + 10, 20, 10); c.fill();
    c.fillStyle = "#1f2a24"; c.fillText(LABEL, tx + 1, ty);
  }
  // "উফ!": a stop in the last moment floats a word up beside the chit.
  const since = game.time - game.closeAt;
  if (since >= 0 && since < 0.8 && game.phase === "playing") {
    c.globalAlpha = 1 - since / 0.8;
    c.fillStyle = "#ffffff"; c.beginPath(); c.roundRect(cx + 10, cy - 34 - since * 18, (layers.bubble[PHEW] ?? 26) + 12, 20, 10); c.fill();
    c.fillStyle = "#b03a2e"; c.fillText(PHEW, cx + 16, cy - 19 - since * 18);
    c.globalAlpha = 1;
  }
  if (pose.bubble) drawBubble(c, layers, pose.bubble, view.tx + (pose.bubble === SCOLD_WORDS ? 0 : -8), 56 + pose.bend, pose.bubble === SCOLD_WORDS);

  if (dark > 0) {
    c.fillStyle = "#0b1228"; c.globalAlpha = dark; c.fillRect(0, 0, SCENE_W, SCENE_H);
    // The window still lets in the grey daylight, and the chit's glow shows where it is.
    c.globalAlpha = dark * 0.8;
    c.drawImage(layers.back, WINDOW.x * k, WINDOW.y * k, WINDOW.w * k, WINDOW.h * k, WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h);
    c.globalAlpha = dark;
    if (game.phase !== "over") { c.fillStyle = "rgba(255,220,130,.5)"; c.beginPath(); c.arc(cx, cy, 9, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
  }
  if (game.phase === "over" && game.won) drawOpened(c, view, lastX, lastY, ringR);
}

/** The payoff: the friend on the last bench opens the chit and writes back. */
function drawOpened(c: CanvasRenderingContext2D, view: View, x: number, y: number, r: number) {
  c.fillStyle = "rgba(31,42,36,.28)"; c.fillRect(0, 0, SCENE_W, SCENE_H);
  c.save();
  c.translate(SCENE_W / 2, 236); c.rotate(-0.04);
  paperShape(c);
  c.fillStyle = PEN; c.font = OPEN_FONT; c.textAlign = "center"; c.textBaseline = "alphabetic";
  const lines = view.open;
  for (let i = 0; i < lines.length; i++) c.fillText(lines[i], 0, -18 + i * 26 - (lines.length - 1) * 8);
  c.fillStyle = "#b03a2e"; c.font = REPLY_FONT;
  c.fillText(view.reply, 40, 42);
  c.restore();
  c.strokeStyle = "#ffd166"; c.lineWidth = 2.4; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
}

/** The ruled page under the opened chit (the same look as scene.ts paintPaper, drawn without allocating). */
function paperShape(c: CanvasRenderingContext2D) {
  c.fillStyle = "rgba(0,0,0,.18)"; c.fillRect(-115, -54, 236, 116);
  c.fillStyle = "#fffdf4"; c.fillRect(-118, -58, 236, 116);
  c.strokeStyle = "#b9cde4"; c.lineWidth = 1;
  for (let ly = -36; ly < 52; ly += 20) { c.beginPath(); c.moveTo(-118, ly); c.lineTo(118, ly); c.stroke(); }
  c.strokeStyle = "#e4a5a5"; c.beginPath(); c.moveTo(-96, -58); c.lineTo(-96, 58); c.stroke();
}

