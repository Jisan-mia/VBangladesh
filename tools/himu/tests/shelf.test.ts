import assert from "node:assert/strict";
import test from "node:test";
import { books, cleanName, commonLine, createCard, decodeRead, encodeRead, parseShareHash, previewTitle, readerLine, sample, shareHash, shelves, tierFor, toggleBook, MAX_NAME_LENGTH, type BookId } from "../lib/shelf";
import { share } from "../share";

const shelfIds = (shelf: string) => books.filter(book => book.shelf === shelf).map(book => book.id);

test("the shelf holds 30 books with unique ids on known shelves", () => {
  assert.equal(books.length, 30);
  assert.equal(new Set(books.map(book => book.id)).size, books.length);
  assert.ok(books.every(book => shelves.some(shelf => shelf.id === book.shelf)));
  assert.ok(sample.every(id => books.some(book => book.id === id)));
});

test("tapping a book twice takes it off again, and unknown books are refused", () => {
  assert.deepEqual(toggleBook(toggleBook([], "debi"), "debi"), []);
  assert.throws(() => toggleBook([], "harry-potter"), RangeError);
});

test("picks survive the link round trip, from none to all 30", () => {
  const all = books.map(book => book.id);
  assert.deepEqual(decodeRead(encodeRead(all)), all);
  assert.deepEqual(decodeRead(encodeRead([])), []);
  const some: BookId[] = ["moyurakkhi", "debi", "deyal"];
  assert.deepEqual(decodeRead(encodeRead(some)), some);
  assert.ok(encodeRead(all).length <= 7);
});

test("a shared link brings back picks and name, in shelf order", () => {
  const shared = parseShareHash(shareHash({ read: ["deyal", "himu"], name: "রাফি" }));
  assert.deepEqual(shared, { read: ["himu", "deyal"], name: "রাফি" });
  assert.deepEqual(parseShareHash("#b=0"), { read: [], name: "" });
});

test("hostile, oversized or unrelated hashes are ignored", () => {
  assert.equal(parseShareHash(""), null);
  assert.equal(parseShareHash("#result"), null);
  assert.equal(parseShareHash("#b=%%%"), null);
  assert.equal(parseShareHash("#b=-1"), null);
  assert.equal(parseShareHash("#b=ZZ"), null);
  assert.equal(parseShareHash(`#b=${(2 ** 30).toString(36)}`), null);
  assert.equal(parseShareHash("#b=zzzzzzzz"), null);
  assert.equal(share.normalize("b=abc&n=<script>"), "b=abc&n=%3Cscript%3E");
  assert.equal(share.normalize("n=রাফি"), null);
});

test("names are NFC-normalized, stripped of control and bidi characters, and capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  // কো typed as two code points (ক + ে + া) and as the composed ো must match.
  assert.equal(cleanName("কো"), cleanName("কো"));
  assert.equal(parseShareHash("#b=1&n=কো")?.name, "কো");
});

test("tiers follow the brief's bands", () => {
  assert.equal(tierFor(0), "সবে হাঁটা শুরু");
  assert.equal(tierFor(5), "সবে হাঁটা শুরু");
  assert.equal(tierFor(6), "জোছনাপ্রেমী");
  assert.equal(tierFor(16), "হিমু হতে চাওয়া");
  assert.equal(tierFor(26), "পকেটহীন পাঞ্জাবি");
});

test("the human line reads the picks, not only the count", () => {
  assert.equal(readerLine(shelfIds("misir") as BookId[]), "যুক্তি আর রহস্য, দুটোই তোমার।");
  assert.match(readerLine(shelfIds("himu") as BookId[]), /খালি পায়ে/);
  assert.match(readerLine(shelfIds("uponnash") as BookId[]), /বাইরের হুমায়ূন/);
  assert.match(readerLine([]), /খালি/);
  assert.match(readerLine(books.map(book => book.id)), /পুরো তাকটাই/);
});

test("a friend's link gives both counts and the books both read", () => {
  const card = createCard({ read: ["debi", "himu", "deyal"], name: "" }, { read: ["debi", "deyal", "nishad"], name: "তানিয়া" });
  assert.equal(card.count, 3);
  assert.equal(card.match, "তানিয়ার সাথে দুজনেরই পড়া ২টা");
  assert.deepEqual(commonLine(["moyurakkhi", "himu", "debi"], ["moyurakkhi", "himu", "debi"], 2), { count: 3, text: "ময়ূরাক্ষী, হিমু +১টা" });
});

test("the link preview is personal and the tally only counts book ids", () => {
  assert.equal(previewTitle({ read: ["debi", "himu"], name: "রাফি" }), "রাফি হুমায়ূন আহমেদের ৩০টা বইয়ের ২টা পড়েছে — তুমি কয়টা?");
  assert.match(share.preview("b=0").title, /এক বন্ধু/);
  assert.deepEqual(share.tally, books.map(book => book.id));
});
