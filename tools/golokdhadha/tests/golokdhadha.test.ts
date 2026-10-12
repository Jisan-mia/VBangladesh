import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, pick, readLevels, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import { clean, here, startWalk, stepTo } from "../lib/game";
import { dailyMaze, dhakaDate, fastestTenths, isDailySeed, levelMaze, levelSize, openingLevel, parFor, starsForTime, targetSwipes, worldOf, DAILY_SIZE, LEVEL_COUNT, SLOW_SPEED, SPEED } from "../lib/levels";
import { compareLine, caption, feat, humanLine, mazeLabel, nearMiss, parseShared, previewTitle, seconds, sharedHash, type Shared } from "../lib/link";
import { canGo, dirTo, makeMaze, neighbour, run, shortestPath, straightTo, swipesOnPath, DIRS, E, N, OPPOSITE, S, W, type Dir, type Maze } from "../lib/maze";

const bn = (n: number) => new Intl.NumberFormat("bn-BD", { useGrouping: false }).format(n);

/** Every opening has a matching one next door, nothing opens off the board, and a perfect maze has exactly cells − 1 passages. */
function assertPerfect(maze: Maze) {
  let passages = 0;
  for (let cell = 0; cell < maze.size * maze.size; cell++) {
    for (const dir of DIRS) {
      if (!canGo(maze, cell, dir)) continue;
      const next = neighbour(maze.size, cell, dir);
      assert.ok(next >= 0, "no opening off the board");
      assert.ok(canGo(maze, next, OPPOSITE[dir]), "openings match on both sides");
      passages++;
    }
  }
  assert.equal(passages / 2, maze.size * maze.size - 1);
}

/** An independent check of the shortest way: in a perfect maze there's one way, so a plain depth-first search finds it. */
function dfsPath(maze: Maze) {
  const path = [maze.start], seen = new Set(path);
  const walk = (cell: number): boolean => {
    if (cell === maze.exit) return true;
    for (const dir of DIRS) {
      const next = neighbour(maze.size, cell, dir);
      if (next < 0 || !canGo(maze, cell, dir) || seen.has(next)) continue;
      seen.add(next); path.push(next);
      if (walk(next)) return true;
      path.pop();
    }
    return false;
  };
  return walk(maze.start) ? path : null;
}

/** A perfect player: swipes the right way at every junction, no thinking time. Returns tenths of a second at `speed`. */
function perfectRun(maze: Maze, speed = SPEED) {
  const path = shortestPath(maze)!;
  let cell = maze.start, cells = 0, swipes = 0;
  while (cell !== maze.exit) {
    const at = path.indexOf(cell), walked = run(maze, cell, dirTo(maze.size, cell, path[at + 1]) as Dir);
    assert.deepEqual(walked, path.slice(at + 1, at + 1 + walked.length), "a swipe on the way never leaves it");
    cells += walked.length; swipes++; cell = walked[walked.length - 1];
  }
  return { tenths: Math.ceil(cells / speed * 10), swipes };
}

test("the same seed gives the same maze; another seed a different one; every maze is perfect", () => {
  assert.deepEqual(makeMaze(9, 42), makeMaze(9, 42));
  assert.notDeepEqual(makeMaze(9, 42).open, makeMaze(9, 43).open);
  for (const size of [2, 5, 11, 15]) for (let seed = 1; seed <= 20; seed++) assertPerfect(makeMaze(size, seed));
});

test("every level: the right size, a reachable shop, a par that's right, and decisions rising one step at a time", () => {
  let swipesBefore = 0, threeBefore = 0;
  const seeds = new Set<number>();
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const maze = levelMaze(level), path = shortestPath(maze);
    assert.equal(maze.size, levelSize(level));
    assertPerfect(maze);
    assert.ok(path, `level ${level}: the shop is reachable`);
    assert.equal(path[0], maze.start); assert.equal(path[path.length - 1], maze.exit);
    for (let i = 1; i < path.length; i++) assert.ok(dirTo(maze.size, path[i - 1], path[i]) && canGo(maze, path[i - 1], dirTo(maze.size, path[i - 1], path[i]) as Dir), "no walking through walls");
    assert.deepEqual(path, dfsPath(maze), `level ${level}: BFS agrees with an independent search`);

    const swipes = swipesOnPath(maze, path), par = parFor(maze);
    assert.equal(swipes, targetSwipes(level), `level ${level}`);
    assert.ok(swipes >= swipesBefore, `level ${level} needs no fewer decisions than the one before`);
    assert.equal(par.three, Math.ceil(((path.length - 1) / SPEED + swipes * 0.7 + 2) * 10), `level ${level} par`);
    assert.equal(par.two, par.three * 2 + 30);
    const best = perfectRun(maze);
    assert.equal(best.swipes, swipes);
    assert.ok(best.tenths + 10 * swipes * 0.4 <= par.three, `level ${level}: three stars are reachable with a little thinking time`);
    assert.ok(fastestTenths(maze) <= best.tenths);
    assert.ok(par.three >= threeBefore * 0.85, `level ${level}: par never drops sharply`);
    swipesBefore = swipes; threeBefore = par.three;
    seeds.add(maze.seed);
  }
  assert.equal(seeds.size, LEVEL_COUNT, "30 different mazes");
  assert.equal(levelSize(1), 5); assert.equal(levelSize(LEVEL_COUNT), 15);
  assert.ok(parFor(levelMaze(1)).three <= 50, "level 1 is a win in seconds");
  assert.deepEqual([worldOf(1), worldOf(10), worldOf(11), worldOf(20), worldOf(21), worldOf(30)], [0, 0, 1, 1, 2, 2]);
  assert.equal(levelMaze(7), levelMaze(7), "cached");
});

test("slow mode gives more time, never less", () => {
  for (const level of [1, 15, 30]) assert.ok(parFor(levelMaze(level), SLOW_SPEED).three > parFor(levelMaze(level)).three);
});

test("star thresholds: three at or under par, two at or under the second, one for any finish", () => {
  const par = { three: 50, two: 130 };
  assert.equal(starsForTime(10, par), 3);
  assert.equal(starsForTime(50, par), 3);
  assert.equal(starsForTime(51, par), 2);
  assert.equal(starsForTime(130, par), 2);
  assert.equal(starsForTime(131, par), 1);
  assert.equal(starsForTime(36000, par), 1);
  assert.equal(nearMiss(50, par), null);
  assert.equal(nearMiss(63, par), "আর ১.৩ সেকেন্ড কম লাগলে ৩ তারা।");
  assert.equal(nearMiss(140, par), "আর ১.০ সেকেন্ড কম লাগলে ২ তারা।");
});

test("a swipe runs round bends to the next junction; walls stop it; a tap walks only a straight open lane", () => {
  const maze = levelMaze(12);
  for (let cell = 0; cell < maze.size * maze.size; cell++) {
    for (const dir of DIRS) {
      const cells = run(maze, cell, dir);
      if (!canGo(maze, cell, dir)) { assert.deepEqual(cells, []); continue; }
      assert.ok(cells.length >= 1);
      let from = cell;
      for (const next of cells) { const way = dirTo(maze.size, from, next); assert.ok(way && canGo(maze, from, way as Dir)); from = next; }
      const end = cells[cells.length - 1], ways = DIRS.filter(d => canGo(maze, end, d)).length;
      // It stops only where there's a choice, a dead end, home or the shop.
      assert.ok(ways !== 2 || end === maze.exit || end === maze.start, `run from ${cell} stopped in a plain corridor`);
      for (const middle of cells.slice(0, -1)) assert.equal(DIRS.filter(d => canGo(maze, middle, d)).length, 2);
    }
  }
  const open = makeMaze(4, 1);
  open.open.fill(N | E | S | W);
  for (let i = 0; i < 4; i++) { open.open[i] &= ~N; open.open[12 + i] &= ~S; open.open[i * 4] &= ~W; open.open[i * 4 + 3] &= ~E; }
  assert.deepEqual(straightTo(open, 0, 3), [1, 2, 3]);
  assert.deepEqual(straightTo(open, 12, 0), [8, 4, 0]);
  assert.equal(straightTo(open, 0, 5), null, "not in a line");
  assert.equal(straightTo(open, 0, 0), null);
  assert.equal(straightTo(open, 0, 99), null);
  open.open[1] &= ~E; open.open[2] &= ~W;
  assert.equal(straightTo(open, 0, 3), null, "a wall in the way");
});

test("the pencil line: stepping back rubs it out; a walk that never turns back is clean", () => {
  const maze = levelMaze(1), walk = startWalk(maze);
  stepTo(walk, 5); stepTo(walk, 10);
  assert.deepEqual(walk.trail, [0, 5, 10]);
  assert.ok(clean(walk));
  stepTo(walk, 5);
  assert.deepEqual(walk.trail, [0, 5]);
  assert.equal(here(walk), 5);
  assert.equal(walk.backtracks, 1);
  assert.equal(walk.steps, 3);
  assert.ok(!clean(walk));
  assert.equal(walk.seen[10], 1, "where you've been stays marked");
});

test("a headless player who swipes at random always reaches the shop with a plausible time", () => {
  const rng = makeRng(2026);
  for (const level of [1, 5, 13, 22, 30]) {
    const maze = levelMaze(level), walk = startWalk(maze);
    let swipes = 0;
    while (here(walk) !== maze.exit && swipes < 20000) {
      const ways = DIRS.filter(dir => canGo(maze, here(walk), dir));
      for (const cell of run(maze, here(walk), ways[pick(rng, ways.length)])) stepTo(walk, cell);
      swipes++;
    }
    assert.equal(here(walk), maze.exit, `level ${level}`);
    assert.deepEqual(walk.trail, shortestPath(maze), "after all the wandering, the line left is the one true way");
    const tenths = Math.ceil((walk.steps / SPEED + swipes * 0.5) * 10);
    assert.ok(tenths >= fastestTenths(maze));
    assert.ok([1, 2, 3].includes(starsForTime(tenths, parFor(maze))));
  }
});

test("the daily maze follows Dhaka's calendar and is always solvable", () => {
  assert.equal(dhakaDate(Date.UTC(2026, 9, 11, 17, 59)), 20261011);
  assert.equal(dhakaDate(Date.UTC(2026, 9, 11, 18, 0)), 20261012, "midnight in Dhaka is 18:00 UTC");
  assert.equal(dhakaDate(Date.UTC(2026, 11, 31, 18, 30)), 20270101);
  for (const ok of [20261012, 20280229, 20991231]) assert.ok(isDailySeed(ok), String(ok));
  for (const bad of [20251231, 20261301, 20261032, 20270229, 21000101, 2026101, 20261012.5]) assert.ok(!isDailySeed(bad), String(bad));
  let day = Date.UTC(2026, 9, 1, 6);
  for (let i = 0; i < 60; i++, day += 86_400_000) {
    const maze = dailyMaze(dhakaDate(day));
    assert.equal(maze.size, DAILY_SIZE);
    assert.ok(shortestPath(maze));
  }
  assert.deepEqual(dailyMaze(20261012), dailyMaze(20261012));
});

test("this phone's progress goes through readLevels and recordLevel, and the opening level picks up where you left off", () => {
  assert.equal(openingLevel(readLevels(null, LEVEL_COUNT)), 1);
  assert.equal(openingLevel(readLevels("junk", LEVEL_COUNT)), 1);
  assert.equal(openingLevel(readLevels('{"1":3,"2":2,"99":3,"3":"x"}', LEVEL_COUNT)), 3, "next new level");
  let stars = recordLevel({}, 1, 3);
  stars = recordLevel(stars, 2, 3);
  assert.equal(openingLevel(stars), 3);
  stars = recordLevel(stars, 2, 1);
  assert.equal(stars[2], 3, "a slower finish never lowers the stars");
  const all = Object.fromEntries(Array.from({ length: LEVEL_COUNT }, (_, i) => [i + 1, 3]));
  assert.equal(openingLevel(all), LEVEL_COUNT);
  assert.equal(openingLevel({ ...all, 30: 2 }), 30);
  assert.equal(unlockedLevel(readLevels('{"29":1}', LEVEL_COUNT), LEVEL_COUNT), 30, "reached levels stay open");
});

const mine = (level: number, extra: Partial<Shared> = {}): Shared => {
  const maze = levelMaze(level), tenths = parFor(maze).three - 5;
  return { level, seed: maze.seed, tenths, stars: starsForTime(tenths, parFor(maze)), clean: true, name: "রাফি", ...extra };
};

test("a link round-trips, carries the maze, the time and the stars, and checks them against the maze", () => {
  const shared = mine(7);
  const hash = sharedHash(shared);
  assert.match(hash, /^s=\d+&t=\d+&l=7&r=3&c=1&n=/);
  assert.deepEqual(parseShared(`#${hash}`), shared);
  assert.equal(share.normalize(hash), hash);
  const daily: Shared = { level: 0, seed: 20261012, tenths: 300, stars: starsForTime(300, parFor(dailyMaze(20261012))), clean: false, name: "" };
  assert.deepEqual(parseShared(sharedHash(daily)), daily);
  assert.doesNotMatch(sharedHash(daily), /c=|n=/);
  // Slow-mode stars are accepted: between what normal and slow par would give.
  const maze = levelMaze(7), slowTenths = parFor(maze, SLOW_SPEED).three;
  assert.ok(parseShared(sharedHash({ ...shared, tenths: slowTenths, stars: 3 })));
});

test("forged, broken or hostile links are refused", () => {
  const shared = mine(9), hash = sharedHash(shared);
  const params = (change: Record<string, string | null>) => { const p = new URLSearchParams(hash); for (const [k, v] of Object.entries(change)) v === null ? p.delete(k) : p.set(k, v); return p.toString(); };
  const maze = levelMaze(9);
  const bad = [
    "", "junk", "#result", params({ l: null }), params({ r: null }), params({ s: null }), params({ t: null }),
    params({ l: "31" }), params({ l: "-1" }), params({ l: "07" }), params({ l: "8" }), params({ l: "1.0" }), params({ l: "" }),
    params({ s: String(maze.seed + 1) }), params({ s: "0" }), params({ s: "abc" }),
    params({ t: String(fastestTenths(maze) - 1) }), params({ t: "-5" }), params({ t: "36001" }), params({ t: "4.5" }),
    params({ r: "0" }), params({ r: "4" }), params({ r: "2" }), params({ r: "x" }),
    params({ t: String(parFor(maze, SLOW_SPEED).two + 50), r: "3" }),
    params({ c: "yes" }), params({ c: "0" }),
    params({ l: "0" }), params({ l: "0", s: "20261301" }), params({ l: "0", s: "19991231" }),
    params({ n: "ক".repeat(700) }),
  ];
  for (const state of bad) assert.equal(share.normalize(state), null, state);
  const odd = parseShared(params({ n: "  রিমা‮\u0000 আক্তার আক্তার আক্তার  " }));
  assert.equal(odd?.name, "রিমা আক্তার আক্তার আ");
});

test("previews, captions and lines are personal, exact and kind", () => {
  const shared = { ...mine(7), tenths: 124 };
  assert.equal(feat(shared), "রাফি ১২.৪ সেকেন্ডে লেভেল ৭ পার করেছে");
  assert.equal(previewTitle(shared), `${feat(shared)}। তুমি পারবে?`);
  assert.equal(feat({ ...shared, name: "", level: 0, seed: 20261012 }), "এক বন্ধু ১২.৪ সেকেন্ডে ১২ অক্টোবরের গোলকধাঁধা পার করেছে");
  assert.equal(mazeLabel({ level: 0, seed: 20260105 }), "৫ জানুয়ারির গোলকধাঁধা");
  assert.equal(caption(shared), "গোলকধাঁধার লেভেল ৭ পার করলাম ১২.৪ সেকেন্ডে। তুমি কত সেকেন্ডে পারবে?");
  assert.equal(seconds(5), "০.৫");
  assert.equal(seconds(1234), `${bn(123)}.৪`);
  const real = mine(20, { name: "মিম" });
  assert.equal(share.preview(sharedHash(real)).title, previewTitle(real));
  assert.equal(share.preview("junk").title, "গোলকধাঁধা: গলি পেরিয়ে জিলাপির দোকানে যাও");
  assert.equal(share.tally, undefined);
  assert.equal(compareLine(100, 124, "রাফি"), "রাফির চেয়ে ২.৪ সেকেন্ড আগে!");
  assert.equal(compareLine(124, 124, "রাফি"), "একদম সমান! রাফিও ১২.৪ সেকেন্ডেই পৌঁছেছিল।");
  assert.equal(compareLine(130, 124, ""), "আর একটু হলেই! মাত্র ০.৬ সেকেন্ড পিছিয়ে।");
  assert.equal(compareLine(200, 124, "মিম"), "মিম এখনো ৭.৬ সেকেন্ড এগিয়ে। আরেকবার?");
  const lines = [3, 2, 1].flatMap(stars => [humanLine(stars, true), humanLine(stars, false)]);
  assert.equal(new Set(lines).size, 6, "a different line for each band");
  for (const line of lines) assert.doesNotMatch(line, /অসাধারণ|দারুণ|!!/);
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^গোলকধাঁধা গেম/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.notEqual(site.headline, site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /জ্যাম ছাড়াও/.test(item.answer)), "names a related game");
  assert.ok(site.steps.length >= 3);
  assert.match(site.privacy.join(" "), /সময়/);
  assert.match(site.privacy.join(" "), /নাম/);
  const everything = JSON.stringify(site) + share.preview("").description;
  assert.doesNotMatch(everything, /আপনি|করুন|দেখুন|অসাধারণ|সহজেই/);
  assert.doesNotMatch(everything, /বাজি|টাকা জিত|লটারি|বাঘ/);
});
