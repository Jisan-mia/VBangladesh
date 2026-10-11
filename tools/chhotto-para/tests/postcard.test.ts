import test from 'node:test';
import assert from 'node:assert/strict';
import { share } from '../share';
import { cardText, decodeItems, encodeItems, memoryLine, parseShareHash, shareHash, type Postcard } from '../lib/postcard';
import { boundPosition, MAX_OBJECTS, objects, rooftopScene, starterScene, type ObjectKind } from '../lib/scene';

const card: Postcard = { setting: 'courtyard', items: starterScene(), place: 'কাশিমপুর', district: 'গাজীপুর', name: 'রাফি' };
const strip = (items: Postcard['items']) => items.map(({ kind, x, y }) => ({ kind, x, y }));

test('a postcard round-trips through its link with every object in place and order', () => {
  const parsed = parseShareHash('#' + shareHash(card));
  assert.deepEqual(strip(parsed!.items), strip(card.items));
  assert.deepEqual({ ...parsed, items: [] }, { ...card, items: [] });
  assert.equal(parseShareHash(shareHash({ ...card, setting: 'rooftop', items: rooftopScene() }))?.setting, 'rooftop');
});

test('every object kind and the corners of the ground survive encoding', () => {
  const kinds = Object.keys(objects) as ObjectKind[];
  const items = kinds.map((kind, index) => ({ id: String(index), kind, ...boundPosition({ x: 125 + index * 50, y: 425 }) })).slice(0, MAX_OBJECTS);
  assert.deepEqual(decodeItems(encodeItems(items)).map(item => item.kind), kinds.slice(0, MAX_OBJECTS));
  assert.equal(encodeItems(items).length, items.length * 5);
});

test('hostile links are rejected or pulled back onto the ground', () => {
  for (const hash of ['', '#tool', '#result', '#o=', '#o=ABCD', '#o=<scrip', '#o=' + 'A____'.repeat(MAX_OBJECTS + 1)]) assert.equal(parseShareHash(hash), null, hash);
  const far = decodeItems('A____');
  assert.equal(far.length, 1);
  assert.ok(Math.abs(far[0].x - 480) / 355 + Math.abs(far[0].y - 425) / 180 <= 1.000001);
  assert.deepEqual(decodeItems('_AAAAAAAAA').map(item => item.kind), ['house']);
});

test('place, district and name are cleaned and capped', () => {
  const parsed = parseShareHash(shareHash(card).replace(/p=[^&]+/, 'p=' + encodeURIComponent('  কাশি‮ম\u0000পুর ' + 'ক'.repeat(40))));
  assert.ok(parsed && parsed.place.length === 24 && !/[\u0000‮]/.test(parsed.place));
});

test('the card line follows the most recently placed object with a memory', () => {
  assert.equal(memoryLine(starterScene(), 'courtyard'), memoryLine([{ id: 'k', kind: 'kite', x: 480, y: 425 }], 'courtyard'));
  const withTea = [...starterScene(), { id: 't', kind: 'tea' as const, x: 480, y: 425 }];
  assert.match(memoryLine(withTea, 'courtyard'), /চায়ের/);
  assert.notEqual(memoryLine([], 'rooftop'), memoryLine([], 'courtyard'));
});

test('card text falls back gracefully without a place or a name', () => {
  assert.deepEqual(cardText(card), { place: 'কাশিমপুর', district: 'গাজীপুর', greeting: 'কাশিমপুর থেকে', line: memoryLine(card.items, 'courtyard'), signature: 'ইতি, রাফি' });
  const bare = cardText({ ...card, place: ' ', district: '', name: '' });
  assert.equal(bare.greeting, 'আমার পাড়া থেকে');
  assert.equal(bare.signature, '');
});

test('share previews are personal and normalize is stable', () => {
  const state = shareHash(card);
  assert.equal(share.normalize(state), state);
  assert.equal(share.normalize('hello'), null);
  assert.equal(share.preview(state).title, 'কাশিমপুর থেকে রাফির পোস্টকার্ড। তোমার পাড়াটা কেমন ছিল?');
  assert.equal(share.preview(shareHash({ ...card, place: '' })).title, 'রাফির পাড়ার পোস্টকার্ড। তোমার পাড়াটা কেমন ছিল?');
  assert.equal(share.preview(shareHash({ ...card, place: '', name: '' })).title, 'এক বন্ধুর পাড়ার পোস্টকার্ড। তোমার পাড়াটা কেমন ছিল?');
  assert.equal(share.preview(shareHash({ ...card, name: '' })).title, 'কাশিমপুর থেকে একটা পোস্টকার্ড। তোমার পাড়াটা কেমন ছিল?');
  assert.equal(share.tally, undefined);
});
