// Links, banners and lines for পাকা-কাঁচা. Server-safe (share.ts imports it). A link never carries guessed digits.
import { possessive } from '../../../shared/bangla';
import { challengeHash, cleanName, readChallenge } from '../../../shared/game-core';
import { TRIES, asciiDigits, bn, bnDate, clampDate, codeOf, finished, isCode, isDate, parseRows, possibleRow, rowsText, solved, type Mark, type Puzzle } from './game';

export type Shared = { puzzle: Puzzle; rows: Mark[][]; name: string };

/**
 * `d` a day's code · `s` + `t` a seeded code (t = tries, the number to beat) · `c` a friend's code, in plain digits (not secret).
 * `r` the mangoes only, four letters per try · `n` an optional first name.
 */
export function shareHash({ puzzle, rows, name }: Shared) {
  const r = rows.length ? { r: rowsText(rows) } : undefined;
  if (puzzle.kind === 'seed') return challengeHash({ seed: puzzle.seed, target: rows.length, name, extra: r });
  const params = new URLSearchParams(puzzle.kind === 'day' ? { d: puzzle.date, ...r } : { c: puzzle.code, ...r });
  const clean = cleanName(name);
  if (clean) params.set('n', clean);
  return params.toString();
}

/** Reads a link and re-checks it: a finished game, and every row of mangoes possible for that code. `today` clamps future dates. */
export function parseShare(hash: string, today: string): Shared | null {
  if (hash.length > 600) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const rowText = params.get('r');
  const rows = rowText === null ? [] : parseRows(rowText);
  if (!rows) return null;
  let puzzle: Puzzle;
  const date = params.get('d'), code = params.get('c');
  if (date !== null) {
    if (!isDate(date)) return null;
    puzzle = { kind: 'day', date: clampDate(date, today) };
  } else if (code !== null) {
    const digits = asciiDigits(code);
    if (!isCode(digits)) return null;
    puzzle = { kind: 'code', code: digits };
  } else {
    const challenge = readChallenge(hash, { maxTarget: TRIES, extraKeys: ['r'] });
    if (!challenge || challenge.target !== rows.length) return null;
    puzzle = { kind: 'seed', seed: challenge.seed };
  }
  // Only a friend's code may come without a result: that's the invitation itself.
  if (!rows.length && puzzle.kind !== 'code') return null;
  if (rows.length && !finished(rows)) return null;
  const answer = codeOf(puzzle);
  if (!rows.every(row => possibleRow(answer, row))) return null;
  return { puzzle, rows, name: cleanName(params.get('n') ?? '') };
}

/** "আজকের কোড", "১০ অক্টোবরের কোড", "নতুন কোড" or "বন্ধুর কোড": what the board and the card call this puzzle. */
export function puzzleLabel(puzzle: Puzzle, today: string) {
  if (puzzle.kind === 'day') return puzzle.date === today ? 'আজকের কোড' : `${possessive(bnDate(puzzle.date))} কোড`;
  return puzzle.kind === 'seed' ? 'নতুন কোড' : 'বন্ধুর কোড';
}

export const tryCount = (rows: readonly Mark[][]) => solved(rows) ? `${bn(rows.length)}/${bn(TRIES)}` : 'এবার হয়নি';

/** On the page (`today` known) the code is right there: "এই কোডটা". In a preview it's "একটা কোড". */
function what(puzzle: Puzzle, today?: string) {
  if (puzzle.kind === 'day') return puzzle.date === today ? 'আজকের কোড' : `${possessive(bnDate(puzzle.date))} কোড`;
  return puzzle.kind === 'seed' && !today ? 'একটা কোড' : 'এই কোডটা';
}

/** Link preview title. No `today`: the preview is read later, so a day is named by its date. */
export function previewTitle({ puzzle, rows, name }: Shared) {
  const who = name || 'এক বন্ধু';
  if (!rows.length) return `${who} তোমার জন্য একটা কোড রেখেছে। ৭ বারে ধরতে পারবে?`;
  return solved(rows) ? `${who} ${what(puzzle)} ${bn(rows.length)} বারে ধরেছে। তুমি কয়বারে পারবে?` : `${who} ${what(puzzle)} ৭ বারেও ধরতে পারেনি। তুমি পারবে?`;
}

/** The banner when a friend's link opens. */
export function friendBanner({ puzzle, rows, name }: Shared, today: string) {
  const who = name || 'এক বন্ধু';
  if (!rows.length) return { title: `${who} তোমার জন্য একটা কোড রেখেছে`, sub: 'কোডটা লিংকের মধ্যেই লেখা, তাই এটা গোপন না। লিংকে উঁকি না দিয়ে খেলো!' };
  const past = puzzle.kind === 'day' && puzzle.date !== today;
  const title = solved(rows) ? `${who} ${what(puzzle, today)} ${bn(rows.length)} বারে ধরে${past ? 'ছিল' : 'ছে'}।` : `${who} ${what(puzzle, today)} ৭ বারেও ধরতে পারেনি।`;
  return { title, sub: puzzle.kind === 'code' ? 'একই কোড, এবার তোমার পালা। কোডটা লিংকেই লেখা, তাই উঁকি দিয়ো না!' : 'একই কোড, এবার তোমার পালা।' };
}

/** A kind comparison once you finish the same puzzle a friend sent. */
export function versusLine(mine: readonly Mark[][], theirs: readonly Mark[][], name: string) {
  if (!theirs.length) return '';
  const who = name || 'বন্ধু', me = solved(mine) ? mine.length : 0, them = solved(theirs) ? theirs.length : 0;
  if (!me && !them) return 'এই কোডটা দুজনকেই খুব ঘুরিয়েছে!';
  if (!them) return `${who} পারেনি, তুমি পেরেছ!`;
  if (!me) return `${who} ${bn(them)} বারে পেরেছিল। পরেরটায় দেখিয়ে দাও!`;
  if (me < them) return `${possessive(who)} চেয়ে ${bn(them - me)} বার কম লাগল!`;
  if (me === them) return `${possessive(who)} সমান, দুজনেই ${bn(me)} বারে!`;
  return me - them === 1 ? `আর একটু হলেই! ${possessive(who)} লেগেছিল ${bn(them)} বার।` : `${who} এবার এগিয়ে, ${bn(them)} বারে পেরেছিল। আরেকবার হোক?`;
}

export function caption({ puzzle, rows }: Shared, today: string) {
  if (!rows.length) return 'তোমার জন্য একটা ৪ অঙ্কের কোড রেখেছি। ৭ বারে ধরতে পারবে?';
  const label = puzzleLabel(puzzle, today);
  return solved(rows) ? `পাকা-কাঁচা: ${label} ${bn(rows.length)} বারে ধরেছি! তুমি কয়বারে পারবে?` : `পাকা-কাঁচা: ${label} ৭ বারেও ধরতে পারিনি। তুমি পারবে?`;
}
