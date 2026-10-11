import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'ektukhani-api-'));
const { POST: createShare } = await import('../../app/api/share/route');
const tally = await import('../../app/api/tally/[tool]/route');
const { POST: suggest } = await import('../../app/api/suggest/route');
const { getShare } = await import('../../lib/server/store');

const post = (body: unknown, headers: Record<string, string> = {}) => new Request('http://localhost/api', { method: 'POST', body: JSON.stringify(body), headers: { host: 'localhost', ...headers } });
const context = (tool: string) => ({ params: Promise.resolve({ tool }) });

test('a valid card gets a short link, and the same card gets the same link', async () => {
  const first = await (await createShare(post({ tool: 'amar-chhotobela', state: '#m=5&n=রাফি&d=90' }))).json();
  const again = await (await createShare(post({ tool: 'amar-chhotobela', state: 'm=5&n=রাফি&d=90' }))).json();
  assert.match(first.path, /^\/s\/[2-9a-zA-Z]{8}$/);
  assert.equal(again.id, first.id);
  assert.deepEqual({ ...getShare(first.id) }, { tool: 'amar-chhotobela', state: 'm=5&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF&d=90' });
});

test('unknown tools, empty states and tools without sharing are rejected', async () => {
  for (const body of [{ tool: 'nope', state: 'm=5' }, { tool: 'amar-chhotobela', state: 'm=0' }, { tool: 'amar-chhotobela', state: 'x'.repeat(9000) }, { tool: 'bhara', state: 'a=1' }]) {
    assert.equal((await createShare(post(body))).status, 400);
  }
});

test('writes from another site are refused', async () => {
  assert.equal((await createShare(post({ tool: 'amar-chhotobela', state: 'm=5' }, { origin: 'https://evil.example' }))).status, 403);
});

test('a browser voting again replaces its picks instead of counting twice', async () => {
  const token = 'tokentokentokentoken';
  await tally.POST(post({ token, items: ['kite', 'pond'] }), context('amar-chhotobela'));
  const after = await (await tally.POST(post({ token, items: ['kite', 'salami'] }), context('amar-chhotobela'))).json();
  assert.equal(after.total, 1);
  assert.deepEqual([after.counts.kite, after.counts.pond, after.counts.salami], [1, 0, 1]);
  const other = await (await tally.POST(post({ token: 'anothertokenanother', items: ['kite'] }), context('amar-chhotobela'))).json();
  assert.deepEqual([other.total, other.counts.kite], [2, 2]);
});

test('a vote group keeps one vote per page, and prefix trims the reply', async () => {
  const token = 'grouptokengrouptoken';
  await tally.POST(post({ token, items: ['kite'], group: 'p1' }), context('amar-chhotobela'));
  const both = await (await tally.POST(post({ token, items: ['pond'], group: 'p2' }), context('amar-chhotobela'))).json();
  assert.ok(both.counts.kite >= 1 && both.counts.pond >= 1);
  const again = await (await tally.POST(post({ token, items: ['salami'], group: 'p1' }), context('amar-chhotobela'))).json();
  assert.equal(again.counts.kite, both.counts.kite - 1);
  assert.equal((await tally.POST(post({ token, items: ['kite'], group: 'bad group!' }), context('amar-chhotobela'))).status, 400);
  const trimmed = await (await tally.GET(new Request('http://localhost/api?prefix=po'), context('amar-chhotobela'))).json();
  assert.deepEqual(Object.keys(trimmed.counts), ['pond']);
});

test('tally rejects items the tool does not have and bad tokens', async () => {
  assert.equal((await tally.POST(post({ token: 'tokentokentokentoken', items: ['made-up'] }), context('amar-chhotobela'))).status, 400);
  assert.equal((await tally.POST(post({ token: 'short', items: ['kite'] }), context('amar-chhotobela'))).status, 400);
  assert.equal((await tally.GET(new Request('http://localhost'), context('bhara'))).status, 404);
});

test('suggestions are trimmed, bounded and tied to a real tool', async () => {
  assert.equal((await suggest(post({ tool: 'amar-chhotobela', text: '  মার্বেল খেলা‮ যোগ করো  ' }))).status, 201);
  assert.equal((await suggest(post({ tool: 'amar-chhotobela', text: 'x'.repeat(301) }))).status, 400);
  assert.equal((await suggest(post({ tool: 'nope', text: 'হ্যালো' }))).status, 400);
});
