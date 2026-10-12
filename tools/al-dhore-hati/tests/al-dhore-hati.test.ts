import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, readLevels, recordLevel, totalStars, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import { isLevel, levelSpec, newThing, sceneOf, LEVEL_COUNT } from "../lib/levels";
import {
  bannerNote, caption, clearLine, compareLine, feat, fellLine, humanLine, levelLabel, nearMissLine, parseShared, previewTitle, sharedHash, slipLine, streakLine,
} from "../lib/link";
import { birds, bleat, footstep, squelch, stepUp, windLoop } from "../lib/sound";
import {
  centreAt, dragBy, makeField, newGame, safeOffset, simulate, slipAt, slopeAt, start, starsOf, step, tapPlayer, windAt,
  DRAG_SPEED, FIRST_OBSTACLE, FOOT, GRACE, MAX_SLIPS, MIN_GAP, PX_PER_M, SLIP_TIME, STREAK, STRIDE, TAP_SPEED, W, type Game,
} from "../lib/walk";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
const DT = 1 / 60;
const run = (game: Game, seconds: number, pace = 1) => { for (let t = 0; t < seconds; t += DT) { step(game, DT, pace); game.events.length = 0; } };

test("twenty fields in four scenes, each a small step up, one new thing at a time", () => {
  assert.equal(LEVEL_COUNT, 20);
  assert.deepEqual([1, 5, 6, 10, 11, 15, 16, 20].map(sceneOf), ["morning", "morning", "noon", "noon", "afternoon", "afternoon", "evening", "evening"]);
  for (let n = 2; n <= LEVEL_COUNT; n++) {
    const [a, b] = [levelSpec(n - 1), levelSpec(n)];
    assert.ok(b.metres > a.metres && b.speed >= a.speed && b.half <= a.half && b.bend >= a.bend, `level ${n}`);
    assert.ok(b.puddles >= a.puddles && b.goats >= a.goats && b.wind >= a.wind, `level ${n}`);
  }
  const first = (key: "puddles" | "goats" | "wind") => levels.find(n => levelSpec(n)[key] > 0);
  assert.deepEqual([first("puddles"), first("goats"), first("wind")], [4, 7, 11]);
  assert.ok(isLevel(1) && isLevel(20) && !isLevel(0) && !isLevel(21) && !isLevel(2.5));
  assert.match(newThing(4), /পানি/); assert.match(newThing(7), /ছাগল/); assert.match(newThing(11), /বাতাস/);
});

test("a win inside the first ten seconds: field 1 takes under 10 s at its pace", () => {
  const spec = levelSpec(1);
  assert.ok((spec.metres * PX_PER_M) / spec.speed <= 10, `${(spec.metres * PX_PER_M) / spec.speed}s`);
  // and it needs barely any steering: an untouched walk usually clears it
  let cleared = 0;
  for (let seed = 1; seed <= 50; seed++) if (simulate(1, seed, () => 0).game.phase === "done") cleared++;
  assert.ok(cleared >= 45, `${cleared}/50`);
});

test("same seed, same field: the ridge, obstacles, birds, wind and a whole walk replay exactly", () => {
  const a = makeField(14, 4242), b = makeField(14, 4242), c = makeField(14, 4243);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.obstacles, c.obstacles);
  const walk = (seed: number) => { const { game, counts } = simulate(14, seed, g => tapPlayer(g)); return [game.d, game.slips, game.clock, counts.steps, counts.birds]; };
  assert.deepEqual(walk(4242), walk(4242));
  assert.equal(centreAt(a, 0), W / 2, "every field starts at the middle");
});

test("every curve is followable at the field's speed, holding a side only", () => {
  for (const level of levels) {
    for (let seed = 1; seed <= 60; seed++) {
      const field = makeField(level, seed), { half, speed, bend } = field.spec;
      let need = 0;
      for (let d = 0; d <= field.length + 400; d += 2) {
        assert.ok(Math.abs(slopeAt(field, d)) <= bend + 1e-9, `level ${level} seed ${seed}: slope at ${d}`);
        need = Math.max(need, Math.abs(slopeAt(field, d)) * speed + Math.abs(windAt(field, d)));
        const x = centreAt(field, d);
        assert.ok(x - half >= 8 && x + half <= W - 8, `level ${level} seed ${seed}: ridge leaves the board at ${d}`);
      }
      // The ridge never asks the feet for more than 80% of their sideways speed, wind included.
      assert.ok(need <= 0.8 * TAP_SPEED, `level ${level} seed ${seed}: needs ${need.toFixed(1)} px/s`);
    }
  }
});

test("obstacles are fair: never in the opening, spaced apart, always a dry lane wide enough to stand in", () => {
  for (const level of levels) {
    for (let seed = 1; seed <= 60; seed++) {
      const field = makeField(level, seed), half = field.spec.half;
      assert.equal(field.obstacles.length, field.spec.puddles + field.spec.goats);
      field.obstacles.forEach((o, i) => {
        assert.ok(o.d >= FIRST_OBSTACLE && o.d + o.len <= field.length - 40, `level ${level}: obstacle at ${o.d}`);
        if (i) { const prev = field.obstacles[i - 1]; assert.ok(o.d - prev.d - prev.len >= MIN_GAP, `level ${level} seed ${seed}: gap`); }
        const lane = o.side > 0 ? o.lo - FOOT + half : half - (o.hi + FOOT);
        assert.ok(lane >= 14, `level ${level} seed ${seed}: dry lane ${lane.toFixed(1)}px`);
        const mid = o.d + o.len / 2;
        assert.equal(slipAt(field, mid, safeOffset(field, mid)), null, "the dry lane's middle is dry");
      });
    }
  }
});

test("holding sides alone clears every field without a slip, at full pace and in slow mode", () => {
  for (const level of levels) {
    for (let seed = 1; seed <= 40; seed++) {
      for (const pace of [1, 0.6]) {
        const { game } = simulate(level, seed, g => tapPlayer(g), pace);
        assert.equal(game.phase, "done", `level ${level} seed ${seed} pace ${pace}`);
        assert.equal(game.slips, 0, `level ${level} seed ${seed} pace ${pace}`);
      }
    }
  }
});

test("headless walks end sanely: an untouched walk on a winding field slips three times and stops short", () => {
  const { game, counts } = simulate(9, 77, () => 0);
  assert.equal(game.phase, "fell");
  assert.equal(game.slips, MAX_SLIPS);
  assert.ok(game.d > 0 && game.d < game.field.length);
  assert.ok(Math.abs(counts.steps - Math.floor(game.d / STRIDE)) <= 1, "one footstep per stride");
  const clean = simulate(20, 77, g => tapPlayer(g));
  assert.equal(clean.game.bestDry, clean.game.field.length);
  assert.equal(clean.counts.streaks, Math.floor(clean.game.field.length / STREAK), "a chime every 20 dry metres");
  assert.ok(clean.counts.bleats === clean.game.field.spec.goats, "each goat bleats once");
  assert.ok(clean.game.clock < 40, `${clean.game.clock}s for the longest field`);
});

test("a sloppy player (slow to react, ignores obstacles) finds the first fields easy and the last ones hard", () => {
  const rate = (level: number) => {
    let cleared = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const rng = makeRng(seed);
      let hold: -1 | 0 | 1 = 0, next = 0;
      const { game } = simulate(level, seed, g => {
        if (g.clock >= next) {
          next = g.clock + 0.2 + rng() * 0.15;
          const error = centreAt(g.field, g.d + 6) - g.x;
          hold = error > 7 ? 1 : error < -7 ? -1 : 0;
        }
        return hold;
      });
      if (game.phase === "done") cleared++;
    }
    return cleared / 60;
  };
  assert.ok(rate(1) >= 0.95, "level 1");
  assert.ok(rate(3) >= 0.9, "level 3");
  assert.ok(rate(20) < 0.2, "level 20");
});

test("slips: off the edge, into water or a goat; then back on the dry side, a moment of grace, and the third ends the field", () => {
  const field = makeField(10, 5), half = field.spec.half;
  assert.equal(slipAt(field, 100, half), null, "the very edge still holds");
  assert.equal(slipAt(field, 100, half + 0.5), "mud");
  assert.equal(slipAt(field, 100, -half - 0.5), "mud");
  const puddle = field.obstacles.find(o => o.kind === "puddle")!, goat = field.obstacles.find(o => o.kind === "goat")!;
  assert.equal(slipAt(field, puddle.d + 5, (puddle.lo + puddle.hi) / 2 * 0.6), "puddle");
  assert.equal(slipAt(field, goat.d + 5, (goat.lo + goat.hi) / 2), "goat");
  assert.equal(slipAt(field, puddle.d - 1, (puddle.lo + puddle.hi) / 2 * 0.6), null, "before the puddle the ridge is dry");

  const game = newGame(10, 5);
  start(game);
  game.x = centreAt(game.field, 0) + half + 5;
  step(game, DT);
  assert.equal(game.phase, "slip");
  assert.equal(game.slips, 1);
  const at = game.d;
  run(game, SLIP_TIME - 0.05);
  assert.equal(game.phase, "slip");
  assert.equal(game.d, at, "no walking while in the mud");
  step(game, 0.1);
  assert.equal(game.phase, "walk", "stepped back on");
  assert.equal(slipAt(game.field, game.d, game.x - centreAt(game.field, game.d)), null);
  assert.equal(game.graceTo, game.d + GRACE);
  for (let i = 0; i < 2; i++) {
    run(game, 1);
    game.x = centreAt(game.field, game.d) - half - 5;
    step(game, DT);
    assert.equal(game.phase, "slip");
    run(game, SLIP_TIME + 0.05);
  }
  assert.equal(game.slips, 3);
  assert.equal(game.phase, "fell");
});

test("controls: a short tap is a small step, a long hold follows the curve, a drag chases the finger at a capped speed", () => {
  const tapped = newGame(1, 9);
  start(tapped);
  tapped.dir = 1; run(tapped, 0.1); tapped.dir = 0; run(tapped, 0.3);
  const small = tapped.x - W / 2;
  assert.ok(small > 2 && small < 9, `a 0.1 s tap moved ${small.toFixed(1)}px`);
  const held = newGame(1, 9);
  start(held);
  held.dir = -1; run(held, 0.3);
  assert.ok(held.vel < -0.9 * TAP_SPEED, "a held side gets to full speed quickly");
  const dragged = newGame(1, 9);
  start(dragged);
  dragged.target = dragged.x; dragBy(dragged, 20);
  step(dragged, DT);
  assert.ok(Math.abs(dragged.x - W / 2 - DRAG_SPEED * DT) < 1e-6, "one step's worth, not a jump");
  run(dragged, 0.5);
  assert.ok(Math.abs(dragged.x - (W / 2 + 20)) < 1 && dragged.phase === "walk");
  // Wind pushes a held-still walker and moves a dragging finger's aim with it.
  const windy = newGame(15, 3);
  start(windy);
  windy.d = 900;
  const push = windAt(windy.field, windy.d), x = windy.x;
  step(windy, DT);
  assert.ok(Math.abs(windy.x - x - push * DT) < 0.2);
});

test("slow mode walks slower, so footsteps come slower; the feet stay quick", () => {
  const count = (pace: number) => { const game = newGame(1, 2); start(game); let steps = 0; for (let t = 0; t < 2; t += DT) { step(game, DT, pace); steps += game.events.filter(e => e.type === "step").length; game.events.length = 0; } return { steps, d: game.d }; };
  const fast = count(1), slow = count(0.6);
  assert.ok(Math.abs(slow.d / fast.d - 0.6) < 0.02);
  assert.ok(slow.steps < fast.steps && fast.steps >= 9, `${fast.steps} vs ${slow.steps}`);
});

test("a near miss is called when the feet reach the edge and come back dry", () => {
  const game = newGame(1, 4);
  start(game);
  let near = 0;
  for (let t = 0; t < 4; t += DT) {
    const offset = game.x - centreAt(game.field, game.d), half = game.field.spec.half;
    game.dir = t < 1 ? (offset < half * 0.85 ? 1 : 0) : (offset > 0 ? -1 : 0);
    step(game, DT);
    near += game.events.filter(e => e.type === "near").length;
    game.events.length = 0;
  }
  assert.equal(game.slips, 0);
  assert.equal(near, 1);
});

test("stars: dry 3, one slip 2, two slips 1, a third slip none; near-miss lines are exact", () => {
  assert.deepEqual([0, 1, 2].map(slips => starsOf(slips, true)), [3, 2, 1]);
  assert.equal(starsOf(3, false), 0);
  assert.equal(nearMissLine(1), "একবারও না পিছলালে ৩ তারা।");
  assert.equal(nearMissLine(2), "আর একবার কম পিছলালে ২ তারা।");
  assert.equal(nearMissLine(0), "");
});

test("progress goes through readLevels and recordLevel", () => {
  let stars = readLevels('{"1":3,"2":1,"21":3,"x":2,"3":9}', LEVEL_COUNT);
  assert.deepEqual(stars, { 1: 3, 2: 1 });
  stars = recordLevel(stars, 2, starsOf(0, true));
  assert.equal(stars[2], 3);
  stars = recordLevel(stars, 2, starsOf(2, true));
  assert.equal(stars[2], 3, "a worse walk never lowers the stars");
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 3);
  assert.equal(totalStars(stars), 6);
  assert.deepEqual(readLevels("not json", LEVEL_COUNT), {});
});

test("a challenge link round-trips and refuses broken or forged input", () => {
  const shared = { level: 7, seed: 123456, slips: 1, dry: 41, name: "রাফি" };
  const hash = sharedHash(shared);
  assert.equal(hash, `s=123456&t=1&m=41&l=7&n=${encodeURIComponent("রাফি")}`);
  assert.deepEqual(parseShared(`#${hash}`), shared);
  assert.equal(previewTitle(shared), "রাফি লেভেল ৭-এর ৬০ মিটার আল একবার পিছলে পার হয়েছে। তুমি পারবে?");
  assert.equal(feat({ level: 1, slips: 0, name: "" }), "এক বন্ধু লেভেল ১-এর ৩০ মিটার আল একবারও না পিছলে পার হয়েছে");
  assert.match(bannerNote("রাফি"), /রাফির নিজের ফোনের হিসাব/);
  assert.equal(share.normalize(hash), hash);
  assert.match(share.preview(hash).title, /রাফি/);
  assert.ok(parseShared(sharedHash({ level: 20, seed: 9, slips: 0, dry: 125, name: "" })), "a dry walk of the last field");
  const good = new URLSearchParams(hash);
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ t: "3" }), variant({ t: "-1" }), variant({ t: "1.5" }), variant({ t: null }),
    variant({ m: "0" }), variant({ m: "61" }), variant({ m: "041" }), variant({ m: "x" }), variant({ m: null }),
    variant({ t: "0", m: "41" }),
    variant({ l: "0" }), variant({ l: "21" }), variant({ l: "07" }), variant({ l: null }),
    variant({ s: "0" }), variant({ s: "1000000000" }), variant({ s: null }),
    "", "#", "garbage", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
  ]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null);
  }
  const hostile = parseShared(variant({ n: "‮রাফি\u0000" + "ক".repeat(40) }))!;
  assert.ok(hostile.name.length <= 20 && !hostile.name.includes("‮") && !hostile.name.includes("\u0000"));
  assert.ok(share.preview("junk").title.length > 0);
});

test("result lines: kind, exact and Bangla", () => {
  assert.equal(levelLabel(12), "লেভেল ১২ · বাতাসের বিকাল");
  assert.equal(compareLine({ slips: 0, dry: 60 }, { slips: 2, dry: 30 }, "রাফি"), "রাফি পিছলেছিল ২ বার, তুমি একবারও না!");
  assert.match(compareLine({ slips: 2, dry: 30 }, { slips: 1, dry: 40 }, "রাফি"), /আর একটু হলেই/);
  assert.match(compareLine({ slips: 1, dry: 50 }, { slips: 1, dry: 40 }, "রাফি"), /রাফির চেয়ে লম্বা/);
  assert.match(compareLine({ slips: 0, dry: 60 }, { slips: 0, dry: 60 }, ""), /সমান সমান! বন্ধুও একবারও পিছলায়নি/);
  assert.match(caption({ level: 3, slips: 0 }), /^আল ধরে হাঁটিতে লেভেল ৩-এর ৪০ মিটার আল একবারও না পিছলে পার হলাম।/);
  assert.equal(new Set(levels.map(clearLine)).size, LEVEL_COUNT);
  assert.match(humanLine({ level: 20, slips: 0 }), /হারিকেন/);
  assert.equal(humanLine({ level: 4, slips: 1 }), "একবার কাদায় পা, তারপর আর না।");
  assert.match(fellLine(12, "puddle"), /^আর ১২ মিটার বাকি ছিল। পানি/);
  assert.match(fellLine(2, "mud"), /^আর মাত্র ২ মিটার/);
  assert.match(slipLine("goat"), /ছাগল/);
  assert.equal(streakLine(40), "টানা ৪০ মিটার, পা শুকনো।");
  const all = [...levels.map(clearLine), ...levels.map(level => humanLine({ level, slips: 1 })), fellLine(5, "goat"), fellLine(5, "mud")].join(" ");
  assert.doesNotMatch(all, /অসাধারণ|দারুণ|সেরা|আপনি|!!|সহজেই/);
  for (const line of levels.map(clearLine)) assert.ok((line.match(/!/g) ?? []).length <= 1);
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^গ্রামের গেম/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /নদী পার/.test(item.answer) && /ছিপ ফেলো/.test(item.answer)));
  for (const word of ["নাম", "লেভেল", "সিড", "পিছলেছ", "মিটার"]) assert.match(site.privacy.join(" "), new RegExp(word));
  const text = JSON.stringify(site);
  assert.equal(text, text.normalize("NFC"));
  assert.doesNotMatch(text, /আপনি|করুন|দেখুন|বাজি|জিতে নাও|অসাধারণ|সহজেই|জল/);
});

test("sounds never throw without audio (no window, no AudioContext)", () => {
  assert.doesNotThrow(() => { footstep(0); footstep(1); squelch(); bleat(); birds(); stepUp(); const wind = windLoop(); wind.set(0.5); wind.stop(); });
});
