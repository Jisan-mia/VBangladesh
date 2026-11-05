import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { hasPic, moonPath } from "../lib/art";
import { ITEMS } from "../lib/items";
import { cardLine, endLine, matchLine } from "../lib/lines";

const root = join(import.meta.dirname, "..");
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
});
const texts = ITEMS.flatMap(item => [item.ask, item.result, item.why, item.home, item.card, ...item.choices.map(choice => choice.label)]);

test("21 experiments, each complete: pictures, 2–3 choices, a real answer, why, a home try, a card line", () => {
  assert.equal(ITEMS.length, 21);
  assert.equal(new Set(ITEMS.map(item => item.id)).size, ITEMS.length, "no duplicate ids");
  assert.equal(new Set(ITEMS.map(item => item.ask)).size, ITEMS.length, "no duplicate questions");
  for (const item of ITEMS) {
    assert.ok(item.choices.length === 2 || item.choices.length === 3, item.id);
    assert.ok(Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.choices.length, item.id);
    assert.equal(new Set(item.choices.map(choice => choice.label)).size, item.choices.length, `${item.id}: choice labels differ`);
    assert.ok(hasPic(item.verb), `${item.id}: the question has its picture`);
    for (const choice of item.choices) {
      assert.ok(choice.pics.length >= 1 && choice.pics.length <= 2, item.id);
      for (const pic of choice.pics) assert.ok(hasPic(pic), `${item.id}: picture ${pic}`);
    }
    for (const field of [item.ask, item.result, item.why, item.home, item.card]) assert.ok(field.trim().length > 4, item.id);
    assert.ok(item.ms >= 2400 && item.ms <= 4000, `${item.id}: a short experiment`);
    if (item.scene === "pond") { assert.ok(item.drop && item.floats, item.id); for (const pic of item.drop!) assert.ok(hasPic(pic)); }
    if (item.scene === "fall" || item.scene === "moonfall") { assert.ok(item.duo && item.drifts, item.id); for (const pic of item.duo!) assert.ok(hasPic(pic)); }
    if (item.scene === "magnet") assert.equal(item.choices.length, 3, "the magnet sweeps three things");
  }
});

test("the answers are spread: not always the first, not always the last", () => {
  const counts = [0, 0, 0];
  for (const item of ITEMS) counts[item.answer] += 1;
  assert.ok(counts[0] >= 4 && counts[1] >= 4 && counts[2] >= 4, counts.join(","));
});

test("Bangla is NFC, তুমি voice, Bangla digits only", () => {
  for (const text of texts) {
    assert.equal(text, text.normalize("NFC"), text);
    assert.doesNotMatch(text, /আপনি|আপনার|করুন|[0-9]/, text);
  }
});

test("the facts (checked against NASA, USGS, Britannica)", () => {
  const byId = Object.fromEntries(ITEMS.map(item => [item.id, item]));
  const answer = (id: string) => byId[id].choices[byId[id].answer].label;
  assert.equal(answer("narkel-it"), "নারকেল");
  assert.deepEqual(byId["narkel-it"].floats, [true, false]);
  assert.deepEqual(byId["pata-chamoch"].floats, [true, false], "dry leaf floats, steel spoon sinks");
  assert.deepEqual(byId["aloo-bol"].floats, [false, true], "a raw potato sinks, a plastic ball floats");
  assert.deepEqual(byId["botol-vela"].floats, [true, true], "capped bottle and banana raft both float");
  assert.deepEqual(byId["pathor-poisha"].floats, [false, false], "stone and metal coin both sink");
  assert.equal(answer("pathor-poisha"), "দুটোই ডুববে");
  assert.deepEqual(byId["kath-pathor"].floats, [true, false]);
  assert.equal(answer("borof"), "রোদেরটা");
  assert.equal(answer("pathor-palok"), "পাথর", "in air the feather drifts");
  assert.deepEqual(byId["kagoj"].drifts, [false, true], "the flat sheet drifts, the crumpled ball drops");
  assert.equal(answer("kagoj"), "দলা কাগজ");
  assert.equal(answer("chande-pora"), "একসাথে", "Apollo 15: hammer and feather land together");
  assert.deepEqual(byId["chande-pora"].drifts, [false, false]);
  assert.match(byId["chande-pora"].why, /১৯৭১/);
  assert.equal(answer("chaya"), "বিকেলে");
  assert.equal(answer("bij"), "পানি আর আলো");
  assert.match(byId["bij"].why, /অন্ধকারে চারা বের হলো/, "seeds sprout in the dark; light makes them green");
  assert.equal(answer("chumbok"), "কাগজের ক্লিপ");
  assert.equal(answer("chumbok-perek"), "লোহার পেরেক");
  assert.equal(answer("akash"), "রোদের আলো ছড়ায়");
  assert.equal(answer("sondhya"), "আলো অনেক পথ পেরোয়");
  assert.equal(answer("brishti"), "নদী-সাগর থেকে");
  assert.match(byId["brishti"].why, /পানিচক্র/);
  assert.equal(answer("chand"), "আলোর দিকটা কম-বেশি দেখি", "not the earth's shadow");
  assert.match(byId["chand"].why, /সাড়ে ২৯ দিন/);
  assert.equal(answer("sutor-phone"), "অন্য কাপে শোনা যাবে");
  assert.equal(byId["sutor-dhila"].loose, true);
  assert.equal(answer("sutor-dhila"), "শোনা যাবে না", "a slack string carries no sound");
  assert.equal(answer("dhol-dana"), "লাফাবে");
});

test("home tries are safe: no fire, heat, sharp things or electricity, and never the sun itself", () => {
  for (const item of ITEMS) assert.doesNotMatch(item.home, /আগুন|গরম|চুলা|মোমবাতি|ছুরি|কাঁচি|সুই|পিন|ব্লেড|ফুটো|বিদ্যুৎ|প্লাগ|ব্যাটারি|টর্চ|সূর্যের দিকে তাকাও/, item.id);
  for (const item of ITEMS.filter(one => ["akash", "sondhya", "chaya"].includes(one.id))) assert.match(item.home, /তাকা(বে না|ব না)|সরাসরি নয়|দিকে/, item.id);
});

test("moon phases: new is empty, half has a straight edge, full is a whole circle", () => {
  assert.match(moonPath(0, 10), /A10\.00 10 0 0 0 0 -10Z$/, "new: back along the same edge");
  assert.match(moonPath(0.25, 10), /A0\.00 10/, "half: straight terminator");
  assert.match(moonPath(0.5, 10), /A10\.00 10 0 0 1 0 -10Z$/, "full: round the other side");
  assert.match(moonPath(0.125, 10), /^M0 -10A10 10 0 0 1 0 10/, "waxing: lit on the right");
});

test("the words around the game: no name, no score, one match line", () => {
  assert.equal(cardLine(4), "আজ ৪টা পরীক্ষায় আগে ভাবলাম, তারপর দেখলাম");
  assert.equal(endLine(3, 4), "৪টা পরীক্ষা দেখলে। ৩টা আন্দাজ মিলল।");
  assert.notEqual(matchLine(true), matchLine(false));
});

test("share never makes a link and has no tally", () => {
  assert.equal(share.normalize("level=1"), null);
  assert.equal(share.normalize(""), null);
  assert.equal(share.tally, undefined);
  assert.ok(share.preview("x").title.length > 0);
});

test("no network, no voice: the tool's source never calls fetch, share-client, speak or speechSynthesis", () => {
  const sources = [...files(root), join(root, "../../app/ki-hobe/page.tsx")];
  assert.ok(sources.length >= 15);
  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /\bfetch\s*\(/, file);
    assert.doesNotMatch(text, /share-client|ShareBar|sendBeacon|XMLHttpRequest|\/api\//, file);
    assert.doesNotMatch(text, /speechSynthesis|SpeechSynthesis|\bspeak\(|SpeakButton|useBanglaVoice/, `${file}: no voice`);
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
  for (const must of ["পানিচক্র কাকে বলে", "চাঁদ কেন ছোট-বড় হয়", "কোন বয়সের", "তথ্য", "কতক্ষণ"]) assert.ok(questions.includes(must), must);
  assert.equal(site.privacy.length, 1);
  assert.ok(site.headline && site.headline !== site.title);
  for (const text of [site.title, site.description, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    assert.equal(text, text.normalize("NFC"));
    assert.doesNotMatch(text, /আপনি|আপনার|করুন/, "তুমি voice");
  }
});
