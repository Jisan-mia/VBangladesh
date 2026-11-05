import assert from "node:assert/strict";
import test from "node:test";
import fixture from "./legacy-fixture.json" with { type: "json" };
import { fromGame, parseShared, sameRun, sharedHash } from "../lib/challenge";
import { botGame } from "../lib/hint";
import { LEVELS } from "../lib/ladder";
import { createGame, newRun, replay, starsOf } from "../lib/rules";
import { share } from "../share";
import { caption, compareLine, feat, goalText, missLine, previewTitle } from "../lib/words";

test("old links (no v) still open: every recorded old state parses, replays, and rebuilds the same text", () => {
  for (const row of fixture) {
    const shared = parseShared(row.state)!;
    assert.ok(shared, `old level ${row.level}`);
    assert.equal(shared.v, 1);
    assert.equal(shared.level, row.level);
    assert.equal(shared.score, row.score);
    assert.equal(shared.mode, "n");
    assert.equal(sharedHash(shared), row.state, "the same short link");
  }
  assert.equal(share.normalize(fixture[0].state), fixture[0].state);
  assert.equal(parseShared(`${fixture[0].state}&n=Mim`)?.name, "Mim");
});

test("new links carry v=2, a mode and a gift, and are proven by replay", () => {
  const level = 10, spec = LEVELS[level - 1];
  for (const [mode, gift] of [["n", 0], ["e", 0], ["h", 2], ["n", 3]] as const) {
    const run = { v: 2 as const, level, mode, gift };
    const game = botGame(run, spec);
    if (!game.won) continue;
    const shared = fromGame(game, "রাফি")!;
    const text = sharedHash(shared);
    assert.ok(text.includes("v=2"));
    assert.equal(text.includes("d="), mode !== "n");
    assert.equal(text.includes("p="), gift > 0);
    const back = parseShared(text)!;
    assert.ok(back && sameRun(back, run) && back.score === game.score && back.stars === starsOf(game), `${mode}${gift}`);
    assert.equal(back.name, "রাফি");
    // a hard-mode run cut back to a plain link loses its mode: 10 moves fit the normal limit, but the score no longer matches
    if (mode === "h") assert.equal(parseShared(text.replace("&d=h", "").replace("&p=2", "")), null);
  }
  const plain = botGame(newRun(1), LEVELS[0]), text = sharedHash(fromGame(plain, "")!);
  assert.equal(replay(newRun(1), fromGame(plain, "")!.moves)!.score, plain.score);
  assert.ok(parseShared(text));
});

test("hostile links are refused", () => {
  const game = botGame(newRun(1), LEVELS[0]), good = sharedHash(fromGame(game, "")!);
  assert.ok(parseShared(good));
  const bad = [
    good.replace("t=", "t=9"), good.replace(/l=1/, "l=2"), good.replace(/s=\d+/, "s=5"), `${good}&d=x`, `${good}&p=9`, `${good}&p=0`, `${good}&d=n`, `${good}&p=1`,
    good.replace("v=2&", ""), good.replace(/m=[^&]*/, "m=AA"), good.replace(/m=[^&]*/, "m=%00%00"), good.replace(/m=[^&]*/, "m="), good.replace(/m=[^&]*/, "m=" + "A".repeat(150)),
    "l=1&m=AAAA", "", "s=1006&t=0&l=999&m=AAAA", `${good}${"x".repeat(700)}`, good.replace("v=2", "v=3"), good.replace("l=1", "l=01"),
  ];
  for (const text of bad) assert.equal(parseShared(text), null, text.slice(0, 70));
  assert.equal(createGame(newRun(1)).left.length, 1);
});

test("words: goals, comparisons, captions, previews", () => {
  assert.equal(goalText([0, 20]), "২০টা লাল চুড়ি তোলো");
  assert.equal(goalText([10, 2]), "২টা ঝিকমিক চুড়ি বানাও");
  assert.equal(goalText([20, 1]), "১টা রংধনু চুড়ি বানাও");
  assert.equal(goalText([40, 3]), "৩টা তালা খোলো");
  assert.equal(goalText([30, 10]), "১০ বার ধুলো মোছো");
  assert.equal(compareLine(3300, 3240, "রাফি"), "রাফির চেয়ে ৬০ পয়েন্ট বেশি!");
  assert.equal(compareLine(3240, 3240, "রাফি"), "একদম সমান! রাফিও ৩২৪০ পয়েন্ট।");
  assert.equal(compareLine(3200, 3240, "জাহিদ"), "আর একটু হলেই! মাত্র ৪০ পয়েন্ট কম।");
  assert.equal(feat({ level: 12, score: 3240, name: "রাফি" }), "রাফি ১২ নম্বর লেভেলে ৩২৪০ পয়েন্ট পেয়েছে");
  assert.equal(previewTitle({ level: 3, score: 100, name: "" }), "এক বন্ধু ৩ নম্বর লেভেলে ১০০ পয়েন্ট পেয়েছে। তুমি পারবে?");
  assert.equal(caption({ level: 7, score: 2100, stars: 2 }), "চুড়ির বাজারের ৭ নম্বর লেভেলে ২১০০ পয়েন্ট পেলাম, ২ তারা। তুমি কত পাবে?");
  const lost = createGame(newRun(8));
  assert.match(missLine(lost), /হলেই হতো/);
  const preview = share.preview(sharedHash(fromGame(botGame(newRun(1), LEVELS[0]), "রাফি")!));
  assert.match(preview.title, /রাফি ১ নম্বর লেভেলে/);
  assert.match(share.preview("junk").title, /^চুড়ির বাজার/);
});
