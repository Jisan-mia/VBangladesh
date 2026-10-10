import assert from "node:assert/strict";
import test from "node:test";
import { milestoneHours } from "../lib/draw-card";
import { bucketOf, caption, cleanName, defaults, EVENT, humanLine, MAX_NAME, MIN_SAMPLE, parseShareHash, previewTitle, readDigits, routeAverage, routeLabel, shareHash, tallyId, tallyIds, type Trip } from "../lib/jatra";

const trip: Trip = { from: "dhaka", to: "rangpur", mode: "train", hours: 9, onTheWay: false, name: "রাফি" };

test("a trip survives the share-link round trip", () => {
  assert.equal(shareHash(trip), "#f=dhaka&t=rangpur&m=train&h=9&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShareHash(shareHash(trip)), trip);
  const onTheWay = { ...trip, onTheWay: true, name: "" };
  assert.deepEqual(parseShareHash(shareHash(onTheWay)), onTheWay);
  assert.deepEqual(parseShareHash(shareHash(defaults)), defaults);
});

test("the brief's example link opens", () => {
  assert.deepEqual(parseShareHash("#f=dhaka&t=rangpur&m=train&h=9"), { ...trip, name: "" });
});

test("hostile, partial or in-page hashes are ignored instead of crashing", () => {
  for (const hash of ["", "#result", "#jatra-stage", "#f=dhaka", "#f=dhaka&t=rangpur&m=plane&h=9", "#f=delhi&t=rangpur&m=bus&h=9", "#f=dhaka&t=rangpur&m=bus&h=-3", "#f=dhaka&t=rangpur&m=bus&h=9.5", "#f=dhaka&t=rangpur&m=bus&h=%%%", "#f=dhaka&t=rangpur&m=bus&h=12345", `#f=dhaka&t=rangpur&m=bus&h=9&n=${"ক".repeat(700)}`]) {
    assert.equal(parseShareHash(hash), null, hash);
  }
});

test("hours are capped to 1–48", () => {
  assert.equal(parseShareHash("#f=dhaka&t=rangpur&m=bus&h=0")?.hours, 1);
  assert.equal(parseShareHash("#f=dhaka&t=rangpur&m=bus&h=999")?.hours, 48);
  assert.equal(shareHash({ ...trip, hours: 200 }).includes("h=48"), true);
});

test("names are NFC, lose control and direction-override characters, and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME + 10)).length, MAX_NAME);
  // য় typed as one code point and as য + nukta must become the same name.
  assert.equal(cleanName("য়"), cleanName("য়"));
  assert.equal(parseShareHash(`#f=dhaka&t=rangpur&m=bus&h=9&n=${encodeURIComponent("নিলয়য়")}`)?.name, "নিলয়য়".normalize("NFC"));
});

test("Bangla digits are read in the hours box", () => {
  assert.equal(readDigits("১৪"), 14);
  assert.equal(readDigits("14 ঘণ্টা"), 14);
  assert.ok(Number.isNaN(readDigits("অনেক")));
});

test("a trip inside one division reads naturally", () => {
  assert.equal(routeLabel(trip), "ঢাকা → রংপুর");
  assert.equal(routeLabel({ from: "dhaka", to: "dhaka" }), "ঢাকা → ঢাকা বিভাগের বাড়ি");
});

test("the human line follows the hours and the brief's long-road line", () => {
  assert.equal(humanLine({ ...trip, hours: 14 }), "লম্বা পথ, শেষে মায়ের হাতের রান্না।");
  assert.notEqual(humanLine({ ...trip, hours: 2 }), humanLine({ ...trip, hours: 14 }));
  assert.match(humanLine({ ...trip, onTheWay: true }), /বাড়ি/);
});

test("preview title and caption are personal and say whether the trip is over", () => {
  assert.equal(previewTitle(trip), "রাফির ঈদযাত্রা: ঢাকা → রংপুর, ট্রেনে ৯ ঘণ্টা। তোমার কত ঘণ্টা?");
  assert.match(previewTitle({ ...trip, name: "", onTheWay: true }), /^ঈদযাত্রা: .*ধরে পথে/);
  assert.match(caption(trip), /ঢাকা থেকে রংপুর, ট্রেনে ৯ ঘণ্টা/);
});

test("tally ids are fixed, unique, for this Eid only, and every trip maps to one of them", () => {
  assert.equal(tallyIds.length, 8 * 8 * 4 * 6);
  assert.equal(new Set(tallyIds).size, tallyIds.length);
  assert.ok(tallyIds.every(id => id.startsWith(`${EVENT}:`) && /^[a-z0-9:-]+$/.test(id)));
  assert.equal(tallyId(trip), `${EVENT}:dha-ran-train-h3`);
  for (const hours of [1, 3, 4, 12, 13, 18, 19, 48]) assert.ok(tallyIds.includes(tallyId({ ...trip, hours })), String(hours));
  assert.equal(bucketOf(3).id, "h1");
  assert.equal(bucketOf(19).id, "h6");
});

test("the average stays hidden below the minimum sample and is a bucket-midpoint average above it", () => {
  const key = `${EVENT}:dha-ran-bus`;
  assert.equal(routeAverage({ [`${key}-h5`]: MIN_SAMPLE - 1 }, { ...trip, mode: "bus" }), null);
  assert.deepEqual(routeAverage({ [`${key}-h4`]: 30, [`${key}-h5`]: 30 }, { ...trip, mode: "bus" }), { hours: 13, people: 60 });
  // Another route or vehicle never leaks in, and negative counts are ignored.
  assert.equal(routeAverage({ [`${EVENT}:dha-ran-train-h4`]: 500, [`${key}-h4`]: -9 }, { ...trip, mode: "bus" }), null);
});

test("milestones never crowd: at most nine, always ending on the total", () => {
  assert.deepEqual(milestoneHours(1).marks, [1]);
  assert.deepEqual(milestoneHours(9).marks, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(milestoneHours(14), { step: 2, marks: [2, 4, 6, 8, 10, 12, 14] });
  // No stone squeezed in one hour before the total.
  assert.deepEqual(milestoneHours(13).marks, [2, 4, 6, 8, 10, 13]);
  for (let hours = 1; hours <= 48; hours++) {
    const { marks } = milestoneHours(hours);
    assert.ok(marks.length <= 9 && marks.at(-1) === hours, String(hours));
  }
});
