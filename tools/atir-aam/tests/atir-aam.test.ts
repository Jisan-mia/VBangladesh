import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, readLevels, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";
import { site } from "../content";
import { share } from "../share";
import { canMove, mass, slide, spawn, stageName, POINTS, STONE, TOP, type Dir } from "../lib/board";
import { botRun } from "../lib/bot";
import {
  decodeMoves, encodeMoves, freeStars, levelOf, levelStars, limitOf, move, playAll, plot, replay, shortBy, startGame, startLevel, threeStar, twoStar,
  LEVEL_COUNT, MAX_LINK_MOVES, type Game,
} from "../lib/game";
import { LEVELS } from "../lib/levels";
import { caption, compareLine, feat, fromGame, goalLine, parseShared, previewTitle, sharedHash, stageLine, STAGE_LINES } from "../lib/link";

/** A cheap scripted player: down-left-down-right… falling back to any move that works. */
function scripted(start: Game, cap = 3000) {
  let game = start;
  const order: Dir[] = [1, 2, 1, 3];
  for (let i = 0; !game.over && game.moves.length < cap; i++) {
    const next = [order[i % 4], 2, 3, 0, 1].map(dir => move(game, dir as Dir)).find(Boolean);
    if (!next) break;
    game = next;
  }
  return game;
}

test("slide: tiles run to the edge, equal pairs grow once, stones split a line", () => {
  // one row of a 4×4 (the rest empty)
  const row = (values: number[]) => [...values, ...Array(12).fill(0)];
  assert.deepEqual(slide(row([1, 1, 1, 1]), 4, 2)!.cells.slice(0, 4), [2, 2, 0, 0]);
  assert.deepEqual(slide(row([1, 1, 2, 0]), 4, 2)!.cells.slice(0, 4), [2, 2, 0, 0], "a grown tile doesn't grow again in the same slide");
  assert.deepEqual(slide(row([2, 1, 1, 0]), 4, 3)!.cells.slice(0, 4), [0, 0, 2, 2]);
  assert.deepEqual(slide(row([0, 3, 0, 3]), 4, 2)!.cells.slice(0, 4), [4, 0, 0, 0]);
  assert.equal(slide(row([1, 2, 3, 4]), 4, 2), null, "nothing moves, nothing counts");
  assert.deepEqual(slide(row([9, 9, 0, 0]), 4, 3)!.cells.slice(0, 4), [0, 0, 9, 9], "the বাগান is the last stage");
  assert.deepEqual(slide(row([0, 1, STONE, 1]), 4, 2)!.cells.slice(0, 4), [1, 0, STONE, 1], "a stone holds the far tile back");
  assert.equal(slide(row([1, STONE, 1, 0]), 4, 2), null, "nothing merges across a stone");
  const down = slide([1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 4, 1)!;
  assert.equal(down.cells[12], 2);
  assert.equal(down.points, POINTS[2]);
  assert.deepEqual(down.grown, [{ cell: 12, stage: 2 }]);
  assert.equal(down.paths.filter(path => path.merged).length, 2);
});

test("the board is stuck only when nothing can slide or grow", () => {
  assert.ok(!canMove([1, 2, 1, 2, 2, 1, 2, 1, 1, 2, 1, 2, 2, 1, 2, 1], 4));
  assert.ok(canMove([1, 2, 1, 2, 2, 1, 2, 1, 1, 2, 1, 2, 2, 1, 2, 2], 4));
  assert.ok(!canMove([9, 8, 9, 8, 8, 9, 8, 9, 9, 8, 9, 8, 8, 9, 8, 9], 4));
});

test("the same seed gives the same game; spawn stages don't depend on the moves", () => {
  const a = scripted(startGame(4242), 200), b = scripted(startGame(4242), 200);
  assert.deepEqual(a.cells, b.cells);
  assert.equal(a.score, b.score);
  assert.notDeepEqual(startGame(4242).cells, startGame(4243).cells.map(() => 99));
  const empty = Array(16).fill(0), half = [...Array(8).fill(3), ...Array(8).fill(0)];
  for (let index = 0; index < 50; index++) assert.equal(spawn(empty, 77, index)!.stage, spawn(half, 77, index)!.stage);
  // about one in eight is a চারা
  let charas = 0;
  for (let index = 2; index < 4002; index++) charas += spawn(empty, 99, index)!.stage === 2 ? 1 : 0;
  assert.ok(charas > 400 && charas < 600, String(charas));
  // the first two are always আঁটি, and spawns keep the seed mass honest
  for (let seed = 1; seed < 200; seed++) assert.equal(mass(startGame(seed).cells), 2);
  const run = scripted(startGame(5), 60);
  let fallen = 2;
  for (let index = 2; index < run.moves.length + 2; index++) fallen += spawn(empty, 5, index)!.stage === 2 ? 2 : 1;
  assert.equal(mass(run.cells), fallen);
});

test("undo can't fish for a better spawn: the same move from the same board drops the same আঁটি", () => {
  const game = startGame(31337);
  for (const dir of [0, 1, 2, 3] as Dir[]) {
    const once = move(game, dir), twice = move(game, dir);
    assert.deepEqual(once?.cells, twice?.cells);
  }
});

test("headless runs end sanely", () => {
  for (const seed of [1, 99, 123456, 987654321]) {
    const game = scripted(startGame(seed));
    assert.ok(game.over, "a run on a 4×4 ends");
    assert.ok(game.moves.length > 40 && game.moves.length < 3000, String(game.moves.length));
    assert.ok(game.top >= 4 && game.top <= TOP, String(game.top));
    assert.ok(game.score > 0);
    assert.ok(!canMove(game.cells, 4));
    assert.deepEqual(replay(startGame(seed), encodeMoves(game.moves), game.moves.length)!.cells, game.cells);
  }
  // the bot plays the open garden far
  const far = botRun(2024, 4, [], 8);
  assert.ok(far !== null && far < 200, String(far));
});

test("24 levels in three plots; the bot clears every one inside its three-star count", () => {
  assert.equal(LEVEL_COUNT, 24);
  assert.deepEqual(LEVELS.map(level => level.size), [...Array(16).fill(4), ...Array(8).fill(5)]);
  assert.ok(LEVELS.slice(0, 8).every(level => !level.stones.length), "উঠোন has no stones");
  assert.ok(LEVELS.slice(8).every(level => level.stones.length), "পুকুরপাড় and আমবাগান have stones");
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const { size, stones, target, seed, bot } = levelOf(level);
    assert.ok(target >= 2 && target <= TOP);
    assert.ok(stones.every(cell => cell >= 0 && cell < size * size));
    assert.equal(botRun(seed, size, stones, target), bot, `level ${level} bot count`);
    assert.ok(bot <= threeStar(level) && threeStar(level) < twoStar(level) && twoStar(level) < limitOf(level), `level ${level} thresholds`);
    assert.equal(startGame(0, level).cells.filter(cell => cell === STONE).length, stones.length);
  }
  // goals never step back inside a plot
  for (let level = 2; level <= 16; level++) if (level !== 9) assert.ok(levelOf(level).target >= levelOf(level - 1).target, String(level));
  assert.equal(levelOf(1).target, 2, "level 1 is one merge");
  assert.ok(limitOf(1) >= 10);
});

test("level 1 is won in a swipe or two from the start", () => {
  const start = startGame(0, 1);
  const won = [0, 1, 2, 3].flatMap(a => [0, 1, 2, 3].map(b => playAll(start, [a, b] as Dir[]) ?? move(start, a as Dir))).filter(game => game?.won);
  assert.ok(won.length > 0);
});

test("stars: levels by moves, the open garden by stage", () => {
  const level = 7;
  assert.equal(levelStars(level, threeStar(level)), 3);
  assert.equal(levelStars(level, threeStar(level) + 1), 2);
  assert.equal(levelStars(level, twoStar(level)), 2);
  assert.equal(levelStars(level, twoStar(level) + 1), 1);
  assert.equal(shortBy(level, threeStar(level) + 4), 4);
  assert.equal(shortBy(level, twoStar(level) + 2), 2);
  assert.equal(shortBy(level, 1), 0);
  assert.deepEqual([5, 6, 7, 8, 9].map(freeStars), [0, 0, 1, 2, 3]);
  assert.equal(startLevel({}, 1), 1);
  assert.equal(startLevel({ 1: 3, 2: 2 }, 3), 3);
  assert.equal(startLevel({ 1: 3, 2: 2, 3: 3 }, 3), 2);
});

test("a level ends when the goal grows or the moves run out", () => {
  const level = 3, start = startGame(0, level);
  const won = scripted(start, 400);
  assert.ok(won.over);
  if (won.won) assert.ok(won.top >= levelOf(level).target && won.moves.length <= limitOf(level));
  else assert.ok(won.moves.length === limitOf(level) || !canMove(won.cells, start.size));
  assert.equal(move(won, 0), null, "nothing after the end");
});

test("progress goes through readLevels and recordLevel", () => {
  let stars = readLevels('{"1":3,"2":1,"99":3,"x":2,"3":7}', LEVEL_COUNT);
  assert.deepEqual(stars, { 1: 3, 2: 1 });
  stars = recordLevel(stars, 2, 3);
  stars = recordLevel(stars, 1, 1);
  assert.deepEqual(stars, { 1: 3, 2: 3 });
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 3);
  assert.deepEqual(readLevels("not json", LEVEL_COUNT), {});
});

test("moves pack three to a character and refuse anything else", () => {
  const rng = makeRng(9);
  const moves = Array.from({ length: 301 }, () => Math.floor(rng() * 4) as Dir);
  assert.deepEqual(decodeMoves(encodeMoves(moves), 301), moves);
  assert.equal(decodeMoves(encodeMoves(moves), 300), null);
  assert.equal(decodeMoves("A*", 4), null);
  assert.equal(decodeMoves("", 0), null);
  assert.equal(decodeMoves("B", 1), null, "padding must be zero");
  assert.equal(decodeMoves("A".repeat(2000), MAX_LINK_MOVES + 1), null);
});

test("links replay the moves: open garden and levels, hostile input refused", () => {
  const run = scripted(startGame(777), 150);
  const real = fromGame(run, "  রাফি‮ ")!;
  const hash = sharedHash(real);
  assert.equal(real.name, "রাফি");
  const back = parseShared("#" + hash)!;
  assert.deepEqual(back, real);
  assert.equal(share.normalize(hash), hash);
  assert.equal(share.preview(hash).title, previewTitle(real));
  assert.match(previewTitle(real), /^রাফি .+ পর্যন্ত গেছে, .+ পয়েন্ট। তুমি পারবে\?$/);

  const params = new URLSearchParams(hash);
  const tweak = (key: string, value: string) => { const copy = new URLSearchParams(params); copy.set(key, value); return copy.toString(); };
  assert.equal(parseShared(tweak("t", String(run.score + 2))), null, "a claimed score must match the replay");
  assert.equal(parseShared(tweak("s", "778")), null, "another seed doesn't replay");
  assert.equal(parseShared(tweak("c", String(run.moves.length + 3))), null);
  assert.equal(parseShared(tweak("s", "0")), null);
  assert.equal(parseShared(tweak("s", "1e5")), null);
  assert.equal(parseShared(tweak("t", "-1")), null);
  assert.equal(parseShared("#s=1&t=0&c=1&m=<script>"), null);
  assert.equal(parseShared("x".repeat(2100)), null);
  assert.equal(share.normalize("junk"), null);
  assert.equal(share.preview("junk").title, "আঁটি থেকে আম: জোড়া মেলাও, বাগান বানাও");
  const long = parseShared(tweak("n", "ক".repeat(80)))!;
  assert.equal([...long.name].length, 20);

  // a cleared level
  const { seed, size, stones, target } = levelOf(2);
  let game = plot(seed, size, stones, 2);
  while (!game.over) game = scripted(game, game.moves.length + 1);
  assert.ok(game.won, "the scripted player clears level 2");
  const level = fromGame(game, "")!;
  const levelHash = sharedHash(level);
  assert.match(levelHash, /^l=2&t=\d+&m=/);
  assert.deepEqual(parseShared(levelHash), level);
  assert.ok(level.top >= target);
  assert.equal(parseShared(levelHash.replace("l=2", "l=3")), null);
  assert.equal(parseShared(levelHash.replace("l=2", "l=25")), null);
  const shorter = encodeMoves(game.moves.slice(0, -1));
  assert.equal(parseShared(`l=2&t=${game.moves.length - 1}&m=${shorter}`), null, "a level link must reach the goal");
  // an unfinished level makes no link
  assert.equal(fromGame(startGame(0, 5), ""), null);
});

test("words: stage lines, goals, comparisons and captions", () => {
  assert.equal(STAGE_LINES.length, TOP);
  assert.equal(stageName(7), "পাকা আম");
  assert.equal(stageLine(9), "আঁটি থেকে পুরো বাগান। এবার ছায়ায় বসো।");
  assert.match(goalLine(7), /^পাকা আম বানাও, [০-৯]+ চালের মধ্যে$/);
  assert.equal(compareLine(1300, 1240, "রাফি", false), "রাফির চেয়ে ৬০ পয়েন্ট বেশি!");
  assert.equal(compareLine(1240, 1240, "রাফি", false), "একদম সমান! রাফিও ১২৪০ পয়েন্ট।");
  assert.equal(compareLine(1100, 1240, "", false), "আর একটু হলেই! মাত্র ১৪০ পয়েন্ট কম।");
  assert.equal(compareLine(400, 1240, "রাফি", false), "রাফি এখনো ৮৪০ পয়েন্ট এগিয়ে। আরেকবার?");
  assert.equal(compareLine(50, 62, "জাহিদ", true), "জাহিদের চেয়ে ১২ চাল কম!");
  assert.equal(compareLine(65, 62, "জাহিদ", true), "আর একটু হলেই! মাত্র ৩ চাল বেশি।");
  assert.equal(feat({ level: 0, count: 300, score: 1240, top: 7, name: "" }), "এক বন্ধু পাকা আম পর্যন্ত গেছে, ১২৪০ পয়েন্ট");
  assert.equal(feat({ level: 7, count: 62, score: 0, top: 7, name: "রাফি" }), "রাফি ৭ নম্বর লেভেল ৬২ চালে পার করেছে");
  assert.equal(caption({ level: 0, count: 300, score: 1240, top: 8 }), "আঁটি থেকে আম খেলায় আমের ঝুড়ি পর্যন্ত গেলাম, ১২৪০ পয়েন্ট। তুমি কতদূর যাবে?");
  for (const line of [...STAGE_LINES]) assert.ok(line.split("!").length <= 2);
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("জোড়া মেলানোর পাজল গেম"), "keyword first");
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title && site.headline !== site.name);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /দেশি মিশ্রণ|১৫ ঘরের ধাঁধা/.test(item.answer)), "names a related game");
  const all = JSON.stringify(site);
  assert.doesNotMatch(all, /আপনি|করুন|দেখুন|আপনার|অসাধারণ|2048|২০৪৮/);
  assert.match(site.privacy.join(" "), /তোমার চালগুলো, পয়েন্ট/);
});

test("sound calls are safe with no AudioContext (server, old browsers)", () => {
  assert.doesNotThrow(() => { sfx.combo(0); sfx.combo(-1); sfx.combo(20); sfx.drop(); sfx.lose(); sfx.levelUp(); tone(330, 0.1); hiss(0.1); buzz(10); });
  const global = globalThis as unknown as { window?: unknown; AudioContext?: unknown };
  global.window = {};
  global.AudioContext = class { constructor() { throw new Error("no audio"); } };
  try { assert.doesNotThrow(() => { sfx.combo(3); tone(440, 0.1); }); } finally { delete global.window; delete global.AudioContext; }
});
