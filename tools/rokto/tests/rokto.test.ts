import assert from "node:assert/strict";
import test from "node:test";
import { addMonthsNotEarly, cleanName, createCard, daysBetween, friendTitle, groups, headline, humanLine, isDate, parseShareHash, shareHash, todayInDhaka, toDate, MAX_NAME_LENGTH, type Donor } from "../lib/rokto";
import { share } from "../share";

const TODAY = "2026-10-11";
const donor: Donor = { group: "op", last: "2026-09-12", count: 7, interval: 4, name: "রাফি" };

test("the next date keeps the day of the month", () => {
  assert.equal(addMonthsNotEarly("2026-10-11", 6), "2027-04-11");
  assert.equal(addMonthsNotEarly("2026-10-11", 4), "2027-02-11");
  assert.equal(addMonthsNotEarly("2026-11-30", 4), "2027-03-30");
  assert.equal(addMonthsNotEarly("2026-09-15", 4), "2027-01-15");
});

test("a day the target month lacks moves forward to the 1st, never back to the month's end", () => {
  assert.equal(addMonthsNotEarly("2026-10-31", 4), "2027-03-01");
  assert.equal(addMonthsNotEarly("2026-10-29", 4), "2027-03-01");
  assert.equal(addMonthsNotEarly("2026-08-31", 6), "2027-03-01");
  assert.equal(addMonthsNotEarly("2026-12-31", 6), "2027-07-01");
  assert.equal(addMonthsNotEarly("2027-05-31", 4), "2027-10-01");
});

test("leap years: 29 February exists in 2028, not in 2027", () => {
  assert.equal(addMonthsNotEarly("2027-10-29", 4), "2028-02-29");
  assert.equal(addMonthsNotEarly("2027-10-30", 4), "2028-03-01");
  assert.equal(addMonthsNotEarly("2028-02-29", 4), "2028-06-29");
  assert.equal(addMonthsNotEarly("2028-02-29", 6), "2028-08-29");
  assert.equal(addMonthsNotEarly("2100-10-29", 4), "2101-03-01");
});

test("never early: every day from 2024 to 2030 waits at least 120 days (4 months) or 181 days (6 months)", () => {
  for (let time = Date.UTC(2024, 0, 1); time <= Date.UTC(2030, 11, 31); time += 86_400_000) {
    const day = new Date(time).toISOString().slice(0, 10);
    const four = daysBetween(day, addMonthsNotEarly(day, 4));
    const six = daysBetween(day, addMonthsNotEarly(day, 6));
    assert.ok(four >= 120 && four >= 16 * 7, `${day}: ${four}`);
    assert.ok(six >= 181, `${day}: ${six}`);
    assert.ok(isDate(addMonthsNotEarly(day, 4)) && isDate(addMonthsNotEarly(day, 6)), day);
  }
});

test("today is Bangladesh's date, whatever the phone's time zone", () => {
  assert.equal(todayInDhaka(new Date("2026-10-10T18:00:00Z")), "2026-10-11");
  assert.equal(todayInDhaka(new Date("2026-10-10T17:59:00Z")), "2026-10-10");
  assert.equal(todayInDhaka(new Date("2026-12-31T18:30:00Z")), "2027-01-01");
});

test("the card counts down from today and says when the wait is over", () => {
  const card = createCard(donor, TODAY);
  assert.equal(card.next, "2027-01-12");
  assert.equal(card.nextText, "১২ জানুয়ারি ২০২৭");
  assert.equal(card.lastText, "১২ সেপ্টেম্বর ২০২৬");
  assert.equal(card.daysLeft, 93);
  assert.equal(card.group.label, "O+");
  assert.ok(createCard({ ...donor, last: "2025-01-01" }, TODAY).daysLeft < 0);
  assert.equal(createCard({ ...donor, last: "2026-06-11" }, TODAY).daysLeft, 0);
});

test("headline and human line come from the person's own count and date", () => {
  assert.equal(headline({ count: 1, last: TODAY }, TODAY), "আজ প্রথমবার রক্ত দিলাম!");
  assert.equal(headline({ count: 7, last: TODAY }, TODAY), "আজ রক্ত দিলাম, এ নিয়ে ৭ বার!");
  assert.equal(headline({ count: 1, last: "2026-01-01" }, TODAY), "প্রথমবার রক্ত দিয়েছি!");
  assert.equal(headline({ count: 12, last: "2026-01-01" }, TODAY), "১২ বার রক্ত দিয়েছি!");
  assert.equal(humanLine(1), "প্রথমবার! কারও জীবনে তুমি প্রথম ফোঁটা।");
  assert.equal(humanLine(1, "me"), "প্রথমবার! কারও জীবনে আমি প্রথম ফোঁটা।");
  for (const count of [1, 2, 3, 4, 9, 10, 24, 25, 49, 50, 250]) {
    assert.ok(humanLine(count).length > 10);
    assert.doesNotMatch(humanLine(count, "me"), /তুমি|তোমা/);
  }
  assert.equal(friendTitle("রাফি"), "রাফি রক্ত দেয়, তুমি?");
  assert.equal(friendTitle(""), "তোমার বন্ধু রক্ত দেয়, তুমি?");
});

test("share links round-trip every group, both intervals and a Bangla name", () => {
  for (const group of groups) for (const interval of [4, 6] as const) {
    const own = { ...donor, group: group.id, interval };
    assert.deepEqual(parseShareHash(shareHash(own), TODAY), own);
  }
  assert.equal(shareHash(donor), "#g=op&d=2026-09-12&c=7&i=4&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShareHash("#g=op&d=2026-11-12&c=7&n=রাফি", "2026-11-12"), { group: "op", last: "2026-11-12", count: 7, interval: 6, name: "রাফি" });
  assert.equal(parseShareHash(shareHash({ ...donor, name: "" }), TODAY)?.name, "");
});

test("hostile links are rejected or cleaned", () => {
  const base = "g=op&d=2026-09-12&c=7&i=4";
  for (const bad of ["", "#", "g=xx&d=2026-09-12&c=7", "g=op&d=2026-02-30&c=7", "g=op&d=2026-10-12&c=7", "g=op&d=1969-12-31&c=7", "g=op&d=26-9-12&c=7",
    "g=op&d=2026-09-12", "g=op&d=2026-09-12&c=0", "g=op&d=2026-09-12&c=251", "g=op&d=2026-09-12&c=07", "g=op&d=2026-09-12&c=7abc", "g=op&d=2026-09-12&c=-1", "g=op&d=2026-09-12&c=1e2",
    `${base}&n=${"ক".repeat(400)}`]) assert.equal(parseShareHash(bad, TODAY), null, bad);
  assert.equal(parseShareHash("g=op&d=2026-09-12&c=7&i=2", TODAY)?.interval, 6);
  assert.equal(parseShareHash("g=op&d=2026-09-12&c=7&i=abc", TODAY)?.interval, 6);
  assert.equal(parseShareHash(`${base}&n=${encodeURIComponent("রা‮ফি\u0000  ")}`, TODAY)?.name, "রা ফি");
  assert.equal(Array.from(parseShareHash(`${base}&n=${encodeURIComponent("ক".repeat(40))}`, TODAY)!.name).length, MAX_NAME_LENGTH);
  assert.equal(parseShareHash(`${base}&g=op&g=xx`, TODAY)?.group, "op");
});

test("names are NFC so the same name always reads the same", () => {
  const decomposed = "মৌ\u09df".normalize("NFD");
  assert.equal(cleanName(decomposed), "মৌ\u09df".normalize("NFC"));
  assert.equal(parseShareHash(`g=op&d=2026-09-12&c=7&n=${encodeURIComponent(decomposed)}`, TODAY)?.name, "মৌ\u09df".normalize("NFC"));
});

test("dates must be real and not in the future", () => {
  assert.equal(isDate("2028-02-29"), true);
  assert.equal(isDate("2027-02-29"), false);
  assert.equal(isDate(toDate(2026, 4, 31)), false);
  assert.equal(parseShareHash("g=op&d=2026-10-11&c=1", TODAY)?.last, "2026-10-11");
});

test("no short links and no tally: health data stays in the #hash the person shares", () => {
  assert.equal(share.normalize(shareHash(donor).slice(1)), null);
  assert.equal(share.tally, undefined);
  assert.doesNotMatch(share.preview("").title, /O\+|রাফি/);
});
