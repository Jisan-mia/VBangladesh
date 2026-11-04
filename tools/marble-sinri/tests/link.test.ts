// Challenge links (old and new), the old staircase kept bit for bit, the words, the page content and the sounds.
import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { createEndless, extend, stepsOf } from "../lib/game";
import { makeStairs, type OldLedge } from "../lib/legacy";
import { caption, compareLine, friendBanner, friendNote, MAX_SCORE, nearMiss, oldNearMiss, parseShared, previewTitle, seconds, sharedHash, type FloorCard, type OldCard } from "../lib/link";
import { STEP } from "../lib/physics";
import { stepGame } from "../lib/step.hot";

/** A fingerprint of the first 120 old rows: it pins the old generator, which must never change (old links replay it). */
function fingerprint(seed: number, stage: number) {
  const stairs = makeStairs(seed, stage), rows: OldLedge[] = [stairs.first];
  while (rows.length < 120) rows.push(stairs.next(rows[rows.length - 1]));
  let hash = 2166136261;
  for (const row of rows) for (const value of [row.row, row.x0, row.x1, row.y, row.pot, row.pick, row.kind.length]) hash = Math.imul(hash ^ Math.round(value * 1000), 16777619) >>> 0;
  return hash;
}

test("the old staircase is the one the old game made (fingerprints taken from the code before the rewrite)", () => {
  assert.deepEqual([fingerprint(1, 1), fingerprint(123456, 2), fingerprint(999, 5), fingerprint(42, 8)], [3440038614, 3226505899, 2494848631, 2717041418]);
  // An old link plays those rows, extended as the camera goes down, with the old instant roll.
  const endless = createEndless(123456, 2, 3), game = endless.game;
  assert.equal(game.rows[0].row, 20, "old stage 2 starts at old row 20");
  assert.ok(game.feel.instant);
  for (let i = 0; i < 60 * 40 && !game.over; i++) { stepGame(game, STEP, i % 120 < 60 ? -1 : 1); extend(endless); }
  assert.ok(game.over === 2 && stepsOf(game) >= 0 && game.rows.length > 10, "the endless stairs end only when the chances do");
});

test("an old link still opens exactly as before the rewrite", () => {
  const old: OldCard = { v: 1, seed: 123456, stage: 2, score: 86, marbles: 21, colour: 3, name: "রাফি" };
  const hash = sharedHash(old);
  assert.equal(hash, `s=123456&t=86&l=2&m=21&c=3&n=${encodeURIComponent("রাফি")}`, "the old link's exact text");
  assert.deepEqual(parseShared(`#${hash}`), old);
  assert.equal(previewTitle(old), "রাফি মার্বেল গড়িয়ে ৮৬ ধাপ নেমেছে। তুমি পারবে?");
  assert.match(friendBanner(old), /রাফি ৮৬ ধাপ নেমেছে/);
  assert.match(friendNote(old), /রাফির নিজের ফোনের স্কোর/);
  assert.match(caption(old), /৮৬ ধাপ/);
  assert.equal(compareLine({ ...old, score: 96 }, old), "রাফির চেয়ে ১০ ধাপ বেশি।");
  assert.equal(oldNearMiss(36, 1, null), "আর ৪ ধাপ নামলে চিলেকোঠা পার।");
  assert.equal(oldNearMiss(12, 1, 15), "আর ৪ ধাপ নামলে নতুন রেকর্ড।");
  const good = new URLSearchParams(hash);
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ t: "-1" }), variant({ t: "1.5" }), variant({ t: String(MAX_SCORE + 1) }), variant({ m: "87" }), variant({ m: "-1" }), variant({ m: "02" }), variant({ m: "x" }),
    variant({ l: "0" }), variant({ l: "9" }), variant({ l: "02" }), variant({ l: null }), variant({ c: "9" }), variant({ c: "-1" }), variant({ c: "1.0" }),
    variant({ s: "0" }), variant({ s: "1000000000" }), variant({ s: null }), variant({ v: "3" }),
    "", "#", "garbage", `#${"a".repeat(700)}`, "<script>alert(1)</script>",
  ]) {
    assert.equal(parseShared(bad), null, bad);
    assert.equal(share.normalize(bad), null);
  }
});

test("a new floor link round-trips and refuses hostile or impossible input", () => {
  const card: FloorCard = { v: 2, seed: 777, level: 5, tenths: 184, marbles: 3, falls: 1, colour: 2, name: "মিতু" };
  const hash = sharedHash(card);
  assert.equal(hash, `s=777&t=184&v=2&w=5&m=3&h=1&c=2&n=${encodeURIComponent("মিতু")}`);
  assert.deepEqual(parseShared(hash), card);
  assert.equal(share.normalize(hash), hash);
  assert.equal(previewTitle(card), "মিতু মার্বেল গড়িয়ে মোছা সিঁড়ি পার করেছে ১৮.৪ সেকেন্ডে। তুমি পারবে?");
  assert.match(caption(card), /মোছা সিঁড়ি পার করলাম ১৮\.৪ সেকেন্ডে, ২ তারায়/);
  assert.match(caption({ ...card, level: 12 }), /পুরো বাড়ি/);
  assert.equal(seconds(7), "০.৭");
  assert.equal(compareLine({ ...card, tenths: 160 }, card), "মিতুর চেয়ে ২.৪ সেকেন্ড আগে নেমেছ।");
  assert.match(compareLine({ ...card, falls: 0 }, card), /বেশি তারা/);
  assert.match(compareLine({ ...card, tenths: 200 }, card), /আরেকবার গড়াও/);
  const good = new URLSearchParams(hash);
  const variant = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(good);
    for (const [key, value] of Object.entries(changes)) value === null ? params.delete(key) : params.set(key, value);
    return params.toString();
  };
  for (const bad of [
    variant({ w: "0" }), variant({ w: "13" }), variant({ w: "05" }), variant({ w: null }), variant({ h: "10" }), variant({ h: "-1" }), variant({ h: null }),
    variant({ t: "0" }), variant({ t: "36001" }), variant({ m: "15" }), variant({ c: "9" }), variant({ v: "2.0" }),
  ]) assert.equal(parseShared(bad), null, bad);
  const hostile = parseShared(variant({ n: "‮মিতু\u0000" + "ক".repeat(40) }))!;
  assert.ok(hostile.name.length <= 20 && !hostile.name.includes("‮") && !hostile.name.includes("\u0000"));
  assert.ok(share.preview("junk").title.length > 0);
  assert.equal(share.tally, undefined);
});

test("near misses say the exact thing within reach", () => {
  assert.equal(nearMiss({ won: true, falls: 1, left: 0, tenths: 100, best: null, level: 3 }), "একবারও না পড়লে ★★★।");
  assert.equal(nearMiss({ won: true, falls: 3, left: 0, tenths: 100, best: null, level: 3 }), "৩ বার পড়েছ। একবার কম পড়লেই ★★।");
  assert.equal(nearMiss({ won: true, falls: 0, left: 0, tenths: 130, best: 112, level: 3 }), "নিজের সেরা ১১.২ সেকেন্ড। আর ১.৮ সেকেন্ড আগে নামলেই।");
  assert.equal(nearMiss({ won: false, falls: 3, left: 4, tenths: 100, best: null, level: 3 }), "আর ৪ ধাপ নামলেই এই তলা পার।");
  assert.equal(nearMiss({ won: false, falls: 3, left: 2, tenths: 100, best: null, level: 8 }), "আর ২ ধাপ নামলেই লোডশেডিং পার।");
  assert.equal(nearMiss({ won: true, falls: 0, left: 0, tenths: 100, best: 100, level: 3 }), "");
});

test("content meets the SEO limits and speaks তুমি", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.match(site.title, /^মার্বেল/);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title);
  assert.ok(site.faq.length >= 6);
  assert.ok(site.faq.some(item => item.question === "কয়টা লেভেল আছে?" && /১২টা তলা/.test(item.answer)));
  assert.ok(site.faq.some(item => /লাটিম|ক্যারম/.test(item.answer)));
  for (const word of ["নাম", "সিড", "ধাপ", "মার্বেল"]) assert.match(site.privacy.join(" "), new RegExp(word));
  assert.doesNotMatch(JSON.stringify(site), /আপনি|করুন|দেখুন|বাজি|জিতে নাও|nokia|নোকিয়া|rapid|র‍্যাপিড/i);
  assert.equal(JSON.stringify(site), JSON.stringify(site).normalize("NFC"));
});

test("sounds never throw without audio (no window, no AudioContext)", async () => {
  const { sound, rollHum } = await import("../components/sound");
  assert.doesNotThrow(() => {
    sound.land(600); sound.ting(0); sound.ting(9); sound.oof(); sound.awning(); sound.bonus(); sound.gust(); sound.crack(); sound.whistle();
    sound.floor(0); sound.floor(5); sound.start(2); sound.hole(); sound.lose();
    const hum = rollHum(); hum.update(60, 190, true); hum.update(60, 0, false); hum.stop();
  });
});
