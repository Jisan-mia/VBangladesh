import assert from "node:assert/strict";
import test from "node:test";
import { cleanText, defaultBoard, paint, palettes, parseShareHash, plateNumber, plateOwner, possessive, regions, shareHash, swatches, MAX_LINE, type Board } from "../lib/board";
import { share } from "../share";

const board: Board = { motif: "swans", colors: [7, 1, 4, 3, 10], line: "মায়ের দোয়া", name: "রাফি", area: "মিরপুর" };

test("a board survives the share-link round trip", () => {
  assert.deepEqual(parseShareHash(shareHash(board)), board);
});

test("anchors and foreign hashes are not boards", () => {
  for (const hash of ["", "#result", "#board", "#b=tiger", "#m=5"]) assert.equal(parseShareHash(hash), null);
});

test("broken colour codes fall back to the default colours instead of crashing", () => {
  for (const code of ["", "zzzzz", "1234", "123456", "-1234"]) assert.deepEqual(parseShareHash(`#b=boat&c=${code}`)?.colors, defaultBoard.colors);
});

test("text loses control and direction-override characters and is capped by whole letters", () => {
  assert.equal(cleanText("  ভালো‮ থাকুক\nসবাই  ", MAX_LINE), "ভালো থাকুক সবাই");
  assert.equal(cleanText("ক্ষ".repeat(40), 3), "ক্ষক্ষক্ষ");
  assert.equal(parseShareHash(`#b=flower&t=${encodeURIComponent("অ".repeat(200))}`)?.line.length, MAX_LINE);
});

test("text is stored in one Unicode form so the same board makes the same link", () => {
  const decomposed = "য়".normalize("NFD");
  assert.equal(shareHash({ ...board, line: decomposed }), shareHash({ ...board, line: decomposed.normalize("NFC") }));
});

test("painting a part changes only that part and rejects unknown colours", () => {
  const painted = paint(defaultBoard, "banner", 0);
  assert.deepEqual(painted.colors, [...defaultBoard.colors.slice(0, 4), 0]);
  assert.throws(() => paint(defaultBoard, "sky", swatches.length), RangeError);
});

test("every ready colour set names a real colour for each part", () => {
  assert.ok(palettes.every(palette => palette.colors.length === regions.length && palette.colors.every(index => swatches[index])));
  assert.ok(swatches.length <= 36, "colour indexes must fit in one base-36 digit");
});

test("the plate number belongs to the name and area and is four Bangla digits", () => {
  assert.equal(plateNumber(board), plateNumber({ name: "রাফি", area: "মিরপুর" }));
  assert.notEqual(plateNumber(board), plateNumber({ name: "নাদিয়া", area: "মিরপুর" }));
  assert.match(plateNumber(board), /^[১-৯][০-৯]{3}$/);
  assert.equal(plateOwner({ name: "", area: "" }), "ঢাকা");
  assert.equal(plateOwner(board), "রাফি · মিরপুর");
});

test("Bangla possessive follows the name's ending", () => {
  assert.deepEqual(["রাফি", "জাহিদ", "শরৎ", "Nadia"].map(possessive), ["রাফির", "জাহিদের", "শরতের", "Nadia-এর"]);
});

test("the share API normalizes states and writes a personal preview", () => {
  assert.equal(share.normalize("b=nope"), null);
  assert.equal(share.normalize(shareHash(board).slice(1)), shareHash(board).slice(1));
  assert.equal(share.preview(shareHash(board).slice(1)).title, "রাফির রিকশার বোর্ডে লেখা “মায়ের দোয়া”। তোমারটায় কী লিখতে?");
  assert.match(share.preview("b=boat").title, /^এক বন্ধুর রাঙানো রিকশার বোর্ড/);
});
