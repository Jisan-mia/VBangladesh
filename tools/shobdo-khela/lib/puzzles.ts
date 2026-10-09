export const puzzles = [
  { id: 'book-fair', clue: 'যেখানে অনেক প্রকাশকের বই একসঙ্গে দেখা ও কেনা যায়।', parts: ['বই', 'মে', 'লা'] },
  { id: 'hand-fan', clue: 'বিদ্যুৎ ছাড়াই হাতে নেড়ে বাতাস করার জিনিস।', parts: ['হাত', 'পা', 'খা'] },
  { id: 'firefly', clue: 'অন্ধকারে ছোট্ট আলো জ্বেলে উড়ে বেড়ায় যে পোকা।', parts: ['জো', 'না', 'কি'] },
  { id: 'kitchen', clue: 'ঘরের যে জায়গায় রান্না হয়।', parts: ['রান্না', 'ঘর'] },
  { id: 'rainbow', clue: 'বৃষ্টির পরে আকাশে বাঁকা হয়ে ওঠা রঙের সারি।', parts: ['রং', 'ধ', 'নু'] },
  { id: 'rail-car', clue: 'লোহার লাইনের ওপর দিয়ে চলে, একটার সঙ্গে আরেকটা বগি জোড়া থাকে।', parts: ['রেল', 'গা', 'ড়ি'] },
  { id: 'watercolor', clue: 'পানিতে মিশিয়ে কাগজে আঁকার এক ধরনের রং।', parts: ['জল', 'রং'] },
  { id: 'butterfly', clue: 'রঙিন ডানা মেলে ফুলের কাছে উড়তে দেখা যায়।', parts: ['প্র', 'জা', 'প', 'তি'] },
  { id: 'mango-tree', clue: 'যে গাছের ডালে আম ধরে।', parts: ['আম', 'গাছ'] },
  { id: 'swing', clue: 'বসে সামনে-পেছনে দুলতে ভালো লাগে যে খেলনায়।', parts: ['দোল', 'না'] },
  { id: 'embroidered-quilt', clue: 'সেলাইয়ের নকশা দিয়ে সাজানো কাঁথা।', parts: ['নকশি', 'কাঁ', 'থা'] },
  { id: 'kite', clue: 'সুতোর টানে আকাশে ওড়ানো কাগজের খেলনা।', parts: ['ঘু', 'ড়ি'] },
] as const;
export type Outcome = 'playing' | 'solved' | 'revealed' | 'skipped';
export type Round = { picked: number[]; attempts: number; outcome: Outcome };
export type Game = { index: number; rounds: Round[] };

export function newGame(): Game {
  return { index: 0, rounds: puzzles.map(() => ({ picked: [], attempts: 0, outcome: 'playing' })) };
}

export function tileOrder(index: number): number[] {
  const length = puzzles[index].parts.length;
  const offset = index % (length - 1) + 1;
  return Array.from({ length }, (_, position) => (position + offset) % length);
}

function changeRound(game: Game, round: Round): Game {
  return { ...game, rounds: game.rounds.map((current, index) => index === game.index ? round : current) };
}

export function pickTile(game: Game, tile: number): Game {
  const puzzle = puzzles[game.index];
  const round = game.rounds[game.index];
  if (!puzzle || round.outcome !== 'playing' || !Number.isInteger(tile) || tile < 0 || tile >= puzzle.parts.length || round.picked.includes(tile)) return game;
  return changeRound(game, { ...round, picked: [...round.picked, tile] });
}

export function removeLast(game: Game): Game {
  const round = game.rounds[game.index];
  if (!round || round.outcome !== 'playing' || !round.picked.length) return game;
  return changeRound(game, { ...round, picked: round.picked.slice(0, -1) });
}

export function answerState(game: Game): 'incomplete' | 'correct' | 'incorrect' {
  const puzzle = puzzles[game.index];
  const round = game.rounds[game.index];
  if (!puzzle || round.picked.length !== puzzle.parts.length) return 'incomplete';
  return round.picked.map(index => puzzle.parts[index]).join('') === puzzle.parts.join('') ? 'correct' : 'incorrect';
}

export function checkAnswer(game: Game): Game {
  const round = game.rounds[game.index];
  if (!round || round.outcome !== 'playing' || answerState(game) === 'incomplete') return game;
  return changeRound(game, { ...round, attempts: round.attempts + 1, outcome: answerState(game) === 'correct' ? 'solved' : 'playing' });
}

export function revealAnswer(game: Game): Game {
  const round = game.rounds[game.index];
  if (!round || round.outcome !== 'playing') return game;
  return changeRound(game, { ...round, picked: puzzles[game.index].parts.map((_, index) => index), outcome: 'revealed' });
}

export function nextPuzzle(game: Game): Game {
  const round = game.rounds[game.index];
  if (!round) return game;
  const current = round.outcome === 'playing' ? changeRound(game, { ...round, outcome: 'skipped' }) : game;
  return { ...current, index: game.index + 1 };
}

export function score(game: Game) {
  return { solved: game.rounds.filter(round => round.outcome === 'solved').length, revealed: game.rounds.filter(round => round.outcome === 'revealed').length, skipped: game.rounds.filter(round => round.outcome === 'skipped').length };
}

export function resultText(game: Game): string {
  const number = new Intl.NumberFormat('bn-BD');
  const result = score(game);
  const labels = { solved: 'নিজে মিলিয়েছি', revealed: 'উত্তর দেখেছি', skipped: 'বাদ দিয়েছি', playing: 'এখনো শেষ করিনি' };
  return ['শব্দ সাজাই · একটুখানি', `${number.format(puzzles.length)}টি ধাঁধার মধ্যে নিজে মিলিয়েছি ${number.format(result.solved)}টি।`, `উত্তর দেখেছি ${number.format(result.revealed)}টি · বাদ দিয়েছি ${number.format(result.skipped)}টি`, '', ...game.rounds.map((round, index) => `ধাঁধা ${number.format(index + 1)}: ${labels[round.outcome]}${round.attempts ? ` · মিলিয়ে দেখেছি ${number.format(round.attempts)} বার` : ''}`), '', 'নিজের সময় নিয়ে শব্দ সাজানোর খেলা। কোনো সময়সীমা নেই।'].join('\n');
}
