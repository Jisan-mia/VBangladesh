import assert from "node:assert/strict";
import test from "node:test";
import { challengeHash, makeRng, pick } from "../../../shared/game-core";
import { site } from "../content";
import { cues } from "../lib/cues";
import { act, BABU, CHOR, DAKAT, DEFAULT_POINTS, GUARD_MS, MAX_ROUNDS, POLICE, ROUND_CHOICES, cleanPlayer, dative, dealFor, deals, isFinale, nameOf, newPlay, restore, roundPoints, saveOf, standings, suspects, totals, type Action, type Game, type Play, type Role, type Saved } from "../lib/game";
import { evenings } from "../lib/levels";
import { eveningStats, friendBanner, gameHash, humanLine, parseGame, previewTitle, recordLine, roundNews, scoreLine, versusLine } from "../lib/result";
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

// A clock that always moves past the tap guard, so the flow tests read like a family playing at a normal pace.
let clock = 0;
const step = (play: Play, action: Action, gap = 2000) => act(play, action, clock += gap);
/** One full hand-out: each player taps a chit, holds it open, and presses দেখেছি. */
function handOut(play: Play) {
  for (let turn = 0; turn < 4; turn++) play = step(step(step(play, { type: "pick", slot: 0 }), { type: "saw" }), { type: "done" });
  return play;
}
/** Plays a round to the reveal, the police naming `which` (0 or 1) of the two suspects. */
function round(play: Play, which: number) {
  play = step(handOut(play), { type: "call" });
  const pair = suspects(dealFor(play.game.seed, play.game.caught.length));
  return step(step(play, { type: "accuse", seat: pair[which] }), { type: "open" });
}

test("the flow: a tap on a chit is the hand-off, nobody moves on before seeing, the police only names a suspect", () => {
  let play: Play = step(newPlay(game(), 2), { type: "start" });
  assert.equal(play.phase, "pass");
  assert.equal(step(play, { type: "pick", slot: 4 }), play, "there are only four chits");
  play = step(play, { type: "pick", slot: 2 });
  assert.deepEqual([play.phase, play.turn, play.slot], ["peek", 0, 2]);
  assert.equal(step(play, { type: "done" }).phase, "peek", "nobody moves on before seeing their chit");
  play = step(step(play, { type: "saw" }), { type: "done" });
  assert.deepEqual([play.phase, play.turn], ["pass", 1]);
  assert.equal(step(play, { type: "pick", slot: 3 }), play, "the second player picks from three");
  for (let turn = 1; turn < 4; turn++) play = step(step(step(play, { type: "pick", slot: 0 }), { type: "saw" }), { type: "done" });
  assert.equal(play.phase, "call");
  play = step(play, { type: "call" });
  const roles = dealFor(play.game.seed, 0);
  assert.equal(step(play, { type: "accuse", seat: roles.indexOf(POLICE) }), play);
  assert.equal(step(play, { type: "accuse", seat: roles.indexOf(BABU) }), play);
  play = step(play, { type: "accuse", seat: roles.indexOf(CHOR) });
  assert.deepEqual([play.phase, play.accused, play.game.caught], ["roll", roles.indexOf(CHOR), []], "the drum rolls before anything is scored");
  play = step(play, { type: "open" });
  assert.deepEqual([play.phase, play.game.caught], ["reveal", [true]]);
  play = step(play, { type: "next" });
  assert.equal(play.phase, "pass");
  assert.equal(step(play, { type: "accuse", seat: 0 }), play, "actions out of turn change nothing");
});

test("a tap that lands inside a screen's guard is dropped; programmed steps are not", () => {
  const start = act(newPlay(game(), 5), { type: "start" }, 10_000);
  assert.equal(act(start, { type: "pick", slot: 0 }, 10_000 + GUARD_MS.pass - 1), start, "a double tap on চিরকুট তোলো doesn't pick a chit");
  const peek = act(start, { type: "pick", slot: 0 }, 10_000 + GUARD_MS.pass);
  assert.equal(peek.phase, "peek");
  assert.equal(act(peek, { type: "saw" }, peek.since + 1).seen, true, "holding the chit open is never blocked");
  assert.equal(act(peek, { type: "breath" }, 99_000).since, 99_000, "coming back from the menu restarts the guard");
});

test("bug 1 (NoTapPastResult): a second Enter as the scorecard appears never wipes the evening", () => {
  let play = step(newPlay(game(), 5), { type: "start" });
  play = round(play, 0);
  // You press এখানেই শেষ করো, then Enter lands 700 ms later (the live replay's timing) and again at once.
  const over = act(play, { type: "end" }, clock += 2000);
  assert.deepEqual([over.phase, over.done], ["over", true]);
  assert.equal(act(over, { type: "again", seed: 9 }, over.since + 700), over, "inside the scorecard's 1.2 s guard");
  assert.equal(act(over, { type: "again", seed: 9 }, over.since), over);
  assert.equal(act(over, { type: "more" }, over.since + 300), over);
  // The same for ফল দেখো at the limit.
  let full = step(newPlay(game(), 1), { type: "start" });
  full = round(full, 1);
  const last = act(full, { type: "next" }, clock += 2000);
  assert.equal(last.phase, "over");
  assert.equal(act(last, { type: "again", seed: 9 }, last.since + 949), last);
  // Even a deliberate আরেক সন্ধ্যা goes to the title screen first, names and points kept; starting is a second tap.
  const again = act(last, { type: "again", seed: 9 }, last.since + GUARD_MS.over);
  assert.deepEqual([again.phase, again.game.caught, again.game.names], ["setup", [], last.game.names]);
});

test("bug 2 (FinishedStaysFinished): an evening ended early stays finished after a reload", () => {
  let play = step(newPlay(game(), 5), { type: "start" });
  play = round(play, 0);
  const over = step(play, { type: "end" });
  const saved = JSON.parse(JSON.stringify(saveOf(over, gameHash(over.game)))) as Saved;
  assert.equal(saved.d, 1);
  const back = restore(saved, hash => parseGame(hash, 0), 777);
  assert.deepEqual([back.phase, back.game.caught, back.game.seed, back.game.names], ["setup", [], 777, over.game.names], "only names and points come back");
  // An evening really in progress still comes back to continue.
  const midway = restore(saveOf(play, gameHash(play.game)), hash => parseGame(hash, 0), 777);
  assert.deepEqual([midway.phase, midway.game.caught.length, midway.limit], ["setup", 1, 5]);
  assert.equal(step(midway, { type: "start" }).phase, "pass");
  // Old saves (no `d`) still load; junk and hostile saves start fresh.
  const old = restore({ h: gameHash(play.game), l: 5 }, hash => parseGame(hash, 0), 1);
  assert.equal(old.game.caught.length, 1);
  assert.equal(restore({ h: gameHash(play.game), l: 1 }, hash => parseGame(hash, 0), 1).game.caught.length, 0, "every round played: finished");
  for (const junk of [null, {}, { h: "s=x" }, { h: gameHash(play.game), l: -4 }, { h: "s=1&t=99&g=1", l: 5 }] as Saved[]) {
    const fresh = restore(junk, hash => parseGame(hash, 0), 5);
    assert.equal(fresh.phase, "setup");
    assert.ok(fresh.limit >= 1 && fresh.limit <= MAX_ROUNDS);
  }
});

test("bug 3 (DrumStopsWithRound): leaving the drumroll by any way but the reveal cuts the drum", () => {
  let play = step(handOut(step(newPlay(game(), 5), { type: "start" })), { type: "call" });
  const pair = suspects(dealFor(play.game.seed, 0));
  const roll = step(play, { type: "accuse", seat: pair[0] });
  assert.deepEqual(cues(play, roll), ["drum"]);
  const reset = step(roll, { type: "reset", seed: 3 });
  assert.ok(cues(roll, reset).includes("hush"), "নতুন করে শুরু during the drum");
  const opened = step(roll, { type: "open" });
  assert.ok(!cues(roll, opened).includes("hush"), "the reveal lets the last beat land");
  assert.ok(cues(roll, opened).some(cue => cue === "caught" || cue === "missed"));
  // The pause menu cuts scheduled notes itself (silenceScheduled in the player), and the roll timer is an effect keyed on paused.
  play = roll;
  assert.equal(step(play, { type: "breath" }).phase, "roll", "resuming keeps the roll; the component drums it again from the first beat");
});

test("the fanfare plays once per scorecard, and the evening's start has its clink", () => {
  const setup = newPlay(game(), 1), start = step(setup, { type: "start" });
  assert.deepEqual(cues(setup, start), ["clink"]);
  const over = step(round(start, 0), { type: "next" });
  assert.equal(over.phase, "over");
  assert.deepEqual(cues(round(start, 0), over), ["fanfare"]);
  assert.deepEqual(cues(over, step(over, { type: "breath" })), [], "nothing on the same screen");
  const more = step(over, { type: "more" });
  assert.deepEqual([more.phase, more.limit, more.done], ["pass", 6, false]);
});

test("the finale: the last round of every evening is শেষ দান", () => {
  for (const evening of evenings) {
    let play = step(newPlay(game(), evening.rounds), { type: "start" });
    for (let r = 0; r < evening.rounds - 1; r++) { assert.equal(isFinale(play), false); play = step(round(play, r % 2), { type: "next" }); }
    assert.equal(isFinale(play), true, `${evening.name}: round ${evening.rounds}`);
    play = round(play, 0);
    assert.equal(isFinale(play), true, "still the finale on its reveal");
    assert.equal(step(play, { type: "next" }).phase, "over");
  }
  assert.equal(evenings.filter(item => item.recommended).length, 1, "one evening is marked সুপারিশ");
  assert.deepEqual([...ROUND_CHOICES], [5, 10, 15], "the old round choices are unchanged");
});

/** A headless family: the police names the real thief with probability `sharp`. Returns the finished evening. */
function family(seed: number, rounds: number, sharp: number) {
  const rng = makeRng(seed * 7919 + 13);
  let play = step(newPlay(game({ seed }), rounds), { type: "start" });
  while (play.phase !== "over") {
    const roles = dealFor(play.game.seed, play.game.caught.length);
    const pair = suspects(roles), right = pair.indexOf(roles.indexOf(CHOR));
    play = step(round(play, rng() < sharp ? right : 1 - right), { type: "next" });
  }
  return play;
}

test("headless evenings: fair seats, conserved points, and a finale that still matters", () => {
  for (const evening of evenings) for (const sharp of [0.5, 0.65]) {
    const wins = [0, 0, 0, 0];
    let turned = 0;
    const runs = 1500;
    for (let seed = 1; seed <= runs; seed++) {
      const play = family(seed, evening.rounds, sharp);
      assert.equal(play.game.caught.length, evening.rounds);
      assert.equal(totals(play.game).reduce((a, b) => a + b, 0), evening.rounds * 2300, "a swap never creates or loses points");
      wins[standings(play.game)[0].seat]++;
      const before = standings({ ...play.game, caught: play.game.caught.slice(0, -1) });
      if (before[0].seat !== standings(play.game)[0].seat || before[0].total === before[1].total) turned++;
    }
    for (const count of wins) assert.ok(count > runs * 0.19 && count < runs * 0.31, `${evening.name} @${sharp}: every seat wins about a quarter (${wins})`);
    const share = turned / runs, target = evening.rounds === 5 ? 0.28 : evening.rounds === 10 ? 0.17 : 0.13;
    assert.ok(share >= target, `${evening.name} @${sharp}: the last round can still change the winner (${share.toFixed(2)} ≥ ${target})`);
  }
});

test("end-screen stats are real: catches, escapes, the most-often বাবু and the best police", () => {
  const evening = game({ caught: [true, false, true, true, false] });
  const stats = eveningStats(evening), all = deals(evening.seed, 5);
  assert.deepEqual([stats.rounds, stats.caught, stats.escaped], [5, 3, 2]);
  const babu = [0, 0, 0, 0];
  all.forEach(roles => babu[roles.indexOf(BABU)]++);
  if (stats.babu) assert.equal(stats.babu.times, Math.max(...babu));
  assert.equal(eveningStats(game({ caught: [false] })).police, null, "nobody caught anyone: no best police");
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

test("the near-miss line names the exact gap to the record, only when one round could close it", () => {
  const evening = game({ caught: [true, true, false] }), top = standings(evening)[0].total;
  assert.equal(recordLine(evening, top + 199), `এই ফোনের রেকর্ড ${new Intl.NumberFormat("bn-BD", { useGrouping: false }).format(top + 199)}। আর ২০০ পয়েন্ট হলেই নতুন রেকর্ড হতো।`);
  assert.match(recordLine(evening, top + 1), /আর ২ পয়েন্ট/);
  assert.match(recordLine(evening, top), /^এই ফোনে এক খেলায় সবচেয়ে বেশি: /, "a first evening is its own record");
  assert.match(recordLine(evening, top + 5000), /^এই ফোনে এক খেলায় সবচেয়ে বেশি: /);
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
  assert.ok(site.faq.length >= 6);
  assert.ok(site.steps.length >= 3 && site.privacy.some(line => line.includes("লিংক")));
  assert.ok(!/টাকা জিত|বাজি ধর|জুয়া/.test(JSON.stringify(site)), "no stakes copy");
});
