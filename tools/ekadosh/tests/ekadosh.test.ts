import assert from "node:assert/strict";
import test from "node:test";
import {
  SLOTS, bn, caption, changeFormation, choicesFor, cleanName, commonIds, crowdXI, defaultTeam, formationIds, formations, matchLine,
  parseShareHash, placePlayer, playerById, players, shareHash, tallyIds, teamLine, teamTitle, MAX_NAME_LENGTH, type Team,
} from "../lib/ekadosh";
import { share } from "../share";
import { site } from "../content";

const team: Team = { ...defaultTeam, name: "রাফি", captain: "messi" };
const lineOf = (t: Team, slot: number) => formations[t.formation].spots[slot].line;

test("the pool has unique ASCII ids, NFC names and enough players for every shape", () => {
  assert.equal(new Set(players.map(player => player.id)).size, players.length);
  assert.equal(new Set(players.map(player => player.short)).size, players.length, "board names must not clash");
  for (const player of players) {
    assert.match(player.id, /^[a-z0-9]{2,12}$/);
    assert.equal(player.name, player.name.normalize("NFC"));
    assert.equal(player.short, player.short.normalize("NFC"));
    assert.notEqual(player.alt, player.line);
  }
  assert.ok(players.length >= 50);
  for (const id of formationIds) {
    for (const line of ["gk", "df", "mf", "fw"] as const) {
      const need = formations[id].spots.filter(spot => spot.line === line).length;
      assert.ok(choicesFor(line).length >= need + 4, `${line} in ${id}`);
    }
  }
});

test("every shape has eleven slots: the keeper, then each line left to right", () => {
  for (const id of formationIds) {
    const spots = formations[id].spots;
    assert.equal(spots.length, SLOTS);
    assert.equal(spots[0].line, "gk");
    assert.deepEqual(spots.map(spot => spot.line), [...spots].sort((a, b) => "gdmf".indexOf(a.line[0]) - "gdmf".indexOf(b.line[0])).map(spot => spot.line));
  }
});

test("the default XI is valid and starts with the four-era line", () => {
  assert.deepEqual(parseShareHash(shareHash(defaultTeam)), defaultTeam);
  defaultTeam.players.forEach((id, slot) => assert.ok(choicesFor(lineOf(defaultTeam, slot)).some(player => player.id === id), id));
  assert.equal(teamLine(defaultTeam.players), "চার যুগের তারকা এক মাঠে, এমন দল শুধু স্বপ্নেই নামে।");
});

test("an XI survives the link round trip, name and captain included", () => {
  const hash = shareHash(team);
  assert.match(hash, /^#f=433&p=yashin,maldini,[a-z0-9,]+&c=10&n=/);
  assert.deepEqual(parseShareHash(hash), team);
  const shaped = changeFormation(team, "352");
  assert.deepEqual(parseShareHash(shareHash(shaped)), shaped);
});

test("placing a player swaps with one already on the board; the armband follows the right person", () => {
  const swapped = placePlayer(team, 5, "maradona");
  assert.equal(swapped.players[5], "maradona");
  assert.equal(swapped.players[7], "xavi");
  const replaced = placePlayer(team, 10, "neymar");
  assert.equal(replaced.players[10], "neymar");
  assert.equal(replaced.captain, "neymar", "replacing the captain hands over the armband");
  assert.equal(placePlayer(team, 9, "neymar").captain, "messi");
  assert.throws(() => placePlayer(team, 0, "messi"), RangeError);
  assert.throws(() => placePlayer(team, 1, "buffon"), RangeError);
  assert.throws(() => placePlayer(team, 3, "nobody"), RangeError);
});

test("changing shape keeps the same eleven, sensibly re-laid", () => {
  const four = changeFormation(team, "442");
  assert.deepEqual([...four.players].sort(), [...team.players].sort());
  assert.equal(four.players[0], "yashin");
  four.players.slice(1, 5).forEach(id => assert.equal(playerById(id)!.line, "df"));
  const three = changeFormation(four, "352");
  assert.ok(three.players.slice(4, 9).includes("beckenbauer"), "Beckenbauer steps into midfield when the back line shrinks");
  const back = changeFormation(three, "433");
  assert.deepEqual(back.players.slice(1, 5).sort(), ["baresi", "beckenbauer", "cafu", "maldini"]);
  assert.deepEqual(back.players.slice(8).sort(), ["cristiano", "messi", "pele"]);
  assert.equal(back.captain, "messi");
  assert.equal(changeFormation(team, "433"), team);
});

test("hostile or broken links are refused instead of crashing", () => {
  const ids = defaultTeam.players;
  assert.equal(parseShareHash(""), null);
  assert.equal(parseShareHash("#result"), null);
  assert.equal(parseShareHash("#f=%%%&p=1"), null);
  assert.equal(parseShareHash(`#f=541&p=${ids.join(",")}`), null);
  assert.equal(parseShareHash(`#f=__proto__&p=${ids.join(",")}`), null);
  assert.equal(parseShareHash(`#f=433&p=${ids.slice(1).join(",")}`), null);
  assert.equal(parseShareHash(`#f=433&p=${[...ids.slice(0, 10), ids[1]].join(",")}`), null);
  assert.equal(parseShareHash(`#f=433&p=${[...ids.slice(0, 10), "constructor"].join(",")}`), null);
  assert.equal(parseShareHash(`#f=433&p=${["messi", ...ids.slice(1, 10), "yashin"].join(",")}`), null, "keeper must be in goal");
  assert.equal(parseShareHash(`#f=433&p=${[...ids.slice(0, 10), "buffon"].join(",")}`), null, "and only there");
  assert.equal(parseShareHash(`#f=433&p=${"messi,".repeat(60)}`), null);
  const odd = parseShareHash(`#f=433&p=${ids.join(",")}&c=99`);
  assert.equal(odd?.captain, "yashin");
});

test("the name is NFC, one line, free of direction tricks and capped", () => {
  assert.equal(cleanName("  রাফি‮\nহাসান  "), "রাফি হাসান");
  assert.equal(Array.from(cleanName("ক".repeat(60))).length, MAX_NAME_LENGTH);
  assert.equal(cleanName("কে়"), "কে়".normalize("NFC"));
  const parsed = parseShareHash(`${shareHash(defaultTeam)}&n=${encodeURIComponent("ক".repeat(80))}`);
  assert.equal(Array.from(parsed!.name).length, MAX_NAME_LENGTH);
  assert.equal(teamTitle({ name: "রাফি" }), "রাফির স্বপ্নের একাদশ");
  assert.equal(teamTitle({ name: "" }), "আমার স্বপ্নের একাদশ");
});

test("the human line follows the mix", () => {
  const sky = ["emartinez", "passarella", "zanetti", "mascherano", "maradona", "riquelme", "messi", "dimaria", "batistuta", "kempes", "cafu"];
  assert.equal(teamLine(sky), "এই দল মাঠে নামলে পাড়ার সব ছাদে আকাশি-সাদা পতাকা।");
  const both = ["emartinez", "passarella", "zanetti", "maradona", "cafu", "rcarlos", "zico", "pele", "zidane", "xavi", "henry"];
  assert.equal(teamLine(both), "আকাশি-সাদা আর হলুদ-সবুজ এক দলে, পাড়ায় আজ ঝগড়া নেই!");
  const sixties = ["yashin", "banks", "moore", "charlton", "puskas", "zidane", "xavi", "maldini", "cannavaro", "ramos", "henry"];
  assert.equal(teamLine(sixties), "সাদাকালো যুগের দল, তবু খেলাটা পুরো রঙিন।");
});

test("a friend's XI lines up next to mine", () => {
  const friend = placePlayer(placePlayer(team, 10, "neymar"), 9, "r9");
  assert.equal(commonIds(team.players, friend).length, 9);
  assert.equal(matchLine(team.players, friend), "দুজনের মিল ৯/১১");
  assert.equal(matchLine(team.players, null), "");
  assert.match(caption(team, { ...friend, name: "তানিয়া" }), /^তানিয়ার সাথে দুজনের মিল ৯\/১১! রাফির স্বপ্নের একাদশ \(৪-৩-৩\): ইয়াশিন, মালদিনি/);
});

test("everyone's XI picks the most-counted at each position", () => {
  const xi = crowdXI({ pele: 9, messi: 8, maradona: 7, buffon: 5, ramos: 3 });
  assert.deepEqual(xi[0], ["gk", ["buffon"]]);
  assert.equal(xi[3][1][0], "pele");
  assert.equal(xi[2][1][0], "maradona");
  assert.equal(xi.reduce((total, [, ids]) => total + ids.length, 0), SLOTS);
});

test("the share hook normalizes, previews by name and captain, and only counts player ids", () => {
  const state = shareHash(team).slice(1);
  assert.equal(share.normalize(state), state);
  assert.equal(share.normalize(`p=${team.players.join(",")}`), null);
  assert.equal(share.preview(state).title, "রাফির স্বপ্নের একাদশ · অধিনায়ক: মেসি — তোমার একাদশে কে কে?");
  assert.match(share.preview(shareHash({ ...team, name: "" }).slice(1)).title, /^এক বন্ধুর স্বপ্নের একাদশ/);
  assert.deepEqual(share.tally, tallyIds);
  assert.ok(share.tally!.every(id => playerById(id)));
});

test("SEO text stays within its limits and matches the pool", () => {
  assert.ok(Array.from(site.title).length <= 45, site.title);
  const length = Array.from(site.description).length;
  assert.ok(length >= 120 && length <= 160, `description is ${length}`);
  assert.ok(site.faq.length >= 5);
  assert.ok(site.description.includes(`${bn(players.length)} জন`), "the description's player count matches the pool");
});
