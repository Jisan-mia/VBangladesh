import assert from "node:assert/strict";
import test from "node:test";
import { bill, stepRange, tariff, toNextStep, type Tariff } from "../lib/tariff";

// The rates printed in the BERC order of 3 Jun 2026 as amended on 4 Jun 2026 (see lib/tariff.ts), in paisa.
test("the config holds the BERC order's residential figures", () => {
  assert.equal(tariff.lifeline.upTo, 50);
  assert.equal(tariff.lifeline.rate, 463);
  assert.deepEqual(tariff.steps.map(step => step.rate), [526, 850, 910, 962, 1501, 1735]);
  assert.deepEqual(tariff.steps.map(step => [step.from, step.upTo]), [[1, 75], [76, 200], [201, 300], [301, 400], [401, 600], [601, Infinity]]);
  assert.equal(tariff.demandPerKw, 4200);
  assert.equal(tariff.vat, 0.05);
  assert.equal(tariff.prepaidRebate, 0.005);
  assert.deepEqual(tariff.steps.map(stepRange), ["০–৭৫", "৭৬–২০০", "২০১–৩০০", "৩০১–৪০০", "৪০১–৬০০", "৬০০-এর বেশি"]);
});

test("slabs are incremental: Prothom Alo's 200-unit example at the previous rates", () => {
  // Prothom Alo, 12 May 2026: first 75 × 5.26 = 394.50, next 125 × 7.20 = 900, total 1,294.50 (the Feb 2024 order's steps).
  const previous: Tariff = { ...tariff, steps: tariff.steps.map((step, index) => ({ ...step, rate: [526, 720, 759, 802, 1267, 1461][index] })) };
  const old = bill(200, 0, previous);
  assert.deepEqual(old.lines.map(line => [line.units, line.paisa]), [[75, 39450], [125, 90000]]);
  assert.equal(old.energy, 129450);
  // Billing all 200 at the second-step rate (PDB's rejected proposal) would have been 1,440: not what we do.
  assert.notEqual(old.energy, 200 * 720);
});

test("200 units on a 1 kW load at today's rates", () => {
  const result = bill(200, 1);
  assert.equal(result.energy, 75 * 526 + 125 * 850); // 394.50 + 1,062.50 = 1,457.00
  assert.equal(result.demand, 4200);
  assert.equal(result.vat, 7495); // 5% of 1,499.00
  assert.equal(result.total, 157395);
  assert.equal(result.step?.label, "দ্বিতীয় ধাপ");
});

test("the lifeline rate covers the whole month only up to 50 units", () => {
  const fifty = bill(50, 2);
  assert.equal(fifty.lifeline, true);
  assert.equal(fifty.energy, 50 * 463);
  assert.equal(fifty.step, null);
  const fiftyOne = bill(51, 2);
  assert.equal(fiftyOne.lifeline, false);
  assert.equal(fiftyOne.energy, 51 * 526);
  assert.deepEqual(bill(0, 2).lines, []);
  assert.equal(bill(0, 2).total, 2 * 4200 + 420); // a month with no units still pays the demand charge and its VAT
});

test("every band boundary and the top band", () => {
  const energy = (units: number) => bill(units, 0).energy;
  assert.equal(energy(75), 75 * 526);
  assert.equal(energy(76), 75 * 526 + 850);
  assert.equal(energy(201), 75 * 526 + 125 * 850 + 910);
  assert.equal(energy(400), 75 * 526 + 125 * 850 + 100 * 910 + 100 * 962);
  assert.equal(energy(601), 75 * 526 + 125 * 850 + 100 * 910 + 100 * 962 + 200 * 1501 + 1735);
  // 650 units: 394.50 + 1,062.50 + 910 + 962 + 3,002 + 867.50 = 7,198.50
  assert.equal(energy(650), 719850);
  assert.equal(bill(650, 0).lines.length, 6);
  assert.equal(bill(650, 0).lines.reduce((sum, line) => sum + line.units, 0), 650);
});

test("units are whole, as on the meter, and nonsense never goes negative", () => {
  assert.equal(bill(95.04, 2).units, 95);
  assert.equal(bill(95.5, 2).units, 96);
  assert.equal(bill(-10, 2).energy, 0);
});

test("units left before the next band", () => {
  assert.equal(toNextStep(95), 106);
  assert.equal(toNextStep(200), 1);
  assert.equal(toNextStep(201), 100);
  assert.equal(toNextStep(51), 25);
  assert.equal(toNextStep(40), null);
  assert.equal(toNextStep(650), null);
});
