// The challenge link: old links still open (and read as before), new ones round-trip, hostile ones are refused; the words and the page's content.
import assert from "node:assert/strict";
import test from "node:test";
import { challengeHash, makeRng, readLevels, recordLevel, totalStars, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { cardStars } from "../lib/card";
import { LEVEL_COUNT, starsOf } from "../lib/levels";
import {
  bn, caption, cardHash, clearLine, compareLine, feat, fellLine, friendClaim, humanLine, levelLabel, nearMissLine, parseCard, playLabel, previewTitle, slipLine, slipText, streakLine, type Card,
} from "../lib/link";
import { SLIP_BRIDGE, SLIP_GOAT, SLIP_MUD, SLIP_PUDDLE } from "../lib/field";
import { birds, bleat, creak, footstep, gust, motif, squelch, stepUp, windLoop } from "../lib/sound";
import { share } from "../share";

const old = (over: Partial<Card> = {}): Card => ({ seed: 123456, level: 7, slips: 1, dry: 41, name: "রাফি", kind: "old", mode: "n", ...over });
const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);

test("old links (no v) open exactly as before, and write exactly the old format", () => {
  const card = old();
  assert.equal(cardHash(card), `s=123456&t=1&m=41&l=7&n=${encodeURIComponent("রাফি")}`);
  assert.deepEqual(parseCard(`#${cardHash(card)}`), card);
  assert.equal(previewTitle(card), "রাফি লেভেল ৭-এর ৬০ মিটার আল একবার পিছলে পার হয়েছে। তুমি পারবে?", "an old level 7 is still the old 60 m field");
  assert.ok(parseCard(cardHash(old({ level: 20, seed: 9, slips: 0, dry: 125, name: "" }))), "a dry walk of the old last field");
  assert.equal(parseCard("s=5&t=3&m=10&l=2"), null, "old links allowed two slips at most");
  assert.equal(cardStars(old({ slips: 2 })), 1);
  assert.equal(playLabel(old({ level: 12 })), "লেভেল ১২ · বাতাসের বিকাল");
});

test("new links carry v=2 and the mode; they round-trip", () => {
  const level: Card = { seed: 31337, level: 4, slips: 0, dry: 42, name: "", kind: "level", mode: "n" };
  assert.equal(cardHash(level), "s=31337&t=0&m=42&l=4&v=2");
  assert.deepEqual(parseCard(cardHash(level)), level);
  const hard: Card = { ...level, slips: 1, dry: 20, mode: "h", name: "মিম" };
  assert.match(cardHash(hard), /^s=31337&t=1&m=20&l=4&v=2&d=h&n=/);
  assert.deepEqual(parseCard(cardHash(hard)), hard);
  const easy: Card = { ...level, slips: 4, dry: 9, mode: "e" };
  assert.deepEqual(parseCard(cardHash(easy)), easy, "সহজ allows four slips on a cleared field");
  assert.equal(cardStars(easy), 1);
  assert.equal(cardStars(level), 3);
  assert.equal(cardStars({ ...level, mode: "e", slips: 0 }), 2, "সহজ tops out at two");
  assert.equal(playLabel(level), "লেভেল ৪ · জমা পানি");
  for (const bad of [
    "s=7&t=2&m=20&l=4&v=2&d=h", "s=7&t=5&m=20&l=4&v=2&d=e", "s=7&t=0&m=20&l=4&v=2", "s=7&t=0&m=43&l=4&v=2", "s=7&t=0&m=42&l=4&v=3", "s=7&t=0&m=42&l=4&v=2&d=n",
    "s=7&t=0&m=42&l=4&v=2&d=x", "s=7&t=0&m=42&l=4&d=e", "s=7&t=1&m=42&l=21&v=2", "s=7&t=1&m=42&l=0&v=2",
  ]) assert.equal(parseCard(bad), null, bad);
});

test("hostile or impossible links are refused; names are cleaned", () => {
  const good = `s=123456&t=1&m=41&l=7&n=${encodeURIComponent("রাফি")}`;
  const params = new URLSearchParams(good);
  const variant = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) value === null ? next.delete(key) : next.set(key, value);
    return next.toString();
  };
  for (const bad of [
    variant({ t: "5" }), variant({ t: "-1" }), variant({ t: "1.5" }), variant({ t: null }),
    variant({ m: "0" }), variant({ m: "61" }), variant({ m: "041" }), variant({ m: "x" }), variant({ m: null }), variant({ t: "0", m: "41" }),
    variant({ l: "0" }), variant({ l: "21" }), variant({ l: "07" }), variant({ l: null }),
    variant({ s: "0" }), variant({ s: "1000000000" }), variant({ s: null }),
    "", "#", "garbage", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
  ]) {
    assert.equal(parseCard(bad), null, bad);
    assert.equal(share.normalize(bad), null, bad);
  }
  assert.equal(share.normalize(good), good);
  assert.match(share.preview(good).title, /রাফি/);
  assert.ok(share.preview("junk").title.length > 0);
  const hostile = parseCard(variant({ n: "‮রাফি\u0000" + "ক".repeat(40) }))!;
  assert.ok(hostile.name.length <= 20 && !hostile.name.includes("‮") && !hostile.name.includes("\u0000"));
  // random garbage never throws and never parses
  const rng = makeRng(5);
  for (let i = 0; i < 300; i++) {
    const junk = Array.from({ length: 1 + Math.floor(rng() * 8) }, () => ["s", "t", "m", "l", "v", "d", "n", "x"][Math.floor(rng() * 8)] + "=" + Math.floor(rng() * 70)).join("&");
    assert.doesNotThrow(() => parseCard(junk));
  }
});

test("result lines: kind, exact and Bangla", () => {
  assert.equal(levelLabel(12), "লেভেল ১২ · দমকা হাওয়া");
  assert.equal(compareLine({ slips: 0, dry: 60 }, { slips: 2, dry: 30 }, "রাফি"), "রাফি পিছলেছিল ২ বার, তুমি একবারও না!");
  assert.match(compareLine({ slips: 2, dry: 30 }, { slips: 1, dry: 40 }, "রাফি"), /আর একটু হলেই/);
  assert.match(compareLine({ slips: 1, dry: 50 }, { slips: 1, dry: 40 }, "রাফি"), /রাফির চেয়ে লম্বা/);
  assert.match(compareLine({ slips: 0, dry: 60 }, { slips: 0, dry: 60 }, ""), /সমান সমান! বন্ধুও একবারও পিছলায়নি/);
  assert.match(caption({ kind: "level", level: 3, slips: 0 }), /^আল ধরে হাঁটিতে লেভেল ৩-এর ৩৬ মিটার আল একবারও না পিছলে পার হলাম।/);
  assert.equal(feat({ kind: "level", level: 1, slips: 0, name: "" }), "এক বন্ধু লেভেল ১-এর ২৪ মিটার আল একবারও না পিছলে পার হয়েছে");
  assert.match(friendClaim("রাফি"), /রাফির নিজের ফোনের হিসাব/);
  assert.equal(slipText(4), "৪ বার পিছলে");
  assert.equal(new Set(levels.map(clearLine)).size, LEVEL_COUNT);
  assert.match(humanLine({ level: 20, slips: 0 }), /হারিকেন/);
  assert.match(fellLine(12, SLIP_PUDDLE), /^আর ১২ মিটার বাকি ছিল। পানি/);
  assert.match(fellLine(2, SLIP_MUD), /^আর মাত্র ২ মিটার/);
  assert.match(fellLine(9, SLIP_BRIDGE), /সাঁকো/);
  assert.match(fellLine(9, SLIP_GOAT), /ছাগল/);
  assert.match(slipLine(SLIP_BRIDGE), /সাঁকো/);
  assert.equal(streakLine(40), "টানা ৪০ মিটার, পা শুকনো।");
  assert.equal(nearMissLine(1), "একবারও না পিছলালে ৩ তারা।");
  assert.match(nearMissLine(0, "e"), /সাধারণে খেলো/);
  assert.equal(nearMissLine(0), "");
  const all = [...levels.map(clearLine), ...levels.map(level => humanLine({ level, slips: 1 })), fellLine(5, SLIP_GOAT), fellLine(5, SLIP_MUD), nearMissLine(2)].join(" ");
  assert.doesNotMatch(all, /অসাধারণ|দারুণ|সেরা|আপনি|!!|সহজেই/);
  assert.equal(bn(20), "২০");
});

test("progress goes through readLevels and recordLevel, and the old saved stars still open what they did", () => {
  let stars = readLevels('{"1":3,"2":1,"21":3,"x":2,"3":9}', LEVEL_COUNT);
  assert.deepEqual(stars, { 1: 3, 2: 1 });
  stars = recordLevel(stars, 2, starsOf(0, true));
  assert.equal(stars[2], 3);
  stars = recordLevel(stars, 2, starsOf(2, true));
  assert.equal(stars[2], 3, "a worse walk never lowers the stars");
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 3);
  assert.equal(totalStars(stars), 6);
  assert.deepEqual(readLevels("not json", LEVEL_COUNT), {});
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^গ্রামের গেম/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /নদী পার/.test(item.answer) && /ছিপ ফেলো/.test(item.answer)));
  for (const word of ["নাম", "লেভেল", "সিড", "পিছলেছ", "মিটার"]) assert.match(site.privacy.join(" "), new RegExp(word));
  const text = JSON.stringify(site);
  assert.equal(text, text.normalize("NFC"));
  assert.doesNotMatch(text, /আপনি|করুন|দেখুন|বাজি|জিতে নাও|অসাধারণ|সহজেই|জল/);
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length);
});

test("sounds never throw without audio (no window, no AudioContext)", () => {
  assert.doesNotThrow(() => { footstep(0); footstep(1); squelch(); bleat(); birds(); stepUp(); creak(); gust(); motif(1.25); const wind = windLoop(); wind.set(0.5); wind.stop(); });
  void challengeHash;
});
