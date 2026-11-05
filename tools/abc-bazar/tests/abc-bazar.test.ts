import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { site, parentNote } from "../content";
import { share } from "../share";

const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

test("no sharing of anything about the child", () => {
  assert.equal(share.normalize(""), null);
  assert.equal(share.normalize("level=1&stars=3"), null);
  assert.equal(share.tally, undefined);
});

test("the tool's source never calls fetch, the share client or an API, and asks nothing of the child", () => {
  const root = join(import.meta.dirname, "..");
  const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
  });
  const sources = [...files(root), join(root, "../../app/abc-bazar/page.tsx")].filter(path => /\.(tsx?|css)$/.test(path));
  assert.ok(sources.length >= 14);
  for (const path of sources) {
    const code = readFileSync(path, "utf8");
    assert.doesNotMatch(code, /\bfetch\s*\(/, path);
    assert.doesNotMatch(code, /share-client|ShareBar|\/api\//, path);
    assert.doesNotMatch(code, /navigator\.sendBeacon|XMLHttpRequest|WebSocket/, path);
    assert.doesNotMatch(code, /<input|getUserMedia|geolocation/, path);
  }
});

test("content meets the SEO limits and answers the homework question first", () => {
  assert.ok([...site.title].length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("ইংরেজি বর্ণমালা"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title && site.headline !== site.name);
  assert.ok(site.faq.length >= 6);
  assert.equal(site.faq[0].question, "ইংরেজি বর্ণমালা কয়টি?");
  assert.ok(site.faq[0].answer.startsWith("ইংরেজি বর্ণমালায় ২৬টা অক্ষর, A থেকে Z।"));
  for (const question of ["কোন বয়সের জন্য?", "ইন্টারনেট লাগে?", "কোনো তথ্য নেওয়া হয়?", "কতক্ষণ খেলবে?"]) assert.ok(site.faq.some(item => item.question === question), question);
  assert.equal(site.privacy.length, 1);
  assert.equal(site.slug, "abc-bazar");
  assert.equal(site.socialImage, "/social/abc-bazar.png");
  for (const text of [site.title, site.description, site.headline!, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer]), ...Object.values(parentNote)]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|করুন|দেখুন/, text);
  }
  // No voice anywhere: no text promises a spoken word.
  assert.doesNotMatch(site.faq.map(item => item.answer).join(" "), /শব্দটা শোনায়|আবার শোনা যায়/);
});
