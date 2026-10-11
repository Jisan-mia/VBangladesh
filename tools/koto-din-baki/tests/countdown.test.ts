import assert from "node:assert/strict";
import test from "node:test";
import { occasions as wishes } from "../../shubhechha/lib/greeting";
import { banglaDate, byNearest, cleanLabel, countdown, dateLine, dhakaToday, humanLine, occasions, parseShareHash, previewTitle, shareHash, MAX_LABEL_LENGTH } from "../lib/countdown";

const TODAY = "2026-10-10";

test("today is Dhaka's date, not the server's", () => {
  assert.equal(dhakaToday(new Date("2026-10-10T17:59:00Z")), "2026-10-10");
  assert.equal(dhakaToday(new Date("2026-10-10T18:00:00Z")), "2026-10-11");
});

test("the nearest occasion comes first and every date is in the future or today", () => {
  const list = byNearest(TODAY);
  assert.equal(list[0].occasion.id, "durga");
  assert.equal(list[0].count.days, 11);
  for (const { count } of list) if (count.date) assert.ok(count.days >= 0);
});

test("fixed days roll over to next year once passed, and count today as 0", () => {
  assert.deepEqual([countdown({ id: "ekushe" }, TODAY).date, countdown({ id: "bijoy" }, TODAY).date], ["2027-02-21", "2026-12-16"]);
  assert.equal(countdown({ id: "bijoy" }, "2026-12-16").days, 0);
  assert.equal(countdown({ id: "bijoy" }, "2026-12-17").date, "2027-12-16");
});

test("moon and panjika dates are সম্ভাব্য; the government-listed Puja date is not", () => {
  assert.equal(countdown({ id: "eid-fitr" }, TODAY).likely, true);
  assert.equal(countdown({ id: "durga" }, TODAY).likely, false);
  assert.equal(countdown({ id: "durga" }, TODAY).source, "gov");
  assert.equal(countdown({ id: "durga" }, "2026-10-22").likely, true);
  assert.equal(countdown({ id: "christmas" }, TODAY).likely, false);
});

test("a date table that has run out says so instead of inventing a date", () => {
  const count = countdown({ id: "kali" }, "2026-11-09");
  assert.equal(count.date, null);
  assert.match(humanLine(count), /এখনো ঠিক হয়নি/);
});

test("Eid dates agree with the শুভেচ্ছা card's", () => {
  const ours = occasions.flatMap(item => item.theme === "eid" && "dates" in item ? item.dates : []);
  for (const date of wishes.find(item => item.id === "eid")!.dates) assert.ok(ours.includes(date), date);
});

test("Bangla dates follow the revised calendar", () => {
  assert.equal(banglaDate("2026-04-14"), "১ বৈশাখ ১৪৩৩");
  assert.equal(banglaDate("2026-10-21"), "৫ কার্তিক ১৪৩৩");
  assert.equal(banglaDate("2026-11-16"), "১ অগ্রহায়ণ ১৪৩৩");
  assert.equal(banglaDate("2026-12-16"), "১ পৌষ ১৪৩৩");
  assert.equal(banglaDate("2027-02-21"), "৮ ফাল্গুন ১৪৩৩");
  assert.equal(banglaDate("2027-03-26"), "১২ চৈত্র ১৪৩৩");
  assert.equal(banglaDate("2027-04-13"), "৩০ চৈত্র ১৪৩৩");
  assert.equal(banglaDate("2028-04-13"), "৩০ চৈত্র ১৪৩৪");
  assert.equal(dateLine("2026-10-21"), "বুধবার, ২১ অক্টোবর ২০২৬");
});

test("human lines follow the days left", () => {
  const line = (days: number) => humanLine({ ...countdown({ id: "christmas" }, TODAY), days });
  assert.deepEqual([line(40), line(20), line(3), line(1), line(0)], ["এখনো অনেক দেরি, তবু গুনছি।", "ক্যালেন্ডারের পাতা ছিঁড়তে শুরু করো।", "আর মাত্র ক'টা দিন!", "কালই! আর একটা রাত।", "আজই!"]);
  assert.doesNotMatch(humanLine(countdown({ id: "ekushe" }, "2027-02-21")), /শুভ/);
});

test("links round-trip for occasions and own days", () => {
  assert.deepEqual(parseShareHash(shareHash({ id: "eid-adha" }), TODAY), { id: "eid-adha" });
  const own = { date: "2027-02-14", label: "রাফির বিয়ে" };
  assert.deepEqual(parseShareHash(shareHash(own), TODAY), own);
  assert.deepEqual(parseShareHash(shareHash({ date: "2027-02-14", label: "" }), TODAY), { date: "2027-02-14", label: "" });
  assert.equal(countdown(own, TODAY).days, 127);
});

test("hostile links are refused or cleaned", () => {
  for (const hash of ["", "#", "#o=nope", "#d=2027-02-30", "#d=2099-01-01", "#d=2023-10-09", "#d=27-2-14", "#%%%", "#o=__proto__"]) assert.equal(parseShareHash(hash, TODAY), null, hash);
  assert.ok(parseShareHash("#d=2029-10-10", TODAY));
  const shared = parseShareHash(`#d=2027-01-01&l=${encodeURIComponent("রাফি‮\n" + "ক".repeat(80))}`, TODAY);
  assert.ok(shared && "label" in shared);
  assert.equal(Array.from(shared.label).length, MAX_LABEL_LENGTH);
  assert.ok(!shared.label.includes("‮"));
});

test("labels are NFC and capped", () => {
  assert.equal(cleanLabel("ক়"), "ক়".normalize("NFC"));
  assert.equal(cleanLabel("  a  b  "), "a b");
});

test("previews name the day and the count", () => {
  assert.equal(previewTitle({ id: "durga" }, TODAY), "দুর্গাপূজা আর ১১ দিন। তুমি কোন দিনের অপেক্ষায়?");
  assert.equal(previewTitle({ date: "2026-10-10", label: "রাফির বিয়ে" }, TODAY), "রাফির বিয়ে আজই। তুমি কোন দিনের অপেক্ষায়?");
});

test("the holiday table lists each date once, in order, with its certainty", async () => {
  const { calendar } = await import("../lib/countdown");
  const rows = calendar("2026-10-10", "2027-12-31");
  assert.deepEqual(rows.slice(0, 4).map(row => [row.id, row.date, row.likely]), [["durga", "2026-10-21", false], ["kali", "2026-11-08", true], ["bijoy", "2026-12-16", false], ["christmas", "2026-12-25", false]]);
  assert.equal(new Set(rows.map(row => row.id + row.date)).size, rows.length);
  assert.ok(rows.every(row => row.date! >= "2026-10-10" && row.date! <= "2027-12-31"));
});
