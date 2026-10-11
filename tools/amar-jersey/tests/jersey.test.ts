import assert from "node:assert/strict";
import test from "node:test";
import { caption, cleanName, defaultJersey, humanLine, isBlocked, kits, numberText, parseNumber, parseShareHash, previewTitle, shareHash, tallyIds, tallyItems, MAX_NAME, type Jersey } from "../lib/jersey";
import { share } from "../share";

const rafi: Jersey = { name: "রাফি", number: 10, kit: "sky", sport: "f", digits: "en", from: "" };

test("kit ids are unique so old links keep their colour", () => {
  assert.equal(new Set(kits.map(kit => kit.id)).size, kits.length);
});

test("kits are named by colour, never by a country, federation or brand", () => {
  for (const kit of kits) assert.doesNotMatch(kit.label + kit.id, /আর্জেন্টিনা|ব্রাজিল|বাংলাদেশ|argentin|brazil|bangladesh|nike|adidas|puma/i);
});

test("a jersey survives the share-link round trip, gift giver included", () => {
  assert.deepEqual(parseShareHash(shareHash(rafi)), rafi);
  const gift = { ...rafi, name: "Nadia Islam", number: 0, kit: "black", sport: "c", digits: "bn", from: "তানিয়া" } as const;
  assert.deepEqual(parseShareHash(shareHash(gift)), gift);
  assert.equal(shareHash(rafi), "#n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF&no=10&k=sky&s=f&d=en");
});

test("hostile, empty or anchor hashes are ignored instead of crashing", () => {
  for (const hash of ["", "#result", "#stall", "#no=10", "#k=sky", "#k=argentina&no=10", "#k=sky&no=100", "#k=sky&no=-1", "#k=sky&no=1e1", "#k=sky&no=%%%", "#%E0%A4"]) assert.equal(parseShareHash(hash), null, hash);
  assert.deepEqual(parseShareHash("#k=red&no=7&s=evil&d=evil"), { ...defaultJersey, kit: "red", number: 7 });
});

test("names keep Bangla, Latin, digits and spaces, are NFC and capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("<b>Joy</b>"), "bJoyb");
  assert.equal(cleanName("Rafi😀 #10!"), "Rafi 10");
  assert.equal([...cleanName("ক".repeat(MAX_NAME + 8))].length, MAX_NAME);
  // NFD input (decomposed য়) comes back composed.
  assert.equal(cleanName("রয়".normalize("NFD")), "রয়".normalize("NFC"));
  assert.equal(parseShareHash(`#n=${"x".repeat(500)}&no=1&k=red`)?.name.length, MAX_NAME);
});

test("abusive names never reach the card, but ordinary names do", () => {
  for (const bad of ["Khanki", "f u c k", "F.U.C.K", "খানকি", "বোকাচোদা", "bal", "রাফি বাল", "Haramjada"]) {
    assert.ok(isBlocked(bad), bad);
    assert.equal(cleanName(bad), "", bad);
  }
  for (const fine of ["Iqbal", "ইকবাল", "Dhoni", "ধোনি", "Chowdhury", "Ashit", "Bala", "রাফি", "MESSI", "Sakib 75"]) assert.equal(isBlocked(fine), false, fine);
  assert.equal(parseShareHash("#n=khanki&no=1&k=red&f=harami")?.name, "");
});

test("numbers take Bangla or English digits, 0 to 99 only", () => {
  assert.equal(parseNumber("১০"), 10);
  assert.equal(parseNumber("07"), 7);
  assert.equal(parseNumber("0"), 0);
  for (const bad of ["", "100", "-1", "1.5", "এক", " "]) assert.equal(parseNumber(bad), null, bad);
  assert.equal(numberText({ number: 23, digits: "bn" }), "২৩");
  assert.equal(numberText({ number: 23, digits: "en" }), "23");
});

test("the human line follows the number, never a player", () => {
  assert.equal(humanLine(10), "দশ নম্বর মানে দায়িত্ব।");
  assert.equal(humanLine(1), "সবার আগে আমি, সবার শেষেও আমি।");
  assert.equal(humanLine(44), "জোড়া অঙ্ক, জোড়া কপাল।");
  assert.equal(humanLine(75), "নম্বরটা আমার, গল্পটাও আমার।");
  for (let number = 0; number <= 99; number++) assert.ok(humanLine(number).length > 5);
});

test("share previews are personal; gifts say who made it", () => {
  assert.equal(share.normalize("k=sky&no=10&n=রাফি&s=f&d=en"), shareHash(rafi).slice(1));
  assert.equal(share.normalize("hello"), null);
  assert.equal(share.preview(shareHash(rafi).slice(1)).title, "রাফির জার্সি, 10 নম্বর। তোমারটা বানাও");
  assert.equal(share.preview(shareHash({ ...rafi, from: "তানিয়া" }).slice(1)).title, "তানিয়া তোমার জন্য একটা জার্সি বানিয়েছে");
  assert.equal(previewTitle({ ...rafi, name: "" }), "এক বন্ধুর জার্সি, 10 নম্বর। তোমারটা বানাও");
  assert.match(caption({ ...rafi, from: "তানিয়া" }), /^রাফি, তোমার জন্য/);
});

test("the tally counts only fixed kit and number ids, never names", () => {
  assert.equal(tallyIds.length, kits.length + 100);
  assert.deepEqual(tallyItems(rafi), ["sky", "no-10"]);
  for (const item of tallyItems(rafi)) assert.ok(share.tally!.includes(item));
});
