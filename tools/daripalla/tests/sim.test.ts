import assert from "node:assert/strict";
import test from "node:test";
import { advance } from "../lib/clock.hot";
import { addToday, cardLines, EMPTY_TODAY, endLine, feedback, praiseLine, prompt, solvedText, OG_TODAY } from "../lib/text";
import { newPhys } from "../lib/phys";
import { land, landIn, lifted, settleAt, stepPhys } from "../lib/scale.hot";
import { ASK_MS, choose, END_MS, EV, glows, HOLD_MS, hint, lift, MAX_TILT, newRun, next, put, resultOf, ST, tiltFor, totals, type Run } from "../lib/sim";

const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);
const tick = (run: Run, ms: number) => { for (let at = 0; at < ms; at += 1000 / 60) advance(run, 1000 / 60); };
const events = (run: Run) => Array.from(run.evs.slice(0, run.nev));

/** Solves the current pan by following the ghost finger's hint; `wrong` wrong numbers first. Leaves the pan level or done. */
function solve(run: Run, wrong = 0) {
  for (let guard = 0; guard < 30; guard++) {
    if (run.stage === ST.DONE) return;
    if (run.stage === ST.ASK) {
      tick(run, ASK_MS + 50);
      for (let miss = 0; miss < wrong && run.stage === ST.ASK; miss++) choose(run, run.puzzle.choices.find(value => value !== run.puzzle.answer)!);
      choose(run, run.puzzle.answer);
      continue;
    }
    const step = hint(run)!;
    assert.ok(step && "tray" in step, "a balancing hint always points at the tray when nothing is too heavy");
    put(run, step.tray);
  }
  throw new Error("a pan always ends");
}
/** Plays a whole round on the clock. */
function play(level: number, wrong = 0, seed = 7) {
  const run = newRun(level, seed);
  for (let guard = 0; guard < 20; guard++) {
    solve(run, wrong);
    if (run.over) return run;
    tick(run, HOLD_MS + 50);
    assert.ok(next(run));
  }
  throw new Error("a round always ends");
}

test("a level 1 round plays like ৪ + ? = ৭: the beam follows the pans, a level pan ends it, nothing moves on by itself", () => {
  const run = newRun(1, 11);
  const { left, right } = totals(run);
  assert.ok(left > right);
  assert.ok(run.tilt < 0, "the heavier left pan is down");
  assert.equal(run.stage, ST.BALANCE);
  nfc(prompt(run));
  solve(run);
  assert.equal(run.stage, ST.DONE);
  assert.equal(run.tilt, 0);
  assert.match(solvedText(run), /^[০-৯+ ]+ = [০-৯]+$/);
  assert.equal(put(run, 0), "ignore", "nothing moves once level");
  tick(run, 20000);
  assert.equal(run.index, 0, "never auto-advances");
  const end = play(1);
  assert.equal(end.solved, 5);
  assert.equal(end.stars, 3);
  assert.equal(endLine(1, 5), "৫বার পাল্লা সমান করলে।");
  assert.ok(praiseLine(1, 0));
});

test("bug 1, YouSeeEveryPanBalance: the level pan holds, and পরের পাল্লা can't be pressed until it has; the tap that levels it is not a next", () => {
  const run = newRun(1, 5);
  solve(run);
  assert.equal(run.stage, ST.DONE);
  assert.equal(run.ready, false);
  assert.equal(next(run), false, "a click that follows the levelling tap lands on nothing");
  tick(run, HOLD_MS - 100);
  assert.equal(next(run), false, "still holding");
  assert.equal(run.index, 0);
  tick(run, 200);
  assert.equal(run.ready, true);
  assert.ok(events(run).includes(EV.READY));
  assert.equal(next(run), true);
  assert.equal(run.index, 1);
  assert.equal(run.stage, ST.BALANCE);
  assert.equal(run.ready, false);
});

test("bug 1 (a find level): the question waits a moment after the balance, and a number tapped before then does nothing", () => {
  const run = newRun(4, 9);
  for (let guard = 0; guard < 8 && run.stage === ST.BALANCE; guard++) put(run, (hint(run) as { tray: number }).tray);
  assert.equal(run.stage, ST.ASK);
  assert.equal(run.askReady, false);
  assert.equal(choose(run, run.puzzle.answer), "ignore", "the tap that levelled the pan can't answer the question");
  tick(run, ASK_MS - 100);
  assert.equal(choose(run, run.puzzle.answer), "ignore");
  tick(run, 200);
  assert.equal(run.askReady, true);
  assert.equal(choose(run, run.puzzle.answer), "right");
});

test("bug 2, EveryFinishedRoundCounts: the last level pan wins the round at once (WON now, the end page only after its wait)", () => {
  const run = newRun(1, 3);
  for (let pan = 0; pan < 5; pan++) { solve(run); if (pan < 4) { tick(run, HOLD_MS + 50); next(run); run.nev = 0; } }
  assert.equal(run.over, true);
  assert.equal(run.stars, 3);
  assert.ok(events(run).includes(EV.WON), "stars are set and WON is pushed in the same press that levelled the pan");
  assert.equal(run.ended, false, "the end page has not come");
  run.nev = 0;
  tick(run, END_MS - 100);
  assert.equal(run.ended, false);
  tick(run, 200);
  assert.equal(run.ended, true);
  assert.deepEqual(events(run), [EV.CARD]);
  assert.equal(next(run), false, "the last pan has no next");
});

test("bug 3, NoProgressWhileAway: with no steps (the loop stopped on blur or a pause) the hold, the question and the end page never come", () => {
  const run = newRun(1, 3);
  solve(run);
  assert.equal(run.ready, false);          // a stopped loop never calls advance(): nothing changes however long it is away
  assert.equal(run.over, false);
  const last = newRun(1, 3);
  for (let pan = 0; pan < 5; pan++) { solve(last); if (pan < 4) { tick(last, HOLD_MS + 50); next(last); } }
  last.nev = 0;
  assert.equal(last.ended, false);
  assert.equal(last.nev, 0);
});

test("bug 4, easing is per round: a new round starts at pace 0, and three misses ease only the pans after them", () => {
  const eased = play(4, 2, 5);
  assert.equal(eased.pace, -1);
  assert.equal(eased.stars, 1);
  assert.equal(praiseLine(4, eased.misses), "", "no praise for a hard round");
  assert.equal(newRun(4, 5).pace, 0, "the next round starts as the level says, not eased");
  const brisk = play(4, 0, 5);
  assert.equal(brisk.pace, 1, "five clean pans step it up inside the round");
  assert.equal(newRun(4, 5).pace, 0);
});

test("overshooting a known target is a miss with a why-line; lifting it off can balance; unknowns never count it", () => {
  // The first pan of level 1 needs 1, 2 or 5; take a seed that needs less than 5, so the biggest weight overshoots.
  let seed = 1;
  while (newRun(1, seed).puzzle.answer === 5) seed++;
  const run = newRun(1, seed);
  let out = put(run, 2);
  while (out === "added") out = put(run, 2);
  assert.equal(out, "over");
  assert.equal(run.misses, 1);
  const line = feedback(run, "over");
  assert.match(line, /বেশি হলো, একটা তুলে নাও।$/);
  nfc(line);
  put(run, 0);
  assert.equal(run.misses, 1, "staying heavy isn't a second miss");
  assert.ok(["removed", "level"].includes(lift(run)));
  assert.equal(lift(newRun(1, seed)), "ignore", "the fixed starter never comes off");
  const find = newRun(4, 9);
  for (let guard = 0; guard < 6 && find.stage === ST.BALANCE; guard++) { if (put(find, 3) === "full") break; }
  assert.equal(find.misses, 0);
});

test("a full pan says so and stays where it is", () => {
  const run = newRun(1, 4);
  let out = put(run, 0);
  for (let guard = 0; guard < 8 && out !== "full" && run.stage === ST.BALANCE; guard++) out = put(run, 0);
  assert.ok(out === "full" || run.stage !== ST.BALANCE);
  if (out === "full") { nfc(feedback(run, "full")); assert.equal(run.added.length + run.puzzle.start.length, 6); }
});

test("a question: two wrong tries make the answer glow; the line says why", () => {
  const run = newRun(5, 21);
  solve(run); tick(run, HOLD_MS + 50); next(run);
  for (let guard = 0; run.stage === ST.BALANCE && guard < 10; guard++) put(run, (hint(run) as { tray: number }).tray);
  assert.equal(run.stage, ST.ASK);
  tick(run, ASK_MS + 50);
  nfc(prompt(run));
  assert.match(prompt(run), /টার ওজন কত\?$/);
  const wrong = run.puzzle.choices.filter(value => value !== run.puzzle.answer);
  assert.equal(choose(run, wrong[0]), "again");
  nfc(feedback(run, "again", wrong[0]));
  assert.ok(feedback(run, "again", wrong[0]).length > 0);
  assert.equal(glows(run), false);
  assert.equal(choose(run, wrong[1]), "again");
  assert.equal(glows(run), true);
  assert.equal(choose(run, 99), "ignore");
  assert.equal(choose(run, run.puzzle.answer), "right");
  assert.equal(run.misses, 2);
});

test("a picture equation: a try shows the tilt and the arithmetic, the answer levels the pan", () => {
  const run = newRun(10, 8);
  assert.equal(run.stage, ST.ASK);
  assert.equal(run.askReady, true, "a picture equation asks from the start");
  assert.equal(run.tilt, 0, "held level until a try");
  nfc(prompt(run));
  const wrong = run.puzzle.choices.find(value => value !== run.puzzle.answer)!;
  assert.equal(choose(run, wrong), "again");
  assert.equal(run.guess, wrong);
  assert.notEqual(run.tilt, 0);
  const line = feedback(run, "again", wrong);
  assert.match(line, /^★ = [০-৯]+ হলে .+ = [০-৯]+, [০-৯]+-এর চেয়ে (বেশি|কম)।$/);
  assert.equal(choose(run, run.puzzle.answer), "right");
  assert.equal(run.tilt, 0);
  assert.match(solvedText(run), /^★( \+ ★)*( \+ [০-৯]+)? = [০-৯]+$/);
});

test("the new levels read right: two weights against one (level 8), two fruit and a weight (level 9)", () => {
  const eight = newRun(8, 2);
  solve(eight);
  assert.match(solvedText(eight), /^[০-৯]+( \+ [০-৯]+)+ = [০-৯]+ \+ [০-৯]+$/);
  const nine = newRun(9, 2);
  assert.match(prompt(nine), /বাটখারা দিয়ে পাল্লা সমান করো/);
  for (let guard = 0; nine.stage === ST.BALANCE && guard < 10; guard++) put(nine, (hint(nine) as { tray: number }).tray);
  tick(nine, ASK_MS + 50);
  assert.match(prompt(nine), /^একটা .+ ওজন কত\?$/);
  const twins = nine.puzzle.answer;
  assert.match(feedback(nine, "again", twins * 2), /হলো দুটো .+ মিলে। একটা কত\?$/);
  nfc(feedback(nine, "again", twins * 2 + 1));
});

test("the beam: tilt is bounded and signed, and the physics wobbles past level, then rests", () => {
  const run = newRun(2, 3);
  for (let at = 0; at < 6; at++) run.added.push({ kind: "weight", value: 10 });
  assert.ok(Math.abs(tiltFor(run)) <= MAX_TILT);
  const phys = newPhys();
  settleAt(phys, -MAX_TILT);
  phys.rest = false;
  let crossed = false, time = 0;
  while (!phys.rest && time < 10) { stepPhys(phys, 0, 1 / 60); if (phys.a > 0.3) crossed = true; time += 1 / 60; }
  assert.ok(crossed, "it swings past level once: the wobble");
  assert.ok(time < 5, `settles in ${time.toFixed(1)} s`);
  assert.equal(phys.a, 0);
  // A piece landing makes its pan dip and the beam rock, then everything rests again.
  land(phys, 1, 1);
  assert.equal(phys.rest, false);
  let moved = 0;
  for (let step = 0; step < 6 * 60 && !phys.rest; step++) { stepPhys(phys, 0, 1 / 60); moved = Math.max(moved, phys.dip[1], Math.abs(phys.a)); }
  assert.ok(moved > 2, `the right pan dipped ${moved.toFixed(1)}`);
  assert.equal(phys.rest, true);
  // A landing queued for later happens at its time, and lifting a piece springs its pan up.
  landIn(phys, 100, 1, 0.5);
  stepPhys(phys, 0, 1 / 60);
  assert.ok(phys.landT > 0);
  for (let step = 0; step < 12; step++) stepPhys(phys, 0, 1 / 60);
  assert.ok(phys.dip[1] > 0 || phys.dipV[1] > 0);
  lifted(phys, 1);
  assert.equal(phys.rest, false);
});

test("star thresholds: a clean round on every level is 3 stars", () => {
  for (const id of [1, 2, 3, 8, 4, 5, 6, 9, 10, 7, 11]) {
    const clean = play(id);
    assert.equal(clean.stars, 3, `level ${id}`);
    nfc(endLine(id, clean.solved));
    const result = resultOf(clean);
    assert.equal(result.solved, 5);
    assert.equal(result.exact, 5);
  }
});

test("today's card counts what was done, first person, no name", () => {
  const a = newRun(1, 2); solve(a);
  let today = addToday(EMPTY_TODAY, a);
  const b = newRun(4, 2); solve(b);
  today = addToday(today, b);
  assert.equal(today.balanced, 2);
  assert.equal(today.found, 1);
  assert.match(today.last, / = [০-৯]+$/);
  assert.deepEqual(cardLines(today), ["আজ ২বার পাল্লা সমান করলাম", "১টা ফলের ওজন বের করলাম"]);
  assert.deepEqual(cardLines({ ...EMPTY_TODAY, pictures: 3 }), ["আজ ৩টা ছবির অঙ্ক মেলালাম"]);
  assert.deepEqual(cardLines(EMPTY_TODAY), []);
  assert.equal(cardLines(OG_TODAY).length, 2);
  [...cardLines(today), today.last].forEach(nfc);
});

test("determinism: the same seed and presses give the same round", () => {
  const a = play(9, 1, 77), b = play(9, 1, 77);
  assert.equal(JSON.stringify(resultOf(a)), JSON.stringify(resultOf(b)));
  assert.notEqual(JSON.stringify(newRun(9, 77).puzzle), JSON.stringify(newRun(9, 78).puzzle));
});
