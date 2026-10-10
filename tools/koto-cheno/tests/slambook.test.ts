import assert from "node:assert/strict";
import test from "node:test";
import { share } from "../share";
import { accusative, challengeCard, cleanName, decodePicks, difficulty, encodePicks, parseShareHash, previewText, questions, scoreCard, scoreLine, scoreOf, sentence, knowsLine, shareHash, MAX_NAME_LENGTH, type Pick } from "../lib/slambook";

const answers: Pick[] = [2, 1, 3, 0, 2, 1, 0, 3];
const allOptionLabels = questions.flatMap(question => question.options.map(option => option.label));

test("every question has four options and a unique id", () => {
  assert.equal(new Set(questions.map(question => question.id)).size, questions.length);
  for (const question of questions) assert.equal(question.options.length, 4);
});

test("answers survive the code round trip, including every extreme", () => {
  for (const picks of [answers, Array<Pick>(8).fill(0), Array<Pick>(8).fill(3), [3, 0, 3, 0, 3, 0, 3, 0] as Pick[]]) {
    const code = encodePicks(picks);
    assert.match(code, /^[0-9a-z]{1,4}$/);
    assert.deepEqual(decodePicks(code), picks);
  }
});

test("the code does not spell the answers out", () => {
  assert.doesNotMatch(encodePicks(answers), /21302103|2130/);
});

test("a challenge link brings back answers and name; a result link adds guesses and the guesser", () => {
  const challenge = { answers, name: "রাফি", guesses: null, guessName: "" };
  assert.deepEqual(parseShareHash(shareHash(challenge)), challenge);
  const result = { answers, name: "রাফি", guesses: [2, 1, 0, 0, 2, 3, 0, 3] as Pick[], guessName: "মিম" };
  assert.deepEqual(parseShareHash(shareHash(result)), result);
});

test("hostile or broken hashes are ignored instead of crashing", () => {
  for (const hash of ["", "#", "#a=", "#a=%%%", "#a=zzzzz", "#a=ZZ", "#a=1zz1", "#a=-1", "#a=" + "1".repeat(700)]) assert.equal(parseShareHash(hash), null, hash);
  // A broken guess part still opens the quiz, as a fresh challenge.
  const shared = parseShareHash(`#a=${encodePicks(answers)}&g=nope!&gn=মিম`);
  assert.deepEqual(shared, { answers, name: "", guesses: null, guessName: "" });
});

test("names are NFC, lose control and direction-override characters, and are capped", () => {
  assert.equal(cleanName("  রিমা\u202e  আক্তার\n"), "রিমা আক্তার");
  assert.equal(cleanName("ক".repeat(MAX_NAME_LENGTH + 10)).length, MAX_NAME_LENGTH);
  // য় typed precomposed or as য + nukta becomes one string (NFC keeps it decomposed).
  assert.equal(cleanName("\u09df"), cleanName("\u09af\u09bc"));
  assert.equal(parseShareHash(`#a=${encodePicks(answers)}&n=${encodeURIComponent("\u09df\u09be")}`)?.name, "\u09af\u09bc\u09be");
});

test("the score counts only matching guesses", () => {
  assert.equal(scoreOf(answers, answers), 8);
  assert.equal(scoreOf(answers, [2, 1, null, null, 0, 0, 0, 0]), 3);
});

test("score lines name the missed question, never its answer", () => {
  assert.equal(scoreLine(answers, answers, "রাফি"), "রাফির স্লাম বুক পুরো মুখস্থ!");
  const oneMiss = [...answers] as Pick[];
  oneMiss[6] = 1;
  assert.equal(scoreLine(answers, oneMiss, "রাফি"), "শুধু ভয়ের ব্যাপারটা মেলেনি, বাকি সব ঠিক!");
  assert.equal(scoreLine(answers, answers.map(pick => ((pick + 1) % 4) as Pick), ""), "নতুন করে পরিচয়টা হয়ে যাক!");
});

test("the knows line speaks in the right voice", () => {
  assert.equal(sentence(knowsLine("রাফি", "মিম", 6, true)), "মিম রাফিকে ৮-এ ৬ চেনে");
  assert.equal(sentence(knowsLine("রাফি", "", 6, true)), "আমি রাফিকে ৮-এ ৬ চিনি");
  assert.equal(sentence(knowsLine("", "", 2, false)), "এক বন্ধু বন্ধুকে ৮-এ ২ চেনে");
  assert.equal(accusative("জাহিদ"), "জাহিদকে");
  assert.equal(accusative("Nadia"), "Nadia-কে");
});

test("difficulty counts surprises against the obvious picks", () => {
  assert.deepEqual(difficulty(questions.map(question => question.common as Pick)), { surprises: 0, stars: 1 });
  assert.equal(difficulty(questions.map(question => ((question.common + 1) % 4) as Pick)).stars, 5);
});

test("previews and cards never reveal an answer before the friend guesses", () => {
  const texts = [previewText({ answers, name: "রাফি", guesses: null, guessName: "" }), previewText({ answers, name: "রাফি", guesses: answers, guessName: "মিম" })];
  for (const { title, description } of texts) for (const label of allOptionLabels) assert.ok(!title.includes(label) && !description.includes(label), label);
  const challenge = challengeCard(answers, "রাফি");
  assert.ok(allOptionLabels.every(label => !JSON.stringify(challenge).includes(label)));
  const scored = scoreCard(answers, answers, "রাফি", "মিম");
  assert.ok(allOptionLabels.every(label => !JSON.stringify(scored).includes(label)));
  assert.equal(texts[0].title, "তুমি রাফিকে কতটা চেনো? ৮টা প্রশ্নে দেখো");
  assert.equal(texts[1].title, "মিম রাফিকে ৮-এ ৮ চেনে — তুমি কতটা চেনো?");
});

test("share links keep names for the personal preview and drop junk", () => {
  const named = shareHash({ answers, name: "রাফি", guesses: null, guessName: "" }).slice(1);
  assert.equal(share.normalize(named), named);
  assert.equal(share.preview(named).title, "তুমি রাফিকে কতটা চেনো? ৮টা প্রশ্নে দেখো");
  const code = encodePicks(answers);
  assert.equal(share.normalize(`a=0${code}`), `a=${code}`);
  assert.equal(share.normalize("a=zzzzz"), null);
  assert.equal(share.preview(`a=${code}`).title, "তুমি আমাকে কতটা চেনো? ৮টা প্রশ্নে দেখো");
  assert.equal(share.preview(`a=${code}&g=${code}`).title, "আমি বন্ধুকে ৮-এ ৮ চিনি — তুমি কতটা চেনো?");
  assert.equal(share.tally, undefined);
});
