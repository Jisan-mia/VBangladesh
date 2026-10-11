import assert from "node:assert/strict";
import test from "node:test";
import { art, sceneSvg } from "../lib/art";
import { cleanName, createCard, dhakaToday, items, layoutPlate, mostPicked, parseShareHash, plateLine, places, ramadanDay, ramadanLine, shareHash, starters, toggleItem, MAX_ITEMS, MAX_NAME_LENGTH, SCENE, type ItemId } from "../lib/plate";
import { share } from "../share";

const all = items.map(item => item.id);

test("every item has a unique id and a drawing; the plate opens with the usual six", () => {
  assert.equal(new Set(all).size, all.length);
  for (const id of all) assert.ok(art[id], id);
  assert.deepEqual(starters, ["khejur", "sharbat", "chola", "peyaju", "beguni", "muri"]);
  assert.ok(!all.some(id => (places as readonly { id: string }[]).some(place => place.id === id)), "place ids must not collide with item ids in the tally");
});

test("tapping adds in list order, tapping again removes, and the plate stops at twelve", () => {
  assert.deepEqual(toggleItem(["chola"], "khejur").picks, ["khejur", "chola"]);
  assert.deepEqual(toggleItem(toggleItem(starters, "haleem").picks, "haleem").picks, starters);
  const full = all.slice(0, MAX_ITEMS);
  const tooMany = toggleItem(full, all[MAX_ITEMS]);
  assert.equal(tooMany.full, true);
  assert.deepEqual(tooMany.picks, full);
  assert.throws(() => toggleItem([], "pizza"), RangeError);
});

test("a plate survives the link round trip with readable ids", () => {
  const plate = { picks: ["peyaju", "khejur", "chola"] as ItemId[], place: "probash" as const, name: "রাফি" };
  const hash = shareHash(plate);
  assert.equal(hash, "#i=khejur,chola,peyaju&w=probash&n=" + encodeURIComponent("রাফি"));
  assert.deepEqual(parseShareHash(hash), { picks: ["khejur", "chola", "peyaju"], place: "probash", name: "রাফি" });
  assert.deepEqual(parseShareHash("i=khejur%2Cchola")?.picks, ["khejur", "chola"]);
});

test("hostile, empty or oversized hashes are ignored or trimmed", () => {
  assert.equal(parseShareHash(""), null);
  assert.equal(parseShareHash("#result"), null);
  assert.equal(parseShareHash("#i=pizza,<script>"), null);
  assert.equal(parseShareHash("#i=" + "khejur,".repeat(60)), null);
  assert.deepEqual(parseShareHash("#i=khejur,khejur,khejur")?.picks, ["khejur"]);
  assert.equal(parseShareHash("#i=khejur&w=moon")?.place, "");
  assert.equal(parseShareHash("#i=" + all.join(","))?.picks.length, MAX_ITEMS);
  assert.equal(share.normalize("i=<img>"), null);
});

test("names are NFC, lose control and direction-override characters, and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  assert.equal(cleanName("ময়না"), "ময়না".normalize("NFC"));
  assert.equal(parseShareHash("#i=khejur&n=" + encodeURIComponent("ময়না"))?.name, "ময়না".normalize("NFC"));
});

test("the human line follows the brief", () => {
  assert.equal(plateLine([...starters, "haleem"], ""), "হালিম থাকলে ইফতার পুরো।");
  assert.equal(plateLine(starters, "probash"), "দেশের প্লেট, দূরের টেবিল।");
  assert.equal(plateLine(["chola", "beguni"], ""), "অল্প হলেও আপন।");
  assert.equal(plateLine(["khejur", "chola", "beguni", "jilapi"], ""), "মিষ্টি আর ঝাল, দুটোই চাই।");
  assert.equal(plateLine([], ""), "প্লেটটা এখনো ফাঁকা।");
});

test("the card names the plate's owner and compares with a friend's", () => {
  const card = createCard({ picks: ["khejur", "chola", "jilapi"], place: "basa", name: "তানিয়া" }, { picks: ["chola", "jilapi", "haleem"], place: "", name: "রাফি" });
  assert.equal(card.title, "তানিয়ার ইফতারির প্লেট");
  assert.equal(card.sub, "বাসায় · ৩ পদ");
  assert.equal(card.match, "দুজনের প্লেটেই: ছোলা, জিলাপি");
  assert.equal(card.friend?.label, "রাফির প্লেট");
  assert.equal(createCard({ picks: ["khejur"], place: "", name: "" }).title, "আমার ইফতারির প্লেট");
});

test("every layout keeps food on the plate and glasses on the cloth", () => {
  for (let count = 1; count <= MAX_ITEMS; count++) {
    const picks = all.slice(0, count);
    const spots = layoutPlate(picks);
    assert.equal(spots.length, count);
    for (const spot of spots) {
      const drink = ["pani", "sharbat", "lebu"].includes(spot.id);
      const reach = Math.hypot(spot.x - SCENE.cx, spot.y - SCENE.cy) + (drink ? 0 : spot.size * 0.42);
      if (!drink) assert.ok(reach <= SCENE.rim, `${spot.id} spills off a ${count}-item plate`);
      assert.ok(spot.x + spot.size / 2 <= SCENE.width + 4 && spot.y + spot.size / 2 <= SCENE.height, `${spot.id} leaves the scene`);
    }
  }
  assert.match(sceneSvg(starters, 500), /^<svg[^>]+width="500" height="452"/);
});

test("the tally ranking needs a minimum sample and only ranks food", () => {
  assert.equal(mostPicked({ beguni: 2 }, 2, 30), null);
  const ranked = mostPicked({ beguni: 34, peyaju: 20, basa: 50 }, 50, 30)!;
  assert.deepEqual(ranked.map(row => [row.label, row.percent]), [["বেগুনি", 68], ["পেঁয়াজু", 40]]);
});

test("share preview is personal and the tally only lists fixed ids", () => {
  const state = share.normalize("i=khejur,beguni&n=রাফি")!;
  assert.equal(state, "i=khejur,beguni&n=" + encodeURIComponent("রাফি"));
  assert.equal(share.preview(state).title, "রাফির ইফতারির প্লেট। তোমার প্লেটে কী?");
  assert.equal(share.preview("i=khejur").title, "এক বন্ধুর ইফতারির প্লেট। তোমার প্লেটে কী?");
  assert.deepEqual(share.tally, [...all, ...places.map(place => place.id)]);
});

test("the Ramadan day counts from the moon projection in Dhaka and is blank outside Ramadan", () => {
  assert.equal(ramadanDay("2026-10-11"), null);
  assert.equal(ramadanDay("2027-02-08"), null);
  assert.deepEqual(ramadanDay("2027-02-09"), { day: 1, likely: true });
  assert.equal(ramadanDay("2027-02-20")?.day, 12);
  assert.equal(ramadanDay("2027-03-09")?.day, 29);
  assert.equal(ramadanDay("2027-03-10"), null, "the projected Eid day is not a Ramadan day");
  assert.equal(ramadanDay("2028-01-29")?.day, 1);
  assert.equal(ramadanDay("2029-02-01"), null, "after the date table runs out");
  // Dhaka is UTC+6: 18:00 UTC on the 8th is already midnight on the 9th there.
  assert.equal(ramadanDay(dhakaToday(new Date("2027-02-08T17:59:59Z"))), null);
  assert.equal(ramadanDay(dhakaToday(new Date("2027-02-08T18:00:00Z")))?.day, 1);
  let previous = 0;
  for (let time = Date.UTC(2026, 0, 1); time < Date.UTC(2029, 0, 1); time += 86_400_000) {
    const day = ramadanDay(new Date(time).toISOString().slice(0, 10))?.day ?? 0;
    assert.ok(day <= 30 && (day === 0 || day === previous + 1), `day ${day} after ${previous}`);
    previous = day;
  }
});

test("the day line uses Bangla ordinals, says সম্ভাব্য until announced, and only sits on one's own card", () => {
  assert.equal(ramadanLine({ day: 12, likely: true }), "আজ রমজানের সম্ভাব্য ১২তম দিন");
  assert.equal(ramadanLine({ day: 12, likely: false }), "আজ রমজানের ১২তম দিন");
  assert.deepEqual([1, 2, 3, 4, 6, 10, 11].map(day => ramadanLine({ day, likely: false }).split(" ")[2]), ["১ম", "২য়", "৩য়", "৪র্থ", "৬ষ্ঠ", "১০ম", "১১তম"]);
  const plate = { picks: starters, place: "" as const, name: "" };
  assert.equal(createCard(plate, null, "", { day: 12, likely: true }).day, "আজ রমজানের সম্ভাব্য ১২তম দিন");
  assert.equal(createCard(plate).day, "");
});

test("a link shared before the Ramadan line opens the same plate, with no day on the friend's card", () => {
  const old = "i=khejur,chola,peyaju&w=probash&n=" + encodeURIComponent("রাফি");
  assert.equal(share.normalize(old), old);
  const friend = parseShareHash("#" + old)!;
  assert.deepEqual(friend, { picks: ["khejur", "chola", "peyaju"], place: "probash", name: "রাফি" });
  assert.equal(createCard(friend).day, "");
});
