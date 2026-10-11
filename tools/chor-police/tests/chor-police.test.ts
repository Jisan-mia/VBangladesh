import assert from "node:assert/strict";
import test from "node:test";
import { challengeHash, makeRng, pick } from "../../../shared/game-core";
import { site } from "../content";
import { act, BABU, CHOR, DAKAT, DEFAULT_POINTS, MAX_ROUNDS, POLICE, cleanPlayer, dative, dealFor, deals, nameOf, newPlay, roundPoints, standings, suspects, totals, type Game, type Play, type Role } from "../lib/game";
import { friendBanner, gameHash, humanLine, parseGame, previewTitle, roundNews, scoreLine, versusLine } from "../lib/result";
import { share } from "../share";

const game = (overrides: Partial<Game> = {}): Game => ({ seed: 48213, names: ["আম্মু", "ভাইয়া", "আপু", "আমি"], points: [...DEFAULT_POINTS], caught: [], occasion: "eid", ...overrides });

test("the same seed deals the same chits on every phone; every deal is one of each role", () => {
  assert.deepEqual(deals(48213, 12), deals(48213, 12));
  assert.notDeepEqual(deals(1, 12), deals(2, 12));
  assert.deepEqual(deals(7, 3), deals(7, 10).slice(0, 3), "earlier rounds don't change when more are dealt");
  assert.deepEqual(dealFor(7, 4), deals(7, 5)[4]);
  const chorSeats = [0, 0, 0, 0];
  for (let seed = 1; seed <= 2000; seed++) for (const roles of deals(seed, 3)) {
    assert.deepEqual([...roles].sort(), [BABU, POLICE, DAKAT, CHOR]);
    chorSeats[roles.indexOf(CHOR)]++;
  }
  for (const count of chorSeats) assert.ok(count > 1300 && count < 1700, `every seat is the thief about a quarter of the time (${chorSeats})`);
});

test("scoring: a catch keeps everyone's points; a miss swaps police and thief", () => {
  const roles: Role[] = [CHOR, BABU, POLICE, DAKAT];
  assert.deepEqual(roundPoints(roles, true, DEFAULT_POINTS), [0, 1000, 800, 500]);
  assert.deepEqual(roundPoints(roles, false, DEFAULT_POINTS), [800, 1000, 0, 500]);
  assert.deepEqual(roundPoints(roles, false, [100, 80, 60, 40]), [80, 100, 40, 60], "house points swap the same way");
  const evening = game({ caught: [true, false, true, true, false] });
  const sum = totals(evening).reduce((a, b) => a + b, 0);
  assert.equal(sum, 5 * 2300, "a swap never creates or loses points");
  const rows = standings(evening);
  assert.ok(rows.every((row, index) => index === 0 || rows[index - 1].total >= row.total));
});

test("the police always chooses between the ডাকাত and the চোর, listed by seat", () => {
  for (let seed = 1; seed < 300; seed++) {
    const roles = dealFor(seed, 0), pair = suspects(roles);
    assert.equal(pair.length, 2);
    assert.ok(pair[0] < pair[1], "seat order, never role order");
    assert.deepEqual(pair.map(seat => roles[seat]).sort(), [DAKAT, CHOR]);
  }
});

test("names: cleaned, capped at 16, commas gone, defaults and Bangla dative", () => {
  assert.equal(cleanPlayer("  রা‮ফি,  ভাই "), "রাফি ভাই");
  assert.equal([...cleanPlayer("ক".repeat(40))].length, 16);
  assert.equal(nameOf(["", " ", "x", ""], 1), "দ্বিতীয়জন");
  assert.equal(dative("রাফি"), "রাফিকে");
  assert.equal(dative("জাহিদ"), "জাহিদকে");
  assert.equal(dative("Rafi"), "Rafi-কে");
});

test("the flow can't skip a peek, can't accuse বাবু or পুলিশ, and ends at the round limit", () => {
  let play: Play = newPlay(game(), 2);
  play = act(play, { type: "start" });
  assert.equal(play.phase, "pass");
  play = act(play, { type: "ready" });
  assert.equal(act(play, { type: "done" }).phase, "peek", "nobody moves on before seeing their chit");
  play = act(act(play, { type: "saw" }), { type: "done" });
  assert.deepEqual([play.phase, play.turn], ["pass", 1]);
  for (let turn = 1; turn < 4; turn++) play = act(act(act(play, { type: "ready" }), { type: "saw" }), { type: "done" });
  assert.equal(play.phase, "call");
  play = act(play, { type: "call" });
  const roles = dealFor(play.game.seed, 0);
  assert.equal(act(play, { type: "guess", seat: roles.indexOf(POLICE) }).phase, "guess");
  assert.equal(act(play, { type: "guess", seat: roles.indexOf(BABU) }).phase, "guess");
  play = act(play, { type: "guess", seat: roles.indexOf(CHOR) });
  assert.deepEqual([play.phase, play.game.caught], ["reveal", [true]]);
  const paused = act(play, { type: "pause" });
  assert.equal(paused.phase, "setup");
  assert.equal(act(paused, { type: "start" }).phase, "pass", "resume goes on to the next round");
  play = act(play, { type: "next" });
  assert.equal(play.phase, "pass");
  assert.equal(act(play, { type: "again", seed: 9 }).game.caught.length, 0);
  assert.equal(act(play, { type: "guess", seat: 0 }), play, "actions out of turn change nothing");
});

test("headless evenings: scripted guesses through many rounds end sanely", () => {
  for (let seed = 1; seed <= 200; seed++) {
    const rng = makeRng(seed * 31);
    let play = act(newPlay(game({ seed }), 10), { type: "start" });
    let steps = 0;
    while (play.phase !== "over" && steps++ < 500) {
      if (play.phase === "pass") play = act(play, { type: "ready" });
      else if (play.phase === "peek") play = act(act(play, { type: "saw" }), { type: "done" });
      else if (play.phase === "call") play = act(play, { type: "call" });
      else if (play.phase === "guess") { const pair = suspects(dealFor(play.game.seed, play.game.caught.length)); play = act(play, { type: "guess", seat: pair[pick(rng, 2)] }); }
      else if (play.phase === "reveal") play = act(play, { type: "next" });
    }
    assert.equal(play.phase, "over");
    assert.equal(play.game.caught.length, 10);
    const scores = totals(play.game);
    assert.equal(scores.reduce((a, b) => a + b, 0), 10 * 2300);
    assert.ok(scores.every(score => score >= 0 && score <= 10 * 1000));
    const more = act(play, { type: "more" });
    assert.deepEqual([more.phase, more.limit], ["pass", 15]);
  }
});

test("card lines: tie, close, one round, every catch, no catch, a runaway", () => {
  const find = (want: (g: Game) => boolean, base: Partial<Game>) => {
    for (let seed = 1; seed < 20000; seed++) { const candidate = game({ ...base, seed }); if (want(candidate)) return candidate; }
    throw new Error("no seed found");
  };
  const gap = (g: Game) => { const [a, b] = standings(g); return a.total - b.total; };
  assert.equal(humanLine(find(g => gap(g) === 0, { caught: [true, true] })), "সমান সমান! শেষ দানটা কে জিতবে?");
  assert.equal(humanLine(game({ caught: [true] })), "মাত্র এক দান! আসল মজা তো সামনে।");
  assert.equal(humanLine(find(g => gap(g) > 0 && gap(g) <= 1000, { caught: [true, false, true] })), "এক দানের ব্যবধান!");
  assert.equal(humanLine(find(g => gap(g) > 1000 && gap(g) < 3000, { caught: [true, true, true, true] })), "একটা চোরও পালাতে পারেনি!");
  assert.equal(humanLine(find(g => gap(g) > 1000 && gap(g) < 3000, { caught: [false, false, false, false] })), "চোরেরা আজ খুব চালাক, একবারও ধরা পড়েনি!");
  const runaway = find(g => gap(g) >= 3000, { caught: [true, false, true, false, true, false, true, false] });
  assert.match(humanLine(runaway), /হাতেই উঠেছে/);
  assert.match(scoreLine(game({ caught: [true] })), /^[^·]+ ১০০০ · /);
});

test("round news says who the thief was, and the cost of a wrong guess", () => {
  const roles: Role[] = [CHOR, BABU, POLICE, DAKAT];
  assert.equal(roundNews(game(), roles, true).title, "ঠিক ধরেছে! চোর ছিল আম্মু।");
  const miss = roundNews(game(), roles, false);
  assert.match(miss.title, /আমি তো ডাকাত, চোর ছিল আম্মু/);
  assert.match(miss.sub, /৮০০/);
});

test("links round-trip, rebuild the scoreboard and never carry roles", () => {
  const evening = game({ caught: [true, false, true] });
  const hash = gameHash(evening);
  assert.ok(!/চোর|পুলিশ|বাবু|ডাকাত/.test(decodeURIComponent(hash)));
  assert.deepEqual(parseGame(hash), evening);
  assert.equal(share.normalize(hash), hash);
  const custom = game({ caught: [false], points: [100, 80, 60, 0], occasion: "aj", names: ["", "", "", ""] });
  assert.deepEqual(parseGame(gameHash(custom)), custom);
  assert.match(previewTitle(evening), /^ঈদের রাতের চোর-পুলিশে (জিতল|.* সমান সমান)/);
  assert.match(friendBanner(evening), /ঈদের রাতের চোর-পুলিশ/);
  assert.match(share.preview(hash).title, /তোমাদের বাসায় কে চোর হয়\?$/);
});

test("share rejects hostile or doctored links and caps names", () => {
  const evening = game({ caught: [true, true] });
  const top = standings(evening)[0].total;
  const link = (extra: Record<string, string>, target = top, seed = evening.seed) => challengeHash({ seed, target, extra });
  assert.equal(share.normalize(link({ g: "11", p: "a,b,c,d" }, top + 1)), null, "a total that doesn't match the rounds");
  assert.equal(share.normalize(link({ g: "" }, 0)), null, "an empty scoreboard isn't a link");
  assert.equal(share.normalize(link({ g: "1".repeat(MAX_ROUNDS + 1) }, 1000)), null);
  assert.equal(share.normalize(link({ g: "12" })), null);
  assert.equal(share.normalize(link({ g: "11", p: "a,b,c" })), null, "exactly four names");
  assert.equal(share.normalize(link({ g: "11", v: "10000-800-500-0" })), null);
  assert.equal(share.normalize(link({ g: "11", v: "1000-800-500" })), null);
  assert.equal(share.normalize(link({ g: "11", o: "hartal" })), null);
  assert.equal(share.normalize("s=abc&t=1&g=1"), null);
  assert.equal(share.normalize("s=1&t=1&g=1&x=" + "a".repeat(700)), null);
  const messy = share.normalize(link({ g: "11", p: `‮${"ক".repeat(30)},b\u0000,,  d  ` }));
  assert.ok(messy);
  const names = parseGame(messy)!.names;
  assert.equal([...names[0]].length, 16);
  assert.deepEqual(names.slice(1), ["b", "", "d"]);
  assert.equal(share.preview("junk").title, "চোর-ডাকাত-পুলিশ-বাবু: চিরকুট তোলো, চোর ধরো");
});

test("comparing with the home that sent the link is kind and only like with like", () => {
  const mine = game({ seed: 11, caught: [true, true, false] }), theirs = game({ seed: 12, caught: [true, false, true] });
  const line = versusLine(mine, theirs);
  assert.ok(line.length > 0 && !/হেরে/.test(line));
  assert.equal(versusLine(mine, game({ caught: [true] })), "", "different number of rounds: no comparison");
  assert.equal(versusLine(mine, game({ seed: 12, caught: [true, false, true], points: [100, 80, 60, 0] })), "");
});

test("content meets the SEO limits and says what a link carries", () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  assert.ok(site.title.startsWith("চোর পুলিশ খেলা"));
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 5);
  assert.ok(site.steps.length >= 3 && site.privacy.some(line => line.includes("লিংক")));
  assert.ok(!/টাকা জিত|বাজি ধর|জুয়া/.test(JSON.stringify(site)), "no stakes copy");
});
