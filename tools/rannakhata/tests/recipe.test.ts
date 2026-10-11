import assert from "node:assert/strict";
import test from "node:test";
import { MAX_SHARE_STATE } from "../../../shared/share-types";
import { drawCard, MORE_NOTE } from "../lib/draw-recipe";
import { cleanRecipe, dishHeadline, RECIPE_ASK, emptyRecipe, exampleRecipe, MAX_INGREDIENTS, MAX_STEPS, parseRecipeHash, recipeCard, recipeHash, recipeLine, recipeLines, recipeLimits, recipeText, validateRecipe, type RecipeDraft } from "../lib/recipe";
import { share } from "../share";

test("a blank recipe cannot be exported as a finished record", () => {
  assert.deepEqual(Object.keys(validateRecipe(emptyRecipe())), ["title", "ingredients", "steps"]);
});

test("export preserves a family note and ordered cooking steps", () => {
  const text = recipeText({ ...emptyRecipe(), title: "ডাল ভর্তা", learnedFrom: "মায়ের খাতা", servings: "৪ জন", ingredients: "ডাল — ১ কাপ\r\n\r\nপেঁয়াজ — ১টি", steps: "প্রথম ধাপ\nদ্বিতীয় ধাপ", memory: "ছুটির দুপুরের রান্না।" });
  assert.match(text, /ডাল — ১ কাপ[\s\S]*পেঁয়াজ — ১টি[\s\S]*১\. প্রথম ধাপ[\s\S]*২\. দ্বিতীয় ধাপ[\s\S]*ছুটির দুপুরের রান্না।/);
});

const validRecipe = { ...emptyRecipe(), title: "সালাদ", ingredients: "শসা — ১টি", steps: "ধুয়ে কেটে নিন।" };

test("blank lines and Windows line endings do not create empty ingredients", () => {
  assert.deepEqual(recipeLines("  শসা — ১টি  \r\n\r\n টমেটো — ১টি \r"), ["শসা — ১টি", "টমেটো — ১টি"]);
});

test("optional personal details do not leave empty headings in the export", () => {
  assert.doesNotMatch(recipeText(validRecipe), /কার রেসিপি|কতজনের জন্য|এই রান্নার গল্প/);
});

test("thirty ingredients and twenty steps are accepted at the boundary", () => {
  const draft = { ...validRecipe, ingredients: Array(30).fill("উপকরণ").join("\n"), steps: Array(20).fill("ধাপ").join("\n") };
  assert.deepEqual(validateRecipe(draft), {});
});

test("a thirty-first ingredient must be shortened before export", () => {
  assert.throws(() => recipeText({ ...validRecipe, ingredients: Array(31).fill("উপকরণ").join("\n") }), RangeError);
});

test("a twenty-first cooking step must be shortened before export", () => {
  assert.throws(() => recipeText({ ...validRecipe, steps: Array(21).fill("ধাপ").join("\n") }), RangeError);
});

test("an oversized title is rejected without silently cutting the record", () => {
  assert.throws(() => recipeText({ ...validRecipe, title: "x".repeat(recipeLimits.title + 1) }), RangeError);
});

test("servings stay exactly as written and never scale ingredient amounts", () => {
  assert.deepEqual(recipeCard({ ...validRecipe, servings: "  ৪–৬ জন  " }).ingredients, ["শসা — ১টি"]);
});

test("a multiline memory remains text with its line breaks intact", () => {
  assert.equal(recipeCard({ ...validRecipe, memory: " <একটি স্মৃতি>\r\nপরের লাইন " }).memory, "<একটি স্মৃতি>\nপরের লাইন");
});

test("a shared link carries the whole recipe and reopens it exactly", () => {
  assert.deepEqual(parseRecipeHash(recipeHash(exampleRecipe)), exampleRecipe);
});

test("Bangla text with URL symbols and line breaks survives the link", () => {
  const draft: RecipeDraft = { title: "ডাল & ভাত + ১০০% #১", learnedFrom: "বড় মামি", servings: "৪=৫ জন", ingredients: "মসুর ডাল — ১ কাপ\nপানি — ৩ কাপ", steps: "ধুয়ে নাও।\nসেদ্ধ করো?", memory: "প্রথম লাইন\n\nদ্বিতীয় লাইন" };
  assert.deepEqual(parseRecipeHash(recipeHash(draft)), draft);
  // Browsers hand location.hash back with Bangla percent-encoded; that must read the same.
  assert.deepEqual(parseRecipeHash(recipeHash(draft).replace(/[^\x00-\x7f]+/g, encodeURIComponent)), draft);
});

test("decomposed Bangla is stored in NFC so the same word always matches", () => {
  const decomposed = "পোলাও".normalize("NFD");
  assert.notEqual(decomposed, "পোলাও");
  assert.equal(parseRecipeHash(recipeHash({ ...exampleRecipe, title: decomposed }))!.title, "পোলাও");
});

test("hostile links are cleaned or rejected, never shown half-broken", () => {
  assert.equal(parseRecipeHash("#t=%E2%80%AEখিচুড়ি%00&i=চাল&s=রাঁধো")!.title, "খিচুড়ি");
  for (const hash of ["", "#result", "#tool", "#i=চাল&s=রাঁধো", "#t=খিচুড়ি&s=রাঁধো", "#t=খিচুড়ি&i=চাল", `#t=${"ক".repeat(81)}&i=চাল&s=রাঁধো`, `#t=ক&i=চাল&s=${Array(MAX_STEPS + 1).fill("ধাপ").join("%0A")}`, `#t=ক&i=${Array(MAX_INGREDIENTS + 1).fill("চাল").join("%0A")}&s=রাঁধো`, "#" + "x".repeat(MAX_SHARE_STATE * 9 + 1)]) {
    assert.equal(parseRecipeHash(hash), null, hash.slice(0, 40));
  }
});

test("a recipe filled to every limit still fits in one share link", () => {
  const line = (length: number) => "ক".repeat(length);
  const full: RecipeDraft = { title: line(recipeLimits.title), learnedFrom: line(recipeLimits.learnedFrom), servings: line(recipeLimits.servings), ingredients: Array(MAX_INGREDIENTS).fill(line(48)).join("\n"), steps: Array(MAX_STEPS).fill(line(220)).join("\n"), memory: line(recipeLimits.memory) };
  assert.deepEqual(validateRecipe(full), {});
  assert.ok(recipeHash(full).length - 1 <= MAX_SHARE_STATE);
  assert.deepEqual(parseRecipeHash(recipeHash(full)), full);
});

test("text that would overflow the link once escaped is caught before sharing", () => {
  const errors = validateRecipe({ ...exampleRecipe, steps: "%".repeat(recipeLimits.steps) });
  assert.match(errors.steps ?? "", /লিংকে/);
});

test("the dish is named after whose recipe it is", () => {
  assert.equal(dishHeadline({ title: "খিচুড়ি", learnedFrom: "নানু" }), "নানুর হাতের খিচুড়ি");
  assert.equal(dishHeadline({ title: "খিচুড়ি", learnedFrom: "নিজের" }), "আমার হাতের খিচুড়ি");
  assert.equal(dishHeadline({ title: "নানুর হাতের খিচুড়ি", learnedFrom: "নানু" }), "নানুর হাতের খিচুড়ি");
  assert.equal(dishHeadline({ title: "খিচুড়ি", learnedFrom: "" }), "খিচুড়ি");
});

test("the server normalizes links and previews them personally", () => {
  const state = recipeHash(exampleRecipe).slice(1);
  assert.equal(share.normalize(state.replace("t=", "t=++")), state);
  assert.equal(share.normalize("t=&i=x"), null);
  assert.equal(share.preview(state).title, "নানুর হাতের ভুনা খিচুড়ি। তোমাদের বাড়ির কোন রান্নাটা লিখে রাখা দরকার?");
  assert.equal(cleanRecipe(exampleRecipe).title, exampleRecipe.title);
});

/** A 2D context that records text instead of drawing it; widths are roughly half the font size per character. */
function fakeCanvas() {
  const texts: Array<{ text: string; y: number }> = [];
  let font = "16px x";
  const context = new Proxy({}, {
    get: (_, key) => key === "font" ? font
      : key === "measureText" ? (text: string) => ({ width: text.length * Number(/(\d+)px/.exec(font)![1]) * 0.5 })
      : key === "fillText" ? (text: string, _x: number, y: number) => texts.push({ text, y })
      : key === "createRadialGradient" ? () => ({ addColorStop() {} })
      : () => {},
    set: (_, key, value) => { if (key === "font") font = value; return true; },
  });
  return { canvas: { width: 0, height: 0, getContext: () => context } as unknown as HTMLCanvasElement, texts };
}

test("the feed card keeps dish, whose and story, and says when the rest is in the link", () => {
  const long = recipeCard({ ...exampleRecipe, steps: Array(MAX_STEPS).fill("চাল-ডাল ভালো করে ধুয়ে আধা ঘণ্টা ভিজিয়ে রাখো, তারপর পানি ঝরিয়ে নাও।").join("\n") });
  const { canvas, texts } = fakeCanvas();
  drawCard(canvas, long, "feed", "example.com");
  const all = texts.map(item => item.text).join("|");
  for (const part of ["ভুনা খিচুড়ি", "নানুর রেসিপি", "বৃষ্টি", "পোলাও চাল", "১", MORE_NOTE]) assert.ok(all.includes(part), part);
  const footerTop = 1350 - 96;
  assert.ok(texts.filter(item => item.y > footerTop - 50).every(item => item.y > footerTop || item.text === recipeLine(long)), "nothing runs into the human line or footer");
});

test("a short recipe fits whole, and the story card keeps text inside the safe zone", () => {
  const short = recipeCard({ ...exampleRecipe, steps: "ধুয়ে নাও।\nরাঁধো।", ingredients: "চাল — ১ কাপ", memory: "ছুটির দুপুরের রান্না।" });
  const feed = fakeCanvas();
  drawCard(feed.canvas, short, "feed", "example.com");
  assert.ok(!feed.texts.some(item => item.text === MORE_NOTE));
  const story = fakeCanvas();
  drawCard(story.canvas, recipeCard(exampleRecipe), "story", "example.com");
  // The stamp is drawn rotated, so its y is local to the stamp; skip it.
  const body = story.texts.filter(item => ![RECIPE_ASK, "example.com", "নানুর রেসিপি"].includes(item.text));
  assert.ok(body.every(item => item.y > 250 && item.y < 1920 - 260), "story text stays between the top safe zone and the footer band");
});
