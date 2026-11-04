import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, pick } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import * as Old from "./legacy";
import {
  begin, boxesOf, botMove, canUndo, closes, edgesOf, geometry, gifts, giveaway, hintGap, isSafe, leastGift, legacySetup, needsSecondTap, play,
  quiltStats, recent, replay, takenAfter, totalPoints, undo, type Game, type Setup,
} from "../lib/quilt";
import { nearestGap, stepCursor } from "../lib/hit.hot";
import { caption, cardNames, compareLine, decodeMoves, encodeMoves, feat, humanLine, initials, parseShared, playNames, previewTitle, scoreLine, sharedHash, type Shared } from "../lib/challenge";
import { levelOf, pairSetup } from "../lib/levels";
import { casual, playOut } from "./bot";

const free = (game: Game) => game.drawn.flatMap((done, edge) => done ? [] : [edge]);

test("the cloth: any size, edges in the old reading order, four sides a box, the rim on one box", () => {
  for (const [cols, rows] of [[2, 2], [3, 2], [3, 3], [4, 4], [5, 5]]) {
    const g = geometry(cols, rows);
    assert.equal(g.edges, rows * (2 * cols + 1) + cols);
    assert.equal(g.boxes, cols * rows);
    for (let box = 0; box < g.boxes; box++) {
      const sides = edgesOf(g, box);
      assert.deepEqual([...sides].sort((a, b) => a - b), sides, "ascending, as the old BOX_EDGES listed them");
      for (const edge of sides) assert.ok(boxesOf(g, edge).includes(box));
    }
    assert.equal(Array.from({ length: g.edges }, (_, e) => boxesOf(g, e).length).filter(n => n === 1).length, 2 * (cols + rows), "the rim");
  }
  const four = geometry(4, 4);
  assert.equal(four.edges, Old.EDGE_COUNT);
  for (let edge = 0; edge < four.edges; edge++) {
    assert.deepEqual(boxesOf(four, edge), Old.EDGES[edge].boxes);
    assert.deepEqual([four.midX[edge], four.midY[edge]], Old.midpoint(edge));
  }
});

test("the old game, stitch for stitch: same openings, same bots, same scores over 900 games (links replay unchanged)", () => {
  for (const level of [0, 1, 2] as const) {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = makeRng(seed * 7);
      let old = Old.createGame(seed * 13, level), now = begin(seed * 13, legacySetup(level));
      assert.deepEqual(now.opening, old.opening);
      while (!old.over) {
        let edge: number;
        if (level && old.turn === 1) { edge = Old.botMove(old, level); assert.equal(botMove(now), edge, `level ${level} seed ${seed}`); }
        else { const open = free(now), takes = open.filter(e => closes(now.geo, now.drawn, e)); edge = takes.length && rng() < 0.7 ? takes[0] : open[pick(rng, open.length)]; }
        old = Old.play(old, edge)!; now = play(now, edge)!;
        assert.deepEqual(now.score, old.score);
        assert.equal(now.turn, old.turn);
      }
      assert.ok(now.over);
    }
  }
});

test("closing a box scores it and keeps the turn; a জরির ঘর is two flowers; anything illegal is refused", () => {
  const empty: Setup = { cols: 4, rows: 4, opening: [], bot: null };
  let game = begin(5, empty);
  for (const edge of [0, 4]) game = play(game, edge)!;
  game = play(game, 9)!;
  assert.equal(game.turn, 1);
  assert.equal(closes(game.geo, game.drawn, 5), 1);
  game = play(game, 5)!;
  assert.deepEqual(game.score, [0, 1]);
  assert.equal(game.turn, 1, "the closer sews again");
  assert.equal(play(game, 5), null, "already stitched");
  for (const bad of [-1, 40, 2.5, Number.NaN]) assert.equal(play(game, bad), null);
  let gold = begin(5, { ...empty, gold: [0] });
  for (const edge of [0, 4, 9, 5]) gold = play(gold, edge)!;
  assert.deepEqual(gold.score, [0, 2]);
  assert.equal(totalPoints({ ...empty, gold: [0, 5] }), 18);
  const over = playOut(77, pairSetup(4), casual);
  assert.ok(over.over);
  assert.equal(play(over, 0), null, "nothing after the last box");
});

test("the warning: what a stitch gives away, the least any stitch must give, and which stitches need the second tap", () => {
  const lesson = begin(103, levelOf(3)!.setup);
  const all = gifts(lesson), least = leastGift(all);
  assert.equal(least, 2, "level 3: the short chain gives two");
  for (const edge of free(lesson)) assert.ok(all[edge] === 2 || all[edge] === 4, `edge ${edge}: ${all[edge]}`);
  const long = free(lesson).find(edge => all[edge] === 4)!, short = free(lesson).find(edge => all[edge] === 2)!;
  assert.ok(needsSecondTap(all, long), "opening the long chain needs a second tap");
  assert.equal(needsSecondTap(all, short), false);
  assert.equal(takenAfter(lesson, long).length, 4);
  assert.equal(giveaway(lesson, lesson.drawn), 0);
  // A safe stitch and a closing stitch give nothing away.
  const first = begin(101, levelOf(1)!.setup);
  for (const edge of free(first)) assert.ok(gifts(first)[edge] >= 0);
  assert.equal(gifts(first)[hintGap(first)], 0, "the hint is a box to close");
  assert.ok(gifts(first).every((gift, edge) => gift === -1 || gift === 0 || needsSecondTap(gifts(first), edge)), "anything that gives away here needs the second tap");
});

test("undo takes back your stitch and the bot's replies; two people undo one stitch; recent shows the bot's stitches", () => {
  const start = begin(321, legacySetup(2));
  assert.equal(canUndo(start), false);
  const mine = play(start, hintGap(start))!;
  const answered = play(mine, botMove(mine))!;
  assert.deepEqual(undo(answered).moves, []);
  assert.deepEqual(undo(mine).moves, [], "undo while the bot is still thinking");
  const pair = begin(9, pairSetup(3)), a = play(pair, hintGap(pair))!, b = play(a, hintGap(a))!;
  assert.deepEqual(undo(b).moves, a.moves);
  assert.equal(canUndo(playOut(5, legacySetup(1), casual)), false, "a finished game stays finished");
  assert.deepEqual(recent(answered), answered.moves.slice(1));
});

test("a tap finds the nearest open gap, never jumping off a stitched one; the arrows walk the gaps", () => {
  for (const [cols, rows] of [[2, 2], [4, 4], [5, 5]]) {
    const g = geometry(cols, rows), drawn = Array<boolean>(g.edges).fill(false);
    for (let edge = 0; edge < g.edges; edge++) {
      assert.equal(nearestGap(g.midX[edge], g.midY[edge], g.midX, g.midY, drawn, 62), edge);
      assert.equal(nearestGap(g.midX[edge] + 18, g.midY[edge] - 18, g.midX, g.midY, drawn, 62), edge, "a sloppy tap still finds it");
    }
    const one = drawn.slice(); one[0] = true;
    assert.equal(nearestGap(g.midX[0], g.midY[0], g.midX, g.midY, one, 62), -1);
  }
  assert.equal(stepCursor(0, -1, 40), 0);
  assert.equal(stepCursor(3, 9, 40), 12);
  assert.equal(stepCursor(38, 9, 40), 38);
});

test("the end numbers: each side's best run, what each handed over, stitches sewn", () => {
  const lesson = begin(101, levelOf(1)!.setup);
  let won = lesson;
  for (const edge of [5, 6, 8]) won = play(won, edge)!;
  assert.deepEqual(won.score, [4, 0]);
  assert.deepEqual(quiltStats(won), { run: [4, 0], handed: [0, 0], stitches: [3, 0] });
  // Sewing the middle first hands the whole patch over.
  let lost = play(lesson, 8)!;
  while (!lost.over) lost = play(lost, botMove(lost))!;
  assert.deepEqual(lost.score, [0, 4]);
  assert.deepEqual(quiltStats(lost).handed, [4, 0]);
  const game = playOut(48213, legacySetup(2), casual), stats = quiltStats(game);
  assert.equal(stats.stitches[0] + stats.stitches[1], game.moves.length);
  assert.ok(stats.run[0] <= game.score[0] && stats.run[1] <= game.score[1]);
  assert.equal(stats.handed[0] + stats.handed[1] <= totalPoints(game.setup), true);
});

const OLD_LINKS = {
  hard: "s=48213&t=8&l=2&m=csvCmi12zqA457tgfByDxwrn38b6ka90ejoplh&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF",
  easy: "s=777&t=1&l=1&m=s52j9z6aDpxghcl3vmquydwBAknotiefb7C840&n=%E0%A6%AE%E0%A6%BF%E0%A6%AE",
  pair: "s=9001&t=7&l=0&m=xfle2dhc6nA9iuqp43zDb78kvaj150rmwostBC&o=%E0%A6%AE%E0%A6%BF%E0%A6%AE&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF",
};

test("old links still open, land on their ladder level, and normalize to themselves", () => {
  const hard = parseShared(OLD_LINKS.hard)!, easy = parseShared(OLD_LINKS.easy)!, pair = parseShared(OLD_LINKS.pair)!;
  assert.equal(hard.level, 8, "the old কঠিন বট is মিনু খালা, level 8");
  assert.deepEqual(hard.game.score, [8, 8]);
  assert.equal(easy.level, 5, "the old সহজ বট is level 5");
  assert.equal(pair.level, 0);
  assert.equal(pair.size, 4);
  assert.equal(pair.other, "মিম");
  for (const link of Object.values(OLD_LINKS)) assert.equal(share.normalize(link), link);
});

test("new links: a ladder level (q), two people on another cloth (z); every one round-trips", () => {
  for (const level of [4, 5, 6, 8, 9, 10, 11, 12]) {
    const game = playOut(4242 + level, levelOf(level)!.setup, casual);
    const shared: Shared = { level, size: 4, name: "রাফি", other: "", game };
    const hash = sharedHash(shared);
    if (level === 5 || level === 8) assert.match(hash, /&l=[12]&/, "the old bots keep the old key");
    else assert.match(hash, new RegExp(`&q=${level}&`));
    const back = parseShared(hash)!;
    assert.equal(back.level, level);
    assert.deepEqual(back.game.moves, game.moves);
    assert.equal(share.normalize(hash), hash);
  }
  for (const size of [3, 5] as const) {
    const game = playOut(31 + size, pairSetup(size), casual);
    const hash = sharedHash({ level: 0, size, name: "রাফি", other: "মিম", game });
    assert.match(hash, new RegExp(`l=0&z=${size}&`));
    assert.equal(parseShared(hash)?.size, size);
  }
  assert.deepEqual(decodeMoves(encodeMoves([0, 39, 40, 59])), [0, 39, 40, 59], "the alphabet grew past the old 40");
});

test("forged, broken or hostile links are refused", () => {
  const params = (base: string, change: Record<string, string | null>) => { const p = new URLSearchParams(base); for (const [k, v] of Object.entries(change)) v === null ? p.delete(k) : p.set(k, v); return p.toString(); };
  const { hard, easy } = OLD_LINKS, moves = new URLSearchParams(hard).get("m")!;
  const swapped = [...moves]; const botAt = [...moves].findIndex((_, i) => i > 0); [swapped[botAt], swapped[botAt + 1]] = [swapped[botAt + 1], swapped[botAt]];
  const lesson = playOut(101, levelOf(1)!.setup, casual);
  const bad = [
    "", "result", "#result", params(hard, { t: "9" }), params(hard, { t: "61" }), params(hard, { t: "-1" }),
    params(hard, { l: "3" }), params(easy, { l: "2" }), params(hard, { l: "" }), params(hard, { l: "01" }), params(hard, { s: "0" }), params(hard, { s: "1.5" }),
    params(hard, { m: moves.slice(0, -1) }), params(hard, { m: moves + "0" }), params(hard, { m: swapped.join("") }), params(hard, { m: "<script>" }),
    params(hard, { q: "8" }), params(hard, { l: null, q: "13" }), params(hard, { l: null, q: "0" }), params(hard, { l: null, q: "1" }),
    params(hard, { z: "5" }), params(OLD_LINKS.pair, { z: "4" }), params(OLD_LINKS.pair, { z: "6" }),
    `s=101&t=${lesson.score[0]}&q=1&m=${encodeMoves(lesson.moves)}`, params(hard, { n: "ক".repeat(700) }),
  ];
  for (const state of bad) assert.equal(share.normalize(state), null, state);
  assert.equal(share.normalize(hard + "&x=<script>"), hard, "unknown keys are dropped");
  assert.equal(share.normalize(hard + "&o=মিম"), hard, "no second name against a bot");
  const odd = parseShared(params(hard, { n: "  রিমা‮\u0000 আক্তার আক্তার আক্তার  " }));
  assert.equal(odd?.name, "রিমা আক্তার আক্তার আ");
});

test("previews, captions and lines are personal, honest and kind", () => {
  const hard = parseShared(OLD_LINKS.hard)!;
  const win: Shared = { ...hard, game: { ...hard.game, score: [10, 6] } };
  assert.equal(feat(win), "রাফি মিনু খালাকে ১০–৬ ফুলে হারিয়েছে");
  assert.equal(previewTitle(win), "রাফি মিনু খালাকে ১০–৬ ফুলে হারিয়েছে। তুমি পারবে?");
  assert.equal(previewTitle({ ...win, name: "", game: { ...win.game, score: [6, 10] } }), "এক বন্ধু মিনু খালার সাথে ৬টা ফুল পেয়েছে। তুমি পারবে?");
  assert.equal(previewTitle(parseShared(OLD_LINKS.pair)!), "রাফি আর মিমের ছক-জোড়া: ৭–৯। তোমরাও খেলো!");
  assert.match(caption(win), /১০–৬/);
  assert.equal(share.preview(OLD_LINKS.hard).title, previewTitle(hard));
  assert.equal(share.preview("junk").title, "ছক-জোড়া: কাঁথায় ফোঁড় দাও, ঘর জিতে ফুল ফোটাও");
  assert.equal(share.tally, undefined);
  assert.equal(compareLine(12, 10, "রাফি"), "রাফির চেয়ে ২টা ফুল বেশি!");
  assert.equal(compareLine(4, 10, ""), "বন্ধু এখনো ৬টা ফুল এগিয়ে। আরেকবার?");
  for (let mine = 0; mine <= 16; mine++) {
    const all = [0, 5, 8].map(level => humanLine(level, [mine, 16 - mine], playNames(level, ["রাফি", "মিম"]), 16)).join() + compareLine(mine, 9, "রাফি");
    assert.doesNotMatch(all, /হেরে|খারাপ|ব্যর্থ|বাজি|টাকা/);
  }
  assert.equal(scoreLine(["রাফি", "মিম"], [11, 5]), "রাফি ১১ — মিম ৫");
  assert.deepEqual(playNames(12, ["", ""]), ["তুমি", "নানু"]);
  assert.deepEqual(playNames(0, [" মিম ", ""]), ["মিম", "নীল সুতো"]);
  assert.deepEqual(cardNames(4, "", ""), ["আমি", "টুনি"]);
  assert.deepEqual(initials(["রাফি", "মিম"]), ["রা", "মি"]);
  assert.deepEqual(initials(["ক্ষমা", "বট"]), ["ক্ষ", "ব"]);
  assert.deepEqual(initials(["রাফি", "রাশেদ"]), ["১", "২"], "same letter: numbers instead");
});

test("determinism: the same seed and inputs give the same game and the replay accepts it", () => {
  for (const level of [4, 6, 9, 12]) {
    const setup = levelOf(level)!.setup, one = playOut(48213, setup, casual), two = playOut(48213, setup, casual);
    assert.deepEqual(one.moves, two.moves);
    assert.deepEqual(replay(48213, setup, one.moves)?.score, one.score);
  }
  const openings = new Set(Array.from({ length: 40 }, (_, i) => begin(1000 + i, levelOf(10)!.setup).opening.join()));
  assert.ok(openings.size > 30);
  for (let seed = 1; seed < 200; seed++) {
    const { opening, geo } = begin(seed, levelOf(12)!.setup);
    assert.equal(opening.length, 3);
    for (const a of opening) for (const b of opening) if (a !== b) assert.ok(!boxesOf(geo, a).some(box => boxesOf(geo, b).includes(box)), "seeded stitches never share a box");
  }
  assert.ok(isSafe(begin(4, legacySetup(1)).geo, begin(4, legacySetup(1)).drawn, hintGap(begin(4, legacySetup(1)))));
});

test("content meets the SEO limits, has at least six FAQs and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.notEqual(site.headline, site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.steps.length >= 3 && site.steps.length <= 4);
  assert.match(site.privacy.join(" "), /স্কোর/);
  assert.match(site.privacy.join(" "), /নাম/);
  const everything = JSON.stringify(site) + share.preview("").description;
  assert.equal(everything, everything.normalize("NFC"));
  assert.doesNotMatch(everything, /আপনি|করুন|দেখুন/);
  assert.doesNotMatch(everything, /বাজি|টাকা জিত|লটারি/);
});
