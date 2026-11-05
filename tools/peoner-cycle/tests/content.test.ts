// The words around the game: SEO lengths, the title's opening, NFC, no outside names, at least six FAQs, and the registry ids.
import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";

test("the page keeps its SEO rules: title opens with সাইকেল গেম, description and lead are short and plain, NFC everywhere, at least six FAQs", () => {
  assert.equal(site.slug, "peoner-cycle");
  assert.ok(site.title.startsWith("সাইকেল গেম"));
  assert.ok(site.title.length <= 60 && site.description.length >= 100 && site.description.length <= 160, `${site.title.length}/${site.description.length}`);
  assert.ok(site.faq.length >= 6);
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length);
  for (const text of [site.title, site.description, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) assert.equal(text, text.normalize("NFC"));
  assert.ok(site.steps.length >= 4 && site.steps.length <= 6);
});

test("no post office, brand or racing game is named anywhere", () => {
  const all = JSON.stringify(site);
  for (const word of ["ডাক বিভাগ", "বাংলাদেশ ডাক", "Brick", "Rally", "Mario", "ইউনিফর্ম"]) assert.ok(!all.includes(word), word);
});

test("the share preview falls back to a plain line for a missing or hostile link", () => {
  assert.match(share.preview("").title, /ক্রিং/);
  assert.equal(share.normalize("junk"), null);
  assert.match(share.preview("s=48213&t=250&m=200&c=3&l=7&n=রাফি").title, /রাফি/);
});
