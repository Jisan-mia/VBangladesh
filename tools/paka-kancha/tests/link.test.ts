import assert from 'node:assert/strict';
import test from 'node:test';
import { challengeHash } from '../../../shared/game-core';
import { site } from '../content';
import { badge, caption, clearLine, finishTitle, friendBanner, nearMiss, nextLine, parseShare, previewTitle, puzzleLabel, shareHash, versusLine, worldLine } from '../lib/link';
import { codeOf, newGame, rowsFor, rulesOf } from '../lib/play';
import { TRIES, clampDate, codeFromSeed, dhakaDate, isDate, parseRows, rowsOf, rowsText, type Mark, type Puzzle } from '../lib/rules';
import { codesOf } from './bot';
import { levelOf } from '../lib/levels';
import { codeText } from '../lib/solver';
import { share } from '../share';

const TODAY = '2026-10-11';
const marks = (text: string) => [...text] as Mark[];

/** A careful player's tries for a puzzle: every guess fits the rows so far. */
function playOut(puzzle: Puzzle, opener?: string) {
  const rules = rulesOf(puzzle), code = codeOf(puzzle);
  const all = codesOf(rules).map(codeText);
  let candidates = all;
  const guesses: string[] = [];
  while (guesses.length < rules.tries) {
    const guess = guesses.length === 0 && opener ? opener : candidates[0];
    guesses.push(guess);
    if (guess === code) break;
    const row = rowsOf(code, [guess], rules)[0].join('');
    candidates = candidates.filter(candidate => rowsOf(candidate, [guess], rules)[0].join('') === row);
  }
  return guesses;
}
const rowsOfPlay = (puzzle: Puzzle, guesses: string[]) => rowsOf(codeOf(puzzle), guesses, rulesOf(puzzle));

test('dates: Dhaka midnight, real dates only, and a future date becomes today', () => {
  assert.equal(dhakaDate(new Date('2026-10-10T18:30:00Z')), '2026-10-11', 'half past midnight in Dhaka is already the next day');
  assert.equal(dhakaDate(new Date('2026-10-10T17:59:00Z')), '2026-10-10');
  assert.ok(isDate(TODAY));
  for (const bad of ['2026-02-30', '2026-1-1', '2025-12-31', 'today', '2026-10-11T00', '']) assert.ok(!isDate(bad), bad);
  assert.equal(clampDate('2026-12-01', TODAY), TODAY);
  assert.equal(clampDate('2026-10-01', TODAY), '2026-10-01');
});

test('rows: parse and print the mangoes, and a basket row is sorted', () => {
  assert.deepEqual(parseRows('pakkpppp'), [marks('pakk'), marks('pppp')]);
  assert.equal(parseRows('pak'), null);
  assert.equal(parseRows('pakx'), null);
  assert.equal(parseRows('pppp'.repeat(8)), null);
  assert.equal(rowsText([marks('pakk'), marks('pppp')]), 'pakkpppp');
});

test('links round-trip, carry no guessed digits, and are re-checked when opened', () => {
  const day: Puzzle = { kind: 'day', date: TODAY };
  const rows = rowsOfPlay(day, playOut(day));
  const hash = shareHash({ puzzle: day, rows, name: 'রাফি' });
  assert.deepEqual([...new URLSearchParams(hash).keys()], ['d', 'r', 'n']);
  assert.match(new URLSearchParams(hash).get('r')!, /^[pak]+$/, 'only mangoes, never digits');
  assert.deepEqual(parseShare(hash, TODAY), { puzzle: day, rows, name: 'রাফি' });

  const seeded: Puzzle = { kind: 'seed', seed: 777 };
  const seedRows = rowsOfPlay(seeded, playOut(seeded));
  const seedHash = shareHash({ puzzle: seeded, rows: seedRows, name: '' });
  assert.equal(seedHash, challengeHash({ seed: 777, target: seedRows.length, extra: { r: rowsText(seedRows) } }), 'the format before the rewrite');
  assert.deepEqual(parseShare(seedHash, TODAY)?.rows, seedRows);
  assert.equal(parseShare(seedHash.replace(/t=\d/, `t=${seedRows.length + 1}`), TODAY), null, 't must match the rows');

  const invite = shareHash({ puzzle: { kind: 'code', code: '0472' }, rows: [], name: 'রাফি' });
  assert.equal(invite, `c=0472&n=${encodeURIComponent('রাফি')}`);
  assert.deepEqual(parseShare(invite, TODAY), { puzzle: { kind: 'code', code: '0472' }, rows: [], name: 'রাফি' });
  assert.equal(parseShare('c=০৪৭২', TODAY)?.puzzle.kind, 'code', 'Bangla digits in a pasted link still work');
  assert.equal(friendBanner(parseShare(invite, TODAY)!, TODAY).title, 'রাফি তোমার জন্য একটা কোড রেখেছে');
  assert.match(friendBanner(parseShare(invite, TODAY)!, TODAY).sub, /গোপন না/);

  // A link dated in the future is read as today's code, and its mangoes are re-checked against that code.
  assert.deepEqual(parseShare(hash.replace(TODAY, '2027-01-01'), TODAY)?.puzzle, day);
});

test('level links: new ones carry v=2 and are checked by the level’s rules; old ones (no v) keep opening the old ladder', () => {
  const puzzle: Puzzle = { kind: 'level', level: 4, seed: 4242 };
  const rows = rowsOfPlay(puzzle, playOut(puzzle));
  const hash = shareHash({ puzzle, rows, name: 'রাফি' });
  assert.match(hash, /^s=4242&t=\d&l=4&r=[pak]+&v=2&n=/);
  assert.deepEqual(parseShare(hash, TODAY), { puzzle, rows, name: 'রাফি' });
  assert.equal(puzzleLabel(puzzle, TODAY), 'লেভেল ৪');
  assert.match(caption({ puzzle, rows, name: '' }, TODAY), new RegExp(`লেভেল ৪: কোডটা ${rows.length === 3 ? '৩' : '[০-৯]'} বারে`));

  // A link from before the rewrite: `l` with no `v`. It opens the old ladder's code with the old pad and tries.
  const old: Puzzle = { kind: 'level', level: 12, seed: 9001, legacy: true };
  const oldRows = rowsOfPlay(old, playOut(old));
  const oldHash = shareHash({ puzzle: old, rows: oldRows, name: '' });
  assert.ok(!oldHash.includes('v='), 'the old format has no v');
  assert.deepEqual(parseShare(oldHash, TODAY)?.puzzle, old);
  assert.equal(puzzleLabel(old, TODAY), 'পুরোনো লেভেল ১২');
  assert.deepEqual(rowsFor(newGame(old, playOut(old))), oldRows);

  // Level 7 hides a pair: a try of four different digits is fine, and the rows are rated by the pair level's rules.
  const pair: Puzzle = { kind: 'level', level: 7, seed: 31 };
  const pairRows = rowsOfPlay(pair, playOut(pair, '1234'));
  assert.deepEqual(parseShare(shareHash({ puzzle: pair, rows: pairRows, name: '' }), TODAY)?.rows, pairRows);
  // Level 13 shows only the basket: a row that names a place (an unsorted one) is refused.
  const basket: Puzzle = { kind: 'level', level: 13, seed: 5 };
  const basketRows = rowsOfPlay(basket, playOut(basket));
  assert.ok(basketRows.every(row => row.join('') === [...row].sort((a, b) => 'pak'.indexOf(a) - 'pak'.indexOf(b)).join('')));
  assert.deepEqual(parseShare(shareHash({ puzzle: basket, rows: basketRows, name: '' }), TODAY)?.rows, basketRows);
  assert.equal(parseShare(shareHash({ puzzle: basket, rows: [marks('kppp'), marks('pppp')], name: '' }), TODAY), null);
});

test('level links that could not happen are refused', () => {
  const puzzle: Puzzle = { kind: 'level', level: 1, seed: 5 };
  const code = codeOf(puzzle);
  // With ১–৪ on the pad every guess is a shuffle of the code: an all-কাঁচা row is impossible there.
  const fake = shareHash({ puzzle, rows: [marks('kkkk'), marks('pppp')], name: '' });
  assert.equal(parseShare(fake, TODAY), null);
  assert.ok(rowsOf(code, ['5678'], { ...rulesOf(puzzle), digits: 10 })[0].every(mark => mark === 'k'), 'possible with the full pad, so the level is what refuses it');
  const good = shareHash({ puzzle, rows: rowsOf(code, [code], rulesOf(puzzle)), name: '' });
  assert.ok(parseShare(good, TODAY));
  assert.equal(parseShare(good.replace('l=1', 'l=19'), TODAY), null, 'no level 19');
  assert.equal(parseShare(good.replace('l=1', 'l=0'), TODAY), null);
  assert.equal(parseShare(good.replace('l=1', 'l=x'), TODAY), null);
  assert.equal(parseShare(good.replace('t=1', 't=2'), TODAY), null, 'the try count must match the rows');
  assert.equal(parseShare(good.replace('v=2', 'v=3'), TODAY), null);
  assert.equal(parseShare(`d=${TODAY}&r=pppp&v=2`, TODAY), null, 'v belongs to a level link');
  // A lost level game has exactly that level's number of tries.
  const tries = levelOf(1)!.tries;
  const lost = Array(tries).fill(marks('akkk'));
  assert.equal(parseShare(shareHash({ puzzle, rows: lost.slice(1), name: '' }), TODAY), null, 'a loss one try short is not finished');
});

test('share normalize rejects hostile, impossible and oversized links', () => {
  const hostile = [
    '', 'junk', 'd=2026-10-11', 'd=2026-10-11&r=', 'd=2026-13-01&r=pppp', 'd=2026-10-11&r=pppa',
    'd=2026-10-11&r=pakk', 'd=2026-10-11&r=pppppakk', 'd=2026-10-11&r=PPPP', `d=2026-10-11&r=${'kkkk'.repeat(8)}`,
    'c=1123', 'c=12345', 'c=12a4', 'c=', 's=777&t=0', 's=0&t=1&r=pppp', 's=777&t=9&r=pppp', 's=777&t=2&r=pppp',
    's=5&t=1&r=pppp&l=40&v=2', 's=5&t=1&r=pppp&l=-1', `d=2026-10-11&r=pppp&n=${'x'.repeat(700)}`,
  ];
  for (const state of hostile) assert.equal(share.normalize(state), null, state);
  assert.equal(share.normalize(`d=${TODAY}&r=kakkpppaapkkpppp`), null, 'a row no real guess could give, hidden in the middle of a finished game');
  const day: Puzzle = { kind: 'day', date: TODAY };
  const real = shareHash({ puzzle: day, rows: rowsOfPlay(day, playOut(day)), name: '' });
  assert.ok(share.normalize(real), 'the same game without the impossible row is fine');
  const named = share.normalize(`c=4719&n=${encodeURIComponent('‮রাফি\u0007 আহমেদ  খান খান খান খান খান')}&x=evil`);
  assert.ok(named);
  const params = new URLSearchParams(named!);
  assert.deepEqual([...params.keys()], ['c', 'n'], 'unknown keys are dropped');
  const shown = params.get('n')!;
  assert.ok(shown.startsWith('রাফি আহমেদ খান') && [...shown].length <= 20 && !/[\u0000-\u001f‮]/.test(shown), 'control and direction characters removed, 20 characters at most');
});

test('previews, banners and comparisons are personal and kind', () => {
  const day: Puzzle = { kind: 'day', date: TODAY };
  const rows = rowsOfPlay(day, playOut(day));
  const state = share.normalize(shareHash({ puzzle: day, rows, name: 'রাফি' }))!;
  if (dhakaDate() >= TODAY) assert.match(share.preview(state).title, /^রাফি ১১ অক্টোবরের কোড .+ বারে ধরেছে। তুমি কয়বারে পারবে\?$/);
  assert.equal(previewTitle({ puzzle: { kind: 'code', code: '4719' }, rows: [], name: '' }), 'এক বন্ধু তোমার জন্য একটা কোড রেখেছে। ৭ বারে ধরতে পারবে?');
  assert.match(previewTitle({ puzzle: { kind: 'seed', seed: 5 }, rows: Array(TRIES).fill(marks('kkkk')), name: 'মিম' }), /ধরতে পারেনি/);
  assert.match(previewTitle({ puzzle: { kind: 'level', level: 12, seed: 5 }, rows: [], name: '' }), /একটা কোড রেখেছে/);
  assert.equal(share.preview('junk').title, 'পাকা-কাঁচা: লুকানো ৪ অঙ্কের কোড, ৭ বারে ধরতে পারবে?');
  assert.ok(!/\d|[০-৯]{4}/.test(share.preview(state).description), 'the description gives nothing away');
  const wonIn = (n: number) => [...Array(n - 1).fill(marks('kakk')), marks('pppp')];
  const lost = Array(TRIES).fill(marks('kakk'));
  assert.equal(versusLine(wonIn(3), wonIn(5), 'রাফি'), 'রাফির চেয়ে ২ বার কম লাগল!');
  assert.equal(versusLine(wonIn(4), wonIn(4), 'রাফি'), 'রাফির সমান, দুজনেই ৪ বারে!');
  assert.match(versusLine(wonIn(5), wonIn(4), 'রাফি'), /^আর একটু হলেই!/);
  assert.match(versusLine(wonIn(7), wonIn(3), 'রাফি'), /রাফি এবার এগিয়ে/);
  assert.equal(versusLine(wonIn(6), lost, 'রাফি'), 'রাফি পারেনি, তুমি পেরেছ!');
  assert.match(versusLine(lost, lost, ''), /দুজনকেই/);
  assert.equal(versusLine(wonIn(2), [], 'রাফি'), '');
  assert.deepEqual(badge({ kind: 'level', level: 6, seed: 1 }, TODAY), { main: 'নানার সিন্দুক', sub: 'উঠান' });
  assert.deepEqual(badge({ kind: 'level', level: 7, seed: 1 }, TODAY), { main: 'লেভেল ৭', sub: 'আমবাগান' });
  assert.equal(badge({ kind: 'level', level: 7, seed: 1, legacy: true }, TODAY).main, 'বন্ধুর কোড');
});

test('result lines: a world’s boss is named, a near miss is in exact tries, the world’s stars add up', () => {
  const lvl = (level: number): Puzzle => ({ kind: 'level', level, seed: 1 });
  const wonIn = (n: number) => [...Array(n - 1).fill(marks('kakk')), marks('pppp')];
  assert.equal(finishTitle(lvl(6), wonIn(4), true), 'নানার সিন্দুক খুলল!');
  assert.equal(finishTitle(lvl(6), wonIn(4), false), '৪ বারে নানার সিন্দুক খুলল');
  assert.equal(finishTitle(lvl(18), Array(6).fill(marks('kakk')), false), 'হাটের বড় তালা টিকে গেল');
  assert.equal(finishTitle(lvl(3), wonIn(3), true), '৩ বারে ধরে ফেলেছ!');
  assert.equal(finishTitle(lvl(3), Array(6).fill(marks('kakk')), false), 'এবার হলো না');
  assert.equal(nearMiss(lvl(9), wonIn(5)), 'আর ১ বার কম লাগলে ৩ তারা।');
  assert.equal(nearMiss(lvl(9), wonIn(3)), '');
  assert.equal(nearMiss(lvl(9), [marks('pakk')]), 'সবচেয়ে কাছে: এক চেষ্টায় ১টা পাকা।');
  assert.equal(nearMiss({ kind: 'day', date: TODAY }, wonIn(5)), '');
  assert.equal(worldLine(5, {}), '');
  assert.equal(worldLine(6, { 1: 3, 2: 2, 6: 3 }), 'উঠান: ★ ৮/১৮।');
  assert.match(worldLine(18, { 18: 3 }), /১৮টা লেভেলে মোট ★ ৩\/৫৪/);
  assert.notEqual(clearLine(6, true), clearLine(6, false));
  assert.ok(clearLine(2, true).length > 10 && clearLine(2, false).length > 10);
  assert.match(nextLine(7), /^লেভেল ৭: /);
  assert.match(nextLine(12), /^মালির গুদাম: /);
  assert.equal(nextLine(40), '');
  assert.equal(codeFromSeed(1).length, 4);
});

test('content meets the SEO limits, says what a link carries, and has enough questions', () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  assert.ok(site.title.startsWith('সংখ্যার ধাঁধা খেলা'));
  assert.ok(!/mastermind|wordle/i.test(JSON.stringify(site)), 'no trademark, not even in SEO text');
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.equal(site.description, site.description.normalize('NFC'));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6, 'at least six questions');
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length);
  assert.ok(site.steps.length >= 3 && site.privacy.some(line => line.includes('লিংক')));
  assert.ok(site.privacy.some(line => line.includes('গোপন না')), 'says plainly that a friend code is not secret');
  assert.ok(site.faq.some(item => item.question.includes('লেভেল') && item.answer.includes('১৮')), 'the level count is in the FAQ');
  assert.ok(site.faq.some(item => item.answer.includes('তারা')));
  assert.equal(site.slug, 'paka-kancha');
});
