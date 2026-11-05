import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { readLevels } from "../../../shared/game-core";
import { FOOTER, OG_DEMO, cardText, isOgHash } from "../lib/card";
import { LEVELS, LEVEL_COUNT, LEVEL_IDS, WORLDS, levelOf, nextInOrder, nextToPlay, placeOf, rhymeForLevel, worldOf } from "../lib/levels";
import { COUNT_IN, buildPlan, lineBeats, lineStartOf, nextLineStart } from "../lib/plan";
import { MAX_DOTS, RHYMES, bare, groupOf, rhymeOf, wordsOf } from "../lib/poems";
import { rewind, starsOf, tally, tap, windowFor, createRun, TAP_BIG, TAP_FREE, TAP_MINE, TAP_OFF, TAP_ON, TAP_OVER, TAP_REST } from "../lib/run";
import { SCENES, sceneDocument, sceneMarkup } from "../lib/scenes";
import { EV_BEAT, EV_COUNT, EV_END, advance, beatFraction } from "../lib/tick.hot";
import { parentNote, site } from "../content";
import { share } from "../share";

const bn = (n: number) => new Intl.NumberFormat("bn-BD", { useGrouping: false }).format(n);
const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);
const STEP = 1000 / 60;

test("rhymes: only folk rhymes from the safe list, each with its recorded source", () => {
  // b-bangladesh.md §4.1, and who first wrote each down. Folk, so no author and no copyright.
  const sources: Record<string, RegExp> = {
    hattima: /যোগীন্দ্রনাথ সরকার ১৮৯৯/, ata: /রবীন্দ্রনাথ ঠাকুর ১৮৯৪/, chand: /রবীন্দ্রনাথ ঠাকুর ১৮৯৪/, agdum: /রবীন্দ্রনাথ ঠাকুর ১৮৯৪/,
    notun: /রবীন্দ্রনাথ ঠাকুর ১৮৯৪/, brishti: /রবীন্দ্রনাথ ঠাকুর ১৮৯৪/, ghum: /রবীন্দ্রনাথ ঠাকুর ১৮৯৪/, mela: /যোগীন্দ্রনাথ সরকার ১৮৯৯.*রবীন্দ্রনাথ ঠাকুর ১৮৯৪/,
  };
  assert.deepEqual(RHYMES.map(r => r.id), Object.keys(sources));
  for (const rhyme of RHYMES) {
    assert.match(rhyme.source, /^লোকছড়া; /, rhyme.id);
    assert.match(rhyme.source, sources[rhyme.id], rhyme.id);
  }
  const openings: Record<string, string> = { hattima: "হাট্টিমা টিম টিম", ata: "আতা গাছে তোতা পাখি", chand: "আয় আয় চাঁদ মামা", agdum: "আগডুম বাগডুম ঘোড়াডুম সাজে", notun: "নোটন নোটন পায়রাগুলি", brishti: "বৃষ্টি পড়ে টাপুর টুপুর", ghum: "ঘুমপাড়ানি মাসি-পিসি", mela: "হাট্টিমা টিম টিম" };
  for (const rhyme of RHYMES) assert.ok(rhyme.lines[0].startsWith(openings[rhyme.id]), rhyme.id);
  // Opening lines only: no বর্গী, no dowry or wedding verses, no other author's poem.
  assert.doesNotMatch(JSON.stringify(RHYMES), /বর্গী|খাজনা|কন্যা|কন্যে|বিয়ে|যৌতুক|লাঠি|নজরুল|জসীম|জসিম/);
});

test("rhymes: complete, NFC, lines short enough for one row of dots, rhyme groups point at real lines", () => {
  assert.equal(new Set(RHYMES.map(r => r.name)).size, RHYMES.length);
  for (const rhyme of RHYMES) {
    assert.ok(rhyme.lines.length >= 2 && rhyme.lines.length <= 8, rhyme.id);
    for (const text of [rhyme.name, rhyme.source, ...rhyme.lines]) { nfc(text); assert.doesNotMatch(text, /\s{2}/); }
    const seen = new Set<number>();
    for (const group of rhyme.groups) {
      assert.ok(group.length >= 2, rhyme.id);
      for (const line of group) { assert.ok(line >= 0 && line < rhyme.lines.length); assert.ok(!seen.has(line), `${rhyme.id}: line ${line} in two groups`); seen.add(line); }
    }
    for (const line of rhyme.lines) assert.ok(wordsOf(line).length >= 2 && wordsOf(line).length < MAX_DOTS, line);
  }
  assert.equal(rhymeOf("nope"), undefined);
  assert.equal(groupOf(rhymeOf("hattima")!, 3), 0);
  assert.equal(groupOf(rhymeOf("hattima")!, 2), -1);
  // The ends that sound alike, by ear (spelling is not the sound: মৌ and বউ).
  const ends = (id: string, group: number) => rhymeOf(id)!.groups[group].map(line => bare(wordsOf(rhymeOf(id)!.lines[line]).at(-1)!));
  assert.deepEqual(ends("hattima", 0), ["টিম", "ডিম", "টিম"]);
  assert.deepEqual(ends("ata", 0), ["মৌ", "বউ"]);
  assert.deepEqual(ends("agdum", 0), ["সাজে", "বাজে"]);
  assert.deepEqual(ends("ghum", 1), ["খেয়ো", "যেয়ো"]);
});

test("words split whole, never into letters, and keep their punctuation", () => {
  assert.deepEqual(wordsOf("তারা মাঠে পাড়ে ডিম,"), ["তারা", "মাঠে", "পাড়ে", "ডিম,"]);
  assert.deepEqual(wordsOf("ওপারেতে ছেলে-মেয়ে"), ["ওপারেতে", "ছেলে-মেয়ে"]);
  assert.equal(bare("বউ?"), "বউ");
  assert.equal(bare("দেব।"), "দেব");
  assert.equal(bare("হাট্টিমা"), "হাট্টিমা");
});

test("scenes: one drawing per line, drawn in code, nothing linked, and the picture grows line by line", () => {
  for (const rhyme of RHYMES) {
    const scene = SCENES[rhyme.id];
    assert.ok(scene, rhyme.id);
    assert.equal(scene.props.length, rhyme.lines.length, `${rhyme.id}: a drawing for every line`);
    for (const markup of [scene.base, ...scene.props]) {
      assert.match(markup, /<(path|ellipse|circle|rect|g)/, rhyme.id);
      assert.doesNotMatch(markup, /href|url\(|<script|<image|<text|<use|<foreignObject/i, rhyme.id);
    }
    assert.ok(scene.props.every(prop => prop.length > 20), rhyme.id);
    assert.equal((sceneMarkup(rhyme.id, 0).match(/data-on/g) ?? []).length, 0);
    assert.equal((sceneMarkup(rhyme.id, 2).match(/data-on/g) ?? []).length, 2);
    assert.equal((sceneMarkup(rhyme.id, 99).match(/data-on/g) ?? []).length, rhyme.lines.length);
    assert.match(sceneDocument(rhyme.id), /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 320 200">/);
  }
  assert.equal(sceneMarkup("nope"), "");
});

test("levels: 3 worlds, 8 ছড়া in play order, the last of each world is its named finale", () => {
  assert.equal(LEVEL_COUNT, 8);
  assert.deepEqual(WORLDS.flatMap(world => [...world.ids]), [1, 5, 2, 3, 6, 7, 4, 8]);
  assert.deepEqual([...LEVEL_IDS].sort(), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(WORLDS.length, 3);
  for (const world of WORLDS) {
    const finales = world.ids.filter(id => levelOf(id).finale);
    assert.deepEqual(finales, [world.ids.at(-1)], world.name);
    for (const id of world.ids) assert.equal(levelOf(id).world, world.id);
  }
  assert.deepEqual(LEVELS.filter(l => l.finale).map(l => l.finale), ["তোতা পাখির গান", "ঘুমের গান", "মেলার ঢোল"]);
  assert.equal(new Set(LEVELS.map(l => l.rhyme)).size, LEVELS.length);
  assert.equal(new Set(LEVELS.map(l => l.idea)).size, LEVELS.length);
  assert.equal(levelOf(99).id, 1);
  assert.equal(levelOf(Number.NaN).id, 1);
  assert.equal(rhymeForLevel(3).id, "chand");
  assert.equal(worldOf(7).name, "আকাশ");
  assert.equal(placeOf(4), 7);
  assert.equal(nextInOrder(2), 3);
  assert.equal(nextInOrder(8), 0);
});

test("levels: each ছড়া adds exactly one new idea to the beat, in play order", () => {
  const features = (id: number) => {
    const level = levelOf(id), found: string[] = [];
    if (level.rests) found.push("rests");
    if (level.guide === "dim") found.push("dim");
    if (level.guide === "none") found.push("none");
    if (level.strong) found.push("strong");
    if (level.beatMs < 700) found.push("fast");
    if (level.echo) found.push("echo");
    if (level.scale) found.push("ramp");
    return found;
  };
  const seen = new Set<string>();
  WORLDS.flatMap(world => [...world.ids]).forEach((id, place) => {
    const fresh = features(id).filter(feature => !seen.has(feature));
    assert.equal(fresh.length, place === 0 ? 0 : 1, `${levelOf(id).rhyme}: ${features(id)} (new: ${fresh})`);
    features(id).forEach(feature => seen.add(feature));
  });
  assert.deepEqual([...seen].sort(), ["dim", "echo", "fast", "none", "ramp", "rests", "strong"]);
});

test("levels: the old four keep their ছড়া, so saved stars stay valid; old saves read as before", () => {
  assert.deepEqual([1, 2, 3, 4].map(id => levelOf(id).rhyme), ["hattima", "ata", "chand", "agdum"]);
  const saved = JSON.stringify({ 1: 3, 2: 2, 3: 1, 4: 2 });
  assert.deepEqual(readLevels(saved, LEVEL_COUNT), { 1: 3, 2: 2, 3: 1, 4: 2 });
  assert.equal(nextToPlay({ 1: 3, 2: 2, 3: 1, 4: 2 }), 5);
  assert.equal(nextToPlay({}), 1);
  assert.equal(nextToPlay(Object.fromEntries(LEVEL_IDS.map(id => [id, 1]))), 1);
  // The saved key is unchanged.
  assert.match(readFileSync(join(import.meta.dirname, "../components/game.tsx"), "utf8"), /const SLUG = "chhorar-tal"/);
});

test("levels: slow and steady: never more than about 100 beats a minute, a round lasts under a minute and a bit", () => {
  for (const level of LEVELS) {
    assert.ok(level.beatMs >= 600, level.rhyme);
    const plan = buildPlan(level.id);
    assert.ok(plan.total / 1000 >= 15 && plan.total / 1000 <= 65, `${level.rhyme} ${plan.total / 1000}s`);
    assert.ok(level.window >= 0.26 && level.window <= 0.32, level.rhyme);
    assert.ok(plan.dots <= MAX_DOTS);
  }
  // Easy comes first: the first level is the gentlest and the finales the narrowest.
  assert.ok(levelOf(1).window >= levelOf(8).window);
});

test("the beat plan: one beat per word, a rest after each line when the level teaches it, passes through", () => {
  const hattima = buildPlan(1), words = RHYMES[0].lines.reduce((sum, line) => sum + wordsOf(line).length, 0);
  assert.equal(hattima.beats.length, 2 * words);
  assert.equal(hattima.words, 2 * words);
  assert.ok(hattima.beats.every(beat => beat.word >= 0 && beat.mine));
  assert.equal(hattima.beats.filter(beat => beat.last).length, 2 * 4);
  const notun = buildPlan(5);
  assert.equal(notun.beats.filter(beat => beat.word < 0).length, 2 * 4);
  assert.equal(notun.words, 2 * 9);
  assert.ok(notun.beats.filter(beat => beat.word < 0).every(beat => beat.last && !beat.mine));
  // Times add up, lines start where they say, and the line helpers agree.
  for (const id of LEVEL_IDS) {
    const plan = buildPlan(id);
    assert.equal(plan.at[0], 0);
    let sum = 0;
    plan.beats.forEach((_, index) => { assert.equal(plan.at[index], sum); sum += plan.len[index]; assert.equal(plan.lineAt[index], lineStartOf(plan, index)); });
    assert.equal(plan.total, sum);
    for (const start of plan.starts) assert.equal(lineBeats(plan, start), plan.beats.filter(beat => plan.lineAt[plan.beats.indexOf(beat)] === start).length);
    assert.equal(nextLineStart(plan, plan.beats.length - 1), -1);
  }
});

test("the beat plan: the ঢুলি plays the first pass, you play the rest; in an echo they take turns and swap", () => {
  const first = buildPlan(1);
  assert.ok(first.beats.filter(beat => beat.pass === 0).every(beat => beat.dhuli));
  assert.ok(first.beats.filter(beat => beat.pass === 1).every(beat => !beat.dhuli));
  const echo = buildPlan(7), levelRhyme = rhymeOf("ghum")!;
  for (const beat of echo.beats) {
    const ঢুলিLine = (beat.line % 2 === 0) === (beat.pass === 0);
    assert.equal(beat.dhuli, ঢুলিLine);
    assert.equal(beat.mine, !ঢুলিLine && beat.word >= 0);
  }
  // Over the two passes every line is yours exactly once.
  for (let line = 0; line < levelRhyme.lines.length; line++) assert.equal(echo.beats.filter(beat => beat.line === line && beat.mine && beat.word >= 0).length, wordsOf(levelRhyme.lines[line]).length);
  assert.equal(echo.words, levelRhyme.lines.reduce((sum, line) => sum + wordsOf(line).length, 0));
});

test("the beat plan: the guide fades only on the last pass; big beats open each breath; a parade speeds up", () => {
  assert.ok(buildPlan(2).beats.filter(beat => beat.pass === 0).every(beat => beat.guide === "full"));
  assert.ok(buildPlan(2).beats.filter(beat => beat.pass === 1).every(beat => beat.guide === "dim"));
  assert.ok(buildPlan(8).beats.filter(beat => beat.pass === 1).every(beat => beat.guide === "none"));
  assert.ok(buildPlan(1).beats.every(beat => beat.guide === "full"));
  const brishti = buildPlan(6);
  assert.deepEqual([0, 1, 2].map(pass => brishti.beats.find(beat => beat.pass === pass)!.guide), ["full", "full", "dim"]);
  const chand = buildPlan(3);
  const big = chand.beats.map((beat, index) => beat.big ? index : -1).filter(index => index >= 0 && chand.beats[index].pass === 0);
  // "আয় আয় চাঁদ মামা, টিপ দিয়ে যা," opens at আয় and at টিপ.
  assert.deepEqual(big.slice(0, 2).map(index => chand.beats[index].word), [0, 4]);
  assert.ok(chand.beats.every(beat => !beat.big || beat.word >= 0));
  assert.ok(buildPlan(1).beats.every(beat => !beat.big));
  const agdum = buildPlan(4), lens = [0, 1, 2, 3].map(line => agdum.len[agdum.beats.findIndex(beat => beat.line === line)]);
  assert.deepEqual(lens, [780, 780, 702, 624]);
});

test("the clock: two beats counted in, then a beat at a time, then the end, once", () => {
  const run = createRun(1);
  let events = advance(run, STEP);
  assert.equal(events & EV_COUNT, EV_COUNT);
  assert.equal(run.counted, 1);
  assert.equal(run.phase, 0);
  let beats = 0, counts = 1, ends = 0, steps = 0;
  const seen: number[] = [];
  while ((run.phase as number) !== 2 && steps++ < 10000) {
    events = advance(run, STEP);
    if (events & EV_COUNT) counts++;
    if (events & EV_BEAT) { beats++; seen.push(run.index); }
    if (events & EV_END) ends++;
  }
  assert.equal(counts, COUNT_IN);
  assert.equal(beats, run.plan.beats.length);
  assert.deepEqual(seen, run.plan.beats.map((_, index) => index));
  assert.equal(ends, 1);
  assert.equal(advance(run, STEP), 0);
  // The whole round lasts the count-in plus the plan, to within a frame.
  assert.ok(Math.abs(steps * STEP - (COUNT_IN * 900 + run.plan.total)) < 2 * STEP + 1, `${steps * STEP}`);
  assert.ok(beatFraction(run) >= 0 && beatFraction(run) <= 1);
});

test("a tap counts when it lands near a beat, either side, and never costs anything", () => {
  const run = createRun(1);
  assert.equal(tap(run), TAP_FREE, "during the count-in a tap is only a thump");
  assert.equal(tally(run).hits, 0);
  while (run.phase !== 1) advance(run, STEP);
  while (run.clock < 3 * 900 + 100) advance(run, STEP);
  // Now 100 ms after beat 3 started: on the beat. The same beat tapped twice is one hit.
  assert.equal(tap(run), TAP_ON | TAP_MINE);
  assert.equal(tap(run), TAP_ON | TAP_MINE);
  assert.equal(tally(run).hits, 1);
  assert.equal(run.judged, 3);
  // Half-way between two beats is off the beat: a softer thump, a counter, nothing lost.
  while (run.clock < 4 * 900 + 450) advance(run, STEP);
  assert.equal(tap(run), TAP_OFF);
  assert.equal(tally(run).hits, 1);
  assert.equal(run.missRun, 1);
  // A tap just before the next beat belongs to the next beat.
  while (run.clock < 5 * 900 - 150) advance(run, STEP);
  assert.equal(tap(run), TAP_ON | TAP_MINE);
  assert.equal(run.judged, 5);
  assert.equal(tally(run).hits, 2);
  assert.equal(run.clapped, 3);
});

test("difficulty: three off-beat taps in a row widen the window, five on the beat narrow it", () => {
  assert.equal(windowFor(240, 0, 0), 240);
  assert.equal(windowFor(240, 2, 0), 240);
  assert.equal(windowFor(240, 3, 0), 360);
  assert.equal(windowFor(240, 0, 4), 240);
  assert.equal(windowFor(240, 0, 5), 204);
});

test("a rest is nothing to hit: a tap there is neutral, and the ঢুলি's lines are not scored", () => {
  const rest = createRun(5), restAt = rest.plan.beats.findIndex(beat => beat.word < 0);
  while (rest.phase !== 1) advance(rest, STEP);
  while (rest.clock < rest.plan.at[restAt] + 60) advance(rest, STEP);
  rest.missRun = 2; rest.hitRun = 2;
  assert.equal(tap(rest), TAP_REST);
  assert.equal(rest.missRun, 2);
  assert.equal(rest.hitRun, 2);
  assert.equal(tally(rest).hits, 0);
  // Echo: line 0 of the first pass is the ঢুলি's.
  const echo = createRun(7);
  while (echo.phase !== 1) advance(echo, STEP);
  while (echo.clock < echo.plan.at[1] + 60) advance(echo, STEP);
  assert.equal(tap(echo), TAP_ON);
  assert.equal(tally(echo).hits, 0);
  assert.equal(tally(echo).clapped, 1);
  // A big beat says so.
  const big = createRun(3);
  while (big.phase !== 1) advance(big, STEP);
  while (big.clock < 40) advance(big, STEP);
  assert.equal(tap(big), TAP_ON | TAP_MINE | TAP_BIG);
});

test("coming back: two beats are counted in again from the start of the line, and what you earned stays", () => {
  const run = createRun(2);
  while (run.phase !== 1) advance(run, STEP);
  while (run.index < 7) advance(run, STEP);
  const line = run.plan.beats[run.index].line, start = run.plan.lineAt[run.index];
  while (run.clock < run.plan.at[7] + 80) advance(run, STEP);
  tap(run);
  const hits = tally(run).hits;
  rewind(run);
  assert.equal(run.phase, 0);
  assert.equal(run.focus, start);
  assert.equal(run.clock, run.plan.at[start]);
  assert.equal(run.plan.beats[run.focus].line, line);
  assert.equal(tap(run), TAP_FREE);
  assert.equal(tally(run).hits, hits);
  let counted = 0, firstBeat = -1;
  for (let steps = 0; steps < 400 && firstBeat < 0; steps++) {
    const events = advance(run, STEP);
    if (events & EV_COUNT) counted++;
    if (events & EV_BEAT) firstBeat = run.index;
  }
  assert.equal(counted, COUNT_IN - 0, "the count-in sounded both beats");
  assert.equal(firstBeat, start, "play carries on from the start of the line");
  // On a line's rest the next line is where it comes back.
  const rested = createRun(5), restAt = rested.plan.beats.findIndex(beat => beat.word < 0);
  while (rested.phase !== 1) advance(rested, STEP);
  while (rested.index < restAt) advance(rested, STEP);
  rewind(rested);
  assert.equal(rested.focus, nextLineStart(rested.plan, restAt));
  // At the very end there is nothing to replay.
  const over = createRun(1);
  while (over.phase !== 2) advance(over, STEP);
  rewind(over);
  assert.equal(over.phase, 2);
  assert.equal(tap(over), TAP_OVER);
});

test("stars are a record: 3 for over half your words on the beat, 2 for a quarter, 1 for finishing", () => {
  assert.equal(starsOf(30, 30), 3);
  assert.equal(starsOf(17, 30), 3);
  assert.equal(starsOf(16, 30), 2);
  assert.equal(starsOf(8, 30), 2);
  assert.equal(starsOf(7, 30), 1);
  assert.equal(starsOf(0, 30), 1);
  assert.equal(starsOf(0, 0), 1);
});

test("the card says what was done, with no name; the #og demo is fixed and real", () => {
  const text = cardText({ level: 1, stars: 3, hits: 26 });
  assert.equal(text.title, "আজ ৪ লাইনের ছড়া তালে তালে বললাম");
  assert.equal(text.drum, "ঢোলে ২৬ বার তাল");
  assert.equal(text.label, "ছড়ার তালে · হাট্টিমা টিম টিম");
  assert.equal(cardText({ level: 2, stars: 1, hits: 0 }).drum, "ঢোলের তাল শুনলাম");
  assert.equal(cardText({ level: 2, stars: 1, hits: 0 }).label, "ছড়ার তালে · তোতা পাখির গান");
  for (const value of Object.values(text)) nfc(value);
  nfc(FOOTER);
  assert.ok(isOgHash("#og"));
  assert.ok(!isOgHash("#og=1") && !isOgHash(""));
  assert.equal(OG_DEMO.stars, starsOf(OG_DEMO.hits, buildPlan(OG_DEMO.level).words));
  assert.ok(OG_DEMO.hits <= buildPlan(OG_DEMO.level).words);
  assert.equal(bn(OG_DEMO.hits), "২৬");
});

test("no sharing of results: normalize always returns null, and there is no tally", () => {
  for (const state of ["", "l=3", "s=1&t=3", "x".repeat(500)]) assert.equal(share.normalize(state), null);
  assert.equal(share.tally, undefined);
});

test("the tool never touches the network, speaks, or reads the clock or random in its rules", () => {
  const files: string[] = [];
  const walk = (dir: string) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) { if (name !== "tests") walk(path); } else if (/\.tsx?$/.test(name)) files.push(path); } };
  walk(join(import.meta.dirname, ".."));
  assert.ok(files.length >= 20);
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${file} calls fetch`);
    assert.doesNotMatch(source, /share-client|ShareBar|XMLHttpRequest|sendBeacon|WebSocket|\/api\//, file);
    // No voice anywhere: the owner's call, phone text-to-speech reads Bangla badly.
    assert.doesNotMatch(source, /speechSynthesis|SpeechSynthesisUtterance|\bspeak\(|SpeakButton|useBanglaVoice/, file);
    // Link-free for a child: nothing outbound inside the game.
    if (file.includes("/components/")) assert.doesNotMatch(source, /<a\s|href=/, file);
    if (file.includes("/lib/")) assert.doesNotMatch(source, /Math\.random|Date\.now|new Date\(/, file);
  }
});

test("content: SEO limits and the FAQ parents search for", () => {
  assert.ok(site.title.length <= 45, `title ${site.title.length}`);
  assert.ok(site.title.startsWith("ছোটদের ছড়া"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, `description ${site.description.length}`);
  assert.equal(site.headline, "ঢোলে তাল দাও, ছড়া বলো");
  assert.ok(site.faq.length >= 6);
  assert.equal(site.faq[0].question, "ছড়া কাকে বলে?");
  assert.match(site.faq[0].answer, /^ছড়া হলো ছোট, তালে তালে বলা মিলওয়ালা কবিতা/);
  for (const ask of ["কোন বয়সের জন্য?", "ইন্টারনেট লাগে?", "কোনো তথ্য নেওয়া হয়?", "কতক্ষণ খেলবে?", "শব্দ বন্ধ রাখলেও খেলা যায়?", "ছড়াটা কেউ পড়ে শোনায় না কেন?"]) assert.ok(site.faq.some(item => item.question === ask), ask);
  assert.equal(new Set(site.faq.map(item => item.question)).size, site.faq.length);
  for (const text of [site.title, site.description, site.headline!, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...Object.values(parentNote), ...site.faq.flatMap(item => [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|করুন|দেখুন/);
  }
  assert.equal(site.privacy.length, 1);
  assert.ok(site.steps.length >= 2 && site.steps.length <= 4);
});
