import assert from "node:assert/strict";
import test from "node:test";
import { art, artSvg, figureSvg } from "../lib/art";
import { cleanName, createCard, fillSlots, items, packLine, packs, parseShareHash, shareHash, swapItem, swapOptions, tallyIds, tallyVote, CLASSIC, GRID, MAX_NAME_LENGTH, type ItemId } from "../lib/pack";
import { share } from "../share";

test("six packs of twelve distinct, drawn items; every item belongs to a pack", () => {
  assert.deepEqual(packs.map(pack => pack.id), ["varsity", "chakri", "probashi", "baba-ma", "eid", "brishti"]);
  for (const pack of packs) {
    assert.equal(pack.items.length, 12, pack.id);
    assert.equal(new Set(pack.items).size, 12, pack.id);
  }
  const used = new Set(packs.flatMap(pack => pack.items));
  for (const id of Object.keys(items) as ItemId[]) {
    assert.ok(used.has(id), `${id} is in no pack`);
    assert.ok(art[id], `${id} has no drawing`);
    // The card loads drawings as data-URL images: a duplicated attribute would make the whole image fail.
    assert.doesNotMatch(artSvg(id), /\s(stroke-width|fill|stroke)="[^"]*"[^>]*\s\1="/, id);
  }
  assert.doesNotMatch(figureSvg("#2f5bd3", "#1c3a91", "smile"), /NaN|undefined/);
});

test("the first screen is a full varsity pack of six", () => {
  assert.deepEqual(fillSlots("varsity").slice(0, CLASSIC), ["khata", "canteen-cha", "photocopy", "alarm-3am", "one-strap-bag", "singara"]);
  assert.equal(fillSlots("varsity").length, GRID);
});

test("swapping never duplicates: an item already in the pack trades places", () => {
  const slots = fillSlots("varsity");
  assert.deepEqual(swapItem(slots, 0, "charger").slice(0, 2), ["charger", "canteen-cha"]);
  const traded = swapItem(slots, 0, "calculator");
  assert.equal(traded[0], "calculator");
  assert.equal(traded[6], "khata");
  assert.equal(new Set(traded).size, GRID);
  assert.throws(() => swapItem(slots, 9, "charger"), RangeError);
});

test("the swap list is the pack's items not on show", () => {
  const visible = fillSlots("eid").slice(0, CLASSIC);
  assert.equal(swapOptions("eid", visible).length, 6);
  assert.equal(swapOptions("eid", fillSlots("eid")).length, 3);
  assert.ok(swapOptions("eid", visible).every(id => !visible.includes(id)));
});

test("links round-trip in both layouts, keeping order", () => {
  const classic = { pack: "probashi" as const, items: swapItem(fillSlots("probashi"), 2, "flag").slice(0, CLASSIC), name: "রাফি" };
  assert.deepEqual(parseShareHash(shareHash(classic)), classic);
  const grid = { pack: "brishti" as const, items: [...fillSlots("brishti")].reverse(), name: "" };
  assert.deepEqual(parseShareHash(shareHash(grid)), grid);
  assert.equal(shareHash({ pack: "varsity", items: fillSlots("varsity").slice(0, CLASSIC), name: "" }), "#p=varsity&i=0%2C1%2C2%2C3%2C4%2C5");
  assert.deepEqual(parseShareHash("#p=varsity&i=3,8,11,0,1,2")?.items, ["alarm-3am", "pendrive", "charger", "khata", "canteen-cha", "photocopy"]);
});

test("hostile or malformed links are refused instead of crashing", () => {
  for (const hash of ["", "#", "#p=x&i=0,1,2,3,4,5", "#p=varsity", "#p=varsity&i=0,1,2,3,4", "#p=varsity&i=0,1,2,3,4,5,6", "#p=varsity&i=0,1,2,3,4,12", "#p=varsity&i=0,0,1,2,3,4", "#p=varsity&i=-1,1,2,3,4,5", "#p=varsity&i=0,1,2,3,4,5e0", "#p=varsity&i=%%%", "#p=__proto__&i=0,1,2,3,4,5"]) {
    assert.equal(parseShareHash(hash), null, hash);
  }
  assert.equal(share.normalize("p=varsity&i=<script>"), null);
});

test("names are NFC, lose control, bidi and angle characters, and are capped at 20", () => {
  assert.equal(cleanName("  রিমা‮  <b>আক্তার\n"), "রিমা bআক্তার");
  assert.equal([...cleanName("ক".repeat(40))].length, MAX_NAME_LENGTH);
  assert.equal(cleanName("ময়না"), "ময়না".normalize("NFC"));
  // A cut must not leave a dangling hasanta.
  assert.equal(cleanName("ক".repeat(19) + "্ষ"), "ক".repeat(19));
  const shared = parseShareHash("#p=eid&i=0,1,2,3,4,5&n=" + encodeURIComponent("‮তানিয়া"));
  assert.equal(shared?.name, "তানিয়া".normalize("NFC"));
});

test("the human line follows what is in the pack", () => {
  assert.equal(packLine("varsity", fillSlots("varsity").slice(0, CLASSIC)), "খাতা বন্ধুর, চা বাকিতে — ভার্সিটি এভাবেই চলে।");
  assert.equal(packLine("varsity", ["alarm-3am", "photocopy"]), "পুরো সেমিস্টারের পড়া এক রাতেই শেষ হয়।");
  assert.equal(packLine("varsity", ["photocopy"]), "ক্লাস যতই থাকুক, আড্ডাটা কখনো মিস হয় না।");
  for (const pack of packs) for (const line of pack.lines) for (const id of line.when) assert.ok((pack.items as readonly string[]).includes(id), `${pack.id}: ${id}`);
});

test("the card is personal and compares with a friend on the same pack", () => {
  const mine = { pack: "varsity" as const, items: fillSlots("varsity").slice(0, CLASSIC), name: "রাফি" };
  assert.equal(createCard(mine).title, "রাফির স্টার্টার প্যাক");
  assert.equal(createCard({ ...mine, name: "" }).title, "আমার স্টার্টার প্যাক");
  const friend = { pack: "varsity" as const, items: swapItem(swapItem(fillSlots("varsity"), 0, "charger"), 1, "pendrive").slice(0, CLASSIC), name: "তানিয়া" };
  assert.equal(createCard(mine, friend).match, "তানিয়ার প্যাকেটের সাথে ৪টা মিলে গেছে");
  assert.equal(createCard(mine, { ...friend, pack: "eid", items: fillSlots("eid").slice(0, CLASSIC) }).match, "");
});

test("share preview is personal; the tally only counts fixed pack and pack.item ids", () => {
  const state = share.normalize("p=chakri&i=0,1,2,3,4,5&n=রাফি")!;
  assert.equal(share.preview(state).title, "রাফির স্টার্টার প্যাক: নতুন চাকরি — তোমারটায় কী থাকত?");
  assert.equal(tallyIds.length, packs.length * 13);
  const vote = tallyVote({ pack: "chakri", items: fillSlots("chakri").slice(0, CLASSIC) });
  assert.deepEqual(vote.slice(0, 2), ["chakri", "chakri.tiffin"]);
  assert.ok(vote.every(id => share.tally!.includes(id)));
  assert.ok(share.tally!.every(id => /^[a-z-]+(\.[a-z0-9-]+)?$/.test(id)));
});
