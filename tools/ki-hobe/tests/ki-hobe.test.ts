import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { hasPic, moonPath } from "../lib/art";
import {
  EASE_AFTER, HARDEN_AFTER, LEVELS, LEVEL_COUNT, MIX_SIZE, cardLine, current, done, endLine, itemsFor, levelOf, newRound, next, predict,
  shownChoices, starsOf, type Round,
} from "../lib/game";
import { ITEMS, SCENE_MS } from "../lib/questions";

const root = join(import.meta.dirname, "..");
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
});
const texts = ITEMS.flatMap(item => [item.ask, item.result, item.why, item.home, item.card, ...item.choices.map(choice => choice.label)]);

/** Answers the current item, right or wrong, and moves on. */
const play = (round: Round, right: boolean) => {
  const item = current(round);
  return next(predict(round, right ? item.answer : (item.answer + 1) % item.choices.length));
};

test("13 questions, each complete: pictures, 2–3 choices, a real answer, why, a home try, a card line", () => {
  assert.equal(ITEMS.length, 13);
  assert.equal(new Set(ITEMS.map(item => item.id)).size, ITEMS.length, "no duplicate ids");
  assert.equal(new Set(ITEMS.map(item => item.ask)).size, ITEMS.length, "no duplicate questions");
  for (const item of ITEMS) {
    assert.ok(item.choices.length === 2 || item.choices.length === 3, item.id);
    assert.ok(Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.choices.length, item.id);
    assert.equal(new Set(item.choices.map(choice => choice.label)).size, item.choices.length, `${item.id}: choice labels differ`);
    for (const choice of item.choices) {
      assert.ok(choice.pics.length >= 1 && choice.pics.length <= 2, item.id);
      for (const pic of choice.pics) assert.ok(hasPic(pic), `${item.id}: picture ${pic}`);
    }
    for (const field of [item.ask, item.result, item.why, item.home, item.card]) assert.ok(field.trim().length > 4, item.id);
    assert.ok(SCENE_MS[item.scene] > 0 && SCENE_MS[item.scene] <= 5000, `${item.id}: a short scene`);
    if (item.scene === "pond") {
      assert.ok(item.drop && item.floats, item.id);
      for (const pic of item.drop!) assert.ok(hasPic(pic));
    }
  }
});

test("Bangla is NFC, তুমি voice, Bangla digits only", () => {
  for (const text of texts) {
    assert.equal(text, text.normalize("NFC"), text);
    assert.doesNotMatch(text, /আপনি|আপনার|করুন|[0-9]/, text);
  }
});

test("the facts the brief asks for (checked against NASA, USGS, Britannica)", () => {
  const byId = Object.fromEntries(ITEMS.map(item => [item.id, item]));
  const answer = (id: string) => byId[id].choices[byId[id].answer].label;
  assert.equal(answer("narkel-it"), "নারকেল");
  assert.deepEqual(byId["narkel-it"].floats, [true, false]);
  assert.deepEqual(byId["pata-chamoch"].floats, [true, false], "dry leaf floats, steel spoon sinks");
  assert.deepEqual(byId["botol-vela"].floats, [true, true], "capped bottle and banana raft both float");
  assert.equal(answer("borof"), "রোদেরটা");
  assert.equal(answer("pathor-palok"), "পাথর", "in air the feather drifts");
  assert.equal(answer("chande-pora"), "একসাথে", "Apollo 15: hammer and feather land together");
  assert.match(byId["chande-pora"].why, /১৯৭১/);
  assert.equal(answer("chaya"), "বিকেলে");
  assert.equal(answer("bij"), "পানি আর আলো");
  assert.match(byId["bij"].why, /অন্ধকারে চারা বের হলো/, "seeds sprout in the dark; light makes them green");
  assert.equal(answer("chumbok"), "কাগজের ক্লিপ");
  assert.equal(answer("akash"), "রোদের আলো ছড়ায়");
  assert.equal(answer("brishti"), "নদী-সাগর থেকে");
  assert.match(byId["brishti"].why, /পানিচক্র/);
  assert.equal(answer("chand"), "আলোর দিকটা কম-বেশি দেখি", "not the earth's shadow");
  assert.match(byId["chand"].why, /সাড়ে ২৯ দিন/);
  assert.equal(answer("sutor-phone"), "অন্য কাপে শোনা যাবে");
});

test("home tries are safe: no fire, heat, sharp things or electricity", () => {
  for (const item of ITEMS) assert.doesNotMatch(item.home, /আগুন|গরম|চুলা|মোমবাতি|ছুরি|কাঁচি|সুই|পিন|ব্লেড|ফুটো|বিদ্যুৎ|প্লাগ|ব্যাটারি|টর্চ|সূর্যের দিকে তাকাও/, item.id);
});

test("levels: three sets in order, then a mix of five; every set item appears once", () => {
  assert.equal(LEVEL_COUNT, 4);
  assert.deepEqual(LEVELS.map(level => level.set), [1, 2, 3, "mix"]);
  for (const set of [1, 2, 3] as const) {
    const items = itemsFor(set, 9);
    assert.ok(items.length >= 4 && items.length <= 5, `set ${set}`);
    assert.deepEqual([...items].map(item => item.id).sort(), ITEMS.filter(item => item.set === set).map(item => item.id).sort());
  }
  const mix = itemsFor(4, 9);
  assert.equal(mix.length, MIX_SIZE);
  assert.equal(new Set(mix).size, MIX_SIZE);
  assert.deepEqual(itemsFor(4, 9), mix, "same seed, same order");
  assert.equal(levelOf(0), LEVELS[0]);
  assert.equal(levelOf(99), LEVELS[LEVEL_COUNT - 1]);
});

test("a prediction plays once; next moves on; the round ends", () => {
  let round = newRound(1, 3);
  assert.equal(round.picked, null);
  assert.equal(next(round), round, "can't skip without a guess");
  round = predict(round, current(round).answer);
  assert.equal(round.right, 1);
  assert.equal(predict(round, 0), round, "one guess per question");
  while (!done(round)) round = round.picked === null ? play(round, true) : next(round);
  assert.equal(round.index, round.items.length);
});

test("difficulty: three missed guesses drop a third choice, five right bring it back", () => {
  const three = ITEMS.find(item => item.choices.length === 3)!;
  assert.equal(shownChoices(three, false).length, 3);
  const eased = shownChoices(three, true);
  assert.equal(eased.length, 2);
  assert.ok(eased.includes(three.answer));
  const two = ITEMS.find(item => item.choices.length === 2)!;
  assert.deepEqual(shownChoices(two, true), [0, 1]);

  let round = newRound(4, 5);
  for (let i = 0; i < EASE_AFTER - 1; i++) round = play(round, false);
  assert.equal(round.easy, false);
  round = play(round, false);
  assert.equal(round.easy, true, `easy after ${EASE_AFTER} misses in a row`);
  round = newRound(4, 5, true);
  for (let i = 0; i < HARDEN_AFTER - 1; i++) round = play(round, true);
  assert.equal(round.easy, true);
  round = play(round, true);
  assert.equal(round.easy, false, `back to normal after ${HARDEN_AFTER} right in a row`);
  assert.equal(newRound(2, 1, true).easy, true, "a replay keeps the eased pace, silently");
});

test("stars: all matched 3, at least half 2, else 1, never 0", () => {
  assert.equal(starsOf(4, 4), 3);
  assert.equal(starsOf(3, 4), 2);
  assert.equal(starsOf(2, 4), 2);
  assert.equal(starsOf(1, 4), 1);
  assert.equal(starsOf(0, 5), 1);
  assert.equal(starsOf(3, 5), 2);
  assert.equal(starsOf(2, 5), 1);
  assert.equal(endLine(3, 4), "৪টা প্রশ্নে ৩টা আন্দাজ মিলল।");
});

test("moon phases: new is empty, half has a straight edge, full is a whole circle", () => {
  assert.match(moonPath(0, 10), /A10\.00 10 0 0 0 0 -10Z$/, "new: back along the same edge");
  assert.match(moonPath(0.25, 10), /A0\.00 10/, "half: straight terminator");
  assert.match(moonPath(0.5, 10), /A10\.00 10 0 0 1 0 -10Z$/, "full: round the other side");
  assert.match(moonPath(0.125, 10), /^M0 -10A10 10 0 0 1 0 10/, "waxing: lit on the right");
});

test("card line carries no name", () => {
  assert.equal(cardLine(4), "আজ ৪টা প্রশ্নে আগে ভাবলাম, তারপর দেখলাম");
});

test("share never makes a link and has no tally", () => {
  assert.equal(share.normalize("level=1"), null);
  assert.equal(share.normalize(""), null);
  assert.equal(share.tally, undefined);
  assert.ok(share.preview("x").title.length > 0);
});

test("no network: the tool's source never calls fetch or imports share-client", () => {
  const sources = [...files(root), join(root, "../../app/ki-hobe/page.tsx")];
  assert.ok(sources.length >= 10);
  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /\bfetch\s*\(/, file);
    assert.doesNotMatch(text, /share-client|ShareBar|sendBeacon|XMLHttpRequest|\/api\//, file);
    assert.doesNotMatch(text, /letter-spacing:\s*[^0]/, file);
    assert.equal(text, text.normalize("NFC"), `${file} is NFC`);
  }
});

test("content meets the SEO limits and the kids' rules", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("আকাশ কেন নীল"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 6);
  assert.equal(site.faq[0].question, "আকাশ কেন নীল?");
  assert.match(site.faq[0].answer, /^রোদের আলো বাতাসের খুব ছোট কণায় লেগে চারদিকে ছড়ায়/);
  const questions = site.faq.map(item => item.question).join(" ");
  for (const must of ["পানিচক্র কাকে বলে", "চাঁদ কেন ছোট-বড় হয়", "কোন বয়সের", "ইন্টারনেট", "তথ্য", "কতক্ষণ"]) assert.ok(questions.includes(must), must);
  assert.equal(site.privacy.length, 1);
  assert.ok(site.headline && site.headline !== site.title);
  for (const text of [site.title, site.description, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    assert.equal(text, text.normalize("NFC"));
    assert.doesNotMatch(text, /আপনি|আপনার|করুন/, "তুমি voice");
  }
});
