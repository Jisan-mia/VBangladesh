// The statechart's paths replayed against the pure logic, and the shared patterns every rewrite must hold.
import assert from "node:assert/strict";
import test from "node:test";
import { recordLevel } from "../../../shared/game-core";
import { choose, classicSetup, levelSetup, makeDice, roll, startGame, starsOf } from "../lib/game";
import { LEVEL_COUNT } from "../lib/levels";
import {
  BOT_MS, BOT_PICK_MS, BREATH_MS, EV_DONE, EV_HOP, EV_JUMP, finishMotion, freshPress, makeMotion, makePacer, PACE_NONE, PACE_PICK, PACE_ROLL, paceStep, planMove, stepMotion,
} from "../lib/motion.hot";
import { cardHash, cardOf, parseCard } from "../lib/result";
import { DEFAULT_PREFS, openAfter, readOpen, readPrefs, writePrefs } from "../lib/save";
import { levelRace } from "./bot";

/** Runs the loop for `ms` in 1/60 s steps, as useGameLoop does while it runs. */
function run(ms: number, each: (dt: number) => void) { for (let t = 0; t < ms; t += 1000 / 60) each(1000 / 60); }

test("bug 1 (NoProgressWhileAway): a walk moves only on the loop's steps, so a blurred window (no steps) freezes it", () => {
  const m = makeMotion(), board = levelSetup(2).board;
  planMove(m, board, 0, 0, 0, 3, 14, 0, true, false);
  let events = 0;
  run(400, dt => { events |= stepMotion(m, dt); });
  const at = m.t, hops = m.hops;
  assert.ok(at > 380 && m.active === 1, "mid-walk when the window blurs");
  // You click into another window: useGameLoop stops (blur) and the player's menu opens. No step runs, however long you're away.
  assert.equal(m.t, at);
  assert.equal(m.hops, hops);
  assert.equal(events & EV_JUMP, 0, "the ladder hasn't sounded yet");
  // Back, চালিয়ে যাও: the walk carries on from where it stood, and the ladder plays in front of you.
  run(3000, dt => { events |= stepMotion(m, dt); });
  assert.ok(events & EV_JUMP && events & EV_DONE);
  assert.equal(m.active, 0);
});

test("a computer's turn runs on the same clock: it waits under the pause menu and after a breath on resume", () => {
  const pacer = makePacer();
  let acted = PACE_NONE;
  run(BOT_MS / 2, dt => { acted ||= paceStep(pacer, dt, true, false); });
  assert.equal(acted, PACE_NONE, "half-way through the computer's look at the board");
  // Paused: no steps. Resumed: a breath first (BREATH_MS) before the computer may roll.
  pacer.breath = BREATH_MS;
  run(BREATH_MS - 20, dt => { acted ||= paceStep(pacer, dt, true, false); });
  assert.equal(acted, PACE_NONE, "nothing moves during the breath");
  run(BOT_MS, dt => { acted ||= paceStep(pacer, dt, true, false); });
  assert.equal(acted, PACE_ROLL);
  // A person's turn never accumulates a computer's clock.
  const mine = makePacer();
  run(5000, dt => { assert.equal(paceStep(mine, dt, false, false), PACE_NONE); });
  assert.equal(mine.bot, 0);
  // Choosing between two pieces waits its own beat.
  const picker = makePacer();
  let picked = PACE_NONE;
  run(BOT_PICK_MS + 40, dt => { picked ||= paceStep(picker, dt, true, true); });
  assert.equal(picked, PACE_PICK);
});

test("a tap during a walk finishes it at once, and the skipped hops and jump stay silent", () => {
  const m = makeMotion();
  planMove(m, levelSetup(2).board, 0, 0, 13, 19, 8, 1, true, false);
  run(500, dt => stepMotion(m, dt));
  assert.equal(finishMotion(m), EV_DONE);
  assert.equal(m.active, 0);
  assert.equal(stepMotion(m, 16) & (EV_HOP | EV_JUMP), 0);
});

test("ChoiceFreezesPlay: while two pieces wait for a pick, no roll is taken", () => {
  let game = roll(startGame(5, levelSetup(6)), 4);
  game = roll(roll(game, 1), 4); // you: two pieces apart, then a 4 that both can use
  if (game.phase !== "choose") game = { ...game, phase: "choose", die: 3, pos: [2, 9, 0, 0], turn: 0 };
  assert.equal(game.phase, "choose");
  assert.equal(roll(game, 5), game);
  assert.notEqual(choose(game, 1), game);
});

test("result keys need a fresh press: a held or early Space never skips the end screen", () => {
  assert.equal(freshPress(1000, 1200, false), false, "pressed before the screen appeared");
  assert.equal(freshPress(1300, 1200, true), false, "auto-repeat of a held key");
  assert.equal(freshPress(1300, 1200, false), true);
});

test("friend links: a friend's far-ahead level records its stars but opens nothing in between", () => {
  assert.equal(openAfter(3, 3), 4, "clearing your newest level opens the next");
  assert.equal(openAfter(3, 2), 3);
  assert.equal(openAfter(3, 9), 3, "level 9 from a friend's link opens neither 4 nor 10");
  assert.equal(openAfter(LEVEL_COUNT, LEVEL_COUNT), LEVEL_COUNT);
  // StarsNeverDrop: a worse run never lowers a level's stars.
  assert.deepEqual(recordLevel(recordLevel({}, 2, 3), 2, 1), { 2: 3 });
});

test("old progress migrates once: a phone that raced the big board opens world 3; after that only play opens levels", () => {
  assert.equal(readOpen(null, {}, null), 1);
  assert.equal(readOpen(null, { 1: 3, 2: 2 }, null), 3);
  assert.equal(readOpen(null, {}, "24"), 9, "the old best (24 rolls on the big board) opens বড় বোর্ড");
  assert.equal(readOpen("4", {}, "24"), 4, "once written, the open level is the phone's own");
  assert.equal(readOpen("99", { 1: 1 }, null), 2, "junk falls back to the stars");
  assert.equal(readOpen(null, {}, "abc"), 1);
});

test("the remembered setup survives a round trip and rejects junk", () => {
  const prefs = { mode: "group" as const, level: 5, seats: 3 as const, bots: 4, two: true };
  assert.deepEqual(readPrefs(writePrefs(prefs)), prefs);
  assert.deepEqual(readPrefs("nope"), DEFAULT_PREFS);
  assert.deepEqual(readPrefs(JSON.stringify({ m: "x", l: 99, n: 9, b: 3, g: 7 })), DEFAULT_PREFS);
  assert.equal(readPrefs(JSON.stringify({ n: 2, b: 8 })).bots, 0, "a computer seat beyond the seats is dropped");
});

test("ReplayIsExact: links made by the old game still open, and a level's link replays its stars", () => {
  // Made by the code before the rewrite (same seeds, same careful picks).
  const solo = parseCard("s=123456&t=12&c=000&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.ok(solo && solo.card.players === 1 && solo.card.level === 0 && solo.card.names[0] === "রাফি" && solo.game.moves[0] === 12);
  const group = parseCard("s=99&t=11&p=3&g=2&c=0012914&n2=%E0%A6%AE%E0%A6%BF%E0%A6%AE&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.ok(group && group.card.players === 3 && group.card.pieces === 2 && group.card.names[1] === "মিম");
  for (const level of [1, 4, 7, 12]) {
    const { game } = levelRace(level, 77);
    const hash = cardHash(cardOf(game, ["রাফি"]), game);
    assert.match(hash, new RegExp(`(^|&)l=${level}(&|$)`));
    const back = parseCard(hash);
    assert.ok(back, `level ${level}`);
    assert.equal(back.card.level, level);
    assert.equal(starsOf(back.game), starsOf(game), "the card's stars are the ones you earned");
    assert.equal(back.game.moves[0], game.moves[0]);
  }
  // A computer seat in the group game rides along as `b`.
  const setup = classicSetup(3, 1, 0b100), dice = makeDice(31);
  let game = startGame(31, setup);
  while (game.phase !== "over") game = roll(game, dice(game.rolls));
  const hash = cardHash(cardOf(game, ["রাফি", "মিম"]), game);
  assert.match(hash, /&b=4/);
  assert.equal(parseCard(hash)?.card.bots, 4);
  for (const bad of ["s=5&t=9&l=0", "s=5&t=9&l=13", "s=5&t=9&l=3&p=2", "s=5&t=9&l=3&n2=x", "s=5&t=9&p=2&b=1", "s=5&t=9&p=2&b=8", "s=5&t=9&b=2", "s=5&t=9&l=1x"]) assert.equal(parseCard(bad), null, bad);
});
