// The queues, the arithmetic, the score, the links (old and new) and the words. The rewrite's statechart replays, saved
// progress and bot-tuned rates are in rewrite.test.ts.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { pick, makeRng } from '../../../shared/game-core';
import { site } from '../content';
import { share } from '../share';
import { CUSTOMERS, DAYS, dayPace, dayRows, legacyCustomers, legacySeconds } from '../lib/legacy';
import { EXTRA_SECONDS, LEVELS, LEVEL_COUNT, PER_WORLD, WORLDS, changeKinds, changes, finaleName, isFinale, levelAt, secondsFor, specCount, worldOf } from '../lib/levels';
import { MAX_PIECES, MAX_TRAY, changeOf, CHITS, fair, fewest, paidOf, trayTotal, type Chit } from '../lib/money';
import {
  MAX_SCORE, bestLine, chitsText, dayStars, fastBonus, give, humanLine, isOver, makeDeal, nearLine, rightCount, saying, startRun, starsOf, statsOf, takeBack, tap, timeUp, undo, working, wrongLine, type Run,
} from '../lib/play';
import { compareLine, parseShared, previewTitle, sharedHash, validResult } from '../lib/link';
import { SLOTS, makeQueue, newTwistAt, queueOfLevel, twistsOf } from '../lib/queue';

const SEEDS = Array.from({ length: 120 }, (_, i) => 1 + ((i * 2654435761) >>> 0) % 999_999_999);
const serve = (run: Run, chits: readonly Chit[]) => chits.reduce(tap, run);

test('arithmetic: fewest chits, with and without a run-out chit', () => {
  assert.deepEqual(fewest(113), [100, 10, 2, 1]);
  assert.deepEqual(fewest(188), [100, 50, 20, 10, 5, 2, 1]);
  assert.deepEqual(fewest(0), []);
  assert.equal(fewest(-5), null);
  assert.equal(fewest(2.5), null);
  assert.deepEqual(fewest(13, 1), [5, 2, 2, 2, 2]);
  assert.equal(fewest(3, 1), null, 'three can only be made with a ১');
  assert.deepEqual(fewest(17, 5), [10, 2, 2, 2, 1]);
  assert.deepEqual(fewest(35, 10), [20, 5, 5, 5]);
  for (let amount = 0; amount <= 300; amount++) {
    const chits = fewest(amount)!;
    assert.equal(trayTotal(chits), amount);
    for (const out of [1, 5, 10, 20, 50] as const) {
      const without = fewest(amount, out);
      if (without) assert.ok(!without.includes(out) && trayTotal(without) === amount);
      else assert.ok(out === 1 && (amount === 1 || amount === 3), `${amount} without ${out}`);
    }
  }
});

test('what a customer says and the working behind it', () => {
  const plain = { who: 1, kind: 'plain' as const, notes: [200], price: 87, out: 0 as const };
  assert.deepEqual(saying(plain), [[200, ' টাকা দিলাম,'], ['জিনিস ', 87, ' টাকার']]);
  assert.deepEqual(working(plain), ['২০০ − ৮৭ = ১১৩']);
  const round = { who: 0, kind: 'round' as const, notes: [100, 5, 2], price: 87, out: 0 as const };
  assert.equal(paidOf(round), 107);
  assert.equal(changeOf(round), 20);
  assert.deepEqual(saying(round), [[100, ' আর ', 7, ' টাকা দিলাম,'], ['জিনিস ', 87, ' টাকার']]);
  assert.deepEqual(working(round), ['১০০ + ৫ + ২ = ১০৭', '১০৭ − ৮৭ = ২০']);
  const two = { who: 2, kind: 'two' as const, notes: [100, 50], price: 123, out: 0 as const };
  assert.deepEqual(working(two), ['১০০ + ৫০ = ১৫০', '১৫০ − ১২৩ = ২৭']);
  const kg = { who: 3, kind: 'kg' as const, notes: [100], price: 54, out: 0 as const, qty: 3, unit: 18 };
  assert.deepEqual(saying(kg), [[3, ' কেজি, কেজি ', 18, ' টাকা।'], [100, ' টাকা দিলাম।']]);
  assert.deepEqual(working(kg), ['৩ × ১৮ = ৫৪', '১০০ − ৫৪ = ৪৬']);
  assert.equal(changeOf(kg), 46);
  assert.equal(chitsText([100, 10, 2, 1]), '১০০ + ১০ + ২ + ১');
});

test('the ladder: 3 shops × 10 days, one new thing a day, a named finale with the patience rule', () => {
  assert.equal(LEVEL_COUNT, 30);
  assert.deepEqual(WORLDS.map(world => world.finale), ['ঈদের আগের দিন', 'মাসের প্রথম বাজার', 'হাটবার']);
  assert.deepEqual([9, 10, 20, 30].map(finaleName), ['', 'ঈদের আগের দিন', 'মাসের প্রথম বাজার', 'হাটবার']);
  assert.equal(LEVELS.filter(level => level.rush).length, 3, 'only finales cost patience for a wrong count');
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const spec = levelAt(level), where = `level ${level}`;
    assert.ok(spec.lesson.length > 8 && spec.lesson.length <= 90, where);
    assert.equal(spec.rush, isFinale(level), `${where}: rush only on finales`);
    assert.ok(specCount(spec) <= SLOTS.length, `${where}: twisted customers fit the queue`);
    for (const [twist] of spec.tw) {
      if (twist === 'out') assert.ok(spec.outs.length > 0, where);
      if (twist === 'two') assert.ok(spec.pairs.length > 0, where);
      if (twist === 'kg') assert.ok(spec.kg, where);
    }
    if (level === 1 || (level - 1) % PER_WORLD === 0) continue;
    const kinds = changeKinds(level);
    if (isFinale(level)) assert.ok(kinds.includes('rush') && kinds.length <= 3, `${where}: the finale adds the patience rule ${kinds}`);
    else assert.equal(kinds.length, 1, `${where}: exactly one new thing, got ${kinds}`);
    assert.ok(changes(level).length >= 1, `${where}: the start card names the change`);
  }
  assert.deepEqual(changes(2), ['বড় নোট ৫০ → ১০০']);
  assert.deepEqual(changes(4), ['সময় ১০ → ৯ সে.']);
  assert.deepEqual(changes(6), ['নতুন: গোল ভাংতি']);
  assert.deepEqual(changes(11), ['নতুন দোকান']);
  assert.deepEqual(changes(12), ['শেষ চিরকুট ১০ → ৫']);
  assert.deepEqual(changes(14), ['চিরকুট শেষ ৩ → ৫ জন', 'শেষ চিরকুট বদলাল']);
  assert.deepEqual(changes(3), ['খুচরা দাম']);
  assert.ok(changes(10).includes('ভুলে ধৈর্য কমে'));
  assert.deepEqual([1, 6, 9, 11, 18, 21, 28].map(level => newTwistAt(level)?.twist ?? null), [null, 'round', 'two', 'out', 'round', 'kg', 'out']);
  assert.equal(newTwistAt(10), null, 'the finale brings no new customer kind');
  assert.equal(newTwistAt(6)!.index, SLOTS[0], 'the new twist meets you at the third customer');
});

test('every level makes a fair queue: ten customers, the first gentle, twists where the level says', () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const spec = levelAt(level), kinds = twistsOf(spec);
    for (const seed of SEEDS) {
      const queue = queueOfLevel(level, seed), where = `level ${level} seed ${seed}`;
      assert.equal(queue.length, CUSTOMERS);
      queue.forEach((customer, index) => {
        assert.ok(fair(customer), `${where} customer ${index} is fair`);
        assert.equal(customer.kind, kinds[index] ?? 'plain', `${where} customer ${index}`);
        if (index > 0) assert.notEqual(customer.who, queue[index - 1].who, 'no one queues twice in a row');
        const pieces = fewest(changeOf(customer), customer.out)!.length;
        assert.ok(pieces <= MAX_PIECES + (customer.out ? 1 : 0), where);
        if (customer.out) {
          assert.ok(spec.outs.includes(customer.out), where);
          assert.ok(fewest(changeOf(customer))!.includes(customer.out), 'the run-out chit would have been used');
        }
        if (customer.kind === 'kg') assert.equal(customer.price, customer.qty! * customer.unit!, where);
        if (customer.kind === 'round') assert.equal(changeOf(customer) % 10, 0, 'the extra coins make the change round');
        if (customer.kind === 'two') assert.equal(customer.notes.length, 2, where);
      });
      assert.equal(queue[0].kind, 'plain');
      assert.equal(queue[0].notes.length, 1);
      assert.ok(queue[0].notes[0] <= Math.max(50, ...[50, 100, 200, 500].filter(note => note > queue[0].price).slice(0, 1)), 'the first customer hands the smallest note');
    }
  }
  assert.deepEqual(makeQueue(levelAt(7), 4821), makeQueue(levelAt(7), 4821), 'the same seed gives the same queue');
  assert.notDeepEqual(makeQueue(levelAt(7), 1), makeQueue(levelAt(7), 2));
  const levelOne = new Set(SEEDS.map(seed => changeOf(queueOfLevel(1, seed)[0])));
  assert.ok(levelOne.size >= 5, 'first customers vary');
  assert.ok(SEEDS.every(seed => changeOf(queueOfLevel(1, seed)[0]) <= 40), 'level 1 starts with an easy round sum');
});

test('clocks: the level sets the patience, a twist adds a little, and a clock never asks the impossible', () => {
  assert.equal(secondsFor(levelAt(1), queueOfLevel(1, 1)[0]), 10);
  assert.equal(secondsFor(levelAt(7), { who: 0, kind: 'round', notes: [100, 5], price: 85, out: 0 }), 8 + EXTRA_SECONDS.round);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    for (const seed of SEEDS.slice(0, 40)) {
      const deal = makeDeal(level, seed);
      deal.customers.forEach((customer, index) => {
        // Two seconds to read and think and under a second a chit, at the very least.
        const chits = fewest(changeOf(customer), customer.out)!.length;
        assert.ok(2 + chits * 0.6 <= deal.seconds[index], `level ${level} seed ${seed} customer ${index}: ${chits} chits in ${deal.seconds[index]} s`);
      });
    }
  }
});

test('scoring: 100 for the right change, up to 50 more for a fast first try', () => {
  assert.equal(fastBonus(1), 50);
  assert.equal(fastBonus(0), 0);
  assert.equal(fastBonus(0.53), 25);
  assert.equal(fastBonus(2), 50);
  assert.equal(fastBonus(-1), 0);
  const deal = makeDeal(1, 77), run = startRun(deal), change = changeOf(run.customers[0]);
  const right = give(serve(run, fewest(change)!), 0.8, 2500);
  assert.equal(right.diff, 0);
  assert.equal(right.points, 140);
  assert.equal(right.run.index, 1);
  assert.deepEqual(right.run.tray, []);
  assert.deepEqual(right.run.log, [{ ok: true, clean: true, ms: 2500, points: 140 }]);
  assert.equal(give(serve(run, fewest(change)!), null).points, 100, 'no clock, no bonus, full points');
  const wrong = give(serve(run, [...fewest(change)!, 10]), 0.9);
  assert.equal(wrong.diff, 10);
  assert.equal(wrong.points, 0);
  assert.equal(wrong.run.index, 0, 'a wrong count keeps the same customer');
  assert.equal(wrong.run.slips, 1);
  assert.equal(wrong.run.tray.length, fewest(change)!.length + 1, 'and the chits stay to be fixed');
  const fixed = give(takeBack(wrong.run, 10), 0.9);
  assert.equal(fixed.points, 100, 'right after a slip: no fast bonus, still full points');
  assert.equal(fixed.run.clean, 0);
  assert.equal(wrongLine(-10, 1), 'আরে, ১০ টাকা কম দিলে!');
  assert.equal(wrongLine(25, 1), 'আরে, ২৫ টাকা বেশি দিলে!');
  assert.notEqual(wrongLine(-10, 2), wrongLine(-10, 1), 'the lines vary');
});

test('score bands give kind, different lines', () => {
  const lines = [humanLine(10, 1450), humanLine(10, 1100), humanLine(9, 1000), humanLine(6, 700), humanLine(4, 450), humanLine(0, 0)];
  assert.equal(new Set(lines).size, lines.length);
  assert.ok(lines.every(line => line.length > 10 && !/ভুল|খারাপ|হেরে/.test(line)));
});

test('rule edges: run-out chits, full counter, undo, empty hand, nothing after the end', () => {
  let run = startRun(makeDeal(11, 5));
  const first = run.customers.findIndex(customer => customer.out);
  const out = run.customers[first].out as Chit;
  run = { ...run, index: first };
  assert.equal(tap(run, out), run, 'a run-out chit cannot be given');
  assert.equal(tap(run, 7 as Chit), run, 'only real chits');
  let full = run;
  for (let index = 0; index < MAX_TRAY + 3; index++) full = tap(full, 100);
  assert.equal(full.tray.length, MAX_TRAY);
  assert.deepEqual(undo(tap(tap(run, 20), 5)).tray, [20]);
  assert.equal(undo(run), run);
  assert.deepEqual(takeBack(serve(run, [20, 5, 20]), 20).tray, [20, 5], 'takes back one, the last of that value');
  assert.equal(takeBack(run, 50), run);
  const empty = give(run, 1);
  assert.ok(Number.isNaN(empty.diff) && empty.run === run, 'an empty hand is not a try');
  let done = startRun(makeDeal(1, 9));
  for (let index = 0; index < CUSTOMERS; index++) done = timeUp(done);
  assert.ok(isOver(done));
  assert.equal(done.score, 0);
  assert.equal(timeUp(done), done);
  assert.equal(tap(done, 10), done);
  assert.equal(give({ ...done, tray: [10] }, 1).run.log.length, CUSTOMERS);
});

test('stars come from first-try right answers, with exact near-miss lines', () => {
  assert.deepEqual([0, 5, 6, 7, 8, 9, 10].map(dayStars), [0, 0, 1, 1, 2, 2, 3]);
  assert.equal(nearLine(4), 'আর ২ জনকে একবারে ঠিক দিলেই দিন পার।');
  assert.equal(nearLine(7), 'আর ১ জনকে একবারে ঠিক দিলে ২ তারা।');
  assert.equal(nearLine(9), 'আর ১ জনকে একবারে ঠিক দিলে ৩ তারা।');
  assert.equal(nearLine(10), '');
  assert.equal(bestLine(1200, 1240, 'এই দিনে'), 'এই দিনে সেরা ১২৪০। আর ৪৫ পয়েন্ট হলেই নতুন সেরা।');
  assert.equal(bestLine(600, 1240, 'এই ফোনে'), 'এই ফোনে সেরা ১২৪০');
  // Without the clock the third star is out of reach: it needs the clock to prove it.
  assert.deepEqual([6, 8, 10].map(clean => starsOf(clean, false)), [1, 2, 2]);
  assert.deepEqual([6, 8, 10].map(clean => starsOf(clean, true)), [1, 2, 3]);
  assert.equal(nearLine(10, false), 'দশে দশ! ঘড়ির সঙ্গে খেললে ৩ তারা পাবে।');
  assert.equal(nearLine(7, false), 'আর ১ জনকে একবারে ঠিক দিলে ২ তারা।');
  let run = startRun(makeDeal(1, 77));
  run = give(serve(run, fewest(changeOf(run.customers[0]))!), 0.5, 3000).run;
  assert.equal(run.clean, 1, 'right first time counts');
  const slip = give(serve(run, [...fewest(changeOf(run.customers[1]))!, 1]), 0.5).run;
  run = give(takeBack(slip, 1), 0.5, 5000).run;
  assert.equal(run.clean, 1, 'right after a slip does not');
  assert.equal(rightCount(run.log), 2);
  assert.equal(timeUp(run, 10000).clean, 1, 'nor does a customer who walked off');
  const stats = statsOf(timeUp(run, 10000).log);
  assert.deepEqual([stats.right, stats.clean, stats.bestStreak, stats.avgMs, stats.fastestMs], [2, 1, 1, 4000, 3000]);
  assert.deepEqual(statsOf([]), { right: 0, clean: 0, bestStreak: 0, avgMs: 0, fastestMs: 0 });
});

test('a perfect shopkeeper three-stars every day, inside every clock', () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const deal = makeDeal(level, level * 31);
    let run = startRun(deal);
    while (!isOver(run)) {
      const customer = run.customers[run.index], chits = fewest(changeOf(customer), customer.out)!;
      const left = 1 - (2 + chits.length * 0.6) / deal.seconds[run.index];
      assert.ok(left > 0);
      run = give(serve(run, chits), left).run;
    }
    assert.equal(starsOf(run.clean, true), 3, `level ${level}`);
    assert.ok(validResult(run.score, rightCount(run.log)));
    assert.ok(run.score <= MAX_SCORE);
  }
});

// ---- old queues replay exactly ----
test('old links rebuild the classic queue and the old shop days exactly as before', () => {
  const all = Array.from({ length: 500 }, (_, index) => legacyCustomers(index + 1));
  assert.equal(createHash('sha256').update(JSON.stringify(all)).digest('hex').slice(0, 16), 'c3b615320789e0bc');
  // Pinned from the pre-rewrite lib/game.ts makeCustomers, every day 0–20 over 47 seeds (compared byte for byte when pinned).
  const hash = createHash('sha256');
  for (let day = 0; day <= DAYS; day++) for (const seed of [1, 7, 303, 4242, 99991, 123456789, 999999999, ...Array.from({ length: 40 }, (_, i) => i * 7919 + 11)]) hash.update(JSON.stringify(legacyCustomers(seed, day)));
  assert.equal(hash.digest('hex').slice(0, 16), '55cb974e943b8f8f');
  assert.deepEqual(dayRows(0), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(dayRows(1), [0, 0, 0, 1, 1, 1, 2, 2, 2, 3], 'day 1: round sums and single notes only');
  assert.equal(dayPace(0), 1);
  assert.equal(legacySeconds(legacyCustomers(1, 1)[0], 1), 13);
  assert.equal(legacySeconds(legacyCustomers(1, DAYS)[0], DAYS), 8);
  assert.deepEqual(makeDeal(0, 4821, 1).customers, legacyCustomers(4821), 'a link with no day is the classic queue');
  assert.deepEqual(makeDeal(5, 77, 1).seconds, legacyCustomers(77, 5).map(customer => legacySeconds(customer, 5)));
  assert.equal(makeDeal(5, 77, 1).rush, false);
  assert.equal(makeDeal(10, 77).rush, true);
  const rng = makeRng(3);
  assert.ok(pick(rng, 5) < 5);
});

// ---- links ----
test('links: round trip, kind comparisons, hostile and capped input', () => {
  const mine = { seed: 4821, score: 1240, right: 9, name: 'রাফি', v: 1 as const, level: 0 };
  const hash = sharedHash(mine);
  assert.equal(hash, `s=4821&t=1240&r=9&n=${encodeURIComponent('রাফি')}`);
  assert.deepEqual(parseShared(`#${hash}`), mine);
  assert.equal(share.normalize(hash), hash);
  assert.equal(share.preview(hash).title, 'রাফি ১২৪০ করেছে, ১০ জনের ৯ জনকে ঠিক ভাংতি। তুমি পারবে?');
  assert.match(share.preview(sharedHash({ ...mine, name: '' })).title, /^এক বন্ধু ১২৪০ করেছে/);
  assert.equal(share.preview('junk').title, 'খদ্দের দাঁড়িয়ে, ভাংতি দিতে পারবে?');
  const hostile = [
    '', 'junk', 's=0&t=100&r=1', 's=1000000000&t=100&r=1', 's=5&t=1505&r=10', 's=5&t=1600&r=10', 's=5&t=101&r=1',
    's=5&t=100', 's=5&t=100&r=11', 's=5&t=100&r=-1', 's=5&t=100&r=1e0', 's=5&t=100&r=1.0', 's=5&t=900&r=10', 's=5&t=200&r=1',
    's=5&t=-5&r=0', 's=5.5&t=100&r=1', `s=5&t=100&r=1&n=${'x'.repeat(700)}`,
  ];
  for (const state of hostile) assert.equal(share.normalize(state), null, state);
  assert.equal(share.normalize('s=5&t=1500&r=10'), 's=5&t=1500&r=10');
  assert.equal(share.normalize('s=5&t=0&r=0'), 's=5&t=0&r=0');
  assert.equal(parseShared('s=5&t=100&r=1&n=%E2%80%AEevil%0A' + 'ক'.repeat(40))!.name, `evil${'ক'.repeat(16)}`, 'names are cleaned and capped');
  assert.equal(compareLine(1300, 1240, 'রাফি'), 'রাফির চেয়ে ৬০ বেশি!');
  assert.equal(compareLine(1200, 1240, 'রাফি'), 'আর একটু হলেই! রাফির চেয়ে মাত্র ৪০ কম।');
  assert.match(compareLine(800, 1240, ''), /^বন্ধু এবার এগিয়ে/);
  assert.match(compareLine(1240, 1240, 'মিম'), /^মিমের সমান সমান/);
  assert.equal(previewTitle({ ...mine, right: 10, score: 1500 }), 'রাফি ১৫০০ করেছে, ১০ জনের ১০ জনকে ঠিক ভাংতি। তুমি পারবে?');
});

test('day links: old ones (no v) are old shop days; new ones (v=2) name a level of the ladder', () => {
  const old = { seed: 4821, score: 1240, right: 9, name: 'রাফি', v: 1 as const, level: 7, clean: 8 };
  const hash = sharedHash(old);
  assert.equal(hash, `s=4821&t=1240&r=9&d=7&c=8&n=${encodeURIComponent('রাফি')}`, 'the old shape, byte for byte');
  assert.deepEqual(parseShared(`#${hash}`), old);
  assert.match(share.preview(hash).title, /^দিন ৭ · রাফি ১২৪০ করেছে/);
  const next = { ...old, v: 2 as const, level: 27 };
  const link = sharedHash(next);
  assert.equal(link, `s=4821&t=1240&r=9&d=27&c=8&v=2&n=${encodeURIComponent('রাফি')}`);
  assert.deepEqual(parseShared(link), next);
  assert.equal(share.normalize(link), link);
  assert.deepEqual(parseShared('s=5&t=1500&r=10'), { seed: 5, score: 1500, right: 10, name: '', v: 1, level: 0 }, 'no day: the classic queue');
  assert.equal(parseShared('s=5&t=150&r=1&d=20&c=1')!.level, 20, 'the last old day');
  assert.equal(parseShared('s=5&t=150&r=1&d=21&c=1'), null, 'there was never an old day 21');
  assert.equal(parseShared('s=5&t=150&r=1&d=21&c=1&v=2')!.level, 21, 'but the new ladder has one');
  const hostile = ['s=5&t=100&r=1&d=0&c=1', 's=5&t=100&r=1&d=31&c=1&v=2', 's=5&t=100&r=1&d=3&c=2', 's=5&t=100&r=1&d=3', 's=5&t=100&r=1&c=1',
    's=5&t=150&r=1&d=3&c=0', 's=5&t=100&r=1&d=x&c=1', 's=5&t=100&r=1&d=3&c=-1', 's=5&t=100&r=1&v=2', 's=5&t=100&r=1&d=3&c=1&v=3', 's=5&t=100&r=1&d=3&c=1&v=1', 's=5&t=100&r=1&d=0&c=1&v=2'];
  for (const state of hostile) assert.equal(share.normalize(state), null, state);
  assert.equal(share.normalize('s=5&t=150&r=1&d=3&c=1'), 's=5&t=150&r=1&d=3&c=1');
  // সময় নিয়ে: new links only, and with no speed bonus the score is exactly 100 a customer.
  const calm = { ...next, score: 900, right: 9, clean: 9, calm: true };
  assert.equal(sharedHash(calm), `s=4821&t=900&r=9&d=27&c=9&v=2&m=1&n=${encodeURIComponent('রাফি')}`);
  assert.deepEqual(parseShared(sharedHash(calm)), calm);
  for (const state of ['s=5&t=900&r=9&d=3&c=9&m=1', 's=5&t=950&r=9&d=3&c=9&v=2&m=1', 's=5&t=900&r=9&d=3&c=9&v=2&m=2', 's=5&t=900&r=9&d=3&c=9&v=2&m=0']) assert.equal(share.normalize(state), null, state);
  assert.ok(validResult(1500, 10) && !validResult(1505, 10));
});

test('content meets the SEO limits and says what a link carries', () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  assert.ok(site.title.startsWith('টাকার হিসাবের খেলা'));
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length);
  assert.ok(site.privacy.some(line => line.includes('লিংকে') && line.includes('পয়েন্ট') && line.includes('নাম')));
  assert.ok(!/আপনি|করুন|টাকা জিতো|বাজি ধরো|লটারি/.test(JSON.stringify(site)), 'তুমি voice, no gambling words');
  assert.ok(CHITS.every(chit => [1, 2, 5, 10, 20, 50, 100].includes(chit)));
  const text = JSON.stringify(site);
  assert.equal(text, text.normalize('NFC'), 'Bangla is NFC');
  assert.ok(site.faq.some(item => item.answer.includes('তিরিশটা')), 'the FAQ knows the 30 days');
});
