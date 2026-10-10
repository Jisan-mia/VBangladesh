import assert from "node:assert/strict";
import test from "node:test";
import { canLower, canRaise, cleanName, createCard, friendLine, ladder, parseShareHash, previewTitle, sampleEnvelope, shareHash, stepOf, taka, MAX_NAME_LENGTH, type Envelope } from "../lib/upohar";
import { share } from "../share";

const envelope = (extra: Partial<Envelope> = {}): Envelope => ({ ...sampleEnvelope, ...extra });

test("the brief's first screen: cousin, another city, kacchi → ২,০০০–৩,০০০", () => {
  const card = createCard(sampleEnvelope);
  assert.equal(card.range, "২,০০০–৩,০০০ টাকা");
  assert.equal(card.occasion, "কাজিনের বিয়ে");
  assert.equal(card.sub, "হালকা আন্দাজ, নিয়ম না");
  assert.equal(card.note, "কাচ্চি থাকলে খামটা একটু ভারী করো, ভালোবাসাও।");
  assert.equal(taka(10000), "১০,০০০");
});

test("ranges move with each pick and stay on the ladder", () => {
  assert.equal(createCard(envelope({ distance: "near" })).range, "৩,০০০–৪,০০০ টাকা");
  // The FAQ quotes this one.
  assert.equal(createCard(envelope({ relation: "close", distance: "near", food: "roast" })).range, "২,০০০–৩,০০০ টাকা");
  assert.match(createCard(envelope({ mode: "gift", nudge: 1 })).line, /^উপহারটা একটু বড়/);
  assert.equal(createCard(envelope({ food: "cha" })).range, "৭০০–১,০০০ টাকা");
  assert.equal(createCard(envelope({ relation: "neighbour", food: "cha", nudge: -3 })).range, "২০০–৩০০ টাকা");
  assert.equal(stepOf(envelope({ relation: "close", distance: "near", nudge: 3 })), 10);
  for (const nudge of [-3, 0, 3]) {
    const step = stepOf(envelope({ nudge }));
    assert.ok(step >= 0 && step <= ladder.length - 2);
  }
  assert.equal(canLower(envelope({ relation: "neighbour", food: "cha", nudge: -1 })), false);
  assert.equal(canRaise(envelope({ nudge: 3 })), false);
  assert.equal(canRaise(envelope()), true);
});

test("the no-number modes never show an amount", () => {
  const heart = createCard(envelope({ mode: "heart", nudge: 2 }));
  const gift = createCard(envelope({ mode: "gift" }));
  for (const card of [heart, gift]) {
    assert.equal(card.range, "");
    assert.doesNotMatch(`${card.headline} ${card.sub} ${card.line} ${previewTitle(card)} ${friendLine(card)}`, /[০-৯0-9]|টাকা/);
  }
  assert.equal(heart.headline, "সামর্থ্য অনুযায়ী");
  assert.equal(gift.headline, "বেডশিটের সেট");
  assert.equal(gift.sub, "অথবা নকশিকাঁথা");
});

test("the human line follows the picks", () => {
  assert.equal(createCard(envelope()).line, "কাজিনের বিয়েতে খামের চেয়েও বড় দায়িত্ব: জুতা চুরির দলে থাকা।");
  assert.equal(createCard(envelope({ distance: "abroad" })).line, "বিদেশ থেকে আসছ? তুমি এলেই সবচেয়ে বড় উপহার।");
  assert.match(createCard(envelope({ nudge: 1 })).line, /ভারী/);
  assert.match(createCard(envelope({ nudge: -1 })).line, /হালকা/);
});

test("a shared link round-trips and refuses hostile state", () => {
  const full = envelope({ relation: "boss", distance: "abroad", food: "roast", mode: "gift", nudge: -2, name: "রাফি" });
  assert.deepEqual(parseShareHash(shareHash(full)), full);
  assert.equal(shareHash(sampleEnvelope), "#r=cousin&d=city&f=kacchi");
  assert.deepEqual(parseShareHash("#r=cousin&d=city&f=kacchi"), sampleEnvelope);
  // Unknown extras and out-of-range nudges are dropped, not fatal.
  assert.deepEqual(parseShareHash("r=cousin&d=city&f=kacchi&m=gold&a=9&x=1"), sampleEnvelope);
  assert.equal(parseShareHash("r=cousin&d=city&f=kacchi&a=-0")?.nudge, 0);
  for (const hash of ["", "#r=uncle&d=city&f=kacchi", "#r=cousin&f=kacchi", "#r=cousin&d=moon&f=kacchi", "#r=cousin&d=city&f=<script>", `#r=cousin&d=city&f=kacchi&n=${"x".repeat(400)}`]) {
    assert.equal(parseShareHash(hash), null, hash);
  }
});

test("names are NFC, lose control and direction characters, and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  assert.equal(cleanName("ময়না"), "ময়না".normalize("NFC"));
  assert.equal(parseShareHash(`r=cousin&d=city&f=kacchi&n=${encodeURIComponent("a\u0000b")}`)?.name, "ab");
});

test("share: normalize, personal previews, and a tally over relation ids only", () => {
  assert.equal(share.normalize("r=cousin&d=city&f=kacchi&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF&junk=1"), "r=cousin&d=city&f=kacchi&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.equal(share.normalize("r=x"), null);
  assert.equal(share.preview("r=cousin&d=city&f=kacchi&n=রাফি").title, "রাফির খাম: কাজিনের বিয়েতে ২,০০০–৩,০০০ টাকা");
  assert.equal(share.preview("r=friend&d=near&f=roast").title, "দাওয়াতের খাম: বন্ধুর বিয়েতে ১,০০০–১,৫০০ টাকা");
  assert.equal(share.preview("r=friend&d=near&f=roast&m=heart&n=মিম").title, "মিমের খাম: বন্ধুর বিয়েতে সামর্থ্য অনুযায়ী, ভালোবাসা সহ");
  assert.equal(share.preview("bad").title, "দাওয়াতে কত দেব? — বিয়ের খামের মজার হিসাব");
  assert.deepEqual(share.tally, ["close", "friend", "cousin", "colleague", "neighbour", "distant", "boss"]);
});
