import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, pick } from "../../../shared/game-core";
import { site } from "../content";
import { ART } from "../lib/art";
import { band, flip, flipsText, isUp, newGame, pairsOf, readFlips, replay, settle, TOYS, type Game, type Players, type Size } from "../lib/game";
import { caption, cardHash, cardOf, duoLine, friendBanner, friendNote, humanLine, MAX_MOVES, parseCard, playerName, previewTitle, PROOF_MOVES, sameGame, soloLine, versusLine, winner, type Card } from "../lib/result";
import { share } from "../share";

const partnerOf = (game: Game, index: number) => game.board.findIndex((toy, other) => other !== index && toy === game.board[index]);

/** A player with a perfect memory: opens unknown cards, and takes any pair it has already seen. */
function rememberer(seed: number, size: Size, players: Players = 1) {
  let game = newGame(seed, size, players);
  const seen = new Map<number, number>();
  const unknown = () => game.board.map((_, index) => index).filter(index => game.found[index] < 0 && !seen.has(index) && !game.open.includes(index));
  const knownPair = () => { for (const [a, toy] of seen) for (const [b, other] of seen) if (a < b && toy === other && game.found[a] < 0) return [a, b]; return null; };
  let guard = 0;
  while (game.phase !== "over" && guard++ < 500) {
    const pair = knownPair();
    const first = pair ? pair[0] : unknown()[0];
    game = flip(game, first);
    seen.set(first, game.board[first]);
    const match = pair ? pair[1] : [...seen].find(([index, toy]) => index !== first && toy === game.board[first] && game.found[index] < 0)?.[0];
    const second = match ?? unknown()[0];
    game = flip(game, second);
    seen.set(second, game.board[second]);
  }
  return game;
}

/** A child tapping at random (seeded), never remembering anything. */
function randomTapper(seed: number, size: Size, players: Players) {
  let game = newGame(seed, size, players);
  const rng = makeRng(seed * 31 + 7);
  for (let taps = 0; game.phase !== "over" && taps < 20_000; taps++) game = flip(game, pick(rng, size));
  return game;
}

test("the same seed deals the same board; another seed deals another", () => {
  assert.deepEqual(newGame(4242, 16, 1), newGame(4242, 16, 1));
  assert.notDeepEqual(newGame(4242, 16, 1).board, newGame(4243, 16, 1).board);
  assert.deepEqual(newGame(77, 16, 1).board, newGame(77, 16, 2).board, "two players get the same board as one");
  assert.deepEqual(rememberer(9, 16).flips, rememberer(9, 16).flips);
});

test("every board has each toy exactly twice, and the demo pair is a real pair", () => {
  for (let seed = 1; seed <= 400; seed++) {
    for (const size of [12, 16] as const) {
      const game = newGame(seed, size, 1);
      assert.equal(game.board.length, size);
      const counts = new Map<number, number>();
      for (const toy of game.board) counts.set(toy, (counts.get(toy) ?? 0) + 1);
      assert.equal(counts.size, pairsOf(size));
      assert.ok([...counts.values()].every(count => count === 2));
      assert.ok([...counts.keys()].every(toy => toy >= 0 && toy < TOYS.length));
      const [a, b] = game.demo;
      assert.ok(a !== b && game.board[a] === game.board[b]);
    }
  }
});

test("every toy has a name and art, and the demo shows only before the first tap", () => {
  for (const id of TOYS) assert.ok(ART[id].name && ART[id].parts.length >= 3 && /^#[0-9a-f]{6}$/.test(ART[id].tint), id);
  const game = newGame(5, 16, 1);
  assert.ok(isUp(game, game.demo[0]) && isUp(game, game.demo[1]));
  const other = game.board.findIndex((_, index) => !game.demo.includes(index));
  const started = flip(game, other);
  assert.equal(started.phase, "playing");
  assert.equal(isUp(started, game.demo[0]), false, "the demo pair turns back when play begins");
  assert.equal(isUp(started, other), true);
});

test("flipping: a match stays, a miss waits to turn back, and taps that do nothing are ignored", () => {
  const game = newGame(11, 16, 1);
  const a = 0, b = partnerOf(game, 0), c = game.board.findIndex(toy => toy !== game.board[0]);
  const one = flip(game, a);
  assert.deepEqual(one.open, [a]);
  assert.equal(one.moves, 0);
  assert.equal(flip(one, a), one, "the card already up");
  assert.equal(flip(one, -1), one);
  assert.equal(flip(one, 16), one);
  assert.equal(flip(one, 1.5), one);
  const matched = flip(one, b);
  assert.deepEqual([matched.moves, matched.pairs, matched.open, matched.last], [1, [1, 0], [], "match"]);
  assert.equal(matched.found[a], 0);
  assert.equal(flip(matched, a), matched, "a matched card can't be flipped again");

  const d = game.board.findIndex((toy, index) => index !== c && toy !== game.board[c] && toy !== game.board[0]);
  const missed = flip(flip(matched, c), d);
  assert.deepEqual([missed.moves, missed.last, missed.open], [2, "miss", [c, d]]);
  const settled = settle(missed);
  assert.deepEqual(settled.open, []);
  assert.equal(settle(settled), settled, "nothing to turn back");
  // Tapping one of the missed pair only turns them back; tapping another card turns them back and opens it.
  const dismissed = flip(missed, c);
  assert.deepEqual([dismissed.open, dismissed.flips.length], [[], missed.flips.length]);
  const e = game.board.findIndex((_, index) => index !== c && index !== d && game.found[index] < 0 && index !== a && index !== b);
  const onward = flip(missed, e);
  assert.deepEqual([onward.open, onward.moves], [[e], 2]);
});

test("two players: a miss passes the turn, a match keeps it, and pairs are counted per player", () => {
  const game = newGame(21, 16, 2);
  const a = 0, b = partnerOf(game, 0), c = game.board.findIndex(toy => toy !== game.board[0]);
  const hit = flip(flip(game, a), b);
  assert.deepEqual([hit.turn, hit.pairs], [0, [1, 0]]);
  const d = game.board.findIndex((toy, index) => index !== c && toy !== game.board[c] && toy !== game.board[0]);
  const miss = flip(flip(hit, c), d);
  assert.equal(miss.turn, 1);
  const c2 = partnerOf(game, c);
  const second = flip(flip(settle(miss), c), c2);
  assert.deepEqual([second.turn, second.pairs, second.found[c]], [1, [1, 1], 1]);
  assert.equal(newGame(21, 16, 1).turn, 0);
  // Solo never passes the turn.
  const solo = newGame(21, 16, 1);
  assert.equal(flip(flip(flip(solo, a), b), c).turn, 0);
  assert.equal(flip(flip(solo, c), d).turn, 0);
});

test("win: knowing the board finishes in exactly one move per pair", () => {
  for (const size of [12, 16] as const) {
    let game = newGame(99, size, 1);
    const done = new Set<number>();
    for (let index = 0; index < size; index++) {
      if (done.has(index)) continue;
      const partner = partnerOf(game, index);
      done.add(index).add(partner);
      assert.equal(game.phase === "over", false);
      game = flip(flip(game, index), partner);
    }
    assert.deepEqual([game.phase, game.moves, game.pairs[0]], ["over", pairsOf(size), pairsOf(size)]);
    assert.equal(flip(game, 0), game, "nothing flips after the end");
  }
});

test("headless runs: a good memory and a random tapper both finish sanely", () => {
  let total = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const game = rememberer(seed, 16);
    assert.equal(game.phase, "over");
    assert.ok(game.moves >= 8 && game.moves <= 15, `seed ${seed}: ${game.moves}`);
    assert.ok(game.found.every(owner => owner === 0));
    total += game.moves;
  }
  const average = total / 200;
  assert.ok(average > 10 && average < 15, `a perfect memory averages about 1.6 moves a pair, got ${average}`);
  for (let seed = 1; seed <= 40; seed++) {
    for (const size of [12, 16] as const) {
      const game = randomTapper(seed, size, 2);
      assert.equal(game.phase, "over");
      assert.equal(game.pairs[0] + game.pairs[1], pairsOf(size));
      assert.ok(game.moves >= pairsOf(size) && game.moves < 400);
      assert.equal(game.flips.length, game.moves * 2);
      assert.deepEqual(replay(seed, size, 2, game.flips), game, "the flips alone rebuild the whole game");
    }
  }
});

test("replay rejects any flip that isn't a real flip", () => {
  const game = rememberer(3, 16);
  assert.ok(replay(3, 16, 1, game.flips));
  assert.equal(replay(3, 16, 1, [...game.flips, 0]), null, "a flip after the end");
  assert.equal(replay(3, 16, 1, [0, 0]), null, "the same card twice");
  assert.equal(replay(3, 16, 1, [16]), null);
  assert.equal(replay(3, 12, 1, [12]), null);
  assert.deepEqual(readFlips(flipsText(game.flips)), game.flips);
  assert.equal(readFlips("0g"), null);
  assert.equal(readFlips("AB"), null);
});

test("score bands and the human lines", () => {
  assert.equal(band(8, 16), 0);
  assert.equal(band(12, 16), 1);
  assert.equal(band(13, 16), 2);
  assert.equal(band(16, 16), 2);
  assert.equal(band(22, 16), 3);
  assert.equal(band(28, 16), 4);
  assert.equal(band(29, 16), 5);
  assert.equal(band(6, 12), 0);
  assert.equal(band(9, 12), 1);
  assert.match(soloLine(8, 16), /একটাও ভুল চাল নেই/);
  assert.match(soloLine(40, 16), /ধৈর্য/);
  const duo = (pairs: [number, number], names: [string, string] = ["রাফি", "মিম"]): Card => ({ seed: 1, size: 16, players: 2, moves: 20, pairs, names, flips: "" });
  assert.equal(winner(duo([4, 4])), null);
  assert.equal(winner(duo([3, 5])), 1);
  assert.match(duoLine(duo([4, 4])), /সমান সমান/);
  assert.match(duoLine(duo([8, 0])), /রাফি একাই সব জোড়া/);
  assert.match(duoLine(duo([5, 3])), /কাছাকাছি/);
  assert.equal(duoLine(duo([2, 6])), "আজ মিমের মনে রাখার জোর বেশি!");
  assert.equal(playerName(["", "  "], 1), "দ্বিতীয়জন");
  assert.equal(humanLine(duo([1, 7], ["", ""])), "আজ দ্বিতীয়জনের মনে রাখার জোর বেশি!");
  assert.equal(versusLine(19, 23, "রাফি"), "রাফির চেয়ে ৪ চাল কম!");
  assert.equal(versusLine(23, 23, "রাফি"), "সমান সমান! দুজনেরই ২৩ চাল।");
  assert.equal(versusLine(25, 23, "জাহিদ"), "আর একটু হলেই! জাহিদের চেয়ে মাত্র ২ চাল বেশি।");
  assert.equal(versusLine(40, 23, ""), "এবার বন্ধু এগিয়ে। নতুন খেলায় আরেকবার দেখো!");
});

test("links carry the flips, round-trip, and re-check every move", () => {
  const game = rememberer(123456, 16);
  const card = cardOf(game, ["রাফি", "ignored"]);
  assert.deepEqual(card.names, ["রাফি", ""]);
  const hash = cardHash(card);
  assert.equal(hash, `s=123456&t=${game.moves}&f=${flipsText(game.flips)}&n=${encodeURIComponent("রাফি")}`);
  assert.deepEqual(parseCard(`#${hash}`), card);
  assert.ok(sameGame(card, parseCard(hash)!));
  // Claiming fewer moves, or a different board, no longer adds up.
  assert.equal(parseCard(hash.replace(`t=${game.moves}`, `t=${game.moves - 1}`)), null);
  assert.equal(parseCard(hash.replace("s=123456", "s=123457")), null);
  assert.equal(parseCard(hash.replace("&f=", "&g=12&f=")), null);
  assert.equal(parseCard(`s=123456&t=${game.moves}`), null, "a short game must bring its flips");
  assert.equal(parseCard("s=5&t=7&f="), null, "no game ends in fewer moves than pairs");

  const duo = randomTapper(77, 12, 2);
  const duoCard = cardOf(duo, ["", "মিম"]);
  const duoHash = cardHash(duoCard);
  assert.match(duoHash, /^s=77&t=\d+&g=12&m=2&a=\d+/);
  assert.ok(duo.moves <= PROOF_MOVES);
  assert.deepEqual(parseCard(duoHash), duoCard);
  assert.equal(parseCard(duoHash.replace(`a=${duo.pairs[0]}`, `a=${(duo.pairs[0] + 1) % 7}`)), null, "pairs must match the replay");
  // Very long games are too long to prove; they're accepted as told, with pairs that add up.
  assert.deepEqual(parseCard("s=9&t=80&m=2&a=5&q=%E0%A6%AE%E0%A6%BF%E0%A6%AE"), { seed: 9, size: 16, players: 2, moves: 80, pairs: [5, 3], names: ["", "মিম"], flips: "" });
  assert.equal(friendNote(parseCard("s=9&t=80")!), "৪×৪ · অনেক লম্বা খেলা, চাল মিলিয়ে দেখা হয়নি");
  assert.equal(friendNote(card), "৪×৪ · প্রতিটা চাল মিলিয়ে দেখা হয়েছে");
  const long = cardOf({ ...game, moves: 61 }, [""]);
  assert.equal(long.flips, "");
  assert.equal(cardHash({ ...long, moves: 5000 }), `s=123456&t=${MAX_MOVES}`);
});

test("hostile or broken links are refused", () => {
  for (const bad of [
    "", "<script>", "s=0&t=70", "s=1&t=-1", "s=1&t=1000", "s=1.5&t=70", "s=abc&t=70", "s=1000000000&t=70",
    "s=1&t=70&g=16", "s=1&t=70&g=3", "s=1&t=70&m=1", "s=1&t=70&m=2", "s=1&t=70&m=2&a=9", "s=1&t=70&m=2&a=-1", "s=1&t=70&m=2&a=x",
    "s=1&t=70&a=3", "s=1&t=70&q=x", "s=1&t=12&f=zz", `s=1&t=70&n=${"x".repeat(700)}`,
  ]) assert.equal(parseCard(bad), null, bad);
  const hostile = parseCard(`s=5&t=90&n=${encodeURIComponent("  রা‮ফি\u0000  খুব লম্বা একটা নাম যেটা বিশ অক্ষরের বেশি ")}`);
  assert.ok(hostile && !/[\u0000‮]/.test(hostile.names[0]) && [...hostile.names[0]].length <= 20);
});

test("banners, previews and captions", () => {
  const solo: Card = { seed: 7, size: 16, players: 1, moves: 23, pairs: [8, 0], names: ["রাফি", ""], flips: "" };
  assert.equal(friendBanner(solo), "রাফি ২৩ চালে পেরেছে। একই খেলা, এবার তোমার পালা।");
  assert.equal(previewTitle(solo), "রাফি ২৩ চালে সব জোড়া মিলিয়েছে। তুমি পারবে?");
  assert.equal(previewTitle({ ...solo, names: ["", ""] }), "এক বন্ধু ২৩ চালে সব জোড়া মিলিয়েছে। তুমি পারবে?");
  assert.match(caption(solo), /২৩ চালে/);
  const duo: Card = { ...solo, players: 2, pairs: [5, 3], names: ["রাফি", "মিম"] };
  assert.equal(friendBanner(duo), "রাফি ৫ — মিম ৩ জোড়া। একই খেলা, এবার তোমরা খেলো।");
  assert.match(previewTitle(duo), /^রাফি ৫ — মিম ৩ জোড়া!/);
  assert.match(caption(duo), /দুজনে/);
});

test("share.ts normalizes, caps and previews", () => {
  const game = rememberer(31337, 12);
  const hash = cardHash(cardOf(game, ["রাফি"]));
  const shuffled = hash.split("&").reverse().join("&");
  assert.equal(share.normalize(shuffled), hash);
  assert.equal(share.normalize("s=1&t=99999"), null);
  assert.equal(share.normalize("<script>"), null);
  assert.equal(share.preview(hash).title, `রাফি ${new Intl.NumberFormat("bn-BD").format(game.moves)} চালে সব জোড়া মিলিয়েছে। তুমি পারবে?`);
  assert.ok(share.preview("nope").title.length > 0);
  assert.equal(share.tally, undefined);
});

test("content fits the SEO limits and never names a trademark", () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  assert.ok(site.title.startsWith("মেমোরি গেম"));
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 5);
  assert.ok(site.privacy.some(line => line.includes("লিংক") && line.includes("নাম")));
  assert.doesNotMatch(JSON.stringify(site), /concentration|memory match|pokemon|disney|পোকেমন|মিকি/i);
});
