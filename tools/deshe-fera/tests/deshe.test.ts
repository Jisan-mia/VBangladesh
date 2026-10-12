import assert from "node:assert/strict";
import test from "node:test";
import { replyLine, abroadText, clockIn, clockText, cleanName, countdownLine, createCard, eids, eidsAway, gapText, homeNote, monthsAbroad, parseShareHash, previewTitle, shareHash, todayInDhaka, MAX_NAME_LENGTH, type Trip } from "../lib/deshe";
import { share } from "../share";

const TODAY = "2026-10-10";
const trip = (extra: Partial<Trip> = {}): Trip => ({ place: "sa", left: "2019-07", back: "", home: "d", name: "", ...extra });

test("years abroad and Eids away", () => {
  assert.equal(monthsAbroad("2019-07", TODAY), 87);
  assert.equal(abroadText(87), "৭ বছর ৩ মাস");
  assert.equal(abroadText(24), "২ বছর");
  assert.equal(abroadText(5), "৫ মাস");
  // After July 2019: Azha 2019 (Aug), then two a year 2020–2025, then Fitr and Azha 2026 = 1 + 12 + 2.
  assert.equal(eidsAway("2019-07", TODAY), 15);
  // Leaving in the month of an Eid doesn't count that Eid; an Eid today counts.
  assert.equal(eidsAway("2026-03", TODAY), 1);
  assert.equal(eidsAway("2026-02", "2026-03-21"), 1);
  assert.equal(eidsAway("2026-02", "2026-03-20"), 0);
  assert.equal(eidsAway("2026-10", TODAY), 0);
});

test("the Eid table is sorted, two a year, and has the verified 2026 dates", () => {
  assert.deepEqual([...eids], [...eids].sort());
  assert.ok(eids.includes("2026-03-21") && eids.includes("2026-05-28") && eids.includes("2025-06-07"));
  for (let year = 1986; year <= 2027; year++) {
    const count = eids.filter(date => date.startsWith(String(year))).length;
    assert.ok(count >= 2 && count <= 3, `${year}: ${count}`);
  }
});

test("clocks come from IANA zones, so daylight saving is handled", () => {
  const summer = new Date("2026-07-01T17:05:00Z"), winter = new Date("2026-12-01T17:05:00Z");
  assert.deepEqual(clockIn("Asia/Dhaka", summer), { hour: 23, minute: 5 });
  assert.equal(clockText(clockIn("Asia/Dhaka", summer)), "রাত ১১:০৫");
  assert.equal(clockText({ hour: 0, minute: 30 }), "রাত ১২:৩০");
  assert.equal(clockText({ hour: 5, minute: 0 }), "ভোর ৫:০০");
  assert.equal(clockText({ hour: 13, minute: 15 }), "দুপুর ১:১৫");
  assert.equal(gapText(clockIn("Europe/London", summer), clockIn("Asia/Dhaka", summer)), "দেশ ৫ ঘণ্টা এগিয়ে");
  assert.equal(gapText(clockIn("Europe/London", winter), clockIn("Asia/Dhaka", winter)), "দেশ ৬ ঘণ্টা এগিয়ে");
  assert.equal(gapText(clockIn("America/New_York", winter), clockIn("Asia/Dhaka", winter)), "দেশ ১১ ঘণ্টা এগিয়ে");
  assert.equal(gapText(clockIn("Australia/Sydney", winter), clockIn("Asia/Dhaka", winter)), "দেশ ৫ ঘণ্টা পিছিয়ে");
  assert.equal(gapText(clockIn("Asia/Dhaka", winter), clockIn("Asia/Dhaka", winter)), "দেশের সাথে একই সময়");
  assert.equal(homeNote(23), "বাড়িতে সবাই হয়তো ঘুমিয়ে।");
  assert.equal(todayInDhaka(new Date("2026-10-09T19:00:00Z")), "2026-10-10");
});

test("the card: countdown, stamp and the human line", () => {
  const card = createCard(trip({ back: "2026-11-26", name: "রাফি" }), TODAY);
  assert.equal(card.abroad, "৭ বছর ৩ মাস প্রবাসে");
  assert.equal(card.eidText, "১৫টা ঈদ দূরে");
  assert.equal(card.daysLeft, 47);
  assert.equal(card.stamp, "আর ৪৭ দিন");
  assert.equal(card.line, "১৫টা ঈদ ভিডিও কলে। এবার দেখা হবে সামনাসামনি।");
  assert.equal(countdownLine(card), "রাফি দেশে ফিরছে আর ৪৭ দিন");
  assert.equal(createCard(trip({ back: "2027-02-25" }), TODAY).line, "১৫টা ঈদ ভিডিও কলে। এবারের ঈদ বাড়ির উঠোনে।");
  assert.equal(createCard(trip(), TODAY).line, "ফোনে আম্মুর গলা পাই, ভাতের গন্ধটা পাই না।");
  assert.equal(createCard(trip({ left: "2026-02" }), TODAY).line, "প্রথম বছরটাই সবচেয়ে লম্বা।");
  assert.equal(createCard(trip({ left: "2010-01" }), TODAY).line, "এত বছরেও উঠোনের মাটির গন্ধটা ভুলিনি।");
  const home = createCard(trip({ back: "2026-10-01" }), TODAY);
  assert.equal(home.stamp, "ফিরে এসেছি");
  assert.equal(countdownLine(home), "দেশে ফিরেছি!");
  assert.equal(createCard(trip({ back: TODAY, name: "মিম" }), TODAY).stamp, "আজ ফিরছি");
  assert.equal(createCard(trip({ place: "xx", home: "s" }), TODAY).from, "বিদেশ");
  assert.equal(createCard(trip({ place: "xx", home: "s" }), TODAY).to, "সিলেট");
});

test("a shared link round-trips and refuses hostile or impossible state", () => {
  const full = trip({ place: "us-w", back: "2026-12-20", home: "c", name: "রাফি", waiting: "ammu" });
  assert.deepEqual(parseShareHash(shareHash(full), TODAY), full);
  assert.deepEqual(parseShareHash(shareHash(trip()), TODAY), { ...trip(), waiting: "" });
  assert.equal(shareHash(trip()), "#c=sa&l=2019-07");
  // Unknown extras are dropped, not fatal.
  assert.deepEqual(parseShareHash("#c=sa&l=2019-07&h=zz&w=boss&x=1", TODAY), { ...trip(), waiting: "" });
  for (const hash of ["", "#c=zz&l=2019-07", "#c=sa", "#c=sa&l=2026-11", "#c=sa&l=1984-12", "#c=sa&l=2019-13", "#c=sa&l=2019-7",
    "#c=sa&l=2019-07&r=2028-10-11", "#c=sa&l=2019-07&r=2019-06-30", "#c=sa&l=2019-07&r=2026-02-30", "#c=sa&l=<script>", `#c=sa&l=2019-07&n=${"x".repeat(500)}`]) {
    assert.equal(parseShareHash(hash, TODAY), null, hash);
  }
  // A return date that has passed still opens (old links), and exactly two years ahead is allowed.
  assert.equal(parseShareHash("#c=sa&l=2019-07&r=2020-01-01", TODAY)?.back, "2020-01-01");
  assert.equal(parseShareHash("#c=sa&l=2019-07&r=2028-10-09", TODAY)?.back, "2028-10-09");
});

test("names are NFC, lose control and direction-override characters, and are capped", () => {
  assert.equal(cleanName("  রিমা\u202e  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  assert.equal(cleanName("ম\u09dfনা"), "ম\u09dfনা".normalize("NFC"));
});

test("share: normalize, personal previews, and a tally over country ids only", () => {
  const state = share.normalize("c=sa&l=2019-07&r=2026-11-26&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF&junk=1");
  assert.equal(state, "c=sa&l=2019-07&r=2026-11-26&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.equal(share.normalize("c=sa&l=2099-01"), null);
  assert.equal(previewTitle(createCard(trip({ back: "2026-11-26", name: "রাফি" }), TODAY)), "রাফি ৭ বছর প্রবাসে — দেশে ফিরছে আর ৪৭ দিন");
  assert.equal(previewTitle(createCard(trip({ back: "2026-11-26" }), TODAY)), "৭ বছর প্রবাসে — দেশে ফিরছি আর ৪৭ দিন");
  assert.equal(previewTitle(createCard(trip({ name: "রাফি" }), TODAY)), "রাফি ৭ বছর ৩ মাস প্রবাসে · ১৫টা ঈদ দূরে");
  assert.equal(previewTitle(createCard(trip({ back: "2026-11-26", name: "রাফি", waiting: "ammu" }), TODAY)), "আম্মু অপেক্ষায় — রাফি দেশে ফিরছে আর ৪৭ দিন");
  assert.match(share.preview(state!).title, /^রাফি [০-৯]+ বছর প্রবাসে — দেশে (ফিরছে আর [০-৯]+ দিন|ফিরেছে!|আজ)/);
  assert.deepEqual(share.tally, ["sa", "ae", "my", "qa", "om", "kw", "sg", "it", "gb", "us", "ca", "au", "xx"]);
});

test("the family's reply line", () => {
  assert.equal(replyLine(createCard(trip({ back: "2026-11-26", name: "রাফি" }), TODAY), "আম্মু"), "রাফি ফিরছে আর ৪৭ দিন। আমরা অপেক্ষায় — আম্মু");
  assert.equal(replyLine(createCard(trip({ back: "2026-11-26" }), TODAY), "বোন"), "তুমি ফিরছ আর ৪৭ দিন। আমরা অপেক্ষায় — বোন");
  assert.equal(replyLine(createCard(trip({ name: "রাফি" }), TODAY), "আব্বু"), "রাফি, তাড়াতাড়ি ফিরো। আমরা অপেক্ষায় — আব্বু");
});
