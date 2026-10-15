// One round of সাত টুকরো as plain data: where the seven pieces are, what is already in place, and what each tap or drop does.
// Two frames: the model frame is the diamond lattice the rules live on; the view frame is what the child sees (an upright
// figure is turned back 45°). The tray and the ghost finger are laid out in the view frame.
import { makeRng, starsFor } from '../../../shared/game-core';
import { SET, corners, fit, fitsTurned, makeBoard, overSilhouette, turn8, type Board, type Kind, type Point, type Pose } from './tangram';
import { FIGURES, LEVEL_COUNT, bandOf, type Figure } from './figures';

export const PIECE_NAME: Record<Kind, string> = { L: 'বড় ত্রিভুজ', M: 'মাঝারি ত্রিভুজ', S: 'ছোট ত্রিভুজ', Q: 'বর্গ', P: 'সামান্তরিক' };
/** One colour per piece of the set (SET order: two large, medium, two small, square, parallelogram). */
export const PIECE_COLOR = ['#e76f51', '#f4a261', '#2a9d8f', '#e9c46a', '#8ab17d', '#4d96ff', '#9b5de5'] as const;
export const TRAY_SCALE = 0.6;
/** Misses in a row before the right spot for the held piece lights up. */
export const HINT_AFTER = 3;

const r = Math.SQRT1_2;
/** Model → view: an upright figure is shown turned back 45°. */
export const toView = (upright: boolean, [x, y]: Point): Point => upright ? [r * (x + y), r * (y - x)] : [x, y];
export const toModel = (upright: boolean, [x, y]: Point): Point => upright ? [r * (x - y), r * (x + y)] : [x, y];

export type Piece = { id: number; kind: Kind; rot: number; flip: boolean; x: number; y: number; home: Point; inTray: boolean; done: boolean };
export type Layout = { box: [number, number, number, number]; trayTop: number };
export type Round = {
  level: number; figure: Figure; upright: boolean; board: Board; layout: Layout; solution: Pose[];
  pieces: Piece[]; filled: number[];
  /** A finish for the still-empty part of the silhouette: drawn as outlines on easy levels, and used for hints. */
  shown: Pose[];
  misses: number; missRun: number; selected: number | null;
};
export type Outcome = 'fit' | 'done' | 'turn' | 'miss' | 'park' | 'home' | 'none';

/** Slide a figure's solution well inside the lattice box (whole units, so it stays on the lattice). */
export function solutionOf(figure: Figure): Pose[] {
  const all = figure.pieces.flatMap(corners);
  const dx = 2 - Math.floor(Math.min(...all.map(p => p[0]))), dy = 2 - Math.floor(Math.min(...all.map(p => p[1])));
  return figure.pieces.map(pose => ({ ...pose, x: pose.x + dx, y: pose.y + dy }));
}

/** The figure's pieces in the view frame, moved to start at (0, 0): for thumbnails, the card and the print sheet. */
export function figureView(figure: Figure) {
  const shapes = solutionOf(figure).map(pose => ({ kind: pose.kind, points: corners(pose).map(p => toView(figure.upright, p)) }));
  const xs = shapes.flatMap(s => s.points.map(p => p[0])), ys = shapes.flatMap(s => s.points.map(p => p[1]));
  const [x0, y0] = [Math.min(...xs), Math.min(...ys)];
  return {
    width: Math.max(...xs) - x0, height: Math.max(...ys) - y0,
    shapes: shapes.map((s, index) => ({ ...s, color: PIECE_COLOR[colorSlot(figure.pieces, index)], points: s.points.map(([x, y]) => [x - x0, y - y0] as Point) })),
  };
}

/** Which colour a solution piece gets: twins take the first then the second colour of their kind. */
function colorSlot(pieces: readonly Pose[], index: number) {
  const kind = pieces[index].kind, nth = pieces.slice(0, index).filter(p => p.kind === kind).length;
  return SET.findIndex((k, i) => k === kind && SET.slice(0, i).filter(x => x === kind).length === nth);
}

const PAD = 0.5, GAP = 0.9, MIN_WIDTH = 9.6, CELL_HEIGHT = 2.3;
/** Tray cells, as [row, column] in a 4-wide grid: the big pieces on top, the small ones below. */
const TRAY_CELL: Array<[number, number]> = [[0, 0], [0, 1], [0, 2], [1, 1.5], [1, 2.5], [1, 0.5], [0, 3]];

export function newRound(level: number, seed: number): Round {
  level = Math.min(Math.max(1, Math.round(level) || 1), LEVEL_COUNT);
  const figure = FIGURES[level - 1], upright = figure.upright;
  const solution = solutionOf(figure), board = makeBoard(solution), band = bandOf(level), random = makeRng(seed);
  const view = solution.flatMap(corners).map(p => toView(upright, p));
  const [minX, maxX, minY, maxY] = [Math.min(...view.map(p => p[0])), Math.max(...view.map(p => p[0])), Math.min(...view.map(p => p[1])), Math.max(...view.map(p => p[1]))];
  const width = Math.max(MIN_WIDTH, maxX - minX + 2 * PAD), left = minX - (width - (maxX - minX)) / 2, top = minY - PAD;
  const trayTop = maxY + GAP, cell = width / 4;
  const layout: Layout = { box: [left, top, width, trayTop + 2 * CELL_HEIGHT + PAD / 2 - top], trayTop };
  const used: number[] = [];
  const pieces = SET.map((kind, id): Piece => {
    // On the easy steps each piece starts turned like its place in the picture.
    const twin = solution.findIndex((pose, index) => pose.kind === kind && !used.includes(index));
    used.push(twin);
    const rot = band.turned ? Math.floor(random() * 8) : solution[twin].rot;
    const flip = kind === 'P' && (band.turned ? random() < 0.5 : solution[twin].flip);
    const [row, column] = TRAY_CELL[id];
    const home = toModel(upright, [left + cell * (column + 0.5), trayTop + CELL_HEIGHT * (row + 0.5)]);
    return { id, kind, rot, flip, x: home[0], y: home[1], home, inTray: true, done: false };
  });
  return { level, figure, upright, board, layout, solution, pieces, filled: [], shown: solution, misses: 0, missRun: 0, selected: null };
}

const poseOf = (piece: Piece): Pose => ({ kind: piece.kind, rot: turn8(piece.rot), flip: piece.flip, x: piece.x, y: piece.y });
const othersOf = (round: Round, id: number) => round.pieces.filter(p => !p.done && p.id !== id).map(p => p.kind);
const withPiece = (round: Round, id: number, change: Partial<Piece>): Round => ({ ...round, pieces: round.pieces.map(p => p.id === id ? { ...p, ...change } : p) });

function settle(round: Round, id: number, reach: number): { round: Round; outcome: Outcome } | null {
  const piece = round.pieces[id], filled = new Set(round.filled);
  const got = fit(round.board, filled, othersOf(round, id), poseOf(piece), round.shown, reach);
  if (!got) return null;
  const next = withPiece({ ...round, filled: [...round.filled, ...got.cells], shown: got.rest, missRun: 0, selected: null }, id, { x: got.pose.x, y: got.pose.y, inTray: false, done: true });
  return { round: next, outcome: next.pieces.every(p => p.done) ? 'done' : 'fit' };
}

/** Let go of a piece with its centre at model point (x, y). */
export function drop(round: Round, id: number, x: number, y: number): { round: Round; outcome: Outcome } {
  const piece = round.pieces[id];
  if (!piece || piece.done) return { round, outcome: 'none' };
  const moved = withPiece(round, id, { x, y, inTray: false });
  const snapped = settle(moved, id, 1.25);
  if (snapped) return snapped;
  if (overSilhouette(round.board, [x, y])) {
    if (fitsTurned(round.board, new Set(round.filled), othersOf(round, id), poseOf({ ...piece, x, y }), round.shown)) return { round: { ...moved, selected: id }, outcome: 'turn' };
    return { round: withPiece({ ...round, misses: round.misses + 1, missRun: round.missRun + 1, selected: id }, id, { x: piece.home[0], y: piece.home[1], inTray: true }), outcome: 'miss' };
  }
  const [vx, vy] = toView(round.upright, [x, y]), [left, top, width, height] = round.layout.box;
  const outside = vx < left || vx > left + width || vy < top || vy > top + height;
  if (outside || vy > round.layout.trayTop - 0.2) return { round: withPiece(round, id, { x: piece.home[0], y: piece.home[1], inTray: true }), outcome: 'home' };
  return { round: moved, outcome: 'park' };
}

/** Tap on a piece: the first tap picks it up, the next ones turn it 45°. A loose piece that turns into place clicks in. */
export function tapPiece(round: Round, id: number): { round: Round; outcome: Outcome | 'select' | 'rotate' } {
  const piece = round.pieces[id];
  if (!piece || piece.done) return { round, outcome: 'none' };
  if (round.selected !== id) return { round: { ...round, selected: id }, outcome: 'select' };
  return reshape(round, id, { rot: piece.rot + 1 }, 'rotate');
}

/** The mirror button: only the parallelogram has a different other side. */
export function flipPiece(round: Round, id: number) {
  const piece = round.pieces[id];
  if (!piece || piece.done || piece.kind !== 'P') return { round, outcome: 'none' as const };
  return reshape(round, id, { flip: !piece.flip }, 'flip');
}

function reshape<T extends string>(round: Round, id: number, change: Partial<Piece>, outcome: T): { round: Round; outcome: Outcome | T } {
  const next = withPiece(round, id, change);
  if (next.pieces[id].inTray) return { round: next, outcome };
  return settle(next, id, 0.9) ?? { round: next, outcome };
}

/** Keyboard: move a piece half a unit in the view frame; it clicks in only when it lands exactly. */
export function nudge(round: Round, id: number, dx: number, dy: number) {
  const piece = round.pieces[id];
  if (!piece || piece.done) return { round, outcome: 'none' as Outcome };
  const start = piece.inTray ? toModel(round.upright, [round.layout.box[0] + round.layout.box[2] / 2, round.layout.box[1] + (round.layout.trayTop - round.layout.box[1]) / 2]) : [piece.x, piece.y];
  const [vx, vy] = toView(round.upright, start as Point), [x, y] = piece.inTray ? start : toModel(round.upright, [vx + dx, vy + dy]);
  const moved = withPiece({ ...round, selected: id }, id, { x, y, inTray: false });
  return settle(moved, id, 0.3) ?? { round: moved, outcome: 'park' as Outcome };
}

/** After a few misses in a row, the spot for the held piece (or the next empty spot) lights up. */
export function hintFor(round: Round): Pose | null {
  if (round.missRun < HINT_AFTER || !round.shown.length) return null;
  const held = round.selected === null ? null : round.pieces[round.selected];
  return round.shown.find(pose => pose.kind === held?.kind) ?? round.shown[0];
}

/** Stars are a record only: 0–2 wrong tries → 3, up to 5 → 2, otherwise 1. */
export const starsOf = (misses: number) => starsFor(misses, 2, 5, true);
