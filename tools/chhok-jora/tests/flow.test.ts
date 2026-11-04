// Every statechart bug (ai_docs/statecharts/chhok-jora/README.md) replayed against the pure logic, plus the rules the fixed
// model proves: holds, guards, the finger, the keys, the second tap, saved progress and the end screen's words.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { begin, gifts, play, type Game } from "../lib/quilt";
import { levelOf, pairSetup } from "../lib/levels";
import * as F from "../lib/flow";
import { attempt, ghostOf, keyAct, lift, press, release, slide, NO_FINGER, type KeyContext } from "../lib/input";
import { migrateLadder, openAfter, readMode, readOpen, readSize } from "../lib/save";
import { clock, danger, finishStats, finishTitle, lessonLine, nextGoal, starRule, warnLine } from "../lib/result";
import { countAt, easeOut } from "../lib/count.hot";

const source = (file: string) => readFileSync(new URL(`../components/${file}`, import.meta.url), "utf8");
const ctx = (over: Partial<KeyContext>): KeyContext => ({ screen: "play", blocked: false, repeat: false, onButton: false, cursor: -1, resultReady: false, ...over });

test("bug 1 · QuiltWaitsOffScreen: কাটাকুটি is its own screen; the quilt can't be in play under it, so no lose fanfare plays over it", () => {
  // Path: a fresh quilt → you sew a stitch (the bot's turn) → you open কাটাকুটি → the bot sews the last box.
  let flow = F.start(F.titleFlow(), 0);
  assert.ok(F.running(flow));
  assert.equal(F.kata(flow), flow, "কাটাকুটি opens only from the start card, never over a quilt in play");
  flow = F.toTitle(flow, 500);
  flow = F.kata(flow);
  assert.equal(flow.screen, "kata");
  assert.equal(F.running(flow), false, "the quilt's bot timer can't be armed: it needs the play screen");
  assert.ok(F.kataRunning(flow));
  assert.equal(F.finish(flow, 900), flow, "and no quilt can finish under it");
  assert.equal(flow.cheer, false);
});

test("bug 2 · ResultStaysABeat: one Enter right after the last stitch, or a held one, never wipes the finished quilt", () => {
  // Path: you press Enter on the last gap → the quilt is finished → Enter again 80 ms later.
  const flow = F.finish(F.start(F.titleFlow(), 0), 10_000);
  assert.equal(flow.screen, "over");
  const at = (ms: number, repeat = false) => keyAct("Enter", ctx({ screen: "over", repeat, resultReady: F.takesResultKey(flow, ms, repeat) }));
  assert.equal(at(10_080), "swallow", "80 ms later: swallowed, the result stays");
  assert.equal(at(10_000 + F.RESULT_GUARD_MS, true), "swallow", "an auto-repeat of the key that sewed");
  assert.equal(at(10_000 + F.RESULT_GUARD_MS), "go", "a fresh press after the guard goes on");
  assert.equal(F.takesResultKey(F.menu(flow, true, 11_000), 12_000, false), false, "not under the menu");
  assert.equal(F.finish(flow, 20_000), flow, "a quilt ends once");
  assert.equal(F.elapsed(flow, 99_999), 10, "the clock stopped at the last stitch");
});

test("bug 3 · NoCheerAfterMovingOn: the cheer plays in the finishing step, and আরেকবার drops it and cuts its notes", () => {
  // Path: as bug 2, then আরেকবার at once: before, a bare 450 ms timeout cheered over the fresh quilt.
  const over = F.finish(F.start(F.titleFlow(), 0), 5000);
  assert.ok(over.cheer, "the cheer belongs to the result on screen");
  const fresh = F.toTitle(over, 5100);
  assert.equal(fresh.cheer, false);
  assert.equal(F.start(fresh, 6000).cheer, false);
  // The code: no celebration timer anywhere in the quilt, the cheer is scheduled on the audio clock, and every load cuts it.
  const game = source("chhok-game.tsx");
  assert.equal(game.match(/setTimeout\(/g)?.length, 1, "the only timer is the bot's beat");
  assert.match(game, /return \(\) => window\.clearTimeout\(timer\)/);
  assert.match(game.slice(game.indexOf("function load("), game.indexOf("function load(") + 200), /silenceScheduled\(\)/, "a fresh cloth cuts any cheer still sounding");
  assert.doesNotMatch(source("sound.ts"), /setTimeout\(/);
});

test("bug 4 · BotsWaitWhileHidden: in কাটাকুটি you mark, switch apps, and its bot waits until you are back", () => {
  // Path: you open কাটাকুটি → you mark a cell → you hide the tab → before, the bot marked while hidden.
  let flow = F.kata(F.titleFlow());
  assert.ok(F.kataRunning(flow));
  flow = F.away(flow, true, 100);
  assert.equal(F.kataRunning(flow), false, "hidden or blurred: its bot timer is not armed");
  flow = F.menu(flow, true, 110);
  flow = F.away(flow, false, 2000);
  assert.equal(F.kataRunning(flow), false, "the player's menu still holds it");
  flow = F.menu(flow, false, 2500);
  assert.ok(F.kataRunning(flow));
  // The component's bot effect waits on `live` and re-checks it when the timer fires.
  const kata = source("kata.tsx");
  assert.match(kata, /if \(!botTurn \|\| !live\) return;/);
  assert.match(kata, /if \(!liveRef\.current\) return;/);
  // The quilt's own bot does the same, and a hidden tab that loads hidden starts away.
  assert.equal(F.running(F.start(F.titleFlow(true), 0)), false);
});

test("bugs 5 and 6 · InputReleasedWhenAway and GhostOnlyUnderAFinger: touch the cloth, the phone locks, and no pale stitch is left behind", () => {
  // Path: a fresh quilt → you touch the cloth (the ghost shows) → you hide the tab → the tab shows again.
  let finger = press(7, 20);
  assert.equal(ghostOf(finger, true), 20, "the stitch shows under the finger at once");
  // The hide (or blur, the menu, the sheet, pointercancel) releases it.
  finger = release();
  assert.deepEqual(finger, NO_FINGER);
  assert.equal(ghostOf(finger, true), -1, "back on the page: no ghost");
  assert.equal(lift(finger, 7).gap, -1, "a late pointerup from the old finger sews nothing");
  // Even with a finger down, nothing shows while play is held.
  assert.equal(ghostOf(press(7, 20), false), -1);
  // A new touch has a new id: it alone counts.
  finger = press(10, 3);
  assert.equal(lift(finger, 7).gap, -1);
  assert.equal(lift(finger, 10).gap, 3);
  assert.deepEqual(lift(finger, 10).finger, NO_FINGER);
  // A mouse hovering shows the stitch too, and sliding a held finger moves it.
  assert.equal(ghostOf(slide(NO_FINGER, 1, 5, true), true), 5);
  assert.equal(slide(NO_FINGER, 1, 5, false), NO_FINGER, "a finger that isn't down shows nothing");
  assert.equal(ghostOf(slide(press(2, 4), 2, 9, false), true), 9);
  const game = source("chhok-game.tsx");
  for (const where of ["onPause:", "const gone = ", "function openSheet", "function letGo"]) assert.match(game.slice(game.indexOf(where), game.indexOf(where) + 160), /release\(\)/, `${where} releases the finger`);
});

test("bug 7 · EnterNeverUndoes: click ফিরিয়ে আনো, walk the arrows, press Enter: it sews the cursor's gap, never undoes again", () => {
  // Clicked buttons drop focus (dropFocus); the arrows also blur a focused button; and with the cursor out, Enter belongs to the cloth.
  assert.equal(keyAct("Enter", ctx({ onButton: true, cursor: 12 })), "sew");
  assert.equal(keyAct(" ", ctx({ onButton: true, cursor: 12 })), "sew");
  assert.equal(keyAct("Enter", ctx({ cursor: -1 })), "show", "no cursor yet: Enter brings it out");
  assert.equal(keyAct("Enter", ctx({ onButton: true, cursor: -1 })), "none", "a button reached with Tab still does its own job");
  assert.equal(keyAct("Enter", ctx({ cursor: 12, repeat: true })), "swallow");
  for (const screen of ["title", "play", "over", "kata"] as const) for (const onButton of [true, false]) for (const cursor of [-1, 4]) {
    for (const key of ["Enter", " "]) assert.notEqual(keyAct(key, ctx({ screen, onButton, cursor, resultReady: true })), "undo");
  }
  assert.equal(keyAct("z", ctx({})), "undo");
  assert.equal(keyAct("ArrowRight", ctx({ onButton: true })), "cursor");
  assert.equal(keyAct("p", ctx({})), "pause");
  assert.equal(keyAct("Enter", ctx({ blocked: true, cursor: 3 })), "none", "the menu and the sheet own the keys");
  assert.match(source("chhok-game.tsx"), /if \(element instanceof HTMLButtonElement\) element\.blur\(\);/);
});

test("ComeBackIsNotAMove and HandOffIsNotAMove: the press that brings you back, or right after the phone changes hands, never sews", () => {
  let flow = F.start(F.titleFlow(), 0);
  flow = F.away(flow, true, 1000);
  flow = F.away(flow, false, 3000);
  assert.equal(F.takesTap(flow, 3000 + F.BACK_GUARD_MS - 1), false);
  assert.ok(F.takesTap(flow, 3000 + F.BACK_GUARD_MS));
  assert.equal(F.elapsed(flow, 4000), 2, "the clock counted only the time you were there");
  flow = F.handOff(flow, 5000);
  assert.equal(F.takesTap(flow, 5100), false, "the passer's second tap");
  assert.ok(F.takesTap(flow, 5000 + F.HAND_GUARD_MS));
  // The sheet holds play and the clock; picking from it goes to that level's start card.
  let sheet = F.sheet(F.start(F.titleFlow(), 0), true, 1000);
  assert.equal(F.running(sheet), false);
  sheet = F.sheet(sheet, false, 4000);
  assert.equal(F.elapsed(sheet, 5000), 2);
  assert.equal(F.toTitle(F.sheet(F.start(F.titleFlow(), 0), true, 10), 20).sheet, false);
});

test("the second tap: a stitch that gives away more than it must is armed first; the second tap sews; the warning says how many", () => {
  const lesson = begin(103, levelOf(3)!.setup), all = gifts(lesson);
  const long = all.findIndex(gift => gift === 4), short = all.findIndex(gift => gift === 2);
  assert.deepEqual(attempt(long, -1, all), { act: "arm", armed: long });
  assert.deepEqual(attempt(long, long, all), { act: "sew", armed: -1 });
  assert.deepEqual(attempt(short, long, all), { act: "sew", armed: -1 }, "the least you must give sews at once");
  assert.deepEqual(attempt(-1, long, all), { act: "none", armed: long });
  assert.equal(warnLine(4, true, "টুনি", 2), "এই ফোঁড়ে টুনি ৪টা ফুল পাবে। অন্য ফোঁড়ে ২টা। তবু দিতে চাইলে আবার চাপো।");
  assert.equal(warnLine(1, false, "নানু", 0), "এই ফোঁড়ে নানু ১টা ফুল পাবে।");
  // The edge: amber for a held stitch that gives away more than it must, red when every stitch gives some.
  assert.equal(danger(lesson, true, 4, 2), 1);
  assert.equal(danger(lesson, true, 2, 2), 2);
  assert.equal(danger(lesson, false, 4, 2), 0, "not on the bot's turn");
  const calm = begin(1, levelOf(5)!.setup);
  assert.equal(danger(calm, true, 0, 0), 0);
});

test("saved progress: the old bests move once into stars on levels 5 and 8, your open level is read once, the mode is kept", () => {
  assert.equal(migrateLadder(null, "12", "9"), JSON.stringify({ 5: 3, 8: 1 }));
  assert.equal(migrateLadder(null, "8", null), "{}", "8 of 16 was a draw: no star, still marked as moved");
  assert.equal(migrateLadder(null, "x", "99"), "{}");
  assert.equal(migrateLadder("{}", "16", "16"), null, "never twice");
  assert.equal(readOpen(null, { 8: 1 }), 9, "first read: one past your highest star, so an old কঠিন win keeps world 3 open");
  assert.equal(readOpen("4", { 11: 1 }), 4, "afterwards your own open level, whatever a friend's link left");
  assert.equal(readOpen("99", {}), 1);
  assert.equal(openAfter(3, 11), 3, "a friend's far-ahead level opens nothing in between");
  assert.equal(openAfter(3, 3), 4);
  assert.equal(openAfter(12, 12), 12);
  assert.deepEqual(["solo", "pair", "kata", null, "x"].map(readMode), ["solo", "pair", "kata", "solo", "solo"]);
  assert.deepEqual(["3", "4", "5", "6", null].map(readSize), [3, 4, 5, 4, 4]);
});

test("the end screen: real numbers, kind words, the exact next goal", () => {
  let won: Game = begin(101, levelOf(1)!.setup);
  for (const edge of [5, 6, 8]) won = play(won, edge)!;
  assert.equal(finishTitle(won, 1, ["তুমি", "টুনি"], true), "৪–০, কাঁথা তোমার!");
  assert.deepEqual(finishStats(won, 4.4).map(stat => [stat.label, stat.value]), [["তোমার ফুল", 4], ["এক টানে সেরা", 4], ["ছেড়ে দেওয়া ঘর", 0], ["সময়", 4]]);
  assert.equal(nextGoal(won, 1), "");
  assert.match(lessonLine(won, 1), /আরেকটা ফোঁড়/);
  const finale = { ...begin(1, levelOf(4)!.setup), over: true, score: [6, 3] as [number, number] };
  assert.equal(finishTitle(finale, 4, ["তুমি", "টুনি"], true), "প্রথম কাঁথা পার!");
  assert.equal(finishTitle(finale, 4, ["তুমি", "টুনি"], false), "৬–৩, কাঁথা তোমার!");
  assert.equal(nextGoal(finale, 4), "আর ১টা ফুল পেলে ৩ তারা।");
  assert.equal(nextGoal({ ...finale, score: [4, 5] }, 4), "আর ১টা ফুল পেলেই জিত।");
  assert.equal(nextGoal({ ...finale, score: [2, 7] }, 4), "আর ৩টা ফুল পেলেই জিত।");
  assert.equal(nextGoal({ ...finale, setup: levelOf(5)!.setup, score: [8, 8] }, 5), "আর ১টা ফুল পেলেই জিত।");
  assert.equal(finishTitle({ ...finale, score: [3, 6] }, 4, ["তুমি", "টুনি"], false), "৩–৬, এবার টুনি জিতল");
  const pair = { ...begin(1, pairSetup(3)), over: true, score: [5, 4] as [number, number] };
  assert.equal(finishTitle(pair, 0, ["রাফি", "মিম"], false), "৫–৪, রাফি জিতেছে!");
  assert.equal(finishStats(pair, 70)[0].label, "লাল সুতোর ফুল");
  assert.equal(starRule(4), "৯টার ৭টা ফুল পেলে ৩ তারা");
  assert.equal(clock(65), "১:০৫");
  for (const line of [finishTitle({ ...finale, score: [0, 9] }, 4, ["তুমি", "টুনি"], false), nextGoal({ ...finale, score: [0, 9] }, 4)]) assert.doesNotMatch(line, /হেরে|খারাপ|ব্যর্থ/);
});

test("count-up maths", () => {
  assert.equal(easeOut(0), 0);
  assert.equal(easeOut(1), 1);
  assert.equal(easeOut(2), 1);
  assert.ok(easeOut(0.5) > 0.5);
  assert.equal(countAt(20, 1), 20);
  assert.equal(countAt(20, 0), 0);
});
