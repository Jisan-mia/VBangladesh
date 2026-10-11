import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, pick } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import {
  botMove, canUndo, createGame, findMove, hasDiagonals, humanSide, isBotTurn, legalMoves, movesFor, play, point, pointAt, replay, spot, threatened, undo,
  BOARD, GOAT, GOATS, LINES, MAX_MOVES, POINTS, START_PILES, START_TIGERS, STEP, TIGER, TIGER_GOAL, type Game, type Mode,
} from "../lib/game";
import { caption, cardNames, compareLine, decodeMoves, detail, encodeMoves, feat, headline, humanLine, parseShared, playNames, previewTitle, sharedHash, type Shared } from "../lib/link";

/** A position built by hand: goats as {point: count}, two tigers, whose turn. */
function position(goats: Record<number, number>, tigers: [number, number], turn = TIGER, taken = 0): Game {
  const board = Array<number>(POINTS).fill(0);
  for (const [at, count] of Object.entries(goats)) board[Number(at)] = count;
  return { ...createGame(1, 0), goats: board, tigers, turn, taken };
}
const go = (game: Game, from: number, to: number) => { const index = findMove(game, from, to); assert.ok(index >= 0, `${from}→${to} should be legal`); return play(game, index)!; };
const goatsLeft = (game: Game) => game.goats.reduce((sum, count) => sum + count, 0);

/** Someone who mostly knows the rules: as the tiger takes a goat most of the time, as the goats mostly avoids leaving one open. Seeded. */
function person(game: Game, rng: () => number) {
  const list = legalMoves(game);
  if (game.turn === TIGER) {
    const takes = list.flatMap((move, index) => move.over >= 0 ? [index] : []);
    return takes.length && rng() < 0.85 ? takes[pick(rng, takes.length)] : pick(rng, list.length);
  }
  const safe = list.flatMap((move, index) => { const goats = game.goats.slice(); goats[move.from]--; goats[move.to] = 1; return threatened(goats, game.tigers).length ? [] : [index]; });
  return safe.length && rng() < 0.9 ? safe[pick(rng, safe.length)] : pick(rng, list.length);
}

function playOut(seed: number, mode: Mode) {
  const rng = makeRng(seed * 31 + 7);
  let game = createGame(seed, mode);
  for (let guard = 0; !game.over && guard < 200; guard++) game = play(game, isBotTurn(game) ? botMove(game) : person(game, rng))!;
  return game;
}

test("the board: 25 points, the alquerque lines, diagonals only through every other point", () => {
  assert.equal(LINES.length, 56, "40 straight segments and 16 diagonals");
  for (let at = 0; at < POINTS; at++) {
    const neighbours = STEP[at].filter(next => next >= 0);
    assert.ok(neighbours.length >= 3);
    for (const next of neighbours) assert.ok(STEP[next].includes(at), "lines go both ways");
    if (!hasDiagonals(at)) assert.deepEqual([1, 3, 5, 7].map(d => STEP[at][d]), [-1, -1, -1, -1]);
  }
  assert.equal(STEP[point(2, 2)].filter(next => next >= 0).length, 8, "the middle meets eight lines");
  assert.equal(STEP[point(0, 0)].filter(next => next >= 0).length, 3);
});

test("the opening: four piles of five, tigers on the middle line, goats first, nothing to jump yet", () => {
  const game = createGame(42, 2);
  assert.deepEqual(START_PILES, [1, 3, 11, 13]);
  assert.deepEqual(game.tigers, START_TIGERS);
  assert.deepEqual(START_TIGERS, [point(2, 1), point(2, 3)]);
  for (const at of START_PILES) assert.equal(game.goats[at], 5);
  assert.equal(goatsLeft(game), GOATS);
  assert.equal(game.turn, GOAT);
  assert.ok(legalMoves(game).every(move => START_PILES.includes(move.from) && move.over < 0));
  assert.deepEqual(threatened(game.goats, game.tigers), [], "no pile can be jumped before the goats move");
});

test("goats step off the top of a pile, one point along a line, never onto a goat or a tiger", () => {
  let game = createGame(1, 0);
  game = go(game, 11, 12);
  assert.equal(game.goats[11], 4);
  assert.equal(game.goats[12], 1);
  assert.equal(game.turn, TIGER);
  const goats = position({ 6: 1, 7: 3, 8: 1 }, [12, 24], GOAT);
  const from6 = legalMoves(goats).filter(move => move.from === 6).map(move => move.to).sort((a, b) => a - b);
  assert.deepEqual(from6, [0, 1, 2, 5, 10, 11], "not onto the pile at 7 or the tiger at 12");
  assert.equal(findMove(goats, 7, 13), -1, "7 has no diagonals");
  assert.ok(findMove(goats, 6, 0) >= 0, "6 does");
  assert.equal(findMove(goats, 6, 18), -1, "one point only");
});

test("a tiger leaps one goat into the empty point beyond; a pile loses only its top goat", () => {
  const start = position({ 7: 1, 13: 3 }, [12, 24]);
  const list = legalMoves(start);
  assert.deepEqual(list.filter(move => move.over >= 0).map(move => [move.from, move.over, move.to]), [[12, 7, 2], [12, 13, 14]]);
  const single = go(start, 12, 2);
  assert.equal(single.goats[7], 0);
  assert.equal(single.taken, 1);
  assert.equal(single.turn, GOAT, "one jump a turn");
  const pile = go(start, 12, 14);
  assert.equal(pile.goats[13], 2);
  assert.equal(pile.taken, 1);
  assert.ok(findMove(start, 12, 11) >= 0, "taking isn't compulsory: a plain step is legal too");

  assert.equal(findMove(position({ 7: 1, 2: 1 }, [12, 24]), 12, 2), -1, "landing point taken");
  assert.equal(findMove(position({ 2: 1 }, [7, 24]), 7, -3), -1);
  assert.deepEqual(legalMoves(position({ 2: 1 }, [7, 24])).filter(move => move.over >= 0), [], "no leap off the board");
  assert.deepEqual(legalMoves(position({}, [12, 13])).filter(move => move.over >= 0), [], "a tiger never jumps a tiger");
  assert.equal(findMove(position({ 8: 1 }, [7, 24]), 7, 9) >= 0, true, "straight along the row");
  assert.equal(findMove(position({ 13: 1 }, [7, 24]), 7, 19), -1, "7 has no diagonal to leap along");
  assert.ok(findMove(position({ 18: 1 }, [12, 0]), 12, 24) >= 0, "the middle leaps along a diagonal");
  for (const bad of [-1, 99, 1.5, Number.NaN]) assert.equal(play(start, bad), null);
});

test("endings: both tigers pinned, the eighth goat taken, or the goats hold out to the last move", () => {
  // One tiger in the corner at 0 behind 1, 5, 6 (backed by 2, 10, 12); the other at 4 behind 3, 8, 9, with only 14 still open behind 9.
  const nearly = position({ 1: 1, 2: 1, 3: 1, 5: 1, 6: 1, 8: 1, 9: 1, 10: 1, 12: 1, 19: 1 }, [0, 4], GOAT);
  assert.deepEqual(movesFor(nearly.goats, nearly.tigers, TIGER).map(move => [move.from, move.over, move.to]), [[4, 9, 14]], "one way out is still open");
  const pinned = go(nearly, 19, 14);
  assert.equal(pinned.over, true);
  assert.equal(pinned.winner, GOAT);
  assert.equal(pinned.ending, "trap");
  assert.equal(play(pinned, 0), null, "nothing after the end");

  const hunt = go(position({ 7: 1 }, [12, 24], TIGER, TIGER_GOAL - 1), 12, 2);
  assert.equal(hunt.winner, TIGER);
  assert.equal(hunt.ending, "hunt");

  let long = createGame(5, 0);
  while (long.moves.length < MAX_MOVES - 1) long = play(long, legalMoves(long).findIndex(move => move.over < 0))!;
  assert.equal(long.over, false);
  long = play(long, legalMoves(long).findIndex(move => move.over < 0))!;
  assert.equal(long.over, true, "the move cap ends every game");
  assert.equal(long.ending, "hold");
  assert.equal(long.winner, GOAT);
});

test("the goats can never be boxed in: removing any two points leaves the board connected", () => {
  for (let a = 0; a < POINTS; a++) for (let b = a + 1; b < POINTS; b++) {
    const seen = new Set([a, b]);
    const start = [0, 1, 2].find(at => !seen.has(at))!;
    const queue = [start];
    seen.add(start);
    while (queue.length) for (const next of STEP[queue.pop()!]) if (next >= 0 && !seen.has(next)) { seen.add(next); queue.push(next); }
    assert.equal(seen.size, POINTS, `${a} and ${b}`);
  }
});

test("the same seed gives the same bot and the same game; the bot never reads the clock", () => {
  const one = playOut(48213, 2), two = playOut(48213, 2);
  assert.deepEqual(one.moves, two.moves);
  assert.deepEqual(replay(48213, 2, one.moves)?.goats, one.goats);
  const replies = new Set(Array.from({ length: 30 }, (_, i) => { const game = go(createGame(1000 + i, 2), 11, 12); return botMove(game); }));
  assert.ok(replies.size > 1, "different seeds answer differently");
});

test("bot tigers always take a goat when they can; bot goats never leave one open while a safe move exists", () => {
  let tigerChances = 0;
  for (let seed = 1; seed <= 40; seed++) {
    for (const mode of [1, 2] as const) {
      const rng = makeRng(seed);
      let game = createGame(seed, mode);
      while (!game.over) {
        const list = legalMoves(game);
        if (!isBotTurn(game)) { game = play(game, person(game, rng))!; continue; }
        const index = botMove(game);
        if (game.turn === TIGER && list.some(move => move.over >= 0)) { tigerChances++; assert.ok(list[index].over >= 0, "takes the goat"); }
        if (game.turn === GOAT) {
          const open = (i: number) => { const goats = game.goats.slice(); goats[list[i].from]--; goats[list[i].to] = 1; return threatened(goats, game.tigers).length > 0; };
          const safe = list.some((_, i) => !open(i));
          if (safe) assert.ok(!open(index), `seed ${seed}: a free jump`);
        }
        game = play(game, index)!;
      }
    }
  }
  assert.ok(tigerChances > 20);
});

test("headless runs end sanely: under the cap, goats accounted for, the replay accepts them, and both sides win sometimes", () => {
  const wins: Record<string, number> = {};
  let maxMoves = 0;
  for (const mode of [0, 1, 2] as const) {
    for (let seed = 1; seed <= 60; seed++) {
      const game = playOut(seed * 97, mode);
      assert.ok(game.over);
      assert.ok(game.moves.length <= MAX_MOVES);
      assert.ok(game.taken <= TIGER_GOAL);
      assert.equal(goatsLeft(game) + game.taken, GOATS);
      assert.equal(new Set(game.tigers).size, 2);
      assert.ok(game.tigers.every(at => game.goats[at] === 0));
      assert.deepEqual(replay(game.seed, mode, game.moves)?.goats, game.goats);
      for (const index of game.moves) maxMoves = Math.max(maxMoves, index);
      const key = `${mode}:${game.winner}`;
      wins[key] = (wins[key] ?? 0) + 1;
    }
  }
  assert.ok(maxMoves < 64, "every move fits one link character");
  assert.ok(wins["1:0"] && wins["1:1"], `against bot goats, the tiger sometimes wins: ${JSON.stringify(wins)}`);
  assert.ok(wins["2:1"], "bot tigers win against careless goats");
  // Bot against bot, the two sides come out roughly even.
  let goatWins = 0;
  for (let seed = 1; seed <= 60; seed++) {
    let game = createGame(seed, 0);
    while (!game.over) game = play(game, botMove(game))!;
    if (game.winner === GOAT) goatWins++;
  }
  assert.ok(goatWins > 15 && goatWins < 45, String(goatWins));
});

test("undo takes back the person's move and the bot's reply; two people undo one move", () => {
  const goats = createGame(321, 2);
  assert.equal(canUndo(goats), false);
  const mine = go(goats, 11, 12), answered = play(mine, botMove(mine))!;
  assert.deepEqual(undo(answered).moves, []);
  assert.deepEqual(undo(mine).moves, [], "undo while the bot is thinking");
  const tiger = createGame(9, 1), opened = play(tiger, botMove(tiger))!;
  assert.equal(canUndo(opened), false, "the tiger hasn't moved yet");
  const step = play(opened, 0)!, reply = play(step, botMove(step))!;
  assert.ok(canUndo(step));
  assert.deepEqual(undo(reply).moves, opened.moves, "back to the tiger's turn, the bot's opening kept");
  const pair = go(createGame(9, 0), 1, 0);
  assert.deepEqual(undo(pair).moves, []);
  assert.equal(canUndo(playOut(5, 2)), false, "a finished game stays finished");
});

test("a tap anywhere in a point's square picks that point", () => {
  for (let at = 0; at < POINTS; at++) {
    const [x, y] = spot(at);
    assert.equal(pointAt(x, y), at);
    assert.equal(pointAt(x + 45, y - 45), at);
  }
  assert.equal(pointAt(-1, 50), -1);
  assert.equal(pointAt(50, BOARD + 1), -1);
  assert.ok(288 / 5 >= 56, "points stay 56px apart on a 320px phone (288px board)");
});

test("lines are kind and fit the result", () => {
  const trap = { ...position({}, [0, 4]), over: true, winner: GOAT, ending: "trap", moves: Array(34).fill(0), taken: 7 } as Game;
  assert.equal(headline(trap), "ছাগল জিতল ৩৪ চালে");
  assert.equal(detail(trap), "৭টা ছাগল গেছে · বাঘ বন্দি");
  assert.equal(humanLine(trap), "বাঘ আজ বন্দি!");
  assert.equal(humanLine({ ...trap, taken: 0 }), "একটা ছাগলও না খুইয়ে বাঘ বন্দি!");
  assert.equal(detail({ ...trap, taken: 0 }), "একটা ছাগলও যায়নি · বাঘ বন্দি");
  const hold = { ...trap, ending: "hold", moves: Array(MAX_MOVES).fill(0), taken: 2 } as Game;
  assert.equal(humanLine(hold), "উঠোন ভরা ছাগল, বাঘের পেট খালি!");
  assert.equal(detail(hold), "২টা ছাগল গেছে · ১২০ চাল টিকে গেছে");
  const hunt = { ...trap, winner: TIGER, ending: "hunt", taken: 8, moves: Array(30).fill(0) } as Game;
  assert.equal(headline(hunt), "বাঘ জিতল ৩০ চালে");
  assert.equal(humanLine(hunt), "বাঘ আজ এক দৌড়েই ভরপেট!");
  for (const game of [trap, hold, hunt, { ...hunt, moves: Array(90).fill(0) }]) {
    const lines = [humanLine(game), detail(game), headline(game)].join();
    assert.doesNotMatch(lines, /হেরে|খারাপ|ব্যর্থ|বাজি|টাকা/);
  }
  assert.deepEqual(playNames(1, ["", ""]), ["বট", "তুমি"]);
  assert.deepEqual(playNames(2, [" রাফি ", ""]), ["রাফি", "বট"]);
  assert.deepEqual(playNames(0, ["", ""]), ["", ""]);
  assert.deepEqual(cardNames(2, "", ""), ["আমি", "বট"]);
  assert.equal(humanSide(0), null);
});

const finished = (seed: number, mode: Mode, name = "রাফি", other = ""): Shared => ({ mode, name, other, game: playOut(seed, mode) });

test("comparing with a friend is kind, and fair only on the same side", () => {
  const friendTiger = finished(11, 1);
  for (let seed = 500; seed < 540; seed++) {
    const mine = playOut(seed, 1);
    const line = compareLine(mine, friendTiger);
    assert.ok(line.length > 5);
    assert.doesNotMatch(line, /হেরে|খারাপ|ব্যর্থ/);
  }
  const won = { ...friendTiger.game, winner: TIGER, taken: 8, moves: Array(40).fill(0) } as Game;
  const lost = { ...won, winner: GOAT, ending: "hold", taken: 5 } as Game;
  assert.equal(compareLine({ ...won, moves: Array(30).fill(0) }, { ...friendTiger, game: won }), "রাফির চেয়ে ১০ চাল কম লাগল!");
  assert.equal(compareLine(won, { ...friendTiger, game: won }), "একদম রাফির সমান, ৪০ চালে!");
  assert.equal(compareLine(won, { ...friendTiger, game: lost }), "রাফি যেটা পারেনি, তুমি পেরেছ!");
  assert.equal(compareLine(lost, { ...friendTiger, game: won }), "রাফি পেরেছিল। আর একটু হলেই! আরেকবার?");
  assert.equal(compareLine({ ...lost, taken: 7 }, { ...friendTiger, game: lost }), "রাফির চেয়ে ২টা ছাগল বেশি ধরেছ!");
  assert.equal(compareLine(won, { ...friendTiger, mode: 2, name: "" }), "জিতে গেছ! কার্ডটা বন্ধুকে পাঠাও।");
  assert.equal(compareLine(lost, { ...friendTiger, mode: 2 }), "রাফি ছিল ছাগল। তুমিও একবার ছাগল হয়ে দেখো!");
  assert.equal(compareLine(lost, { ...friendTiger, mode: 0 }), "আরেকবার খেলে দেখো!");
});

test("a challenge link round-trips, and is re-checked move by move", () => {
  const shared = finished(48213, 2);
  const hash = sharedHash(shared);
  assert.match(hash, /^s=48213&t=\d&p=2&m=[A-Za-z0-9_-]+&n=/);
  const back = parseShared("#" + hash)!;
  assert.deepEqual(back.game.moves, shared.game.moves);
  assert.equal(back.name, "রাফি");
  assert.equal(share.normalize(hash), hash);
  assert.equal(share.normalize(hash + "&x=<script>"), hash, "unknown keys are dropped");
  assert.equal(share.normalize(hash + "&o=মিম"), hash, "no second name against a bot");
  const two = finished(9001, 0, "রাফি", "মিম");
  assert.equal(parseShared(sharedHash(two))?.other, "মিম");
  assert.deepEqual(decodeMoves(encodeMoves(shared.game.moves)), shared.game.moves);
  // The longest possible game, two long names, still fits the 600-character limit.
  const longest = { mode: 0 as Mode, name: "ক্ষ".repeat(10), other: "ঞ্জ".repeat(10), game: { ...two.game, moves: Array(MAX_MOVES).fill(63) } };
  assert.ok(sharedHash(longest).length <= 600, String(sharedHash(longest).length));
});

test("forged, broken or hostile links are refused", () => {
  const shared = finished(777, 2);
  const hash = sharedHash(shared);
  const params = (change: Record<string, string>) => { const p = new URLSearchParams(hash); for (const [k, v] of Object.entries(change)) p.set(k, v); return p.toString(); };
  const moves = encodeMoves(shared.game.moves);
  // Change one bot move (an odd index: the bot plays the tigers) to another legal move: the replay notices it isn't the bot's.
  let game = createGame(777, 2);
  let forged = "";
  for (let i = 0; i < shared.game.moves.length; i++) {
    const index = shared.game.moves[i];
    if (i % 2 === 1 && !forged && legalMoves(game).length > 1) forged = moves.slice(0, i) + encodeMoves([index === 0 ? 1 : 0]) + moves.slice(i + 1);
    game = play(game, index)!;
  }
  const bad = [
    "", "result", "#result",
    params({ t: String(shared.game.taken + 1) }), params({ t: "9" }), params({ t: "-1" }),
    params({ p: "3" }), params({ p: "1" }), params({ p: "" }), params({ p: "01" }), params({ s: "0" }), params({ s: "1.5" }),
    params({ m: moves.slice(0, -1) }), params({ m: moves + "A" }), params({ m: forged }), params({ m: "<script>" }), params({ m: "" }),
    params({ m: "_".repeat(10) }), params({ n: "ক".repeat(700) }),
  ];
  for (const state of bad) assert.equal(share.normalize(state), null, state);
  const odd = parseShared(params({ n: "  রিমা‮\u0000 আক্তার আক্তার আক্তার  " }));
  assert.equal(odd?.name, "রিমা আক্তার আক্তার আ");
});

test("previews and captions are personal and honest", () => {
  const base = finished(1, 2);
  const trapped: Shared = { ...base, game: { ...base.game, winner: GOAT, ending: "trap", moves: Array(34).fill(0), taken: 7 } };
  assert.equal(feat(trapped), "রাফি ছাগল হয়ে বাঘকে ৩৪ চালে আটকেছে");
  assert.equal(previewTitle(trapped), "রাফি ছাগল হয়ে বাঘকে ৩৪ চালে আটকেছে। তুমি পারবে?");
  assert.equal(previewTitle({ ...trapped, name: "", game: { ...trapped.game, winner: TIGER, ending: "hunt", taken: 8 } }), "এক বন্ধু ছাগল হয়ে খেলেছে, বাঘ ৮টা ধরেছে। তুমি পারবে?");
  assert.equal(feat({ ...trapped, mode: 1, game: { ...trapped.game, winner: GOAT, ending: "hold", taken: 5 } }), "রাফি বাঘ হয়ে ৫টা ছাগল ধরেছে");
  assert.equal(previewTitle({ ...trapped, mode: 0, other: "মিম" }), "রাফি আর মিমের বাঘবন্দি: ছাগল জিতল ৩৪ চালে। তোমরাও খেলো!");
  assert.match(caption(trapped), /৩৪ চালে আটকালাম/);
  assert.match(caption({ ...trapped, mode: 0, other: "মিম" }), /রাফি ছাগল, মিম বাঘ/);
  const real = finished(48213, 2);
  assert.equal(share.preview(sharedHash(real)).title, previewTitle(real));
  assert.equal(share.preview("junk").title, "বাঘবন্দি: উঠোনের বাঘ-ছাগল খেলা, এবার ফোনে");
  assert.equal(share.tally, undefined);
});

test("content meets the SEO limits, speaks তুমি, and names its rules", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.notEqual(site.headline, site.title);
  assert.ok(site.faq.length >= 5);
  assert.ok(site.steps.length >= 3);
  assert.equal(site.guideTitle, "আমাদের নিয়ম");
  assert.match(site.steps.join(" "), /৮টা/);
  assert.match(site.steps.join(" "), /১২০ চাল/);
  assert.match(site.privacy.join(" "), /স্কোর/);
  assert.match(site.privacy.join(" "), /নাম/);
  const everything = JSON.stringify(site) + share.preview("").description;
  assert.doesNotMatch(everything, /আপনি|করুন|দেখুন/);
  assert.doesNotMatch(everything, /বাজি|টাকা জিত|লটারি|হারাম/);
});
