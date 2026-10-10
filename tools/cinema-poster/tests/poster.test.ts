import assert from "node:assert/strict";
import test from "node:test";
import { cleanName, createPoster, genres, isBlocked, nextTitle, parseShareHash, previewTitle, shareHash, DEFAULT_STATE, MAX_NAME_LENGTH } from "../lib/poster";

test("a poster survives the share-link round trip", () => {
  const state = { genre: "action", title: 7, name: "রাফি", costar: "মিম" } as const;
  assert.deepEqual(parseShareHash(shareHash(state)), state);
});

test("the default poster round-trips without names", () => {
  assert.deepEqual(parseShareHash(shareHash(DEFAULT_STATE)), DEFAULT_STATE);
  assert.equal(shareHash(DEFAULT_STATE), "#g=prem&t=0");
});

test("hostile or foreign hashes are rejected or clamped, never thrown", () => {
  assert.equal(parseShareHash(""), null);
  assert.equal(parseShareHash("#make"), null);
  assert.equal(parseShareHash("#g=horror"), null);
  assert.equal(parseShareHash("#g=prem&t=%%%")?.title, 0);
  assert.equal(parseShareHash("#g=prem&t=999")?.title, 0);
  assert.equal(parseShareHash("#g=prem&t=-1")?.title, 0);
  assert.equal(parseShareHash("#g=prem&t=1.5")?.title, 0);
  assert.equal(parseShareHash("#g=prem&c=মিম")?.costar, "", "a co-star needs a lead");
});

test("names are NFC, lose control and bidi characters, and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(Array.from(cleanName("ক".repeat(MAX_NAME_LENGTH + 10))).length, MAX_NAME_LENGTH);
  assert.equal(cleanName("কা"), "কা");
  assert.equal(cleanName("কো"), "কো".normalize("NFC"));
  assert.equal(cleanName("রাফি‌ক"), "রাফি‌ক", "ZWNJ stays for shaping");
});

test("abusive names never reach the poster or the link", () => {
  assert.ok(isBlocked("হারামজাদা"));
  assert.ok(isBlocked("F.u.c.k"));
  assert.ok(!isBlocked("বালতি"), "a word that only starts like a slur is fine");
  assert.equal(cleanName("khanki"), "");
  assert.equal(shareHash({ genre: "prem", title: 0, name: "রাফি", costar: "magi" }), "#g=prem&t=0&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
});

test("the human line follows the cast", () => {
  assert.equal(createPoster({ genre: "family", title: 0, name: "", costar: "" }).line, "সপরিবারে দেখার মতো ছবি।");
  assert.equal(createPoster({ genre: "prem", title: 0, name: "রাফি", costar: "মিম" }).line, "রাফি-মিম জুটি: এক রিকশায় দুই হৃদয়!");
  assert.equal(createPoster({ genre: "prem", title: 0, name: "রাফি", costar: "রাফি" }).costar, "");
});

test("the title shuffle walks the whole bank and wraps", () => {
  let state = { ...DEFAULT_STATE };
  const seen = new Set<string>();
  for (const _ of genres[0].titles) { seen.add(createPoster(state).title); state = nextTitle(state); }
  assert.equal(seen.size, genres[0].titles.length);
  assert.equal(state.title, 0);
});

test("every genre has a full, unique title bank", () => {
  const all = genres.flatMap(genre => genre.titles);
  assert.equal(new Set(all).size, all.length);
  for (const genre of genres) assert.ok(genre.titles.length >= 10, genre.id);
});

test("the link preview is personal", () => {
  assert.equal(previewTitle({ genre: "prem", title: 0, name: "রাফি", costar: "" }), "আসিতেছে! রাফির নতুন ছবি “লোডশেডিংয়ে প্রেম”");
  assert.equal(previewTitle({ genre: "comedy", title: 0, name: "", costar: "" }), "আসিতেছে! নতুন ছবি “ওয়াইফাই পাসওয়ার্ড কত?”");
});
