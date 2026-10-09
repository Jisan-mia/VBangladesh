import assert from 'node:assert/strict';
import test from 'node:test';
import { allocatePoisha, calculateLedger, initialLedger, inputAmount, ledgerReport, MAX_EXPENSE_AMOUNT, parsePoisha, removePerson, validateLedger, type Ledger } from '../lib/ledger';

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
