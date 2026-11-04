// Fairness: headless bots play every board (tests/bot.ts) and the rates the design promises are asserted.
// The bots' seeds are fixed, so these numbers are exact for this code; the thresholds sit a little under what they measure.
import assert from "node:assert/strict";
import test from "node:test";
import { CAREFUL, CASUAL, rate } from "./bot";
import { LEVEL_COUNT, LEVELS } from "../lib/levels";

test("board 1 is a sure first win: a casual player clears it on every run, almost always in one strike", () => {
  const casual = rate(1, "n", CASUAL, 40);
  assert.equal(casual.clear, 1);
  assert.ok(casual.stars >= 2.9, `${casual.stars}`);
});

test("World 1 (পাড়ার ক্লাবঘর): a casual player clears each board most of the time; a careful one nearly always", () => {
  for (let level = 2; level <= 5; level++) {
    const casual = rate(level, "n", CASUAL, 20), careful = rate(level, "n", CAREFUL, 20);
    assert.ok(casual.clear >= 0.75, `${LEVELS[level - 1].name}: casual ${casual.clear}`);
    assert.ok(careful.clear >= 0.85, `${LEVELS[level - 1].name}: careful ${careful.clear}`);
  }
});

test("World 2 (চায়ের দোকান): a careful player clears each board at least 3 times in 4", () => {
  for (let level = 6; level <= 10; level++) {
    const careful = rate(level, "n", CAREFUL, 12);
    assert.ok(careful.clear >= 0.75, `${LEVELS[level - 1].name}: careful ${careful.clear}`);
  }
});

test("World 3 (টুর্নামেন্ট): careful players clear the early boards; the final is a real final", () => {
  for (let level = 11; level <= 14; level++) {
    const careful = rate(level, "n", CAREFUL, 10);
    assert.ok(careful.clear >= 0.6, `${LEVELS[level - 1].name}: careful ${careful.clear}`);
  }
  const final = rate(LEVEL_COUNT, "h", CAREFUL, 12);
  assert.ok(final.clear >= 0.2 && final.clear <= 0.75, `the final on ওস্তাদ: ${final.clear}`);
});

test("সহজ really is easier: a casual player on সহজ clears more and earns more stars than on মাঝারি", () => {
  let easy = 0, normal = 0;
  for (const level of [3, 9, 10, 12]) {
    easy += rate(level, "e", CASUAL, 12).stars;
    normal += rate(level, "n", CASUAL, 12).stars;
  }
  assert.ok(easy > normal + 1, `সহজ ${easy} vs মাঝারি ${normal}`);
});
