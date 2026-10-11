import assert from 'node:assert/strict';
import test from 'node:test';
import { challengeHash } from '../../../shared/game-core';
import { site } from '../content';
import { TRIES, allCodes, clampDate, codeFromSeed, codeOf, daySeed, dhakaDate, erase, finished, humanLine, isCode, isDate, isOver, keyHints, parseRows, possibleRow, rowsOf, rowsText, score, solved, submit, typeDigit, validGuesses, type Mark, type Play } from '../lib/game';
import { friendBanner, parseShare, previewTitle, shareHash, versusLine } from '../lib/result';
import { share } from '../share';

const TODAY = '2026-10-11';
const marks = (text: string) => [...text] as Mark[];

/** A careful player: always guesses a code that fits every mango seen so far. */
function playOut(code: string, opener = '0123') {
  let play: Play = { puzzle: { kind: 'code', code }, guesses: [], input: '' };
  let candidates = allCodes();
  while (!isOver(code, play.guesses)) {
    const guess = play.guesses.length ? candidates[0] : opener;
    for (const digit of guess) play = typeDigit(code, play, digit);
    play = submit(code, play);
    const row = score(code, guess).join('');
    candidates = candidates.filter(candidate => score(candidate, guess).join('') === row);
  }
  return play.guesses;
}

test('the same seed gives the same code on every phone; codes never repeat a digit', () => {
  assert.equal(codeFromSeed(48213), codeFromSeed(48213));
  assert.notEqual(codeFromSeed(1), codeFromSeed(2));
  const seen = new Set<string>(), firstDigit = new Array(10).fill(0);
  for (let seed = 1; seed <= 5000; seed++) {
    const code = codeFromSeed(seed);
    assert.ok(isCode(code), code);
    seen.add(code);
    firstDigit[Number(code[0])]++;
  }
  assert.ok(seen.size > 3000, 'codes spread over the 5,040 possible');
  for (const count of firstDigit) assert.ok(count > 380 && count < 620, `every digit leads about a tenth of the time (${firstDigit})`);
  assert.equal(codeOf({ kind: 'day', date: TODAY }), codeFromSeed(daySeed(TODAY)));
  assert.equal(daySeed(TODAY), 20261011);
  const week = ['2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15'].map(date => codeOf({ kind: 'day', date }));
  assert.ok(new Set(week).size >= 4, 'neighbouring days get different codes');
  assert.equal(codeOf({ kind: 'code', code: '0472' }), '0472');
});

test('scoring: পাকা in place, আধপাকা elsewhere, কাঁচা absent, and duplicates counted only once', () => {
  assert.deepEqual(score('5329', '5281'), marks('pakk'));
  assert.deepEqual(score('1234', '1234'), marks('pppp'));
  assert.deepEqual(score('1234', '4321'), marks('aaaa'));
  assert.deepEqual(score('1234', '5678'), marks('kkkk'));
  assert.deepEqual(score('0472', '7042'), marks('aaap'));
  // Duplicates (never in a real code or guess, but the scorer must still be honest):
  assert.deepEqual(score('1234', '1111'), marks('pkkk'), 'one 1 in the code earns one mango');
  assert.deepEqual(score('1123', '3111'), marks('apak'), 'two 1s in the code: one in place, one elsewhere, the third is কাঁচা');
  assert.deepEqual(score('1203', '2210'), marks('kpaa'), 'the code has one 2, already পাকা, so the other 2 stays কাঁচা');
  assert.deepEqual(score('2210', '1203'), marks('apak'));
});

test('rule edges: no repeated digit, four at most, nothing after the game ends', () => {
  const code = '4719';
  let play: Play = { puzzle: { kind: 'code', code }, guesses: [], input: '' };
  play = typeDigit(code, play, '4');
  assert.equal(typeDigit(code, play, '4'), play, 'the same digit twice is ignored');
  assert.equal(typeDigit(code, play, 'x'), play);
  for (const digit of '123') play = typeDigit(code, play, digit);
  assert.equal(play.input, '4123');
  assert.equal(typeDigit(code, play, '5'), play, 'a full try takes no fifth digit');
  const three = erase(play);
  assert.equal(submit(code, three), three, 'three digits cannot be checked');
  play = submit(code, play);
  assert.deepEqual(play.guesses, ['4123']);
  assert.equal(play.input, '');
  for (const digit of code) play = typeDigit(code, play, digit);
  play = submit(code, play);
  assert.ok(isOver(code, play.guesses) && solved(rowsOf(code, play.guesses)));
  assert.equal(typeDigit(code, play, '5'), play, 'typing after the win does nothing');
  assert.ok(validGuesses(code, ['1234', code]));
  assert.ok(!validGuesses(code, [code, '1234']), 'a saved game cannot go on after the win');
  assert.ok(!validGuesses(code, ['1123']));
  assert.ok(!validGuesses(code, Array(8).fill('1234')));
  assert.ok(isOver(code, Array(TRIES).fill('1234')));
  assert.deepEqual(keyHints('4719', ['4123', '9750']), { 4: 'p', 1: 'a', 2: 'k', 3: 'k', 9: 'a', 7: 'p', 5: 'k', 0: 'k' });
});

test('which rows are possible: three পাকা and one আধপাকা can never happen', () => {
  assert.ok(possibleRow('4719', marks('pppp')));
  assert.ok(possibleRow('4719', marks('kkkk')));
  assert.ok(possibleRow('4719', marks('aaaa')));
  assert.ok(possibleRow('4719', marks('ppak')));
  assert.ok(!possibleRow('4719', marks('pppa')));
  assert.ok(!possibleRow('4719', marks('appp')));
  assert.equal(allCodes().length, 5040);
  assert.deepEqual(parseRows('pakkpppp'), [marks('pakk'), marks('pppp')]);
  assert.equal(parseRows('pak'), null);
  assert.equal(parseRows('pakx'), null);
  assert.equal(parseRows('pppp'.repeat(8)), null);
  assert.equal(rowsText([marks('pakk'), marks('pppp')]), 'pakkpppp');
  assert.ok(finished([marks('pakk'), marks('pppp')]));
  assert.ok(!finished([marks('pakk')]), 'an unfinished game');
  assert.ok(!finished([marks('pppp'), marks('pakk')]), 'a win before the last row');
  assert.ok(finished(Array(TRIES).fill(marks('kkkk'))), 'seven misses is a finished game');
});

test('a headless run: a careful player always finishes, mostly well within seven', () => {
  let total = 0, wins = 0;
  const runs = 300;
  for (let seed = 1; seed <= runs; seed++) {
    const code = codeFromSeed(seed);
    const guesses = playOut(code);
    const rows = rowsOf(code, guesses);
    assert.ok(finished(rows), `seed ${seed} ends`);
    assert.ok(guesses.length >= 1 && guesses.length <= TRIES);
    if (solved(rows)) { wins++; total += guesses.length; }
  }
  const average = total / wins;
  assert.ok(wins >= runs * 0.97, `${wins}/${runs} solved`);
  assert.ok(average > 2.5 && average < 5.5, `average ${average.toFixed(2)} tries`);
});

test('the human line follows the number of tries', () => {
  const won = (tries: number) => [...Array(tries - 1).fill(marks('kakk')), marks('pppp')];
  assert.match(humanLine(won(1)), /প্রথম বারেই/);
  assert.match(humanLine(won(4)), /ঝরঝরে/);
  assert.match(humanLine(won(7)), /শেষ বারে/);
  assert.match(humanLine(Array(TRIES).fill(marks('kakk'))), /কাঁচাই/);
  for (let tries = 1; tries <= TRIES; tries++) assert.ok(humanLine(won(tries)).length > 10);
});

test('dates: Dhaka midnight, real dates only, and a future date becomes today', () => {
  assert.equal(dhakaDate(new Date('2026-10-10T18:30:00Z')), '2026-10-11', 'half past midnight in Dhaka is already the next day');
  assert.equal(dhakaDate(new Date('2026-10-10T17:59:00Z')), '2026-10-10');
  assert.ok(isDate(TODAY));
  for (const bad of ['2026-02-30', '2026-1-1', '2025-12-31', 'today', '2026-10-11T00', '']) assert.ok(!isDate(bad), bad);
  assert.equal(clampDate('2026-12-01', TODAY), TODAY);
  assert.equal(clampDate('2026-10-01', TODAY), '2026-10-01');
});

test('links round-trip, carry no guessed digits, and are re-checked when opened', () => {
  const code = codeOf({ kind: 'day', date: TODAY });
  const guesses = playOut(code);
  const rows = rowsOf(code, guesses);
  const day = shareHash({ puzzle: { kind: 'day', date: TODAY }, rows, name: 'রাফি' });
  assert.deepEqual([...new URLSearchParams(day).keys()], ['d', 'r', 'n']);
  assert.match(new URLSearchParams(day).get('r')!, /^[pak]+$/, 'only mangoes, never digits');
  assert.deepEqual(parseShare(day, TODAY), { puzzle: { kind: 'day', date: TODAY }, rows, name: 'রাফি' });

  const seedRows = rowsOf(codeFromSeed(777), playOut(codeFromSeed(777)));
  const seeded = shareHash({ puzzle: { kind: 'seed', seed: 777 }, rows: seedRows, name: '' });
  assert.equal(seeded, challengeHash({ seed: 777, target: seedRows.length, extra: { r: rowsText(seedRows) } }));
  assert.deepEqual(parseShare(seeded, TODAY)?.rows, seedRows);
  assert.equal(parseShare(seeded.replace(/t=\d/, `t=${seedRows.length + 1}`), TODAY), null, 't must match the rows');

  const invite = shareHash({ puzzle: { kind: 'code', code: '0472' }, rows: [], name: 'রাফি' });
  assert.equal(invite, `c=0472&n=${encodeURIComponent('রাফি')}`);
  assert.deepEqual(parseShare(invite, TODAY), { puzzle: { kind: 'code', code: '0472' }, rows: [], name: 'রাফি' });
  assert.equal(parseShare('c=০৪৭২', TODAY)?.puzzle.kind, 'code', 'Bangla digits in a pasted link still work');
  assert.equal(friendBanner(parseShare(invite, TODAY)!, TODAY).title, 'রাফি তোমার জন্য একটা কোড রেখেছে');
  assert.match(friendBanner(parseShare(invite, TODAY)!, TODAY).sub, /গোপন না/);

  // A link dated in the future is read as today's code, and its mangoes are re-checked against that code.
  assert.equal(parseShare(day.replace(TODAY, '2027-01-01'), TODAY)?.puzzle.kind, 'day');
  assert.deepEqual(parseShare(day.replace(TODAY, '2027-01-01'), TODAY)?.puzzle, { kind: 'day', date: TODAY });
});

test('share normalize rejects hostile, impossible and oversized links', () => {
  const hostile = [
    '', 'junk', 'd=2026-10-11', 'd=2026-10-11&r=', 'd=2026-13-01&r=pppp', 'd=2026-10-11&r=pppa',
    'd=2026-10-11&r=pakk', 'd=2026-10-11&r=pppppakk', 'd=2026-10-11&r=PPPP', `d=2026-10-11&r=${'kkkk'.repeat(8)}`,
    'c=1123', 'c=12345', 'c=12a4', 'c=', 's=777&t=0', 's=0&t=1&r=pppp', 's=777&t=9&r=pppp', 's=777&t=2&r=pppp',
    `d=2026-10-11&r=pppp&n=${'x'.repeat(700)}`,
  ];
  for (const state of hostile) assert.equal(share.normalize(state), null, state);
  // Well-formed but impossible: a row no real guess could give, hidden in the middle of a finished game.
  assert.equal(share.normalize(`d=${TODAY}&r=kakkpppaapkkpppp`), null);
  assert.ok(share.normalize(`d=${TODAY}&r=kakkppakapkkpppp`), 'the same game without the impossible row is fine');

  const named = share.normalize(`c=4719&n=${encodeURIComponent('‮রাফি\u0007 আহমেদ  খান খান খান খান খান')}&x=evil`);
  assert.ok(named);
  const params = new URLSearchParams(named!);
  assert.deepEqual([...params.keys()], ['c', 'n'], 'unknown keys are dropped');
  const shown = params.get('n')!;
  assert.ok(shown.startsWith('রাফি আহমেদ খান') && [...shown].length <= 20 && !/[\u0000-\u001f‮]/.test(shown), 'control and direction characters removed, 20 characters at most');
});

test('previews and comparisons are personal and kind', () => {
  const code = codeOf({ kind: 'day', date: TODAY });
  const rows = rowsOf(code, playOut(code));
  const state = share.normalize(shareHash({ puzzle: { kind: 'day', date: TODAY }, rows, name: 'রাফি' }))!;
  const today = dhakaDate();
  if (today >= TODAY) assert.match(share.preview(state).title, /^রাফি ১১ অক্টোবরের কোড .+ বারে ধরেছে। তুমি কয়বারে পারবে\?$/);
  assert.equal(previewTitle({ puzzle: { kind: 'code', code: '4719' }, rows: [], name: '' }), 'এক বন্ধু তোমার জন্য একটা কোড রেখেছে। ৭ বারে ধরতে পারবে?');
  assert.match(previewTitle({ puzzle: { kind: 'seed', seed: 5 }, rows: Array(TRIES).fill(marks('kkkk')), name: 'মিম' }), /ধরতে পারেনি/);
  assert.equal(share.preview('junk').title, 'পাকা-কাঁচা: লুকানো ৪ অঙ্কের কোড, ৭ বারে ধরতে পারবে?');
  assert.ok(!/\d|[০-৯]{4}/.test(share.preview(state).description), 'the description gives nothing away');

  const won = (tries: number) => [...Array(tries - 1).fill(marks('kakk')), marks('pppp')];
  const lost = Array(TRIES).fill(marks('kakk'));
  assert.equal(versusLine(won(3), won(5), 'রাফি'), 'রাফির চেয়ে ২ বার কম লাগল!');
  assert.equal(versusLine(won(4), won(4), 'রাফি'), 'রাফির সমান, দুজনেই ৪ বারে!');
  assert.match(versusLine(won(5), won(4), 'রাফি'), /^আর একটু হলেই!/);
  assert.match(versusLine(won(7), won(3), 'রাফি'), /রাফি এবার এগিয়ে/);
  assert.equal(versusLine(won(6), lost, 'রাফি'), 'রাফি পারেনি, তুমি পেরেছ!');
  assert.match(versusLine(lost, lost, ''), /দুজনকেই/);
  assert.equal(versusLine(won(2), [], 'রাফি'), '');
});

test('content meets the SEO limits and says what a link carries', () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  assert.ok(site.title.startsWith('সংখ্যার ধাঁধা খেলা'));
  assert.ok(!/mastermind|wordle/i.test(JSON.stringify(site)), 'no trademark, not even in SEO text');
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 5);
  assert.ok(site.steps.length >= 3 && site.privacy.some(line => line.includes('লিংক')));
  assert.ok(site.privacy.some(line => line.includes('গোপন না')), 'says plainly that a friend code is not secret');
});
