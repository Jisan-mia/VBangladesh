// Links, banners and every line of result text for পাকা-কাঁচা. Server-safe: share.ts loads this, so it reaches only game-core
// and lib/. A link never carries guessed digits.
import { possessive } from '../../../shared/bangla';
import { challengeHash, cleanName, readChallenge } from '../../../shared/game-core';
import { isOldLevel } from './legacy';
import { LEVEL_COUNT, PER_WORLD, WORLDS, isFinale, isLevel, levelName, levelOf, worldOf } from './levels';
import { codeOf, rulesOf, starsOf, triesToNextStar } from './play';
import {
  TRIES, asciiDigits, bn, bnDate, clampDate, finished, isCode, isDate, parseRows, poolOf, rowsText, solved, type Mark, type Puzzle,
} from './rules';
import { possibleRow } from './solver';

export type Shared = { puzzle: Puzzle; rows: Mark[][]; name: string };

/**
 * `d` a day's code · `s` + `t` a seeded code (t = tries, the number to beat) · `c` a friend's code, in plain digits (not secret).
 * `l` + `s` + `t` a level's seeded code, with `v=2` for the ladder since the rewrite; without `v` it names a level of the old
 * ladder (lib/legacy.ts). `r` the mangoes only, four letters per try · `n` an optional first name.
 */
export function shareHash({ puzzle, rows, name }: Shared) {
  const r = rows.length ? { r: rowsText(rows) } : undefined;
  if (puzzle.kind === 'seed') return challengeHash({ seed: puzzle.seed, target: rows.length, name, extra: r });
  if (puzzle.kind === 'level') return challengeHash({ seed: puzzle.seed, target: rows.length, name, extra: { l: puzzle.level, ...r, ...(puzzle.legacy ? {} : { v: 2 }) } });
  const params = new URLSearchParams(puzzle.kind === 'day' ? { d: puzzle.date, ...r } : { c: puzzle.code, ...r });
  const clean = cleanName(name);
  if (clean) params.set('n', clean);
  return params.toString();
}

/** Reads a link and re-checks it: a finished game, and every row of mangoes possible for that code under that level's rules. */
export function parseShare(hash: string, today: string): Shared | null {
  if (hash.length > 600) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const rowText = params.get('r');
  const rows = rowText === null ? [] : parseRows(rowText);
  if (!rows) return null;
  let puzzle: Puzzle;
  const date = params.get('d'), code = params.get('c'), level = params.get('l'), version = params.get('v');
  if (version !== null && (version !== '2' || level === null)) return null;
  if (level !== null) {
    const challenge = readChallenge(hash, { maxTarget: TRIES, extraKeys: ['r'] });
    const legacy = version === null, number = /^\d{1,2}$/.test(level) ? Number(level) : 0;
    if (!challenge || !(legacy ? isOldLevel(number) : isLevel(number)) || challenge.target !== rows.length) return null;
    puzzle = { kind: 'level', level: number, seed: challenge.seed, ...(legacy ? { legacy: true } : {}) };
  } else if (date !== null) {
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
  const rules = rulesOf(puzzle);
  if (rows.length && !finished(rows, rules.tries)) return null;
  const answer = codeOf(puzzle), pool = poolOf(rules.digits);
  if (!rows.every(row => possibleRow(answer, row, pool, rules.repeat, rules.feedback))) return null;
  return { puzzle, rows, name: cleanName(params.get('n') ?? '') };
}

// ---- names ----

/** "আজকের কোড", "১০ অক্টোবরের কোড", "লেভেল ৭", "নতুন কোড" or "বন্ধুর কোড": what the board and the card call this puzzle. */
export function puzzleLabel(puzzle: Puzzle, today: string) {
  if (puzzle.kind === 'level') return puzzle.legacy ? `পুরোনো লেভেল ${bn(puzzle.level)}` : `লেভেল ${bn(puzzle.level)}`;
  if (puzzle.kind === 'day') return puzzle.date === today ? 'আজকের কোড' : `${possessive(bnDate(puzzle.date))} কোড`;
  return puzzle.kind === 'seed' ? 'নতুন কোড' : 'বন্ধুর কোড';
}
/** The HUD badge: a main line and a smaller one under it. */
export function badge(puzzle: Puzzle, today: string) {
  if (puzzle.kind === 'level' && puzzle.legacy) return { main: 'বন্ধুর কোড', sub: `পুরোনো লেভেল ${bn(puzzle.level)}` };
  if (puzzle.kind === 'level') return { main: isFinale(puzzle.level) ? levelName(puzzle.level) : `লেভেল ${bn(puzzle.level)}`, sub: WORLDS[worldOf(puzzle.level) - 1].name };
  return { main: puzzleLabel(puzzle, today), sub: puzzle.kind === 'day' ? bnDate(puzzle.date) : '১০টা অঙ্ক' };
}

export const tryCount = (rows: readonly Mark[][], tries = TRIES) => solved(rows) ? `${bn(rows.length)}/${bn(tries)}` : 'এবার হয়নি';

/** On the page (`today` known) the code is right there: "এই কোডটা". In a preview it's "একটা কোড". */
function what(puzzle: Puzzle, today?: string) {
  if (puzzle.kind === 'level') return `${puzzle.legacy ? 'পুরোনো ' : ''}লেভেল ${bn(puzzle.level)}-এর কোড`;
  if (puzzle.kind === 'day') return puzzle.date === today ? 'আজকের কোড' : `${possessive(bnDate(puzzle.date))} কোড`;
  return puzzle.kind === 'seed' && !today ? 'একটা কোড' : 'এই কোডটা';
}

/** Link preview title. No `today`: the preview is read later, so a day is named by its date. */
export function previewTitle({ puzzle, rows, name }: Shared) {
  const who = name || 'এক বন্ধু';
  if (!rows.length) return `${who} তোমার জন্য একটা কোড রেখেছে। ৭ বারে ধরতে পারবে?`;
  return solved(rows) ? `${who} ${what(puzzle)} ${bn(rows.length)} বারে ধরেছে। তুমি কয়বারে পারবে?` : `${who} ${what(puzzle)} ${bn(rulesOf(puzzle).tries)} বারেও ধরতে পারেনি। তুমি পারবে?`;
}

/** The banner when a friend's link opens. */
export function friendBanner({ puzzle, rows, name }: Shared, today: string) {
  const who = name || 'এক বন্ধু';
  if (!rows.length) return { title: `${who} তোমার জন্য একটা কোড রেখেছে`, sub: 'কোডটা লিংকের মধ্যেই লেখা, তাই এটা গোপন না। লিংকে উঁকি না দিয়ে খেলো!' };
  const past = puzzle.kind === 'day' && puzzle.date !== today;
  const title = solved(rows) ? `${who} ${what(puzzle, today)} ${bn(rows.length)} বারে ধরে${past ? 'ছিল' : 'ছে'}।` : `${who} ${what(puzzle, today)} ${bn(rulesOf(puzzle).tries)} বারেও ধরতে পারেনি।`;
  return { title, sub: 'একই কোড, এবার তোমার পালা।' };
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
  const label = puzzle.kind === 'level' && isFinale(puzzle.level) && !puzzle.legacy ? `${levelName(puzzle.level)}, লেভেল ${bn(puzzle.level)}` : puzzleLabel(puzzle, today);
  const tries = rulesOf(puzzle).tries;
  return solved(rows) ? `পাকা-কাঁচা, ${label}: কোডটা ${bn(rows.length)} বারে ধরেছি! তুমি কয়বারে পারবে?` : `পাকা-কাঁচা, ${label}: ${bn(tries)} বারেও কোডটা ধরতে পারিনি। তুমি পারবে?`;
}

// ---- the result ----

const CLEAR_LINES = [
  ['উঠানের আম গোনা শেষ। নানা চশমা খুঁজছেন।', 'কোড মিলল। বারান্দায় রোদ পড়ে এল।', 'পাকা আমের গন্ধ উঠান ছাড়িয়ে গেল।'],
  ['এক গাছ শেষ। মালি পাশের গাছটা দেখাচ্ছে।', 'জোড়া অঙ্ক ধরা পড়ল। ডালে দুটো আম ঝুলছিল।', 'ছায়ায় বসে কোডটা মিলিয়ে ফেললে।'],
  ['ঝুড়ির হিসাব মিলল। আড়তদার ভুরু তুলল।', 'আম না দেখেই কোড বের করলে। পাইকার মাথা চুলকাচ্ছে।', 'দাঁড়িপাল্লা সমান। হাটে সবাই তাকিয়ে।'],
] as const;
const FINALE_CLEAR = [
  'সিন্দুক খুলল। ভেতরে আমসত্ত্ব, আর নানার চিরকুট: ‘পাকা হাত।’',
  'গুদামের তালা খুলল। মালি চা নিয়ে এসে দাঁড়িয়েছে।',
  'আড়তের বড় তালা খুলল। হাট ভাঙল তোমার হাতে।',
] as const;
const FINALE_MISS = [
  'সিন্দুকটা আজ টিকে গেল। নানা হলে বলতেন, আরেকবার।',
  'গুদামের তালা আজ নড়ল না। মালি মুচকি হাসছে।',
  'বড় তালা আজ জিতল। কাল হাট আবার বসবে।',
] as const;

/** The level-clear line: one picture from the level's world; on a finale, the named lock opens (or holds). */
export function clearLine(level: number, won: boolean) {
  const world = worldOf(level) - 1;
  if (isFinale(level)) return won ? FINALE_CLEAR[world] : FINALE_MISS[world];
  return won ? CLEAR_LINES[world][(level - 1) % 3] : 'কোডটা দেখে নাও। পরেরবার অন্য কোড, একই নিয়ম।';
}

/** The end screen's title. */
export function finishTitle(puzzle: Puzzle, rows: readonly Mark[][], firstClear: boolean) {
  const won = solved(rows);
  if (puzzle.kind === 'level' && !puzzle.legacy && isFinale(puzzle.level)) {
    if (won) return firstClear ? `${levelName(puzzle.level)} খুলল!` : `${bn(rows.length)} বারে ${levelName(puzzle.level)} খুলল`;
    return `${levelName(puzzle.level)} টিকে গেল`;
  }
  return won ? `${bn(rows.length)} বারে ধরে ফেলেছ!` : 'এবার হলো না';
}

/** The near-miss line, in exact numbers. Empty at three stars, and off the ladder. */
export function nearMiss(puzzle: Puzzle, rows: readonly Mark[][]) {
  const stars = starsOf(puzzle, rows), fewer = triesToNextStar(puzzle, rows);
  if (solved(rows)) return fewer ? `আর ${bn(fewer)} বার কম লাগলে ${bn(stars + 1)} তারা।` : '';
  const closest = rows.reduce((top, row) => Math.max(top, row.filter(mark => mark === 'p').length), 0);
  return closest ? `সবচেয়ে কাছে: এক চেষ্টায় ${bn(closest)}টা পাকা।` : '';
}

/** On a world's finale: the world's stars. On the last one: the whole ladder's. */
export function worldLine(level: number, stars: Record<number, number>) {
  if (!isFinale(level)) return '';
  const world = worldOf(level), from = (world - 1) * PER_WORLD + 1;
  let got = 0;
  for (let at = from; at < from + PER_WORLD; at++) got += stars[at] ?? 0;
  const line = `${WORLDS[world - 1].name}: ★ ${bn(got)}/${bn(PER_WORLD * 3)}।`;
  if (world < WORLDS.length) return line;
  const all = Object.values(stars).reduce((sum, earned) => sum + earned, 0);
  return `${line} ১৮টা লেভেলে মোট ★ ${bn(all)}/${bn(LEVEL_COUNT * 3)}।`;
}

/** What the next level changes, for the line under the result. */
export function nextLine(level: number) {
  const info = levelOf(level);
  if (!info) return '';
  return `${isFinale(level) ? `${info.finale}: ` : `লেভেল ${bn(level)}: `}${info.line}`;
}
