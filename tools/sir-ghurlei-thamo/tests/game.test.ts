import assert from "node:assert/strict";
import test from "node:test";
import { challengeHash } from "../../../shared/game-core";
import {
  backBench, BENCHES, benchesReached, BOARDS, CHITS, createGame, FAKE, GRACE, kindOf, makeClass, MAX_TENTHS, MIN_TENTHS, RAMP, REPLIES,
  SCOLD, SEATS, seconds, SPEED, statusOf, stepGame, tenthsOf, type Game, type Kind,
} from "../lib/game";
import { parseShared, previewTitle, sharedHash } from "../lib/link";
import { BANDS, caption, caughtFact, caughtLine, compareLine, friendClaim, friendLine, humanLine, statusLine } from "../lib/words";
import { site } from "../content";
import { share } from "../share";

const DT = 1 / 60;
const run = (game: Game, holding: boolean, time: number, rate = 1) => { for (let i = 0; i < Math.round(time / DT); i++) stepGame(game, holding, DT, rate); };
/** Steps (not holding) until the teacher is in this kind of moment. */
function waitFor(game: Game, kind: Kind) {
  for (let i = 0; i < 60 * 120 && kindOf(game) !== kind; i++) stepGame(game, false, DT);
  assert.equal(kindOf(game), kind);
}

test("the same seed gives the same class; another seed gives another", () => {
  assert.deepEqual(makeClass(48213), makeClass(48213));
  assert.notDeepEqual(makeClass(48213).segments, makeClass(48214).segments);
  const teachers = new Set(Array.from({ length: 40 }, (_, seed) => makeClass(seed + 1).teacher));
  assert.deepEqual([...teachers].sort(), ["madam", "sir"]);
});

test("every seed makes a fair routine: a calm start, real tells before every look, fakes only later", () => {
  for (let seed = 1; seed <= 1500; seed++) {
    const klass = makeClass(seed), segments = klass.segments;
    assert.ok(klass.chit < CHITS.length && klass.reply < REPLIES.length && klass.board < BOARDS.length);
    assert.equal(klass.path.length, BENCHES);
    assert.ok(klass.path.every(seat => seat >= 0 && seat < SEATS));
    assert.equal(segments[0].kind, "write");
    assert.ok(segments[0].dur >= 2.6 && segments[0].dur <= 3.4, `seed ${seed} first write ${segments[0].dur}`);
    assert.equal(segments[1].kind, "tell", "no fake in the first stretch");
    assert.ok(klass.loopFrom > 0 && klass.loopFrom < segments.length && segments[klass.loopFrom].kind === "write");
    let cycle = 0, total = 0;
    segments.forEach((segment, index) => {
      total += segment.dur;
      const next = segments[index + 1];
      if (segment.kind === "tell") { assert.ok(segment.dur >= 0.49 && segment.dur <= 0.89, `seed ${seed} tell ${segment.dur}`); if (next) assert.equal(next.kind, "look"); }
      if (segment.kind === "look") { assert.ok(segment.dur >= 1.1 && segment.dur <= 2.31); assert.equal(segments[index - 1].kind, "tell"); if (next) assert.equal(next.kind, "write"); cycle++; }
      if (segment.kind === "write") assert.ok(segment.dur >= 0.8, `seed ${seed} write ${segment.dur}`);
      if (segment.kind === "peek") assert.ok(cycle >= 3 && segment.dur >= 0.55 && segment.dur <= 0.8);
      if (segment.kind === "cough" || segment.kind === "drop") assert.ok(cycle >= 1 && segment.dur === FAKE[segment.kind]);
      // A fake always sits inside the writing, never right before a turn.
      if (["cough", "drop", "peek"].includes(segment.kind)) { assert.equal(segments[index - 1].kind, "write"); assert.equal(next?.kind, "write"); }
    });
    assert.ok(total >= 700, "the routine outlasts the longest game");
    assert.ok(cycle > RAMP);
  }
});

test("the clock and the teacher wait for the first press; the chit moves only while held", () => {
  const game = createGame(48213);
  run(game, false, 3);
  assert.equal(game.phase, "ready");
  assert.equal(game.time, 0);
  assert.equal(game.seg, 0);
  assert.ok(game.ink > 2.9, "the teacher writes while waiting");
  run(game, true, 1);
  assert.equal(game.phase, "playing");
  assert.ok(Math.abs(game.pos - SPEED) < 0.03);
  const at = game.pos;
  run(game, false, 0.5);
  assert.equal(game.pos, at);
  assert.ok(Math.abs(game.time - 1.5) < 0.03);
});

test("moving during a tell, the turn itself or a harmless moment is fine; moving while they look is caught", () => {
  const game = createGame(48213);
  stepGame(game, true, DT);
  waitFor(game, "tell");
  run(game, true, 0.2);
  assert.equal(game.catches, 0);
  waitFor(game, "look");
  run(game, true, GRACE - 0.05);
  assert.equal(game.catches, 0, "the grace while the teacher turns");
  for (const kind of ["cough", "drop"] as const) {
    const seed = Array.from({ length: 500 }, (_, i) => i + 1).find(s => makeClass(s).segments.some(segment => segment.kind === kind))!;
    const other = createGame(seed);
    stepGame(other, true, DT);
    waitFor(other, kind);
    const before = other.pos;
    run(other, true, 0.5);
    assert.equal(other.catches, 0, kind);
    assert.ok(other.pos > before, kind);
  }
});

test("a catch is gentle: one bench back, a raised eyebrow, then the teacher turns back to the board", () => {
  const game = createGame(48213);
  stepGame(game, true, DT);
  waitFor(game, "look");
  game.pos = 3.6;
  run(game, false, GRACE);
  stepGame(game, true, DT);
  assert.equal(game.catches, 1);
  assert.equal(game.scold, SCOLD);
  assert.equal(game.backTo, 2);
  assert.equal(statusOf(game, true), "scold");
  run(game, true, SCOLD / 2 + 0.05);
  assert.equal(game.pos, 2, "slid back to the bench before");
  assert.equal(game.catches, 1, "still holding during the scold is not caught again");
  run(game, true, SCOLD / 2);
  assert.equal(game.scold, 0);
  assert.equal(kindOf(game), "write");
  assert.equal(game.pos, 2, "the finger must lift before the chit moves again");
  assert.equal(statusOf(game, true), "lift");
  stepGame(game, false, DT);
  run(game, true, 0.5);
  assert.ok(game.pos > 2.3);
  assert.equal(backBench(0.4), 0);
  assert.equal(backBench(3), 2);
  assert.equal(backBench(3.99), 2);
});

test("the chit stops at the last bench and the game ends there", () => {
  const game = createGame(7);
  game.phase = "playing";
  game.klass.segments.forEach(segment => { segment.kind = "write"; });
  run(game, true, 20);
  assert.equal(game.phase, "over");
  assert.equal(game.pos, BENCHES - 1);
  assert.equal(benchesReached(game.pos), BENCHES);
  assert.equal(benchesReached(0), 1);
  assert.equal(benchesReached(2.999), 3);
  assert.equal(statusOf(game, false), "done");
  const time = game.time;
  run(game, true, 1);
  assert.equal(game.time, time);
});

test("status follows what is visible: a peek looks exactly like a real tell", () => {
  const seed = Array.from({ length: 500 }, (_, i) => i + 1).find(s => makeClass(s).segments.some(segment => segment.kind === "peek"))!;
  const game = createGame(seed);
  assert.equal(statusOf(game, false), "ready");
  stepGame(game, true, DT);
  waitFor(game, "peek");
  assert.equal(statusOf(game, false), "tell");
  assert.equal(statusLine("tell", "sir", false), "চক থেমে গেল… সাবধান!");
  assert.equal(statusLine("look", "madam", false), "ম্যাডাম তাকিয়ে আছেন। নড়বে না!");
  assert.match(statusLine("ready", "sir", true), /একবার চাপো/);
  assert.equal(statusLine("done", "sir", false, "পাক্কা!"), "শেষ বেঞ্চ থেকে উত্তর এল: “পাক্কা!”");
});

/** A scripted player: holds while the teacher writes, lets go `reaction` seconds after a tell, presses again after the look. */
function play(seed: number, reaction: number, readsFakes: boolean, reckless = false, rate = 1) {
  const game = createGame(seed);
  let seen = "write", heard = "write", timer = 0, steps = 0;
  stepGame(game, true, DT, rate);
  while (game.phase !== "over" && steps++ < 60 * 600) {
    const kind = game.scold > 0 ? "scold" : kindOf(game);
    if (kind !== heard) { heard = kind; timer = reaction; }
    if (timer > 0 && (timer -= DT) <= 0) seen = heard;
    const hold = !game.needRelease && (reckless || seen === "write" || (readsFakes && (seen === "cough" || seen === "drop")));
    stepGame(game, hold, DT, rate);
  }
  return { phase: game.phase, tenths: tenthsOf(game.time), catches: game.catches };
}
const median = (values: number[]) => [...values].sort((a, b) => a - b)[values.length >> 1];

test("headless runs: careful players finish every class cleanly in a plausible time; pushing on finishes too, but slower", () => {
  const careful = [], sharp = [], reckless = [], slow = [];
  for (let seed = 1; seed <= 300; seed++) {
    const normal = play(seed, 0.35, false);
    assert.equal(normal.phase, "over", `seed ${seed}`);
    assert.equal(normal.catches, 0, `seed ${seed}: a 0.35 s reaction is always in time`);
    careful.push(normal.tenths);
    sharp.push(play(seed, 0.25, true).tenths);
    const pushy = play(seed, 0, false, true);
    assert.equal(pushy.phase, "over", `seed ${seed} reckless`);
    assert.ok(pushy.catches > 0);
    reckless.push(pushy.tenths);
    if (seed <= 60) slow.push(play(seed, 0.35, false, false, 0.7).tenths);
  }
  assert.ok(Math.min(...careful) > MIN_TENTHS);
  assert.ok(median(careful) > 120 && median(careful) < 230, `careful median ${median(careful)}`);
  assert.ok(Math.max(...careful) < 320, `careful slowest ${Math.max(...careful)}`);
  assert.ok(median(sharp) < median(careful), "reading the cough and the dropped chalk pays");
  assert.ok(median(reckless) > median(careful) + 30, `reckless ${median(reckless)} vs careful ${median(careful)}`);
  assert.ok(median(slow) > median(careful.slice(0, 60)), "slow mode takes longer in real seconds");
});

test("time is scored in tenths and every band has a kind line", () => {
  assert.equal(seconds(224), "২২.৪");
  assert.equal(seconds(MIN_TENTHS), "৯.৪");
  assert.equal(tenthsOf(22.36), 224);
  assert.equal(tenthsOf(1), MIN_TENTHS);
  assert.equal(tenthsOf(99999), MAX_TENTHS);
  assert.equal(humanLine(120, "sir"), "স্যার টেরই পেলেন না!");
  assert.equal(humanLine(120, "madam"), "ম্যাডাম টেরই পেলেন না!");
  assert.equal(humanLine(160, "sir"), BANDS[1].line());
  assert.equal(humanLine(300, "sir"), BANDS[2].line());
  assert.equal(humanLine(MAX_TENTHS, "sir"), BANDS[3].line());
  assert.equal(new Set(BANDS.map(band => band.line("স্যার"))).size, BANDS.length);
  assert.equal(caughtLine(0), "একবারও চোখে পড়োনি!");
  assert.equal(caughtLine(2), "২ বার শুনেছ “এইদিকে তাকাও”");
  assert.equal(caughtFact(0), "একবারও ধরা পড়েনি");
  assert.match(caption(224, "madam"), /^ম্যাডাম বোর্ডে লিখছিলেন, আমি ২২\.৪ সেকেন্ডে/);
});

test("a friend's time is compared kindly and labelled as their own phone's time", () => {
  const friend = { seed: 7, tenths: 224, catches: 1, name: "রাফি" };
  assert.equal(compareLine(200, friend), "রাফির চেয়ে ২.৪ সেকেন্ড আগে!");
  assert.equal(compareLine(224, friend), "রাফির সাথে একদম সমান সমান!");
  assert.equal(compareLine(240, friend), "আর একটু হলেই! রাফি মাত্র ১.৬ সেকেন্ড এগিয়ে।");
  assert.equal(compareLine(300, { ...friend, name: "" }), "বন্ধু এবার ৭.৬ সেকেন্ড এগিয়ে। আরেকবার?");
  assert.equal(friendClaim(friend), "রাফির নিজের ফোনের সময়");
  assert.equal(friendLine(friend), "রাফি ২২.৪ সেকেন্ডে চিরকুট শেষ বেঞ্চে পৌঁছে দিয়েছে। একই ক্লাস, এবার তোমার পালা।");
  assert.equal(previewTitle(friend), "রাফি ২২.৪ সেকেন্ডে চিরকুট শেষ বেঞ্চে পৌঁছে দিয়েছে। তুমি পারবে?");
});

test("the link round-trips in game-core's challenge format", () => {
  const card = { seed: 48213, tenths: 224, catches: 2, name: "রাফি" };
  assert.equal(sharedHash(card), challengeHash({ seed: 48213, target: 224, name: "রাফি", extra: { c: 2 } }));
  assert.deepEqual(parseShared("#" + sharedHash(card)), card);
  assert.deepEqual(parseShared(sharedHash({ ...card, name: "" })), { ...card, name: "" });
  assert.deepEqual(parseShared("s=5&t=224"), { seed: 5, tenths: 224, catches: 0, name: "" });
});

test("share normalize rejects hostile or impossible links and canonicalises the rest", () => {
  assert.equal(share.normalize("t=224&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF&c=1&s=48213&x=1"), "s=48213&t=224&c=1&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  for (const bad of ["", "s=0&t=224", "s=1000000000&t=224", "s=5.5&t=224", "s=5&t=-1", "s=5&t=1.5", "s=5&t=50", "s=5&t=6001", "s=abc&t=224", "s=5",
    "s=5&t=224&c=-1", "s=5&t=224&c=1.5", "s=5&t=224&c=61", "s=5&t=224&c=abc", "s=5&t=224&c=", "s=5&t=224&n=" + "x".repeat(700)]) {
    assert.equal(share.normalize(bad), null, bad);
  }
  assert.equal(share.normalize(`s=5&t=${MIN_TENTHS}`), `s=5&t=${MIN_TENTHS}&c=0`);
  assert.equal(share.normalize("s=5&t=224&c=0&n=<script>alert(1)</script>"), "s=5&t=224&c=0&n=%3Cscript%3Ealert%281%29%3C%2Fsc");
  assert.equal(parseShared("s=5&t=224&n=‮রাফি\u0007")?.name, "রাফি");
  assert.equal(parseShared("s=5&t=224&n=" + "ক".repeat(25))?.name.length, 20);
  assert.equal(share.preview("s=5&t=224&n=রাফি").title, "রাফি ২২.৪ সেকেন্ডে চিরকুট শেষ বেঞ্চে পৌঁছে দিয়েছে। তুমি পারবে?");
  assert.equal(share.preview("junk").title, site.headline);
});

test("page copy stays inside the SEO limits and away from the famous series", () => {
  assert.ok(site.title.length <= 45, `title ${site.title.length}`);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `description ${site.description.length}`);
  assert.ok(site.faq.length >= 5);
  assert.ok(site.headline && site.headline !== site.title && site.headline !== site.name);
  assert.ok(site.privacy.some(line => line.includes("লিংকে")));
  const everything = JSON.stringify(site) + CHITS.join() + BOARDS.flat().join();
  assert.ok(!/squid|red light|green light|স্কুইড|রেড লাইট|পুতুল/i.test(everything));
  assert.ok(!/পরীক্ষা|উত্তরপত্র|নকল|বেত/.test(everything), "no exams, answers, copying or cane");
});
