// Links, words and copy: old links still open the old class, new ones carry the level and mode, and the page text stays inside
// the rules and away from the famous series.
import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import { BOARDS, CHITS, createGame, makeClass, REPLIES, TITLE } from "../lib/class";
import { benchesOf, compareLine, fastest, friendClaim, friendLine, parseShared, previewTitle, seconds, sharedHash } from "../lib/challenge";
import { caption, cardLine, clearLine, coach, edgeOf, lossLine, migrateLevels, nearMiss, statusOf, type Status } from "../lib/lines";
import { LEVEL_COUNT } from "../lib/levels";
import { PANELS } from "../components/story";
import { stepGame } from "../lib/step.hot";
import { LEVELS } from "../lib/levels";

test("old links open the original class exactly as they always did", () => {
  assert.deepEqual(parseShared("s=5&t=224&c=1"), { seed: 5, tenths: 224, catches: 1, name: "", level: 5, mode: "n", old: true });
  assert.deepEqual(parseShared("s=777&t=180&c=0&l=8&n=%E0%A6%AE%E0%A6%BF%E0%A6%AE"), { seed: 777, tenths: 180, catches: 0, name: "মিম", level: 8, mode: "n", old: true });
  const old = parseShared("s=777&t=180&c=0&l=8")!;
  assert.equal(sharedHash(old), "s=777&t=180&c=0&l=8", "written back in the old shape");
  assert.equal(sharedHash({ ...old, level: 5 }), "s=777&t=180&c=0", "class 5 left out, as before");
  assert.equal(parseShared("s=7&t=180&c=0&l=5")!.level, 5);
  assert.equal(benchesOf(old), 8, "the old room had eight benches");
  assert.equal(parseShared("s=5&t=50&c=0"), null, "faster than the old room allowed");
  for (const bad of ["s=7&t=180&l=0", "s=7&t=180&l=11", "s=7&t=180&l=x", "s=7&t=180&l=03", "s=7&t=180&d=e", "s=7&t=180&c=99", "s=7&t=9999"]) assert.equal(parseShared(bad), null, bad);
});

test("new links carry the level, the mode and v=2, and round-trip", () => {
  const link = { seed: 777, tenths: 180, catches: 1, name: "মিম", level: 9, mode: "h" as const, old: false };
  const hash = sharedHash(link);
  assert.equal(hash, `s=777&t=180&c=1&l=9&v=2&d=h&n=${encodeURIComponent("মিম")}`);
  assert.deepEqual(parseShared(hash), link);
  assert.equal(share.normalize(hash), hash);
  assert.equal(sharedHash({ ...link, mode: "n" }), `s=777&t=180&c=1&l=9&v=2&n=${encodeURIComponent("মিম")}`, "no mode means সাধারণ");
  assert.equal(parseShared("s=777&t=180&c=0&l=9&v=2")!.mode, "n");
  for (const bad of ["s=7&t=180&v=2", "s=7&t=180&l=13&v=2", "s=7&t=180&l=9&v=3", "s=7&t=180&l=9&v=2&d=n", "s=7&t=180&l=9&v=2&d=x", "s=7&t=10&l=9&v=2"]) assert.equal(parseShared(bad), null, bad);
  assert.equal(share.normalize("s=7&t=180&l=9&v=2&evil=1"), "s=7&t=180&c=0&l=9&v=2", "unknown keys are dropped");
  assert.equal(share.normalize("javascript:alert(1)"), null);
  assert.ok(share.preview(hash).title.includes("লেভেল ৯"));
  assert.ok(share.preview("").title.length > 10);
});

test("a finale link can only be a win: three catches would have ended it", () => {
  assert.equal(parseShared("s=7&t=400&c=3&l=4&v=2"), null);
  assert.equal(parseShared("s=7&t=400&c=2&l=4&v=2")?.catches, 2);
  assert.ok(parseShared("s=7&t=400&c=9&l=5&v=2"), "ordinary levels have no limit");
});

test("a faster time than the room allows is forged", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const floor = fastest(level, false);
    assert.equal(parseShared(`s=1&t=${floor - 1}&l=${level}&v=2`), null, `level ${level}`);
    assert.ok(parseShared(`s=1&t=${floor}&l=${level}&v=2`));
    // Nobody, even holding without a stop, beats it.
    const g = createGame(makeClass(3, level));
    for (let i = 0; i < 60 * 120 && g.phase !== "over"; i++) stepGame(g, !g.needRelease, 1 / 60);
    if (g.won) assert.ok(Math.round(g.time * 10) >= floor, `level ${level}: ${g.time} vs ${floor / 10}`);
  }
});

test("the friend's words are kind, exact and honest about whose clock it is", () => {
  const friend = { name: "রাফি", tenths: 224 };
  assert.equal(seconds(224), "২২.৪");
  assert.equal(compareLine(200, friend), "রাফির চেয়ে ২.৪ সেকেন্ড আগে।");
  assert.equal(compareLine(224, friend), "রাফির সাথে একদম সমান সমান।");
  assert.equal(compareLine(240, friend), "আর একটু হলেই। রাফি মাত্র ১.৬ সেকেন্ড এগিয়ে।");
  assert.equal(compareLine(400, friend), "রাফি এবার ১৭.৬ সেকেন্ড এগিয়ে। আরেকবার?");
  const link = parseShared("s=1&t=224&c=0&l=9&v=2&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF")!;
  assert.ok(friendClaim(link).includes("নিজের ফোনের সময়"));
  assert.ok(friendLine(link).includes("২২.৪"));
  assert.equal(previewTitle(link), "রাফি লেভেল ৯-এ ২২.৪ সেকেন্ডে চিরকুট শেষ বেঞ্চে পৌঁছে দিয়েছে। তুমি পারবে?");
  assert.ok(previewTitle(parseShared("s=5&t=224&c=1")!).startsWith("এক বন্ধু ২২.৪"));
});

test("the pass button always says what to do and why, for every status", () => {
  const statuses: Status[] = ["ready", "write", "warn", "look", "cough", "peek", "blind", "lens", "wipe", "back", "dark", "flick", "captain-warn", "captain-look", "door-warn", "door-look", "scold", "lift", "throw", "sleeper", "done", "lost"];
  for (const status of statuses) for (const held of [false, true]) for (const tap of [false, true]) {
    const [big, small] = coach(status, held, tap, "স্যার", "পাক্কা!");
    assert.ok(big.length > 1 && small.length > 3, `${status}`);
  }
  // Every colour-coded danger is also words: the edge and the button agree.
  for (const status of ["warn", "lens", "back", "flick", "captain-warn", "door-warn"] as const) assert.equal(edgeOf(status), "warn", status);
  for (const status of ["look", "captain-look", "door-look", "scold"] as const) assert.equal(edgeOf(status), "watch", status);
  for (const status of ["write", "cough", "peek", "blind", "wipe", "dark", "throw", "ready", "done"] as const) assert.equal(edgeOf(status), "", status);
  assert.equal(coach("warn", true, false, "স্যার", "")[0], "ছাড়ো!");
});

test("status follows what is visible: a peek reads as safe, a tell as a warning, a look as a look", () => {
  const g = createGame(makeClass(5, 1));
  assert.equal(statusOf(g, false, false), "ready");
  stepGame(g, true, 1 / 60);
  assert.equal(statusOf(g, true, false), "write");
  for (let i = 0; i < 60 * 40 && g.klass.kinds[g.seg] !== 1; i++) stepGame(g, false, 1 / 60);
  assert.equal(statusOf(g, false, false), "warn");
});

test("every ending has a kind line, a near miss gives the exact seconds, and losses name the one thing to watch", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.ok(clearLine(level).length > 10);
  assert.ok(clearLine(10, true).length > 5);
  const targets = { three: 160, two: 210 };
  assert.equal(nearMiss({ tenths: 172, stars: 2, targets, mode: "n", best: null }), "আর ১.২ সেকেন্ড আগে পৌঁছালেই ৩ তারা।");
  assert.equal(nearMiss({ tenths: 230, stars: 1, targets, mode: "n", best: null }), "আর ২.০ সেকেন্ড আগে পৌঁছালেই ২ তারা।");
  assert.equal(nearMiss({ tenths: 150, stars: 3, targets, mode: "n", best: 140 }), "আর ১.০ সেকেন্ড আগে হলেই নতুন সেরা।");
  assert.equal(nearMiss({ tenths: 150, stars: 3, targets, mode: "n", best: 100 }), "", "too far to call it close");
  assert.ok(nearMiss({ tenths: 100, stars: 2, targets, mode: "e", best: null }).includes("সাধারণে"), "easy points at the normal mode for a third star");
  for (const level of [4, 8, 12]) for (const by of [0, 1]) assert.match(lossLine(level, "sir", by), /টেবিলে/);
  assert.ok(lossLine(4, "sir", 1).includes("মিলি"));
  assert.ok(lossLine(8, "head", 1).includes("পায়ের শব্দ"));
  assert.ok(cardLine(3, "madam").includes("ম্যাডাম"));
  assert.ok(caption(224, "sir", 8).includes("২২.৪"));
});

test("an old phone's best time opens classes 1–6, once", () => {
  assert.equal(migrateLevels(null, "224"), JSON.stringify({ 5: 1 }));
  assert.equal(unlockedLevel(readLevels(migrateLevels(null, "224"), LEVEL_COUNT), LEVEL_COUNT), 6);
  assert.equal(migrateLevels(null, null), null);
  assert.equal(migrateLevels(null, "junk"), null);
  assert.equal(migrateLevels("{}", "224"), null, "already moved");
});

test("the story is three lines, one panel each, and short", () => {
  assert.equal(PANELS.length, 3);
  for (const line of PANELS) assert.ok(line.length <= 80);
});

test("page copy stays inside the SEO limits, has enough FAQ, and keeps clear of the famous series, exams and the cane", () => {
  assert.ok(site.title.length <= 45, `title ${site.title.length}`);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `description ${site.description.length}`);
  assert.ok(site.faq.length >= 6);
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length);
  assert.ok(site.headline && site.headline !== site.title && site.headline !== site.name);
  assert.ok(site.privacy.some(line => line.includes("লিংকে")));
  assert.equal(site.slug, "sir-ghurlei-thamo");
  const everything = JSON.stringify(site) + CHITS.join() + BOARDS.flat(2).join() + REPLIES.join() + JSON.stringify(LEVELS) + PANELS.join() + Object.values(TITLE).join();
  assert.ok(!/squid|red light|green light|স্কুইড|রেড লাইট|পুতুল|ট্র্যাকস্যুট/i.test(everything));
  assert.ok(!/পরীক্ষা|উত্তরপত্র|নকল|বেত\b/.test(everything), "no exams, answers, copying or cane");
  assert.ok(site.faq.some(item => item.answer.includes("১২")), "the FAQ names the twelve levels");
});
