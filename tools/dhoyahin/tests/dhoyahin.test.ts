import assert from "node:assert/strict";
import test from "node:test";
import { share } from "../share";
import { site } from "../content";
import { cheers, cleanName, dhakaToday, headline, humanLine, loadQuit, localToday, parseState, plant, previewTitle, relations, saveQuit, spanText, stateOf, stats, tally, MAX_NAME, MAX_PRICE, MAX_STICKS, PLANT_LEAVES, STORAGE_KEY } from "../lib/dhoyahin";

const TODAY = "2026-10-10";

test("the brief's example link: 60 days, 600 sticks, 9,000 taka", () => {
  const quit = parseState("#d=2026-08-11&k=10&p=15&n=রাফি", TODAY)!;
  const count = tally(quit, TODAY);
  assert.deepEqual([count.days, count.skipped, count.saved], [60, 600, 9000]);
  assert.deepEqual(stats(count, quit.sticks), ["৬০০টা সিগারেট খাইনি", "৯,০০০ টাকা বাঁচল"]);
  assert.equal(headline(quit, count).big, "৬০ দিন");
  assert.equal(previewTitle(quit, TODAY), "রাফির ৬০ দিন ধোঁয়াহীন, ৯,০০০ টাকা বাঁচল");
});

test("quit today is day one, with a per-day promise instead of zero taka", () => {
  const count = tally({ date: TODAY, sticks: 20, price: 7.5, name: "" }, TODAY);
  assert.equal(count.days, 0);
  assert.equal(count.line, "প্রথম দিনটাই সবচেয়ে কঠিন, আর তুমি সেটা পার করছ।");
  assert.deepEqual(stats(count, 20), ["দিনে ২০টা কম", "দিনে ১৫০ টাকা বাঁচবে"]);
});

test("a planned date counts down and saves nothing yet", () => {
  const quit = { date: "2027-01-01", sticks: 10, price: 15, name: "" };
  const count = tally(quit, TODAY);
  assert.equal(count.days, -83);
  assert.equal(count.saved, 0);
  assert.equal(headline(quit, count).big, "আর ৮৩ দিন");
  assert.equal(plant(count.days).seed, true);
});

test("a state survives the link round trip, cheer included", () => {
  const quit = { date: "2026-01-01", sticks: 12, price: 18.5, name: "নাদিয়া", cheer: { line: "gorbito", from: "ammu" } } as const;
  assert.deepEqual(parseState(stateOf(quit), TODAY), quit);
  assert.deepEqual(parseState("#" + stateOf(quit), TODAY), quit);
});

test("hostile links are rejected or clamped, never trusted", () => {
  assert.equal(parseState("", TODAY), null);
  assert.equal(parseState("#d=2026-02-30", TODAY), null);
  assert.equal(parseState("#d=1970-01-01", TODAY), null);
  assert.equal(parseState("#d=2028-01-01", TODAY), null);
  assert.equal(parseState("#result", TODAY), null);
  assert.equal(parseState("#%E0%A4", TODAY), null);
  const odd = parseState("#d=2026-10-01&k=99999&p=-5&c=evil&w=ammu", TODAY)!;
  assert.deepEqual([odd.sticks, odd.price, odd.cheer], [10, 15, undefined]);
  const big = parseState("#d=2026-10-01&k=500&p=999", TODAY)!;
  assert.deepEqual([big.sticks, big.price], [MAX_STICKS, MAX_PRICE]);
});

test("names are NFC, stripped of control and direction characters, and capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME + 9)).length, MAX_NAME);
  assert.equal(cleanName("অা"), "আ".normalize("NFC") === "আ" ? cleanName("অা") : "");
  assert.equal(cleanName("é"), "é");
});

test("server normalize only accepts real states and drops junk keys", () => {
  assert.equal(share.normalize("d=2026-09-01&k=10&p=15&x=1"), "d=2026-09-01&k=10&p=15");
  assert.equal(share.normalize("hello"), null);
  assert.equal(share.tally, undefined);
  assert.match(share.preview("d=2026-09-01&k=10&p=15&n=রাফি&c=pashe&w=abbu").title, /^আব্বু লিখেছে: চালিয়ে যাও, পাশে আছি — রাফির /);
});

test("the plant grows a leaf a day to a month, then a flower a month, and keeps old leaves in place", () => {
  assert.equal(plant(0).leaves.length, 2);
  assert.equal(plant(10).leaves.length, 12);
  assert.equal(plant(400).leaves.length, PLANT_LEAVES + 2);
  assert.deepEqual([plant(29).flowers.length, plant(30).flowers.length, plant(1000).flowers.length], [0, 1, 12]);
  assert.deepEqual(plant(5).leaves[3], { ...plant(20).leaves[3], fresh: plant(5).leaves[3].fresh });
});

test("calendar spans read naturally", () => {
  assert.equal(spanText("2026-09-15", TODAY), "");
  assert.equal(spanText("2026-08-10", TODAY), "২ মাস");
  assert.equal(spanText("2025-08-11", TODAY), "১ বছর ১ মাস");
  assert.equal(spanText("2024-10-10", TODAY), "২ বছর");
});

test("human lines never repeat across the milestones", () => {
  const lines = [-1, 0, 3, 7, 14, 30, 60, 90, 180, 365].map(humanLine);
  assert.equal(new Set(lines).size, lines.length);
});

test("dates follow the phone, previews follow Dhaka", () => {
  assert.equal(localToday(new Date(2026, 9, 10, 23, 59)), TODAY);
  assert.equal(dhakaToday(new Date("2026-10-10T18:00:00Z")), "2026-10-11");
});

test("progress is saved without the cheer and survives broken storage", () => {
  const box = new Map<string, string>();
  const storage = { getItem: (key: string) => box.get(key) ?? null, setItem: (key: string, value: string) => void box.set(key, value) };
  saveQuit(storage, { date: "2026-09-01", sticks: 5, price: 12, name: "জয়", cheer: { line: "cha", from: "bon" } });
  assert.doesNotMatch(box.get(STORAGE_KEY)!, /c=|w=/);
  assert.deepEqual(loadQuit(storage, TODAY), { date: "2026-09-01", sticks: 5, price: 12, name: "জয়".normalize("NFC") });
  const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("full"); } };
  assert.equal(loadQuit(broken, TODAY), null);
  assert.doesNotThrow(() => saveQuit(broken, { date: TODAY, sticks: 5, price: 12, name: "" }));
});

test("fixed ids are unique and content meets the SEO bar", () => {
  assert.equal(new Set(cheers.map(item => item.id)).size, cheers.length);
  assert.equal(new Set(relations.map(item => item.id)).size, relations.length);
  assert.ok(site.title.length <= 45);
  assert.ok(site.description.length >= 120 && site.description.length <= 160);
  assert.ok(site.faq.length >= 5);
});
