import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHundredths, formatQuantity, lineTotal, basketTotal, validateBasket, exportList, type Basket } from '../lib/basket';
import { loadBasket, saveBasket, STORAGE_KEY } from '../lib/storage';

const basket: Basket = { items: [
  { id: 'rice', name: 'চাল', quantity: 150, unit: 'kg', unitPrice: 12050 },
  { id: 'egg', name: 'ডিম', quantity: 200, unit: 'piece', unitPrice: 1000 },
], budget: 19000 };

test('Bangla and Latin decimals become exact hundredths', () => {
  assert.equal(parseHundredths('১.৫০'), 150);
  assert.equal(parseHundredths('120.50'), 12050);
  assert.equal(parseHundredths(' ০ '), 0);
});
test('empty, negative, incomplete and malformed amounts fail instead of becoming zero', () => {
  for (const value of ['', ' ', '-1', '+1', '1.', '.5', '1e2', 'Infinity', 'NaN', '1,000', '১২.৩৪৫', '1 2', '1000000']) {
    assert.throws(() => parseHundredths(value), Error, value);
  }
});
test('fractional line totals round once before summing', () => {
  assert.equal(lineTotal(basket.items[0]), 18075);
  assert.equal(lineTotal(basket.items[1]), 2000);
  assert.equal(basketTotal(basket), 20075);
  assert.equal(basket.budget! - basketTotal(basket), -1075);
  assert.equal(lineTotal({ ...basket.items[0], quantity: 150, unitPrice: 1 }), 2);
});
test('storage validation rejects corrupt shapes, duplicate IDs and unsafe quantities', () => {
  assert.deepEqual(validateBasket(basket), basket);
  for (const value of [null, {}, { ...basket, budget: -1 }, { ...basket, items: [basket.items[0], basket.items[0]] },
    { ...basket, items: [{ ...basket.items[0], quantity: 0 }] },
    { ...basket, items: [{ ...basket.items[0], unit: 'bag' }] },
    { ...basket, items: [{ ...basket.items[0], unitPrice: 0.5 }] },
    { ...basket, items: [{ ...basket.items[0], name: 'চাল\nমোট ০' }] }]) {
    assert.throws(() => validateBasket(value));
  }
});
test('default export contains items and units without prices, total or budget', () => {
  const text = exportList(basket, 'items');
  assert.match(text, /চাল — ১.৫ কেজি/);
  assert.match(text, /ডিম — ২ পিস/);
  for (const privateText of ['১২০.৫০', '১৮০.৭৫', '২০০.৭৫', '১৯০.০০', 'বাজেট', '৳']) assert.ok(!text.includes(privateText), privateText);
});
test('money export uses the same line totals and labels an over-budget basket', () => {
  const text = exportList(basket, 'money');
  assert.match(text, /১৮০.৭৫/);
  assert.match(text, /২০০.৭৫/);
  assert.match(text, /বাজেটের বেশি: ১০.৭৫/);
  assert.match(text, /প্রতি কেজি/);
});
test('explicit save refuses to overwrite unreadable stored data', () => {
  let record = '{broken';
  const storage = { getItem: () => record, setItem: (_key: string, value: string) => { record = value; } };
  assert.throws(() => saveBasket(storage, basket));
  assert.equal(record, '{broken');
});
test('save and reopen retain quantities, unit basis and zero prices', () => {
  const records = new Map<string, string>();
  const storage = { getItem: (key: string) => records.get(key) ?? null, setItem: (key: string, value: string) => { records.set(key, value); } };
  const freeBasket = { ...basket, items: [{ ...basket.items[0], unitPrice: 0 }] };
  saveBasket(storage, freeBasket);
  assert.ok(records.has(STORAGE_KEY));
  assert.deepEqual(loadBasket(storage), freeBasket);
});
test('blocked or full storage reports failure without changing the supplied basket', () => {
  const before = JSON.stringify(basket);
  const storage = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); } };
  assert.throws(() => saveBasket(storage, basket), /QuotaExceededError/);
  assert.equal(JSON.stringify(basket), before);
});

test('maximum permitted baskets keep exact safe integer arithmetic', () => {
  const item = { ...basket.items[0], quantity: 999999, unitPrice: 99999999 };
  const expected = Number((999999n * 99999999n + 50n) / 100n);
  const largestBasket = { items: Array.from({ length: 100 }, (_, index) => ({ ...item, id: String(index) })), budget: null };
  assert.equal(lineTotal(item), expected);
  assert.equal(basketTotal(validateBasket(largestBasket)), expected * 100);
  assert.ok(Number.isSafeInteger(basketTotal(largestBasket)));
});


test('restored numeric fields use Bengali digits and round-trip without losing a poisha', () => {
  assert.equal(formatQuantity(150), '১.৫');
  assert.equal(formatQuantity(19000), '১৯০');
  for (const amount of [0, 1, 10, 101, 150, 12050, 999999, 99999999]) {
    const restoredInput = formatQuantity(amount);
    assert.doesNotMatch(restoredInput, /[0-9,]/);
    assert.equal(parseHundredths(restoredInput), amount);
  }
});
