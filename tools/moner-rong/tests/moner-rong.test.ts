import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { FACES, FEELINGS, ORDER } from "../lib/faces";
import {
  addToday, alsoLine, chooseKind, endLine, facesFor, glows, listWords, nameFeeling, newRound, nextScene, practised, sayLine, sceneOf, scenesOf,
  SCENES, SETS, SET_COUNT, type Round,
} from "../lib/scenes";

const root = join(import.meta.dirname, "..");
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
});
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

/** Plays a whole set: names the first fitting face (after `missFirst` misses on each scene), picks the first kind choice. */
function play(set: number, missFirst = 0, start?: Round) {
  let round = start ?? newRound(set);
  for (let guard = 0; guard < 50; guard++) {
    const scene = sceneOf(round);
    for (let miss = 0; miss < missFirst; miss++) {
      const wrong = round.faces.find(feeling => !scene.feels.includes(feeling));
      if (wrong) round = nameFeeling(round, wrong).round;
    }
    round = nameFeeling(round, round.faces.find(feeling => scene.feels.includes(feeling))!).round;
    round = chooseKind(round, 0);
    const next = nextScene(round);
    if (!next) return round;
    round = next;
  }
  throw new Error("a set always ends");
}

test("six feelings, each with a word, two colours, a mirror phrase and a face", () => {
  assert.deepEqual(ORDER.map(feeling => FEELINGS[feeling].word), ["খুশি", "মন খারাপ", "রাগ", "ভয়", "অবাক", "লজ্জা"]);
  for (const feeling of ORDER) {
    const info = FEELINGS[feeling];
    nfc(info.word); nfc(info.mirror);
    assert.match(info.color, /^#[0-9a-f]{6}$/); assert.match(info.light, /^#[0-9a-f]{6}$/);
    assert.ok(FACES[feeling].length >= 3, feeling);
  }
  assert.equal(new Set(ORDER.map(feeling => FEELINGS[feeling].color)).size, 6, "every feeling has its own colour");
  assert.ok(FACES.calm.length > 0);
});

test("15–20 scenes, each complete, unique and NFC, with one to three fitting feelings and two kind choices", () => {
  assert.ok(SCENES.length >= 15 && SCENES.length <= 20, String(SCENES.length));
  assert.equal(new Set(SCENES.map(scene => scene.id)).size, SCENES.length);
  assert.equal(new Set(SCENES.map(scene => scene.text)).size, SCENES.length);
  assert.equal(new Set(SCENES.map(scene => scene.prop)).size, SCENES.length, "every scene has its own picture");
  for (const scene of SCENES) {
    for (const text of [scene.who, scene.whose, scene.text, scene.clue, scene.ask, scene.q ?? "", ...scene.kind.flatMap(kind => [kind.text, kind.after])]) nfc(text);
    assert.ok(scene.feels.length >= 1 && scene.feels.length <= 3, scene.id);
    assert.equal(new Set(scene.feels).size, scene.feels.length, scene.id);
    assert.ok(scene.text.includes(scene.who), `${scene.id}: the sentence names the child we read`);
    assert.ok(scene.whose.startsWith(scene.who), scene.id);
    assert.equal(scene.kind.length, 2);
    assert.notEqual(scene.kind[0].text, scene.kind[1].text);
    assert.match(scene.ask, /\?$/, `${scene.id}: the parent prompt is a question`);
    assert.doesNotMatch([scene.text, scene.clue, ...scene.kind.map(kind => kind.text)].join(" "), /ভুল উত্তর|খারাপ ছেলে|খারাপ মেয়ে|লজ্জার কথা/, "never shame a feeling");
  }
  assert.ok(SCENES.filter(scene => scene.feels.length > 1).length >= 6, "plenty of two-feeling scenes");
  for (const feeling of ORDER) assert.ok(SCENES.some(scene => scene.feels.includes(feeling)), `${feeling} appears`);
});

test("every scene sits in exactly one set; sets grow from two faces to six and always offer one face that doesn't fit", () => {
  const used = SETS.flatMap(set => set.scenes);
  assert.deepEqual([...used].sort(), SCENES.map(scene => scene.id).sort());
  assert.deepEqual(SETS.map(set => set.pool.length), [2, 3, 4, 4, 6, 6]);
  SETS.forEach((set, index) => {
    nfc(set.title);
    assert.ok(set.scenes.length >= 3 && set.scenes.length <= 4);
    for (const scene of scenesOf(index + 1)) {
      assert.ok(scene.feels.every(feeling => set.pool.includes(feeling)), `${scene.id} fits its set`);
      assert.ok(set.pool.some(feeling => !scene.feels.includes(feeling)), `${scene.id} has a face that doesn't fit`);
    }
  });
  assert.ok(scenesOf(SET_COUNT).every(scene => scene.feels.length >= 2), "the last set is all two-feeling scenes");
  assert.equal(new Set(SETS.map(set => set.title)).size, SET_COUNT);
});

test("faces on offer: the set's faces in a fixed order; eased offers what fits plus one", () => {
  const ghuri = SCENES.find(scene => scene.id === "ghuri")!;
  assert.deepEqual(facesFor(ghuri, 2, false), ["khushi", "mon-kharap", "rag"]);
  const baj = SCENES.find(scene => scene.id === "baj")!;
  assert.deepEqual(facesFor(baj, 5, false), ORDER);
  assert.deepEqual(facesFor(baj, 5, true), ["khushi", "bhoy", "obak"]);
});

test("naming: a face that fits moves on; one that doesn't costs a try; after two tries the fitting faces glow", () => {
  let round = newRound(2);
  assert.equal(sceneOf(round).id, "ghuri");
  let result = nameFeeling(round, "khushi");
  assert.equal(result.outcome, "again");
  round = result.round;
  assert.equal(glows(round), false);
  round = nameFeeling(round, "khushi").round;
  assert.equal(glows(round), true);
  result = nameFeeling(round, "rag");
  assert.equal(result.outcome, "fits");
  assert.equal(result.round.step, "kind");
  assert.deepEqual(result.round.named, ["rag"]);
  assert.equal(nameFeeling(result.round, "mon-kharap").outcome, "ignore", "no second naming once it fits");
  assert.equal(nameFeeling(newRound(1), "bhoy").outcome, "ignore", "a face not on offer is ignored");
  assert.equal(chooseKind(newRound(1), 0).step, "name", "no kind choice before naming");
});

test("three misses in a row quietly ease the next scene; five first-try fits lift it, only between scenes", () => {
  let round = newRound(5);
  for (let index = 0; index < 3; index++) round = nameFeeling(round, "khushi").round;
  assert.ok(round.eased);
  assert.equal(round.faces.length, 6, "faces never change under a finger");
  round = chooseKind(nameFeeling(round, "bhoy").round, 1);
  round = nextScene(round)!;
  assert.equal(round.faces.length, sceneOf(round).feels.length + 1);
  // Five first-try fits across rounds lift the ease.
  let fits = 0;
  while (round.eased) {
    assert.ok(fits < 12);
    const scene = sceneOf(round);
    round = chooseKind(nameFeeling(round, scene.feels[0]).round, 0);
    fits++;
    round = nextScene(round) ?? newRound(6, round.eased && round.rightRun < 5, round.rightRun);
  }
  assert.ok(fits >= 5);
  assert.equal(round.faces.length, 6);
});

test("a whole set ends after its scenes, never auto-advancing, and names what fitted", () => {
  for (let set = 1; set <= SET_COUNT; set++) {
    const round = play(set, set % 2);
    assert.equal(round.index, scenesOf(set).length - 1);
    assert.equal(round.step, "after");
    assert.equal(nextScene(round), null);
    assert.ok(round.named.length >= 1);
  }
  assert.equal(endLine(play(1)), "৩টা ছবিতে মন চিনলে: খুশি আর মন খারাপ।");
});

test("stars mark practice only: one more per play-through, up to three, whatever was missed", () => {
  assert.equal(practised(0), 1);
  assert.equal(practised(1), 2);
  assert.equal(practised(2), 3);
  assert.equal(practised(3), 3);
  assert.equal(practised(-4), 1);
});

test("feeling lines read the way children say them", () => {
  const ghuri = SCENES.find(scene => scene.id === "ghuri")!;
  assert.equal(sayLine(ghuri, "mon-kharap"), "রাফির মন খারাপ।");
  assert.equal(sayLine(ghuri, "rag"), "রাফির রাগ হচ্ছে।");
  assert.equal(alsoLine(ghuri, "rag"), "রাগ আর মন খারাপ, দুটোই হতে পারে।");
  assert.equal(alsoLine(SCENES[0], "khushi"), "");
  assert.equal(alsoLine(SCENES.find(scene => scene.id === "cake")!, "obak"), "অবাক, রাগ, মন খারাপ, তিনটাই হতে পারে।");
  assert.equal(listWords(["lojja", "khushi", "bhoy"]), "খুশি, ভয় আর লজ্জা");
});

test("today's card counts scenes and feelings, with no name", () => {
  let today = addToday({ scenes: 0, feelings: [] }, play(1));
  today = addToday(today, play(2));
  assert.equal(today.scenes, 6);
  assert.deepEqual(today.feelings, ["khushi", "mon-kharap"], "the first face that fits, in face order");
});

test("share never makes a link and has no tally", () => {
  assert.equal(share.normalize("set=1"), null);
  assert.equal(share.normalize(""), null);
  assert.equal(share.tally, undefined);
  assert.ok(share.preview("x").title.length > 0);
});

test("no network: the tool's source never calls fetch or imports share-client", () => {
  const sources = [...files(root), join(root, "../../app/moner-rong/page.tsx")];
  assert.ok(sources.length >= 9);
  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /\bfetch\s*\(/, file);
    assert.doesNotMatch(text, /share-client|ShareBar|sendBeacon|XMLHttpRequest|\/api\//, file);
    assert.equal(text, text.normalize("NFC"), `${file} is NFC`);
  }
});

test("content meets the SEO limits and the kids' rules", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("ছোটদের অনুভূতি চেনার খেলা"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.faq.length >= 6);
  assert.match(site.faq[0].answer, /^সাধারণত ছয়টা/);
  const questions = site.faq.map(item => item.question).join(" ");
  for (const must of ["কোন বয়সের", "ইন্টারনেট", "তথ্য", "কতক্ষণ"]) assert.ok(questions.includes(must), must);
  assert.equal(site.privacy.length, 1);
  assert.ok(site.headline && site.headline !== site.title);
  for (const text of [site.title, site.description, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|আপনার|করুন/, "তুমি voice");
  }
});
