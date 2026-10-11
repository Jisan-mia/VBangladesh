import assert from "node:assert/strict";
import test from "node:test";
import { age, ageLimit, ageText, bnPlain, lifeSeasons, parseLimit, banglaDate, banglaText, cleanName, compareLine, createCard, dateline, humanLine, nextBirthday, nextMilestone, parseShareHash, seasonOf, seasons, shareHash, todayInDhaka, MAX_NAME_LENGTH } from "../lib/boyos";
import { share } from "../share";

const TODAY = "2026-10-10";
const bangla = (date: string) => banglaText(banglaDate(date));

test("পহেলা বৈশাখ is 14 April every year, and 13 April is the last day of চৈত্র", () => {
  for (const year of [1990, 2000, 2016, 2019, 2024, 2025, 2026]) assert.equal(bangla(`${year}-04-14`), `১ বৈশাখ ${bnPlain(year - 593)}`);
  assert.equal(bangla("2026-04-13"), "৩০ চৈত্র ১৪৩২");
  assert.equal(bangla("2020-04-13"), "৩০ চৈত্র ১৪২৬");
});

test("2019 revision: matches newspaper datelines and the national days it was made for", () => {
  // Archived Prothom Alo datelines (web.archive.org) and 2026 news datelines (risingbd, jagonews24).
  assert.equal(bangla("2019-10-16"), "৩১ আশ্বিন ১৪২৬");
  assert.equal(bangla("2019-12-16"), "১ পৌষ ১৪২৬");
  assert.equal(bangla("2020-02-21"), "৮ ফাল্গুন ১৪২৬");
  assert.equal(bangla("2026-03-26"), "১২ চৈত্র ১৪৩২");
  assert.equal(bangla("2026-03-14"), "২৯ ফাল্গুন ১৪৩২");
  assert.equal(bangla("2026-06-26"), "১২ আষাঢ় ১৪৩৩");
  assert.equal(bangla("2026-09-21"), "৬ আশ্বিন ১৪৩৩");
  assert.equal(bangla("2026-02-14"), "১ ফাল্গুন ১৪৩২");
  // Leap year: ফাল্গুন gets the 30th day.
  assert.equal(bangla("2020-03-14"), "৩০ ফাল্গুন ১৪২৬");
  assert.equal(bangla("2020-03-15"), "১ চৈত্র ১৪২৬");
  assert.equal(banglaDate("2020-01-01").rule, "2019");
});

test("1987 rule before 1426: matches archived datelines from 2016 and 2018", () => {
  assert.equal(bangla("2016-03-15"), "১ চৈত্র ১৪২২");
  assert.equal(bangla("2016-03-14"), "৩১ ফাল্গুন ১৪২২");
  assert.equal(bangla("2018-10-18"), "৩ কার্তিক ১৪২৫");
  assert.equal(bangla("2018-12-19"), "৫ পৌষ ১৪২৫");
  assert.equal(bangla("2019-02-21"), "৯ ফাল্গুন ১৪২৫");
  assert.equal(banglaDate("1999-06-26").rule, "1987");
  assert.equal(banglaDate("1988-04-14").rule, "1987");
  assert.equal(banglaDate("1988-04-13").rule, "1966");
});

test("every day of a year maps to a distinct Bangla date that runs in order", () => {
  for (const start of [2017, 2019, 2023]) {
    let previous = "";
    for (let i = 0; i < 366; i++) {
      const date = new Date(Date.UTC(start, 3, 14 + i)).toISOString().slice(0, 10);
      const text = bangla(date);
      assert.notEqual(text, previous);
      previous = text;
    }
  }
});

test("today's masthead answers আজ বাংলা কত তারিখ", () => {
  assert.equal(dateline(TODAY), "শনিবার, ২৫ আশ্বিন ১৪৩৩ · ১০ অক্টোবর ২০২৬");
  assert.equal(seasonOf(banglaDate(TODAY)).label, "শরৎ");
});

test("today is Bangladesh's date even on a phone in another time zone", () => {
  assert.equal(todayInDhaka(new Date("2026-10-09T18:30:00Z")), "2026-10-10");
  assert.equal(todayInDhaka(new Date("2026-10-09T17:59:00Z")), "2026-10-09");
});

test("age in years, months and days, with month-end and leap-day births", () => {
  assert.deepEqual(age("1999-06-26", TODAY), { years: 27, months: 3, days: 14 });
  assert.deepEqual(age("1999-12-31", "2026-01-01"), { years: 26, months: 0, days: 1 });
  assert.deepEqual(age("2000-01-31", "2000-03-01"), { years: 0, months: 1, days: 1 });
  assert.deepEqual(age("2024-02-29", "2027-02-27"), { years: 2, months: 11, days: 29 });
  assert.deepEqual(age("2024-02-29", "2027-02-28"), { years: 3, months: 0, days: 0 });
  assert.deepEqual(age("2024-02-29", "2028-02-29"), { years: 4, months: 0, days: 0 });
  assert.equal(ageText({ years: 27, months: 0, days: 5 }), "২৭ বছর ৫ দিন");
  assert.equal(ageText({ years: 0, months: 0, days: 0 }), "০ দিন");
});

test("next birthday countdown, including today and 29 February", () => {
  assert.deepEqual(nextBirthday("1999-06-26", TODAY), { date: "2027-06-26", days: 259, turning: 28 });
  assert.deepEqual(nextBirthday("1999-10-10", TODAY), { date: TODAY, days: 0, turning: 27 });
  assert.deepEqual(nextBirthday("2024-02-29", TODAY), { date: "2027-02-28", days: 141, turning: 3 });
  assert.equal(nextBirthday("2024-02-29", "2027-03-01").date, "2028-02-29");
  assert.deepEqual(nextMilestone("1999-06-26", TODAY), { count: 10000, date: "2026-11-11", days: 32 });
});

test("the card: headline, subhead and season from the brief's example", () => {
  const card = createCard({ birth: "1999-06-26", name: "রাফি" }, TODAY);
  assert.equal(card.headline, "জন্ম নিল রাফি");
  assert.equal(card.subhead, "আজ তার বয়স ২৭ বছর ৩ মাস ১৪ দিন — ৯,৯৬৮ দিন");
  assert.equal(card.dateline, "শনিবার, ১২ আষাঢ় ১৪০৬ · ২৬ জুন ১৯৯৯");
  assert.equal(card.season.people, "বর্ষার মানুষ");
  assert.equal(createCard({ birth: "1999-06-26", name: "" }, TODAY).headline, "এই দিনে জন্ম নিলাম আমি");
});

test("the human line: birthday, round day count, Friday, then the month", () => {
  assert.match(humanLine("1999-10-10", TODAY), /আজ জন্মদিন/);
  assert.match(humanLine("1999-06-26", "2026-11-11"), /১০,০০০তম দিন/);
  assert.equal(humanLine("1999-06-25", TODAY), "শুক্রবারে জন্ম — ছুটির দিনের মানুষ।");
  assert.equal(humanLine("1999-08-01", TODAY), "শ্রাবণের বৃষ্টিতে জন্ম, তাই বুঝি মনটা এত নরম।");
});

test("comparing with a friend's link", () => {
  assert.equal(compareLine({ birth: "1998-04-12", name: "রাফি" }, "1999-06-26"), "রাফি তোমার চেয়ে ১ বছর ২ মাস ১৪ দিন বড়");
  assert.equal(compareLine({ birth: "2000-06-26", name: "" }, "1999-06-26"), "তোমার বন্ধু তোমার চেয়ে ১ বছর ছোট");
  assert.equal(compareLine({ birth: "1999-06-26", name: "মিম" }, "1999-06-26", "me"), "মিম আর আমি একই দিনে জন্মেছি!");
  assert.equal(createCard({ birth: "1999-06-26", name: "" }, TODAY, { birth: "1998-04-12", name: "রাফি" }).match, "রাফি আমার চেয়ে ১ বছর ২ মাস ১৪ দিন বড়");
});

test("a shared link round-trips and refuses hostile or impossible dates", () => {
  assert.deepEqual(parseShareHash(shareHash({ birth: "1999-06-26", name: "রাফি" }), TODAY), { birth: "1999-06-26", name: "রাফি" });
  assert.deepEqual(parseShareHash("#b=1999-06-26&vb=1998-01-01&vn=x", TODAY), { birth: "1999-06-26", name: "" });
  for (const hash of ["", "#b=", "#b=2026-02-30", "#b=1899-12-31", "#b=2026-10-11", "#b=99-06-26", "#b=<script>", "#b=1999-6-26", `#b=1999-06-26&n=${"x".repeat(500)}`]) assert.equal(parseShareHash(hash, TODAY), null, hash);
  assert.equal(parseShareHash("#b=1900-01-01", TODAY)?.birth, "1900-01-01");
  assert.equal(parseShareHash("#b=2026-10-10", TODAY)?.birth, TODAY);
});

test("names are NFC, lose control and direction-override characters, and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  assert.equal(cleanName("ময়না"), "ময়না".normalize("NFC"));
});

test("share: normalize, personal preview, and a tally over the six seasons only", () => {
  const state = share.normalize("b=1999-06-26&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.ok(state?.startsWith("b=1999-06-26&n="));
  assert.match(share.preview(state!).title, /^রাফি আজ [০-৯,]+ দিনের — তুমি কত দিনের\?$/);
  assert.equal(share.normalize("b=2026-02-30"), null);
  assert.match(share.preview("b=1999-06-26").title, /^আমি আজ [০-৯,]+ দিনের/);
  assert.deepEqual(share.tally, seasons.map(season => season.id));
});

test("the age limit is typed in whole years, Bangla or English digits", () => {
  assert.equal(parseLimit("৩২"), 32);
  assert.equal(parseLimit(" 30 "), 30);
  assert.equal(parseLimit("১০০"), 100);
  for (const text of ["", "০", "৩০.৫", "৩০ বছর", "abc", "১০১", "-5"]) assert.equal(parseLimit(text), null, text);
});

test("age limit: within until the day before the years are complete, the day itself flagged as edge", () => {
  // Born 26 Jun 1999, 30-year limit: last day inside is 25 Jun 2029.
  assert.deepEqual(ageLimit("1999-06-26", "2029-06-25", 30), { status: "within", turns: "2029-06-26", lastDay: "2029-06-25", days: 1, gap: { years: 0, months: 0, days: 1 } });
  assert.equal(ageLimit("1999-06-26", "2029-06-26", 30).status, "edge");
  assert.deepEqual(ageLimit("1999-06-26", "2029-06-27", 30), { status: "over", turns: "2029-06-26", lastDay: "2029-06-25", days: 1, gap: { years: 0, months: 0, days: 1 } });
  const now = ageLimit("1999-06-26", TODAY, 32);
  assert.equal(now.status, "within");
  assert.equal(now.lastDay, "2031-06-25");
  assert.deepEqual(now.gap, { years: 4, months: 8, days: 16 });
  assert.equal(now.days, 1720);
  assert.deepEqual(ageLimit("1990-01-15", "2025-03-20", 32), { status: "over", turns: "2022-01-15", lastDay: "2022-01-14", days: 1160, gap: { years: 3, months: 2, days: 5 } });
});

test("age limit: leap-day births, month ends and the year boundary", () => {
  // 29 Feb births complete their years on 28 Feb in common years (the tool's birthday rule), on 29 Feb in leap years.
  assert.equal(ageLimit("1996-02-29", "2026-01-01", 30).lastDay, "2026-02-27");
  assert.equal(ageLimit("1996-02-29", "2026-02-28", 30).status, "edge");
  assert.equal(ageLimit("1996-02-29", "2028-02-28", 32).status, "within");
  assert.equal(ageLimit("1996-02-29", "2028-02-29", 32).status, "edge");
  assert.equal(ageLimit("1995-12-31", "2025-12-30", 30).status, "within");
  assert.equal(ageLimit("1995-12-31", "2025-12-31", 30).status, "edge");
  assert.equal(ageLimit("1996-01-01", "2025-12-31", 30).status, "within");
  assert.equal(ageLimit("1996-01-01", "2026-01-01", 30).status, "edge");
  assert.equal(ageLimit("1996-03-01", "2026-02-28", 30).lastDay, "2026-02-28");
  assert.deepEqual(ageLimit("1996-01-31", "2026-03-01", 30).gap, { years: 0, months: 1, days: 1 });
});

test("life seasons: every season from the birth one to today's, counted per season", () => {
  // ১২ আষাঢ় ১৪০৬ (বর্ষা) to ২৫ আশ্বিন ১৪৩৩ (শরৎ): 5 seasons of ১৪০৬ + 26 years × 6 + 3 seasons of ১৪৩৩ = 164.
  const ritu = lifeSeasons("1999-06-26", TODAY);
  assert.equal(ritu.total, 164);
  assert.deepEqual(ritu.counts, [27, 28, 28, 27, 27, 27]);
  assert.equal(ritu.counts.reduce((sum, count) => sum + count), ritu.total);
  assert.deepEqual(lifeSeasons(TODAY, TODAY), { first: ritu.now, now: ritu.now, total: 1, counts: [0, 0, 1, 0, 0, 0] });
  // Born the last day of চৈত্র (বসন্ত), today the first of বৈশাখ (গ্রীষ্ম): two seasons, one day apart.
  assert.equal(lifeSeasons("2026-04-13", "2026-04-14").total, 2);
  // 1 Jan 1900 is ১৮ পৌষ ১৩০৬ (শীত): 2 seasons of ১৩০৬ + 126 years × 6 + 3 seasons of ১৪৩৩ = 761.
  assert.equal(lifeSeasons("1900-01-01", TODAY).total, 761);
  const card = createCard({ birth: "1999-06-26", name: "রাফি" }, TODAY);
  assert.equal(card.rituKicker, "রাফির জীবনের ঋতু");
  assert.equal(card.rituHeadline, "১৬৪টা ঋতু, ২৮টা বর্ষা");
  assert.equal(card.rituLine, "বর্ষায় জন্ম — প্রতিটা প্রথম বৃষ্টি জন্মঋতুকে ফিরিয়ে আনে।");
  assert.equal(card.todayText, "২৫ আশ্বিন ১৪৩৩");
});

test("links shared before the season grid still open the front page; v=ritu opens the grid", () => {
  // A link made before Oct 2026 (no v key) parses exactly as it used to.
  assert.deepEqual(parseShareHash("#b=1999-06-26&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF", TODAY), { birth: "1999-06-26", name: "রাফি" });
  assert.equal(share.normalize("b=1999-06-26"), "b=1999-06-26");
  const ritu = shareHash({ birth: "1999-06-26", name: "রাফি", view: "ritu" });
  assert.match(ritu, /&v=ritu$/);
  assert.deepEqual(parseShareHash(ritu, TODAY), { birth: "1999-06-26", name: "রাফি", view: "ritu" });
  assert.deepEqual(parseShareHash("#b=1999-06-26&v=evil", TODAY), { birth: "1999-06-26", name: "" });
  assert.match(share.normalize(ritu.slice(1))!, /&v=ritu$/);
  assert.match(share.preview(ritu.slice(1)).title, /^রাফির জীবনে [০-৯]+টা ঋতু, [০-৯]+টা বর্ষা — তোমার কয়টা\?$/);
  assert.match(share.preview("b=1999-06-26&v=ritu").title, /^আমার জীবনে /);
});
