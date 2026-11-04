import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { makeLevelStorm } from "../lib/gen";
import { makeLegacyStorm } from "../lib/legacy";
import { bands, caption, compareLine, humanLine, nearMiss, parseShared, previewTitle, resultLine, ripeOf, sharedHash, stormLabel } from "../lib/link";
import { BRANCH, GOLD, RIPE, isMango } from "../lib/physics";
import { share } from "../share";

test("old links still parse and keep their exact shape, words and preview", () => {
  const shared = { seed: 48213, score: 180, count: 24, name: "রাফি" };
  const hash = sharedHash(shared);
  assert.equal(hash, "s=48213&t=180&a=24&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShared("#" + hash), shared);
  assert.equal(share.normalize(hash), hash);
  assert.equal(share.preview(hash).title, "রাফি ঝড়ের মধ্যে ২৪টা আম কুড়িয়েছে, ১৮০ পয়েন্ট। তুমি পারবে?");
  assert.equal(previewTitle({ ...shared, name: "" }), "কালবৈশাখীর ঝড়ে ২৪টা আম, ১৮০ পয়েন্ট। তুমি পারবে?");
  assert.equal(share.preview("junk").title, "ঝড় উঠেছে, আম কুড়াও!");
  const staged = { seed: 777, score: 150, count: 20, name: "মিম", stage: 7 };
  assert.equal(sharedHash(staged), "s=777&t=150&a=20&l=7&n=" + encodeURIComponent("মিম"));
  assert.deepEqual(parseShared(sharedHash(staged)), staged);
  assert.equal(previewTitle(staged), "মিম ঝড় ৭-এ ২০টা আম কুড়িয়েছে, ১৫০ পয়েন্ট। তুমি পারবে?");
  assert.equal(caption(staged), "কালবৈশাখী আমের ঝড় ৭-এ ২০টা আম কুড়ালাম, ১৫০ পয়েন্ট! একই ঝড়ে তুমি কয়টা পারো?");
  assert.equal(stormLabel({ stage: 4 }), "পুরোনো ঝড় ৪ · কালবৈশাখী");
  // Every mango of an old storm is still a fair claim; one more is not.
  const old = makeLegacyStorm(777, 1).drops, most = old.filter(drop => drop.kind !== BRANCH).length, ripes = old.filter(drop => drop.kind === RIPE).length;
  assert.ok(share.normalize(`s=777&t=${most * 5 + ripes * 5}&a=${most}&l=1`));
  assert.equal(share.normalize(`s=777&t=${most * 5 + 5}&a=${most + 1}&l=1`), null);
});

test("new links carry w and are checked against that storm's mangoes", () => {
  const shared = { seed: 4242, score: 95, count: 9, name: "", level: 6 };
  const hash = sharedHash(shared);
  assert.equal(hash, "s=4242&t=95&a=9&w=6");
  assert.deepEqual(parseShared(hash), shared);
  assert.equal(previewTitle(shared), "কালবৈশাখী আমের ‘শিল’ ঝড়ে ৯টা আম, ৯৫ পয়েন্ট। তুমি পারবে?");
  assert.equal(previewTitle({ ...shared, name: "রাফি" }), "রাফি ‘শিল’ ঝড়ে ৯টা আম কুড়িয়েছে, ৯৫ পয়েন্ট। তুমি পারবে?");
  assert.match(caption(shared), /‘শিল’ ঝড়ে ৯টা আম কুড়ালাম, ৯৫ পয়েন্ট।/);
  const storm = makeLevelStorm(4242, 5), values = storm.drops.filter(drop => isMango(drop.kind)).map(drop => drop.kind === GOLD ? 25 : drop.kind === RIPE ? 10 : 5);
  const all = values.reduce((sum, value) => sum + value, 0);
  assert.ok(parseShared(`s=4242&t=${all}&a=${values.length}&w=5`), "every mango is a fair claim");
  assert.equal(parseShared(`s=4242&t=${all + 5}&a=${values.length}&w=5`), null, "more points than those mangoes make");
  assert.equal(parseShared(`s=4242&t=${all + 5}&a=${values.length + 1}&w=5`), null, "more mangoes than fell");
  assert.equal(parseShared("s=4242&t=4&a=1&w=1"), null, "fewer points than one mango");
  assert.equal(parseShared("s=4242&t=0&a=0&w=3")?.level, 3);
});

test("hostile or impossible links are refused, names are cleaned and capped", () => {
  const ok = (hash: string) => share.normalize(hash);
  for (const bad of ["", "result", "s=48213&t=180", "s=48213&t=180&a=-1", "s=48213&t=180&a=2.5", "s=48213&t=180&a=1e1", "s=48213&t=183&a=24", "s=48213&t=250&a=24",
    "s=48213&t=2000&a=200", "s=0&t=10&a=1", "s=48213&t=99999&a=24", "s=48213&t=180&a=24&n=" + "x".repeat(700),
    "s=777&t=150&a=20&l=0", "s=777&t=150&a=20&l=9", "s=777&t=150&a=20&l=x", "s=777&t=150&a=20&l=1.5",
    "s=777&t=50&a=5&w=0", "s=777&t=50&a=5&w=13", "s=777&t=50&a=5&w=x", "s=777&t=50&a=5&w=1.5", "s=777&t=52&a=5&w=2"]) assert.equal(ok(bad), null, bad);
  const bidi = parseShared("s=48213&t=180&a=24&n=" + encodeURIComponent("রা‮ফি<script>" + "ক".repeat(30)));
  assert.ok(bidi && !bidi.name.includes("‮") && [...bidi.name].length <= 20);
  assert.equal(ok("s=48213&t=180&a=24&n=%20%20&z=1"), "s=48213&t=180&a=24");
  assert.equal(ripeOf(180, 24), 12);
  assert.equal(ripeOf(245, 24), -1);
});

test("the words: kind and exact, with the number first", () => {
  assert.equal(compareLine(300, 180, "রাফি"), "রাফির চেয়ে ১২০ পয়েন্ট বেশি।");
  assert.equal(compareLine(180, 180, "রাফি"), "রাফি আর তুমি একদম সমান সমান।");
  assert.equal(compareLine(170, 180, "রাফি"), "আর একটু হলেই! রাফির চেয়ে মাত্র ১০ কম।");
  assert.equal(compareLine(50, 180, ""), "বন্ধু এবার ১৩০ পয়েন্ট এগিয়ে। একই ঝড়ে আরেকবার?");
  const base = { over: 1, stars: 1, caught: 10, pass: 8, two: 12, three: 16, left: 0, score: 100, best: null };
  assert.equal(nearMiss({ ...base, over: 2, left: 11.2 }), "আর ১২ সেকেন্ড টিকলেই ঝড় পার।");
  assert.equal(nearMiss({ ...base, stars: 0, caught: 5 }), "আর ৩টা আম হলেই ঝড় পার।");
  assert.equal(nearMiss(base), "আর ২টা আম হলেই ২ তারা।");
  assert.equal(nearMiss({ ...base, stars: 3, caught: 16, score: 360, best: 400 }), "আর ৪০ পয়েন্ট হলেই নতুন সেরা।");
  for (const band of bands) assert.ok(band.line.length < 60);
  assert.equal(humanLine(0), bands[0].line);
});

test("content keeps the SEO limits and the voice", () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  assert.ok([...site.description].length >= 120 && [...site.description].length <= 160, `description ${[...site.description].length}`);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.title.startsWith("আম কুড়ানোর গেম"));
  assert.ok(site.privacy.some(line => line.includes("ঝড়ের নম্বর") && line.includes("পয়েন্ট") && line.includes("নাম")));
  assert.ok(!/আপনি|করুন|দেখুন/.test(JSON.stringify(site)), "তুমি voice only");
  assert.equal(JSON.stringify(site), JSON.stringify(site).normalize("NFC"));
});

test("the result line follows what happened in the run, not the raw score", () => {
  assert.equal(resultLine({ over: 1, stars: 3, caught: 8, mangoes: 8 }), "৮টার ৮টাই। একটা আমও মাটি ছোঁয়নি।");
  assert.equal(resultLine({ over: 1, stars: 2, caught: 20, mangoes: 30 }), "৩০টার মধ্যে ২০টা। নানির আচারের বয়াম ভরছে।");
  assert.equal(resultLine({ over: 1, stars: 0, caught: 3, mangoes: 30 }), "৩০টার মধ্যে ৩টা। ঝড় থামল, ডালা প্রায় খালি।");
  assert.match(resultLine({ over: 2, stars: 0, caught: 3, mangoes: 30 }), /জান বাঁচিয়ে/);
});
