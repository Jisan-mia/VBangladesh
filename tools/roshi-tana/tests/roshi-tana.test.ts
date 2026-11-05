// Links, words and content: old links still open and replay the old ladder, new ones carry v=2 and a mode, hostile input is
// refused, every line is exact and kind, and the page text keeps its SEO limits.
import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { LEVELS, LEVEL_COUNT, OLD_LEVELS } from "../lib/levels";
import {
  bannerNote, caption, clearLine, compareLine, duoCaption, duoTitle, feat, humanLine, lossLine, parseShared, previewTitle, sharedHash, MIN_BEATS, MIN_BEATS_V2,
} from "../lib/link";
import { soloCard, duoCard } from "../lib/draw-card";
import { PANELS } from "../components/story";
import { cheer, creak, crowd, drum, grunt, heaveCall, heaveThud, held, scuff, starChime, victory, whistle } from "../lib/sound";

test("an old link (no v) still opens, replays the old ladder and is written back exactly as it came", () => {
  const hash = `s=123456&t=14&l=3&h=12&n=${encodeURIComponent("রাফি")}`;
  const shared = parseShared(`#${hash}`)!;
  assert.deepEqual(shared, { level: 3, seed: 123456, beats: 14, hits: 12, name: "রাফি", mode: "n", old: true });
  assert.equal(sharedHash(shared), hash);
  assert.equal(previewTitle(shared), "রাফি রশি টানাটানিতে ক্লাস ফাইভকে ১৪ টানে হারিয়েছে। তুমি পারবে?", "the old ladder's team");
  assert.equal(share.normalize(hash), hash);
  assert.ok(parseShared("s=424242&t=12&l=2&h=10&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF"), "the README's replay link");
  assert.ok(parseShared("s=1&t=60&l=10&h=60"), "a full-time win on the old last level");
  assert.equal(parseShared("s=1&t=20&l=11&h=10"), null, "the old ladder had ten teams");
  assert.equal(parseShared("s=1&t=20&l=3&h=10&d=h"), null, "old links never carried a mode");
});

test("a new link carries v=2 and a mode, and round-trips", () => {
  const shared = { level: 12, seed: 99, beats: 22, hits: 20, name: "মিতু", mode: "h" as const, old: false };
  const hash = sharedHash(shared);
  assert.equal(hash, `s=99&t=22&l=12&h=20&v=2&d=h&n=${encodeURIComponent("মিতু")}`);
  assert.deepEqual(parseShared(hash), shared);
  assert.equal(sharedHash({ ...shared, mode: "n" }), `s=99&t=22&l=12&h=20&v=2&n=${encodeURIComponent("মিতু")}`, "সাধারণ leaves d out");
  assert.equal(feat({ level: 6, beats: 20, name: "", old: false }), "এক বন্ধু রশি টানাটানিতে কলেজের ভাইয়াদের ২০ টানে হারিয়েছে");
  assert.match(bannerNote("রাফি"), /রাফির নিজের ফোনের হিসাব/);
  assert.match(share.preview(hash).title, /মিতু/);
  assert.ok(parseShared(`s=1&t=${MIN_BEATS_V2}&l=3&h=${MIN_BEATS_V2}&v=2`));
  assert.equal(parseShared(`s=1&t=${MIN_BEATS_V2}&l=3&h=1`), null, "old links keep the old minimum");
  assert.ok(MIN_BEATS === 8);
});

test("forged or hostile links are refused", () => {
  const good = new URLSearchParams(sharedHash({ level: 4, seed: 123456, beats: 14, hits: 12, name: "রাফি", mode: "e", old: false }));
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ t: "6" }), variant({ t: "61" }), variant({ t: "1.5" }), variant({ t: "-1" }), variant({ t: null }),
    variant({ h: "15" }), variant({ h: "0" }), variant({ h: "07" }), variant({ h: "x" }), variant({ h: null }),
    variant({ l: "13" }), variant({ l: "0" }), variant({ l: "03" }), variant({ l: null }),
    variant({ v: "3" }), variant({ v: "" }), variant({ d: "n" }), variant({ d: "x" }),
    variant({ s: "0" }), variant({ s: "1000000000" }), variant({ s: null }),
    "", "#", "garbage", "s=1&t=10", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
  ]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null);
  }
  const hostile = parseShared(variant({ n: "‮রাফি\u0000" + "ক".repeat(40) }))!;
  assert.ok(hostile.name.length <= 20 && !hostile.name.includes("‮") && !hostile.name.includes("\u0000"));
  assert.equal(share.normalize(variant({ x: "1" })), good.toString(), "unknown keys are dropped");
  assert.ok(share.preview("junk").title.length > 0);
  assert.equal(share.tally, undefined, "no tally: nothing to count");
});

test("result lines are exact and kind", () => {
  assert.equal(compareLine(12, 15, "রাফি"), "রাফির লেগেছিল ১৫ টান, তোমার ১২।");
  assert.equal(compareLine(15, 15, "মিতু"), "সমান সমান। মিতুরও লেগেছিল ১৫ টান।");
  assert.equal(compareLine(18, 15, ""), "বন্ধুর লেগেছিল ১৫ টান, তোমার ১৮। আর ৩ টান কম হলেই সমান।");
  const loss = { slips: 0, hits: 10, missed: 0, wrongRests: 0, heaves: 0, held: 0, timeout: false };
  assert.match(lossLine({ ...loss, slips: 20, hits: 5 }), /^২০বার চাপ পড়েছে তালের বাইরে/);
  assert.match(lossLine({ ...loss, missed: 30, hits: 4 }), /৩০টা ঢোলে টান পড়েনি/);
  assert.match(lossLine({ ...loss, heaves: 6, held: 1 }), /৬টা হেঁইয়োর ১টা ঠেকেছে/);
  assert.match(lossLine({ ...loss, wrongRests: 5, slips: 6 }), /৫বার ফাঁকা তালে/);
  assert.match(lossLine({ ...loss, timeout: true }), /সময় শেষে/);
  assert.equal(humanLine(1, true), "হেডস্যারের দলও চুনের দাগ পার হয়ে এল।");
  assert.notEqual(humanLine(3, false), humanLine(1, false));
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.ok(clearLine(level).length > 10);
  assert.equal(clearLine(3, true), "ক্লাস ফাইভ ধুলায় বসে পড়েছে। মাঠের ধারে হাততালি।", "old links keep their old lines");
  assert.equal(caption({ level: 1, beats: 11, old: false }), "রশি টানাটানিতে ক্লাস থ্রিকে ১১ টানে হারালাম। তুমি কয় টানে পারবে?");
  assert.equal(duoTitle({ winner: 1, name: "" }), "নীল দল জিতল");
  assert.equal(duoTitle({ winner: 0, name: "জাহিদ" }), "জাহিদের দল জিতল");
  assert.match(duoCaption({ winner: 0, beats: 22, name: "" }), /হলুদ দল জিতল, ২২ টানে/);
  const card = soloCard({ level: 4, seed: 1, beats: 12, hits: 11, name: "", mode: "n", old: false });
  assert.match(card.kicker, /সকালের মাঠ · লেভেল ৪/);
  assert.equal(card.stars, 3);
  assert.match(soloCard({ level: 4, seed: 1, beats: 12, hits: 11, name: "", mode: "n", old: true }).kicker, /ক্লাস সিক্স/);
  assert.equal(duoCard({ winner: 1, beats: 30, name: "" }).stars, null);
});

test("every word on screen speaks তুমি and never shouts", () => {
  const words = [
    ...LEVELS.flatMap(def => [def.team, def.teach]), ...OLD_LEVELS.map(def => def.team), ...PANELS,
    ...Array.from({ length: LEVEL_COUNT }, (_, i) => clearLine(i + 1)), humanLine(3, false), humanLine(2, false), humanLine(1, false),
    JSON.stringify(site),
  ].join(" ");
  assert.doesNotMatch(words, /অসাধারণ|দারুণ|সেরা দল|!!|আপনি|করুন|দেখুন|বাজি|জিতে নাও|পুরস্কার|টাকা জিত/);
  assert.equal(words, words.normalize("NFC"), "Bangla is NFC");
});

test("content meets the SEO limits", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^রশি টানাটানি/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.match(site.description, /১২টা দল/);
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?" && /১২টা দল/.test(item.answer)));
  assert.ok(site.faq.some(item => /ক্যারম|পেনাল্টি কিক/.test(item.answer)));
  for (const word of ["নাম", "লেভেল", "সিড", "টানে", "মোড"]) assert.match(site.privacy.join(" "), new RegExp(word));
});

test("sounds never throw without audio (no window, no AudioContext)", () => {
  assert.doesNotThrow(() => {
    drum("strong"); drum("weak", 0.05); drum("big"); drum("count"); grunt(); creak(); scuff(); heaveCall(0.1); heaveThud(); held(); whistle(); whistle(0, true);
    victory(2); cheer(); starChime(1, 0.2);
    const hum = crowd(); hum.set(0.5); hum.stop();
  });
});
