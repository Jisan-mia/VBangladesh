// Links (old ones keep opening খোলা পাটি unchanged), previews, the words around a result, and the page's content limits.
import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { cardLine } from "../lib/draw-card";
import { LEVELS } from "../lib/levels";
import {
  bands, banner, caption, compareLine, humanLine, levelNear, matName, nearLine, nextMat, parseShared, previewTitle, reachable, sharedHash,
  MAX_ROWS, MAX_SCORE, ROW_POINTS,
} from "../lib/link";

test("old challenge links (before the পাটি) still open খোলা পাটি unchanged", () => {
  const hash = "s=48213&t=25&r=2&p=55550000&n=" + encodeURIComponent("রাফি");
  const shared = parseShared(hash);
  assert.deepEqual(shared, { seed: 48213, score: 25, rows: 2, pattern: [0x5555, 0], name: "রাফি" });
  assert.equal(sharedHash(shared!), hash);
  assert.equal(sharedHash({ seed: 3, score: 10, rows: 1, pattern: [0xffff], name: "" }), "s=3&t=10&r=1&p=ffff");
});

test("পাটি links add l=1..12 and round-trip; hostile, impossible or out-of-range ones are refused", () => {
  const level = { seed: 900, score: 145, rows: 12, pattern: Array.from({ length: 12 }, (_, i) => i * 77), name: "মিম", level: 11 };
  const hash = sharedHash(level);
  assert.match(hash, /&l=11/);
  assert.deepEqual(parseShared("#" + hash), level);
  assert.equal(share.normalize(hash), hash);
  for (const bad of [
    "s=9&t=10&r=1&p=0000&l=0", "s=9&t=10&r=1&p=0000&l=13", "s=9&t=10&r=1&p=0000&l=1.5", "s=9&t=10&r=1&p=0000&l=x",
    "s=9&t=500&r=3&p=000000000000&l=1", "s=9&t=12&r=1&p=0000&l=4", "s=9&t=10&r=9&p=000000000000000000000000000000000000&l=1",
  ]) assert.equal(parseShared(bad), null, bad);
  // Gold rows may double a পাটি's points, which খোলা পাটি can never do.
  assert.ok(parseShared("s=9&t=140&r=4&p=0000000000000000&l=9"));
  assert.equal(parseShared("s=9&t=140&r=4&p=0000000000000000"), null);
});

test("খোলা পাটি links: points must add up from the rows, the pattern must fit, and junk is refused", () => {
  assert.ok(reachable(70, 4)); assert.ok(!reachable(65, 4)); assert.ok(reachable(55, 4)); assert.ok(!reachable(5, 0));
  const possible = new Map<number, Set<number>>([[0, new Set([0])]]);
  for (let rows = 1; rows <= 30; rows++) {
    const set = new Set<number>();
    for (let n = 1; n <= 4 && n <= rows; n++) for (const score of possible.get(rows - n)!) set.add(score + ROW_POINTS[n]);
    possible.set(rows, set);
    for (let score = 0; score <= 600; score += 5) assert.equal(reachable(score, rows), set.has(score), `${score} from ${rows}`);
  }
  for (const bad of [
    "", "result", "s=0&t=10&r=1&p=0000", "s=12&t=10&p=0000", "s=12&t=10&r=1", "s=12&t=15&r=1&p=0000", "s=12&t=10&r=1&p=00000",
    "s=12&t=10&r=1&p=ZZZZ", "s=12&t=10&r=1&p=FFFF", "s=12&t=10&r=-1&p=0000", `s=12&t=10&r=${MAX_ROWS + 1}&p=0000`,
    `s=12&t=${MAX_SCORE + 5}&r=${MAX_ROWS}&p=${"0".repeat(56)}`, "s=12&t=10&r=1&p=0000&n=" + "ক".repeat(700),
  ]) assert.equal(share.normalize(bad), null, bad);
  assert.equal(share.normalize("s=3&t=10&r=1&p=ffff&x=<script>"), "s=3&t=10&r=1&p=ffff", "unknown keys are dropped");
});

test("previews, banners and captions are personal and honest, for both kinds of link", () => {
  const old = { seed: 48213, score: 215, rows: 18, pattern: Array(14).fill(0), name: "রাফি" };
  assert.equal(previewTitle(old), "রাফি ১৮ সারি বুনে ২১৫ করেছে। তুমি পারবে?");
  assert.equal(banner(old), "রাফি ১৮ সারি বুনে ২১৫ করেছে। একই বেতের গোছা, এবার তোমার পালা।");
  const level = { ...old, rows: 12, score: 160, level: 4, pattern: Array(12).fill(0) };
  assert.equal(previewTitle(level), "রাফি ‘বরফি নকশা’ বুনে ১৬০ পয়েন্ট পেয়েছে। তুমি পারবে?");
  assert.match(previewTitle({ ...level, name: "" }), /‘বরফি নকশা’: ১২ সারি, ১৬০ পয়েন্ট/);
  assert.match(caption(level), /বরফি নকশা/);
  assert.equal(share.preview(sharedHash(level)).title, previewTitle(level));
  assert.ok(share.preview("junk").title.length > 0);
  assert.equal(share.tally, undefined);
});

test("result words: the exact gap to the goal or the next star, kind either way", () => {
  assert.equal(levelNear(4, 9, 95, 0), "আর ৩ সারি বাকি ছিল।");
  assert.equal(levelNear(4, 12, LEVELS[3].two - 20, 1), "আর ২০ পয়েন্ট হলেই ★★।");
  assert.equal(levelNear(4, 12, LEVELS[3].three - 5, 2), "আর ৫ পয়েন্ট হলেই ★★★।");
  assert.equal(levelNear(4, 12, 999, 3), "");
  assert.equal(cardLine({ score: 160, rows: 12, pattern: [], name: "", level: 4, stars: 2 }), "বরফি নকশা পুরো হলো, ১২ সারিতে।");
  assert.equal(cardLine({ score: 30, rows: 3, pattern: [], name: "", level: 1, stars: 3 }), "প্রথম সারি বোনা হলো, ৩ সারিতে।");
  assert.equal(cardLine({ score: 60, rows: 5, pattern: [], name: "" }), humanLine(5));
  assert.equal(compareLine(235, 215, "রাফি"), "রাফির চেয়ে ২০ বেশি!");
  assert.equal(compareLine(200, 215, "রাফি"), "আর একটু হলেই! মাত্র ১৫ কম।");
  for (let score = 0; score <= 600; score += 5) assert.doesNotMatch(compareLine(score, 300, "রাফি") + humanLine(score / 10), /হেরে|খারাপ|ব্যর্থ/);
  for (let i = 1; i < bands.length; i++) assert.ok(bands[i].min > bands[i - 1].min && bands[i].name);
  assert.equal(matName(5), "ছোট আসন");
  assert.equal(nextMat(50), null);
  assert.equal(nearLine(100, 13, null), "আর ২ সারি হলেই দুজনের পাটি।");
});

test("content meets the SEO limits, keeps at least six FAQs, and never names a trademark", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 6);
  assert.ok(site.steps.length >= 3);
  assert.match(site.privacy.join(" "), /নাম/);
  const everything = JSON.stringify(site) + share.preview("").description + JSON.stringify(LEVELS);
  assert.doesNotMatch(everything, /tetris|টেট্রিস|tetromino|টেট্রোমিনো|-?tris\b|ট্রিস|korobeiniki|কোরোবেইনিকি/i);
  assert.doesNotMatch(everything, /আপনি|করুন/);
  assert.equal(everything, everything.normalize("NFC"));
});
