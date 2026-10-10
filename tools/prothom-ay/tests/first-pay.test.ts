import assert from "node:assert/strict";
import test from "node:test";
import { amountText, cleanName, giftLabel, gifts, parseAmount, parseShareHash, payLine, previewTitle, sample, shareHash, sources, tallyIds, toggleGift, MAX_GIFTS, MAX_NAME_LENGTH, WHOLE, type FirstPay } from "../lib/first-pay";
import { share } from "../share";

test("ids are unique and the tally only knows fixed source and gift ids", () => {
  assert.equal(new Set(sources.map(source => source.id)).size, sources.length);
  assert.equal(new Set(gifts.map(gift => gift.id)).size, gifts.length);
  assert.deepEqual(share.tally, tallyIds);
  assert.deepEqual([...tallyIds].sort(), [...sources.map(source => source.id), ...gifts.map(gift => gift.id)].sort());
});

test("the brief's link opens the sample envelope with a name", () => {
  assert.deepEqual(parseShareHash("#s=tuition&d=shari&y=2019&n=রাফি"), { ...sample, name: "রাফি" });
});

test("an envelope survives the link round trip, amount and style included", () => {
  const pay: FirstPay = { source: "job", gifts: ["mishti", "panjabi", "nanu"], year: 2008, style: "ma", name: "তানিয়া", amount: 125000 };
  const hash = shareHash(pay);
  assert.equal(hash, `#s=job&d=mishti.panjabi.nanu&y=2008&k=ma&n=${encodeURIComponent("তানিয়া")}&t=125000`);
  assert.deepEqual(parseShareHash(hash), pay);
  // Defaults stay out of the link.
  assert.equal(shareHash(sample), "#s=tuition&d=shari&y=2019");
  assert.equal(share.normalize("s=tuition&d=shari&y=2019&x=1&n=%20রাফি%20"), "s=tuition&d=shari&y=2019&n=" + encodeURIComponent("রাফি"));
});

test("hostile, empty or out-of-range hashes are refused or cleaned", () => {
  for (const hash of ["", "#result", "#s=lottery&d=shari", "#s=tuition", "#s=tuition&d=", "#s=tuition&d=gold", "#d=shari", "#s=<b>&d=shari", "#s=tuition&d=%ZZ"]) {
    assert.equal(parseShareHash(hash), null, hash);
  }
  const odd = parseShareHash("#s=job&d=shari.shari.gold.joma&y=1066&k=boss&t=99999999");
  assert.deepEqual(odd, { source: "job", gifts: ["shari", "joma"], year: 0, style: "ammu", name: "", amount: 0 });
  assert.equal(parseShareHash("#s=job&d=joma&t=-5")?.amount, 0);
  assert.equal(parseShareHash("#s=job&d=joma&t=0300")?.amount, 0);
  assert.equal(parseShareHash("#s=job&d=joma&y=20190")?.year, 0);
  // More than three gifts keep the last three, and the unopened envelope never mixes with spending.
  assert.deepEqual(parseShareHash("#s=job&d=shari.panjabi.mishti.treat")?.gifts, ["panjabi", "mishti", "treat"]);
  assert.deepEqual(parseShareHash("#s=job&d=shari.pura")?.gifts, ["pura"]);
  assert.equal(share.normalize("s=job"), null);
});

test("tapping gifts: toggle off, cap at three, the whole envelope stays alone", () => {
  assert.deepEqual(toggleGift(toggleGift([], "mishti"), "mishti"), []);
  assert.deepEqual(toggleGift(["shari", "panjabi", "mishti"], "treat"), ["panjabi", "mishti", "treat"]);
  assert.equal(toggleGift(["shari", "panjabi", "mishti"], "joma").length, MAX_GIFTS);
  assert.deepEqual(toggleGift(["shari", "mishti"], WHOLE), [WHOLE]);
  assert.deepEqual(toggleGift([WHOLE], "joma"), ["joma"]);
});

test("names are NFC, lose control and direction-override characters, and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(Array.from(cleanName("ক".repeat(MAX_NAME_LENGTH + 10))).length, MAX_NAME_LENGTH);
  // য় precomposed or typed as য + nukta: NFC turns both into the same string, so links and cards agree.
  const precomposed = "রি\u09dfা", typed = "রি\u09af\u09bcা";
  assert.equal(cleanName(precomposed), typed.normalize("NFC"));
  assert.equal(parseShareHash(`#s=job&d=joma&n=${encodeURIComponent(precomposed)}`)?.name, cleanName(typed));
});

test("amounts: Bangla or English digits, commas and ৳ are fine; nonsense is no amount", () => {
  assert.equal(parseAmount("৩,০০০"), 3000);
  assert.equal(parseAmount("৳ 1,25,000/-"), 125000);
  assert.equal(parseAmount(""), 0);
  assert.equal(parseAmount("অনেক"), 0);
  assert.equal(parseAmount("12345678"), 0);
  assert.equal(amountText(125000), "৳ ১,২৫,০০০/-");
});

test("labels follow how the family is addressed; the human line follows the picks", () => {
  assert.equal(giftLabel("shari", "ammu"), "আম্মুর জন্য শাড়ি");
  assert.equal(giftLabel("shari", "ma"), "মায়ের জন্য শাড়ি");
  assert.equal(giftLabel("mishti", "ma"), "মিষ্টি বিলি");
  assert.equal(payLine({ source: "job", gifts: ["mishti"], style: "ammu" }), "প্রথম টাকায় সবার মুখ মিষ্টি, এর চেয়ে ভালো খরচ নেই।");
  assert.match(payLine({ source: "job", gifts: ["shari", "panjabi"], style: "ma" }), /^মায়ের শাড়ি, বাবার পাঞ্জাবি/);
  assert.match(payLine({ source: "job", gifts: [WHOLE], style: "ammu" }), /আম্মু-আব্বুর হাতে/);
  for (const gift of gifts) for (const style of ["ammu", "ma"] as const) assert.ok(payLine({ source: "tuition", gifts: [gift.id], style }).length > 10);
});

test("the link preview is personal and never mentions the amount", () => {
  const pay: FirstPay = { ...sample, name: "রাফি", amount: 3000 };
  assert.equal(previewTitle(pay), "রাফির প্রথম আয়: আম্মুর জন্য শাড়ি — তোমারটা দিয়ে কী করেছিলে?");
  const preview = share.preview(shareHash(pay).slice(1));
  assert.doesNotMatch(preview.title + preview.description, /৩,০০০|3000/);
  assert.match(share.preview("junk").title, /প্রথম আয়/);
});
