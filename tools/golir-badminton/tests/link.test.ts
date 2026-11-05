// Challenge links (old and new), saved progress and its one-time migration, the words, and the page's content limits.
import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { parseShared, sharedHash } from "../lib/challenge";
import { fromOld, LEVEL_COUNT } from "../lib/levels";
import { bannerNote, caption, clearLine, compareLine, feat, humanLine, lossLine, pointCall, previewTitle, shotCall } from "../lib/lines";
import { afterClear, loadProgress, migrateStars, playable, readBest, readMode, recommended } from "../lib/progress";
import { clap, crack, farPing, netFlap, ping, sigh, swish, tick, tune, victory, warn, whoosh, windLoop } from "../lib/sfx";

test("a new link round-trips, and carries the mode only when it isn't সাধারণ", () => {
  const shared = { level: 6, seed: 123456, them: 2, rally: 9, name: "রাফি", mode: "h" as const, old: 0 };
  const hash = sharedHash(shared);
  assert.equal(hash, `s=123456&t=2&r=9&l=6&v=2&d=h&n=${encodeURIComponent("রাফি")}`);
  assert.deepEqual(parseShared(`#${hash}`), shared);
  assert.equal(sharedHash({ ...shared, mode: "n" }), `s=123456&t=2&r=9&l=6&v=2&n=${encodeURIComponent("রাফি")}`);
  assert.equal(share.normalize(hash), hash);
  assert.match(share.preview(hash).title, /রাফি চিলেকোঠার রুমা আপাকে ৫–২ পয়েন্টে হারিয়েছে/);
});

test("old links (fifteen levels, first to 5) still open, on the same place of the new ladder, and keep their form", () => {
  const old = `s=123456&t=2&r=9&l=4&n=${encodeURIComponent("রাফি")}`;
  const parsed = parseShared(old)!;
  assert.equal(parsed.level, fromOld(4));
  assert.equal(parsed.old, 4);
  assert.equal(parsed.them, 2);
  assert.equal(sharedHash(parsed), old, "normalising an old link keeps it old");
  assert.equal(share.normalize(old), old);
  assert.match(previewTitle(parsed), /৫–২/);
  assert.deepEqual([1, 2, 3, 4, 5, 6, 10, 14, 15].map(fromOld), [1, 2, 3, 4, 4, 5, 8, 12, 12]);
  assert.ok(parseShared("s=1&t=4&r=1&l=15"), "the old final with 4 points given");
});

test("broken or forged links are refused", () => {
  const good = new URLSearchParams("s=123456&t=2&r=9&l=6&v=2");
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ t: "5" }), variant({ t: "-1" }), variant({ t: "1.5" }), variant({ t: null }),
    variant({ r: "0" }), variant({ r: "301" }), variant({ r: "09" }), variant({ r: "x" }), variant({ r: null }),
    variant({ l: "0" }), variant({ l: "13" }), variant({ l: "04" }), variant({ l: null }),
    variant({ v: "3" }), variant({ d: "x" }), variant({ d: "n" }), variant({ l: "1", t: "3" }),
    variant({ s: "0" }), variant({ s: "1000000000" }), variant({ s: null }),
    "s=1&t=5&r=1&l=3", "s=1&t=1&r=1&l=16", "s=1&t=1&r=1&l=3&d=h",
    "", "#", "garbage", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
  ]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null);
  }
  assert.ok(parseShared(variant({ l: "12", t: "6", r: "300" })), "the last level is first to 7");
  const hostile = parseShared(variant({ n: "‮রাফি\u0000" + "ক".repeat(40) }))!;
  assert.ok(hostile.name.length <= 20 && !hostile.name.includes("‮") && !hostile.name.includes("\u0000"));
  assert.ok(share.preview("junk").title.length > 0);
});

test("saved stars migrate once to the new ladder, and this game keeps its own unlock", () => {
  assert.deepEqual(migrateStars('{"1":3,"2":1,"5":2,"15":1,"16":3,"x":2}'), { 1: 3, 2: 1, 4: 2, 12: 1 });
  const first = loadProgress('{"1":3,"2":2,"3":1}', null);
  assert.deepEqual(first.stars, { 1: 3, 2: 2, 3: 1 });
  assert.equal(first.unlock, 4);
  assert.ok(first.write);
  const later = loadProgress('{"1":3,"2":2,"3":1,"9":2}', "4");
  assert.equal(later.unlock, 4, "a saved unlock wins over the shared rule");
  assert.equal(later.write, null);
  // A friend's far level: its stars are kept, but nothing in between opens.
  assert.equal(afterClear(4, 9), 4);
  assert.equal(afterClear(4, 4), 5);
  assert.ok(playable(9, 4, { 9: 2 }));
  assert.ok(!playable(7, 4, { 9: 2 }));
  assert.ok(playable(11, 4, {}, 11), "the friend's level on the link");
  assert.equal(recommended(4, { 1: 3, 2: 2, 3: 1 }), 4);
  assert.equal(readMode("h"), "h"); assert.equal(readMode("x"), "n");
  assert.equal(readBest("14"), 14); assert.equal(readBest("abc"), 0); assert.equal(readBest(null), 0);
});

test("words: kind, exact, Bangla, never loud", () => {
  assert.equal(feat({ level: 1, them: 0, name: "", old: 0 }), "এক বন্ধু পাশের বাসার ভাইয়াকে ৩–০ পয়েন্টে হারিয়েছে");
  assert.match(bannerNote("রাফি"), /রাফির নিজের ফোনের স্কোর/);
  assert.equal(compareLine({ them: 1, rally: 4 }, { them: 3, rally: 9 }, "রাফি"), "রাফি ৩ পয়েন্ট দিয়েছিল, তুমি ১।");
  assert.match(compareLine({ them: 2, rally: 12 }, { them: 2, rally: 9 }, "রাফি"), /রাফির চেয়ে লম্বা/);
  assert.match(caption({ level: 3, them: 1, rally: 6, old: 0 }), /^গলির ব্যাডমিন্টনে মোড়ের দোকানের মামাকে ৫–১ পয়েন্টে হারালাম।/);
  assert.equal(humanLine({ level: LEVEL_COUNT, them: 4, rally: 3, old: 0 }), "পাড়ার নতুন চ্যাম্পিয়ন।");
  assert.equal(new Set(Array.from({ length: LEVEL_COUNT }, (_, i) => clearLine(i + 1))).size, LEVEL_COUNT);
  assert.match(lossLine(5, 4, { misses: 3, nets: 0, outs: 0, whiffs: 0 }, false, false), /আর ১ পয়েন্ট/);
  assert.match(lossLine(5, 1, { misses: 0, nets: 3, outs: 0, whiffs: 0 }, false, false), /জালে/);
  assert.match(lossLine(5, 1, { misses: 0, nets: 0, outs: 3, whiffs: 0 }, true, false), /বাতাস/);
  assert.match(pointCall(0, 4, "মামা", 2), /ড্রপে মামা/);
  assert.match(pointCall(1, 2, "মামা", 0), /জালে/);
  assert.equal(shotCall(1, true), "সোনালি স্ম্যাশ!");
  const all = [...Array.from({ length: LEVEL_COUNT }, (_, i) => clearLine(i + 1)), ...Array.from({ length: LEVEL_COUNT }, (_, i) => humanLine({ level: i + 1, them: 2, rally: 4, old: 0 }))].join(" ");
  assert.doesNotMatch(all, /অসাধারণ|দারুণ|সেরা|আপনি|!!/);
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^ব্যাডমিন্টন গেম/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?" && /১২টা/.test(item.answer)));
  assert.ok(site.faq.some(item => /পেনাল্টি কিক|শেষ বলে ছয়/.test(item.answer)));
  for (const word of ["নাম", "লেভেল", "সিড", "স্কোর", "র‍্যালি"]) assert.match(site.privacy.join(" "), new RegExp(word));
  const text = JSON.stringify(site);
  assert.equal(text, text.normalize("NFC"));
  assert.doesNotMatch(text, /আপনি|করুন|দেখুন|বাজি|জিতে নাও|yonex|li-ning|ইয়োনেক্স|লি-নিং|অসাধারণ|সহজেই/i);
});

test("sounds never throw without audio (no window, no AudioContext)", () => {
  assert.doesNotThrow(() => { ping(); ping(true); crack(); tick(); farPing(); farPing(true); swish(); clap(); sigh(); netFlap(); whoosh(); warn(); tune(1); victory(2, 3); const wind = windLoop(); wind.set(0.5); wind.stop(); });
});
