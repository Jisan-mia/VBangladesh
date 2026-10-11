import assert from "node:assert/strict";
import test from "node:test";
import { challengeHash } from "../../../shared/game-core";
import {
  angDiff, ASSIST_AFTER, BANDS, caption, CELEBRATE, chooseHint, compareLine, createGame, DECOY_PEAK, DWELL, friendClaim, friendLine, HALF_WIDTHS,
  humanLine, makeRounds, MAX_TENTHS, MIN_TENTHS, PICTURES, ROUNDS, seconds, shout, signal, stepGame, tenthsOf, wrap, type Game, type Hint, type Round,
} from "../lib/antenna";
import { parseShared, previewTitle, sharedHash } from "../lib/link";
import { site } from "../content";
import { share } from "../share";

const DT = 1 / 60;
const run = (game: Game, turnPerStep: number, seconds: number) => { for (let i = 0; i < Math.round(seconds / DT); i++) stepGame(game, turnPerStep, DT); };

test("the same seed gives the same five channels; another seed gives others", () => {
  assert.deepEqual(makeRounds(48213), makeRounds(48213));
  assert.notDeepEqual(makeRounds(48213), makeRounds(48214));
  assert.equal(ROUNDS, HALF_WIDTHS.length);
});

test("every seed makes a fair game: sweet spots away from where you start, narrower each channel, ghosts far from the real signal", () => {
  for (let seed = 1; seed <= 2000; seed++) {
    const rounds = makeRounds(seed);
    assert.equal(rounds.length, ROUNDS);
    assert.equal(new Set(rounds.map(round => round.picture)).size, ROUNDS);
    let from = 0;
    rounds.forEach((round, index) => {
      assert.ok(PICTURES.includes(round.picture));
      assert.ok(round.sweet >= 0 && round.sweet < 360 && Number.isInteger(round.sweet));
      const away = Math.abs(angDiff(round.sweet, from));
      assert.ok(index === 0 ? away >= 60 && away <= 110 : away >= 75 && away <= 165, `seed ${seed} channel ${index}: ${away}°`);
      if (index > 0) assert.ok(round.half < rounds[index - 1].half);
      if (index < 2) assert.equal(round.decoy, null);
      else { const gap = Math.abs(angDiff(round.decoy!, round.sweet)); assert.ok(gap >= 100 && gap <= 160, `seed ${seed} ghost ${gap}°`); }
      from = round.sweet;
    });
  }
});

test("angles wrap the short way round", () => {
  assert.equal(wrap(-10), 350);
  assert.equal(wrap(725), 5);
  assert.equal(angDiff(1, 359), 2);
  assert.equal(angDiff(359, 1), -2);
  assert.equal(angDiff(90, 0), 90);
  assert.equal(angDiff(180, 0), -180);
});

test("the picture is clear only in the sweet spot, thins smoothly outside it, and a ghost never looks like the real thing", () => {
  const round: Round = { sweet: 2, half: 6, decoy: 140, picture: "nodi" };
  assert.equal(signal(round, 2), 1);
  assert.equal(signal(round, 357), 1);
  assert.equal(signal(round, 8), 1);
  assert.ok(signal(round, 9) < 0.86 && signal(round, 9) > 0.8);
  assert.ok(signal(round, 30) > signal(round, 60));
  assert.equal(signal(round, 182), 0);
  assert.ok(signal(round, 260) < 0.02);
  assert.ok(Math.abs(signal(round, 140) - DECOY_PEAK) < 1e-9);
  assert.ok(signal(round, 150) < DECOY_PEAK);
});

test("the clock waits for the first turn, and spinning past the signal never locks it", () => {
  const game = createGame(48213);
  run(game, 0, 3);
  assert.equal(game.phase, "ready");
  assert.equal(game.time, 0);
  // 6° a step is 360°/s: the antenna crosses the sweet spot many times without staying.
  run(game, 6, 4);
  assert.equal(game.phase, "search");
  assert.equal(game.index, 0);
  assert.ok(Math.abs(game.time - 4) < 0.05);
});

test("holding still in the sweet spot locks the picture after the dwell; the celebration isn't timed", () => {
  const game = createGame(48213);
  stepGame(game, angDiff(game.rounds[0].sweet, game.angle), DT);
  assert.equal(game.hint, "hold");
  run(game, 0, DWELL - 0.1);
  assert.equal(game.phase, "search");
  run(game, 0, 0.15);
  assert.equal(game.phase, "got");
  assert.equal(game.hint, "got");
  const clock = game.time;
  run(game, 0, CELEBRATE - 0.1);
  assert.equal(game.time, clock);
  run(game, 0, 0.2);
  assert.equal(game.index, 1);
  assert.equal(game.phase, "search");
  assert.equal(game.hint, "next");
  assert.equal(shout("next", 1), "এবার চ্যানেল ২! আবার ঘোরাও।");
});

test("sliding out of the sweet spot says which way to go back", () => {
  const game = createGame(48213), sweet = game.rounds[0].sweet, half = game.rounds[0].half;
  stepGame(game, angDiff(sweet, game.angle), DT);
  stepGame(game, half + 3, DT);
  assert.equal(game.hint, "slip-left");
  stepGame(game, -(half + 3), DT);
  assert.equal(game.hint, "hold");
  stepGame(game, -(half + 3), DT);
  assert.equal(game.hint, "slip-right");
});

test("downstairs only knows the direction near the signal, or after a long search", () => {
  const round: Round = { sweet: 100, half: 9, decoy: 230, picture: "gaan" };
  const say = (angle: number, roundTime = 1, approach = 0, still = 0): Hint => chooseHint(round, angle, roundTime, approach, still);
  assert.equal(say(80), "right");
  assert.equal(say(125), "left");
  assert.equal(say(230), "ghost");
  assert.equal(say(40, 1, 2), "warmer");
  assert.equal(say(40, 1, -2), "colder");
  assert.equal(say(40, 1, 0), "fuzzy");
  assert.equal(say(300), "nothing");
  assert.equal(say(300, 3, 0, 3), "idle");
  assert.equal(say(175, ASSIST_AFTER), "far-left");
  assert.equal(say(330, ASSIST_AFTER), "far-right");
  assert.equal(say(0, ASSIST_AFTER), "far-right");
});

test("a scripted player that follows the shouts finishes every seed in a plausible time", () => {
  const times: number[] = [];
  for (let seed = 1; seed <= 300; seed++) {
    const game = createGame(seed);
    let direction = seed % 2 ? 1 : -1, steps = 0, seen = game.hint, reaction = 0, heard = game.hint;
    while (game.phase !== "over" && steps++ < 60 * 300) {
      if (game.hint !== heard) { heard = game.hint; reaction = 0.3; }
      if (reaction > 0 && (reaction -= DT) <= 0) seen = heard;
      if (/right$/.test(seen)) direction = 1;
      if (/left$/.test(seen)) direction = -1;
      if (seen === "colder") { direction = -direction; seen = "fuzzy"; }
      const speed = seen === "hold" || seen === "got" ? 0 : /^(right|left|slip)/.test(seen) ? 25 : 90;
      stepGame(game, direction * speed * DT, DT);
    }
    assert.equal(game.phase, "over", `seed ${seed} never finished`);
    assert.equal(game.index, ROUNDS - 1);
    times.push(tenthsOf(game.time));
  }
  times.sort((a, b) => a - b);
  assert.ok(times[0] >= MIN_TENTHS, `fastest ${times[0]}`);
  assert.ok(times.at(-1)! < 900, `slowest ${times.at(-1)}`);
  const median = times[times.length >> 1];
  assert.ok(median > 100 && median < 450, `median ${median}`);
});

test("time is scored in tenths, shown in Bangla digits, and every band has a kind line", () => {
  assert.equal(seconds(473), "৪৭.৩");
  assert.equal(seconds(30), "৩.০");
  assert.equal(tenthsOf(47.26), 473);
  assert.equal(tenthsOf(0.1), MIN_TENTHS);
  assert.equal(tenthsOf(99999), MAX_TENTHS);
  assert.equal(humanLine(150), BANDS[0].line);
  assert.equal(humanLine(200), BANDS[1].line);
  assert.equal(humanLine(400), BANDS[2].line);
  assert.equal(humanLine(MAX_TENTHS), BANDS[3].line);
  assert.equal(new Set(BANDS.map(band => band.line)).size, BANDS.length);
});

test("a friend's result is compared kindly and labelled as their own phone's time", () => {
  const friend = { seed: 7, tenths: 473, name: "রাফি" };
  assert.equal(compareLine(420, friend), "রাফির চেয়ে ৫.৩ সেকেন্ড আগে!");
  assert.equal(compareLine(473, friend), "রাফির সাথে একদম সমান সমান!");
  assert.equal(compareLine(490, friend), "আর একটু হলেই! রাফি মাত্র ১.৭ সেকেন্ড এগিয়ে।");
  assert.equal(compareLine(600, friend), "রাফি এবার ১২.৭ সেকেন্ড এগিয়ে। আরেকবার?");
  assert.equal(compareLine(600, { ...friend, name: "" }), "বন্ধু এবার ১২.৭ সেকেন্ড এগিয়ে। আরেকবার?");
  assert.equal(friendClaim(friend), "রাফির নিজের ফোনের সময়");
  assert.equal(friendLine(friend), "রাফি ৪৭.৩ সেকেন্ডে ৫টা চ্যানেল এনেছে। একই অ্যান্টেনা, এবার তোমার পালা।");
  assert.equal(previewTitle(friend), "রাফি ৪৭.৩ সেকেন্ডে ৫টা চ্যানেলের ছবি এনেছে। তুমি পারবে?");
  assert.match(caption(473), /৪৭\.৩ সেকেন্ডে/);
});

test("the link round-trips in game-core's challenge format", () => {
  const card = { seed: 48213, tenths: 473, name: "রাফি" };
  assert.equal(sharedHash(card), challengeHash({ seed: 48213, target: 473, name: "রাফি" }));
  assert.deepEqual(parseShared("#" + sharedHash(card)), card);
  assert.deepEqual(parseShared(sharedHash({ ...card, name: "" })), { ...card, name: "" });
});

test("share normalize rejects hostile or impossible links and canonicalises the rest", () => {
  const ok = share.normalize("t=473&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF&s=48213&x=1");
  assert.equal(ok, "s=48213&t=473&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  for (const bad of ["", "s=0&t=473", "s=1000000000&t=473", "s=5.5&t=473", "s=5&t=-1", "s=5&t=1.5", "s=5&t=10", "s=5&t=6001", "s=abc&t=473", "s=5", "s=5&t=473&n=" + "x".repeat(700)]) {
    assert.equal(share.normalize(bad), null, bad);
  }
  assert.equal(share.normalize(`s=5&t=${MIN_TENTHS}`), `s=5&t=${MIN_TENTHS}`);
  assert.equal(share.normalize("s=5&t=473&n=<script>alert(1)</script>"), "s=5&t=473&n=%3Cscript%3Ealert%281%29%3C%2Fsc");
  assert.equal(parseShared("s=5&t=473&n=‮রাফি\u0007")?.name, "রাফি");
  assert.equal(parseShared("s=5&t=473&n=" + "ক".repeat(25))?.name.length, 20);
  assert.equal(share.preview("s=5&t=473&n=রাফি").title, "রাফি ৪৭.৩ সেকেন্ডে ৫টা চ্যানেলের ছবি এনেছে। তুমি পারবে?");
  assert.equal(share.preview("junk").title, site.headline);
});

test("page copy stays inside the SEO limits", () => {
  assert.ok(site.title.length <= 45, `title ${site.title.length}`);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `description ${site.description.length}`);
  assert.ok(site.faq.length >= 5);
  assert.ok(site.headline && site.headline !== site.title && site.headline !== site.name);
  assert.ok(site.privacy.some(line => line.includes("লিংকে")));
  assert.ok(!/BTV|বিটিভি/i.test(JSON.stringify(site)), "no real channel names");
});
