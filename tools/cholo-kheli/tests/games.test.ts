import assert from "node:assert/strict";
import test from "node:test";
import { drawings } from "../lib/drawings";
import { createGameInvitation, findGames, games, parsePlayerCount, suggestGames } from "../lib/games";

test("player counts accept complete Bengali and English whole numbers", () => {
  assert.equal(parsePlayerCount(" ১২ "), 12);
  assert.equal(parsePlayerCount("4"), 4);
  for (const value of ["", "১", "১৭", "২.৫", "1e1", "4 people", "-2"]) assert.equal(parsePlayerCount(value), null);
});

test("a seated group needs no supplies for word relay", () => {
  const results = findGames({ players: 4, space: "seated", equipment: [] });
  assert.ok(results.some((game) => game.id === "word-relay"));
  assert.ok(results.every((game) => game.equipment.length === 0));
  assert.ok(results.every((game) => game.spaces.includes("seated")));
});

test("all required supplies must be available", () => {
  const selection = { players: 4, space: "courtyard", equipment: [] as string[] };
  assert.ok(!findGames(selection).some((game) => game.id === "kitkit"));
  assert.ok(!findGames({ ...selection, equipment: ["chalk"] }).some((game) => game.id === "kitkit"));
  assert.ok(findGames({ ...selection, equipment: ["chalk", "marker"] }).some((game) => game.id === "kitkit"));
  assert.ok(!findGames({ ...selection, equipment: ["paper"] }).some((game) => game.id === "kitkit"));
});

test("running games need an open field and equally sized teams", () => {
  assert.ok(findGames({ players: 10, space: "field", equipment: ["chalk"] }).some((game) => game.id === "gollachhut"));
  assert.ok(!findGames({ players: 9, space: "field", equipment: ["chalk"] }).some((game) => game.id === "gollachhut"));
  assert.ok(!findGames({ players: 10, space: "courtyard", equipment: ["chalk"] }).some((game) => game.id === "gollachhut"));
});

test("a real no-match combination does not silently loosen the requirements", () => {
  assert.deepEqual(findGames({ players: 16, space: "seated", equipment: [] }), []);
});

test("invalid filter values do not select accidental games", () => {
  for (const selection of [
    { players: NaN, space: "seated", equipment: [] },
    { players: 4.5, space: "seated", equipment: [] },
    { players: 4, space: "roof", equipment: [] },
    { players: 4, space: "seated", equipment: ["unknown"] },
  ]) assert.deepEqual(findGames(selection), []);
});

test("invitations contain the chosen rules, Bangla numbers and no invented appointment", () => {
  const game = games.find((item) => item.id === "kitkit");
  assert.ok(game);
  const invitation = createGameInvitation(game, 4);
  assert.ok(invitation.includes("৪ জন"));
  assert.ok(invitation.includes(game.title));
  assert.ok(invitation.includes(game.rules[0]));
  assert.ok(invitation.includes("কখন, কোথায় খেলব, সবাই মিলে ঠিক করে নেব"));
  assert.ok(invitation.includes(game.care));
});

test("every game has a complete, explicitly named variant and unique ID", () => {
  assert.equal(new Set(games.map((game) => game.id)).size, games.length);
  assert.ok(games.every((game) => game.rules.length >= 4 && game.variant && game.ending && game.care));
});

test("the classic outdoor games ask for exactly what they need", () => {
  const field = (players: number, equipment: string[]) => findGames({ players, space: "field", equipment }).map((game) => game.id);
  assert.ok(field(6, []).includes("lukochuri"));
  assert.ok(!field(6, []).includes("kanamachhi") && !field(6, []).includes("rumal-churi"));
  assert.ok(field(6, ["cloth"]).includes("kanamachhi") && field(6, ["cloth"]).includes("rumal-churi"));
  assert.ok(field(8, ["chalk"]).includes("dariabandha"));
  assert.ok(!field(9, ["chalk"]).includes("dariabandha"), "দাঁড়িয়াবান্ধা needs two equal teams");
  assert.ok(!field(14, ["chalk"]).includes("dariabandha"));
  for (const id of ["kanamachhi", "rumal-churi", "lukochuri", "dariabandha"]) {
    assert.ok(!findGames({ players: 8, space: "seated", equipment: ["chalk", "cloth", "paper", "marker"] }).some((game) => game.id === id), `${id} is not a sitting game`);
  }
});

test("outside, the games that need the space come before sitting games", () => {
  const ranked = suggestGames(findGames({ players: 6, space: "field", equipment: [] }), "field");
  assert.equal(ranked[0].id, "lukochuri");
  assert.ok(ranked.findIndex((game) => game.spaces.includes("seated")) > 0);
  const seated = findGames({ players: 4, space: "seated", equipment: [] });
  assert.deepEqual(suggestGames(seated, "seated"), seated);
});

test("every game has a poster drawing and a poster line, and invitations can carry the agreed time", () => {
  for (const game of games) {
    assert.ok(drawings[game.id]?.path, `${game.id}: drawing`);
    assert.ok(game.line.length > 8 && game.line.length < 60, `${game.id}: line`);
  }
  const invitation = createGameInvitation(games[0], 4, "আজ বিকেল ৪টায়, স্কুলের মাঠে");
  assert.ok(invitation.includes("কবে, কোথায়: আজ বিকেল ৪টায়, স্কুলের মাঠে।"));
  assert.ok(!invitation.includes("সবাই মিলে ঠিক করে নেব"));
});
