import assert from "node:assert/strict";
import test from "node:test";
import { stampGrid, stampStyle } from "../lib/draw-card";
import { chapters, cleanCity, cleanName, commonLine, decodePicks, defaultPicks, encodePicks, moments, packs, pageOrder, parseShareHash, passportLine, percentOf, previewTitle, shareHash, toggleMoment, whoLine, MAX_CITY_LENGTH, MAX_NAME_LENGTH, TOTAL, type Passport } from "../lib/probash";
import { share } from "../share";

test("40 unique moments on known pages, none about visas, debt or money, defaults among them", () => {
  assert.equal(TOTAL, 40);
  assert.equal(new Set(moments.map(moment => moment.id)).size, 40);
  for (const moment of moments) {
    assert.ok(chapters.some(chapter => chapter.id === moment.chapter), moment.id);
    assert.doesNotMatch(moment.label + moment.card, /ভিসা|আকামা|দালাল|ঋণ|লোন|টাকা পাঠা|রেমিট্যান্স|অবৈধ|নির্যাতন/);
  }
  for (const id of defaultPicks) assert.ok(moments.some(moment => moment.id === id));
  for (const pack of packs) assert.ok(moments.some(moment => moment.chapter === pack.id), pack.id);
});

test("a passport survives the link round trip", () => {
  const passport: Passport = { picked: ["airport", "iftar", "tiffin"], pack: "family", city: "টরন্টো", name: "রাফি" };
  const hash = shareHash(passport);
  assert.equal(hash, `#p=family&m=${encodePicks(passport.picked)}&c=${encodeURIComponent("টরন্টো")}&n=${encodeURIComponent("রাফি")}`);
  assert.deepEqual(parseShareHash(hash), passport);
  const all = moments.map(moment => moment.id);
  assert.deepEqual(decodePicks(encodePicks(all)), all);
  assert.ok(encodePicks(all).length <= 8);
  // The last moment sits above bit 31, where bitwise maths would break.
  assert.deepEqual(decodePicks(encodePicks(["tiffin"])), ["tiffin"]);
  assert.deepEqual(parseShareHash("m=1"), { picked: ["airport"], pack: "", city: "", name: "" });
  assert.equal(share.normalize("#m=1&p=student&x=1&n=%20মিম%20"), "p=student&m=1&n=" + encodeURIComponent("মিম"));
});

test("hostile, empty or out-of-range hashes are refused", () => {
  for (const hash of ["", "#result", "#pb-pages", "#m=0", "#m=-1", "#m=1.5", "#m=zzzzzzzzz", "#m=%ZZ", "#p=worker", "#m=<b>", "#m=" + (2 ** 40).toString(36)]) {
    assert.equal(parseShareHash(hash), null, hash);
  }
  assert.equal(parseShareHash("#m=1&p=boss")?.pack, "");
  assert.equal(share.normalize("m=zzzzzzzzz"), null);
  assert.equal(share.normalize("m=0"), null);
});

test("names and cities are NFC, lose control and direction-override characters, and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanCity("​দুবাই⁦ "), "দুবাই");
  assert.equal(Array.from(cleanName("ক".repeat(MAX_NAME_LENGTH + 10))).length, MAX_NAME_LENGTH);
  assert.equal(Array.from(cleanCity("ক".repeat(MAX_CITY_LENGTH + 10))).length, MAX_CITY_LENGTH);
  const decomposed = "মালয়েশিয়া".normalize("NFD");
  assert.equal(cleanCity(decomposed), "মালয়েশিয়া".normalize("NFC"));
  assert.equal(parseShareHash("#m=1&c=" + encodeURIComponent(decomposed))?.city, "মালয়েশিয়া".normalize("NFC"));
  // ZWNJ/ZWJ stay: some Bangla spellings need them.
  assert.equal(cleanName("র‌য্যাব"), "র‌য্যাব");
  assert.equal(whoLine({ name: "রাফি", city: "রিয়াদ" }), "রাফি · রিয়াদ");
  assert.equal(whoLine({ name: "", city: "রিয়াদ" }), "রিয়াদ");
});

test("the human line comes from what was stamped", () => {
  assert.equal(passportLine(["iftar", "ranna"]), "একা ইফতার, তবু প্লেটে দেশের পেঁয়াজু।");
  assert.equal(passportLine(defaultPicks), "মায়ের রান্নার স্বাদ কোনো দোকানে মেলে না।");
  assert.equal(passportLine(["airport", "bidai"]), "যতবার বিদায়, ততবার চোখ ভেজে।");
  assert.equal(passportLine(moments.map(moment => moment.id)), "পুরো ৪০! এই পাসপোর্টে আর সিলের জায়গা নেই।");
  assert.equal(passportLine(["sim"]), "অল্প কয়টা সিল, প্রত্যেকটায় একটা গল্প।");
  assert.equal(passportLine([]), "পাসপোর্টের পাতা এখনো ফাঁকা।");
  assert.deepEqual(toggleMoment(toggleMoment(["sim"], "plane"), "sim"), ["plane"]);
});

test("friend overlay, preview title and tally ids", () => {
  const friend: Passport = { picked: ["airport", "shutki", "iftar", "nam"], pack: "", city: "লন্ডন", name: "মিম" };
  assert.equal(commonLine(["airport"], friend), "দুজনেরই: এয়ারপোর্টে কান্না");
  assert.equal(commonLine(["airport", "shutki", "iftar", "nam"], friend), "দুজনেরই: এয়ারপোর্টে কান্না, লাগেজে শুঁটকি আর ২টা");
  assert.equal(commonLine(["plane"], friend), "মিমের সাথে একটাও মেলেনি!");
  assert.equal(commonLine(["plane"], null), "");
  assert.equal(previewTitle({ ...friend, name: "রাফি" }), "রাফির পাসপোর্টে প্রবাস জীবনের ৪টা সিল — তোমার কয়টা?");
  assert.equal(share.preview(shareHash({ ...friend, name: "" }).slice(1)).title, "এক বন্ধুর পাসপোর্টে প্রবাস জীবনের ৪টা সিল — তোমার কয়টা?");
  assert.ok(!share.preview(shareHash(friend).slice(1)).title.includes("লন্ডন"));
  // Only fixed moment ids are countable: never packs, cities or names.
  assert.deepEqual(share.tally, moments.map(moment => moment.id));
  assert.equal(percentOf(91, 100), 91);
  assert.equal(percentOf(1, 0), 100);
});

test("the picked pack's page comes first; stamps keep a fixed look and stay off the fold", () => {
  assert.deepEqual(pageOrder("").map(chapter => chapter.id), chapters.map(chapter => chapter.id));
  assert.equal(pageOrder("student")[0].id, "student");
  assert.equal(pageOrder("student").length, chapters.length);
  assert.deepEqual(stampStyle("iftar"), stampStyle("iftar"));
  const opening = defaultPicks.map(stampStyle);
  assert.equal(new Set(opening.map(style => style.ink)).size, defaultPicks.length);
  assert.equal(new Set(opening.map(style => style.shape)).size, defaultPicks.length);
  for (const chapter of chapters) {
    const page = moments.filter(moment => moment.chapter === chapter.id).map(moment => stampStyle(moment.id));
    page.slice(1).forEach((style, index) => assert.ok(style.ink !== page[index].ink && style.shape !== page[index].shape, chapter.id));
  }
  for (const moment of moments) assert.ok(Math.abs(stampStyle(moment.id).tilt) <= 8);
  for (const count of [1, 4, 13, 27, 40]) {
    const grid = stampGrid(count, 0, 0, 1000, 800);
    assert.equal(grid.centres.length, count);
    assert.equal(grid.columns % 2, 0);
    for (const centre of grid.centres) assert.ok(Math.abs(centre.x - 500) >= grid.w / 2, `count ${count}: a stamp sits on the fold`);
    assert.ok(grid.rows * grid.cellH <= 800 + 1e-6);
  }
});
