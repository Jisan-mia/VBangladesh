export const puzzles = [
  { id: 'book-fair', clue: 'ফেব্রুয়ারি এলেই যেখানে নতুন বইয়ের গন্ধ আর মানুষের ভিড়।', parts: ['বই', 'মে', 'লা'] },
  { id: 'hand-fan', clue: 'কারেন্ট গেলে গরমে যেটা নেড়ে বাতাস খাই।', parts: ['হাত', 'পা', 'খা'] },
  { id: 'firefly', clue: 'অন্ধকারে মিটিমিটি আলো জ্বেলে উড়ে বেড়ায় যে পোকা।', parts: ['জো', 'না', 'কি'] },
  { id: 'kitchen', clue: 'বাড়ির যে ঘর থেকে ভাত-তরকারির ঘ্রাণ ভেসে আসে।', parts: ['রান্না', 'ঘর'] },
  { id: 'rainbow', clue: 'বৃষ্টি থামলে আকাশজুড়ে বাঁকা হয়ে ওঠা সাত রং।', parts: ['রং', 'ধ', 'নু'] },
  { id: 'rail-car', clue: 'ঝিকঝিক শব্দে লোহার লাইন ধরে চলে, পেছনে বগির পর বগি।', parts: ['রেল', 'গা', 'ড়ি'] },
  { id: 'watercolor', clue: 'পানিতে গুলে তুলি দিয়ে কাগজে আঁকার রং।', parts: ['জল', 'রং'] },
  { id: 'butterfly', clue: 'রঙিন ডানা মেলে ফুলে ফুলে উড়ে বেড়ায়।', parts: ['প্র', 'জা', 'প', 'তি'] },
  { id: 'mango-tree', clue: 'কালবৈশাখী থামলেই যে গাছের তলায় কুড়াতে ছুটে যেতাম।', parts: ['আম', 'গাছ'] },
  { id: 'swing', clue: 'গাছের ডালে দড়ি বেঁধে বানানো, বসে সামনে-পেছনে দোলা যায়।', parts: ['দোল', 'না'] },
  { id: 'embroidered-quilt', clue: 'নানি-দাদির সুঁই-সুতায় ফুল-পাখি ফোটানো কাঁথা।', parts: ['নকশি', 'কাঁ', 'থা'] },
  { id: 'kite', clue: 'নাটাই হাতে ছাদে উঠে যেটা আকাশে ওড়াই।', parts: ['ঘু', 'ড়ি'] },
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
  return ['শব্দ সাজাই · একটুখানি', `${number.format(puzzles.length)}টা ধাঁধার মধ্যে নিজে মিলিয়েছি ${number.format(result.solved)}টা!`, `উত্তর দেখেছি ${number.format(result.revealed)}টা · বাদ দিয়েছি ${number.format(result.skipped)}টা`, '', ...game.rounds.map((round, index) => `ধাঁধা ${number.format(index + 1)}: ${labels[round.outcome]}${round.attempts ? ` · মিলিয়ে দেখেছি ${number.format(round.attempts)} বার` : ''}`), '', 'চেনা বাংলা শব্দ নিয়ে খেলা, ঘড়ি নেই। তুমি কয়টা পারো?'].join('\n');
}
