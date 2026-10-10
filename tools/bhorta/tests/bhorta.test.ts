import assert from "node:assert/strict";
import test from "node:test";
import { bhortaOf, bhortas, caption, cleanName, pairLine, parseShareHash, previewTitle, questions, reason, shareHash, tallyIds, MAX_NAME, QUESTION_COUNT, type Answer } from "../lib/bhorta";
import { site } from "../content";
import { share } from "../share";

const rafi = { answers: [0, 1, 2, 2, 1, 0] as Answer[], name: "রাফি" };
const every = () => Array.from({ length: 3 ** QUESTION_COUNT }, (_, code) => [...code.toString(3).padStart(QUESTION_COUNT, "0")].map(Number) as Answer[]);

test("six questions, three options, two known votes each; all text NFC", () => {
  assert.equal(questions.length, 6);
  const ids = new Set<string>(bhortas.map(bhorta => bhorta.id));
  for (const question of questions) {
    assert.equal(question.options.length, 3);
    for (const option of question.options) {
      assert.equal(option.votes.length, 2);
      for (const id of option.votes) assert.ok(ids.has(id), id);
    }
    for (const text of [question.ask, ...question.options.flatMap(option => [option.label, option.line])]) assert.equal(text, text.normalize("NFC"), text);
  }
  for (const bhorta of bhortas) for (const text of [bhorta.name, bhorta.tag, bhorta.line]) assert.equal(text, text.normalize("NFC"), text);
});

test("every bhorta gets four votes and comes up for at least 9% of answers", () => {
  const votes = new Map<string, number>();
  for (const question of questions) for (const option of question.options) for (const id of option.votes) votes.set(id, (votes.get(id) ?? 0) + 1);
  for (const bhorta of bhortas) assert.equal(votes.get(bhorta.id), 4, bhorta.id);
  const seen = new Map<string, number>();
  for (const answers of every()) seen.set(bhortaOf(answers).id, (seen.get(bhortaOf(answers).id) ?? 0) + 1);
  for (const bhorta of bhortas) assert.ok((seen.get(bhorta.id) ?? 0) >= 3 ** QUESTION_COUNT * 0.09, `${bhorta.id}: ${seen.get(bhorta.id)}`);
});

test("the reason is always one of the person's own answers that voted for the result", () => {
  for (const answers of every()) {
    const why = reason(answers);
    const index = answers.findIndex((answer, at) => questions[at].options[answer].line === why);
    assert.ok(index >= 0, answers.join(""));
    assert.ok((questions[index].options[answers[index]].votes as readonly string[]).includes(bhortaOf(answers).id));
  }
});

test("no result is mean", () => {
  const text = bhortas.map(bhorta => bhorta.tag + bhorta.line).join(" ");
  assert.doesNotMatch(text, /বোকা|খারাপ|বিরক্ত|অলস|কিপটে|মোটা|ঝগড়াটে|স্বার্থপর/);
});

test("a plate survives the share-link round trip", () => {
  assert.equal(shareHash(rafi), "#a=012210&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShareHash(shareHash(rafi)), rafi);
  assert.deepEqual(parseShareHash("#a=012210&n=রাফি"), rafi);
  const plain = { answers: [2, 2, 2, 2, 2, 2] as Answer[], name: "" };
  assert.deepEqual(parseShareHash(shareHash(plain)), plain);
});

test("hostile, partial or anchor hashes are ignored instead of crashing", () => {
  for (const hash of ["", "#result", "#shilpata", "#a=01221", "#a=0122100", "#a=012213", "#a=abcdef", "#a=%%%", "#a=০১২২১০"]) assert.equal(parseShareHash(hash), null, hash);
  assert.equal(parseShareHash("#a=012210&n=%E0%A6")?.name, "");
});

test("names are NFC, cleaned, capped and screened", () => {
  assert.equal(cleanName("  রি‮মা \n আক্তার<script>"), "রিমা আক্তারscript");
  assert.equal([...cleanName("ক".repeat(MAX_NAME + 10))].length, MAX_NAME);
  // য় typed as য + nukta comes out as the single composed letter
  assert.equal(cleanName("ময়না"), "ময়না".normalize("NFC"));
  assert.equal(cleanName("khanki"), "");
  assert.equal(parseShareHash("#a=012210&n=harami")?.name, "");
});

test("a friend's plate adds a pair line with both bhortas", () => {
  const mim = { answers: [2, 2, 2, 2, 2, 2] as Answer[], name: "মিম" };
  const line = pairLine(rafi, mim);
  assert.ok(line.startsWith(`রাফি ${bhortaOf(rafi.answers).name.replace(/ ভর্তা$/, "")}`), line);
  assert.match(pairLine(rafi, { ...rafi, name: "মিম" }), /দুজনেই/);
  assert.match(pairLine({ ...rafi, name: "" }, { ...mim, name: "" }), /^আমি .+, বন্ধু /);
});

test("share normalizes, previews personally and tallies only bhorta ids", () => {
  assert.equal(share.normalize("a=012210&n=রাফি&x=1"), shareHash(rafi).slice(1));
  assert.equal(share.normalize("a=9"), null);
  assert.equal(share.preview(shareHash(rafi).slice(1)).title, `রাফি হলো ${bhortaOf(rafi.answers).name}, তুমি কোনটা?`);
  assert.equal(previewTitle(null), site.title);
  assert.deepEqual(share.tally, tallyIds);
  assert.equal(tallyIds.length, 9);
  assert.match(caption(rafi), /^শিলপাটায় বেটে দেখলাম, আমি .+ ভর্তা!/);
});

test("content fits the SEO rules", () => {
  assert.ok([...site.title].length <= 45);
  assert.ok([...site.description].length >= 120 && [...site.description].length <= 160, String([...site.description].length));
  assert.ok(site.faq.length >= 5);
  assert.match(site.privacy.join(" "), /লিংকে থাকে/);
});
