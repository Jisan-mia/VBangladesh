// The statechart's bug paths (ai_docs/statecharts/ki-hobe/README.md), replayed against the pure round and screens, plus the shared
// patterns every rewrite fixes: the tap that comes back, fresh result keys, a round won once, stars as practice.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { finishRound } from "../lib/finish";
import { addToday, emptyToday } from "../lib/lines";
import { OLD_SET_TO_LEVEL } from "../lib/levels";
import { MOVED_KEY, STARS_KEY, moveOldStars, practised } from "../lib/progress";
import { advance, createRound, current, isLast, predict, replay, watched, type Round } from "../lib/round";
import {
  GUARD_MS, SETTLE_MS, back, begin, choosingAllowed, closeList, createSession, endLive, experimentEnds, home, leave, openList, pause, restShows, resume, running,
  settleWaiting, stepped, tapCounts, toEnd, won,
} from "../lib/session";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

/** Starts a round in a fresh session and guesses the first experiment right. */
function watching(level = 1) {
  const s = createSession();
  assert.ok(begin(s, false, 0));
  const round = createRound(level, 3);
  assert.equal(predict(round, current(round).answer), "matched");
  return { s, round };
}
/** Plays a whole round to its last guess. */
function lastGuess(level = 1, seed = 3) {
  const round = createRound(level, seed);
  for (;;) {
    predict(round, current(round).answer); watched(round);
    if (isLast(round)) return round;
    advance(round);
  }
}

test("bug 1, NoProgressWhileAway: an experiment that ends while you're away waits; the answer shows when you're back", () => {
  const { s, round } = watching();
  assert.equal(round.step, "watch");
  assert.equal(running(s, round), true, "it runs while you look");
  leave(s);
  assert.equal(running(s, round), false, "the scene's CSS is paused while away");
  assert.equal(experimentEnds(s, round), false, "an end that arrives anyway does not show the answer");
  assert.equal(round.step, "watch");
  assert.equal(s.waiting, true);
  assert.equal(settleWaiting(s, round), false, "still away");
  back(s);
  assert.equal(settleWaiting(s, round), true, "back: now the answer shows");
  assert.equal(round.step, "answer");
  assert.equal(s.waiting, false);
});

test("bug 1, the pause menu holds the experiment too, and a resume shows the answer that waited", () => {
  const { s, round } = watching();
  pause(s);
  assert.equal(running(s, round), false);
  assert.equal(experimentEnds(s, round), false);
  resume(s);
  assert.equal(running(s, round), true, "the menu closed: it runs again");
  assert.equal(settleWaiting(s, round), true);
  assert.equal(round.step, "answer");
});

test("bug 1, the experiment can be watched again: আবার দেখো works only from the answer and records nothing", () => {
  const { s, round } = watching();
  assert.equal(replay(round), false, "not while it is still playing");
  assert.ok(experimentEnds(s, round));
  const before = { right: round.right, matched: [...round.matched], recorded: s.recorded };
  assert.equal(replay(round), true);
  assert.equal(round.step, "watch");
  assert.equal(round.replays, 1);
  assert.equal(running(s, round), true);
  assert.ok(experimentEnds(s, round), "it ends again and shows the answer again");
  assert.equal(round.step, "answer");
  assert.deepEqual({ right: round.right, matched: round.matched, recorded: s.recorded }, before, "no second guess, no second record");
  assert.equal(predict(round, 0), "ignore", "no new guess on an answered experiment");
});

test("bug 2, SilentWhenMuted: no sound is scheduled by the game itself (timers), only tone()/hiss() from animation events", () => {
  const sound = source("../lib/sound.ts"), game = source("../components/game.tsx"), art = source("../components/art.tsx");
  for (const [name, text] of [["lib/sound.ts", sound], ["components/game.tsx", game], ["components/art.tsx", art]] as const) {
    assert.doesNotMatch(text, /setTimeout\([^)]*(cue|tone|hiss|sfx|matched|surprise|guessed)/, `${name}: a timer must not play a sound`);
  }
  assert.doesNotMatch(sound, /setTimeout|setInterval|requestAnimationFrame/, "sounds are immediate tones: the kit's mute and pause cut them");
  assert.match(art, /onAnimationStart/, "scene sounds ride the animation's own start event");
  assert.match(game, /onSound=\{name => \{ if \(!quiet\) cue\(name\); \}\}/);
});

test("bug 3, RestOnlyAtBreak: a round past the limit never starts; the rest screen shows only at the title or end; the last guess checks the limit", () => {
  const s = createSession();
  assert.equal(begin(s, true, 0), false, "today's time is up: the round does not start");
  assert.equal(s.screen, "title");
  assert.equal(s.resting, true);
  assert.equal(restShows(s), true);
  assert.equal(begin(s, false, 1), false, "behind the rest screen nothing starts");
  assert.equal(openList(s), false);
  assert.equal(choosingAllowed(s), false);
  s.resting = false;
  assert.ok(begin(s, false, 2));
  // The limit runs out mid-round: the flag is set at the last guess, but the rest screen waits for the end screen.
  const round = lastGuess();
  assert.ok(won(s, true));
  assert.equal(s.resting, true);
  assert.equal(restShows(s), false, "not over the last answer");
  assert.equal(tapCounts(s, 1e9), "counts");
  assert.ok(toEnd(s, round, 10));
  assert.equal(restShows(s), true, "at the break");
  assert.equal(endLive(s, 10 + GUARD_MS + 1), false, "the end buttons are dead behind it");
  assert.equal(begin(s, false, 99999), false, "and আবার খেলো does nothing behind the rest screen");
});

test("bug 4, ParentGate: the tool's link sits only behind ParentGate inside the ShowParent card", () => {
  const game = source("../components/game.tsx"), end = source("../components/end-screen.tsx");
  assert.match(game, /<ParentGate label="খেলাটার লিংক"><ShareToolLink/);
  assert.doesNotMatch(end, /ShareToolLink|navigator\.share/);
  assert.doesNotMatch(game.replace(/<ShowParent[\s\S]*<\/ShowParent>/, "").replace(/^import .*$/gm, ""), /ShareToolLink/, "no share anywhere in the child's view");
});

test("bug 5, NoReadingNeeded: every button is a picture, and the end and answer buttons are at least 96 px", () => {
  const end = source("../components/end-screen.tsx"), game = source("../components/game.tsx"), title = source("../components/title.tsx"), css = source("../product.css");
  assert.match(end, /<AgainIcon \/><span>আবার খেলো/);
  assert.match(end, /<DoneIcon \/><span>শেষ/);
  assert.match(game, /<ReplayIcon \/>/);
  assert.match(game, /<NextIcon \/>/);
  assert.match(title, /<Pics pics=\{\[WORLD_PIC\[item\.id\]\]/);
  const big = css.match(/\.ki-big\{[^}]*min-height:(\d+)px/), act = css.match(/\.ki-act\{[^}]*width:(\d+)px;height:(\d+)px/), choice = css.match(/\.ki-choice\{[^}]*min-height:(\d+)px/);
  assert.ok(big && Number(big[1]) >= 96, "end buttons");
  assert.ok(act && Number(act[1]) >= 96 && Number(act[2]) >= 96, "আবার দেখো and →");
  assert.ok(choice && Number(choice[1]) >= 96, "guesses");
  assert.match(css, /\.ki-worlds button\{[^}]*min-height:96px/);
});

test("the tap that comes back is not a move: after blur only the first tap wakes the game", () => {
  const s = createSession();
  begin(s, false, 0);
  leave(s);
  assert.equal(tapCounts(s, 1e9), "ignored", "nothing counts while away");
  back(s);
  assert.equal(tapCounts(s, 1e9), "woke", "the click that brings focus back only wakes the game");
  assert.equal(tapCounts(s, 1e9), "counts");
  leave(s); back(s); pause(s);
  assert.equal(tapCounts(s, 1e9), "ignored", "under the menu nothing counts");
  resume(s);
  assert.equal(tapCounts(s, 1e9), "counts", "the menu took the resuming click");
});

test("a double tap never skips: a guess, an answer or → is deaf for a moment", () => {
  const s = createSession();
  begin(s, false, 1000);
  assert.equal(tapCounts(s, 1000 + SETTLE_MS - 1), "ignored");
  assert.equal(tapCounts(s, 1000 + SETTLE_MS), "counts");
  stepped(s, 2000);
  assert.equal(tapCounts(s, 2100), "ignored");
});

test("result keys need a fresh press: the end screen is dead for a moment, and it never starts the next round by itself", () => {
  const s = createSession();
  begin(s, false, 0);
  const round = lastGuess();
  won(s, false);
  assert.ok(toEnd(s, round, 5000));
  assert.equal(endLive(s, 5000 + GUARD_MS - 1), false);
  assert.equal(begin(s, false, 5000 + GUARD_MS - 1), false, "a key held through the last answer does nothing");
  assert.equal(endLive(s, 5000 + GUARD_MS), true);
  assert.ok(begin(s, false, 5000 + GUARD_MS));
  assert.equal(s.screen, "play");
  home(s);
  assert.equal(s.screen, "title", "শেষ goes to a title, nothing starts");
});

test("a won round is recorded once, at the last guess, however many times it is asked or tapped", () => {
  const s = createSession();
  begin(s, false, 0);
  const round = lastGuess();
  const first = finishRound(s, {}, emptyToday, round, false);
  assert.ok(first);
  assert.equal(finishRound(s, first.stars, first.today, round, false), null);
  assert.equal(finishRound(s, first.stars, first.today, round, false), null);
  assert.equal(first.stars[1], 1);
  assert.equal(first.today.count, round.items.length);
  // A round whose last guess is not made is not recorded and not counted.
  const s2 = createSession(); begin(s2, false, 0);
  const half = createRound(1, 9);
  predict(half, 0); watched(half); advance(half);
  assert.equal(finishRound(s2, {}, emptyToday, half, false), null);
  assert.equal(addToday(emptyToday, round).count, 3);
});

test("a quick → right after the last guess cannot lose the stars: they are saved at the guess, before the answer plays", () => {
  const s = createSession();
  begin(s, false, 0);
  const round = createRound(1, 4);
  while (!isLast(round)) { predict(round, current(round).answer); watched(round); advance(round); }
  assert.equal(round.full, false);
  predict(round, 0);
  assert.equal(round.full, true, "the last guess wins the round");
  assert.equal(round.step, "watch");
  assert.ok(finishRound(s, {}, emptyToday, round, false), "recorded now, while the experiment still runs");
  assert.equal(toEnd(s, round, 10), false, "→ cannot reach the end before the last answer was seen");
  watched(round);
  assert.ok(toEnd(s, round, 20));
});

test("stars are practice: one more each time a level is played through, up to three; the end screen and the saved stars agree", () => {
  let stars: Record<number, number> = {}, today = emptyToday;
  for (let play = 1; play <= 4; play++) {
    const s = createSession(); begin(s, false, 0);
    const round = lastGuess(1, play);
    const done = finishRound(s, stars, today, round, false)!;
    stars = done.stars; today = done.today;
    assert.equal(done.earned, Math.min(3, play));
    assert.equal(stars[1], Math.min(3, play));
  }
  assert.equal(today.count, 12);
  assert.equal(practised(3), 3);
});

test("a level list opened from the pause menu leaves the round unrecorded, and a level pick never starts a round by itself", () => {
  const s = createSession();
  begin(s, false, 0);
  assert.ok(openList(s));
  assert.equal(s.screen, "list");
  closeList(s, true);
  assert.equal(s.screen, "title");
  assert.equal(s.recorded, 0);
});

test("saved progress moves once: old sets 1–4 land on levels 1, 4, 7, 9, keeping the counts", () => {
  const store: Record<string, string> = { [STARS_KEY]: JSON.stringify({ 1: 3, 2: 2, 3: 1, 4: 2 }) };
  const read = (key: string) => store[key] ?? null;
  assert.deepEqual(OLD_SET_TO_LEVEL, { 1: 1, 2: 4, 3: 7, 4: 9 });
  const moved = moveOldStars(read)!;
  assert.deepEqual(moved, { 1: 3, 4: 2, 7: 1, 9: 2 });
  store[STARS_KEY] = JSON.stringify(moved); store[MOVED_KEY] = "1";
  assert.equal(moveOldStars(read), null, "the move runs once");
  assert.deepEqual(moveOldStars(() => null), {}, "a fresh phone starts empty");
});

test("blur releases everything: no game state outside the session survives a blur", () => {
  const game = source("../components/game.tsx");
  assert.match(game, /addEventListener\("blur", gone\)/);
  assert.match(game, /addEventListener\("focus", here\)/);
  assert.match(game, /document\.addEventListener\("visibilitychange"/);
  assert.match(game, /onLevels:/, "সব লেভেল in the pause menu");
  assert.doesNotMatch(game, /location\.hash\s*=[^=]|pushState|history\.push/, "never push history or set the hash");
  assert.doesNotMatch(game, /localStorage\.clear|ektukhani-dev-sound/);
});
