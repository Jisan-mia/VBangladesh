import assert from 'node:assert/strict';
import test from 'node:test';
import { catalog } from '../catalog';
import { searchKeywords } from '../search-keywords';

test('every tool has search keywords, and no unknown tool has any', () => {
  const slugs = catalog.map((tool) => tool.slug).sort();
  assert.deepEqual(Object.keys(searchKeywords).sort(), slugs);
});

test('each tool has 6 to 14 unique, non-empty keywords of at most 40 characters', () => {
  for (const [slug, words] of Object.entries(searchKeywords)) {
    assert.ok(words.length >= 6 && words.length <= 14, `${slug} has ${words.length} keywords`);
    assert.equal(new Set(words).size, words.length, `${slug} has a repeated keyword`);
    for (const word of words) {
      assert.ok(word.length > 0 && word.length <= 40, `${slug}: "${word}" is empty or too long`);
      assert.equal(word, word.trim(), `${slug}: "${word}" has spaces at the edges`);
      assert.equal(word, word.normalize('NFC'), `${slug}: "${word}" is not NFC`);
      assert.equal(word, word.toLowerCase(), `${slug}: "${word}" has capital letters`);
    }
  }
});
