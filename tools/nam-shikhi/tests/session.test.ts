// The statechart's bug paths (ai_docs/statecharts/nam-shikhi/README.md), replayed against the pure screens and the round,
// plus the shared patterns every rewrite fixes: the tap that comes back, fresh result keys, a round won once.
import assert from "node:assert/strict";
import test from "node:test";
import { answerOf, advance, cardOf, choose, createRound } from "../lib/book";
import { LEVEL_COUNT } from "../lib/levels";
import { MOVED_KEY, STARS_KEY, moveOldStars, nextUp, oldKey, readWorld, recommended } from "../lib/progress";
import {
  GUARD_MS, back, begin, choosingAllowed, closeList, createSession, endLive, home, leave, openList, pause, restShows, resume, tapCounts, toEnd, won,
} from "../lib/session";

/** Places every sticker of a round right; returns it full. */
function fill(levelId: number) {
  const round = createRound(levelId, 3);
  for (;;) { choose(round, answerOf(cardOf(round))); if (round.full) return round; advance(round); }
}

test("bug 1, NoNewRoundPastLimit: past today's limit খেলো shows the rest screen, never a fresh round", () => {
  const s = createSession();
  assert.equal(begin(s, true), false);
  assert.equal(s.screen, "title");
  assert.equal(s.serial, 0, "no round started");
  assert.equal(restShows(s), true);
  // আবার খেলো on the end screen is a round start too.
  const t = createSession();
  assert.ok(begin(t, false));
  won(t, false); toEnd(t, 1000);
  assert.equal(begin(t, true, 1000 + GUARD_MS), false);
  assert.equal(t.serial, 1);
  assert.equal(restShows(t), true);
});

test("bug 1, the pack tiles and the level list: never tappable mid-round", () => {
  const s = createSession();
  assert.equal(choosingAllowed(s), true);
  begin(s, false);
  assert.equal(choosingAllowed(s), false, "world tiles are on the title only");
  assert.equal(openList(s), false, "the level list doesn't open mid-round");
  assert.equal(s.screen, "play");
  // A link mid-round goes to a title (the round is left), and a new round still needs খেলো and atBreak().
  home(s);
  assert.equal(s.screen, "title");
  assert.equal(begin(s, true), false);
  assert.equal(s.serial, 1);
});

test("the level list is a choice screen between rounds, and a pick never starts a round", () => {
  const s = createSession();
  assert.ok(openList(s));
  assert.equal(s.screen, "list");
  assert.equal(begin(s, false), false, "nothing starts from the list");
  assert.equal(tapCounts(s), "ignored");
  closeList(s, true);
  assert.equal(s.screen, "title");
  begin(s, false); won(s, false); toEnd(s, 0);
  assert.ok(openList(s));
  closeList(s, false);
  assert.equal(s.screen, "end", "ফিরে যাও goes back where it came from");
});

test("RestOnlyAtBreak: the limit passing at the last sticker shows rest only once the end screen is up", () => {
  const s = createSession();
  begin(s, false);
  assert.equal(won(s, true), true);
  assert.equal(s.resting, true);
  assert.equal(restShows(s), false, "never over a card");
  assert.ok(toEnd(s, 500));
  assert.equal(restShows(s), true);
  assert.equal(endLive(s, 500 + GUARD_MS), false, "the end buttons are behind the rest screen");
});

test("a won round is recorded once, at the last tap, whatever the hand does next", () => {
  const s = createSession();
  begin(s, false);
  assert.equal(toEnd(s, 0), false, "no end screen before the page is full");
  assert.equal(won(s, false), true);
  assert.equal(won(s, false), false, "stars and the limit check happen once a round");
  assert.ok(toEnd(s, 10));
  assert.equal(s.recorded, s.serial);
  const round = fill(1);
  assert.equal(round.full, true);
  assert.equal(round.firstTry, round.cards.length);
});

test("result keys need a fresh press: the end screen ignores anything inside its guard", () => {
  const s = createSession();
  begin(s, false); won(s, false); toEnd(s, 1000);
  assert.equal(begin(s, false, 1000 + 100), false, "a held Enter or a double tap on → doesn't start the next round");
  assert.equal(endLive(s, 1000 + 100), false);
  assert.equal(endLive(s, 1000 + GUARD_MS), true);
  assert.equal(begin(s, false, 1000 + GUARD_MS), true);
  assert.equal(s.serial, 2);
});

test("the click that brings focus back is not a move", () => {
  const s = createSession();
  begin(s, false);
  leave(s); back(s);
  assert.equal(tapCounts(s), "woke", "the first tap back only wakes the game");
  assert.equal(tapCounts(s), "counts");
  // With the player's menu: it takes the click, so চালিয়ে যাও leaves nothing to swallow.
  leave(s); pause(s);
  assert.equal(tapCounts(s), "ignored", "nothing counts under the menu");
  back(s); resume(s);
  assert.equal(tapCounts(s), "counts");
  // Leaving the title or the end screen swallows nothing (no round to protect).
  const t = createSession();
  leave(t); back(t);
  assert.equal(t.swallow, false);
});

test("pause: nothing is placed while the menu is open, and → can't open the end screen under it", () => {
  const s = createSession();
  begin(s, false); won(s, false);
  pause(s);
  assert.equal(toEnd(s, 0), false);
  resume(s);
  assert.ok(toEnd(s, 0));
});

test("old stars move once into the new levels, keeping the higher count", () => {
  const store = new Map<string, string>([
    [oldKey("pashu"), JSON.stringify({ 1: 3, 2: 1, 3: 2, 4: 2 })],
    [oldKey("rong"), JSON.stringify({ 3: 3 })],
    [oldKey("protik"), JSON.stringify({ 3: 1 })],
    [STARS_KEY, JSON.stringify({ 4: 3 })],
  ]);
  const read = (key: string) => store.get(key) ?? null;
  const moved = moveOldStars(read)!;
  // pashu: bn → 4, en → 5, home → 3, read → 4 (the higher of the two, and of what was already saved); rong thing → 22; protik role → 29.
  assert.deepEqual(moved, { 3: 2, 4: 3, 5: 1, 22: 3, 29: 1 });
  store.set(MOVED_KEY, "1");
  assert.equal(moveOldStars(read), null, "runs once");
  assert.deepEqual(moveOldStars(() => null), {}, "a new phone has nothing to move");
  assert.ok(Object.keys(moved).every(id => Number(id) >= 1 && Number(id) <= LEVEL_COUNT));
});

test("which level to suggest, and where শেষ leaves you", () => {
  assert.equal(recommended("pashu", {}), 1);
  assert.equal(recommended("pashu", { 1: 3, 2: 1 }), 3);
  assert.equal(recommended("fol", { 7: 3, 8: 3, 9: 3, 10: 3, 11: 2 }), 11);
  assert.equal(recommended("fol", { 7: 3, 8: 3, 9: 3, 10: 3, 11: 3 }), 11);
  assert.equal(recommended("fol", { 7: 2, 8: 3, 9: 3, 10: 3, 11: 3 }), 7);
  assert.equal(nextUp(1, "pashu"), 2);
  assert.equal(nextUp(6, "pashu"), 6, "the finale stays on the finale");
  assert.equal(readWorld("rong"), "rong");
  assert.equal(readWorld("<script>"), "pashu");
});
