import assert from "node:assert/strict";
import test from "node:test";
import { TIMETABLE_1448 } from "../lib/data-1448";
import { clock, districts, duration, humanLine, live, monthFor, nextEvent, parseShareHash, previewTitle, season, seasonText, shareHash, showDay, usable, validate, type Timetable } from "../lib/timetable";

// TEST fixture: made-up times in a plausible range, NOT the Islamic Foundation's. It must never reach the page.
const TEST: Timetable = {
  test: true,
  hijriYear: 1448,
  source: { label: "TEST fixture", url: "https://example.test/timetable" },
  checked: "2027-01-25",
  checkedBy: ["TEST A", "TEST B"],
  days: Array.from({ length: 29 }, (_, i) => ({
    day: i + 1,
    date: new Date(Date.UTC(2027, 1, 9 + i)).toISOString().slice(0, 10),
    sehri: `05:${String(20 - Math.floor(i / 2)).padStart(2, "0")}`,
    iftar: `17:${String(45 + Math.floor(i / 3)).padStart(2, "0")}`,
  })),
  offsets: Object.fromEntries(districts.map(d => [d.id, d.id === "dhaka" ? [{ from: 1, sehri: 0, iftar: 0 }] : d.id === "sylhet" ? [{ from: 1, sehri: -6, iftar: -7 }, { from: 16, sehri: -5, iftar: -6 }] : [{ from: 1, sehri: 2, iftar: 3 }]])),
};
const at = (iso: string) => Date.parse(iso + "+06:00");
const asReal = { ...TEST, test: undefined } as Timetable;

test("the shipped table is either not published (null) or a clean, real table", () => {
  if (TIMETABLE_1448 === null) assert.equal(live, null);
  else { assert.notEqual(TIMETABLE_1448.test, true); assert.deepEqual(validate(TIMETABLE_1448), []); assert.equal(live, TIMETABLE_1448); }
});

test("no times appear without a verified table", () => {
  const now = at("2027-02-15T12:00:00");
  assert.equal(showDay(null, "dhaka", now), null);
  assert.equal(nextEvent(null, "dhaka", now), null);
  assert.deepEqual(monthFor(null, "dhaka"), []);
});

test("a TEST fixture is never usable, however clean it is", () => {
  assert.deepEqual(validate(TEST), []);
  assert.equal(usable(TEST), null);
  assert.equal(showDay(usable(TEST), "dhaka", at("2027-02-15T12:00:00")), null);
});

test("times come straight from the table plus the district's difference", () => {
  const table = usable(asReal)!;
  const day = showDay(table, "dhaka", at("2027-02-09T12:00:00"))!;
  assert.equal([clock(day.sehri), clock(day.iftar)].join(" "), "৫:২০ ৫:৪৫");
  const sylhet = monthFor(table, "sylhet");
  assert.equal(clock(sylhet[0].iftar), "৫:৩৮");
  assert.equal(clock(sylhet[15].sehri), clock(monthFor(table, "dhaka")[15].sehri - 5 * 60_000), "the second part of the month uses its own difference");
});

test("after iftar the next day's times show, and the countdown targets the next event", () => {
  const table = usable(asReal)!;
  assert.equal(showDay(table, "dhaka", at("2027-02-10T19:00:00"))!.day, 3);
  assert.equal(showDay(table, "dhaka", at("2027-02-08T20:00:00"))!.day, 1, "the night before the first fast shows day 1");
  assert.deepEqual(nextEvent(table, "dhaka", at("2027-02-09T16:33:00")), { kind: "iftar", at: at("2027-02-09T17:45:00"), minutes: 72 });
  assert.equal(nextEvent(table, "dhaka", at("2027-02-09T18:00:00"))!.kind, "sehri");
  assert.equal(nextEvent(table, "dhaka", at("2027-03-09T18:30:00")), null, "nothing after the last iftar");
  assert.equal(duration(72), "১ ঘণ্টা ১২ মিনিট");
  assert.equal(duration(60), "১ ঘণ্টা");
  assert.equal(duration(9), "৯ মিনিট");
});

test("validation catches typos, gaps and missing districts", () => {
  const typo = { ...asReal, days: asReal.days.map(row => row.day === 5 ? { ...row, iftar: "07:58" } : row) };
  assert.ok(validate(typo).some(p => p.includes("day 5")));
  const jump = { ...asReal, days: asReal.days.map(row => row.day === 7 ? { ...row, sehri: "05:30" } : row) };
  assert.ok(validate(jump).some(p => p.includes("more than 3 minutes")));
  const gap = { ...asReal, days: asReal.days.filter(row => row.day !== 12) };
  assert.ok(validate(gap).length > 0);
  const { feni: _, ...rest } = asReal.offsets;
  assert.ok(validate({ ...asReal, offsets: rest }).includes("offsets: feni is missing"));
  assert.ok(validate({ ...asReal, checkedBy: ["এক", "এক"] }).length > 0, "one person checking twice is not two people");
  assert.ok(validate({ ...asReal, source: { label: "x", url: "http://insecure" } }).length > 0);
  assert.equal(usable(typo), null);
});

test("before the IF table, the season comes from the moon projection and says সম্ভাব্য", () => {
  const before = season(null, "2026-10-10");
  assert.equal(before.phase, "before");
  if (before.phase === "before") { assert.equal(before.days, 122); assert.equal(before.likely, true); assert.equal(before.hijri, 1448); }
  assert.equal(seasonText(before), "রমজান আসতে সম্ভাব্য আর ১২২ দিন");
  assert.equal(seasonText(season(null, "2027-02-20")), "আজ সম্ভাব্য ১২ রমজান");
  assert.equal(season(null, "2027-03-10").phase, "before", "after Eid the count moves to the next Ramadan");
});

test("with a table, the season follows the table and is not সম্ভাব্য", () => {
  assert.equal(seasonText(season(asReal, "2027-02-09")), "আজ ১ রমজান");
});

test("the human line knows when iftar is close", () => {
  const during = season(null, "2027-02-20");
  assert.equal(humanLine(during, { kind: "iftar", at: 0, minutes: 12 }), "শরবতটা বানিয়ে ফেলো।");
  assert.match(humanLine(season(null, "2026-10-10"), null), /রমজান আসছে/);
});

test("share links carry only a district id", () => {
  assert.equal(shareHash("sylhet"), "#z=sylhet");
  assert.equal(parseShareHash(shareHash("coxsbazar")), "coxsbazar");
  assert.equal(parseShareHash("#z=DHAKA"), "dhaka");
  for (const hostile of ["", "#", "#z=", "#z=atlantis", "#z=%E0%A6", "#z=dhaka%00", "#z=" + "a".repeat(5000), "#z[]=dhaka"]) assert.equal(parseShareHash(hostile), null, hostile);
});

test("the preview title names the district and never a clock time", () => {
  const title = previewTitle("rajshahi", "2026-10-10");
  assert.equal(title, "রাজশাহী · রমজান আসতে সম্ভাব্য আর ১২২ দিন — তোমার জেলায় ইফতার কখন?");
  assert.doesNotMatch(title, /[০-৯]:[০-৯]/);
});
