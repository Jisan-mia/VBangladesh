import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { readLevels, unlockedLevel, recordLevel, makeRng, pick } from "../../../shared/game-core";
import { site } from "../content";
import { OLD_LEVELS, migrateOldBests, oldDeal, oldStars, type OldSize } from "../lib/legacy";
import { DUO_SIZES, LEVELS, LEVEL_COUNT, duoSpec } from "../lib/levels";
import { MAX_MOVES, PROOF_MOVES, bn, caption, cardHash, cardOf, duoLine, friendBanner, friendNote, humanLine, parseCard, playerName, previewTitle, sameGame, soloLine, versusLine, type Card } from "../lib/link";
import { PICTURES } from "../lib/pictures";
import { endPeek, begin, flip, legacyGame, newGame, settle, type Game } from "../lib/play";
import { allCleared, openAfter, openFromOld, readOpen, startLevel } from "../lib/save";
import { share } from "../share";
import { PLAYERS, play } from "./bot";

/** A perfect-memory clear that may look at the board (for fixtures). */
function clear(start: Game) {
  let game = endPeek(begin(start));
  while (game.phase === "play") {
    game = settle(game);
    const first = game.board.findIndex((_, i) => game.found[i] < 0);
    const mate = game.board.findIndex((id, other) => other !== first && id === game.board[first] && game.found[other] < 0);
    game = flip(game, first);
    game = flip(game, mate);
    // Birds may move the mate after a miss only; a perfect clear never misses.
  }
  return game;
}

test("the old deal is frozen: a checksum over 1,200 old boards", () => {
  const hash = createHash("sha256");
  for (let seed = 1; seed <= 300; seed++) for (const size of [8, 12, 16, 20] as const) {
    const deal = oldDeal(seed * 7 + 1, size);
    hash.update(JSON.stringify([deal.board, deal.demo]));
  }
  assert.equal(hash.digest("hex").slice(0, 16), "a4442838c76a5ca0", "legacy.ts must never change: old links replay on it");
  // The old toys keep their ids, so a legacy board's picture ids are the first ten pictures.
  assert.deepEqual(PICTURES.slice(0, 10).map(p => p.key), ["belun", "ghuri", "latim", "bansi", "ektara", "putul", "tomtom", "jhunjhuni", "charki", "nouka"]);
  assert.ok(legacyGame(5, 12, 1).board.every(id => id >= 0 && id < 10));
});

// Links made by the game before the rewrite (no `v`), played with the old code; they must still open and re-check.
const OLD_LINKS = [
  { hash: "s=777&t=15&g=20&l=10&f=0123456789a6b7c9de5ef2g4h3idj8&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF", moves: 15, pairs: [10, 0], level: 10, players: 1, cards: 20 },
  { hash: "s=5&t=9&g=12&f=01234567578491a0b6", moves: 9, pairs: [6, 0], level: 0, players: 1, cards: 12 },
  { hash: "s=6&t=13&m=2&a=3&f=01231342567890ab8bc5dae7f6&q=%E0%A6%B0%E0%A6%A8%E0%A6%BF&n=%E0%A6%AE%E0%A6%BF%E0%A6%AE", moves: 13, pairs: [3, 5], level: 0, players: 2, cards: 16 },
  { hash: "s=8&t=7&g=8&l=2&f=01230345256471", moves: 7, pairs: [4, 0], level: 2, players: 1, cards: 8 },
] as const;

test("old links still open on the old board and re-check every flip", () => {
  for (const old of OLD_LINKS) {
    const card = parseCard(old.hash);
    assert.ok(card, old.hash);
    assert.equal(card.v, 1);
    assert.equal(card.moves, old.moves);
    assert.deepEqual(card.pairs, old.pairs);
    assert.equal(card.level, old.level);
    assert.equal(card.players, old.players);
    assert.equal(card.cards, old.cards);
    assert.equal(cardHash(card), old.hash.replace("%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF", "%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF"), "an old card writes the same old link");
    assert.match(friendBanner(card), /(পুরোনো|দুজন|—)/);
  }
  assert.match(friendNote(parseCard(OLD_LINKS[0].hash)!), /পুরোনো বোর্ড/);
  // A changed move count or a changed flip is rejected, as before.
  assert.equal(parseCard(OLD_LINKS[1].hash.replace("t=9", "t=8")), null);
  assert.equal(parseCard(OLD_LINKS[1].hash.replace("01234567", "01234566")), null);
  assert.equal(parseCard(OLD_LINKS[3].hash.replace("l=2", "l=5")), null, "level 5 was a 12-card board");
  assert.equal(parseCard(OLD_LINKS[3].hash.replace("&l=2", "")), null, "an 8-card board only came from a level");
  assert.equal(parseCard(`${OLD_LINKS[3].hash}&m=2&a=4`), null, "two players never played levels");
});

test("new links carry v=2, the ladder level and the proof; they round-trip, and hostile ones are refused", () => {
  for (const level of [1, 8, 9, 16, 17, 24]) {
    const end = clear(newGame(level * 13, LEVELS[level - 1]));
    const card = cardOf(end, ["রাফি"], level);
    const hash = cardHash(card);
    assert.match(hash, /(^|&)v=2(&|$)/);
    assert.match(hash, new RegExp(`(^|&)l=${level}(&|$)`));
    assert.ok(!hash.includes("g="), "the level knows its size");
    assert.deepEqual(parseCard(hash), card, `level ${level}`);
  }
  const base = cardHash(cardOf(clear(newGame(7, LEVELS[4])), [""], 5));
  assert.equal(parseCard(base.replace("l=5", "l=6")), null, "another level is another board: its flips don't replay");
  assert.equal(parseCard(base.replace("l=5", "l=25")), null);
  assert.equal(parseCard(base.replace("l=5", "l=x")), null);
  assert.equal(parseCard(base.replace("&l=5", "")), null, "a v2 solo link needs its level");
  assert.equal(parseCard(base + "&g=12"), null, "a level carries no size");
  assert.equal(parseCard(base.replace("v=2", "v=3")), null);
  assert.equal(parseCard(base.replace(/t=\d+/, "t=999")), null);
  assert.equal(parseCard(`${base}&m=2&a=1`), null, "two players don't play levels");
  assert.equal(parseCard(base + "x".repeat(700)), null, "too long");
  const flips = /f=([0-9a-v]+)/.exec(base)![1];
  assert.equal(parseCard(base.replace(flips, flips + "9")), null, "an extra flip");
  assert.equal(parseCard(base.replace(flips, flips.slice(0, -2))), null, "unfinished");
  assert.equal(parseCard(base.replace(flips, "w" + flips.slice(1))), null, "not base 32");
});

test("two players on the new boards: v=2, g=12 or 16, a and q", () => {
  for (const size of DUO_SIZES) {
    const end = clear(newGame(11, duoSpec(size), 2));
    const card = cardOf(end, ["মিম", "রনি"], 5);
    assert.equal(card.level, 0, "a two-player card never carries a level");
    const hash = cardHash(card);
    assert.match(hash, /v=2/);
    assert.match(hash, /m=2/);
    assert.deepEqual(parseCard(hash), card);
    assert.equal(parseCard(hash.replace("v=2&", "")) === null || parseCard(hash.replace("v=2&", ""))!.v === 1, true, "without v it is read as an old board");
  }
  assert.equal(parseCard("s=1&t=9&v=2&m=2&a=9&g=20"), null);
});

test("long games past the proof limit open as a claim, and nothing past MAX_MOVES opens", () => {
  const spec = LEVELS[7];
  let game = endPeek(begin(newGame(3, spec)));
  const rng = makeRng(5);
  for (let taps = 0; game.phase === "play" && taps < 30_000; taps++) game = flip(game, pick(rng, game.board.length));
  assert.ok(game.moves > PROOF_MOVES, `${game.moves} moves`);
  const card = cardOf(game, [""], 8);
  assert.equal(card.flips, "");
  assert.equal(parseCard(cardHash(card))?.moves, game.moves, "a long game opens without its proof");
  assert.equal(parseCard(`s=1&t=${MAX_MOVES + 1}&v=2&l=1`), null);
  assert.equal(parseCard("s=1&t=3&v=2&l=1"), null, "a short game with no flips is refused");
});

test("same game: a friend's old board is the same board whatever its old level said", () => {
  const old = parseCard(OLD_LINKS[0].hash)!;
  assert.ok(sameGame(old, { ...old, level: 0 }));
  const fresh = cardOf(clear(newGame(2, LEVELS[0])), [""], 1);
  assert.ok(!sameGame(fresh, { ...fresh, seed: 3 }));
  assert.ok(!sameGame(fresh, { ...fresh, level: 2 }));
});

test("bug · LevelsOpenInOrder: a friend's far-ahead level records its stars and opens nothing in between", () => {
  // A friend sends level 24; you clear it on a clean phone. The stars are kept; your open level stays 1.
  let stars = {};
  let open = readOpen(null, stars, {});
  assert.equal(open, 1);
  stars = recordLevel(stars, 24, 3);
  open = openAfter(open, 24);
  assert.equal(open, 1, "level 24 opened nothing");
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 24, "(the shared rule still reads the highest stars; the game keeps its own)");
  assert.equal(startLevel(stars, open), 1, "the next visit opens on level 1");
  assert.equal(allCleared(stars), false, "সব লেভেল শেষ needs every level");
  // Your own clears open one level at a time; re-clearing an earlier level opens nothing new.
  open = openAfter(open, 1); assert.equal(open, 2);
  open = openAfter(open, 2); assert.equal(open, 3);
  assert.equal(openAfter(3, 1), 3);
  assert.equal(openAfter(LEVEL_COUNT, LEVEL_COUNT), LEVEL_COUNT);
  // The saved open level is read back; nonsense falls back.
  assert.equal(readOpen("5", {}, {}), 5);
  assert.equal(readOpen("99", {}, {}), 1);
  assert.equal(readOpen("x", { 3: 2 }, {}), 4, "no saved open level: derived from the stars you have");
  const all = Object.fromEntries(Array.from({ length: LEVEL_COUNT }, (_, i) => [i + 1, 1]));
  assert.equal(allCleared(all), true);
  assert.equal(allCleared({ ...all, 7: 0 }), false);
});

test("old progress migrates once: old stars set your open level; the old ৩×৪/৪×৪ bests still become old stars first", () => {
  assert.equal(openFromOld({}), 1);
  assert.equal(openFromOld({ 3: 3 }), 3);
  assert.equal(openFromOld({ 6: 2 }), 5);
  assert.equal(openFromOld({ 9: 1 }), 7);
  assert.equal(openFromOld({ 10: 1 }), 8, "a player who reached the old ৫×৪ boards opens all of world 1");
  assert.equal(openFromOld({ 12: 3 }), 8, "and no further: the new tables are earned");
  // The old one-time move, kept as it was.
  const moved = migrateOldBests(null, "9", "20");
  assert.ok(moved);
  assert.deepEqual(readLevels(moved, 12), { 4: 3, 7: 1 });
  assert.equal(migrateOldBests('{"1":2}', "9", "20"), null, "only once");
  assert.equal(migrateOldBests(null, "abc", "3"), null);
  assert.equal(openFromOld(readLevels(moved, 12)), 6);
  assert.equal(oldStars(4, 10), 3);
  assert.equal(OLD_LEVELS.length, 12);
  assert.equal(readOpen(null, {}, readLevels(moved, 12)), 6);
  assert.equal(readOpen("2", {}, readLevels(moved, 12)), 2, "once set, the old stars no longer count");
});

test("result lines: kind by band, a friend's comparison, the preview and the caption", () => {
  assert.match(soloLine(8, 8), /ভুল চাল নেই/);
  assert.notEqual(soloLine(8, 8), soloLine(30, 8));
  assert.match(versusLine(10, 14, "রাফি"), /রাফির চেয়ে ৪ চাল কম/);
  assert.match(versusLine(12, 11, "রাফি"), /আর একটু হলেই/);
  assert.match(versusLine(20, 10, ""), /বন্ধু এগিয়ে/);
  const card = cardOf(clear(newGame(5, LEVELS[7])), ["রাফি"], 8);
  assert.match(previewTitle(card), /^রাফি মেলার শেষ দোকান-এ \d+ চালে|^রাফি মেলার শেষ দোকান-এ [০-৯]+ চালে/);
  assert.match(caption(card), /মেলার শেষ দোকান \(বৈশাখী মেলা\)/);
  assert.match(caption(card), /১২ জোড়া/);
  const duo = cardOf(clear(newGame(5, duoSpec(12), 2)), ["মিম", "রনি"]);
  assert.match(previewTitle(duo), /মিম/);
  assert.ok(duoLine({ ...duo, pairs: [3, 3] } as Card).includes("সমান সমান"));
  assert.equal(playerName(["", ""], 1), "দ্বিতীয়জন");
  assert.equal(bn(24), "২৪");
  assert.ok(humanLine(card).length > 5);
  assert.match(share.preview(cardHash(card)).title, /রাফি/);
  assert.equal(share.normalize(cardHash(card)), cardHash(card));
  assert.equal(share.normalize("s=1&t=2&v=2&l=1"), null);
  assert.ok(share.preview("nope").title.length > 0);
  assert.equal(share.tally, undefined);
});

test("content fits the SEO limits, has at least six FAQs and names no trademark", () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  assert.ok(site.title.startsWith("মেমোরি গেম"));
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length, "unique questions");
  assert.ok(site.privacy.some(line => line.includes("লিংক") && line.includes("নাম")));
  assert.doesNotMatch(JSON.stringify(site), /concentration|memory match|pokemon|disney|পোকেমন|মিকি/i);
  for (const text of [site.title, site.headline!, site.description, site.lead, ...site.steps, ...site.faq.flatMap(item => [item.question, item.answer])]) assert.equal(text, text.normalize("NFC"));
  assert.doesNotMatch(JSON.stringify(site), /আপনি|করুন/);
});

test("every picture has a name, a tint and parts; twins differ from their base in shape, not only in colour", () => {
  for (const picture of PICTURES) {
    assert.ok(picture.name && /^#[0-9a-f]{6}$/.test(picture.tint) && picture.parts.length >= 3, picture.key);
    assert.equal(picture.id, PICTURES.indexOf(picture));
  }
  for (const twin of PICTURES.filter(p => p.twinOf >= 0)) {
    const base = PICTURES[twin.twinOf];
    assert.equal(base.world, twin.world);
    const shapes = (p: typeof twin) => p.parts.map(part => part.d).join("|");
    assert.notEqual(shapes(twin), shapes(base));
    // At least one path of the twin that the base does not have: a mark, a moon, a collar, a leaf.
    assert.ok(twin.parts.some(part => !base.parts.some(other => other.d === part.d)), `${twin.key} has its own mark`);
  }
});

test("a bot's game plays the whole ladder start to end on every table without throwing", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.equal(play(level, LEVELS[level - 1], PLAYERS.steady).game.phase, "over");
});
