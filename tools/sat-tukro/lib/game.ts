// One round of সাত টুকরো as plain data: where the seven pieces are, what is already in place, and what each tap or drop does.
// Two frames: the model frame is the diamond lattice the rules live on; the view frame is what the child sees (an upright
// figure is turned back 45°). The tray and the ghost finger are laid out in the view frame.
import { makeRng, starsFor } from '../../../shared/game-core';
import { AREA, SET, cellsOf, corners, fit, fitsTurned, makeBoard, overSilhouette, sameTurn, turn8, type Board, type Kind, type Point, type Pose } from './tangram';
import type { Figure } from './figures';
import { LEVEL_COUNT, figureOf, specOf, type LevelSpec } from './levels';

export const PIECE_NAME: Record<Kind, string> = { L: 'বড় ত্রিভুজ', M: 'মাঝারি ত্রিভুজ', S: 'ছোট ত্রিভুজ', Q: 'বর্গ', P: 'সামান্তরিক' };
/** One colour per piece of the set (SET order: two large, medium, two small, square, parallelogram). */
export const PIECE_COLOR = ['#e76f51', '#f4a261', '#2a9d8f', '#e9c46a', '#8ab17d', '#4d96ff', '#9b5de5'] as const;
export const TRAY_SCALE = 0.6;
/** Misses in a row before the right spot for the held piece lights up (one fewer after a hard round). */
export const HINT_AFTER = 3;
/** Pieces let go on nothing in a row before the right spot lights up: a lost child gets a hint too. */
export const LOST_AFTER = 4;
/** A round with this many wrong tries makes the next one a little gentler, without saying so. */
export const EASE_AFTER = 6;
/** The most pieces that may already sit in the shadow when a round starts. */
export const MAX_PRE = 5;

const r = Math.SQRT1_2;
/** Model → view: an upright figure is shown turned back 45°. */
export const toView = (upright: boolean, [x, y]: Point): Point => upright ? [r * (x + y), r * (y - x)] : [x, y];
export const toModel = (upright: boolean, [x, y]: Point): Point => upright ? [r * (x - y), r * (x + y)] : [x, y];

export type Piece = { id: number; kind: Kind; rot: number; flip: boolean; x: number; y: number; home: Point; inTray: boolean; done: boolean };
export type Layout = { box: [number, number, number, number]; trayTop: number; trayScale: number };
export type Round = {
  level: number; spec: LevelSpec; figure: Figure; upright: boolean; board: Board; layout: Layout; solution: Pose[];
  pieces: Piece[]; filled: number[];
  /** A finish for the still-empty part of the silhouette: drawn as outlines on easy levels, and used for hints. */
  shown: Pose[];
  misses: number; missRun: number; selected: number | null;
  /** Pieces let go on nothing in a row, quarter turns and mirrors, and pieces the child put in (not the ones already there). */
  lostRun: number; turned: number; placedByChild: number;
  /** 1 when the last round was hard: one more piece is in, and the hint comes after 2 wrong drops. */
  ease: number; hintAfter: number;
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

/** Tray size by how many pieces wait in it: fewer pieces, bigger pieces. */
export const trayScaleFor = (count: number) => count <= 2 ? 0.85 : count <= 4 ? 0.75 : count <= 5 ? 0.7 : 0.6;

/** Turns that are surely wrong for a kind: a square repeats every 90°, a parallelogram every 180°. */
const WRONG: Record<Kind, readonly number[]> = { L: [1, 2, 3, 4, 5, 6, 7], M: [1, 2, 3, 4, 5, 6, 7], S: [1, 2, 3, 4, 5, 6, 7], Q: [1, 3, 5, 7], P: [1, 2, 3, 5, 6, 7] };

/** The solution poses in the order they are placed for free: smallest first, so the child gets the big, easy ones. */
export function preOrder(solution: readonly Pose[]) {
  return solution.map((pose, index) => ({ index, area: AREA[pose.kind] })).sort((a, b) => a.area - b.area || a.index - b.index).map(entry => entry.index);
}

/** How many pieces start in the shadow: the level's own number, one more after a hard round, never above MAX_PRE. */
export const preFor = (spec: LevelSpec, ease: number) => Math.min(MAX_PRE, spec.pre + (ease > 0 && spec.pre < MAX_PRE ? 1 : 0));

/** After a round: 1 (gentler) when it took EASE_AFTER or more wrong tries. */
export const easeFrom = (misses: number) => misses >= EASE_AFTER ? 1 : 0;

export function newRound(level: number, seed: number, ease = 0): Round {
  level = Math.min(Math.max(1, Math.round(level) || 1), LEVEL_COUNT);
  const spec = specOf(level), figure = figureOf(level), upright = figure.upright;
  const solution = solutionOf(figure), board = makeBoard(solution), random = makeRng(seed);
  const view = solution.flatMap(corners).map(p => toView(upright, p));
  const [minX, maxX, minY, maxY] = [Math.min(...view.map(p => p[0])), Math.max(...view.map(p => p[0])), Math.min(...view.map(p => p[1])), Math.max(...view.map(p => p[1]))];
  const width = Math.max(MIN_WIDTH, maxX - minX + 2 * PAD), left = minX - (width - (maxX - minX)) / 2, top = minY - PAD;
  const trayTop = maxY + GAP;

  // Which solution pose each piece stands for (twins take them in order), and which are already in.
  const used: number[] = [];
  const twinOf = SET.map(kind => { const twin = solution.findIndex((pose, index) => pose.kind === kind && !used.includes(index)); used.push(twin); return twin; });
  const free = new Set(preOrder(solution).slice(0, preFor(spec, ease)));
  const pre = SET.map((_, id) => free.has(twinOf[id]));
  const waiting = SET.map((_, id) => id).filter(id => !pre[id]);
  const wrong = new Set(shuffle(waiting, random).slice(0, spec.turns));

  const trayScale = trayScaleFor(waiting.length), rows = waiting.length > 4 ? 2 : 1, first = Math.ceil(waiting.length / rows);
  const pieces = SET.map((kind, id): Piece => {
    const slot = solution[twinOf[id]];
    if (pre[id]) return { id, kind, rot: slot.rot, flip: slot.flip, x: slot.x, y: slot.y, home: [slot.x, slot.y], inTray: false, done: true };
    // A turned piece starts in a turn that fits none of the picture's spots of its kind (a twin's spot would be a free pass).
    const bad = WRONG[kind].filter(offset => !solution.some(pose => pose.kind === kind && sameTurn(pose, { ...pose, rot: slot.rot + offset, flip: slot.flip })));
    const offsets = bad.length ? bad : WRONG[kind];
    const rot = wrong.has(id) ? turn8(slot.rot + offsets[Math.floor(random() * offsets.length)]) : slot.rot;
    const flip = kind === 'P' ? (spec.flip ? !slot.flip : slot.flip) : false;
    const at = waiting.indexOf(id), row = at < first ? 0 : 1, inRow = row === 0 ? first : waiting.length - first, column = row === 0 ? at : at - first;
    const cell = width / Math.max(3, inRow);
    const x = left + width / 2 + (column - (inRow - 1) / 2) * cell, y = trayTop + (rows === 1 ? CELL_HEIGHT : CELL_HEIGHT * (row + 0.5));
    const home = toModel(upright, [x, y]);
    return { id, kind, rot, flip, x: home[0], y: home[1], home, inTray: true, done: false };
  });
  const filled = pieces.flatMap(piece => piece.done ? cellsOf(corners(poseOf(piece))) ?? [] : []);
  const shown = solution.filter((_, index) => !free.has(index));
  const layout: Layout = { box: [left, top, width, trayTop + 2 * CELL_HEIGHT + PAD / 2 - top], trayTop, trayScale };
  return { level, spec, figure, upright, board, layout, solution, pieces, filled, shown, misses: 0, missRun: 0, selected: null, lostRun: 0, turned: 0, placedByChild: 0, ease, hintAfter: ease ? HINT_AFTER - 1 : HINT_AFTER };
}

/** A seeded shuffle (Fisher-Yates) of a copy. */
function shuffle<T>(list: readonly T[], random: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

const poseOf = (piece: Piece): Pose => ({ kind: piece.kind, rot: turn8(piece.rot), flip: piece.flip, x: piece.x, y: piece.y });
const othersOf = (round: Round, id: number) => round.pieces.filter(p => !p.done && p.id !== id).map(p => p.kind);
const withPiece = (round: Round, id: number, change: Partial<Piece>): Round => ({ ...round, pieces: round.pieces.map(p => p.id === id ? { ...p, ...change } : p) });

function settle(round: Round, id: number, reach: number): { round: Round; outcome: Outcome } | null {
  const piece = round.pieces[id], filled = new Set(round.filled);
  const got = fit(round.board, filled, othersOf(round, id), poseOf(piece), round.shown, reach);
  if (!got) return null;
  const next = withPiece({ ...round, filled: [...round.filled, ...got.cells], shown: got.rest, missRun: 0, lostRun: 0, placedByChild: round.placedByChild + 1, selected: null }, id, { x: got.pose.x, y: got.pose.y, inTray: false, done: true });
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
  return { round: { ...moved, lostRun: round.lostRun + 1 }, outcome: 'park' };
}

/** Tap on a piece: the first tap picks it up, the next ones turn it 45°. A loose piece that turns into place clicks in. */
export function tapPiece(round: Round, id: number): { round: Round; outcome: Outcome | 'select' | 'rotate' } {
  const piece = round.pieces[id];
  if (!piece || piece.done) return { round, outcome: 'none' };
  if (round.selected !== id) return { round: { ...round, selected: id }, outcome: 'select' };
  return reshape(round, id, { rot: piece.rot + 1 }, 'rotate');
}

/** The turn button, or a second finger: a quarter-eighth turn of this piece, whether or not it was the one picked. */
export function turnPiece(round: Round, id: number) {
  const piece = round.pieces[id];
  if (!piece || piece.done) return { round, outcome: 'none' as const };
  return reshape({ ...round, selected: id }, id, { rot: piece.rot + 1 }, 'rotate');
}

/** The mirror button: only the parallelogram has a different other side. */
export function flipPiece(round: Round, id: number) {
  const piece = round.pieces[id];
  if (!piece || piece.done || piece.kind !== 'P') return { round, outcome: 'none' as const };
  return reshape(round, id, { flip: !piece.flip }, 'flip');
}

function reshape<T extends string>(round: Round, id: number, change: Partial<Piece>, outcome: T): { round: Round; outcome: Outcome | T } {
  const next = withPiece({ ...round, turned: round.turned + 1 }, id, change);
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

/** After a few misses in a row, pieces let go on nothing, or a long quiet (`idle`), the spot for the held piece (or the next empty spot) lights up. */
export function hintFor(round: Round, idle = false): Pose | null {
  if (!round.shown.length || !(idle || round.missRun >= round.hintAfter || round.lostRun >= LOST_AFTER)) return null;
  const held = round.selected === null ? null : round.pieces[round.selected];
  return round.shown.find(pose => pose.kind === held?.kind) ?? round.shown[0];
}

/** Stars are a record only: 0–2 wrong tries → 3, up to 5 → 2, otherwise 1. Never from time, never from slow mode. */
export const starsOf = (misses: number) => starsFor(misses, 2, 5, true);

/** For each shown spot, the piece whose colour tints it: twins take the spots of their kind in order. */
export function spotPieces(round: Round): number[] {
  const waiting = round.pieces.filter(piece => !piece.done), taken = new Map<Kind, number>();
  return round.shown.map(pose => {
    const nth = taken.get(pose.kind) ?? 0;
    taken.set(pose.kind, nth + 1);
    return (waiting.filter(piece => piece.kind === pose.kind)[nth] ?? waiting.find(piece => piece.kind === pose.kind) ?? round.pieces.find(piece => piece.kind === pose.kind)!).id;
  });
}

export type Result = { level: number; figure: string; stars: number; placed: number; misses: number; turned: number };
export const resultOf = (round: Round): Result => ({ level: round.level, figure: round.figure.id, stars: starsOf(round.misses), placed: round.placedByChild, misses: round.misses, turned: round.turned });
