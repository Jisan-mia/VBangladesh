import assert from "node:assert/strict";
import test from "node:test";
import { archPieces, lampSpots, LAMPS } from "../lib/arch";
import { bucketOf, buckets, pujaSpan, cleanText, decodeMoments, encodeMoments, everyoneSays, friendLine, moments, parseShareHash, previewTitle, PUJA, shareHash, signOff, toggleMoment, tourLine, MAX_COUNT, MAX_NAME_LENGTH, MAX_PANDALS_LENGTH, type Tour } from "../lib/mondop";
import { share } from "../share";

const tour: Tour = { count: 11, moments: ["anjali", "prasad", "bondhu"], year: 2026, name: "রাফি", pandals: "ঢাকেশ্বরী, বনানী" };

test("a card survives the link round trip", () => {
  const hash = shareHash(tour);
  assert.equal(hash, `#c=11&r=${encodeMoments(tour.moments)}&y=26&n=${encodeURIComponent("রাফি")}&p=${new URLSearchParams({ p: tour.pandals }).toString().slice(2)}`);
  assert.deepEqual(parseShareHash(hash), tour);
  const all = moments.map(moment => moment.id);
  assert.deepEqual(decodeMoments(encodeMoments(all)), all);
  assert.ok(encodeMoments(all).length <= 2);
  assert.deepEqual(parseShareHash("c=3"), { count: 3, moments: [], year: PUJA.year, name: "", pandals: "" });
  assert.equal(parseShareHash(shareHash({ ...tour, count: MAX_COUNT }))?.count, MAX_COUNT);
});

test("hostile, empty or out-of-range hashes are refused or fall back", () => {
  for (const hash of ["", "#result", "#c=0", "#c=-1", "#c=011", "#c=1.5", "#c=151", "#c=9999", "#c=<b>", "#c=%ZZ", "#r=1", "#mp-counter"]) {
    assert.equal(parseShareHash(hash), null, hash);
  }
  assert.deepEqual(parseShareHash("#c=2&r=zzz")?.moments, []);
  assert.deepEqual(parseShareHash("#c=2&r=-1")?.moments, []);
  assert.equal(parseShareHash("#c=2&y=1999")?.year, PUJA.year);
  assert.equal(parseShareHash("#c=2&y=12")?.year, PUJA.year);
  assert.equal(parseShareHash("#c=2&y=27")?.year, 2027);
  assert.equal(share.normalize("c=0"), null);
  assert.equal(share.normalize("#c=5&x=1&n=%20রাফি%20"), "c=5&r=0&y=26&n=" + encodeURIComponent("রাফি"));
  assert.equal(shareHash({ ...tour, count: 400 }).startsWith("#c=150&"), true);
});

test("names and pandal names are NFC, cleaned and capped", () => {
  assert.equal(cleanText("  রিমা‮  আক্তার\n", MAX_NAME_LENGTH), "রিমা আক্তার");
  assert.equal(cleanText("বনানী https://spam.example ও www.x.com কলাবাগান", MAX_PANDALS_LENGTH), "বনানী ও কলাবাগান");
  assert.equal(Array.from(cleanText("ক".repeat(100), MAX_PANDALS_LENGTH)).length, MAX_PANDALS_LENGTH);
  const long = parseShareHash(`#c=4&p=${encodeURIComponent("শাঁখারীবাজার, ".repeat(10))}&n=${encodeURIComponent("ন".repeat(50))}`)!;
  assert.ok(Array.from(long.pandals).length <= MAX_PANDALS_LENGTH);
  assert.equal(Array.from(long.name).length, MAX_NAME_LENGTH);
  const decomposed = "ময়ূরী".normalize("NFD");
  assert.equal(parseShareHash("#c=1&n=" + encodeURIComponent(decomposed))?.name, "ময়ূরী".normalize("NFC"));
});

test("previews carry the name and count, never pandal names; the tally is fixed ids only", () => {
  assert.equal(previewTitle(tour), "রাফি এবার পূজায় ১১টা মণ্ডপ ঘুরেছে — তুমি কয়টা ঘুরলে?");
  assert.equal(previewTitle({ count: 3, name: "" }), "এক বন্ধু এবার পূজায় ৩টা মণ্ডপ ঘুরেছে — তুমি কয়টা ঘুরলে?");
  const preview = share.preview(shareHash(tour).slice(1));
  assert.doesNotMatch(preview.title + preview.description, /ঢাকেশ্বরী|বনানী/);
  assert.deepEqual(share.tally, [...moments.map(moment => moment.id), ...buckets.map(bucket => bucket.id)]);
  assert.equal(new Set(share.tally).size, share.tally!.length);
});

test("pandal counts fall into one range each", () => {
  assert.equal(bucketOf(0), null);
  for (let count = 1; count <= MAX_COUNT; count++) assert.equal(buckets.filter(bucket => count >= bucket.min && count <= bucket.max).length, 1, String(count));
  assert.equal(bucketOf(7)?.id, "b2");
  assert.equal(bucketOf(31)?.id, "b5");
  assert.equal(everyoneSays({ b2: 10, prasad: 4 }, 30), null);
  const says = everyoneSays({ b2: 20, b3: 12, prasad: 25, mela: 9 }, 30);
  assert.equal(says?.people, 32);
  assert.equal(says?.bucket?.id, "b2");
  assert.equal(says?.moment?.id, "prasad");
  assert.equal(everyoneSays({ b2: 20, b3: 20 }, 30)?.bucket, null);
});

test("the human line, the friend line and the sign-off", () => {
  assert.equal(tourLine(0, []), "ঢাকের শব্দ শুনছ? চলো, প্রথম মণ্ডপে।");
  assert.equal(tourLine(5, ["dhunuchi", "dhak"]), "ধুনুচির ধোঁয়া আর ঢাকের তাল, রাতটা জমে গেছে।");
  assert.equal(tourLine(40, ["prasad"]), "পা ব্যথা, মন ভরা। এবার প্রায় পুরো শহর ঘোরা হলো।");
  assert.equal(tourLine(2, []), "অল্প কয়টা, কিন্তু প্রতিটা মণ্ডপই মনে থাকবে।");
  assert.equal(tourLine(2, ["bondhu"]), "বন্ধুর সাথে মণ্ডপে, উৎসবটা সবার।");
  assert.deepEqual(toggleMoment(toggleMoment(["mela"], "arati"), "mela"), ["arati"]);
  assert.equal(friendLine(7, { ...tour, name: "রিমা" }), "রিমা ১১টা · আমি ৭টা");
  assert.equal(friendLine(7, { ...tour, name: "" }), "বন্ধু ১১টা · আমি ৭টা");
  assert.equal(friendLine(0, tour), "");
  assert.equal(friendLine(3, null), "");
  assert.equal(signOff(2026, "2026-10-19"), "শুভ শারদীয়া");
  assert.equal(signOff(2026, PUJA.dashami), "শুভ বিজয়া");
  assert.equal(signOff(PUJA.year - 1, "2026-10-01"), "শুভ বিজয়া");
});

test("the Puja dates are in order and the arch never draws a figure, only lamps and panels", () => {
  assert.ok(PUJA.shashthi < PUJA.dashami && PUJA.dashami.startsWith(String(PUJA.year)));
  assert.equal(pujaSpan("2026-10-16", "2026-10-21"), "১৬–২১ অক্টোবর");
  assert.equal(pujaSpan("2029-09-30", "2029-10-05"), "৩০ সেপ্টেম্বর–৫ অক্টোবর");
  assert.equal(lampSpots.length, LAMPS);
  const base = archPieces(0).length;
  assert.equal(archPieces(LAMPS).length, base + LAMPS * 3);
  assert.equal(archPieces(LAMPS + 1).length, archPieces(LAMPS).length + 2);
  for (const piece of archPieces(30)) assert.doesNotMatch(piece.d, /NaN|undefined/);
});
