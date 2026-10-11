import assert from "node:assert/strict";
import test from "node:test";
import { givers, parseShareHash, MAX_AMOUNT, MAX_NAME_LENGTH } from "../lib/cheque";
import { defaultKhata, khataGivers, khataHash, khataLine, khataPreviewTitle, khataTitle, khataTotal, parseKhataHash, type Khata } from "../lib/khata";
import { share } from "../share";

test("a খাতা survives the link round trip, amounts only where written", () => {
  const khata: Khata = { name: "রাফি", rows: [{ giver: "mama", amount: 500 }, { giver: "nanu", amount: null }, { giver: "dulabhai", amount: 1000 }] };
  const hash = khataHash(khata);
  assert.equal(hash, "#k=mama.500-nanu-dulabhai.1000&n=" + encodeURIComponent("রাফি"));
  assert.deepEqual(parseKhataHash(hash), khata);
  assert.equal(khataHash(defaultKhata), "#k=mama-khalamoni-nanu");
  for (const giver of khataGivers) assert.equal(parseKhataHash(khataHash({ name: "", rows: [{ giver: giver.id, amount: null }] }))?.rows[0].giver, giver.id);
});

test("the খাতা list starts with the cheque's givers, in order (append-only ids)", () => {
  assert.deepEqual(khataGivers.slice(0, givers.length), [...givers]);
  assert.equal(new Set(khataGivers.map(giver => giver.id)).size, khataGivers.length);
});

test("hostile, empty or broken খাতা hashes are refused", () => {
  for (const hash of ["", "#", "#k=", "#k=boss", "#k=mama-mama", "#k=mama--nanu", "#k=mama.", "#k=mama.0", "#k=mama.-5", "#k=mama.abc", "#k=mama.1.2", "#k=mama.12.5", `#k=mama.${MAX_AMOUNT + 1}`, "#k=<script>", "#result"]) {
    assert.equal(parseKhataHash(hash), null, hash);
  }
  assert.equal(parseKhataHash(`#k=mama.${MAX_AMOUNT}`)?.rows[0].amount, MAX_AMOUNT);
  assert.equal(parseKhataHash("#k=nanu&n=" + encodeURIComponent("রিমা‮ ".repeat(10)))?.name.length, MAX_NAME_LENGTH);
  assert.equal(share.normalize("k=mama.১০০০-nanu&x=1&n=%20রাফি%20"), "k=mama.1000-nanu&n=" + encodeURIComponent("রাফি"));
  assert.equal(share.normalize("k=boss"), null);
});

test("links made before the খাতা still open the same cheque", () => {
  const old = "g=mama&a=1000&n=" + encodeURIComponent("রাফি") + "&ok=1";
  assert.equal(parseKhataHash(old), null);
  assert.deepEqual(parseShareHash(old), { giver: "mama", amount: 1000, name: "রাফি", ok: true });
  assert.equal(share.normalize(old), old);
  assert.equal(share.preview("g=mama&a=1000&n=রাফি").title, "রাফি মামার কাছে সালামি চেয়েছে। সই করে দাও!");
});

test("the card and preview speak of people, never of money", () => {
  const khata: Khata = { name: "রাফি", rows: [{ giver: "mama", amount: 500 }, { giver: "khalamoni", amount: null }, { giver: "nanu", amount: 2000 }] };
  assert.equal(khataTitle(""), "আমার সালামি খাতা");
  assert.equal(khataPreviewTitle(khata), "রাফির সালামি খাতা · ৩ জনের দোয়া আর সালামি");
  assert.equal(khataPreviewTitle({ ...khata, name: "" }), "এবারের ঈদের সালামি খাতা · ৩ জনের দোয়া আর সালামি");
  const preview = share.preview(khataHash(khata).slice(1));
  assert.equal(preview.title, "রাফির সালামি খাতা · ৩ জনের দোয়া আর সালামি");
  assert.doesNotMatch(preview.title + preview.description, /৳|৫০০|২,০০০|টাকা/);
  for (const rows of [defaultKhata.rows, khata.rows, [{ giver: "abbu" as const, amount: 100 }], khataGivers.map(giver => ({ giver: giver.id, amount: 1000 }))]) {
    assert.doesNotMatch(khataLine({ name: "", rows }), /৳|টাকা|বেশি|কম/);
  }
});

test("the total appears only when amounts were written", () => {
  assert.equal(khataTotal(defaultKhata.rows), null);
  assert.equal(khataTotal([{ giver: "mama", amount: 500 }, { giver: "nanu", amount: null }, { giver: "abbu", amount: 1000 }]), 1500);
});
