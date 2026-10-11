import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import {
  airAbove, createRun, isOver, pieceAt, planRoad, pressDuck, pressJump, releaseDuck, releaseJump, speedAt, stepRun, touches, zoneOf,
  AHEAD, BASKET, BIKE, BRANCH, COW, CRASH, DUCK_H, DUCK_MIN, GATE, GATE_M, GROUND, GOT_TIFFIN, GRAVITY, HALF, HIT, JUMP_V, KID_H, KID_X, LINE,
  PUDDLE, SAVED, SLOW_CAP, SPEC, START, TIFFIN, TOP, UNIT, type Piece, type Run,
} from "../lib/road";
import { bands, bumpLine, caption, compareLine, headline, humanLine, parseShareHash, previewTitle, shareHash, MAX_METERS } from "../lib/result";
import { share } from "../share";

const DT = 1 / 60;
const APEX = JUMP_V / GRAVITY;

/** The next thing ahead of the kid that isn't a tiffin box. */
function nextThing(run: Run) {
  for (let index = run.first; index < run.count; index++) {
    const piece = pieceAt(run, index);
    if (piece.kind !== TIFFIN && piece.state === AHEAD && piece.x + piece.w >= run.d + KID_X - HALF) return piece;
  }
  return null;
}

/**
 * A steady player: taps jump so the kid's apex is over the middle of each ground thing, ducks just before each hanging one
 * and stays down until it has passed. `late` shifts every action later (in game seconds) to test the timing margin.
 */
function bot(run: Run, late = 0, thumb = 0) {
  if (run.jumpHeld && run.t - run.jumpAt >= thumb) releaseJump(run);
  const piece = nextThing(run);
  if (!piece) return;
  const kid = run.d + KID_X;
  if (isOver(piece.kind)) {
    const arrive = (piece.x - (kid + HALF)) / run.speed;
    if (!run.duckHeld && arrive <= 0.1 - late) pressDuck(run);
    if (run.duckHeld && piece.x + piece.w < kid - HALF) releaseDuck(run);
  } else if (run.air < 0 && !run.jumpHeld && (piece.x + piece.w / 2 - kid) / run.speed <= APEX - late) {
    pressJump(run);
    if (!thumb) releaseJump(run);
  }
}

function play(run: Run, meters: number, player: (run: Run) => void, timeScale = 1) {
  for (let steps = 0; !run.over && run.d < meters * UNIT && steps < 400_000; steps++) { player(run); stepRun(run, DT * timeScale); }
  return run;
}

test("the same seed lays the same road; another seed lays another", () => {
  assert.deepEqual(planRoad(4821, 1500), planRoad(4821, 1500));
  assert.notDeepEqual(planRoad(4821, 1500), planRoad(4822, 1500));
  const first = play(createRun(77), 900, bot), second = play(createRun(77), 900, bot);
  assert.deepEqual([first.d, first.t, first.over, first.tiffin], [second.d, second.t, second.over, second.tiffin]);
});

test("slow mode runs the very same road (the road never depends on the real speed)", () => {
  const seen = (run: Run) => { const list: string[] = []; for (let index = 0; index < run.count; index++) list.push(`${pieceAt(run, index).kind}@${pieceAt(run, index).x}`); return list; };
  const fast = createRun(31), slow = createRun(31, SLOW_CAP);
  play(fast, 200, bot); play(slow, 200, bot, 0.7);
  const a = seen(fast), b = seen(slow);
  assert.deepEqual(a.slice(0, 8), b.slice(0, 8));
});

test("speed starts gentle, climbs slowly and is capped; slow mode caps it lower", () => {
  assert.equal(speedAt(0), START);
  assert.ok(speedAt(500) > speedAt(100) && speedAt(500) < speedAt(1000));
  assert.equal(speedAt(1_000_000), TOP);
  const run = createRun(5, SLOW_CAP);
  play(run, 3000, bot, 0.7);
  assert.ok(run.speed <= SLOW_CAP);
});

test("every road is fair: easy start, the first duck is taught, nothing at the gate, every jump clearable with the shortest tap", () => {
  for (let seed = 1; seed <= 300; seed++) {
    const road = planRoad(seed, 3000);
    const things = road.filter(piece => piece.kind !== TIFFIN);
    assert.equal(things[0].kind, PUDDLE, `seed ${seed}: a puddle comes first`);
    assert.equal(things[0].hint, 1);
    assert.ok(things[0].x >= 25 * UNIT);
    const firstDuck = things.find(piece => isOver(piece.kind))!;
    assert.equal(firstDuck.hint, 2, `seed ${seed}: the first hanging thing says "নিচু হও"`);
    assert.ok(firstDuck.x / UNIT >= 120 && firstDuck.x / UNIT < 300);
    for (const piece of things) {
      const meters = piece.x / UNIT;
      if (meters < 120) assert.ok(piece.kind === PUDDLE || piece.kind === BASKET, `seed ${seed}: only puddles and baskets early`);
      if (piece.kind === COW || piece.kind === BRANCH) assert.ok(meters >= 220);
      assert.ok(piece.x + piece.w <= (GATE_M - 15) * UNIT || piece.x >= (GATE_M + 15) * UNIT, `seed ${seed}: the gate is clear`);
      if (!isOver(piece.kind)) {
        // The shortest jump must clear it even at the slowest speed the game ever runs, with time to spare.
        const spare = airAbove(piece.h) - (piece.w + 2 * HALF) / START;
        assert.ok(spare >= 0.09, `seed ${seed}: kind ${piece.kind} needs ${spare.toFixed(3)}s`);
      } else assert.ok((piece.w + 2 * HALF) / START < DUCK_MIN - 0.1, "one duck tap is long enough");
    }
    for (let index = 1; index < things.length; index++) {
      const before = things[index - 1], piece = things[index];
      const gap = (piece.x - before.x - before.w) / speedAt(piece.x / UNIT);
      assert.ok(gap >= 0.7, `seed ${seed}: ${gap.toFixed(2)}s between things`);
    }
    for (const box of road.filter(piece => piece.kind === TIFFIN)) assert.ok(box.y === 6 || box.y === 62);
  }
});

test("a steady player gets past the gate on every road: full speed, slow mode, a little early or late, real thumbs that rest on the screen", () => {
  for (let seed = 1; seed <= 120; seed++) {
    for (const [cap, scale, late, thumb] of [[TOP, 1, 0, 0], [SLOW_CAP, 0.7, 0, 0], [TOP, 1, 0.04, 0], [TOP, 1, -0.04, 0], [TOP, 1, 0, 0.1], [TOP, 1, 0.03, 0.12], [SLOW_CAP, 0.7, 0, 0.1]] as const) {
      const run = play(createRun(seed, cap), 2200, current => bot(current, late, thumb), scale);
      assert.equal(run.over, false, `seed ${seed} cap ${cap} late ${late} thumb ${thumb}: bumped into kind ${run.hitKind} at ${run.meters} m`);
      assert.ok(run.gate);
    }
  }
});

test("a player who never presses anything stops at the first puddle, with a sane score", () => {
  const run = play(createRun(9), 5000, () => {});
  assert.equal(run.over, true);
  assert.equal(run.hitKind, PUDDLE);
  assert.ok(run.meters >= 20 && run.meters < 30, `${run.meters}`);
  assert.equal(run.events[(run.eventCount - 1) % run.events.length].type, CRASH);
});

test("a random tapper ends sanely with a plausible score", () => {
  let state = 12345;
  const random = () => (state = (state * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let seed = 1; seed <= 30; seed++) {
    const run = play(createRun(seed), 5000, current => { const roll = random(); if (roll < 0.02) { pressJump(current); releaseJump(current); } else if (roll < 0.025) { pressDuck(current); releaseDuck(current); } });
    assert.equal(run.over, true);
    assert.ok(run.meters >= 20 && run.meters < 1000, `seed ${seed}: ${run.meters}`);
    assert.ok(Number.isFinite(run.y) && run.y >= 0);
  }
});

function runWith(piece: Partial<Piece>) {
  const run = createRun(1);
  stepRun(run, DT);
  const slot = pieceAt(run, run.first);
  Object.assign(slot, { kind: PUDDLE, x: run.d + KID_X - 4, w: 20, h: 4, y: 0, state: AHEAD, hint: 0 }, piece);
  return { run, slot };
}

test("collisions: low feet bump ground things, high feet clear them; standing bumps hanging things, ducking clears them", () => {
  const { run, slot } = runWith({ kind: COW, h: SPEC[COW].h });
  assert.equal(touches(run, slot), true);
  run.y = SPEC[COW].h - 0.1; assert.equal(touches(run, slot), true);
  run.y = SPEC[COW].h; assert.equal(touches(run, slot), false);
  run.y = 0;
  slot.kind = LINE; slot.h = SPEC[LINE].h;
  run.ducking = false; assert.equal(touches(run, slot), true, "standing under the গামছা");
  run.ducking = true; assert.equal(touches(run, slot), false, "ducked under it");
  run.y = 10; assert.equal(touches(run, slot), true, "jumping into it");
  assert.ok(DUCK_H < SPEC[LINE].h && KID_H > SPEC[LINE].h && DUCK_H < SPEC[BRANCH].h);
  slot.kind = TIFFIN; slot.y = 62; slot.h = 14; run.y = 0; run.ducking = false;
  assert.equal(touches(run, slot), false, "a high tiffin box needs a jump");
  run.y = 40; assert.equal(touches(run, slot), true);
});

test("a step bumps, ends the run and names what did it; a tiffin box forgives exactly one bump", () => {
  const plain = runWith({ kind: BIKE, h: SPEC[BIKE].h });
  stepRun(plain.run, DT);
  assert.deepEqual([plain.run.over, plain.run.hitKind, plain.slot.state], [true, BIKE, HIT]);
  assert.match(bumpLine(BIKE), /সাইকেল/);

  const saved = runWith({ kind: BASKET, h: SPEC[BASKET].h });
  saved.run.tiffin = true;
  stepRun(saved.run, DT);
  assert.deepEqual([saved.run.over, saved.run.tiffin, saved.slot.state], [false, false, HIT]);
  assert.equal(saved.run.events[(saved.run.eventCount - 1) % 8].type, SAVED);
  // Still inside the forgiving second: the next bump is ignored, then the next one counts.
  Object.assign(saved.slot, { state: AHEAD, x: saved.run.d + KID_X - 4 });
  stepRun(saved.run, DT);
  assert.equal(saved.run.over, false);
  saved.run.t += 2;
  Object.assign(saved.slot, { state: AHEAD, x: saved.run.d + KID_X - 4 });
  stepRun(saved.run, DT);
  assert.equal(saved.run.over, true);

  const box = runWith({ kind: TIFFIN, w: 16, h: 14, y: 6 });
  stepRun(box.run, DT);
  assert.equal(box.run.tiffin, true);
  assert.equal(box.run.events[(box.run.eventCount - 1) % 8].type, GOT_TIFFIN);
});

test("jumps: a tap jumps, holding goes higher, a jump pressed just before landing still happens, a quick duck takes a jump back", () => {
  const apex = (hold: boolean) => {
    const run = createRun(3);
    pressJump(run);
    if (!hold) releaseJump(run);
    let top = 0;
    for (let index = 0; index < 120; index++) { stepRun(run, DT); top = Math.max(top, run.y); }
    return top;
  };
  const tap = apex(false), held = apex(true);
  assert.ok(Math.abs(tap - JUMP_V ** 2 / (2 * GRAVITY)) < 6, `tap apex ${tap}`);
  assert.ok(held > tap + 30, `held ${held} vs ${tap}`);
  assert.ok(held + KID_H < GROUND - 30, "a held jump stays on screen, under the score");

  const buffered = createRun(3);
  pressJump(buffered); releaseJump(buffered);
  while (buffered.vy >= 0 || buffered.y > 8) stepRun(buffered, DT);
  pressJump(buffered); releaseJump(buffered);
  for (let index = 0; index < 10 && buffered.air >= 0; index++) stepRun(buffered, DT);
  for (let index = 0; index < 3; index++) stepRun(buffered, DT);
  assert.ok(buffered.y > 0, "jumped again on landing");

  const rewind = createRun(3);
  pressJump(rewind); stepRun(rewind, DT); stepRun(rewind, DT);
  assert.ok(rewind.y > 0);
  pressDuck(rewind);
  assert.equal(rewind.y, 0);
  stepRun(rewind, DT);
  assert.equal(rewind.ducking, true);
  // Ducking keeps the kid low for at least DUCK_MIN even after a quick tap.
  releaseDuck(rewind);
  stepRun(rewind, DUCK_MIN - 0.1);
  assert.equal(rewind.ducking, true);
  stepRun(rewind, 0.2);
  assert.equal(rewind.ducking, false);
});

test("the gate and the milestones fire once; zones switch every 400 m", () => {
  const run = play(createRun(2), 1010, bot);
  const types = run.events.slice(0, Math.min(8, run.eventCount)).map(event => event.type);
  assert.ok(run.gate && types.includes(GATE));
  assert.deepEqual([zoneOf(0), zoneOf(399), zoneOf(400), zoneOf(800), zoneOf(1000)], [0, 0, 1, 0, 0]);
});

test("score bands and lines", () => {
  assert.equal(humanLine(0), bands[0].line);
  assert.equal(humanLine(99), bands[0].line);
  assert.equal(humanLine(100), bands[1].line);
  assert.equal(humanLine(999), bands[3].line);
  assert.equal(humanLine(1000), "ঘণ্টা পড়ার আগেই গেটে!");
  assert.equal(humanLine(20000), bands[5].line);
  assert.match(headline(523), /বেল পড়ে গেল!|আজ আবার লেট!/);
  assert.equal(headline(1200), "আজ আর লেট না!");
  for (const kind of [PUDDLE, BASKET, BIKE, COW, LINE, BRANCH]) assert.ok(bumpLine(kind).length > 8);
  assert.equal(compareLine(1048, 928, "রাফি"), "রাফির চেয়ে ১২০ মিটার বেশি!");
  assert.match(compareLine(910, 928, "রাফি"), /^আর একটু হলেই!/);
  assert.match(compareLine(300, 928, ""), /বন্ধু এবার/);
  assert.equal(compareLine(500, 500, "নীলা"), "নীলা আর তুমি একদম সমান সমান!");
  assert.match(caption({ seed: 1, meters: 1200, name: "" }), /ঘণ্টা পড়ার আগেই/);
});

test("challenge links round-trip and refuse hostile or impossible input", () => {
  const shared = { seed: 4821, meters: 928, name: "রাফি" };
  assert.deepEqual(parseShareHash(`#${shareHash(shared)}`), shared);
  assert.equal(shareHash(shared), "s=4821&t=928&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  for (const bad of ["", "#", "s=abc&t=10", "s=1&t=-5", "s=1&t=12.5", "s=0&t=100", `s=1&t=${MAX_METERS + 1}`, "s=1&t=5", "s=99999999999&t=100", `s=1&t=100&n=${"x".repeat(700)}`])
    assert.equal(parseShareHash(bad), null, bad);
  const odd = parseShareHash("s=7&t=300&n=%E2%80%AE%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF%20%20%20%E0%A6%AD%E0%A6%BE%E0%A6%87%00&evil=1")!;
  assert.equal(odd.name, "রাফি ভাই");
  assert.equal(parseShareHash(`s=7&t=300&n=${"ক".repeat(40)}`)!.name.length, 20);

  assert.equal(share.normalize("t=928&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF&s=4821&x=1"), "s=4821&t=928&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.equal(share.normalize("s=1&t=999999"), null);
  assert.equal(share.normalize("<script>"), null);
  assert.equal(share.preview("s=4821&t=928&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF").title, "রাফি স্কুলের পথে ৯২৮ মিটার গেছে। তুমি পারবে?");
  assert.equal(previewTitle({ seed: 1, meters: 40, name: "" }), "স্কুলের পথে ৪০ মিটার! তুমি পারবে?");
  assert.ok(share.preview("nope").title.length > 0);
});

test("content meets the SEO limits and keeps clear of famous runner names", () => {
  assert.ok([...site.title].length <= 45, `title ${[...site.title].length}`);
  const description = [...site.description].length;
  assert.ok(description >= 120 && description <= 160, `description ${description}`);
  assert.ok(site.faq.length >= 5);
  assert.ok(site.steps.length >= 3 && site.privacy.some(line => line.includes("লিংক")));
  assert.doesNotMatch(`${site.title} ${site.name}`, /run|surf|রান|সার্ফ|দৌ(?:\u09DC|\u09A1\u09BC)/i);
  assert.doesNotMatch(JSON.stringify(site), /subway|temple|surfer|আপনি|করুন/i);
});
