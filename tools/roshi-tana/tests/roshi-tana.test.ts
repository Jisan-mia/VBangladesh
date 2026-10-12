import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, readLevels, recordLevel, totalStars, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import {
  bannerNote, caption, clearLine, compareLine, duoCaption, duoTitle, feat, humanLine, lossLine, nearMissLine, parseShared, previewTitle, sharedHash, MIN_BEATS,
} from "../lib/link";
import {
  beatPhase, countIn, judge, makeMatch, nearestBeat, periodOf, resume, starsOf, tap, update, windowOf, COUNT_IN, MAX_BEATS, type Match,
} from "../lib/rope";
import { cheer, creak, crowd, drum, grunt, scuff } from "../lib/sound";
import { teamOf, LEVEL_COUNT, TEAMS } from "../lib/teams";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());

/** Steps the same pure rules the page uses at 60 frames a second, feeding scripted tap times (ms on the match clock). */
function play(level: number, seed: number, taps: number[], slow = false, frame = 1000 / 60) {
  const match = makeMatch(level, seed, slow);
  let next = 0;
  for (let t = -400; match.winner === null && t < 200_000; t += frame) {
    while (next < taps.length && taps[next] <= t) tap(match, 0, taps[next++]);
    update(match, t);
  }
  return match;
}

/** Taps once per beat, `mean` ms late on average with `spread` ms of wobble, missing a share `skip` of beats. */
function rhythm(period: number, seed: number, mean: number, spread: number, skip = 0) {
  const r = makeRng(seed), out: number[] = [];
  for (let beat = COUNT_IN; beat < COUNT_IN + MAX_BEATS + 5; beat++) if (r() >= skip) out.push(beat * period + mean + spread * gauss(r));
  return out.sort((a, b) => a - b);
}

/** Taps as fast as a thumb goes, with no regard for the drum. */
function mash(period: number, seed: number, perSecond: number) {
  const r = makeRng(seed), out: number[] = [];
  for (let t = -300 + r() * 100; t < (COUNT_IN + MAX_BEATS + 5) * period; t += (1000 / perSecond) * (0.6 + 0.8 * r())) out.push(t);
  return out;
}

const seeds = Array.from({ length: 40 }, (_, index) => index * 97 + 13);
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

test("the same seed gives the same match, a different seed a different one", () => {
  const period = periodOf(4, false), taps = rhythm(period, 5, 40, 70);
  const a = play(4, 777, taps), b = play(4, 777, taps), c = play(4, 778, taps);
  assert.deepEqual([a.winner, a.beats, a.x, a.sides[1].perfect], [b.winner, b.beats, b.x, b.sides[1].perfect]);
  assert.notDeepEqual([c.beats, c.sides[1].perfect, c.sides[1].good], [a.beats, a.sides[1].perfect, a.sides[1].good]);
});

test("taps are judged by their time against the beat, with a window that leans late", () => {
  const w = windowOf(false);
  assert.equal(judge(0), "perfect");
  assert.equal(judge(-w.perfectEarly), "perfect");
  assert.equal(judge(w.perfectLate), "perfect");
  assert.equal(judge(w.perfectLate + 1), "good");
  assert.equal(judge(-w.early), "good");
  assert.equal(judge(w.late), "good");
  assert.equal(judge(-w.early - 1), "off");
  assert.equal(judge(w.late + 1), "off");
  assert.ok(w.late > w.early, "late taps get more room: the drum reaches the ear late on cheap phones");
  assert.equal(judge(w.late + 20, true), "good", "slow mode widens the window");
  const period = 750;
  assert.deepEqual(nearestBeat(3 * period + 180, period), { beat: 3, offset: 180 });
  assert.deepEqual(nearestBeat(4 * period - 140, period), { beat: 4, offset: -140 });
});

test("the windows never overlap at any tempo, so each tap belongs to one beat", () => {
  for (const slow of [false, true]) {
    for (const level of [0, ...levels]) {
      const w = windowOf(slow), period = periodOf(level, slow);
      assert.ok(w.early + w.late < period * 0.85, `level ${level} slow ${slow}`);
    }
  }
});

test("one pull per beat: a second tap on the same beat slips, so does a tap in the gap", () => {
  const m = makeMatch(1, 1), period = m.period;
  update(m, COUNT_IN * period - 200);
  assert.equal(tap(m, 0, period), "early", "taps in the count-in are ignored");
  assert.equal(m.v, 0);
  assert.equal(tap(m, 0, COUNT_IN * period + 10), "perfect");
  const after = m.v;
  assert.ok(after > 0, "a pull drags the ribbon towards us");
  assert.equal(tap(m, 0, COUNT_IN * period + 60), "extra");
  assert.ok(m.v < after && m.sides[0].combo === 0, "the double tap slips and breaks the combo");
  assert.equal(tap(m, 0, (COUNT_IN + 0.5) * period), "off");
  assert.equal(m.sides[0].slips, 2);
});

test("combos climb, and a beat with no pull breaks them", () => {
  const m = makeMatch(0, 1), period = m.period;
  for (let beat = COUNT_IN; beat < COUNT_IN + 4; beat++) { update(m, beat * period); tap(m, 0, beat * period + 20); }
  assert.equal(m.sides[0].combo, 4);
  update(m, (COUNT_IN + 4) * period + 300);
  assert.equal(m.sides[0].combo, 0);
  assert.equal(m.sides[0].missed, 1);
  assert.equal(m.sides[0].best, 4);
});

test("mashing does worse than tapping on the beat, on every level", () => {
  for (const level of levels) {
    const period = periodOf(level, false);
    for (const rate of [6, 9, 12]) {
      const mashed = seeds.slice(0, 12).map(seed => play(level, seed, mash(period, seed, rate)));
      const steady = seeds.slice(0, 12).map(seed => play(level, seed, rhythm(period, seed, 40, 80, 0.05)));
      const mashWins = mashed.filter(m => m.winner === 0), steadyWins = steady.filter(m => m.winner === 0);
      assert.ok(steadyWins.length > mashWins.length || (mashWins.length > 0 && median(mashWins.map(m => m.beats)) > median(steadyWins.map(m => m.beats))), `level ${level} at ${rate}/s`);
      for (const m of mashWins) assert.notEqual(starsOf(level, m.beats), 3, "a masher never earns 3 stars");
    }
  }
});

test("every level is fair: a steady player wins, a sharp one earns 3 stars, level 1 is a gift", () => {
  for (const level of levels) {
    const period = periodOf(level, false);
    const sharp = seeds.map(seed => play(level, seed, rhythm(period, seed, 30, 35)));
    const steady = seeds.map(seed => play(level, seed, rhythm(period, seed, 40, 80, 0.05)));
    assert.ok(sharp.every(m => m.winner === 0), `sharp wins level ${level}`);
    assert.ok(sharp.filter(m => starsOf(level, m.beats) === 3).length >= sharp.length * 0.7, `3 stars reachable on level ${level}`);
    assert.ok(steady.filter(m => m.winner === 0).length >= steady.length * 0.9, `steady wins level ${level}`);
  }
  const period = periodOf(1, false);
  const first = seeds.map(seed => play(1, seed, rhythm(period, seed, 60, 120, 0.1)));
  assert.ok(first.every(m => m.winner === 0), "a shaky beginner still wins level 1");
  const quick = seeds.map(seed => play(1, seed, rhythm(period, seed, 40, 80, 0.05)));
  assert.ok(median(quick.map(m => m.beats)) * period + COUNT_IN * period < 12_000, "level 1 is won in about ten seconds");
});

test("a dropped-frame phone judges the same taps the same way", () => {
  const period = periodOf(5, false), taps = rhythm(period, 3, 40, 60);
  const smooth = play(5, 42, taps), choppy = play(5, 42, taps, false, 110);
  assert.equal(choppy.winner, smooth.winner);
  assert.equal(choppy.sides[0].perfect, smooth.sides[0].perfect);
  assert.ok(Math.abs(choppy.beats - smooth.beats) <= 1);
});

test("slow mode plays slower with wider windows, and is still won by beats", () => {
  assert.ok(periodOf(5, true) > periodOf(5, false));
  const period = periodOf(5, true);
  const runs = seeds.slice(0, 10).map(seed => play(5, seed, rhythm(period, seed, 60, 110, 0.05), true));
  assert.ok(runs.every(m => m.winner === 0));
});

test("a match always ends, and a stalemate goes to whoever leans", () => {
  const idle = play(0, 1, []);
  assert.equal(idle.winner, -1, "nobody pulled: a draw");
  assert.equal(idle.beats, MAX_BEATS);
  const lost = play(6, 9, []);
  assert.equal(lost.winner, 1, "doing nothing loses to a bot");
  assert.ok(lost.beats <= MAX_BEATS);
});

test("a pause carries on with a fresh count-in and no free pulls", () => {
  const m = makeMatch(2, 5), period = m.period;
  for (let beat = COUNT_IN; beat < COUNT_IN + 3; beat++) { update(m, beat * period); tap(m, 0, beat * period + 10); }
  const t = (COUNT_IN + 3) * period + 100;
  update(m, t);
  resume(m, t);
  assert.equal(m.sides[0].combo, 0);
  assert.ok(countIn(m, t + period) > 0, "the count-in runs again");
  assert.equal(tap(m, 0, Math.ceil(t / period) * period), "early");
  const botBefore = m.sides[1].perfect + m.sides[1].good;
  update(m, (m.playFrom - 1) * period + 10);
  assert.equal(m.sides[1].perfect + m.sides[1].good, botBefore, "the other team waits out the count-in too");
});

test("beat phase and count-in read the clock", () => {
  assert.equal(beatPhase(0, 750), 0);
  assert.equal(beatPhase(375, 750), 0.5);
  assert.equal(beatPhase(-375, 750), 0.5);
  const m = makeMatch(1, 1);
  assert.deepEqual([countIn(m, -100), countIn(m, 10), countIn(m, m.period + 10), countIn(m, 2 * m.period + 10), countIn(m, 3 * m.period + 10)], [3, 3, 2, 1, 0]);
});

test("star thresholds rise with the levels and match starsOf", () => {
  for (const level of levels) {
    const team = teamOf(level);
    assert.ok(team.three < team.two && team.two <= MAX_BEATS && team.three >= MIN_BEATS);
    assert.equal(starsOf(level, team.three), 3);
    assert.equal(starsOf(level, team.three + 1), 2);
    assert.equal(starsOf(level, team.two), 2);
    assert.equal(starsOf(level, team.two + 1), 1);
    if (level > 1) {
      const before = teamOf(level - 1);
      assert.ok(team.bpm > before.bpm && team.perfect > before.perfect && team.three >= before.three, `level ${level} is one small step harder`);
    }
  }
  assert.equal(new Set(TEAMS.map(team => team.name)).size, LEVEL_COUNT);
});

test("no win is ever faster than the rules allow", () => {
  const perfect = (period: number) => Array.from({ length: 40 }, (_, k) => (COUNT_IN + k) * period + 15);
  for (const level of [0, 1, 10]) {
    const m = makeMatch(level, 1);
    const run = play(level, 1, perfect(m.period));
    assert.equal(run.winner, 0);
    assert.ok(run.beats >= MIN_BEATS, `level ${level}: ${run.beats}`);
  }
});

test("level progress is read and saved with the shared helpers", () => {
  let saved = readLevels(null, LEVEL_COUNT);
  saved = recordLevel(saved, 1, starsOf(1, 12));
  saved = recordLevel(saved, 1, 1);
  saved = recordLevel(saved, 2, starsOf(2, 40));
  assert.deepEqual(saved, { 1: 3, 2: 1 });
  assert.equal(unlockedLevel(saved, LEVEL_COUNT), 3);
  assert.equal(totalStars(saved), 4);
  assert.deepEqual(readLevels(JSON.stringify({ 1: 3, 11: 3, 2: 9, x: 1 }), LEVEL_COUNT), { 1: 3 });
  assert.deepEqual(readLevels("{broken", LEVEL_COUNT), {});
});

test("a challenge link round-trips and refuses forged or hostile input", () => {
  const shared = { level: 3, seed: 123456, beats: 14, hits: 12, name: "রাফি" };
  const hash = sharedHash(shared);
  assert.equal(hash, `s=123456&t=14&l=3&h=12&n=${encodeURIComponent("রাফি")}`);
  assert.deepEqual(parseShared(`#${hash}`), shared);
  assert.equal(previewTitle(shared), "রাফি রশি টানাটানিতে ক্লাস ফাইভকে ১৪ টানে হারিয়েছে। তুমি পারবে?");
  assert.equal(feat({ level: 7, beats: 20, name: "" }), "এক বন্ধু রশি টানাটানিতে কলেজের ভাইয়াদের ২০ টানে হারিয়েছে");
  assert.match(bannerNote("রাফি"), /রাফির নিজের ফোনের হিসাব/);
  assert.equal(share.normalize(hash), hash);
  assert.match(share.preview(hash).title, /রাফি/);
  const good = new URLSearchParams(hash);
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ t: "7" }), variant({ t: "61" }), variant({ t: "1.5" }), variant({ t: "-1" }), variant({ t: null }),
    variant({ h: "15" }), variant({ h: "0" }), variant({ h: "07" }), variant({ h: "x" }), variant({ h: null }),
    variant({ l: "11" }), variant({ l: "0" }), variant({ l: "03" }), variant({ l: null }),
    variant({ s: "0" }), variant({ s: "1000000000" }), variant({ s: null }),
    "", "#", "garbage", "s=1&t=10", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
  ]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null);
  }
  assert.ok(parseShared(variant({ l: "10", t: "60", h: "60" })), "a full-time win on the last level is fine");
  const hostile = parseShared(variant({ n: "‮রাফি\u0000" + "ক".repeat(40) }))!;
  assert.ok(hostile.name.length <= 20 && !hostile.name.includes("‮") && !hostile.name.includes("\u0000"));
  assert.equal(share.normalize(variant({ n: "<b>রাফি</b>", x: "1" })), sharedHash({ ...shared, name: "<b>রাফি</b>" }), "unknown keys are dropped");
  assert.ok(share.preview("junk").title.length > 0);
  assert.equal(share.tally, undefined, "no tally: nothing to count");
});

test("result lines are exact and kind", () => {
  assert.equal(compareLine(12, 15, "রাফি"), "রাফির লেগেছিল ১৫ টান, তোমার ১২।");
  assert.equal(compareLine(15, 15, "মিতু"), "সমান সমান। মিতুরও লেগেছিল ১৫ টান।");
  assert.equal(compareLine(18, 15, ""), "বন্ধুর লেগেছিল ১৫ টান, তোমার ১৮। আর ৩ টান কম হলেই সমান।");
  assert.equal(nearMissLine(1, 15), "আর ২ টান কম লাগলে ৩ তারা।");
  assert.equal(nearMissLine(1, 13), "");
  assert.match(lossLine({ slips: 20, hits: 5, missed: 2, timeout: false }), /^২০বার চাপ পড়েছে তালের বাইরে/);
  assert.match(lossLine({ slips: 0, hits: 4, missed: 30, timeout: true }), /৩০টা ঢোলে টান পড়েনি/);
  assert.match(lossLine({ slips: 2, hits: 30, missed: 3, timeout: true }), /সময় শেষে/);
  assert.equal(humanLine({ level: 10, beats: 50 }), "হেডস্যারের দলও চুনের দাগ পার হয়ে এল।");
  assert.notEqual(humanLine({ level: 2, beats: 10 }), humanLine({ level: 2, beats: 50 }));
  for (const level of levels) assert.ok(clearLine(level).length > 10);
  assert.equal(caption({ level: 1, beats: 11 }), "রশি টানাটানিতে ক্লাস থ্রিকে ১১ টানে হারালাম। তুমি কয় টানে পারবে?");
  assert.equal(duoTitle({ winner: 1, name: "" }), "নীল দল জিতল");
  assert.equal(duoTitle({ winner: 0, name: "জাহিদ" }), "জাহিদের দল জিতল");
  assert.match(duoCaption({ winner: 0, beats: 22, name: "" }), /হলুদ দল জিতল, ২২ টানে/);
  const all = [...levels.map(clearLine), humanLine({ level: 3, beats: 12 }), humanLine({ level: 3, beats: 22 }), humanLine({ level: 3, beats: 40 })].join(" ");
  assert.doesNotMatch(all, /অসাধারণ|দারুণ|সেরা|!!|আপনি|করুন/);
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^রশি টানাটানি/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /ক্যারম|পেনাল্টি কিক/.test(item.answer)));
  for (const word of ["নাম", "লেভেল", "সিড", "টানে"]) assert.match(site.privacy.join(" "), new RegExp(word));
  assert.doesNotMatch(JSON.stringify(site), /আপনি|করুন|দেখুন|বাজি|জিতে নাও|পুরস্কার|টাকা জিত/);
});

test("sounds never throw without audio (no window, no AudioContext)", () => {
  assert.doesNotThrow(() => { drum("strong"); drum("weak", 0.05); drum("count"); grunt(); creak(); scuff(); cheer(); const hum = crowd(); hum.set(0.5); hum.stop(); });
});

test("the match type carries everything the page draws", () => {
  const m: Match = makeMatch(3, 9);
  assert.equal(m.bot, true);
  assert.equal(makeMatch(0, 9).bot, false);
  assert.equal(m.playFrom, COUNT_IN);
});
