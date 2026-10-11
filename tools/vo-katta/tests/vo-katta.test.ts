import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import {
  createGame, curve, edge, linesCross, segmentsCross, step, steerBy, steerTo, windAt, zone,
  HI, HOME, LO, REACH, ROUND_TIME, SEGMENTS, SKY, type Game, type GameEvent,
} from "../lib/game";
import {
  banner, bands, caption, compareLine, cutLine, humanLine, lookFromGhuri, parseShared, previewTitle, readLook, sharedHash, LOOKS, MAX_CUTS,
} from "../lib/link";

const DT = 1 / 60;
type Mode = "feather" | "hold" | "idle" | "lazy";

/** A scripted player: flies across the rival's string to hook it, then keeps the needle in the green (or just holds টান). */
function play(seed: number, { mode = "feather" as Mode, slow = false, limit = 60 * 240 } = {}) {
  const game = createGame(seed);
  const events: Partial<Record<GameEvent, number>> = {};
  let frames = 0;
  for (; frames < limit && game.phase !== "over"; frames++) {
    const you = game.you, rival = game.rival;
    if (mode !== "idle") {
      if (game.hooked) {
        if (mode === "hold") game.pulling = true;
        else if (you.tension < LO + 0.06) game.pulling = true;
        else if (you.tension > HI - 0.06) game.pulling = false;
        // Rub the strings: swing the kite to and fro around the hook.
        if (mode === "feather") steerTo(game, game.hook.x + (frames % 36 < 18 ? 70 : -70), game.hook.y - 50);
      } else {
        game.pulling = false;
        if (rival.state === "fly" && mode !== "lazy") {
          // Aim past the middle of the rival's string, on the far side from where your kite is now.
          const px = rival.hx + (rival.x - rival.hx) * 0.55, py = rival.hy + (rival.y - rival.hy) * 0.55;
          const lx = rival.x - rival.hx, ly = rival.y - rival.hy, length = Math.hypot(lx, ly);
          const side = Math.sign(lx * (you.y - rival.hy) - ly * (you.x - rival.hx)) || 1;
          steerTo(game, px - (side * -ly / length) * 60, py - (side * lx / length) * 60);
        }
      }
    }
    step(game, DT, slow, event => { events[event] = (events[event] ?? 0) + 1; });
    assert.ok(game.tug > -1.001 && game.tug < 1.001, "tug stays in range");
    assert.ok(you.tension >= 0 && you.tension <= 1);
    if (you.state === "fly") assert.ok(you.x >= SKY.left && you.x <= SKY.right && you.y >= SKY.top && you.y <= SKY.bottom, "your kite stays in the sky");
    if (rival.state === "fly") assert.ok(rival.x >= SKY.left && rival.x <= SKY.right && rival.y >= SKY.top && rival.y <= SKY.bottom, "the rival stays in the sky");
    if (game.hooked) assert.ok(Math.hypot(you.x - game.hook.x, you.y - game.hook.y) <= game.reach + 1, "hooked kites stay near the hook");
  }
  return { game, events, frames };
}

const snapshot = (game: Game) => [game.cuts, game.lost, game.round, game.you.x, game.you.y, game.rival.x, game.rival.y, game.total];

test("the same seed gives the same sky, and the same play gives the same game", () => {
  const one = createGame(48213), two = createGame(48213), other = createGame(48214);
  assert.deepEqual(one.plans, two.plans);
  assert.equal(one.windBase, two.windBase);
  assert.notDeepEqual(one.plans, other.plans);
  for (const t of [0, 7.5, 40]) assert.equal(windAt(one, t, false), windAt(two, t, false));
  const a = play(777), b = play(777);
  assert.deepEqual(snapshot(a.game), snapshot(b.game));
  assert.deepEqual(a.events, b.events);
});

test("rival homes are in the sky on their own side, and nobody starts hooked", () => {
  for (const seed of [1, 2, 3, 48213, 999_999_999]) {
    const game = createGame(seed);
    for (const round of game.plans) for (const p of round) {
      assert.ok(p.hx >= SKY.left && p.hx <= SKY.right && p.hy >= SKY.top && p.hy <= SKY.bottom);
      assert.ok(p.look >= 0 && p.look < LOOKS.length);
    }
    assert.ok(!linesCross(game.youLine, game.rivalLine, game.at), `seed ${seed} starts unhooked`);
    assert.deepEqual([game.you.x, game.you.y], [HOME.x, HOME.y]);
  }
});

test("tension: the green band saws hardest, slack a little, too tight barely", () => {
  assert.equal(edge(0), 0);
  assert.equal(edge(LO), 1);
  assert.equal(edge(HI), 1);
  assert.ok(edge(LO - 0.01) < 0.31);
  assert.equal(edge(1), 0.3);
  assert.deepEqual([zone(0.2), zone(0.6), zone(0.95)], ["slack", "good", "tight"]);
  const game = createGame(5);
  game.pulling = true;
  for (let i = 0; i < 60; i++) step(game, DT, false);
  assert.ok(game.you.tension > 0.95, "a second of টান fills the meter");
  game.pulling = false;
  for (let i = 0; i < 90; i++) step(game, DT, false);
  assert.equal(game.you.tension, 0, "letting go empties it");
});

test("strings: crossing segments are found, parallel and apart ones are not", () => {
  assert.equal(segmentsCross(0, 0, 10, 10, 0, 10, 10, 0), 0.5);
  assert.equal(segmentsCross(0, 0, 10, 0, 0, 5, 10, 5), -1, "parallel");
  assert.equal(segmentsCross(0, 0, 4, 4, 6, 0, 10, -4), -1, "apart");
  assert.equal(segmentsCross(0, 0, 10, 0, 10, 0, 10, 10), 1, "touching at the end");
  const game = createGame(9), at = new Float32Array(2);
  // Fly your kite over to the rival's side: the strings cross somewhere between the roofs.
  game.you.x = 300; game.you.y = 110; game.rival.x = 90; game.rival.y = 140;
  curve(game.you, 0, game.youLine); curve(game.rival, 0, game.rivalLine);
  assert.ok(linesCross(game.youLine, game.rivalLine, at));
  assert.ok(at[1] > SKY.top && at[1] < 440 && at[0] > 0 && at[0] < 360);
  assert.equal(game.youLine.length, (SEGMENTS + 1) * 2);
  assert.deepEqual([game.youLine[0], game.youLine[1]], [game.you.hx, game.you.hy], "the string starts at the hand");
});

test("a প্যাঁচ: hooking, then a green-band tug cuts the rival and a slack one loses your kite", () => {
  const win = createGame(11), seen: GameEvent[] = [];
  steerTo(win, 300, 100);
  for (let i = 0; i < 600 && !win.hooked; i++) step(win, DT, false, event => seen.push(event));
  assert.ok(win.hooked && seen.includes("hook"), "flying across the rival's string hooks it");
  for (let i = 0; i < 600 && win.hooked; i++) {
    win.pulling = win.you.tension < LO + 0.06 ? true : win.you.tension > HI - 0.06 ? false : win.pulling;
    step(win, DT, false, event => seen.push(event));
  }
  assert.ok(seen.includes("cut") && win.cuts === 1 && win.rival.state === "fall");

  const lose = createGame(11), events: GameEvent[] = [];
  steerTo(lose, 300, 100);
  for (let i = 0; i < 600 && !lose.hooked; i++) step(lose, DT, false);
  for (let i = 0; i < 60 * 30 && lose.hooked; i++) step(lose, DT, false, event => events.push(event));
  assert.ok(events.includes("lost") && lose.lost === 1 && lose.cuts === 0, "a kite nobody pulls gets cut");
  for (let i = 0; i < 60 * 3; i++) step(lose, DT, false);
  assert.equal(lose.you.state, "fly", "a new kite rises");
});

test("steering stays in the sky and on the leash", () => {
  const game = createGame(3);
  steerBy(game, -999, -999);
  assert.deepEqual([game.aim.x, game.aim.y], [SKY.left, SKY.top]);
  steerTo(game, 999, 999);
  assert.deepEqual([game.aim.x, game.aim.y], [SKY.right, SKY.bottom]);
  game.hooked = true; game.hook.x = 180; game.hook.y = 200;
  steerTo(game, 20, 60);
  assert.ok(Math.hypot(game.aim.x - 180, game.aim.y - 200) <= REACH + 1e-9);
});

test("three rounds, then over; overtime lets a last প্যাঁচ finish", () => {
  const game = createGame(21), events: GameEvent[] = [];
  for (let i = 0; i < 60 * 120 && game.phase !== "over"; i++) step(game, DT, false, event => events.push(event));
  assert.equal(game.phase, "over");
  assert.equal(events.filter(event => event === "round").length, 2);
  assert.equal(events.filter(event => event === "over").length, 1);
  assert.ok(game.total > ROUND_TIME * 3 && game.total < ROUND_TIME * 3 + 3 * 3 + 2 * 1.8 + 0.1);
  const before = game.total;
  step(game, DT, false);
  assert.equal(game.total, before, "a finished game stays finished");
});

test("headless runs end sanely, skill shows, and slow mode is the same game slower", () => {
  for (const seed of [1, 48213, 999_999_999, 2024, 31337]) {
    const good = play(seed);
    assert.equal(good.game.phase, "over", `seed ${seed} ends`);
    assert.ok(good.game.cuts >= 6 && good.game.cuts <= MAX_CUTS, `a steady player cuts several (seed ${seed}: ${good.game.cuts}, lost ${good.game.lost})`);
    const hold = play(seed, { mode: "hold" });
    assert.ok(hold.game.cuts < good.game.cuts, `holding টান non-stop is worse (seed ${seed}: ${hold.game.cuts} vs ${good.game.cuts})`);
    const idle = play(seed, { mode: "idle" });
    assert.ok(idle.game.phase === "over" && idle.game.cuts === 0, `a player who never touches cuts nothing (seed ${seed})`);
    const calm = play(seed, { slow: true, limit: 60 * 400 });
    assert.ok(calm.game.phase === "over" && calm.game.cuts >= 4, `slow mode still plays (seed ${seed}: ${calm.game.cuts})`);
  }
});

test("score bands, cut lines and kind comparisons", () => {
  assert.equal(humanLine(0), bands[0].line);
  assert.equal(humanLine(1), bands[1].line);
  assert.equal(humanLine(3), bands[2].line);
  assert.equal(humanLine(8), bands[3].line);
  assert.equal(humanLine(9), bands[4].line);
  assert.equal(humanLine(MAX_CUTS), bands[4].line);
  assert.equal(cutLine(5, "রাফি"), "রাফি ৫টা ঘুড়ি কাটল");
  assert.equal(cutLine(5), "৫টা ঘুড়ি কাটলাম");
  assert.equal(compareLine(7, 5, "রাফি"), "রাফির চেয়ে ২টা বেশি!");
  assert.equal(compareLine(5, 5, "রাফি"), "একদম সমান! রাফিও ৫টা কেটেছে।");
  assert.equal(compareLine(4, 6, "রাফি"), "আর একটু হলেই! মাত্র ২টা কম।");
  assert.equal(compareLine(1, 9, ""), "বন্ধু এখনো ৮টা এগিয়ে। আরেকবার?");
  for (let cuts = 0; cuts <= MAX_CUTS; cuts++) assert.doesNotMatch(compareLine(cuts, 6, "রাফি") + humanLine(cuts), /হেরে|খারাপ|ব্যর্থ/);
});

test("challenge links round-trip, and hostile or impossible ones are refused or trimmed", () => {
  const shared = { seed: 48213, cuts: 7, name: "রাফি", look: { pattern: "chokhdar", color: "blue" } } as const;
  const hash = sharedHash(shared);
  assert.equal(hash, "s=48213&t=7&p=chokhdar&c=blue&n=" + encodeURIComponent("রাফি"));
  assert.deepEqual(parseShared("#" + hash), shared);
  assert.equal(share.normalize(hash), hash);
  assert.equal(share.normalize("s=48213&t=7&n=রাফি&x=<script>"), sharedHash({ ...shared, look: null }), "unknown keys are dropped");
  assert.equal(share.normalize("s=48213&t=7&p=<img>&c=blue"), "s=48213&t=7", "a forged kite is dropped, the score kept");
  for (const bad of ["", "result", "#result", "s=0&t=1", "s=1000000000&t=1", "s=-4&t=1", "s=12&t=-1", `s=12&t=${MAX_CUTS + 1}`, "s=12&t=999", "s=1.5&t=1", "s=12&t=2.5", "s=12&t=ten", "s=12&t=1&n=" + "ক".repeat(700)]) {
    assert.equal(share.normalize(bad), null, bad);
  }
  const odd = parseShared("s=12&t=3&n=" + encodeURIComponent("  রিমা‮\u0000 আক্তার আক্তার আক্তার  "));
  assert.equal(odd?.name, "রিমা আক্তার আক্তার আ");
  assert.equal(parseShared("s=12&t=0")?.cuts, 0);
  assert.equal(parseShared(`s=12&t=${MAX_CUTS}`)?.cuts, MAX_CUTS);
});

test("a kite from ঘুড়ি আর ফানুস flies here; lanterns and junk don't", () => {
  assert.deepEqual(lookFromGhuri("#o=kite&p=maladar&c=green&nm=" + encodeURIComponent("মিতু")), { pattern: "maladar", color: "green" });
  assert.equal(lookFromGhuri("#o=fanush&w=bhalo&c=red"), null);
  assert.equal(lookFromGhuri("#o=kite&p=batman&c=green"), null);
  assert.equal(lookFromGhuri("#o=kite&p=maladar&c=" + "x".repeat(500)), null);
  assert.equal(readLook("tekka", "pink")?.pattern, "tekka");
  assert.equal(new Set(LOOKS.map(look => look.color)).size, LOOKS.length, "six kites, six colours");
});

test("previews, banner and caption are personal and honest", () => {
  const shared = { seed: 48213, cuts: 7, name: "রাফি", look: null };
  assert.equal(previewTitle(shared), "রাফি ৭টা ঘুড়ি কেটেছে। তুমি পারবে?");
  assert.equal(previewTitle({ ...shared, name: "" }), "সাকরাইনের ছাদে ৭টা ঘুড়ি কাটা! তুমি পারবে?");
  assert.equal(banner(shared), "রাফি ৭টা ঘুড়ি কেটেছে। একই আকাশ, একই বাতাস, এবার তোমার পালা।");
  assert.match(caption(shared), /৭টা ঘুড়ি/);
  assert.match(caption({ cuts: 0 }), /একটাও/);
  assert.equal(share.preview(sharedHash(shared)).title, "রাফি ৭টা ঘুড়ি কেটেছে। তুমি পারবে?");
  assert.ok(share.preview("junk").title.length > 0);
  assert.equal(share.tally, undefined);
});

test("content meets the SEO limits, says what a link carries, and keeps the safety line", () => {
  assert.ok(site.title.length <= 45, `${site.title.length}`);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `${site.description.length}`);
  assert.ok(site.faq.length >= 5);
  assert.ok(site.steps.length >= 3);
  assert.ok(site.headline && site.headline !== site.title);
  assert.match(site.privacy.join(" "), /স্কোর/);
  assert.match(site.privacy.join(" "), /নাম/);
  const everything = JSON.stringify(site) + share.preview("").description;
  assert.match(everything, /বিদ্যুতের তারের কাছে না/);
  assert.doesNotMatch(everything, /আপনি|করুন|জুয়া|বাজি|টাকা জিত/);
  const glass = site.faq.filter(item => /কাচ/.test(item.question + item.answer));
  assert.equal(glass.length, 1, "glass string comes up once, as a warning");
  assert.match(glass[0].answer, /এই খেলায় কাচ নেই/);
  assert.doesNotMatch(everything.replace(JSON.stringify(glass[0]).slice(1, -1), ""), /কাচ|মাঞ্জা/);
});
