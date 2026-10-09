import assert from "node:assert/strict";
import test from "node:test";
import { getCurrentActivities, parseActivity } from "../lib/activities";

const activity = {
  id: "test-activity",
  title: "পরীক্ষার আয়োজন",
  city: "ঢাকা",
  location: "পরীক্ষার স্থান",
  startsAt: "2026-10-10T09:00:00+06:00",
  endsAt: "2026-10-10T10:00:00+06:00",
  durationMinutes: 60,
  timezone: "Asia/Dhaka",
  costDescription: "প্রবেশে খরচ নেই",
  eligibility: "প্রাপ্তবয়স্কদের জন্য",
  requirements: ["আয়োজকের নির্দেশনা পড়ুন"],
  organizerName: "পরীক্ষার আয়োজক",
  organizerUrl: "https://example.org/about",
  signupUrl: "https://example.org/join",
  sourceUrl: "https://example.org/event",
  checkedAt: "2026-10-09T12:00:00+06:00",
  checkedBy: "পরীক্ষার সম্পাদক",
  organizerConfirmedAt: "2026-10-09T11:00:00+06:00",
  status: "confirmed",
};

test("an event is visible until, but not at, its end time", () => {
  assert.equal(getCurrentActivities([activity], new Date("2026-10-10T09:59:59+06:00")).length, 1);
  assert.deepEqual(getCurrentActivities([activity], new Date(activity.endsAt)), []);
});

test("unconfirmed and cancelled events never receive a listing", () => {
  const events = ["unconfirmed", "cancelled"].map((status) => ({ ...activity, status }));
  assert.deepEqual(getCurrentActivities(events, new Date("2026-10-09T13:00:00+06:00")), []);
});

test("checks older than 24 hours and future checks cannot publish an event", () => {
  const futureEvent = { ...activity, startsAt: "2026-10-11T09:00:00+06:00", endsAt: "2026-10-11T10:00:00+06:00" };
  assert.deepEqual(getCurrentActivities([futureEvent], new Date("2026-10-09T11:59:59+06:00")), []);
  assert.equal(getCurrentActivities([futureEvent], new Date("2026-10-10T12:00:00+06:00")).length, 1);
  assert.deepEqual(getCurrentActivities([futureEvent], new Date("2026-10-10T12:00:01+06:00")), []);
});

test("each external link must be a public HTTPS address without credentials", () => {
  const invalidUrls = ["javascript:alert(1)", "http://example.org", "/join", "https://user:secret@example.org", "https://localhost/join", "https://127.0.0.1", "https://[::1]", "https://event.local"];
  for (const field of ["organizerUrl", "signupUrl", "sourceUrl"]) {
    for (const url of invalidUrls) assert.equal(parseActivity({ ...activity, [field]: url }), null);
  }
});

test("invalid times, mismatched durations and missing confirmation fail validation", () => {
  for (const patch of [
    { endsAt: activity.startsAt },
    { startsAt: "2026-02-30T09:00:00+06:00" },
    { startsAt: "2026-10-10T09:00:00" },
    { durationMinutes: 30 },
    { organizerConfirmedAt: undefined },
    { organizerConfirmedAt: "2026-10-09T13:00:00+06:00" },
    { checkedBy: " " },
    { requirements: [] },
  ]) assert.equal(parseActivity({ ...activity, ...patch }), null);
});

test("empty or malformed editorial data leaves an honest empty list", () => {
  assert.deepEqual(getCurrentActivities([null, {}, [], "event"], new Date()), []);
});
