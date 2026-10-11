import assert from "node:assert/strict";
import test from "node:test";
import { biggest, bucketId, cleanName, crowdAverage, MAX_NAME, monthHash, monthLine, parseMonth, previewTitle, sample, setShare, tallyIds, tallyItems, type Month } from "../lib/bhag";
import { carrierLayout, LIVE_HEIGHT, TAG } from "../lib/draw-carrier";
import { share } from "../share";

const sum = (shares: number[]) => shares.reduce((total, value) => total + value, 0);
const valid = (shares: number[]) => shares.length === 6 && sum(shares) === 100 && shares.every(value => Number.isInteger(value) && value >= 0 && value <= 100);

test("raising a bowl takes from জমা first, lowering gives back to জমা", () => {
  assert.deepEqual(setShare(sample.shares, 0, 40), [40, 25, 10, 5, 15, 5]);
  assert.deepEqual(setShare(sample.shares, 1, 20), [35, 20, 10, 5, 15, 15]);
});

test("once জমা is empty the rest comes from the other bowls in proportion", () => {
  // Rent +15: জমা gives 10, then 5 from bazar/travel/mobile/home (25:10:5:15), whole numbers by largest remainder.
  assert.deepEqual(setShare(sample.shares, 0, 50), [50, 23, 9, 4, 14, 0]);
});

test("moving জমা spreads the change over the other five", () => {
  assert.deepEqual(setShare(sample.shares, 5, 20), [31, 22, 9, 5, 13, 20]);
  assert.deepEqual(setShare([0, 0, 0, 0, 0, 100], 5, 90), [2, 2, 2, 2, 2, 90]);
});

test("dragging back to where you started restores the split", () => {
  // The page computes every step of one drag from the split the drag started on, so coming back is exact.
  const start = sample.shares;
  assert.notDeepEqual(setShare(start, 0, 60), start);
  assert.deepEqual(setShare(start, 0, 35), start);
});

test("steppers work at the bounds: no negatives, no overflow, ±1 exactly", () => {
  const empty = [40, 30, 10, 5, 15, 0];
  assert.deepEqual(setShare(empty, 2, 11), [39, 30, 11, 5, 15, 0]);
  assert.deepEqual(setShare([100, 0, 0, 0, 0, 0], 0, 101), [100, 0, 0, 0, 0, 0]);
  assert.deepEqual(setShare([100, 0, 0, 0, 0, 0], 0, 99), [99, 0, 0, 0, 0, 1]);
  assert.deepEqual(setShare([0, 0, 0, 0, 0, 100], 1, -1), [0, 0, 0, 0, 0, 100]);
  assert.deepEqual(setShare([0, 0, 0, 0, 0, 100], 1, 1), [0, 1, 0, 0, 0, 99]);
  assert.deepEqual(setShare([20, 20, 20, 20, 20, 0], 5, -1), [20, 20, 20, 20, 20, 0]);
});

test("every move keeps whole numbers that add up to exactly 100", () => {
  let seed = 7;
  const random = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  let shares = sample.shares;
  for (let step = 0; step < 5000; step++) {
    const index = Math.floor(random() * 6);
    const kind = random();
    const value = kind < 0.4 ? shares[index] + (random() < 0.5 ? -1 : 1) : kind < 0.9 ? random() * 120 - 10 : [NaN, Infinity, -Infinity, 0, 100][step % 5];
    const next = setShare(shares, index, value);
    assert.ok(valid(next), `step ${step}: ${next}`);
    if (Number.isFinite(value)) assert.equal(next[index], Math.min(100, Math.max(0, Math.round(value))));
    else assert.deepEqual(next, shares);
    shares = next;
  }
});

test("a split survives the link round trip, with the fourth bowl and the name", () => {
  const month: Month = { shares: [30, 30, 10, 10, 10, 10], flex: "study", name: "রাফি" };
  assert.equal(monthHash(month), "p=30%2C30%2C10%2C10%2C10%2C10&t=study&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseMonth(monthHash(month)), month);
  assert.deepEqual(parseMonth("#p=35,25,10,5,15,10"), sample);
});

test("hostile or broken links are ignored instead of crashing", () => {
  for (const hash of ["", "#result", "#p=", "#p=50,50", "#p=35,25,10,5,15,11", "#p=35,25,10,5,15,10,0", "#p=-5,45,10,10,20,20", "#p=101,0,0,0,0,0", "#p=1e2,0,0,0,0,0", "#p=35.5,24.5,10,5,15,10", "#p=%%%"]) {
    assert.equal(parseMonth(hash), null, hash);
  }
  assert.equal(parseMonth("#p=100,0,0,0,0,0&t=evil")?.flex, "mobile");
});

test("names are NFC, capped, and lose control and direction characters", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME + 10)).length, MAX_NAME);
  // য় is a composition exclusion: NFC stores it as য + nukta, which is how the repo keeps it too.
  assert.equal(cleanName(String.fromCodePoint(0x9df)), String.fromCodePoint(0x9af, 0x9bc));
  assert.equal(parseMonth("#p=100,0,0,0,0,0&n=" + encodeURIComponent("য়"))?.name, "য়".normalize("NFC"));
});

test("share.ts normalizes, previews personally and only tallies fixed ids", () => {
  assert.equal(share.normalize("p=35,25,10,5,15,10&n=রাফি&x=1"), "p=35%2C25%2C10%2C5%2C15%2C10&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.equal(share.normalize("p=1,2,3"), null);
  assert.equal(share.preview("p=35,25,10,5,15,10&n=রাফি").title, "রাফির বেতনের সবচেয়ে বড় বাটি বাসা ভাড়া, ৩৫%। তোমারটা কোনটা?");
  assert.equal(previewTitle(sample), "এক বন্ধুর বেতনের সবচেয়ে বড় বাটি বাসা ভাড়া, ৩৫%। তোমারটা কোনটা?");
  assert.ok(tallyItems({ ...sample, flex: "hobby" }).every(id => share.tally!.includes(id)));
  assert.equal(new Set(tallyIds).size, tallyIds.length);
});

test("tally buckets have fixed edges and give a rough average", () => {
  assert.deepEqual([0, 1, 4, 5, 9, 35, 39, 94, 95, 100].map(value => bucketId("rent", value)), ["rent:0", "rent:1-4", "rent:1-4", "rent:5-9", "rent:5-9", "rent:35-39", "rent:35-39", "rent:90-94", "rent:95-100", "rent:95-100"]);
  assert.deepEqual(tallyItems(sample), ["rent:35-39", "bazar:25-29", "travel:10-14", "mobile:5-9", "home:15-19", "save:10-14"]);
  assert.deepEqual(crowdAverage({ "rent:35-39": 3, "rent:40-44": 1, "save:0": 9 }, "rent"), { people: 4, average: 38 });
  assert.deepEqual(crowdAverage({ "save:0": 9 }, "save"), { people: 9, average: 0 });
  assert.equal(crowdAverage({}, "rent"), null);
});

test("the human line follows the split and never judges", () => {
  assert.equal(monthLine({ ...sample, shares: [30, 20, 10, 5, 25, 10] }), "বেতনের একটা বড় বাটি যায় বাড়ির জন্য।");
  assert.equal(monthLine({ ...sample, shares: [30, 20, 10, 5, 15, 20] }), "একটা বাটি তুলে রাখা, সামনের দিনের জন্য।");
  assert.equal(monthLine({ ...sample, shares: [45, 20, 10, 5, 15, 5] }), "মাথার ওপরের ছাদটাই সবচেয়ে বড় বাটি।");
  assert.equal(monthLine(sample), "ছয় বাটিতে ভাগ করা একটা পুরো মাস।");
  assert.deepEqual(biggest({ ...sample, shares: [20, 20, 20, 20, 10, 10] }), { index: 0, label: "বাসা ভাড়া", share: 20 });
});

test("tags never overlap and stay on the wall above the cloth, whatever the split", () => {
  for (const sizes of [sample.shares, [100, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 100], [0, 0, 100, 0, 0, 0], [17, 17, 17, 17, 16, 16]]) {
    const { tags } = carrierLayout(sizes, LIVE_HEIGHT);
    tags.forEach((center, i) => {
      assert.ok(center - TAG.h / 2 >= 0 && center + TAG.h / 2 <= LIVE_HEIGHT - 40, `${sizes}: tag ${i} is not on the wall`);
      if (i) assert.ok(center - tags[i - 1] >= TAG.h + TAG.gap - 0.001, `${sizes}: tags ${i - 1}/${i} overlap`);
    });
  }
});
