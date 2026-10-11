import assert from "node:assert/strict";
import test from "node:test";
import { cleanName, colors, commonLine, currentEid, decodePicks, defaultPicks, eidLine, eidTitle, encodePicks, items, leadingColor, parseShareHash, previewTitle, shareHash, toggleItem, MAX_NAME_LENGTH, TOTAL, type Eid } from "../lib/eid";
import { slots } from "../lib/hand";
import { share } from "../share";

test("there are 25 unique items, each with its own motif, and no worship is scored", () => {
  assert.equal(TOTAL, 25);
  assert.equal(new Set(items.map(item => item.id)).size, 25);
  assert.deepEqual(Object.keys(slots).sort(), items.map(item => item.id).sort());
  assert.equal(new Set(Object.values(slots)).size, 25);
  for (const item of items) assert.doesNotMatch(item.label, /নামাজ|যাকাত|ফিতরা|রোজা/);
  for (const id of defaultPicks) assert.ok(items.some(item => item.id === id));
});

test("a card survives the link round trip", () => {
  const eid: Eid = { color: "pink", picked: ["chand", "semai", "chhobi"], eid: "fitr27", name: "রাফি" };
  const hash = shareHash(eid);
  assert.equal(hash, `#c=pink&i=${encodePicks(eid.picked)}&e=fitr27&n=${encodeURIComponent("রাফি")}`);
  assert.deepEqual(parseShareHash(hash), eid);
  const all = items.map(item => item.id);
  assert.deepEqual(decodePicks(encodePicks(all)), all);
  assert.ok(encodePicks(all).length <= 5);
  for (const color of colors) assert.equal(parseShareHash(shareHash({ ...eid, color: color.id }))?.color, color.id);
  assert.deepEqual(parseShareHash("c=green&i=1"), { color: "green", picked: ["chand"], eid: "", name: "" });
});

test("hostile, empty or out-of-range hashes are refused", () => {
  for (const hash of ["", "#result", "#c=purple&i=1", "#c=green", "#c=green&i=0", "#c=green&i=-1", "#c=green&i=zzzzzz", "#c=green&i=1.5", "#c=<b>&i=1", "#c=green&i=%ZZ", "#i=1"]) {
    assert.equal(parseShareHash(hash), null, hash);
  }
  assert.equal(parseShareHash("#c=green&i=1&e=adha99")?.eid, "");
  assert.equal(parseShareHash("#c=green&i=1&e=fitr2027")?.eid, "");
  assert.equal(share.normalize("c=green&i=zzzzzz"), null);
  assert.equal(share.normalize("#c=green&i=1&x=1&n=%20রাফি%20"), "c=green&i=1&n=" + encodeURIComponent("রাফি"));
});

test("names are NFC, lose control and direction-override characters, and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(Array.from(cleanName("ক".repeat(MAX_NAME_LENGTH + 10))).length, MAX_NAME_LENGTH);
  const decomposed = "ময়না".normalize("NFD");
  assert.equal(cleanName(decomposed), "ময়না".normalize("NFC"));
  assert.equal(parseShareHash("#c=green&i=1&n=" + encodeURIComponent(decomposed))?.name, "ময়না".normalize("NFC"));
});

test("the human line comes from what was ticked", () => {
  assert.equal(eidLine(["salami", "salami-dewa"]), "নিলেও, দিলেও। এটাই বড় হওয়া।");
  assert.equal(eidLine(items.map(item => item.id)), "পুরো ২৫! এমন ঈদ বছরে একবারই আসে।");
  assert.equal(eidLine(["ghum"]), "ঈদের আসল আনন্দ দুপুরের ঘুমে।");
  assert.equal(eidLine(["video", "semai"]), "দূরে আছি, তবু ভিডিও কলেই ঈদ মোবারক।");
  assert.equal(eidLine([]), "এখনো একটাও টিক দাওনি।");
  assert.deepEqual(toggleItem(toggleItem(["semai"], "ghum"), "semai"), ["ghum"]);
});

test("friend overlay, previews and the colour tally", () => {
  const friend: Eid = { color: "green", picked: ["semai", "ghum", "adda", "mela"], eid: "", name: "মিম" };
  assert.equal(commonLine({ color: "red", picked: ["semai", "ghum"] }, friend), "দুজনেরই: সেমাই, দুপুরের ঘুম");
  assert.equal(commonLine({ color: "green", picked: ["semai", "ghum", "adda"] }, friend), "দুজনেরই: সবুজ জামা, সেমাই আর ২টা");
  assert.equal(commonLine({ color: "red", picked: ["chand"] }, friend), "মিমের সাথে একটাও মেলেনি!");
  assert.equal(commonLine({ color: "red", picked: ["chand"] }, null), "");
  assert.equal(previewTitle({ ...friend, name: "রাফি" }), "রাফির ঈদে ২৫-এ ৪টা হলো — তোমার কয়টা?");
  assert.equal(previewTitle({ ...friend, name: "" }), "এক বন্ধুর ঈদে ২৫-এ ৪টা হলো — তোমার কয়টা?");
  assert.equal(share.preview(shareHash(friend).slice(1)).title, "মিমের ঈদে ২৫-এ ৪টা হলো — তোমার কয়টা?");
  assert.equal(leadingColor({ green: 20, red: 5 }, 30), null);
  assert.equal(leadingColor({ green: 20, red: 20 }, 30), null);
  assert.equal(leadingColor({ green: 25, red: 10, semai: 99 }, 30)?.id, "green");
  assert.ok(share.tally?.includes("green") && share.tally.includes("semai"));
});

test("the Eid on the card is the coming Eid-ul-Fitr, kept for a week after", () => {
  assert.equal(currentEid(new Date("2026-10-10T06:00:00Z"))?.eid, "fitr27");
  assert.equal(currentEid(new Date("2027-03-16T06:00:00Z"))?.eid, "fitr27");
  assert.equal(currentEid(new Date("2027-03-18T06:00:00Z"))?.eid, "fitr28");
  assert.equal(eidTitle("fitr27"), "ঈদুল ফিতর ২০২৭");
  assert.equal(eidTitle(""), "ঈদ");
});
