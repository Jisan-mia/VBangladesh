import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, pick } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import {
  botMove, canUndo, closes, createGame, hintGap, isSafe, midpoint, nearestGap, play, recent, replay, undo,
  BOX_COUNT, BOX_EDGES, EDGE_COUNT, EDGES, ROW_SPAN, type Game, type Level,
} from "../lib/game";
import { caption, cardNames, compareLine, decodeMoves, encodeMoves, feat, humanLine, initials, parseShared, playNames, previewTitle, scoreLine, sharedHash, type Shared } from "../lib/link";

const free = (game: Game) => game.drawn.flatMap((done, edge) => done ? [] : [edge]);

/** A person who mostly knows the rules: takes a box most of the time, avoids third sides when they can. Seeded, so runs repeat. */
function person(game: Game, rng: () => number) {
  const open = free(game), takes = open.filter(edge => closes(game.drawn, edge)), safe = open.filter(edge => isSafe(game.drawn, edge));
  if (takes.length && rng() < 0.8) return takes[pick(rng, takes.length)];
  if (safe.length && rng() < 0.9) return safe[pick(rng, safe.length)];
  return open[pick(rng, open.length)];
}

function playOut(seed: number, level: Level) {
  const rng = makeRng(seed * 31 + 7);
  let game = createGame(seed, level);
  for (let guard = 0; !game.over && guard < 100; guard++) {
    const edge = level && game.turn === 1 ? botMove(game, level) : person(game, rng);
    game = play(game, edge)!;
  }
  return game;
}

/** Boxes the next player could take in a row from here, the greedy way. */
function gift(game: Game) {
  let taken = 0;
  for (let edge = free(game).find(e => closes(game.drawn, e)); edge !== undefined; edge = free(game).find(e => closes(game.drawn, e))) {
    taken += closes(game.drawn, edge);
    game = play(game, edge)!;
  }
  return taken;
}

test("the board: 40 gaps, 16 boxes of four sides, and the reading order the keyboard walks", () => {
  assert.equal(EDGES.length, EDGE_COUNT);
  assert.equal(EDGE_COUNT, 40);
  for (const sides of BOX_EDGES) assert.equal(sides.length, 4);
  for (const edge of EDGES) assert.ok(edge.boxes.length === 1 || edge.boxes.length === 2);
  assert.equal(EDGES.filter(edge => edge.boxes.length === 1).length, 16, "the outer rim");
  for (let id = 0; id + ROW_SPAN < EDGE_COUNT; id++) {
    assert.equal(EDGES[id + ROW_SPAN].horizontal, EDGES[id].horizontal);
    assert.equal(EDGES[id + ROW_SPAN].col, EDGES[id].col);
    assert.equal(EDGES[id + ROW_SPAN].row, EDGES[id].row + 1);
  }
});

test("the same seed gives the same cloth, the same bot and the same game", () => {
  assert.deepEqual(createGame(48213, 2).opening, createGame(48213, 2).opening);
  const openings = new Set(Array.from({ length: 40 }, (_, i) => createGame(1000 + i, 1).opening.join()));
  assert.ok(openings.size > 30, "different seeds open differently");
  for (let seed = 1; seed < 300; seed++) {
    const [a, b] = createGame(seed, 0).opening;
    assert.notEqual(a, b);
    assert.ok(!EDGES[a].boxes.some(box => EDGES[b].boxes.includes(box)), "the two opening stitches never share a box");
  }
  const one = playOut(48213, 2), two = playOut(48213, 2);
  assert.deepEqual(one.moves, two.moves);
  assert.deepEqual(one.owner, two.owner);
  assert.deepEqual(replay(48213, 2, one.moves)?.score, one.score);
});

test("closing a box scores it and keeps the turn; anything illegal is refused", () => {
  const start = { ...createGame(5, 0), drawn: Array<boolean>(EDGE_COUNT).fill(false) };
  let game = start;
  for (const edge of [0, 4]) { game = play(game, edge)!; }
  assert.equal(game.turn, 0, "two plain stitches pass the turn twice");
  game = play(game, 9)!;
  assert.equal(game.turn, 1);
  assert.equal(closes(game.drawn, 5), 1);
  game = play(game, 5)!;
  assert.deepEqual(game.score, [0, 1]);
  assert.equal(game.owner[0], 1);
  assert.equal(game.turn, 1, "the closer moves again");
  assert.equal(game.lastClosed, 1);
  assert.equal(play(game, 5), null, "already stitched");
  for (const bad of [-1, 40, 2.5, Number.NaN]) assert.equal(play(game, bad), null);

  // One stitch between two three-sided boxes closes both.
  let pair = start;
  for (const edge of [0, 4, 9, 1, 6, 10]) pair = play(pair, edge)!;
  assert.equal(closes(pair.drawn, 5), 2);
  const both = play(pair, 5)!;
  assert.equal(both.lastClosed, 2);
  assert.equal(both.score[pair.turn], 2);

  const over = playOut(77, 0);
  assert.ok(over.over);
  assert.equal(play(over, 0), null, "nothing after the last box");
});

test("সহজ takes a box when it can and otherwise never hands one over while a safe stitch exists", () => {
  for (let seed = 1; seed <= 60; seed++) {
    const rng = makeRng(seed);
    let game = createGame(seed, 1);
    while (!game.over) {
      if (game.turn === 1) {
        const edge = botMove(game, 1), open = free(game);
        if (open.some(e => closes(game.drawn, e))) assert.ok(closes(game.drawn, edge) > 0, "takes the box");
        else if (open.some(e => isSafe(game.drawn, e))) assert.ok(isSafe(game.drawn, edge), "a safe stitch");
        game = play(game, edge)!;
      } else game = play(game, person(game, rng))!;
    }
  }
});

test("কঠিন opens the smallest chain, and sometimes hands over two boxes to keep control", () => {
  let declined = 0;
  for (let seed = 1; seed <= 120; seed++) {
    const rng = makeRng(seed);
    let game = createGame(seed, 2);
    while (!game.over) {
      if (game.turn !== 1) { game = play(game, person(game, rng))!; continue; }
      const edge = botMove(game, 2), open = free(game);
      const takes = open.filter(e => closes(game.drawn, e)), safe = open.filter(e => isSafe(game.drawn, e));
      if (takes.length && !closes(game.drawn, edge)) {
        // A double-deal: only in the endgame, and the other player gets exactly two boxes with one stitch.
        declined++;
        assert.equal(safe.length, 0);
        const after = play(game, edge)!;
        assert.equal(after.turn, 0);
        assert.ok(free(after).some(e => closes(after.drawn, e) === 2));
      } else if (!takes.length && !safe.length) {
        const given = gift(play(game, edge)!);
        for (const other of open) assert.ok(given <= gift(play(game, other)!), `seed ${seed}: opened a bigger chain than needed`);
      }
      game = play(game, edge)!;
    }
  }
  assert.ok(declined > 0, "the double-deal happens in real games");
});

test("কঠিন beats সহজ far more often than not", () => {
  let wins = 0;
  for (let seed = 1; seed <= 150; seed++) {
    let game = createGame(seed, 1);
    while (!game.over) game = play(game, botMove(game, game.turn === 0 ? 2 : 1))!;
    if (game.score[0] > game.score[1]) wins++;
  }
  assert.ok(wins > 110, String(wins));
});

test("a headless run against each bot ends sanely, every time", () => {
  const results = { 1: [0, 0], 2: [0, 0] } as Record<1 | 2, [number, number]>;
  for (const level of [0, 1, 2] as const) {
    for (let seed = 1; seed <= 150; seed++) {
      const game = playOut(seed * 97, level);
      assert.ok(game.over);
      assert.equal(game.moves.length, EDGE_COUNT - 2);
      assert.ok(game.drawn.every(Boolean));
      assert.equal(game.score[0] + game.score[1], BOX_COUNT);
      assert.ok(game.owner.every(who => who === 0 || who === 1));
      assert.deepEqual(replay(game.seed, level, game.moves)?.score, game.score, "the replay check accepts a real game");
      if (level) results[level][game.score[0] > game.score[1] ? 0 : 1]++;
    }
  }
  assert.ok(results[1][0] > 0 && results[1][1] > 0, "against সহজ, sometimes the person wins and sometimes the bot");
  assert.ok(results[2][1] > results[1][1], "কঠিন wins more often than সহজ");
});

test("undo takes back the person's stitch and the bot's replies; two people undo one stitch", () => {
  const start = createGame(321, 2);
  assert.equal(canUndo(start), false);
  const mine = play(start, hintGap(start))!;
  const answered = play(mine, botMove(mine, 2))!;
  assert.deepEqual(undo(answered).moves, []);
  assert.deepEqual(undo(mine).moves, [], "undo while the bot is still thinking");
  const pair = createGame(9, 0), first = play(pair, hintGap(pair))!, second = play(first, hintGap(first))!;
  assert.deepEqual(undo(second).moves, first.moves);
  assert.equal(undo(second).turn, first.turn);
  assert.equal(canUndo(playOut(5, 1)), false, "a finished game stays finished");
  assert.deepEqual(recent(answered), answered.moves.slice(1));
});

test("a tap snaps to the nearest open gap, but never jumps off a finished stitch", () => {
  const game = { ...createGame(2, 0), drawn: Array<boolean>(EDGE_COUNT).fill(false) };
  for (let edge = 0; edge < EDGE_COUNT; edge++) {
    const [x, y] = midpoint(edge);
    assert.equal(nearestGap(x, y, game.drawn), edge);
    assert.equal(nearestGap(x + 18, y - 18, game.drawn), edge, "a sloppy tap still finds it");
  }
  assert.equal(nearestGap(100, 4, game.drawn), 0, "the margin reaches the outer gaps");
  const stitched = game.drawn.slice(); stitched[0] = true;
  assert.equal(nearestGap(100, 50, stitched), -1);
  assert.equal(nearestGap(-200, -200, game.drawn), -1);
  assert.ok(isSafe(createGame(4, 1).drawn, hintGap(createGame(4, 1))));
});

test("lines are kind and fit the score", () => {
  assert.equal(humanLine(2, [13, 3], ["রাফি", "বট"]), "বট প্রায় একটা ফুলও ফোটাতে পারেনি!");
  assert.equal(humanLine(2, [10, 6], ["রাফি", "বট"]), "সুঁই-সুতোয় হাত পাকা, বট হার মানল।");
  assert.equal(humanLine(1, [8, 8], ["রাফি", "বট"]), "আটে আট, কাঁথা আধাআধি!");
  assert.equal(humanLine(1, [7, 9], ["রাফি", "বট"]), "এক-দুই ঘরের জন্য বট এগিয়ে গেল!");
  assert.equal(humanLine(2, [3, 13], ["রাফি", "বট"]), "এবার বটের ফুলই বেশি ফুটল।");
  assert.equal(humanLine(0, [12, 4], ["রাফি", "মিম"]), "কাঁথা ভরা রাফির ফুলে!");
  assert.equal(humanLine(0, [5, 11], ["রাফি", "মিম"]), "কাঁথায় মিমের ফুলই বেশি।");
  assert.equal(humanLine(0, [9, 7], ["রাফি", "মিম"]), "শেষ ঘর পর্যন্ত লড়াই!");
  assert.equal(compareLine(12, 10, "রাফি"), "রাফির চেয়ে ২ ঘর বেশি!");
  assert.equal(compareLine(10, 10, "রাফি"), "একদম সমান! রাফিও ১০টা ঘর পেয়েছিল।");
  assert.equal(compareLine(8, 10, "রাফি"), "আর একটু হলেই! মাত্র ২ ঘর কম।");
  assert.equal(compareLine(4, 10, ""), "বন্ধু এখনো ৬ ঘর এগিয়ে। আরেকবার?");
  for (let mine = 0; mine <= 16; mine++) {
    const all = [0, 1, 2].map(level => humanLine(level as Level, [mine, 16 - mine], ["রাফি", "মিম"])).join() + compareLine(mine, 9, "রাফি");
    assert.doesNotMatch(all, /হেরে|খারাপ|ব্যর্থ|বাজি|টাকা/);
  }
  assert.equal(scoreLine(["রাফি", "মিম"], [11, 5]), "রাফি ১১ — মিম ৫");
  assert.deepEqual(playNames(1, ["", ""]), ["তুমি", "বট"]);
  assert.deepEqual(playNames(0, [" মিম ", ""]), ["মিম", "নীল সুতো"]);
  assert.deepEqual(cardNames(2, "", ""), ["আমি", "বট"]);
});

test("each flower carries a different initial", () => {
  assert.deepEqual(initials(["রাফি", "মিম"]), ["রা", "মি"]);
  assert.deepEqual(initials(["ক্ষমা", "বট"]), ["ক্ষ", "ব"]);
  assert.deepEqual(initials(["rafi", "mim"]), ["R", "M"]);
  assert.deepEqual(initials(["রাফি", "রাশেদ"]), ["১", "২"], "same letter: numbers instead");
  assert.deepEqual(initials(["", "বট"]), ["১", "২"]);
});

const finished = (seed: number, level: Level, name = "রাফি", other = ""): Shared => {
  const game = playOut(seed, level);
  return { seed, level, moves: game.moves, name, other, score: game.score, owner: game.owner };
};

test("a challenge link round-trips, and is re-checked move by move", () => {
  const shared = finished(48213, 2);
  const hash = sharedHash(shared);
  assert.match(hash, /^s=48213&t=\d+&l=2&m=[0-9a-zA-D]{38}&n=/);
  assert.deepEqual(parseShared("#" + hash), shared);
  assert.equal(share.normalize(hash), hash);
  assert.equal(share.normalize(hash + "&x=<script>"), hash, "unknown keys are dropped");
  assert.equal(share.normalize(hash + "&o=মিম"), hash, "no second name against a bot");
  const two = finished(9001, 0, "রাফি", "মিম");
  assert.equal(parseShared(sharedHash(two))?.other, "মিম");
  assert.deepEqual(decodeMoves(encodeMoves(shared.moves)), shared.moves);
});

test("forged, broken or hostile links are refused", () => {
  const shared = finished(777, 1);
  const hash = sharedHash(shared);
  const params = (change: Record<string, string>) => { const p = new URLSearchParams(hash); for (const [k, v] of Object.entries(change)) p.set(k, v); return p.toString(); };
  const moves = encodeMoves(shared.moves);
  const botAt = shared.moves.findIndex((_, i) => replay(777, 1, shared.moves.slice(0, i))?.turn === 1);
  const swapped = [...moves]; [swapped[botAt], swapped[botAt + 1]] = [swapped[botAt + 1], swapped[botAt]];
  const bad = [
    "", "result", "#result",
    params({ t: String(shared.score[0] + 1) }), params({ t: "17" }), params({ t: "-1" }),
    params({ l: "3" }), params({ l: "2" }), params({ l: "" }), params({ l: "01" }), params({ s: "0" }), params({ s: "1.5" }),
    params({ m: moves.slice(0, -1) }), params({ m: moves + "0" }), params({ m: moves.slice(0, -1) + moves[0] }),
    params({ m: moves.replace(/./, "Z") }), params({ m: swapped.join("") }), params({ m: "<script>" }),
    params({ n: "ক".repeat(700) }),
  ];
  for (const state of bad) assert.equal(share.normalize(state), null, state);
  const odd = parseShared(params({ n: "  রিমা‮\u0000 আক্তার আক্তার আক্তার  " }));
  assert.equal(odd?.name, "রিমা আক্তার আক্তার আ");
});

test("previews and captions are personal and honest", () => {
  const win: Shared = { ...finished(1, 2), score: [10, 6] };
  assert.equal(feat(win), "রাফি কঠিন বটকে ১০–৬ ঘরে হারিয়েছে");
  assert.equal(previewTitle(win), "রাফি কঠিন বটকে ১০–৬ ঘরে হারিয়েছে। তুমি পারবে?");
  assert.equal(previewTitle({ ...win, name: "", score: [6, 10] }), "এক বন্ধু কঠিন বটের সাথে ৬টা ঘর পেয়েছে। তুমি পারবে?");
  assert.equal(previewTitle({ ...win, level: 0, other: "মিম", score: [11, 5] }), "রাফি আর মিমের ছক-জোড়া: ১১–৫। তোমরাও খেলো!");
  assert.match(caption(win), /১০–৬/);
  assert.match(caption({ ...win, level: 0, other: "মিম", score: [11, 5] }), /রাফি ১১ — মিম ৫/);
  const real = finished(48213, 2);
  assert.equal(share.preview(sharedHash(real)).title, previewTitle(real));
  assert.equal(share.preview("junk").title, "ছক-জোড়া: কাঁথায় ফোঁড় দাও, ঘর জিতে ফুল ফোটাও");
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
  assert.doesNotMatch(everything, /বাজি|টাকা জিত|লটারি/);
});
