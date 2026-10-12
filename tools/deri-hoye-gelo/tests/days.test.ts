import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { readLevels, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import {
  createRun, dayOf, dayStars, isOver, isPickup, pieceAt, planRoad, pressDuck, pressJump, releaseDuck, releaseJump, stepRun,
  AHEAD, BIKE, BRANCH, COW, DAY_COUNT, DAYS, GATE_M, GRAVITY, HALF, JUMP_V, KID_X, PAGE, PAGES, SLOW_CAP, TIFFIN, TOP, UNIT, type Run,
} from "../lib/road";
import { migrateLevels, nearMiss, parseShareHash, previewTitle, shareHash } from "../lib/result";
import { share } from "../share";

const DT = 1 / 60, APEX = JUMP_V / GRAVITY;

/** A steady player who also goes for the pages: jumps so the apex is over each ground thing (and each high page), ducks under hanging things. */
function bot(run: Run, late = 0) {
  if (run.jumpHeld) releaseJump(run);
  const kid = run.d + KID_X;
  let piece = null;
  for (let index = run.first; index < run.count; index++) {
    const next = pieceAt(run, index);
    if (next.state !== AHEAD || next.x + next.w < kid - HALF || next.kind === TIFFIN || (next.kind === PAGE && next.y < 30)) continue;
    piece = next; break;
  }
  if (!piece) return;
  if (isOver(piece.kind)) {
    if (!run.duckHeld && (piece.x - (kid + HALF)) / run.speed <= 0.1 - late) pressDuck(run);
    if (run.duckHeld && piece.x + piece.w < kid - HALF) releaseDuck(run);
  } else if (run.air < 0 && (piece.x + piece.w / 2 - kid) / run.speed <= APEX - late) pressJump(run);
}
function play(run: Run, player: (run: Run) => void, scale = 1) {
  for (let steps = 0; !run.over && steps < 400_000; steps++) { player(run); stepRun(run, DT * scale); }
  return run;
}

test("the endless road is the original one, piece for piece, so old links replay it exactly", () => {
  // Fingerprint of the original generator, taken before days existed.
  assert.equal(createHash("sha256").update(JSON.stringify([48213, 1, 777].map(seed => planRoad(seed, 2000)))).digest("hex").slice(0, 16), "70078cc3e671d2c0");
  assert.ok(planRoad(48213, 3000).every(piece => piece.kind !== PAGE), "no pages on the endless road");
  assert.equal(createRun(5).gateM, GATE_M);
});

test("each day is a small step: a farther gate, then a new obstacle or more speed", () => {
  for (let day = 2; day <= DAY_COUNT; day++) {
    const [now, before] = [dayOf(day), dayOf(day - 1)];
    assert.ok(now.gate > before.gate && now.boost >= before.boost && now.kinds.length >= before.kinds.length, `day ${day}`);
  }
  for (let seed = 1; seed <= 80; seed++) {
    for (let day = 1; day <= DAY_COUNT; day++) {
      const road = planRoad(seed, dayOf(day).gate + 40, day), allowed = dayOf(day).kinds;
      for (const piece of road) if (!isPickup(piece.kind)) assert.ok(allowed.includes(piece.kind), `seed ${seed} day ${day}: kind ${piece.kind}`);
      const pages = road.filter(piece => piece.kind === PAGE && piece.x < dayOf(day).gate * UNIT);
      assert.equal(pages.length, PAGES, `seed ${seed} day ${day}: all three pages before the gate`);
      for (const page of pages) assert.ok(page.y === 8 || page.y === 88, "low enough to run into, or high enough to need a jump");
    }
    assert.ok(!planRoad(seed, 300, 1).some(piece => [BIKE, COW, BRANCH].includes(piece.kind)), "Saturday: puddles, baskets and towels only");
  }
});

test("every day is clearable with all three pages: full speed, slow mode, a little late", () => {
  for (let seed = 1; seed <= 40; seed++) {
    for (let day = 1; day <= DAY_COUNT; day++) {
      for (const [cap, scale, late] of [[TOP, 1, 0], [SLOW_CAP, 0.7, 0], [TOP, 1, 0.03]] as const) {
        const run = play(createRun(seed, cap, day), current => bot(current, late), scale);
        assert.equal(run.hitKind, -1, `seed ${seed} day ${day} cap ${cap} late ${late}: bumped kind ${run.hitKind} at ${run.meters} m`);
        assert.equal(run.meters, dayOf(day).gate);
        assert.equal(dayStars(run), 3, `seed ${seed} day ${day}: pages ${run.pages}`);
      }
    }
  }
});

test("a day ends at its gate; stars count the pages, and the first day can be won without a page", () => {
  const lazy = play(createRun(7, TOP, 1), current => {
    // Jump everything, never reach for a high page, skip the low ones by jumping them too.
    if (current.jumpHeld) releaseJump(current);
    const kid = current.d + KID_X;
    for (let index = current.first; index < current.count; index++) {
      const piece = pieceAt(current, index);
      if (piece.state !== AHEAD || piece.x + piece.w < kid - HALF || piece.kind === TIFFIN || (piece.kind === PAGE && piece.y > 30)) continue;
      if (isOver(piece.kind)) { if (!current.duckHeld && (piece.x - kid - HALF) / current.speed <= 0.1) pressDuck(current); if (current.duckHeld && piece.x + piece.w < kid - HALF) releaseDuck(current); }
      else if (current.air < 0 && (piece.x + piece.w / 2 - kid) / current.speed <= APEX) pressJump(current);
      break;
    }
  });
  assert.equal(lazy.over, true);
  assert.equal(lazy.gate, true);
  assert.ok(dayStars(lazy) >= 1 && dayStars(lazy) === (lazy.pages >= 3 ? 3 : lazy.pages >= 2 ? 2 : 1));
  const tripped = play(createRun(9, TOP, 1), () => {});
  assert.equal(dayStars(tripped), 0, "short of the gate is no star");
  assert.equal(dayStars({ ...tripped, day: 0 }), 0);
});

test("near-miss lines give the exact number", () => {
  assert.equal(nearMiss({ day: 2, meters: 360, stars: 0, pages: 1, best: null }), "আর ৪০ মিটার গেলেই রবিবারের গেট।");
  assert.equal(nearMiss({ day: 2, meters: 400, stars: 1, pages: 1, best: null }), "আর ১টা পাতা কুড়ালেই ২ তারা।");
  assert.equal(nearMiss({ day: 2, meters: 400, stars: 2, pages: 2, best: null }), "আর ১টা পাতা কুড়ালেই ৩ তারা।");
  assert.equal(nearMiss({ day: 2, meters: 400, stars: 3, pages: 3, best: null }), "");
  assert.equal(nearMiss({ day: 0, meters: 900, stars: 0, pages: 0, best: 928 }), "আর ২৮ মিটার গেলেই নতুন সেরা।");
  assert.equal(nearMiss({ day: 0, meters: 300, stars: 0, pages: 0, best: 928 }), "");
});

test("an old phone's best on the endless road opens the days its distance passed, once", () => {
  assert.equal(migrateLevels(null, "450"), JSON.stringify({ 1: 1, 2: 1 }));
  assert.equal(unlockedLevel(readLevels(migrateLevels(null, "450"), DAY_COUNT), DAY_COUNT), 3);
  assert.equal(migrateLevels(null, "1500"), JSON.stringify({ 1: 1, 2: 1, 3: 1 }), "never more than half the week");
  assert.equal(migrateLevels(null, "120"), null);
  assert.equal(migrateLevels(null, null), null);
  assert.equal(migrateLevels("{}", "900"), null, "already moved");
});

test("old links open the endless road; day links carry the day and are checked against its gate", () => {
  assert.deepEqual(parseShareHash("s=4821&t=928"), { seed: 4821, meters: 928, name: "" });
  const card = { seed: 777, meters: 400, name: "মিম", day: 2 };
  const hash = shareHash(card);
  assert.equal(hash, `s=777&t=400&l=2&n=${encodeURIComponent("মিম")}`);
  assert.deepEqual(parseShareHash(hash), card);
  assert.equal(share.normalize(hash), hash);
  assert.equal(shareHash({ ...card, day: undefined }), `s=777&t=400&n=${encodeURIComponent("মিম")}`);
  assert.equal(previewTitle(card), "মিম রবিবার স্কুলের পথে ৪০০ মিটার গেছে। তুমি পারবে?");
  for (const bad of ["s=7&t=300&l=0", "s=7&t=300&l=7", "s=7&t=300&l=x", "s=7&t=401&l=2"]) assert.equal(parseShareHash(bad), null, bad);
});

test("no দৌড় anywhere in the words: page content, the game's lines and the component's own text", () => {
  const files = ["../lib/result.ts", "../lib/road.ts", "../lib/draw-scene.ts", "../lib/draw-card.ts", "../components/late-game.tsx"];
  const words = [JSON.stringify(site), ...files.map(file => readFileSync(new URL(file, import.meta.url), "utf8"))].join("\n");
  assert.doesNotMatch(words, /\u09A6\u09CC(?:\u09DC|\u09A1\u09BC)/);
  assert.ok(DAYS.length === DAY_COUNT);
});
