// Links (new and old), saved progress and its one-time migration, and the words around the game.
import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { makeCourse } from "../lib/course";
import { starsOfRide } from "../lib/card";
import { LEVELS, STORY, levelOf, MODES } from "../lib/levels";
import {
  bellsOf, bn, bumpLine, caption, compareLine, friendLine, headingFor, levelLabel, levelOfShared, nearMiss, parseShared, previewTitle, resultLine, rideDetail, sharedHash, summaryLine, versusLine, type Ride,
} from "../lib/link";
import { LADDER_KEY, afterClear, bestSlug, migrateLadder, milestoneOf, nextMilestone, oldBestStars, playable, readMode, readUnlock, recommended } from "../lib/progress";
import { CAREFUL, rideWith } from "./bot";
import { share } from "../share";

const ridden = (seed: number, level: number, mode = 1): Ride => {
  const ride = rideWith(CAREFUL, seed, level, mode);
  return { kind: "ride", seed, level, mode, score: ride.score, meters: ride.meters, delivered: ride.delivered, picked: ride.picked, bumps: ride.bumps, name: "" };
};

test("a ride made by the game round-trips through its link, and every field is read back exactly", () => {
  for (const level of [1, 4, 8, 12]) for (const mode of [0, 1, 2]) {
    const ride = { ...ridden(4242, level, mode), name: "মিম" };
    const hash = sharedHash(ride);
    assert.deepEqual(parseShared(hash), ride);
    assert.equal(share.normalize(hash), hash);
  }
  assert.ok(!sharedHash(ridden(4242, 3)).includes("k="), "the default mode leaves k out");
  assert.match(sharedHash(ridden(4242, 3, 2)), /k=h/);
});

test("new links need v=2 and the points must be exactly মিটার + 10 a letter + 5 a pickup + 5 a bell, within what the route allows", () => {
  const ride = ridden(4242, 4);
  const link = (patch: Partial<Ride> & { t?: number } = {}) => sharedHash({ ...ride, ...patch });
  assert.ok(parseShared(link()));
  assert.equal(parseShared(link({ score: ride.score + 1 })), null, "a point too many");
  assert.equal(parseShared(link({ delivered: levelOf(4).houses + 1 })), null, "more letters than gates");
  assert.equal(parseShared(link({ meters: 5 })), null, "stopped before the first puddle");
  assert.equal(parseShared(link({ meters: levelOf(4).meters * 3 })), null, "further than the route goes");
  assert.equal(parseShared(link({ bumps: 6 })), null);
  assert.equal(parseShared(link({ mode: 2, bumps: 2 })), null, "more bumps than কঠিন allows");
  assert.equal(parseShared(link({ level: 13 })), null);
  assert.equal(parseShared(link().replace("v=2", "v=3")), null);
  assert.equal(bellsOf(ride), (ride.score - ride.meters - 10 * ride.delivered - 5 * ride.picked) / 5);
  for (const bad of ["", "#", "s=0&t=1&v=2&l=1&m=70&d=0&c=0&b=0", "s=1&t=-1&v=2&l=1", "s=1&t=1&v=2&l=99&m=70&d=0&c=0&b=0", `s=1&t=1&v=2&l=1&m=70&d=0&c=0&b=0&n=${"x".repeat(700)}`]) assert.equal(parseShared(bad), null, bad);
  const bidi = parseShared(sharedHash({ ...ride, name: "a‮b" }));
  assert.ok(!bidi || !bidi.name.includes("‮"));
});

test("old links (s t m c l n) still parse, keep their words, share as the same link, and open the matching new route", () => {
  const old = parseShared("s=48213&t=250&m=200&c=3&l=7&n=রাফি");
  assert.ok(old && old.kind === "old");
  assert.equal(old!.score, 250);
  assert.equal(sharedHash(old!), "s=48213&t=250&m=200&c=3&l=7&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.equal(levelOfShared(old!), 9, "old route 7 of 10 is new route 9 of 12");
  assert.equal(levelOfShared(parseShared("s=48213&t=250&m=200&c=3&n=A")!), 2, "no l: old route 1");
  assert.equal(levelOfShared(parseShared("s=48213&t=250&m=200&c=3&l=10&n=A")!), 12);
  assert.equal(previewTitle(old!), "রাফি ২৫০ করেছে। তুমি পারবে?");
  assert.equal(parseShared("s=48213&t=250&m=200&c=300&l=7"), null, "more letters than that road had");
  assert.equal(parseShared("s=48213&t=250&m=200&c=3&l=11"), null, "no route 11");
  assert.equal(share.normalize("s=48213&t=250&m=200&c=3&l=7&n=রাফি"), sharedHash(old!));
  assert.match(friendLine(old!), /পুরোনো রাস্তায়/);
});

test("the tally and share ids are unchanged", () => {
  assert.equal(site.slug, "peoner-cycle");
});

test("the words: the card line, the preview title, the caption, the details and the label", () => {
  const ride = { ...ridden(4242, 2), name: "মিম" };
  assert.match(previewTitle(ride), /মিম .*টা চিঠি পৌঁছে .* করেছে। তুমি পারবে\?/);
  assert.match(caption(ride), /হাটখোলা পর্যন্ত/);
  assert.match(rideDetail(ride), /টায় .*টা চিঠি · .* মিটার/);
  assert.equal(levelLabel(2), "লেভেল ২ · পথে পড়া চিঠি");
  const stars = starsOfRide(ride);
  assert.equal(stars, 3);
  assert.match(summaryLine(ride, 3), /কারও হাত খালি থাকেনি/);
  assert.match(summaryLine(ride, 0), /মিটার/);
  assert.match(compareLine(100, 90, "রাফি"), /বেশি/);
  assert.match(compareLine(90, 100, ""), /আর একটু হলেই/);
  assert.match(compareLine(10, 100, "রাফি"), /এগিয়ে/);
  assert.equal(versusLine(ride, null), "");
  for (let kind = 0; kind <= 8; kind++) assert.ok(bumpLine(kind).length > 5);
});

test("the end screen's lines: the exact near miss, the heading and a plain result", () => {
  const out = { level: 3, finished: false, meters: 120, full: 200, delivered: 2, houses: 5, goal: 4, lost: 1, hitKind: 2 };
  assert.equal(nearMiss(out), `আর ${bn(80)} মিটার গেলেই স্কুলপাড়া।`);
  assert.equal(headingFor(out, false), "সাইকেল থামল");
  assert.match(resultLine(out), /ঠক!/);
  const arrived = { ...out, finished: true, meters: 200 };
  assert.match(nearMiss(arrived), /আর ২টা চিঠি হলেই আরেকটা তারা/);
  assert.match(nearMiss({ ...arrived, delivered: 4 }), /আর ১টা চিঠি হলেই তিন তারা/);
  assert.equal(nearMiss({ ...arrived, delivered: 5 }), "");
  assert.equal(headingFor({ ...arrived, delivered: 5 }, false), "সব চিঠি পৌঁছেছে!");
  assert.equal(headingFor({ ...arrived, level: 4, delivered: 7 }, true), "হাটবার পার!");
  assert.match(headingFor(arrived, false), /পৌঁছে গেলে/);
  assert.match(resultLine({ ...arrived, delivered: 4 }), /১টা গেটে এবার হাত খালি রইল/);
});

test("progress: the old 10 routes' stars move into the new ladder once; an old one-road best becomes honest stars; nothing is invented", () => {
  assert.equal(migrateLadder("{}", null, null), null, "already migrated: untouched");
  assert.equal(migrateLadder(null, null, null), null, "nothing to move");
  const moved = JSON.parse(migrateLadder(null, JSON.stringify({ 1: 3, 2: 2, 3: 1 }), null)!);
  assert.deepEqual(moved, { 1: 3, 2: 2, 3: 1 }, "old 3 routes cleared open new 1..⌊1.2·3⌋, each with the stars of the old route in its place");
  assert.deepEqual(JSON.parse(migrateLadder(null, JSON.stringify({ 1: 3, 2: 3, 3: 3, 4: 2, 5: 1 }), null)!), { 1: 3, 2: 3, 3: 3, 4: 2, 5: 1, 6: 1 }, "5 cleared open 6");
  assert.deepEqual(JSON.parse(migrateLadder(null, JSON.stringify({ 10: 1 }), null)!)[12], 1);
  assert.equal(oldBestStars("50"), 0);
  assert.equal(oldBestStars("1000"), 3);
  assert.equal(oldBestStars(null), 0);
  assert.equal(oldBestStars("junk"), 0);
  assert.ok(LADDER_KEY.endsWith("-dak"));
  assert.equal(bestSlug(3), "peoner-cycle-dak-3");
});

test("unlocks: saved first, else the shared rule once (migrated); a clear opens the next only from an open route; stars never drop", () => {
  assert.deepEqual(readUnlock("5", {}), { unlock: 5, migrated: false });
  assert.equal(readUnlock(null, { 1: 3, 4: 1 }).unlock, 5);
  assert.equal(readUnlock(null, {}).migrated, true);
  assert.equal(readUnlock("junk", {}).unlock, 1);
  assert.equal(readUnlock("99", {}).unlock, 12);
  assert.equal(afterClear(1, 1), 2);
  assert.equal(afterClear(5, 12), 5, "a friend's far route opens nothing");
  assert.equal(afterClear(12, 12), 12);
  assert.ok(playable(7, 3, {}, 7), "the friend's own route can be played");
  assert.ok(!playable(7, 3, {}, 0));
  assert.ok(playable(2, 1, { 2: 1 }));
  assert.equal(recommended(4, { 1: 3, 2: 3, 3: 3 }), 4);
  assert.equal(recommended(4, { 1: 3, 2: 1, 3: 3, 4: 3 }), 2);
  assert.equal(recommended(2, { 1: 3, 2: 3 }), 2);
  for (let index = 0; index < MODES.length; index++) assert.equal(readMode(MODES[index].id), index, "the id the title writes is the id it reads");
  assert.equal(readMode("h"), 2);
  assert.equal(readMode("zz"), 1);
  assert.equal(milestoneOf(60), 50);
  assert.equal(nextMilestone(60), 100);
});

test("the story is three short panels, and every route and mode line is plain Bangla in NFC", () => {
  assert.equal(STORY.length, 3);
  for (const line of [...STORY, ...LEVELS.map(row => row.line), ...MODES.map(mode => mode.line)]) { assert.equal(line, line.normalize("NFC")); assert.ok(line.length < 140); assert.ok(!/[A-Za-z]/.test(line), line); }
  assert.ok(makeCourse(1, 1).houses.length === LEVELS[0].houses);
});
