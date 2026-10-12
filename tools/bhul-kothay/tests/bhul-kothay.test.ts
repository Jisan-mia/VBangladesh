import assert from "node:assert/strict";
import test from "node:test";
import { makeRng, pick, readLevels, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import {
  diffCount, hintFor, levelSeed, makePuzzle, parFor, placeOf, shortBy, startLevel, starsFor, tapAt, templateOf, worldOf,
  LEVEL_COUNT, MIN_FOOTPRINT, MIN_REGION, PHONE_SCALE, type Puzzle,
} from "../lib/game";
import { caption, cardLine, clearLine, clockText, compareLine, feat, nearMiss, parseShared, previewTitle, sharedHash, timeText, MAX_SECONDS } from "../lib/link";
import { TEMPLATES } from "../lib/scenes";
import { changedShapes, colorDistance, itemBox, overlaps, pathPoints, SCENE_H, SCENE_W, type Box, type Look } from "../lib/shapes";

const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1);
const inside = (inner: Box, outer: Box, slack = 0.01) =>
  inner.x >= outer.x - slack && inner.y >= outer.y - slack && inner.x + inner.w <= outer.x + outer.w + slack && inner.y + inner.h <= outer.y + outer.h + slack;
const centre = ({ region }: Puzzle["diffs"][number]) => [region.x + region.w / 2, region.y + region.h / 2] as const;

/** Everything a fair puzzle must be, checked from the shapes alone (independent of how the picker chose). */
function checkFair(puzzle: Puzzle, label: string) {
  const { items, looks, diffs, level } = puzzle;
  const base = items.map(item => item.look);
  assert.equal(diffs.length, diffCount(level), `${label}: count`);
  diffs.forEach((diff, index) => {
    const { region } = diff;
    assert.ok(region.w * PHONE_SCALE >= 44 && region.h * PHONE_SCALE >= 44, `${label} #${index}: tap region under 44px at 390 wide`);
    assert.ok(region.w >= MIN_REGION && region.h >= MIN_REGION);
    assert.ok(region.x >= 0 && region.y >= 0 && region.x + region.w <= SCENE_W && region.y + region.h <= SCENE_H, `${label} #${index}: region off the picture`);
    for (const other of diffs.slice(index + 1)) assert.ok(!overlaps(region, other.region), `${label}: regions ${diff.name} and ${other.name} overlap`);
    // This difference alone changes shapes, and every changed shape sits inside its tap region.
    const changed = base.slice();
    changed[diff.item] = diff.look;
    const shapes = changedShapes(items, base, changed);
    assert.ok(shapes.length > 0, `${label} #${index} ${diff.kind} ${diff.name}: changes nothing`);
    for (const shape of shapes) assert.ok(inside(shape.box, region), `${label} #${index} ${diff.name}: a change pokes out of its region`);
    const footprint = shapes.reduce((box, shape) => ({ x: Math.min(box.x, shape.box.x), y: Math.min(box.y, shape.box.y), r: Math.max(box.r, shape.box.x + shape.box.w), b: Math.max(box.b, shape.box.y + shape.box.h) }), { x: Infinity, y: Infinity, r: -Infinity, b: -Infinity });
    const w = footprint.r - footprint.x, h = footprint.b - footprint.y;
    assert.ok(Math.max(w, h) >= MIN_FOOTPRINT.long && w * h >= MIN_FOOTPRINT.area, `${label} #${index} ${diff.name}: too small to see at 320px (${w.toFixed(1)}×${h.toFixed(1)})`);
    const before = base[diff.item], after = diff.look;
    if (diff.kind === "color") assert.ok(colorDistance(before.color!, after.color!) >= 70, `${label} ${diff.name}: colours too close`);
    if (diff.kind === "flip") assert.ok(!items[diff.item].draw(after).some(shape => shape.k === "t"), "text never flips");
    if (diff.kind === "count") assert.ok(after.count! < before.count! && after.count! >= (items[diff.item].can?.count ?? 1));
    if (diff.kind === "size") assert.ok(after.scale! <= 0.8);
  });
  // The two pictures differ in exactly these places and nowhere else.
  for (const shape of changedShapes(items, looks[0], looks[1])) assert.ok(diffs.some(diff => inside(shape.box, diff.region)), `${label}: a stray change outside every region`);
}

test("every path is plain absolute M/L/Q/C/Z, and the box reader refuses anything else", () => {
  assert.deepEqual(pathPoints("M0 0 L10 -5 Q2 3 4 4 C1 1 2 2 3 3 Z"), [[0, 0], [10, -5], [2, 3], [4, 4], [1, 1], [2, 2], [3, 3]]);
  assert.throws(() => pathPoints("M0 0 l10 10"));
  assert.throws(() => pathPoints("M0 0 A5 5 0 0 1 10 10"));
  assert.throws(() => pathPoints("M0 0 L1"));
  for (const template of TEMPLATES) for (const world of [0, 1, 2] as const) {
    const items = template.build(makeRng(99 + world), world);
    for (const item of items) for (const look of [item.look, { ...item.look, flip: !item.look.flip }] as Look[]) {
      for (const shape of item.draw(look)) if (shape.k === "p") pathPoints(shape.d);
      assert.ok(itemBox(item, look), `${template.id}/${item.id} has a box`);
    }
  }
});

test("seven scenes, each with plenty of things that can change and names for them", () => {
  assert.equal(TEMPLATES.length, 7);
  for (const template of TEMPLATES) {
    const items = template.build(makeRng(5), 1);
    const changeable = items.filter(item => item.can);
    assert.ok(changeable.length >= 12, `${template.id} has only ${changeable.length} changeable things`);
    for (const item of changeable) assert.ok(item.name.length >= 2, `${template.id}/${item.id} needs a name`);
    assert.equal(new Set(items.map(item => item.id)).size, items.length, `${template.id}: ids must be unique`);
  }
});

test("the same level gives the same two pictures on every phone; another seed gives others", () => {
  const strip = (puzzle: Puzzle) => JSON.stringify({ looks: puzzle.looks, diffs: puzzle.diffs, items: puzzle.items.map(item => [item.id, item.x, item.y, item.s]) });
  for (const level of [1, 13, 30]) assert.equal(strip(makePuzzle(level, levelSeed(level) + 0)), strip(makePuzzle(level)));
  assert.notEqual(strip(makePuzzle(13, 4242)), strip(makePuzzle(13)));
});

test("all 30 levels are fair: big enough regions, no overlaps, every change inside its region and visible", () => {
  for (const level of levels) checkFair(makePuzzle(level), `level ${level}`);
});

test("the picker never fails, whatever the seed", () => {
  const rng = makeRng(2026);
  for (let run = 0; run < 120; run++) {
    const level = 1 + pick(rng, LEVEL_COUNT), seed = 1 + pick(rng, 900_000_000);
    checkFair(makePuzzle(level, seed), `level ${level} seed ${seed}`);
  }
});

test("levels climb: more differences per world, gentler kinds early, flips and one-fewer later", () => {
  assert.deepEqual([diffCount(1), diffCount(10), diffCount(11), diffCount(21), diffCount(30)], [5, 5, 6, 7, 7]);
  assert.deepEqual([worldOf(1), worldOf(10), worldOf(11), worldOf(30)], [0, 0, 1, 2]);
  for (const level of [1, 2]) for (const diff of makePuzzle(level).diffs) assert.ok(diff.kind === "missing" || diff.kind === "color", `level ${level}: ${diff.kind}`);
  const late = levels.slice(20).flatMap(level => makePuzzle(level).diffs.map(diff => diff.kind));
  assert.ok(late.includes("flip") && late.includes("count") && late.includes("size"));
  assert.ok(new Set(levels.map(level => templateOf(level).id)).size === 7);
  assert.notEqual(templateOf(1).id, templateOf(2).id);
  assert.equal(placeOf(4), "সকালের চায়ের দোকান");
  assert.equal(placeOf(25), "বিকেলের চায়ের দোকান");
});

test("taps: a difference on either picture counts once; elsewhere is a miss", () => {
  const puzzle = makePuzzle(7), [first] = puzzle.diffs, [x, y] = centre(first);
  assert.deepEqual(tapAt(puzzle, [], x, y), { kind: "found", index: 0 });
  assert.deepEqual(tapAt(puzzle, [0], x, y), { kind: "again", index: 0 });
  assert.deepEqual(tapAt(puzzle, [], first.region.x - 1, first.region.y), { kind: "found", index: 0 }, "a little slack at the edge");
  assert.deepEqual(tapAt(puzzle, [], -5, 10), { kind: "miss" });
  assert.deepEqual(tapAt(puzzle, [], Number.NaN, 10), { kind: "miss" });
  // Some point in the picture far from every region is a miss.
  let missAt: [number, number] | null = null;
  for (let py = 2; py < SCENE_H && !missAt; py += 6) for (let px = 2; px < SCENE_W && !missAt; px += 6) if (tapAt(puzzle, [], px, py).kind === "miss") missAt = [px, py];
  assert.ok(missAt);
  assert.equal(hintFor(puzzle, []), 0);
  assert.equal(hintFor(puzzle, [0, 1]), 2);
  assert.equal(hintFor(puzzle, puzzle.diffs.map((_, index) => index)), -1);
});

test("stars come from time and wrong taps; a hint caps them at 2", () => {
  assert.equal(parFor(1), 30);
  assert.ok(parFor(30) > parFor(1) && parFor(30) <= 90);
  const par = parFor(5);
  assert.equal(starsFor(5, par, 2, false), 3);
  assert.equal(starsFor(5, par + 1, 0, false), 2);
  assert.equal(starsFor(5, par, 3, false), 2);
  assert.equal(starsFor(5, par * 2, 5, false), 2);
  assert.equal(starsFor(5, par * 2 + 1, 0, false), 1);
  assert.equal(starsFor(5, 10, 6, false), 1);
  assert.equal(starsFor(5, 10, 0, true), 2);
  assert.deepEqual(shortBy(5, par + 4, 1, false), { stars: 3, seconds: 4, wrong: 0, hint: false });
  assert.deepEqual(shortBy(5, par, 4, false), { stars: 3, seconds: 0, wrong: 2, hint: false });
  assert.deepEqual(shortBy(5, par * 2 + 3, 7, false), { stars: 2, seconds: 3, wrong: 2, hint: false });
  assert.equal(shortBy(5, 5, 0, false), null);
  assert.equal(shortBy(5, 5, 0, true)!.hint, true);
  assert.equal(nearMiss(5, par + 4, 1, false), "আর ৪ সেকেন্ড আগে পারলে ৩ তারা।");
  assert.equal(nearMiss(5, par, 3, false), "ভুল চাপ আর ১টা কম হলে ৩ তারা।");
  assert.equal(nearMiss(5, 5, 0, true), "হিন্ট ছাড়া পারলে ৩ তারা।");
  assert.equal(nearMiss(5, 5, 0, false), "");
  assert.equal(nearMiss(5, par + 10, 4, false), "আর ১০ সেকেন্ড আগে, ২টা কম ভুল চাপে পারলে ৩ তারা।");
  assert.equal(nearMiss(5, par * 2 + 35, 4, false), "আর ৩৫ সেকেন্ড আগে পারলে ২ তারা।");
});

test("a scripted player clears every level with sane times and stars", () => {
  const rng = makeRng(77);
  for (const level of levels) {
    const puzzle = makePuzzle(level), found: number[] = [];
    let wrong = 0, seconds = 0, taps = 0;
    while (found.length < puzzle.diffs.length && taps++ < 400) {
      seconds += 2 + pick(rng, 6);
      const aim = rng() < 0.75 ? puzzle.diffs[pick(rng, puzzle.diffs.length)] : null;
      const [x, y] = aim ? centre(aim) : [rng() * SCENE_W, rng() * SCENE_H];
      const landed = tapAt(puzzle, found, x, y);
      if (landed.kind === "found") found.push(landed.index);
      else if (landed.kind === "miss") wrong++;
    }
    assert.equal(found.length, puzzle.diffs.length, `level ${level} never finished`);
    assert.equal(new Set(found).size, found.length);
    const stars = starsFor(level, seconds, wrong, false);
    assert.ok(stars >= 1 && stars <= 3 && seconds > 0 && seconds < 2000);
  }
});

test("progress on this phone goes through the shared level store", () => {
  let saved = readLevels(null, LEVEL_COUNT);
  assert.deepEqual(saved, {});
  saved = recordLevel(saved, 1, 3);
  saved = recordLevel(saved, 2, 2);
  saved = recordLevel(saved, 2, 1);
  assert.deepEqual(saved, { 1: 3, 2: 2 });
  assert.deepEqual(readLevels(JSON.stringify({ ...saved, 31: 3, 0: 2, 3: 9 }), LEVEL_COUNT), saved);
  assert.equal(unlockedLevel(saved, LEVEL_COUNT), 3);
  assert.equal(startLevel(saved, 3), 3);
  assert.equal(startLevel({ 1: 3, 2: 3, 3: 3 }, 4), 4);
  assert.equal(startLevel({ 1: 3, 2: 1 }, 3), 3);
  assert.equal(startLevel({}, 1), 1);
  assert.deepEqual(readLevels("{broken", LEVEL_COUNT), {});
});

test("lines are kind, concrete and exact", () => {
  assert.equal(timeText(45), "৪৫ সেকেন্ড");
  assert.equal(timeText(130), "২ মিনিট ১০ সেকেন্ড");
  assert.equal(timeText(180), "৩ মিনিট");
  assert.equal(clockText(65), "১:০৫");
  assert.equal(clockText(9), "০:০৯");
  for (const level of levels) assert.ok(clearLine(level).length > 12 && !/অসাধারণ|দারুণ|সেরা|!!/.test(clearLine(level)));
  assert.match(clearLine(30), /৩০টা লেভেলের/);
  assert.equal(cardLine({ seconds: 70, wrong: 0 }), "১ মিনিট ১০ সেকেন্ডে, একবারও ভুল জায়গায় চাপিনি।");
  assert.equal(cardLine({ seconds: 42, wrong: 2 }), "৪২ সেকেন্ডে, ভুল চাপ ২টা।");
  assert.equal(compareLine(40, 60, "রাফি"), "রাফির চেয়ে ২০ সেকেন্ড আগে!");
  assert.equal(compareLine(60, 60, "রাফি"), "একদম সমান! রাফিও ১ মিনিট নিয়েছিল।");
  assert.equal(compareLine(66, 60, "রাফি"), "আর একটু হলেই! মাত্র ৬ সেকেন্ড পিছিয়ে।");
  assert.match(compareLine(200, 60, ""), /বন্ধু এখনো ২ মিনিট ২০ সেকেন্ড এগিয়ে/);
  assert.match(caption({ level: 3, seconds: 20, wrong: 0, hinted: false }), /৫টা অমিল ২০ সেকেন্ডে.*একবারও ভুল না চেপে/);
  assert.match(caption({ level: 3, seconds: 200, wrong: 0, hinted: false }), /দেখি তুমি কত সময়ে পারো/);
});

test("a challenge link round-trips", () => {
  const hash = sharedHash({ level: 17, seconds: 130, wrong: 1, hinted: false, name: "রাফি" });
  const parsed = parseShared(`#${hash}`);
  assert.deepEqual(parsed, { level: 17, seconds: 130, wrong: 1, hinted: false, name: "রাফি" });
  assert.equal(previewTitle(parsed!), "রাফি লেভেল ১৭-এর ৬টা অমিল ২ মিনিট ১০ সেকেন্ডে খুঁজে পেয়েছে। তুমি পারবে?");
  assert.equal(feat({ level: 1, seconds: 9, name: "" }), "এক বন্ধু লেভেল ১-এর ৫টা অমিল ৯ সেকেন্ডে খুঁজে পেয়েছে");
  assert.equal(parseShared(sharedHash({ level: 1, seconds: 20, wrong: 0, hinted: true, name: "" }))!.hinted, true);
  assert.equal(parseShared(sharedHash({ level: 1, seconds: 99999, wrong: 500, hinted: false, name: "" }))!.seconds, MAX_SECONDS);
  assert.equal(parseShared(sharedHash({ level: 1, seconds: 30, wrong: 500, hinted: false, name: "" }))!.wrong, 99);
  assert.equal(share.normalize(hash), hash);
  assert.match(share.preview(hash).title, /রাফি/);
});

test("forged, broken or hostile links are refused", () => {
  const good = new URLSearchParams(sharedHash({ level: 1, seconds: 30, wrong: 0, hinted: false, name: "মিম" }));
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ t: "0" }), variant({ t: String(MAX_SECONDS + 1) }), variant({ t: "1.5" }), variant({ w: "" }), variant({ w: null }), variant({ w: "-1" }), variant({ w: "01" }), variant({ w: "100" }),
    variant({ l: "31" }), variant({ l: "0" }), variant({ l: "01" }), variant({ l: "2" }), variant({ s: String(levelSeed(2)) }), variant({ s: "-1" }),
    variant({ h: "2" }), variant({ h: "" }), "", "#", "garbage", "s=1&t=1", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
  ]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null);
  }
  const hostileName = parseShared(variant({ n: "‮রাফি\u0000" + "ক".repeat(40) }))!;
  assert.ok(hostileName.name.length <= 20 && !hostileName.name.includes("‮"));
  assert.ok(share.preview("junk").title.length > 0);
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^অমিল খোঁজার গেম/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  assert.ok(site.faq.some(item => /কোনটা নেই\?|ছবি ফোটাও/.test(item.answer)));
  for (const word of ["নাম", "সময়", "ভুল চাপ", "লেভেল", "হিন্ট"]) assert.match(site.privacy.join(" "), new RegExp(word));
  const all = JSON.stringify(site);
  assert.doesNotMatch(all, /আপনি|করুন|দেখুন|অসাধারণ|দারুণ/);
});
