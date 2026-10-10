import assert from "node:assert/strict";
import test from "node:test";
import { chitTitle, cleanName, decodeOrder, defaultLine, encodeOrder, extras, favourite, MAX_LINES, MAX_NAME, orderLine, tallyIds, toggleExtra, totalText, type Line } from "../lib/order";

const rafi: Line = { ...defaultLine, name: "রাফি" };
const mim: Line = { tea: "lebu", sugar: "0", cup: "bhar", extras: ["singara", "biscuit"], name: "মিম" };

test("a group chit survives the link round trip with names in order", () => {
  assert.deepEqual(decodeOrder(encodeOrder([rafi, mim])), [rafi, mim]);
});

test("the link matches the documented shape", () => {
  assert.equal(encodeOrder([{ ...defaultLine }]), "o=dudh.kom.cup.toast");
  assert.equal(new URLSearchParams(encodeOrder([rafi, mim])).get("n"), "রাফি,মিম");
  assert.deepEqual(decodeOrder("#o=lebu.0.bhar&n=,%E0%A6%AE%E0%A6%BF%E0%A6%AE")?.[0].extras, []);
});

test("hostile or broken links are ignored instead of crashing", () => {
  assert.equal(decodeOrder(""), null);
  assert.equal(decodeOrder("#o=%%%"), null);
  assert.equal(decodeOrder("#o=coffee.kom.cup"), null);
  assert.equal(decodeOrder("#o=dudh.kom.cup.biscuit.extra"), null);
  assert.equal(decodeOrder("#o=dudh.kom.cup.toast_toast_toast_toast"), null);
  assert.equal(decodeOrder("#o=__proto__.kom.cup"), null);
  // A bad line is dropped, good ones stay.
  assert.deepEqual(decodeOrder("#o=dudh.kom.cup;evil;rong.0.bhar")?.map(line => line.tea), ["dudh", "rong"]);
});

test("links carry at most six lines and three extras, without duplicates", () => {
  const many = Array.from({ length: 9 }, () => defaultLine);
  assert.equal(decodeOrder(encodeOrder(many))?.length, MAX_LINES);
  assert.deepEqual(decodeOrder("#o=dudh.kom.cup.toast_toast")?.[0].extras, ["toast"]);
});

test("names are NFC, lose control, bidi and comma characters, and are capped", () => {
  assert.equal(cleanName("  রি‮মা,\n"), "রিমা");
  assert.equal(cleanName("ক".repeat(MAX_NAME + 5)).length, MAX_NAME);
  assert.equal(cleanName("ক\u09c7\u09be"), "ক\u09cb");
  assert.equal(cleanName("é"), "é");
});

test("a fourth extra pushes out the oldest, a second tap removes one", () => {
  assert.deepEqual(toggleExtra(["toast", "biscuit", "puri"], "kola"), ["biscuit", "puri", "kola"]);
  assert.deepEqual(toggleExtra(["toast"], "toast"), []);
});

test("titles, totals and the human line read from the order", () => {
  assert.equal(chitTitle([rafi]), "রাফির অর্ডার");
  assert.equal(chitTitle([defaultLine]), "আমার অর্ডার");
  assert.equal(chitTitle([rafi, mim]), "আড্ডার অর্ডার · ২ জন");
  assert.equal(totalText([rafi, mim, { ...mim, extras: ["singara"] }]), "৩ কাপ চা · ২টা সিঙ্গারা · ১টা টোস্ট · ১টা বিস্কুট");
  assert.equal(orderLine([{ ...mim, extras: ["biscuit"] }]), "চায়ে স্বাস্থ্য খোঁজো, বিস্কুটে সেটা ভাঙো।");
  assert.match(orderLine([rafi, mim]), /২ রকম চা/);
});

test("the tally counts only fixed, unique ids", () => {
  assert.equal(new Set(tallyIds).size, tallyIds.length);
  assert.ok(extras.every(extra => tallyIds.includes(extra.id)));
  assert.equal(favourite({ rong: 9, dudh: 4, "0": 7 }, 5, 30), null);
  assert.equal(favourite({ rong: 9, dudh: 4, "0": 7 }, 40, 30), "রং চা, চিনি ছাড়া");
});
