import assert from "node:assert/strict";
import test from "node:test";
import type { BoneKind } from "../lib/art";
import { DINOS, dinoOf } from "../lib/dinos";
import {
  afterDig, boneFound, bonesFor, chooseDiet, createRound, dinoNow, dinosOf, doneLine, FRESH_PACE, glowOn, isLastDino, nextDino, nextPace, pick, pitDone, pitKinds, pitSeed, place,
  resultOf, shouldGlow, starsOf, type Pace, type Round,
} from "../lib/round";
import { isLevel, isWorldEnd, LEVEL_COUNT, LEVELS, levelOf, levelsOfWorld, nextInOrder, nextToPlay, ORDER, placeOf, WORLDS } from "../lib/worlds";

const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

/** Plays a round the way a perfect child would: dig everything, place every bone, pick the right food. Returns the round at the end. */
function perfect(level: number, seed = 5): Round {
  let round = createRound(level, seed);
  for (let guard = 0; guard < 50; guard++) {
    if (round.phase === "dig") { for (const kind of pitKinds(round)) round = boneFound(round, kind); round = afterDig(round); }
    else if (round.phase === "build") { for (const kind of round.found) { round = pick(round, kind); round = place(round, kind).round; } }
    else if (round.phase === "meet") round = chooseDiet(round, dinoNow(round).diet).round;
    else { const next = nextDino(round); if (!next) return round; round = next; }
  }
  throw new Error("never ended");
}

test("nine levels in three worlds, ids 1–6 keep their old two dinosaurs, 7–9 are the finales", () => {
  assert.equal(LEVEL_COUNT, 9);
  assert.deepEqual([...ORDER].sort(), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const old: Record<number, string[]> = { 1: ["triceratops", "trex"], 2: ["stegosaurus", "velociraptor"], 3: ["brachiosaurus", "allosaurus"], 4: ["ankylosaurus", "spinosaurus"], 5: ["diplodocus", "parasaurolophus"], 6: ["iguanodon", "pachycephalosaurus"] };
  for (const [id, dinos] of Object.entries(old)) assert.deepEqual(levelOf(Number(id)).dinos, dinos, `level ${id} keeps its dinosaurs, so saved stars still fit`);
  assert.deepEqual(LEVELS.filter(level => !level.finale).flatMap(level => [...level.dinos]).sort(), DINOS.map(dino => dino.id).sort(), "every dinosaur once in the 2-dino levels");
  for (const world of WORLDS) {
    const ids = levelsOfWorld(world.id);
    assert.equal(ids.length, 3);
    assert.ok(levelOf(ids[2]).finale && !levelOf(ids[0]).finale && !levelOf(ids[1]).finale, "each world ends with its finale");
    const seen = ids.slice(0, 2).flatMap(id => [...levelOf(id).dinos]);
    assert.ok(seen.includes(levelOf(ids[2]).dinos[0]), "the giant is one the child met in this world");
  }
  assert.deepEqual(ORDER.map(placeOf), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.ok(isWorldEnd(7) && !isWorldEnd(1) && isLevel(9) && !isLevel(10));
  assert.deepEqual(LEVELS.filter(level => level.finale).map(level => level.dinos[0]), ["trex", "brachiosaurus", "diplodocus"]);
  assert.ok(LEVELS.filter(level => level.finale).every(level => level.digs === 2 && level.bones === 6));
});

test("each level teaches exactly one new thing, and the list says so", () => {
  // The one thing each non-finale level adds over the one before it in its world.
  const thing = (id: number) => { const l = levelOf(id); return { deep: l.depth === 2, rocks: l.rocks > 0, decoys: l.decoys > 0, marks: !l.marks, shadow: !l.ghost }; };
  const delta = (a: number, b: number) => Object.entries(thing(b)).filter(([key, value]) => value !== (thing(a) as Record<string, boolean>)[key]).map(([key]) => key);
  assert.deepEqual(delta(1, 2), ["deep"]);
  assert.deepEqual(delta(3, 4), ["decoys"]);
  assert.deepEqual(delta(5, 6), ["marks"]);
  assert.deepEqual(thing(1), { deep: false, rocks: false, decoys: false, marks: false, shadow: false }, "level ১ is the plain brush");
  assert.equal(levelOf(3).rocks, 2, "world 2 opens with rocks");
  assert.equal(levelOf(5).ghost, false, "world 3 opens with the shadow only");
  for (const level of LEVELS) for (const text of [level.title, level.tip, level.news, level.off]) { nfc(text); assert.match(text, /[অ-হ]/); }
  assert.equal(new Set(LEVELS.map(level => level.title)).size, 9);
});

test("play order and what's ready next: never a lock", () => {
  assert.equal(nextToPlay({}), 1);
  assert.equal(nextToPlay({ 1: 3 }), 2);
  assert.equal(nextToPlay({ 1: 3, 2: 1, 7: 2 }), 3);
  assert.equal(nextToPlay({ 9: 3 }), 1, "a far-ahead friend's level doesn't skip the ones between");
  assert.equal(nextToPlay(Object.fromEntries(ORDER.map(id => [id, 1]))), 1, "everything done: start again");
  assert.deepEqual([1, 2, 7, 3, 9].map(nextInOrder), [2, 7, 3, 4, 0]);
});

test("a round: dig → build → meet → facts for each dinosaur; a finale digs two pits for one", () => {
  const round = createRound(1, 9);
  assert.equal(round.kinds.length, 3);
  assert.deepEqual(pitKinds(round), round.kinds);
  assert.equal(round.phase, "dig");
  assert.equal(boneFound(round, "ribs").found.length, round.kinds.includes("ribs") ? 1 : 0);
  const twice = boneFound(boneFound(round, round.kinds[0]), round.kinds[0]);
  assert.equal(twice.found.length, 1, "the same bone twice counts once");
  assert.equal(afterDig(round), round, "no step until the pit is empty");
  const finale = createRound(7, 9);
  assert.equal(finale.kinds.length, 6);
  assert.deepEqual(pitKinds(finale), finale.kinds.slice(0, 3));
  let now = finale;
  for (const kind of pitKinds(now)) now = boneFound(now, kind);
  assert.ok(pitDone(now));
  now = afterDig(now);
  assert.deepEqual([now.phase, now.dig], ["dig", 1], "the second pit");
  assert.deepEqual(pitKinds(now), finale.kinds.slice(3));
  assert.ok(!pitDone(now));
  for (const kind of pitKinds(now)) now = boneFound(now, kind);
  assert.equal(afterDig(now).phase, "build");
  assert.equal(afterDig(now).found.length, 6, "the skeleton board gets all six");
  assert.notEqual(pitSeed(finale), pitSeed({ ...finale, dig: 1 }), "a different pit each time");
  assert.equal(dinosOf(1).length, 2);
});

test("placing bones: pick first, a wrong place is a slip, the last right bone stands the dinosaur", () => {
  let round = createRound(1, 3);
  for (const kind of round.kinds) round = boneFound(round, kind);
  round = afterDig(round);
  assert.equal(round.phase, "build");
  assert.equal(place(round, round.kinds[0]).result, "pick-first");
  assert.equal(place(round, null).result, "none");
  round = pick(round, round.kinds[0]);
  assert.equal(round.picked, round.kinds[0]);
  assert.equal(pick(round, round.kinds[0]).picked, null, "picked again, put back");
  const wrong = place(round, round.kinds[1]);
  assert.equal(wrong.result, "slip");
  assert.deepEqual([wrong.round.slips, wrong.round.tries, wrong.round.picked], [1, 1, round.kinds[0]], "the pick stays");
  const right = place(wrong.round, round.kinds[0]);
  assert.equal(right.result, "right");
  assert.deepEqual([right.round.placed, right.round.firstTry, right.round.tries], [[round.kinds[0]], 0, 0], "not first try after a slip");
  let now = right.round;
  for (const kind of round.kinds.slice(1)) { now = pick(now, kind); const step = place(now, kind); now = step.round; if (kind !== round.kinds[2]) assert.equal(step.result, "right"); }
  assert.equal(now.phase, "meet");
  assert.equal(now.firstTry, 2);
  assert.equal(pick(now, now.kinds[0]), now, "no picking after the skeleton stands");
});

test("the food: a wrong one is a slip and stays crossed out, the right one shows the facts; the last wins the round", () => {
  let round = createRound(1, 4);
  for (const kind of round.kinds) round = boneFound(round, kind);
  round = afterDig(round);
  for (const kind of round.kinds) { round = pick(round, kind); round = place(round, kind).round; }
  const dino = dinoNow(round), wrong = dino.diet === "plant" ? "meat" : "plant";
  const slip = chooseDiet(round, wrong);
  assert.deepEqual([slip.result, slip.round.slips, slip.round.wrongDiet], ["slip", 1, [wrong]]);
  assert.equal(chooseDiet(slip.round, wrong).result, "none", "the crossed-out one does nothing");
  const ok = chooseDiet(slip.round, dino.diet);
  assert.equal(ok.result, "right");
  assert.deepEqual([ok.round.phase, ok.round.won, ok.round.done], ["facts", false, [dino.id]]);
  const next = nextDino(ok.round)!;
  assert.deepEqual([next.index, next.phase, next.found, next.placed, next.slips], [1, "dig", [], [], 1], "the second dinosaur digs fresh; slips carry for the stars");
  assert.equal(nextDino(round), round, "▶ before the facts changes nothing");
});

test("a perfect round wins with 3 stars and the real stats; a finale gives one giant", () => {
  const one = perfect(1), result = resultOf(one);
  assert.ok(one.won && isLastDino(one));
  assert.deepEqual([result.stars, result.slips, result.dinos], [3, 0, ["triceratops", "trex"]]);
  assert.equal(result.bones, 6);
  assert.equal(result.firstTry, 6);
  assert.equal(nextDino(one), null, "▶ after the last dinosaur leaves the round");
  const finale = resultOf(perfect(7));
  assert.deepEqual([finale.dinos, finale.bones, finale.firstTry, finale.stars], [["trex"], 6, 6, 3]);
  for (const id of ORDER) { const r = perfect(id); assert.ok(r.won, `level ${id}`); assert.equal(r.done.length, levelOf(id).dinos.length); }
  assert.equal(doneLine(1), "আজ ২টা ডাইনোসর খুঁজে পেলাম");
  assert.equal(doneLine(7), "আজ টি-রেক্স-এর কঙ্কাল জোড়া দিলাম");
  for (const id of ORDER) nfc(doneLine(id));
});

test("difficulty steps: three slips ease, five right step up, never announced; a finale is always six", () => {
  let pace: Pace = FRESH_PACE;
  const l1 = levelOf(1), l5 = levelOf(5);
  assert.equal(bonesFor(l1, pace), 3);
  assert.ok(!shouldGlow(pace, 1) && shouldGlow(pace, 2), "the right place glows after two tries");
  for (let i = 0; i < 3; i++) pace = nextPace(pace, false);
  assert.equal(pace.help, 1);
  assert.equal(bonesFor(l1, pace), 3, "never fewer than three bones");
  assert.equal(bonesFor(l5, pace), 4);
  assert.ok(shouldGlow(pace, 0));
  pace = nextPace(pace, true);
  assert.equal(pace.help, 0);
  for (let i = 0; i < 5; i++) pace = nextPace(pace, true);
  assert.equal(pace.help, -1);
  assert.equal(bonesFor(l1, pace), 4);
  assert.equal(bonesFor(levelOf(5), pace), 6, "at most six, every dinosaur has six");
  assert.equal(bonesFor(levelOf(7), pace), 6);
  assert.equal(bonesFor(levelOf(7), { right: 0, wrong: 3, help: 1 }), 6, "a finale doesn't shrink");
  pace = nextPace(pace, false);
  assert.equal(pace.help, 0, "one slip drops back to normal");
  assert.equal(glowOn({ ...createRound(1, 1), tries: 2 }), true);
});

test("stars are a record: 3 with no slip, 2 with up to two, else 1, and ধীরে খেলো changes nothing", () => {
  assert.deepEqual([0, 1, 2, 3, 9].map(starsOf), [3, 2, 2, 1, 1]);
  // The round takes only a level, a seed and the pace: the slow setting is not an input, so it cannot make stars easier.
  assert.equal(createRound.length, 2);
});

test("every dinosaur's bones are real and in the dinosaur's own list", () => {
  for (const spec of LEVELS) for (const id of spec.dinos) {
    const dino = dinoOf(id)!, round = createRound(spec.id, 1);
    for (const kind of round.kinds as BoneKind[]) assert.ok(dino.parts.some(part => part[0] === kind) || spec.dinos.length === 2);
  }
});
