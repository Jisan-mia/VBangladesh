import assert from "node:assert/strict";
import test from "node:test";
import { challengeHash } from "../../../shared/game-core";
import { site } from "../content";
import {
  DROP_TIME, GHATS, HALF_VIEW, LEVEL_COUNT, migrateBest, nextMark, starsOf, LEAN_MAX, MIN_SWING, PERFECT, SETTLE_TIME, SLIP, STRAIGHTEN,
  judge, leanOf, newGame, placePivot, scoreOf, step, swingOf, swingX, tap, topX, type Game,
} from "../lib/game";
import { bandOf, cardHash, friendBanner, humanLine, parseCard, previewTitle, shout, versusLine, type Card } from "../lib/result";
import { share } from "../share";

const DT = 1 / 240;

test("the same seed always gives the same swings; different seeds differ", () => {
  for (let index = 0; index < 60; index++) assert.deepEqual(swingOf(48213, index), swingOf(48213, index));
  assert.notDeepEqual(swingOf(1, 5), swingOf(2, 5));
  assert.notDeepEqual(swingOf(7, 5), swingOf(7, 6));
});

test("swings start gentle, speed up, and never leave the screen", () => {
  const speed = (seed: number, index: number) => { const swing = swingOf(seed, index); return (2 * Math.PI * swing.amp) / swing.period; };
  for (let seed = 1; seed < 300; seed++) {
    const first = swingOf(seed * 7919, 0);
    assert.equal(first.shift, 0, "the first swings are centred on the pile");
    assert.ok(speed(seed, 0) < 3, `first sack moves gently: ${speed(seed, 0)}`);
    assert.ok(speed(seed, 30) > speed(seed, 0) * 2, "the pace rises");
    for (let index = 0; index < 200; index++) {
      const swing = swingOf(seed, index);
      assert.ok(swing.period >= 0.9 && swing.amp <= 1.58 && Math.abs(swing.shift) <= 0.4);
      assert.ok(swing.kind >= 0 && swing.kind < 3);
      for (const top of [-LEAN_MAX, -0.4, 0, 0.7, LEAN_MAX]) {
        const pivot = placePivot(top, swing);
        assert.ok(Math.abs(pivot) + swing.amp + 0.5 <= HALF_VIEW + 1e-9, "the sack stays on screen");
        assert.ok(Math.abs(top - pivot) <= swing.amp - 0.25, `seed ${seed} sack ${index}: the swing always passes over the top sack`);
      }
    }
  }
});

test("landing rules: perfect snaps and straightens, half off slips, too much lean falls", () => {
  assert.deepEqual(judge(0, 0, 0.05), { verdict: "perfect", x: 0 });
  assert.deepEqual(judge(0.6, 0, 0.6 + PERFECT), { verdict: "perfect", x: 0.6 - STRAIGHTEN });
  assert.deepEqual(judge(-0.05, 0, -0.1), { verdict: "perfect", x: 0 }, "straightening never overshoots the plumb line");
  assert.equal(judge(0, 0, 0.2).verdict, "good");
  assert.equal(judge(0, 0, -0.4).verdict, "wide");
  assert.equal(judge(0, 0, -0.4).x, -0.4, "a wide sack stays where it fell");
  assert.equal(judge(0, 0, SLIP).verdict, "wide", "exactly half on still sits");
  assert.equal(judge(0, 0, SLIP + 0.001).verdict, "slip");
  assert.equal(judge(0.8, 0, 1.05).verdict, "lean", "past one sack width from the plumb line");
  assert.equal(judge(0.95, 0, 0.95 + PERFECT).verdict, "perfect", "a perfect drop never tips the pile");
  assert.equal(judge(-0.8, 0, -1.2).verdict, "lean");
});

test("taps: a double tap is ignored, a drop lands after the fall, nothing happens mid-drop", () => {
  const game = newGame(7);
  assert.equal(game.phase, "ready");
  assert.equal(tap(game), false, "too soon after the sack appears");
  step(game, MIN_SWING + 0.01, false);
  assert.equal(tap(game), true);
  assert.equal(game.phase, "drop");
  assert.equal(tap(game), false);
  step(game, DROP_TIME + 0.01, false);
  assert.ok(game.phase === "settle" || game.phase === "fall");
});

test("slow mode swings slower: the same moment finds the sack in a different place", () => {
  const fast = newGame(9), slow = newGame(9);
  step(fast, 0.5, false); step(slow, 0.5, true);
  assert.ok(slow.t < fast.t);
  assert.notEqual(swingX(slow), swingX(fast));
});

/** Plays headlessly at 240 steps a second. `aim(game)` returns where, relative to the top sack, this player lets go. */
function play(seed: number, aim: (game: Game) => number, slow = false, maxSacks = 400, level = 1) {
  const game = newGame(seed, level);
  let steps = 0, previous = swingX(game) - topX(game) - aim(game);
  while (game.phase !== "over" && scoreOf(game) < maxSacks && steps++ < 2_000_000) {
    if (game.phase === "ready" || game.phase === "swing") {
      const now = swingX(game) - topX(game) - aim(game);
      // Let go when the sack crosses the aim point.
      if (game.t >= MIN_SWING && Math.sign(now) !== Math.sign(previous)) tap(game);
      previous = now;
    } else previous = swingX(game) - topX(game) - aim(game);
    step(game, DT, slow);
  }
  return game;
}

test("a careful player can always go on: no impossible sack in a long run", () => {
  for (const seed of [1, 48213, 999_999_999, 31337]) {
    const game = play(seed, () => 0, false, 300);
    assert.equal(scoreOf(game), 300, `seed ${seed} stopped at ${scoreOf(game)}`);
    assert.ok(game.perfect >= 290, "aiming at the middle is nearly always ঠিক মাঝে");
    assert.ok(Math.abs(leanOf(game)) < 0.2);
  }
});

test("a headless run ends sanely: steady drift leans the pile over, a sloppy player slips", () => {
  const drift = play(48213, () => 0.25);
  assert.equal(drift.phase, "over");
  assert.equal(drift.verdict, "lean");
  assert.equal(scoreOf(drift), 3, "the fourth drop that drifts the same way leans it past one sack width");
  // Counter-steering toward the plumb line keeps a sloppy-but-thinking player alive much longer.
  const steer = play(48213, game => (leanOf(game) > 0 ? -0.25 : 0.25), false, 120);
  assert.equal(scoreOf(steer), 120);
  const late = play(555, () => 0.6);
  assert.equal(late.verdict, "slip");
  assert.equal(scoreOf(late), 0);
  const sum = (game: Game) => game.xs.length;
  assert.equal(sum(late), 1, "only the first sack is on the truck");
  assert.deepEqual(play(77, game => (scoreOf(game) % 3) * 0.17 - 0.1).xs, play(77, game => (scoreOf(game) % 3) * 0.17 - 0.1).xs, "same seed and timing, same pile");
  const slow = play(77, () => 0.1, true, 30);
  assert.equal(scoreOf(slow), 30);
});

test("the settle pause rolls the trolley to the next swing, then swings from rest at an end", () => {
  const game = newGame(12);
  step(game, 0.3, false);
  game.t = game.swing.period / 4; // a quarter swing from the end: right over the pile
  tap(game);
  step(game, DROP_TIME + 0.01, false);
  assert.equal(game.phase, "settle");
  assert.equal(scoreOf(game), 1);
  step(game, SETTLE_TIME + 0.01, false);
  assert.equal(game.phase, "swing");
  assert.equal(game.t, 0);
  assert.ok(Math.abs(Math.abs(swingX(game) - game.pivot) - game.swing.amp) < 1e-9, "the new sack hangs at the end of its swing");
});

test("score bands, lines and comparisons", () => {
  assert.equal(bandOf(0), "zero");
  assert.equal(bandOf(1), "start");
  assert.equal(bandOf(7), "start");
  assert.equal(bandOf(8), "good");
  assert.equal(bandOf(17), "good");
  assert.equal(bandOf(18), "great");
  assert.equal(bandOf(30), "master");
  assert.notEqual(humanLine(5), humanLine(20));
  assert.equal(versusLine(31, 28, "রাফি"), "রাফির চেয়ে ৩টা বস্তা বেশি!");
  assert.equal(versusLine(28, 28, "রাফি"), "সমান সমান! দুজনেরই ২৮টা বস্তা।");
  assert.equal(versusLine(26, 28, ""), "আর একটু হলেই! বন্ধুর চেয়ে মাত্র ২টা কম।");
  assert.match(versusLine(10, 28, "জাহিদ"), /^জাহিদ এগিয়ে, ১৮টা বস্তা/);
  assert.equal(shout("perfect", 1), "ঠিক মাঝে!");
  assert.equal(shout("perfect", 3), "ঠিক মাঝে! ×৩");
  assert.equal(friendBanner({ seed: 1, sacks: 28, perfect: 9, streak: 4, name: "রাফি", level: 1 }), "রাফি ২৮টা বস্তা সাজিয়েছে। একই দোল, এবার তোমার পালা।");
});

test("a card survives the link round trip in the game kit's link format", () => {
  const card: Card = { seed: 48213, sacks: 28, perfect: 9, streak: 4, name: "রাফি", level: 1 };
  const hash = cardHash(card);
  assert.equal(hash, challengeHash({ seed: 48213, target: 28, name: "রাফি", extra: { p: 9, c: 4 } }));
  assert.deepEqual(parseCard(`#${hash}`), card);
  assert.deepEqual(parseCard("#s=5&t=12"), { seed: 5, sacks: 12, perfect: 0, streak: 0, name: "", level: 1 }, "older or hand-made links without counts still open");
  const game = play(31337, g => (scoreOf(g) % 4) * 0.1 - 0.15, false, 40);
  const played: Card = { seed: game.seed, sacks: scoreOf(game), perfect: game.perfect, streak: game.bestCombo, name: "", level: 1 };
  assert.deepEqual(parseCard(cardHash(played)), played);
});

test("share refuses hostile or impossible links and caps names", () => {
  for (const state of ["", "#result", "s=0&t=10", "s=1000000000&t=10", "s=abc&t=10", "s=7&t=-1", "s=7&t=1000", "s=7&t=10.5",
    "s=7&t=10&p=11&c=1", "s=7&t=10&p=3&c=4", "s=7&t=10&p=3&c=0", "s=7&t=10&p=0&c=1", "s=7&t=10&p=03&c=1", "s=7&t=10&p=-1&c=0",
    "s=7&t=10&p=2&c=<b>", "s=7&t=10&p=2.0&c=1", `s=7&t=10&n=${"x".repeat(700)}`]) {
    assert.equal(share.normalize(state), null, state);
  }
  assert.equal(share.normalize("n=রাফি&c=4&p=9&t=28&s=48213"), "s=48213&t=28&p=9&c=4&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.equal(share.normalize("s=7&t=999&p=999&c=999"), "s=7&t=999&p=999&c=999");
  assert.equal(parseCard(`s=7&t=10&n=${encodeURIComponent("ক".repeat(50))}`)?.name.length, 20);
  assert.equal(parseCard(`s=7&t=10&n=${encodeURIComponent("রা‮ফি")}`)?.name, "রাফি", "no text-direction tricks in names");
  assert.equal(previewTitle({ seed: 7, sacks: 28, perfect: 9, streak: 4, name: "রাফি", level: 1 }), "রাফি ২৮টা বস্তা সাজিয়েছে। তুমি পারবে?");
  assert.equal(share.preview("s=7&t=28&p=9&c=4").title, "এক বন্ধু ২৮টা বস্তা সাজিয়েছে। তুমি পারবে?");
  assert.ok(share.preview("nope").title.length > 0);
});

test("content meets the SEO limits and stays clear of gambling words", () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  assert.ok(site.title.startsWith("বস্তা"));
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 5);
  assert.ok(site.steps.length >= 3 && site.privacy.some(line => line.includes("লিংক")));
  const copy = JSON.stringify(site) + JSON.stringify(share.preview("s=7&t=28&p=9&c=4"));
  assert.doesNotMatch(copy, /টাকা জিত|বাজি|জুয়া|লটারি|আপনি|করুন/);
});

test("ghats: ghat 1 is the original game, later ones swing faster from the start and ask for taller loads", () => {
  assert.equal(LEVEL_COUNT, 10);
  assert.deepEqual(newGame(48213, 1).swing, swingOf(48213, 0), "ghat 1 swings exactly as before");
  const speed = (game: Game) => (2 * Math.PI * game.swing.amp) / game.swing.period;
  for (let level = 2; level <= LEVEL_COUNT; level++) {
    const [before, now] = [GHATS[level - 2], GHATS[level - 1]];
    assert.ok(now.offset >= before.offset && now.goal >= before.goal, `ghat ${level} never gets easier`);
    assert.ok(now.goal < now.stars[0] && now.stars[0] < now.stars[1]);
    let faster = 0;
    for (let seed = 1; seed <= 50; seed++) if (speed(newGame(seed, level)) >= speed(newGame(seed, 1))) faster++;
    assert.ok(faster >= 40, `ghat ${level} starts faster on most seeds`);
  }
  assert.ok(GHATS[0].goal <= 5, "the first truck fills in the first few drops");
});

test("stars: none below the goal, then 1–3 by height; the next mark is exact", () => {
  assert.equal(starsOf(4, 1), 0);
  assert.equal(starsOf(5, 1), 1);
  assert.equal(starsOf(11, 1), 1);
  assert.equal(starsOf(12, 1), 2);
  assert.equal(starsOf(20, 1), 3);
  assert.equal(starsOf(400, 10), 3);
  assert.equal(nextMark(0, 1), 5);
  assert.equal(nextMark(5, 1), 12);
  assert.equal(nextMark(19, 1), 20);
  assert.equal(nextMark(20, 1), 0);
});

test("every ghat is fair: aiming at the middle reaches three stars on every seed", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    for (const seed of [1, 48213, 999_999_999, 31337, 7, 2024]) {
      const game = play(seed, () => 0, false, GHATS[level - 1].stars[1], level);
      assert.equal(starsOf(scoreOf(game), level), 3, `ghat ${level} seed ${seed} stopped at ${scoreOf(game)}`);
    }
    // A sloppy-but-thinking player (a quarter sack off, counter-steering) still fills the truck.
    const steer = play(555, game => (leanOf(game) > 0 ? -0.2 : 0.2), false, GHATS[level - 1].goal, level);
    assert.ok(starsOf(scoreOf(steer), level) >= 1, `ghat ${level}: the goal is in reach`);
  }
});

test("the old best moves into ghat 1's stars once, and only when there is nothing newer", () => {
  assert.equal(migrateBest({}, "12"), 2);
  assert.equal(migrateBest({}, "30"), 3);
  assert.equal(migrateBest({}, "3"), 0, "below the goal: nothing to move");
  assert.equal(migrateBest({}, null), 0);
  assert.equal(migrateBest({}, "abc"), 0);
  assert.equal(migrateBest({ 1: 1 }, "30"), 0, "already moved");
});

test("links carry the ghat; old links without it open ghat 1; bad ghats are refused", () => {
  const card: Card = { seed: 48213, sacks: 14, perfect: 3, streak: 2, name: "", level: 4 };
  assert.equal(cardHash(card), "s=48213&t=14&p=3&c=2&l=4");
  assert.deepEqual(parseCard(cardHash(card)), card);
  assert.equal(parseCard("s=48213&t=14&p=3&c=2")?.level, 1);
  assert.equal(cardHash({ ...card, level: 1 }), "s=48213&t=14&p=3&c=2", "ghat 1 links look exactly like before");
  for (const bad of ["s=7&t=10&l=0", "s=7&t=10&l=11", "s=7&t=10&l=02", "s=7&t=10&l=x", "s=7&t=10&l=2.5"]) assert.equal(parseCard(bad), null, bad);
  assert.match(friendBanner(card), /বাদামতলী|চাঁদপুর|ঘাটে/);
});
