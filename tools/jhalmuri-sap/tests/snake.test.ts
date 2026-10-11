import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { banner, caption, parseShared, previewTitle, sharedHash, MAX_SCORE, POINTS } from "../lib/link";
import {
  bands, cellOf, compareLine, createGame, heading, humanLine, interval, step, turn, turnSide,
  BONUS_EVERY, BONUS_LIFE, BONUS_POINTS, CELLS, COLS, DX, DY, ROWS, START, type Dir, type Game, type Kind,
} from "../lib/snake";

const xy = (cell: number) => [cell % COLS, Math.floor(cell / COLS)] as const;

/** A simple bot: breadth-first to the food (or the golden chilli if it's closer), else any move that doesn't crash. `vertical` flips its tie-breaking so two bots take different paths. */
function botMove(game: Game, vertical = false): Dir | null {
  const order: Dir[] = vertical ? [0, 2, 1, 3] : [1, 3, 0, 2];
  const blocked = new Set(game.body.slice(0, -1));
  const goals = new Set([game.food, game.bonus].filter(cell => cell >= 0));
  const head = game.body[0];
  const firstStep = new Map<number, Dir>([[head, game.dir]]);
  const queue = [head];
  while (queue.length) {
    const cell = queue.shift()!;
    const [x, y] = xy(cell);
    for (const dir of order) {
      if (cell === head && (dir + 2) % 4 === game.dir) continue;
      const nx = x + DX[dir], ny = y + DY[dir], next = cellOf(nx, ny);
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || blocked.has(next) || firstStep.has(next)) continue;
      firstStep.set(next, cell === head ? dir : firstStep.get(cell)!);
      if (goals.has(next)) return firstStep.get(next)!;
      queue.push(next);
    }
  }
  return null;
}

function play(seed: number, vertical = false, limit = 4000) {
  const game = createGame(seed);
  const kinds: Kind[] = [game.kind];
  for (let i = 0; i < limit && !game.over; i++) {
    const dir = botMove(game, vertical);
    if (dir !== null) turn(game, dir);
    const event = step(game);
    if (event === "eat") kinds.push(game.kind);
  }
  return { game, kinds };
}

test("the same seed gives the same game, move for move", () => {
  const one = play(48213), two = play(48213);
  assert.deepEqual(one.game.body, two.game.body);
  assert.equal(one.game.score, two.game.score);
  assert.deepEqual(one.kinds, two.kinds);
  const other = createGame(48214), first = createGame(48213);
  assert.notDeepEqual([other.food, other.kind], [first.food, first.kind]);
});

test("the seed alone fixes the order of the food, whatever path the snake takes", () => {
  const sideways = play(777, false, 600), upright = play(777, true, 600);
  assert.notDeepEqual(sideways.game.body, upright.game.body);
  const shared = Math.min(sideways.kinds.length, upright.kinds.length);
  assert.ok(shared > 10);
  assert.deepEqual(sideways.kinds.slice(0, shared), upright.kinds.slice(0, shared));
});

test("a turn can never fold the snake back on itself, however fast the taps", () => {
  const game = createGame(1);
  assert.equal(turn(game, 2), false, "straight back down is refused");
  assert.equal(turn(game, 0), false, "the same way is ignored");
  // Left then down inside one move: a naive game reverses into its own neck here.
  assert.equal(turn(game, 3), true);
  assert.equal(turn(game, 2), true);
  assert.equal(step(game), "move");
  assert.equal(step(game), "move");
  assert.equal(game.over, false);
  assert.deepEqual(xy(game.body[0]), [4, 12]);
  // Taps turn relative to where the snake will be heading after the queued turns.
  const tapper = createGame(1);
  assert.equal(turnSide(tapper, 1), true);
  assert.equal(heading(tapper), 1);
  assert.equal(turnSide(tapper, 1), true);
  assert.equal(heading(tapper), 2);
  assert.equal(turnSide(tapper, -1), true);
  assert.equal(turnSide(tapper, -1), false, "the buffer holds three turns");
  assert.deepEqual(tapper.queue, [1, 2, 1]);
});

test("the tin fence ends the game; the snake gets 11 free moves straight up", () => {
  const game = createGame(5);
  game.food = -1; game.bonus = -1;
  for (let i = 0; i < 11; i++) assert.notEqual(step(game), "crash");
  assert.equal(step(game), "crash");
  assert.equal(game.over, true);
  assert.equal(step(game), "none");
  assert.deepEqual(xy(game.body[0]), [5, 0]);
});

test("biting its own body ends it, but chasing its own tail is fine", () => {
  const ring = createGame(2);
  ring.food = cellOf(0, 0); ring.bonus = -1;
  ring.body = [cellOf(5, 5), cellOf(5, 6), cellOf(6, 6), cellOf(6, 5)];
  ring.dir = 0;
  turn(ring, 1);
  assert.equal(step(ring), "move", "the tail leaves (6,5) as the head arrives");
  const coil = createGame(2);
  coil.food = cellOf(0, 0); coil.bonus = -1;
  coil.body = [cellOf(5, 5), cellOf(5, 6), cellOf(6, 6), cellOf(6, 5), cellOf(7, 5)];
  coil.dir = 0;
  turn(coil, 1);
  assert.equal(step(coil), "crash");
});

test("food scores 10, a golden chilli 30, and the chilli comes after every 4th food and fades after 45 moves", () => {
  const game = createGame(9);
  const eatNext = () => { game.food = game.body[0] - COLS; game.dir = 0; return step(game); };
  game.body = [cellOf(5, 12), cellOf(5, 13), cellOf(5, 14)];
  for (let i = 1; i <= BONUS_EVERY; i++) {
    game.body = [cellOf(5, 12), cellOf(5, 13), cellOf(5, 14)];
    assert.equal(eatNext(), "eat");
    assert.equal(game.score, i * POINTS);
    assert.equal(game.bonus >= 0, i === BONUS_EVERY);
  }
  assert.equal(game.bonusLife, BONUS_LIFE);
  const length = game.body.length;
  game.bonus = game.body[0] - COLS;
  assert.equal(step(game), "bonus");
  assert.equal(game.score, BONUS_POINTS + BONUS_EVERY * POINTS);
  assert.equal(game.body.length, length + 1);

  const fading = createGame(9);
  fading.food = cellOf(0, 15); fading.bonus = cellOf(11, 0); fading.bonusLife = 3;
  step(fading); step(fading);
  assert.equal(fading.bonus, cellOf(11, 0));
  step(fading);
  assert.equal(fading.bonus, -1);
});

test("filling the whole ঠোঙা is a win, not a crash", () => {
  const path: number[] = [];
  for (let y = 0; y < ROWS; y++) for (let i = 0; i < COLS; i++) path.push(cellOf(y % 2 ? COLS - 1 - i : i, y));
  const game = createGame(3);
  game.body = path.slice(0, CELLS - 1).reverse();
  game.food = path[CELLS - 1]; game.bonus = -1;
  game.dir = 3;
  assert.equal(step(game), "win");
  assert.equal(game.won, true);
  assert.equal(game.body.length, CELLS);
});

test("speed rises gently and ধীরে খেলো caps it", () => {
  assert.equal(interval(0, false), 220);
  assert.equal(interval(4, false), 220);
  assert.equal(interval(5, false), 208);
  for (let eaten = 1; eaten < 200; eaten++) {
    assert.ok(interval(eaten, false) <= interval(eaten - 1, false));
    assert.ok(interval(eaten, false) >= 100);
    assert.ok(interval(eaten, true) >= 240);
    assert.ok(interval(eaten, true) > interval(eaten, false));
  }
});

test("a headless run ends sanely with a plausible score", () => {
  for (const seed of [1, 48213, 999_999_999]) {
    const { game } = play(seed);
    assert.equal(game.score, game.eaten * POINTS + game.golden * BONUS_POINTS);
    assert.equal(game.body.length, START.length + game.eaten + game.golden);
    assert.ok(game.score >= 200, `seed ${seed}: ${game.score}`);
    assert.ok(game.score <= MAX_SCORE);
    assert.ok(game.golden <= Math.floor(game.eaten / BONUS_EVERY));
    assert.equal(new Set(game.body).size, game.body.length, "no cell holds two segments");
  }
});

test("score bands and the friendly comparison", () => {
  assert.equal(humanLine(0), "ঠোঙা তো সবে খুলল!");
  assert.equal(humanLine(290), bands[0].line);
  assert.equal(humanLine(300), "ঝাল সামলে ভালোই খেয়েছ।");
  assert.equal(humanLine(900), bands[1].line);
  assert.equal(humanLine(910), "ঠোঙা প্রায় খালি!");
  assert.equal(compareLine(1360, 1240, "রাফি"), "রাফির চেয়ে ১২০ বেশি!");
  assert.equal(compareLine(1240, 1240, "রাফি"), "একদম সমান! রাফিও ১২৪০।");
  assert.equal(compareLine(1100, 1240, "রাফি"), "আর একটু হলেই! মাত্র ১৪০ কম।");
  assert.equal(compareLine(300, 1240, ""), "বন্ধু এখনো ৯৪০ এগিয়ে। আরেকবার?");
  for (let score = 0; score <= 1500; score += 10) assert.doesNotMatch(compareLine(score, 700, "রাফি") + humanLine(score), /হেরে|খারাপ|ব্যর্থ/);
});

test("challenge links round-trip, and hostile or impossible ones are refused or capped", () => {
  const shared = { seed: 48213, score: 1240, name: "রাফি" };
  assert.equal(sharedHash(shared), "s=48213&t=1240&n=" + encodeURIComponent("রাফি").replace(/%20/g, "+"));
  assert.deepEqual(parseShared("#" + sharedHash(shared)), shared);
  assert.equal(share.normalize(sharedHash(shared)), sharedHash(shared));
  assert.equal(share.normalize("s=48213&t=1240&n=রাফি&x=<script>"), sharedHash(shared), "unknown keys are dropped");
  for (const bad of ["", "result", "#result", "s=0&t=10", "s=1000000000&t=10", "s=-4&t=10", "s=12&t=1245", "s=12&t=-10", `s=12&t=${MAX_SCORE + 10}`, "s=1.5&t=10", "s=12&t=ten", "s=12&t=10&n=" + "ক".repeat(700)]) {
    assert.equal(share.normalize(bad), null, bad);
  }
  const odd = parseShared("s=12&t=10&n=" + encodeURIComponent("  রিমা‮\u0000 আক্তার আক্তার আক্তার  "));
  assert.equal(odd?.name, "রিমা আক্তার আক্তার আ");
  assert.equal(parseShared("s=12&t=0")?.score, 0);
});

test("previews and captions are personal and honest", () => {
  const shared = { seed: 48213, score: 1240, name: "রাফি" };
  assert.equal(previewTitle(shared), "রাফি ১২৪০ করেছে। তুমি পারবে?");
  assert.equal(previewTitle({ ...shared, name: "" }), "ঝালমুড়ি সাপে ১২৪০! তুমি পারবে?");
  assert.equal(banner(shared), "রাফি ১২৪০ করেছে। একই ঠোঙা, তোমার পালা।");
  assert.match(caption(shared), /১২৪০/);
  assert.equal(share.preview(sharedHash(shared)).title, "রাফি ১২৪০ করেছে। তুমি পারবে?");
  assert.equal(share.preview("junk").title, "সাপটা ঝালমুড়ি খাবে, তুমি চালাও");
  assert.equal(share.tally, undefined);
});

test("content meets the SEO limits and never names a trademark", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 5);
  assert.ok(site.steps.length >= 3);
  assert.match(site.privacy.join(" "), /স্কোর/);
  const everything = JSON.stringify(site) + share.preview("").description;
  assert.doesNotMatch(everything, /nokia|নোকিয়া|snake|xenzia|স্নেক/i);
  assert.doesNotMatch(everything, /আপনি|করুন/);
});
