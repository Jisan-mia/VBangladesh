import assert from "node:assert/strict";
import test from "node:test";
import { share } from "../share";
import { site } from "../content";
import {
  cleanLetter, cleanText, countdown, defaultLetter, isSealed, letterCard, letterHeader, letterState, objective, openChoices, openLabel, parseShared, previewTitle,
  recipients, replies, replyState, sheetOf, MAX_NAME, MAX_TEXT, type Letter,
} from "../lib/chithi";

const TODAY = "2026-10-10";
const letter: Letter = { to: "amma", dear: "আম্মু", lines: [1, 2, 0], text: "এবার ঈদে বাড়ি আসছি।", from: "রিয়াদ", open: "", written: TODAY };

test("a letter survives the link round trip", () => {
  assert.deepEqual(parseShared(letterState(letter)), { kind: "letter", letter });
  assert.deepEqual(parseShared("#" + letterState(letter)), { kind: "letter", letter });
  const future: Letter = { ...defaultLetter("future"), lines: [2, 1, 0], open: "2027-04-14", from: "মিম", written: TODAY };
  assert.deepEqual(parseShared(letterState(future)), { kind: "letter", letter: future });
});

test("a reply survives the link round trip", () => {
  const reply = { re: "pani", by: "ammu", to: "রিয়াদ" } as const;
  assert.deepEqual(parseShared(replyState(reply)), { kind: "reply", reply });
});

test("the default addressee stays out of the link; a custom one travels", () => {
  assert.ok(!letterState(letter).includes("n="));
  const nanu = { ...letter, dear: "নানু" };
  assert.equal((parseShared(letterState(nanu)) as { letter: Letter }).letter.dear, "নানু");
});

test("the letter reads like a letter: greeting, lines, own words in the middle, sign-off", () => {
  const sheet = sheetOf(letter);
  assert.equal(sheet.greeting, "প্রিয় আম্মু,");
  assert.deepEqual(sheet.body, [recipients[0].lines[0][1], recipients[0].lines[1][2], "এবার ঈদে বাড়ি আসছি।", recipients[0].lines[2][0]]);
  assert.equal(sheet.signer, "তোমার আদরের রিয়াদ");
  assert.equal(sheet.date, "১০ অক্টোবর ২০২৬");
  assert.equal(sheetOf(defaultLetter("bondhu")).signer, "তোর বন্ধু");
});

test("every recipient has three lines in each of the three sections", () => {
  for (const item of recipients) assert.deepEqual(item.lines.map(options => options.length), [3, 3, 3], item.id);
  assert.equal(new Set(recipients.map(item => item.id)).size, recipients.length);
  assert.equal(new Set(replies.map(item => item.id)).size, replies.length);
});

test("headers name sender and receiver in natural Bangla", () => {
  assert.equal(letterHeader(letter), "রিয়াদ থেকে আম্মুকে");
  assert.equal(letterHeader(defaultLetter()), "আম্মুকে লেখা চিঠি");
  assert.equal(letterHeader({ ...defaultLetter("future"), from: "মিম" }), "মিম থেকে ভবিষ্যতের মিমকে");
  assert.equal(objective("Nadia"), "Nadia-কে");
  assert.equal(objective("ভবিষ্যতের আমি"), "ভবিষ্যতের আমাকে");
});

test("a future letter stays sealed until its day, then opens", () => {
  const future = { ...defaultLetter("future"), open: "2027-04-14" };
  assert.equal(isSealed(future, TODAY), true);
  assert.equal(isSealed(future, "2027-04-14"), false);
  assert.equal(letterCard(future, TODAY).seal?.days, 186);
  assert.equal(letterCard(future, TODAY).seal?.label, "১ বৈশাখ ১৪৩৪");
  assert.equal(countdown(1), "কাল খোলা যাবে");
  // Only future-self letters seal; an open date on another letter is dropped.
  assert.equal(cleanLetter({ ...letter, open: "2027-04-14" }).open, "");
});

test("open-date choices: next New Year, next Pohela Boishakh, a year from today", () => {
  assert.deepEqual(openChoices(TODAY).map(choice => choice.date), ["2027-01-01", "2027-04-14", "2027-10-10"]);
  assert.equal(openChoices("2027-03-01")[1].date, "2027-04-14");
  assert.equal(openLabel("2027-04-14"), "১ বৈশাখ ১৪৩৪");
  assert.equal(openLabel("2027-01-01"), "১ জানুয়ারি ২০২৭");
});

test("hostile links are rejected or cleaned, never trusted", () => {
  assert.equal(parseShared(""), null);
  assert.equal(parseShared("#to=boss"), null);
  assert.equal(parseShared("#re=evil&by=ammu"), null);
  assert.equal(parseShared("#re=bhore&by=boss"), null);
  assert.equal(parseShared("#%%%"), null);
  const odd = parseShared("#to=amma&l=9,x,1&open=2027-04-14&w=2026-02-31&from=" + encodeURIComponent("রিমা‮\u0000 আক্তার"));
  assert.deepEqual(odd && odd.kind === "letter" && [odd.letter.lines, odd.letter.open, odd.letter.written, odd.letter.from], [[0, 0, 0], "", "", "রিমা আক্তার"]);
});

test("free text is NFC, one line, stripped of control and bidi characters, and capped", () => {
  assert.equal(cleanText("  ভালো‏ থেকো\n\nআম্মু⁦ ", 50), "ভালো থেকো আম্মু");
  assert.equal(cleanText("য়", 5), "য়".normalize("NFC"));
  assert.equal([...cleanText("ক".repeat(MAX_TEXT + 40), MAX_TEXT)].length, MAX_TEXT);
  assert.equal(cleanText("😀".repeat(30), MAX_NAME), "😀".repeat(MAX_NAME));
  const long = parseShared("#to=amma&t=" + encodeURIComponent("খ".repeat(500)));
  assert.ok(long && long.kind === "letter" && [...long.letter.text].length === MAX_TEXT);
});

test("share.ts normalizes links and previews never reveal the letter's words", () => {
  assert.equal(share.normalize(letterState(letter)), letterState(letter));
  assert.equal(share.normalize("to=nobody"), null);
  const title = previewTitle({ kind: "letter", letter }, TODAY);
  assert.equal(title, "রিয়াদ থেকে আম্মুকে — খামে একটা চিঠি");
  assert.ok(!share.preview(letterState(letter)).title.includes("ঈদে"));
  assert.ok(!share.preview(letterState(letter)).description.includes("ঈদে"));
  assert.equal(previewTitle({ kind: "letter", letter: { ...defaultLetter("future"), open: "2027-04-14" } }, TODAY), "ভবিষ্যতের আমাকে লেখা চিঠি — খুলবে ১ বৈশাখ ১৪৩৪");
  assert.equal(share.tally, undefined);
});

test("content meets the SEO bar", () => {
  assert.ok(site.title.length <= 45, site.title);
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 5);
  assert.ok(site.privacy.some(line => line.includes("গোপন নয়")));
});
