// The challenge link: old links still open (and read as before), new ones round-trip, hostile ones are refused.
import assert from "node:assert/strict";
import test from "node:test";
import { challengeHash } from "../../../shared/game-core";
import { cardHash, cardStars, friendLine, parseCard, playLabel, previewTitle, versusLine, type Card } from "../lib/link";
import { bandOf, humanLine, shout } from "../lib/words";
import { share } from "../share";
import { play, runOf, SKILLED } from "./bot";

const old = (over: Partial<Card> = {}): Card => ({ seed: 48213, sacks: 28, perfect: 9, streak: 4, name: "রাফি", level: 1, kind: "old", mode: "n", ...over });

test("old links (no v) open exactly as before, and write exactly the old format", () => {
  const card = old();
  assert.equal(cardHash(card), challengeHash({ seed: 48213, target: 28, name: "রাফি", extra: { p: 9, c: 4 } }));
  assert.deepEqual(parseCard(`#${cardHash(card)}`), card);
  assert.deepEqual(parseCard("#s=5&t=12"), { seed: 5, sacks: 12, perfect: 0, streak: 0, name: "", level: 1, kind: "old", mode: "n" }, "hand-made links without counts still open");
  const ghat = old({ sacks: 14, perfect: 3, streak: 2, name: "", level: 4 });
  assert.equal(cardHash(ghat), "s=48213&t=14&p=3&c=2&l=4");
  assert.deepEqual(parseCard(cardHash(ghat)), ghat);
  assert.equal(playLabel(ghat), "ঘাট ৪ · চাঁদপুর");
  assert.equal(cardStars(old({ sacks: 12 })), 2, "old ghats keep their height stars");
  for (const bad of ["s=7&t=10&l=0", "s=7&t=10&l=11", "s=7&t=10&l=02", "s=7&t=10&l=x", "s=7&t=10&l=2.5", "s=7&t=10&d=e", "s=7&t=10&k=1"]) assert.equal(parseCard(bad), null, bad);
});

test("new links carry v=2, the level or খোলা ঘাট, and the mode; they round-trip", () => {
  const level: Card = { seed: 31337, sacks: 8, perfect: 5, streak: 3, name: "", level: 4, kind: "level", mode: "h" };
  assert.equal(cardHash(level), "s=31337&t=8&p=5&c=3&l=4&v=2&d=h");
  assert.deepEqual(parseCard(cardHash(level)), level);
  const endless: Card = { seed: 31337, sacks: 40, perfect: 12, streak: 5, name: "মিম", level: 1, kind: "endless", mode: "n" };
  assert.match(cardHash(endless), /^s=31337&t=40&p=12&c=5&v=2&k=1&n=/);
  assert.deepEqual(parseCard(cardHash(endless)), endless);
  assert.equal(cardStars(level), 3);
  assert.equal(cardStars(endless), 0);
  const game = play(runOf(77, 6), SKILLED).game;
  const played: Card = { seed: 77, sacks: game.n - 1, perfect: game.perfect, streak: game.bestCombo, name: "", level: 6, kind: "level", mode: "n" };
  assert.deepEqual(parseCard(cardHash(played)), played);
  for (const bad of ["s=7&t=10&v=2", "s=7&t=5&v=2&l=13", "s=7&t=5&v=2&l=1", "s=7&t=4&v=2&l=1&d=x", "s=7&t=4&v=2&l=1&d=n", "s=7&t=4&v=3&l=1", "s=7&t=4&v=2&k=2", "s=7&t=4&v=2&k=1&l=2"]) {
    assert.equal(parseCard(bad), null, bad);
  }
  assert.ok(parseCard("s=7&t=4&v=2&l=1"), "level 1's goal is exactly reachable");
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
  assert.equal(previewTitle(old()), "রাফি ২৮টা বস্তা সাজিয়েছে। তুমি পারবে?");
  assert.equal(share.preview("s=7&t=28&p=9&c=4").title, "এক বন্ধু ২৮টা বস্তা সাজিয়েছে। তুমি পারবে?");
  assert.equal(share.preview("s=7&t=8&p=5&c=3&l=4&v=2").title, "এক বন্ধু সন্ধ্যার লঞ্চ পার করেছে, ৫ বার ঠিক মাঝে। তুমি পারবে?");
  assert.ok(share.preview("nope").title.length > 0);
});

test("lines: bands, shouts and comparisons", () => {
  assert.equal(bandOf(0), "zero");
  assert.equal(bandOf(8), "good");
  assert.equal(bandOf(30), "master");
  assert.notEqual(humanLine(5), humanLine(20));
  assert.equal(shout("perfect", 1), "ঠিক মাঝে!");
  assert.equal(shout("perfect", 3), "ঠিক মাঝে! ×৩");
  assert.equal(versusLine({ sacks: 31, perfect: 0 }, old()), "রাফির চেয়ে ৩টা বস্তা বেশি।");
  assert.equal(versusLine({ sacks: 28, perfect: 0 }, old()), "সমান সমান। দুজনেরই ২৮টা বস্তা।");
  const level: Card = { seed: 1, sacks: 8, perfect: 5, streak: 3, name: "মিম", level: 4, kind: "level", mode: "n" };
  assert.equal(versusLine({ sacks: 8, perfect: 6 }, level), "মিমের চেয়ে ১ বার ঠিক মাঝে বেশি।", "both filled: compared by ঠিক মাঝে");
  assert.match(friendLine(level), /^মিম সন্ধ্যার লঞ্চ পার করেছে/);
});
