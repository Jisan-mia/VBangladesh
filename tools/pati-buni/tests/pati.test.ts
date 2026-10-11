import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { banner, caption, parseShared, previewTitle, reachable, sharedHash, MAT_ROWS, MAX_ROWS, MAX_SCORE, ROW_POINTS } from "../lib/link";
import {
  bands, colourOf, compareLine, createGame, dropMs, fits, hardDrop, humanLine, move, rotate, rowPattern, tick,
  BUNDLE, CELLS, COLS, KINDS, LEVEL_EVERY, OPENING, PIECES, ROWS, TURNS, type Game, type Kind,
} from "../lib/weave";

const FRAME = 1000 / 60;

/** Places a strip by hand, ignoring gravity, for rule tests. */
function place(game: Game, kind: Kind, turn: number, x: number, y: number) {
  game.piece = { kind, turn, x, y };
}

function fillRow(board: Uint8Array, y: number, gaps: number[] = [], colour = 1) {
  for (let x = 0; x < COLS; x++) board[y * COLS + x] = gaps.includes(x) ? 0 : colour;
}

/** Where a bot would like the current strip: the classic height, holes and bumpiness score. */
function bestSpot(game: Game) {
  const piece = game.piece!;
  let best = { turn: 0, x: piece.x, value: -Infinity };
  for (let turn = 0; turn < 4; turn++) {
    for (let x = -3; x < COLS; x++) {
      let y = piece.y;
      if (!fits(game.board, piece.kind, turn, x, y)) continue;
      while (fits(game.board, piece.kind, turn, x, y + 1)) y++;
      const board = game.board.slice(), cells = TURNS[piece.kind][turn];
      for (let i = 0; i < cells.length; i += 2) board[(y + cells[i + 1]) * COLS + x + cells[i]] = 1;
      let lines = 0, holes = 0, total = 0, bump = 0, last = -1;
      for (let row = 0; row < ROWS; row++) if (board.subarray(row * COLS, row * COLS + COLS).every(Boolean)) lines++;
      for (let col = 0; col < COLS; col++) {
        let top = ROWS;
        for (let row = 0; row < ROWS; row++) if (board[row * COLS + col]) { top = row; break; }
        for (let row = top + 1; row < ROWS; row++) if (!board[row * COLS + col]) holes++;
        const height = ROWS - top;
        total += height;
        if (last >= 0) bump += Math.abs(height - last);
        last = height;
      }
      const value = lines * 0.76 - total * 0.51 - holes * 0.36 - bump * 0.18;
      if (value > best.value) best = { turn, x, value };
    }
  }
  return best;
}

/**
 * A headless run in real time: the bot acts once every `actMs` like a thumb would (turn, then step sideways, then hold নামাও),
 * so as the rows pile up and the speed rises it eventually can't keep up.
 */
function play(seed: number, { actMs = 300, limitMs = 30 * 60_000 } = {}) {
  const game = createGame(seed);
  let last = game.piece!, target = bestSpot(game), wait = 0, soft = false;
  const order: Kind[] = [last.kind];
  for (let time = 0; time < limitMs && !game.over; time += FRAME) {
    if (game.piece && game.piece !== last) {
      last = game.piece;
      order.push(last.kind);
      target = bestSpot(game);
      soft = false;
    }
    wait -= FRAME;
    if (game.piece && !game.clearing.length && wait <= 0) {
      wait = actMs;
      if (game.piece.turn !== target.turn) rotate(game);
      else if (game.piece.x !== target.x) move(game, game.piece.x < target.x ? 1 : -1);
      else soft = true;
    }
    tick(game, FRAME, soft);
  }
  return { game, order };
}

test("strips are 2 to 4 cells, edge-connected, and not the classic set of seven", () => {
  assert.equal(KINDS.length, 6);
  const sizes = KINDS.map(kind => PIECES[kind].cells.length).sort();
  assert.deepEqual(sizes, [2, 3, 3, 4, 4, 4]);
  for (const kind of KINDS) {
    const cells = PIECES[kind].cells.map(([x, y]) => `${x},${y}`);
    for (const [x, y] of PIECES[kind].cells) {
      if (cells.length > 1) assert.ok([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => cells.includes(`${x + dx},${y + dy}`)), `${kind} is connected`);
    }
    // Four quarter turns come back to the start, and every turn keeps the strip inside its box.
    assert.deepEqual(TURNS[kind][0], [...PIECES[kind].cells.flat()]);
    for (const turn of TURNS[kind]) for (const value of turn) assert.ok(value >= 0 && value < PIECES[kind].box);
  }
  assert.equal(new Set(BUNDLE).size, KINDS.length);
});

test("the same seed deals the same strips in the same order, whatever the player does", () => {
  const one = play(48213, { limitMs: 90_000 }), two = play(48213, { limitMs: 90_000 });
  assert.deepEqual(one.game.board, two.game.board);
  assert.equal(one.game.score, two.game.score);
  assert.deepEqual(one.order, two.order);
  // A quicker thumb plays a different game from the same bundle.
  const quick = play(48213, { limitMs: 90_000, actMs: 120 });
  assert.notDeepEqual(quick.game.board, one.game.board);
  const shared = Math.min(one.order.length, quick.order.length);
  assert.ok(shared >= 30, String(shared));
  assert.deepEqual(one.order.slice(0, shared), quick.order.slice(0, shared));
  assert.deepEqual(one.order.slice(0, 2), [...OPENING]);
  assert.notDeepEqual(play(48214, { limitMs: 90_000 }).order.slice(2, 12), one.order.slice(2, 12));
  // Each bundle of eight holds the same mix.
  const bundle = one.order.slice(2, 10).sort();
  assert.deepEqual(bundle, [...BUNDLE].sort());
});

test("the opening is half woven, and the first short strip finishes a row straight away", () => {
  const game = createGame(7);
  assert.equal(game.piece!.kind, "dui");
  assert.equal(game.board.subarray(13 * COLS).filter(Boolean).length, 6);
  assert.equal(hardDrop(game), "clear");
  assert.deepEqual(game.clearing, [13]);
  assert.equal(game.rows, 1);
  assert.equal(game.score, 10);
  assert.equal(game.woven.length, 1);
  assert.equal(tick(game, 1000), "spawn");
  assert.equal(game.piece!.kind, "tin");
  // The old second row slid down with its three-wide gap; the straight three needs one step right to fill it.
  assert.equal(game.board.subarray(13 * COLS).filter(Boolean).length, 5);
  assert.equal(move(game, 1), true);
  assert.equal(hardDrop(game), "clear");
  assert.equal(game.rows, 2);
});

test("turning kicks off the walls and the stack, and refuses when nothing fits", () => {
  const game = createGame(1);
  game.board.fill(0);
  // The long strip standing against the right wall turns flat by stepping left.
  place(game, "lomba", 1, 5, 4);
  assert.deepEqual([0, 1, 2, 3].map(i => 5 + TURNS.lomba[1][i * 2]), [7, 7, 7, 7]);
  assert.equal(rotate(game), true);
  assert.equal(game.piece!.turn, 2);
  assert.ok(fits(game.board, "lomba", 2, game.piece!.x, game.piece!.y));
  assert.ok(game.piece!.x < 5);
  // Against the left wall it steps right.
  place(game, "lomba", 3, -1, 4);
  assert.ok(fits(game.board, "lomba", 3, -1, 4));
  assert.equal(rotate(game), true);
  assert.equal(game.piece!.x >= 0, true);
  // Boxed in a one-wide shaft, a straight three can't lie down.
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) game.board[y * COLS + x] = x === 3 ? 0 : 1;
  place(game, "tin", 1, 2, 5);
  assert.ok(fits(game.board, "tin", 1, 2, 5));
  assert.equal(rotate(game), false);
  assert.equal(game.piece!.turn, 1);
  // Four turns in the open bring a strip back where it began.
  game.board.fill(0);
  place(game, "dheu", 0, 2, 5);
  for (let i = 0; i < 4; i++) assert.equal(rotate(game), true);
  assert.deepEqual(game.piece, { kind: "dheu", turn: 0, x: 2, y: 5 });
});

test("moves stop at the walls and the stack", () => {
  const game = createGame(1);
  game.board.fill(0);
  place(game, "dui", 0, 0, 3);
  assert.equal(move(game, -1), false);
  for (let i = 0; i < 6; i++) assert.equal(move(game, 1), true);
  assert.equal(move(game, 1), false);
  game.board[3 * COLS + 5] = 1;
  assert.equal(move(game, -1), false);
});

test("full rows weave, pay a bonus for several at once, and gaps between them close up", () => {
  const game = createGame(1);
  game.board.fill(0);
  // Rows 10 and 12 are full but for column 0; row 11 also misses column 3, so it survives between them.
  fillRow(game.board, 13, [5], 4);
  fillRow(game.board, 12, [0], 2);
  fillRow(game.board, 11, [0, 3], 3);
  fillRow(game.board, 10, [0], 2);
  // A straight three standing in column 0 lands on row 13 and fills rows 10 to 12 there.
  place(game, "tin", 1, -1, 0);
  const filled = game.board.slice();
  filled[12 * COLS] = PIECES.tin.colour;
  const pattern12 = rowPattern(filled, 12);
  assert.equal(hardDrop(game), "clear");
  assert.deepEqual(game.clearing, [10, 12]);
  assert.equal(game.score, ROW_POINTS[2]);
  assert.equal(game.rows, 2);
  assert.equal(game.woven[0], pattern12, "the lower row was woven first");
  assert.equal(tick(game, 100), "none", "the weave takes a moment");
  assert.equal(tick(game, 1000), "spawn");
  // Row 11 (gap at 3) dropped to 12, row 13 stayed put, and the top is empty.
  assert.equal(game.board[12 * COLS + 3], 0);
  assert.equal(game.board[12 * COLS + 2] !== 0, true);
  assert.equal(game.board[13 * COLS + 5], 0);
  assert.equal(game.board.subarray(0, 12 * COLS).some(Boolean), false);

  for (const [count, points] of [[1, 10], [3, 45], [4, 70]] as const) {
    const fresh = createGame(1);
    fresh.board.fill(0);
    for (let y = ROWS - count; y < ROWS; y++) fillRow(fresh.board, y, [0]);
    place(fresh, "lomba", 1, -2, 0);
    hardDrop(fresh);
    assert.equal(fresh.score, points, `${count} rows`);
  }
});

test("the woven pattern keeps the newest fourteen rows with their colours", () => {
  const game = createGame(1);
  for (let i = 0; i < 20; i++) {
    game.board.fill(0);
    game.clearing.length = 0;
    fillRow(game.board, 13, [7], (i % 4) + 1);
    place(game, "dui", 1, 6, 0);
    hardDrop(game);
  }
  assert.equal(game.rows, 20);
  assert.equal(game.woven.length, MAT_ROWS);
  const newest = game.woven[MAT_ROWS - 1];
  // Row 20 used colour 4 in columns 0–6 and the short strip's হলুদ (2) in column 7.
  for (let x = 0; x < 7; x++) assert.equal(((newest >> (x * 2)) & 3) + 1, 4);
  assert.equal(((newest >> 14) & 3) + 1, PIECES.dui.colour);
});

test("a strip resting on the stack waits, can slide, then locks; filling the top ends the game", () => {
  const game = createGame(1);
  game.board.fill(0);
  place(game, "tin", 0, 0, ROWS - 2);
  assert.equal(tick(game, 400), "none");
  assert.equal(move(game, 1), true, "still free to slide");
  assert.equal(tick(game, 400), "none", "the slide restarted the wait");
  assert.equal(tick(game, 100), "lock");
  assert.equal(game.board[13 * COLS + 1] !== 0, true);
  // Sliding forever is not allowed: after 12 restarts the strip locks anyway.
  const stall = createGame(1);
  stall.board.fill(0);
  place(stall, "dui", 0, 0, ROWS - 1);
  let locked = false;
  for (let i = 0; i < 40 && !locked; i++) { move(stall, i % 2 ? -1 : 1); locked = tick(stall, 200) === "lock"; }
  assert.equal(locked, true);

  const full = createGame(1);
  for (let y = 1; y < ROWS; y++) fillRow(full.board, y, [y % COLS]);
  fillRow(full.board, 0, [0, 1, 2, 3, 4, 5]);
  full.board[0 * COLS + 3] = 1;
  place(full, "dui", 0, 0, 0);
  full.next = "lomba";
  assert.equal(hardDrop(full), "over");
  assert.equal(full.over, true);
  assert.equal(tick(full, 1000), "none");
  assert.equal(move(full, 1), false);
  assert.equal(hardDrop(full), "none");
});

test("speed rises every ten rows and ধীরে খেলো caps it", () => {
  assert.equal(dropMs(0, false), 700);
  assert.equal(dropMs(LEVEL_EVERY - 1, false), 700);
  assert.ok(dropMs(LEVEL_EVERY, false) < 700);
  for (let rows = 1; rows < 400; rows++) {
    assert.ok(dropMs(rows, false) <= dropMs(rows - 1, false));
    assert.ok(dropMs(rows, false) >= 70);
    assert.ok(dropMs(rows, true) >= 520);
    assert.ok(dropMs(rows, true) >= dropMs(rows, false));
  }
  const game = createGame(1);
  game.board.fill(0);
  place(game, "dui", 3, 3, 0);
  tick(game, 699);
  assert.equal(game.piece!.y, 0);
  tick(game, 2);
  assert.equal(game.piece!.y, 1);
  tick(game, 80, true);
  assert.equal(game.piece!.y, 3, "soft drop falls a row every 40ms");
});

test("a headless run ends sanely with a plausible score", () => {
  for (const seed of [1, 48213, 999_999_999]) {
    const { game } = play(seed);
    assert.equal(game.over, true, `seed ${seed} should top out once the speed outruns the bot`);
    assert.ok(game.rows >= 30, `seed ${seed}: ${game.rows} rows`);
    assert.ok(reachable(game.score, game.rows), `seed ${seed}: ${game.score} from ${game.rows}`);
    assert.ok(game.score <= MAX_SCORE);
    assert.equal(game.woven.length, Math.min(game.rows, MAT_ROWS));
    // No cell outside the four colours.
    for (const cell of game.board) assert.ok(cell === 0 || (colourOf(cell) >= 1 && colourOf(cell) <= 4));
    assert.equal(game.board.length, CELLS);
  }
});

test("score bands and the friendly comparison", () => {
  assert.equal(humanLine(0), bands[0].line);
  assert.equal(humanLine(4), bands[0].line);
  assert.equal(humanLine(5), "ছোট্ট একটা আসন হয়ে গেল!");
  assert.equal(humanLine(18), "এই পাটিতে দুজন আরাম করে বসবে।");
  assert.equal(humanLine(300), bands[3].line);
  assert.equal(compareLine(235, 215, "রাফি"), "রাফির চেয়ে ২০ বেশি!");
  assert.equal(compareLine(215, 215, "রাফি"), "একদম সমান! রাফিও ২১৫।");
  assert.equal(compareLine(200, 215, "রাফি"), "আর একটু হলেই! মাত্র ১৫ কম।");
  assert.equal(compareLine(40, 215, ""), "বন্ধু এখনো ১৭৫ এগিয়ে। আরেকবার?");
  for (let score = 0; score <= 600; score += 5) assert.doesNotMatch(compareLine(score, 300, "রাফি") + humanLine(score / 10), /হেরে|খারাপ|ব্যর্থ/);
});

test("points must add up from the rows woven", () => {
  assert.ok(reachable(0, 0));
  assert.ok(reachable(10, 1));
  assert.ok(!reachable(15, 1));
  assert.ok(reachable(25, 2));
  assert.ok(reachable(70, 4));
  assert.ok(!reachable(65, 4), "4 rows give 40, 45, 50, 55 or 70");
  assert.ok(reachable(55, 4));
  assert.ok(!reachable(60, 4));
  assert.ok(!reachable(5, 0));
  assert.ok(!reachable(9, 1));
  // Brute force over every way to split up to 30 rows into clears of 1 to 4.
  const possible = new Map<number, Set<number>>([[0, new Set([0])]]);
  for (let rows = 1; rows <= 30; rows++) {
    const set = new Set<number>();
    for (let n = 1; n <= 4 && n <= rows; n++) for (const score of possible.get(rows - n)!) set.add(score + ROW_POINTS[n]);
    possible.set(rows, set);
    for (let score = 0; score <= 600; score += 5) assert.equal(reachable(score, rows), set.has(score), `${score} from ${rows}`);
  }
});

test("challenge links round-trip, and hostile or impossible ones are refused", () => {
  const shared = { seed: 48213, score: 215, rows: 18, pattern: Array.from({ length: 14 }, (_, i) => i * 4099), name: "রাফি" };
  const hash = sharedHash(shared);
  assert.deepEqual(parseShared("#" + hash), shared);
  assert.equal(share.normalize(hash), hash);
  assert.equal(share.normalize(hash + "&x=<script>"), hash, "unknown keys are dropped");
  // Only the newest 14 rows travel.
  assert.deepEqual(parseShared(sharedHash({ ...shared, pattern: [1, 2, ...shared.pattern] }))?.pattern, shared.pattern);
  const small = { seed: 3, score: 10, rows: 1, pattern: [0xffff], name: "" };
  assert.equal(sharedHash(small), "s=3&t=10&r=1&p=ffff");
  assert.deepEqual(parseShared(sharedHash({ seed: 3, score: 0, rows: 0, pattern: [], name: "" })), { seed: 3, score: 0, rows: 0, pattern: [], name: "" });
  for (const bad of [
    "", "result", "#result", "s=0&t=10&r=1&p=0000", "s=1000000000&t=10&r=1&p=0000", "s=12&t=10&p=0000", "s=12&t=10&r=1",
    "s=12&t=15&r=1&p=0000", "s=12&t=10&r=1&p=00000", "s=12&t=10&r=1&p=ZZZZ", "s=12&t=10&r=1&p=FFFF", "s=12&t=10&r=1.0&p=0000",
    "s=12&t=10&r=-1&p=0000", `s=12&t=10&r=${MAX_ROWS + 1}&p=0000`, `s=12&t=${MAX_SCORE + 5}&r=${MAX_ROWS}&p=${"0".repeat(56)}`,
    "s=12&t=10&r=+1&p=0000", "s=12&t=10&r= 1&p=0000", "s=12&t=10&r=1&p=0000&n=" + "ক".repeat(700),
  ]) assert.equal(share.normalize(bad), null, bad);
  const odd = parseShared("s=12&t=10&r=1&p=0000&n=" + encodeURIComponent("  রিমা‮\u0000 আক্তার আক্তার আক্তার  "));
  assert.equal(odd?.name, "রিমা আক্তার আক্তার আ");
  assert.equal(parseShared(`s=1&t=174975&r=${MAX_ROWS}&p=${"0".repeat(56)}`)?.rows, MAX_ROWS);
});

test("previews and captions are personal and honest", () => {
  const shared = { seed: 48213, score: 215, rows: 18, pattern: Array(14).fill(0), name: "রাফি" };
  assert.equal(previewTitle(shared), "রাফি ১৮ সারি বুনে ২১৫ করেছে। তুমি পারবে?");
  assert.equal(previewTitle({ ...shared, name: "" }), "পাটি বুনিতে ১৮ সারি, ২১৫ পয়েন্ট! তুমি পারবে?");
  assert.equal(banner(shared), "রাফি ১৮ সারি বুনে ২১৫ করেছে। একই বেতের গোছা, এবার তোমার পালা।");
  assert.match(caption(shared), /১৮ সারি/);
  assert.equal(share.preview(sharedHash(shared)).title, previewTitle(shared));
  assert.ok(share.preview("junk").title.length > 0);
  assert.equal(share.tally, undefined);
});

test("content meets the SEO limits and never names a trademark", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 5);
  assert.ok(site.steps.length >= 3);
  assert.match(site.privacy.join(" "), /নাম/);
  assert.match(site.privacy.join(" "), /নম্বর/);
  const everything = JSON.stringify(site) + share.preview("").description;
  assert.doesNotMatch(everything, /tetris|টেট্রিস|tetromino|টেট্রোমিনো|-?tris\b|ট্রিস|korobeiniki|কোরোবেইনিকি/i);
  assert.doesNotMatch(everything, /আপনি|করুন/);
});
