import assert from "node:assert/strict";
import test from "node:test";
import { findGames, games } from "../lib/games";
import { inviteHash, parseInvite } from "../lib/invite";
import { championTitle, ludoCaption, ludoHash, ludoLine, parseLudo, parseSession, tally, tallyPath, tallyWidth, type Ludo } from "../lib/ludo";
import { share } from "../share";

const rafi: Ludo = { wins: [3, 1, 1, 0], names: ["রাফি", "মিম", "", ""], occasion: "eid" };

test("ludo is a seated 2–4 player game that needs a board, appended after the old games", () => {
  assert.equal(games[games.length - 1].id, "ludo");
  assert.deepEqual(games.slice(0, 10).map(game => game.id), ["word-relay", "name-place", "twenty-questions", "silent-acting", "kitkit", "gollachhut", "kanamachhi", "rumal-churi", "lukochuri", "dariabandha"]);
  assert.ok(findGames({ players: 4, space: "seated", equipment: ["ludo"] }).some(game => game.id === "ludo"));
  assert.ok(!findGames({ players: 4, space: "seated", equipment: [] }).some(game => game.id === "ludo"), "no board, no ludo");
  assert.ok(!findGames({ players: 5, space: "seated", equipment: ["ludo"] }).some(game => game.id === "ludo"));
  assert.equal(findGames({ players: 6, space: "field", equipment: [] })[0]?.id === "ludo", false);
});

test("the champion line reads like the brief", () => {
  assert.equal(championTitle(rafi), "ঈদের লুডু চ্যাম্পিয়ন: রাফি · ৫ দানে ৩ জয়");
  assert.equal(championTitle({ ...rafi, names: [], occasion: "puja" }), "পূজার লুডু চ্যাম্পিয়ন: লাল গুটি · ৫ দানে ৩ জয়");
  assert.equal(championTitle({ wins: [3, 3, 0], names: ["রাফি", "মিম"], occasion: "chhuti" }), "ছুটির লুডু চ্যাম্পিয়ন: রাফি আর মিম · ৬ দানে ৩টা করে জয়");
  assert.equal(ludoCaption(rafi), "ঈদের লুডু চ্যাম্পিয়ন: রাফি! ৫ দানে ৩ জয়। তোমাদের বাড়িতে লুডুতে কে জেতে?");
  assert.match(ludoLine([1, 0]), /এক দান/);
  assert.match(ludoLine([2, 2]), /সমানে সমান/);
  assert.match(ludoLine([4, 0, 0]), /ছাড়েনি/);
  assert.notEqual(ludoLine([3, 2]), ludoLine([5, 1]));
});

test("the tally counts each tap, and games of a player who left the board stay hidden, not lost", () => {
  assert.deepEqual(tally([0, 2, 0, 1, 0], 4), [3, 1, 1, 0]);
  assert.deepEqual(tally([0, 3, 3], 3), [1, 0, 0]);
  assert.deepEqual(tally([0, 3, 3], 4), [1, 0, 0, 2]);
  assert.equal(tallyPath(0), "");
  assert.equal((tallyPath(5).match(/M/g) ?? []).length, 5);
  assert.equal(tallyPath(40), tallyPath(15));
  assert.deepEqual([0, 1, 4, 5, 6, 15, 40].map(tallyWidth), [8, 8, 29, 32, 46, 108, 108]);
});

test("a champion link round-trips and stays apart from invitation links", () => {
  const state = ludoHash(rafi).slice(1);
  assert.equal(state, "lw=3.1.1.0&lo=eid&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF&n=%E0%A6%AE%E0%A6%BF%E0%A6%AE");
  assert.deepEqual(parseLudo(state), rafi);
  assert.equal(share.normalize(state), state);
  assert.equal(share.preview(state).title, "ঈদের লুডু চ্যাম্পিয়ন: রাফি · ৫ দানে ৩ জয়");
  assert.equal(parseInvite(state), null);
  assert.deepEqual(parseLudo("lw=0.2&n=&n=মিম"), { wins: [0, 2], names: ["", "মিম"], occasion: "eid" });
  assert.equal(ludoHash({ wins: [0, 2], names: ["", "মিম"], occasion: "eid" }), "#lw=0.2&lo=eid&n=&n=" + encodeURIComponent("মিম"));
});

test("hostile champion links are rejected or cleaned", () => {
  for (const bad of ["lw=", "lw=3", "lw=0.0", "lw=1.2.3.4.5", "lw=1.-2", "lw=1.2e1", "lw=100.1", "lw=1..2", "lw=__proto__"]) assert.equal(parseLudo(bad), null, bad);
  assert.equal(share.normalize("lw=0.0"), null);
  const odd = parseLudo("lw=1.2&lo=christmas&n=" + encodeURIComponent("‮রা\u0000ফি" + "ক".repeat(40)) + "&n=b&n=c&n=d");
  assert.equal(odd?.occasion, "eid");
  assert.equal(odd?.names.length, 2, "never more names than players");
  assert.ok(!/[\u0000‮]/.test(odd!.names[0]));
  assert.equal(odd!.names[0].length, 16);
  assert.equal(parseLudo("lw=1.2&n=" + encodeURIComponent("রা্ফি".normalize("NFD")))!.names[0], "রা্ফি".normalize("NFC"));
});

test("a link shared before ludo existed still opens the same invitation", () => {
  const old = "g=kanamachhi&p=6&s=field&w=aj&t=%E0%A6%AC%E0%A6%BF%E0%A6%95%E0%A7%87%E0%A6%B2+%E0%A7%AB%E0%A6%9F%E0%A6%BE%E0%A6%AF%E0%A6%BC&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF";
  assert.equal(parseLudo(old), null);
  assert.equal(share.normalize(old), old);
  assert.equal(share.preview(old).title, "রাফি ডাকছে: আজ বিকেল ৫টায় কানামাছি, স্কুলের মাঠে। আসছ তো?");
  const ludoInvite = parseInvite("#g=ludo&p=9&s=seated");
  assert.equal(ludoInvite?.players, 4);
  assert.equal(share.normalize(inviteHash(ludoInvite!).slice(1)), inviteHash(ludoInvite!).slice(1));
});

test("the saved session survives a reload and ignores junk", () => {
  const session = { players: 3, names: ["রাফি", "", "মিম", ""], history: [0, 2, 0], occasion: "puja", at: 1760000000000 };
  assert.deepEqual(parseSession(JSON.stringify(session)), session);
  for (const bad of [null, "", "{", "null", "[]", '{"players":5,"history":[]}', '{"players":3}', '{"players":2.5,"history":[]}']) assert.equal(parseSession(bad), null, String(bad));
  const messy = parseSession(JSON.stringify({ players: 2, names: [7, "ক".repeat(30)], history: [0, 9, -1, "1", 1.5, 3, ...Array(500).fill(1)], occasion: "x" }))!;
  assert.deepEqual(messy.names, ["", "ক".repeat(16), "", ""]);
  assert.equal(messy.history.length, 400);
  assert.ok(messy.history.every(winner => winner >= 0 && winner < 4));
  assert.equal(messy.occasion, "eid");
  assert.equal(messy.at, 0);
});
