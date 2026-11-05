import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { challengeHash, readLevels, recordLevel, unlockedLevel } from "../../../shared/game-core";
import { site } from "../content";
import { share } from "../share";
import {
  caption, cardLine, clearLine, clockText, compareLine, countOf, feat, hintLine, nearMiss, parseShared, previewTitle, sharedHash, sharedStars, timeText, KIND_WORDS, MAX_SECONDS,
} from "../lib/challenge";
import { ladderDeal, legacyDeal } from "../lib/deal";
import { LEGACY_COUNT, legacyPuzzle, legacySeed } from "../lib/legacy";
import { HINT_SECONDS, STAGE_COUNT, stageAt } from "../lib/levels";
import { hintCircle, makePuzzle } from "../lib/puzzle";
import { canHint, hintRound, isDone, newRound, shortBy, slowest, starsOf, tapRound, timeOf } from "../lib/round";
import { openAfter, playable, readOpen, recommended } from "../lib/save";
import * as session from "../lib/session";
import { SCENE_H, SCENE_W } from "../lib/shapes";

const centre = (puzzle: ReturnType<typeof makePuzzle>, index: number) => {
  const { region } = puzzle.diffs[index];
  return [region.x + region.w / 2, region.y + region.h / 2] as const;
};

// ---- compatibility ----

test("the old game's 30 levels replay bit for bit (old links keep their exact two pictures)", () => {
  const hashes: string[] = [], art: string[] = [];
  for (let level = 1; level <= LEGACY_COUNT; level++) {
    const p = legacyPuzzle(level);
    hashes.push(createHash("sha256").update(JSON.stringify({ seed: p.seed, looks: p.looks, diffs: p.diffs, items: p.items.map(i => [i.id, i.x, i.y, i.s]) })).digest("hex").slice(0, 12));
    art.push(createHash("sha256").update(JSON.stringify([0, 1].map(side => p.items.map((item, i) => p.looks[side][i].hidden ? null : item.draw(p.looks[side][i]))))).digest("hex").slice(0, 8));
  }
  assert.equal(createHash("sha256").update(hashes.join("")).digest("hex").slice(0, 16), "aabce5007dcc2c54", "which differences each old level had");
  assert.equal(createHash("sha256").update(art.join("")).digest("hex").slice(0, 16), "5440d23a1bb1cbaf", "how every old picture is drawn");
});

test("an old link still opens: the same level and pictures, the old star times, and it shares back in the old format", () => {
  const old = challengeHash({ seed: legacySeed(17), target: 130, name: "রাফি", extra: { l: 17, w: 1 } });
  const parsed = parseShared(`#${old}`)!;
  assert.deepEqual(parsed, { level: 17, seed: legacySeed(17), seconds: 130, wrong: 1, hints: 0, name: "রাফি", legacy: true });
  assert.equal(sharedHash(parsed), old);
  assert.equal(parseShared(challengeHash({ seed: legacySeed(3), target: 40, extra: { l: 3, w: 0, h: 1 } }))!.hints, 1);
  const deal = legacyDeal(17);
  assert.equal(deal.puzzle.diffs.length, 6);
  assert.deepEqual(deal.puzzle.looks, legacyPuzzle(17).looks);
  assert.equal(countOf(parsed), 6);
  assert.equal(previewTitle(parsed), "রাফি লেভেল ১৭-এর ৬টা অমিল ২ মিনিট ১০ সেকেন্ডে খুঁজে পেয়েছে। তুমি পারবে?");
  // Old rules for old pictures: a hint caps at ★★.
  assert.equal(sharedStars({ ...parsed, seconds: 20, wrong: 0, hints: 1 }), 2);
});

test("new links carry the seed and v=2, round-trip, and hostile ones are refused", () => {
  const mine = { level: 12, seed: 424_242, seconds: 75, wrong: 2, hints: 1, name: "মিম", legacy: false };
  const hash = sharedHash(mine);
  assert.match(hash, /v=2/);
  assert.deepEqual(parseShared(`#${hash}`), mine);
  assert.equal(share.normalize(hash), hash);
  assert.match(share.preview(hash).title, /মিম লেভেল ১২-এর ৫টা অমিল/);
  assert.equal(parseShared(sharedHash({ ...mine, seconds: 99_999 }))!.seconds, MAX_SECONDS);
  const good = new URLSearchParams(hash);
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ v: "3" }), variant({ l: "31" }), variant({ l: "0" }), variant({ l: "01" }), variant({ h: "-1" }), variant({ h: "99" }), variant({ h: "01" }),
    variant({ t: "5", h: "1" }), variant({ w: "" }), variant({ w: null }), variant({ w: "100" }), variant({ s: "0" }), variant({ t: "0" }),
    // An old link must name its level's own seed.
    variant({ v: null, h: null }), challengeHash({ seed: legacySeed(2), target: 30, extra: { l: 3, w: 0 } }), challengeHash({ seed: legacySeed(2), target: 30, extra: { l: 2, w: 0, h: 2 } }),
    "", "#", "garbage", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
  ]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null);
  }
  const hostile = parseShared(variant({ n: "‮রাফি\u0000" + "ক".repeat(40) }))!;
  assert.ok(hostile.name.length <= 20 && !hostile.name.includes("‮"));
  assert.ok(share.preview("junk").title.length > 0);
  // A friend's link replays the same pictures.
  assert.deepEqual(ladderDeal(12, 424_242).puzzle.looks, makePuzzle(12, 424_242).looks);
});

test("saved progress: the old 30 levels open the same levels once; after that only your own clears open more", () => {
  const old = JSON.stringify({ 1: 3, 2: 2, 3: 1, 4: 3, 5: 2, 6: 1, 7: 2, 8: 1, 9: 3, 10: 1, 11: 2, 12: 1 });
  assert.deepEqual(readOpen(null, {}, old), { open: 13, migrated: true });
  assert.deepEqual(readOpen(null, {}, null), { open: 1, migrated: true });
  assert.deepEqual(readOpen(null, { 1: 2, 2: 3 }, null), { open: 3, migrated: true });
  assert.deepEqual(readOpen("13", { 1: 3 }, old), { open: 13, migrated: false });
  assert.deepEqual(readOpen("garbage", {}, "{broken"), { open: 1, migrated: true });
  assert.equal(openAfter(3, 3), 4);
  assert.equal(openAfter(3, 1), 3);
  assert.equal(openAfter(30, 30), 30);
  // A friend's far-ahead level records its stars but opens nothing between.
  let stars = recordLevel({}, 1, 3);
  stars = recordLevel(stars, 20, 2);
  assert.equal(unlockedLevel(stars, STAGE_COUNT), 21, "the shared rule would open 2–20");
  assert.equal(openAfter(2, 20), 2, "your own unlock does not");
  assert.ok(playable(20, 2, 20) && !playable(20, 2, 0) && !playable(31, 30, 0));
  assert.equal(recommended(4, { 1: 3, 2: 1, 3: 3 }), 4);
  assert.equal(recommended(3, { 1: 3, 2: 1, 3: 3 }), 2);
  assert.equal(recommended(2, { 1: 3, 2: 3 }), 2);
  assert.deepEqual(readLevels(JSON.stringify({ 31: 3, 0: 2, 3: 9 }), STAGE_COUNT), {});
});

// ---- the statechart's bugs, replayed against the pure code ----

test("bug 1 · PausedWhenBlurred: clicking into another window stops the clock, and only চালিয়ে যাও starts it", () => {
  let s = session.begin(session.ready(), 1000);
  assert.equal(session.elapsed(s, 3000), 2);
  s = session.pause(s, 3000, "away");               // window blur (and the player's onPause)
  assert.equal(s.phase, "paused");
  assert.equal(session.elapsed(s, 9000), 2, "six seconds away cost nothing");
  assert.ok(!session.canMove(s), "no tap counts under the cover");
  assert.equal(session.resume(s, 9000, "sheet"), s, "closing a sheet doesn't end an away pause");
  s = session.resume(s, 9000, "away");
  assert.equal(session.elapsed(s, 10_000), 3);
});

test("bug 2 · LevelPickerFreezesPlay: opening সব লেভেল stops the clock; a pick opens the start card, not a running clock", () => {
  let s = session.begin(session.ready(), 0);
  s = session.pause(s, 14_000, "sheet");             // the badge or সব লেভেল opens the sheet
  assert.equal(session.elapsed(s, 30_000), 14);
  assert.equal(session.resume(s, 30_000, "away").phase, "paused", "coming back from another window doesn't close the sheet");
  assert.ok(session.started(s), "a started level asks before it is thrown away");
  const picked = session.ready();                     // ২ ছেড়ে যাও → load(): the start card
  assert.equal(picked.phase, "ready");
  assert.equal(session.elapsed(picked, 99_000), 0);
  // ১ এখানেই থাকো: the same level carries on from 14 s.
  assert.equal(session.elapsed(session.resume(s, 30_000, "sheet"), 31_000), 15);
});

test("result keys need a fresh press after the end screen shows", () => {
  let s = session.begin(session.ready(), 0);
  s = session.finish(s, 10_000);
  assert.equal(s.phase, "over");
  assert.ok(!session.resultKeyOk(s, 10_100, { at: 10_100, repeat: false }), "too soon");
  assert.ok(!session.resultKeyOk(s, 11_000, { at: 9_000, repeat: false }), "pressed before the screen");
  assert.ok(!session.resultKeyOk(s, 11_000, { at: 11_000, repeat: true }), "held through");
  assert.ok(session.resultKeyOk(s, 11_000, { at: 11_000, repeat: false }));
  assert.equal(session.finish(s, 20_000), s, "a level ends once");
});

// ---- one play of a level ----

test("a round: finds, wrong taps, taps again, hints that add time, stars and the near miss", () => {
  const puzzle = makePuzzle(4, 77);
  let round = newRound(false);
  const miss = (() => { for (let y = 2; y < SCENE_H; y += 4) for (let x = 2; x < SCENE_W; x += 4) if (tapRound(round, puzzle, x, y, 0).outcome.kind === "miss") return [x, y]; return [0, 0]; })();
  round = tapRound(round, puzzle, miss[0], miss[1], 1).round;
  assert.equal(round.wrong, 1);
  const [x, y] = centre(puzzle, 0);
  round = tapRound(round, puzzle, x, y, 3).round;
  round = tapRound(round, puzzle, x, y, 4).round;
  assert.deepEqual([round.found, round.wrong, round.streak], [[0], 1, 1], "a second tap on a found one costs nothing");
  const first = hintRound(round, puzzle)!;
  assert.equal(first.step, 1);
  const second = hintRound(first.round, puzzle)!;
  assert.deepEqual([second.step, second.index], [2, first.index]);
  assert.equal(hintRound(second.round, puzzle), null, "a shown one can't be hinted again");
  assert.ok(!canHint(second.round, puzzle));
  round = second.round;
  assert.equal(timeOf(round, 20), 20 + 2 * HINT_SECONDS);
  for (let index = 1; index < puzzle.diffs.length; index++) { const [cx, cy] = centre(puzzle, index); round = tapRound(round, puzzle, cx, cy, 4 + index * 5).round; }
  assert.ok(isDone(round, puzzle));
  assert.equal(round.bestStreak, puzzle.diffs.length - 1, "the hint broke the run of finds");
  const gaps = round.foundAt.map((at, index) => at - (index ? round.foundAt[index - 1] : 0));
  assert.deepEqual(slowest(round), { index: round.found[gaps.indexOf(Math.max(...gaps))], seconds: Math.max(...gaps) });
  const stage = stageAt(4);
  assert.equal(starsOf(stage, stage.three, 2), 3);
  assert.equal(starsOf(stage, stage.three + 1, 0), 2);
  assert.equal(starsOf(stage, stage.three, 3), 2);
  assert.equal(starsOf(stage, stage.two + 1, 0), 1);
  assert.equal(starsOf(stage, 5, 6), 1);
  assert.deepEqual(shortBy(stage, stage.three + 4, 1), { stars: 3, seconds: 4, wrong: 0 });
  assert.equal(nearMiss(4, stage.three + 4, 1), "আর ৪ সেকেন্ড আগে পারলে ৩ তারা।");
  assert.equal(nearMiss(4, stage.three, 3), "ভুল চাপ আর ১টা কম হলে ৩ তারা।");
  assert.equal(nearMiss(4, 5, 0), "");
});

test("in the dark, a tap outside the light only carries the lamp, and a hint brings the lamp to its circle, then its spot", () => {
  const puzzle = makePuzzle(26, 5);
  let round = newRound(true);
  assert.deepEqual(round.lamp, { x: SCENE_W / 2, y: SCENE_H / 2 });
  const [x, y] = centre(puzzle, 0), far = Math.hypot(x - SCENE_W / 2, y - SCENE_H / 2) > 70;
  const step = tapRound(round, puzzle, x, y, 1);
  if (far) { assert.equal(step.outcome.kind, "lamp"); assert.equal(step.round.wrong, 0); assert.deepEqual(step.round.lamp, { x, y }); }
  round = tapRound(step.round, puzzle, x, y, 2).round;
  assert.deepEqual(round.found, [0]);
  const hinted = hintRound(round, puzzle)!, circle = hintCircle(puzzle, hinted.index);
  assert.deepEqual(hinted.round.lamp, { x: circle.x, y: circle.y }, "the first hint's lamp lights its circle, not the exact spot");
  const exact = hintRound(hinted.round, puzzle)!, { region } = puzzle.diffs[exact.index];
  assert.deepEqual(exact.round.lamp, { x: region.x + region.w / 2, y: region.y + region.h / 2 });
});

// ---- words ----

test("lines are kind, concrete and exact", () => {
  assert.equal(timeText(45), "৪৫ সেকেন্ড");
  assert.equal(timeText(130), "২ মিনিট ১০ সেকেন্ড");
  assert.equal(clockText(65), "১:০৫");
  assert.equal(clockText(9.7), "০:০৯");
  for (let level = 1; level <= STAGE_COUNT; level++) assert.ok(clearLine(level).length > 12 && !/অসাধারণ|দারুণ|সেরা|!!/.test(clearLine(level)));
  assert.match(clearLine(26), /^কারেন্ট এসেছে/);
  assert.equal(cardLine({ seconds: 70, wrong: 0 }), "১ মিনিট ১০ সেকেন্ডে, একবারও ভুল জায়গায় চাপিনি।");
  assert.equal(compareLine(40, 60, "রাফি"), "রাফির চেয়ে ২০ সেকেন্ড আগে।");
  assert.equal(compareLine(60, 60, "রাফি"), "একদম সমান। রাফিও ১ মিনিট নিয়েছিল।");
  assert.equal(compareLine(66, 60, "রাফি"), "মাত্র ৬ সেকেন্ড পিছিয়ে। আরেকবার?");
  assert.equal(feat({ level: 1, seconds: 9, name: "", legacy: false }), "এক বন্ধু লেভেল ১-এর ৩টা অমিল ৯ সেকেন্ডে খুঁজে পেয়েছে");
  assert.match(caption({ level: 1, seconds: 8, wrong: 0, hints: 0, legacy: false }), /৩টা অমিল ৮ সেকেন্ডে.*একবারও ভুল না চেপে/);
  for (const kind of Object.keys(KIND_WORDS) as (keyof typeof KIND_WORDS)[]) assert.match(hintLine(kind, 1, "ঘুড়ি"), /\+১০ সেকেন্ড/);
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^অমিল খোঁজার গেম/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?"));
  for (const word of ["নাম", "সময়", "ভুল চাপ", "লেভেল", "হিন্ট"]) assert.match(site.privacy.join(" "), new RegExp(word));
  const all = JSON.stringify(site);
  assert.doesNotMatch(all, /আপনি|করুন|দেখুন|অসাধারণ|দারুণ/);
  assert.equal(all, all.normalize("NFC"));
  for (let level = 1; level <= STAGE_COUNT; level++) assert.equal(stageAt(level).lesson, stageAt(level).lesson.normalize("NFC"));
});
