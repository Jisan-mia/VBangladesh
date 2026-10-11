import assert from "node:assert/strict";
import test from "node:test";
import { cleanName, drawLetter, humanLine, letters, letterWeights, parseShareHash, previewTitle, scores, shareHash, turnOf, MAX_NAME, MAX_ROUNDS, type Game } from "../lib/game";
import { share } from "../share";

const sample: Game = { teams: ["দল আম্মু", "দল ভাইয়া"], rounds: [{ letter: "ক", team: 0 }, { letter: "ম", team: 1 }, { letter: "ঝ", team: null }, { letter: "আ", team: 0 }], occasion: "eid" };

test("no impossible letter is ever in the pot, and every letter is one NFC code point", () => {
  for (const banned of ["ঙ", "ঞ", "ং", "ঃ", "ৎ", "ণ", "ঋ", "ড়", "ঢ়", "য়"]) assert.ok(!letters.includes(banned), banned);
  for (const letter of letters) { assert.equal([...letter].length, 1); assert.equal(letter.normalize("NFC"), letter); }
});

test("draws follow the weights and never repeat a recent letter", () => {
  assert.equal(drawLetter([], () => 0), letters[0]);
  assert.equal(drawLetter([], () => 0.999999), letters.at(-1));
  const counts: Record<string, number> = {};
  let recent: string[] = [];
  for (let index = 0; index < 6000; index++) {
    const letter = drawLetter(recent);
    assert.ok(!recent.slice(-4).includes(letter));
    counts[letter] = (counts[letter] ?? 0) + 1;
    recent = [...recent, letter].slice(-4);
  }
  // An easy letter (weight 3) comes up clearly more often than a hard one (weight 1).
  assert.equal(letterWeights["ক"], 3); assert.equal(letterWeights["ঠ"], 1);
  assert.ok(counts["ক"] > counts["ঠ"] * 1.8);
});

test("scores and turns come from the rounds", () => {
  assert.deepEqual(scores(sample.rounds), [2, 1]);
  assert.equal(turnOf([]), 0);
  assert.equal(turnOf(sample.rounds.slice(0, 3)), 1);
});

test("a game survives the share-link round trip", () => {
  assert.deepEqual(parseShareHash(shareHash(sample)), sample);
  const fresh: Game = { teams: ["দল ক", "দল খ"], rounds: [], occasion: "aj" };
  assert.deepEqual(parseShareHash(shareHash(fresh)), fresh);
  assert.ok(!shareHash(fresh).includes("o="));
  // The raw (not percent-encoded) Bangla form opens too.
  assert.deepEqual(parseShareHash("#t=দল আম্মু,দল ভাইয়া&r=ক1ম2ঝ0আ1&o=eid"), sample);
});

test("hostile, broken or impossible links are refused instead of crashing", () => {
  for (const hash of ["", "#result", "#t=a,b", "#r=ক1", "#t=a&r=ক1", "#t=a,b,c&r=ক1", "#t=a,b&r=ক", "#t=a,b&r=ক3", "#t=a,b&r=ঙ1", "#t=a,b&r=11",
    "#t=a,b&r=ক1&o=mars", `#t=a,b&r=${"ক1".repeat(MAX_ROUNDS + 1)}`, `#t=${"x".repeat(4000)},b&r=`, "#t=a,b&r=%E0%A6"]) {
    assert.equal(parseShareHash(hash), null, hash.slice(0, 60));
  }
});

test("names are cleaned, NFC-normalised, capped, and fall back to the default teams", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক,খ"), "কখ");
  assert.equal(cleanName("ক".repeat(50)).length, MAX_NAME);
  // A decomposed য় (য + nukta) is stored composed.
  assert.equal(cleanName("দল মায়"), "দল মায়".normalize("NFC"));
  assert.deepEqual(parseShareHash("#t=,%20&r=")?.teams, ["দল ক", "দল খ"]);
  assert.equal(parseShareHash(shareHash({ ...sample, teams: ["ক".repeat(40), "খ"] }))?.teams[0].length, MAX_NAME);
});

test("the human line follows the score", () => {
  assert.equal(humanLine({ ...sample, rounds: [] }), "প্রথম অক্ষরটা তোলো, গলা খোলো!");
  assert.equal(humanLine(sample), "এক গানের ব্যবধান! আরেকবার হয়ে যাক।");
  assert.match(humanLine({ ...sample, rounds: [{ letter: "ক", team: 1 }, { letter: "ম", team: 0 }] }), /সমান সমান/);
  assert.match(humanLine({ ...sample, rounds: Array.from({ length: 6 }, () => ({ letter: "ক", team: 1 as const })) }), /দল ভাইয়া/);
});

test("the share module normalizes links and gives a personal preview", () => {
  const state = shareHash(sample).slice(1);
  assert.equal(share.normalize(state), state);
  assert.equal(share.normalize("t=a,b&r=ঙ1"), null);
  assert.equal(share.preview(state).title, previewTitle(sample));
  assert.match(share.preview(state).title, /ঈদের রাতের গানের কলিতে জিতল দল আম্মু \(২—১\)/);
  assert.equal(share.tally, undefined);
});
