import assert from "node:assert/strict";
import test from "node:test";
import { unlockedLevel } from "../../../shared/game-core";
import {
  angDiff, createGame, DRAIN, FINALE_HALF, GUST_WARN, HALF_WIDTHS, isFinaleChannel, LEVEL_COUNT, LEVELS, levelDef, makeRounds, MODE_INFO, MODES, nearGhost,
  nextAhead, openLevel, readAhead, readTimes, shout, starsOf, toNextStar, WORLDS, type Game, type Mode,
} from "../lib/antenna";
import { stepGame } from "../lib/step.hot";
import { CASUAL, percentile, play, SKILLED, type Skill } from "./bot";

const DT = 1 / 60;
const SEEDS = 120;
const run = (game: Game, turn: number, seconds: number) => { for (let i = 0; i < Math.round(seconds / DT); i++) stepGame(game, turn, DT); };
const share = (list: number[], pass: (value: number) => boolean) => list.filter(pass).length / list.length;

function evening(level: number, mode: Mode, skill: Skill) {
  const times: number[] = [];
  for (let seed = 1; seed <= SEEDS; seed++) {
    const result = play(seed * 13 + 5, level, mode, skill);
    assert.ok(result, `${skill.name} never finished level ${level} (${mode}) on seed ${seed * 13 + 5}`);
    times.push(result.tenths);
  }
  return times.sort((a, b) => a - b);
}

test("three worlds of four, each world ending in a named finale, one new thing per level", () => {
  assert.equal(LEVEL_COUNT, 12);
  assert.equal(WORLDS.length, 3);
  LEVELS.forEach((def, index) => {
    assert.equal(def.world, Math.floor(index / 4), `level ${index + 1} world`);
    assert.equal(def.finale !== null, index % 4 === 3, `level ${index + 1}: finales close each world`);
    assert.ok(def.name && def.teach, `level ${index + 1} has a name and a one-line lesson`);
    assert.ok(def.stars[0] < def.stars[1] && def.hard[0] < def.hard[1]);
  });
  assert.equal(new Set(LEVELS.map(def => def.name)).size, LEVEL_COUNT);
  // What each non-finale level adds over everything seen before it.
  const seen = new Set<string>();
  const things = (def: typeof LEVELS[number]) => [def.ghostFrom < 9 && "ghost", def.ghosts === 2 && "two ghosts", def.wind && "wind", def.gusts && "gusts", def.quiet && "quiet", def.wobble && "wobble", def.finale && "finale"].filter(Boolean) as string[];
  LEVELS.forEach((def, index) => {
    const fresh = things(def).filter(thing => !seen.has(thing));
    if (def.finale) assert.ok(fresh.length <= 1, `finale ${index + 1} brings at most its meter`);
    else if (index > 1 && index !== 10) assert.equal(fresh.length, 1, `level ${index + 1} adds exactly one thing: ${fresh.join(", ")}`);
    things(def).forEach(thing => seen.add(thing));
  });
  assert.ok(LEVELS[1].scale < LEVELS[0].scale, "level 2's one thing is the narrower spot");
});

test("level 1 is quick: three wide channels, and the casual bot clears it in 10 s on the median seed", () => {
  assert.equal(levelDef(1).channels, 3);
  const times = evening(1, "n", CASUAL);
  assert.ok(percentile(times, 0.5) <= 100, `median ${percentile(times, 0.5)}`);
  const firsts: number[] = [];
  for (let seed = 1; seed <= SEEDS; seed++) firsts.push(play(seed, 1, "n", CASUAL)!.game.splits[0]);
  assert.ok(percentile(firsts.sort((a, b) => a - b), 0.5) <= 4, "the first picture comes in about 3 s");
});

test("normal: every seed finishes; the skilled bot gets 3 stars and the casual bot 2+ on nearly every seed, 3 on most", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const skilled = evening(level, "n", SKILLED), casual = evening(level, "n", CASUAL);
    assert.ok(share(skilled, tenths => starsOf(tenths, level) === 3) >= 0.9, `level ${level} skilled 3★`);
    assert.ok(share(casual, tenths => starsOf(tenths, level) >= 2) >= 0.95, `level ${level} casual 2★+`);
    assert.ok(share(casual, tenths => starsOf(tenths, level) === 3) >= 0.7, `level ${level} casual 3★`);
  }
});

test("hard: every seed finishes, and the skilled bot still gets 2 stars or more on nearly every seed", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const skilled = evening(level, "h", SKILLED);
    evening(level, "h", CASUAL);
    assert.ok(share(skilled, tenths => starsOf(tenths, level, "h") >= 2) >= 0.9, `level ${level} hard skilled 2★+`);
  }
});

test("easy really is easy and never the short way to three stars", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const casual = evening(level, "e", CASUAL), normal = evening(level, "n", CASUAL);
    assert.ok(percentile(casual, 0.5) <= percentile(normal, 0.5), `level ${level} easy is faster`);
    assert.ok(share(casual, tenths => starsOf(tenths, level, "e") === 2) >= 0.95, `level ${level} easy 2★`);
    assert.equal(starsOf(1, level, "e"), 2, "two at most, however fast");
    assert.equal(toNextStar(1, level, "e"), 0);
  }
  assert.ok(MODE_INFO.e.half > MODE_INFO.n.half && MODE_INFO.h.half < MODE_INFO.n.half);
});

test("stars and the exact gap to the next one, per mode", () => {
  const [three, two] = levelDef(3).stars, [hardThree] = levelDef(3).hard;
  assert.equal(starsOf(three, 3), 3);
  assert.equal(starsOf(three + 1, 3), 2);
  assert.equal(starsOf(two + 1, 3), 1);
  assert.equal(toNextStar(three + 12, 3), 12);
  assert.equal(toNextStar(two + 5, 3), 5);
  assert.equal(starsOf(hardThree, 3, "h"), 3);
  assert.ok(hardThree > three, "hard gives more time for stars");
  assert.equal(starsOf(310, 1, "n", true), 3, "old-table levels keep their old star times");
});

test("each level's channels: the finale's programme is last, wide-ish, and needs the long hold", () => {
  for (let seed = 1; seed <= 300; seed++) {
    for (let level = 1; level <= LEVEL_COUNT; level++) {
      const def = levelDef(level), rounds = makeRounds(seed, def);
      assert.equal(rounds.length, def.channels);
      assert.equal(new Set(rounds.map(round => round.picture)).size, def.channels);
      if (def.finale) {
        assert.equal(rounds.at(-1)!.picture, def.finale.picture);
        assert.ok(Math.abs(rounds.at(-1)!.half - FINALE_HALF * def.scale) < 1e-9);
      }
      rounds.forEach((round, index) => {
        if (!isFinaleChannel(def, index)) assert.ok(Math.abs(round.half - HALF_WIDTHS[index] * def.scale) < 1e-9);
        if (round.decoy2 !== undefined && round.decoy2 !== null) {
          assert.ok(Math.abs(angDiff(round.decoy2, round.sweet)) >= 100, "the second ghost is far from the signal");
          assert.ok(Math.abs(angDiff(round.decoy2, round.decoy!)) >= 60, "and from the first ghost");
        }
      });
    }
  }
  const game = createGame(5, 4);
  assert.equal(game.need, MODE_INFO.n.dwell);
  game.index = 4;
  assert.ok(isFinaleChannel(game.def, 4));
});

test("a finale's meter drains slowly when you slip, instead of starting over", () => {
  const game = createGame(11, 4);
  for (let channel = 0; channel < 4; channel++) {
    stepGame(game, angDiff(game.rounds[game.index].sweet, game.angle), DT);
    run(game, 0, 2);
  }
  assert.equal(game.index, 4);
  stepGame(game, angDiff(game.rounds[4].sweet, game.angle), DT);
  run(game, 0, 1);
  const filled = game.dwell;
  assert.ok(filled > 0.9 && game.phase === "search", "a normal dwell would have locked by now");
  stepGame(game, game.rounds[4].half + 20, DT);
  run(game, 0, 0.5);
  assert.ok(Math.abs(game.dwell - (filled - DRAIN * (0.5 + DT))) < 0.05, `drained to ${game.dwell}`);
  assert.equal(game.slips, 1);
  assert.equal(shout("next", 4, game.def), "এবার কার্টুন! পুরো বসা পর্যন্ত ধরে রাখো।");
});

test("gusts warn first, then shove the antenna; they never come before the first turn or between channels", () => {
  const game = createGame(21, 7);
  run(game, 0, 8);
  assert.equal(game.gustWarn, 0, "no gusts before you start");
  let warned = -1, shoved = -1;
  const before = game.dial;
  for (let i = 0; i < 60 * 12 && game.gusts === 0; i++) {
    stepGame(game, i === 0 ? 0.01 : 0, DT);
    if (warned < 0 && game.gustWarn > 0) warned = i;
    if (shoved < 0 && game.gustLeft > 0) shoved = i;
  }
  assert.ok(warned >= 0 && shoved > warned, "a warning, then the shove");
  assert.ok(Math.abs((shoved - warned) * DT - GUST_WARN) < 0.05, "0.9 s of warning");
  assert.ok(Math.abs(Math.abs(angDiff(game.dial, before)) - 0.01) >= 18, "the shove moved the pole");
  assert.equal(game.gusts, 1);
});

test("a loose pole lags behind the dial and overshoots a little, then settles", () => {
  const game = createGame(3, 9);
  stepGame(game, 40, DT);
  assert.ok(game.angle < 5, "the antenna hasn't caught up yet");
  let most = 0;
  for (let i = 0; i < 120; i++) { stepGame(game, 0, DT); most = Math.max(most, angDiff(game.angle, 0)); }
  assert.ok(most > 40 && most < 46, `overshoot to ${most.toFixed(1)}°`);
  assert.ok(Math.abs(angDiff(game.angle, game.dial)) < 0.5, "settled on the dial");
});

test("the quiet level says nothing until the helper comes back", () => {
  const game = createGame(9, 6);
  assert.equal(shout(game.hint, 0, game.def), "নিচে সবাই চুপ। ঝিরঝির দেখেই বোঝো।");
  // 360°/s never stays long enough to lock, so this is one long search with nobody talking.
  run(game, 6, 6);
  assert.equal(game.hint, "quiet");
  assert.equal(shout("quiet", 0, game.def), "");
  run(game, 6, 15);
  assert.equal(game.index, 0);
  assert.match(game.hint, /^far-/, "after 20 s someone points the way");
});

test("two ghosts both count as ghosts", () => {
  const round = makeRounds(17, levelDef(10))[2];
  assert.ok(round.decoy !== null && round.decoy2 !== null && round.decoy2 !== undefined);
  assert.ok(nearGhost(round, round.decoy!) && nearGhost(round, round.decoy2!));
  assert.ok(!nearGhost(round, round.sweet));
});

test("every mode and level is deterministic: the same seed and inputs give the same evening", () => {
  for (const mode of MODES) for (const level of [1, 4, 7, 9, 12]) {
    const a = play(77, level, mode, CASUAL)!, b = play(77, level, mode, CASUAL)!;
    assert.equal(a.tenths, b.tenths);
    assert.deepEqual(Array.from(a.game.splits), Array.from(b.game.splits));
  }
});

test("own unlock rule: a friend's far level keeps its stars but doesn't open the levels in between", () => {
  // Cleared 1 and 2 yourself; a friend's link to level 9 is cleared.
  let stars: Record<number, number> = { 1: 3, 2: 2 }, ahead: number[] = [];
  assert.equal(openLevel(stars, ahead), 3);
  ahead = nextAhead(stars, ahead, 9); stars = { ...stars, 9: 2 };
  assert.deepEqual(ahead, [9]);
  assert.equal(openLevel(stars, ahead), 3, "still level 3, not 10");
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 10, "game-core's rule would have opened 3–9");
  // Your own play reaches 8, so 9 is now yours too.
  for (let level = 3; level <= 8; level++) { ahead = nextAhead(stars, ahead, level); stars = { ...stars, [level]: 1 }; }
  assert.equal(openLevel(stars, ahead), 10);
  // A friend's level you've already opened is just yours.
  assert.deepEqual(nextAhead({ 1: 1 }, [], 2), []);
  // Saved progress from before the rewrite (no ahead list) opens exactly what it opened.
  for (const old of [{}, { 1: 1 }, { 1: 3, 2: 3, 3: 1 }, { 1: 1, 7: 2 }] as Record<number, number>[]) assert.equal(openLevel(old, []), unlockedLevel(old, LEVEL_COUNT));
  assert.deepEqual(readAhead("[9, 3, 3, 99, \"x\"]"), [3, 9]);
  assert.deepEqual(readAhead("{"), []);
  assert.deepEqual(readTimes('{"4n": 233, "13n": 5, "4x": 9, "2e": -1, "1h": 70}'), { "4n": 233, "1h": 70 });
});
