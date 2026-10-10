import assert from "node:assert/strict";
import test from "node:test";
import { artIds } from "../lib/dish-art";
import { bnDigits, caption, cleanName, ownPicks, pairLine, parseShareHash, passenger, placeOf, places, previewTitle, questions, reasonLine, shareHash, tallyIds, MAX_NAME, QUESTION_COUNT, type Answer } from "../lib/jibh";
import { site } from "../content";
import { share } from "../share";

const every = () => Array.from({ length: 4 ** QUESTION_COUNT }, (_, code) => [...code.toString(4).padStart(QUESTION_COUNT, "0")].map(Number) as Answer[]);
const rafi = { answers: [0, 3, 1, 2, 2, 0] as Answer[], name: "রাফি" };

test("six questions of four drawn dishes, each from a known place; all text NFC", () => {
  assert.equal(questions.length, 6);
  const ids = new Set<string>(places.map(place => place.id));
  for (const question of questions) {
    assert.equal(question.options.length, 4);
    for (const option of question.options) {
      assert.ok(ids.has(option.place), option.place);
      assert.ok(artIds.includes(option.art), option.art);
    }
    for (const text of [question.ask, ...question.options.map(option => option.label)]) assert.equal(text, text.normalize("NFC"), text);
  }
  for (const place of places) for (const text of [place.name, place.foods, place.line, place.source, place.division]) assert.equal(text, text.normalize("NFC"), text);
  // Every place has a dish of its own to pick.
  for (const place of places) assert.ok(questions.some(question => question.options.some(option => option.place === place.id)), place.id);
});

test("twenty places across all eight divisions, food only: no sweets, nothing about people", () => {
  assert.equal(places.length, 20);
  assert.equal(new Set(places.map(place => place.id)).size, 20);
  const divisions = new Map<string, number>();
  for (const place of places) divisions.set(place.division, (divisions.get(place.division) ?? 0) + 1);
  assert.deepEqual([...divisions.keys()].sort(), ["ঢাকা", "চট্টগ্রাম", "সিলেট", "রাজশাহী", "রংপুর", "খুলনা", "বরিশাল", "ময়মনসিংহ"].map(name => name.normalize("NFC")).sort());
  for (const [division, count] of divisions) assert.ok(count >= 2, division);
  const text = places.map(place => `${place.foods} ${place.line}`).join(" ");
  assert.doesNotMatch(text, /বালিশ|দই|জিলাপি|লাড্ডু|রসগোল্লা|সন্দেশ|চমচম|কাঁচাগোল্লা|মণ্ডা|রসমালাই|পায়েস|খাজা/);
  assert.doesNotMatch(text, /মানুষ|লোক|বাসী|ওরা|ওদের|সেরা|সবচেয়ে/);
});

test("GI numbers match the DPDT register entries they cite", () => {
  // https://dpdt.gov.bd/pages/static-pages/6922dff0933eb65569e24bcf (registration no. → registered name), read 11 Oct 2026
  const register: Record<number, string> = { 3: "চাঁপাইনবাবগঞ্জের খিরসাপাত আম", 5: "দিনাজপুর কাটারীভোগ", 14: "শেরপুরের তুলশীমালা ধান", 15: "চাঁপাই নবাবগঞ্জের ল্যাংড়া আম", 16: "চাঁপাই নবাবগঞ্জের আশ্বিনা আম", 22: "রংপুরের হাঁড়িভাঙ্গা আম", 26: "যশোরের খেজুরের গুড়", 27: "নরসিংদীর অমৃত সাগর কলা", 32: "নরসিংদীর লটকন", 43: "সুন্দরবনের মধু", 46: "গাজীপুরের কাঁঠাল", 48: "অষ্টগ্রামের পনির", 49: "বরিশালের আমড়া", 51: "দিনাজপুরের বেদানা লিচু", 58: "ফুলবাড়ীয়ার লাল চিনি" };
  for (const place of places) {
    const gi: readonly number[] = "gi" in place ? place.gi : [];
    for (const number of gi) {
      assert.ok(register[number], `${place.id}: ${number}`);
      assert.match(place.source, new RegExp(bnDigits(String(number))), place.id);
    }
    if (!gi.length) assert.doesNotMatch(place.source, /জিআই/, place.id);
  }
});

test("the scoring table: each option sits on exactly five plates, and every plate holds its own dishes", () => {
  questions.forEach((question, at) => {
    question.options.forEach((option, answer) => {
      assert.equal(places.filter(place => Number(place.plate[at]) === answer).length, 5, `${at}/${answer}`);
      const home = places.find(place => place.id === option.place)!;
      assert.equal(Number(home.plate[at]), answer, `${option.place} plate misses ${option.label}`);
    });
  });
  for (const place of places) assert.match(place.plate, /^[0-3]{6}$/);
});

test("every place is reachable from its own plate and none is rare or common", () => {
  for (const place of places) assert.equal(placeOf([...place.plate].map(Number) as Answer[]).id, place.id);
  const seen = new Map<string, number>();
  for (const answers of every()) seen.set(placeOf(answers).id, (seen.get(placeOf(answers).id) ?? 0) + 1);
  for (const place of places) {
    const share = (seen.get(place.id) ?? 0) / 4 ** QUESTION_COUNT;
    assert.ok(share >= 0.04 && share <= 0.08, `${place.id}: ${share}`);
  }
});

test("the winner always has a dish the person picked, and ties follow the written rule", () => {
  // An independent reading of the rule in placeOf's comment.
  const reference = (answers: readonly Answer[]) => {
    const scored = places.map((place, index) => {
      const own = answers.map((answer, at) => questions[at].options[answer].place === place.id);
      const match = answers.map((answer, at) => Number(place.plate[at]) === answer);
      const score = match.reduce((sum, hit, at) => sum + (hit ? (own[at] ? 2 : 1) : 0), 0);
      return { place, index, eligible: own.some(Boolean), score, match: match.map(hit => hit ? "1" : "0").join("") };
    }).filter(entry => entry.eligible);
    scored.sort((a, b) => b.score - a.score || (a.match < b.match ? 1 : a.match > b.match ? -1 : 0) || a.index - b.index);
    return scored[0].place.id;
  };
  let ties = 0;
  for (const answers of every()) {
    const place = placeOf(answers);
    assert.equal(place.id, reference(answers), answers.join(""));
    assert.ok(ownPicks(answers).length >= 1, answers.join(""));
    const scores = places.filter(candidate => answers.some((answer, at) => questions[at].options[answer].place === candidate.id))
      .map(candidate => answers.reduce<number>((sum, answer, at) => sum + (Number(candidate.plate[at]) === answer ? (questions[at].options[answer].place === candidate.id ? 2 : 1) : 0), 0));
    if (scores.filter(score => score === Math.max(...scores)).length > 1) ties++;
  }
  assert.ok(ties > 0, "the tie rule is exercised");
  // Pinned results: a change here means old links would open a different ticket.
  assert.equal(placeOf([0, 3, 1, 2, 2, 0]).id, "narsingdi");
  assert.equal(placeOf([0, 0, 0, 0, 0, 0]).id, "barishal");
  assert.equal(placeOf([3, 3, 3, 3, 3, 3]).id, "jashore");
  assert.equal(placeOf([2, 2, 0, 3, 3, 0]).id, "sylhet");
});

test("the reason names the person's own picks from that place", () => {
  assert.equal(reasonLine([2, 2, 0, 3, 3, 0]), "কারণ তোমার পাতে ছিল সাতকরা দিয়ে মাংস আর সাতকরার আচার");
  assert.equal(passenger(""), "আমার জিভ");
  assert.equal(passenger("রাফি"), "রাফির জিভ");
});

test("a ticket survives the share-link round trip", () => {
  assert.equal(shareHash(rafi), "#a=031220&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShareHash(shareHash(rafi)), rafi);
  assert.deepEqual(parseShareHash("#a=031220&n=রাফি"), rafi);
  const plain = { answers: [3, 3, 3, 3, 3, 3] as Answer[], name: "" };
  assert.deepEqual(parseShareHash(shareHash(plain)), plain);
});

test("hostile, partial or anchor hashes are ignored instead of crashing", () => {
  for (const hash of ["", "#result", "#counter", "#places", "#a=03122", "#a=0312200", "#a=031224", "#a=abcdef", "#a=%%%", "#a=০৩১২২০", "#a=03122 "]) assert.equal(parseShareHash(hash), null, hash);
  assert.equal(parseShareHash("#a=031220&n=%E0%A6")?.name, "");
});

test("names are NFC, cleaned, capped and screened", () => {
  assert.equal(cleanName("  রি‮মা \n আক্তার<script>"), "রিমা আক্তারscript");
  assert.equal([...cleanName("ক".repeat(MAX_NAME + 10))].length, MAX_NAME);
  assert.equal(cleanName("ময়না"), "ময়না".normalize("NFC"));
  assert.equal(cleanName("khanki"), "");
  assert.equal(parseShareHash("#a=031220&n=harami")?.name, "");
  assert.equal([...(parseShareHash(`#a=031220&n=${"ম".repeat(200)}`)?.name ?? "")].length, MAX_NAME);
});

test("a friend's ticket adds a same-train line", () => {
  const mim = { answers: [3, 3, 3, 3, 3, 3] as Answer[], name: "মিম" };
  assert.equal(pairLine(rafi, mim), "রাফি নরসিংদী, মিম যশোর, স্টেশনে দেখা হবে");
  assert.equal(pairLine(rafi, { ...rafi, name: "মিম" }), "রাফি আর মিম, একই ট্রেনে নরসিংদী!");
  assert.match(pairLine({ ...rafi, name: "" }, { ...mim, name: "" }), /^আমি .+, বন্ধু /);
});

test("share normalizes, previews personally and tallies only place ids", () => {
  assert.equal(share.normalize("a=031220&n=রাফি&x=1"), shareHash(rafi).slice(1));
  assert.equal(share.normalize("a=9"), null);
  assert.equal(share.preview(shareHash(rafi).slice(1)).title, "রাফির জিভের টিকিট নরসিংদী, তোমারটা কোন জেলার?");
  assert.equal(share.preview("a=031220").title, "এক বন্ধুর জিভের টিকিট নরসিংদী, তোমারটা কোন জেলার?");
  assert.equal(previewTitle(null), site.title);
  assert.deepEqual(share.tally, tallyIds);
  assert.equal(tallyIds.length, 20);
  assert.match(caption(rafi), /^আমার জিভের টিকিট কাটা হলো, গন্তব্য নরসিংদী!/);
});

test("content fits the SEO rules and says what a link carries", () => {
  assert.ok([...site.title].length <= 45);
  assert.ok([...site.description].length >= 120 && [...site.description].length <= 160, String([...site.description].length));
  assert.ok(site.faq.length >= 5);
  assert.match(site.privacy.join(" "), /লিংকে থাকে/);
});
