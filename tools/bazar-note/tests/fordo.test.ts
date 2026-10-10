import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBasket, exportList, basketTotal, type Item } from '../lib/basket';
import { cleanText, fordoHash, fordoLine, fordoTitle, parseFordo, possessive, readTicks, SHARE_BUDGET, tickKey, toggleTick, type Fordo } from '../lib/fordo';
import { presetIds, presetItems, presets } from '../lib/presets';
import { share } from '../share';
import { MAX_SHARE_STATE } from '../../../shared/share-types';

const items: Item[] = [
  { id: 'a', name: 'চাল', quantity: 500, unit: 'kg', unitPrice: 7500 },
  { id: 'b', name: 'রসুন', quantity: 25000, unit: 'gram', unitPrice: null },
  { id: 'c', name: 'ডিম', quantity: 100, unit: 'dozen', unitPrice: 15000 },
];
const fordo: Fordo = { name: 'আম্মু', preset: 'week', items, budget: 200000, money: true };

test('every preset is a valid starter list with no invented prices', () => {
  for (const id of presetIds) {
    const list = presetItems(id);
    assert.deepEqual(validateBasket({ items: list, budget: null }).items, list, id);
    assert.ok(list.length >= 10, id);
    assert.ok(list.every(item => item.unitPrice === null), id);
    assert.equal(new Set(list.map(item => item.name)).size, list.length, `${id}: no duplicate items`);
  }
  assert.equal(presetItems('week').length, 12);
  assert.ok(presets.roza.items.some(([name]) => name === 'ছোলা'));
});

test('a list with no prices yet has a zero total and no fake sum in the text', () => {
  const list = { items: presetItems('roza'), budget: 150000 };
  assert.equal(basketTotal(list), 0);
  const text = exportList(list, 'money', 'রোজার বাজারের ফর্দ');
  assert.match(text, /^রোজার বাজারের ফর্দ/);
  assert.match(text, /বাজেট: ১,৫০০.০০ টাকা/);
  assert.doesNotMatch(text, /মোট|বাকি|বেশি/);
});

test('fordo state round-trips through the link, with and without money', () => {
  const parsed = parseFordo(fordoHash(fordo))!;
  assert.deepEqual(parsed.items.map(({ id, ...item }) => item), items.map(({ id, ...item }) => item));
  assert.equal(parsed.name, 'আম্মু');
  assert.equal(parsed.preset, 'week');
  assert.equal(parsed.budget, 200000);
  assert.equal(fordoHash(parsed), fordoHash(fordo));
  assert.equal(share.normalize(fordoHash(fordo)), fordoHash(fordo));
  const plain = parseFordo(fordoHash({ ...fordo, money: false }))!;
  assert.equal(plain.budget, null);
  assert.ok(plain.items.every(item => item.unitPrice === null));
  assert.equal(plain.money, false);
});

test('hostile links are cleaned or refused, never trusted', () => {
  for (const hash of ['', '#', 'n=আম্মু', 'i=', 'i=*100*kg', 'i=চাল*0*kg', 'i=চাল*100*bag', 'i=চাল*1.5*kg', 'i=চাল*100*kg*-5', 'i=চাল*100*kg*1*2', 'i=চাল*99999999*kg', 'i=চাল*100*kg*1000000000']) {
    assert.equal(parseFordo(hash), null, hash);
    assert.equal(share.normalize(hash), null, hash);
  }
  const messy = parseFordo('n=%E2%80%AEevil%0Aname&p=__proto__&b=abc&i=%E2%80%AEচাল%0A*100*kg&i=bad*x*kg')!;
  assert.equal(messy.name, 'evil name');
  assert.equal(messy.preset, '');
  assert.equal(messy.budget, null);
  assert.deepEqual(messy.items.map(item => item.name), ['চাল']);
  assert.equal(cleanText('  চা*ল  ', 30), 'চা ল');
});

test('long lists are capped so the link always fits what the server accepts', () => {
  const huge: Fordo = { ...fordo, name: 'ক'.repeat(100), items: Array.from({ length: 100 }, (_, index) => ({ id: String(index), name: 'অনেক লম্বা নামের একটা জিনিস যেটা কেউ লিখবে না'.repeat(2), quantity: 999999, unit: 'packet', unitPrice: 99999999 })) };
  const state = fordoHash(huge);
  assert.ok(state.length <= SHARE_BUDGET && SHARE_BUDGET < MAX_SHARE_STATE);
  const parsed = parseFordo(state)!;
  assert.ok(parsed.items.length > 5 && parsed.items.length < 100);
  assert.equal(parsed.name.length, 24);
  assert.equal(fordoHash(parsed), state);
});

test('titles, previews and the human line come from the list', () => {
  assert.equal(possessive('আম্মু'), 'আম্মুর');
  assert.equal(possessive('রহিম'), 'রহিমের');
  assert.equal(share.preview(fordoHash({ ...fordo, items: presetItems('week') })).title, 'আম্মুর বাজারের ফর্দ — ১২টা জিনিস');
  assert.equal(share.preview(fordoHash({ ...fordo, name: '', preset: 'roza' })).title, 'রোজার বাজারের ফর্দ — ৩টা জিনিস');
  assert.equal(share.preview('junk').title, 'বাজারের ফর্দ');
  assert.equal(fordoTitle({ name: '', preset: '' }), 'বাজারের ফর্দ');
  assert.equal(fordoLine({ ...fordo, budget: 100 }), 'বাজেট একটু ছাড়িয়ে যাচ্ছে, দরদাম করে কিনো কিন্তু!');
  assert.equal(fordoLine({ ...fordo, budget: 100, money: false }), presets.week.line);
});

test('shopper ticks are per list, survive bad storage and ignore stray indexes', () => {
  assert.notEqual(tickKey('i=a*100*kg'), tickKey('i=b*100*kg'));
  assert.equal(tickKey('i=a*100*kg'), tickKey('i=a*100*kg'));
  const storage = (value: string | null) => ({ getItem: () => value });
  assert.deepEqual(readTicks(storage('[2,0,0,7,-1,1.5,"1"]'), 'k', 3), [0, 2]);
  assert.deepEqual(readTicks(storage('{broken'), 'k', 3), []);
  assert.deepEqual(readTicks(storage('{"a":1}'), 'k', 3), []);
  assert.deepEqual(readTicks({ getItem: () => { throw new Error('blocked'); } }, 'k', 3), []);
  assert.deepEqual(toggleTick([0, 2], 1), [0, 1, 2]);
  assert.deepEqual(toggleTick([0, 1, 2], 1), [0, 2]);
});
