import assert from 'node:assert/strict';
import test from 'node:test';
import { catalog } from '../../lib/catalog';
import { makeSearch, phoneticKey, transliterate } from '../../lib/search';

test('Bangla and the many Banglish spellings meet on one key', () => {
  assert.equal(transliterate('আমার ছোটবেলা'), 'amar chatabela');
  for (const spelling of ['chotobela', 'chhotobela', 'chotobella', 'ছোটবেলা']) assert.equal(phoneticKey(spelling), 'catabela', spelling);
  assert.equal(phoneticKey('ভর্তা'), phoneticKey('bhorta'));
  assert.equal(phoneticKey('বিয়ে'), phoneticKey('biye'));
  assert.equal(phoneticKey('ঘুড়ি'), phoneticKey('ghuri'));
});

const search = makeSearch(catalog, { 'bidyut-bill': ['electricity bill'], 'cholo-kheli': ['ludo'] });
const top = (query: string) => search(query)[0]?.slug;

test('finds tools by Bangla, Banglish and English', () => {
  assert.equal(top('ছোটবেলা'), 'amar-chhotobela');
  assert.equal(top('amar chotobela'), 'amar-chhotobela');
  assert.equal(top('chhotobela'), 'amar-chhotobela');
  assert.equal(top('bhorta'), 'bhorta');
  assert.equal(top('electricity'), 'bidyut-bill');
  assert.ok(search('ludo').some(tool => tool.slug === 'cholo-kheli'));
});

test('every word must match, and an empty query lists everything in catalog order', () => {
  assert.equal(search('').length, catalog.length);
  assert.equal(search('   ')[0].slug, catalog[0].slug);
  assert.deepEqual(search('ছোটবেলা zzzzqq'), []);
  assert.deepEqual(search('xqzv'), []);
});
