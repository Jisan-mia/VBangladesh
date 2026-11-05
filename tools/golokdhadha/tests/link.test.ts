// Links: old ones (before v=2) still open the old maze with the old checks; new ones round-trip and are checked exactly;
// hostile ones are refused. Plus the result lines and the page's words.
import assert from "node:assert/strict";
import test from "node:test";
import { challengeHash } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import { oldDailyMaze, oldFastestTenths, oldLevelMaze, oldParFor, oldStarsForTime, OLD_SLOW_SPEED } from "../lib/legacy";
import { fastestTenths, levelBoard, parOf, starsOf } from "../lib/levels";
import { caption, compareLine, feat, friendClaim, humanLine, mazeLabel, nearLine, parseShared, previewTitle, seconds, sharedHash, type Shared } from "../lib/link";

/** A link exactly as the old game wrote it. */
function oldLink(level: number, tenths: number, extra: Record<string, string | number> = {}, name = "রাফি") {
  const maze = level ? oldLevelMaze(level) : oldDailyMaze(20261012);
  const stars = oldStarsForTime(tenths, oldParFor(maze));
  return challengeHash({ seed: maze.seed, target: tenths, name, extra: { l: level, r: stars, c: 1, ...extra } });
}
const mine = (level: number, extra: Partial<Shared> = {}): Shared => {
  const where = { level, seed: 0, old: false }, tenths = parOf(where, "n", false).three - 3;
  return { level, seed: levelBoard(level).board.seed, tenths, stars: starsOf(tenths, parOf(where, "n", false), "n"), clean: true, name: "রাফি", mode: "n", slow: false, old: false, ...extra };
};

test("old links still open: the same old maze, the old checks, and they write back exactly as before", () => {
  const maze = oldLevelMaze(7), tenths = oldParFor(maze).three - 4, hash = oldLink(7, tenths);
  const shared = parseShared(`#${hash}`);
  assert.ok(shared);
  assert.equal(shared.old, true);
  assert.equal(shared.seed, maze.seed);
  assert.equal(sharedHash(shared), hash, "re-shared in the old format, so short links and previews stay the same");
  assert.equal(share.normalize(hash), hash);
  // The old lenient slow-mode stars still pass.
  const slowTenths = oldParFor(maze, OLD_SLOW_SPEED).three;
  assert.ok(parseShared(challengeHash({ seed: maze.seed, target: slowTenths, extra: { l: 7, r: 3 } })));
  // An old daily.
  const daily = oldDailyMaze(20261012), dt = oldFastestTenths(daily) + 40;
  assert.ok(parseShared(challengeHash({ seed: 20261012, target: dt, extra: { l: 0, r: oldStarsForTime(dt, oldParFor(daily)) } }))?.old);
  // New keys on an old link are refused rather than half-read.
  assert.equal(parseShared(oldLink(7, tenths, { d: "h" })), null);
});

test("new links round-trip, carry the mode and speed, and are checked against the new board exactly", () => {
  const shared = mine(13);
  const hash = sharedHash(shared);
  assert.match(hash, /^s=\d+&t=\d+&l=13&r=3&v=2&c=1&n=/);
  assert.deepEqual(parseShared(`#${hash}`), shared);
  const hard = { ...mine(20), mode: "h" as const };
  hard.stars = starsOf(hard.tenths, parOf({ level: 20, seed: 0, old: false }, "h", false), "h");
  assert.deepEqual(parseShared(sharedHash(hard)), hard);
  assert.match(sharedHash(hard), /d=h/);
  const daily: Shared = { level: 0, seed: 20261104, tenths: 400, stars: starsOf(400, parOf({ level: 0, seed: 20261104, old: false }, "n", false), "n"), clean: false, name: "", mode: "n", slow: false, old: false };
  assert.deepEqual(parseShared(sharedHash(daily)), daily);
});

test("forged, broken or hostile links are refused", () => {
  const shared = mine(9), hash = sharedHash(shared);
  const params = (change: Record<string, string | null>) => { const p = new URLSearchParams(hash); for (const [k, v] of Object.entries(change)) v === null ? p.delete(k) : p.set(k, v); return p.toString(); };
  const where = { level: 9, seed: 0, old: false };
  const bad = [
    "", "junk", "#result", params({ l: null }), params({ r: null }), params({ s: null }), params({ t: null }),
    params({ l: "31" }), params({ l: "-1" }), params({ l: "07" }), params({ l: "8" }), params({ l: "1.0" }),
    params({ s: String(shared.seed + 1) }), params({ s: "0" }),
    params({ t: String(fastestTenths(where, false) - 1) }), params({ t: "-5" }), params({ t: "36001" }),
    params({ r: "0" }), params({ r: "4" }), params({ r: "2" }),
    params({ v: "3" }), params({ d: "n" }), params({ d: "x" }), params({ w: "0" }), params({ w: "1", t: String(fastestTenths(where, true) - 1) }),
    params({ c: "yes" }), params({ l: "0" }), params({ l: "0", s: "20261301" }),
    params({ n: "ক".repeat(700) }),
  ];
  for (const state of bad) assert.equal(share.normalize(state), null, state);
  const odd = parseShared(params({ n: "  রিমা‮\u0000 আক্তার আক্তার আক্তার  " }));
  assert.equal(odd?.name, "রিমা আক্তার আক্তার আ");
});

test("previews, captions and lines are personal, exact and kind", () => {
  const shared = { ...mine(7), tenths: 124 };
  assert.equal(feat(shared), "রাফি ১২.৪ সেকেন্ডে লেভেল ৭ পার করেছে");
  assert.equal(previewTitle(shared), `${feat(shared)}। তুমি পারবে?`);
  assert.equal(mazeLabel({ level: 0, seed: 20260105 }), "৫ জানুয়ারির গোলকধাঁধা");
  assert.equal(caption(shared), "গোলকধাঁধার লেভেল ৭ পার করলাম ১২.৪ সেকেন্ডে। তুমি কত সেকেন্ডে পারবে?");
  assert.equal(seconds(5), "০.৫");
  assert.match(friendClaim({ ...shared, mode: "h", slow: true }), /^কঠিন, ধীরে খেলোয় খেলেছিল।/);
  assert.equal(share.preview(sharedHash(mine(20, { name: "মিম" }))).title, previewTitle(mine(20, { name: "মিম" })));
  assert.equal(share.preview("junk").title, "গোলকধাঁধা: গলি পেরিয়ে জিলাপির দোকানে যাও");
  assert.equal(share.tally, undefined, "no tally id");
  assert.equal(compareLine(100, 124, "রাফি"), "রাফির চেয়ে ২.৪ সেকেন্ড আগে!");
  assert.equal(nearLine(63, { three: 50, two: 130 }, "n"), "আর ১.৩ সেকেন্ড কম লাগলে ৩ তারা।");
  assert.equal(nearLine(140, { three: 50, two: 130 }, "n"), "আর ১.০ সেকেন্ড কম লাগলে ২ তারা।");
  assert.equal(nearLine(20, { three: 50, two: 130 }, "e"), "সহজে বড়জোর ২ তারা। ৩ তারা পেতে সাধারণে খেলো।");
  assert.equal(nearLine(20, { three: 50, two: 130 }, "n"), "");
  const lines = [3, 2, 1].flatMap(stars => [humanLine(stars, true), humanLine(stars, false)]);
  assert.equal(new Set(lines).size, 6);
});

test("content meets the SEO limits, keeps the URL's words and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^গোলকধাঁধা গেম/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.notEqual(site.headline, site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => /৩০/.test(item.answer)), "the FAQ says how many levels");
  assert.ok(site.steps.length >= 3);
  assert.match(site.privacy.join(" "), /সময়/);
  const everything = JSON.stringify(site) + share.preview("").description;
  assert.doesNotMatch(everything, /আপনি|করুন|দেখুন|অসাধারণ|সহজেই/);
  assert.equal(everything.normalize("NFC"), everything);
});
