import assert from "node:assert/strict";
import test from "node:test";
import { art } from "../lib/art";
import { boxLine, cleanName, createCard, decodeSelection, encodeSelection, isGi, parseShareHash, shareHash, starters, sweets, tier, toggleSweet, total, MAX_NAME_LENGTH } from "../lib/box";
import { share } from "../share";

test("the box holds forty sweets with unique ids, each with a drawing", () => {
  assert.equal(total, 40);
  assert.equal(new Set(sweets.map(sweet => sweet.id)).size, total);
  for (const sweet of sweets) assert.ok(art[sweet.id], sweet.id);
});

test("the starters are three near-universal sweets, so the box opens at ৪০-এ ৩টা", () => {
  assert.deepEqual(starters, ["roshogolla", "kalojam", "mishti-doi"]);
  assert.equal(createCard({ selected: starters, name: "" }).count, 3);
});

test("famous pairings stay tied to the right place", () => {
  const known = Object.fromEntries(sweets.filter(sweet => "known" in sweet).map(sweet => [sweet.id, sweet.known]));
  assert.equal(known.chomchom, "টাঙ্গাইলের পোড়াবাড়ির চমচম");
  assert.equal(known.kachagolla, "নাটোরের কাঁচাগোল্লা");
  assert.equal(known["bogura-doi"], "বগুড়ার দই");
  assert.equal(known.roshmalai, "কুমিল্লার রসমালাই");
  assert.equal(known.monda, "মুক্তাগাছার মণ্ডা");
  assert.equal(sweets.filter(isGi).length, 13);
});

test("tapping a sweet twice takes it out again; unknown sweets are refused", () => {
  assert.deepEqual(toggleSweet(toggleSweet(starters, "monda"), "monda"), starters);
  assert.throws(() => toggleSweet([], "pizza"), RangeError);
});

test("a full box survives the link round trip, including the last sweet", () => {
  const all = sweets.map(sweet => sweet.id);
  assert.deepEqual(decodeSelection(encodeSelection(all)), all);
  assert.ok(encodeSelection(all).length <= 8);
  const shared = parseShareHash(shareHash({ selected: ["monda", "hawai-mithai"], name: "রাফি" }));
  assert.deepEqual(shared, { selected: ["monda", "hawai-mithai"], name: "রাফি" });
});

test("hostile or empty hashes are ignored instead of crashing", () => {
  assert.equal(parseShareHash(""), null);
  assert.equal(parseShareHash("#s=%%%"), null);
  assert.equal(parseShareHash("#s=0"), null);
  assert.equal(parseShareHash("#s=zzzzzzzzz"), null);
  assert.equal(parseShareHash("#s=-1"), null);
  assert.equal(share.normalize("s=<script>"), null);
});

test("names are NFC, lose control and direction-override characters, and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  // য় written as য + nukta must come back as the single composed letter.
  assert.equal(cleanName("ময়না"), "ময়না".normalize("NFC"));
});

test("title tiers follow the brief", () => {
  assert.deepEqual([0, 10, 11, 20, 21, 30, 31, 40].map(tier), ["মিষ্টিমুখ শুরু", "মিষ্টিমুখ শুরু", "রসিক", "রসিক", "মিষ্টি-পর্যটক", "মিষ্টি-পর্যটক", "ময়রার প্রিয় খদ্দের", "ময়রার প্রিয় খদ্দের"]);
});

test("the human line comes from the picks", () => {
  assert.equal(boxLine(starters), "বাক্সে এখনো অনেক জায়গা। চলো, মিষ্টির দোকানে!");
  const tenWithChomchom = sweets.slice(0, 10).map(sweet => sweet.id);
  assert.equal(boxLine(tenWithChomchom), "টাঙ্গাইলের চমচম একবার খেলে ভোলা যায় না।");
  const allDoi = [...starters, "bogura-doi", "bhola-doi", "gournadi-doi", "tok-doi", "monda", "jilapi", "batasha"] as const;
  assert.equal(boxLine([...allDoi]), "দই ছাড়া দাওয়াত অসম্পূর্ণ।");
});

test("the card compares with a friend's box", () => {
  const card = createCard({ selected: ["roshogolla", "monda", "jilapi"], name: "" }, { selected: ["roshogolla", "monda", "kalojam", "batasha", "laddu"], name: "তানিয়া" });
  assert.equal(card.match, "দুজনের মিল ২টা, তানিয়ার বাক্সে ২টা বেশি");
  assert.equal(card.lid, "আমার মিষ্টির বাক্স");
  assert.ok(card.names.startsWith("মুক্তাগাছার মণ্ডা"));
});

test("share preview is personal and the tally only counts sweet ids", () => {
  const state = share.normalize("s=" + encodeSelection(["monda", "kalojam"]) + "&n=রাফি")!;
  assert.equal(share.preview(state).title, "রাফির মিষ্টির বাক্সে ২টা। তোমার কয়টা?");
  assert.deepEqual(share.tally, sweets.map(sweet => sweet.id));
});
