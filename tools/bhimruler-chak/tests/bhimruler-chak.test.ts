import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, readLevels, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import { flood, generate, layNests, lesson, neighbours, solve } from "../lib/board";
import { dig, lessonStep, marksLeft, newGame, nextStar, openCount, safeHint, startLevel, starsEarned, takeHint, toggleMark, twoStarTime, wrongMarks, COVERED, MARKED, OPEN, type Game } from "../lib/game";
import { LEVELS, LEVEL_COUNT, specOf, worldOf } from "../lib/levels";
import { bannerNote, caption, clearLine, clock, compareLine, feat, humanLine, lossLine, nearMissLine, parseShared, previewTitle, sharedHash, timeText, MAX_SECONDS } from "../lib/link";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
const boardOf = (game: Game) => game.board!;

test("the ladder: 30 levels, 6×6 with 4 nests up to 9×14, never easier than the one before", () => {
  assert.equal(LEVEL_COUNT, 30);
  assert.deepEqual(LEVELS[0], [6, 6, 4]);
  assert.deepEqual(LEVELS[29], [9, 14, 30]);
  for (let index = 1; index < LEVEL_COUNT; index++) {
    const [c0, r0, n0] = LEVELS[index - 1], [c1, r1, n1] = LEVELS[index];
    assert.ok(c1 * r1 >= c0 * r0 && n1 >= n0, `level ${index + 1}`);
    assert.ok(c1 <= 9, "nine columns at most, so bushes stay tappable");
    assert.ok(n1 / (c1 * r1) <= 0.24, "density stays fair");
  }
  assert.equal(worldOf(1).name, "বাড়ির পেছনে"); assert.equal(worldOf(11).name, "রাজশাহী"); assert.equal(worldOf(30).name, "চাঁপাইনবাবগঞ্জ");
  assert.equal(specOf(1).par, 60);
  assert.equal(specOf(30).par, 140);
});

test("same seed and first tap, same orchard; a different seed, a different one", () => {
  const a = generate(9, 14, 28, 777, 40), b = generate(9, 14, 28, 777, 40), c = generate(9, 14, 28, 778, 40);
  assert.deepEqual([...a.board.nest], [...b.board.nest]);
  assert.notDeepEqual([...a.board.nest], [...c.board.nest]);
  const one = layNests(6, 6, 4, 0, makeRng(5));
  assert.equal(one.nest.reduce((s, v) => s + v, 0), 4);
  one.count.forEach((count, cell) => assert.equal(count, neighbours(6, 6)[cell].reduce((s, other) => s + one.nest[other], 0)));
});

test("every level, many seeds: the first tap opens an area and logic alone clears the rest, quickly", () => {
  for (const level of levels) {
    const { cols, rows, nests } = specOf(level);
    let worst = 0;
    for (let trial = 0; trial < 24; trial++) {
      const seed = 1000 + level * 7919 + trial * 104729, first = (trial * 37 + level) % (cols * rows);
      const started = performance.now();
      const { board, fair } = generate(cols, rows, nests, seed, first, level === 1);
      worst = Math.max(worst, performance.now() - started);
      assert.ok(fair, `level ${level} seed ${seed}`);
      assert.equal(board.nest[first], 0);
      assert.equal(board.count[first], 0, "the first tap is a 0, so it opens an area");
      const open = new Uint8Array(cols * rows);
      assert.ok(flood(board, open, first).length >= 4);
      assert.ok(solve(board, open).cleared, `level ${level} needs no guessing`);
    }
    assert.ok(worst < 80, `level ${level}: worst board took ${worst.toFixed(1)}ms (cap 80ms here, a cheap phone about 5× slower)`);
  }
});

test("the solver never calls a nest safe", () => {
  const rng = makeRng(99);
  for (let trial = 0; trial < 300; trial++) {
    const board = layNests(8, 10, 14, trial % 80, rng), open = new Uint8Array(80);
    flood(board, open, trial % 80);
    // Open a few more safe cells at random, then ask for the next proven-safe one.
    for (let extra = 0; extra < trial % 6; extra++) { const cell = Math.floor(rng() * 80); if (!board.nest[cell]) flood(board, open, cell); }
    const { firstSafe } = solve(board, open, true);
    if (firstSafe >= 0) { assert.equal(board.nest[firstSafe], 0); assert.equal(open[firstSafe], 0); }
  }
});

test("level 1 always has its lesson: a 1 with one covered bush, then a 1 that frees its other bushes", () => {
  for (let seed = 1; seed <= 200; seed++) {
    const first = seed % 36, game = dig(newGame(1, seed * 31), first)!.game, teach = game.lesson!;
    assert.ok(teach, `seed ${seed}`);
    const board = boardOf(game), near = neighbours(6, 6);
    assert.equal(board.nest[teach.nest], 1);
    assert.equal(board.count[teach.clue], 1);
    assert.deepEqual(near[teach.clue].filter(cell => game.cells[cell] !== OPEN), [teach.nest]);
    teach.safe.forEach(cell => { assert.equal(board.nest[cell], 0); assert.ok(near[teach.helper].includes(cell)); });
    assert.equal(lessonStep(game), 2);
    const tied = toggleMark(game, teach.nest)!;
    assert.equal(lessonStep(tied), 3);
    let done: Game = tied;
    for (const cell of teach.safe) done = dig(done, cell)?.game ?? done;
    assert.equal(lessonStep(done), 0, "all three steps done");
  }
  assert.equal(lessonStep(newGame(1, 5)), 1);
  assert.equal(lessonStep(newGame(2, 5)), 0);
});

test("rules: a গামছা blocks a tap, marks need a board, a number clears around its marked nests, a wrong mark goes off", () => {
  const fresh = newGame(3, 4242);
  assert.equal(toggleMark(fresh, 0), null, "no marks before the first tap");
  const game = dig(fresh, 20)!.game, board = boardOf(game), near = neighbours(6, 7);
  assert.equal(game.status, "playing");
  assert.equal(dig(game, 20), null, "tapping an open 0 does nothing");
  const covered = [...game.cells.keys()].find(cell => game.cells[cell] === COVERED)!;
  const tied = toggleMark(game, covered)!;
  assert.equal(tied.cells[covered], MARKED);
  assert.equal(marksLeft(tied), 5);
  assert.equal(dig(tied, covered), null, "a tied bush can't be cleared");
  assert.equal(toggleMark(tied, covered)!.cells[covered], COVERED);
  assert.equal(toggleMark(game, 20), null, "open ground can't be tied");

  // Chord: find an open number, tie its true nests, and tapping it clears the rest.
  const number = [...game.cells.keys()].find(cell => game.cells[cell] === OPEN && board.count[cell] && near[cell].some(o => game.cells[o] === COVERED && !board.nest[o]));
  if (number !== undefined) {
    assert.equal(dig(game, number), null, "not until its nests are all tied");
    let ready = game;
    for (const other of near[number]) if (board.nest[other]) ready = toggleMark(ready, other)!;
    const move = dig(ready, number)!;
    assert.ok(!move.boom && move.opened.length > 0);
    near[number].forEach(other => assert.ok(board.nest[other] ? move.game.cells[other] === MARKED : move.game.cells[other] === OPEN));
    // Tie a wrong bush instead of the real nest: the chord sets the nest off.
    const realNest = near[number].find(other => board.nest[other] && game.cells[other] === COVERED);
    const fake = near[number].find(other => !board.nest[other] && game.cells[other] === COVERED);
    if (realNest !== undefined && fake !== undefined && board.count[number] === 1) {
      const wrong = dig(toggleMark(game, fake)!, number)!;
      assert.ok(wrong.boom);
      assert.equal(wrong.game.hit, realNest);
      assert.deepEqual(wrongMarks(wrong.game), [fake]);
    }
  }
  const nest = [...board.nest.keys()].find(cell => board.nest[cell])!;
  const lost = dig(game, nest)!;
  assert.ok(lost.boom); assert.equal(lost.game.status, "lost"); assert.equal(lost.game.hit, nest);
  assert.equal(dig(lost.game, 0), null, "nothing moves after the end");
});

test("a headless run: hints alone clear every level, the board ends won with every nest tied", () => {
  for (const level of [1, 5, 12, 20, 30]) {
    let game = dig(newGame(level, 31337 + level), 0)!.game, guard = 0;
    while (game.status === "playing" && guard++ < 400) {
      const cell = safeHint(game);
      assert.ok(cell >= 0 && !boardOf(game).nest[cell], `level ${level}: the hint is safe`);
      game = takeHint(game)!.game;
    }
    assert.equal(game.status, "won", `level ${level}`);
    assert.equal(openCount(game.cells), specOf(level).safe);
    assert.equal(marksLeft(game), 0);
    assert.ok(game.hints > 0 && game.hints < specOf(level).safe);
  }
});

test("a careless player tapping at random ends sanely: won or caught, never stuck", () => {
  const rng = makeRng(2026);
  let wins = 0, losses = 0;
  for (let round = 0; round < 60; round++) {
    let game = newGame(1 + (round % 10), 500 + round), guard = 0;
    while ((game.status === "ready" || game.status === "playing") && guard++ < 500) {
      const move = dig(game, Math.floor(rng() * game.cells.length));
      if (move) game = move.game;
    }
    assert.ok(game.status === "won" || game.status === "lost");
    if (game.status === "won") wins++; else losses++;
  }
  assert.ok(losses > wins, "random tapping mostly meets a nest");
});

test("stars: time against par, twice par for two, and a hint lowers the ceiling", () => {
  const par = specOf(12).par;
  assert.equal(twoStarTime(par), par * 2);
  assert.equal(starsEarned(par, 0, par), 3);
  assert.equal(starsEarned(par + 1, 0, par), 2);
  assert.equal(starsEarned(par * 2, 0, par), 2);
  assert.equal(starsEarned(par * 2 + 1, 0, par), 1);
  assert.equal(starsEarned(10, 1, par), 2);
  assert.equal(starsEarned(10, 2, par), 1);
  assert.equal(starsEarned(10, 9, par), 1);
  assert.equal(nextStar(par, 0, par), null);
  assert.deepEqual(nextStar(par + 12, 0, par), { goal: 3, seconds: 12, hints: 0 });
  assert.deepEqual(nextStar(par * 2 + 5, 0, par), { goal: 2, seconds: 5, hints: 0 });
  assert.deepEqual(nextStar(10, 1, par), { goal: 3, seconds: 0, hints: 1 });
  assert.equal(nearMissLine(nextStar(par + 12, 0, par)), "আর ১২ সেকেন্ড আগে হলে ৩ তারা।");
  assert.equal(nearMissLine(nextStar(10, 1, par)), "১টা হিন্ট কম নিলে ৩ তারা।");
  assert.equal(nearMissLine(null), "");
});

test("progress on this phone goes through the kit's readLevels and recordLevel", () => {
  let saved = readLevels(JSON.stringify({ 1: 3, 2: 2, 31: 3, 0: 1, x: 2, 3: 7 }), LEVEL_COUNT);
  assert.deepEqual(saved, { 1: 3, 2: 2 });
  saved = recordLevel(saved, 2, 1);
  assert.equal(saved[2], 2, "a worse result never lowers the stars");
  saved = recordLevel(saved, 3, 2);
  assert.equal(unlockedLevel(saved, LEVEL_COUNT), 4);
  assert.equal(startLevel(saved, 4), 2);
  assert.equal(startLevel({}, 1), 1);
  assert.equal(startLevel({ 1: 3, 2: 3 }, 3), 3);
  assert.deepEqual(readLevels("{broken", LEVEL_COUNT), {});
});

test("lines are kind, exact and fit the result", () => {
  assert.equal(timeText(45), "৪৫ সেকেন্ড");
  assert.equal(timeText(130), "২ মিনিট ১০ সেকেন্ড");
  assert.equal(timeText(180), "৩ মিনিট");
  assert.equal(clock(65), "০১:০৫");
  assert.equal(lossLine(2), "আর মাত্র ২টা ঝোপ বাকি ছিল!");
  assert.match(lossLine(17), /কেউ হুল খায়নি। আর ১৭টা ঝোপ বাকি ছিল।/);
  for (const level of levels) assert.ok(clearLine(level).length > 10);
  assert.match(clearLine(10), /বাড়ির পেছনের বাগান পুরো সাফ/);
  assert.match(clearLine(30), /৩০টা বাগানের/);
  assert.equal(humanLine(3, 0), "ভিমরুলেরা টেরই পায়নি।");
  assert.match(humanLine(3, 2), /২বার হিন্ট/);
  assert.equal(compareLine(40, 60, "রাফি"), "রাফির চেয়ে ২০ সেকেন্ড আগে!");
  assert.equal(compareLine(60, 60, "রাফি"), "একদম সমান! রাফিও ১ মিনিট নিয়েছিল।");
  assert.equal(compareLine(70, 60, "রাফি"), "আর একটু হলেই! মাত্র ১০ সেকেন্ড পিছিয়ে।");
  assert.match(compareLine(200, 60, ""), /বন্ধু এখনো ২ মিনিট ২০ সেকেন্ড এগিয়ে/);
  assert.match(caption({ level: 3, seconds: 42 }), /৬টা চাক এড়িয়ে.*৪২ সেকেন্ডে/);
});

test("a challenge link round-trips and rebuilds the same orchard", () => {
  const shared = { level: 12, seed: 4321, first: 17, seconds: 130, hints: 1, name: "রাফি" };
  const hash = sharedHash(shared);
  assert.deepEqual(parseShared(`#${hash}`), shared);
  assert.equal(previewTitle(shared), "রাফি লেভেল ১২-এর বাগান ২ মিনিট ১০ সেকেন্ডে সাফ করেছে। তুমি পারবে?");
  assert.equal(feat({ level: 1, seconds: 9, name: "" }), "এক বন্ধু লেভেল ১-এর বাগান ৯ সেকেন্ডে সাফ করেছে");
  assert.match(bannerNote(shared), /১বার হিন্ট নিয়ে।.*রাফির নিজের ফোনের হিসাব/);
  assert.equal(parseShared(sharedHash({ ...shared, seconds: 99999 }))!.seconds, MAX_SECONDS);
  assert.equal(parseShared(sharedHash({ ...shared, hints: 0 }))!.hints, 0);
  assert.equal(share.normalize(hash), hash);
  assert.match(share.preview(hash).title, /রাফি/);
  const { cols, rows, nests } = specOf(12);
  const mine = dig(newGame(12, 4321), 17)!.game, theirs = generate(cols, rows, nests, 4321, 17).board;
  assert.deepEqual([...boardOf(mine).nest], [...theirs.nest], "the friend gets the very same orchard");
});

test("forged, broken or hostile links are refused", () => {
  const good = new URLSearchParams(sharedHash({ level: 1, seed: 77, first: 5, seconds: 30, hints: 0, name: "মিম" }));
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ t: "0" }), variant({ t: String(MAX_SECONDS + 1) }), variant({ t: "1.5" }), variant({ t: "-3" }),
    variant({ l: "31" }), variant({ l: "0" }), variant({ l: "01" }), variant({ l: null }), variant({ l: "1e1" }),
    variant({ f: "36" }), variant({ f: "-1" }), variant({ f: "05" }), variant({ f: null }), variant({ f: "1.5" }), variant({ f: "9999" }),
    variant({ h: "10" }), variant({ h: "" }), variant({ h: "x" }), variant({ s: "0" }), variant({ s: "1000000000" }),
    "", "#", "garbage", "s=1&t=1", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
  ]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null);
  }
  assert.ok(parseShared(variant({ l: "30", f: "125" })), "the last cell of the biggest orchard is fine");
  assert.equal(parseShared(variant({ l: "30", f: "126" })), null);
  const hostile = parseShared(variant({ n: "‮রাফি\u0000" + "ক".repeat(40) }))!;
  assert.ok(hostile.name.length <= 20 && !hostile.name.includes("‮"));
  assert.ok(share.preview("junk").title.length > 0);
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^সংখ্যার ধাঁধা গেম/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /ছবি ফোটাও|সুডোকু/.test(item.answer)));
  for (const word of ["নাম", "সময়", "লেভেল", "সিড", "হিন্ট"]) assert.match(site.privacy.join(" "), new RegExp(word));
  assert.doesNotMatch(JSON.stringify(site), /আপনি|করুন|দেখুন|mine|মাইন|বোমা|minesweeper/i);
});
