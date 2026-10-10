import assert from "node:assert/strict";
import test from "node:test";
import { cleanText, headline, inviteCaption, inviteHash, inviteTitle, parseInvite, placeOf, gameById, type Invite } from "../lib/invite";
import { share } from "../share";

const invite: Invite = { game: "kanamachhi", players: 6, space: "field", when: "aj", time: "বিকেল ৫টায়", place: "বটতলার মাঠে", name: "রাফি" };

test("an invitation link round-trips exactly", () => {
  assert.deepEqual(parseInvite(inviteHash(invite)), invite);
  assert.equal(share.normalize(inviteHash(invite).slice(1)), inviteHash(invite).slice(1));
  const bare = parseInvite("#g=lukochuri");
  assert.deepEqual(bare, { game: "lukochuri", players: 3, space: "field", when: "aj", time: "", place: "", name: "" });
  assert.equal(headline(bare!), "আজ বিকেল ৪টায়");
  assert.equal(placeOf(bare!), "স্কুলের মাঠে");
});

test("hostile or impossible links are rejected or pulled back into a valid invitation", () => {
  for (const bad of ["", "#g=roof-jumping", "#p=6&s=field", "g=__proto__"]) assert.equal(parseInvite(bad), null, bad);
  assert.equal(share.normalize("g=nope"), null);
  const odd = parseInvite("#g=dariabandha&p=9&s=seated&w=never");
  assert.equal(odd?.players, 10, "two equal teams");
  assert.equal(odd?.space, "field", "not a sitting game");
  assert.equal(odd?.when, "aj");
  assert.equal(parseInvite("#g=kanamachhi&p=99")?.players, 12);
  assert.equal(parseInvite("#g=kanamachhi&p=abc")?.players, 4);
  const scrambled = parseInvite("#g=kitkit&n=" + encodeURIComponent("‮রা\u0000ফি" + "ক".repeat(80)) + "&l=" + "ম".repeat(90));
  assert.ok(!/[\u0000‮]/.test(scrambled!.name));
  assert.equal(scrambled!.name.length, 30);
  assert.equal(scrambled!.place.length, 30);
  assert.equal(cleanText("  রা্ফি  ".normalize("NFD"), 30), "রা্ফি".normalize("NFC"));
});

test("the preview and caption read as a personal invitation", () => {
  const game = gameById("kanamachhi")!;
  assert.equal(inviteTitle(invite, game), "রাফি ডাকছে: আজ বিকেল ৫টায় কানামাছি, বটতলার মাঠে — আসছ তো?");
  assert.equal(share.preview(inviteHash(invite).slice(1)).title, inviteTitle(invite, game));
  assert.match(share.preview(inviteHash({ ...invite, name: "" }).slice(1)).title, /^খেলার দাওয়াত: /);
  assert.equal(inviteCaption(invite, game), "আজ বিকেল ৫টায় কানামাছি খেলব, বটতলার মাঠে। ৬ জন হলেই জমবে। আসছ তো?");
  assert.equal(share.tally, undefined);
});
