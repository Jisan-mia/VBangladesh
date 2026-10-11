import assert from "node:assert/strict";
import test from "node:test";
import { cleanName, divisionSplit, laneTitle, nationalSplit, parseShareHash, previewTitle, roofTitle, shareHash, supportLine, tallyIds, voteItems, MAX_NAME_LENGTH, SPLIT_MIN, type Shared } from "../lib/roof";
import { sceneSvg } from "../lib/scene";
import { share } from "../share";

test("a roof and its neighbour survive the link round trip", () => {
  const card: Shared = { own: { team: "bra", year: 2014, name: "মিম" }, neighbour: { team: "arg", year: 2002, name: "রাফি" } };
  assert.deepEqual(parseShareHash(shareHash(card)), card);
  const alone: Shared = { own: { team: "eng", year: null, name: "" }, neighbour: null };
  assert.deepEqual(parseShareHash(shareHash(alone)), alone);
  assert.equal(shareHash(alone), "#t=eng");
});

test("hostile or unrelated hashes are ignored instead of crashing", () => {
  for (const hash of ["", "#", "#result", "#tool", "#t=", "#t=evil", "#t=__proto__", "#t=constructor", "#ft=arg", "#t=" + "a".repeat(5000)]) assert.equal(parseShareHash(hash), null, hash.slice(0, 20));
  for (const y of ["1985", "2030", "2002.0", "abc", "", "1e3"]) assert.equal(parseShareHash(`#t=arg&y=${y}`)?.own.year, null, y);
  assert.equal(parseShareHash("#t=arg&ft=nope&fn=x")?.neighbour, null);
  assert.equal(parseShareHash("#t=arg&n=%%%E0%A")?.own.name, "%%�%A");
});

test("names are NFC, lose control and direction-override characters, and are capped", () => {
  assert.equal(cleanName("  রাফি\u202e  হাসান\n"), "রাফি হাসান");
  // the zero-width joiner Bangla needs (র‍্যাব) is kept
  assert.equal(cleanName("র\u200d\u09cdযাব"), "র\u200d\u09cdযাব");
  assert.equal(cleanName("e\u0301"), "\u00e9");
  assert.equal(Array.from(cleanName("ক".repeat(MAX_NAME_LENGTH + 10))).length, MAX_NAME_LENGTH);
  assert.equal(parseShareHash(`#t=arg&n=${encodeURIComponent("ম".repeat(200))}`)?.own.name.length, MAX_NAME_LENGTH);
});

test("the human line follows the year, with the span computed", () => {
  assert.equal(supportLine(1990, 2026), "৩৬ বছর, একবারও দল বদলাইনি।");
  assert.equal(supportLine(1986, 2026), "৪০ বছর, একবারও দল বদলাইনি।");
  assert.equal(supportLine(2006, 2026), "বড় হয়েছি এই পতাকার নিচে।");
  assert.equal(supportLine(2022, 2026), "নতুন প্রেম, পুরো জোর।");
  assert.match(supportLine(null), /পতাকা/);
});

test("titles read like a person wrote them", () => {
  assert.equal(roofTitle({ team: "arg", year: 2002, name: "রাফি" }), "রাফির ছাদে ২০০২ থেকে আর্জেন্টিনা");
  assert.equal(roofTitle({ team: "bra", year: null, name: "" }), "আমার ছাদে ব্রাজিলের পতাকা");
  assert.equal(laneTitle({ team: "bra", year: null, name: "মিম" }, { team: "arg", year: 2002, name: "রাফি" }), "রাফি আর্জেন্টিনা, মিম ব্রাজিল");
  assert.equal(laneTitle({ team: "arg", year: null, name: "" }, { team: "arg", year: null, name: "" }), "পাশের বাসা আর আমি, দুই ছাদেই আর্জেন্টিনা");
  assert.equal(previewTitle({ own: { team: "arg", year: 2002, name: "রাফি" }, neighbour: null }), "রাফির ছাদে আর্জেন্টিনার পতাকা। তোমার ছাদে কোনটা?");
});

test("share normalizes and previews; tally holds only fixed ids", () => {
  assert.equal(share.normalize("t=arg&y=2002&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF&junk=1"), "t=arg&y=2002&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.equal(share.normalize("t=messi"), null);
  assert.match(share.preview("t=arg&n=রাফি").title, /^রাফির ছাদে/);
  assert.ok(share.tally?.every(id => /^[a-z]+(-[a-z]+)?$/.test(id)));
  assert.deepEqual(voteItems("bra", "sylhet"), ["bra", "sylhet-bra"]);
  assert.ok(voteItems("bra", "sylhet").every(id => tallyIds.includes(id)));
});

test("splits stay hidden below the minimum sample and add up to 100", () => {
  assert.equal(nationalSplit({ total: SPLIT_MIN - 1, counts: { arg: SPLIT_MIN - 1 } }), null);
  assert.equal(nationalSplit(null), null);
  const split = nationalSplit({ total: 30, counts: { arg: 17, bra: 10, ger: 3, "dhaka-arg": 5 } })!;
  assert.deepEqual(split, { arg: 57, bra: 33, other: 10, total: 30 });
  assert.equal(divisionSplit({ total: 30, counts: { "dhaka-arg": 5 } }, "dhaka"), null);
  assert.equal(divisionSplit({ total: 40, counts: { "dhaka-arg": 12, "dhaka-bra": 8 } }, "dhaka")?.arg, 60);
});

test("the scene draws one flag per chosen team and an empty pole otherwise", () => {
  const base = { width: 1080, height: 760, ground: 700, poleTop: 120, id: "t" };
  assert.equal(sceneSvg({ ...base, houses: [{ team: null }] }).match(/abn-rise/g), null);
  assert.equal(sceneSvg({ ...base, houses: [{ team: "arg" }, { team: "bra" }] }).match(/class="abn-rise"/g)?.length, 2);
  assert.doesNotMatch(sceneSvg({ ...base, houses: [{ team: "eng" }] }), /NaN|undefined/);
});
