import assert from "node:assert/strict";
import test from "node:test";
import { byNearest, cleanMessage, cleanName, createCard, messageOf, nextDate, occasions, parseShareHash, previewTitle, shareHash, MAX_MESSAGE_LENGTH, MAX_NAME_LENGTH, type Wish } from "../lib/greeting";
import { share } from "../share";

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d);

test("a preset card survives the link round trip", () => {
  const wish: Wish = { occasion: "bijoya", preset: 2, text: null, name: "রাফি ও পরিবার" };
  assert.deepEqual(parseShareHash(shareHash(wish)), wish);
});

test("a hand-written card survives the link round trip", () => {
  const wish: Wish = { occasion: "eid", preset: 0, text: "সবাই ভালো থেকো, ঈদ মোবারক!", name: "Nadia" };
  assert.deepEqual(parseShareHash(shareHash(wish)), wish);
  assert.equal(messageOf(wish), "সবাই ভালো থেকো, ঈদ মোবারক!");
});

test("hostile or unrelated hashes are ignored instead of crashing", () => {
  for (const hash of ["", "#", "#tool", "#send", "#o=evil", "#o=__proto__", "#o=constructor&p=1", "#m=1"]) assert.equal(parseShareHash(hash), null, hash);
  for (const p of ["99", "-1", "1.5", "abc", "1e2", ""]) assert.equal(parseShareHash(`#o=bijoya&p=${p}`)?.preset, 0, p);
  // broken percent bytes decode to U+FFFD rather than throwing
  assert.equal(parseShareHash("#o=eid&t=%%%E0%A")?.text, "%%�%A");
});

test("names and messages lose control and direction-override characters and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  assert.equal(Array.from(cleanMessage("ঈ".repeat(MAX_MESSAGE_LENGTH * 3))).length, MAX_MESSAGE_LENGTH);
  // an emoji at the cut is dropped whole, never split into half a surrogate pair
  assert.equal(cleanMessage("ক".repeat(MAX_MESSAGE_LENGTH - 1) + "🌙🌙"), "ক".repeat(MAX_MESSAGE_LENGTH - 1) + "🌙");
  const long = parseShareHash(`#o=eid&n=${"ন".repeat(500)}&t=${"ক".repeat(5000)}`)!;
  assert.equal(long.name.length, MAX_NAME_LENGTH);
  assert.equal(long.text!.length, MAX_MESSAGE_LENGTH);
});

test("text is NFC-normalized so the same name always makes the same link", () => {
  assert.equal(cleanName("শোো".slice(0, 1) + "ো"), "শো");
  assert.equal(shareHash({ occasion: "eid", preset: 0, text: null, name: "শো" }), shareHash({ occasion: "eid", preset: 0, text: null, name: "শো" }));
});

test("every occasion has 3–4 presets that fit the card, and ids are unique", () => {
  assert.equal(new Set(occasions.map(occasion => occasion.id)).size, occasions.length);
  for (const occasion of occasions) {
    assert.ok(occasion.presets.length >= 3 && occasion.presets.length <= 4, occasion.id);
    for (const text of occasion.presets) assert.ok(Array.from(text).length <= MAX_MESSAGE_LENGTH, text);
  }
});

test("একুশে never says শুভ: it is a day of remembrance", () => {
  const ekushe = occasions.find(occasion => occasion.id === "ekushe")!;
  const words = [ekushe.title, ekushe.chip, ekushe.subtitle(2027), ekushe.line, ekushe.caption, ekushe.gift, ...ekushe.presets, previewTitle({ occasion: "ekushe", preset: 0, text: null, name: "রাফি" })];
  for (const text of words) assert.ok(!text.includes("শুভ"), text);
});

test("the nearest occasion is the default, and the picker follows the calendar", () => {
  assert.deepEqual(byNearest(day(2026, 10, 10)).map(occasion => occasion.id), ["bijoya", "nobanno", "bijoy", "ekushe", "eid", "noboborsho"]);
  // বিজয়া wishes keep going for a few days after দশমী
  assert.equal(byNearest(day(2026, 10, 26))[0].id, "bijoya");
  assert.equal(byNearest(day(2026, 10, 30))[0].id, "nobanno");
  assert.equal(byNearest(day(2026, 12, 20))[0].id, "bijoy");
  assert.equal(byNearest(day(2027, 1, 5))[0].id, "ekushe");
  assert.equal(byNearest(day(2027, 3, 1))[0].id, "eid");
});

test("an occasion whose date table ran out sorts last instead of breaking", () => {
  const eid = occasions.find(occasion => occasion.id === "eid")!;
  assert.equal(nextDate(eid, day(2031, 1, 1)), null);
  assert.equal(byNearest(day(2031, 1, 1)).at(-1)!.id, "eid");
});

test("card lines count the right year", () => {
  const today = day(2026, 10, 10);
  assert.equal(createCard({ occasion: "bijoy", preset: 0, text: null, name: "" }, today).subtitle, "বিজয়ের ৫৫ বছর · ১৬ ডিসেম্বর");
  assert.equal(createCard({ occasion: "noboborsho", preset: 0, text: null, name: "" }, today).subtitle, "পহেলা বৈশাখ ১৪৩৪");
  assert.equal(createCard({ occasion: "ekushe", preset: 0, text: null, name: "" }, today).subtitle, "২১ ফেব্রুয়ারি · ভাষা আন্দোলনের ৭৫ বছর");
  // a link opened a few days after বিজয় দিবস still says ৫৫, not ৫৬
  assert.equal(createCard({ occasion: "bijoy", preset: 0, text: null, name: "" }, day(2026, 12, 19)).subtitle, "বিজয়ের ৫৫ বছর · ১৬ ডিসেম্বর");
});

test("the server normalizes links and writes a personal preview", () => {
  assert.equal(share.normalize("o=evil"), null);
  assert.equal(share.normalize(""), null);
  const state = share.normalize("n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF&o=bijoya&p=1&junk=1")!;
  assert.equal(state, shareHash({ occasion: "bijoya", preset: 1, text: null, name: "রাফি" }).slice(1));
  assert.equal(share.preview(state).title, "রাফি তোমাকে শুভ বিজয়ার শুভেচ্ছা পাঠিয়েছে");
  assert.equal(share.preview("o=ekushe&p=0").title, "তোমার জন্য একুশের একটা কার্ড এসেছে");
  assert.equal(share.tally, undefined);
});
