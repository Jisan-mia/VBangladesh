import assert from "node:assert/strict";
import test from "node:test";
import { MIN_SAMPLE, bucketOf, buckets, caption, clock, crowd, divisions, humanLine, parseShareHash, previewTitle, shareHash, tallyId, tallyWindow, votesToSend, whenLabel, type Day } from "../lib/gelo";
import { share } from "../share";

const at = (local: string) => Date.parse(`${local}:00+06:00`);
const day: Day = { minutes: 430, times: 3, division: "khulna", date: "2027-05-02" };

test("a day survives the link round trip", () => {
  assert.equal(shareHash(day), "#m=430&n=3&dv=khulna&d=2027-05-02");
  assert.deepEqual(parseShareHash(shareHash(day)), day);
  assert.deepEqual(parseShareHash("#m=0"), { minutes: 0, times: 0, division: "", date: "" });
});

test("hostile links are ignored or capped, never crash", () => {
  assert.equal(parseShareHash(""), null);
  assert.equal(parseShareHash("#result"), null);
  assert.equal(parseShareHash("#m=-5"), null);
  assert.equal(parseShareHash("#m=1e3"), null);
  assert.equal(parseShareHash("#m=%%%"), null);
  assert.deepEqual(parseShareHash("#m=99999&n=999&dv=%E0%A6%96%E0%A7%81%E0%A6%B2%E0%A6%A8%E0%A6%BE&d=2027-02-30"), { minutes: 1440, times: 50, division: "", date: "" });
  assert.deepEqual(parseShareHash("#m=60&n=x&dv=__proto__&d=1999-01-01"), { minutes: 60, times: 0, division: "", date: "" });
});

test("share normalizes state and gives a personal preview", () => {
  assert.equal(share.normalize("dv=khulna&m=430&d=2027-05-02&n=3&junk=1"), "m=430&n=3&dv=khulna&d=2027-05-02");
  assert.equal(share.normalize("hello"), null);
  const { title } = share.preview("m=430&n=3&dv=khulna&d=2027-05-02");
  assert.equal(title, "২ মে খুলনায় ৭ ঘণ্টা ১০ মিনিট কারেন্ট ছিল না। তোমার এলাকায় কত ঘণ্টা?");
  assert.equal(title, title.normalize("NFC"));
  assert.match(previewTitle({ minutes: 0, times: 0, division: "", date: "" }), /^আজ একবারও কারেন্ট যায়নি/);
});

test("tally ids are fixed day × division × bucket ids, and the server only takes yesterday to tomorrow", () => {
  assert.equal(tallyId("2027-05-02", "khulna", 4), "270502kh4");
  assert.equal(new Set(divisions.map(item => item.code)).size, divisions.length);
  const ids = tallyWindow(at("2027-05-02T00:30"));
  assert.equal(ids.length, 3 * divisions.length * buckets.length);
  assert.ok(ids.includes("270501kh0") && ids.includes("270502my6") && ids.includes("270503dh3"));
  assert.ok(!ids.includes("270430kh0") && !ids.includes("270504kh0"));
  assert.ok(share.tally && share.tally.length === ids.length);
});

test("a new day's vote keeps yesterday's pick so yesterday's counts are not subtracted", () => {
  const votes = { "2027-04-30": "270430kh3", "2027-05-01": "270501kh5", "2027-05-02": "270502kh1" };
  assert.deepEqual(votesToSend(votes, "2027-05-02", "270502kh2"), { "2027-05-02": "270502kh2", "2027-05-01": "270501kh5" });
  assert.deepEqual(votesToSend({}, "2027-05-02", "270502kh2"), { "2027-05-02": "270502kh2" });
});

test("hours fall into the right bucket", () => {
  assert.deepEqual([0, 1, 60, 61, 120, 240, 360, 361, 540, 541, 1440].map(minutes => bucketOf(minutes).id), [0, 1, 1, 2, 2, 3, 4, 5, 5, 6, 6]);
});

test("the crowd average shows only above the minimum sample, falling back to the whole country", () => {
  const counts: Record<string, number> = {};
  assert.equal(crowd({ counts }, "2027-05-02", "khulna"), null);
  counts[tallyId("2027-05-02", "khulna", 4)] = MIN_SAMPLE - 1;
  assert.equal(crowd({ counts }, "2027-05-02", "khulna"), null);
  counts[tallyId("2027-05-02", "dhaka", 2)] = 5;
  const country = crowd({ counts }, "2027-05-02", "khulna")!;
  assert.equal(country.scope, "country");
  assert.equal(country.count, MIN_SAMPLE + 4);
  counts[tallyId("2027-05-02", "khulna", 6)] = 1;
  const local = crowd({ counts }, "2027-05-02", "khulna")!;
  assert.equal(local.scope, "division");
  assert.equal(local.line, "খুলনা বিভাগে গড় প্রায় ৫ ঘণ্টা");
  // Another day's counts never leak into today's average; negative counts are ignored.
  counts[tallyId("2027-05-01", "khulna", 6)] = 500;
  counts[tallyId("2027-05-02", "khulna", 0)] = -40;
  assert.equal(crowd({ counts }, "2027-05-02", "khulna")!.count, MIN_SAMPLE);
});

test("clock and labels speak the way people do, in Dhaka time", () => {
  assert.equal(clock(at("2027-05-02T20:05")), "রাত ৮:০৫");
  assert.equal(clock(at("2027-05-02T12:30")), "দুপুর ১২:৩০");
  assert.equal(clock(at("2027-05-02T05:10")), "ভোর ৫:১০");
  assert.equal(whenLabel("2027-05-02", "2027-05-02"), "আজ");
  assert.equal(whenLabel("2027-05-02", "2027-05-04"), "২ মে");
});

test("the human line stays gentle and follows the day", () => {
  assert.equal(humanLine(400, 2), "হাতপাখার ব্যায়ামে আজ তুমি চ্যাম্পিয়ন।");
  assert.match(humanLine(0, 0), /ছুটি/);
  assert.match(humanLine(90, 6), /লুকোচুরি/);
  assert.match(caption(day), /^আজ খুলনায় ৭ ঘণ্টা ১০ মিনিট কারেন্ট ছিল না, ৩ বার গেল-এল।/);
  for (const minutes of [0, 20, 90, 200, 400, 700]) assert.doesNotMatch(humanLine(minutes, 1) + caption({ ...day, minutes }), /সরকার|দায়ী|বিদ্যুৎ বিভাগ|পিডিবি|ডেসকো/);
});
