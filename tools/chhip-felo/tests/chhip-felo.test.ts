import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, readLevels, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import { addCatch, albumCount, fight, fishIn, parseAlbum, placeOpen, rollFish, rollGrams, FISH, MAX_GRAMS, PLACES } from "../lib/fish";
import {
  accuracyOf, basket, biggest, fishToNext, flick, floatState, greenBand, lastLevelOf, newTrip, press, release, specOf, starsOf, step, swing,
  GREEN_MID, LEVELS, LEVEL_COUNT, type Event, type Trip,
} from "../lib/game";
import * as sound from "../lib/sound";
import { bannerNote, caption, clearLine, compareLine, feat, humanLine, nearMissLine, parseShared, previewTitle, sharedHash, weightText, MISS_LINES } from "../lib/link";

const DT = 1 / 60;
type Brain = (trip: Trip, history: number[]) => void;

/** Plays a whole trip with a scripted player. `history` holds past tensions so a brain can react late, like a thumb. */
function play(level: number, seed: number, brain: Brain, slow = false) {
  const trip = newTrip(level, seed, slow), history: number[] = [], events: Event[] = [];
  for (let guard = 0; trip.phase !== "done"; guard++) {
    assert.ok(guard < 60 * 60 * 5, "a trip ends within five minutes");
    brain(trip, history);
    const event = step(trip, DT);
    if (event) events.push(event);
    history.push(trip.tension);
  }
  return { trip, events };
}

/** Casts onto the bubbles, strikes a quarter second into the dip, and reels from what it saw a quarter second ago. */
const human = (lag = 15): Brain => (trip, history) => {
  if (trip.phase === "aim") flick(trip, trip.spot);
  else if (trip.phase === "wait" && floatState(trip) === "under" && trip.t / (trip.slow ? 1.6 : 1) >= trip.biteAt + 0.25) press(trip);
  else if (trip.phase === "reel") {
    const seen = history[Math.max(0, history.length - lag)] ?? trip.tension;
    if (seen < GREEN_MID - 0.03) press(trip); else release(trip);
  }
};

test("15 levels in three places, each a small step harder, stars from fish caught", () => {
  assert.equal(LEVEL_COUNT, 15);
  assert.deepEqual(LEVELS.map(row => row[0]), [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2]);
  for (let level = 2; level <= LEVEL_COUNT; level++) {
    const a = specOf(level - 1), b = specOf(level);
    if (a.place === b.place) assert.ok(b.window <= a.window && b.pull >= a.pull && b.casts >= a.casts, `level ${level}`);
    assert.ok(b.window >= 0.6, "the float stays under long enough to react");
  }
  assert.equal(specOf(1).fakes, 0, "level 1 has no fake nibbles");
  assert.equal(lastLevelOf(0), 5); assert.equal(lastLevelOf(1), 10); assert.equal(lastLevelOf(2), 15);
  const five = { casts: 5, need: 3 };
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(c => starsOf(c, five)), [0, 0, 0, 1, 2, 3]);
  assert.deepEqual([0, 1, 2, 3].map(c => starsOf(c, specOf(1))), [0, 1, 2, 3]);
  assert.deepEqual(fishToNext(4, five), { goal: 3, fish: 1 });
  assert.deepEqual(fishToNext(1, five), { goal: 1, fish: 2 });
  assert.equal(fishToNext(5, five), 0);
  assert.equal(nearMissLine(5, 4), "আর ১টা মাছ হলে ৩ তারা।");
  assert.equal(nearMissLine(5, 2), "আর ১টা মাছ হলেই লেভেল পার।");
  assert.equal(nearMissLine(5, 5), "");
});

test("20 fish of our own, each place with its pool, rare ones likelier near the bubbles", () => {
  assert.equal(FISH.length, 20);
  assert.equal(new Set(FISH.map(fish => fish.id)).size, 20);
  assert.equal(new Set(FISH.map(fish => fish.name)).size, 20);
  for (const fish of FISH) assert.ok(fish.grams[0] >= 20 && fish.grams[1] <= MAX_GRAMS && fish.note.length < 80, fish.id);
  for (const place of [0, 1, 2]) assert.ok(fishIn(place).some(index => FISH[index].rarity === 2), "every place has a rare fish");
  // The album gates can be met from the places before them.
  assert.ok(fishIn(0).length >= PLACES[1].need);
  assert.ok(new Set([...fishIn(0), ...fishIn(1)]).size >= PLACES[2].need);
  const count = (accuracy: number) => {
    const rng = makeRng(9);
    let rare = 0;
    for (let i = 0; i < 4000; i++) if (FISH[rollFish(2, accuracy, rng)].rarity === 2) rare++;
    return rare;
  };
  assert.ok(count(1) > count(0) * 2, "a cast on the bubbles finds more rare fish");
  const rng = makeRng(3);
  for (let i = 0; i < 500; i++) {
    const fish = rollFish(i % 3, (i % 11) / 10, rng), grams = rollGrams(fish, 0.5, rng);
    assert.ok(FISH[fish].places.includes(i % 3));
    assert.ok(grams >= FISH[fish].grams[0] - 10 && grams <= FISH[fish].grams[1] && grams % 10 === 0);
  }
  assert.equal(fight(50), 0); assert.equal(fight(5000), 1);
});

test("the album keeps the heaviest of each fish and opens places by count", () => {
  let album = parseAlbum(null);
  assert.equal(albumCount(album), 0);
  let step1 = addCatch(album, 0, 50);
  assert.ok(step1.isNew && !step1.isRecord);
  album = step1.album;
  step1 = addCatch(album, 0, 70);
  assert.ok(!step1.isNew && step1.isRecord);
  album = addCatch(step1.album, 0, 40).album;
  assert.equal(album.punti, 70);
  assert.deepEqual(parseAlbum(JSON.stringify(album)), album);
  assert.deepEqual(parseAlbum('{"punti":1.5,"koi":0,"rui":99999,"shark":5,"__proto__":3,"telapia":"200"}'), { telapia: 200 });
  for (const junk of ["[1,2]", "null", "{", '"x"', "42"]) assert.deepEqual(parseAlbum(junk), {});
  assert.ok(placeOpen(0, 0) && !placeOpen(1, 3) && placeOpen(1, 4) && !placeOpen(2, 9) && placeOpen(2, 10));
});

test("level progress goes through the shared readLevels and recordLevel", () => {
  let stars = readLevels('{"1":3,"2":1,"16":3,"x":2,"3":4}', LEVEL_COUNT);
  assert.deepEqual(stars, { 1: 3, 2: 1 });
  stars = recordLevel(stars, 2, starsOf(3, specOf(2)));
  assert.equal(stars[2], 3);
  assert.equal(unlockedLevel(stars, LEVEL_COUNT), 3);
  assert.equal(unlockedLevel(readLevels("broken", LEVEL_COUNT), LEVEL_COUNT), 1);
});

test("same seed, same water: spots, nibbles, bites and fish; another seed differs", () => {
  const a = play(9, 4242, human()), b = play(9, 4242, human()), c = play(9, 4243, human());
  assert.deepEqual(a.trip.catches, b.trip.catches);
  assert.deepEqual(a.events, b.events);
  assert.notDeepEqual(a.events.concat(a.trip.catches.map(x => String(x.grams)) as Event[]), c.events.concat(c.trip.catches.map(x => String(x.grams)) as Event[]));
  const one = newTrip(4, 77), two = newTrip(4, 77);
  assert.equal(one.spot, two.spot);
  assert.ok(one.spot >= 0.25 && one.spot <= 0.85);
});

test("every level is fair: a quarter-second thumb catches every fish, on many seeds, in normal and slow mode", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    for (let seed = 1; seed <= 25; seed++) {
      for (const slow of [false, true]) {
        const { trip } = play(level, seed * 7919, human(), slow);
        assert.equal(trip.catches.length, specOf(level).casts, `level ${level}, seed ${seed}, slow ${slow}: ${trip.results.join(",")}`);
        assert.equal(starsOf(trip.catches.length, trip.spec), 3);
      }
    }
  }
});

test("nibbles always come before the dip with time to tell them apart", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    for (let seed = 1; seed <= 40; seed++) {
      const trip = newTrip(level, seed);
      flick(trip, (seed % 10) / 10);
      while (trip.phase === "fly") step(trip, DT);
      assert.ok(trip.fakes.length <= specOf(level).fakes);
      assert.ok(trip.biteAt >= 0.7, "a bite never comes the instant the float lands");
      for (const at of trip.fakes) assert.ok(trip.biteAt - at >= 0.9, `level ${level} seed ${seed}`);
    }
  }
});

test("the rules: early, nibble and late strikes miss; too much or too little tension loses the fish", () => {
  const landed = (level: number, seed: number) => { const trip = newTrip(level, seed); flick(trip, trip.spot); while (trip.phase === "fly") step(trip, DT); return trip; };
  // Level 1 forgives an early tap; later levels don't.
  const gentle = landed(1, 5);
  assert.equal(press(gentle), "hush");
  assert.equal(gentle.phase, "wait");
  const early = landed(3, 5);
  assert.equal(press(early), "early");
  assert.equal(early.phase, "lost");
  // A nibble strike.
  let nib: Trip | null = null;
  for (let seed = 1; !nib && seed < 200; seed++) { const trip = landed(9, seed); if (trip.fakes.length) nib = trip; }
  assert.ok(nib);
  while (floatState(nib) === 0) step(nib, DT);
  assert.equal(press(nib), "nibble");
  // Waiting past the dip.
  const late = landed(6, 8);
  let event: Event = "";
  while (late.phase === "wait") event = step(late, DT);
  assert.equal(event, "late");
  // Never holding lets the line go slack; holding the whole time snaps it.
  const reel = (holdAll: boolean) => {
    const trip = landed(12, 3);
    while (floatState(trip) !== "under") step(trip, DT);
    assert.equal(press(trip), "hook");
    if (!holdAll) release(trip);
    let last: Event = "";
    while (trip.phase === "reel") last = step(trip, DT) || last;
    return last;
  };
  assert.equal(reel(false), "slip");
  assert.equal(reel(true), "snap");
  // Big fish narrow the green band.
  assert.ok(greenBand({ grams: 4000, slow: false }).hi - greenBand({ grams: 4000, slow: false }).lo < greenBand({ grams: 60, slow: false }).hi - greenBand({ grams: 60, slow: false }).lo);
  // The power meter swings up and back, so overholding is never best.
  assert.equal(swing(0, false), 0); assert.equal(swing(0.8, false), 1); assert.ok(swing(1.2, false) < 0.6);
  assert.equal(accuracyOf(0.5, 0.5), 1); assert.equal(accuracyOf(0.9, 0.5), 0);
});

test("a careless player still ends the trip sanely, and a hold-release cast works", () => {
  for (let seed = 1; seed <= 30; seed++) {
    const rng = makeRng(seed);
    const { trip } = play(1 + (seed % LEVEL_COUNT), seed, t => {
      if (rng() < 0.03) press(t);
      if (rng() < 0.05) release(t);
    });
    assert.ok(trip.catches.length <= trip.spec.casts);
    assert.equal(trip.results.length, trip.spec.casts);
    assert.ok(basket(trip) >= 0 && basket(trip) <= trip.spec.casts * MAX_GRAMS);
  }
  const trip = newTrip(2, 11);
  assert.equal(press(trip), "charge");
  for (let i = 0; i < 30; i++) step(trip, DT);
  assert.ok(trip.power > 0.5 && trip.power < 0.7);
  assert.equal(release(trip), "cast");
  assert.equal(trip.phase, "fly");
  const best = biggest({ catches: [{ fish: 0, grams: 50 }, { fish: 7, grams: 2000 }] });
  assert.equal(best?.fish, 7);
});

test("words: weights, lines, comparisons", () => {
  assert.equal(weightText(850), "৮৫০ গ্রাম");
  assert.equal(weightText(1240), "১ কেজি ২৪০ গ্রাম");
  assert.equal(weightText(2000), "২ কেজি");
  assert.match(clearLine(5), /বাড়ির পুকুরের সব লেভেল শেষ। এবার বিলের দিকে/);
  assert.match(clearLine(10), /এবার নদীর দিকে/);
  assert.match(clearLine(15), /১৫টা লেভেল শেষ/);
  for (let level = 1; level <= LEVEL_COUNT; level++) assert.ok(clearLine(level).length > 10);
  assert.equal(humanLine({ level: 5, catches: 5, big: 0 }), "একটা টোপও নষ্ট হয়নি।");
  assert.match(humanLine({ level: 5, catches: 3, big: 7 }), /ছিপে রুই উঠেছে/);
  assert.match(humanLine({ level: 5, catches: 0, big: -1 }), /ছুটিতে/);
  assert.equal(compareLine(1500, 1200, "রাফি"), "রাফির চেয়ে ৩০০ গ্রাম বেশি!");
  assert.equal(compareLine(1200, 1200, "রাফি"), "একদম সমান! রাফিও ১ কেজি ২০০ গ্রাম তুলেছিল।");
  assert.equal(compareLine(1100, 1200, "রাফি"), "আর একটু হলেই! মাত্র ১০০ গ্রাম কম।");
  assert.match(compareLine(200, 3000, ""), /বন্ধু এখনো ২ কেজি ৮০০ গ্রাম এগিয়ে/);
  assert.match(caption({ level: 12, grams: 3200, catches: 4, big: 19 }), /নদীতে ৪টা মাছ, মোট ৩ কেজি ২০০ গ্রাম। সবচেয়ে বড়টা ইলিশ/);
  for (const line of Object.values(MISS_LINES)) assert.ok(line.length < 70);
});

test("a challenge link round-trips; forged, broken or hostile links are refused", () => {
  const shared = { level: 7, seed: 4321, grams: 1240, catches: 3, big: 12, name: "রাফি" };
  const hash = sharedHash(shared);
  assert.deepEqual(parseShared(`#${hash}`), shared);
  assert.equal(previewTitle(shared), "রাফি লেভেল ৭-এ ছিপ ফেলে ১ কেজি ২৪০ গ্রাম মাছ তুলেছে। তুমি পারবে?");
  assert.equal(feat({ level: 1, grams: 90, name: "" }), "এক বন্ধু লেভেল ১-এ ছিপ ফেলে ৯০ গ্রাম মাছ তুলেছে");
  assert.match(bannerNote(shared), /রাফির নিজের ফোনের হিসাব/);
  assert.equal(share.normalize(hash), hash);
  assert.match(share.preview(hash).title, /রাফি/);
  const empty = { level: 2, seed: 9, grams: 0, catches: 0, big: -1, name: "" };
  assert.deepEqual(parseShared(sharedHash(empty)), empty);

  const good = new URLSearchParams(hash);
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ l: "16" }), variant({ l: "0" }), variant({ l: "07" }), variant({ l: null }),
    variant({ c: "5" }), variant({ c: "-1" }), variant({ c: "" }), variant({ c: null }),
    variant({ b: "20" }), variant({ b: "18" }), variant({ b: "x" }), variant({ b: null }), variant({ b: "012" }),
    variant({ t: "40" }), variant({ t: "99999" }), variant({ t: "1.5" }), variant({ c: "0" }),
    variant({ s: "0" }), variant({ s: "1000000000" }),
    "", "#", "garbage", "s=1&t=1", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
  ]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null);
  }
  const hostile = parseShared(variant({ n: "‮রাফি\u0000" + "ক".repeat(40) }))!;
  assert.ok(hostile.name.length <= 20 && !hostile.name.includes("‮"));
  assert.ok(share.preview("junk").title.length > 0);
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^মাছ ধরার গেম/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /দুধ উথলানোর আগে|বাইচের নৌকা/.test(item.answer)));
  for (const word of ["নাম", "লেভেল", "সিড", "ওজন"]) assert.match(site.privacy.join(" "), new RegExp(word));
  assert.doesNotMatch(JSON.stringify(site), /আপনি|করুন|দেখুন|জিতে নাও|টাকা জিত/);
});

test("sounds stay silent without audio (no window, no AudioContext) and never throw", () => {
  sound.swish(0.5); sound.plop(); sound.nibble(); sound.dip(); sound.strike(); sound.thrash(); sound.caught(true); sound.snap(); sound.slip();
  const hum = sound.reelHum();
  hum.follow(0.8); hum.stop();
});
