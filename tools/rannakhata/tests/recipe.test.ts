import assert from "node:assert/strict";
import test from "node:test";
import { emptyRecipe, recipeCard, recipeLines, recipeLimits, recipeText, validateRecipe } from "../lib/recipe";

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
  assert.doesNotMatch(recipeText(validRecipe), /কার কাছে শেখা|কতজনের জন্য|এই রান্নার পেছনের গল্প/);
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
