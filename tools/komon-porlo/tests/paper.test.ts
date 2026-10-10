import assert from "node:assert/strict";
import test from "node:test";
import { bingoLines, caption, cleanName, countOf, createCard, decodeMask, defaultPack, encodeMask, humanLine, packById, packs, parseShareHash, shareHash, tallyIds, tallyItems, toggle, MAX_NAME_LENGTH, SIZE } from "../lib/paper";
import { share } from "../share";

test("every pack has exactly 16 unique squares and a unique id", () => {
  assert.equal(new Set(packs.map(pack => pack.id)).size, packs.length);
  for (const pack of packs) {
    assert.equal(pack.squares.length, SIZE, pack.id);
    assert.equal(new Set(pack.squares).size, SIZE, pack.id);
  }
});

test("squares never touch the topics the brief rules out", () => {
  const banned = /বাচ্চা|মোটা|কালো|ফর্সা|শুকিয়ে|ওজন|যৌতুক|ধর্ম|রাজনীতি|সরকার/;
  for (const pack of packs) for (const square of pack.squares) assert.doesNotMatch(square, banned, square);
});

test("tapping a square twice takes the stamp off again", () => {
  assert.equal(toggle(toggle(0, 5), 5), 0);
  assert.throws(() => toggle(0, 16), RangeError);
  assert.throws(() => toggle(0, -1), RangeError);
});

test("a full row, column or diagonal is a bingo; an almost-line is not", () => {
  const row = [4, 5, 6, 7].reduce(toggle, 0);
  assert.deepEqual(bingoLines(row), [[4, 5, 6, 7]]);
  assert.equal(bingoLines(toggle(row, 7)).length, 0);
  const diagonals = [0, 5, 10, 15, 3, 6, 9, 12].reduce(toggle, 0);
  assert.equal(bingoLines(diagonals).length, 2);
  assert.equal(bingoLines(0xffff).length, 10);
  assert.equal(createCard({ pack: "relatives", mask: diagonals, name: "" }).bingo, "ডাবল বিঙ্গো!");
});

test("the mask survives the 4-hex round trip, edges included", () => {
  for (const mask of [0, 1, 0x8000, 0xa4f1, 0xffff]) assert.equal(decodeMask(encodeMask(mask)), mask);
  assert.equal(encodeMask(0x1ffff), "ffff");
});

test("a shared link brings back pack, stamps and name", () => {
  const own = { pack: "ammu" as const, mask: 0xa4f1, name: "রাফি" };
  assert.deepEqual(parseShareHash(shareHash(own)), own);
  assert.deepEqual(parseShareHash("#p=relatives&s=A4F1"), { pack: "relatives", mask: 0xa4f1, name: "" });
  assert.deepEqual(parseShareHash("#p=relatives&s=0000")?.mask, 0);
});

test("hostile or broken hashes are ignored instead of crashing", () => {
  for (const hash of ["", "#", "#result", "#p=evil&s=ffff", "#p=relatives", "#p=relatives&s=zzzz", "#p=relatives&s=fffff", "#p=relatives&s=-001", "#p=__proto__&s=0001", "#p=relatives&s=%%%"]) assert.equal(parseShareHash(hash), null, hash);
  assert.equal(parseShareHash(`#p=relatives&s=0001&n=${"ক".repeat(1200)}`), null);
});

test("names are NFC, lose control and direction characters, and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ময়না".normalize("NFD")), cleanName("ময়না"));
  assert.equal(cleanName("য়"), "য়");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  assert.equal(parseShareHash(`#p=relatives&s=0001&n=${encodeURIComponent("ক".repeat(60))}`)?.name.length, MAX_NAME_LENGTH);
});

test("the human line follows the count and each pack's quiet line", () => {
  const relatives = packById("relatives");
  assert.equal(humanLine(0, relatives), "এবার আত্মীয়রা ছুটিতে ছিলেন।");
  assert.equal(humanLine(3, packById("jam")), packById("jam").calm);
  assert.equal(humanLine(4, relatives), "মাঝারি প্রস্তুতি, ভালো ফল।");
  assert.equal(humanLine(15, relatives), "পুরো সিলেবাস কমন!");
  assert.equal(humanLine(16, relatives), "গোল্ডেন এ-প্লাস! সব প্রশ্ন একদিনেই।");
});

test("a friend's card on the same pack gives scores and the first square you share", () => {
  const card = createCard({ pack: "relatives", mask: 0b111, name: "মিম" }, { pack: "relatives", mask: 0b110, name: "রাফি" });
  assert.equal(card.count, 3);
  assert.equal(card.match, "রাফি ২, মিম ৩ — দুজনেরই কমন: রেজাল্ট কত?");
  assert.equal(createCard({ pack: "relatives", mask: 1, name: "" }, { pack: "relatives", mask: 2, name: "" }).match, "বন্ধু ১, আমি ১");
  assert.equal(createCard({ pack: "office", mask: 1, name: "" }, { pack: "relatives", mask: 1, name: "রাফি" }).match, "");
  assert.match(caption(card), /^রাফি ২, মিম ৩/);
});

test("tally items are fixed ids only, never names", () => {
  const items = tallyItems({ pack: "relatives", mask: 0b1001, name: "রাফি" });
  assert.deepEqual(items, ["relatives.1", "relatives.4", "seen:relatives"]);
  assert.ok(items.every(item => tallyIds.includes(item)));
  assert.equal(countOf(0xffff), 16);
});

test("season picks the default pack", () => {
  assert.equal(defaultPack(new Date(2026, 11, 5)), "biyebari");
  assert.equal(defaultPack(new Date(2027, 1, 28)), "biyebari");
  assert.equal(defaultPack(new Date(2026, 9, 10)), "relatives");
});

test("share normalizes state and previews with the sharer's name", () => {
  assert.equal(share.normalize("p=relatives&s=A4F1&n=%20রাফি%20&x=1"), "p=relatives&s=a4f1&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.equal(share.normalize("p=evil&s=0001"), null);
  const preview = share.preview("p=relatives&s=a4f1&n=রাফি");
  assert.equal(preview.title, "আত্মীয়দের প্রশ্ন: রাফির ৮টা কমন পড়েছে — তোমার কয়টা?");
  assert.equal(share.preview("p=office&s=0000").title, "অফিসের কথা: এক বন্ধুর ০টা কমন পড়েছে — তোমার কয়টা?");
  assert.ok(share.tally?.includes("seen:biyebari"));
});
