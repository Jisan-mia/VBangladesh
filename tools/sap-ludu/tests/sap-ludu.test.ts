import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { JUMPS, LADDERS, LAST, SNAKES, cellOf, isLadder, jumpFrom } from "../lib/board";
import { band, choicesText, choose, landing, makeDice, MAX_ROLLS, newGame, options, piecesFor, readChoices, replay, roll, smartPick, type Game, type Pieces, type Players } from "../lib/game";
import { caption, cardHash, cardOf, cleanPlayerName, friendBanner, friendNote, headline, highlights, humanLine, MAX_CHOICES, nearBest, parseCard, previewTitle, sameRace, scoreboard, seatName, versusLine, winnerMoves, type Result } from "../lib/result";
import { share } from "../share";

const bn = (value: number) => new Intl.NumberFormat("bn-BD", { useGrouping: false }).format(value);

/** Plays a whole game from a seed, picking pieces with `pickPiece` (default: the careful choice). */
function play(seed: number, players: Players, pieces: Pieces, pickPiece: (game: Game) => number = smartPick) {
  const dice = makeDice(seed);
  let game = newGame(seed, players, pieces);
  while (game.phase !== "over" && game.rolls < MAX_ROLLS) game = game.phase === "choose" ? choose(game, pickPiece(game)) : roll(game, dice(game.rolls));
  return game;
}
const resultOf = (game: Game, names: string[] = []): Result => ({ card: cardOf(game, names), game });

test("the board: 100 squares snaking up, and sane ladders and snakes", () => {
  assert.deepEqual(cellOf(1), { col: 0, row: 9 });
  assert.deepEqual(cellOf(10), { col: 9, row: 9 });
  assert.deepEqual(cellOf(11), { col: 9, row: 8 });
  assert.deepEqual(cellOf(100), { col: 0, row: 0 });
  const seen = new Set<string>();
  for (let square = 1; square <= LAST; square++) seen.add(JSON.stringify(cellOf(square)));
  assert.equal(seen.size, 100);
  const starts = JUMPS.map(jump => jump.from), ends = new Set(JUMPS.map(jump => jump.to));
  assert.equal(new Set(starts).size, starts.length, "one jump a square");
  for (const jump of LADDERS) assert.ok(jump.to > jump.from && jump.from > 1 && jump.to <= LAST);
  for (const jump of SNAKES) assert.ok(jump.to < jump.from && jump.to >= 1 && jump.from < LAST, "no snake on 100");
  for (const start of starts) assert.ok(!ends.has(start), `no jump lands on another jump's start (${start})`);
  // Nothing waits on 95–99, where the exact-100 rule already makes you wait.
  for (let square = 95; square < LAST; square++) assert.equal(jumpFrom(square), -1);
  for (const jump of JUMPS) assert.ok(jump.caption.length >= 3 && !/[!?।]/.test(jump.caption));
  assert.doesNotMatch(JUMPS.map(jump => jump.caption).join(" "), /নামাজ|পূজা|ঈদ|মসজিদ|মন্দির|বাজি|টাকা/);
  assert.ok(isLadder(0) && !isLadder(LADDERS.length));
});

test("the same seed gives the same dice and the same game; another seed differs", () => {
  const a = makeDice(4242), b = makeDice(4242), c = makeDice(4243);
  const rolls = Array.from({ length: 200 }, (_, index) => a(index));
  assert.deepEqual(rolls, Array.from({ length: 200 }, (_, index) => b(index)));
  assert.notDeepEqual(rolls, Array.from({ length: 200 }, (_, index) => c(index)));
  assert.ok(rolls.every(value => Number.isInteger(value) && value >= 1 && value <= 6));
  for (let face = 1; face <= 6; face++) assert.ok(rolls.filter(value => value === face).length > 15, `face ${face} turns up`);
  assert.deepEqual(play(77, 3, 1), play(77, 3, 1));
  assert.deepEqual(play(77, 1, 2), play(77, 1, 2));
  // Asking for roll 50 before roll 10 changes nothing.
  const lazy = makeDice(9);
  assert.equal(lazy(50), makeDice(9)(50));
  assert.equal(lazy(10), makeDice(9)(10));
});

test("a roll walks the piece, ladders lift it, snakes drop it, and six rolls again", () => {
  let game = newGame(1, 2, 1);
  game = roll(game, 2); // 0 → 2, the ladder to 23
  assert.deepEqual(game.last, { player: 0, piece: 0, die: 2, from: 0, to: 2, end: 23, jump: 0, stuck: false, again: false, home: false, voided: false });
  assert.equal(game.pos[0], 23);
  assert.equal(game.climbs[0], 1);
  assert.equal(game.turn, 1);
  game = roll(game, 6); // player 2: 0 → 6, no jump, and a six
  assert.equal(game.pos[1], 6);
  assert.equal(game.turn, 1, "six: the same player again");
  assert.equal(game.last?.again, true);
  game = roll(game, 4); // 6 → 10
  assert.equal(game.turn, 0);
  game = roll(game, 1); // 23 → 24, the snake to 6
  assert.equal(game.pos[0], 6);
  assert.equal(game.bites[0], 1);
  assert.equal(game.worstSnake[0], LADDERS.length);
  assert.deepEqual(game.moves, [2, 2]);
  assert.equal(game.rolls, 4);
  assert.equal(roll(game, 0), game, "not a die face");
  assert.equal(roll(game, 7), game);
});

test("the exact-100 rule: a roll that passes 100 doesn't move; exactly 100 wins", () => {
  assert.equal(landing(97, 4), null);
  assert.deepEqual(landing(97, 3), { to: 100, end: 100, jump: -1 });
  let game: Game = { ...newGame(3, 2, 1), pos: [97, 40] };
  game = roll(game, 5);
  assert.equal(game.pos[0], 97, "stays put");
  assert.equal(game.last?.stuck, true);
  assert.equal(game.turn, 1);
  assert.equal(game.moves[0], 1, "a stuck roll still counts as a চাল");
  game = roll(game, 6);
  game = roll(game, 1);
  game = roll(game, 3);
  assert.equal(game.phase, "over");
  assert.equal(game.winner, 0);
  assert.equal(game.pos[0], 100);
  assert.equal(roll(game, 2), game, "nothing moves after the end");
  // A stuck six still rolls again.
  const six = roll({ ...newGame(3, 2, 1), pos: [98, 10] }, 6);
  assert.equal(six.last?.stuck, true);
  assert.equal(six.turn, 0);
  // The last ladder lands right on 100 and wins.
  const ladder = roll({ ...newGame(3, 2, 1), pos: [75, 10] }, 4);
  assert.equal(ladder.phase, "over");
  assert.equal(ladder.last?.end, 100);
  assert.equal(ladder.last?.again, false);
});

test("two pieces: a real choice waits, a single option moves by itself, and the choice is recorded", () => {
  assert.equal(piecesFor(1, false), 2, "solo always has two");
  assert.equal(piecesFor(3, false), 1);
  assert.equal(piecesFor(3, true), 2);
  let game = newGame(5, 1, 2);
  game = roll(game, 4);
  assert.equal(game.phase, "play", "both on the start: one option, moves by itself");
  assert.deepEqual(game.pos, [4, 0]);
  game = roll(game, 4); // piece 1 → 8 (ladder to 30) or piece 2 → 4
  assert.equal(game.phase, "choose");
  assert.deepEqual(options(game, 4), [0, 1]);
  assert.equal(smartPick(game), 0, "the careful pick takes the ladder");
  assert.equal(roll(game, 3), game, "no rolling while a choice waits");
  assert.equal(choose(game, 2), game, "no third piece");
  game = choose(game, 1);
  assert.deepEqual(game.pos, [4, 4]);
  assert.deepEqual(game.choices, [1]);
  // One piece can't move (it would pass 100), so the other goes without asking.
  const forced = roll({ ...newGame(5, 1, 2), pos: [98, 20] }, 5);
  assert.equal(forced.phase, "play");
  assert.deepEqual(forced.pos, [98, 25]);
  assert.deepEqual(forced.choices, []);
});

test("choices pack into hex and back, and the padding must be zero", () => {
  const bits = [1, 0, 1, 1, 0, 1];
  assert.equal(choicesText(bits), "b4");
  assert.deepEqual(readChoices("b4")?.slice(0, 6), bits);
  assert.equal(choicesText([]), "");
  assert.equal(readChoices("xyz"), null);
  assert.equal(readChoices("B4"), null);
});

test("headless runs: thousands of games end sanely with plausible numbers", () => {
  const solo: number[] = [];
  for (let seed = 1; seed <= 1500; seed++) {
    const game = play(seed, 1, 2);
    assert.equal(game.phase, "over");
    assert.equal(game.pos.filter(square => square === LAST).length, 1);
    assert.ok(game.pos.every(square => square >= 0 && square <= LAST));
    assert.equal(game.moves[0], game.rolls);
    assert.ok(game.moves[0] >= 4, "at least four rolls to climb 100, even with ladders");
    solo.push(game.moves[0]);
  }
  solo.sort((a, b) => a - b);
  const median = solo[solo.length >> 1];
  assert.ok(median >= 18 && median <= 32, `median solo race ${median}`);
  for (const players of [2, 3, 4] as const) {
    for (const pieces of [1, 2] as const) {
      for (let seed = 1; seed <= 150; seed++) {
        const game = play(seed * 7 + players, players, pieces, current => options(current, current.die)[seed % 2] ?? options(current, current.die)[0]);
        assert.equal(game.phase, "over");
        assert.ok(game.winner >= 0 && game.winner < players);
        assert.equal(game.moves.reduce((sum, count) => sum + count, 0), game.rolls);
        assert.ok(game.bites.every(count => count >= 0) && game.climbs.every(count => count >= 0));
        if (pieces === 1) assert.deepEqual(game.choices, []);
      }
    }
  }
});

test("score bands and the kind lines", () => {
  assert.deepEqual([6, 14, 15, 20, 21, 28, 29, 40, 41, 300].map(band), [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
  const lines = new Set<string>();
  for (let seed = 1; seed <= 300; seed++) lines.add(humanLine(resultOf(play(seed, 1, 2))));
  assert.ok(lines.size >= 4, "solo lines vary with the run");
  const clean = play(1, 1, 2);
  const snakeFree = { ...clean, bites: [0] };
  assert.match(humanLine(resultOf(snakeFree)), /সাপও ছুঁতে পারেনি/);
  const group = play(12, 3, 1);
  const line = humanLine(resultOf(group, ["রাফি", "মিম", ""]));
  assert.ok(line.length > 8);
  assert.equal(headline(resultOf(group, ["রাফি", "মিম", ""])), `${seatName(["রাফি", "মিম", ""], group.winner)} জিতল!`);
  assert.equal(headline(resultOf(clean, ["রাফি"])), "রাফি ১০০-তে!");
  assert.equal(headline(resultOf(clean)), "১০০-তে উঠেছ!");
  assert.match(scoreboard(resultOf(group, ["রাফি"])), /^রাফি [০-৯]+ · নীল [০-৯]+ · কমলা [০-৯]+$/);
  assert.ok(highlights(clean).every(item => /^(সেরা সিঁড়ি|বড় কামড়): /.test(item)));
  assert.equal(versusLine(20, 25, "রাফি"), "রাফির চেয়ে ৫ চাল কম!");
  assert.equal(versusLine(25, 25, "রাফি"), "সমান সমান! দুজনেরই ২৫ চাল।");
  assert.equal(versusLine(27, 25, "রাফি"), "আর একটু হলেই! রাফির চেয়ে মাত্র ২ চাল বেশি।");
  assert.equal(versusLine(40, 25, ""), "এবার বন্ধু এগিয়ে। একই ছক্কায় আরেকবার দেখো!");
});

test("a link round-trips, is replayed and checked, and rejects tampering", () => {
  const game = play(123456, 1, 2);
  const card = cardOf(game, ["রাফি"]);
  const hash = cardHash(card, game);
  assert.ok(hash.startsWith(`s=123456&t=${game.moves[0]}`));
  assert.ok(hash.endsWith(`&n=${encodeURIComponent("রাফি")}`));
  const back = parseCard(`#${hash}`);
  assert.ok(back);
  assert.deepEqual(back.card, card);
  assert.equal(winnerMoves(back.game), game.moves[0]);
  assert.ok(sameRace(card, back.card));
  assert.equal(parseCard(hash.replace(`t=${game.moves[0]}`, `t=${game.moves[0] - 1}`)), null, "fewer moves than the replay");
  assert.equal(parseCard(hash.replace("s=123456", "s=123457")), null, "another seed's dice don't add up");
  if (game.choices.length) {
    const flipped = choicesText(game.choices.map((bit, index) => index === 0 ? 1 - bit : bit));
    const tampered = parseCard(hash.replace(`c=${choicesText(game.choices)}`, `c=${flipped}`));
    assert.ok(tampered === null || winnerMoves(tampered.game) === game.moves[0], "other choices only pass if they really give the same count");
  }

  const group = play(99, 4, 2);
  const groupCard = cardOf(group, ["রাফি", "", "মিম", "x".repeat(40)]);
  assert.equal(groupCard.names[3].length, 16, "names cap at 16");
  const groupHash = cardHash(groupCard, group);
  assert.match(groupHash, /^s=99&t=\d+&p=4&g=2&c=[0-9a-f]+&n3=/);
  const groupBack = parseCard(groupHash);
  assert.deepEqual(groupBack?.card, groupCard);
  assert.equal(groupBack?.game.winner, group.winner);

  const plain = play(5, 2, 1);
  const plainHash = cardHash(cardOf(plain, []), plain);
  assert.equal(plainHash, `s=5&t=${plain.moves[plain.winner]}&p=2`);
  assert.ok(parseCard(plainHash));
  assert.equal(cardHash(cardOf(newGame(5, 2, 1), []), newGame(5, 2, 1)), "", "an unfinished game is no link");
  assert.equal(cardHash({ ...cardOf(group, []), choices: Array(MAX_CHOICES + 1).fill(0) }, group), "", "too many choices: no link");
});

test("hostile or broken links are refused", () => {
  for (const bad of [
    "", "<script>", "s=0&t=20", "s=1&t=-1", "s=1&t=1000", "s=1.5&t=20", "s=abc&t=20", "s=1000000000&t=20",
    "s=1&t=20&p=1", "s=1&t=20&p=5", "s=1&t=20&p=x", "s=1&t=20&g=2", "s=1&t=20&p=2&g=1", "s=1&t=20&p=2&n3=x", "s=1&t=20&n2=x",
    "s=1&t=20&c=zz", `s=1&t=20&c=${"0".repeat(101)}`, `s=1&t=20&n=${"x".repeat(700)}`, "s=1&t=5",
  ]) assert.equal(parseCard(bad), null, bad);
  const game = play(31, 1, 2);
  const hash = cardHash(cardOf(game, []), game);
  const hostile = parseCard(`${hash}&n=${encodeURIComponent("  রা‮ফি\u0000  খুব লম্বা একটা নাম যেটা ষোলো অক্ষরের বেশি ")}`);
  assert.ok(hostile && !/[\u0000‮]/.test(hostile.card.names[0]) && [...hostile.card.names[0]].length <= 16);
  assert.equal(cleanPlayerName("  a‮b  "), "ab");
});

test("banners, previews and captions", () => {
  const game = play(2024, 1, 2), moves = bn(game.moves[0]);
  const solo = resultOf(game, ["রাফি"]);
  assert.equal(friendBanner(solo), `রাফি ${moves} চালে ১০০-তে উঠেছে। একই ছক্কা, কার ভাগ্য ভালো?`);
  assert.equal(previewTitle(solo), `রাফি ${moves} চালে ১০০-তে উঠেছে। একই ছক্কায় তুমি পারবে?`);
  assert.equal(previewTitle(resultOf(game)), `এক বন্ধু ${moves} চালে ১০০-তে উঠেছে। একই ছক্কায় তুমি পারবে?`);
  assert.match(friendNote(solo), /একই ছক্কা/);
  assert.match(caption(solo), new RegExp(`${moves} চালে`));
  const group = play(8, 2, 1), groupResult = resultOf(group, ["রাফি", "মিম"]);
  assert.match(friendBanner(groupResult), /জিতেছে .+ চালে, ২ জনের খেলায়। এবার তোমরা খেলো!$/);
  assert.match(previewTitle(groupResult), /^(রাফি|মিম) জিতল [০-৯]+ চালে/);
  assert.match(caption(groupResult), /তোমাদের বাসায় কার ভাগ্য ভালো\?$/);
  for (const text of [friendBanner(solo), previewTitle(groupResult), caption(groupResult), friendNote(groupResult)]) assert.doesNotMatch(text, /বাজি|টাকা|জুয়া|হারাম|হালাল/);
});

test("share.ts normalizes, caps and previews", () => {
  const game = play(31337, 1, 2);
  const hash = cardHash(cardOf(game, ["রাফি"]), game);
  const shuffled = hash.split("&").reverse().join("&");
  assert.equal(share.normalize(shuffled), hash);
  assert.equal(share.normalize("s=1&t=99999"), null);
  assert.equal(share.normalize("<script>"), null);
  assert.equal(share.preview(hash).title, `রাফি ${bn(game.moves[0])} চালে ১০০-তে উঠেছে। একই ছক্কায় তুমি পারবে?`);
  assert.ok(share.preview("nope").title.length > 0);
  assert.equal(share.tally, undefined);
});

test("content fits the SEO limits and never names a trademark or a ruling", () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  assert.ok(site.title.startsWith("সাপ লুডু"));
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.privacy.some(line => line.includes("লিংক") && line.includes("নাম")));
  assert.doesNotMatch(JSON.stringify(site), /chutes|hasbro|milton|বাজি|জুয়া|হারাম|হালাল|জায়েজ/i);
});

test("the near-miss line names exactly how many fewer rolls beat this phone's best", () => {
  assert.equal(nearBest(24, 21), "আর ৪ চাল কম লাগলেই নতুন সেরা।");
  assert.equal(nearBest(21, 21), "আর ১ চাল কম লাগলেই নতুন সেরা।", "a tie isn't a new best");
  assert.equal(nearBest(20, 21), "", "already a new best");
  assert.equal(nearBest(40, 21), "", "too far to call it close");
  assert.equal(nearBest(30, null), "", "no best yet");
});
