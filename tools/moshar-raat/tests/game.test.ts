import assert from "node:assert/strict";
import test from "node:test";
import { createGame, gameStars, starsOf, toDawn, BIT, DIVING, FLY, GONE, HOVER, LOST, ON, WAIT, WON, ZAPPED, type Game } from "../lib/game";
import { countOf, levelOf, needZaps, BOSS, FAST, GHOST, LEVEL_COUNT, SWARM } from "../lib/levels";
import { BITE_X, BITE_Y, ENTER, FACE_R, HEAD_X, HEAD_Y, HIT_R, MIN_DIVE, NET_TOP } from "../lib/room";
import { remaining, stepGame, swing } from "../lib/step.hot";
import { CASUAL, DT, playBot } from "./bot";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
const seeds = Array.from({ length: 10 }, (_, index) => 1 + index * 7919);
const run = (game: Game, seconds: number) => { for (let i = 0; i < Math.round(seconds / DT) && game.over === ON; i++) stepGame(game, DT); return game; };
/** Steps until `test` holds for some mosquito, and returns it. */
function until(game: Game, test: (i: number) => boolean) {
  for (let steps = 0; steps < 6000; steps++) {
    for (let i = 0; i < game.n; i++) if (game.state[i] === FLY && test(i)) return i;
    stepGame(game, DT);
  }
  throw new Error("never happened");
}

test("same seed, same night: every mosquito's path and timing replay exactly", () => {
  for (const level of [1, 7, 13, 20]) {
    const a = createGame(level, 4242, 3), b = createGame(level, 4242, 3), c = createGame(level, 4243, 3);
    assert.deepEqual([...a.at], [...b.at]);
    assert.notDeepEqual([...a.at, ...a.hx], [...c.at, ...c.hx]);
    run(a, 12); run(b, 12);
    assert.deepEqual([...a.x], [...b.x]);
    assert.deepEqual([...a.state], [...b.state]);
    // The bot's night replays too: the same taps give the same count.
    assert.equal(playBot(createGame(level, 99, 3), CASUAL, 5).zaps, playBot(createGame(level, 99, 3), CASUAL, 5).zaps);
  }
});

test("every night holds what its row says, arrives during the night, and is fair: seconds on screen before any bite", () => {
  for (const level of levels) for (const seed of seeds) {
    const row = levelOf(level), game = createGame(level, seed, 3);
    assert.equal(game.n, countOf(level));
    const kinds = Array.from(game.kind);
    assert.equal(kinds.filter(kind => kind === FAST).length, row.fast);
    assert.equal(kinds.filter(kind => kind === GHOST).length, row.ghost);
    assert.equal(kinds.filter(kind => kind === SWARM).length, row.swarms * row.swarm);
    assert.equal(kinds.filter(kind => kind === BOSS).length, row.boss ? 1 : 0);
    if (row.plain) assert.notEqual(game.kind[0], FAST, "the first arrival is an easy one");
    for (let i = 0; i < game.n; i++) {
      assert.ok(game.at[i] >= 0.4 && game.at[i] <= row.length - 3, `night ${level}: arrives at ${game.at[i]}`);
      assert.ok(game.dive[i] >= MIN_DIVE - 1e-6, "a visible dive");
      assert.ok(game.biteAt[i] - game.at[i] >= ENTER + row.loiter[0] * 0.99 + MIN_DIVE * 0.99 - (game.kind[i] === FAST ? 0.4 : 0), `night ${level}: ${game.biteAt[i] - game.at[i]}s before a bite`);
      if (row.net.length) assert.ok(row.net.includes(game.tx[i]) && game.ty[i] === NET_TOP, "net nights head for a hole");
      else assert.deepEqual([game.tx[i], game.ty[i]], [BITE_X, BITE_Y]);
    }
  }
});

test("a swing zaps everything under the bat head, checked along the step it flew; misses end the streak and near misses are told", () => {
  const game = createGame(3, 7, 3), i = until(game, j => game.t - game.at[j] > 0.5);
  const x = game.x[i], y = game.y[i];
  assert.equal(swing(game, x + HIT_R + 40, y + HIT_R + 40), 0);
  assert.equal(game.combo, 0);
  assert.ok(swing(game, x + HIT_R - 2, y) >= 1, "the edge of the head still counts: a forgiving reach");
  assert.equal(game.state[i], ZAPPED);
  assert.equal(game.zaps, game.combo);
  assert.equal(swing(game, x, y), 0, "a zapped mosquito can't be zapped twice");
  // A fast mosquito mid-dash: the tap lands where it was a step ago and still hits.
  const fast = createGame(6, 11, 3), f = until(fast, j => fast.kind[j] === FAST && Math.hypot(fast.x[j] - fast.px[j], fast.y[j] - fast.py[j]) > 4);
  // A tap just behind where it was a step ago: out of reach of where it is now, inside the reach of its path.
  const step = Math.hypot(fast.x[f] - fast.px[f], fast.y[f] - fast.py[f]), ux = (fast.x[f] - fast.px[f]) / step, uy = (fast.y[f] - fast.py[f]) / step;
  const backX = fast.px[f] - ux * (HIT_R - 1), backY = fast.py[f] - uy * (HIT_R - 1);
  assert.ok(Math.hypot(backX - fast.x[f], backY - fast.y[f]) > HIT_R, "the tap is out of reach of where it is now");
  assert.ok(swing(fast, backX, backY) >= 1, "swept along its step, so a fast one is never missed by a frame");
});

test("bites, a lost night, dawn, and the last mosquito leaves at dawn", () => {
  const idle = playBot(createGame(1, 5, 3), "idle", 1);
  assert.equal(idle.over, LOST);
  assert.equal(idle.bites, 3);
  assert.ok(idle.t < levelOf(1).length, "idle loses before dawn, even on the first night");
  assert.ok(toDawn(idle) > 0);
  const won = playBot(createGame(1, 5, 3), CASUAL, 1);
  assert.equal(won.over, WON);
  assert.ok(won.t <= 10, `the first night is won within 10 s (${won.t})`);
  assert.equal(won.zaps + won.bites + [...won.state].filter(s => s === GONE).length, won.n, "every mosquito is accounted for");
  assert.ok([...won.state].every(s => s === ZAPPED || s === BIT || s === GONE));
  stepGame(won, DT);
  assert.equal(won.over, WON, "a finished night stays finished");
  const fresh = createGame(2, 3, 3);
  assert.equal(fresh.state[0], WAIT);
  assert.equal(remaining(fresh), fresh.n);
  // সহজ and কঠিন change only the bites the sleeper takes: the night is the same.
  const easy = createGame(9, 6, 5), hard = createGame(9, 6, 1);
  assert.deepEqual([...easy.biteAt], [...hard.biteAt]);
  assert.equal(playBot(hard, "idle", 1).bites, 1);
});

test("a slap: a miss on the sleeping face counts as a bite, from রাত 4 on, never on a মশারি night, never when it hits", () => {
  const early = createGame(3, 1, 3);
  run(early, 0.2);
  swing(early, HEAD_X, HEAD_Y);
  assert.equal(early.bites, 0, "রাত 3 has no slaps yet");
  const night = createGame(4, 1, 3);
  run(night, 0.2);
  swing(night, HEAD_X + FACE_R - 2, HEAD_Y);
  assert.deepEqual([night.bites, night.slaps], [1, 1]);
  swing(night, HEAD_X + FACE_R + 4, HEAD_Y);
  assert.equal(night.bites, 1, "just off the face is only a miss");
  const one = createGame(4, 1, 1);
  run(one, 0.2);
  swing(one, HEAD_X, HEAD_Y);
  assert.equal(one.over, LOST, "on কঠিন a slap wakes him");
  const net = createGame(7, 1, 3);
  run(net, 0.2);
  swing(net, HEAD_X, HEAD_Y);
  assert.equal(net.bites, 0, "under the মশারি the bat can't reach the face");
  // A mosquito right at the face: the swing that zaps it is no slap.
  const dive = createGame(4, 2, 3), d = until(dive, j => Math.hypot(dive.x[j] - HEAD_X, dive.y[j] - HEAD_Y) < 12);
  assert.ok(swing(dive, dive.x[d], dive.y[d]) >= 1);
  assert.equal(dive.slaps, 0);
});

test("the boss: hits to fall, backs off after each, can't be hit twice in one tap, bites and comes again, and holds the dawn", () => {
  const game = createGame(5, 3, 99), b = game.boss;
  assert.ok(b >= 0);
  assert.equal(game.hp[b], 3);
  until(game, i => i === b && game.part[b] === HOVER);
  const legBefore = game.leg[b];
  assert.equal(swing(game, game.x[b], game.y[b]), 1);
  assert.equal(game.hp[b], 2);
  assert.equal(game.leg[b], legBefore + 1, "a new leg: it backs off");
  assert.equal(swing(game, game.x[b], game.y[b]), 0, "immune for a moment after a hit");
  // Left alone, it reaches the pillow, bites, and flies off for another go.
  const bites = game.bites;
  until(game, i => i === b && game.part[b] === DIVING);
  for (let i = 0; i < 600 && game.state[b] === FLY && game.bites === bites; i++) stepGame(game, DT);
  assert.ok(game.bites > bites && game.state[b] === FLY, "a boss bite costs a bite and it stays");
  // Past dawn, only the boss is left and the night waits for it.
  const held = createGame(5, 3, 99);
  run(held, levelOf(5).length + 0.5);
  assert.equal(held.over, ON);
  assert.ok(held.dawnHeld);
  assert.equal(remaining(held), 1);
  for (let hits = 0; hits < 3; hits++) { until(held, i => i === held.boss && held.immune[i] < held.t); swing(held, held.x[held.boss], held.y[held.boss]); }
  assert.equal(held.state[held.boss], ZAPPED);
  stepGame(held, DT);
  assert.equal(held.over, WON, "the boss falls, the sun comes up");
});

test("a whole ঝাঁক landing is one bite; one tap in its middle zaps several", () => {
  const idle = createGame(16, 21, 99), first = Array.from(idle.kind).indexOf(SWARM), group = idle.group[first];
  const members = Array.from(idle.group).map((g, i) => (g === group ? i : -1)).filter(i => i >= 0);
  while (members.some(i => idle.state[i] === FLY || idle.state[i] === WAIT) && idle.t < 60) stepGame(idle, DT);
  // Only that swarm's landing counted: compare with the lone mosquitoes that bit by then.
  const loneBites = Array.from(idle.state).filter((s, i) => s === BIT && idle.kind[i] !== SWARM).length;
  const swarmBites = new Set(members.map(i => Math.round(idle.ended[i] * 2))).size;
  assert.ok(idle.bites <= loneBites + swarmBites + (idle.row.swarms - 1) * 4, "no bite per member");
  const game = createGame(16, 21, 3), m = until(game, i => game.kind[i] === SWARM && game.member[i] === 0 && game.t - game.at[i] > 1.2);
  assert.ok(swing(game, game.x[m], game.y[m]) >= 2, "several in one tap");
  assert.ok(game.bestMulti >= 2);
});

test("a ঝাপসা মশা fades while it hovers, blinks, and shows itself as it dives", () => {
  const game = createGame(11, 4, 99), g = until(game, i => game.kind[i] === GHOST && game.part[i] === HOVER);
  let low = 1, high = 0;
  for (let i = 0; i < 180 && game.part[g] === HOVER; i++) { stepGame(game, DT); low = Math.min(low, game.vis[g]); high = Math.max(high, game.vis[g]); }
  assert.ok(low < 0.25 && high > 0.8, `fades to ${low} and blinks to ${high}`);
  until(game, i => i === g && game.part[g] === DIVING && game.t - game.legAt[g] > game.enter[g] + game.loiter[g] + game.tell[g] + game.dive[g] * 0.6);
  assert.ok(game.vis[g] > 0.75, "seen in the dive");
});

test("stars: ★ for dawn, ★ for three in four zapped, ★ for no bite", () => {
  const need = needZaps(7);
  assert.equal(need, Math.ceil(countOf(7) * 0.75));
  assert.equal(starsOf(7, need, 0, false), 0);
  assert.equal(starsOf(7, 0, 2), 1);
  assert.equal(starsOf(7, need, 2), 2);
  assert.equal(starsOf(7, need - 1, 0), 2);
  assert.equal(starsOf(7, need, 0), 3);
  const won = playBot(createGame(1, 5, 3), CASUAL, 1);
  assert.equal(gameStars(won), starsOf(1, won.zaps, won.bites));
});
