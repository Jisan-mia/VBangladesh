import assert from "node:assert/strict";
import test from "node:test";
import { readLevels, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { buzz, hiss, loop, sfx, tone } from "../../../shared/game-sound";
import { site } from "../content";
import { share } from "../share";
import { allMoves, colourOf, deal, findRuns, hasMove, play, sparkleReach, swapWorks, CELLS, EMPTY, POINT, RAINBOW, SIZE, SPARKLE } from "../lib/board";
import { botGame, thresholds } from "../lib/bot";
import { code, decodeMoves, encodeMoves, levelOf, levelStars, move, replay, shortBy, startGame, startLevel, uncode, BONUS, LEVEL_COUNT, type Game } from "../lib/game";
import { LEVELS } from "../lib/levels";
import { caption, compareLine, feat, fromGame, goalLine, goalText, missLine, parseShared, previewTitle, sharedHash, STAR_LINES } from "../lib/link";

/** A tray from a picture: one letter per cell, r g b y p w for colours, R G… for ঝিকমিক, * for রংধনু. */
function tray(rows: string[]) {
  const map: Record<string, number> = { r: 0, g: 1, b: 2, y: 3, p: 4, w: 5, R: 10, G: 11, B: 12, Y: 13, P: 14, W: 15, "*": RAINBOW };
  return rows.join("").split("").map(char => map[char]);
}
/** A filler that never lines up: colours 0–3 in a pattern with no three in a row either way. */
const FILL = ["rgbyrgb", "byrgbyr", "rgbyrgb", "byrgbyr", "rgbyrgb", "byrgbyr", "rgbyrgb"];
const SPEC = { colours: 4, goals: [[0, 1000]] as const, moves: 99, seed: 7, three: 0, two: 0, bot: 0, botScore: 0 };

/** A careless player: the first swap that works, every time. */
function firstMover(start: Game) {
  let game = start;
  while (!game.over) {
    const [a, b] = allMoves(game.cells)[0];
    game = move(game, a, b)!.game;
  }
  return game;
}

test("deal: same seed, same tray; never a ready-made line; always a swap", () => {
  assert.deepEqual(deal(42, 5), deal(42, 5));
  assert.notDeepEqual(deal(42, 5), deal(43, 5));
  for (let seed = 1; seed < 300; seed++) {
    const cells = deal(seed, 4 + (seed % 3));
    assert.equal(cells.length, CELLS);
    assert.equal(findRuns(cells).length, 0, `seed ${seed} starts with a line`);
    assert.ok(hasMove(cells), `seed ${seed} has no move`);
    assert.ok(cells.every(piece => piece >= 0 && piece < 4 + (seed % 3)));
  }
});

test("a swap must make a line; a rainbow always works; only neighbours", () => {
  const cells = tray(FILL);
  assert.equal(findRuns(cells).length, 0);
  assert.equal(play(cells, 1, 0, 4, 0, 1), null, "nothing lines up");
  assert.equal(play(cells, 1, 0, 4, 0, 2), null, "not neighbours");
  assert.equal(play(cells, 1, 0, 4, 6, 7), null, "row ends don't wrap");
  const line = tray(["rrgyrgb", "byrrbyr", ...FILL.slice(2)]); // swapping (0,2)↔(1,2) brings r over: r r r
  assert.ok(swapWorks(line.slice(), 2, 9));
  const out = play(line, 1, 0, 4, 2, 9)!;
  assert.ok(out);
  assert.deepEqual(out.steps[0].cleared, [0, 1, 2]);
  assert.equal(out.steps[0].points, 3 * POINT);
  assert.equal(out.lifted[0] >= 3, true);
  assert.ok(out.cells.every(piece => piece !== EMPTY), "the tray refills");
  assert.deepEqual(out.steps[0].fall.slice(0, 3), [1, 1, 1], "fresh bangles drop in from above");
});

test("four lifted leave a ঝিকমিক where the swap landed; five leave a রংধনু", () => {
  // r r _ r with the gap filled by a swap from below: four in a row
  const four = tray(["rrgrybg", "bgrbgyr", ...FILL.slice(2)]);
  const out4 = play(four, 3, 0, 4, 2, 9)!;
  assert.deepEqual(out4.steps[0].made, [{ cell: 2, piece: SPARKLE + 0 }]);
  assert.deepEqual(out4.made, [1, 0]);
  // r r _ r r: five
  const five = tray(["rrgrrbg", "bgrbgyb", ...FILL.slice(2)]);
  const out5 = play(five, 3, 0, 4, 2, 9)!;
  assert.deepEqual(out5.steps[0].made, [{ cell: 2, piece: RAINBOW }]);
  assert.equal(out5.made[1], 1);
  // an L of five counts too: column 0 and row 2 meet at cell 14
  const ell = tray(FILL);
  ell[7] = 0; ell[14] = 1; ell[15] = 0; ell[16] = 0; ell[21] = 0; ell[23] = 3;
  assert.equal(findRuns(ell).length, 0);
  const outL = play(ell, 3, 0, 4, 14, 21)!;
  assert.deepEqual(outL.steps[0].made, [{ cell: 14, piece: RAINBOW }]);
  assert.deepEqual(outL.steps[0].cleared, [0, 7, 15, 16]);
});

test("specials: a ঝিকমিক lifts two each way; a রংধনু lifts a whole colour", () => {
  assert.deepEqual(sparkleReach(24).sort((a, b) => a - b), [10, 17, 22, 23, 25, 26, 31, 38]);
  assert.deepEqual(sparkleReach(0).sort((a, b) => a - b), [1, 2, 7, 14]);
  const cells = tray(FILL);
  cells[24] = RAINBOW; // swap it with its right neighbour (25, colour of FILL[3][4])
  const colour = colourOf(cells[25]);
  const out = play(cells, 5, 0, 4, 24, 25)!;
  const before = cells.filter(piece => colourOf(piece) === colour).length;
  assert.ok(out.steps[0].cleared.length >= before + 1, "every bangle of that colour, and the rainbow");
  assert.equal(out.lifted[colour] >= before, true);
  // two rainbows lift the whole tray
  const both = tray(FILL); both[24] = RAINBOW; both[25] = RAINBOW;
  assert.equal(play(both, 5, 0, 4, 24, 25)!.steps[0].cleared.length, CELLS);
  // a ঝিকমিক caught in a line goes off
  const spark = tray(["rrgRybg", "bgrbgyr", ...FILL.slice(2)]); // swap (2)↔(9): r r r R → four with the sparkle inside
  const out2 = play(spark, 3, 0, 4, 2, 9)!;
  assert.ok(out2.steps[0].blasts.includes(3));
});

test("the same moves always bring the same bangles down", () => {
  const a = firstMover(startGame(5)), b = firstMover(startGame(5));
  assert.deepEqual(a.cells, b.cells);
  assert.equal(a.score, b.score);
  assert.deepEqual(replay(5, encodeMoves(a.moves))?.cells ?? null, a.won ? a.cells : null);
});

test("headless runs end sanely, and the tray is never stuck", () => {
  let game = startGame(0, SPEC);
  let shuffles = 0;
  for (let i = 0; i < 400; i++) {
    const [a, b] = allMoves(game.cells)[i % allMoves(game.cells).length];
    const next = move(game, a, b, SPEC)!;
    assert.ok(next, "a listed move always works");
    if (next.outcome.shuffle) { shuffles++; assert.equal(findRuns(next.outcome.cells).length, 0); }
    game = next.game;
    assert.ok(hasMove(game.cells));
    assert.equal(findRuns(game.cells).length, 0, "the tray is still after every move");
    if (game.over) break;
  }
  assert.ok(game.over && !game.won && game.moves.length === SPEC.moves, "runs to the last move");
  assert.ok(game.score >= SPEC.moves * 3 * POINT && game.score < SPEC.moves * 3000, String(game.score));
  assert.ok(shuffles < 30, String(shuffles));
});

test("40 levels: the greedy bot clears every one inside its moves, with the recorded numbers", () => {
  assert.equal(LEVEL_COUNT, 40);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const spec = levelOf(level), game = botGame(spec, level);
    assert.ok(game.won, `level ${level} won`);
    assert.equal(game.moves.length, spec.bot, `level ${level} bot moves`);
    assert.equal(game.score, spec.botScore, `level ${level} bot score`);
    assert.ok(spec.bot < spec.moves && spec.moves <= 50, `level ${level} has room: ${spec.bot}/${spec.moves}`);
    assert.ok(spec.two >= 100 && spec.two < spec.three, `level ${level} thresholds`);
    assert.ok(spec.colours >= 4 && spec.colours <= 6 && spec.goals.length >= 1 && spec.goals.length <= 3);
    for (const [target, count] of spec.goals) assert.ok((target >= 0 && target < spec.colours) || target === SPARKLE || target === RAINBOW, `level ${level} goal ${target}/${count}`);
  }
  assert.ok(LEVELS.slice(0, 10).every(level => !level.goals.some(([t]) => t === RAINBOW)), "রংধনু goals wait for the second মেলা");
  assert.ok(LEVELS.slice(20).every(level => level.colours === 6));
});

test("the star thresholds come from the looser runs (spot check)", () => {
  for (const level of [1, 11, 21, 40]) assert.deepEqual(thresholds(levelOf(level)), { three: levelOf(level).three, two: levelOf(level).two });
});

test("level 1 is won even by a careless player", () => {
  const game = firstMover(startGame(1));
  assert.ok(game.won, `${game.moves.length} moves, left ${game.left}`);
  assert.ok(levelOf(1).moves >= 15);
});

test("stars, bonus and near-miss", () => {
  const level = 7, { three, two } = levelOf(level);
  assert.equal(levelStars(level, three), 3);
  assert.equal(levelStars(level, three - 1), 2);
  assert.equal(levelStars(level, two), 2);
  assert.equal(levelStars(level, two - 1), 1);
  assert.equal(shortBy(level, three - 40), 40);
  assert.equal(shortBy(level, two - 10), 10);
  assert.equal(shortBy(level, three + 5), 0);
  const won = botGame(levelOf(1), 1);
  assert.equal(won.bonus, (levelOf(1).moves - won.moves.length) * BONUS);
  assert.equal(move(won, 0, 1), null, "nothing after the end");
  assert.equal(startLevel({}, 1), 1);
  assert.equal(startLevel({ 1: 3, 2: 2 }, 3), 3);
  assert.equal(startLevel({ 1: 3, 2: 2, 3: 3 }, 3), 2);
  assert.equal(missLine(1, [3]), "আর ৩টা লাল চুড়ি হলেই হতো।");
  assert.equal(missLine(18, [0, 1]), "আর ১টা রংধনু চুড়ি হলেই হতো।");
  assert.match(missLine(14, [2, 5, 0]), /^আর ২টা লাল চুড়ি বাকি ছিল, সঙ্গে আরও ১টা লক্ষ্য।$/);
});

test("a level ends when the moves run out", () => {
  const tight = { ...levelOf(1), goals: [[0, 999]] as const, moves: 3 };
  let game = startGame(1, tight);
  for (let i = 0; i < 3; i++) { const [a, b] = allMoves(game.cells)[0]; game = move(game, a, b, tight)!.game; }
  assert.ok(game.over && !game.won);
  assert.equal(game.bonus, 0);
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

test("move codes: two characters a swap, neighbours only", () => {
  assert.deepEqual(uncode(code(10, 11)), [10, 11]);
  assert.deepEqual(uncode(code(17, 10)), [10, 17]);
  const moves = [code(0, 1), code(47, 48), code(41, 48), code(20, 27)];
  assert.deepEqual(decodeMoves(encodeMoves(moves)), moves);
  assert.equal(decodeMoves(""), null);
  assert.equal(decodeMoves("A"), null);
  assert.equal(decodeMoves("A*"), null);
  assert.equal(decodeMoves(encodeMoves([12])), null, "cell 6 → 7 wraps a row");
  assert.equal(decodeMoves(encodeMoves([97])), null, "cell 48 has no lower neighbour");
  assert.equal(decodeMoves("AB".repeat(101)), null);
});

test("links replay the moves; hostile input refused", () => {
  const won = botGame(levelOf(3), 3);
  const real = fromGame(won, "  রাফি‮ ")!;
  assert.equal(real.name, "রাফি");
  const hash = sharedHash(real);
  assert.match(hash, /^s=\d+&t=\d+&l=3&m=[A-Za-z0-9_-]+&n=/);
  assert.deepEqual(parseShared("#" + hash), real);
  assert.equal(share.normalize(hash), hash);
  assert.equal(share.preview(hash).title, previewTitle(real));
  assert.match(previewTitle(real), /^রাফি ৩ নম্বর লেভেলে [০-৯]+ পয়েন্ট পেয়েছে। তুমি পারবে\?$/);

  const params = new URLSearchParams(hash);
  const tweak = (key: string, value: string) => { const copy = new URLSearchParams(params); copy.set(key, value); return copy.toString(); };
  assert.equal(parseShared(tweak("t", String(real.score + 10))), null, "a claimed score must match the replay");
  assert.equal(parseShared(tweak("l", "4")), null, "another level doesn't replay");
  assert.equal(parseShared(tweak("l", "41")), null);
  assert.equal(parseShared(tweak("l", "03")), null);
  assert.equal(parseShared(tweak("s", "12345")), null, "the seed must be the level's");
  assert.equal(parseShared(tweak("m", real.moves.slice(0, -2))), null, "a link must clear the level on its last move");
  assert.equal(parseShared(tweak("m", "<script>")), null);
  assert.equal(parseShared(tweak("t", "-1")), null);
  assert.equal(parseShared("x".repeat(700)), null);
  assert.equal(share.normalize("junk"), null);
  assert.equal(share.preview("junk").title, "চুড়ির বাজার: এক রঙের তিনটা চুড়ি মেলাও");
  assert.equal([...parseShared(tweak("n", "ক".repeat(40)))!.name].length, 20);
  assert.equal(fromGame(startGame(5), ""), null, "an unfinished level makes no link");
});

test("words: goals, comparisons, captions", () => {
  assert.equal(goalText([0, 20]), "২০টা লাল চুড়ি তোলো");
  assert.equal(goalText([SPARKLE, 2]), "২টা ঝিকমিক চুড়ি বানাও");
  assert.equal(goalText([RAINBOW, 1]), "১টা রংধনু চুড়ি বানাও");
  assert.match(goalLine(1), /^১০টা লাল চুড়ি তোলো, [০-৯]+ চালে$/);
  assert.equal(compareLine(3300, 3240, "রাফি"), "রাফির চেয়ে ৬০ পয়েন্ট বেশি!");
  assert.equal(compareLine(3240, 3240, "রাফি"), "একদম সমান! রাফিও ৩২৪০ পয়েন্ট।");
  assert.equal(compareLine(3140, 3240, ""), "আর একটু হলেই! মাত্র ১০০ পয়েন্ট কম।");
  assert.equal(compareLine(1000, 3240, "জাহিদ"), "জাহিদ এখনো ২২৪০ পয়েন্ট এগিয়ে। আরেকবার?");
  assert.equal(feat({ level: 12, score: 3240, name: "" }), "এক বন্ধু ১২ নম্বর লেভেলে ৩২৪০ পয়েন্ট পেয়েছে");
  assert.match(caption({ level: 12, score: 3240 }), /^চুড়ির বাজারের ১২ নম্বর লেভেলে ৩২৪০ পয়েন্ট পেলাম, [১-৩] তারা। তুমি কত পাবে\?$/);
  assert.equal(STAR_LINES.length, 4);
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("রং মেলানোর গেম"), "keyword first");
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title && site.headline !== site.name);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /আঁটি থেকে আম|জোড়া মেলাও/.test(item.answer)), "names a related game");
  const all = JSON.stringify(site);
  assert.doesNotMatch(all, /আপনি|করুন|দেখুন|আপনার|অসাধারণ|ক্যান্ডি|candy|মিষ্টি|sweet|কয়েন|টাকা জিত/i);
  assert.match(site.privacy.join(" "), /তোমার চালগুলো, পয়েন্ট/);
});

test("sound calls are safe with no AudioContext (server, old browsers)", () => {
  assert.doesNotThrow(() => { sfx.combo(0); sfx.combo(20); sfx.wrong(); sfx.whoosh(); tone(1180, 0.1); hiss(0.1); buzz(10); loop("static").pitch(3000); });
  const global = globalThis as unknown as { window?: unknown; AudioContext?: unknown };
  global.window = {};
  global.AudioContext = class { constructor() { throw new Error("no audio"); } };
  try { assert.doesNotThrow(() => { sfx.combo(3); tone(440, 0.1); const l = loop("static"); l.set(0.3); l.stop(); }); } finally { delete global.window; delete global.AudioContext; }
});
