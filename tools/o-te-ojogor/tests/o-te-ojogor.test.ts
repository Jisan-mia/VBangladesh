import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { makeRng, readLevels, recordLevel, totalStars, unlockedLevel } from "../../../shared/game-core";
import {
  aim, decoysFor, errorsOf, fallTime, firstTries, fruitAt, hinting, hold, makeGame, nudge, pickAbove, pickFruit, planCalm, planRound, starsOf,
  BASKET_SPEED, CALM_X, CATCH_HALF, CATCH_Y, EV_CATCH, EV_MISS, EV_WRONG, FALL, FREE, GROW, HANG, LAND_GAP, LANES, PICK_NONE, PICK_RIGHT, PICK_WRONG, REACT,
  type Game, type Mode,
} from "../lib/tree";
import { step } from "../lib/step.hot";
import { finaleName, levelOf, starLimits, units, worldIndex, CONSONANTS, LEVELS, LEVEL_COUNT, NUMBERS, VOWELS, WORDS, WORLDS } from "../lib/levels";
import { badgeTitle, cleanHash, clearLine, humanLine, missLine, MODES, newsLine, parseShared, shortTitle, tallyLine, wrongLine, hintLine } from "../lib/link";
import { afterClear, nextUp, playable, readMode, readOpened, readUnlock, recommended, withOpened } from "../lib/progress";
import {
  again, back, closeList, createSession, endLive, finish, grab, home, leave, letGo, moving, openList, pause, resume, start, tapCounts, GUARD_MS, type Session,
} from "../lib/session";
import { boing, chime, rustle, thump } from "../lib/sound";
import { hasPicture } from "../lib/art";
import { site } from "../content";
import { share } from "../share";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
const seeds = Array.from({ length: 10 }, (_, index) => 1 + index * 7919);
const DT = 1 / 60;
const run = (game: Game, seconds: number) => { for (let i = 0; i < Math.round(seconds / DT); i++) step(game, DT); };

/**
 * ঝড়ো হাওয়া, a scripted player stepping the same pure rules the page uses. It notices a fruit `react` seconds after it appears,
 * heads for the right one at full basket speed (off by up to `err` units), and (when `careful`) steps aside rather than catch a wrong
 * one it noticed. It notices each wrong fruit with chance `attention`.
 */
function playWind(level: number, seed: number, { react = REACT, careful = true, idle = false, wild = 0, err = 0, attention = 1 } = {}) {
  const game = makeGame(level, seed, "wind"), seen = new Float64Array(game.fruits.length).fill(-1), rng = makeRng(seed ^ 0x51ed), noticed = new Uint8Array(game.fruits.length);
  let offset = 0, lastTarget = -1;
  while (!game.over) {
    game.fruits.forEach((fruit, slot) => { if (fruit.state === FREE) seen[slot] = -1; else if (seen[slot] < 0) { seen[slot] = game.t; noticed[slot] = rng() < attention ? 1 : 0; } });
    if (!idle) {
      const want = game.spec.items[game.index].text;
      const target = game.fruits.findIndex((fruit, slot) => fruit.text === want && (fruit.state === HANG || fruit.state === FALL) && game.t - seen[slot] >= react);
      if (target !== lastTarget) { lastTarget = target; offset = (rng() * 2 - 1) * err; }
      let goal = target >= 0 ? game.fruits[target].x + offset : game.basketX;
      if (wild && rng() < wild) goal = LANES[Math.floor(rng() * 5)];
      if (careful) {
        const bad = (to: number) => game.fruits.some((fruit, slot) => {
          if (fruit.state !== FALL || fruit.text === want || !noticed[slot]) return false;
          const tau = (CATCH_Y - fruit.y) / game.spec.speed;
          if (tau <= 0 || tau > 0.6) return false;
          const at = game.basketX + Math.max(-BASKET_SPEED * tau, Math.min(BASKET_SPEED * tau, to - game.basketX));
          return Math.abs(at - fruit.x) <= CATCH_HALF + 4;
        });
        if (bad(goal)) goal = !bad(game.basketX) ? game.basketX : [LANES[0], LANES[4], LANES[2]].find(to => !bad(to)) ?? goal;
      }
      aim(game, goal);
    }
    step(game, DT);
    assert.ok(game.t < 900, "a level always ends");
    if (idle && game.t > 60) break;
  }
  return game;
}

/**
 * গাছতলা, a child who knows the next letter with chance `know`, otherwise taps any fruit; after two misses the glow shows the way.
 * Taps `think` seconds after the fruits have grown.
 */
function playCalm(level: number, seed: number, { know = 0.8, think = 0.6, maxTaps = 5000 } = {}) {
  const game = makeGame(level, seed, "calm"), rng = makeRng(seed ^ 0xa11);
  let taps = 0, readyAt = -1, round = -1;
  while (!game.over) {
    step(game, DT);
    if (game.round !== round) { round = game.round; readyAt = game.t + GROW + think; }
    if (game.falling >= 0 || game.t < readyAt) continue;
    const hanging = game.fruits.map((fruit, slot) => fruit.state === HANG ? slot : -1).filter(slot => slot >= 0);
    if (!hanging.length) continue;
    const right = hanging.find(slot => game.fruits[slot].item === game.index)!;
    const slot = hinting(game) || rng() < know ? right : hanging[Math.floor(rng() * hanging.length)];
    pickFruit(game, slot);
    taps++;
    readyAt = game.t + think;
    assert.ok(taps < maxTaps, "a level always ends");
  }
  return { game, taps };
}

test("the sequences are the বর্ণমালা in order, NFC, with a picture word for every letter", () => {
  assert.deepEqual(VOWELS.map(item => item.text).join(""), "অআইঈউঊঋএঐওঔ");
  assert.equal(CONSONANTS.length, 39);
  assert.deepEqual(CONSONANTS.slice(0, 5).map(item => item.text), ["ক", "খ", "গ", "ঘ", "ঙ"]);
  assert.deepEqual(CONSONANTS.slice(-7).map(item => item.text), ["ড়", "ঢ়", "য়", "ৎ", "ং", "ঃ", "ঁ"]);
  assert.equal(NUMBERS.map(item => item.text).join(" "), "১ ২ ৩ ৪ ৫ ৬ ৭ ৮ ৯ ১০ ১১ ১২ ১৩ ১৪ ১৫ ১৬ ১৭ ১৮ ১৯ ২০");
  assert.equal(VOWELS[0].label, "অ-তে অজগর");
  assert.equal(CONSONANTS[4].label, "ব্যাঙের ঙ");
  for (const item of [...VOWELS, ...CONSONANTS, ...NUMBERS]) {
    assert.equal(item.text, item.text.normalize("NFC"));
    assert.equal(item.label, item.label.normalize("NFC"));
    assert.ok(item.label.includes(item.text), `${item.label} shows ${item.text}`);
    assert.ok(item.pic, item.text);
  }
  assert.equal(new Set(VOWELS.concat(CONSONANTS).map(item => item.pic)).size, 50, "every letter has its own picture");
});

test("words are NFC, free of যুক্তবর্ণ, and split into the units a child spells", () => {
  assert.deepEqual(units("নৌকা"), ["নৌ", "কা"]);
  assert.deepEqual(units("হাঁস"), ["হাঁ", "স"]);
  assert.deepEqual(units("ঘুড়ি"), ["ঘু", "ড়ি"]);
  for (const word of Object.keys(WORDS)) {
    assert.equal(word, word.normalize("NFC"), word);
    assert.doesNotMatch(word, /্/u, `${word} has no হসন্ত, so no যুক্তবর্ণ`);
    assert.equal(units(word).join(""), word);
  }
  for (const level of LEVELS.filter(level => level.world === "word")) {
    const ends = level.items.filter(item => item.word);
    for (const item of ends) assert.equal(item.text, units(item.word!).at(-1));
    assert.equal(level.items.map(item => item.text).join(""), ends.map(item => item.word).join(""));
  }
});

test("four worlds cover the 22 levels in order; each ends on a named finale that is a milestone", () => {
  assert.equal(LEVEL_COUNT, 22);
  assert.deepEqual(WORLDS.map(world => world.world), ["vowel", "consonant", "word", "number"]);
  let next = 1;
  for (const world of WORLDS) {
    assert.equal(world.first, next);
    for (let level = world.first; level <= world.last; level++) { assert.equal(levelOf(level).world, world.world); assert.equal(worldIndex(level), WORLDS.indexOf(world)); }
    assert.ok(levelOf(world.last).milestone, `${world.finale} is a milestone`);
    assert.equal(finaleName(world.last), world.finale);
    assert.equal(badgeTitle(world.last), world.finale);
    next = world.last + 1;
  }
  assert.equal(next, LEVEL_COUNT + 1);
  assert.equal(finaleName(1), "");
  for (let i = 1; i < LEVELS.length; i++) {
    const before = LEVELS[i - 1], now = LEVELS[i];
    if (before.world !== now.world) continue;
    assert.ok(now.speed >= before.speed && now.speed - before.speed <= 35, `level ${i + 1} speed`);
    assert.ok(now.decoys >= before.decoys && now.decoys - before.decoys <= 1, `level ${i + 1} decoys`);
  }
});

test("ঝড়ো হাওয়া rounds are seeded, fair, and the right fruit is always reachable in time from anywhere", () => {
  const far = (LANES[4] - LANES[0]) / BASKET_SPEED + REACT;
  for (const level of levels) for (const seed of seeds) {
    const spec = levelOf(level);
    for (let index = 0; index < spec.items.length; index++) for (const round of [0, 1, 5, 17]) for (const ease of [-1, 0, 1]) {
      const decoys = decoysFor(level, round + index, ease);
      const plans = planRound(level, seed, round + index, index, decoys);
      assert.deepEqual(plans, planRound(level, seed, round + index, index, decoys), "same seed, same round");
      const [target, ...wrong] = plans;
      assert.ok(target.target && target.text === spec.items[index].text);
      assert.ok(target.drop + fallTime(spec, target.lane) >= far);
      assert.equal(new Set(plans.map(plan => plan.lane)).size, plans.length, "one fruit per branch");
      const close = new Set(spec.items.slice(index, index + 3).map(item => item.text));
      for (const decoy of wrong) assert.ok(!close.has(decoy.text), "a wrong fruit is never the right one or the next two");
      const lands = plans.map(plan => plan.drop + fallTime(spec, plan.lane)).sort((a, b) => a - b);
      for (let k = 1; k < lands.length; k++) assert.ok(lands[k] - lands[k - 1] >= LAND_GAP - 1e-9, "never two at once");
      assert.ok(plans.length <= 4, "never more than four fruits");
    }
  }
  assert.equal(planRound(1, 9, 0, 0).length, 1, "the first fruit of the game falls alone");
});

test("গাছতলা rounds: 1–4 fruits in wide columns, the right one always there, no near-letter decoys, seeded", () => {
  for (const level of levels) for (const seed of seeds.slice(0, 4)) {
    const spec = levelOf(level);
    for (let index = 0; index < spec.items.length; index++) for (const ease of [-1, 0, 1]) {
      const round = index + 2, plans = planCalm(level, seed, round, index, decoysFor(level, round, ease));
      assert.deepEqual(plans, planCalm(level, seed, round, index, decoysFor(level, round, ease)));
      assert.ok(plans.length >= 1 && plans.length <= 4, "2–4 choices, never 6");
      assert.equal(plans.filter(plan => plan.target).length, 1);
      assert.equal(plans.find(plan => plan.target)!.text, spec.items[index].text);
      assert.equal(new Set(plans.map(plan => plan.lane)).size, plans.length);
      assert.equal(new Set(plans.map(plan => plan.text)).size, plans.length, "no two fruits alike");
      const close = new Set(spec.items.slice(index, index + 3).map(item => item.text));
      for (const plan of plans) if (!plan.target) assert.ok(!close.has(plan.text));
    }
  }
  for (let n = 2; n <= 4; n++) for (let k = 1; k < n; k++) assert.ok(CALM_X[n][k] - CALM_X[n][k - 1] >= 80, "each fruit owns a column at least 80 units wide");
  assert.equal(planCalm(1, 5, 0, 0).length, 1, "level 1 starts with one fruit, then one more");
  assert.equal(planCalm(1, 5, 2, 2).length, 2);
});

test("ঝড়ো হাওয়া bots: a careful player clears every level with 3 stars on every seed", () => {
  for (const level of levels) for (const seed of seeds) {
    const game = playWind(level, seed);
    assert.ok(game.over && game.index === game.spec.items.length);
    assert.equal(game.missed, 0, `level ${level} seed ${seed}: the right fruit is always reachable`);
    assert.equal(game.wrong, 0, `level ${level} seed ${seed}: every wrong fruit can be dodged`);
    assert.equal(starsOf(level, errorsOf(game)), 3);
  }
});

test("ঝড়ো হাওয়া bots: a careless player clears level 1 with 3 stars on ≥ 90% of seeds; one who notices 70% of wrong fruit clears the last finale on 40–90%", () => {
  const many = Array.from({ length: 40 }, (_, i) => 11 + i * 104729);
  const rate = (level: number, bot: Parameters<typeof playWind>[2]) => many.filter(seed => starsOf(level, errorsOf(playWind(level, seed, bot))) === 3).length / many.length;
  const careless = rate(1, { react: 0.35, careful: false, wild: 0.03, err: 30 });
  const medium = { react: 0.35, careful: true, wild: 0.02, err: 25, attention: 0.7 };
  const first = rate(1, medium), last = rate(22, medium);
  assert.ok(careless >= 0.9, `careless, level 1: ${careless}`);
  assert.ok(first >= 0.95, `medium, level 1: ${first}`);
  assert.ok(last >= 0.4 && last <= 0.9, `medium, level 22: ${last}`);
  const idle = playWind(3, 5, { idle: true });
  assert.ok(!idle.over && idle.missed > 3, "nobody playing: the right fruit keeps coming back, nothing breaks");
  assert.ok(idle.slips <= idle.index + 1, "at most one slip per letter, however many fall or bounce");
});

test("গাছতলা bots: a 4-year-old finishes every level; level 1 earns 3 stars on ≥ 60% of seeds; even random taps finish", () => {
  for (const level of levels) for (const seed of seeds.slice(0, 5)) {
    const { game } = playCalm(level, seed);
    assert.ok(game.over && game.index === game.spec.items.length, `level ${level}`);
  }
  const many = Array.from({ length: 60 }, (_, i) => 3 + i * 7717);
  const three = many.filter(seed => starsOf(1, playCalm(1, seed).game.slips) === 3).length / many.length;
  assert.ok(three >= 0.6, `level 1 three stars: ${three}`);
  for (const level of [1, 9, 22]) {
    const { game, taps } = playCalm(level, 99, { know: 0 });
    assert.ok(game.over, `level ${level}: random taps still finish`);
    assert.ok(taps <= game.spec.items.length * (2 + 1), `the glow after two misses bounds it: ${taps} taps`);
  }
  // Level 1, perfect: the first picture word within 2 seconds, the whole level within ~14.
  const fast = playCalm(1, 42, { know: 1, think: 0.5 }).game;
  assert.ok(fast.t < 14, `level 1 took ${fast.t}s`);
  const first = makeGame(1, 42, "calm");
  let caughtAt = 0;
  for (let i = 0; i < 600 && !caughtAt; i++) { step(first, DT); if (first.t > GROW + 0.5 && first.falling < 0 && first.index === 0) pickFruit(first, first.fruits.findIndex(f => f.state === HANG)); if (first.events & EV_CATCH) caughtAt = first.t; }
  assert.ok(caughtAt > 0 && caughtAt < 2, `first catch at ${caughtAt}s`);
});

test("গাছতলা: a wrong tap shakes the fruit and rocks the basket, never moves on; two misses make the right one glow; the right one drops in", () => {
  const game = makeGame(4, 77, "calm");
  run(game, 0.6);
  const right = game.fruits.findIndex(fruit => fruit.state === HANG && fruit.item === 0);
  const wrong = game.fruits.findIndex(fruit => fruit.state === HANG && fruit.item !== 0);
  assert.ok(right >= 0 && wrong >= 0);
  assert.equal(pickFruit(game, wrong), PICK_WRONG);
  assert.ok(game.fruits[wrong].shake > 0 && game.wobble > 0);
  assert.equal(game.fruits[wrong].state, HANG, "the wrong fruit stays on its branch");
  assert.equal(game.index, 0); assert.equal(game.slips, 1); assert.ok(!hinting(game));
  assert.equal(pickFruit(game, wrong), PICK_WRONG);
  assert.equal(game.slips, 1, "one letter, one slip, however many tries");
  assert.ok(hinting(game), "after two misses the right fruit glows");
  assert.equal(pickFruit(game, right), PICK_RIGHT);
  assert.equal(pickFruit(game, wrong), PICK_NONE, "nothing else while the picked fruit falls");
  run(game, 1);
  assert.equal(game.index, 1); assert.ok(!hinting(game), "the glow is for one letter only");
  assert.equal(game.fruits[wrong].state === HANG, false, "the round's other fruits fade away");
  assert.equal(firstTries(game), 0);
  assert.equal(pickFruit(makeGame(1, 1, "wind"), 0), PICK_NONE, "ঝড়ো হাওয়া has no tapping");
});

test("গাছতলা keys and taps: ← → move the basket fruit to fruit, Space picks the one above it, a tap anywhere in a column picks that fruit", () => {
  const game = makeGame(9, 5, "calm");
  run(game, 0.6);
  const xs = game.fruits.filter(fruit => fruit.state === HANG).map(fruit => fruit.x).sort((a, b) => a - b);
  aim(game, xs[0]); run(game, 0.6);
  nudge(game, 1);
  assert.equal(game.aimX, xs[1]);
  nudge(game, -1); nudge(game, -1);
  assert.equal(game.aimX, xs[0]);
  const above = fruitAt(game, game.aimX);
  assert.equal(game.fruits[above].x, xs[0]);
  assert.notEqual(pickAbove(game), PICK_NONE);
  assert.equal(fruitAt(game, xs[1] + 30), game.fruits.findIndex(fruit => fruit.state === HANG && fruit.x === xs[1]), "a column is wide");
});

test("the quiet difficulty: three misses in a row hang one fewer wrong fruit; five first tries hang one more (never over 4)", () => {
  assert.equal(decoysFor(5, 3, -1), levelOf(5).decoys - 1);
  assert.equal(decoysFor(5, 3, 1), levelOf(5).decoys + 1);
  assert.equal(decoysFor(9, 3, 1), 3, "never more than four fruits");
  assert.equal(decoysFor(1, 0, 1), 0, "the first two fruits of the game hang alone");
  const game = makeGame(5, 8, "calm");
  run(game, 0.6);
  const wrong = game.fruits.findIndex(fruit => fruit.state === HANG && fruit.item !== 0);
  for (let i = 0; i < 3; i++) pickFruit(game, wrong);
  assert.equal(game.ease, -1);
  const best = playCalm(4, 3, { know: 1 }).game;
  assert.equal(best.slips, 0);
  assert.equal(best.ease, 1, "five right in a row steps it up");
});

test("stars count letters that needed a second try; a short level forgives one, a long one two", () => {
  assert.deepEqual(starLimits(1), [1, 5]);
  assert.deepEqual(starLimits(11), [2, 8]);
  assert.equal(starsOf(1, 0), 3); assert.equal(starsOf(1, 1), 3); assert.equal(starsOf(1, 2), 2); assert.equal(starsOf(1, 6), 1);
  assert.equal(starsOf(22, 2), 3); assert.equal(starsOf(22, 3), 2);
});

test("determinism: the same seed and the same inputs give the same tree, in both modes", () => {
  for (const mode of ["calm", "wind"] as Mode[]) {
    const a = mode === "calm" ? playCalm(12, 31).game : playWind(12, 31, { react: 0.4, careful: false, wild: 0.02 });
    const b = mode === "calm" ? playCalm(12, 31).game : playWind(12, 31, { react: 0.4, careful: false, wild: 0.02 });
    assert.equal(a.t, b.t); assert.equal(a.wrong, b.wrong); assert.equal(a.slips, b.slips); assert.equal(a.missed, b.missed);
  }
});

// ---- statechart replays (ai_docs/statecharts/o-te-ojogor/README.md) ----

/** The component's pause handler: the session pauses and the basket stops where it is. */
const pauseBoth = (s: Session, g: Game) => { pause(s); hold(g); };

test("bug 1, BasketStopsWhenYouLetGo: hold ←, pause, let go under the menu, resume → the basket stays where it stopped", () => {
  const s = createSession(), g = makeGame(4, 99, "wind");
  assert.ok(start(s, false));
  run(g, 0.4);
  assert.ok(grab(s)); aim(g, LANES[0]);
  run(g, 0.1);
  pauseBoth(s, g);
  const stopped = g.basketX;
  assert.equal(g.aimX, stopped, "the pause drops the aim");
  assert.equal(s.held, false);
  // The keyup is swallowed by the menu; nothing else happens. Then চালিয়ে যাও.
  assert.ok(resume(s));
  run(g, 1.5);
  assert.equal(g.basketX, stopped, "no key down, the basket stays");
});

test("bug 2, InputReleasedWhenAway: hold →, click into another window, come back → nothing is held and the basket stays", () => {
  const s = createSession(), g = makeGame(4, 99, "wind");
  start(s, false); run(g, 0.4);
  grab(s); aim(g, LANES[4]); run(g, 0.05);
  leave(s); hold(g);
  assert.equal(s.held, false); assert.ok(s.paused); assert.ok(!moving(s));
  const stopped = g.basketX;
  back(s);
  assert.ok(resume(s));
  run(g, 1.5);
  assert.equal(g.basketX, stopped);
});

test("the tap that brings focus back is not a move; nothing moves while away, paused or choosing a level", () => {
  const s = createSession();
  assert.ok(!openList(s) || closeList(s) === undefined);
  start(s, false);
  assert.ok(moving(s));
  assert.ok(!openList(s), "no level list mid-round");
  leave(s);
  assert.ok(!moving(s) && s.paused);
  assert.ok(!resume(s), "can't resume while still away");
  back(s);
  assert.equal(tapCounts(s), false, "the first tap back only wakes the game");
  assert.ok(resume(s));
  assert.equal(tapCounts(s), true);
  assert.ok(!grab({ ...s, paused: true }), "no steering while paused");
  const t = createSession();
  leave(t);
  assert.ok(!start(t, false), "no round starts while the window is away");
  back(t);
  assert.ok(openList(t)); assert.ok(!start(t, false), "or while the level list is open");
  closeList(t); assert.ok(start(t, false));
});

test("the end screen: a key held through the last catch or a quick tap never skips it; nothing starts on its own", () => {
  const s = createSession();
  start(s, false);
  assert.ok(finish(s, 1000, false));
  assert.ok(!finish(s, 1001, false), "a round ends once");
  assert.ok(!endLive(s, 1000 + GUARD_MS - 1));
  assert.ok(!again(s, 1000 + GUARD_MS - 1, false), "আবার খেলো waits for the guard");
  assert.equal(s.phase, "done");
  assert.ok(again(s, 1000 + GUARD_MS, false));
  assert.equal(s.phase, "play");
  finish(s, 5000, false);
  home(s);
  assert.equal(s.phase, "title", "শেষ goes to the title; the next level waits for খেলো");
});

test("bug 5, RestAtTheBreak / NoNewRoundPastLimit: past today's limit a round never starts, and the rest screen comes at the end", () => {
  const s = createSession();
  assert.ok(!start(s, true));
  assert.ok(s.resting); assert.equal(s.phase, "title");
  s.resting = false;
  start(s, false);
  finish(s, 100, true);
  assert.ok(s.resting, "the round that ran past the limit ends on the rest screen");
  assert.ok(!again(s, 100 + GUARD_MS, false), "no আবার খেলো behind the rest screen");
  // RestOnlyAtBreak, over many random action sequences: the rest screen never covers a round in play.
  const rng = makeRng(7);
  for (let trial = 0; trial < 400; trial++) {
    const x = createSession();
    let now = 0;
    for (let k = 0; k < 30; k++) {
      now += 300;
      const over = rng() < 0.3, act = Math.floor(rng() * 9);
      if (act === 0) start(x, over); else if (act === 1) finish(x, now, over); else if (act === 2) again(x, now, over);
      else if (act === 3) home(x); else if (act === 4) leave(x); else if (act === 5) back(x); else if (act === 6) resume(x);
      else if (act === 7) pause(x); else x.resting = false;
      assert.ok(!(x.resting && x.phase === "play" && moving(x)), "rest only at a break");
      assert.ok(!x.paused || x.phase === "play", "only a round in play is ever paused");
      assert.ok(!x.held || moving(x), "nothing is held unless the round moves");
    }
  }
});

test("bug 3, UnlockNeverShrinks: links to level 8 then level 3 lock nothing, and clearing a link's far level opens nothing between", () => {
  const stars = readLevels(JSON.stringify({ 1: 3 }), LEVEL_COUNT);
  const { unlock, migrated } = readUnlock(null, stars, LEVEL_COUNT);
  assert.equal(unlock, 2); assert.ok(migrated, "migrated once from the stars");
  assert.equal(readUnlock("2", { ...stars, 8: 3 }, LEVEL_COUNT).unlock, 2, "a saved unlock wins over far stars");
  const open = (links: number[], starsNow = stars) => levels.filter(level => playable(level, unlock, starsNow, links));
  let links = withOpened(readOpened(null, LEVEL_COUNT), 8);
  assert.deepEqual(open(links), [1, 2, 8], "the link plays only its own level");
  // The second link (level 3) arrives before level 8 was played: 8 stays open, 4–7 stay shut.
  links = withOpened(readOpened(JSON.stringify(links), LEVEL_COUNT), 3);
  assert.deepEqual(open(links), [1, 2, 3, 8], "a second link locks nothing the first opened");
  // Clearing the link's level 8: its stars stay, and nothing between opens.
  const after = recordLevel(stars, 8, 3);
  assert.equal(afterClear(unlock, 8, LEVEL_COUNT), unlock);
  assert.deepEqual(open([], after), [1, 2, 8], "a cleared link level stays open by its stars alone");
  assert.deepEqual(readOpened('[3, 3, 0, 99, "x", 2.5, 8]', LEVEL_COUNT), [3, 8]);
  assert.deepEqual(readOpened("not json", LEVEL_COUNT), []);
  assert.equal(afterClear(2, 2, LEVEL_COUNT), 3, "clearing the furthest open level opens the next");
  assert.equal(unlockedLevel(after, LEVEL_COUNT), 9, "the shared rule is untouched (and would have opened 2–8)");
  assert.equal(recommended(3, after), 2);
  assert.equal(nextUp(2, 3, LEVEL_COUNT), 3); assert.equal(nextUp(8, 3, LEVEL_COUNT), 8); assert.equal(nextUp(22, 22, LEVEL_COUNT), 22);
  assert.equal(totalStars(after), 6);
});

test("bug 4, NoChildDataLeaves: old links (with a name) still open their level and seed, the name is never read and leaves the address bar", () => {
  const old = "s=4242&t=2&l=3&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF";
  assert.deepEqual(parseShared(`#${old}`), { level: 3, seed: 4242 }, "no name in what the game reads");
  assert.equal(cleanHash(`#${old}`), "s=4242&t=2&l=3");
  assert.equal(cleanHash("#s=1&t=0&l=1&n=x&og=1&evil=1"), "s=1&t=0&l=1");
  for (const bad of ["s=4242&t=2&l=23", "s=4242&t=2&l=0", "s=4242&t=2&l=03", "s=4242&t=2", "s=4242&t=100&l=3", "s=0&t=2&l=3", "s=4242&t=2&l=3x", `s=4242&t=2&l=3&n=${"x".repeat(700)}`, "", "junk"]) assert.equal(parseShared(bad), null, bad);
  for (const state of [old, "s=1&t=0&l=1", "", "anything"]) assert.equal(share.normalize(state), null, "the server accepts no state for this kids' tool");
  const preview = share.preview(old);
  assert.doesNotMatch(`${preview.title} ${preview.description}`, /রাফি/);
  assert.ok(preview.title.includes(site.name));
});

test("bug 4, NoNetworkCalls / NoShareForKids / NoNameField: the tool's code has no network, no share bar, no text field", () => {
  const files: string[] = [];
  const walk = (dir: string) => { for (const name of readdirSync(dir)) { const full = join(dir, name); if (statSync(full).isDirectory()) { if (name !== "tests") walk(full); } else if (/\.(ts|tsx)$/.test(name)) files.push(full); } };
  walk(join(import.meta.dirname, ".."));
  assert.ok(files.length > 8);
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /\/api\//, file);
    assert.doesNotMatch(text, /\bfetch\(|sendBeacon|XMLHttpRequest|share-client|ShareBar|shareLink/, file);
    assert.doesNotMatch(text, /<input|<textarea|contentEditable=|MAX_NAME|cleanName/, file);
  }
  const game = readFileSync(join(import.meta.dirname, "../components/tree-game.tsx"), "utf8");
  assert.match(game, /<ParentGate[^>]*><ShareToolLink/, "the only link out is the tool's address, behind the gate");
  assert.match(game, /useKidsSession\(\)/);
  assert.match(game, /<RestScreen/);
  assert.match(game, /<ShowParentButton/);
});

test("lines: exact, kind, true to the data, and in তুমি", () => {
  assert.equal(new Set(levels.map(clearLine)).size, LEVEL_COUNT);
  assert.equal(new Set(levels.map(newsLine)).size, LEVEL_COUNT);
  assert.match(newsLine(11), /২০টা/); assert.equal(levelOf(11).items.length, 20);
  for (const level of [3, 5]) { assert.match(newsLine(level), /তিনটা/); assert.equal(levelOf(level).decoys, 2); }
  for (const level of [9, 17, 20]) { assert.match(newsLine(level), /চারটা/); assert.equal(levelOf(level).decoys, 3); }
  assert.equal(shortTitle(3), "অ থেকে ঔ"); assert.equal(shortTitle(13), "আম, বই"); assert.equal(shortTitle(22), "২০ থেকে ১");
  assert.equal(tallyLine({ level: 3, slips: 2 }), "১১টা বর্ণ · ৯টা প্রথমবারেই");
  assert.match(humanLine({ level: 19, slips: 0 }), /সংখ্যা প্রথমবারেই/);
  assert.equal(wrongLine("ঈ", "ই"), "ওটা ঈ। এবার ই খোঁজো।");
  assert.match(hintLine("ই"), /ই/);
  assert.match(missLine("ই", true), /একটুর জন্য/);
  assert.match(MODES.wind.line, /৭ বছর/);
  const all = [...levels.flatMap(level => [clearLine(level), newsLine(level), levelOf(level).title, humanLine({ level, slips: 4 })]),
    ...[...VOWELS, ...CONSONANTS, ...NUMBERS].map(item => item.label), MODES.calm.line, MODES.wind.line].join(" ");
  assert.doesNotMatch(all, /আপনি|করুন|দেখুন|অসাধারণ|দারুণ|সেরা|ভয়|মরে|হেরে|জিনিয়াস|(^|\s)জল[\s,।]|ভুল \d|তুমি পারবে/);
  assert.ok((all.match(/!/g) ?? []).length <= 1);
});

test("saved choices: the mode defaults to গাছতলা; level progress goes through readLevels / recordLevel", () => {
  assert.equal(readMode(null), "calm"); assert.equal(readMode("wind"), "wind"); assert.equal(readMode("fast"), "calm");
  let stars = readLevels(null, LEVEL_COUNT);
  stars = recordLevel(stars, 1, starsOf(1, 0));
  stars = recordLevel(stars, 1, starsOf(1, 9));
  assert.equal(stars[1], 3, "the better result stays");
  assert.deepEqual(readLevels(JSON.stringify({ 1: 3, 23: 3, 4: 9, x: 2 }), LEVEL_COUNT), { 1: 3 });
});

test("content meets the SEO limits, speaks তুমি, and promises nothing the page doesn't do", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("বাংলা বর্ণমালা"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?" && item.answer.startsWith("২২টা")));
  assert.doesNotMatch(JSON.stringify(site), /আপনি|করুন|দেখুন|অসাধারণ|দারুণ|সেরা|সহজেই|সিড|সার্ভারে থাকে|তোমার নাম/);
  assert.match(site.privacy.join(" "), /কিছু পাঠায় না/);
});

test("sounds never throw without audio (no window, no AudioContext)", () => {
  assert.doesNotThrow(() => { chime(); boing(); thump(); rustle(); });
});

test("every picture id has a drawing", () => {
  const pics = [...VOWELS, ...CONSONANTS, ...NUMBERS].map(item => item.pic).concat(Object.values(WORDS), LEVELS.flatMap(level => level.items.filter(item => item.word).map(item => item.pic)));
  for (const pic of pics) assert.ok(hasPicture(pic), pic);
  assert.ok(!hasPicture("dots21") && !hasPicture("nothing"));
});

test("ঝড়ো হাওয়া: a wrong catch rocks the basket and counts once per letter; a dropped right fruit comes back and costs nothing", () => {
  const game = makeGame(4, 99, "wind");
  let wrongSeen = false, missSeen = false;
  for (let i = 0; i < 60 * 40 && !(wrongSeen && missSeen); i++) {
    const decoy = game.fruits.find(fruit => fruit.state === FALL && fruit.item < 0 && fruit.y > 200);
    if (decoy) aim(game, decoy.x);
    step(game, DT);
    if (game.events & EV_WRONG) { wrongSeen = true; assert.ok(game.wobble > 0.4); }
    if (game.events & EV_MISS) missSeen = true;
  }
  assert.ok(wrongSeen && missSeen);
  assert.equal(game.index, 0, "chasing wrong fruit never moves the sequence on");
  assert.equal(game.slips, 1, "one letter, one slip");
  assert.ok(game.missed >= 1);
});
