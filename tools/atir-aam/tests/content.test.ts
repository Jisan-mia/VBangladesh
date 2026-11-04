import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { DEFS, WORLDS, MODE_INFO, GARDEN } from "../lib/levels";
import { OFFER_WORDS, STAGE_LINES, compareLine, caption, feat, goalText } from "../lib/words";
import { STORY } from "../components/story";

const all = () => JSON.stringify([site, DEFS, WORLDS, MODE_INFO, GARDEN, OFFER_WORDS, STAGE_LINES, STORY]);

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("জোড়া মেলানোর পাজল গেম"), "keyword first");
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title && site.headline !== site.name);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.doesNotMatch(all(), /আপনি|করুন|দেখুন|আপনার|অসাধারণ|2048|২০৪৮/);
  assert.equal(all(), all().normalize("NFC"), "Bangla is NFC");
});

test("words: goals, comparisons, captions", () => {
  assert.equal(goalText(7), "পাকা আম বানাও");
  assert.equal(goalText(7, 2), "দুটো পাকা আম বানাও");
  assert.equal(compareLine(1300, 1240, "রাফি", false), "রাফির চেয়ে ৬০ পয়েন্ট বেশি!");
  assert.equal(compareLine(65, 62, "জাহিদ", true), "আর একটু হলেই! মাত্র ৩ চাল বেশি।");
  assert.equal(feat({ kind: "garden", level: 0, count: 300, score: 1240, top: 7, name: "" }), "এক বন্ধু পাকা আম পর্যন্ত গেছে, ১২৪০ পয়েন্ট");
  assert.equal(caption({ kind: "level", level: 7, count: 62, score: 0, top: 7 }), "আঁটি থেকে আমের ৭ নম্বর লেভেল ৬২ চালে পার করলাম। তুমি কত চালে পারবে?");
  for (const line of [...STAGE_LINES, ...DEFS.map(level => level.teach)]) assert.ok(line.split("!").length <= 2);
});
