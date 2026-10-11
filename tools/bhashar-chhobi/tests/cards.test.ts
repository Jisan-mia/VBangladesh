import test from 'node:test';
import assert from 'node:assert/strict';
import { cardText, cleanWord, defaultCard, limitText, objects, parseShareHash, previewTitle, selectCardObject, shareHash, MAX_WORD, type LanguageCard } from '../lib/cards';
import { districts, divisions } from '../lib/districts';
import { share } from '../share';

test('limits preserve complete Bangla graphemes', () => {
  assert.equal(limitText('ক্ষক্ষক্ষ', 2), 'ক্ষক্ষ');
  assert.equal(limitText('আমার\nভাষা', 20), 'আমার ভাষা');
});

test('all illustrated objects have unique IDs and Bangla names', () => {
  assert.equal(new Set(objects.map(object => object.id)).size, objects.length);
  assert.ok(objects.every(object => /[ঀ-৿]/.test(object.name)));
});

test("selecting the current object preserves the person's own word", () => {
  const card: LanguageCard = { ...defaultCard, word: 'নিজের শব্দ' };
  assert.equal(selectCardObject(card, card.objectId), card);
});

test("switching the picture clears the old word and keeps the person's district", () => {
  const changed = selectCardObject({ objectId: 'guava', word: 'নিজের শব্দ', district: 'cumilla' }, 'kite');
  assert.deepEqual(changed, { objectId: 'kite', word: '', district: 'cumilla' });
  assert.equal(cardText(changed).word, 'ঘুড়ি');
});

test('the district list has all 64 districts in 8 divisions, each once', () => {
  assert.equal(divisions.length, 8);
  assert.equal(districts.length, 64);
  assert.equal(new Set(districts.map(district => district.id)).size, 64);
  assert.equal(new Set(districts.map(district => district.name)).size, 64);
  assert.ok(districts.every(district => /^[a-z]+$/.test(district.id) && /^[ঀ-৿]+$/.test(district.name)));
});

test('a card survives the share-link round trip', () => {
  const card: LanguageCard = { objectId: 'top', word: 'নিজের শব্দ', district: 'sylhet' };
  assert.deepEqual(parseShareHash(shareHash(card)), card);
});

test('anchors and hostile links are rejected or cleaned instead of crashing', () => {
  for (const hash of ['', '#result', '#o=car', '#w=শব্দ&d=dhaka']) assert.equal(parseShareHash(hash), null);
  assert.equal(parseShareHash('#o=fish&d=atlantis')?.district, '');
  assert.equal(parseShareHash('#o=fish&d=__proto__')?.district, '');
  assert.equal(parseShareHash(`#o=fish&w=${encodeURIComponent('  ক‮থা\n ')}`)?.word, 'ক থা');
  assert.equal(parseShareHash(`#o=fish&w=${encodeURIComponent('অ'.repeat(300))}`)?.word.length, MAX_WORD);
});

test('words are stored in one Unicode form so the same card makes the same link', () => {
  const decomposed = 'পেয়ারা'.normalize('NFD');
  assert.equal(cleanWord(decomposed), 'পেয়ারা'.normalize('NFC'));
  assert.equal(shareHash({ ...defaultCard, word: decomposed }), shareHash({ ...defaultCard, word: 'পেয়ারা'.normalize('NFC') }));
});

test('the card puts the district first and shows the book name only when the word differs', () => {
  const text = cardText({ objectId: 'kite', word: 'নিজের শব্দ', district: 'dhaka' });
  assert.equal(text.kicker, 'ঢাকা জেলায় এটাকে বলে');
  assert.equal(text.bookName, 'ঘুড়ি');
  assert.equal(cardText({ objectId: 'kite', word: '', district: '' }).kicker, 'আমাদের এলাকায় এটাকে বলে');
  assert.equal(cardText({ objectId: 'kite', word: 'ঘুড়ি', district: '' }).bookName, '');
});

test("a friend's word for the same picture shows up on the card", () => {
  const friend: LanguageCard = { objectId: 'kite', word: 'বন্ধুর শব্দ', district: 'rangpur' };
  assert.equal(cardText({ objectId: 'kite', word: 'আমার শব্দ', district: 'dhaka' }, friend).match, 'রংপুর জেলায় বলে “বন্ধুর শব্দ”');
  assert.equal(cardText({ objectId: 'kite', word: 'বন্ধুর শব্দ', district: '' }, friend).match, 'বন্ধুর ওখানেও ঠিক এই নাম!');
  assert.equal(cardText({ objectId: 'fish', word: '', district: '' }, friend).match, '');
});

test('the share API normalizes, previews personally and only counts district ids', () => {
  const card: LanguageCard = { objectId: 'guava', word: 'নিজের শব্দ', district: 'cumilla' };
  assert.equal(share.normalize('o=nope'), null);
  assert.equal(share.normalize(shareHash(card).slice(1)), shareHash(card).slice(1));
  assert.equal(share.preview(shareHash(card).slice(1)).title, 'কুমিল্লা জেলায় পেয়ারাকে বলে “নিজের শব্দ”। তোমাদের ওখানে কী বলে?');
  assert.equal(previewTitle({ objectId: 'lotus', word: '', district: '' }), 'আমাদের এলাকায় শাপলাকে বলে “শাপলা”। তোমাদের ওখানে কী বলে?');
  assert.deepEqual(share.tally, districts.map(district => district.id));
});
