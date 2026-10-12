import assert from "node:assert/strict";
import test from "node:test";
import { gridCells } from "../lib/draw-card";
import { certificateTitle, cleanHall, cleanName, commonLine, decodePicks, defaultPicks, encodePicks, messLine, moments, parseShareHash, percentOf, previewTitle, sections, serial, shareHash, tierFor, toggleMoment, MAX_HALL_LENGTH, MAX_NAME_LENGTH, TOTAL, type MealCard } from "../lib/mess";
import { site } from "../content";
import { share } from "../share";

test("40 unique moments, 8 per printed section, nothing about campus politics; defaults among them", () => {
  assert.equal(TOTAL, 40);
  assert.equal(new Set(moments.map(moment => moment.id)).size, 40);
  for (const section of sections) assert.equal(moments.filter(moment => moment.section === section.id).length, 8, section.id);
  const everything = [...moments.flatMap(moment => [moment.label, moment.card]), ...Object.values(site).flat().map(item => typeof item === "string" ? item : JSON.stringify(item))].join(" ");
  assert.doesNotMatch(everything, /গণরুম|গেস্টরুম|র‍্যাগ|র‌্যাগ|র্যাগ|ছাত্রলীগ|ছাত্রদল|শিবির|রাজনীতি|মারামারি|ঢাবি|বুয়েট/);
  // Gender-neutral: nothing assumes the reader is a man.
  assert.doesNotMatch(moments.map(moment => moment.label).join(" "), /ভাই|আপু|ছেলেদের|মেয়েদের/);
  for (const id of defaultPicks) assert.ok(moments.some(moment => moment.id === id));
  assert.deepEqual(defaultPicks, ["dimdal", "buya", "maggi", "manager"]);
});

test("a card survives the link round trip", () => {
  const card: MealCard = { picked: ["dimdal", "achar", "bidai"], name: "রাফি", hall: "সবুজ নীড়" };
  const hash = shareHash(card);
  assert.equal(hash, `#m=${encodePicks(card.picked)}&h=${encodeURIComponent("সবুজ নীড়").replace(/%20/g, "+")}&n=${encodeURIComponent("রাফি")}`);
  assert.deepEqual(parseShareHash(hash), card);
  const all = moments.map(moment => moment.id);
  assert.deepEqual(decodePicks(encodePicks(all)), all);
  assert.ok(encodePicks(all).length <= 8);
  // The last moment sits above bit 31, where bitwise maths would break.
  assert.deepEqual(decodePicks(encodePicks(["bidai"])), ["bidai"]);
  assert.deepEqual(parseShareHash("m=1"), { picked: ["dimdal"], name: "", hall: "" });
  assert.equal(share.normalize("#n=%20মিম%20&x=1&m=1"), "m=1&n=" + encodeURIComponent("মিম"));
});

test("hostile, empty or out-of-range hashes are refused", () => {
  for (const hash of ["", "#result", "#mj-card", "#m=0", "#m=-1", "#m=1.5", "#m=zzzzzzzzz", "#m=%ZZ", "#h=abc", "#m=<b>", "#m=" + (2 ** 40).toString(36)]) {
    assert.equal(parseShareHash(hash), null, hash);
  }
  assert.equal(share.normalize("m=zzzzzzzzz"), null);
  assert.equal(share.normalize("m=0"), null);
  assert.equal(parseShareHash("#m=1&h=" + encodeURIComponent("<script>x</script>"))?.hall, "script x /script");
});

test("names and hall names are NFC, lose control and direction-override characters, and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanHall("​সবুজ নীড়⁦ "), "সবুজ নীড়");
  assert.equal(Array.from(cleanName("ক".repeat(MAX_NAME_LENGTH + 10))).length, MAX_NAME_LENGTH);
  assert.equal(Array.from(cleanHall("ক".repeat(MAX_HALL_LENGTH + 10))).length, MAX_HALL_LENGTH);
  assert.equal(MAX_HALL_LENGTH, 20);
  const decomposed = "ছায়ানীড়".normalize("NFD");
  assert.equal(cleanHall(decomposed), "ছায়ানীড়".normalize("NFC"));
  assert.equal(parseShareHash("#m=1&h=" + encodeURIComponent(decomposed))?.hall, "ছায়ানীড়".normalize("NFC"));
  // ZWNJ/ZWJ stay: some Bangla spellings need them.
  assert.equal(cleanName("র‌য্যাব"), "র‌য্যাব");
});

test("the human line and the title come from what was punched", () => {
  assert.equal(messLine(defaultPicks), "রাত দুটোর ম্যাগির চেয়ে দামি ডিনার আর হয় না।");
  assert.equal(messLine(["achar", "maggi"]), "বাড়ির আচারের বয়াম খুলতেই পুরো ফ্লোর হাজির।");
  assert.equal(messLine(["prothom", "bidai", "achar"]), "যে রুম প্রথম দিন অচেনা ছিল, ছাড়ার দিন সেখানেই চোখ ভিজল।");
  assert.equal(messLine(moments.map(moment => moment.id)), "পুরো ৪০টাই। কার্ডে আর ফুটো করার জায়গা নেই।");
  assert.equal(messLine(["charger"]), "অল্প কয়টা ফুটো, বাকি ঘরগুলো এখনো আস্ত।");
  assert.equal(messLine([]), "মিল কার্ড এখনো আস্ত, একটাও ফুটো পড়েনি।");
  assert.deepEqual(toggleMoment(toggleMoment(["light"], "ketli"), "light"), ["ketli"]);
  assert.equal(tierFor(0), "নতুন বোর্ডার");
  assert.equal(tierFor(8), "নতুন বোর্ডার");
  assert.equal(tierFor(9), "চেনা মুখ");
  assert.equal(tierFor(31), "সিনিয়র বোর্ডার");
  assert.equal(tierFor(36), "মেসের মুরুব্বি");
  assert.equal(tierFor(40), "মেসের মুরুব্বি");
  assert.equal(certificateTitle("রাফি"), "রাফির মেস সার্টিফিকেট");
  assert.equal(certificateTitle("  "), "আমার মেস সার্টিফিকেট");
  assert.equal(serial(7), "০৭");
  assert.equal(serial(40), "৪০");
});

test("roommate overlay, preview title without the hall, and tally ids", () => {
  const friend: MealCard = { picked: ["dimdal", "maggi", "achar", "bidai"], name: "মিম", hall: "সবুজ নীড়" };
  assert.equal(commonLine(["maggi"], friend), "দুজনেরই: ম্যাগি রাত");
  assert.equal(commonLine(["dimdal", "maggi", "achar", "bidai"], friend), "দুজনেরই: ডিম-ডাল সপ্তাহ, ম্যাগি রাত আর ২টা");
  assert.equal(commonLine(["light"], friend), "মিমের সাথে একটাও মেলেনি");
  assert.equal(commonLine(["light"], null), "");
  assert.equal(previewTitle({ ...friend, name: "রাফি" }), "রাফির মিল কার্ডে হল-মেস জীবনের ৪টা ফুটো। তোমার কয়টা?");
  assert.equal(share.preview(shareHash({ ...friend, name: "" }).slice(1)).title, "এক বন্ধুর মিল কার্ডে হল-মেস জীবনের ৪টা ফুটো। তোমার কয়টা?");
  assert.ok(!share.preview(shareHash(friend).slice(1)).title.includes("নীড়"));
  // Only fixed moment ids are countable: never names or hall names.
  assert.deepEqual(share.tally, moments.map(moment => moment.id));
  assert.equal(percentOf(91, 100), 91);
  assert.equal(percentOf(1, 0), 100);
});

test("the card grid is 4 × 10, one section per two rows, inside its area", () => {
  const cells = gridCells(40, 250, 912, 720);
  assert.equal(cells.length, 40);
  assert.equal(new Set(cells.map(cell => cell.x)).size, 4);
  assert.equal(new Set(cells.map(cell => cell.y)).size, 10);
  for (const [index, cell] of cells.entries()) {
    assert.equal(cell.number, index + 1);
    assert.ok(cell.x >= 40 && cell.x + cell.w <= 952 + 1e-6 && cell.y >= 250 && cell.y + cell.h <= 970 + 1e-6);
    // Each printed section fills exactly two rows.
    assert.equal(Math.floor(index / 8), sections.findIndex(section => section.id === moments[index].section));
  }
});

test("SEO content fits the brief", () => {
  assert.ok(Array.from(site.title).length <= 45);
  assert.ok(site.description.length >= 120 && site.description.length <= 160);
  assert.ok(site.faq.length >= 5);
  assert.ok(site.privacy.some(text => text.includes("লিংকে থাকে")));
});
