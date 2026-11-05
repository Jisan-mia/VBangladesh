// The statechart's bugs and rules, replayed against the pure session the component runs
// (ai_docs/statecharts/chhorar-tal/ChhorarTal.tla). Each test is named after the rule it proves.
import assert from "node:assert/strict";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { createRun, tally, tap, starsOf, TAP_ON } from "../lib/run";
import * as S from "../lib/session";
import { EV_END, advance } from "../lib/tick.hot";

const STEP = 1000 / 60;
const playing = () => { const s = S.createSession(); assert.ok(S.begin(s, false)); return s; };

test("SpaceNeverRestarts: during a ছড়া Space and Enter are taps on the drum, never a button press that starts it over", () => {
  const s = playing();
  for (const key of [" ", "Enter"]) {
    const route = S.routeKey(s, key, false, 5000);
    assert.equal(route.act, "tap");
    assert.equal(route.prevent, true, "the key never reaches a focused button");
  }
  // A held key is swallowed, not turned into a start, and still kept from the page.
  assert.deepEqual(S.routeKey(s, " ", true, 5000), { act: "none", prevent: true });
  // Nothing in play can start a round: only the title and the end screen begin one.
  for (const key of [" ", "Enter", "1", "2", "a"]) assert.notEqual(S.routeKey(s, key, false, 5000).act, "start");
  assert.equal(s.serial, 1);
  S.openLevels(s);
  assert.equal(s.screen, "play", "the list never opens over a round");
});

test("SpaceReachesTheDrum: on every screen the game owns, Space never scrolls the page", () => {
  const title = S.createSession();
  assert.deepEqual(S.routeKey(title, " ", false, 0), { act: "start", prevent: true });
  assert.deepEqual(S.routeKey(title, " ", true, 0), { act: "none", prevent: true });
  const play = playing();
  assert.equal(S.routeKey(play, " ", false, 0).prevent, true);
  const end = playing();
  assert.ok(S.finished(end, false, 1000));
  for (const at of [1100, 1699, 1700, 9000]) for (const repeat of [false, true]) assert.equal(S.routeKey(end, " ", repeat, at).prevent, true, `${at} ${repeat}`);
  // The player's menu, the rest screen and the list take their own keys.
  const paused = playing(); S.pause(paused);
  assert.deepEqual(S.routeKey(paused, " ", false, 0), { act: "none", prevent: false });
  const rest = S.createSession(); S.begin(rest, true);
  assert.equal(S.routeKey(rest, " ", false, 0).prevent, false);
  const list = S.createSession(); S.openLevels(list);
  assert.equal(S.routeKey(list, " ", false, 0).prevent, false);
  // P opens the player's one pause menu.
  assert.deepEqual(S.routeKey(play, "p", false, 0), { act: "pause", prevent: true });
});

test("EveryFinishCounts: the ছড়া is recorded and the limit checked at the moment its last beat ends, whatever the next tap does", () => {
  const s = playing();
  const run = createRun(1);
  while (run.phase !== 2) { advance(run, STEP); if (run.phase === 1) tap(run); }
  assert.equal(S.finished(s, true, 500), true, "the caller records the stars now");
  assert.equal(s.resting, true, "and the rest screen is owed");
  assert.equal(s.screen, "end");
  // A quick hand: a tap on the drum, an আবার খেলো press and the same finish again do not lose or repeat it.
  assert.equal(S.tapCounts(s), "ignored");
  assert.equal(S.finished(s, true, 520), false, "recorded once");
  assert.equal(S.begin(s, true), false, "past the limit nothing starts");
  assert.equal(s.recorded, s.serial);
  assert.equal(s.resting, true);
  // A finish from anywhere but play is nothing.
  const title = S.createSession();
  assert.equal(S.finished(title, false, 0), false);
  assert.equal(title.recorded, 0);
  // The stars it records are the run's own.
  assert.equal(starsOf(tally(run).hits, tally(run).words), 3);
  assert.ok(tap(createRun(1)) !== TAP_ON);
});

test("EveryFinishCounts: a second round records its own finish", () => {
  const s = playing();
  assert.ok(S.finished(s, false, 100));
  assert.ok(S.begin(s, false));
  assert.equal(s.recorded + 1, s.serial);
  assert.ok(S.finished(s, false, 9000));
  assert.equal(s.recorded, s.serial);
  assert.equal(s.resting, false);
});

test("the beat comes back: after a pause or a blur two beats are counted in again, exactly once, and the click that brings focus back is not a tap", () => {
  const s = playing();
  S.pause(s);
  assert.equal(s.owed, true);
  assert.equal(S.tapCounts(s), "ignored", "the menu covers the drum");
  assert.equal(S.resume(s), true, "চালিয়ে যাও: count in again");
  assert.equal(S.resume(s), false, "only once");
  assert.equal(S.tapCounts(s), "counts", "the menu took the click, so the next tap is a real one");
  // Blur and focus without the menu (a bare page): the first tap back only wakes the game.
  S.blur(s);
  assert.equal(S.tapCounts(s), "ignored", "away");
  assert.equal(S.focus(s), true);
  assert.equal(S.tapCounts(s), "woke");
  assert.equal(S.tapCounts(s), "counts");
  // The player's pause sends a blur, then focus on resume: still one count-in whichever order the events come in.
  for (const order of ["focus first", "resume first"]) {
    const t = playing();
    S.pause(t); S.blur(t);
    const results = order === "focus first" ? [S.focus(t), S.resume(t)] : [S.resume(t), S.focus(t)];
    assert.equal(results.filter(Boolean).length, 1, order);
  }
  // Away from a title or an end screen owes nothing.
  const title = S.createSession(); S.blur(title);
  assert.equal(S.focus(title), false);
  const end = playing(); S.finished(end, false, 0); S.blur(end);
  assert.equal(S.focus(end), false);
  assert.equal(end.swallow, false);
});

test("NoProgressWhileAway: the clock is stepped only while the game is on screen, unpaused and in focus", () => {
  // The component steps the run only when this says so; blur and pause stop it.
  const can = (s: S.Session) => s.screen === "play" && !s.paused && !s.away;
  const s = playing();
  assert.equal(can(s), true);
  S.blur(s); assert.equal(can(s), false);
  S.focus(s); assert.equal(can(s), true);
  S.pause(s); assert.equal(can(s), false);
  S.resume(s); assert.equal(can(s), true);
});

test("end keys need a fresh press after the guard: a held Space or Enter never skips the result or starts the next run", () => {
  const s = playing();
  S.finished(s, false, 1000);
  assert.equal(S.endLive(s, 1000 + S.GUARD_MS - 1), false);
  assert.equal(S.endLive(s, 1000 + S.GUARD_MS), true);
  assert.equal(S.routeKey(s, " ", false, 1200).act, "none", "the drumming hand is still going");
  assert.equal(S.routeKey(s, "Enter", true, 5000).act, "none", "a held key");
  assert.equal(S.routeKey(s, " ", false, 5000).act, "again");
  assert.equal(S.routeKey(s, "1", false, 5000).act, "again");
  assert.equal(S.routeKey(s, "2", false, 5000).act, "done");
  assert.equal(S.routeKey(s, "x", false, 5000).act, "none");
});

test("RestOnlyAtBreak: the rest screen never shows over a round, and opening a round past the limit is a break", () => {
  const s = S.createSession();
  assert.equal(S.begin(s, true), false);
  assert.equal(S.restShows(s), true);
  S.extend(s);
  assert.equal(S.restShows(s), false);
  assert.equal(S.begin(s, false), true);
  assert.equal(S.restShows(s), false);
  s.resting = true; // the limit passes mid-round: it waits for the round's end
  assert.equal(S.restShows(s), false);
  assert.equal(S.finished(s, true, 10), true);
  assert.equal(S.restShows(s), true);
  assert.equal(S.routeKey(s, " ", false, 99999).act, "none");
  assert.equal(S.routeKey(s, " ", false, 99999).prevent, false);
});

test("the list is a choice screen: only from the title or the end, and it goes back where it came from", () => {
  const s = S.createSession();
  S.openLevels(s); assert.equal(s.screen, "levels");
  S.closeLevels(s); assert.equal(s.screen, "title");
  S.begin(s, false); S.openLevels(s); assert.equal(s.screen, "play");
  S.finished(s, false, 0); S.openLevels(s); assert.equal(s.screen, "levels");
  S.closeLevels(s); assert.equal(s.screen, "end");
  S.toTitle(s); assert.equal(s.screen, "title");
  assert.equal(s.paused, false);
});

test("a random child (taps, keys, blurs, pauses, the limit) breaks no rule, over 80 seeds", () => {
  for (let seed = 1; seed <= 80; seed++) {
    const rng = makeRng(seed), s = S.createSession();
    let now = 0, run = createRun(1);
    for (let step = 0; step < 400; step++) {
      now += 50 + Math.floor(rng() * 500);
      const pick = Math.floor(rng() * 14), over = rng() < 0.15;
      if (pick === 0) { if (s.screen === "title" || s.screen === "end") { if (S.begin(s, over)) run = createRun(1 + Math.floor(rng() * 8)); } }
      else if (pick === 1) S.pause(s);
      else if (pick === 2) { if (S.resume(s)) assert.equal(s.screen, "play"); }
      else if (pick === 3) S.blur(s);
      else if (pick === 4) { if (S.focus(s)) assert.equal(s.screen, "play"); }
      else if (pick === 5) S.openLevels(s);
      else if (pick === 6) S.closeLevels(s);
      else if (pick === 7) S.toTitle(s);
      else if (pick === 8) S.extend(s);
      else if (pick === 9) { if (S.tapCounts(s) === "counts") assert.ok(s.screen === "play" && !s.paused && !s.away); }
      else if (pick === 10) { const route = S.routeKey(s, [" ", "Enter", "1", "2", "p"][Math.floor(rng() * 5)], rng() < 0.3, now); if (route.act === "tap") assert.equal(s.screen, "play"); }
      else if (pick === 11) { if (s.screen === "play" && !s.paused && !s.away) { for (let tries = 0; tries < 80 && (run.phase as number) !== 2; tries++) { advance(run, 1000); if (rng() < 0.2) break; } if ((run.phase as number) === 2) S.finished(s, over, now); } }
      else if (pick === 12) S.finished(s, over, now);
      else S.extend(s);
      // The rules that must always hold.
      assert.ok(s.recorded <= s.serial);
      if (s.screen === "play") assert.equal(s.resting && S.restShows(s), false);
      if (s.owed) assert.equal(s.screen, "play", `seed ${seed}: a count-in is owed only in a round`);
      if (s.swallow) assert.equal(s.screen, "play");
      assert.ok(["title", "play", "end", "levels"].includes(s.screen));
    }
  }
});

test("a finished run ends once: the clock reports its end a single time", () => {
  const run = createRun(5);
  let ends = 0;
  for (let steps = 0; steps < 20000; steps++) if (advance(run, 1000 / 30) & EV_END) ends++;
  assert.equal(ends, 1);
});
