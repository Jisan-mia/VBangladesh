import assert from "node:assert/strict";
import test from "node:test";
import { bn, cleanTitle, commonLine, defaultSlots, parseShareHash, placeSong, seasonLabel, seasonOf, shareHash, songs, tallyIds, tapeLine, MAX_TITLE_LENGTH, SLOTS, type Tape } from "../lib/cassette";
import { share } from "../share";
import { site } from "../content";

const tape: Tape = { slots: [...defaultSlots], title: "রাফির মিক্সটেপ", color: 2, when: "sheet-2026" };

test("the default tape has ten different songs from the list", () => {
  assert.equal(defaultSlots.length, SLOTS);
  assert.equal(new Set(defaultSlots).size, SLOTS);
  assert.ok(defaultSlots.every(song => song >= 0 && song < songs.length));
});

test("every song is unique and fully credited, so link positions stay meaningful", () => {
  assert.equal(new Set(songs.map(song => `${song.title}|${song.by}`)).size, songs.length);
  for (const song of songs) {
    assert.ok(song.title.trim() && song.by.trim(), "title and credit");
    assert.equal(song.title, song.title.normalize("NFC"));
    assert.equal(song.by, song.by.normalize("NFC"));
  }
});

test("a tape survives the link round trip", () => {
  assert.deepEqual(parseShareHash(shareHash(tape)), tape);
  const last = { ...tape, slots: [songs.length - 1, ...defaultSlots.slice(1)] };
  assert.deepEqual(parseShareHash(shareHash(last))?.slots, last.slots);
});

test("placing a song already on the tape swaps the two slots", () => {
  const slots = [...defaultSlots];
  const next = placeSong(slots, 0, slots[9]);
  assert.equal(next[0], slots[9]);
  assert.equal(next[9], slots[0]);
  assert.equal(new Set(next).size, SLOTS);
  assert.throws(() => placeSong(slots, 0, songs.length), RangeError);
});

test("hostile or broken links are refused instead of crashing", () => {
  assert.equal(parseShareHash(""), null);
  assert.equal(parseShareHash("#s=%%%"), null);
  assert.equal(parseShareHash("#s=1,2,3"), null);
  assert.equal(parseShareHash("#s=1,1,2,3,4,5,6,7,8,9"), null);
  assert.equal(parseShareHash(`#s=${[...defaultSlots.slice(1), 999].join(",")}`), null);
  assert.equal(parseShareHash("#s=-1,2,3,4,5,6,7,8,9,0"), null);
  assert.equal(parseShareHash(`#s=${"1,".repeat(40)}1`), null);
  const odd = parseShareHash(`#s=${defaultSlots.join(",")}&c=99&w=summer-1999`);
  assert.equal(odd?.color, 0);
  assert.equal(odd?.when, "");
});

test("the tape's name is NFC, one line, free of direction tricks and capped at 20", () => {
  assert.equal(cleanTitle("  রাফির‮\nমিক্সটেপ  "), "রাফির মিক্সটেপ");
  assert.equal(Array.from(cleanTitle("ক".repeat(40))).length, MAX_TITLE_LENGTH);
  assert.equal(cleanTitle("কে়"), "কে়".normalize("NFC"));
  const parsed = parseShareHash(`#s=${defaultSlots.join(",")}&t=${encodeURIComponent("ক".repeat(60))}`);
  assert.equal(Array.from(parsed!.title).length, MAX_TITLE_LENGTH);
});

test("seasons follow the revised Bangladesh calendar", () => {
  assert.equal(seasonOf(new Date(2026, 3, 13)), "boshonto-2026");
  assert.equal(seasonOf(new Date(2026, 3, 14)), "grishmo-2026");
  assert.equal(seasonOf(new Date(2026, 5, 15)), "borsha-2026");
  assert.equal(seasonOf(new Date(2026, 9, 16)), "shorot-2026");
  assert.equal(seasonOf(new Date(2026, 9, 17)), "hemonto-2026");
  assert.equal(seasonOf(new Date(2026, 11, 16)), "sheet-2026");
  assert.equal(seasonOf(new Date(2027, 1, 13)), "sheet-2027");
  assert.equal(seasonLabel("sheet-2026"), "শীত ২০২৬");
  assert.equal(seasonLabel("winter-2026"), "");
});

test("a mostly-nineties tape gets the rewind line", () => {
  const nineties = songs.map((song, index) => ({ song, index })).filter(({ song }) => song.era === "90").map(({ index }) => index);
  const rest = songs.map((_, index) => index).filter(index => !nineties.includes(index));
  const slots = [...nineties.slice(0, 5), ...rest.slice(0, 5)];
  assert.equal(tapeLine(slots), "তোমার ক্যাসেট এখনো রিওয়াইন্ড হয়।");
});

test("a friend's tape lines up next to mine", () => {
  const friend: Tape = { ...tape, slots: [defaultSlots[0], defaultSlots[1], ...songs.map((_, index) => index).filter(index => !defaultSlots.includes(index)).slice(0, 8)] };
  assert.match(commonLine([...defaultSlots], friend), /^দুজনেরই আছে: /);
  assert.equal(commonLine([...defaultSlots], { ...tape }), "“রাফির মিক্সটেপ”-এর সাথে দশটাই মিলে গেছে!");
  assert.equal(commonLine([...defaultSlots], null), "");
});

test("the share hook normalizes, previews by the tape's name, and only counts song ids", () => {
  const state = shareHash(tape).slice(1);
  assert.equal(share.normalize(state), state);
  assert.equal(share.normalize("s=1,2"), null);
  assert.match(share.preview(state).title, /^রাফির মিক্সটেপ — /);
  assert.deepEqual(share.tally, tallyIds);
  assert.ok(share.tally!.every(id => /^s\d+$/.test(id)));
});

test("SEO text stays within its limits", () => {
  assert.ok(Array.from(site.title).length <= 45, site.title);
  const length = Array.from(site.description).length;
  assert.ok(length >= 120 && length <= 160, `description is ${length}`);
  assert.ok(site.faq.length >= 5);
  assert.ok(site.lead.includes(`${bn(songs.length)}টা`), "the lead's song count matches the list");
});
