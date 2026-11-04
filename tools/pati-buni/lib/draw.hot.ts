// One frame: copy the pre-painted floor and frame, then the woven cells, the weave and bloom of finished rows, the aim glow
// on the warp, the falling strip, chips, the HUD in the top corners, the floating points and the danger edge.
// Allocation-free (npm run lint:games): no literals, closures or string building in here; every sprite and string comes from scene.ts.
import { spriteIndex } from "./art";
import { headroom, type Game } from "./game";
import { CHIPS, type Scene } from "./scene";
import { clearMs, landing } from "./step.hot";
import { ACROSS, BOX, COLOUR, COLS, GOLD, OLD, ROWS, SIZE, SUI, TURNS, WET, colourOf } from "./pieces";

const STAR = "★";
const NEXT = "এরপর";
const CHIP_COLOURS = ["#f8e9c2", "#f5c85c", "#9ebd5c", "#cf7553", "#fff1a8"];

const ease = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);
const back = (t: number) => { const s = 1.7; const u = t - 1; return 1 + u * u * ((s + 1) * u + s); };
const clamp01 = (t: number) => t < 0 ? 0 : t > 1 ? 1 : t;

/** Cane chips fly up from a woven row or a hard landing. */
export function addChips(scene: Scene, x: number, y: number, w: number, colour: number, count: number) {
  const chips = scene.chips;
  for (let i = 0; i < count; i++) {
    const at = (scene.chipAt++ % CHIPS) * 6;
    // A cheap spread from the index, so the chips are the same on every phone and no random source is needed.
    const f = ((i * 7919 + scene.chipAt * 104729) % 1000) / 1000;
    chips[at] = x + f * w; chips[at + 1] = y;
    chips[at + 2] = (f - 0.5) * 160; chips[at + 3] = -120 - ((i * 37) % 11) * 14;
    chips[at + 4] = 0.7; chips[at + 5] = colour;
  }
}

export function tickScene(scene: Scene, dt: number) {
  const chips = scene.chips;
  for (let at = 0; at < CHIPS * 6; at += 6) {
    if (chips[at + 4] <= 0) continue;
    chips[at + 4] -= dt; chips[at] += chips[at + 2] * dt; chips[at + 1] += chips[at + 3] * dt; chips[at + 3] += 520 * dt;
  }
}

function tileAt(scene: Scene, value: number, x: number, y: number, w: number, h: number) {
  const variant = value & OLD ? 1 : value & WET ? 2 : 0, t = scene.tile;
  scene.context.drawImage(scene.tiles, spriteIndex(colourOf(value), (value & ACROSS) !== 0, variant) * t, 0, t, t, x, y, w, h);
}

function isClearing(game: Game, row: number) {
  for (let i = 0; i < game.clearCount; i++) if (game.clearing[i] === row) return true;
  return false;
}

/** The weave of a finished row: the weft threads across, every cell opens the motif, and the band squashes as it rolls away. */
function drawBloom(scene: Scene, game: Game, y: number, h: number, progress: number, calm: boolean) {
  const c = scene.context, cell = scene.cell, x0 = scene.wellX, reach = clamp01(progress / 0.3);
  const band = h * 0.44;
  c.drawImage(scene.weft, 0, 0, Math.max(1, scene.weft.width * reach), scene.weft.height, x0, y + (h - band) / 2, scene.wellW * reach, band);
  if (reach < 1) {
    c.fillStyle = scene.palette.glow;
    c.beginPath(); c.arc(x0 + scene.wellW * reach, y + h / 2, band * 0.8, 0, Math.PI * 2); c.fill();
  }
  // A warm light over the row while it blooms.
  const light = clamp01((progress - 0.15) / 0.2) * (1 - clamp01((progress - 0.7) / 0.3));
  c.globalAlpha = light * 0.35;
  c.fillStyle = scene.palette.glow;
  c.fillRect(x0, y, scene.wellW, h);
  c.globalAlpha = 1;
  const gold = game.clearGold ? 1 : 0, m = scene.motifPx;
  for (let col = 0; col < COLS; col++) {
    const local = clamp01((progress - 0.2 - col * 0.025) / 0.32);
    if (local <= 0) continue;
    const grow = calm ? local : back(local), size = cell * (0.35 + 0.65 * grow) * (h / cell);
    if (size < 1) continue;
    c.globalAlpha = calm ? local : 1;
    c.drawImage(scene.motifs, gold * m, 0, m, m, x0 + col * cell + (cell - size) / 2, y + (h - size) / 2, size, size);
  }
  c.globalAlpha = 1;
}

/** The strip in the air: tiles with a pale outline, a little pop when it enters or turns, a nudge when it knocks a wall. */
function drawPiece(scene: Scene, game: Game, calm: boolean) {
  const c = scene.context, cell = scene.cell, now = scene.now;
  const kind = game.kind, cells = TURNS[kind][game.turn];
  let scale = 1, dx = 0, tilt = 0;
  if (!calm) {
    const spawn = (now - scene.spawnAt) / 110, turn = (now - scene.turnAt) / 100, knock = (now - scene.knockAt) / 110, stuck = (now - scene.stuckAt) / 180;
    if (spawn >= 0 && spawn < 1) scale = 0.82 + 0.18 * ease(spawn);
    if (turn >= 0 && turn < 1) scale *= 1 + 0.09 * (1 - turn);
    if (knock >= 0 && knock < 1) dx = scene.knockDir * 3 * (1 - knock);
    if (stuck >= 0 && stuck < 1) tilt = Math.sin(stuck * Math.PI * 4) * 0.07 * (1 - stuck);
  }
  // The strip's centre, for the pop.
  const box = BOX[kind], cx = scene.wellX + (game.x + box / 2) * cell, cy = scene.wellY + (game.y + box / 2) * cell, k = scene.k;
  c.setTransform(k * scale, 0, 0, k * scale, k * (cx + dx - scale * cx), k * (cy - scale * cy));
  if (tilt) { c.translate(cx, cy); c.rotate(tilt); c.translate(-cx, -cy); }
  if (kind === SUI) {
    const n = scene.needlePx;
    c.drawImage(scene.needle, 0, 0, n, scene.needle.height, scene.wellX + game.x * cell, scene.wellY + game.y * cell - cell * 0.45, cell, cell * 1.5);
  } else {
    const colour = game.gold ? GOLD : COLOUR[kind], variant = game.wet ? 2 : 0, t = scene.tile;
    c.strokeStyle = game.gold ? "#fff6c0" : scene.palette.glow;
    c.lineWidth = 2;
    for (let i = 0; i < SIZE[kind]; i++) {
      const px = scene.wellX + (game.x + cells[i * 2]) * cell, py = scene.wellY + (game.y + cells[i * 2 + 1]) * cell;
      c.drawImage(scene.tiles, spriteIndex(colour, ((cells[i * 2] + cells[i * 2 + 1]) & 1) === 0, variant) * t, 0, t, t, px, py, cell, cell);
      c.strokeRect(px + 1, py + 1, cell - 2, cell - 2);
    }
  }
  c.setTransform(scene.k, 0, 0, scene.k, 0, 0);
}

/** The warp threads under the strip glow down to where it would land: aim without a shadow piece. */
function drawAim(scene: Scene, game: Game) {
  const c = scene.context, cell = scene.cell, kind = game.kind, cells = TURNS[kind][game.turn], land = landing(game);
  c.fillStyle = scene.palette.aim;
  for (let i = 0; i < SIZE[kind]; i++) {
    const col = game.x + cells[i * 2], top = game.y + cells[i * 2 + 1] + 1, bottom = land + cells[i * 2 + 1] + 1;
    // Only the lowest cell of the strip in each column throws the glow.
    let lowest = true;
    for (let j = 0; j < SIZE[kind]; j++) if (j !== i && cells[j * 2] === cells[i * 2] && cells[j * 2 + 1] > cells[i * 2 + 1]) lowest = false;
    if (!lowest || bottom <= top) continue;
    c.globalAlpha = 0.16;
    c.fillRect(scene.wellX + col * cell + 2, scene.wellY + top * cell, cell - 4, (bottom - top) * cell);
    c.globalAlpha = 0.55;
    c.fillRect(scene.wellX + col * cell + cell * 0.25 - 1, scene.wellY + top * cell, 2, (bottom - top) * cell);
    c.fillRect(scene.wellX + col * cell + cell * 0.75 - 1, scene.wellY + top * cell, 2, (bottom - top) * cell);
  }
  c.globalAlpha = 1;
}

/** The next strip as a little bundle tied with twine, its box centred at (x, y). */
function drawNext(scene: Scene, game: Game, x: number, y: number, unit: number) {
  const c = scene.context, kind = game.next, cells = TURNS[kind][0], t = scene.tile;
  let minX = 9, maxX = -1, minY = 9, maxY = -1;
  for (let i = 0; i < SIZE[kind]; i++) {
    if (cells[i * 2] < minX) minX = cells[i * 2]; if (cells[i * 2] > maxX) maxX = cells[i * 2];
    if (cells[i * 2 + 1] < minY) minY = cells[i * 2 + 1]; if (cells[i * 2 + 1] > maxY) maxY = cells[i * 2 + 1];
  }
  const ox = x - ((minX + maxX + 1) * unit) / 2, oy = y - ((minY + maxY + 1) * unit) / 2;
  if (kind === SUI) { c.drawImage(scene.needle, 0, 0, scene.needlePx, scene.needle.height, x - unit / 2, y - unit * 0.75, unit, unit * 1.5); return; }
  const colour = game.nextGold ? GOLD : COLOUR[kind], variant = game.nextWet ? 2 : 0;
  for (let i = 0; i < SIZE[kind]; i++) {
    c.drawImage(scene.tiles, spriteIndex(colour, ((cells[i * 2] + cells[i * 2 + 1]) & 1) === 0, variant) * t, 0, t, t, ox + cells[i * 2] * unit, oy + cells[i * 2 + 1] * unit, unit, unit);
  }
  c.fillStyle = "#7a5a2e";
  c.fillRect(x - unit * 0.1, oy + minY * unit - unit * 0.2, unit * 0.2, (maxY - minY + 1) * unit + unit * 0.4);
}

function drawHud(scene: Scene, game: Game) {
  const c = scene.context, p = scene.palette, w = scene.width, row = game.row;
  // The goal line along the very top edge; a finale's is its named bar, thicker and red (the name is on the badge).
  const share = row.goal ? Math.min(1, game.rows / row.goal) : (game.rows % 10) / 10, thick = scene.finaleText ? 7 : 4;
  c.fillStyle = p.ink; c.globalAlpha = 0.14; c.fillRect(0, 0, w, thick); c.globalAlpha = 1;
  c.fillStyle = scene.finaleText ? "#c2361f" : p.accent; c.fillRect(0, 0, w * share, thick);
  // Points, top-right, with the star pips and the গোটানো left under them.
  c.textAlign = "right"; c.textBaseline = "alphabetic";
  c.font = scene.fontPoints; c.fillStyle = p.ink;
  c.fillText(scene.pointsText, w - 10, 27);
  if (scene.three) {
    c.font = scene.fontSmall;
    for (let s = 0; s < 3; s++) {
      const need = s === 0 ? -1 : s === 1 ? scene.two : scene.three;
      const lit = s === 0 ? game.rows >= row.goal : game.score >= need;
      c.fillStyle = lit ? "#f2b632" : p.muted;
      c.globalAlpha = lit ? 1 : 0.45;
      c.fillText(STAR, w - 10 - (2 - s) * 13, 43);
    }
    c.globalAlpha = 1;
  }
  // গোটানো left, as little rolls under the left of the points.
  for (let r = 0; r < game.rolls; r++) {
    const x = w - 56 - r * 15;
    c.fillStyle = "#a2844a"; c.fillRect(x - 6, 36, 12, 6);
    c.fillStyle = "#e8cf92"; c.fillRect(x - 6, 37, 12, 2);
    c.fillStyle = "#7a5a2e"; c.beginPath(); c.arc(x + 6, 39, 3, 0, Math.PI * 2); c.fill();
  }
  // The next strip, left of the points, under its label.
  const unit = Math.min(14, scene.cell * 0.36), nx = w - 112;
  c.textAlign = "center"; c.font = scene.fontSmall; c.fillStyle = p.muted;
  c.fillText(NEXT, nx, 14);
  drawNext(scene, game, nx, 31, unit);
}

/** Rising rows: notches on the bottom bamboo count the strips until the next one, glowing when it is one strip away. */
function drawRise(scene: Scene, game: Game, calm: boolean) {
  const row = game.row;
  if (!row.rise) return;
  const c = scene.context, y = scene.wellY + scene.wellH + scene.bar * 0.3, h = Math.max(3, scene.bar * 0.4);
  const step = scene.wellW / row.rise, left = game.riseIn;
  for (let i = 0; i < row.rise; i++) {
    c.fillStyle = i < left ? "#5f240e" : "#f2b632";
    c.fillRect(scene.wellX + i * step + 2, y, step - 4, h);
  }
  if (left <= 1) {
    const pulse = calm ? 0.5 : 0.35 + 0.35 * Math.sin(scene.now / 90);
    c.globalAlpha = pulse; c.fillStyle = scene.palette.danger;
    c.fillRect(scene.wellX - scene.bar, scene.wellY + scene.wellH, scene.wellW + scene.bar * 2, scene.bar);
    c.globalAlpha = 1;
  }
}

/** Draws the whole frame. `show` false on the title (the frame waits, dimmed by the card over it). */
export function drawScene(scene: Scene, game: Game | null, calm: boolean, show: boolean) {
  const c = scene.context, cell = scene.cell, now = scene.now;
  c.setTransform(scene.k, 0, 0, scene.k, 0, 0);
  c.drawImage(scene.bg, 0, 0, scene.width, scene.height);
  if (!game) return;
  // A hard landing bumps the frame a hair.
  const bump = calm ? 0 : clamp01(1 - (now - scene.bumpAt) / 120) * 2;
  if (bump) c.setTransform(scene.k, 0, 0, scene.k, 0, bump * scene.k);
  const board = game.board, x0 = scene.wellX, y0 = scene.wellY;
  if (game.clearCount) {
    const progress = clamp01(1 - game.clearLeft / clearMs(game));
    const roll = progress < 0.72 ? 0 : ease((progress - 0.72) / 0.28);
    let y = y0 + scene.wellH;
    for (let row = ROWS - 1; row >= 0; row--) {
      const woven = isClearing(game, row), h = woven ? cell * (1 - roll) : cell;
      y -= h;
      if (h < 0.5) continue;
      for (let col = 0; col < COLS; col++) { const value = board[row * COLS + col]; if (value) tileAt(scene, value, x0 + col * cell, y, cell, h); }
      if (woven) drawBloom(scene, game, y, h, progress, calm);
    }
  } else {
    for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) {
      const value = board[row * COLS + col];
      if (value) tileAt(scene, value, x0 + col * cell, y0 + row * cell, cell, cell);
    }
  }
  // A new old row slides up from under the frame.
  if (!calm && now - scene.riseAt < 200) {
    c.globalAlpha = 0.4 * (1 - (now - scene.riseAt) / 200); c.fillStyle = scene.palette.danger;
    c.fillRect(x0, y0 + scene.wellH - cell, scene.wellW, cell); c.globalAlpha = 1;
  }
  if (show && game.live && !game.clearCount && !game.over) {
    drawAim(scene, game);
    drawPiece(scene, game, calm);
  }
  // A hard drop leaves a fading streak down its columns.
  const streak = (now - scene.dropAt) / 140;
  if (!calm && streak >= 0 && streak < 1) {
    c.globalAlpha = 0.35 * (1 - streak); c.fillStyle = scene.palette.glow;
    c.fillRect(x0 + scene.dropX * cell + 3, y0 + scene.dropTop * cell, scene.dropW * cell - 6, (scene.dropBottom - scene.dropTop) * cell);
    c.globalAlpha = 1;
  }
  drawRise(scene, game, calm);
  if (bump) c.setTransform(scene.k, 0, 0, scene.k, 0, 0);
  // Chips.
  const chips = scene.chips;
  for (let at = 0; at < CHIPS * 6; at += 6) {
    if (chips[at + 4] <= 0) continue;
    c.globalAlpha = Math.min(1, chips[at + 4] * 2);
    c.fillStyle = CHIP_COLOURS[chips[at + 5] - 1 < 0 ? 0 : (chips[at + 5] - 1) % 5];
    c.fillRect(chips[at], chips[at + 1], 4, 2.5);
  }
  c.globalAlpha = 1;
  if (show) drawHud(scene, game);
  // The points rise from the woven rows.
  const float = (now - scene.floatAt) / 950;
  if (scene.floatAt >= 0 && float >= 0 && float < 1) {
    const fy = scene.floatY - (calm ? 0 : ease(float) * cell * 1.3), mid = x0 + scene.wellW / 2;
    c.globalAlpha = float < 0.7 ? 1 : (1 - float) / 0.3;
    c.textAlign = "center"; c.lineWidth = 4; c.strokeStyle = "#2e2119"; c.fillStyle = "#f2b632"; c.font = scene.fontFloat;
    c.strokeText(scene.floatText, mid, fy); c.fillText(scene.floatText, mid, fy);
    if (scene.floatSub) {
      c.font = scene.fontSub; c.fillStyle = "#fff4d6";
      c.strokeText(scene.floatSub, mid, fy + cell * 0.8); c.fillText(scene.floatSub, mid, fy + cell * 0.8);
    }
    c.globalAlpha = 1;
  }
  // Danger at the edge: orange from ten rows high, red and quicker from twelve; a still border in ধীরে খেলো.
  if (show && !game.over) {
    const room = headroom(board);
    if (room <= 4) {
      const hot = room <= 2, speed = hot ? 140 : 260;
      const alpha = calm ? 0.55 : (hot ? 0.55 : 0.4) + (hot ? 0.4 : 0.3) * Math.sin(now / speed);
      c.globalAlpha = alpha;
      c.drawImage(hot ? scene.edgeHot : scene.edgeWarm, 0, 0, scene.width, scene.height);
      c.globalAlpha = 1;
    }
  }
}
