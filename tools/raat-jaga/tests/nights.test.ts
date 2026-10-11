import assert from "node:assert/strict";
import test from "node:test";
import { share } from "../share";
import {
  bdKickoff, cleanName, createCard, decodeMask, encodeMask, isLateNight, nightById, nightLine, nights, parseShareHash, previewTitle, shareHash, toggleNight,
  DEFAULT_PICKS, MAX_NAME_LENGTH, type NightId,
} from "../lib/nights";

test("twenty nights with unique ids, so share-link bit positions stay stable", () => {
  assert.equal(nights.length, 20);
  assert.equal(new Set(nights.map(night => night.id)).size, nights.length);
});

test("every night obeys the stated rule: kickoff between 11pm and 5am Bangladesh time", () => {
  for (const night of nights) assert.ok(isLateNight(night.kickoff), night.id);
  assert.equal(isLateNight("2022-12-18T18:00+03:00"), false, "the 2022 final began at 9pm in Bangladesh");
});

test("no night falls in Bangladesh's 2009 daylight-saving window, where UTC+6 would be wrong", () => {
  const start = Date.parse("2009-06-18T18:00Z"), end = Date.parse("2009-12-31T18:00Z");
  for (const night of nights) { const at = Date.parse(night.kickoff); assert.ok(at < start || at >= end, night.id); }
});

test("kickoffs convert to the Bangladeshi wall clock, naming the evening before after midnight", () => {
  const at = (id: NightId) => bdKickoff(nightById(id).kickoff);
  assert.deepEqual(at("1990-final"), { time: "রাত ১২টা", date: "৮ জুলাই দিবাগত" });
  assert.deepEqual(at("1994-qf-ned-bra"), { time: "রাত দেড়টা", date: "৯ জুলাই দিবাগত" });
  assert.deepEqual(at("1994-final"), { time: "রাত দেড়টা", date: "১৭ জুলাই দিবাগত" });
  assert.deepEqual(at("2010-final"), { time: "রাত সাড়ে ১২টা", date: "১১ জুলাই দিবাগত" });
  assert.deepEqual(at("2014-sf-bra-ger"), { time: "রাত ২টা", date: "৮ জুলাই দিবাগত" });
  assert.deepEqual(at("2022-bra-srb"), { time: "রাত ১টা", date: "২৪ নভেম্বর দিবাগত" });
  assert.deepEqual(at("2026-final"), { time: "রাত ১টা", date: "১৯ জুলাই দিবাগত" });
  assert.deepEqual(bdKickoff("2026-06-22T12:00-05:00"), { time: "রাত ১১টা", date: "২২ জুন" });
});

test("team-neutral: as many Argentina nights as Brazil nights", () => {
  const count = (team: string) => nights.filter(night => night.home === team || night.away === team).length;
  assert.equal(count("ARG"), count("BRA"));
});

test("picks survive the share-link round trip, including the last night, in list order", () => {
  const picked: NightId[] = ["2026-final", "1990-final", "2014-sf-bra-ger"];
  assert.deepEqual(decodeMask(encodeMask(picked)), ["1990-final", "2014-sf-bra-ger", "2026-final"]);
  assert.deepEqual(parseShareHash(shareHash({ selected: picked, name: "রাফি" })), { selected: ["1990-final", "2014-sf-bra-ger", "2026-final"], name: "রাফি" });
  assert.equal(decodeMask(encodeMask(nights.map(night => night.id))).length, 20);
});

test("hostile or empty hashes are ignored instead of crashing", () => {
  assert.equal(parseShareHash(""), null);
  assert.equal(parseShareHash("#m=%%%"), null);
  assert.equal(parseShareHash("#m=0"), null);
  assert.equal(parseShareHash("#m=zzzzz"), null);
  assert.equal(parseShareHash("#m=-1"), null);
  assert.equal(share.normalize("n=রাফি"), null);
  assert.equal(share.normalize("m=1&n=<script>"), "m=1&n=%3Cscript%3E");
});

test("names lose control and direction characters, are capped, and NFC-normalized", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  const decomposed = "সোহেল";
  assert.equal(cleanName(decomposed), "সোহেল".normalize("NFC"));
  assert.equal(shareHash({ selected: ["2010-final"], name: decomposed }), shareHash({ selected: ["2010-final"], name: "সোহেল" }));
});

test("tapping a night twice removes it; unknown ids are refused", () => {
  assert.deepEqual(toggleNight(toggleNight([], "2006-final"), "2006-final"), []);
  assert.throws(() => toggleNight([], "2002-final"), RangeError);
});

test("the card counts nights, playful tea and sleep, and nights shared with a friend", () => {
  const card = createCard({ selected: DEFAULT_PICKS, name: "" }, { selected: ["2026-final", "1998-final"], name: "তানিয়া" });
  assert.equal(card.count, 2);
  assert.equal(card.headline, "২০-এ ২ রাত জেগেছি");
  assert.equal(card.cups, 4);
  assert.equal(card.hours, 10);
  assert.equal(card.match, "তানিয়ার সাথে ১ রাত একসাথে · ২০২৬ ফাইনাল");
  assert.equal(createCard({ selected: ["1990-final"], name: "রাফি" }, { selected: ["2026-final"], name: "" }).match, "বন্ধুর সাথে একটা রাতও মেলেনি!");
  assert.equal(createCard({ selected: ["1990-final"], name: "রাফি" }).headline, "২০-এ ১ রাত জেগেছে");
});

test("the human line follows the team mix", () => {
  assert.match(nightLine(["1998-r16-arg-eng", "2014-final", "2022-qf-ned-arg"]), /আকাশি-সাদা/);
  assert.match(nightLine(["2018-qf-bra-bel", "2022-bra-srb", "2026-r16-bra-nor"]), /হলুদ-সবুজ/);
  assert.match(nightLine(["2014-final", "2014-sf-bra-ger", "2022-bra-srb", "2022-qf-ned-arg"]), /আর্জেন্টিনা হোক বা ব্রাজিল/);
  assert.match(nightLine(["1990-final", "2006-final", "2010-final"]), /অ্যান্টেনা/);
  assert.match(nightLine(nights.map(night => night.id)), /২০টাই/);
});

test("link previews are personal, and only fixed match ids can be tallied", () => {
  assert.equal(previewTitle({ selected: ["2010-final", "2026-final"], name: "রাফি" }), "রাফি বিশ্বকাপের ২০-এ ২ রাত জেগেছে। তুমি কয় রাত?");
  assert.match(share.preview("m=%%").title, /বিশ্বকাপের কয় রাত/);
  assert.deepEqual(share.tally, nights.map(night => night.id));
});
