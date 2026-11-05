// Challenge links (old and new), saved progress and its one-time migration, the words, and the page's content limits.
import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { parseShared, seedFor, sharedHash } from "../lib/challenge";
import { fromOld, LEVEL_COUNT, LEVELS, MODE_INFO, OLD_COUNT, starsOf } from "../lib/levels";
import { aimCall, bannerNote, caption, clearLine, humanLine, lossLine, nearLine, previewTitle, restCall, versusLine } from "../lib/lines";
import {
  afterClear, loadProgress, migrateStars, oldBestKey, playable, readBests, readMode, recommended,
  BESTS_KEY, LEVELS_KEY, UNLOCK_KEY,
} from "../lib/progress";
import { air, cheer, drop, flick, groan, knock, land, lose, pass, peg, tune, victory, whoosh, windLoop } from "../lib/sfx";

const name = encodeURIComponent("রাফি");

test("a new link round-trips, and carries the mode only when it isn't সাধারণ", () => {
  const shared = { level: 6, seed: 123456, total: 30, hits: ["10", "c", "20"], name: "রাফি", mode: "h" as const, old: 0 };
  const hash = sharedHash(shared);
  assert.equal(hash, `s=123456&t=30&h=10-c-20&l=6&v=2&d=h&n=${name}`);
  assert.deepEqual(parseShared(`#${hash}`), shared);
  assert.equal(sharedHash({ ...shared, mode: "n" }), `s=123456&t=30&h=10-c-20&l=6&v=2&n=${name}`);
  assert.equal(share.normalize(hash), hash);
  assert.match(share.preview(hash).title, /রাফি ডাংগুলিতে ৩০ ডাং মেরেছে/);
});

test("old links (ten levels, no v) still open, on the same place of the new ladder, and keep their form", () => {
  const old = `s=12345&t=30&h=10-12-8&n=${name}`;
  const parsed = parseShared(old)!;
  assert.equal(parsed.level, 1);
  assert.equal(parsed.old, 1);
  assert.equal(parsed.mode, "n");
  assert.equal(sharedHash(parsed), old, "normalising an old link keeps it old");
  assert.equal(share.normalize(old), old);
  const level7 = `s=7&t=14&h=14-m-0&l=7&n=${name}`;
  const seven = parseShared(level7)!;
  assert.equal(seven.level, fromOld(7));
  assert.equal(sharedHash(seven), level7);
  assert.deepEqual([1, 2, 3, 5, 7, 10].map(fromOld), [1, 2, 4, 6, 8, 12]);
  assert.equal(fromOld(OLD_COUNT), LEVEL_COUNT);
  assert.ok(parseShared("s=1&t=0&h=m-m-m&l=10"), "the old last level");
});

test("broken or forged links are refused", () => {
  const good = new URLSearchParams("s=123456&t=30&h=10-c-20&l=6&v=2");
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ t: "31" }), variant({ t: "-1" }), variant({ t: "1.5" }), variant({ t: null }),
    variant({ h: "10-c" }), variant({ h: "10-c-20-0" }), variant({ h: "10-x-20" }), variant({ h: "61-c-0" }), variant({ h: "010-c-20" }), variant({ h: null }),
    variant({ l: "0" }), variant({ l: "13" }), variant({ l: "06" }), variant({ l: null }),
    variant({ v: "3" }), variant({ d: "x" }), variant({ d: "n" }),
    variant({ s: "0" }), variant({ s: "1000000000" }), variant({ s: null }),
    "s=1&t=0&h=m-m-m&l=11", "s=1&t=0&h=m-m-m&l=3&d=h",
    "", "#", "garbage", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
  ]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null);
  }
  assert.ok(parseShared(variant({ l: "12", d: "e" })), "the last level on সহজ");
  assert.ok(parseShared("s=5&t=180&h=60-60-60&l=3&v=2"), "the most a round can score");
  const hostile = parseShared(`${good}&n=${encodeURIComponent("‮রাফি\u0000" + "ক".repeat(40))}`)!;
  assert.ok(hostile.name.length <= 20 && !hostile.name.includes("‮") && !hostile.name.includes("\u0000"));
  assert.ok(share.preview("junk").title.length > 0);
});

test("statechart ReplayIsExact: the friend's field survives from the level list, and only for their level and mode", () => {
  const friend = parseShared(`s=12345&t=30&h=10-12-8&l=3&v=2&n=${name}`)!;
  assert.equal(seedFor(friend, 3, "n", 999), 12345);
  assert.equal(seedFor(friend, 4, "n", 999), 999);
  assert.equal(seedFor(friend, 3, "h", 999), 999);
  assert.equal(seedFor(null, 3, "n", 999), 999);
});

const store = (items: Record<string, string>) => (key: string) => items[key] ?? null;

test("saved stars migrate once to the new ladder, and this game keeps its own unlock", () => {
  assert.deepEqual(migrateStars('{"1":3,"2":1,"5":2,"10":1,"11":3,"x":2}'), { 1: 3, 2: 1, 6: 2, 12: 1 });
  const first = loadProgress(store({ [LEVELS_KEY]: '{"1":3,"2":2,"3":1}', [oldBestKey(1)]: "40", [oldBestKey(3)]: "22" }));
  assert.deepEqual(first.stars, { 1: 3, 2: 2, 4: 1 }, "level 3 of ten is level 4 of twelve");
  assert.equal(first.unlock, 5, "nobody loses a level they could play");
  assert.deepEqual(first.bests, { 1: 40, 4: 22 });
  assert.ok(first.write && JSON.parse(first.write.levels)[4] === 1);
  const later = loadProgress(store({ [LEVELS_KEY]: '{"1":3,"2":2,"3":1,"9":2}', [UNLOCK_KEY]: "4", [BESTS_KEY]: '{"2":33,"99":5,"x":1}' }));
  assert.equal(later.unlock, 4, "a saved unlock wins over the shared rule");
  assert.equal(later.write, null, "migration runs once");
  assert.deepEqual(later.bests, { 2: 33 });
  const oldest = loadProgress(store({ "ektukhani-best-danguli": "25" }));
  assert.deepEqual(oldest.stars, { 1: starsOf(25, 1) }, "the one-field game's best becomes level 1");
  assert.equal(oldest.bests[1], 25);
  const fresh = loadProgress(store({}));
  assert.deepEqual([fresh.stars, fresh.unlock, fresh.bests], [{}, 1, {}]);
  assert.deepEqual(readBests("not json"), {});
});

test("statechart UnlockNeverShrinks: a friend's far level keeps its stars and opens nothing in between", () => {
  assert.equal(afterClear(4, 9), 4);
  assert.equal(afterClear(4, 4), 5);
  assert.equal(afterClear(LEVEL_COUNT, LEVEL_COUNT), LEVEL_COUNT);
  assert.equal(afterClear(4, 2), 4, "replaying an earlier level never shrinks it");
  assert.ok(playable(9, 4, { 9: 2 }));
  assert.ok(!playable(7, 4, { 9: 2 }));
  assert.ok(playable(11, 4, {}, 11), "the friend's level on the link");
  assert.ok(!playable(0, 4, {}) && !playable(LEVEL_COUNT + 1, 99, {}));
  assert.equal(recommended(4, { 1: 3, 2: 2, 3: 1 }), 4);
  assert.equal(recommended(3, { 1: 3, 2: 3, 3: 3 }), 3);
  assert.equal(recommended(3, { 1: 3, 2: 1, 3: 3 }), 2);
  assert.equal(readMode("h"), "h"); assert.equal(readMode("x"), "n"); assert.equal(readMode(null), "n");
});

test("words: kind, exact, Bangla, never loud", () => {
  assert.equal(previewTitle(parseShared(`s=1&t=30&h=10-12-8&n=${name}`)!), "রাফি ডাংগুলিতে ৩০ ডাং মেরেছে। তুমি পারবে?");
  assert.match(bannerNote("রাফি"), /রাফির নিজের ফোনের স্কোর/);
  assert.match(versusLine(35, 30, "রাফি"), /রাফির চেয়ে ৫ ডাং বেশি/);
  assert.match(versusLine(30, 30, "রাফি"), /সমান সমান/);
  assert.match(versusLine(27, 30, "রাফি"), /মাত্র ৩ ডাং কম/);
  assert.match(caption({ level: 3, total: 41 }), /ক্লাসের মিলিকে হারালাম, তিন মারে ৪১ ডাং/);
  assert.equal(nearLine(4, 2), "আর ৪ ডাং হলেই ২ তারা।");
  assert.equal(nearLine(0, 2), "");
  assert.match(restCall(2, 0, 0, "রনি", "রনি"), /ধরে ফেলেছে/);
  assert.match(restCall(1, 14, 3, "মিলি", ""), /পুকুরে.*১৪ ডাং/);
  assert.match(aimCall(2, 5, 40, 0, 0), /শেষ মার। আর ৫ ডাং/);
  assert.match(aimCall(1, 0, 40, 4, 1), /৪০ পার.*দমকা/);
  const none = { caught: 0, fall: 0, whiff: 0, pond: 0, sand: 0, weak: 0 };
  assert.match(lossLine(2, { ...none, caught: 2 }), /আর ২ ডাং হলেই জিতে যেতে.*বৃত্ত/);
  assert.match(lossLine(9, { ...none, pond: 2 }), /পুকুরে/);
  assert.match(lossLine(9, { ...none, fall: 2 }), /হলুদ দাগ পার হলে/);
  assert.match(lossLine(9, none), /সোনালি/);
  assert.equal(new Set(Array.from({ length: LEVEL_COUNT }, (_, i) => clearLine(i + 1))).size, LEVEL_COUNT);
  const all = [...Array.from({ length: LEVEL_COUNT }, (_, i) => clearLine(i + 1)), ...[0, 10, 40, 70, 95].map(humanLine), ...LEVELS.map(level => level.teach)].join(" ");
  assert.doesNotMatch(all, /অসাধারণ|দারুণ|আপনি|!!/);
  for (const level of LEVELS) assert.ok(level.rival.obj.startsWith(level.rival.name), level.rival.name);
});

test("content meets the SEO limits, speaks তুমি and never says গুলি alone", () => {
  assert.ok(site.title.length <= 60, String(site.title.length));
  assert.ok(site.description.length >= 100 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?" && /১২টা/.test(item.answer)));
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length);
  for (const word of ["নাম", "লেভেল", "কতটা কঠিন", "স্কোর"]) assert.match(site.privacy.join(" "), new RegExp(word));
  const text = JSON.stringify(site);
  assert.equal(text, text.normalize("NFC"));
  assert.doesNotMatch(text, /আপনি|করুন|দেখুন|বাজি|অসাধারণ|সহজেই/);
  assert.doesNotMatch(text.replace(/ডাংগুলি/g, ""), /(^|[^ঁ-ৣ])গুলি/, "the small stick is কাঠি");
  assert.equal(site.slug, "danguli");
  assert.deepEqual(Object.keys(MODE_INFO), ["e", "n", "h"]);
});

test("sounds never throw without audio (no window, no AudioContext)", () => {
  assert.doesNotThrow(() => {
    flick(); knock(0, 0.5); knock(2, 1); air(); land(0); land(1); land(3); peg(10); cheer(); groan(); drop(); whoosh(); pass(); lose();
    tune(0); tune(2); victory(1, 3);
    const wind = windLoop(); wind.set(0.5); wind.stop();
  });
});
