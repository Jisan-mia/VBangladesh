import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { ART, svgDocument } from "../lib/art";
import { ALPHABET, blankWord, entryOf, LETTERS, LOOK_ALIKE, MIRROR, MIRROR_CUE, MIRROR_SHAPE, MIRROR_TWIN, splitWord, X_NOTE } from "../lib/letters";
import {
  answerOf, askOf, choiceCount, choicesFor, doneLine, FRESH_PACE, LEVEL_COUNT, LEVELS, levelOf, makeRound, methodLine, nextPace, ROUND, shouldGlow, slipLine, starsOf,
  type Item, type Pace,
} from "../lib/round";

const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

test("26 letters, A to Z, each with its own word, gloss and picture", () => {
  assert.equal(LETTERS.length, 26);
  assert.equal(ALPHABET.join(""), "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  assert.equal(new Set(LETTERS.map(entry => entry.word)).size, 26);
  assert.equal(new Set(LETTERS.map(entry => entry.bn)).size, 26);
  for (const entry of LETTERS) {
    assert.equal(entry.word[entry.at].toUpperCase(), entry.letter, entry.word);
    assert.equal(entry.at === 0, entry.letter !== "X", "only X sits inside its word");
    assert.match(entry.bn, /^[ঀ-৿ ]+$/, entry.bn);
    nfc(entry.bn);
    assert.ok(ART[entry.letter]?.includes("<path") || ART[entry.letter]?.includes("<circle"), `picture for ${entry.letter}`);
    assert.doesNotMatch(ART[entry.letter], /<script|href|url\(/, entry.letter);
    assert.match(svgDocument(entry.letter), /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  }
  assert.deepEqual(Object.keys(ART).sort(), ALPHABET);
  assert.deepEqual(["Mango", "Boat", "Rickshaw", "Jackfruit", "Box"].map(word => LETTERS.find(entry => entry.word === word)?.letter), ["M", "B", "R", "J", "X"]);
  assert.deepEqual(splitWord(entryOf("X")), ["Bo", "x", ""]);
  assert.deepEqual(splitWord(entryOf("m")), ["", "M", "ango"]);
  assert.equal(blankWord(entryOf("M")), "_ango");
  nfc(X_NOTE);
});

test("look-alikes and b d p q are well formed", () => {
  for (const [letter, near] of Object.entries(LOOK_ALIKE)) {
    assert.ok(ALPHABET.includes(letter.toUpperCase()));
    assert.ok(!near.includes(letter) && near.every(other => /^[a-z]$/.test(other)), letter);
  }
  assert.ok(!LOOK_ALIKE.i.includes("l"), "capital I and small l look the same");
  for (const letter of MIRROR) {
    assert.equal(MIRROR_TWIN[MIRROR_TWIN[letter]], letter);
    assert.ok(MIRROR_CUE[letter]);
    nfc(MIRROR_CUE[letter]);
  }
  // b and d: stick goes up from the line; p and q: down. b and p: stick on the left; d and q: on the right.
  assert.ok(MIRROR_SHAPE.b.from < 44 && MIRROR_SHAPE.d.from < 44 && MIRROR_SHAPE.p.to > 80 && MIRROR_SHAPE.q.to > 80);
  assert.ok(MIRROR_SHAPE.b.stick < MIRROR_SHAPE.b.belly && MIRROR_SHAPE.p.stick < MIRROR_SHAPE.p.belly);
  assert.ok(MIRROR_SHAPE.d.stick > MIRROR_SHAPE.d.belly && MIRROR_SHAPE.q.stick > MIRROR_SHAPE.q.belly);
});

test("rounds: six letters, none twice, from the level's own set", () => {
  assert.equal(LEVEL_COUNT, 5);
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    for (let seed = 1; seed < 60; seed++) {
      const round = makeRound(level, seed), spec = levelOf(level);
      assert.equal(round.length, ROUND);
      for (const item of round) assert.ok(spec.letters.includes(item.letter), `${level} ${item.letter}`);
      if (spec.mode === "mirror") {
        assert.deepEqual(round.filter(item => item.kind === "mirror").map(item => item.letter).sort(), ["B", "D", "P", "Q"]);
        assert.equal(round.filter(item => item.kind === "same").length, 2);
      } else assert.equal(new Set(round.map(item => item.letter)).size, ROUND);
    }
  }
  assert.ok(!LEVELS[3].letters.includes("X"), "Box starts with B, so X sits out the first-letter level");
  assert.deepEqual(makeRound(2, 7), makeRound(2, 7), "same seed, same round");
});

test("choices: the answer once, no repeats, the real mix-ups", () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    for (let seed = 1; seed < 40; seed++) {
      for (const item of makeRound(level, seed)) {
        for (const count of [2, 3, 4]) {
          const choices = choicesFor(item, level, count, seed);
          assert.equal(choices.length, count, `${level} ${item.letter} ${count}`);
          assert.equal(new Set(choices).size, count);
          assert.equal(choices.filter(value => value === answerOf(item)).length, 1);
          if (item.kind === "picture") for (const value of choices) assert.ok(levelOf(level).letters.includes(value));
          if (item.kind === "first") {
            const twins: Record<string, string[]> = { C: ["K", "Q", "S"], K: ["C", "Q"], Q: ["C", "K"], S: ["C"] };
            for (const value of choices) assert.ok(!(twins[item.letter] ?? []).includes(value), `${item.letter} vs ${value}`);
          }
        }
      }
    }
  }
  const small: Item = { kind: "small", letter: "B" };
  assert.deepEqual(choicesFor(small, 3, 3, 1).sort(), ["b", "d", "p"], "b against its mirror twins first");
  assert.ok(!choicesFor({ kind: "small", letter: "I" }, 3, 4, 5).includes("l"));
  assert.deepEqual(choicesFor({ kind: "mirror", letter: "D" }, 5, 4, 3).sort(), ["b", "d", "p", "q"]);
  assert.deepEqual(choicesFor({ kind: "same", letter: "P" }, 5, 2, 3).sort(), ["p", "q"], "eased: just the mirror twin");
});

test("asks and slip lines say what was tapped", () => {
  assert.equal(askOf({ kind: "picture", letter: "M" }), "কোন ছবির নাম M দিয়ে শুরু?");
  assert.equal(askOf({ kind: "picture", letter: "X" }), "কোন ছবির নামে x আছে?");
  assert.equal(askOf({ kind: "first", letter: "M" }), "প্রথম অক্ষরটা কী?");
  assert.equal(slipLine({ kind: "picture", letter: "M" }, "P"), "ওটা Papaya (পেঁপে), শুরু P দিয়ে।");
  assert.equal(slipLine({ kind: "picture", letter: "Y" }, "X"), "ওটা Box (বাক্স), এর শেষে x।");
  assert.equal(slipLine({ kind: "small", letter: "B" }, "d"), "ওটা ছোট হাতের d, বড় হাতের D-এর জোড়া।");
  assert.equal(slipLine({ kind: "first", letter: "M" }, "N"), "N দিয়ে শুরু Nest (পাখির বাসা)।");
  assert.match(slipLine({ kind: "mirror", letter: "B" }, "d"), /^d: আগে পেট.*b: আগে লাঠি/);
  for (let level = 1; level <= LEVEL_COUNT; level++) for (const item of makeRound(level, 3)) {
    nfc(askOf(item));
    for (const value of choicesFor(item, level, 4, 3)) if (value !== answerOf(item)) nfc(slipLine(item, value));
  }
});

test("difficulty steps: three slips ease, five right step up, never announced", () => {
  let pace: Pace = FRESH_PACE;
  assert.equal(choiceCount(pace, "picture"), 3);
  assert.equal(choiceCount(pace, "mirror"), 4);
  for (let i = 0; i < 3; i++) pace = nextPace(pace, false);
  assert.equal(pace.help, 1); assert.equal(choiceCount(pace, "picture"), 2); assert.equal(choiceCount(pace, "mirror"), 2); assert.ok(shouldGlow(pace, 0));
  pace = nextPace(pace, true);
  assert.equal(pace.help, 0); assert.ok(!shouldGlow(pace, 1)); assert.ok(shouldGlow(pace, 2), "the answer glows after two tries");
  for (let i = 0; i < 5; i++) pace = nextPace(pace, true);
  assert.equal(pace.help, -1); assert.equal(choiceCount(pace, "small"), 4);
  pace = nextPace(pace, false);
  assert.equal(pace.help, 0, "one slip drops back to normal");
});

test("stars are a record: 3 with no slip, 2 with up to two, else 1", () => {
  assert.deepEqual([0, 1, 2, 3, 9].map(starsOf), [3, 2, 2, 1, 1]);
  assert.equal(doneLine(1), "আজ ৬টা অক্ষরের ছবি মেলালাম");
  assert.equal(doneLine(3), "আজ ৬ জোড়া বড়-ছোট অক্ষর মেলালাম");
  assert.equal(methodLine(2, 1), "২বার আবার দেখেছ, তারপর মিলিয়েছ।");
  for (let level = 1; level <= LEVEL_COUNT; level++) { nfc(doneLine(level)); nfc(methodLine(0, level)); nfc(levelOf(level).title); }
});

test("no sharing of anything about the child", () => {
  assert.equal(share.normalize(""), null);
  assert.equal(share.normalize("level=1&stars=3"), null);
  assert.equal(share.tally, undefined);
});

test("the tool's source never calls fetch or imports share-client", () => {
  const root = join(import.meta.dirname, "..");
  const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
  });
  const sources = [...files(root), join(root, "../../app/abc-bazar/page.tsx")].filter(path => /\.(tsx?|css)$/.test(path));
  assert.ok(sources.length >= 10);
  for (const path of sources) {
    const code = readFileSync(path, "utf8");
    assert.doesNotMatch(code, /\bfetch\s*\(/, path);
    assert.doesNotMatch(code, /share-client|ShareBar|\/api\//, path);
    assert.doesNotMatch(code, /<input|getUserMedia|geolocation/, path);
  }
});

test("content meets the SEO limits and answers the homework question first", () => {
  assert.ok([...site.title].length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("ইংরেজি বর্ণমালা"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title && site.headline !== site.name);
  assert.ok(site.faq.length >= 6);
  assert.equal(site.faq[0].question, "ইংরেজি বর্ণমালা কয়টি?");
  assert.ok(site.faq[0].answer.startsWith("ইংরেজি বর্ণমালায় ২৬টা অক্ষর, A থেকে Z।"));
  for (const question of ["কোন বয়সের জন্য?", "ইন্টারনেট লাগে?", "কোনো তথ্য নেওয়া হয়?", "কতক্ষণ খেলবে?"]) assert.ok(site.faq.some(item => item.question === question), question);
  assert.equal(site.privacy.length, 1);
  for (const text of [site.title, site.description, site.headline!, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|করুন|দেখুন/, text);
  }
});
