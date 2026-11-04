// Everything drawn once per level or per resize, into offscreen canvases the frame code copies: the board with its tin walls and
// pipes, the food and crow atlas, the orange danger rim, and the লোডশেডিং dark with its হারিকেন hole. Crisp at DPR 2.
import { drawCrow, drawFood, drawPipe, drawTin, worldPalettes } from "./art";
import { levelOf, worldOf, WORLDS, COLS, ROWS } from "./levels";
import type { View } from "./view";

export const SPRITES = ["muri", "chanachur", "peyaj", "morich", "tetul", "sonali"] as const;
/** Atlas frames after the foods: the crow facing right, then facing left. */
export const CROW_RIGHT = 6, CROW_LEFT = 7, FRAMES = 8;

const canvas = (reuse: HTMLCanvasElement | null, width: number, height: number) => {
  const element = reuse ?? document.createElement("canvas");
  element.width = Math.max(1, Math.round(width)); element.height = Math.max(1, Math.round(height));
  return element;
};

/** Lays the board out inside `boxWidth × boxHeight` CSS px: whole cells, the fence a little thicker than a tenth of a cell. */
export function layout(view: View, boxWidth: number, boxHeight: number) {
  const fit = Math.min(boxWidth / (COLS + 0.8), boxHeight / (ROWS + 0.8));
  const cell = Math.max(12, Math.floor(fit * 2) / 2), fence = Math.max(8, Math.round(cell * 0.4));
  view.cell = cell; view.fence = fence;
  view.width = fence * 2 + cell * COLS; view.height = fence * 2 + cell * ROWS;
  view.ratio = Math.min(2, window.devicePixelRatio || 1);
}

export function paintLevel(view: View, level: number) {
  const { width, height, fence, cell, ratio } = view;
  const colors = worldPalettes[WORLDS[worldOf(level)].palette];
  view.colors = colors;
  const background = view.background = canvas(view.background, width * ratio, height * ratio);
  const b = background.getContext("2d")!;
  b.setTransform(ratio, 0, 0, ratio, 0, 0);
  b.fillStyle = colors.board;
  b.fillRect(fence, fence, width - fence * 2, height - fence * 2);
  b.fillStyle = colors.boardAlt;
  for (let y = 0; y < ROWS; y++) for (let x = (y + 1) % 2; x < COLS; x += 2) b.fillRect(fence + x * cell, fence + y * cell, cell, cell);
  const world = WORLDS[worldOf(level)].palette;
  b.fillStyle = colors.marks;
  if (world === "paper") {
    // Faint newspaper columns: abstract lines, no words.
    for (let column = 0; column < 3; column++) {
      const left = fence + column * cell * 4 + cell * 0.3, span = cell * 3.4;
      for (let line = 0, y = fence + cell * 0.35; y < height - fence - 4; line++, y += cell / 3) {
        b.fillRect(left, y, span * (line % 7 === 6 ? 0.45 : 0.82 + ((line * 37 + column * 11) % 18) / 100), 1.5);
      }
    }
  } else if (world === "station") {
    // Platform tiles every two cells, and the yellow edge line near the bottom.
    for (let x = 0; x <= COLS; x += 2) b.fillRect(fence + x * cell - 0.75, fence, 1.5, height - fence * 2);
    for (let y = 0; y <= ROWS; y += 2) b.fillRect(fence, fence + y * cell - 0.75, width - fence * 2, 1.5);
    b.fillStyle = "#e8b73066";
    b.fillRect(fence, fence + cell * (ROWS - 0.5) - 2, width - fence * 2, 4);
  } else {
    // A few far-off stars over the fair.
    for (let i = 0; i < 40; i++) {
      const x = fence + ((i * 73) % 100) / 100 * (width - fence * 2), y = fence + ((i * 37 + 11) % 100) / 100 * (height - fence * 2);
      b.fillStyle = i % 3 ? "#ffffff14" : "#ffd36b22";
      b.beginPath(); b.arc(x, y, 1 + (i % 3) * 0.6, 0, Math.PI * 2); b.fill();
    }
  }
  const data = level ? levelOf(level) : null;
  for (const [x, y, w, h] of data?.walls ?? []) {
    drawTin(b, fence + x * cell, fence + y * cell, w * cell, h * cell, w >= h ? "x" : "y");
    b.fillStyle = colors.tin; b.globalAlpha = 0.35; b.fillRect(fence + x * cell, fence + y * cell, w * cell, h * cell); b.globalAlpha = 1;
    b.strokeStyle = "#00000059"; b.lineWidth = 1.5; b.strokeRect(fence + x * cell + 0.75, fence + y * cell + 0.75, w * cell - 1.5, h * cell - 1.5);
  }
  if (data?.pipes) for (const [x, y] of [[data.pipes[0], data.pipes[1]], [data.pipes[2], data.pipes[3]]]) drawPipe(b, fence + (x + 0.5) * cell, fence + (y + 0.5) * cell, cell * 0.5);
  if (data?.gate) {
    // Rails under the gate: two dark lines and sleepers.
    const [x, y, w] = data.gate.cells;
    b.fillStyle = "#00000030";
    for (let i = 0; i < w; i++) b.fillRect(fence + (x + i) * cell + cell * 0.2, fence + y * cell + cell * 0.1, cell * 0.16, cell * 0.8);
    b.fillStyle = "#4b4f55";
    b.fillRect(fence + x * cell, fence + y * cell + cell * 0.28, w * cell, 2.5);
    b.fillRect(fence + x * cell, fence + y * cell + cell * 0.68, w * cell, 2.5);
  }
  // The fence, with the world's colours over the tin ridges.
  drawTin(b, 0, 0, width, fence, "x");
  drawTin(b, 0, height - fence, width, fence, "x");
  drawTin(b, 0, fence, fence, height - fence * 2, "y");
  drawTin(b, width - fence, fence, fence, height - fence * 2, "y");
  b.globalAlpha = 0.55; b.fillStyle = colors.tin;
  b.fillRect(0, 0, width, fence); b.fillRect(0, height - fence, width, fence); b.fillRect(0, fence, fence, height - fence * 2); b.fillRect(width - fence, fence, fence, height - fence * 2);
  b.globalAlpha = 1;
  b.fillStyle = colors.bolt;
  const bolts = colors.night ? 26 : 6;
  for (let i = 0; i < bolts; i++) {
    const t = i / bolts, perimeter = t * 2 * (width + height);
    const px = perimeter < width ? perimeter : perimeter < width + height ? width : perimeter < 2 * width + height ? 2 * width + height - perimeter : 0;
    const py = perimeter < width ? 0 : perimeter < width + height ? perimeter - width : perimeter < 2 * width + height ? height : 2 * (width + height) - perimeter;
    const bx = Math.min(width - fence / 2, Math.max(fence / 2, px)), by = Math.min(height - fence / 2, Math.max(fence / 2, py));
    b.beginPath(); b.arc(bx, by, fence * (colors.night ? 0.26 : 0.22), 0, Math.PI * 2); b.fill();
  }
  b.strokeStyle = "#00000040"; b.lineWidth = 2;
  b.strokeRect(fence - 1, fence - 1, width - fence * 2 + 2, height - fence * 2 + 2);
  paintSprites(view);
  paintDanger(view);
  if (data?.dark) paintDark(view); else view.dark = null;
}

function paintSprites(view: View) {
  const size = Math.ceil(view.cell * view.ratio);
  const atlas = view.atlas = canvas(view.atlas, size * FRAMES, size);
  const s = atlas.getContext("2d")!;
  s.setTransform(1, 0, 0, 1, 0, 0);
  s.clearRect(0, 0, atlas.width, atlas.height);
  SPRITES.forEach((kind, index) => drawFood(s, kind, index * size + size / 2, size / 2, size * 0.4));
  for (const frame of [CROW_RIGHT, CROW_LEFT]) {
    // At night a pale halo keeps the black crow visible on the indigo board.
    if (view.colors.night) {
      const glow = s.createRadialGradient(frame * size + size / 2, size / 2, size * 0.1, frame * size + size / 2, size / 2, size * 0.5);
      glow.addColorStop(0, "#fff3c8aa"); glow.addColorStop(1, "#fff3c800");
      s.fillStyle = glow; s.fillRect(frame * size, 0, size, size);
    }
  }
  drawCrow(s, CROW_RIGHT * size + size / 2, size / 2, size * 0.46);
  s.save(); s.translate((CROW_LEFT + 1) * size, 0); s.scale(-1, 1); drawCrow(s, size / 2, size / 2, size * 0.46); s.restore();
  view.sprite = size;
}

/** The orange rim that glows when the next move ends the run. */
function paintDanger(view: View) {
  const { width, height, ratio, fence } = view, reach = fence + view.cell * 1.4;
  const danger = view.danger = canvas(view.danger, width * ratio, height * ratio);
  const d = danger.getContext("2d")!;
  d.setTransform(ratio, 0, 0, ratio, 0, 0);
  d.clearRect(0, 0, width, height);
  const edge = (x0: number, y0: number, x1: number, y1: number, x: number, y: number, w: number, h: number) => {
    const g = d.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, "#ff6a1ae6"); g.addColorStop(0.35, "#ff6a1a66"); g.addColorStop(1, "#ff6a1a00");
    d.fillStyle = g; d.fillRect(x, y, w, h);
  };
  edge(0, 0, 0, reach, 0, 0, width, reach);
  edge(0, height, 0, height - reach, 0, height - reach, width, reach);
  edge(0, 0, reach, 0, 0, 0, reach, height);
  edge(width, 0, width - reach, 0, width - reach, 0, reach, height);
}

/** লোডশেডিং: a dark sheet twice the board's size with a soft round hole in the middle, slid so the hole sits on the head. */
function paintDark(view: View) {
  const { width, height, ratio, cell } = view;
  const dark = view.dark = canvas(view.dark, width * 2 * ratio, height * 2 * ratio);
  const d = dark.getContext("2d")!;
  d.setTransform(ratio, 0, 0, ratio, 0, 0);
  const g = d.createRadialGradient(width, height, cell * 1.6, width, height, cell * 4.2);
  g.addColorStop(0, "#0b0c1d00"); g.addColorStop(0.55, "#0b0c1dc0"); g.addColorStop(1, "#0b0c1df5");
  d.fillStyle = g;
  d.fillRect(0, 0, width * 2, height * 2);
}
