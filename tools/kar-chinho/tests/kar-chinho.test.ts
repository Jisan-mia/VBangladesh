import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { LEVEL_COUNT } from "../lib/levels";

test("share: no link state and no tally", () => {
  assert.equal(share.normalize("level=1"), null);
  assert.equal(share.normalize(""), null);
  assert.equal(share.tally, undefined);
});

function files(dir: string): string[] {
  return readdirSync(dir).flatMap(name => { const path = join(dir, name); return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path]; });
}

test("the tool never calls the network or the share client", () => {
  const root = join(import.meta.dirname, "..");
  for (const path of [...files(root), join(root, "../../app/kar-chinho/page.tsx")]) {
    const source = readFileSync(path, "utf8");
    assert.ok(!/\bfetch\s*\(/.test(source), `${path} calls fetch`);
    assert.ok(!/share-client|\/api\//.test(source), `${path} reaches the share client or an API`);
    assert.ok(!/navigator\.sendBeacon|XMLHttpRequest|WebSocket/.test(source), `${path} talks to a server`);
  }
});

test("content: SEO limits, six or more FAQs, homework answer first", () => {
  assert.ok(site.title.length <= 45, `title ${site.title.length}`);
  assert.ok(site.title.startsWith("কার চিহ্ন"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `description ${site.description.length}`);
  assert.ok(site.faq.length >= 6);
  assert.equal(site.faq[0].question, "কার চিহ্ন কয়টি?");
  assert.ok(site.faq[0].answer.startsWith("কার-চিহ্ন ১০টা"));
  for (const ask of ["কোন বয়সের জন্য?", "ইন্টারনেট লাগে?", "কোনো তথ্য নেওয়া হয়?", "কতক্ষণ খেলবে?"]) assert.ok(site.faq.some(item => item.question === ask), ask);
  assert.equal(site.privacy.length, 1);
  assert.ok(site.description.includes(`${new Intl.NumberFormat("bn-BD").format(LEVEL_COUNT)}টা লেভেল`), "the description counts the levels");
  for (const text of [site.title, site.description, site.headline!, ...site.steps, ...site.faq.flatMap(item => [item.question, item.answer])]) assert.equal(text, text.normalize("NFC"));
});
