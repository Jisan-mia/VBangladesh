import assert from "node:assert/strict";
import test from "node:test";
import { byNearest, captionOf, cleanMessage, cleanName, createCard, createFrame, frameHash, frameOrder, frames, messageOf, nextDate, occasions, parseFrameHash, parseShareHash, previewTitle, recipientsOf, shareHash, MAX_MESSAGE_LENGTH, MAX_NAME_LENGTH, type Wish } from "../lib/greeting";
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
  assert.equal(cleanName("শোো".slice(0, 1) + "ো"), "শো");
  assert.equal(shareHash({ occasion: "eid", preset: 0, text: null, name: "শো" }), shareHash({ occasion: "eid", preset: 0, text: null, name: "শো" }));
});

test("every occasion and recipient has 3–4 presets that fit the card, and ids are unique", () => {
  assert.equal(new Set(occasions.map(occasion => occasion.id)).size, occasions.length);
  for (const occasion of occasions) {
    const lists = [occasion.presets, ...recipientsOf(occasion.id).map(recipient => recipient.presets)];
    assert.equal(new Set(recipientsOf(occasion.id).map(recipient => recipient.id)).size, recipientsOf(occasion.id).length, occasion.id);
    for (const presets of lists) {
      assert.ok(presets.length >= 3 && presets.length <= 4, occasion.id);
      for (const text of presets) assert.ok(Array.from(text).length <= MAX_MESSAGE_LENGTH, text);
    }
  }
  for (const frame of frames) for (const text of frame.ribbons) assert.ok(Array.from(text).length <= MAX_NAME_LENGTH, text);
});

test("একুশে never says শুভ: it is a day of remembrance", () => {
  const ekushe = occasions.find(occasion => occasion.id === "ekushe")!;
  const frame = frames.find(item => item.id === "ekushe")!;
  const words = [ekushe.title, ekushe.chip, ekushe.subtitle(2027), ekushe.line, ekushe.caption, ekushe.gift, ...ekushe.presets, previewTitle({ occasion: "ekushe", preset: 0, text: null, name: "রাফি" }),
    frame.chip, frame.when, frame.line, frame.gift, ...frame.ribbons, createFrame({ frame: "ekushe", ribbon: 0 }, day(2027, 1, 1)).sub];
  for (const text of words) assert.ok(!text.includes("শুভ"), text);
});

test("the nearest occasion is the default, and the picker follows the calendar", () => {
  // জন্মদিন and বিবাহবার্ষিকী have no date, so they sit at the end and never become the default card
  assert.deepEqual(byNearest(day(2026, 10, 10)).map(occasion => occasion.id), ["bijoya", "nobanno", "bijoy", "ekushe", "eid", "noboborsho", "jonmodin", "bibahobarshiki"]);
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
  assert.equal(byNearest(day(2031, 1, 1))[0].id, "ekushe");
  assert.ok(byNearest(day(2031, 1, 1)).slice(-3).some(occasion => occasion.id === "eid"));
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

test("links made before জন্মদিন and the frame open exactly the same card", () => {
  // copied from a link shared before this change: no recipient keys, no frame keys
  const old = "o=bijoya&p=2&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF+%E0%A6%93+%E0%A6%AA%E0%A6%B0%E0%A6%BF%E0%A6%AC%E0%A6%BE%E0%A6%B0";
  assert.deepEqual(parseShareHash("#" + old), { occasion: "bijoya", preset: 2, text: null, name: "রাফি ও পরিবার" });
  assert.equal(share.normalize(old), old);
  assert.equal(parseFrameHash("#" + old), null);
  assert.equal(share.normalize("o=eid&t=%E0%A6%88%E0%A6%A6"), "o=eid&t=%E0%A6%88%E0%A6%A6");
});

test("a birthday card carries who it is for, and their name, through the link", () => {
  const wish: Wish = { occasion: "jonmodin", preset: 1, text: null, name: "রাফি", to: "ammu", toName: "" };
  assert.deepEqual(parseShareHash(shareHash(wish)), wish);
  const card = createCard(wish, day(2026, 10, 10));
  assert.equal(card.title, "শুভ জন্মদিন");
  assert.equal(card.subtitle, "প্রিয় আম্মু");
  assert.equal(card.message, recipientsOf("jonmodin").find(recipient => recipient.id === "ammu")!.presets[1]);
  assert.equal(captionOf(wish), "শুভ জন্মদিন, প্রিয় আম্মু! অনেক ভালোবাসা রইল।");

  const named: Wish = { occasion: "bibahobarshiki", preset: 0, text: null, name: "", to: "ammu-abbu", toName: "  রিমা ও রাফি\n" };
  const parsed = parseShareHash(shareHash(named))!;
  assert.equal(parsed.toName, "রিমা ও রাফি");
  assert.equal(createCard(parsed, day(2026, 10, 10)).subtitle, "প্রিয় রিমা ও রাফি");
  assert.equal(previewTitle({ ...parsed, name: "নাদিয়া" }), "রিমা ও রাফি, নাদিয়া তোমাকে বিবাহবার্ষিকীর শুভেচ্ছা পাঠিয়েছে");
});

test("the neutral recipient is the default and unknown recipients fall back to it", () => {
  const neutral = parseShareHash("#o=jonmodin&p=0")!;
  assert.equal(neutral.to, "priyo");
  assert.equal(createCard(neutral, day(2026, 10, 10)).subtitle, "");
  assert.equal(captionOf(neutral), "শুভ জন্মদিন! অনেক ভালোবাসা রইল।");
  assert.equal(parseShareHash("#o=jonmodin&r=__proto__&p=3")!.to, "priyo");
  // a preset index is checked against the chosen recipient's own list (আম্মু has three, the default has four)
  assert.equal(parseShareHash("#o=jonmodin&r=ammu&p=3")!.preset, 0);
  assert.equal(parseShareHash("#o=jonmodin&p=3")!.preset, 3);
  // recipient keys mean nothing on a festival card and are dropped
  assert.deepEqual(parseShareHash("#o=eid&p=1&r=ammu&rn=x"), { occasion: "eid", preset: 1, text: null, name: "" });
  assert.equal(parseShareHash(`#o=jonmodin&rn=${"ন".repeat(200)}`)!.toName!.length, MAX_NAME_LENGTH);
});

test("a profile frame link carries the frame and ribbon, never a photo, and survives hostile input", () => {
  for (const frame of frames) for (let ribbon = 0; ribbon < frame.ribbons.length; ribbon++) assert.deepEqual(parseFrameHash(frameHash({ frame: frame.id, ribbon })), { frame: frame.id, ribbon });
  for (const hash of ["", "#", "#fr=", "#fr=evil", "#fr=__proto__", "#o=bijoy&p=0"]) assert.equal(parseFrameHash(hash), null, hash);
  for (const l of ["9", "-1", "1.5", "x", ""]) assert.equal(parseFrameHash(`#fr=khela&l=${l}`)?.ribbon, 0, l);
  // frame links have no o=, so the card parser ignores them; if both appear the frame wins
  assert.equal(parseShareHash("#fr=bijoy&l=1"), null);
  assert.equal(share.normalize("l=2&fr=khela&junk=1"), "fr=khela&l=2");
  assert.equal(share.normalize("o=bijoya&p=0&fr=ekushe"), "fr=ekushe&l=0");
  assert.equal(share.preview("fr=bijoy&l=0").title, "বিজয় দিবসের প্রোফাইল ফ্রেম: নিজের ছবি বসিয়ে নাও");
});

test("the frame picks the next national day first and counts the right year", () => {
  assert.deepEqual(frameOrder(day(2026, 10, 10)).map(frame => frame.id), ["bijoy", "ekushe", "khela"]);
  assert.deepEqual(frameOrder(day(2026, 12, 28)).map(frame => frame.id), ["ekushe", "bijoy", "khela"]);
  assert.deepEqual(createFrame({ frame: "bijoy", ribbon: 0 }, day(2026, 10, 10)), { frame: "bijoy", ribbon: "মহান বিজয় দিবস", sub: "বিজয়ের ৫৫ বছর · ১৬ ডিসেম্বর" });
  assert.equal(createFrame({ frame: "ekushe", ribbon: 1 }, day(2026, 10, 10)).sub, "২১ ফেব্রুয়ারি · ভাষা আন্দোলনের ৭৫ বছর");
  assert.equal(createFrame({ frame: "khela", ribbon: 0 }, day(2026, 10, 10)).sub, "");
});
