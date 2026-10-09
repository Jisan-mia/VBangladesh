import { createHash, randomBytes } from 'node:crypto';
import { db, transaction } from './db';

const ID_ALPHABET = '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
export const SHARE_ID = /^[2-9a-km-np-zA-HJ-NP-Z]{8}$/;
const TOTAL = '__total__';
const YEAR = 365 * 24 * 60 * 60 * 1000;

export type Tally = { total: number; counts: Record<string, number> };

function newId() {
  return [...randomBytes(8)].map(byte => ID_ALPHABET[byte % ID_ALPHABET.length]).join('');
}

/** Same card, same link: an identical (tool, state) pair reuses its id. */
export function createShare(tool: string, state: string): string {
  const existing = db().prepare('SELECT id FROM shares WHERE tool = ? AND state = ?').get(tool, state) as { id: string } | undefined;
  if (existing) return existing.id;
  const now = Date.now();
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = newId();
    try {
      db().prepare('INSERT INTO shares (id, tool, state, created_at) VALUES (?, ?, ?, ?)').run(id, tool, state, now);
      // shortcut: expiry runs on ~1% of writes instead of a cron; fine until shares number in the millions.
      if (Math.random() < 0.01) db().prepare('DELETE FROM shares WHERE created_at < ?').run(now - YEAR);
      return id;
    } catch (error) {
      if (!String(error).includes('UNIQUE')) throw error;
    }
  }
  throw new Error('Could not allocate a share id.');
}

export function getShare(id: string): { tool: string; state: string } | undefined {
  if (!SHARE_ID.test(id)) return undefined;
  return db().prepare('SELECT tool, state FROM shares WHERE id = ?').get(id) as { tool: string; state: string } | undefined;
}

export function readTally(tool: string): Tally {
  const rows = db().prepare('SELECT item, count FROM tally_counts WHERE tool = ?').all(tool) as Array<{ item: string; count: number }>;
  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    if (row.item === TOTAL) total = row.count;
    else counts[row.item] = row.count;
  }
  return { total, counts };
}

/** One vote per browser token per tool; voting again replaces the earlier picks instead of adding to them. */
export function recordTally(tool: string, token: string, items: readonly string[]): Tally {
  const voter = createHash('sha256').update(`${tool}:${token}`).digest('base64url').slice(0, 24);
  transaction(() => {
    const previous = db().prepare('SELECT items FROM tally_votes WHERE tool = ? AND voter = ?').get(tool, voter) as { items: string } | undefined;
    const before = new Set<string>(previous ? JSON.parse(previous.items) : []);
    const after = new Set(items);
    const bump = db().prepare('INSERT INTO tally_counts (tool, item, count) VALUES (?, ?, ?) ON CONFLICT (tool, item) DO UPDATE SET count = count + excluded.count');
    for (const item of after) if (!before.has(item)) bump.run(tool, item, 1);
    for (const item of before) if (!after.has(item)) bump.run(tool, item, -1);
    if (!previous) bump.run(tool, TOTAL, 1);
    db().prepare('INSERT INTO tally_votes (tool, voter, items, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT (tool, voter) DO UPDATE SET items = excluded.items, updated_at = excluded.updated_at').run(tool, voter, JSON.stringify([...after]), Date.now());
  });
  return readTally(tool);
}

export function addSuggestion(tool: string, text: string) {
  db().prepare('INSERT INTO suggestions (tool, text, created_at) VALUES (?, ?, ?)').run(tool, text, Date.now());
}
