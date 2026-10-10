import assert from "node:assert/strict";
import test from "node:test";
import { blendLine, boardFull, caption, cleanName, groupLine, layoutBoard, linkMembers, parseShareHash, previewTitle, questions, ranking, reasonLine, roleOf, roles, shareHash, tallyIds, whoText, MAX_BOARD, MAX_NAME, QUESTION_COUNT, type Answer, type Member, type RoleId } from "../lib/adda";
import { site } from "../content";
import { share } from "../share";

const rafi = { answers: [0, 1, 2, 3, 0, 1, 2] as Answer[], name: "রাফি", group: [] as Member[] };
const every = () => Array.from({ length: 4 ** QUESTION_COUNT }, (_, code) => [...code.toString(4).padStart(QUESTION_COUNT, "0")].map(Number) as Answer[]);
const roleAt = (question: number, answer: number) => questions[question].options[answer].role as RoleId;

test("seven questions, each with exactly one option per role; all text NFC", () => {
  assert.equal(questions.length, 7);
  for (const question of questions) {
    assert.deepEqual(question.options.map(option => option.role).sort(), roles.map(role => role.id).sort());
    for (const text of [question.ask, ...question.options.flatMap(option => [option.label, option.line])]) assert.equal(text, text.normalize("NFC"), text);
  }
  for (const role of roles) for (const text of [role.piece, role.tag, role.line]) assert.equal(text, text.normalize("NFC"), text);
});

test("every role comes up for exactly a quarter of all 16384 answer sets", () => {
  const seen = new Map<string, number>();
  for (const answers of every()) seen.set(roleOf(answers), (seen.get(roleOf(answers)) ?? 0) + 1);
  for (const role of roles) assert.equal(seen.get(role.id), 4 ** QUESTION_COUNT / 4, role.id);
});

test("the most-picked role wins; a tie goes to the role picked last", () => {
  // queen, queen, striker, striker, white, black, ... -> pick by position to get the roles we want
  const pickFor = (question: number, id: RoleId) => questions[question].options.findIndex(option => option.role === id) as Answer;
  const answersFor = (ids: RoleId[]) => ids.map((id, index) => pickFor(index, id));
  assert.equal(roleOf(answersFor(["queen", "queen", "queen", "striker", "striker", "white", "black"])), "queen");
  assert.equal(roleOf(answersFor(["queen", "queen", "striker", "striker", "white", "black", "white"])), "white");
  assert.equal(roleOf(answersFor(["striker", "queen", "queen", "striker", "black", "black", "white"])), "black");
  assert.deepEqual(ranking(answersFor(["queen", "queen", "striker", "striker", "white", "black", "white"])), ["white", "striker", "queen", "black"]);
  // Same answers, same result, always.
  for (const answers of every().slice(0, 500)) assert.equal(roleOf(answers), roleOf([...answers]));
});

test("every blend (12 pairs + 4 pure) is reachable and none is empty", () => {
  const lines = new Set<string>();
  for (const answers of every()) { const line = blendLine(answers); assert.ok(line, answers.join("")); lines.add(line); }
  assert.equal(lines.size, 16);
});

test("the reason is always one of the person's own answers that voted for their role", () => {
  for (const answers of every()) {
    const why = reasonLine(answers);
    const index = answers.findIndex((answer, at) => questions[at].options[answer].line === why);
    assert.ok(index >= 0, answers.join(""));
    assert.equal(roleAt(index, answers[index]), roleOf(answers));
  }
});

test("no role or line is mean", () => {
  const text = [...roles.flatMap(role => [role.piece, role.tag, role.line]), ...every().slice(0, 4096).map(blendLine)].join(" ");
  assert.doesNotMatch(text, /কিপটে|লেট-লতিফ|বোকা|খারাপ|বিরক্ত|অলস|মোটা|ঝগড়াটে|স্বার্থপর|হিংসুটে|ফাঁকিবাজ/);
});

test("a result survives the share-link round trip, with and without a group", () => {
  assert.equal(shareHash(rafi), "#a=0123012&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShareHash(shareHash(rafi)), rafi);
  assert.deepEqual(parseShareHash("#a=0123012&n=রাফি"), rafi);
  const board = { ...rafi, group: [{ role: "queen", name: "মিম" }, { role: "black", name: "" }, { role: "striker", name: "Nadia Islam" }] as Member[] };
  assert.match(shareHash(board), /&g=q:%E0[^,]+,b:,s:Nadia%20Islam$/);
  assert.deepEqual(parseShareHash(shareHash(board)), board);
  assert.deepEqual(linkMembers(board).map(member => member.role), ["queen", "black", "striker", roleOf(rafi.answers)]);
});

test("hostile, partial or anchor hashes are ignored instead of crashing", () => {
  for (const hash of ["", "#result", "#board", "#a=012301", "#a=01230120", "#a=0123014", "#a=abcdefg", "#a=%%%", "#a=০১২৩০১২", `#a=0123012&g=${"x".repeat(2100)}`]) assert.equal(parseShareHash(hash), null, hash);
  assert.equal(parseShareHash("#a=0123012&n=%E0%A6")?.name, "");
  // Unknown roles, missing colons and junk are dropped; the rest of the board stays.
  assert.deepEqual(parseShareHash("#a=0123012&g=z:হাসান,q:মিম,nocolon,,w:<b>রিয়া</b>")?.group, [{ role: "queen", name: "মিম" }, { role: "white", name: "bরিয়াb".normalize("NFC") }]);
  // A name can't smuggle in extra separators: they're stripped before encoding.
  assert.equal(parseShareHash(shareHash({ ...rafi, group: [{ role: "queen", name: "মিম,s:জয়" }] }))?.group.length, 1);
});

test("a board never holds more than six people", () => {
  const crowd = Array.from({ length: 9 }, (_, index) => `w:বন্ধু${index}`).join(",");
  const shared = parseShareHash(`#a=0123012&g=${crowd}`)!;
  assert.equal(shared.group.length, MAX_BOARD - 1);
  assert.equal(linkMembers(shared).length, MAX_BOARD);
  assert.equal(boardFull(shared), true);
  assert.equal(boardFull(rafi), false);
  const tooMany = { ...rafi, group: Array.from({ length: 8 }, () => ({ role: "white" as const, name: "x" })) };
  assert.equal(parseShareHash(shareHash(tooMany))!.group.length, MAX_BOARD - 1);
});

test("names are NFC, cleaned, capped and screened", () => {
  assert.equal(cleanName("  রি‮মা \n আক্তার<i>"), "রিমা আক্তারi");
  assert.equal([...cleanName("ক".repeat(MAX_NAME + 10))].length, MAX_NAME);
  assert.equal(cleanName("ময়না"), "ময়না".normalize("NFC"));
  assert.equal(cleanName("a:b,c"), "abc");
  assert.equal(cleanName("khanki"), "");
  assert.equal(parseShareHash("#a=0123012&n=harami&g=q:harami")?.name, "");
  assert.equal(parseShareHash("#a=0123012&g=q:harami")?.group[0].name, "");
});

test("layout: alone in the middle; in a group the first queen takes the centre and the rest share a ring", () => {
  assert.deepEqual(layoutBoard([{ role: "white", name: "" }]).slots.map(slot => [slot.x, slot.y]), [[0.5, 0.5]]);
  const group: Member[] = [{ role: "white", name: "a" }, { role: "queen", name: "b" }, { role: "queen", name: "c" }, { role: "black", name: "d" }];
  const { slots, emptyCentre } = layoutBoard(group);
  assert.equal(emptyCentre, false);
  assert.equal(slots[0].index, 1);
  assert.deepEqual([slots[0].x, slots[0].y], [0.5, 0.5]);
  assert.deepEqual(slots.map(slot => slot.index).sort(), [0, 1, 2, 3]);
  for (const slot of slots.slice(1)) assert.ok(Math.abs(Math.hypot(slot.x - 0.5, slot.y - 0.5) - 0.3) < 1e-9);
  assert.equal(layoutBoard([{ role: "white", name: "" }, { role: "black", name: "" }]).emptyCentre, true);
  // Six seats never overlap: ring neighbours are farther apart than two piece diameters.
  const six = layoutBoard(Array.from({ length: 6 }, () => ({ role: "white" as const, name: "" }))).slots;
  for (const [index, slot] of six.entries()) { const next = six[(index + 1) % six.length]; assert.ok(Math.hypot(slot.x - next.x, slot.y - next.y) > slot.r * 4); }
});

test("group lines and who-text read naturally", () => {
  assert.equal(groupLine([{ role: "queen", name: "" }, { role: "striker", name: "" }, { role: "white", name: "" }, { role: "black", name: "" }]), "চার রকম গুটি, এক বোর্ড: পুরো ক্যারম সেট রেডি!");
  assert.match(groupLine([{ role: "white", name: "" }, { role: "black", name: "" }]), /কুইন কে/);
  assert.match(groupLine([{ role: "queen", name: "" }, { role: "queen", name: "" }]), /^২ কুইন/);
  assert.equal(whoText([{ role: "queen", name: "মিম" }, { role: "white", name: "রাফি" }]), "মিম আর রাফি");
  assert.equal(whoText([{ role: "queen", name: "মিম" }, { role: "white", name: "" }, { role: "black", name: "জয়" }, { role: "white", name: "" }]), "মিম, জয় আর ২ জন");
  assert.equal(whoText([{ role: "queen", name: "" }]), "তোমার বন্ধু");
});

test("share normalizes, previews personally and tallies only piece ids", () => {
  assert.equal(share.normalize("a=0123012&n=রাফি&x=1"), shareHash(rafi).slice(1));
  assert.equal(share.normalize("a=9"), null);
  const piece = roles.find(role => role.id === roleOf(rafi.answers))!.piece;
  assert.equal(share.preview(shareHash(rafi).slice(1)).title, `রাফি আড্ডার ${piece}! তুমি কোন গুটি?`);
  assert.equal(previewTitle({ ...rafi, name: "" }), `আড্ডায় আমি ${piece}! তুমি কোন গুটি?`);
  assert.equal(share.preview(shareHash({ ...rafi, group: [{ role: "queen", name: "মিম" }] }).slice(1)).title, "মিম আর রাফি এক বোর্ডে বসে গেছে — তুমি কোন গুটি?");
  assert.deepEqual(share.tally, tallyIds);
  assert.deepEqual(tallyIds, ["queen", "striker", "white", "black"]);
  assert.match(caption([{ role: "queen", name: "" }], "queen"), /^আড্ডায় আমি কুইন/);
});

test("content fits the SEO rules", () => {
  assert.ok([...site.title].length <= 45, String([...site.title].length));
  assert.ok([...site.description].length >= 120 && [...site.description].length <= 160, String([...site.description].length));
  assert.ok(site.faq.length >= 5);
  assert.match(site.privacy.join(" "), /লিংকে থাকে/);
});
