import assert from "node:assert/strict";
import test from "node:test";
import { axisTicks, caption, cleanText, createCard, curvePath, decodeMoods, encodeMoods, finalId, finalLine, finalSplit, parseShareHash, previewTitle, readMatch, shareHash, summaryText, together, wormPoints, MAX_MOODS, MAX_TEXT, SAMPLE, SPLIT_MIN, type Match } from "../lib/worm";
import { share } from "../share";

const solo: Match = { sport: "cricket", moods: [1, 2, 4, 3, 0], name: "রাফি", label: "শেষ ওভারের ফাইনাল", friend: null };

test("a match and a friend's worm survive the link round trip", () => {
  assert.deepEqual(parseShareHash(shareHash(solo)), solo);
  const pair: Match = { sport: "football", moods: [0, 4], name: "", label: "", friend: { moods: [3, 3, 1], name: "মিম" } };
  assert.deepEqual(parseShareHash(shareHash(pair)), pair);
  assert.equal(shareHash({ ...solo, name: "", label: "" }), "#k=cricket&m=12430");
});

test("moods are capped at 60 and anything that isn't 0–4 is refused", () => {
  const long = Array.from({ length: 90 }, (_, index) => index % 5);
  assert.equal(encodeMoods(long).length, MAX_MOODS);
  assert.equal(decodeMoods("1".repeat(200)).length, MAX_MOODS);
  for (const code of ["", "5", "12a", "1 2", "-1", "١٢", "১২", "1.2", null]) assert.deepEqual(decodeMoods(code), [], String(code));
});

test("hostile or unrelated hashes are ignored instead of crashing", () => {
  for (const hash of ["", "#", "#result", "#tool", "#k=cricket", "#k=cricket&m=", "#m=123", "#k=tennis&m=123", "#k=__proto__&m=1", "#k=constructor&m=1", "#k=cricket&m=9", "#k=cricket&m=" + "1".repeat(5000)]) assert.equal(parseShareHash(hash), null, hash.slice(0, 24));
  assert.equal(parseShareHash("#k=cricket&m=12&f=xyz&fn=মিম")?.friend, null);
  assert.equal(parseShareHash("#k=cricket&m=12&n=%%%E0%A")?.name, "%%�%A");
  // a saved match may have no taps yet
  assert.deepEqual(readMatch("#k=football&m=&n=রাফি"), { sport: "football", moods: [], name: "রাফি", label: "", friend: null });
});

test("names and labels are NFC, lose control and direction-override characters, and are capped", () => {
  assert.equal(cleanText("  রাফি‮  হাসান\n"), "রাফি হাসান");
  assert.equal(cleanText("é"), "é");
  assert.equal(cleanText("র‍্যাব"), "র‍্যাব");
  assert.equal(Array.from(cleanText("ক".repeat(MAX_TEXT + 10))).length, MAX_TEXT);
  assert.equal(Array.from(parseShareHash(`#k=cricket&m=1&l=${encodeURIComponent("ম".repeat(80))}`)!.label).length, MAX_TEXT);
});

test("the summary names the two moods tapped most, then how it ended", () => {
  assert.equal(summaryText([1, 4, 1, 4, 1, 4, 4, 0]), "৩ বার আশা, ৪ বার হতাশা, শেষে উল্লাস");
  assert.equal(summaryText([0, 0, 0]), "২ বার উল্লাস, শেষেও উল্লাস");
  assert.equal(summaryText([1, 2, 4, 3, 0]), "১ বার আশা, ১ বার উত্তেজনা, শেষে উল্লাস");
  assert.equal(summaryText([3]), "শেষে ভয়");
  assert.equal(summaryText([]), "");
  assert.equal(finalLine([2, 4]), "রিমোটটা রেখে চুপচাপ উঠে গেলাম। তবু পরের ম্যাচে আবার বসব।");
  assert.equal(finalId([2, 0]), "ullash");
  assert.equal(finalId([]), null);
});

test("two worms swing together by over in cricket and by share of the match in football", () => {
  assert.deepEqual(together([0, 1, 3], [1, 4, 3, 0, 0], "cricket"), { same: 2, total: 3 });
  // football: the 2-tap worm is compared with taps 2 and 4 of the 4-tap one
  assert.deepEqual(together([0, 4], [4, 1, 2, 3], "football"), { same: 2, total: 2 });
  assert.equal(together([], [1], "cricket"), null);
});

test("the graph starts at kick-off in the middle and never overshoots its rows", () => {
  const points = wormPoints([0, 4], "cricket");
  assert.deepEqual(points, [{ x: 0, row: 2 }, { x: 1 / 20, row: 0 }, { x: 2 / 20, row: 4 }]);
  assert.equal(wormPoints([1, 1], "football").at(-1)!.x, 1);
  assert.equal(wormPoints(Array(23).fill(1), "cricket").at(-1)!.x, 23 / 25);
  const path = curvePath([{ x: 0, y: 50 }, { x: 10, y: 0 }, { x: 20, y: 100 }]);
  assert.equal(path, "M0 50C5 50 5 0 10 0C15 0 15 100 20 100");
  assert.deepEqual(axisTicks("cricket", 3).map(tick => tick.label), ["০", "৫", "১০", "১৫", "২০"]);
  assert.equal(axisTicks("football", 40).length, 3);
});

test("cards, previews and captions read like a person wrote them", () => {
  assert.equal(createCard(solo).title, "রাফির ম্যাচ");
  assert.match(previewTitle(solo), /^রাফির ম্যাচ: .+, শেষে উল্লাস — তোমার মন কেমন দুলল\?$/);
  assert.match(previewTitle({ ...solo, name: "" }), /^এক বন্ধুর ম্যাচ/);
  const pair: Match = { ...solo, name: "মিম", friend: { moods: [1, 2, 4, 4, 0], name: "রাফি" } };
  assert.equal(previewTitle(pair), "মিম আর রাফির মন ৫ বারের ৫ বার একসাথে দুলল — তোমারটা মেলাবে?");
  assert.equal(createCard(pair).pair, "দুজনের মন ৫ বারের ৫ বার একই দিকে দুলল");
  assert.match(caption(solo), /^আমার ম্যাচের মন: /);
  assert.match(createCard({ ...solo, moods: SAMPLE }).line, /চিৎকার/);
});

test("the crowd split waits for enough matches", () => {
  assert.equal(finalSplit({ total: 5, counts: { ullash: 5 } }), null);
  const split = finalSplit({ total: SPLIT_MIN, counts: { ullash: 10, hotasha: 10, junk: 99 } });
  assert.deepEqual(split, { total: SPLIT_MIN, percents: [50, 0, 0, 0, 50] });
});

test("share: normalizes, previews, and tallies only the final-mood ids", () => {
  assert.equal(share.normalize("k=cricket&m=124&n=%E2%80%AEরাফি"), "k=cricket&m=124&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.equal(share.normalize("result"), null);
  assert.equal(share.normalize("k=cricket&m=7"), null);
  assert.match(share.preview("k=cricket&m=124&n=রাফি").title, /^রাফির ম্যাচ/);
  assert.deepEqual(share.tally, ["ullash", "asha", "uttejona", "bhoy", "hotasha"]);
});
