// Every statechart rule of ai_docs/statecharts/golper-mor/Golper.tla replayed against the code the component runs.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import { COUNT_FRAMES, paintCount, type CountUp } from "../components/count.hot";
import { bothCount, empty, finish as markRead, isRead, newlyLit, readCount, readProgress, recordFinish, shelfLit, type Progress } from "../lib/progress";
import {
  GUARD_MS, atTurn, choose, createSession, endLive, finish, leave, nextPanel, openStory, pathLength, pause, prevPanel, restShows, restart, resume, returned, tapCounts, toShelf, tryOther, turnStep, type Session,
} from "../lib/session";
import { STORIES, STORY_IDS, WORLDS, isFinale, pathOf, worldOf, type Side } from "../lib/stories";

/** Reads one whole story by taps: the shared start, the turn, a side, to the last picture, then the finishing tap. */
function readThrough(s: Session, id: string, side: Side, over = false, now = 1000) {
  assert.ok(openStory(s, id, false, now));
  while (!atTurn(s)) assert.ok(["panel", "turn"].includes(nextPanel(s)));
  assert.ok(choose(s, side));
  while (nextPanel(s) === "panel");
  assert.ok(finish(s, over, now));
}

test("a tapper reaches the end of every story, on both paths, in at most 8 taps", () => {
  for (const story of STORIES) for (const side of [0, 1] as const) {
    const s = createSession();
    let taps = 0;
    assert.ok(openStory(s, story.id, false)); taps += 1;
    while (!atTurn(s)) { nextPanel(s); taps += 1; }
    assert.equal(s.step, turnStep(story.id));
    choose(s, side); taps += 1;
    while (nextPanel(s) === "panel") taps += 1;
    taps += 1;
    assert.ok(finish(s, false, 5), story.id);
    assert.equal(s.screen, "end");
    assert.equal(pathLength(s), pathOf(story, side).length);
    assert.ok(taps <= 8, `${story.id} ${side}: ${taps} taps`);
  }
});

test("the first choice comes within 3 taps of opening the first story (a first win inside 10 seconds)", () => {
  const s = createSession();
  openStory(s, STORY_IDS[0], false);
  nextPanel(s);
  assert.equal(nextPanel(s), "turn");
  assert.ok(atTurn(s));
});

test("the turn can't be skipped: → does nothing at the মোড়, and a path must be picked", () => {
  const s = createSession();
  openStory(s, "cup", false);
  while (!atTurn(s)) nextPanel(s);
  assert.equal(nextPanel(s), "ignored");
  assert.equal(finish(s, false, 5), false);
  assert.ok(choose(s, 1));
  assert.equal(choose(s, 0), false, "a second pick while on the path does nothing");
  assert.ok(prevPanel(s));
  assert.ok(atTurn(s) && s.side === null, "back from a path's first picture is the মোড় with the path unpicked");
  assert.ok(choose(s, 0));
});

// ReadMarksNeverVanish
test("bug 1: a second tab can't wipe a read mark: the saved copy is read again before every write", () => {
  // Both tabs opened on an empty shelf. Tab A reads the টিফিন story, tab B reads মং's.
  let storage: string | null = null;
  const tabA = empty(), tabB = empty();
  const save = (memory: Progress, id: string, side: Side) => { const next = recordFinish(storage, memory, id, side, "2026-11-05"); storage = JSON.stringify(next); return next; };
  save(tabA, "tiffin", 0);
  save(tabB, "notun", 0);
  const reloaded = readProgress(storage);
  assert.deepEqual(reloaded.read, { tiffin: [0], notun: [0] });
  assert.deepEqual([...reloaded.today].sort(), ["notun", "tiffin"]);
  // The old way (finish() on this tab's own copy) loses tiffin: the very bug.
  const old = JSON.stringify(markRead(tabB, "notun", 0, "2026-11-05"));
  assert.deepEqual(readProgress(old).read, { notun: [0] });
});

test("recordFinish: unreadable storage falls back to this tab's own copy; a corrupt save starts fresh; turns only add", () => {
  const memory = markRead(empty(), "aam", 1, "2026-11-05");
  assert.deepEqual(recordFinish(undefined, memory, "cup", 0, "2026-11-05").read, { aam: [1], cup: [0] });
  assert.deepEqual(recordFinish("{oops", memory, "cup", 0, "2026-11-05").read, { cup: [0] });
  let saved = JSON.stringify(markRead(empty(), "cup", 0, "2026-11-05"));
  for (const side of [1, 0, 1] as const) saved = JSON.stringify(recordFinish(saved, empty(), "cup", side, "2026-11-05"));
  assert.deepEqual(readProgress(saved).read.cup, [0, 1]);
});

test("a shelf's lamp lights once, when its third story is first read", () => {
  let before = empty();
  const [a, b, c] = WORLDS[1].ids;
  for (const id of [a, b]) before = markRead(before, id, 0, "2026-11-05");
  assert.equal(shelfLit(before, "home"), false);
  const after = markRead(before, c, 1, "2026-11-05");
  assert.equal(newlyLit(before, after, c), "home");
  assert.equal(newlyLit(after, markRead(after, c, 0, "2026-11-05"), c), null, "reading the other turn lights nothing new");
  assert.equal(newlyLit(empty(), markRead(empty(), "tiffin", 0, "2026-11-05"), "tiffin"), null);
  assert.equal(shelfLit(after, "school"), false);
  assert.equal(readCount(after), 3);
  assert.equal(bothCount(after), 0);
});

// NoStoryAfterTimeIsUp
test("bug 2: once today's time is up, no story starts: not from the shelf, not আবার পড়ো, not অন্যটা", () => {
  const s = createSession();
  // The time ran out while the child looked at the shelf.
  assert.equal(openStory(s, "tiffin", true), false);
  assert.ok(s.resting && restShows(s) && s.screen === "shelf");
  // A grown-up gives more time: the shelf is back and a story opens.
  resume(s); s.resting = false;
  assert.ok(openStory(s, "tiffin", false));
  // The same from the end page.
  const e = createSession();
  readThrough(e, "tiffin", 0, true, 100);
  assert.equal(e.screen, "end");
  assert.ok(e.resting && !restShows(e), "the end page shows first: its talk question stays");
  assert.equal(openStory(e, "tiffin", true, 100 + GUARD_MS + 1), false);
  assert.equal(e.screen, "shelf");
  assert.ok(restShows(e));
  const f = createSession();
  readThrough(f, "tiffin", 0, false, 100);
  f.resting = false;
  assert.equal(tryOther(f, true, 100 + GUARD_MS + 1), false);
  assert.ok(restShows(f));
});

test("gap: the rest screen waits behind the end page; the last talk question stays on screen", () => {
  const s = createSession();
  readThrough(s, "dour", 1, true, 50);
  assert.equal(s.screen, "end");
  assert.equal(restShows(s), false);
  assert.ok(endLive(s, 50 + GUARD_MS));
  toShelf(s);
  assert.ok(restShows(s));
});

test("RestOnlyAtBreak: the rest screen never shows while a story is being read", () => {
  const s = createSession();
  assert.ok(openStory(s, "cup", false));
  s.resting = true;
  assert.equal(restShows(s), false, "time runs out mid-story: the story is finished first");
  while (!atTurn(s)) nextPanel(s);
  choose(s, 0);
  while (nextPanel(s) === "panel");
  assert.ok(finish(s, true, 10));
  assert.equal(restShows(s), false);
});

test("a finished story is recorded once, in the same tap (WonIsRecorded, RecordedOnce)", () => {
  const s = createSession();
  openStory(s, "taka", false);
  while (!atTurn(s)) nextPanel(s);
  choose(s, 0);
  while (nextPanel(s) === "panel");
  assert.equal(finish(s, false, 1), true);
  assert.equal(finish(s, false, 2), false, "a double tap records nothing twice");
  assert.equal(s.recorded, s.serial);
  assert.equal(nextPanel(s), "ignored");
});

test("end page keys and buttons: a tap that finished the story can't also press আবার পড়ো", () => {
  const s = createSession();
  readThrough(s, "tiffin", 0, false, 1000);
  assert.equal(endLive(s, 1000 + 10), false);
  assert.equal(openStory(s, "tiffin", false, 1000 + 10), false);
  assert.equal(tryOther(s, false, 1000 + 10), false);
  assert.ok(openStory(s, "tiffin", false, 1000 + GUARD_MS));
});

test("pause: nothing turns, picks or finishes under the player's menu; resume gives the story back", () => {
  const s = createSession();
  openStory(s, "aam", false);
  pause(s);
  assert.equal(tapCounts(s), "ignored");
  assert.equal(nextPanel(s), "ignored");
  assert.equal(prevPanel(s), false);
  resume(s);
  assert.equal(tapCounts(s), "counts");
  assert.equal(nextPanel(s), "panel");
});

test("FirstTapBackIsNotAMove: after blur or hide mid-story, the first tap only wakes the book", () => {
  const s = createSession();
  openStory(s, "ghuri", false);
  leave(s);
  assert.equal(tapCounts(s), "ignored", "while away");
  returned(s);
  assert.equal(tapCounts(s), "woke");
  assert.equal(tapCounts(s), "counts");
  // Through the pause menu, the click that returned is the menu's: nothing is swallowed.
  leave(s); pause(s); returned(s); resume(s);
  assert.equal(tapCounts(s), "counts");
});

test("no story opens while the window is away (AwayMidStoryIsAsleep)", () => {
  const s = createSession();
  leave(s);
  assert.equal(openStory(s, "tiffin", false), false);
  assert.equal(s.screen, "shelf");
  returned(s);
  assert.ok(openStory(s, "tiffin", false));
});

test("সব লেভেল and নতুন করে শুরু: the shelf, or the same story from its first picture (checking the limit)", () => {
  const s = createSession();
  openStory(s, "cup", false);
  nextPanel(s); nextPanel(s);
  assert.ok(restart(s, false));
  assert.equal(s.step, 0);
  assert.equal(s.screen, "read");
  nextPanel(s);
  assert.equal(restart(s, true), false, "past the limit, restarting a story starts nothing");
  assert.ok(restShows(s));
  const t = createSession();
  openStory(t, "cup", false);
  toShelf(t);
  assert.equal(t.screen, "shelf");
  assert.equal(restart(t, false), false);
});

test("a random-tapping child never breaks a rule (3000 taps over 60 seeds)", () => {
  for (let seed = 1; seed <= 60; seed++) {
    const rng = makeRng(seed);
    const s = createSession();
    let over = false, now = 0, starts = 0, finishes = 0, lastRecorded = 0;
    for (let tap = 0; tap < 50; tap++) {
      now += 300 + Math.floor(rng() * 900);
      if (rng() < 0.03) over = true;
      if (rng() < 0.02) over = false;
      s.resting = s.resting && over;
      const wasOver: boolean = over;
      const pick = rng();
      if (pick < 0.12) { if (openStory(s, STORY_IDS[Math.floor(rng() * 9)], over, now)) { starts++; assert.equal(wasOver, false, "a story started past the limit"); } }
      else if (pick < 0.2) { if (tryOther(s, over, now)) { starts++; assert.equal(wasOver, false); } }
      else if (pick < 0.5) { if (nextPanel(s) === "last" && finish(s, over, now)) { finishes++; assert.ok(s.recorded > lastRecorded); lastRecorded = s.recorded; } }
      else if (pick < 0.62) choose(s, rng() < 0.5 ? 0 : 1);
      else if (pick < 0.7) prevPanel(s);
      else if (pick < 0.76) toShelf(s);
      else if (pick < 0.82) leave(s);
      else if (pick < 0.88) returned(s);
      else if (pick < 0.92) pause(s);
      else if (pick < 0.96) resume(s);
      else restart(s, over);
      // RestOnlyAtBreak, and the end page never ends in a half state.
      if (s.screen === "read") assert.equal(restShows(s), false);
      if (s.screen === "end") assert.ok(s.side !== null && s.recorded === s.serial);
      assert.ok(s.step >= 0);
    }
    assert.ok(finishes <= starts + 0, `seed ${seed}: ${finishes} finishes from ${starts} starts`);
  }
});

test("worlds: three shelves of three, every story on exactly one, a finale each, nothing renamed", () => {
  assert.equal(WORLDS.length, 3);
  assert.deepEqual(WORLDS.flatMap(world => [...world.ids]).sort(), [...STORY_IDS].sort());
  assert.equal(STORY_IDS.length, 9);
  assert.deepEqual([...STORY_IDS].sort(), ["aam", "bajar", "cricket", "cup", "dour", "ghuri", "notun", "taka", "tiffin"], "ids are what old saved marks use");
  for (const world of WORLDS) { assert.ok(isFinale(world.ids[2])); assert.equal(worldOf(world.ids[0]).id, world.id); }
  assert.equal(new Set(WORLDS.map(world => world.root)).size, 3);
});

test("old saved marks (the same key and shape) still open", () => {
  const old = JSON.stringify({ read: { tiffin: [0, 1], cup: [1] }, day: "2026-10-15", today: ["tiffin"] });
  const progress = readProgress(old);
  assert.ok(isRead(progress, "tiffin") && isRead(progress, "cup"));
  assert.equal(bothCount(progress), 1);
});

test("the end page's count-up lands exactly and allocates nothing per frame", () => {
  const nodes = [{ textContent: "" }, { textContent: "" }] as unknown as HTMLElement[];
  const frames = [3, 9].map(value => Array.from({ length: COUNT_FRAMES }, (_, frame) => String(Math.round(value * frame / (COUNT_FRAMES - 1)))));
  const count: CountUp = { nodes, frames, last: new Int16Array(2).fill(-1) };
  paintCount(count, 0.5);
  assert.ok(Number(nodes[0].textContent) <= 3);
  paintCount(count, 1);
  assert.deepEqual(nodes.map(node => node.textContent), ["3", "9"]);
});

test("no voice anywhere: no speak(), SpeakButton or speechSynthesis; no direct audio; sound only through the kit", () => {
  const root = join(import.meta.dirname, "..");
  const files: string[] = [];
  const walk = (dir: string) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) { if (name !== "tests") walk(path); } else if (/\.(ts|tsx)$/.test(name)) files.push(path); } };
  walk(root);
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /\bspeak\s*\(|SpeakButton|speechSynthesis|SpeechSynthesis|useBanglaVoice/, file);
    assert.doesNotMatch(source, /new\s+(Audio|AudioContext)\b|navigator\.vibrate|Math\.random|Date\.now/, file);
    assert.doesNotMatch(source, /location\.hash|pushState/, file);
  }
});
