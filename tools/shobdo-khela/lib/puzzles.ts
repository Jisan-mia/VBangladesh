import { bank, type Puzzle, type PuzzleId } from './bank';

export { bank, type Puzzle, type PuzzleId };

export type Outcome = 'playing' | 'solved' | 'revealed' | 'skipped';
/** picked holds tile indexes in the order they were placed; with a hint, tile 0 sits first and stays. */
export type Round = { picked: number[]; attempts: number; hint: boolean; outcome: Outcome };
export type Game = { date: string; ids: PuzzleId[]; index: number; rounds: Round[] };

const byId = new Map<string, Puzzle>(bank.map(puzzle => [puzzle.id, puzzle]));
export const puzzleById = (id: string) => byId.get(id);
export const answerOf = (puzzle: Puzzle) => puzzle.parts.join('');

// Small seeded helpers so every phone computes the same day's set and tile order without a server.
function hash(text: string) {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.codePointAt(0)!, 16777619);
  return value >>> 0;
}
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(items: readonly T[], seed: number): T[] {
  const next = random(seed), list = [...items];
  for (let index = list.length - 1; index > 0; index--) {
    const other = Math.floor(next() * (index + 1));
    [list[index], list[other]] = [list[other], list[index]];
  }
  return list;
}

/** Today's date in Bangladesh (YYYY-MM-DD): the puzzle changes at midnight Dhaka time for everyone, wherever their phone is set. */
export function dhakaDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function isDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const time = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === date && date >= '2026-01-01' && date <= '2099-12-31';
}

export const dayNumber = (date: string) => Math.round(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
export const shiftDate = (date: string, days: number) => new Date((dayNumber(date) + days) * 86_400_000).toISOString().slice(0, 10);

/** How each day is dealt: two 2-tile words, two 3-tile words, one 4-tile word, so every day warms up the same way. */
export const RECIPE = [{ tiles: 2, count: 2 }, { tiles: 3, count: 2 }, { tiles: 4, count: 1 }] as const;
export const PER_DAY = RECIPE.reduce((total, step) => total + step.count, 0);

/** Each size group is shuffled once per cycle and dealt out day by day, so a word only comes back after its whole group has been used. */
export function dailyIds(date: string): PuzzleId[] {
  const day = dayNumber(date);
  return RECIPE.flatMap(({ tiles, count }) => {
    const group = bank.filter(puzzle => puzzle.parts.length === tiles).map(puzzle => puzzle.id);
    const daysPerCycle = Math.floor(group.length / count);
    const order = shuffle(group, hash(`shobdojot:${tiles}:${Math.floor(day / daysPerCycle)}`));
    return order.slice((day % daysPerCycle) * count, (day % daysPerCycle) * count + count);
  });
}

/** The pool order for a puzzle: a fixed shuffle that never shows the answer already in place. */
export function tileOrder(id: string): number[] {
  const puzzle = byId.get(id);
  if (!puzzle) return [];
  const positions = puzzle.parts.map((_, index) => index);
  const order = shuffle(positions, hash(id));
  return order.every((tile, index) => tile === index) ? [...order.slice(1), order[0]] : order;
}

const freshRound = (): Round => ({ picked: [], attempts: 0, hint: false, outcome: 'playing' });

export function newGame(date: string): Game {
  const ids = dailyIds(date);
  return { date, ids, index: 0, rounds: ids.map(freshRound) };
}

export const currentPuzzle = (game: Game) => byId.get(game.ids[game.index] ?? '');
export const isFinished = (game: Game) => game.index >= game.ids.length;

function changeRound(game: Game, round: Round): Game {
  return { ...game, rounds: game.rounds.map((current, index) => index === game.index ? round : current) };
}

function playing(game: Game) {
  const puzzle = currentPuzzle(game);
  const round = game.rounds[game.index];
  return puzzle && round?.outcome === 'playing' ? { puzzle, round } : null;
}

export function pickTile(game: Game, tile: number): Game {
  const current = playing(game);
  if (!current || !Number.isInteger(tile) || tile < 0 || tile >= current.puzzle.parts.length || current.round.picked.includes(tile)) return game;
  return changeRound(game, { ...current.round, picked: [...current.round.picked, tile] });
}

/** Sends a placed tile back to the pool. The hinted first tile stays put. */
export function removeTile(game: Game, position: number): Game {
  const current = playing(game);
  if (!current || position < (current.round.hint ? 1 : 0) || position >= current.round.picked.length) return game;
  return changeRound(game, { ...current.round, picked: current.round.picked.filter((_, index) => index !== position) });
}

export const removeLast = (game: Game) => removeTile(game, (game.rounds[game.index]?.picked.length ?? 0) - 1);

export function answerState(game: Game): 'incomplete' | 'correct' | 'incorrect' {
  const puzzle = currentPuzzle(game);
  const round = game.rounds[game.index];
  if (!puzzle || !round || round.picked.length !== puzzle.parts.length) return 'incomplete';
  return round.picked.map(index => puzzle.parts[index]).join('') === answerOf(puzzle) ? 'correct' : 'incorrect';
}

/** Checks a full row. A wrong try is counted and the tiles go back (the hint stays), so the next try is just more taps. */
export function checkAnswer(game: Game): Game {
  const current = playing(game);
  const state = answerState(game);
  if (!current || state === 'incomplete') return game;
  if (state === 'correct') return changeRound(game, { ...current.round, attempts: current.round.attempts + 1, outcome: 'solved' });
  return changeRound(game, { ...current.round, attempts: current.round.attempts + 1, picked: current.round.hint ? [0] : [] });
}

/** Places the first tile for you. Solving after this shows as a yellow square, not green. */
export function takeHint(game: Game): Game {
  const current = playing(game);
  if (!current || current.round.hint) return game;
  return changeRound(game, { ...current.round, hint: true, picked: [0] });
}

export function revealAnswer(game: Game): Game {
  const current = playing(game);
  if (!current) return game;
  return changeRound(game, { ...current.round, picked: current.puzzle.parts.map((_, index) => index), outcome: 'revealed' });
}

export function nextPuzzle(game: Game): Game {
  const round = game.rounds[game.index];
  if (!round) return game;
  const current = round.outcome === 'playing' ? changeRound(game, { ...round, outcome: 'skipped' }) : game;
  return { ...current, index: game.index + 1 };
}

export function score(game: Game) {
  const count = (test: (round: Round) => boolean) => game.rounds.filter(test).length;
  return {
    solved: count(round => round.outcome === 'solved'),
    hinted: count(round => round.outcome === 'solved' && round.hint),
    revealed: count(round => round.outcome === 'revealed'),
    skipped: count(round => round.outcome === 'skipped'),
  };
}

/** Rebuilds a saved game from this browser's storage; anything that doesn't fit today's set starts fresh. */
export function restoreGame(raw: unknown, date: string): Game {
  const fresh = newGame(date);
  if (!raw || typeof raw !== 'object') return fresh;
  const saved = raw as Partial<Game>;
  if (saved.date !== date || !Array.isArray(saved.ids) || saved.ids.join() !== fresh.ids.join() || !Array.isArray(saved.rounds) || saved.rounds.length !== fresh.ids.length) return fresh;
  const outcomes: Outcome[] = ['playing', 'solved', 'revealed', 'skipped'];
  const rounds = saved.rounds.map((round, index): Round | null => {
    const size = byId.get(fresh.ids[index])!.parts.length;
    if (!round || typeof round !== 'object' || !outcomes.includes(round.outcome) || typeof round.hint !== 'boolean') return null;
    if (!Number.isInteger(round.attempts) || round.attempts < 0 || round.attempts > 999) return null;
    const picked = Array.isArray(round.picked) ? round.picked : [];
    if (picked.length > size || new Set(picked).size !== picked.length || !picked.every(tile => Number.isInteger(tile) && tile >= 0 && tile < size)) return null;
    if (round.hint && picked[0] !== 0) return null;
    return { picked: [...picked], attempts: round.attempts, hint: round.hint, outcome: round.outcome };
  });
  const index = Number.isInteger(saved.index) ? saved.index! : -1;
  if (rounds.some(round => !round) || index < 0 || index > fresh.ids.length) return fresh;
  return { ...fresh, index, rounds: rounds as Round[] };
}
