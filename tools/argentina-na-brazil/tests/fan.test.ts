import assert from "node:assert/strict";
import test from "node:test";
import { fanBadge, fanCaption, fanLaneLine, fanLaneTitle, fanLine, fanPreviewTitle, fanScore, fanSets, fanTest, fanTitle } from "../lib/fan";
import { parseShareHash, shareHash, FAN_ROUNDS, type Pick, type Shared } from "../lib/roof";
import { share } from "../share";

const allRight = (team: "arg" | "bra", seed: number) => fanTest(team, seed).map(round => round.right);
const missOne = (picks: Pick[], index: number) => picks.map((pick, i) => i === index ? ((pick + 1) % 3) as Pick : pick);

test("both sets have exactly 8 unique questions with 3 distinct options", () => {
  const ids = new Set<string>();
  for (const set of Object.values(fanSets)) {
    assert.equal(set.length, FAN_ROUNDS);
    for (const question of set) {
      assert.equal(new Set(question.options).size, 3, question.id);
      assert.ok(!ids.has(question.id), question.id);
      ids.add(question.id);
      // options[0] is the right one in the data, so the fact line must name it
      assert.ok(question.options[0].replace(/ \(.*\)$/, "").split(" ").some(word => question.fact.includes(word)), question.id);
    }
  }
});

test("the seed replays the same test, and links depend on this exact order", () => {
  assert.deepEqual(fanTest("arg", 1234), fanTest("arg", 1234));
  // Pinned: changing questions, options or the shuffle would silently re-score every shared link.
  assert.deepEqual(fanTest("arg", 42).map(round => round.question.id), ["a-ball", "a-prothom", "a-kap", "a-2021", "a-hand", "a-2022", "a-2014", "a-copa"]);
  assert.equal(allRight("arg", 42).join(""), "20002001");
  assert.deepEqual(fanTest("bra", 42).map(round => round.question.id), ["b-2007", "b-kap", "b-1994", "b-2002", "b-prothom", "b-1950", "b-pele", "b-rimet"]);
  assert.equal(allRight("bra", 42).join(""), "20011001");
  for (const seed of [0, 7, 9999]) for (const team of ["arg", "bra"] as const) for (const round of fanTest(team, seed)) {
    assert.deepEqual([...round.options].sort(), [...round.question.options].sort());
    assert.equal(round.options[round.right], round.question.options[0]);
  }
});

test("the score is recomputed from the taps, never read from the link", () => {
  const picks = missOne(allRight("arg", 42), 3);
  const hash = shareHash({ own: { team: "arg", year: 2002, name: "রাফি", quiz: picks }, neighbour: null, seed: 42 });
  assert.equal(hash, `#t=arg&y=2002&n=${encodeURIComponent("রাফি")}&q=${picks.join("")}&s=42`);
  const opened = parseShareHash(hash + "&score=8")!;
  assert.equal(fanScore(opened.own.team, opened.seed!, opened.own.quiz!), 7);
  assert.equal(fanTitle(opened.own, opened.seed!), "রাফি ৮-এ ৭ — খাঁটি আর্জেন্টিনা ভক্ত");
  assert.equal(fanLine("arg", 42, picks), "শুধু ২০২১ কোপার প্রশ্নটা ফসকেছে, বাকিটা মুখস্থ।");
  assert.equal(fanLine("arg", 42, allRight("arg", 42)), "আটে আট। দলের ইতিহাসটা আমার মুখস্থ।");
});

test("pre-test links open exactly as before", () => {
  for (const hash of ["#t=arg&y=2002&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF", "#t=bra&y=2014&n=%E0%A6%AE%E0%A6%BF%E0%A6%AE&ft=arg&fy=2002&fn=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF", "#t=eng"]) {
    const shared = parseShareHash(hash)!;
    assert.equal(shareHash(shared), hash);
    assert.equal("seed" in shared, false);
    assert.equal("quiz" in shared.own, false);
  }
  assert.equal(share.preview("t=arg&n=রাফি").title, "রাফির ছাদে আর্জেন্টিনার পতাকা — তোমার ছাদে কোনটা?");
});

test("the roof link never carries quiz keys; the fan link round-trips with both houses", () => {
  const own = { team: "bra" as const, year: 2014 as const, name: "মিম", quiz: allRight("bra", 42) };
  const neighbour = { team: "arg" as const, year: 2002 as const, name: "রাফি", quiz: missOne(allRight("arg", 42), 0) };
  assert.equal(shareHash({ own, neighbour }), `#t=bra&y=2014&n=${encodeURIComponent("মিম")}&ft=arg&fy=2002&fn=${encodeURIComponent("রাফি")}`);
  const card: Shared = { own, neighbour, seed: 42 };
  assert.deepEqual(parseShareHash(shareHash(card)), card);
  assert.equal(fanLaneTitle(card), "রাফি আর্জেন্টিনা ৮-এ ৭, মিম ব্রাজিল ৮-এ ৮");
  assert.equal(fanLaneLine(own, neighbour, 42), "এই রাউন্ড ব্রাজিলের। আজকের চা রাফি খাওয়াবে।");
  assert.equal(fanLaneLine(neighbour, own, 42), "এই রাউন্ড ব্রাজিলের। আজকের চা আমার পক্ষ থেকে।");
  assert.match(fanPreviewTitle(card), /^রাফি আর্জেন্টিনা ৮-এ ৭, মিম ব্রাজিল ৮-এ ৮ — /);
  assert.match(fanCaption({ own, neighbour: null, seed: 42 }), /৮-এ ৮, খাঁটি ব্রাজিল ভক্ত। আর্জেন্টিনা ভক্তরা/);
});

test("hostile or partial quiz keys are dropped, never crash", () => {
  const good = allRight("arg", 42).join("");
  for (const hash of [`#t=arg&q=${good}`, `#t=arg&q=${good}&s=`, `#t=arg&q=${good}&s=12345`, `#t=arg&q=${good}&s=-1`, `#t=arg&q=${good}&s=1e3`, `#t=arg&q=0120&s=42`, `#t=arg&q=${good}3&s=42`, `#t=arg&q=01201x01&s=42`, `#t=esp&q=${good}&s=42`]) {
    const shared = parseShareHash(hash)!;
    assert.equal(shared.own.quiz, undefined, hash);
    assert.equal(shared.seed, undefined, hash);
  }
  assert.equal(parseShareHash(`#t=bra&ft=arg&fq=${good}&s=42`)?.neighbour?.quiz?.length, FAN_ROUNDS);
  assert.equal(share.normalize(`t=arg&q=${good}&s=0042&junk=1`), `t=arg&q=${good}&s=42`);
  assert.match(share.preview(`t=arg&n=রাফি&q=${good}&s=42`).title, /^রাফি ৮-এ ৮ — খাঁটি আর্জেন্টিনা ভক্ত।/);
});

test("badges stay kind at every score", () => {
  assert.deepEqual([8, 7, 6, 5, 4, 3, 2, 0].map(score => fanBadge("bra", score)), ["খাঁটি ব্রাজিল ভক্ত", "খাঁটি ব্রাজিল ভক্ত", "মনেপ্রাণে ব্রাজিল ভক্ত", "মনেপ্রাণে ব্রাজিল ভক্ত", "বিশ্বকাপের ব্রাজিল ভক্ত", "বিশ্বকাপের ব্রাজিল ভক্ত", "নতুন ব্রাজিল ভক্ত", "নতুন ব্রাজিল ভক্ত"]);
  assert.equal(fanScore("esp", 42, allRight("arg", 42)), 0);
});
