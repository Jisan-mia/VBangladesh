import assert from "node:assert/strict";
import test from "node:test";
import { cleanName, defaultResult, humanLine, parseResult, previewTitle, resultHash, score, subjectsFor, switchTrack, MAX_NAME_LENGTH, type GradeId, type Result } from "../lib/gpa";

const hsc = (grades: GradeId[], fourth: GradeId): Result => ({ ...defaultResult("hsc", "sci"), grades, fourth });

test("SSC counts 9 compulsory subjects and HSC counts 6, in every group", () => {
  for (const group of ["sci", "hum", "bus"] as const) {
    assert.equal(subjectsFor("ssc", group).length, 9);
    assert.equal(subjectsFor("hsc", group).length, 6);
  }
});

test("the page opens at a perfect 5.00", () => {
  assert.equal(score(defaultResult()).gpa, 5);
  assert.equal(humanLine(score(defaultResult())), "সব রাত জাগার দাম আজ মিলল।");
});

test("only 4th-subject points above 2 count, and the result is capped at 5.00", () => {
  // 4+4+4+4+4+4 = 24 → 4.00; a 4th-subject A+ adds 3 → 27/6 = 4.50.
  assert.equal(score(hsc(["A", "A", "A", "A", "A", "A"], "AP")).gpa, 4.5);
  assert.equal(score(hsc(["A", "A", "A", "A", "A", "A"], "AP")).without, 4);
  // A C (2.00) or an F in the 4th subject adds nothing and does not fail.
  assert.equal(score(hsc(["A", "A", "A", "A", "A", "A"], "C")).gpa, 4);
  assert.equal(score(hsc(["A", "A", "A", "A", "A", "A"], "F")).failed, false);
  // Dhaka board HSC 2025 re-scrutiny: English C→A took 4.83 to 5.00, not 5.17.
  assert.equal(score(hsc(["AP", "A", "AP", "AP", "AP", "AP"], "AP")).gpa, 5);
});

test("an F in a compulsory subject means no GPA", () => {
  const value = score(hsc(["AP", "F", "AP", "AP", "AP", "AP"], "AP"));
  assert.equal(value.failed, true);
  assert.equal(humanLine(value), "এবার হয়নি। আবার হবে।");
});

test("GPAs round to 2 decimals the way the board prints them", () => {
  // 28/6 = 4.6667 → 4.67; 25/6 = 4.1667 → 4.17; SSC 27.5/9 = 3.0556 → 3.06.
  assert.equal(score(hsc(["AP", "AP", "AP", "AP", "A", "A"], "D")).gpa, 4.67);
  assert.equal(score(hsc(["AP", "AP", "AP", "A", "A", "C"], "C")).gpa, 4.17);
  const ssc: Result = { ...defaultResult("ssc", "hum"), grades: ["B", "B", "B", "B", "B", "B", "B", "B", "B"], fourth: "B" };
  assert.equal(score(ssc).gpa, 3.11);
  assert.equal(score({ ...ssc, grades: ["B", "B", "B", "B", "B", "B", "B", "B", "AM"], fourth: "C" }).gpa, 3.06);
});

test("the human line follows the GPA bands", () => {
  assert.equal(humanLine(score(hsc(["A", "A", "A", "A", "A", "A"], "C"))), "খুব ভালো হয়েছে। এবার একটু জিরিয়ে নাও।");
  assert.equal(humanLine(score(hsc(["B", "B", "B", "B", "B", "B"], "C"))), "জিপিএ একটা সংখ্যাই, তোমার পুরোটা না।");
});

test("a result survives the share-link round trip", () => {
  const result: Result = { exam: "ssc", group: "bus", grades: ["AP", "A", "AM", "B", "C", "D", "AP", "A", "AP"], fourth: "B", name: "রাফি", year: 2026, thanks: "parents" };
  assert.deepEqual(parseResult("#" + resultHash(result)), result);
});

test("hostile, partial or oversized links are rejected", () => {
  assert.equal(parseResult(""), null);
  assert.equal(parseResult("e=hsc&g=sci&r=AP,AP&f=AP"), null);
  assert.equal(parseResult("e=hsc&g=sci&r=AP,AP,AP,AP,AP,Z&f=AP"), null);
  assert.equal(parseResult("e=xyz&g=sci&r=AP,AP,AP,AP,AP,AP&f=AP"), null);
  assert.equal(parseResult("e=hsc&g=sci&r=AP,AP,AP,AP,AP,AP&f=__proto__"), null);
  assert.equal(parseResult("e=hsc&g=sci&r=AP,AP,AP,AP,AP,AP&f=AP&n=" + "ক".repeat(700)), null);
  const odd = parseResult("e=hsc&g=sci&r=AP,AP,AP,AP,AP,AP&f=AP&y=1850&t=evil");
  assert.equal(odd?.year, null);
  assert.equal(odd?.thanks, "");
});

test("names are NFC, lose control and direction characters, and are capped", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  assert.equal(cleanName("কো"), "কো".normalize("NFC"));
  assert.equal(cleanName("কো"), "কো");
});

test("switching group keeps the grades already tapped", () => {
  const start = { ...defaultResult("hsc", "sci"), grades: ["A", "B", "C", "AP", "AP", "AP"] as GradeId[] };
  const ssc = switchTrack(start, "ssc", "sci");
  assert.deepEqual(ssc.grades.slice(0, 3), ["A", "B", "C"]);
  assert.equal(ssc.grades.length, 9);
});

test("link previews are personal and kind", () => {
  const result: Result = { ...hsc(["AP", "AP", "AP", "AP", "A", "AP"], "AP"), name: "রাফি" };
  assert.equal(previewTitle(result), "রাফির জিপিএ ৫.০০। তোমারটা হিসাব করো");
  assert.equal(previewTitle({ ...result, grades: ["F", "AP", "AP", "AP", "AP", "AP"] }), "রাফি বলছে: পরের বার দেখিয়ে দেব");
});
