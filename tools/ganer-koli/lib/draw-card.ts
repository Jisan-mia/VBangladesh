import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { bn, gameTitle, humanLine, leader, scores, teamName, type Game } from "./game";

const WOOD = "#4a2210";
const WOOD_LIGHT = "#6e3519";
const CHALK = "#f6f1e4";
const CHALK_YELLOW = "#ffd98a";
const CHIT = "#f3e2b3";
const INK = "#1f3a7a";
const BRASS = "#d6a548";

const layouts = {
  feed: { knobs: 92, lidTop: 150, lidBottom: 1210, title: 262, names: 400, scores: 630, tally: 700, chitLabel: 868, chits: 900, line: 1150 },
  story: { knobs: 300, lidTop: 360, lidBottom: 1620, title: 476, names: 660, scores: 940, tally: 1010, chitLabel: 1226, chits: 1262, line: 1520 },
} as const;

/** Chalk on wood: the text drawn twice, a hair apart and a little see-through, so it reads hand-written rather than printed. */
function chalk(context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, maxWidth: number, color = CHALK, align: "left" | "center" = "center") {
  context.globalAlpha = 0.55;
  fitText(context, [{ text, color, weight: 700, display: true }], x + 2, y + 1, size, maxWidth, align);
  context.globalAlpha = 0.9;
  const used = fitText(context, [{ text, color, weight: 700, display: true }], x, y, size, maxWidth, align);
  context.globalAlpha = 1;
  return used;
}

function chalkStroke(context: CanvasRenderingContext2D, draw: () => void, width = 7, color = CHALK) {
  context.save();
  context.strokeStyle = color; context.lineWidth = width; context.lineCap = "round"; context.globalAlpha = 0.85;
  context.beginPath(); draw(); context.stroke();
  context.restore();
}

function drawWood(context: CanvasRenderingContext2D, width: number, height: number) {
  const base = context.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, "#5c2b14"); base.addColorStop(1, "#3a190a");
  context.fillStyle = base;
  context.fillRect(0, 0, width, height);
  // Long wavy grain, the way a harmonium's polished lid catches the light.
  context.lineWidth = 2;
  for (let row = 0; row < height; row += 26) {
    context.strokeStyle = row % 78 === 0 ? "#2a10051f" : "#8a4a2414";
    context.beginPath();
    for (let x = 0; x <= width; x += 40) context.lineTo(x, row + Math.sin((x + row * 3) / 170) * 9);
    context.stroke();
  }
}

/** The row of brass stop knobs that sits along the top of every harmonium. */
function drawKnobs(context: CanvasRenderingContext2D, width: number, y: number) {
  const count = 7, gap = (width - 240) / (count - 1);
  for (let index = 0; index < count; index++) {
    const x = 120 + index * gap;
    context.fillStyle = "#1c0b03"; context.beginPath(); context.arc(x, y + 4, 26, 0, Math.PI * 2); context.fill();
    const knob = context.createRadialGradient(x - 8, y - 8, 4, x, y, 24);
    knob.addColorStop(0, "#fbe6b0"); knob.addColorStop(1, BRASS);
    context.fillStyle = knob; context.beginPath(); context.arc(x, y, 22, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#7a5414"; context.beginPath(); context.arc(x, y, 7, 0, Math.PI * 2); context.fill();
  }
}

function drawLid(context: CanvasRenderingContext2D, width: number, top: number, bottom: number) {
  context.save();
  context.shadowColor = "#00000080"; context.shadowBlur = 30; context.shadowOffsetY = 12;
  context.fillStyle = WOOD;
  roundedRect(context, 56, top, width - 112, bottom - top, 28); context.fill();
  context.restore();
  context.strokeStyle = WOOD_LIGHT; context.lineWidth = 6;
  roundedRect(context, 74, top + 18, width - 148, bottom - top - 36, 18); context.stroke();
  // Chalk dust where earlier scores were wiped off.
  context.fillStyle = "#f6f1e408";
  for (let index = 0; index < 5; index++) { context.beginPath(); context.ellipse(220 + index * 170, top + 140 + (index % 2) * 380, 150, 46, -0.1, 0, Math.PI * 2); context.fill(); }
}

/** Tally marks in fives, the way scores get counted on a slate; past 20 the number says enough. */
function drawTally(context: CanvasRenderingContext2D, count: number, cx: number, y: number) {
  const marks = Math.min(count, 20), groups = Math.ceil(marks / 5);
  const groupWidth = 76, start = cx - (groups * groupWidth - 16) / 2;
  for (let group = 0; group < groups; group++) {
    const inGroup = Math.min(5, marks - group * 5), left = start + group * groupWidth;
    for (let mark = 0; mark < Math.min(inGroup, 4); mark++) chalkStroke(context, () => { context.moveTo(left + mark * 14, y); context.lineTo(left + mark * 14 + 3, y + 54); }, 5);
    if (inGroup === 5) chalkStroke(context, () => { context.moveTo(left - 8, y + 44); context.lineTo(left + 54, y + 10); }, 5);
  }
}

function drawChits(context: CanvasRenderingContext2D, letters: string[], width: number, top: number) {
  const size = 62, gap = 10, perRow = 12, maxShown = perRow * 2;
  const shown = letters.length > maxShown ? [...letters.slice(0, maxShown - 1), `+${bn(letters.length - maxShown + 1)}`] : letters;
  shown.forEach((letter, index) => {
    const row = Math.floor(index / perRow), col = index % perRow;
    const inRow = Math.min(perRow, shown.length - row * perRow);
    const x = width / 2 - (inRow * (size + gap) - gap) / 2 + col * (size + gap), y = top + row * (size + 26);
    context.save();
    context.translate(x + size / 2, y + size / 2);
    context.rotate(((index * 7) % 5 - 2) * 0.04);
    context.fillStyle = CHIT;
    context.shadowColor = "#00000066"; context.shadowBlur = 6; context.shadowOffsetY = 3;
    context.fillRect(-size / 2, -size / 2, size, size);
    context.shadowColor = "transparent";
    // The fold line of a chit pulled out of the pot.
    context.strokeStyle = "#c9b27a"; context.lineWidth = 2;
    context.beginPath(); context.moveTo(-size / 2, 0); context.lineTo(size / 2, 0); context.stroke();
    fitText(context, [{ text: letter, color: INK, weight: 700, display: true }], 0, 15, letter.startsWith("+") ? 30 : 42, size - 10, "center");
    context.restore();
  });
}

export function drawCard(canvas: HTMLCanvasElement, game: Game, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");

  drawWood(context, width, height);
  drawKnobs(context, width, layout.knobs);
  drawLid(context, width, layout.lidTop, layout.lidBottom);

  const titleSize = chalk(context, gameTitle(game), width / 2, layout.title, 68, 860, CHALK_YELLOW);
  const reach = Math.min(420, titleSize * 5);
  chalkStroke(context, () => { context.moveTo(width / 2 - reach, layout.title + 34); context.quadraticCurveTo(width / 2, layout.title + 52, width / 2 + reach, layout.title + 28); }, 6, CHALK_YELLOW);

  const points = scores(game.rounds);
  const lead = leader(game);
  const columns = [300, width - 300];
  columns.forEach((cx, index) => {
    const team = index as 0 | 1;
    chalk(context, teamName(game.teams, team), cx, layout.names, 56, 380);
    const scoreText = bn(points[team]);
    const size = chalk(context, scoreText, cx, layout.scores, 230, 360);
    if (lead === team) {
      // A quick chalk loop around the winning score, sized to the number.
      const half = context.measureText(scoreText).width / 2;
      chalkStroke(context, () => { context.ellipse(cx, layout.scores - size * 0.36, half + 32, size * 0.6, -0.1, 0.3, Math.PI * 2 + 0.1); }, 6, CHALK_YELLOW);
    }
    drawTally(context, points[team], cx, layout.tally + 40);
  });
  chalk(context, "—", width / 2, layout.scores - 70, 110, 120);

  const drawn = game.rounds.map(round => round.letter);
  if (drawn.length) {
    chalk(context, `যে অক্ষরগুলো উঠেছিল · ${bn(drawn.length)}টা`, width / 2, layout.chitLabel, 34, 800, "#e9d9b8");
    drawChits(context, drawn, width, layout.chits);
  }
  chalk(context, humanLine(game), width / 2, layout.line, 50, 900, CHALK);

  drawFooterBand(context, format, "তোমাদের বাসায় কে জেতে?", site, { band: "#1e0c04", ask: CHALK_YELLOW, site: "#ffffff" });
}

export const cardBlob = (game: Game, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, game, format, site));
