import assert from 'node:assert/strict';
import test from 'node:test';
import { makeRng, pick } from '../../../shared/game-core';
import { site } from '../content';
import {
  CHITS, CUSTOMERS, MAX_SCORE, MAX_TRAY, changeOf, fair, fastBonus, fewest, give, humanLine, isOver, makeCustomers, paidOf, rightCount,
  saying, secondsFor, startRun, takeBack, tap, timeUp, trayTotal, undo, wrongLine, type Chit, type Run,
} from '../lib/game';
import { compareLine, parseShared, previewTitle, sharedHash, validResult } from '../lib/link';
import { share } from '../share';

const serve = (run: Run, chits: readonly Chit[]) => chits.reduce(tap, run);

test('the same seed gives the same ten customers on every phone', () => {
  assert.deepEqual(makeCustomers(4821), makeCustomers(4821));
  assert.notDeepEqual(makeCustomers(1), makeCustomers(2));
  const firstChanges = new Set<number>();
  for (let seed = 1; seed <= 3000; seed++) {
    const customers = makeCustomers(seed);
    assert.equal(customers.length, CUSTOMERS);
    customers.forEach((customer, index) => {
      assert.ok(fair(customer), `seed ${seed} customer ${index} is fair`);
      if (index > 0) assert.notEqual(customer.who, customers[index - 1].who, 'no one queues twice in a row');
    });
    const [first] = customers;
    assert.ok(changeOf(first) <= 40 && changeOf(first) % 5 === 0, 'the first customer is an easy round sum');
    assert.equal(customers[4].kind, 'round');
    assert.equal(changeOf(customers[4]) % 10, 0, 'the extra coins make the change round');
    assert.equal(changeOf(customers[8]) % 10, 0);
    for (const index of [6, 9]) {
      const { out } = customers[index];
      assert.ok(out && fewest(changeOf(customers[index]))!.includes(out), 'the run-out chit would have been used');
      assert.ok(fewest(changeOf(customers[index]), out), 'and the change can still be made without it');
    }
    firstChanges.add(changeOf(first));
  }
  assert.ok(firstChanges.size >= 7, 'first customers vary');
});

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
    for (const out of [1, 5, 10] as const) {
      const without = fewest(amount, out);
      if (without) assert.ok(!without.includes(out) && trayTotal(without) === amount);
      else assert.ok(out === 1 && (amount === 1 || amount === 3), `${amount} without ${out}`);
    }
  }
  const round = { who: 0, kind: 'round' as const, notes: [100, 5, 2], price: 87, out: 0 as const };
  assert.equal(paidOf(round), 107);
  assert.equal(changeOf(round), 20);
  assert.deepEqual(saying(round), [[100, ' আর ', 7, ' টাকা দিলাম,'], ['জিনিস ', 87, ' টাকার']]);
  assert.deepEqual(saying({ who: 1, kind: 'plain', notes: [200], price: 87, out: 0 })[0], [200, ' টাকা দিলাম,']);
});

test('scoring: 100 for the right change, up to 50 more for a fast first try', () => {
  assert.equal(fastBonus(1), 50);
  assert.equal(fastBonus(0), 0);
  assert.equal(fastBonus(0.53), 25);
  assert.equal(fastBonus(2), 50);
  assert.equal(fastBonus(-1), 0);
  const run = startRun(77), change = changeOf(run.customers[0]);
  const right = give(serve(run, fewest(change)!), 0.8);
  assert.equal(right.diff, 0);
  assert.equal(right.points, 140);
  assert.equal(right.run.index, 1);
  assert.deepEqual(right.run.tray, []);
  assert.deepEqual(right.run.results, ['ok']);
  assert.equal(give(serve(run, fewest(change)!), null).points, 100, 'no clock, no bonus, full points');
  const wrong = give(serve(run, [...fewest(change)!, 10]), 0.9);
  assert.equal(wrong.diff, 10);
  assert.equal(wrong.points, 0);
  assert.equal(wrong.run.index, 0, 'a wrong count keeps the same customer');
  assert.equal(wrong.run.tray.length, fewest(change)!.length + 1, 'and the chits stay to be fixed');
  const fixed = give(takeBack(wrong.run, 10), 0.9);
  assert.equal(fixed.points, 100, 'right after a slip: no fast bonus, still full points');
  assert.equal(wrongLine(-10, 1), 'আরে, ১০ টাকা কম দিলে!');
  assert.equal(wrongLine(25, 1), 'আরে, ২৫ টাকা বেশি দিলে!');
  assert.notEqual(wrongLine(-10, 2), wrongLine(-10, 1), 'the lines vary');
  assert.equal(secondsFor(run.customers[0], false), 10);
  assert.equal(secondsFor(run.customers[4], false), 12, 'a twist gets a little longer');
  assert.equal(secondsFor(run.customers[0], true), 15);
});

test('score bands give kind, different lines', () => {
  const lines = [humanLine(10, 1450), humanLine(10, 1100), humanLine(9, 1000), humanLine(6, 700), humanLine(4, 450), humanLine(0, 0)];
  assert.equal(new Set(lines).size, lines.length);
  assert.ok(lines.every(line => line.length > 10 && !/ভুল|খারাপ|হেরে/.test(line)));
});

test('rule edges: run-out chits, full counter, undo, empty hand, nothing after the end', () => {
  let run = startRun(5);
  const out = run.customers[6].out as Chit;
  run = { ...run, index: 6 };
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
  let done = startRun(9);
  for (let index = 0; index < CUSTOMERS; index++) done = timeUp(done);
  assert.ok(isOver(done));
  assert.equal(done.score, 0);
  assert.equal(timeUp(done), done);
  assert.equal(tap(done, 10), done);
  assert.equal(give({ ...done, tray: [10] }, 1).run.results.length, CUSTOMERS);
});

test('a headless shift: a scripted shopkeeper with slips and a slow moment ends sanely', () => {
  for (let seed = 1; seed <= 300; seed++) {
    const rng = makeRng(seed * 7 + 1);
    let run = startRun(seed), elapsed = 0, steps = 0;
    while (!isOver(run) && steps++ < 10_000) {
      const customer = run.customers[run.index], limit = secondsFor(customer, false);
      elapsed += 1 / 60;
      if (elapsed >= limit) { run = timeUp(run); elapsed = 0; continue; }
      // Think for a while (sometimes too long), then count out the change, sometimes one chit short or over.
      if (elapsed < 1.5 + (run.index % 4) * 2.4 || run.tray.length) continue;
      const chits = fewest(changeOf(customer), customer.out)!;
      const slip = pick(rng, 5);
      run = serve(run, slip === 0 ? [...chits, 2] : chits);
      let handed = give(run, 1 - elapsed / limit);
      if (handed.diff) handed = give(takeBack(handed.run, 2), 1 - elapsed / limit);
      assert.equal(handed.diff, 0);
      run = handed.run;
      elapsed = 0;
    }
    assert.ok(isOver(run));
    const right = rightCount(run.results);
    assert.ok(right >= 6 && right <= CUSTOMERS, `seed ${seed}: ${right} right`);
    assert.ok(run.score > 600 && run.score <= MAX_SCORE, `seed ${seed}: ${run.score}`);
    assert.ok(validResult(run.score, right), 'a real run always makes a valid link');
  }
});

test('links: round trip, kind comparisons, hostile and capped input', () => {
  const mine = { seed: 4821, score: 1240, right: 9, name: 'রাফি' };
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

test('content meets the SEO limits and says what a link carries', () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  assert.ok(site.title.startsWith('টাকার হিসাবের খেলা'));
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 5);
  assert.ok(site.privacy.some(line => line.includes('লিংকে') && line.includes('পয়েন্ট') && line.includes('নাম')));
  assert.ok(!/আপনি|করুন|টাকা জিতো|বাজি ধরো|লটারি/.test(JSON.stringify(site)), 'তুমি voice, no gambling words');
  assert.ok(CHITS.every(chit => [1, 2, 5, 10, 20, 50, 100].includes(chit)));
});
