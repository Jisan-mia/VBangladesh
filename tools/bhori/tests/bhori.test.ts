import assert from "node:assert/strict";
import test from "node:test";
import { cleanName, createCard, fromGrams, gramsExact, gramsValue, parseGrams, parseShareHash, pieceTitle, samplePiece, shareHash, split, weightText, workingLine, MAX_NAME_LENGTH, MAX_POINTS, type Piece } from "../lib/bhori";
import { share } from "../share";

const piece = (extra: Partial<Piece> = {}): Piece => ({ ...samplePiece, ...extra });
const of = (bhori: number, ana = 0, roti = 0, point = 0) => bhori * 960 + ana * 60 + roti * 10 + point;

test("unit constants: 1 ভরি = 16 আনা = 96 রতি = 960 পয়েন্ট = 11.664 g", () => {
  assert.equal(gramsExact(of(1)), "11.664");
  assert.equal(gramsExact(of(0, 16)), "11.664");
  assert.equal(gramsExact(of(0, 0, 96)), "11.664");
  assert.equal(gramsExact(of(0, 1)), "0.729");
  assert.equal(gramsExact(of(0, 0, 1)), "0.1215");
  assert.equal(gramsExact(1), "0.01215");
  assert.deepEqual(split(of(3, 15, 5, 9)), { bhori: 3, ana: 15, roti: 5, point: 9 });
});

test("ভরি → গ্রাম, with the brief's examples and rounding written out", () => {
  // The first screen: ২ ভরি ৪ আনা = ২৬.২৪ গ্রাম.
  const first = createCard(samplePiece);
  assert.equal(first.weight, "২ ভরি ৪ আনা");
  assert.equal(first.grams, "২৬.২৪");
  assert.equal(first.working, "৩৬ আনা × ০.৭২৯ = ২৬.২৪৪ গ্রাম ≈ ২৬.২৪");
  // The card example: ১ ভরি ৫ আনা = ১৫.৩১ গ্রাম.
  assert.equal(gramsValue(of(1, 5)), "15.31");
  assert.equal(workingLine(of(1, 5)), "২১ আনা × ০.৭২৯ = ১৫.৩০৯ গ্রাম ≈ ১৫.৩১");
  assert.equal(workingLine(of(10)), "১৬০ আনা × ০.৭২৯ = ১১৬.৬৪ গ্রাম");
  assert.equal(workingLine(of(0, 0, 3)), "৩ রতি × ০.১২১৫ = ০.৩৬৪৫ গ্রাম ≈ ০.৩৬");
  assert.equal(workingLine(of(1, 0, 0, 3)), "৯৬৩ পয়েন্ট × ০.০১২১৫ = ১১.৭০০৪৫ গ্রাম ≈ ১১.৭০");
  // Half rounds up, without float drift: 100 পয়েন্ট = 1.215 g → 1.22.
  assert.equal(gramsValue(100), "1.22");
  assert.equal(weightText(0), "০ ভরি");
  assert.equal(weightText(of(0, 0, 2, 5)), "২ রতি ৫ পয়েন্ট");
});

test("গ্রাম → ভরি: nearest পয়েন্ট, and how far rounding moved it", () => {
  assert.equal(parseGrams("১০"), 10);
  assert.equal(parseGrams("11.664 গ্রাম"), 11.664);
  assert.equal(parseGrams("১,০০০"), 1000);
  for (const bad of ["", ".", "abc", "-3", "1.2.3", "2000", "1e3"]) assert.equal(parseGrams(bad), null, bad);
  const ten = fromGrams(10);
  assert.equal(weightText(ten.points), "১৩ আনা ৪ রতি ৩ পয়েন্ট");
  assert.equal(gramsExact(ten.points), "9.99945");
  assert.equal(ten.diff, 0.00055);
  assert.deepEqual(fromGrams(11.664), { points: 960, diff: 0 });
  assert.equal(fromGrams(26.24).points, of(2, 4));
});

test("every পয়েন্ট count survives the 2-decimal grams in a link", () => {
  for (let points = 1; points <= MAX_POINTS; points++) {
    assert.equal(parseShareHash(shareHash(piece({ points })))?.points, points);
  }
});

test("a shared link round-trips and refuses hostile state", () => {
  const full = piece({ points: of(1, 5), item: "har", owner: "nanu", name: "রাফি" });
  assert.deepEqual(parseShareHash(shareHash(full)), full);
  assert.equal(shareHash(piece({ points: of(1, 5), item: "bala", owner: "ma" })), "#g=15.31&it=bala&w=ma");
  assert.deepEqual(parseShareHash("#g=15.31&it=bala&w=ma&x=1"), piece({ points: of(1, 5) }));
  for (const hash of ["", "#g=0&it=bala&w=ma", "#g=-1&it=bala&w=ma", "#g=15.311&it=bala&w=ma", "#g=1e3&it=bala&w=ma", "#g=2000&it=bala&w=ma", "#g=15&it=crown&w=ma", "#g=15&it=bala&w=<script>", "#it=bala&w=ma", `#g=15&it=bala&w=ma&n=${"x".repeat(400)}`]) {
    assert.equal(parseShareHash(hash), null, hash);
  }
});

test("names are NFC, lose control and direction characters, and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  assert.equal(cleanName("ময়না"), "ময়না".normalize("NFC"));
  assert.equal(parseShareHash(`g=15&it=bala&w=ma&n=${encodeURIComponent("a\u0000b")}`)?.name, "ab");
});

test("titles and human lines follow the picks", () => {
  assert.equal(pieceTitle({ item: "har", owner: "nanu", name: "" }), "নানুর হার");
  assert.equal(pieceTitle({ item: "har", owner: "nanu", name: "রাফি" }), "রাফির নানুর হার");
  assert.equal(pieceTitle({ item: "angti", owner: "amar", name: "" }), "আমার আংটি");
  assert.equal(pieceTitle({ item: "angti", owner: "amar", name: "জাহিদ" }), "জাহিদের আংটি");
  assert.equal(createCard(piece({ owner: "nanu", item: "har" })).line, "ওজন গ্রামে মাপা যায়, স্মৃতি না।");
  assert.equal(createCard(piece({ owner: "nanu", item: "nakful" })).line, "নানুর মুখটা মনে পড়লে আগে ছোট্ট নাকফুলটাই চোখে ভাসে।");
});

test("share: normalize, personal previews, and a tally over item ids only", () => {
  assert.equal(share.normalize("g=15.309&it=bala&w=ma"), null);
  assert.equal(share.normalize("w=ma&it=bala&g=15.3&junk=1"), "g=15.30&it=bala&w=ma");
  assert.equal(share.preview("g=15.31&it=har&w=nanu&n=রাফি").title, "রাফির নানুর হার: ১ ভরি ৫ আনা — ১৫.৩১ গ্রাম");
  assert.equal(share.preview("g=26.24&it=bala&w=ma").title, "মায়ের বালা: ২ ভরি ৪ আনা — ২৬.২৪ গ্রাম");
  assert.equal(share.preview("bad").title, "ভরির হিসাব — ভরি, আনা, রতি গ্রামে কত?");
  assert.deepEqual(share.tally, ["bala", "churi", "dul", "angti", "har", "nakful"]);
});
