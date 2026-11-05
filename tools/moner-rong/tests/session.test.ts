// The statechart's bug paths (ai_docs/statecharts/moner-rong/README.md), replayed against the pure screens, the round and the
// bookkeeping, plus the shared patterns every rewrite fixes: the tap that comes back, fresh result keys, a round won once.
import assert from "node:assert/strict";
import test from "node:test";
import { finishRound } from "../lib/finish";
import { addToday, type Today } from "../lib/lines";
import { advance, chooseKind, createRound, fitting, nameFeeling, type Round } from "../lib/round";
import { practised } from "../lib/progress";
import {
  GUARD_MS, SETTLE_MS, back, begin, choosingAllowed, closeList, createSession, endLive, home, leave, openList, pause, restShows, resume, stepped, tapCounts, toEnd, won,
} from "../lib/session";

/** Plays a whole round right; returns it won (the last kind thing chosen). */
function win(level: number, seed = 3) {
  const round = createRound(level, seed);
  for (;;) { nameFeeling(round, fitting(round)[0]); chooseKind(round, 0); if (!advance(round)) return round; }
}
const none: Today = { scenes: 0, feelings: [] };

test("bug 1, NoDoubleResult: a won round is recorded once, however many times the last step is asked", () => {
  const s = createSession();
  assert.ok(begin(s, false));
  const round = win(1);
  const first = finishRound(s, {}, none, round, false);
  assert.ok(first);
  assert.equal(finishRound(s, first.stars, first.today, round, false), null, "the second ask records nothing");
  assert.equal(finishRound(s, first.stars, first.today, round, false), null, "and neither does the third (the old hidden ধাপ শেষ + Enter path)");
  assert.equal(first.stars[1], 1);
  assert.equal(first.today.scenes, 3);
});

test("bug 1, StarsMatchPlays: the stars are the times played (up to three), and the card counts the pictures really finished", () => {
  let stars: Record<number, number> = {}, today = none;
  for (let play = 1; play <= 4; play++) {
    const s = createSession();
    begin(s, false);
    const round = win(1, play);
    const done = finishRound(s, stars, today, round, false)!;
    stars = done.stars; today = done.today;
    assert.equal(done.earned, Math.min(3, play), `play ${play}`);
    assert.equal(stars[1], Math.min(3, play), "the saved stars are the end screen's stars");
    assert.equal(today.scenes, 3 * play, "three pictures a play, never nine for one");
  }
  assert.equal(practised(2), 3);
  assert.equal(practised(3), 3);
  // Not won: nothing is recorded and nothing counts.
  const s = createSession(); begin(s, false);
  const half = createRound(1, 9);
  nameFeeling(half, fitting(half)[0]); chooseKind(half, 0); advance(half);
  assert.equal(finishRound(s, {}, none, half, false), null);
  assert.equal(addToday(none, win(2)).scenes, 3);
});

test("bug 3, NoReadingNeeded: the end buttons are pictures at least 96 px, equal in size, and → is a picture too", async () => {
  const { readFileSync } = await import("node:fs");
  const end = readFileSync(new URL("../components/end-screen.tsx", import.meta.url), "utf8");
  assert.match(end, /<AgainIcon \/>.*আবার খেলো/s);
  assert.match(end, /<DoneIcon \/>.*শেষ/s);
  const css = readFileSync(new URL("../product.css", import.meta.url), "utf8");
  const big = css.match(/\.mr-big\{[^}]*min-height:(\d+)px/);
  assert.ok(big && Number(big[1]) >= 96, "the end buttons are at least 96 px tall");
  assert.match(css, /\.mr-end-actions\{display:grid;grid-template-columns:1fr 1fr/, "equal size");
  const next = css.match(/\.mr-next\{[^}]*width:(\d+)px;height:(\d+)px/);
  assert.ok(next && Number(next[1]) >= 96 && Number(next[2]) >= 96, "→ is at least 96 px");
  const face = css.match(/\.mr-face\{[^}]*min-height:(\d+)px/);
  assert.ok(face && Number(face[1]) >= 96, "faces are at least 96 px tall");
  const kind = css.match(/\.mr-kind\{[^}]*min-height:(\d+)px/);
  assert.ok(kind && Number(kind[1]) >= 96, "the kind pictures are at least 96 px tall");
});

test("bug 4, NoNewRoundPastLimit: past today's limit খেলো shows the rest screen, never a fresh round; আবার খেলো too", () => {
  const s = createSession();
  assert.equal(begin(s, true), false);
  assert.equal(s.screen, "title");
  assert.equal(s.serial, 0, "no round started");
  assert.equal(restShows(s), true);
  const t = createSession();
  assert.ok(begin(t, false));
  won(t, false); toEnd(t, 1000);
  assert.equal(begin(t, true, 1000 + GUARD_MS), false);
  assert.equal(t.serial, 1);
  assert.equal(restShows(t), true);
  assert.equal(begin(t, false, 5000), false, "under the rest screen nothing starts until a parent gives time");
});

test("bug 4, RestOnlyAtBreak: the limit passing at the winning tap shows the rest screen only once play is over", () => {
  const s = createSession();
  begin(s, false);
  assert.ok(won(s, true));
  assert.equal(s.resting, true);
  assert.equal(restShows(s), false, "not over the finished picture");
  assert.ok(toEnd(s, 100));
  assert.equal(restShows(s), true, "at the break");
  assert.equal(endLive(s, 100 + GUARD_MS), false, "the end buttons are not live under it");
});

test("the tap that brings focus back is not a move, and no tap counts under the pause menu", () => {
  const s = createSession();
  begin(s, false);
  assert.equal(tapCounts(s, 1000), "counts");
  leave(s);
  assert.equal(tapCounts(s, 2000), "ignored", "away: nothing counts");
  back(s);
  assert.equal(tapCounts(s, 3000), "woke", "the first tap back only wakes the game");
  assert.equal(tapCounts(s, 4000), "counts");
  pause(s);
  assert.equal(tapCounts(s, 5000), "ignored", "under the menu");
  leave(s); back(s); resume(s);
  assert.equal(tapCounts(s, 6000), "counts", "the menu took the click that came back");
});

test("a double tap never skips a picture: the next tap waits SETTLE_MS after a face, a kind thing or →", () => {
  const s = createSession();
  begin(s, false, 0);
  assert.equal(tapCounts(s, 100), "ignored", "a tap right after খেলো");
  assert.equal(tapCounts(s, SETTLE_MS), "counts");
  stepped(s, 1000);
  assert.equal(tapCounts(s, 1000 + SETTLE_MS - 1), "ignored");
  assert.equal(tapCounts(s, 1000 + SETTLE_MS), "counts");
});

test("result keys need a fresh press: the end screen is deaf for the guard, and nothing starts under the menu", () => {
  const s = createSession();
  begin(s, false); won(s, false); toEnd(s, 5000);
  assert.equal(begin(s, false, 5000 + GUARD_MS - 1), false);
  assert.equal(endLive(s, 5000 + GUARD_MS - 1), false);
  pause(s);
  assert.equal(begin(s, false, 9000), false, "no new round under the pause menu");
  resume(s);
  assert.ok(begin(s, false, 9000));
  assert.equal(s.serial, 2);
});

test("a win comes before →: toEnd refuses a round that was not recorded, and a recorded one goes once", () => {
  const s = createSession();
  begin(s, false);
  assert.equal(toEnd(s, 10), false, "not recorded yet");
  won(s, false);
  assert.equal(toEnd(s, 20), true);
  assert.equal(toEnd(s, 30), false, "already on the end screen");
  assert.equal(s.endAt, 20);
});

test("the level list and the world tiles are choices: never mid-round except through the pause menu, which leaves the round unrecorded", () => {
  const s = createSession();
  assert.equal(choosingAllowed(s), true);
  begin(s, false);
  assert.equal(choosingAllowed(s), false, "world tiles are on the title only");
  // সব লেভেল in the pause menu: the menu resumes, then asks for the list.
  pause(s); assert.equal(openList(s), false, "not under the menu itself");
  resume(s);
  assert.ok(openList(s));
  assert.equal(s.screen, "list");
  assert.equal(s.recorded, 0, "leaving mid-round records nothing");
  assert.equal(begin(s, false), false, "nothing starts from the list");
  assert.equal(tapCounts(s, 1e9), "ignored");
  closeList(s, true);
  assert.equal(s.screen, "title", "a level pick goes to the title");
  begin(s, false); won(s, false); toEnd(s, 0);
  assert.ok(openList(s));
  closeList(s, false);
  assert.equal(s.screen, "end", "ফিরে যাও goes back where it came from");
  home(s);
  assert.equal(s.screen, "title");
});

test("the rest screen never covers a picture in play, and a title or list under it is not tappable", () => {
  const s = createSession();
  assert.equal(begin(s, true), false);
  assert.equal(choosingAllowed(s), false);
  assert.equal(openList(s), false);
  assert.equal(restShows(s), true);
  s.resting = false;
  begin(s, false);
  s.resting = true;
  assert.equal(restShows(s), false, "never over play");
});

test("a round replayed after a restart starts fresh: nothing carries but the quiet ease", () => {
  const a: Round = createRound(2, 5);
  nameFeeling(a, a.faces.find(face => !a.scenes[0].feels.includes(face))!);
  const b = createRound(2, 6, a.eased && a.rightRun < 5, a.rightRun);
  assert.equal(b.index, 0);
  assert.equal(b.tries, 0);
  assert.deepEqual(b.found, []);
  assert.equal(b.full, false);
});
