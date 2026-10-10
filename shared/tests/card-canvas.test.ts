import assert from 'node:assert/strict';
import test from 'node:test';
import { siteLabel, wrapText } from '../card-canvas';

const byLength = { measureText: (text: string) => ({ width: text.length }) as TextMetrics };

test('text wraps at the width limit', () => {
  assert.deepEqual(wrapText(byLength, 'আমার সোনার বাংলা আমি তোমায় ভালোবাসি', 12, 5), ['আমার সোনার', 'বাংলা আমি', 'তোমায়', 'ভালোবাসি']);
});

test('overflowing text stops at the line limit and says so', () => {
  assert.deepEqual(wrapText(byLength, 'এক দুই তিন চার পাঁচ', 7, 2), ['এক দুই', 'তিন চার…']);
});

test('a single long word still gets its own line', () => {
  assert.deepEqual(wrapText(byLength, 'অন্তর্জালবিহীন', 4, 2), ['অন্তর্জালবিহীন']);
});

test('cards print the real domain, but never a local preview address', () => {
  assert.equal(siteLabel('ektukhani.com'), 'ektukhani.com');
  for (const local of ['127.0.0.1:3100', 'localhost:3000', '192.168.0.5:3100', '', 'mac.local']) assert.equal(siteLabel(local), 'একটুখানি');
});
