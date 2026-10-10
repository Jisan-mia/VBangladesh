import assert from "node:assert/strict";
import test from "node:test";
import { LIMITS, bankLine, caption, cleanText, coinScale, defaultBank, loadBank, parseShareHash, plan, previewTitle, readTaka, saveBank, shareHash, sumLine, STORAGE_KEY, type Bank } from "../lib/bank";
import { share } from "../share";

const TODAY = "2026-10-10";
const base = defaultBank(TODAY);

test("the default is ২০ টাকা a day until Eid-ul-Fitr (সম্ভাব্য ১০ মার্চ ২০২৭)", () => {
  const p = plan(base)!;
  assert.equal(p.date, "2027-03-10");
  assert.equal(p.likely, true);
  assert.equal(p.count, 151);
  assert.equal(p.total, 3020);
  assert.equal(sumLine(base, p), "রোজ ২০ টাকা × ১৫১ দিন = ৩,০২০ টাকা");
  assert.deepEqual([p.on, plan({ ...base, until: "durga" })!.on, plan({ ...base, until: "2027-02-14" })!.of], ["ঈদুল ফিতরে", "দুর্গাপূজায়", "১৪ ফেব্রুয়ারি ২০২৭-এর"]);
});

test("a weekly bank gets one coin every seventh day, the first one today", () => {
  assert.equal(plan({ ...base, every: "week" })!.count, 22); // 151 days → coins on day 0, 7 … 147
  assert.equal(plan({ ...base, every: "week", until: "2026-10-17" })!.count, 1);
  assert.equal(plan({ ...base, every: "week", until: "2026-10-18" })!.count, 2);
});

test("a custom date must be ahead of the start and within three years", () => {
  assert.equal(plan({ ...base, until: "2026-11-09" })!.count, 30);
  assert.equal(plan({ ...base, until: TODAY }), null);
  assert.equal(plan({ ...base, until: "2026-10-01" }), null);
  assert.equal(plan({ ...base, until: "2030-01-01" }), null);
  assert.equal(plan({ ...base, until: "2027-02-30" }), null);
  assert.equal(plan({ ...base, per: 0 }), null);
});

test("starting on the break day itself saves for the next one", () => {
  assert.equal(plan({ ...base, until: "christmas", start: "2026-12-25" })!.date, "2027-12-25");
});

test("the human line follows progress, and the brief's half-full line is exact", () => {
  const p = plan({ ...base, until: "2026-11-09" })!;
  assert.equal(bankLine(base, p, 15), "অর্ধেক ভরা — বাকি অর্ধেক আরও সহজ।");
  assert.equal(bankLine(base, p, 30), "ব্যাংক ভরে গেছে, এবার ভাঙার পালা!");
  assert.equal(bankLine({ until: "2026-11-09" }, p, null), "দিন গুনে গুনে ব্যাংক ভরবে।");
  assert.equal(bankLine(base, plan(base)!, null), "চাঁদরাতে ব্যাংক ভাঙার অপেক্ষা শুরু।");
});

test("the coin grid never draws more than 150 circles", () => {
  for (const count of [1, 150, 151, 400, 1096]) assert.ok(count / coinScale(count) <= 150);
  assert.equal(coinScale(151), 2);
});

test("a goal survives the link round trip; coins only travel when chosen", () => {
  const bank: Bank = { per: 50, every: "week", until: "boishakh", start: TODAY, label: "বৈশাখী মেলা", name: "রাফি", coins: null };
  assert.deepEqual(parseShareHash(shareHash(bank), TODAY), bank);
  const custom: Bank = { ...bank, until: "2027-02-14", coins: 3 };
  assert.deepEqual(parseShareHash(shareHash(custom), TODAY), custom);
  assert.equal(shareHash({ ...base, coins: null }), "#t=20&e=d&o=eid-fitr&s=2026-10-10");
});

test("hostile or broken links are refused or fall back safely", () => {
  assert.equal(parseShareHash("", TODAY), null);
  assert.equal(parseShareHash("#t=20&o=eid-fitr", TODAY), null, "no start date");
  assert.equal(parseShareHash("#t=-5&o=eid-fitr&s=2026-10-10", TODAY), null);
  assert.equal(parseShareHash(`#t=${LIMITS.per + 1}&o=eid-fitr&s=2026-10-10`, TODAY), null);
  assert.equal(parseShareHash("#t=1e3&o=eid-fitr&s=2026-10-10", TODAY), null);
  assert.equal(parseShareHash("#t=20&o=hack&s=2026-10-10", TODAY), null);
  assert.equal(parseShareHash("#t=20&o=eid-fitr&s=2019-01-01", TODAY), null, "start too far back");
  assert.equal(parseShareHash("#t=20&e=zz&o=eid-fitr&s=2026-10-10", TODAY)?.every, "day");
  assert.equal(parseShareHash("#t=20&o=eid-fitr&s=2026-10-10&c=999", TODAY)?.coins, null, "more coins than the bank holds");
  assert.equal(parseShareHash("#t=20&o=eid-fitr&s=2026-10-10&c=-1", TODAY)?.coins, null);
  assert.equal(parseShareHash("#t=20&o=eid-fitr&s=2026-10-10&n=" + "ক".repeat(500), TODAY), null, "overlong links are refused outright");
});

test("names and labels are NFC, stripped of control and bidi characters, and capped", () => {
  assert.equal(cleanText("  ঈদের‮  জামা\n", LIMITS.label), "ঈদের জামা");
  assert.equal(cleanText("ঈদের জামা".normalize("NFD"), LIMITS.label), cleanText("ঈদের জামা", LIMITS.label));
  assert.equal([...cleanText("চ".repeat(80), LIMITS.name)].length, LIMITS.name);
  assert.equal(parseShareHash("#t=20&o=eid-fitr&s=2026-10-10&n=%E2%80%AEabc", TODAY)?.name, "abc");
});

test("typed amounts accept Bangla digits and commas, nothing else", () => {
  assert.equal(readTaka("১,০০০"), 1000);
  assert.ok(Number.isNaN(readTaka("১০.৫")));
  assert.ok(Number.isNaN(readTaka("-5")));
});

test("progress is saved in the browser with coins, and a broken store is ignored", () => {
  const memory = new Map<string, string>();
  const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => void memory.set(key, value) };
  assert.equal(saveBank(storage, { ...base, coins: 7 }), true);
  assert.equal(loadBank(storage, TODAY)?.coins, 7);
  memory.set(STORAGE_KEY, "garbage");
  assert.equal(loadBank(storage, TODAY), null);
  assert.equal(saveBank({ setItem: () => { throw new Error("quota"); } }, base), false);
  assert.equal(loadBank({ getItem: () => { throw new Error("blocked"); } }, TODAY), null);
});

test("captions and link previews are personal, with progress only when shown", () => {
  const p = plan(base)!;
  assert.equal(caption({ ...base, coins: null }, p), "মাটির ব্যাংকে রোজ ২০ টাকা জমাচ্ছি, ঈদুল ফিতরের আগে ভাঙলে হবে ৳৩,০২০! তুমিও আমার সাথে জমাবে?");
  assert.equal(previewTitle({ ...base, name: "রাফি", coins: 18 }, p), "রাফির মাটির ব্যাংকে ১৫১-এ ১৮ · ৳৩৬০ জমল — তোমার ব্যাংকে কত?");
});

test("the server share normalizes and previews", () => {
  assert.equal(share.normalize("t=020&o=eid-fitr&s=" + new Date(Date.now() + 6 * 3_600_000).toISOString().slice(0, 10))?.startsWith("t=20&e=d&o=eid-fitr&s="), true);
  assert.equal(share.normalize("t=abc"), null);
  assert.equal(share.tally, undefined);
});
