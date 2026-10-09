import assert from "node:assert/strict";
import test from "node:test";
import { cleanName, createCard, decodeSelection, encodeSelection, memories, parseShareHash, possessive, shareHash, toggleMemory, MAX_NAME_LENGTH } from "../lib/postcard";

test("tapping a memory twice removes it again", () => {
  assert.deepEqual(toggleMemory(toggleMemory([], "kite"), "kite"), []);
});

test("unknown memories cannot enter a card", () => {
  assert.throws(() => toggleMemory([], "unrecognized"), RangeError);
});

test("memory ids are unique so share-link bit positions stay stable", () => {
  assert.equal(new Set(memories.map(memory => memory.id)).size, memories.length);
});

test("a selection survives the share-link round trip, including the last memory", () => {
  const selected = ["gollachhut", "hurricane", memories.at(-1)!.id] as const;
  assert.deepEqual(decodeSelection(encodeSelection([...selected])), [...selected]);
});

test("a shared link brings back name and decade", () => {
  const shared = parseShareHash(shareHash({ selected: ["kite", "salami"], name: "রাফি", decade: "90" }));
  assert.deepEqual(shared, { selected: ["kite", "salami"], name: "রাফি", decade: "90" });
});

test("hostile or empty hashes are ignored instead of crashing", () => {
  assert.equal(parseShareHash(""), null);
  assert.equal(parseShareHash("#m=%%%"), null);
  assert.equal(parseShareHash("#m=0"), null);
  assert.deepEqual(parseShareHash("#m=1&d=evil")?.decade, "");
});

test("names lose control and direction-override characters and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
});

test("Bangla possessive follows the name's ending", () => {
  assert.equal(possessive("রাফি"), "রাফির");
  assert.equal(possessive("জাহিদ"), "জাহিদের");
  assert.equal(possessive("শরৎ"), "শরতের");
  assert.equal(possessive("Nadia"), "Nadia-এর");
});

test("the card counts picks and compares with a friend's link", () => {
  const card = createCard({ selected: ["kite", "pond", "slate"], name: "", decade: "" }, { selected: ["kite", "slate", "meena"], name: "তানিয়া", decade: "" });
  assert.equal(card.count, 3);
  assert.equal(card.match, "তানিয়ার সাথে ২টা মিলে গেছে");
});
