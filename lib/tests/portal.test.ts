import assert from 'node:assert/strict';
import test from 'node:test';
import { allGames, bigTiles, featured, gameFilters, games, gameTags, gridOrder, kidsFilters, kidsGames, kidsTags, newestGames, otherTools, tagsOf } from '../portal';
import { parseRecent } from '../recent';
import { tileSlugs } from '../tiles';
import { catalog } from '../catalog';

test('the portal splits the catalog into games, kids games and other tools with nothing lost', () => {
  assert.equal(games.length + kidsGames.length + otherTools.length, catalog.length);
  assert.deepEqual(allGames.map(tool => tool.slug).sort(), [...games, ...kidsGames].map(tool => tool.slug).sort());
});

test('every game has at least one known tag, and only games are tagged', () => {
  const ids = new Set(gameFilters.map(filter => filter.id));
  assert.deepEqual(Object.keys(gameTags).sort(), games.map(tool => tool.slug).sort());
  for (const [slug, tags] of Object.entries(gameTags)) {
    assert.ok(tags.length > 0, `${slug} has a tag`);
    assert.ok(tags.every(tag => ids.has(tag)), `${slug} uses known tags`);
  }
  const kidIds = new Set(kidsFilters.map(filter => filter.id));
  assert.deepEqual(Object.keys(kidsTags).sort(), kidsGames.map(tool => tool.slug).sort());
  assert.ok(Object.values(kidsTags).every(tag => kidIds.has(tag)));
});

test('each filter has enough games to be worth a chip', () => {
  for (const filter of gameFilters) assert.ok(games.filter(tool => tagsOf(tool.slug).includes(filter.id)).length >= 5, filter.name);
  for (const filter of kidsFilters) assert.ok(kidsGames.filter(tool => tagsOf(tool.slug).includes(filter.id)).length >= 3, filter.name);
});

test('the editorial picks are 8 to 12 distinct games, and the big tiles come from them', () => {
  assert.ok(featured.length >= 8 && featured.length <= 12);
  assert.equal(new Set(featured).size, featured.length);
  assert.ok(featured.every(slug => games.some(tool => tool.slug === slug)));
  assert.ok([...bigTiles].every(slug => featured.includes(slug)));
});

test('the home grid lists every game once, picks spread out', () => {
  const order = gridOrder().map(tool => tool.slug);
  assert.deepEqual([...order].sort(), games.map(tool => tool.slug).sort());
  const bigAt = order.flatMap((slug, index) => bigTiles.has(slug) ? [index] : []);
  for (let i = 1; i < bigAt.length; i++) assert.ok(bigAt[i] - bigAt[i - 1] >= 8, 'big tiles at least 8 places apart');
});

test('newest games start from the end of the catalog and mix in kids games', () => {
  const fresh = newestGames(9);
  assert.equal(fresh.length, 9);
  assert.equal(new Set(fresh).size, 9);
  assert.equal(fresh[0], games.at(-1));
  assert.ok(fresh.some(tool => tool.category === 'ছোটদের জন্য'));
});

test('every game and kids game has a portal tile', () => {
  const tiles = new Set(tileSlugs());
  assert.deepEqual(allGames.filter(tool => !tiles.has(tool.slug)).map(tool => tool.slug), []);
});

test('the recent list keeps known games once, newest first, and survives junk', () => {
  const known = (slug: string) => slug === 'carrom' || slug === 'sap-ludu' || slug.startsWith('g');
  assert.deepEqual(parseRecent(JSON.stringify(['sap-ludu', 'nope', 'carrom', 'sap-ludu']), known), ['sap-ludu', 'carrom']);
  assert.deepEqual(parseRecent(JSON.stringify([{ slug: 'carrom', at: 1 }, 'sap-ludu']), known), ['carrom', 'sap-ludu']);
  assert.deepEqual(parseRecent(JSON.stringify(Array.from({ length: 20 }, (_, i) => `g${i}`)), known).length, 12);
  for (const junk of [null, '', '{', '"carrom"', '{"slug":"carrom"}', '[1, null, true]']) assert.deepEqual(parseRecent(junk, known), []);
});
