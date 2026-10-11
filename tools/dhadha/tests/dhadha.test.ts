import assert from "node:assert/strict";
import test from "node:test";
import { share } from "../share";
import { addPick, captionFor, chipOrder, cleanName, dhakaDate, oldestDate, parseShareHash, readPlayed, riddleFor, riddles, shareHash, shiftDate, tallyItems, triesOf, MAX_NAME_LENGTH, type Pick } from "../lib/dhadha";

const TODAY = "2026-10-11";

test("the bank is well formed: unique ids, two decoys each, no chip repeats the answer", () => {
  assert.equal(new Set(riddles.map(riddle => riddle.id)).size, riddles.length);
  assert.ok(riddles.length >= 60);
  for (const riddle of riddles) {
    assert.match(riddle.id, /^[a-z-]+$/);
    assert.equal(new Set([riddle.answer, ...riddle.decoys]).size, 3, riddle.id);
    assert.ok(riddle.lines.length >= 2 && riddle.src.length >= 1 && riddle.why, riddle.id);
  }
});

test("the day changes at midnight in Dhaka, not on the phone's clock", () => {
  assert.equal(dhakaDate(new Date("2026-10-11T17:59:00Z")), "2026-10-11");
  assert.equal(dhakaDate(new Date("2026-10-11T18:00:00Z")), "2026-10-12");
});

test("the same day always gets the same riddle", () => {
  assert.equal(riddleFor(TODAY).id, riddleFor(TODAY).id);
  assert.notEqual(riddleFor(TODAY).id, riddleFor(shiftDate(TODAY, 1)).id);
});

test("a full round deals every riddle once, and rounds never repeat a riddle on back-to-back days", () => {
  const days = (start: string, count: number) => Array.from({ length: count }, (_, index) => riddleFor(shiftDate(start, index)).id);
  // Day numbers divisible by the bank size start a round.
  const roundStart = new Date(Math.ceil(Date.parse(`${TODAY}T00:00:00Z`) / 86_400_000 / riddles.length) * riddles.length * 86_400_000).toISOString().slice(0, 10);
  assert.equal(new Set(days(roundStart, riddles.length)).size, riddles.length);
  const year = days("2026-01-01", 730);
  year.slice(1).forEach((id, index) => assert.notEqual(id, year[index], `repeat on day ${index + 1}`));
});

test("a #d= link opens that day's riddle", () => {
  const past = "2026-10-05";
  assert.deepEqual(parseShareHash(`#d=${past}`, TODAY), { date: past, id: riddleFor(past).id, tries: null, name: "" });
});

test("a future date never shows tomorrow's riddle early", () => {
  const shared = parseShareHash(`#d=${shiftDate(TODAY, 1)}&r=${riddleFor(shiftDate(TODAY, 1)).id}&t=1&n=রাফি`, TODAY);
  assert.deepEqual(shared, { date: TODAY, id: riddleFor(TODAY).id, tries: null, name: "" });
});

test("a result link round-trips, NFC-normalised name included", () => {
  const name = "রায়হান".normalize("NFD");
  const original = { date: "2026-10-09", id: "dheki", tries: 2 as const, name };
  assert.deepEqual(parseShareHash(shareHash(original), TODAY), { ...original, name: name.normalize("NFC") });
});

test("hostile or broken links are ignored or cleaned instead of crashing", () => {
  assert.equal(parseShareHash("", TODAY), null);
  assert.equal(parseShareHash("#d=2026-02-30", TODAY), null);
  assert.equal(parseShareHash("#d=1999-01-01", TODAY), null);
  assert.equal(parseShareHash("#result", TODAY), null);
  const odd = parseShareHash("#d=2026-10-01&r=../../etc&t=9&n=x", TODAY)!;
  assert.equal(odd.id, riddleFor("2026-10-01").id);
  assert.equal(odd.tries, null);
  assert.equal(odd.name, "");
});

test("names lose control and direction-override characters and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
});

test("a wrong guess gets one more try; two wrong reveal the answer", () => {
  const play = (...picks: Pick[]) => picks.reduce<Pick[]>((list, pick) => addPick(list, pick), []);
  assert.equal(triesOf(play(0)), 1);
  assert.equal(triesOf(play(2, 0)), 2);
  assert.equal(triesOf(play(1, 2)), 0);
  assert.equal(triesOf(play(1)), null);
  assert.deepEqual(play(1, 1), [1]);
  assert.deepEqual(play(0, 1), [0]);
});

test("chip order is fixed per riddle and holds all three chips", () => {
  for (const riddle of riddles) assert.deepEqual([...chipOrder(riddle)].sort(), [0, 1, 2]);
  assert.deepEqual(chipOrder(riddles[0]), chipOrder(riddles[0]));
  assert.ok(new Set(riddles.map(riddle => chipOrder(riddle).indexOf(0))).size === 3, "the answer moves between chip slots");
});

test("nothing shared ever carries the answer: preview, caption or link", () => {
  for (const riddle of riddles.slice(0, 60)) {
    for (const tries of [null, 0, 1, 2] as const) {
      const shared = { date: "2026-10-09", id: riddle.id, tries, name: "রাফি" };
      const state = shareHash(shared).slice(1);
      const { title, description } = share.preview(share.normalize(state)!);
      for (const text of [title, description, captionFor(shared, TODAY), decodeURIComponent(state)]) {
        assert.ok(!text.includes(riddle.answer), `${riddle.id}: "${text}"`);
      }
    }
  }
});

test("the preview is personal when a result is shared", () => {
  const state = shareHash({ date: "2026-10-09", id: "dheki", tries: 1, name: "রাফি" }).slice(1);
  assert.equal(share.preview(state).title, "রাফি ৯ অক্টোবরের ধাঁধা প্রথম চেষ্টায় পেরেছে। তুমি পারবে?");
});

test("tally ids cover only fixed riddle ids, and every finished riddle is resent", () => {
  const played = readPlayed({ "2026-10-10": { id: "dheki", picks: [0] }, "2026-10-09": { id: "dim", picks: [1, 2] }, "2026-10-08": { id: "tara", picks: [1] }, bad: { id: "x", picks: [] }, "2026-10-07": { id: "jama", picks: [5] } });
  assert.deepEqual(Object.keys(played).sort(), ["2026-10-08", "2026-10-09", "2026-10-10"]);
  assert.deepEqual(tallyItems(played).sort(), ["ok:dheki", "seen:dheki", "seen:dim"]);
  for (const item of tallyItems(played)) assert.ok(share.tally!.includes(item));
});

test("the day buttons reach back one full round", () => {
  assert.equal(oldestDate(TODAY), shiftDate(TODAY, -(riddles.length - 1)));
});
