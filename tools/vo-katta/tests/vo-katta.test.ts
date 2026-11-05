// Rules, links and words for ভো-কাট্টা, against the pure lib/ code.
import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import {
  createGame, curve, distanceToLine, E, edge, FLY, GONE, HI, HOME, linesCross, LO, REACH, segmentsCross, SEGMENTS, SKY, steerBy, steerTo, windAt, zone,
  type Game,
} from "../lib/kite";
import { LEVEL_COUNT, levelDef, MODE_INFO, starsOf } from "../lib/levels";
import {
  caption, compareLine, cutLine, friendClaim, friendLine, humanLine, lookFromGhuri, LOOKS, MAX_CUTS, migrateBest, parseShared, previewTitle, readLook, seconds, sharedHash,
  type Shared,
} from "../lib/link";
import { stepGame } from "../lib/step.hot";
import { CASUAL, play } from "./bot";

const DT = 1 / 60;
const events = (game: Game) => { const out: number[] = []; for (let i = 0; i < game.evCount; i++) out.push(game.ev[i]); game.evCount = 0; return out; };
const snapshot = (game: Game) => [game.cuts, game.lost, game.you.x, game.you.y, game.rivals[0].x, game.rivals[0].y, game.total, game.tug];

test("the same seed gives the same sky, and the same play gives the same evening", () => {
  const one = createGame(48213, 5), two = createGame(48213, 5), other = createGame(48214, 5);
  assert.deepEqual(one.plans, two.plans);
  assert.equal(one.windBase, two.windBase);
  assert.notDeepEqual(one.plans, other.plans);
  for (const t of [0, 7.5, 40]) assert.equal(windAt(one, t, false), windAt(two, t, false));
  const a = play(777, 6, "n", CASUAL)!, b = play(777, 6, "n", CASUAL)!;
  assert.deepEqual(snapshot(a.game), snapshot(b.game));
  assert.equal(a.time, b.time);
});

test("every evening starts unhooked, in the sky, with the first rival (or the first pair) hovering", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) for (const seed of [1, 2, 48213, 999_999_999]) {
    const game = createGame(seed, level), def = levelDef(level);
    assert.equal(game.phase, "ready");
    assert.deepEqual([game.you.x, game.you.y], [HOME.x, HOME.y]);
    assert.equal(game.rivals[0].state, FLY);
    assert.equal(game.rivals[1].state, def.pair ? FLY : GONE);
    for (const r of game.rivals) if (r.state === FLY) assert.ok(r.x >= SKY.left && r.x <= SKY.right && r.y >= SKY.top && r.y <= SKY.bottom);
    assert.ok(!linesCross(game.you.line, game.rivals[0].line, game.at), `level ${level} seed ${seed} starts unhooked`);
    assert.equal(game.kites, MODE_INFO.n.kites);
  }
});

test("tension: the green band saws hardest, slack a little, too tight barely; টান fills it and letting go empties it", () => {
  assert.equal(edge(0), 0);
  assert.equal(edge(LO), 1);
  assert.equal(edge(HI), 1);
  assert.ok(edge(LO - 0.01) < 0.31);
  assert.equal(edge(1), 0.25);
  assert.deepEqual([zone(0.2), zone(0.6), zone(0.95)], ["slack", "good", "tight"]);
  const game = createGame(5);
  for (let i = 0; i < 60; i++) stepGame(game, true, DT);
  assert.ok(game.you.t > 0.95, "a second of টান fills the meter");
  for (let i = 0; i < 90; i++) stepGame(game, false, DT);
  assert.equal(game.you.t, 0, "letting go empties it");
});

test("the kite: slack it sags and drifts downwind, taut it climbs to the aim and answers fast", () => {
  const slack = createGame(9, 2), taut = createGame(9, 2);
  stepGame(slack, true, DT); stepGame(taut, true, DT);
  for (let i = 0; i < 180; i++) { stepGame(slack, false, DT); stepGame(taut, true, DT); }
  assert.ok(slack.you.y > taut.you.y + 15, `slack sags below the taut kite (${slack.you.y.toFixed(0)} vs ${taut.you.y.toFixed(0)})`);
  assert.ok(Math.abs(taut.you.x - taut.aimX) < 12 && Math.abs(taut.you.y - taut.aimY) < 12, "taut, it sits at the aim");
  const windward = Math.sign(slack.wind);
  assert.ok((slack.you.x - slack.aimX) * windward > 0, "slack, the wind carries it downwind");
  // A taut kite crosses the sky faster than a slack one.
  const fast = createGame(3), lazy = createGame(3);
  stepGame(fast, true, DT); stepGame(lazy, true, DT);
  for (let i = 0; i < 40; i++) stepGame(fast, true, DT);
  steerTo(fast, 300, 60); steerTo(lazy, 300, 60);
  for (let i = 0; i < 30; i++) { stepGame(fast, true, DT); stepGame(lazy, false, DT); }
  assert.ok(fast.you.x > lazy.you.x + 20);
});

test("strings: crossing segments are found, parallel and apart ones are not, and distances are right", () => {
  assert.equal(segmentsCross(0, 0, 10, 10, 0, 10, 10, 0), 0.5);
  assert.equal(segmentsCross(0, 0, 10, 0, 0, 5, 10, 5), -1, "parallel");
  assert.equal(segmentsCross(0, 0, 4, 4, 6, 0, 10, -4), -1, "apart");
  assert.equal(segmentsCross(0, 0, 10, 0, 10, 0, 10, 10), 1, "touching at the end");
  const game = createGame(9), at = new Float32Array(2);
  game.you.x = 300; game.you.y = 110; game.rivals[0].x = 90; game.rivals[0].y = 140;
  curve(game.you, 0, game.you.line); curve(game.rivals[0], 0, game.rivals[0].line);
  assert.ok(linesCross(game.you.line, game.rivals[0].line, at));
  assert.equal(game.you.line.length, (SEGMENTS + 1) * 2);
  assert.deepEqual([game.you.line[0], game.you.line[1]], [game.you.hx, game.you.hy], "the string starts at the hand");
  assert.ok(distanceToLine(game.you.line, game.you.x, game.you.y) < 0.01);
});

test("a প্যাঁচ: flying across a string hooks it; a green tug cuts the rival, an idle hand loses the kite", () => {
  const win = createGame(11), seen: number[] = [];
  stepGame(win, true, DT);
  // The first rival flies from the right-hand roof: fly to the far side of its string.
  for (let i = 0; i < 600 && win.hooked < 0; i++) { steerTo(win, 330, 150); stepGame(win, true, DT); seen.push(...events(win)); }
  assert.ok(win.hooked === 0 && seen.includes(E.HOOK), "flying across the rival's string hooks it");
  for (let i = 0; i < 600 && win.hooked >= 0; i++) { stepGame(win, win.you.t < LO + 0.06 || (win.you.t <= HI - 0.06 && win.pulling), DT); seen.push(...events(win)); }
  assert.ok(seen.includes(E.CUT) && win.cuts === 1, "the green band cuts");
  const lose = createGame(11), out: number[] = [];
  stepGame(lose, true, DT);
  for (let i = 0; i < 600 && lose.hooked < 0; i++) { steerTo(lose, 330, 150); stepGame(lose, true, DT); }
  for (let i = 0; i < 60 * 30 && lose.lost === 0; i++) { stepGame(lose, false, DT); out.push(...events(lose)); }
  assert.ok(out.includes(E.LOST) && lose.lost === 1 && lose.kites === 2, "a kite nobody pulls gets cut");
  for (let i = 0; i < 60 * 3; i++) stepGame(lose, false, DT);
  assert.equal(lose.you.state, FLY, "a new kite rises");
});

test("steering stays in the sky and on the leash", () => {
  const game = createGame(3);
  steerBy(game, -999, -999);
  assert.deepEqual([game.aimX, game.aimY], [SKY.left, SKY.top]);
  steerTo(game, 999, 999);
  assert.deepEqual([game.aimX, game.aimY], [SKY.right, SKY.bottom]);
  game.hooked = 0; game.hookX = 180; game.hookY = 200;
  steerTo(game, 20, 60);
  assert.ok(Math.hypot(game.aimX - 180, game.aimY - 200) <= REACH + 1e-9);
});

test("an evening ends once: cut the whole list (won) or lose every kite (out), then nothing moves", () => {
  const won = play(21, 1, "n", CASUAL)!;
  assert.equal(won.won, true);
  assert.equal(won.cuts, levelDef(1).roster.length);
  const idle = play(21, 3, "n", "idle")!;
  assert.equal(idle.won, false);
  assert.equal(idle.lost, MODE_INFO.n.kites);
  for (const outcome of [won, idle]) {
    const before = outcome.game.total;
    stepGame(outcome.game, true, DT);
    assert.equal(outcome.game.total, before, "a finished game stays finished");
  }
});

test("stars are kites kept; easy tops out at two; a lost evening has none", () => {
  assert.deepEqual([starsOf(true, 0), starsOf(true, 1), starsOf(true, 2), starsOf(true, 4), starsOf(false, 3)], [3, 2, 1, 1, 0]);
  assert.equal(starsOf(true, 0, "e"), 2);
  assert.equal(starsOf(true, 0, "h"), 3);
});

test("old links still open: s/t/n/p/c/l without v, the same seed and level number, honest about the old count", () => {
  const old = parseShared("#s=862479917&t=18&n=" + encodeURIComponent("রাফি"))!;
  assert.deepEqual({ ...old }, { seed: 862479917, cuts: 18, name: "রাফি", look: null, level: 1, mode: "n", lost: 0, tenths: 0, won: false, old: true });
  assert.equal(parseShared("s=48213&t=7&p=chokhdar&c=blue&l=5")?.level, 5);
  assert.equal(sharedHash(parseShared("s=48213&t=7&p=chokhdar&c=blue")!), "s=48213&t=7&p=chokhdar&c=blue", "an old link writes back as it was");
  assert.equal(sharedHash(parseShared("s=48213&t=7&l=5")!), "s=48213&t=7&l=5");
  for (const bad of ["", "result", "s=0&t=1", "s=1000000000&t=1", "s=12&t=-1", `s=12&t=${MAX_CUTS + 1}`, "s=1.5&t=1", "s=12&t=1&l=11", "s=12&t=1&l=05", "s=12&t=1&d=h"]) {
    assert.equal(share.normalize(bad), null, bad);
  }
  assert.match(friendLine(old), /আগের ভো-কাট্টায় ১৮টা/);
  assert.match(friendClaim(old), /আগের খেলার স্কোর/);
  assert.equal(compareLine({ won: true, lost: 0, tenths: 300, cuts: 2 }, old), "", "no compare against a different game");
});

test("new links: v=2 with the mode, kites lost and time; impossible runs are refused", () => {
  const shared: Omit<Shared, "won"> = { seed: 48213, cuts: 3, name: "রাফি", look: { pattern: "chokhdar", color: "blue" }, level: 3, mode: "h", lost: 1, tenths: 423, old: false };
  const hash = sharedHash(shared);
  assert.equal(hash, "s=48213&t=3&p=chokhdar&c=blue&l=3&v=2&d=h&k=1&m=423&n=" + encodeURIComponent("রাফি"));
  assert.deepEqual(parseShared(hash), { ...shared, won: true });
  assert.equal(share.normalize(hash), hash);
  assert.equal(sharedHash({ ...shared, mode: "n" }).includes("d="), false);
  const lost = parseShared("s=48213&t=1&l=3&v=2&k=3&m=200")!;
  assert.equal(lost.won, false, "every kite gone: a lost evening");
  for (const bad of [
    "s=48213&t=9&l=3&v=2&k=0&m=200", // more cuts than rivals
    "s=48213&t=3&l=3&v=2&k=7&m=200", // more kites lost than the নাটাই held
    "s=48213&t=1&l=3&v=2&k=1&m=200", // neither cleared nor out
    "s=48213&t=3&l=3&v=2&k=0", "s=48213&t=3&l=3&v=2&m=200", "s=48213&t=3&l=3&v=2&k=0&m=0", "s=48213&t=3&l=3&v=3&k=0&m=200",
    "s=48213&t=3&l=13&v=2&k=0&m=200", "s=48213&t=3&l=3&v=2&d=x&k=0&m=200", "s=48213&t=3&l=3&v=2&k=0&m=999999",
  ]) assert.equal(parseShared(bad), null, bad);
  assert.equal(share.normalize("s=48213&t=3&l=3&v=2&k=0&m=200&x=<script>"), "s=48213&t=3&l=3&v=2&k=0&m=200", "unknown keys are dropped");
  assert.equal(share.normalize("s=48213&t=3&l=3&v=2&k=0&m=200&p=<img>&c=blue"), "s=48213&t=3&l=3&v=2&k=0&m=200", "a forged kite is dropped");
  assert.equal(parseShared("s=12&t=3&l=3&v=2&k=0&m=50&n=" + encodeURIComponent("  রিমা‮\u0000 আক্তার আক্তার আক্তার  "))?.name, "রিমা আক্তার আক্তার আ");
});

test("every bot run makes a link that parses back to itself", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const outcome = play(level * 101, level, "n", CASUAL)!;
    const shared = { seed: level * 101, cuts: outcome.cuts, name: "", look: null, level, mode: "n" as const, lost: outcome.lost, tenths: Math.round(outcome.time * 10), old: false };
    assert.deepEqual(parseShared(sharedHash(shared)), { ...shared, won: outcome.won }, `level ${level}`);
  }
});

test("a kite from ঘুড়ি আর ফানুস flies here; lanterns and junk don't", () => {
  assert.deepEqual(lookFromGhuri("#o=kite&p=maladar&c=green&nm=" + encodeURIComponent("মিতু")), { pattern: "maladar", color: "green" });
  assert.equal(lookFromGhuri("#o=fanush&w=bhalo&c=red"), null);
  assert.equal(lookFromGhuri("#o=kite&p=batman&c=green"), null);
  assert.equal(lookFromGhuri("#o=kite&p=maladar&c=" + "x".repeat(500)), null);
  assert.equal(readLook("tekka", "pink")?.pattern, "tekka");
  assert.equal(new Set(LOOKS.map(look => look.color)).size, LOOKS.length, "six kites, six colours");
});

test("the old best moves into level 1's stars once, and only when there is nothing newer", () => {
  assert.equal(migrateBest({}, "5"), 2);
  assert.equal(migrateBest({}, "9"), 3);
  assert.equal(migrateBest({}, "1"), 1);
  assert.equal(migrateBest({}, "0"), 0, "never cut one: nothing to move");
  assert.equal(migrateBest({}, null), 0);
  assert.equal(migrateBest({}, "99"), 0);
  assert.equal(migrateBest({ 1: 1 }, "9"), 0, "already moved");
});

test("lines: exact numbers, kind comparisons, honest previews", () => {
  assert.equal(seconds(423), "৪২.৩");
  assert.equal(cutLine(5, "রাফি"), "রাফি ৫টা ঘুড়ি কাটল");
  const friend: Shared = { seed: 1, cuts: 3, name: "রাফি", look: null, level: 3, mode: "n", lost: 1, tenths: 400, won: true, old: false };
  assert.equal(compareLine({ won: true, lost: 0, tenths: 500, cuts: 3 }, friend), "রাফির চেয়ে ১টা ঘুড়ি কম হারিয়েছ।");
  assert.equal(compareLine({ won: true, lost: 1, tenths: 380, cuts: 3 }, friend), "রাফির চেয়ে ২.০ সেকেন্ড আগে!");
  assert.equal(compareLine({ won: true, lost: 1, tenths: 420, cuts: 3 }, friend), "আর একটু হলেই! মাত্র ২.০ সেকেন্ড পিছিয়ে।");
  assert.equal(compareLine({ won: false, lost: 3, tenths: 420, cuts: 1 }, friend), "রাফি পার হয়েছে। আরেকবার?");
  assert.equal(previewTitle(friend), "রাফি বংশালের ৩টা ঘুড়িই কেটেছে, ৪০.০ সেকেন্ডে। তুমি পারবে?");
  assert.equal(friendLine({ ...friend, won: false, cuts: 0, lost: 3 }), "রাফি বংশালে একটাও ঘুড়ি কাটতে পারেনি।");
  assert.equal(previewTitle({ ...friend, old: true }), "রাফি ৩টা ঘুড়ি কেটেছে। তুমি পারবে?");
  assert.equal(share.preview(sharedHash(friend)).title, previewTitle(friend));
  assert.ok(share.preview("junk").title.length > 0);
  assert.match(caption({ cuts: 2, level: 1, won: true }), /২টা ঘুড়ি/);
  assert.match(caption({ cuts: 0, level: 1, won: false }), /একটাও/);
  for (const won of [true, false]) for (let lost = 0; lost <= 5; lost++) assert.doesNotMatch(humanLine(won, lost, 2), /হেরে|খারাপ|ব্যর্থ/);
});

test("content meets the SEO limits, says what a link carries, keeps the safety line, and has at least 6 FAQs", () => {
  assert.equal(site.title, "ঘুড়ি কাটাকাটির গেম: সাকরাইনের ভো-কাট্টা");
  assert.equal(site.headline, "সাকরাইনের ছাদে কয়টা ঘুড়ি কাটতে পারবে?");
  assert.ok(site.title.length <= 45, `${site.title.length}`);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `${site.description.length}`);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.steps.length >= 3);
  assert.match(site.privacy.join(" "), /স্কোর/);
  assert.match(site.privacy.join(" "), /নাম/);
  const everything = JSON.stringify(site) + share.preview("").description;
  assert.match(everything, /বিদ্যুতের তারের কাছে না/);
  assert.doesNotMatch(everything, /আপনি|করুন|জুয়া|বাজি ধর|টাকা জিত|এক চাপে টান/);
  const glass = site.faq.filter(item => /কাচ/.test(item.question + item.answer));
  assert.equal(glass.length, 1, "glass string comes up once, as a warning");
  assert.match(glass[0].answer, /এই খেলায় কাচ নেই/);
  assert.equal(everything.normalize("NFC"), everything, "Bangla is NFC");
});
