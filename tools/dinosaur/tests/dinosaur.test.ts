import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { BOX, boneShapes, dinoShapes, ellipse, mouthShapes, type BoneKind } from "../lib/art";
import { brush, buryBones, COLS, DIG, FOUND_AT, freshSand, KEY_R, ROWS, TAP_R, uncovered } from "../lib/dig";
import { bn, croreLakh, DINOS, dinoOf, sizeLine, sizeScale, teethHint, whenLine } from "../lib/dinos";
import {
  addToBook, boneName, bonesFor, dinosOf, doneLine, FRESH_PACE, LEVEL_COUNT, LEVELS, nearestSlot, nextPace, placeHint, readBook, shouldGlow, starsOf, type Pace,
} from "../lib/levels";

const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);

test("twelve dinosaurs, each complete: names, NHM facts, a drawing, a mouth and six distinct bones", () => {
  assert.equal(DINOS.length, 12);
  for (const key of ["id", "name", "science", "latin", "wow"] as const) assert.equal(new Set(DINOS.map(dino => dino[key])).size, 12, key);
  for (const dino of DINOS) {
    for (const text of [dino.name, dino.science, dino.food, dino.wow, whenLine(dino), sizeLine(dino.lengthM)]) { nfc(text); assert.match(text, /[অ-হ]/, text); }
    assert.match(dino.latin, /^[A-Z][a-z]+ [a-z]+$/, dino.latin);
    assert.ok(dino.lengthM > 1 && dino.lengthM < 30);
    assert.ok(dino.mya[0] >= dino.mya[1] && dino.mya[1] >= 66 && dino.mya[0] <= 160, dino.id);
    assert.equal(dino.parts.length, 6, dino.id);
    assert.equal(new Set(dino.parts.map(part => part[0])).size, 6, `${dino.id}: one of each bone`);
    assert.ok(["skull", "dome"].includes(dino.parts[0][0]) && dino.parts[1][0] === "ribs", "a skull and ribs come first");
    for (const [, x, y] of dino.parts) assert.ok(x >= 0 && x <= BOX.width && y >= 0 && y <= BOX.height, `${dino.id} part inside the box`);
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) {
      const a = dino.parts[i], b = dino.parts[j];
      assert.ok(Math.hypot(a[1] - b[1], a[2] - b[2]) >= 18, `${dino.id}: ${a[0]} and ${b[0]} too close`);
    }
    assert.ok(dinoShapes(dino.look).length > 10);
    assert.ok(mouthShapes(dino.teeth, dino.look).length > 4);
    assert.equal(dino.teeth === "sharp", dino.diet === "meat", `${dino.id}: teeth match the diet`);
    for (const color of [dino.look.color, dino.look.shade, dino.look.belly, dino.look.accent]) assert.match(color, /^#[0-9a-f]{6}$/);
  }
  assert.equal(DINOS.filter(dino => dino.diet === "meat").length, 4);
});

test("facts match the Natural History Museum's Dino Directory", () => {
  const nhm: Record<string, [number, string, number, number]> = {
    trex: [12, "meat", 68, 66], triceratops: [9, "plant", 68, 66], stegosaurus: [9, "plant", 152, 145], brachiosaurus: [22, "plant", 152, 145],
    diplodocus: [26, "plant", 152, 145], velociraptor: [1.8, "meat", 74, 70], ankylosaurus: [8, "plant", 68, 66], spinosaurus: [14, "meat", 99, 94],
    iguanodon: [10, "plant", 140, 110], parasaurolophus: [9, "plant", 77, 73], allosaurus: [9.7, "meat", 152, 145], pachycephalosaurus: [3, "plant", 69, 66],
  };
  for (const dino of DINOS) assert.deepEqual([dino.lengthM, dino.diet, ...dino.mya], nhm[dino.id], dino.id);
  assert.equal(dinoOf("trex")!.science, "টিরানোসরাস রেক্স");
  assert.match(dinoOf("trex")!.wow, /২০ সেন্টিমিটার/);
  assert.match(dinoOf("spinosaurus")!.wow, /দেড় মিটার/);
});

test("Bangla numbers, years and sizes read right", () => {
  assert.equal(croreLakh(66), "৬ কোটি ৬০ লাখ");
  assert.equal(croreLakh(145), "১৪ কোটি ৫০ লাখ");
  assert.equal(croreLakh(110), "১১ কোটি");
  assert.equal(whenLine(dinoOf("trex")!), "৬ কোটি ৬০ লাখ বছরেরও আগে, ক্রিটেশাস যুগের শেষ ভাগ");
  assert.equal(bn(1.8), "১.৮");
  assert.equal(sizeLine(12), "লম্বায় ১২ মিটার, একটা বড় বাসের সমান।");
  assert.equal(sizeLine(26), "লম্বায় ২৬ মিটার, দুটো বাসের চেয়েও লম্বা।");
  assert.equal(sizeLine(22), "লম্বায় ২২ মিটার, প্রায় দুটো বাসের সমান।");
  assert.equal(sizeLine(14), "লম্বায় ১৪ মিটার, একটা বাসের চেয়েও লম্বা।");
  assert.equal(sizeLine(1.8), "লম্বায় ১.৮ মিটার, একটা রিকশার চেয়েও ছোট।");
  assert.equal(sizeLine(9), "লম্বায় ৯ মিটার। একটা বড় বাস ১২ মিটার।");
  for (const dino of DINOS) {
    const { unit, count, scale } = sizeScale(dino.lengthM);
    assert.ok(unit * count >= dino.lengthM * 0.95, `${dino.id}: the vehicles cover the dinosaur`);
    assert.ok(Math.max(dino.lengthM, unit * count) * scale <= 280.001, `${dino.id}: fits the picture`);
  }
  assert.equal(sizeScale(26).count, 3);
  assert.equal(sizeScale(1.8).kind, "rickshaw");
});

test("the dig: a tap clears a patch, and a bone is found once most of it shows", () => {
  let sand = freshSand();
  assert.equal(sand.length, COLS * ROWS);
  const bone = { x: 180, y: 120 };
  assert.equal(uncovered(sand, bone), 0);
  sand = brush(sand, 180, 120, TAP_R);
  const once = uncovered(sand, bone);
  assert.ok(once > 0.4 && once < FOUND_AT, `one tap is not enough: ${once}`);
  sand = brush(sand, 155, 120, TAP_R);
  sand = brush(sand, 205, 120, TAP_R);
  assert.ok(uncovered(sand, bone) >= FOUND_AT, "three taps uncover a bone");
  assert.equal(uncovered(freshSand(), bone), 0, "brush returns a new grid");
  assert.ok(uncovered(brush(freshSand(), 180, 120, KEY_R), bone) >= FOUND_AT, "one key press finds a bone");
  const edge = brush(freshSand(), -50, -50, 20);
  assert.ok(edge.every(cell => cell === 0), "brushing off the box does nothing");
  for (const seed of [1, 2, 3, 77, 9999]) {
    const kinds: BoneKind[] = ["skull", "ribs", "leg", "tail", "neck", "arm"];
    const bones = buryBones(kinds, seed);
    assert.deepEqual(bones.map(each => each.kind), kinds);
    assert.deepEqual(buryBones(kinds, seed), bones, "same seed, same dig");
    for (const each of bones) assert.ok(each.x >= 40 && each.x <= DIG.width - 40 && each.y >= 30 && each.y <= DIG.height - 30, JSON.stringify(each));
    for (let i = 0; i < bones.length; i++) for (let j = i + 1; j < bones.length; j++) assert.ok(Math.hypot(bones[i].x - bones[j].x, bones[i].y - bones[j].y) >= 55, "bones never overlap");
  }
});

test("levels: six digs of two, each dinosaur once, gently more bones", () => {
  assert.equal(LEVEL_COUNT, 6);
  const all = LEVELS.flatMap(level => level.dinos);
  assert.deepEqual([...all].sort(), DINOS.map(dino => dino.id).sort());
  assert.deepEqual(LEVELS.map(level => level.bones), [3, 3, 4, 4, 5, 5]);
  assert.deepEqual(dinosOf(1).map(dino => dino.diet).sort(), ["meat", "plant"], "the first dig has one of each");
  assert.deepEqual(dinosOf(99), dinosOf(6));
  assert.equal(doneLine(1), "আজ ২টা ডাইনোসর খুঁজে পেলাম");
});

test("difficulty steps: three slips ease, five right step up, never announced", () => {
  let pace: Pace = FRESH_PACE;
  assert.equal(bonesFor(1, pace), 3);
  assert.ok(!shouldGlow(pace, 1) && shouldGlow(pace, 2), "the right place glows after two tries");
  for (let i = 0; i < 3; i++) pace = nextPace(pace, false);
  assert.equal(pace.help, 1);
  assert.equal(bonesFor(1, pace), 3, "never fewer than three bones");
  assert.equal(bonesFor(5, pace), 4);
  assert.ok(shouldGlow(pace, 0));
  pace = nextPace(pace, true);
  assert.equal(pace.help, 0);
  for (let i = 0; i < 5; i++) pace = nextPace(pace, true);
  assert.equal(pace.help, -1);
  assert.equal(bonesFor(1, pace), 4);
  assert.equal(bonesFor(6, pace), 6, "at most six, every dinosaur has six");
  pace = nextPace(pace, false);
  assert.equal(pace.help, 0, "one slip drops back to normal");
});

test("stars are a record: 3 with no slip, 2 with up to two, else 1", () => {
  assert.deepEqual([0, 1, 2, 3, 9].map(starsOf), [3, 2, 2, 1, 1]);
});

test("snapping is generous and hints say what and where", () => {
  const trex = dinoOf("trex")!, parts = trex.parts.slice(0, 4);
  assert.equal(nearestSlot(parts, 230, 40)![0], "skull");
  assert.equal(nearestSlot(parts, 0, 150)![0], "tail");
  assert.equal(nearestSlot(parts, 172, 48, ["skull"])![0], "arm", "a filled place is skipped");
  assert.equal(nearestSlot(parts, 0, 0, parts.map(part => part[0])), null);
  assert.equal(boneName("arm", trex), "হাত");
  assert.equal(boneName("arm", dinoOf("triceratops")!), "সামনের পা");
  assert.equal(placeHint("tail", trex), "এটা লেজ। বসে পেছনের দিকে।");
  assert.equal(placeHint("claw", dinoOf("velociraptor")!), "এটা নখ। বসে পায়ের কাছে।");
  for (const dino of DINOS) for (const [kind] of dino.parts) { nfc(placeHint(kind, dino)); assert.ok(boneShapes(kind).length > 0); }
  for (const teeth of ["sharp", "flat", "beak"] as const) nfc(teethHint(teeth));
});

test("the finder's book keeps known ids only, in book order", () => {
  assert.deepEqual(readBook(null), []);
  assert.deepEqual(readBook("{oops"), []);
  assert.deepEqual(readBook('{"a":1}'), []);
  assert.deepEqual(readBook('["trex","nessie","triceratops","trex"]'), ["trex", "triceratops"]);
  assert.deepEqual(addToBook(["trex"], "triceratops"), ["trex", "triceratops"]);
  assert.deepEqual(addToBook(["trex"], "trex"), ["trex"]);
});

test("art paths are plain numbers", () => {
  assert.equal(ellipse([10, 20, 5, 4, 0]), "M5 20A5 4 0 1 0 15 20A5 4 0 1 0 5 20Z");
  for (const dino of DINOS) for (const shape of dinoShapes(dino.look)) assert.doesNotMatch(shape.d, /NaN|undefined|Infinity/, dino.id);
});

test("no sharing of anything about the child", () => {
  assert.equal(share.normalize(""), null);
  assert.equal(share.normalize("level=1&book=trex"), null);
  assert.equal(share.tally, undefined);
});

test("the tool's source never calls fetch or imports share-client", () => {
  const root = join(import.meta.dirname, "..");
  const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
  });
  const sources = [...files(root), join(root, "../../app/dinosaur/page.tsx")].filter(path => /\.(tsx?|css)$/.test(path));
  assert.ok(sources.length >= 12);
  for (const path of sources) {
    const code = readFileSync(path, "utf8");
    assert.doesNotMatch(code, /\bfetch\s*\(/, path);
    assert.doesNotMatch(code, /share-client|ShareBar|\/api\//, path);
    assert.doesNotMatch(code, /<input|getUserMedia|geolocation/, path);
  }
});

test("content meets the SEO limits and answers the search question first", () => {
  assert.ok(site.title.length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("ডাইনোসর গেম"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title && site.headline !== site.name);
  assert.ok(site.faq.length >= 6);
  assert.equal(site.faq[0].question, "ডাইনোসর কি এখনো আছে?");
  assert.ok(site.faq[0].answer.startsWith("আছে, পাখি হয়ে।"));
  for (const question of ["কোন বয়সের জন্য?", "ইন্টারনেট লাগে?", "কোনো তথ্য নেওয়া হয়?", "কতক্ষণ খেলবে?"]) assert.ok(site.faq.some(item => item.question === question), question);
  assert.ok(site.faq.some(item => /nhm\.ac\.uk/.test(item.answer)), "the source is named");
  assert.equal(site.privacy.length, 1);
  for (const text of [site.title, site.description, site.headline!, site.lead, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|করুন|দেখুন/, text);
  }
  for (const dino of DINOS) assert.ok(site.faq[2].answer.includes(dino.name), dino.name);
});
