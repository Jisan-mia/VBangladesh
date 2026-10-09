import assert from 'node:assert/strict';
import { test } from 'node:test';
import { publicOrigin, serializeSchema } from '../seo';

test('an unpublished preview has no invented public domain', () => {
  assert.equal(publicOrigin(undefined), undefined);
});

test('a public origin must use HTTPS and contain no credentials or path', () => {
  for (const value of ['http://example.org', 'https://name:secret@example.org', 'https://example.org/app', 'https://example.org?key=value']) {
    assert.throws(() => publicOrigin(value));
  }
  assert.equal(publicOrigin('https://example.org/'), 'https://example.org');
});

test('schema text cannot terminate its enclosing script', () => {
  const value = { name: '</script><script>alert(1)</script>' };
  const serialized = serializeSchema(value);
  assert.ok(!serialized.includes('<'));
  assert.deepEqual(JSON.parse(serialized), value);
});
