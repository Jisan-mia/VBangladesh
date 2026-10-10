import assert from "node:assert/strict";
import test from "node:test";
import { cleanName, createCard, pairSplit, parseShareHash, pickText, previewTitle, sealedLine, shareHash, tallyId, tallyIds, teams, verdict, MAX_ENTRIES, MAX_NAME_LENGTH, type Shared } from "../lib/seal";
import { share } from "../share";

const nfc = (text: string) => text.normalize("NFC");
const banSl = (entries: Shared["entries"], result = ""): Shared => ({ sport: "c", a: "ban", b: "sl", entries, result });

test("team ids are unique per sport and Bangladesh comes first", () => {
  for (const list of Object.values(teams)) {
    assert.equal(new Set(list.map(team => team.id)).size, list.length);
    assert.equal(list[0].name, "বাংলাদেশ");
  }
});

test("one call survives the link round trip", () => {
  const shared = banSl([{ pick: "aw5", name: "রাফি" }]);
  assert.equal(shareHash(shared), `#s=c&a=ban&b=sl&p=aw5.${encodeURIComponent(nfc("রাফি"))}`);
  assert.deepEqual(parseShareHash(shareHash(shared)), { ...shared, entries: [{ pick: "aw5", name: nfc("রাফি") }] });
});

test("friends' calls and the result ride along, names may contain dots", () => {
  const shared: Shared = { sport: "f", a: "arg", b: "bra", entries: [{ pick: "21", name: "মিম" }, { pick: "00", name: "" }, { pick: "13", name: "Dr. Rafi" }], result: "11" };
  const back = parseShareHash(shareHash(shared))!;
  assert.deepEqual(back.entries.map(entry => entry.pick), ["21", "00", "13"]);
  assert.equal(back.entries[2].name, "Dr. Rafi");
  assert.equal(back.result, "11");
});

test("hostile or broken links are refused or trimmed, never trusted", () => {
  for (const hash of ["", "#", "#result", "#s=x&a=ban&b=sl&p=a", "#s=c&a=ban&b=ban&p=a", "#s=c&a=ban&b=arg&p=a", "#s=c&a=ban&b=sl", "#s=c&a=ban&b=sl&p=21", "#s=f&a=arg&b=bra&p=aw5", "#s=f&a=arg&b=bra&p=66", "#s=c&a=ban&b=sl&p=aw11", "#s=c&a=ban&b=sl&p=dw5", "#s=c&a=<script>&b=sl&p=a"]) {
    assert.equal(parseShareHash(hash), null, hash);
  }
  const many = "#s=c&a=ban&b=sl" + "&p=a".repeat(20);
  assert.equal(parseShareHash(many)!.entries.length, MAX_ENTRIES);
  const mixed = parseShareHash("#s=c&a=ban&b=sl&p=zz.ভুল&p=b.মিম&r=nonsense")!;
  assert.deepEqual(mixed.entries, [{ pick: "b", name: nfc("মিম") }]);
  assert.equal(mixed.result, "");
});

test("names lose control and direction-override characters, are capped and NFC", () => {
  assert.equal(cleanName("  রিমা‮  আক্তার\n"), nfc("রিমা আক্তার"));
  assert.equal(Array.from(cleanName("ক".repeat(MAX_NAME_LENGTH + 10))).length, MAX_NAME_LENGTH);
  // য় typed as one code point and as য + nukta must become the same name.
  assert.equal(cleanName("জয়য়"), cleanName("জয়য়"));
  assert.equal(cleanName("য়"), "য়".normalize("NFC"));
  const link = parseShareHash(`#s=c&a=ban&b=sl&p=a.${encodeURIComponent("‮HACK" + "x".repeat(80))}`)!;
  assert.ok(!link.entries[0].name.includes("‮"));
  assert.ok(Array.from(link.entries[0].name).length <= MAX_NAME_LENGTH);
});

test("calls read like people talk", () => {
  const match = banSl([]);
  assert.equal(pickText(match, "aw5"), "বাংলাদেশ জিতবে ৫ উইকেটে");
  assert.equal(pickText(match, "br3"), "শ্রীলঙ্কা জিতবে ৩১–৬০ রানে");
  assert.equal(pickText(match, "a"), "বাংলাদেশ জিতবে");
  assert.equal(pickText(match, "d"), "খেলা ড্র হবে");
  assert.equal(pickText(match, "aw10", true), "বাংলাদেশ জিতেছে ১০ উইকেটে");
  const football = { sport: "f", a: "arg", b: "bra" } as const;
  assert.equal(pickText(football, "21"), "আর্জেন্টিনা জিতবে ২-১ গোলে");
  assert.equal(pickText(football, "13"), "ব্রাজিল জিতবে ৩-১ গোলে");
  assert.equal(pickText(football, "00"), "গোলশূন্য ড্র হবে");
  assert.equal(pickText(football, "22", true), "২-২ গোলে ড্র হয়েছে");
});

test("verdicts: right winner is a hit, the exact margin or score is হুবহু", () => {
  assert.equal(verdict("c", "aw5", "aw5"), "exact");
  assert.equal(verdict("c", "aw5", "aw3"), "right");
  assert.equal(verdict("c", "aw5", "a"), "right");
  assert.equal(verdict("c", "a", "a"), "right");
  assert.equal(verdict("c", "aw5", "br2"), "wrong");
  assert.equal(verdict("c", "d", "d"), "right");
  assert.equal(verdict("f", "21", "21"), "exact");
  assert.equal(verdict("f", "21", "10"), "right");
  assert.equal(verdict("f", "11", "00"), "right");
  assert.equal(verdict("f", "21", "12"), "wrong");
});

test("sealed and opened cards say the right thing", () => {
  const sealed = createCard(banSl([{ pick: "aw5", name: "রাফি" }]), false);
  assert.equal(sealed.title, nfc("রাফির ভবিষ্যদ্বাণী"));
  assert.equal(sealed.match, "বাংলাদেশ বনাম শ্রীলঙ্কা");
  assert.equal(sealed.line, "লাল-সবুজের ওপর ভরসা রেখেই বলে দিলাম।");
  assert.ok(!sealed.caption.includes("৫ উইকেটে"), "a sealed caption keeps the call secret");
  const hit = createCard(banSl([{ pick: "aw5", name: "রাফি" }], "aw5"), true);
  assert.equal(hit.title, "আমি বলেছিলাম!");
  assert.equal(hit.result, "ফল: বাংলাদেশ জিতেছে ৫ উইকেটে");
  assert.equal(hit.rows[0].verdict, "exact");
  assert.equal(createCard(banSl([{ pick: "aw5", name: "" }], "b"), true).title, "এবার মেলেনি");
  const group = createCard(banSl([{ pick: "aw5", name: "রাফি" }, { pick: "b", name: "মিম" }, { pick: "ar2", name: "" }], "aw2"), true);
  assert.equal(group.title, "রাফি আর বন্ধু ৩ বলেছিল!");
  assert.equal(createCard(banSl([{ pick: "aw5", name: "" }, { pick: "b", name: "মিম" }], "a"), true).title, "আমি বলেছিলাম!");
  assert.equal(createCard(banSl([{ pick: "a", name: "" }, { pick: "aw2", name: "মিম" }], "a"), true).title, "সবাই বলেছিল!");
  assert.equal(createCard(banSl([{ pick: "a", name: "" }, { pick: "aw2", name: "মিম" }], "d"), true).title, "কেউ মেলাতে পারেনি!");
});

test("the sealed line follows the call", () => {
  assert.equal(sealedLine(banSl([{ pick: "d", name: "" }])), "কেউ হারবে না, এটাই আমার কথা।");
  assert.equal(sealedLine(banSl([{ pick: "bw1", name: "" }])), "শেষ ওভার পর্যন্ত নখ কামড়াতে হবে।");
  assert.equal(sealedLine(banSl([{ pick: "ar5", name: "" }])), "একতরফা খেলা হবে, লিখে রাখলাম।");
  assert.equal(sealedLine(banSl([{ pick: "bw5", name: "" }])), "মন যা-ই বলুক, খামে সত্যি কথাটাই লিখলাম।");
  assert.equal(sealedLine({ sport: "f", a: "arg", b: "bra", entries: [{ pick: "10", name: "" }], result: "" }), "শেষ বাঁশি পর্যন্ত টানটান থাকবে।");
  assert.match(sealedLine(banSl([{ pick: "a", name: "" }, { pick: "b", name: "" }])), /কে ঠিক/);
});

test("the share API normalizes, previews personally and never leaks a sealed call", () => {
  const state = shareHash(banSl([{ pick: "aw5", name: "রাফি" }])).slice(1);
  assert.equal(share.normalize(state), state);
  assert.equal(share.normalize("s=c&a=ban&b=ban&p=a"), null);
  const title = share.preview(state).title;
  assert.equal(title, nfc("রাফির ভবিষ্যদ্বাণী সিল করা খামে: বাংলাদেশ বনাম শ্রীলঙ্কা"));
  assert.ok(!title.includes("উইকেট"));
  assert.equal(previewTitle(banSl([{ pick: "aw5", name: "রাফি" }, { pick: "b", name: "মিম" }])), nfc("রাফিসহ ২ জনের ভবিষ্যদ্বাণী সিল করা খামে: বাংলাদেশ বনাম শ্রীলঙ্কা"));
  assert.equal(previewTitle(banSl([{ pick: "aw5", name: "রাফি" }], "a")), nfc("রাফি বলেছিল, মিলেও গেছে! বাংলাদেশ বনাম শ্রীলঙ্কা"));
});

test("tally counts only fixed pair + winner ids, the same either way round", () => {
  assert.equal(new Set(tallyIds).size, tallyIds.length);
  assert.deepEqual(share.tally, tallyIds);
  const pairs = (count: number) => (count * (count - 1)) / 2;
  assert.equal(tallyIds.length, 3 * (pairs(teams.c.length) + pairs(teams.f.length)));
  const id = tallyId({ sport: "c", a: "sl", b: "ban" }, "bw5");
  assert.equal(id, "c.ban-sl.ban");
  assert.equal(tallyId({ sport: "c", a: "ban", b: "sl" }, "aw1"), id);
  assert.ok(tallyIds.includes(id) && tallyIds.includes(tallyId({ sport: "f", a: "arg", b: "bra" }, "11")));
  assert.ok(tallyIds.every(item => /^[cf]\.[a-z]+-[a-z]+\.[a-z]+$/.test(item)));
});

test("the crowd split waits for enough people", () => {
  const match = { sport: "c", a: "ban", b: "sl" } as const;
  assert.equal(pairSplit(match, { "c.ban-sl.ban": 5 }).text, "");
  assert.equal(pairSplit(match, { "c.ban-sl.ban": 78, "c.ban-sl.sl": 20, "c.ban-sl.d": 2 }).text, "৭৮% বলছে বাংলাদেশ");
});
