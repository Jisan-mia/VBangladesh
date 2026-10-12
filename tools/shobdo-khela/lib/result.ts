import { isDate, puzzleById, shiftDate, type Game, type Round } from './puzzles';
import { possessive } from '../../../shared/bangla';

export const MAX_NAME_LENGTH = 30;
/** g: solved alone · h: solved with the hint · x: answer shown · s: skipped. Squares only, never the words. */
export type Mark = 'g' | 'h' | 'x' | 's';
export type Row = { mark: Mark; tiles: number };
export type Shared = { date: string; rows: Row[]; streak: number; name: string };
export type Streak = { last: string; count: number; best: number };

const numbers = new Intl.NumberFormat('bn-BD');
export const bn = (value: number) => numbers.format(value);

export function bnDate(date: string, long = false) {
  return new Intl.DateTimeFormat('bn-BD', long ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' } : { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}

export function cleanName(name: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the card text.
  return name.normalize('NFC').replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, '').trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH);
}


export function markOf(round: Round): Mark {
  if (round.outcome === 'solved') return round.hint ? 'h' : 'g';
  return round.outcome === 'revealed' ? 'x' : 's';
}

export function rowsOf(game: Game): Row[] {
  return game.rounds.map((round, index) => ({ mark: markOf(round), tiles: puzzleById(game.ids[index])?.parts.length ?? 3 }));
}

export const solvedCount = (rows: readonly Row[]) => rows.filter(row => row.mark === 'g' || row.mark === 'h').length;

export function shareHash({ date, rows, streak, name }: Shared) {
  const params = new URLSearchParams({ d: date, r: rows.map(row => row.mark + row.tiles).join('') });
  if (streak > 1) params.set('k', String(streak));
  const shown = cleanName(name);
  if (shown) params.set('n', shown);
  return '#' + params.toString();
}

export function parseShareHash(hash: string): Shared | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const date = params.get('d') ?? '';
  const code = params.get('r') ?? '';
  if (!isDate(date) || !/^([ghxs][2-6]){1,8}$/.test(code)) return null;
  const rows = [...code.matchAll(/([ghxs])([2-6])/g)].map(match => ({ mark: match[1] as Mark, tiles: Number(match[2]) }));
  const streak = Number(params.get('k') ?? 0);
  return { date, rows, streak: Number.isInteger(streak) && streak > 1 && streak < 10000 ? streak : 0, name: cleanName(params.get('n') ?? '') };
}

/** Days in a row with the day's set finished. Playing twice on one day changes nothing; missing a day starts again from one. */
export function nextStreak(previous: Streak | null, today: string): Streak {
  if (previous?.last === today) return previous;
  const count = previous && previous.last === shiftDate(today, -1) ? previous.count + 1 : 1;
  return { last: today, count, best: Math.max(count, previous?.best ?? 0) };
}

export function readStreak(raw: unknown): Streak | null {
  if (!raw || typeof raw !== 'object') return null;
  const { last, count, best } = raw as Partial<Streak>;
  return typeof last === 'string' && isDate(last) && Number.isInteger(count) && count! > 0 && Number.isInteger(best) && best! >= count! ? { last, count: count!, best: best! } : null;
}

/** The streak still standing today: finished yesterday or today keeps it, anything older has lapsed. */
export const liveStreak = (streak: Streak | null, today: string) => streak && (streak.last === today || streak.last === shiftDate(today, -1)) ? streak.count : 0;

export function humanLine(rows: readonly Row[]) {
  const solved = solvedCount(rows), total = rows.length;
  const clean = rows.every(row => row.mark === 'g');
  if (solved === total && clean) return 'একটাও হিন্ট লাগেনি। আজকের শব্দজট তোমার কাছে হার মেনেছে!';
  if (solved === total) return 'সবগুলো মিলেছে! হিন্ট একটু নিয়েছ, তাতে কী?';
  if (solved === total - 1) return 'একটা ফসকে গেছে, বাকিগুলো একদম ঝরঝরে।';
  if (solved * 2 >= total) return 'অর্ধেকের বেশি মিলেছে। কাল আরেকটা বেশি হবে।';
  if (solved > 0) return 'আজ শব্দগুলো একটু লুকোচুরি খেলেছে। কাল আবার দেখা হবে।';
  return 'আজকেরটা কঠিন ছিল। কাল নতুন পাঁচটা আসবে।';
}

const squares: Record<Mark, string> = { g: '🟩', h: '🟨', x: '⬜', s: '⬜' };

/** Post text: a spoiler-free grid like the card, the way people post daily puzzles. */
export function caption({ date, rows, streak }: Shared) {
  return [
    `আজকের শব্দজট · ${bnDate(date)}`,
    `${bn(rows.length)}টার মধ্যে ${bn(solvedCount(rows))}টা পেরেছি${streak > 1 ? ` · টানা ${bn(streak)} দিন` : ''}`,
    ...rows.map(row => (row.mark === 'h' ? squares.h + squares.g.repeat(row.tiles - 1) : squares[row.mark].repeat(row.tiles))),
    'তুমি কয়টা পারো?',
  ].join('\n');
}

export type CardContent = Shared & { solved: number; line: string; versus: string };

export function createCard(own: Shared, friend?: Shared | null): CardContent {
  const solved = solvedCount(own.rows);
  const versus = friend && friend.date === own.date ? `${friend.name || 'বন্ধু'} পেরেছে ${bn(solvedCount(friend.rows))}টা, আমি ${bn(solved)}টা` : '';
  return { ...own, name: cleanName(own.name), solved, line: humanLine(own.rows), versus };
}

/** What a friend's link says on the page: "রাফি আজ ৪/৫ পেরেছে". */
export function friendLine(friend: Shared, today: string) {
  const who = friend.name || 'তোমার বন্ধু';
  const score = `${bn(solvedCount(friend.rows))}/${bn(friend.rows.length)}`;
  return friend.date === today ? `${who} আজ ${score} পেরেছে` : `${who} ${possessive(bnDate(friend.date))} শব্দজটে ${score} পেরেছিল`;
}

export const answerFor = (game: Game, index: number) => puzzleById(game.ids[index])?.parts.join('') ?? '';

export { possessive };
