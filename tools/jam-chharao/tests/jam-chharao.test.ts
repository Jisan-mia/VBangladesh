import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, pick } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import { COLS, EXIT_COL, MAX_CARS, ROWS, levelCode, occupancy, parseLevel, solve } from "../lib/board";
import { encodeMoves, fewest, hint, readProgress, recordWin, reachOf, replay, slide, startGame, undo, unlocked, LEVEL_COUNT, MAX_LINK_MOVES, type Game } from "../lib/game";
import { LEVELS } from "../lib/levels";
import { band, caption, compareLine, feat, fromGame, humanLine, parseShared, previewTitle, sharedHash } from "../lib/link";

/** Plays the solver's answer from wherever the game stands. */
function finish(game: Game, help = false) {
  for (const move of solve(game.cars, game.pos)!) game = slide(game, move.car, move.to, help)!;
  return game;
}
const solvedLevel = (level: number) => finish(startGame(level));

test("every level: a 6×7 street, your CNG first in the exit lane, at most 10 vehicles, nothing overlapping", () => {
  assert.equal(LEVEL_COUNT, 40);
  assert.equal(new Set(LEVELS.map(([code]) => code)).size, 40, "40 different jams");
  for (const [code] of LEVELS) {
    const { cars, start } = parseLevel(code);
    assert.ok(cars.length >= 3 && cars.length <= MAX_CARS, code);
    assert.deepEqual(cars[0], { kind: "cng", len: 2, down: true, line: EXIT_COL });
    assert.equal(cars.filter(car => car.kind === "cng").length, 1, "only one CNG, so yours is never confused");
    assert.equal(levelCode(cars, start), code);
    const grid = occupancy(cars, start);
    assert.equal(grid.filter(cell => cell >= 0).length, cars.reduce((sum, car) => sum + car.len, 0), `overlap in ${code}`);
    cars.forEach((car, i) => assert.ok(start[i] >= 0 && start[i] + car.len <= (car.down ? ROWS : COLS), code));
    assert.ok(start[0] > 0, "never starts already out");
  }
});

test("every level is solvable in exactly its recorded moves, and the moves rise from 3", () => {
  let before = 0;
  LEVELS.forEach(([code, best], index) => {
    const { cars, start } = parseLevel(code);
    assert.equal(solve(cars, start)?.length, best, `level ${index + 1}`);
    assert.ok(best >= before, `level ${index + 1} is not easier than the one before`);
    before = best;
  });
  assert.equal(fewest(1), 3, "the first jam takes three moves");
  assert.ok(fewest(40) >= 25, `the last jam is a real puzzle (${fewest(40)})`);
  assert.ok(fewest(20) > fewest(5) && fewest(40) > fewest(20));
});

test("the same level always starts the same, and the same moves end the same", () => {
  assert.deepEqual(startGame(12), startGame(12));
  const a = solvedLevel(12), b = replay(12, encodeMoves(a.moves));
  assert.deepEqual(b?.pos, a.pos);
  assert.equal(b?.moves.length, fewest(12));
});

test("slides: only along the lane, never through another vehicle, never off the street", () => {
  const game = startGame(1);
  for (let car = 0; car < game.cars.length; car++) {
    const [low, high] = reachOf(game, car);
    for (let to = -2; to <= 8; to++) {
      const next = slide(game, car, to);
      if (to >= low && to <= high && to !== game.pos[car]) assert.ok(next, `car ${car} to ${to}`);
      else assert.equal(next, null, `car ${car} to ${to}`);
    }
  }
  // Your CNG is blocked at the start of level 1: it can't jump over what's above it.
  assert.equal(slide(game, 0, 0), null);
  assert.equal(slide(game, 99, 0), null);
  assert.equal(slide(game, 0, 1.5), null);
});

test("moving the same vehicle again is still one move; moving it back takes the move away; undo puts it back", () => {
  let game = startGame(3);
  const car = game.cars.findIndex((_, i) => { const [low, high] = reachOf(game, i); return high - low >= 2; });
  assert.ok(car >= 0);
  const [low, high] = reachOf(game, car), home = game.pos[car];
  const far = home === low ? high : low, near = home === low ? low + 1 : high - 1;
  game = slide(game, car, near)!;
  game = slide(game, car, far)!;
  assert.equal(game.moves.length, 1);
  assert.deepEqual(game.moves[0], { car, from: home, to: far });
  game = slide(game, car, home)!;
  assert.equal(game.moves.length, 0, "back where it started: no move counted");
  game = slide(game, car, far)!;
  game = undo(game);
  assert.equal(game.pos[car], home);
  assert.equal(undo(game), game, "nothing to undo");
});

test("the hint always knows a shortest way, and taking it every time solves in the best number of moves", () => {
  for (const level of [1, 7, 23, 40]) {
    let game = startGame(level);
    while (!game.won) game = slide(game, hint(game)!.car, hint(game)!.to, true)!;
    assert.equal(game.moves.length, fewest(level));
    assert.equal(game.helped, fewest(level));
    assert.equal(hint(game), null);
    assert.equal(slide(game, 1, 0), null, "no moves after the CNG is out");
  }
});

test("a headless player: random slides for a while, then the hint, always gets out with a plausible count", () => {
  const rng = makeRng(2026);
  for (let run = 0; run < 12; run++) {
    const level = 1 + pick(rng, LEVEL_COUNT);
    let game = startGame(level);
    for (let step = 0; step < 60 && !game.won; step++) {
      const car = pick(rng, game.cars.length), [low, high] = reachOf(game, car);
      game = slide(game, car, low + pick(rng, high - low + 1)) ?? game;
    }
    const wandered = game.moves.length;
    if (!game.won) game = finish(game, true);
    assert.ok(game.won, `level ${level}`);
    assert.ok(game.moves.length >= fewest(level) || game.helped === 0 && game.moves.length === wandered);
    assert.ok(game.moves.length <= 60 + 60, "counted moves never exceed the slides made");
    assert.ok(replay(level, encodeMoves(game.moves)), "every finished game makes a valid link");
  }
});

test("score bands and the kind lines", () => {
  assert.equal(band(7, 7, 0), "perfect");
  assert.equal(band(9, 7, 0), "close");
  assert.equal(band(14, 7, 0), "good");
  assert.equal(band(15, 7, 0), "long");
  assert.equal(band(7, 7, 2), "helped");
  assert.equal(humanLine(7, 7, 0), "এর চেয়ে কম চালে হয় না। একদম মাপা হিসাব!");
  assert.equal(compareLine(7, 9, "রাফি"), "রাফির চেয়ে ২ চাল কম!");
  assert.equal(compareLine(9, 9, "রাফি"), "একদম সমান! রাফিও ৯ চালেই ছাড়িয়েছিল।");
  assert.equal(compareLine(10, 9, ""), "আর একটু হলেই! মাত্র ১ চাল বেশি।");
  assert.equal(compareLine(15, 9, "মিম"), "মিম এখনো ৬ চাল এগিয়ে। আরেকবার?");
});

test("a link round-trips, and the move count is proven by replaying it", () => {
  const game = solvedLevel(12);
  const shared = fromGame(game, "  রাফি ");
  const hash = sharedHash(shared);
  assert.match(hash, /^l=12&m=[0-9a-zA-X]+&n=/);
  const back = parseShared(`#${hash}`);
  assert.deepEqual(back, { level: 12, moves: shared.moves, count: fewest(12), helped: 0, name: "রাফি" });
  assert.equal(share.normalize(hash), hash);
  const helped = sharedHash({ ...shared, helped: 3 });
  assert.equal(parseShared(helped)?.helped, 3);
  assert.equal(feat({ ...back!, count: 9 }), `রাফি ১২ নম্বর জ্যাম ৯ চালে ছাড়িয়েছে (সেরা ${new Intl.NumberFormat("bn-BD").format(fewest(12))})`);
});

test("forged, broken or hostile links are refused", () => {
  const game = solvedLevel(5);
  const moves = encodeMoves(game.moves);
  const hash = sharedHash(fromGame(game, "রাফি"));
  const params = (change: Record<string, string>) => { const p = new URLSearchParams(hash); for (const [k, v] of Object.entries(change)) p.set(k, v); return p.toString(); };
  const first = game.moves[0];
  const doubled = moves[0] + encodeMoves([{ ...first, to: first.from }]).slice(0, 1) + moves.slice(1);
  const bad = [
    "", "result", "#result", "l=5", "m=" + moves,
    params({ l: "0" }), params({ l: "41" }), params({ l: "05" }), params({ l: "6" }), params({ l: "5.0" }), params({ l: "" }),
    params({ m: moves.slice(0, -1) }), params({ m: moves + moves[0] }), params({ m: "" }), params({ m: "<script>" }), params({ m: "Y" }),
    params({ m: [...moves].reverse().join("") }), params({ m: doubled }), params({ m: "0".repeat(MAX_LINK_MOVES + 1) }),
    params({ h: String(game.moves.length + 1) }), params({ h: "-1" }), params({ h: "01" }), params({ h: "1e2" }),
    params({ n: "ক".repeat(700) }),
  ];
  for (const state of bad) assert.equal(share.normalize(state), null, state);
  const odd = parseShared(params({ n: "  রিমা‮\u0000 আক্তার আক্তার আক্তার  " }));
  assert.equal(odd?.name, "রিমা আক্তার আক্তার আ");
});

test("this phone's progress: unlocks the next jam, keeps the fewest unaided moves, ignores junk", () => {
  assert.deepEqual(readProgress(null), {});
  assert.deepEqual(readProgress("not json"), {});
  assert.deepEqual(readProgress("[1,2]"), {});
  assert.deepEqual(readProgress('{"1":5,"2":-1,"3":2.5,"41":4,"x":3,"4":"7","5":0}'), { 1: 5, 5: 0 });
  assert.equal(unlocked({}), 1);
  const won = solvedLevel(1);
  let progress = recordWin({}, won);
  assert.deepEqual(progress, { 1: 3 });
  assert.equal(unlocked(progress), 2);
  progress = recordWin(progress, { ...won, moves: [...won.moves, ...won.moves] });
  assert.equal(progress[1], 3, "a longer solve doesn't replace the best");
  assert.deepEqual(recordWin({}, { ...won, helped: 1 }), { 1: 0 }, "solved with help: unlocked, no record");
  assert.deepEqual(recordWin({ 1: 0 }, won), { 1: 3 });
  assert.deepEqual(recordWin({ 1: 3 }, { ...won, helped: 2 }), { 1: 3 });
  assert.equal(unlocked({ 40: 30 }), 40);
});

test("previews and captions are personal and honest", () => {
  const shared = { ...fromGame(solvedLevel(12), "রাফি"), count: 9 };
  assert.equal(previewTitle(shared), `${feat(shared)}। তুমি পারবে?`);
  assert.match(feat({ ...shared, name: "" }), /^এক বন্ধু ১২ নম্বর জ্যাম/);
  assert.match(feat({ ...shared, helped: 2 }), /^রাফি একটু সাহায্য নিয়ে/);
  assert.match(caption(shared), /১২ নম্বর জ্যাম ৯ চালে/);
  const real = fromGame(solvedLevel(30), "মিম");
  assert.equal(share.preview(sharedHash(real)).title, previewTitle(real));
  assert.equal(share.preview("junk").title, "জ্যাম ছাড়াও: গাড়ি সরিয়ে সবুজ CNG বের করো");
  assert.equal(share.tally, undefined);
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.notEqual(site.headline, site.title);
  assert.ok(site.faq.length >= 5);
  assert.ok(site.steps.length >= 3);
  assert.match(site.privacy.join(" "), /স্কোর/);
  assert.match(site.privacy.join(" "), /নাম/);
  const everything = JSON.stringify(site) + share.preview("").description;
  assert.doesNotMatch(everything, /আপনি|করুন|দেখুন/);
  assert.doesNotMatch(everything, /বাজি|টাকা জিত|লটারি|অ্যাম্বুলেন্স|rush hour/i);
});
