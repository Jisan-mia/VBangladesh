import assert from "node:assert/strict";
import test from "node:test";
import { cleanName, delivery, innings, outcomeAt, parseShareHash, positionAt, previewTitle, shareHash, tallyIds, MAX_NAME, MAX_TRIES, type Shared } from "../lib/game";
import { share } from "../share";

test("the marker sweeps across and back at a steady speed", () => {
  assert.equal(positionAt(0, 1000), 0);
  assert.equal(positionAt(500, 1000), 0.5);
  assert.equal(positionAt(1000, 1000), 1);
  assert.equal(positionAt(1500, 1000), 0.5);
  assert.equal(positionAt(2000, 1000), 0);
  assert.equal(positionAt(-40, 1000), 0);
});

test("the closer to the sweet spot, the bigger the shot; the red ends are bowled", () => {
  assert.equal(outcomeAt(0.5, 0.5), 6);
  assert.equal(outcomeAt(0.58, 0.5), 4);
  assert.equal(outcomeAt(0.36, 0.5), 2);
  assert.equal(outcomeAt(0.7, 0.5), 1);
  assert.equal(outcomeAt(0.85, 0.5), 0);
  assert.equal(outcomeAt(0.02, 0.5), "W");
  assert.equal(outcomeAt(0.97, 0.5), "W");
});

test("the same seed always bowls the same ball, and every sweet spot is reachable", () => {
  assert.deepEqual(delivery(42, "last5", 0), delivery(42, "last5", 0));
  for (let seed = 1; seed < 400; seed++) {
    const ball = delivery(seed, "over12", seed % 6);
    assert.ok(ball.speed >= 950 && ball.speed <= 1300);
    assert.equal(outcomeAt(ball.centre, ball.centre), 6);
  }
});

test("an over is won the moment the target is passed, and a wicket ends it", () => {
  assert.deepEqual(innings("last5", [6]), { runs: 6, state: "won" });
  assert.deepEqual(innings("last5", [4]), { runs: 4, state: "lost" });
  assert.deepEqual(innings("over12", [4, 1, 6, 1]), { runs: 12, state: "won" });
  assert.deepEqual(innings("over12", [4, 1]), { runs: 5, state: "playing" });
  assert.deepEqual(innings("over12", [4, "W"]), { runs: 4, state: "lost" });
  assert.deepEqual(innings("over12", [1, 1, 1, 1, 1, 1]), { runs: 6, state: "lost" });
});

test("a result survives the share-link round trip", () => {
  const last: Shared = { mode: "last5", seed: 7, tries: 3, name: "রাফি", runs: [6] };
  assert.deepEqual(parseShareHash(shareHash(last)), last);
  const over: Shared = { mode: "over12", seed: 9999, tries: 1, name: "", runs: [4, 1, 6, 1] };
  assert.deepEqual(parseShareHash(shareHash(over)), over);
  assert.deepEqual(parseShareHash("#m=last5&s=7&t=3&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF"), last);
});

test("hostile, impossible or empty links are refused instead of crashing", () => {
  for (const hash of ["", "#result", "#m=last6&s=7&t=3", "#m=last5&s=0&t=3", "#m=last5&s=7&t=0", "#m=last5&s=abc&t=2", "#m=last5&s=7&t=-1", "#m=last5&s=99999&t=1",
    "#m=over12&s=7&t=1", "#m=over12&s=7&t=1&b=44", "#m=over12&s=7&t=1&b=6666", "#m=over12&s=7&t=1&b=111111", "#m=over12&s=7&t=1&b=46W2", `#m=last5&s=7&t=1&n=${"x".repeat(500)}`]) {
    assert.equal(parseShareHash(hash), null, hash);
  }
});

test("tries are capped and names are cleaned, NFC-normalised and capped", () => {
  assert.equal(parseShareHash("#m=last5&s=7&t=5000")?.tries, MAX_TRIES);
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME + 10)).length, MAX_NAME);
  assert.equal(cleanName("José"), "José");
});

test("share normalises links and writes a personal preview title", () => {
  assert.equal(share.normalize("t=3&n=রাফি&s=7&m=last5"), "m=last5&s=7&t=3&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.equal(share.normalize("m=nope"), null);
  assert.equal(previewTitle({ mode: "last5", seed: 7, tries: 3, name: "রাফি", runs: [6] }), "রাফি ৩ বারের চেষ্টায় শেষ বলে ছক্কা মেরেছে — তুমি পারবে?");
  assert.match(share.preview("m=over12&s=7&t=1&b=6411").title, /^এক বন্ধু প্রথম চেষ্টাতেই শেষ ওভারে ১২ তুলেছে/);
  assert.deepEqual(share.tally, tallyIds);
  assert.ok(tallyIds.every(id => /^(last5|over12):[0-9+-]+$/.test(id)));
});
