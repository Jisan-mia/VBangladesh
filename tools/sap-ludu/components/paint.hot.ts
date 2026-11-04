// Every frame of the play canvas: the pre-rendered board, the glow on a ladder or snake in use, red rings on the snake
// heads within one roll, the ghosts of a waiting choice, the pieces (sprites), the moving piece with its hop and squash,
// and a small pool of sparks and dust. Allocation-free: every buffer is made once by makeScene (npm run lint:games).
import type { Board } from "../lib/board";
import { bezierX, bezierY, placeMotion, snakeCurve, squareX, squareY, startX, startY, type Motion, type Place } from "../lib/motion.hot";

export const MAX_PARTICLES = 48;
export const SPARK = 0, DUST = 1, BITE = 2;

export type Scene = {
  board: Board;
  /** The board's pre-rendered bitmap and the canvas size in CSS px; `cell` px a square. */
  image: HTMLCanvasElement | null;
  width: number; height: number; cell: number;
  /** Piece sprites, seat * 3 + label (0 none, 1 "১", 2 "২"), drawn `sprite` px wide at scale 1. */
  sprites: HTMLCanvasElement[]; sprite: number;
  /** Squares of every piece (a copy of the game's pos, kept in sync by the component). */
  pos: Int16Array; count: number; pieces: number; turn: number;
  /** A waiting choice: up to 2 ghosts as [square, label]. */
  ghosts: Int16Array; ghostCount: number;
  /** Snake heads in reach of the turn's lead piece (jump ids), and the finale's boss (-1 if none). */
  danger: Int16Array; dangerCount: number; boss: number;
  /** Board shake, in px, decaying. */
  shake: number;
  /** Particles: x, y (px), vx, vy (px/ms), life and full life (ms), kind. */
  px: Float32Array; py: Float32Array; vx: Float32Array; vy: Float32Array; life: Float32Array; full: Float32Array; kind: Uint8Array;
  place: Place;
  slow: number;
  /** Device pixel ratio the canvas is drawn at. */
  ratio: number;
  /** The ghost labels' font, sized to the cell. */
  font: string;
};

const DASH = [4, 4];
const SOLID: number[] = [];
const SPARK_COLOURS = ["#ffd43b", "#fff3bf", "#fab005"];
const DUST_COLOUR = "#00000033";
const BITE_COLOUR = "#e03131";
const LABELS = ["", "১", "২"];
// Per-frame scratch for pieces sharing a square.
const rank = new Int8Array(16), share = new Int8Array(16);

export function spawn(scene: Scene, x: number, y: number, count: number, kind: number) {
  if (scene.slow) return;
  for (let n = 0; n < count; n++) {
    let free = -1;
    for (let i = 0; i < MAX_PARTICLES; i++) if (scene.life[i] <= 0) { free = i; break; }
    if (free < 0) return;
    const angle = kind === DUST ? Math.PI + Math.random() * Math.PI : Math.random() * Math.PI * 2;
    const speed = kind === SPARK ? 0.04 + Math.random() * 0.08 : kind === BITE ? 0.06 + Math.random() * 0.1 : 0.02 + Math.random() * 0.03;
    scene.px[free] = x; scene.py[free] = y;
    scene.vx[free] = Math.cos(angle) * speed; scene.vy[free] = Math.sin(angle) * speed - (kind === SPARK ? 0.05 : 0);
    scene.full[free] = scene.life[free] = kind === DUST ? 360 : 520 + Math.random() * 260;
    scene.kind[free] = kind;
  }
}

/** Advance particles and the shake by `dt` ms. Returns true while anything is still moving. */
export function tickScene(scene: Scene, dt: number) {
  let alive = false;
  for (let i = 0; i < MAX_PARTICLES; i++) {
    if (scene.life[i] <= 0) continue;
    scene.life[i] -= dt;
    scene.px[i] += scene.vx[i] * dt; scene.py[i] += scene.vy[i] * dt;
    scene.vy[i] += (scene.kind[i] === DUST ? -0.00002 : 0.00018) * dt;
    alive = true;
  }
  scene.shake = scene.shake > 0.2 ? scene.shake * Math.pow(0.988, dt) : 0;
  return alive || scene.shake > 0;
}

function pieceAt(scene: Scene, index: number, out: Place) {
  const square = scene.pos[index];
  if (square <= 0) { out.x = startX(scene.board, index, scene.count); out.y = startY(scene.board); return; }
  out.x = squareX(scene.board, square); out.y = squareY(scene.board, square);
}

function sprite(scene: Scene, c: CanvasRenderingContext2D, index: number, x: number, y: number, scale: number, squash: number, lift: number) {
  const image = scene.sprites[Math.floor(index / scene.pieces) * 3 + (scene.pieces === 2 ? 1 + (index % 2) : 0)];
  if (!image) return;
  const size = scene.sprite * scale, w = size * (2 - squash) * 0.5 + size * 0.5, h = size * squash;
  // The shadow stays on the board while the piece lifts.
  c.fillStyle = DUST_COLOUR;
  c.beginPath(); c.ellipse(x, y + size * 0.3, size * 0.32 * (1 - lift * 0.8), size * 0.12 * (1 - lift * 0.8), 0, 0, Math.PI * 2); c.fill();
  c.drawImage(image, x - w / 2, y - h / 2 - lift * scene.cell, w, h);
}

function glowJump(scene: Scene, c: CanvasRenderingContext2D, m: Motion, now: number) {
  const { board, cell } = scene, jump = board.jumps[m.jump];
  c.lineCap = "round"; c.lineJoin = "round";
  c.strokeStyle = m.ladder ? "#ffe066aa" : "#ff6b6b99";
  c.lineWidth = cell * (0.55 + Math.sin(now * 0.012) * 0.06);
  c.beginPath();
  if (m.ladder) {
    c.moveTo(squareX(board, jump.from) * cell, squareY(board, jump.from) * cell);
    c.lineTo(squareX(board, jump.to) * cell, squareY(board, jump.to) * cell);
  } else {
    const curve = snakeCurve(board, m.jump);
    c.moveTo(bezierX(curve, 0) * cell, bezierY(curve, 0) * cell);
    for (let i = 1; i <= 24; i++) c.lineTo(bezierX(curve, i / 24) * cell, bezierY(curve, i / 24) * cell);
  }
  c.stroke();
}

function ring(c: CanvasRenderingContext2D, x: number, y: number, r: number, colour: string, now: number, slow: number) {
  c.strokeStyle = colour;
  c.lineWidth = Math.max(2, r * 0.16);
  DASH[0] = r * 0.42; DASH[1] = r * 0.28;
  c.setLineDash(DASH);
  c.lineDashOffset = slow ? 0 : -now * 0.02;
  c.beginPath(); c.arc(x, y, r * (slow ? 1 : 1 + Math.sin(now * 0.008) * 0.06), 0, Math.PI * 2); c.stroke();
  c.setLineDash(SOLID);
}

/** Paint one frame. `m` is the move in flight (m.active 0 when nothing moves); `now` drives the pulses. */
export function paint(scene: Scene, c: CanvasRenderingContext2D, m: Motion, now: number) {
  const { board, cell, image } = scene;
  if (!image || !cell) return;
  c.setTransform(scene.ratio, 0, 0, scene.ratio, 0, 0);
  c.clearRect(0, 0, scene.width, scene.height);
  c.save();
  if (scene.shake > 0) c.translate(Math.sin(now * 0.09) * scene.shake, Math.cos(now * 0.11) * scene.shake * 0.5);
  c.drawImage(image, 0, 0, scene.width, scene.height);

  const moving = m.active && m.slot >= 0 && m.t >= m.dice;
  if (moving && m.jump >= 0 && m.t >= m.dice + m.walk) glowJump(scene, c, m, now);

  for (let i = 0; i < scene.dangerCount; i++) {
    const jump = board.jumps[scene.danger[i]];
    ring(c, squareX(board, jump.from) * cell, squareY(board, jump.from) * cell, cell * 0.42, BITE_COLOUR, now, scene.slow);
  }
  if (scene.boss >= 0) {
    const jump = board.jumps[scene.boss];
    ring(c, squareX(board, jump.from) * cell, squareY(board, jump.from) * cell, cell * 0.5, "#1b1b1bcc", now, scene.slow);
  }

  for (let g = 0; g < scene.ghostCount; g++) {
    const square = scene.ghosts[g * 2], label = scene.ghosts[g * 2 + 1], x = squareX(board, square) * cell, y = squareY(board, square) * cell;
    c.globalAlpha = 0.55;
    sprite(scene, c, scene.turn * scene.pieces + label - 1, x, y, 0.85, 1, 0);
    c.globalAlpha = 1;
    ring(c, x, y, cell * 0.4, "#ffffff", now, scene.slow);
    c.fillStyle = "#1b1b1b"; c.font = scene.font;
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(LABELS[label], x + cell * 0.34, y - cell * 0.34);
    c.textBaseline = "alphabetic";
  }

  // Pieces that share a square spread out and shrink a little; the turn's pieces are drawn last, on top.
  const place = scene.place;
  for (let i = 0; i < scene.count; i++) { rank[i] = 0; share[i] = 0; }
  for (let i = 0; i < scene.count; i++) {
    if ((moving && i === m.slot) || scene.pos[i] <= 0) continue;
    for (let j = 0; j < scene.count; j++) {
      if ((moving && j === m.slot) || scene.pos[j] !== scene.pos[i]) continue;
      share[i]++;
      if (j < i) rank[i]++;
    }
  }
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < scene.count; i++) {
      if (moving && i === m.slot) continue;
      const mine = Math.floor(i / scene.pieces) === scene.turn ? 1 : 0;
      if (mine !== pass) continue;
      pieceAt(scene, i, place);
      let x = place.x * cell, y = place.y * cell, scale = scene.pos[i] <= 0 ? 0.78 : 1;
      if (share[i] > 1) {
        const angle = rank[i] / share[i] * Math.PI * 2 - Math.PI / 2, spread = cell * (share[i] > 3 ? 0.26 : 0.22);
        x += Math.cos(angle) * spread; y += Math.sin(angle) * spread; scale = share[i] > 3 ? 0.62 : 0.74;
      }
      sprite(scene, c, i, x, y, scale, 1, 0);
    }
  }

  if (moving) {
    placeMotion(m, board, scene.count, place);
    sprite(scene, c, m.slot, place.x * cell, place.y * cell, 1.12, place.squash, place.lift);
  }

  for (let i = 0; i < MAX_PARTICLES; i++) {
    const life = scene.life[i];
    if (life <= 0) continue;
    const kind = scene.kind[i], fade = life / scene.full[i];
    c.globalAlpha = fade;
    c.fillStyle = kind === SPARK ? SPARK_COLOURS[i % 3] : kind === BITE ? BITE_COLOUR : DUST_COLOUR;
    const r = kind === DUST ? cell * (0.1 + (1 - fade) * 0.12) : cell * 0.05 * (0.6 + fade);
    c.beginPath(); c.arc(scene.px[i], scene.py[i], r, 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
  c.restore();
}
