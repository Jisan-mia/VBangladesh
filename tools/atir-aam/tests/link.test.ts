import assert from "node:assert/strict";
import test from "node:test";
import { makeRng } from "../../../shared/game-core";
import type { Dir } from "../lib/board";
import { decodeMoves, encodeMoves, fromGame, parseShared, sharedHash, MAX_LINK_MOVES } from "../lib/challenge";
import { createGame, move, pickOffer, type Game, type Run } from "../lib/rules";
import { share } from "../share";
import fixture from "./legacy-fixture.json" with { type: "json" };
import { lookAhead, playOut } from "./bot";

function scripted(start: Game, cap = 3000) {
  let game = start;
  const order: Dir[] = [1, 2, 1, 3];
  for (let i = 0; !game.over && game.moves.length < cap; i++) {
    if (game.offer) { game = pickOffer(game, game.offer.length - 1)!; continue; }
    const next = [order[i % 4], 2, 3, 0, 1].map(dir => move(game, dir as Dir)).find(Boolean);
    if (!next) break;
    game = next;
  }
  return game;
}

test("moves pack three to a character and refuse anything else", () => {
  const rng = makeRng(9);
  const moves = Array.from({ length: 301 }, () => Math.floor(rng() * 4) as Dir);
  assert.deepEqual(decodeMoves(encodeMoves(moves), 301), moves);
  assert.equal(decodeMoves(encodeMoves(moves), 300), null);
  assert.equal(decodeMoves("A*", 4), null);
  assert.equal(decodeMoves("", 0), null);
  assert.equal(decodeMoves("B", 1), null, "padding must be zero");
  assert.equal(decodeMoves("A".repeat(2000), MAX_LINK_MOVES + 1), null);
});

test("old links (no v) still parse and replay the old rules: the garden and every old level", () => {
  for (const run of fixture.free) {
    const hash = `s=${run.seed}&t=${run.score}&c=${run.c}&m=${run.m}&n=${encodeURIComponent("রাফি")}`;
    const shared = parseShared("#" + hash)!;
    assert.ok(shared, `old garden ${run.seed}`);
    assert.equal(shared.v, 1); assert.equal(shared.score, run.score); assert.equal(shared.top, run.top); assert.equal(shared.name, "রাফি");
    assert.equal(share.normalize(hash), sharedHash(shared));
    assert.equal(parseShared(`#s=${run.seed}&t=${run.score + 2}&c=${run.c}&m=${run.m}`), null, "a claimed score must match the replay");
  }
  for (const run of fixture.levels) {
    const shared = parseShared(`#l=${run.level}&t=${run.c}&m=${run.m}`)!;
    assert.ok(shared, `old level ${run.level}`);
    assert.equal(shared.v, 1); assert.equal(shared.count, run.c);
  }
  assert.equal(parseShared(`#l=2&t=${fixture.levels[1].c}&m=${fixture.levels[1].m}&d=e`), null, "old links carry no mode");
});

test("new links round-trip: a cleared level, a garden with picks, and a mode", () => {
  const level: Run = { v: 2, kind: "level", level: 5, seed: 0, mode: "e" };
  const cleared = playOut(createGame(level), game => lookAhead(game));
  assert.ok(cleared.won);
  const shared = fromGame(cleared, "জাহিদ")!;
  const hash = sharedHash(shared);
  assert.match(hash, /^v=2&l=5&t=\d+&m=[^&]+&d=e&n=/);
  assert.deepEqual(parseShared(hash), shared);
  assert.equal(parseShared(hash.replace("l=5", "l=6")), null);
  assert.equal(parseShared(hash.replace("l=5", "l=25")), null);
  assert.equal(parseShared(hash.replace("d=e", "d=x")), null);
  assert.equal(parseShared(hash.replace("v=2", "v=3")), null);
  assert.equal(fromGame(createGame(level), ""), null, "an unfinished level makes no link");

  const garden: Run = { v: 2, kind: "garden", level: 0, seed: 777, mode: "n" };
  const run = scripted(createGame(garden), 400);
  assert.ok(run.picks.length >= 1, "the run took a মালির থলে pick");
  const real = fromGame(run, "  রাফি‮ ")!;
  assert.equal(real.name, "রাফি");
  const gardenHash = sharedHash(real);
  assert.match(gardenHash, /&p=[0-3]+/);
  assert.deepEqual(parseShared("#" + gardenHash), real);
  assert.equal(share.normalize(gardenHash), gardenHash);
  assert.match(share.preview(gardenHash).title, /^রাফি .+ পর্যন্ত গেছে, .+ পয়েন্ট। তুমি পারবে\?$/);
  const params = new URLSearchParams(gardenHash);
  const tweak = (key: string, value: string | null) => { const copy = new URLSearchParams(params); if (value === null) copy.delete(key); else copy.set(key, value); return copy.toString(); };
  assert.equal(parseShared(tweak("p", null)), null, "the picks must be there");
  assert.equal(parseShared(tweak("p", real.picks + "0")), null, "and every one used");
  assert.equal(parseShared(tweak("s", "778")), null);
  assert.equal(parseShared(tweak("p", "9")), null);
});

test("hostile input is refused", () => {
  assert.equal(parseShared("#s=1&t=0&c=1&m=<script>"), null);
  assert.equal(parseShared("x".repeat(2100)), null);
  assert.equal(parseShared("#s=0&t=0&c=1&m=A"), null);
  assert.equal(parseShared("#s=1e5&t=0&c=1&m=A"), null);
  assert.equal(parseShared("#l=0&t=1&m=A"), null);
  assert.equal(share.normalize("junk"), null);
  assert.equal(share.preview("junk").title, "আঁটি থেকে আম: জোড়া মেলাও, বাগান বানাও");
});
