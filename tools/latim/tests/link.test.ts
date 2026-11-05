import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, unlockedLevel } from "../../../shared/game-core";
import { badgesOf, readBadges, BONUS } from "../lib/badges";
import { parseShared, sharedHash, type Shared } from "../lib/challenge";
import { site } from "../content";
import { fromOld, LEVEL_COUNT, LEVELS, MAX_SCORE, nextMark, OLD_COUNT, starsOf } from "../lib/levels";
import { bandOf, bumpCall, caption, clearLine, feat, friendBanner, humanLine, levelLabel, lossTip, nextLine, previewTitle, secs, streakCall, versusLine } from "../lib/lines";
import { BADGE_KEY, BESTS_KEY, LEVELS_KEY, loadProgress, migrateStars, oldBestKey, readBests, recommended, UNLOCK_KEY } from "../lib/progress";
import { F_DROP, F_WOBBLE } from "../lib/top";
import { share } from "../share";

const sample: Shared = { seed: 48213, level: 7, score: 124, palm: false, badges: ["t10"], name: "", mode: "n", old: 0 };

test("new links round-trip in a fixed key order", () => {
  const hash = sharedHash(sample);
  assert.equal(hash, "s=48213&t=124&l=7&v=2&b=t10");
  assert.deepEqual(parseShared(hash), sample);
  const full: Shared = { ...sample, score: 193, palm: true, badges: ["t10", "palm", "combo5"], name: "রাফি", mode: "h" };
  assert.deepEqual(parseShared(sharedHash(full)), full);
  assert.match(sharedHash(full), /^s=48213&t=193&l=7&v=2&d=h&p=1&b=t10-palm-combo5&n=/);
  assert.equal(parseShared(`s=1&t=0&l=12&v=2`)?.level, 12);
});

test("links from before the rewrite still open: level 1–9 on the old ladder, mapped to the same place, in their old form", () => {
  const old = parseShared("s=48213&t=124&l=7&b=t10")!;
  assert.equal(old.old, 7);
  assert.equal(old.level, fromOld(7));
  assert.equal(old.level, 9);
  assert.equal(old.mode, "n");
  assert.equal(sharedHash(old), "s=48213&t=124&l=7&b=t10", "re-serialises exactly as before");
  assert.equal(parseShared("s=7&t=62")?.old, 1, "no l is level 1");
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9].map(fromOld), [1, 3, 4, 5, 7, 8, 9, 11, 12]);
  assert.equal(OLD_COUNT, 9);
  // a palm run from the old game
  const palm = parseShared("s=9&t=193&l=3&p=1&b=t10-palm")!;
  assert.equal(palm.palm, true);
  assert.equal(sharedHash(palm), "s=9&t=193&l=3&p=1&b=t10-palm");
  // the old tests' own link
  assert.equal(share.normalize("n=রাফি&b=combo5-t10&t=120&l=2&s=48213"), "s=48213&t=120&l=2&b=t10-combo5&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.equal(share.normalize("s=7&t=999&l=9&b=t10-t20-t30"), "s=7&t=999&l=9&b=t10-t20-t30");
});

test("hostile or impossible links are refused", () => {
  const bad = [
    "", "nope", "s=0&t=10&l=1", "s=1&t=1000&l=1", "s=1&t=-1&l=1", `s=1.5&t=10&l=1`,
    "s=1&t=10&l=0", "s=1&t=10&l=10", "s=1&t=10&l=1&p=2", "s=1&t=20&l=1&p=1", "s=1&t=100&l=1&b=t20", "s=1&t=100&l=1&b=zzz", "s=1&t=100&l=1&b=t10-t10", "s=1&t=100&l=1&b=",
    "s=1&t=60&l=3&b=t10", "s=1&t=120&l=3&b=",
    "s=1&t=10&l=13&v=2", "s=1&t=10&l=0&v=2", "s=1&t=10&v=2", "s=1&t=10&l=3&v=3", "s=1&t=10&l=3&v=2&d=n", "s=1&t=10&l=3&v=2&d=x", "s=1&t=10&l=3&d=e",
    `s=1&t=10&l=1&n=x&${"y=".repeat(400)}`,
  ];
  for (const state of bad) {
    // `b=` (empty) is the one that is fine as "no badges": it parses
    if (state === "s=1&t=100&l=1&b=") continue;
    assert.equal(parseShared(state), null, state);
    assert.equal(share.normalize(state), null, state);
  }
  assert.equal(parseShared(`s=7&t=10&l=1&n=${encodeURIComponent("ক".repeat(50))}`)?.name.length, 20);
  assert.equal(parseShared("s=1&t=999&l=1&b=t10-t20-t30")?.score, MAX_SCORE);
});

test("the preview is personal, the caption names the place, and the banner says whose claim it is", () => {
  assert.equal(share.preview("s=7&t=62&l=1").title, "এক বন্ধুর লাটিম ৬.২ সেকেন্ড ঘুরেছে। তুমি পারবে?");
  assert.equal(previewTitle({ score: 124, name: "রাফি" }), "রাফির লাটিম ১২.৪ সেকেন্ড ঘুরেছে। তুমি পারবে?");
  assert.ok(share.preview("nope").title.length > 0 && share.preview("nope").description.length > 0);
  assert.match(caption({ score: 124, level: 2 }), /১২.৪ সেকেন্ড/);
  assert.match(caption({ score: 124, level: 2 }), /মাটির উঠানে/);
  assert.match(caption({ score: 124, level: 6 }), /পাকা মেঝেতে/);
  assert.match(caption({ score: 124, level: 12 }), /টিনের চালে/);
  assert.match(friendBanner({ score: 124, name: "রাফি", level: 7 }), /রাফির লাটিম ১২.৪ সেকেন্ড/);
  assert.match(feat({ score: 124, name: "" }), /^এক বন্ধুর লাটিম/);
  assert.equal(levelLabel(4), "মাটির উঠান · লেভেল ৪");
});

test("score bands, near-miss lines and the friend comparison", () => {
  assert.deepEqual([0, 59, 60, 119, 120, 179, 180, 249, 250, 999].map(bandOf), ["short", "short", "warm", "warm", "good", "good", "great", "great", "master", "master"]);
  assert.ok(humanLine(0).length > 0 && humanLine(300).length > 0);
  assert.match(nextLine(30, 1, "n"), /^আর ১.০ সেকেন্ড হলেই লেভেল পার/);
  assert.match(nextLine(100, 1, "n"), /২ তারা/);
  assert.match(nextLine(150, 1, "n"), /৩ তারা/);
  assert.equal(nextLine(300, 1, "n"), "");
  assert.equal(nextLine(190, 1, "e"), "", "easy has no third star to chase");
  assert.equal(nextMark(190, 1, "e"), 0);
  assert.equal(versusLine(130, 100, "রাফি"), "রাফির চেয়ে ৩.০ সেকেন্ড বেশি!");
  assert.match(versusLine(100, 100, ""), /সমান সমান/);
  assert.match(versusLine(90, 100, "রাফি"), /আর একটু হলেই/);
  assert.match(versusLine(40, 100, "রাফি"), /রাফি এগিয়ে/);
  assert.equal(secs(124), "১২.৪");
  assert.equal(streakCall(2), "টানা ২!"); assert.equal(streakCall(8), "টানা ৮!");
  assert.match(bumpCall(2, false), /মুরগি লাগল/); assert.match(bumpCall(2, true), /সামলে/);
  assert.equal(clearLine(1) === clearLine(12), false);
  // one exact tip, from what cost the most
  const base = { nudges: 6, good: 5, miss: 1, faced: 4, braced: 3, fall: F_WOBBLE, power: 0.9, straight: 0.9 };
  assert.match(lossTip({ ...base, fall: F_DROP }), /তুলতে গিয়ে/);
  assert.match(lossTip({ ...base, power: 0.4 }), /আলতো/);
  assert.match(lossTip({ ...base, straight: 0.3 }), /বাঁকা/);
  assert.match(lossTip({ ...base, nudges: 0, good: 0, miss: 0 }), /একটাও টোকা/);
  assert.match(lossTip({ ...base, good: 1, miss: 5 }), /মাঝখানে/);
  assert.match(lossTip({ ...base, braced: 0 }), /আগে টোকা/);
});

test("stars and marks: none below the first mark, three at the last, and easy stops at two", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const [one, two, three] = LEVELS[level - 1].stars;
    assert.equal(starsOf(one * 10 - 1, level), 0); assert.equal(starsOf(one * 10, level), 1);
    assert.equal(starsOf(two * 10, level), 2); assert.equal(starsOf(three * 10, level), 3);
    assert.equal(starsOf(three * 10, level, "e"), 2);
    assert.equal(nextMark(0, level), one * 10); assert.equal(nextMark(three * 10, level), 0);
  }
});

test("badges: milestones from the run, and only fixed ids survive storage", () => {
  assert.deepEqual(badgesOf(250, true, 6, 4), ["t10", "t20", "palm", "combo5"]);
  assert.deepEqual(badgesOf(100, false, 0, 0), ["t10", "still"]);
  assert.deepEqual(badgesOf(99, false, 4, 3), []);
  assert.equal(BONUS, 50);
  assert.deepEqual(readBadges(JSON.stringify(["palm", "evil", "t10", 5])), ["t10", "palm"]);
  assert.deepEqual(readBadges("not json"), []);
  assert.deepEqual(readBadges(null), []);
});

test("saved progress moves once to the new ladder: stars by place, bests by place, the unlock from the shared rule", () => {
  assert.deepEqual(migrateStars(JSON.stringify({ 1: 3, 2: 1, 5: 2, 9: 1 })), { 1: 3, 3: 1, 7: 2, 12: 1 });
  assert.deepEqual(migrateStars("junk"), {});
  const store: Record<string, string> = {
    [LEVELS_KEY]: JSON.stringify({ 1: 3, 2: 2, 3: 1 }), [oldBestKey(1)]: "150", [oldBestKey(2)]: "88", [oldBestKey(3)]: "oops", [oldBestKey(9)]: "1000",
  };
  const first = loadProgress(key => store[key] ?? null);
  assert.deepEqual(first.stars, { 1: 3, 3: 2, 4: 1 });
  assert.equal(first.unlock, unlockedLevel({ 1: 3, 3: 2, 4: 1 }, LEVEL_COUNT));
  assert.equal(first.unlock, 5);
  assert.deepEqual(first.bests, { 1: 150, 3: 88 }, "a broken or impossible best is dropped");
  assert.ok(first.write);
  // the second load reads what was saved; nothing migrates twice
  store[LEVELS_KEY] = first.write.levels; store[UNLOCK_KEY] = first.write.unlock; store[BESTS_KEY] = first.write.bests;
  const second = loadProgress(key => store[key] ?? null);
  assert.equal(second.write, null);
  assert.deepEqual(second.stars, first.stars); assert.equal(second.unlock, 5); assert.deepEqual(second.bests, first.bests);
  assert.deepEqual(readLevels(store[LEVELS_KEY], LEVEL_COUNT), first.stars);
  // a fresh phone
  const fresh = loadProgress(() => null);
  assert.deepEqual(fresh.stars, {}); assert.equal(fresh.unlock, 1);
  assert.equal(BADGE_KEY, "ektukhani-badges-latim");
  assert.deepEqual(readBests('{"2":88,"99":5,"x":1,"3":-4}'), { 2: 88 });
  assert.equal(recommended(1, {}), 1);
  assert.equal(recommended(4, { 1: 3, 2: 3, 3: 2 }), 4);
  assert.equal(recommended(3, { 1: 3, 2: 2, 3: 3 }), 2);
});

test("content meets the SEO limits and the voice rules", () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  assert.ok(site.title.startsWith("লাটিম"));
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(new Set(site.faq.map(item => item.question)).size === site.faq.length);
  assert.ok(site.steps.length >= 3 && site.privacy.some(line => line.includes("লিংক")));
  assert.ok(site.faq.find(item => item.question === "কয়টা লেভেল আছে?")!.answer.startsWith("১২টা"));
  const copy = JSON.stringify(site) + JSON.stringify(share.preview(sharedHash(sample)));
  assert.doesNotMatch(copy, /টাকা জিত|বাজি|জুয়া|আপনি|করুন/);
  assert.equal(copy, copy.normalize("NFC"), "Bangla is NFC");
  for (const level of LEVELS) assert.equal(level.teach, level.teach.normalize("NFC"));
  assert.ok(MAX_SCORE === 999);
});
