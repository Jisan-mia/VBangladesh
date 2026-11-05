// The challenge link: old links still open (and read as before), new ones round-trip, hostile ones are refused; progress
// on this phone keeps its old numbers; the words are personal and honest.
import assert from "node:assert/strict";
import test from "node:test";
import { challengeHash } from "../../../shared/game-core";
import { site } from "../content";
import {
  bn, cardHash, cardStars, caption, clearedCard, feat, friendLine, maxScore, parseCard, playLabel, previewTitle, tallyLine, versusLine, type Card,
} from "../lib/link";
import { LEVELS, LEVEL_COUNT, MODE_INFO, migrateBest, nextAhead, oldStarsOf, openLevel, potCount, readAhead, readBests, starsOf, validOldScore } from "../lib/levels";
import { share } from "../share";
import { play, runOf, SKILLED } from "./bot";

const old = (over: Partial<Card> = {}): Card => ({ seed: 48213, kind: "old", level: 1, mode: "n", score: 280, pots: 28, lost: 3, name: "রাফি", ...over });

test("old links (no v) open exactly as before and write exactly the old format", () => {
  const card = old();
  assert.equal(cardHash(card), "s=48213&t=280&n=" + encodeURIComponent("রাফি"));
  assert.deepEqual(parseCard("#" + cardHash(card)), card);
  assert.equal(cardHash(old({ level: 4, score: 140, pots: 14 })), "s=48213&t=140&l=4&n=" + encodeURIComponent("রাফি"));
  assert.equal(parseCard("s=5&t=0")?.kind, "old");
  assert.equal(parseCard("s=12&t=500")?.pots, 35);
  assert.equal(parseCard("s=12&t=500")?.lost, 0, "a full clear with every ball in hand");
  assert.equal(parseCard("s=12&t=450")?.lost, 1);
  assert.equal(parseCard("s=12&t=340")?.lost, 3);
  for (const bad of ["", "result", "#result", "s=0&t=10", "s=1000000000&t=10", "s=-4&t=10", "s=12&t=285", "s=12&t=350", "s=12&t=420", "s=12&t=-10", "s=12&t=550", "s=1.5&t=10",
    "s=12&t=ten", "s=7&t=10&l=0", "s=7&t=10&l=11", "s=7&t=10&l=02", "s=7&t=10&l=x", "s=7&t=10&d=e", "s=7&t=10&p=3", "s=12&t=10&n=" + "ক".repeat(700)]) {
    assert.equal(parseCard(bad), null, bad);
  }
  assert.ok(validOldScore(340) && validOldScore(400) && validOldScore(500) && !validOldScore(350) && !validOldScore(510));
});

test("new links carry v=2, the stall, the mode, pots and balls lost; they round-trip", () => {
  const p8 = potCount(LEVELS[7]), p12 = potCount(LEVELS[11]);
  const level: Card = { seed: 31337, kind: "level", level: 8, mode: "h", score: 880, pots: p8, lost: 0, name: "" };
  assert.equal(cardHash(level), `s=31337&t=880&l=8&v=2&d=h&p=${p8}&b=0`);
  assert.deepEqual(parseCard(cardHash(level)), level);
  const normal: Card = { ...level, mode: "n", level: 12, score: 700, pots: p12, lost: 1, name: "মিম" };
  assert.match(cardHash(normal), /^s=31337&t=700&l=12&v=2&p=\d+&b=1&n=/);
  assert.deepEqual(parseCard(cardHash(normal)), normal);
  const bot = play(runOf(77, 6), SKILLED).game;
  const played: Card = { seed: 77, kind: "level", level: 6, mode: "n", score: bot.score, pots: bot.broken, lost: bot.lost, name: "" };
  assert.deepEqual(parseCard(cardHash(played)), played, "a real run's card passes the link check");
  for (const bad of ["s=7&t=10&v=2", "s=7&t=0&v=2&l=13&p=0&b=3", "s=7&t=0&v=2&l=0&p=0&b=3", "s=7&t=0&v=3&l=1&p=0&b=3", "s=7&t=0&v=2&l=1&d=n&p=0&b=3", "s=7&t=0&v=2&l=1&d=x&p=0&b=3",
    "s=7&t=0&v=2&l=1&p=0", "s=7&t=0&v=2&l=1&b=3", "s=7&t=0&v=2&l=1&p=0&b=2", "s=7&t=10&v=2&l=1&p=0&b=3", "s=7&t=0&v=2&l=1&p=6&b=0", "s=7&t=0&v=2&l=1&p=05&b=3", "s=7&t=99999&v=2&l=1&p=5&b=0",
    "s=7&t=100&v=2&l=1&p=5&b=3", "s=7&t=100&v=2&l=1&p=5&b=-1", "s=7&t=100&v=2&l=1&d=e&p=5&b=5"]) {
    assert.equal(parseCard(bad), null, bad);
  }
  assert.ok(parseCard("s=7&t=0&v=2&l=1&p=0&b=3"), "an empty stall with every ball lost is real");
  assert.ok(parseCard(`s=7&t=${maxScore(1, "n")}&v=2&l=1&p=5&b=0`), "the most a stall can score is reachable");
  assert.equal(parseCard(`s=7&t=${maxScore(1, "n") + 1}&v=2&l=1&p=5&b=0`), null);
});

test("share refuses hostile or impossible links, drops unknown keys and caps names", () => {
  const good = cardHash(old());
  assert.equal(share.normalize(good), good);
  assert.equal(share.normalize(good + "&x=<script>"), good, "unknown keys are dropped");
  assert.equal(share.normalize("s=7&t=0&v=2&l=1&p=0&b=3&k=1"), "s=7&t=0&l=1&v=2&p=0&b=3");
  for (const bad of ["", "#result", "s=7&t=1000", "s=7&t=10.5", "s=7&t=10&v=2&l=1&p=11&b=1", "s=7&t=10&v=2&l=1&p=3&b=4"]) assert.equal(share.normalize(bad), null, bad);
  const odd = parseCard("s=12&t=10&n=" + encodeURIComponent("  রিমা‮\u0000 আক্তার আক্তার আক্তার  "));
  assert.equal(odd?.name, "রিমা আক্তার আক্তার আ");
  assert.equal(share.tally, undefined);
});

test("stars: cleared with every ball is ★★★, one lost ★★, more ★; easy tops out at ★★; a failed stall has none", () => {
  assert.deepEqual([[true, 0], [true, 1], [true, 2], [true, 4], [false, 3]].map(([cleared, lost]) => starsOf(cleared as boolean, lost as number)), [3, 2, 1, 1, 0]);
  assert.equal(starsOf(true, 0, "e"), 2);
  assert.equal(starsOf(true, 0, "h"), 3);
  assert.equal(MODE_INFO.e.maxStars, 2);
  const card: Card = { seed: 1, kind: "level", level: 2, mode: "n", score: 500, pots: 12, lost: 0, name: "" };
  assert.equal(cardStars(card), 3);
  assert.equal(cardStars({ ...card, lost: 1 }), 2);
  assert.equal(cardStars({ ...card, pots: 5, lost: 3 }), 0);
  assert.ok(clearedCard(card) && !clearedCard({ ...card, pots: 5 }));
  assert.equal(oldStarsOf(280, 1), 1);
  assert.equal(cardStars(old({ score: 450, pots: 35, lost: 1 })), 3, "old stalls keep their old star marks");
});

test("old progress keeps its numbers: the first stall's best moves into stars once, and only when nothing newer exists", () => {
  assert.equal(migrateBest({}, "500"), 3);
  assert.equal(migrateBest({}, "280"), 1);
  assert.equal(migrateBest({}, "60"), 0);
  assert.equal(migrateBest({ 1: 1 }, "500"), 0);
  assert.equal(migrateBest({}, null), 0);
  assert.equal(migrateBest({}, "junk"), 0);
  assert.equal(migrateBest({}, "285"), 0);
});

test("a friend's far stall records its stars but opens nothing in between; your own play still opens the way", () => {
  const stars = { 1: 3, 2: 2 };
  assert.equal(openLevel(stars, []), 3);
  const ahead = nextAhead(stars, [], 9);
  assert.deepEqual(ahead, [9]);
  const after = { ...stars, 9: 3 };
  assert.equal(openLevel(after, ahead), 3, "stall 9's stars don't open stalls 3 to 8");
  assert.equal(openLevel({ ...after, 3: 1 }, ahead), 4);
  let walking = { ...after }, list = ahead;
  for (let level = 3; level <= 8; level++) { list = nextAhead(walking, list, level); walking = { ...walking, [level]: 1 }; }
  assert.equal(openLevel(walking, list), 10, "once your own play reaches it, it counts as yours");
  assert.equal(openLevel({}, []), 1);
  assert.equal(openLevel({ 12: 3 }, [12]), 1);
  assert.deepEqual(readAhead("[9,9,2,\"x\",99,0]"), [2, 9]);
  assert.deepEqual(readAhead("not json"), []);
  assert.deepEqual(readBests("{\"3\":120,\"13\":5,\"x\":1,\"2\":-4}"), { 3: 120 });
  assert.deepEqual(readBests(null), {});
  assert.equal(LEVEL_COUNT, 12);
});

test("words are personal and honest", () => {
  const p4 = potCount(LEVELS[3]), level: Card = { seed: 5, kind: "level", level: 4, mode: "n", score: 620, pots: p4, lost: 1, name: "রাফি" };
  assert.equal(playLabel(level), "লেভেল ৪ · রহিম চাচার মটকা");
  assert.equal(tallyLine(level), `${bn(p4)}টার ${bn(p4)}টা, ২ বল বাকি`);
  assert.match(tallyLine({ ...level, lost: 0 }), /একটা বলও যায়নি/);
  assert.equal(tallyLine({ ...level, pots: 11, lost: 3 }), `${bn(p4)}টার ১১টা`);
  assert.equal(feat(level), "রহিম চাচার মটকা সাফ করেছে, ৬২০ পয়েন্ট");
  assert.match(friendLine(level), /রাফি .*একই দোকান, এবার তোমার পালা/);
  assert.equal(previewTitle(level), "রাফি রহিম চাচার মটকা সাফ করেছে, ৬২০ পয়েন্ট। তুমি পারবে?");
  assert.match(caption(level), /সাফ/);
  assert.match(caption({ ...level, pots: 11, lost: 3 }), new RegExp(`${bn(p4)}টার ১১টা`));
  assert.equal(previewTitle(old()), "রাফি ২৮০ করেছে। তুমি পারবে?", "old links keep their old preview, word for word");
  assert.equal(previewTitle(old({ name: "" })), "হাঁড়িভাঙায় ২৮০! তুমি পারবে?");
  assert.match(caption(old()), /৩৫টার ২৮টা হাঁড়ি ভাঙলাম/);
  assert.match(caption(old({ score: 450, pots: 35, lost: 1 })), /৩৫টা হাঁড়িই/);
  assert.match(versusLine(700, level), /৮০ পয়েন্ট বেশি/);
  assert.match(versusLine(620, level), /একদম সমান/);
  assert.match(versusLine(600, level), /আর একটু হলেই/);
  assert.match(versusLine(100, level), /এখনো ৫২০ পয়েন্ট এগিয়ে/);
  assert.equal(share.preview(cardHash(level)).title, previewTitle(level));
  assert.ok(share.preview("junk").title.length > 0);
});

test("content meets the SEO limits, has at least six questions, and never names a trademark", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 6);
  assert.ok(site.steps.length >= 3);
  assert.ok(site.headline && site.headline !== site.title);
  assert.match(site.privacy.join(" "), /স্কোর/);
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length, "no question twice");
  const everything = JSON.stringify(site) + share.preview("").description;
  assert.doesNotMatch(everything, /breakout|arkanoid|vaus|ব্রেকআউট|আরকানয়েড|অ্যারকানয়েড|atari|আটারি/i);
  assert.doesNotMatch(everything, /আপনি|করুন|জুয়া|বাজি|টাকা জিত/);
  assert.equal(everything, everything.normalize("NFC"));
  assert.ok(share.preview("").description.length <= 200);
});

test("the slug, the tally and the card text keep their old ids", () => {
  assert.equal(site.slug, "handi-bhanga");
  assert.equal(challengeHash({ seed: 1, target: 2 }), "s=1&t=2");
});
