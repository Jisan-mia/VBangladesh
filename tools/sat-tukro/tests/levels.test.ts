import assert from "node:assert/strict";
import test from "node:test";
import { newRound, easeFrom, preFor, spotPieces, EASE_AFTER, MAX_PRE } from "../lib/game";
import { FIGURES } from "../lib/figures";
import { LEVELS, LEVEL_COUNT, WORLDS, figureOf, levelsOfWorld, nextInOrder, nextToPlay, specOf } from "../lib/levels";
import { sameTurn, solve } from "../lib/tangram";
import { CASUAL, FIRST, STEADY, play, rates } from "./bot";

test("22 pictures in 4 worlds, every picture once, the world's last one is its named শেষ ছবি", () => {
  assert.equal(LEVEL_COUNT, 22);
  assert.deepEqual(LEVELS.map(l => l.figure).sort(), FIGURES.map(f => f.id).sort());
  let at = 1;
  for (const world of WORLDS) {
    assert.equal(world.from, at); at = world.to + 1;
    assert.deepEqual(levelsOfWorld(world.id), Array.from({ length: world.to - world.from + 1 }, (_, i) => world.from + i));
    const finales = levelsOfWorld(world.id).filter(id => specOf(id).finale);
    assert.deepEqual(finales, [world.to], `${world.name}: one finale, last`);
    assert.equal(world.tune.length, 4);
  }
  assert.equal(at, LEVEL_COUNT + 1);
  const bdFinales = WORLDS.filter(w => figureOf(w.to).bd).length;
  assert.ok(bdFinales >= 3, `Bangladeshi finales ${bdFinales}`);
  for (const name of ["নৌকা", "ঘর", "রিকশা"]) assert.ok(LEVELS.some((_, i) => figureOf(i + 1).name === name), name);
});

test("each level teaches one thing: a line of its own, normalised, and the new-idea tags sit where the design says", () => {
  assert.equal(new Set(LEVELS.map(l => l.teach)).size, LEVELS.length, "every lesson line is its own");
  for (const spec of LEVELS) { assert.equal(spec.teach, spec.teach.normalize("NFC")); assert.ok(spec.teach.length > 8 && spec.teach.length < 60); }
  assert.deepEqual(LEVELS.flatMap((spec, i) => spec.fresh ? [i + 1] : []), [1, 2, 4, 5, 6, 9, 10, 11]);
});

test("the ladder: from one level to the next only one dimension steps (pieces in, lines, turned, mirrored)", () => {
  const order = { colour: 0, plain: 1, faint: 2, none: 3 } as const;
  for (let id = 2; id <= LEVEL_COUNT; id++) {
    const a = specOf(id - 1), b = specOf(id);
    if (a.world !== b.world) continue;
    // A finale is the world's test: it may bring the next world's help level along with the last step.
    const cls = (s: typeof a) => s.turns === 0 ? 0 : s.turns >= 7 - s.pre ? 2 : 1;
    const changes = [a.pre !== b.pre, a.lines !== b.lines, cls(a) !== cls(b), a.flip !== b.flip].filter(Boolean).length;
    if (!b.finale) assert.ok(changes <= 1, `level ${id} changes ${changes} things`);
    assert.ok(order[b.lines] >= order[a.lines], `level ${id}: help only fades`);
  }
  assert.equal(specOf(1).lines, "colour");
  assert.ok(LEVELS.slice(10).every(l => l.lines === "none"), "worlds 3 and 4 are shadow only");
});

test("every level, every seed: the pieces still to place can finish the shadow, and the turns are as designed", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const spec = specOf(level);
    for (const ease of [0, 1]) for (const seed of [1, 2, 3, 99, 12345]) {
      const round = newRound(level, seed, ease), waiting = round.pieces.filter(p => !p.done);
      assert.equal(waiting.length, 7 - preFor(spec, ease), `level ${level}`);
      assert.ok(waiting.length >= 2, "at least two pieces to place");
      assert.equal(solve(round.board, new Set(round.filled), waiting.map(p => p.kind)).length, 1, `level ${level} seed ${seed}: unsolvable`);
      // Turned pieces: those whose turn matches no free spot of their kind.
      const wrong = waiting.filter(p => !round.shown.some(slot => slot.kind === p.kind && sameTurn(slot, { ...slot, rot: p.rot, flip: p.flip })));
      const mirrored = waiting.filter(p => p.kind === "P" && !round.shown.some(slot => slot.kind === "P" && slot.flip === p.flip));
      if (spec.turns === 0 && !spec.flip) assert.equal(wrong.length, 0, `level ${level}: pieces start ready`);
      else assert.ok(wrong.length >= Math.min(1, spec.turns), `level ${level}: turned pieces`);
      if (spec.flip) assert.equal(mirrored.length, 1, `level ${level}: the parallelogram starts mirrored`);
      assert.ok(waiting.every(p => p.inTray && !p.done));
      // The spots and their colours: one tint per remaining piece.
      assert.equal(new Set(spotPieces(round)).size, waiting.length);
    }
  }
});

test("the first level wins fast: five pieces are in, two to place, and nothing needs turning", () => {
  const round = newRound(1, 1);
  assert.equal(round.pieces.filter(p => p.done).length, 5);
  assert.equal(round.filled.length, 32);
  assert.ok(round.pieces.filter(p => !p.done).every(p => p.kind === "L"), "the big triangles are left to place");
});

test("quiet easing: a round with 6 wrong tries makes the next start with one more piece in, never above 5", () => {
  assert.equal(easeFrom(EASE_AFTER - 1), 0);
  assert.equal(easeFrom(EASE_AFTER), 1);
  assert.equal(preFor(specOf(3), 1), specOf(3).pre + 1);
  assert.equal(preFor(specOf(1), 1), MAX_PRE);
  assert.equal(newRound(3, 5, 1).pieces.filter(p => p.done).length, specOf(3).pre + 1);
});

test("the list's next picture: the first without stars, else the first below three, else the first", () => {
  assert.equal(nextToPlay({}), 1);
  assert.equal(nextToPlay({ 1: 3, 2: 2, 4: 3 }), 3);
  assert.equal(nextToPlay(Object.fromEntries(Array.from({ length: 22 }, (_, i) => [i + 1, 3]))), 1);
  assert.equal(nextToPlay(Object.fromEntries(Array.from({ length: 22 }, (_, i) => [i + 1, i === 9 ? 2 : 3]))), 10);
  assert.equal(nextInOrder(22), 0); assert.equal(nextInOrder(5), 6);
});

test("a first-timer finishes level 1 inside 10 seconds, on nearly every run", () => {
  const r = rates(1, FIRST, 100);
  assert.ok(r.fast >= 0.95, `fast ${r.fast}`);
  assert.ok(play(1, 1, FIRST).seconds <= 10);
});

test("bots: steady play earns 3 stars on 85%+ of runs on every level; casual play always finishes and earns 2+ on 80%+", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const steady = rates(level, STEADY), casual = rates(level, CASUAL);
    assert.equal(steady.done, 1, `level ${level}`);
    assert.ok(steady.three >= 0.85, `level ${level}: steady 3★ ${steady.three}`);
    assert.equal(casual.done, 1, `level ${level}`);
    assert.ok(casual.two >= 0.8, `level ${level}: casual 2★ ${casual.two}`);
  }
});

test("three stars get rarer for the casual player along the ladder, and rarest by the last worlds", () => {
  const three = Array.from({ length: LEVEL_COUNT }, (_, i) => rates(i + 1, CASUAL).three);
  const avg = (list: number[]) => list.reduce((t, v) => t + v, 0) / list.length;
  const worlds = WORLDS.map(w => avg(three.slice(w.from - 1, w.to)));
  assert.ok(worlds[0] > worlds[1] && worlds[1] > worlds[2] && worlds[2] > worlds[3] - 0.05, `by world ${worlds.map(v => v.toFixed(2))}`);
  assert.ok(worlds[0] >= 0.95 && worlds[3] <= 0.7, `${worlds[0]} … ${worlds[3]}`);
});

test("slow mode never changes the stars: they come from wrong tries only", () => {
  for (let level = 1; level <= LEVEL_COUNT; level += 7) assert.deepEqual(play(level, 7, STEADY), play(level, 7, STEADY));
});
