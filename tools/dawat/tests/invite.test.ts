import assert from "node:assert/strict";
import test from "node:test";
import { banglaDate, cleanDate, cleanMapLink, cleanName, cleanPlace, dateText, humanLine, inviteTitle, occasions, parseShareHash, replyHash, replyTitle, shareHash, stateOf, timeText, titleOf, MAX_MAP, MAX_NAME, MAX_PLACE, type Invite } from "../lib/invite";
import { share } from "../share";

const sample: Invite = { occasion: "biye", a: "রাফি", b: "মিম", date: "2026-12-12", time: "19:30", place: "কমিউনিটি সেন্টার, মিরপুর ১০", map: "https://maps.app.goo.gl/AbC123xyz" };

test("an invitation survives the link round trip", () => {
  assert.deepEqual(parseShareHash(shareHash(sample)), { ...sample, guest: null, pick: 0 });
  const single: Invite = { occasion: "akika", a: "আয়ান", b: "", date: "2027-01-08", time: "", place: "", map: "" };
  assert.deepEqual(parseShareHash(shareHash(single)), { ...single, guest: null, pick: 0 });
});

test("a reply keeps who and when, and drops the place, time and map", () => {
  const reply = parseShareHash(replyHash(sample, "নাদিয়া", 2))!;
  assert.deepEqual(reply, { ...sample, time: "", place: "", map: "", guest: "নাদিয়া", pick: 2 });
  assert.equal(parseShareHash(replyHash(sample, "", 0))!.guest, "");
  assert.equal(replyTitle(reply), "নাদিয়া আসছে! রাফি ও মিমের বিয়েতে");
  // a reply link can't smuggle the place back in
  assert.equal(parseShareHash("#o=biye&a=রাফি&r=নাদিয়া&p=ঠিকানা&m=https://maps.app.goo.gl/x")!.place, "");
});

test("hostile or unrelated hashes are ignored instead of crashing", () => {
  for (const hash of ["", "#", "#tool", "#make", "#o=evil", "#o=__proto__", "#o=constructor&a=x"]) assert.equal(parseShareHash(hash), null, hash);
  for (const x of ["9", "-1", "1.5", "abc", ""]) assert.equal(parseShareHash(`#o=biye&r=x&x=${x}`)!.pick, 0, x);
  assert.equal(parseShareHash("#o=biye&a=%%%E0%A")!.a, "%%�%A");
  for (const d of ["2026-02-30", "2026-13-01", "12-12-2026", "1999-01-01", "2026-1-1"]) assert.equal(cleanDate(d), "", d);
  for (const t of ["24:00", "7:30", "19:60", "ab"]) assert.equal(timeText(t), "", t);
});

test("fields are capped, NFC-normalized and stripped of control and direction characters", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(Array.from(cleanName("ক".repeat(100))).length, MAX_NAME);
  assert.equal(Array.from(cleanPlace("ঠ".repeat(100))).length, MAX_PLACE);
  assert.equal(cleanName("শো"), "শো");
  const long = parseShareHash(`#o=biye&a=${"ন".repeat(500)}&p=${"প".repeat(500)}`)!;
  assert.equal(long.a.length, MAX_NAME);
  assert.equal(long.place.length, MAX_PLACE);
  // the second name is dropped for one-name occasions
  assert.equal(parseShareHash("#o=jonmodin&a=রাফি&b=মিম")!.b, "");
});

test("phone numbers can't ride along in a name or place", () => {
  assert.equal(cleanPlace("বাসা ১২, ফোন 01711-123456"), "বাসা ১২, ফোন");
  assert.equal(cleanPlace("কল করো ০১৭১১ ১২৩ ৪৫৬"), "কল করো");
  assert.equal(cleanPlace("রোড ২৭, বাড়ি ৫"), "রোড ২৭, বাড়ি ৫");
});

test("only Google Maps links are kept", () => {
  assert.equal(cleanMapLink("Check out this place: https://maps.app.goo.gl/AbC123"), "https://maps.app.goo.gl/AbC123");
  assert.equal(cleanMapLink("http://www.google.com/maps/place/Mirpur"), "https://www.google.com/maps/place/Mirpur");
  assert.equal(cleanMapLink("https://google.com.bd/maps?q=23.8,90.3"), "https://google.com.bd/maps?q=23.8,90.3");
  assert.equal(cleanMapLink("https://goo.gl/maps/xyz"), "https://goo.gl/maps/xyz");
  for (const bad of ["javascript:alert(1)", "https://evil.com/maps", "https://google.com.evil.com/maps", "https://maps.google.com.evil.io/x", "https://www.google.com/search?q=x", "https://goo.gl/abc", "https://user:pw@maps.google.com/", "https://maps.google.com:8080/", "https://mapsXgoogle.com/maps", "ftp://maps.google.com/", "maps.google.com", `https://maps.app.goo.gl/${"a".repeat(MAX_MAP)}`]) assert.equal(cleanMapLink(bad), "", bad);
  assert.equal(parseShareHash("#o=biye&m=https://evil.com")!.map, "");
});

test("the Bangla date follows Bangladesh's revised calendar", () => {
  assert.equal(banglaDate(2026, 4, 14), "১ বৈশাখ ১৪৩৩");
  assert.equal(banglaDate(2026, 12, 16), "১ পৌষ ১৪৩৩");
  assert.equal(banglaDate(2026, 12, 12), "২৭ অগ্রহায়ণ ১৪৩৩");
  assert.equal(banglaDate(2027, 2, 21), "৮ ফাল্গুন ১৪৩৩");
  assert.equal(banglaDate(2027, 3, 26), "১২ চৈত্র ১৪৩৩");
  assert.equal(banglaDate(2028, 3, 26), "১২ চৈত্র ১৪৩৪"); // leap year: ফাল্গুন has 30 days
  assert.equal(banglaDate(2027, 4, 13), "৩০ চৈত্র ১৪৩৩");
});

test("dates, times and titles read naturally", () => {
  assert.equal(dateText("2026-12-12"), "শনিবার, ১২ ডিসেম্বর");
  assert.equal(timeText("19:30"), "সন্ধ্যা ৭:৩০");
  assert.equal(timeText("13:00"), "দুপুর ১টা");
  assert.equal(timeText("00:05"), "রাত ১২:০৫");
  assert.equal(titleOf(sample), "রাফি ও মিমের বিয়ে");
  assert.equal(inviteTitle(sample), "রাফি ও মিমের বিয়ের দাওয়াত");
  assert.equal(inviteTitle({ ...sample, occasion: "holud", a: "মিম", b: "" }), "মিমের গায়ে হলুদের দাওয়াত");
  assert.equal(titleOf({ ...sample, occasion: "puja", a: "দত্ত বাড়ি", b: "লক্ষ্মীপূজা" }), "দত্ত বাড়ির লক্ষ্মীপূজা");
  assert.equal(inviteTitle({ ...sample, occasion: "puja", a: "দত্ত বাড়ি", b: "" }), "দত্ত বাড়ির পূজার নিমন্ত্রণ");
  assert.equal(inviteTitle({ ...sample, a: "", b: "" }), "বিয়ের দাওয়াত");
  assert.equal(humanLine({ ...sample, occasion: "holud", date: "2026-12-10" }), "না এলে রং মাখাবে কে?");
  assert.equal(humanLine({ ...sample, date: "2026-12-11" }), "শুক্রবারের দাওয়াত, অফিসের অজুহাত চলবে না।");
});

test("every occasion has unique ids, 3 replies and copy that fits", () => {
  assert.equal(new Set(occasions.map(occasion => occasion.id)).size, occasions.length);
  for (const occasion of occasions) {
    assert.equal(occasion.replies.length, 3, occasion.id);
    assert.ok(Array.from(occasion.place).length <= MAX_PLACE, occasion.id);
    for (const field of occasion.fields) assert.ok(Array.from(field.sample).length <= MAX_NAME, field.sample);
  }
});

test("share.ts normalizes, previews personally and counts nothing", () => {
  const state = shareHash(sample).slice(1);
  assert.equal(share.normalize(state), state);
  assert.equal(share.normalize(stateOf(parseShareHash(replyHash(sample, "নাদিয়া", 1))!)), replyHash(sample, "নাদিয়া", 1).slice(1));
  assert.equal(share.normalize("o=nope"), null);
  assert.equal(share.preview(state).title, "রাফি ও মিমের বিয়ের দাওয়াত");
  assert.equal(share.preview(replyHash(sample, "নাদিয়া", 0).slice(1)).title, "নাদিয়া আসছে! রাফি ও মিমের বিয়েতে");
  assert.equal(share?.tally, undefined); // nothing is counted: the site only tallies behind an explicit opt-in
});
