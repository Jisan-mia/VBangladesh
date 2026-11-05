// Links, result words, content limits and the 40 jams from before the rewrite. Old links must keep opening.
import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { solve } from "../lib/board";
import { encodeMoves, parOf, slide, startGame, LEGACY_COUNT, LEVEL_COUNT, MAX_LINK_MOVES, replay, type Game } from "../lib/game";
import { LEGACY_LEVELS } from "../lib/legacy";
import { band, bn, caption, clock, compareLine, duration, feat, finaleLine, fromGame, humanLine, nearMissLine, parseShared, previewTitle, sharedHash, solvedLine } from "../lib/link";

function finish(game: Game) {
  for (const move of solve(game.lay, game.pos)!) game = slide(game, move.car, move.to)!;
  return game;
}

test("a link round-trips with v=2, and the move count is proven by replaying it", () => {
  const game = finish(startGame(12));
  const shared = fromGame(game, "  রাফি ")!;
  const hash = sharedHash(shared);
  assert.match(hash, /^l=12&m=[0-9a-zA-X]+&v=2&n=/);
  const back = parseShared(`#${hash}`);
  assert.deepEqual(back, { level: 12, legacy: false, moves: shared.moves, count: parOf(12), helped: 0, name: "রাফি" });
  assert.equal(share.normalize(hash), hash);
  assert.equal(parseShared(sharedHash({ ...shared, helped: 3 }))?.helped, 3);
  assert.equal(feat({ ...back!, count: 9 }), `রাফি ১২ নম্বর জ্যাম ৯ চালে ছাড়িয়েছে (সেরা ${bn(parOf(12))})`);
  // a finale is named in the words around the link
  const finale = fromGame(finish(startGame(32)), "মিম")!;
  assert.match(feat(finale), /^মিম ‘ঈদের আগের রাত’ জ্যাম /);
  assert.match(caption(finale), /‘ঈদের আগের রাত’ জ্যাম/);
});

test("every jam on the ladder makes a link that parses back to the same moves", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const shared = fromGame(finish(startGame(level)), "")!;
    const back = parseShared(sharedHash(shared));
    assert.equal(back?.count, parOf(level), `jam ${level}`);
    assert.equal(back?.legacy, false);
  }
});

test("forged, broken or hostile links are refused", () => {
  const game = finish(startGame(5));
  const moves = encodeMoves(game.moves);
  const hash = sharedHash(fromGame(game, "রাফি")!);
  const params = (change: Record<string, string>) => { const p = new URLSearchParams(hash); for (const [k, v] of Object.entries(change)) p.set(k, v); return p.toString(); };
  const first = game.moves[0];
  const doubled = moves[0] + encodeMoves([{ ...first, to: first.from }]).slice(0, 1) + moves.slice(1);
  const bad = [
    "", "result", "#result", "l=5", "m=" + moves, "l=5&m=" + moves + "&v=3", "l=5&m=" + moves + "&v=", "l=5&m=" + moves + "&v=02",
    params({ l: "0" }), params({ l: "33" }), params({ l: "05" }), params({ l: "6" }), params({ l: "5.0" }), params({ l: "" }),
    params({ m: moves.slice(0, -1) }), params({ m: moves + moves[0] }), params({ m: "" }), params({ m: "<script>" }), params({ m: "Y" }),
    params({ m: [...moves].reverse().join("") }), params({ m: doubled }), params({ m: "0".repeat(MAX_LINK_MOVES + 1) }),
    params({ h: String(game.moves.length + 1) }), params({ h: "-1" }), params({ h: "01" }), params({ h: "1e2" }),
    params({ n: "ক".repeat(700) }),
  ];
  for (const state of bad) assert.equal(share.normalize(state), null, state);
  const odd = parseShared(params({ n: "  রিমা‮\u0000 আক্তার আক্তার আক্তার  " }));
  assert.equal(odd?.name, "রিমা আক্তার আক্তার আ");
  // a v=2 link is checked against the ladder, never the old jams
  assert.equal(parseShared(params({ l: "33" })), null);
});

test("the 40 jams from before the rewrite are kept exactly, and their links open as old jams without a v key", () => {
  assert.equal(LEGACY_COUNT, 40);
  assert.equal(new Set(LEGACY_LEVELS.map(([code]) => code)).size, 40);
  LEGACY_LEVELS.forEach(([code, best], index) => {
    const game = startGame(index + 1, true);
    assert.equal(game.lay.heroes, 1);
    assert.equal(game.lay.walls.length, 0);
    assert.equal(solve(game.lay, game.pos)?.length, best, `old jam ${index + 1} (${code})`);
    const won = finish(game);
    const link = fromGame(won, "")!;
    const hash = sharedHash(link);
    assert.ok(!hash.includes("v="), "an old jam's link stays in the old format");
    assert.deepEqual(parseShared(`#${hash}`)?.legacy, true);
    assert.equal(parseShared(`#${hash}`)?.count, best);
  });
  // A link made before the rewrite, character for character: jam 1 solved as the truck-and-bus shuffle k90.
  assert.deepEqual(parseShared("#l=1&m=k90&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF"), { level: 1, legacy: true, moves: "k90", count: 3, helped: 0, name: "রাফি" });
  assert.equal(parseShared("l=1&m=k90&h=2")?.helped, 2);
  assert.equal(share.normalize("l=1&m=k90&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF"), "l=1&m=k90&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF", "old links normalise to themselves");
  assert.equal(parseShared("l=40&m=" + encodeMoves(finish(startGame(40, true)).moves))?.count, 40);
  // Forgeries of old links are still refused (wrong jam, a move that doesn't free the CNG, more hints than moves).
  for (const bad of ["l=1&m=k9", "l=3&m=k90", "l=1&m=k90&h=9", "l=41&m=k90", "l=0&m=k90"]) assert.equal(parseShared(bad), null, bad);
  assert.equal(replay(1, "k90", true)?.moves.length, 3);
  assert.equal(replay(1, "k90", false), null, "the same characters don't clear a ladder jam");
  // Stars for an old jam keep the old rule: any hint means one star.
  assert.match(feat(parseShared("l=1&m=k90&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF")!), /^রাফি ১ নম্বর পুরোনো জ্যাম ৩ চালে ছাড়িয়েছে \(সেরা ৩\)$/);
});

test("score bands and the kind lines", () => {
  assert.equal(band(7, 7, 0), "perfect");
  assert.equal(band(9, 7, 0), "close");
  assert.equal(band(14, 7, 0), "good");
  assert.equal(band(15, 7, 0), "long");
  assert.equal(band(7, 7, 2), "helped");
  assert.equal(humanLine(7, 7, 0), "এর চেয়ে কম চালে হয় না। একদম মাপা হিসাব!");
  assert.equal(compareLine(7, 9, "রাফি"), "রাফির চেয়ে ২ চাল কম!");
  assert.equal(compareLine(9, 9, "রাফি"), "একদম সমান! রাফিও ৯ চালেই ছাড়িয়েছিল।");
  assert.equal(compareLine(10, 9, ""), "আর একটু হলেই! মাত্র ১ চাল বেশি।");
  assert.equal(compareLine(15, 9, "মিম"), "মিম এখনো ৬ চাল এগিয়ে। আরেকবার?");
});

test("the end screen's lines are exact: near misses, par, the finale and the clock", () => {
  assert.equal(nearMissLine(7, 7, 0), "");
  assert.equal(nearMissLine(8, 7, 0), "আর ১ চাল কম হলে ৩ তারা।");
  assert.equal(nearMissLine(11, 7, 0), "আর ২ চাল কম হলে ২ তারা।", "par 7: two stars up to 9, so 11 is one star and two moves short of two");
  assert.equal(nearMissLine(9, 7, 0), "আর ২ চাল কম হলে ৩ তারা।");
  assert.equal(nearMissLine(7, 7, 1), "হিন্ট ছাড়া ছাড়ালে ৩ তারা পর্যন্ত পাবে।", "a hint capped it at two");
  assert.equal(nearMissLine(7, 7, 2), "হিন্ট ছাড়া ছাড়ালে ৩ তারা পর্যন্ত পাবে।");
  assert.equal(nearMissLine(7, 7, 1, true), "হিন্ট ছাড়া ছাড়ালে ৩ তারা পর্যন্ত পাবে।");
  assert.equal(solvedLine(3, false, 9, 0), `সবুজ CNG ফাঁক দিয়ে বেরিয়ে গেল। সবচেয়ে কম লাগে ${bn(parOf(3))} চাল।`);
  assert.match(solvedLine(26, false, 20, 0), /^দুটো CNG-ই গলির ফাঁক দিয়ে/);
  assert.match(solvedLine(3, false, parOf(3), 0), /এর চেয়ে কম চালে হয় না/);
  assert.match(finaleLine(8), /^গলির মুখের জ্যাম ছাড়ল। সামনে বড় রাস্তা: বাস আর ট্রাক/);
  assert.match(finaleLine(32), /সব জ্যাম পার করেছ/);
  assert.equal(clock(65), "১:০৫");
  assert.equal(duration(65), "১ মিনিট ৫ সেকেন্ড");
  assert.equal(duration(40), "৪০ সেকেন্ড");
});

test("previews and captions are personal and honest", () => {
  const shared = { ...fromGame(finish(startGame(12)), "রাফি")!, count: 9 };
  assert.equal(previewTitle(shared), `${feat(shared)}। তুমি পারবে?`);
  assert.match(feat({ ...shared, name: "" }), /^এক বন্ধু ১২ নম্বর জ্যাম/);
  assert.match(feat({ ...shared, helped: 2 }), /^রাফি একটু সাহায্য নিয়ে/);
  assert.match(caption(shared), /১২ নম্বর জ্যাম ৯ চালে/);
  const real = fromGame(finish(startGame(30)), "মিম")!;
  assert.equal(share.preview(sharedHash(real)).title, previewTitle(real));
  assert.equal(share.preview("junk").title, "জ্যাম ছাড়াও: গাড়ি সরিয়ে সবুজ CNG বের করো");
  assert.equal(share.tally, undefined);
});

test("content meets the SEO limits, speaks তুমি and says what the game now has", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.notEqual(site.headline, site.title);
  assert.equal(site.headline, "জ্যামে আটকা CNG, পথ করে দাও");
  assert.ok(site.faq.length >= 6);
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length);
  assert.ok(site.steps.length >= 3);
  assert.match(site.privacy.join(" "), /স্কোর/);
  assert.match(site.privacy.join(" "), /নাম/);
  const everything = JSON.stringify(site) + share.preview("").description;
  assert.doesNotMatch(everything, /আপনি|করুন|দেখুন/);
  assert.doesNotMatch(everything, /বাজি|টাকা জিত|লটারি|অ্যাম্বুলেন্স|rush hour/i);
  assert.match(site.description, /৩২টা জ্যাম/);
  assert.ok(site.faq.some(item => /৩২টা জ্যাম/.test(item.answer)));
  for (const text of [site.title, site.description, site.headline, ...site.steps, ...site.faq.flatMap(item => [item.question, item.answer])]) assert.equal(text, text.normalize("NFC"));
});
