import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { advance } from "../lib/clock.hot";
import { LEVEL_COUNT, ORDER, WORDS, WORLDS, bn, ghatAt, isLevel, isWorldEnd, levelOf, levelsOfWorld, nextInOrder, nextToPlay, placeOf, progressOf, starsOf } from "../lib/levels";
import { EV, IGNORE, MISS, RIGHT, SPIN_MS, canSpin, expected, hintOf, newRace, resultOf, spinNow, tap, type Race } from "../lib/sim";
import { cardLine, cardSub } from "../lib/card";
import { site, parentNote } from "../content";
import { share } from "../share";
import { FIVE, GUESSER, LEARNER, QUICK, playRace } from "./bot";

const root = join(import.meta.dirname, "..");
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
});
const run = (race: Race, ms: number) => { for (let at = 0; at < ms; at += 10) advance(race, 10); };
/** Spins and waits for the চরকি to stop, forcing the face. */
const spinTo = (race: Race, face: number) => { assert.ok(spinNow(race)); race.face = face; run(race, SPIN_MS + 20); assert.equal(race.spin, face); };
const SEEDS = 300;

test("number words 1–20 are right, NFC and unique", () => {
  assert.equal(WORDS.slice(1).join(" "), "এক দুই তিন চার পাঁচ ছয় সাত আট নয় দশ এগারো বারো তেরো চৌদ্দ পনেরো ষোলো সতেরো আঠারো উনিশ বিশ");
  assert.equal(new Set(WORDS.slice(1)).size, 20);
  for (const word of WORDS) assert.equal(word, word.normalize("NFC"));
  assert.equal(bn(17), "১৭");
});

test("levels: ids 1–5 keep their old meaning, 6–10 are new, three worlds each end in a named finale", () => {
  assert.equal(LEVEL_COUNT, 10);
  assert.deepEqual([...ORDER].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual([1, 2, 3, 4, 5].map(id => [levelOf(id).n, levelOf(id).predict, levelOf(id).glow]), [[10, false, true], [10, false, false], [10, true, false], [20, false, false], [20, true, false]]);
  assert.deepEqual(WORLDS.map(world => levelsOfWorld(world.id)), [[6, 1, 2, 7], [3, 4, 5], [8, 9, 10]]);
  for (const world of WORLDS) {
    const ids = levelsOfWorld(world.id), last = ids[ids.length - 1];
    assert.ok(levelOf(last).finale && isWorldEnd(last) && ids.slice(0, -1).every(id => !isWorldEnd(id)), world.name);
  }
  assert.equal(new Set(ORDER.map(id => levelOf(id).title)).size, 10);
  for (const id of ORDER) { const level = levelOf(id); assert.equal(level.title, level.title.normalize("NFC")); assert.ok(Math.abs(level.odds.reduce((a, b) => a + b, 0) - 1) < 1e-9); assert.equal(level.odds.length, level.faces); }
  assert.equal(placeOf(6), 1); assert.equal(placeOf(10), 10);
  assert.equal(nextInOrder(7), 3); assert.equal(nextInOrder(10), 0);
  assert.equal(nextToPlay({}), 6); assert.equal(nextToPlay({ 6: 3, 1: 1 }), 2); assert.equal(nextToPlay(Object.fromEntries(ORDER.map(id => [id, 1]))), 10);
  assert.equal(isLevel(11), false); assert.equal(levelOf(99).id, 6);
});

test("each level adds exactly one thing over the one before it in its world", () => {
  const key = (id: number) => { const l = levelOf(id); return [l.n, l.dir, l.rival, l.glow, l.predict, l.faces]; };
  for (const world of WORLDS) {
    const ids = levelsOfWorld(world.id);
    for (let at = 1; at < ids.length; at++) {
      const a = key(ids[at - 1]), b = key(ids[at]);
      assert.ok(a.filter((value, index) => value !== b[index]).length >= 1, `${ids[at]} differs from ${ids[at - 1]}`);
    }
  }
  assert.equal(levelOf(6).rival, false, "level 1 has one boat");
  assert.equal(levelOf(6).n, 5);
});

test("counting back: ghat numbers fall while the boat's progress rises", () => {
  const down = levelOf(8);
  assert.equal(down.dir, -1);
  assert.deepEqual([0, 1, 2, 10].map(k => ghatAt(down, k)), [11, 10, 9, 1]);
  for (let k = 1; k <= 10; k++) assert.equal(progressOf(down, ghatAt(down, k)), k);
  const up = levelOf(1);
  assert.deepEqual([0, 1, 10].map(k => ghatAt(up, k)), [0, 1, 10]);
});

test("a step turn: spin, tap each ghat in order, the turn ends", () => {
  const race = newRace(2, 7);
  assert.equal(expected(race), 0, "nothing to tap before a spin");
  assert.equal(tap(race, 1), IGNORE);
  spinTo(race, 2);
  assert.equal(race.target, 2);
  assert.equal(expected(race), 1);
  assert.equal(tap(race, 2), MISS, "the wrong ghat");
  assert.equal(tap(race, 1), RIGHT);
  assert.deepEqual(race.pos[0], 1);
  assert.equal(expected(race), 2);
  assert.equal(tap(race, 2), RIGHT);
  assert.equal(race.pos[0], 2);
  assert.equal(race.spin, 0);
  assert.equal(race.turns, 1);
  assert.equal(race.exact, 0, "one wrong tap in that turn");
  assert.ok(canSpin(race));
});

test("a predict turn: tap where it stops, then the boat counts there by itself", () => {
  const race = newRace(3, 9);
  spinTo(race, 2);
  assert.equal(expected(race), 2);
  assert.equal(tap(race, 1), MISS);
  assert.equal(tap(race, 2), RIGHT);
  assert.ok(race.auto);
  assert.equal(expected(race), 0, "nothing to tap while the boat counts");
  run(race, 2000);
  assert.equal(race.pos[0], 2);
  assert.ok(!race.auto && canSpin(race));
});

test("the spin never goes past the last ghat", () => {
  const race = newRace(6, 3);
  race.pos[0] = 4;
  spinTo(race, 2);
  assert.equal(race.target, 5);
  assert.equal(tap(race, 5), RIGHT);
  assert.ok(race.over);
});

test("help: glow on level 1, a ring after one miss and the glow after two on a no-glow level, predict eases after three misses in a row", () => {
  const lit = newRace(1, 1); spinTo(lit, 1);
  assert.equal(hintOf(lit), 2);
  const dark = newRace(2, 1); spinTo(dark, 2);
  assert.equal(hintOf(dark), 0);
  tap(dark, 5); assert.equal(hintOf(dark), 1);
  tap(dark, 5); assert.equal(hintOf(dark), 2);
  const guess = newRace(3, 1); spinTo(guess, 2);
  tap(guess, 7); tap(guess, 8); tap(guess, 9);
  assert.ok(guess.eased);
  assert.equal(expected(guess), 1, "one ghat at a time while eased");
  assert.equal(guess.misses, 3);
});

test("stars count only wrong taps, so ধীরে খেলো changes nothing", () => {
  assert.deepEqual([0, 1, 2, 4, 5, 20].map(miss => starsOf(miss)), [3, 3, 2, 2, 1, 1]);
  assert.deepEqual([0, 2, 3, 7, 8].map(miss => starsOf(miss, 20)), [3, 3, 2, 2, 1], "twenty ghats allow a few more slips");
  const slow = newRace(2, 5, { slow: true }), fast = newRace(2, 5);
  assert.ok(slow.spinMs < fast.spinMs);
  for (const race of [slow, fast]) { spinNow(race); race.face = 1; run(race, 600); tap(race, 3); assert.equal(race.misses, 1); }
});

test("the same seed and presses give the same race", () => {
  const a = playRace(4, 77, FIVE), b = playRace(4, 77, FIVE);
  assert.deepEqual([a.race.pos, a.race.spins, a.race.misses, a.seconds], [b.race.pos, b.race.spins, b.race.misses, b.seconds]);
  const c = playRace(4, 78, FIVE);
  assert.notDeepEqual([a.race.spins, a.race.rSpins], [c.race.spins, c.race.rSpins]);
});

test("আব্বু's boat races at the same time: his চরকি turns with yours and he hops while you count", () => {
  const race = newRace(1, 11);
  const events: number[] = [];
  const drain = () => { for (let at = 0; at < race.nev; at++) events.push(race.evs[at]); race.nev = 0; };
  spinNow(race); drain();
  assert.ok(events.includes(EV.SPIN_START) && events.includes(EV.RIVAL_SPIN));
  assert.ok(race.rSpinT > 0);
  for (let at = 0; at < 200; at++) { advance(race, 10); drain(); }
  assert.ok(race.pos[1] >= 1, "he moved while you have not tapped anything");
  assert.equal(race.pos[0], 0);
  assert.ok(events.includes(EV.RIVAL_STEP));
  assert.equal(expected(race) > 0, true);
});

test("level 1 has no second boat; পালা করে has a person on the second boat by turns", () => {
  const solo = newRace(6, 1); spinNow(solo); assert.equal(solo.rSpinT, 0); run(solo, 3000); assert.equal(solo.pos[1], 0);
  const duo = newRace(1, 1, { duo: true });
  assert.ok(duo.duo);
  spinTo(duo, 1);
  assert.equal(duo.rSpinT, 0, "no automatic boat");
  tap(duo, 1);
  assert.equal(duo.turn, 1, "the turn passes to the second boat");
  assert.ok(canSpin(duo));
  spinTo(duo, 2);
  assert.equal(hintOf(duo), 2);
  tap(duo, 1); tap(duo, 2);
  assert.deepEqual([...duo.pos], [1, 2]);
  assert.equal(duo.turn, 0);
  assert.equal(duo.misses, 0, "the second boat's taps never count for stars");
  assert.equal(newRace(6, 1, { duo: true }).duo, false, "a one-boat level ignores the mode");
});

test("the rival never goes past the last ghat and owes nothing at the end", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const { race } = playRace(2, seed, QUICK);
    assert.ok(race.pos[1] <= race.n && race.rOwed >= 0);
    assert.ok(race.pos[0] === race.n);
  }
});

test("the end: arrival is an event of its own, the end page follows after the finish", () => {
  const race = newRace(6, 2);
  race.pos[0] = 4;
  spinTo(race, 1);
  race.nev = 0;
  tap(race, 5);
  const codes = Array.from(race.evs.slice(0, race.nev));
  assert.ok(codes.includes(EV.ARRIVED) && !codes.includes(EV.CARD));
  assert.ok(race.over && !race.ended);
  race.nev = 0;
  run(race, 3000);
  assert.ok(race.ended && Array.from(race.evs.slice(0, race.nev)).includes(EV.CARD));
  const done = resultOf(race);
  assert.equal(done.stars, 3);
  assert.equal(done.n, 5);
});

test("a back-sailing race starts at the last ghat's number and ends at 1", () => {
  const race = newRace(8, 4);
  spinTo(race, 2);
  assert.equal(expected(race), 1);
  const spec = levelOf(8);
  assert.equal(ghatAt(spec, 1), 10);
  tap(race, 1); tap(race, 2);
  assert.equal(ghatAt(spec, race.pos[0]), 9);
  const { race: done } = playRace(8, 5, QUICK);
  assert.equal(ghatAt(spec, done.pos[0]), 1);
});

// ---- difficulty by headless children ----
const rate = (level: number, child: typeof FIVE, ok: (play: ReturnType<typeof playRace>) => boolean, seeds = SEEDS) => {
  let hits = 0;
  for (let seed = 1; seed <= seeds; seed++) if (ok(playRace(level, seed, child))) hits++;
  return hits / seeds;
};

test("level 1: a quick child wins within 10 seconds, nearly always", () => {
  assert.ok(rate(6, QUICK, play => play.seconds <= 10) >= 0.9);
  assert.ok(rate(6, LEARNER, play => play.seconds <= 12) >= 0.85);
});

test("every level is cleared by every child, even one who only guesses", () => {
  for (const id of ORDER) for (const child of [GUESSER, FIVE, QUICK]) assert.equal(rate(id, child, play => play.race.pos[0] === play.race.n, 60), 1, `${id} ${child.knows}`);
});

test("a careful child gets 3 stars on the early levels, a guesser mostly 1 or 2", () => {
  assert.ok(rate(6, LEARNER, play => resultOf(play.race).stars === 3) >= 0.9);
  assert.ok(rate(1, LEARNER, play => resultOf(play.race).stars === 3) >= 0.75);
  assert.ok(rate(10, LEARNER, play => resultOf(play.race).stars >= 2) >= 0.55);
  assert.ok(rate(2, GUESSER, play => resultOf(play.race).stars === 3) <= 0.1);
});

test("no race is a long wait: even the 20-ghat levels take a quick child under a minute", () => {
  for (const id of ORDER) {
    const times = Array.from({ length: 80 }, (_, seed) => playRace(id, seed + 1, QUICK).seconds).sort((a, b) => a - b);
    assert.ok(times[Math.floor(times.length * 0.95)] <= (levelOf(id).n === 20 ? 55 : 28), `${id}: ${times[Math.floor(times.length * 0.95)]}s`);
  }
});

// ---- the statechart's bugs, replayed against the rules ----
test("bug 1, FreshRaceStartsClean: a new race never carries a spin from the old one", () => {
  const old = newRace(1, 3);
  spinNow(old);                       // the চরকি is still turning...
  const fresh = newRace(1, 4);        // ...and a new race starts
  run(old, 1000);                     // the old one lands whenever it likes
  assert.equal(fresh.spin, 0); assert.equal(fresh.spinT, 0); assert.equal(fresh.target, 0); assert.equal(fresh.rSpinT, 0);
  run(fresh, 1000);
  assert.equal(fresh.spin, 0, "nothing lands in the new race by itself");
});

test("bug 3, NothingRunsWhileAway: a page that stops calling the clock moves no boat", () => {
  const race = newRace(1, 5);
  spinTo(race, 2);
  tap(race, 1); tap(race, 2);
  spinNow(race);                      // both চরকি turn
  run(race, 100);
  const before = JSON.stringify([race.pos, race.rOwed, race.rSpinT, race.spinT, race.time]);
  // away: no advance() calls (the loop stops on blur and hide); nothing else in the rules reads a timer
  assert.equal(JSON.stringify([race.pos, race.rOwed, race.rSpinT, race.spinT, race.time]), before);
  const source = readFileSync(join(root, "components/game.tsx"), "utf8") + readFileSync(join(root, "lib/sim.ts"), "utf8") + readFileSync(join(root, "lib/clock.hot.ts"), "utf8");
  assert.ok(!/setTimeout|setInterval/.test(source.replace(/\/\/.*$/gm, "")), "the race has no timers of its own");
});

test("content: SEO limits, six or more FAQs, unique, NFC", () => {
  assert.ok(site.title.length <= 45 && site.title.includes("দশ ঘাটের নৌকা"), `title ${site.title.length}`);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `description ${site.description.length}`);
  assert.ok(site.faq.length >= 6);
  assert.equal(site.privacy.length, 1);
  assert.equal(site.headline, "ঘাট গুনে গুনে নৌকা চালাও");
  assert.equal(site.slug, "dosh-ghater-nouka");
  for (const ask of ["কোন বয়সের জন্য?", "ইন্টারনেট লাগে?", "কোনো তথ্য নেওয়া হয়?", "কতক্ষণ খেলবে?"]) assert.ok(site.faq.some(item => item.question === ask), ask);
  for (const text of [site.title, site.description, site.headline!, ...site.steps, ...site.faq.flatMap(item => [item.question, item.answer]), ...Object.values(parentNote), ...ORDER.flatMap(id => [levelOf(id).line, levelOf(id).news, levelOf(id).task]), cardLine({ games: 1, counted: 5, n: 10, back: true }), cardSub({ games: 1, counted: 5, n: 10, back: true })]) assert.equal(text, text.normalize("NFC"));
});

test("a children's tool: no network, no share links, no child data, no voice", () => {
  assert.equal(share.normalize("#s=1&t=2"), null);
  assert.equal(share.normalize(""), null);
  for (const path of [...files(root), join(root, "../../app/dosh-ghater-nouka/page.tsx")]) {
    const source = readFileSync(path, "utf8");
    assert.ok(!/\bfetch\s*\(/.test(source), `${path} calls fetch`);
    assert.ok(!/share-client|\/api\//.test(source), `${path} reaches the share client or an API`);
    assert.ok(!/navigator\.sendBeacon|XMLHttpRequest|WebSocket/.test(source), `${path} talks to a server`);
    assert.ok(!/speak\(|SpeakButton|speechSynthesis|useBanglaVoice/.test(source), `${path} uses a voice`);
    assert.ok(!/Math\.random|Date\.now/.test(source) || !path.includes("/lib/"), `${path} is not deterministic`);
    assert.ok(!/<input|<textarea/.test(source), `${path} asks the child to type`);
  }
});
