import assert from "node:assert/strict";
import test from "node:test";
import { HOUR, MINUTE, dayKey, dayStart, previousDay } from "../lib/gelo";
import { ASK_AFTER, MAX_OPEN, clearAdjust, comeOn, dayMinutes, empty, endAt, goOff, hhmm, outageCount, parseSaved, removeOutage, stepHours, tapMinutes, type Saved } from "../lib/log";

/** A Dhaka wall-clock moment, whatever time zone the test machine is in. */
const at = (local: string) => Date.parse(`${local}:00+06:00`);
const log = (...pairs: Array<[string, string | null]>): Saved => ({ ...empty, outages: pairs.map(([off, on]) => ({ off: at(off), on: on ? at(on) : null })) });

test("the Dhaka day turns at Bangladesh midnight, not UTC's", () => {
  assert.equal(dayKey(at("2027-05-02T23:59")), "2027-05-02");
  assert.equal(dayKey(at("2027-05-03T00:00")), "2027-05-03");
  assert.equal(dayKey(at("2027-05-03T05:30")), "2027-05-03"); // still 2 May in UTC
  assert.equal(dayStart("2027-05-03"), at("2027-05-03T00:00"));
  assert.equal(previousDay("2027-03-01"), "2027-02-28");
});

test("an outage across midnight splits between the two days", () => {
  const night = log(["2027-05-02T22:00", "2027-05-03T02:30"]);
  const later = at("2027-05-03T12:00");
  assert.equal(tapMinutes(night.outages, "2027-05-02", later), 120);
  assert.equal(tapMinutes(night.outages, "2027-05-03", later), 150);
  assert.equal(outageCount(night.outages, "2027-05-02", later), 1);
  assert.equal(outageCount(night.outages, "2027-05-03", later), 1);
});

test("several outages add up and overlaps are not counted twice", () => {
  const day = log(["2027-05-02T08:00", "2027-05-02T09:10"], ["2027-05-02T13:00", "2027-05-02T15:00"], ["2027-05-02T14:30", "2027-05-02T16:00"]);
  assert.equal(tapMinutes(day.outages, "2027-05-02", at("2027-05-02T20:00")), 70 + 180);
});

test("an open outage counts up to now, and a forgotten one stops at the cap", () => {
  const open = log(["2027-05-02T18:00", null]);
  assert.equal(tapMinutes(open.outages, "2027-05-02", at("2027-05-02T18:45")), 45);
  // Forgot "এল" overnight: counted for MAX_OPEN only, split across the two days.
  const morning = at("2027-05-03T11:00");
  assert.equal(tapMinutes(open.outages, "2027-05-02", morning), 6 * 60);
  assert.equal(tapMinutes(open.outages, "2027-05-03", morning), MAX_OPEN / MINUTE - 6 * 60);
  assert.ok(MAX_OPEN > ASK_AFTER);
});

test("গেল twice does nothing new; এল closes the open outage and never runs past now or the cap", () => {
  const now = at("2027-05-02T10:00");
  const off = goOff(empty, now);
  assert.equal(goOff(off, now + MINUTE), off);
  assert.equal(comeOn(empty, now), empty);
  assert.deepEqual(comeOn(off, now + 30 * MINUTE).outages, [{ off: now, on: now + 30 * MINUTE }]);
  assert.equal(comeOn(off, now + HOUR, now + 5 * HOUR).outages[0].on, now + HOUR);
  assert.equal(comeOn(off, now + 30 * HOUR).outages[0].on, now + MAX_OPEN);
});

test("a mis-tapped outage can be removed", () => {
  const day = log(["2027-05-02T08:00", "2027-05-02T09:00"], ["2027-05-02T10:00", "2027-05-02T10:01"]);
  assert.deepEqual(removeOutage(day, 1).outages, day.outages.slice(0, 1));
  assert.equal(removeOutage(day, 9), day);
});

test("the stepper moves to whole hours on top of the taps and stays within the day", () => {
  const now = at("2027-05-02T20:00");
  const day = log(["2027-05-02T08:00", "2027-05-02T10:10"]);
  const up = stepHours(day, "2027-05-02", now, 1);
  assert.equal(dayMinutes(up, "2027-05-02", now), 180);
  assert.equal(dayMinutes(stepHours(day, "2027-05-02", now, -1), "2027-05-02", now), 120);
  let zero = day;
  for (let i = 0; i < 5; i++) zero = stepHours(zero, "2027-05-02", now, -1);
  assert.equal(dayMinutes(zero, "2027-05-02", now), 0);
  let full = empty;
  for (let i = 0; i < 30; i++) full = stepHours(full, "2027-05-02", now, 1);
  assert.equal(dayMinutes(full, "2027-05-02", now), 24 * 60);
  assert.equal(dayMinutes(clearAdjust(up, "2027-05-02"), "2027-05-02", now), 130);
  // The adjustment belongs to its own day only.
  assert.equal(dayMinutes(up, "2027-05-03", at("2027-05-03T09:00")), 0);
});

test("a fixed end time is the first such time after the outage began, and never in the future", () => {
  const off = at("2027-05-02T22:15");
  assert.equal(endAt(off, "23:40", at("2027-05-03T09:00")), at("2027-05-02T23:40"));
  assert.equal(endAt(off, "01:05", at("2027-05-03T09:00")), at("2027-05-03T01:05"));
  assert.equal(endAt(off, "10:00", at("2027-05-03T09:00")), null);
  assert.equal(endAt(off, "25:00", at("2027-05-04T09:00")), null);
  assert.equal(endAt(off, "abc", at("2027-05-04T09:00")), null);
  assert.equal(hhmm(off), "22:15");
});

test("saved data from a hostile or broken localStorage is cleaned, never thrown", () => {
  const now = at("2027-05-03T12:00");
  assert.deepEqual(parseSaved(null, now), empty);
  assert.deepEqual(parseSaved("{oops", now), empty);
  assert.deepEqual(parseSaved("[1,2]", now).outages, []);
  const saved = parseSaved(JSON.stringify({
    outages: [{ off: "x" }, { off: at("2027-05-03T08:00"), on: at("2027-05-03T07:00") }, { off: at("2027-05-03T09:00"), on: null }, { off: at("2027-05-03T10:00"), on: null }],
    adjust: { "2027-05-03": 60, "2027-04-01": 30, "evil": 5, "2027-05-02": 99999 },
    division: "atlantis",
    votes: { "2027-05-03": "270503kh2", "2027-05-02": "<script>" },
  }), now);
  // The older open outage was overtaken by the newer one, so it ends where the next began.
  assert.deepEqual(saved.outages, [{ off: at("2027-05-03T09:00"), on: at("2027-05-03T10:00") }, { off: at("2027-05-03T10:00"), on: null }]);
  assert.deepEqual(saved.adjust, { "2027-05-03": 60 });
  assert.equal(saved.division, "");
  assert.deepEqual(saved.votes, { "2027-05-03": "270503kh2" });
});

test("old outages are dropped after three days", () => {
  const now = at("2027-05-10T12:00");
  const saved = parseSaved(JSON.stringify({ outages: [{ off: at("2027-05-01T08:00"), on: at("2027-05-01T09:00") }, { off: at("2027-05-10T08:00"), on: at("2027-05-10T09:00") }] }), now);
  assert.equal(saved.outages.length, 1);
});
