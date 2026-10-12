import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, readLevels, recordLevel, totalStars, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import { isLevel, nightOf, opponentOf, LEVEL_COUNT, OPPONENTS } from "../lib/levels";
import {
  bannerNote, caption, clearLine, compareLine, feat, hitLine, humanLine, levelLabel, lossLine, nearMissLine, parseShared, pointLine, previewTitle, sharedHash,
} from "../lib/link";
import {
  botShot, groundTime, newGame, posX, posY, returnChance, returnFlight, ringRadius, ringShows, shotFor, simulate, starsOf, step, swing, timeToHit, yAtNet,
  FOG_RING, GROUND, HIT_Y, MIN_FLIGHT, NET_BOTTOM, NET_TOP, NET_X, PERFECT, POINTS, type Game,
} from "../lib/rally";
import { airSwing, farPing, netFlap, racketPing, sigh, swish, windLoop } from "../lib/sound";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);

/** A player whose swing lands `sigma` game seconds around the perfect moment (seeded, so runs repeat). */
const human = (sigma: number, seed: number) => {
  const rng = makeRng(seed);
  return () => (rng() + rng() + rng() + rng() - 2) * sigma * 1.73;
};

test("five made-up neighbours, three nights each, each opponent a little sharper", () => {
  assert.equal(LEVEL_COUNT, 15);
  assert.deepEqual(levels.slice(0, 6).map(nightOf), ["calm", "wind", "fog", "calm", "wind", "fog"]);
  assert.equal(opponentOf(1).name, "পাশের বাসার ভাইয়া");
  assert.equal(opponentOf(15).name, "পাড়ার চ্যাম্পিয়ন");
  for (let i = 1; i < OPPONENTS.length; i++) {
    const [a, b] = [OPPONENTS[i - 1], OPPONENTS[i]];
    assert.ok(b.skill > a.skill && b.pace < a.pace && b.spread > a.spread && b.window < a.window && b.drive >= a.drive, `opponent ${i + 1}`);
  }
  assert.ok(isLevel(1) && isLevel(15) && !isLevel(0) && !isLevel(16) && !isLevel(2.5));
});

test("same seed, same game: the opponent's shots replay exactly", () => {
  const run = (seed: number) => simulate(8, seed, human(0.08, 99)).game;
  const a = run(31337), b = run(31337), c = run(31338);
  assert.deepEqual([a.us, a.them, a.longest, a.clock], [b.us, b.them, b.longest, b.clock]);
  const shots = (seed: number) => { const g = newGame(11, seed); return [botShot(g, 282, HIT_Y, true), botShot(g, 282, HIT_Y, false), botShot(g, 282, HIT_Y, false)]; };
  assert.deepEqual(shots(5), shots(5));
  assert.notDeepEqual(shots(5), shots(6));
  assert.notDeepEqual([a.us, a.them, a.clock], [c.us, c.them, c.clock]);
});

test("timing sets the return: early is high, on time a smash, late low, very late the net", () => {
  assert.equal(shotFor(0)?.kind, "smash");
  assert.equal(shotFor(PERFECT)?.kind, "smash");
  assert.equal(shotFor(-0.6)?.kind, "lob");
  assert.equal(shotFor(0.6)?.kind, "drive");
  assert.equal(shotFor(0.9)?.kind, "net");
  assert.equal(shotFor(-1.01), null);
  assert.equal(shotFor(1.01), null);
  assert.ok(shotFor(-0.31)!.quality > shotFor(-0.99)!.quality, "a lob nearer the moment is better");
  // The arcs agree with the outcome: real returns clear the net tape, a net shot meets the mesh.
  for (const kind of ["smash", "drive", "lob", "serve"] as const) {
    for (const x of [56, 80, 104]) assert.ok(yAtNet(returnFlight(kind, x, HIT_Y)) < NET_TOP - 6, `${kind} from ${x}`);
  }
  const into = returnFlight("net", 80, HIT_Y), y = posY(into, into.netAt);
  assert.ok(y > NET_TOP && y < NET_BOTTOM && Math.abs(posX(into, into.netAt) - NET_X) < 6);
  // The lob is the highest arc, the smash the fastest.
  const lob = returnFlight("lob", 80, HIT_Y), smash = returnFlight("smash", 80, HIT_Y);
  assert.ok(lob.h > smash.h && smash.T < lob.T);
});

test("the opponent returns weak shots more often, good shots less, and tires in long rallies", () => {
  for (const opp of OPPONENTS) {
    assert.ok(returnChance(opp, 0.35, 0) > returnChance(opp, 1, 0));
    assert.ok(returnChance(opp, 1, 30) < returnChance(opp, 1, 0));
    assert.ok(returnChance(opp, 0, 0) <= 0.96 && returnChance(opp, 1, 99) >= 0.05);
  }
});

test("never an unfair shot: every incoming shuttle is reachable, slow enough and clears the net", () => {
  for (const level of levels) {
    for (let seed = 1; seed <= 40; seed++) {
      const game = newGame(level, seed);
      for (let i = 0; i < 30; i++) {
        game.rally = i;
        const f = botShot(game, 282, HIT_Y, i === 0);
        assert.ok(f.T >= MIN_FLIGHT, `level ${level}: ${f.T}`);
        assert.ok(f.x1 >= 40 && f.x1 <= 120, `level ${level}: lands at ${f.x1}`);
        assert.ok(yAtNet(f) < NET_TOP - 10, `level ${level}: over the net`);
        // Even a steep clear stays up long enough for a late, low drive.
        assert.ok(groundTime(f) - f.T >= 0.5 * opponentOf(level).window, `level ${level}: ${groundTime(f) - f.T}`);
      }
    }
  }
});

test("the ring: always on clear nights, only at the end in fog; it tightens as the shuttle arrives", () => {
  const calm = newGame(1, 7), fog = newGame(3, 7);
  for (const game of [calm, fog]) while (game.phase !== "flight") step(game, 1 / 60);
  assert.ok(ringShows(calm));
  assert.equal(ringShows(fog), false, "fog hides the ring at first");
  while ((timeToHit(fog) ?? 0) > FOG_RING) step(fog, 1 / 60);
  assert.ok(ringShows(fog));
  assert.ok(ringRadius(0.9) > ringRadius(0.3) && ringRadius(0.3) > ringRadius(0));
});

test("one swing per shuttle; a swing far too soon doesn't count", () => {
  const game = newGame(1, 3);
  while (game.phase !== "flight") step(game, 1 / 60);
  swing(game); // right after the serve: a practice swing
  assert.equal(game.swung, false);
  while ((timeToHit(game) ?? 9) > 0.005) step(game, 1 / 60);
  swing(game);
  assert.equal(game.swung, false, "a hit sends a new shuttle the other way");
  assert.equal(game.flight.toward, 1);
  assert.equal(game.last?.kind, "smash");
  assert.equal(game.rally, 1);
  const before = game.flight;
  swing(game);
  assert.equal(game.flight, before, "swinging at a shuttle going away does nothing");
});

test("stars: 0–1 points lost gives 3, 2–3 gives 2, 4 gives 1, a loss none", () => {
  assert.deepEqual([0, 1, 2, 3, 4].map(them => starsOf(POINTS, them)), [3, 3, 2, 2, 1]);
  assert.equal(starsOf(3, POINTS), 0);
  assert.equal(nearMissLine(3), "আর ২ পয়েন্ট কম দিলে ৩ তারা।");
  assert.equal(nearMissLine(1), "");
});

test("headless games end sanely: no swing loses 0–5, perfect timing wins every level, a fair human can win the first", () => {
  for (const level of levels) {
    const idle = simulate(level, 100 + level, () => null).game;
    assert.deepEqual([idle.us, idle.them, idle.longest], [0, POINTS, 0]);
    const perfect = simulate(level, 200 + level, () => 0).game;
    assert.equal(perfect.us, POINTS, `level ${level}`);
    assert.equal(perfect.them, 0);
    assert.ok(perfect.longest >= 1 && perfect.clock < 600, `level ${level}: ${perfect.clock}s`);
  }
  // Level 1 is almost impossible to fail with loose timing; the champion is a real step up.
  const winRate = (level: number, sigma: number) => {
    let wins = 0;
    for (let seed = 1; seed <= 120; seed++) if (starsOf(...((g: Game) => [g.us, g.them] as const)(simulate(level, seed, human(sigma, seed * 13 + level)).game))) wins++;
    return wins / 120;
  };
  assert.ok(winRate(1, 0.14) >= 0.95, "level 1");
  const hard = winRate(15, 0.14);
  assert.ok(hard > 0.05 && hard < 0.6, `level 15: ${hard}`);
});

test("the first point comes within about ten seconds on level 1", () => {
  const game = newGame(1, 9);
  let clock = 0;
  while (game.us + game.them === 0 && clock < 30) {
    const left = timeToHit(game);
    if (left !== null && left <= 0) swing(game);
    step(game, 1 / 60); clock += 1 / 60;
    game.events.length = 0;
  }
  assert.ok(clock < 12, `${clock}s`);
});

test("progress goes through readLevels and recordLevel", () => {
  let stars = readLevels('{"1":3,"2":1,"16":3,"x":2,"3":9}', LEVEL_COUNT);
  assert.deepEqual(stars, { 1: 3, 2: 1 });
  stars = recordLevel(stars, 2, starsOf(POINTS, 1));
  assert.equal(stars[2], 3);
  stars = recordLevel(stars, 2, starsOf(POINTS, 4));
  assert.equal(stars[2], 3, "a worse result never lowers the stars");
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 3);
  assert.equal(totalStars(stars), 6);
  assert.deepEqual(readLevels("not json", LEVEL_COUNT), {});
});

test("a challenge link round-trips and refuses broken or forged input", () => {
  const shared = { level: 4, seed: 123456, them: 2, rally: 9, name: "রাফি" };
  const hash = sharedHash(shared);
  assert.equal(hash, `s=123456&t=2&r=9&l=4&n=${encodeURIComponent("রাফি")}`);
  assert.deepEqual(parseShared(`#${hash}`), shared);
  assert.equal(previewTitle(shared), "রাফি তিনতলার আপুকে ৫–২ পয়েন্টে হারিয়েছে। তুমি পারবে?");
  assert.equal(feat({ level: 1, them: 0, name: "" }), "এক বন্ধু পাশের বাসার ভাইয়াকে ৫–০ পয়েন্টে হারিয়েছে");
  assert.match(bannerNote("রাফি"), /রাফির নিজের ফোনের স্কোর/);
  assert.equal(share.normalize(hash), hash);
  assert.match(share.preview(hash).title, /রাফি/);
  const good = new URLSearchParams(hash);
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ t: "5" }), variant({ t: "-1" }), variant({ t: "1.5" }), variant({ t: null }),
    variant({ r: "0" }), variant({ r: "301" }), variant({ r: "09" }), variant({ r: "x" }), variant({ r: null }),
    variant({ l: "0" }), variant({ l: "16" }), variant({ l: "04" }), variant({ l: null }),
    variant({ s: "0" }), variant({ s: "1000000000" }), variant({ s: null }),
    "", "#", "garbage", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
  ]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null);
  }
  assert.ok(parseShared(variant({ r: "300", l: "15" })), "a long final rally is fine");
  const hostile = parseShared(variant({ n: "‮রাফি\u0000" + "ক".repeat(40) }))!;
  assert.ok(hostile.name.length <= 20 && !hostile.name.includes("‮") && !hostile.name.includes("\u0000"));
  assert.ok(share.preview("junk").title.length > 0);
});

test("result lines: kind, exact and Bangla", () => {
  assert.equal(levelLabel(6), "লেভেল ৬ · কুয়াশার রাত");
  assert.equal(compareLine({ them: 1, rally: 4 }, { them: 3, rally: 9 }, "রাফি"), "রাফি ৩ পয়েন্ট দিয়েছিল, তুমি ১!");
  assert.match(compareLine({ them: 3, rally: 4 }, { them: 1, rally: 9 }, "রাফি"), /আর একটু হলেই/);
  assert.match(compareLine({ them: 2, rally: 12 }, { them: 2, rally: 9 }, "রাফি"), /রাফির চেয়ে লম্বা/);
  assert.match(compareLine({ them: 2, rally: 5 }, { them: 2, rally: 9 }, ""), /সমান সমান/);
  assert.match(caption({ level: 1, them: 0, rally: 6 }), /^গলির ব্যাডমিন্টনে পাশের বাসার ভাইয়াকে ৫–০ পয়েন্টে হারালাম।/);
  assert.equal(humanLine({ level: 15, them: 4, rally: 3 }), "পাড়ার নতুন চ্যাম্পিয়ন।");
  assert.match(humanLine({ level: 2, them: 3, rally: 18 }), /১৮ বার/);
  assert.equal(new Set(levels.map(clearLine)).size, LEVEL_COUNT);
  assert.match(lossLine(4, "missed"), /আর ১ পয়েন্ট/);
  assert.match(lossLine(1, "net"), /জালে/);
  assert.equal(hitLine("smash"), "জোরালো মার!");
  assert.match(pointLine(1, "early", 1), /^আহা!/);
  assert.match(pointLine(0, "botNet", 13), /^চ্যাম্পিয়ন/);
  const all = [...levels.map(clearLine), ...levels.map(level => humanLine({ level, them: 2, rally: 4 }))].join(" ");
  assert.doesNotMatch(all, /অসাধারণ|দারুণ|সেরা|আপনি|!!/);
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^ব্যাডমিন্টন গেম/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /পেনাল্টি কিক|শেষ বলে ছয়/.test(item.answer)));
  for (const word of ["নাম", "লেভেল", "সিড", "স্কোর", "র‍্যালি"]) assert.match(site.privacy.join(" "), new RegExp(word));
  const text = JSON.stringify(site);
  assert.equal(text, text.normalize("NFC"));
  assert.doesNotMatch(text, /আপনি|করুন|দেখুন|বাজি|জিতে নাও|yonex|li-ning|ইয়োনেক্স|লি-নিং|অসাধারণ|সহজেই/i);
});

test("sounds never throw without audio (no window, no AudioContext)", () => {
  assert.doesNotThrow(() => { racketPing(); racketPing(true); farPing(); swish(); swish(true); airSwing(); sigh(); netFlap(); const wind = windLoop(); wind.set(0.5); wind.stop(); });
});

test("a whole headless match never leaves the court", () => {
  const { game } = simulate(14, 77, human(0.1, 5));
  assert.ok(game.us === POINTS || game.them === POINTS);
  assert.ok(game.landX > -40 && game.landX < 400);
  assert.ok(posY(game.flight, 0) <= GROUND);
});
