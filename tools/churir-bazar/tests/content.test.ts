import assert from "node:assert/strict";
import test from "node:test";
import { STORY } from "../components/story";
import { site } from "../content";
import { DEFS, GIFTS, MODE_INFO, WORLDS } from "../lib/ladder";
import { CLEAR_TEXT } from "./words-export";

const all = () => JSON.stringify([site, DEFS, WORLDS, MODE_INFO, GIFTS, STORY, CLEAR_TEXT]);

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("রং মেলানোর গেম"), "keyword first");
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title && site.headline !== site.name);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length, "FAQ questions are unique");
  assert.doesNotMatch(all(), /আপনি|করুন|দেখুন|আপনার|অসাধারণ|দারুণ/);
  assert.equal(all(), all().normalize("NFC"), "Bangla is NFC");
  assert.ok(DEFS.every(level => level.teach.split("!").length <= 2));
  assert.equal(site.slug, "churir-bazar");
});
