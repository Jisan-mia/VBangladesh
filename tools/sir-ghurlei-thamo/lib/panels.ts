// Canvas pictures outside the play loop: the title's big folded chit (the start button), the three story panels drawn with the
// real classroom renderer, and the opened chit's lines prepared once per finished class.
import { DISPLAY_FONT, wrapText } from "../../../shared/card-canvas";
import { CHITS, createGame, LOOK, makeClass, REPLIES, type Klass } from "./class";
import { drawFrame, drawTeacherWriting, makeView, OPEN_FONT, type View } from "./draw.hot";
import { buildLayers, CHALK, paintPaper, PALETTES, PEN, SCENE_H, SCENE_W } from "./scene";

export const TITLE_ASPECT = 0.78;

/** The title's start button: the board behind, the teacher writing, and a folded chit with খেলো in blue pen. */
export function drawTitleChit(canvas: HTMLCanvasElement, width: number, ratio: number, word: string, world: number, teacher: "sir" | "madam" | "head") {
  const height = Math.round(width * TITLE_ASPECT);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d")!;
  c.setTransform(ratio * width / 300, 0, 0, ratio * width / 300, 0, 0);
  const H = 300 * TITLE_ASPECT, p = PALETTES[world];
  c.clearRect(0, 0, 300, H);
  // The board, edge to edge, with yesterday's chalk smudges.
  c.fillStyle = "#8a5a34"; c.beginPath(); c.roundRect(4, 6, 292, 128, 10); c.fill();
  c.fillStyle = p.board; c.beginPath(); c.roundRect(11, 13, 278, 114, 6); c.fill();
  c.fillStyle = "rgba(255,255,255,.06)";
  c.beginPath(); c.ellipse(70, 70, 50, 18, -0.3, 0, Math.PI * 2); c.ellipse(230, 50, 40, 15, -0.2, 0, Math.PI * 2); c.fill();
  c.fillStyle = CHALK; c.globalAlpha = 0.85; c.font = `600 15px ${DISPLAY_FONT}`; c.textBaseline = "alphabetic";
  c.fillText("স্যার ঘুরলেই থামো", 22, 38);
  c.fillRect(22, 43, c.measureText("স্যার ঘুরলেই থামো").width, 1.4);
  c.globalAlpha = 1;
  drawTeacherWriting(c, teacher, world, 214 - 180 * 0.62, 130 - 196 * 0.62, 0.62);
  // The chit: a torn exercise-book page folded once, tilted on the desk, with খেলো in pen.
  c.save();
  c.translate(150, 160); c.rotate(-0.07);
  c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.roundRect(-104, -48, 214, 104, 6); c.fill();
  paintPaper(c, -108, -54, 214, 104, 1);
  c.fillStyle = "rgba(0,0,0,.06)"; c.beginPath(); c.moveTo(-108, -54); c.lineTo(-1, 2); c.lineTo(106, -54); c.closePath(); c.fill();
  c.fillStyle = PEN; c.font = `800 46px ${DISPLAY_FONT}`; c.textAlign = "center";
  c.fillText(word, 0, 20);
  c.strokeStyle = PEN; c.lineWidth = 2.4; c.lineCap = "round";
  c.beginPath(); c.moveTo(-44, 32); c.quadraticCurveTo(0, 40, 46, 30); c.stroke();
  c.restore();
}

export const STORY_ASPECT = SCENE_H / SCENE_W;
const STORY_SEED = 48213;

/** Story panel `at`: the teacher writing to a quiet class; the chit arriving on the first bench; the teacher turned round, the class frozen. */
export function drawStoryPanel(canvas: HTMLCanvasElement, width: number, ratio: number, at: number) {
  const height = Math.round(width * STORY_ASPECT);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const klass = makeClass(STORY_SEED, 1), game = createGame(klass), view = makeView();
  view.slow = true; view.tx = 200;
  game.ink = at === 0 ? 3.2 : 5;
  if (at >= 1) { game.phase = "playing"; game.pos = klass.from + (at === 1 ? 0.55 : 1.2); game.moving = at === 1; }
  if (at === 2) { while (klass.kinds[game.seg] !== LOOK) game.seg++; game.segT = 0.6; view.tx = 170; }
  const layers = buildLayers(width, ratio, klass), c = canvas.getContext("2d")!;
  drawFrame(c, layers, game, view, 0);
}

/** The opened chit's lines and the reply, wrapped once when a class is won. */
export function openChit(view: View, c: CanvasRenderingContext2D, klass: Klass) {
  c.save(); c.font = OPEN_FONT;
  view.open = wrapText(c, CHITS[klass.chit], 200, 2);
  c.restore();
  view.reply = `— ${REPLIES[klass.reply]}`;
}
