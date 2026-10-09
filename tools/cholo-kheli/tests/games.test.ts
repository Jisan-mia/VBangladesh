import assert from "node:assert/strict";
import test from "node:test";
import { createGameInvitation, findGames, games, parsePlayerCount } from "../lib/games";

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
