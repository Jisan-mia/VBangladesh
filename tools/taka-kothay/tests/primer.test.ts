import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_PRIMER, caption, humanLine, parseShareHash, previewTitle, shareHash, type Primer } from "../lib/primer";
import { share } from "../share";

const primer = (taka: number, paisa = 0, extra: Partial<Primer> = {}): Primer => ({ amount: { taka, paisa }, formal: false, international: false, ...extra });

test("cards survive the link round trip", () => {
  for (const card of [DEFAULT_PRIMER, primer(1234567, 50, { formal: true, international: true }), primer(0), primer(0, 5), primer(9_999_999_999, 99)]) {
    assert.deepEqual(parseShareHash(shareHash(card)), card);
  }
  assert.equal(shareHash(primer(1234567, 50)), "#a=1234567.50");
  assert.equal(shareHash(primer(1234567, 5)), "#a=1234567.05");
  assert.equal(shareHash(DEFAULT_PRIMER), "#a=50000");
});

test("hostile or unrelated hashes are ignored", () => {
  for (const hash of ["", "#", "#result", "#tool", "#a=", "#a=abc", "#a=-5", "#a=1e5", "#a=12.345", "#a=10000000000", "#a=1,000", "#a=%E0%A7%AB", "#a=.5", "#a=" + "9".repeat(300), "#a=__proto__"]) {
    assert.equal(parseShareHash(hash), null, hash.slice(0, 20));
  }
  assert.deepEqual(parseShareHash("#a=12.5&f=yes&i=0&x=<script>"), primer(12, 50));
});

test("the margin note follows the number", () => {
  assert.equal(humanLine(primer(25_00_00_000)), "এত শূন্য! গুনতে গুনতে চা ঠান্ডা।");
  assert.equal(humanLine(primer(39_000)), "ঊনচল্লিশ — এই বানানে কতজন আটকায়!");
  assert.equal(humanLine(primer(1_289)), "ঊননব্বই — এই বানানে কতজন আটকায়!");
  assert.equal(humanLine(primer(50_000)), "গোল সংখ্যা, মন খুশি।");
  assert.equal(humanLine(primer(500)), "গোল সংখ্যা, মন খুশি।");
  assert.equal(humanLine(primer(1_999)), "নিরানব্বইয়ের ধাক্কা, আরেকটু হলেই গোল!");
  assert.equal(humanLine(primer(0)), "শূন্য টাকা, তবু লিখতে জানা ভালো।");
  assert.equal(humanLine(primer(1_250, 50)), "পয়সাও বাদ যায়নি, হিসাব একদম পাক্কা।");
  assert.equal(humanLine(primer(1_23_456)), "লাখের ঘরে পা, সাবধানে লেখো।");
  assert.equal(humanLine(primer(1_234)), "অঙ্ক আর কথা মিললে তবেই চেক পাস।");
});

test("caption and preview read like a person wrote them", () => {
  assert.equal(caption(primer(1234567)), "১২,৩৪,৫৬৭ = বারো লাখ চৌত্রিশ হাজার পাঁচশো সাতষট্টি টাকা মাত্র। এই সংখ্যাটা কথায় লিখতে পারবে?");
  assert.equal(previewTitle(primer(1234567)), "১২,৩৪,৫৬৭ টাকা কথায় কী হয়? দেখে নাও");
});

test("share normalizes, previews, and counts nothing", () => {
  assert.equal(share.normalize("a=1234567.5&f=1&junk=1"), "a=1234567.50&f=1");
  assert.equal(share.normalize("a=lots"), null);
  assert.equal(share.normalize("a=10000000000"), null);
  assert.equal(share.preview("a=50000").title, "৫০,০০০ টাকা কথায় কী হয়? দেখে নাও");
  assert.match(share.preview("nonsense").title, /টাকা/);
  assert.equal(share.tally, undefined);
});
