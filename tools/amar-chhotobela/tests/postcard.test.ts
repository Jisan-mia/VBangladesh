import assert from "node:assert/strict";
import test from "node:test";
import { moveMemory, createPostcard, MAX_MEMORIES, MAX_NAME_LENGTH, memories, toggleMemory } from "../lib/postcard";

test("a full card still lets a person remove a memory", () => {
  const selected = memories.slice(0, MAX_MEMORIES).map((memory) => memory.id);
  assert.deepEqual(toggleMemory(selected, selected[2]), selected.filter((_, index) => index !== 2));
});

test("a ninth memory cannot enter a full card", () => {
  const selected = memories.slice(0, MAX_MEMORIES).map((memory) => memory.id);
  assert.deepEqual(toggleMemory(selected, memories[MAX_MEMORIES].id), selected);
});

test("the postcard preserves the order a person chose", () => {
  assert.deepEqual(createPostcard("", ["kite", "rain", "letter"]).memories.map((memory) => memory.id), ["kite", "rain", "letter"]);
});

test("removing and choosing again moves a memory to the end", () => {
  const selected = toggleMemory(["kite", "rain"], "kite");
  assert.deepEqual(toggleMemory(selected, "kite"), ["rain", "kite"]);
});

test("a blank postcard does not invent memories", () => {
  assert.deepEqual(createPostcard("   ", []).memories, []);
});

test("names remain plain text and only redundant whitespace is removed", () => {
  assert.equal(createPostcard("  <রিমা>   আক্তার  ", ["rain"]).name, "<রিমা> আক্তার");
});

test("long names are rejected before they enter the renderer", () => {
  assert.throws(() => createPostcard("a".repeat(MAX_NAME_LENGTH + 1), []), RangeError);
});

test("unknown memory identifiers cannot become export content", () => {
  assert.throws(() => createPostcard("", ["unrecognized"]), RangeError);
});

test("duplicate memories cannot become export content", () => {
  assert.throws(() => createPostcard("", ["rain", "rain"]), RangeError);
});

test("the export content rejects more than eight memories", () => {
  assert.throws(() => createPostcard("", memories.slice(0, MAX_MEMORIES + 1).map((memory) => memory.id)), RangeError);
});

test("moving a selected memory changes export order without mutating the previous selection", () => {
  const selection = ["rain", "kite", "tiffin"];
  const reordered = moveMemory(selection, "kite", -1);
  assert.deepEqual([createPostcard("", reordered).memories.map(memory => memory.id), selection], [["kite", "rain", "tiffin"], ["rain", "kite", "tiffin"]]);
});

test("moving beyond either end or moving an unselected memory creates no history change", () => {
  const selection = ["rain", "kite"];
  assert.ok(moveMemory(selection, "rain", -1) === selection && moveMemory(selection, "kite", 1) === selection && moveMemory(selection, "tiffin", 1) === selection);
});
