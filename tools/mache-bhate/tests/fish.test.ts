import assert from "node:assert/strict";
import test from "node:test";
import { cleanName, createCard, decodeSelection, DEFAULT_PICKS, encodeSelection, fishes, fishLine, groups, parseShareHash, shareHash, toggleFish, MAX_NAME_LENGTH } from "../lib/fish";
import { fishArt } from "../lib/fish-art";
import { SLOT_RATIO, traySlots } from "../lib/draw-card";
import { share } from "../share";

test("fish ids are unique, 40 of them, and every group has fish", () => {
  assert.equal(new Set(fishes.map(fish => fish.id)).size, fishes.length);
  assert.equal(fishes.length, 40);
  for (const group of groups) assert.ok(fishes.some(fish => fish.group === group.id), group.id);
});

test("every fish has a drawing with well-formed paths", () => {
  for (const fish of fishes) {
    const shapes = fishArt(fish.id);
    assert.ok(shapes.length > 3, fish.id);
    for (const shape of shapes) assert.match(shape.d, /^M ?[-\d. MLQCZa]+$/, `${fish.id}: ${shape.d.slice(0, 40)}`);
  }
});

test("tapping a fish twice takes it off the tray again", () => {
  assert.deepEqual(toggleFish(toggleFish(DEFAULT_PICKS, "pabda"), "pabda"), DEFAULT_PICKS);
  assert.throws(() => toggleFish([], "shark"), RangeError);
});

test("a selection survives the link round trip, including the first and last fish", () => {
  const picks = [fishes[0].id, "shing", "loitta", fishes.at(-1)!.id] as const;
  assert.deepEqual(decodeSelection(encodeSelection([...picks])), [...picks]);
  const all = fishes.map(fish => fish.id);
  assert.ok(encodeSelection(all).length <= 8);
  assert.deepEqual(decodeSelection(encodeSelection(all)), all);
});

test("a shared link brings back the name, NFC-normalised and capped", () => {
  const decomposed = "রাফি".normalize("NFD") + "‮";
  const shared = parseShareHash(shareHash({ selected: ["rui", "kachki"], name: decomposed }));
  assert.deepEqual(shared, { selected: ["rui", "kachki"], name: "রাফি".normalize("NFC") });
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  assert.equal(cleanName("  তানিয়া\n  আক্তার "), "তানিয়া আক্তার");
});

test("hostile or empty hashes are ignored instead of crashing", () => {
  for (const hash of ["", "#", "#f=", "#f=%%%", "#f=0", "#f=-1", "#f=zzzzzzzzz", "#f=a.b", "#n=রাফি", "#f=" + "z".repeat(5000)]) assert.equal(parseShareHash(hash), null, hash);
  // Bits beyond the 40 fish are dropped, not mapped to anything.
  assert.ok((parseShareHash("#f=zzzzzzzz")?.selected.length ?? 0) <= fishes.length);
});

test("share.ts normalises good links, rejects junk and previews personally", () => {
  const state = shareHash({ selected: ["ilish", "pabda", "tengra"], name: "রাফি" }).slice(1);
  assert.equal(share.normalize(state), state);
  assert.equal(share.normalize("f=%%%"), null);
  assert.equal(share.preview(state).title, "রাফির ডালায় ৪০টা দেশি মাছের ৩টা। তোমার কয়টা?");
  assert.deepEqual(share.tally, fishes.map(fish => fish.id));
});

test("the human line comes from what was ticked", () => {
  assert.equal(fishLine(["pabda", "tengra", "shing", "mola"]), "শিং, পাবদা আর মলা: ছোট মাছের কাঁটা বাছতে জানো। ওটাই আসল ওস্তাদি।");
  assert.equal(fishLine(["chitol", "baghair", "rui"]), "বাঘাইড় আর চিতল, এখন কম পাওয়া যায় এমন মাছও তোমার পাতে উঠেছে।");
  assert.match(fishLine(["rupchanda", "loitta", "churi", "surma"]), /^রূপচাঁদা, লইট্টা আর ছুরি: সাগরের/);
  assert.match(fishLine(DEFAULT_PICKS), /শুরুটা চেনা মাছ দিয়ে/);
  assert.match(fishLine([]), /ফাঁকা/);
});

test("the card counts picks in list order and compares with a friend", () => {
  const card = createCard({ selected: ["kachki", "rui", "ilish"], name: "" }, { selected: ["rui", "boal"], name: "তানিয়া" });
  assert.equal(card.count, 3);
  assert.equal(card.title, "আমার ডালা");
  assert.deepEqual(card.fish.map(fish => fish.id), ["ilish", "rui", "kachki"]);
  assert.equal(card.match, "তানিয়ার সাথে ১টা মিলে গেছে");
});

test("every fish fits inside the oval tray, from one fish to all forty", () => {
  for (const [rx, ry] of [[452, 368], [452, 416]]) {
    for (let count = 1; count <= fishes.length; count++) {
      const slots = traySlots(count, rx, ry);
      assert.equal(slots.length, count, `${count} in ${rx}×${ry}`);
      for (const { x, y, w } of slots) for (const [px, py] of [[x, y], [x + w, y], [x, y + w * SLOT_RATIO], [x + w, y + w * SLOT_RATIO]]) {
        assert.ok((px / rx) ** 2 + (py / ry) ** 2 <= 1.0001, `slot outside tray at ${count}`);
      }
    }
  }
  assert.deepEqual(traySlots(0, 400, 300), []);
});
