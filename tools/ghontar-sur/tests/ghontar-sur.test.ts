// The rules: tunes, levels, the run's reducer, stars, links and the words around the game.
import assert from "node:assert/strict";
import test from "node:test";
import { cleanName } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import { ENDLESS_SPEC, answerBell, beatMs, callMs, makeDeal, makeEndless, onMs, roundCount, roundLen, type Deal } from "../lib/deal";
import { LEVELS, LEVEL_COUNT, PER_WORLD, WORLDS, changeKinds, changes, finaleName, isFinale, levelAt, maxPoints, worldOf } from "../lib/levels";
import { bannerNote, bn, cardLine, caption, clearLine, compareLine, dayLabel, dhakaDate, endlessNear, feat, isDailySeed, missLine, nearLine, parseShared, previewTitle, sharedHash } from "../lib/links";
import * as R from "../lib/run";
import { nextStar, starsOf } from "../lib/score";
import { beatsOf, makeTune } from "../lib/tune";
import { PLAYERS, play } from "./bot";

const T = R.TIMING;
/** Runs a deal from the title to your first turn, returning the run and the clock. */
function toAnswer(deal: Deal, from?: R.Run, at = 0) {
  let run = from ?? R.begin(R.ready(), deal, at, T), now = at;
  for (let guard = 0; run.phase !== "answer" && guard < 20; guard++) { now = run.since + run.dur + 0.01; run = R.tick(run, deal, now, T); }
  assert.equal(run.phase, "answer");
  return { run, now };
}
/** Taps a whole round back correctly, one beat apart. */
function echo(deal: Deal, run: R.Run, now: number, beats = 1) {
  let last: R.TapResult = { run, kind: "ignored", grade: null };
  const beat = beatMs(deal, run.round, 1), round = run.round, len = roundLen(deal, round);
  for (let index = 0; index < len; index++) {
    now += index === 0 ? 400 : (deal.spec.reverse ? 1 : deal.tune.notes[index - 1].gap) * beat * beats;
    last = R.tap(last.run.phase === "answer" ? last.run : run, deal, answerBell(deal, round, index), now, T);
  }
  return { ...last, now };
}

test("the same seed gives the same tune; the tune never has a bell three times in a row; every bell and every rest is where the level says", () => {
  assert.deepEqual(makeDeal(5, 77).tune, makeDeal(5, 77).tune);
  assert.notDeepEqual(makeDeal(5, 77).tune, makeDeal(5, 78).tune);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const spec = levelAt(level);
    for (let seed = 1; seed <= 200; seed++) {
      const { tune } = makeDeal(level, seed * 6007), notes = tune.notes;
      assert.equal(notes.length, spec.phrases * spec.size, `level ${level}`);
      assert.deepEqual(tune.ends, Array.from({ length: spec.phrases }, (_, p) => (p + 1) * spec.size));
      let repeats = 0, rests = 0;
      notes.forEach((note, at) => {
        assert.ok(note.bell >= 0 && note.bell < spec.bells, `bell ${note.bell}`);
        assert.ok(note.gap === 1 || note.gap === 2);
        if (at > 0 && note.bell === notes[at - 1].bell) repeats++;
        if (at > 1) assert.ok(!(note.bell === notes[at - 1].bell && note.bell === notes[at - 2].bell), `three in a row, level ${level} seed ${seed}`);
        if (note.gap === 2) { rests++; assert.ok(at % spec.size < spec.size - 1, "a rest is never at a phrase's end"); }
      });
      if (!spec.written) {
        if (spec.repeat) assert.ok(repeats >= 1, `level ${level} teaches the repeat`); else assert.equal(repeats, 0, `level ${level} has no repeat yet`);
        assert.equal(rests, spec.rests, `level ${level} rests`);
        assert.ok(notes.some(note => note.bell === spec.bells - 1), `level ${level}: the newest bell is heard`);
        if (spec.rests) assert.equal(notes.slice(0, spec.size).filter(note => note.gap === 2).length, 1, "round one already holds the first rest");
        if (notes.length >= spec.bells) for (let bell = 0; bell < spec.bells; bell++) assert.ok(notes.some(note => note.bell === bell), `level ${level} uses bell ${bell}`);
      }
    }
  }
});

test("the ladder: 3 worlds × 8, each level adds one thing, each world ends on a named written tune", () => {
  assert.equal(LEVEL_COUNT, 24);
  assert.equal(WORLDS.length, 3);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const spec = levelAt(level);
    assert.equal(isFinale(level), level % PER_WORLD === 0);
    assert.equal(Boolean(spec.written), isFinale(level), `level ${level}: only finales are written`);
    assert.equal(spec.rhythm, worldOf(level) === 1);
    assert.equal(spec.reverse, worldOf(level) === 2);
    assert.ok(spec.bells >= 3 && spec.bells <= 5);
    if (level % PER_WORLD !== 1) assert.equal(changeKinds(level).length, 1, `level ${level} teaches exactly one new thing: ${changeKinds(level)}`);
    else if (level > 1) assert.deepEqual(changes(level), ["নতুন আসর"]);
    assert.ok(spec.lesson.length > 10 && changes(level).length <= 2);
  }
  assert.deepEqual(WORLDS.map(world => world.finale), ["মেলার ঘণ্টা", "যাত্রাপালার ডাক", "শেষ রাতের সাড়া"]);
  assert.equal(finaleName(8), "মেলার ঘণ্টা");
  assert.equal(finaleName(7), "");
  assert.equal(makeDeal(8, 1).tune.notes.length, 12);
  assert.deepEqual(makeDeal(8, 1).tune, makeDeal(8, 999).tune, "a written finale is the same tune every time");
  assert.ok(makeDeal(16, 1).tune.notes.some(note => note.gap === 2), "the yatra tune has rests");
  assert.ok(makeDeal(24, 1).spec.reverse);
  for (const level of [1, 9, 17]) assert.ok(levelAt(level).phrases * levelAt(level).size <= 4, "a world opens with a short tune");
});

test("timing: no beat faster than 2.5 flashes a second, a dark gap between two flashes of one bell, calls end with a quiet tail", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const beat = beatMs(makeDeal(level, 1), 0, 1);
    assert.ok(beat >= 400, `level ${level}`);
    assert.ok(beat - onMs(beat) >= 160, `level ${level}: dark gap`);
    assert.ok(beatMs(makeDeal(level, 1), 0, R.SLOW_TIMING.scale) > beat);
  }
  const deal = makeDeal(1, 3), beat = beatMs(deal, 0, 1);
  assert.equal(callMs(deal, 3, beat), 2 * beat + onMs(beat) + 320);
  assert.deepEqual(beatsOf([{ bell: 0, gap: 1 }, { bell: 1, gap: 2 }, { bell: 2, gap: 1 }]), [0, 1, 3]);
  // the endless run keeps the old beat: 760 ms for 1–5 notes, 40 ms faster every 5, never under 400
  const endless = makeEndless(5);
  assert.deepEqual([1, 5, 6, 11, 46, 99].map(len => beatMs(endless, len - 1, 1)), [760, 760, 720, 680, 400, 400]);
});

test("a run: lead-in → call → your turn → cheer → the next round; a slip shows the answer and replays the call", () => {
  const deal = makeDeal(3, 11);                        // two phrases of three
  assert.equal(deal.tune.ends.length, 2);
  let { run, now } = toAnswer(deal);
  assert.equal(run.heard, 1);
  assert.equal(R.tap(R.ready(), deal, 0, 0, T).kind, "ignored", "no taps on the title");
  const wrong = (answerBell(deal, 0, 0) + 1) % deal.spec.bells;
  let step = R.tap(run, deal, wrong, now + 300, T);
  assert.equal(step.kind, "miss");
  assert.deepEqual([step.run.phase, step.run.hearts, step.run.expected, step.run.picked, step.run.missAt], ["miss", 2, answerBell(deal, 0, 0), wrong, 0]);
  assert.equal(R.tap(step.run, deal, 0, now + 400, T).kind, "ignored", "no taps while the right bell is shown");
  ({ run, now } = toAnswer(deal, step.run, now + 300));
  assert.equal(run.heard, 2, "the call played again");
  const done = echo(deal, run, now);
  assert.equal(done.kind, "round");
  assert.equal(done.run.phase, "cheer");
  assert.equal(done.run.points, 3 * 10, "no clean-round bonus after a slip");
  ({ run, now } = toAnswer(deal, done.run, done.now));
  assert.equal(run.round, 1);
  assert.equal(R.tap(run, deal, 0, now, T).kind === "ignored", false);
  const won = echo(deal, run, now);
  assert.equal(won.kind, "won");
  assert.equal(won.run.done, "won");
  assert.equal(won.run.rounds, 2);
  assert.equal(won.run.points, 30 + 60 + 20, "6 notes at 10 plus a clean second round");
});

test("three slips end the level; the third shows the answer first, then the end screen", () => {
  const deal = makeDeal(1, 4);
  let { run, now } = toAnswer(deal);
  for (let slip = 1; slip <= 3; slip++) {
    const step = R.tap(run, deal, (answerBell(deal, 0, 0) + 1) % deal.spec.bells, now, T);
    assert.equal(step.kind, slip < 3 ? "miss" : "lost");
    assert.equal(step.run.hearts, 3 - slip);
    if (slip < 3) ({ run, now } = toAnswer(deal, step.run, now)); else run = step.run;
  }
  assert.equal(run.phase, "miss");
  assert.equal(run.done, "lost");
  run = R.tick(run, deal, run.since + run.dur + 1, T);
  assert.equal(run.phase, "over");
  assert.equal(starsOf(deal, run), 0);
});

test("reverse levels want the call backwards; rhythm levels grade your tal against the call's", () => {
  const reverse = makeDeal(17, 8), notes = reverse.tune.notes;
  assert.deepEqual([0, 1, 2].map(i => answerBell(reverse, 0, i)), [notes[2].bell, notes[1].bell, notes[0].bell]);
  let { run, now } = toAnswer(reverse);
  assert.equal(R.tap(run, reverse, notes[0].bell, now, T).kind === "miss" || notes[0].bell === notes[2].bell, true, "the first note is not the first answer");
  const tal = makeDeal(9, 8), beat = beatMs(tal, 0, 1);
  ({ run, now } = toAnswer(tal));
  const bells = [0, 1, 2, 3].map(i => answerBell(tal, 0, i));
  let t = now + 500;
  const first = R.tap(run, tal, bells[0], t, T);
  assert.equal(first.grade, null, "the first tap sets the tempo");
  const second = R.tap(first.run, tal, bells[1], t + beat * 1.1, T);
  assert.equal(second.grade, "on");
  const third = R.tap(second.run, tal, bells[2], t + beat * 1.1 + beat * 0.5, T);
  assert.equal(third.grade, "early");
  const fourth = R.tap(third.run, tal, bells[3], t + beat * 1.1 + beat * 0.5 + beat * 1.6, T);
  assert.equal(fourth.grade, "late");
  assert.deepEqual([fourth.run.graded, fourth.run.onBeat], [3, 1]);
  assert.equal(fourth.run.points, 4 * 10 + 5 + 20, "on-beat notes earn 5 more");
  // a rest is two beats: tapping one beat later is early, two is on
  const rest = makeDeal(11, 21), restAt = rest.tune.notes.findIndex(note => note.gap === 2);
  assert.ok(restAt >= 0 && restAt < rest.spec.size - 1);
  ({ run, now } = toAnswer(rest));
  const rb = beatMs(rest, 0, 1);
  let res: R.TapResult = { run, kind: "right", grade: null }, at = now + 500;
  for (let i = 0; i <= restAt + 1; i++) {
    if (i > 0) at += rest.tune.notes[i - 1].gap * rb;
    res = R.tap(res.run, rest, answerBell(rest, 0, i), at, T);
  }
  assert.equal(res.grade, "on");
});

test("stars: ★ for a clear, ★★ with one slip, ★★★ with none (and on tal levels 80% of the graded notes on the beat)", () => {
  const plain = makeDeal(2, 3), tal = makeDeal(9, 3);
  const run = (patch: Partial<R.Run>): R.Run => ({ ...R.ready(), done: "won", phase: "over", ...patch });
  assert.equal(starsOf(plain, run({ mistakes: 0 })), 3);
  assert.equal(starsOf(plain, run({ mistakes: 1 })), 2);
  assert.equal(starsOf(plain, run({ mistakes: 2 })), 1);
  assert.equal(starsOf(plain, run({ mistakes: 0, done: "lost" })), 0);
  assert.equal(starsOf(tal, run({ graded: 10, onBeat: 8 })), 3);
  assert.equal(starsOf(tal, run({ graded: 10, onBeat: 7 })), 2);
  assert.equal(starsOf(tal, run({ graded: 10, onBeat: 10, mistakes: 1 })), 2);
  assert.equal(starsOf(makeEndless(1), run({})), 0, "endless runs have no stars");
  assert.deepEqual(nextStar(plain, run({ mistakes: 1 })), { kind: "slip", to: 3 });
  assert.deepEqual(nextStar(tal, run({ graded: 10, onBeat: 7 })), { kind: "tal", need: 1 });
  assert.equal(nextStar(plain, run({})), null);
  assert.equal(nearLine({ kind: "slip", to: 3 }, 1), "একটাও ভুল না হলে ৩ তারা।");
  assert.equal(nearLine({ kind: "slip", to: 2 }, 2), "আর একটা ভুল কম হলে ২ তারা।");
  assert.equal(nearLine({ kind: "tal", need: 2 }, 0), "আর ২টা ঘণ্টা তালে পড়লে ৩ তারা।");
  assert.equal(nearLine(null, 0), "");
});

test("the endless run: one more note a round, four bells, the third slip ends it, 99 notes win", () => {
  const deal = makeEndless(31);
  assert.equal(deal.spec, ENDLESS_SPEC);
  assert.equal(roundCount(deal), 99);
  assert.deepEqual([0, 1, 98].map(r => roundLen(deal, r)), [1, 2, 99]);
  let { run, now } = toAnswer(deal);
  for (let round = 0; round < 3; round++) {
    const done = echo(deal, run, now);
    assert.equal(done.kind, "round");
    ({ run, now } = toAnswer(deal, done.run, done.now));
  }
  assert.equal(run.round, 3);
  assert.equal(run.rounds, 3);
  assert.equal(run.points, run.right * 10 + 3 * 20);
});

test("links: endless links parse as before, level links carry l and v=2, hostile and impossible input is refused", () => {
  const old = "s=12345&t=14&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF";
  assert.deepEqual(parseShared(`#${old}`), { seed: 12345, score: 14, name: "রাফি", level: 0 });
  assert.equal(sharedHash({ seed: 12345, score: 14, name: "  রাফি‮ ", level: 0 }), old, "an old link round-trips unchanged");
  const fresh = sharedHash({ seed: 12345, score: 120, name: "রাফি", level: 3 });
  assert.equal(fresh, "s=12345&t=120&l=3&v=2&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShared(`#${fresh}`), { seed: 12345, score: 120, name: "রাফি", level: 3 });
  assert.equal(maxPoints(1), 3 * 10 + 20);
  assert.equal(parseShared(`#s=5&t=${maxPoints(1)}&l=1&v=2`)?.level, 1);
  for (const bad of ["", "#s=0&t=10", "#s=1&t=100", "#s=1&t=-1", "#s=1&t=10&l=3", "#s=1&t=10&v=2", "#s=1&t=10&l=0&v=2", "#s=1&t=10&l=25&v=2", "#s=1&t=10&l=03&v=2", "#s=1&t=10&l=3.5&v=2",
    `#s=1&t=${maxPoints(1) + 1}&l=1&v=2`, "#s=1&t=10&l=3&v=3", "#s=abc&t=10", `#s=1&t=10&n=${"x".repeat(700)}`]) assert.equal(parseShared(bad), null, bad);
  assert.equal(parseShared(`#s=5&t=30&l=2&v=2&n=${"ক".repeat(40)}`)?.name.length, 20);
  assert.equal(share.normalize("s=9&t=30&l=4&v=2&n=মিতু&x=evil"), "s=9&t=30&l=4&v=2&n=%E0%A6%AE%E0%A6%BF%E0%A6%A4%E0%A7%81");
  assert.equal(share.normalize("s=9&t=30&n=মিতু"), "s=9&t=30&n=%E0%A6%AE%E0%A6%BF%E0%A6%A4%E0%A7%81");
  assert.equal(share.normalize("s=9&t=500"), null);
  assert.equal(share.normalize("<script>"), null);
  assert.equal(share.preview("s=9&t=14&n=মিতু").title, "মিতু ১৪টা সুর মনে রেখে বাজিয়েছে। তুমি পারবে?");
  assert.equal(share.preview("s=9&t=70&l=9&v=2&n=মিতু").title, "মিতু লেভেল ৯-এ ৭০ পেয়েছে। তুমি পারবে?");
  assert.equal(previewTitle({ seed: 1, level: 2, score: 0, name: "" }), "এক বন্ধু লেভেল ২-এ ০ পেয়েছে। তুমি পারবে?");
  assert.ok(share.preview("nonsense").title.length > 10);
  assert.equal(share.tally, undefined);
});

test("the daily tune is a real date in Dhaka", () => {
  assert.equal(dhakaDate(Date.UTC(2026, 9, 12, 20, 0)), 20261013, "20:00 UTC is already tomorrow in Dhaka");
  assert.equal(dhakaDate(Date.UTC(2026, 9, 12, 5, 0)), 20261012);
  for (const seed of [20261012, 20270229 - 1, 20260101, 20991231]) assert.ok(isDailySeed(seed), String(seed));
  for (const seed of [20270229, 20261301, 20261032, 20251231, 12345, 21000101, 20261012.5]) assert.ok(!isDailySeed(seed), String(seed));
  assert.equal(dayLabel(20261012), "১২ অক্টোবর");
});

test("words: kind comparisons, concrete misses, one fact and a question on the caption, no trademarks or loud words", () => {
  assert.equal(compareLine(14, 12, "রাফি", 0), "রাফির চেয়ে ২টা সুর বেশি!");
  assert.equal(compareLine(250, 270, "", 3), "আর একটু হলেই! মাত্র ২০ কম।");
  assert.equal(compareLine(5, 20, "রাফি", 0), "রাফি এখনো ১৫টা সুর এগিয়ে। আরেকবার?");
  assert.equal(feat({ score: 14, name: "রাফি", level: 0 }), "রাফি ১৪টা সুর মনে রেখে বাজিয়েছে");
  assert.match(bannerNote({ seed: 1, name: "রাফি", level: 0 }), /রাফির নিজের ফোনের স্কোর/);
  assert.equal(missLine(3, 2, false), "৪ নম্বর সুরে ৩ নম্বর ঘণ্টা ছিল। আবার শোনো।");
  assert.equal(missLine(0, 0, true), "উল্টো ক্রমে ১ নম্বর সুরে ১ নম্বর ঘণ্টা ছিল। আবার শোনো।");
  assert.equal(caption({ seed: 1, score: 14, level: 0 }), "ঘণ্টার সুরে ১৪টা সুর মনে রেখে বাজালাম। একই সুর তুমি কয়টা পর্যন্ত পারো?");
  assert.match(caption({ seed: 20261012, score: 9, level: 0 }), /১২ অক্টোবরের রোজের সুরে/);
  assert.match(caption({ seed: 4, score: 70, level: 9 }), /লেভেল ৯-এ ৭০ পেলাম/);
  assert.equal(endlessNear(8, 9), "তোমার সেরা ৯। আর ১টা হলেই সেরাটা ছুঁতে।");
  assert.equal(endlessNear(14, null), "আর ১টা সুর হলেই ১৫-এ পৌঁছাতে।");
  assert.equal(endlessNear(99, 99), "");
  const texts = [...LEVELS.map(level => level.lesson), ...WORLDS.flatMap(world => [world.rule, world.ask, world.finale, world.place]),
    cardLine(0, 0, 0), cardLine(0, 14, 0), cardLine(0, 99, 0), cardLine(3, 100, 3), cardLine(8, 100, 2), cardLine(8, 50, 0), clearLine(8, 0), clearLine(8, 2), clearLine(3, 0), clearLine(3, 1)];
  for (const line of texts) { assert.ok(!/অসাধারণ|দারুণ|সেরা|আপনি|করুন|!!/.test(line.replace("সেরা", "")), line); assert.equal(line, line.normalize("NFC"), line); }
  assert.ok(cleanName("রাফি").length > 0 && bn(24) === "২৪");
});

test("content: SEO limits, at least 6 FAQs, the levels told right", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^সুরের মেমোরি গেম/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?" && /২৪টা/.test(item.answer) && /উল্টো/.test(item.answer)));
  assert.ok(site.faq.some(item => /জোড়া মেলাও/.test(item.answer)), "names a related game");
  assert.match(site.privacy.join(" "), /নাম/);
  assert.match(site.privacy.join(" "), /স্কোর/);
  const text = JSON.stringify(site);
  assert.ok(!/আপনি|করুন|দেখুন|অসাধারণ|সহজেই|কলসি/.test(text));
  assert.equal(text, text.normalize("NFC"));
  assert.equal(site.slug, "ghontar-sur");
});

test("level one is won within 10 seconds of the first tap on the title", () => {
  for (const [name, skill] of Object.entries(PLAYERS)) for (let seed = 1; seed <= 100; seed++) {
    const result = play(makeDeal(1, seed), skill, seed);
    assert.equal(result.run.done, "won", `${name} ${seed}`);
    if (result.run.mistakes === 0) assert.ok(result.ms <= 10000, `${name} ${seed}: ${Math.round(result.ms)} ms`);
  }
});
