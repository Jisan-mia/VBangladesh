import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_SHARE_STATE } from '../../../shared/share-types';
import { drawCard, SLIP_ASK } from '../lib/draw-slip';
import { allocatePoisha, calculateLedger, cleanTrip, exampleLedger, formatTaka, initialLedger, inputAmount, ledgerHash, ledgerLine, ledgerReport, MAX_EXPENSE_AMOUNT, MAX_EXPENSES, MAX_PEOPLE, parseLedgerHash, parsePoisha, removePerson, validateLedger, type Ledger } from '../lib/ledger';
import { share } from '../share';

const people = [{ id: 'a', name: 'আশা' }, { id: 'b', name: 'বাবু' }, { id: 'c', name: 'চয়ন' }];
const sample: Ledger = { people, expenses: [{ id: 'one', label: 'খাবার', payerId: 'a', amount: 10_001 }, { id: 'two', label: 'যাতায়াত', payerId: 'b', amount: 2_002 }] };

test('Bengali decimals are parsed as exact integer poisha', () => {
  assert.deepEqual([' ১২৩.৪৫ ', '০.০১', '9.9', '১০০০০০০'].map(parsePoisha), [12345, 1, 990, MAX_EXPENSE_AMOUNT]);
});
test('malformed, zero, negative, excessive and overprecise amounts are rejected', () => {
  for (const input of ['', '0', '-2', '১,০০০', '১.০০১', '1e3', 'Infinity', '১০০০০০০.০১', '৯'.repeat(80)]) assert.throws(() => parsePoisha(input));
});
test('division preserves all poisha with a stable one-poisha remainder rule', () => {
  assert.deepEqual(allocatePoisha(100, 3), [34, 33, 33]);
});
test('total allocation cannot drift over many expenses', () => {
  const ledger: Ledger = { people, expenses: [1, 2, 3].map(id => ({ id: String(id), label: 'খরচ', payerId: 'a', amount: 1 })) };
  assert.deepEqual(calculateLedger(ledger).balances.map(balance => balance.share), [1, 1, 1]);
});
test('settlements close every balance exactly without mutating the ledger', () => {
  const original = structuredClone(sample);
  const result = calculateLedger(sample);
  const remaining = new Map(result.balances.map(balance => [balance.person.id, balance.net]));
  for (const transfer of result.transfers) {
    remaining.set(transfer.from.id, remaining.get(transfer.from.id)! + transfer.amount);
    remaining.set(transfer.to.id, remaining.get(transfer.to.id)! - transfer.amount);
  }
  assert.deepEqual({ remaining: [...remaining.values()], ledger: sample }, { remaining: [0, 0, 0], ledger: original });
});
test('settlement order and amounts are deterministic', () => {
  assert.deepEqual(calculateLedger(sample).transfers.map(transfer => [transfer.from.id, transfer.to.id, transfer.amount]), [['b', 'a', 1999], ['c', 'a', 4001]]);
});
test('a debtor can settle with several creditors without negative or self transfers', () => {
  const ledger = { people: [...people, { id: 'd', name: 'দিয়া' }], expenses: [{ id: 'one', label: 'খাবার', payerId: 'a', amount: 300 }, { id: 'two', label: 'ভাড়া', payerId: 'b', amount: 200 }] };
  assert.deepEqual(calculateLedger(ledger).transfers.map(transfer => [transfer.from.id, transfer.to.id, transfer.amount]), [['c', 'a', 125], ['d', 'a', 50], ['d', 'b', 75]]);
});
test('adding, editing and removing expenses changes totals without losing balance', () => {
  const ledgers = [sample, { ...sample, expenses: sample.expenses.map(expense => ({ ...expense, amount: expense.amount + 1 })) }, { ...sample, expenses: [] }];
  assert.deepEqual(ledgers.map(ledger => { const result = calculateLedger(ledger); return [result.total, result.balances.reduce((sum, balance) => sum + balance.net, 0)]; }), [[12003, 0], [12005, 0], [0, 0]]);
});
test('all group sizes and remainder boundaries conserve cost and settle exactly', () => {
  for (let count = 2; count <= 8; count += 1) {
    const group = Array.from({ length: count }, (_, index) => ({ id: String(index), name: `নাম ${index}` }));
    for (const amount of [1, count - 1, count, count + 1, MAX_EXPENSE_AMOUNT]) {
      const result = calculateLedger({ people: group, expenses: [{ id: 'expense', label: 'খরচ', payerId: group[count - 1].id, amount }] });
      assert.equal(result.balances.reduce((sum, balance) => sum + balance.net, 0), 0);
      assert.equal(result.transfers.reduce((sum, transfer) => sum + transfer.amount, 0), result.balances[count - 1].net);
    }
  }
});
test('untrusted ledgers cannot introduce invalid members, names, payers or amounts', () => {
  const invalid: unknown[] = [null, { people: [], expenses: [] }, { ...sample, people: [...people, people[0]] }, { ...sample, people: people.map(person => ({ ...person, name: 'একই নাম' })) }, { ...sample, people: [{ id: 'a', name: 'নাম\nটাকা দিন' }, ...people.slice(1)] }, { ...sample, expenses: [{ ...sample.expenses[0], payerId: '__proto__' }] }, { ...sample, expenses: [{ ...sample.expenses[0], amount: 1.1 }] }, { ...sample, expenses: [{ ...sample.expenses[0], amount: Number.MAX_SAFE_INTEGER }] }, { ...sample, expenses: [sample.expenses[0], sample.expenses[0]] }];
  for (const ledger of invalid) assert.throws(() => validateLedger(ledger));
});
test('removing a payer cannot silently discard recorded spending', () => {
  assert.throws(() => removePerson(sample, 'a'), /এই নামে খরচ আছে/);
});
test('a non-payer can leave and the remaining group is recalculated', () => {
  assert.deepEqual(calculateLedger(removePerson(sample, 'c')).balances.map(balance => balance.share), [6002, 6001]);
});
test('the last two people cannot be removed', () => {
  assert.throws(() => removePerson(initialLedger, 'person-1'));
});
test('member and expense limits reject oversized ledgers at the calculation boundary', () => {
  const oversizedPeople = Array.from({ length: 9 }, (_, index) => ({ id: String(index), name: `ব্যক্তি ${index}` }));
  const oversizedExpenses = Array.from({ length: 101 }, (_, index) => ({ id: String(index), label: 'খরচ', payerId: 'a', amount: 1 }));
  for (const ledger of [{ people: oversizedPeople, expenses: [] }, { people, expenses: oversizedExpenses }]) assert.throws(() => calculateLedger(ledger));
});
test('visually identical Bengali names cannot bypass duplicate detection', () => {
  assert.throws(() => validateLedger({ people: [{ id: 'a', name: 'চয়ন' }, { id: 'b', name: 'চয়ন'.normalize('NFC') }], expenses: [] }), /একই নাম/);
});
test('reports use current names and amounts and explain the rounding rule', () => {
  const report = ledgerReport(sample);
  assert.ok(report.includes('বাবু → আশা: ১৯.৯৯ টাকা') && report.includes('চয়ন → আশা: ৪০.০১ টাকা'.normalize('NFC')) && report.includes('পয়সা বেঁচে গেলে') && report.includes('টাকা পাঠানো হয় না'));
});
test('amount editing preserves a single poisha', () => {
  assert.equal(parsePoisha(inputAmount(1)), 1);
});

// --- trip name, share links and the settlement slip ---
const settle = (ledger: Ledger) => calculateLedger(ledger).transfers.map(transfer => `${transfer.from.name} → ${transfer.to.name} ${transfer.amount}`);

test('the starter Cox\'s Bazar trip settles in four transfers with the friendly line', () => {
  const result = calculateLedger(exampleLedger);
  assert.equal(result.total, 2_045_000);
  assert.deepEqual(settle(exampleLedger), ['মিম → রাফি 289000', 'জয় → রাফি 202000', 'জয় → তানিয়া 191000', 'জয় → সাকিব 16000']);
  assert.equal(ledgerLine(result), 'হিসাব পরিষ্কার, বন্ধুত্ব অটুট!');
});

test('a shared link rebuilds the same ledger: trip, names, payers, amounts and Bangla labels', () => {
  const tricky: Ledger = { trip: 'সাজেক & রাঙামাটি #২', people: [{ id: 'x', name: 'রাফি' }, { id: 'y', name: 'তানিয়া+১' }], expenses: [{ id: 'z', label: 'জিপ ভাড়া ৫০%. ফেরত=না', payerId: 'y', amount: 123_45 }] };
  for (const ledger of [exampleLedger, tricky]) {
    const hash = ledgerHash(ledger);
    const back = parseLedgerHash(hash)!;
    assert.equal(ledgerHash(back), hash);
    assert.equal(back.trip, ledger.trip);
    assert.deepEqual(settle(back), settle(ledger));
    // Browsers hand location.hash back with Bangla percent-encoded.
    assert.equal(ledgerHash(parseLedgerHash(hash.replace(/[^\x00-\x7f]+/g, encodeURIComponent))!), hash);
  }
});

test('decomposed Bangla names and labels come back in NFC', () => {
  const back = parseLedgerHash(`#p=${'সোহেল'.normalize('NFD')}&p=মিম&e=0.100.${'খোসা'.normalize('NFD')}`)!;
  assert.deepEqual([back.people[0].name, back.expenses[0].label], ['সোহেল', 'খোসা']);
});

test('hostile or impossible links are rejected instead of shown', () => {
  for (const hash of ['', '#result', '#p=রাফি&e=0.100.চা', '#p=রাফি&p=মিম', '#p=রাফি&p=মিম&e=2.100.চা', '#p=রাফি&p=মিম&e=0.0.চা', '#p=রাফি&p=মিম&e=0.-5.চা', '#p=রাফি&p=মিম&e=0.100000001.চা', '#p=রাফি&p=রাফি&e=0.100.চা', '#p=রা%E2%80%AEফি&p=মিম&e=0.100.চা', '#p=রাফি&p=মিম&e=0.100.%0A', `#t=${'ক'.repeat(41)}&p=রাফি&p=মিম&e=0.100.চা`, '#' + 'p=ক&'.repeat(9) + 'e=0.1.চা', '#' + 'x'.repeat(MAX_SHARE_STATE * 9 + 1)]) {
    assert.equal(parseLedgerHash(hash), null, hash.slice(0, 50));
  }
});

test('the biggest ledger with long Bangla names and labels still fits in one link', () => {
  const people = Array.from({ length: MAX_PEOPLE }, (_, index) => ({ id: `p${index}`, name: 'ক'.repeat(23) + index }));
  const expenses = Array.from({ length: MAX_EXPENSES }, (_, index) => ({ id: `e${index}`, label: 'খ'.repeat(50), payerId: `p${index % MAX_PEOPLE}`, amount: MAX_EXPENSE_AMOUNT }));
  const hash = ledgerHash({ trip: 'গ'.repeat(40), people, expenses });
  assert.ok(hash.length - 1 <= MAX_SHARE_STATE, String(hash.length));
  assert.ok(share.normalize(hash.slice(1)));
});

test('trip names are cleaned while typing and checked at the boundary', () => {
  assert.equal(cleanTrip('কক্স\u202eবাজার\n'), 'কক্সবাজার');
  assert.equal(cleanTrip('ক'.repeat(60)).length, 40);
  assert.equal(validateLedger({ ...exampleLedger, trip: '  সাজেক   ট্যুর ' }).trip, 'সাজেক ট্যুর');
  assert.equal(validateLedger({ people: exampleLedger.people, expenses: [] }).trip, '');
  assert.throws(() => validateLedger({ ...exampleLedger, trip: 'ক'.repeat(41) }));
});

test('the server normalizes links and previews them with the trip and group size', () => {
  const state = ledgerHash(exampleLedger).slice(1);
  assert.equal(share.normalize(state), state);
  assert.equal(share.normalize('p=রাফি'), null);
  assert.equal(share.preview(state).title, 'কক্সবাজার ট্যুর: ৫ জনের হিসাব মিলেছে');
  assert.match(share.preview(state).description, /মোট ৳২০,৪৫০, জনপ্রতি ৳৪,০৯০/);
});

test('slip amounts show taka in Bangla digits, paisa only when needed', () => {
  assert.deepEqual([formatTaka(2_045_000), formatTaka(1999), formatTaka(1_00_000_00)], ['৳২০,৪৫০', '৳১৯.৯৯', '৳১,০০,০০০']);
});

test('the report leads with who pays whom and names the trip', () => {
  const report = ledgerReport(exampleLedger);
  assert.ok(report.startsWith('কক্সবাজার ট্যুর'));
  assert.ok(report.indexOf('মিম → রাফি') < report.indexOf('খরচের লিস্ট'));
});

function fakeCanvas() {
  const texts: Array<{ text: string; y: number }> = [];
  let font = '16px x';
  const context = new Proxy({}, {
    get: (_, key) => key === 'font' ? font
      : key === 'measureText' ? (text: string) => ({ width: text.length * Number(/(\d+)px/.exec(font)![1]) * 0.5 })
      : key === 'fillText' ? (text: string, _x: number, y: number) => texts.push({ text, y })
      : () => {},
    set: (_, key, value) => { if (key === 'font') font = value; return true; },
  });
  return { canvas: { width: 0, height: 0, getContext: () => context } as unknown as HTMLCanvasElement, texts };
}

test('the slip shows trip, totals, every transfer and the human line, clear of the footer and story safe zone', () => {
  const eight = { trip: 'ইফতার পার্টি', people: Array.from({ length: 8 }, (_, index) => ({ id: String(index), name: `বন্ধু ${index + 1}` })), expenses: [{ id: 'a', label: 'ইফতার', payerId: '0', amount: 800_000 }] };
  for (const [ledger, format, height, footer] of [[exampleLedger, 'feed', 1350, 96], [eight, 'story', 1920, 260]] as const) {
    const result = calculateLedger(ledger);
    const { canvas, texts } = fakeCanvas();
    drawCard(canvas, result, format, 'example.com');
    const all = texts.map(item => item.text);
    for (const part of [ledger.trip ?? "", formatTaka(result.total), ledgerLine(result), ...result.transfers.map(transfer => formatTaka(transfer.amount))]) assert.ok(all.includes(part), part);
    const body = texts.filter(item => ![SLIP_ASK, 'example.com', 'হিসাব মিলেছে'].includes(item.text));
    assert.ok(body.every(item => item.y < height - footer - 20 && (format === 'feed' || item.y > 250)), format);
  }
});
