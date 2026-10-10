import assert from "node:assert/strict";
import test from "node:test";
import { bucketOf, buckets, caption, cleanName, comment, heartAge, parseShareHash, previewTitle, questions, runningAge, shareHash, tallyIds, ticketNumber, MAX_NAME, QUESTION_COUNT, type Answer } from "../lib/moner-boyos";
import { site } from "../content";
import { share } from "../share";

const rafi = { answers: [0, 1, 2, 0, 1, 1, 2, 0] as Answer[], name: "রাফি" };
const all = (answer: Answer) => Array<Answer>(QUESTION_COUNT).fill(answer);
const youngest = questions.map(question => question.options.findIndex(option => option.score === 0)) as Answer[];
const oldest = questions.map(question => question.options.findIndex(option => option.score === 2)) as Answer[];

test("eight questions, three options each, one of every score, all text NFC", () => {
  assert.equal(questions.length, 8);
  for (const question of questions) {
    assert.deepEqual(question.options.map(option => option.score).sort(), [0, 1, 2]);
    for (const text of [question.ask, ...question.options.flatMap(option => [option.label, option.line])]) assert.equal(text, text.normalize("NFC"), text);
  }
});

test("the young answer is not always in the same spot", () => {
  assert.ok(new Set(youngest).size > 1);
});

test("heart age runs 12 to 70 and every bucket is reachable", () => {
  assert.equal(heartAge(youngest), 12 + (youngest.reduce<number>((sum, answer, index) => sum + answer * (index + 1), 0) % 3));
  assert.ok(heartAge(youngest) <= 19);
  assert.ok(heartAge(oldest) >= 60 && heartAge(oldest) <= 70);
  const seen = new Set<string>();
  for (let code = 0; code < 3 ** 8; code++) {
    const answers = [...code.toString(3).padStart(8, "0")].map(Number) as Answer[];
    const age = heartAge(answers);
    assert.ok(age >= 12 && age <= 70, String(age));
    seen.add(bucketOf(age).id);
  }
  assert.deepEqual([...seen].sort(), buckets.map(bucket => bucket.id).sort());
});

test("the needle follows the answers so far and rests before the first", () => {
  assert.equal(runningAge([]), null);
  assert.ok(runningAge([youngest[0]])! < runningAge([oldest[0]])!);
});

test("the comment is one of the person's own answers and fits the bucket", () => {
  const lines = (answers: Answer[]) => answers.map((answer, index) => questions[index].options[answer].line as string);
  assert.ok(lines(rafi.answers).includes(comment(rafi.answers)));
  const scoreOfLine = (line: string) => questions.flatMap(question => [...question.options] as { line: string; score: number }[]).find(option => option.line === line)?.score;
  assert.equal(scoreOfLine(comment(youngest)), 0);
  assert.equal(scoreOfLine(comment(oldest)), 2);
});

test("no bucket line mocks an age", () => {
  const text = buckets.map(bucket => bucket.label + bucket.kind).join(" ");
  assert.doesNotMatch(text, /বুড়ো|বুড়ি|বাচ্চা|খারাপ|অসুস্থ|রোগ/);
});

test("a ticket survives the share-link round trip", () => {
  assert.equal(shareHash(rafi), "#a=01201120&n=%E0%A6%B0%E0%A6%BE%E0%A6%AB%E0%A6%BF");
  assert.deepEqual(parseShareHash(shareHash(rafi)), rafi);
  assert.deepEqual(parseShareHash("#a=01201120&n=রাফি"), rafi);
  assert.deepEqual(parseShareHash(shareHash({ answers: all(2), name: "" })), { answers: all(2), name: "" });
});

test("hostile, partial or anchor hashes are ignored instead of crashing", () => {
  for (const hash of ["", "#result", "#machine", "#a=0120112", "#a=012011200", "#a=01201123", "#a=abcdefgh", "#a=%%%", "#a=০১২০১১২০"]) assert.equal(parseShareHash(hash), null, hash);
  assert.equal(parseShareHash("#a=01201120&n=%E0%A6")?.name, "");
});

test("names are NFC, cleaned, capped and screened", () => {
  assert.equal(cleanName("  রি‮মা \n আক্তার<script>"), "রিমা আক্তারscript");
  assert.equal([...cleanName("ক".repeat(MAX_NAME + 10))].length, MAX_NAME);
  assert.equal(cleanName("রাফি"), "রাফি");
  // য় typed as য + nukta comes out as the single composed letter
  assert.equal(cleanName("ময়না"), "ময়না".normalize("NFC"));
  assert.equal(cleanName("khanki"), "");
  assert.equal(parseShareHash("#a=01201120&n=harami")?.name, "");
});

test("ticket numbers are four Bangla digits and stable", () => {
  assert.match(ticketNumber(rafi.answers), /^[০-৯]{4}$/);
  assert.equal(ticketNumber(rafi.answers), ticketNumber([...rafi.answers]));
});

test("share normalizes, previews personally and tallies only buckets", () => {
  assert.equal(share.normalize("a=01201120&n=রাফি&x=1"), shareHash(rafi).slice(1));
  assert.equal(share.normalize("a=9"), null);
  assert.match(share.preview(shareHash(rafi).slice(1)).title, /^রাফির মন [১-৭][০-৯], তোমার\?/);
  assert.equal(previewTitle(null), "মনের বয়স কত? — ৮ প্রশ্নে মেপে দেখো");
  assert.deepEqual(share.tally, tallyIds);
  assert.deepEqual(tallyIds, ["kishor", "torun", "bhora", "dighi", "bot"]);
  assert.match(caption(rafi), /মনের বয়স [১-৭][০-৯]/);
});

test("content fits the SEO rules", () => {
  assert.ok([...site.title].length <= 45);
  assert.ok([...site.description].length >= 120 && [...site.description].length <= 160);
  assert.ok(site.faq.length >= 5);
  assert.match(site.privacy.join(" "), /লিংকে থাকে/);
});
