import assert from "node:assert/strict";
import test from "node:test";
import { caption, cleanName, defaultDaknam, humanLine, isBlocked, nameFromTallyId, names, nextPick, nickname, parseShareHash, previewTitle, sets, shareHash, tallyId, tallyIds, MAX_NAME, type Daknam } from "../lib/daknam";
import { site } from "../content";
import { share } from "../share";

const rafi: Daknam = { order: 0, mood: 2, time: 1, set: "boy", pick: 1, name: "রাফি" };

test("every set has 27 names, all unique, so the sets are equal and no two cells share a name", () => {
  const all = sets.flatMap(set => names[set.id].flat());
  for (const set of sets) {
    assert.equal(names[set.id].length, 9, set.id);
    for (const row of names[set.id]) assert.equal(row.length, 3);
  }
  assert.equal(all.length, 81);
  assert.equal(new Set(all).size, 81);
  for (const name of all) assert.equal(name, name.normalize("NFC"), name);
});

test("no colour, body or teasing names made it into the list", () => {
  const all = sets.flatMap(set => names[set.id].flat()).join(" ");
  assert.doesNotMatch(all, /কালু|কালো|কালি|মোটু|মোটা|বুচি|খেঁদি|হাবলু|ভোম্বল|টাকলু|ধলা|ফর্সা|পাগলা|বোকা|পেঁচি|গাবলু/);
});

test("the three taps pick the cell and 'আরেকটা' walks its three names", () => {
  assert.equal(nickname(defaultDaknam), "পিচ্চি");
  assert.equal(nickname(rafi), "বাবুল");
  assert.equal(nextPick(0), 1);
  assert.equal(nextPick(2), 0);
  assert.equal(humanLine({ order: 2, mood: 1 }), "সবার ছোট, সবার কোলে কোলে।");
});

test("a card survives the share-link round trip", () => {
  assert.deepEqual(parseShareHash(shareHash(rafi)), rafi);
  assert.deepEqual(parseShareHash(shareHash(defaultDaknam)), defaultDaknam);
  assert.equal(shareHash(defaultDaknam), "#a=201&s=any");
  assert.deepEqual(parseShareHash("#a=021&s=any&n=রাফি"), { order: 0, mood: 2, time: 1, set: "any", pick: 0, name: "রাফি" });
});

test("hostile, empty or anchor hashes are ignored instead of crashing", () => {
  for (const hash of ["", "#result", "#balcony", "#a=", "#a=21", "#a=0211", "#a=301", "#a=-01", "#a=abc", "#s=boy", "#%E0%A4"]) assert.equal(parseShareHash(hash), null, hash);
  assert.deepEqual(parseShareHash("#a=111&s=evil&k=7"), { order: 1, mood: 1, time: 1, set: "any", pick: 0, name: "" });
  assert.equal(parseShareHash("#a=111&s=girl&k=2")?.pick, 2);
});

test("names keep Bangla, Latin, digits and spaces, are NFC and capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("<b>Joy</b>"), "bJoyb");
  assert.equal([...cleanName("ক".repeat(MAX_NAME + 8))].length, MAX_NAME);
  assert.equal(cleanName("রয়".normalize("NFD")), "রয়".normalize("NFC"));
  assert.equal(parseShareHash(`#a=000&n=${"x".repeat(500)}`)?.name.length, MAX_NAME);
});

test("abusive names never reach the card, ordinary names do", () => {
  for (const bad of ["Khanki", "f u c k", "খানকি", "রাফি বাল", "Haramjada"]) assert.equal(cleanName(bad), "", bad);
  for (const fine of ["Iqbal", "ইকবাল", "Bala", "রাফি", "নাদিয়া ইসলাম"]) assert.equal(isBlocked(fine), false, fine);
  assert.equal(parseShareHash("#a=000&n=khanki")?.name, "");
});

test("share previews are personal and never claim a meaning", () => {
  assert.equal(share.normalize("n=রাফি&a=021&s=boy&k=1"), shareHash(rafi).slice(1));
  assert.equal(share.normalize("hello"), null);
  assert.equal(share.preview(shareHash(rafi).slice(1)).title, "রাফির ডাকনাম হতো বাবুল — তোমারটা কী হতো?");
  assert.equal(previewTitle({ ...rafi, name: "" }), "এক বন্ধুর ডাকনাম হতো বাবুল — তোমারটা কী হতো?");
  assert.match(caption(rafi), /“বাবুল”/);
  assert.doesNotMatch(caption(rafi) + previewTitle(rafi), /অর্থ|মানে/);
});

test("the tally counts fixed nickname ids only, never names", () => {
  assert.equal(tallyIds.length, 81);
  assert.equal(new Set(tallyIds).size, 81);
  assert.ok(share.tally!.includes(tallyId(rafi)));
  assert.equal(tallyId(rafi), "boy-021");
  assert.equal(nameFromTallyId("boy-021"), "বাবুল");
  assert.equal(nameFromTallyId("rafi-000"), null);
  for (const id of tallyIds) assert.ok(nameFromTallyId(id));
});

test("SEO copy fits its limits", () => {
  assert.ok([...site.title].length <= 45, site.title);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 5);
});
