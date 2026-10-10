import assert from "node:assert/strict";
import test from "node:test";
import { share } from "../share";
import { cardText, cleanName, decodeSettings, decodeStrokes, encodeSettings, encodeStrokes, LINK_STROKE_BUDGET, parseShareHash, possessive, shareState, strokeColors, thinPoints, BRUSH_DARK, BRUSH_WHITE, type Shared } from "../lib/card";
import { DRAWING_RADIUS, MAX_STROKES, MAX_STROKE_POINTS, type DrawingStroke } from "../lib/drawing";
import { defaultSettings, palettes, presets } from "../lib/pattern";
import { MAX_SHARE_STATE } from "../../../shared/share-types";

const wiggle = (seed: number, count = 200): DrawingStroke => ({
  color: palettes[0].ink, width: 4, symmetry: 8, mirrored: true,
  points: Array.from({ length: count }, (_, index) => ({ x: Math.round(Math.sin(index / 7 + seed) * 300 * 1000) / 1000, y: Math.round(Math.cos(index / 9 + seed) * 300 * 1000) / 1000 - index / 4 })),
});
const motif: Shared = { settings: presets[1].settings, mode: "motif", strokes: [], occasion: "boishakh", name: "রাফি" };

test("every ready design and setting combination survives the link", () => {
  for (const preset of presets) assert.deepEqual(decodeSettings(encodeSettings(preset.settings)), preset.settings);
  assert.equal(decodeSettings("00999"), null);
  assert.equal(decodeSettings("0011"), null);
});

test("a motif alpana round-trips with occasion and name", () => {
  const { state } = shareState(motif);
  assert.deepEqual(parseShareHash("#" + state), motif);
});

test("hand-drawn strokes round-trip as whole-unit points with their brush", () => {
  const stroke: DrawingStroke = { color: BRUSH_DARK, width: 8, symmetry: 12, mirrored: false, points: [{ x: 10.4, y: -20.6 }, { x: 40, y: 80 }, { x: -388, y: 0 }] };
  const [decoded] = decodeStrokes(encodeStrokes([stroke]).code);
  assert.deepEqual(decoded, { ...stroke, points: [{ x: 10, y: -21 }, { x: 40, y: 80 }, { x: -388, y: 0 }] });
  assert.deepEqual(decodeStrokes(encodeStrokes([{ ...stroke, points: [{ x: 0, y: -40 }] }]).code)[0].points, [{ x: 0, y: -40 }]);
  assert.deepEqual(decodeStrokes(encodeStrokes([{ ...stroke, points: [{ x: -388.9, y: 0.4 }, { x: 900, y: -900 }] }]).code)[0].points.map(point => Math.abs(point.x) <= 388 && Math.abs(point.y) <= 388), [true, true]);
});

test("every brush colour has a link code", () => {
  for (const palette of palettes) assert.ok(strokeColors.includes(palette.ink) && strokeColors.includes(palette.detail));
  assert.ok(strokeColors.includes(BRUSH_WHITE) && strokeColors.length <= 64);
});

test("thinning keeps both ends and drops points closer than the gap", () => {
  const points = Array.from({ length: 50 }, (_, index) => ({ x: index, y: 0 }));
  const thin = thinPoints(points, 10);
  assert.deepEqual([thin[0], thin.at(-1)], [{ x: 0, y: 0 }, { x: 49, y: 0 }]);
  assert.ok(thin.every((point, index) => index === 0 || index === thin.length - 1 || point.x - thin[index - 1].x >= 10));
});

test("a full drawing is thinned, then trimmed, to fit the link budget and says how many strokes went", () => {
  const strokes = Array.from({ length: MAX_STROKES }, (_, index) => wiggle(index, MAX_STROKE_POINTS));
  const { code, sent } = encodeStrokes(strokes);
  assert.ok(code.length <= LINK_STROKE_BUDGET && sent > 0 && sent <= MAX_STROKES);
  assert.equal(decodeStrokes(code).length, sent);
  const small = encodeStrokes([wiggle(1, 40)]);
  assert.equal(small.sent, 1);
  const drawn: Shared = { ...motif, mode: "draw", strokes };
  assert.ok(shareState(drawn).state.length < MAX_SHARE_STATE);
});

test("hostile links never produce out-of-range strokes or settings", () => {
  for (const hash of ["", "#tool", "#result", "#a=abcde", "#a=00000&m=d", "#a=00000&m=d&s=%3Cscript%3E", "#a=00000&m=d&s=" + "_".repeat(9000)]) {
    assert.equal(parseShareHash(hash), null, hash);
  }
  const strokes = decodeStrokes("A_" + "____".repeat(3) + ".ZZAAAA.AAAA" + ".AA" + "AAAA".repeat(MAX_STROKE_POINTS + 1));
  assert.deepEqual(strokes, []);
  const far = decodeStrokes("AA____AAAA");
  assert.ok(far.length === 1 && far[0].points.every(point => Math.hypot(point.x, point.y) <= DRAWING_RADIUS + 1));
});

test("names are cleaned, capped and NFC-normalised; unknown occasions are dropped", () => {
  const parsed = parseShareHash("#a=00000&o=eid&n=" + encodeURIComponent("  রা‮ফি\u0000  " + "ক".repeat(80)));
  assert.equal(parsed?.occasion, "");
  assert.equal(parsed?.name.length, 30);
  assert.ok(!/[\u0000‮]/.test(parsed?.name ?? ""));
  assert.equal(cleanName("কি্‍"), cleanName("কি্‍".normalize("NFC")));
});

test("card text follows the occasion, the mode and the name", () => {
  assert.deepEqual(cardText({ occasion: "puja", mode: "motif", name: "মিতু" }).title, "শারদীয় শুভেচ্ছা");
  assert.equal(cardText({ occasion: "", mode: "draw", name: "" }).signature, "");
  assert.notEqual(cardText({ occasion: "", mode: "draw", name: "" }).line, cardText({ occasion: "", mode: "motif", name: "" }).line);
  assert.equal(cardText({ occasion: "", mode: "motif", name: "জাহিদ" }).signature, "আঁকল: জাহিদ");
});

test("share preview is personal, and normalize rejects junk and is stable", () => {
  const { state } = shareState(motif);
  assert.equal(share.normalize(state), state);
  assert.equal(share.normalize("hello"), null);
  assert.equal(share.preview(state).title, "রাফির আঁকা আলপনা — তুমিও একটা আঁকো");
  assert.equal(share.preview(shareState({ ...motif, name: "" }).state).title, "এক বন্ধুর আঁকা আলপনা — তুমিও একটা আঁকো");
  assert.equal(possessive("জাহিদ"), "জাহিদের");
  assert.equal(share.tally, undefined);
  const drawn = shareState({ ...motif, settings: defaultSettings, mode: "draw", strokes: [wiggle(2)] }).state;
  assert.equal(share.normalize(drawn), drawn);
});
