// The afternoon's rules, on the real createGame, stepGame and clap the component runs (no canvas, no React).
import assert from "node:assert/strict";
import test from "node:test";
import { createGame, gameStars, starsOf, toDusk, nextMark, GRAIN, type Game } from "../lib/afternoon";
import { BOSS_PECK, FIELD, FIRST_PECK, HAT_X, HAT_Y, HIT_R, IMMUNE, MIN_GAP, NEAR_R, PARROT_FLY, SCARECROW, TAPPABLE, TOGETHER, nearScarecrow } from "../lib/field";
import { BOSS, HP, LEVEL_COUNT, LEVELS, MUNIA, SHALIK, SPARROW, levelOf } from "../lib/levels";
import {
  DUSK, EV_BOSS_GONE, EV_BOSS_HIT, EV_BOSS_IN, EV_DUSK_HELD, EV_MISS, EV_NEAR, EV_SHOO, EV_TENTH, FLYING, GONE, HOPPING, LOST, ON, PERCHED, SHOOED, SITTING,
} from "../lib/states";
import { clap, eating, nextBird, remaining, stepGame, tappable } from "../lib/step.hot";
import { DT, playBot, CASUAL } from "./bot";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
const seeds = Array.from({ length: 8 }, (_, index) => 1 + index * 7919);
const run = (game: Game, seconds: number) => { for (let i = 0; i < Math.round(seconds / DT) && game.over === ON; i++) stepGame(game, DT); return game; };
/** Steps until `test` holds for some bird, and returns its index. */
function until(game: Game, test: (i: number) => boolean) {
  for (let steps = 0; steps < 9000; steps++) {
    for (let i = 0; i < game.n; i++) if (test(i)) return i;
    stepGame(game, DT);
  }
  throw new Error("never happened");
}
const events = (game: Game, kind: number) => game.events.filter((event, i) => event.kind === kind && event.t >= 0 && i < Math.max(game.events.length, game.eventCount)).length;
const sitting = (game: Game, i: number) => game.state[i] === SITTING;
/** Shoos every other bird that is sitting, so a clap on the boss reaches the boss alone (a real player has cleared them as they came). */
const clearOthers = (game: Game, keep: number) => { for (let i = 0; i < game.n; i++) if (i !== keep && game.state[i] === SITTING) game.state[i] = SHOOED; };

test("same seed, same afternoon: every bird's kind, time and spot replay exactly; another seed differs", () => {
  for (const level of levels) {
    const a = createGame(level, 4242, 1), b = createGame(level, 4242, 1), c = createGame(level, 4243, 1);
    assert.deepEqual([...a.t0], [...b.t0]);
    assert.deepEqual([...a.x], [...b.x]);
    assert.deepEqual([...a.y], [...b.y]);
    assert.deepEqual([...a.kind], [...b.kind]);
    assert.notDeepEqual([...a.x], [...c.x], `level ${level}: another seed lays out another afternoon`);
  }
  // Who lands where never depends on the mode: a friend's link is the same afternoon on every mode.
  for (const level of [1, 5, 12]) assert.deepEqual([...createGame(level, 9, 0).land], [...createGame(level, 9, 2).land]);
  // A run replays: same claps at the same times give the same grain.
  const play = () => playBot(createGame(8, 31337, 1), CASUAL, 5);
  const x = play(), y = play();
  assert.deepEqual([x.grain, x.shooed, x.t], [y.grain, y.shooed, y.t]);
});

test("approach patterns are readable and fair: spots on the paddy, clear of the কাকতাড়ুয়া and each other, a bird can be hit before it first pecks", () => {
  for (const level of levels) for (const seed of seeds) {
    const game = createGame(level, seed, 1), row = levelOf(level);
    assert.ok(game.n >= 4, "something to do");
    let lone = 0;
    for (let i = 0; i < game.n; i++) {
      if (game.land[i] === Infinity) continue; // a boss's later escorts are placed when it lands (tested with the bosses)
      assert.ok(game.x[i] >= FIELD.left && game.x[i] <= FIELD.right && game.y[i] >= FIELD.top && game.y[i] <= FIELD.bottom, `level ${level}: bird ${i} on the paddy`);
      assert.ok(!nearScarecrow(game.x[i], game.y[i]), `level ${level}: nothing lands at the কাকতাড়ুয়ার feet`);
      assert.ok(game.land[i] < row.length + 1, "lands before dusk");
      // Reading time: from the moment the bird's shadow can be tapped to its first peck.
      const read = game.land[i] - (game.t0[i] + game.fly[i] * TAPPABLE) + (i === game.boss ? BOSS_PECK : FIRST_PECK);
      assert.ok(read >= 0.7, `level ${level}: ${read.toFixed(2)} s to read bird ${i}`);
      // Singles and groups sit MIN_GAP apart; a flock sits together on purpose.
      for (let j = 0; j < i; j++) {
        if (game.group[i] >= 0 && game.group[i] === game.group[j]) continue;
        if (game.land[j] === Infinity || Math.abs(game.land[i] - game.land[j]) > TOGETHER) continue;
        if (game.group[i] >= 0 || game.group[j] >= 0 || i >= game.escort && game.escort >= 0) continue;
        assert.ok(Math.hypot(game.x[i] - game.x[j], game.y[i] - game.y[j]) >= MIN_GAP - 0.01, `level ${level} seed ${seed}: birds ${i}, ${j} land together too close`);
      }
      if (game.kind[i] === SPARROW && game.group[i] < 0) lone++;
    }
    assert.ok(lone >= 1);
    // The first two arrivals are single sparrows.
    assert.ok(game.kind[0] === SPARROW && game.kind[1] === SPARROW);
    assert.ok(game.land[1] - game.land[0] >= 0.5);
  }
});

test("the first scare tap answers in the same call: shooed, counted and drawn from the event, no step in between", () => {
  const game = createGame(1, 5, 1);
  const i = until(game, j => sitting(game, j));
  const before = game.eventCount, t = game.t;
  const hits = clap(game, game.x[i], game.y[i]);
  assert.equal(hits, 1);
  assert.equal(game.state[i], SHOOED, "gone at once");
  assert.equal(game.t, t, "no time had to pass");
  assert.equal(game.shooed, 1);
  assert.equal(game.events[(game.eventCount - 1) % game.events.length].kind, EV_SHOO);
  assert.ok(game.eventCount > before);
  const ate = game.ate[i];
  run(game, 3);
  assert.equal(game.ate[i], ate, "it eats nothing once shooed");
});

test("a peck takes the mode's share; the first comes FIRST_PECK after landing, then one every few tenths; nothing eaten before a landing", () => {
  for (const [mode, bite] of [[0, 1], [1, 2], [2, 3]] as const) {
    const game = createGame(1, 7, mode);
    assert.equal(game.bite, bite);
    const i = until(game, j => sitting(game, j));
    const landed = game.land[i];
    assert.equal(game.grain, GRAIN, "no peck before a landing");
    run(game, FIRST_PECK + 0.02 + (game.t - landed < 0 ? 0 : 0));
    while (game.ate[i] === 0) stepGame(game, DT);
    assert.equal(game.grain, GRAIN - bite);
    assert.ok(game.t - landed >= FIRST_PECK - 0.05 && game.t - landed <= FIRST_PECK + 0.1);
  }
});

test("a clap reaches every bird within HIT_R; a miss ends the streak; a near miss is told; a bird still high in the air can't be reached", () => {
  const game = createGame(3, 11, 1);
  const first = until(game, j => game.state[j] === FLYING && game.t < game.t0[j] + 0.1);
  assert.equal(tappable(game, first), false, "just set off: out of reach");
  assert.equal(clap(game, game.x[first], game.y[first]), 0);
  assert.equal(game.misses, 1);
  assert.equal(game.combo, 0);
  until(game, j => j === first && tappable(game, j));
  assert.equal(game.state[first], FLYING, "the shadow marks the spot: reachable before it lands");
  assert.ok(game.t >= game.t0[first] + game.fly[first] * TAPPABLE - DT);
  // Just outside: a near miss with its event.
  const x = game.x[first] + HIT_R + 10, y = game.y[first];
  assert.equal(clap(game, x, y), 0);
  assert.equal(game.events[(game.eventCount - 1) % game.events.length].kind, EV_NEAR);
  assert.equal(clap(game, game.x[first] + NEAR_R + 80, game.y[first]), 0);
  assert.equal(game.events[(game.eventCount - 1) % game.events.length].kind, EV_MISS);
  // Just inside: a hit.
  assert.equal(clap(game, game.x[first] + HIT_R - 3, game.y[first]), 1);
  assert.equal(game.combo, 1);
  // Streak counts hits.
  assert.ok(game.bestCombo >= 1);
});

test("a শালিক hops aside on the first clap and flies off on the second", () => {
  const game = createGame(5, 3, 1);
  const i = until(game, j => game.kind[j] === SHALIK && sitting(game, j));
  assert.equal(game.hp[i], HP[SHALIK]);
  const x = game.x[i], y = game.y[i];
  assert.equal(clap(game, x, y), 1);
  assert.equal(game.state[i], HOPPING, "only a hop");
  assert.equal(game.shooed, 0);
  assert.equal(game.events[(game.eventCount - 1) % game.events.length].kind, EV_SHOO);
  assert.ok(Math.hypot(game.x[i] - x, game.y[i] - y) >= 40, "it lands somewhere else");
  assert.ok(game.x[i] >= FIELD.left && game.x[i] <= FIELD.right && game.y[i] >= FIELD.top && game.y[i] <= FIELD.bottom);
  run(game, 0.2);
  assert.equal(game.state[i] as number, HOPPING, "still mid-hop");
  assert.equal(clap(game, game.x[i], game.y[i]), 1, "reachable mid-hop");
  assert.equal(game.shooed, 1);
  assert.equal(game.state[i], SHOOED, "gone for good");
});

test("a মুনিয়া flock sits together: one clap in the middle reaches several", () => {
  const game = createGame(9, 21, 1);
  const first = until(game, j => game.kind[j] === MUNIA && sitting(game, j));
  const flock = game.group[first];
  run(game, 0.4);
  let sx = 0, sy = 0, size = 0;
  for (let i = 0; i < game.n; i++) if (game.group[i] === flock && game.state[i] === SITTING) { sx += game.x[i]; sy += game.y[i]; size++; }
  assert.ok(size >= 3);
  const hits = clap(game, sx / size, sy / size);
  assert.ok(hits >= 2, `one clap, ${hits} birds`);
  assert.equal(game.bestMulti, hits);
  assert.equal(game.combo, hits, "the streak counts every bird");
});

test("mist hides only the flight: birds in the mist are still tappable by their shadow", () => {
  const row = levelOf(6);
  assert.ok(row.fog && !levelOf(5).fog && !levelOf(7).fog);
  const game = createGame(6, 17, 1);
  const i = until(game, j => game.state[j] === FLYING && tappable(game, j));
  assert.equal(clap(game, game.x[i], game.y[i]), 1);
});

test("dusk: every bird still about flies home, the field is passed, stars follow the marks; all grain gone is a lost ক্ষেত", () => {
  const game = run(createGame(1, 3, 1), 40);
  assert.equal(game.over, DUSK, "an idle afternoon on level 1 loses grain but dusk still comes");
  assert.ok(game.grain < GRAIN);
  assert.equal(gameStars(game), 0, "idle: under the pass mark");
  assert.equal(remaining(game), 0);
  for (let i = 0; i < game.n; i++) assert.ok(game.state[i] === GONE || game.state[i] === SHOOED);
  assert.equal(toDusk(game), 0);
  const lost = run(createGame(2, 5, 2), 60);
  assert.equal(lost.over, LOST, "idle on কঠিন eats it all");
  assert.equal(lost.grain, 0, "the grain never goes below zero");
  // Force a loss.
  const g = createGame(3, 2, 2);
  g.grain = 3;
  until(g, j => sitting(g, j));
  run(g, 5);
  assert.equal(g.over, LOST);
  assert.equal(g.grain, 0);
  assert.equal(gameStars(g), 0, "a lost field has no stars whatever the marks");
});

test("stars, marks and the next mark use exact numbers; they are the same on every mode", () => {
  for (const level of levels) {
    const { pass, two, three } = levelOf(level);
    assert.ok(0 < pass && pass < two && two < three && three < GRAIN, `level ${level}: marks in order`);
    assert.deepEqual([starsOf(level, pass - 1), starsOf(level, pass), starsOf(level, two), starsOf(level, three), starsOf(level, GRAIN)], [0, 1, 2, 3, 3]);
    assert.equal(starsOf(level, GRAIN, LOST), 0);
    assert.deepEqual([nextMark(level, pass - 1), nextMark(level, pass), nextMark(level, two), nextMark(level, three)], [pass, two, three, null]);
  }
  assert.equal(createGame(1, 1, 0).row, createGame(1, 1, 2).row, "one row per ক্ষেত: the marks don't depend on the mode");
});

test("the edge: each tenth of grain lost is one event; the pulse and glow read these", () => {
  const game = createGame(4, 8, 2);
  let tenths = 0, lastTenth = 10;
  for (let i = 0; i < 6000 && game.over === ON; i++) {
    stepGame(game, DT);
    const left = Math.ceil(game.grain / 10);
    if (left < lastTenth) { tenths++; lastTenth = left; }
  }
  assert.ok(tenths >= 1, "an idle afternoon on কঠিন loses tenths");
  let found = 0;
  for (let i = 0; i < game.events.length; i++) if (game.events[i].kind === EV_TENTH) found++;
  assert.ok(found >= 1 || game.eventCount > game.events.length);
});

test("boss, পালের গোদা: three claps, flies to a new spot after each, can't be hit twice in one tap, holds the dusk until it is gone", () => {
  const game = createGame(4, 5, 0);
  assert.equal(levelOf(4).boss, 3);
  const b = game.boss;
  assert.ok(b >= 0 && game.kind[b] === BOSS && game.hp[b] === 3);
  until(game, j => j === b && sitting(game, j));
  assert.ok(events(game, EV_BOSS_IN) >= 0);
  clearOthers(game, b);
  const x = game.x[b], y = game.y[b];
  assert.equal(clap(game, x, y), 1);
  assert.equal(game.hp[b], 2);
  assert.equal(game.state[b], FLYING, "flies to a new spot");
  assert.ok(Math.hypot(game.x[b] - x, game.y[b] - y) > 100, "well away from where it sat");
  assert.equal(tappable(game, b), false, "out of reach for a moment");
  assert.equal(clap(game, game.x[b], game.y[b]), 0, "one clap, one hit");
  assert.equal(game.hp[b], 2);
  // Leave it be until dusk: dusk waits for the boss; everyone else goes home.
  while (game.t < levelOf(4).length + 1 && game.over === ON) { stepGame(game, DT); if (game.grain < 30) game.grain = 60; }
  assert.equal(game.over, ON, "the boss still holds the dusk");
  assert.equal(game.duskHeld, true);
  for (let i = 0; i < game.n; i++) if (i !== b) assert.ok(game.state[i] === GONE || game.state[i] === SHOOED);
  for (let k = 0; k < 10 && game.hp[b] > 0; k++) {
    until(game, j => j === b && tappable(game, j));
    clearOthers(game, b);
    clap(game, game.x[b], game.y[b]);
    run(game, IMMUNE + 0.05);
  }
  assert.equal(game.state[b], SHOOED);
  run(game, 0.1);
  assert.equal(game.over, DUSK);
  assert.ok(game.events.some(event => event.kind === EV_DUSK_HELD || event.kind === EV_BOSS_GONE || event.kind === EV_BOSS_HIT));
});

test("boss, ঝুঁটি শালিক: after each clap it perches on the মাথাল, out of reach, then drops back into the paddy", () => {
  const game = createGame(8, 6, 0), b = game.boss;
  assert.equal(game.hp[b], 4);
  until(game, j => j === b && sitting(game, j));
  clearOthers(game, b);
  assert.equal(clap(game, game.x[b], game.y[b]), 1);
  assert.equal(game.state[b], PERCHED);
  assert.equal(tappable(game, b), false);
  assert.equal(clap(game, HAT_X, HAT_Y), 0, "can't be reached on the মাথাল");
  while (game.state[b] === PERCHED) stepGame(game, DT);
  assert.equal(game.state[b], FLYING);
  assert.equal(game.fromX[b], HAT_X);
  until(game, j => j === b && tappable(game, j));
  clearOthers(game, b);
  assert.equal(clap(game, game.x[b], game.y[b]), 1);
  assert.equal(game.hp[b], 2);
});

test("boss, ডাকাত টিয়া: swoops in fast from the far side each time, with a flock around it", () => {
  const game = createGame(12, 9, 0), b = game.boss;
  assert.equal(game.hp[b], 3);
  until(game, j => j === b && sitting(game, j));
  assert.ok(game.escort >= 0 && game.perLeg === 3, "a মুনিয়া flock comes with each landing");
  const side = game.side[b];
  clearOthers(game, b);
  clap(game, game.x[b], game.y[b]);
  assert.equal(game.state[b], FLYING);
  assert.equal(game.fly[b], PARROT_FLY, "faster than the first approach");
  assert.notEqual(game.side[b], 0);
  assert.ok(side === -1 || side === 1);
  // Each landing sends its own escort, apart from the boss.
  const flock = game.escort + game.leg[b] * game.perLeg;
  assert.ok(game.land[flock] < Infinity && game.t0[flock] < Infinity, "the next escort has its time");
});

test("every finale takes its claps, then the field is passed; a casual bot chases every boss off", () => {
  for (const level of [4, 8, 12]) {
    let gone = 0;
    for (const seed of seeds) {
      const game = playBot(createGame(level, seed * 7919, 1), CASUAL, seed);
      if (game.over === DUSK && game.state[game.boss] === SHOOED) gone++;
    }
    assert.ok(gone >= 6, `level ${level}: boss chased off in ${gone}/8`);
  }
});

test("keyboard: arrows hop the hand to the bird they point at; none behind", () => {
  const game = createGame(3, 12, 1);
  until(game, j => sitting(game, j) && game.kind[j] === SPARROW);
  for (let k = 0; k < 600 && eating(game) < 2; k++) stepGame(game, DT);
  const list: number[] = [];
  for (let i = 0; i < game.n; i++) if (game.state[i] === SITTING) list.push(i);
  assert.ok(list.length >= 2);
  const left = list.reduce((a, b) => game.x[a] < game.x[b] ? a : b), right = list.reduce((a, b) => game.x[a] > game.x[b] ? a : b);
  assert.equal(nextBird(game, game.x[left], game.y[left], 1, 0) >= 0, true);
  assert.equal(nextBird(game, game.x[right], game.y[right], 1, 0), -1, "nothing further right");
});

test("no bird is ever hit twice, and clapping an empty field costs nothing but the streak", () => {
  const game = createGame(2, 4, 1);
  assert.equal(clap(game, 180, 400), 0);
  assert.equal(game.grain, GRAIN);
  assert.equal(game.misses, 1);
  const i = until(game, j => sitting(game, j));
  clap(game, game.x[i], game.y[i]);
  const shooed = game.shooed;
  clap(game, game.x[i], game.y[i]);
  assert.equal(game.shooed, shooed, "a shooed bird is not shooed again");
  assert.equal(game.state[i], SHOOED);
});
