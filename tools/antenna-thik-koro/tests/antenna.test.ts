import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { challengeHash } from "../../../shared/game-core";
import {
  angDiff, ASSIST_AFTER, BANDS, caption, CELEBRATE, chooseHint, compareLine, createGame, DECOY_PEAK, DWELL, friendClaim, friendLine, HALF_WIDTHS,
  humanLine, LEVEL_COUNT, levelDef, makeRounds, MAX_TENTHS, migrateBest, MIN_TENTHS, OLD_LEVELS, PICTURES, seconds, shout, signal, tenthsOf,
  wrap, type Game, type Hint, type Round,
} from "../lib/antenna";
import { parseShared, previewTitle, sharedHash, type Shared } from "../lib/link";
import { stepGame } from "../lib/step.hot";
import { site } from "../content";
import { share } from "../share";

const ROUNDS = 5;
const old = (level = 1) => levelDef(level, true);
const friendOf = (tenths: number, name: string, level = 1): Shared => ({ seed: 7, tenths, name, level, mode: "n", old: true });
const DT = 1 / 60;
const run = (game: Game, turnPerStep: number, seconds: number) => { for (let i = 0; i < Math.round(seconds / DT); i++) stepGame(game, turnPerStep, DT); };

test("the same seed gives the same five channels; another seed gives others", () => {
  assert.deepEqual(makeRounds(48213), makeRounds(48213, old(1)));
  assert.deepEqual(makeRounds(48213, levelDef(4)), makeRounds(48213, levelDef(4)));
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
  const game = createGame(48213, 1, "n", true);
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
  const game = createGame(48213, 1, "n", true);
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
  const game = createGame(48213, 1, "n", true), sweet = game.rounds[0].sweet, half = game.rounds[0].half;
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

// Hashes of makeRounds for 200 seeds on every old-table level, taken from the code before the rewrite (commit 6775639).
const OLD_ROUNDS: Record<number, string> = { 1: "cd3365d7820cac7d", 2: "9196c5639e5417b8", 3: "93eaac584f234b57", 4: "b04967fed6d80d02", 5: "db0ad5eaf4361cef", 6: "51846390f1e51db4", 7: "d61cd56bba6db5a0", 8: "edab7116e8a95d77", 9: "9d0e543ea17871c9", 10: "bcefc236765729b3", 11: "9508cc9ad7d74ac8", 12: "1a0acb607f439a4f" };

test("old links replay exactly: every old-table level makes the same channels as before the rewrite", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const all = Array.from({ length: 200 }, (_, index) => makeRounds((index + 1) * 7919, old(level)));
    assert.equal(createHash("sha256").update(JSON.stringify(all)).digest("hex").slice(0, 16), OLD_ROUNDS[level], `old level ${level}`);
  }
  assert.equal(OLD_LEVELS.length, LEVEL_COUNT);
});

test("wind sways the signal around its home while you search, and stays far from the ghost", () => {
  for (let seed = 1; seed <= 300; seed++) {
    makeRounds(seed, old(LEVEL_COUNT)).forEach(round => {
      assert.ok(round.wind && round.wind.home === round.sweet && round.decoy !== null);
      assert.ok(Math.abs(angDiff(round.decoy!, round.wind.home)) - round.wind.amp >= 80);
    });
  }
  const game = createGame(7, LEVEL_COUNT, "n", true), round = game.rounds[0], seen = new Set<number>();
  run(game, 0.01, 6);
  for (let i = 0; i < 400; i++) { stepGame(game, 0.001, DT); seen.add(Math.round(angDiff(round.sweet, round.wind!.home))); }
  assert.ok(Math.max(...seen) > 10 && Math.min(...seen) < -10, "it really moves");
  assert.ok([...seen].every(offset => Math.abs(offset) <= old(LEVEL_COUNT).wind));
  assert.equal(shout("start", 0, levelDef(5)), "আজ হাওয়া আছে, ছবি সরে সরে যায়। ঘোরাও!");
  assert.equal(shout("start", 0), "ঘুরিয়ে ছবি আনো!");
});

test("the old best time becomes level 1's stars, once, and junk is ignored", () => {
  assert.equal(migrateBest({}, "310"), 3);
  assert.equal(migrateBest({}, "480"), 2);
  assert.equal(migrateBest({}, "5999"), 1);
  assert.equal(migrateBest({ 1: 1 }, "200"), 0, "levels already saved: nothing to migrate");
  for (const junk of [null, "", "abc", "4.5", "-3", "10", "6001"]) assert.equal(migrateBest({}, junk), 0, String(junk));
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
  assert.equal(DWELL * ROUNDS * 10 <= MIN_TENTHS, true);
});

test("a friend's result is compared kindly and labelled as their own phone's time", () => {
  const friend = friendOf(473, "রাফি");
  assert.equal(compareLine(420, friend), "রাফির চেয়ে ৫.৩ সেকেন্ড আগে!");
  assert.equal(compareLine(473, friend), "রাফির সাথে একদম সমান সমান!");
  assert.equal(compareLine(490, friend), "আর একটু হলেই! রাফি মাত্র ১.৭ সেকেন্ড এগিয়ে।");
  assert.equal(compareLine(600, friend), "রাফি এবার ১২.৭ সেকেন্ড এগিয়ে। আরেকবার?");
  assert.equal(compareLine(600, { ...friend, name: "" }), "বন্ধু এবার ১২.৭ সেকেন্ড এগিয়ে। আরেকবার?");
  assert.equal(friendClaim(friend), "রাফির নিজের ফোনের সময়");
  assert.equal(friendLine(friend), "রাফি ৪৭.৩ সেকেন্ডে ৫টা চ্যানেল এনেছে। একই অ্যান্টেনা, এবার তোমার পালা।");
  assert.equal(previewTitle(friend), "রাফি ৪৭.৩ সেকেন্ডে ৫টা চ্যানেলের ছবি এনেছে। তুমি পারবে?");
  assert.equal(previewTitle({ ...friend, old: false }), "রাফি ৪৭.৩ সেকেন্ডে ৩টা চ্যানেলের ছবি এনেছে। তুমি পারবে?", "new level 1 has three channels");
  assert.match(caption(friend), /৪৭\.৩ সেকেন্ডে/);
});

test("the link round-trips; old links keep the old format, new ones add v=2 and the mode", () => {
  const card = friendOf(473, "রাফি");
  assert.equal(sharedHash({ ...card, seed: 48213 }), challengeHash({ seed: 48213, target: 473, name: "রাফি" }));
  assert.deepEqual(parseShared("#" + sharedHash(card)), card);
  assert.deepEqual(parseShared(sharedHash({ ...card, name: "" })), { ...card, name: "" });
  const later = { ...card, seed: 48213, level: 7 };
  assert.equal(sharedHash(later), "s=48213&t=473&l=7&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShared(sharedHash(later)), later);
  const fresh: Shared = { seed: 48213, tenths: 473, name: "", level: 4, mode: "h", old: false };
  assert.equal(sharedHash(fresh), "s=48213&t=473&l=4&v=2&d=h");
  assert.deepEqual(parseShared(sharedHash(fresh)), fresh);
  assert.equal(sharedHash({ ...fresh, mode: "n" }), "s=48213&t=473&l=4&v=2");
  assert.deepEqual(parseShared("s=48213&t=473&l=4&v=2&d=e"), { ...fresh, mode: "e" });
});

test("links from before levels still open, on old level 1; bad versions, modes and levels are refused", () => {
  assert.deepEqual(parseShared("#s=48213&t=473&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF"), { seed: 48213, tenths: 473, name: "রাফি", level: 1, mode: "n", old: true });
  assert.equal(sharedHash({ seed: 5, tenths: 473, name: "", level: 1, mode: "n", old: true }), "s=5&t=473", "level 1 writes the old format");
  for (const bad of ["0", "13", "07", "1.5", "x", ""]) assert.equal(parseShared(`s=5&t=473&l=${bad}`), null, bad);
  for (const bad of ["v=3", "v=", "v=2&d=x", "d=h", "d=e"]) assert.equal(parseShared(`s=5&t=473&l=2&${bad}`), null, bad);
  assert.equal(share.normalize("l=12&s=5&t=473"), "s=5&t=473&l=12");
  assert.equal(share.normalize("d=h&v=2&l=3&s=5&t=473"), "s=5&t=473&l=3&v=2&d=h");
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
  assert.ok(site.faq.length >= 6);
  assert.ok(site.headline && site.headline !== site.title && site.headline !== site.name);
  assert.ok(site.privacy.some(line => line.includes("লিংকে")));
  assert.ok(!/BTV|বিটিভি/i.test(JSON.stringify(site)), "no real channel names");
  const words = JSON.stringify(site);
  assert.equal(words, words.normalize("NFC"), "Bangla is NFC");
});
