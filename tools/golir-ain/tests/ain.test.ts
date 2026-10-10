import assert from "node:assert/strict";
import test from "node:test";
import { ainLine, cleanPara, decodeRules, defaultAin, encodeRules, linePriority, matchLine, parseShareHash, previewTitle, rules, shareHash, toggleRule, MAX_PARA_LENGTH } from "../lib/ain";
import { share } from "../share";

test("rule ids are unique, fit 24 bits, and every one has a line priority", () => {
  const ids = rules.map(rule => rule.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length <= 24);
  assert.deepEqual([...linePriority].sort(), [...ids].sort());
});

test("tapping a rule twice removes it; unknown rules are refused", () => {
  assert.deepEqual(toggleRule(toggleRule([], "drain"), "drain"), []);
  assert.throws(() => toggleRule([], "ছাদ"), RangeError);
});

test("ticks and পাড়া survive the link round trip, including the first and last rule", () => {
  const all = rules.map(rule => rule.id);
  assert.deepEqual(decodeRules(encodeRules(all)), all);
  const ain = { ticked: ["chhad", "drain", "deyal-stump"] as typeof defaultAin.ticked, para: "কলাবাগান" };
  assert.deepEqual(parseShareHash(shareHash(ain)), ain);
  assert.deepEqual(parseShareHash(shareHash(defaultAin)), defaultAin);
});

test("hostile, empty or oversized hashes are refused instead of crashing", () => {
  for (const hash of ["", "#result", "#r=", "#r=0", "#r=%%%", "#r=-1", "#r=ZZ", "#r=zzzzz", "#r=123456", "#r=1.5", "#p=কলাবাগান"]) {
    assert.equal(parseShareHash(hash), null, hash);
  }
  assert.equal(share.normalize("r=zzzzzz"), null);
  assert.equal(share.normalize("#r=1&x=1&p=%20মিরপুর%20"), "r=1&p=" + encodeURIComponent("মিরপুর"));
});

test("পাড়া is NFC, loses control and direction-override characters, and is capped", () => {
  assert.equal(cleanPara("  মিরপুর‮  ১০\n"), "মিরপুর ১০");
  assert.equal(cleanPara("ক".repeat(MAX_PARA_LENGTH + 10)).length, MAX_PARA_LENGTH);
  assert.equal(cleanPara("মোহাম্মদপুর".normalize("NFD")), "মোহাম্মদপুর".normalize("NFC"));
  assert.equal(parseShareHash("#r=1&p=" + encodeURIComponent("<b>x</b>".repeat(10)))?.para.length, MAX_PARA_LENGTH);
});

test("the human line comes from the most particular rule ticked", () => {
  assert.equal(ainLine(defaultAin.ticked), "ব্যাটের মালিকই পাড়ার আসল ক্যাপ্টেন।");
  assert.equal(ainLine([...defaultAin.ticked, "drain"]), "বলের চেয়ে ড্রেন বেশি চেনো তুমি।");
  assert.match(ainLine(rules.map(rule => rule.id)), /খেলার চেয়ে নিয়ম বেশি/);
});

test("a friend's wall overlays yours with a match count", () => {
  assert.equal(matchLine(["chhad", "drain", "ammu"], { ticked: ["chhad", "ammu", "trial"], para: "মিরপুর" }), "মিরপুরের গলির সাথে মিল ২টা আইনে");
  assert.equal(matchLine(["drain"], { ticked: ["chhad"], para: "" }), "বন্ধুর গলির সাথে একটাও মেলেনি!");
  assert.equal(matchLine(["drain"], null), "");
});

test("the link preview is personal and the tally only counts fixed rule ids", () => {
  assert.equal(previewTitle({ ticked: ["chhad", "trial"], para: "কলাবাগান" }), "কলাবাগানের গলির ক্রিকেটে ২টা আইন — তোমার গলিতে কী ছিল?");
  assert.match(share.preview("r=1").title, /^এক পাড়ার গলির ক্রিকেটে ১টা আইন/);
  assert.deepEqual(share.tally, rules.map(rule => rule.id));
});
