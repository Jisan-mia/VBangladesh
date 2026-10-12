import { DRAWING_RADIUS, MAX_STROKES, MAX_STROKE_POINTS, type DrawingPoint, type DrawingStroke } from "./drawing";
import { densities, layouts, motifs, palettes, symmetries, type PatternSettings } from "./pattern";
import { possessive } from "../../../shared/bangla";

export const MAX_NAME_LENGTH = 30;
/** Hand-drawn strokes may use at most this many link characters; /api/share accepts 8000 in all. */
export const LINK_STROKE_BUDGET = 6000;
export const BRUSH_WHITE = "#fff5d8";
export const BRUSH_DARK = "#252525";

export const occasions = [
  { id: "boishakh", label: "পহেলা বৈশাখ", title: "শুভ নববর্ষ", line: "চৈত্রের শেষ রাতে আঁকা, বৈশাখের ভোরে শুকিয়ে সাদা।" },
  { id: "ekushe", label: "একুশে", title: "অমর একুশে", line: "রাত জেগে পথে আঁকা, ভোরে খালি পায়ে প্রভাতফেরি।" },
  { id: "holud", label: "গায়ে হলুদ", title: "গায়ে হলুদ", line: "হলুদের আগের রাতে সবাই মিলে উঠোনজুড়ে আঁকা।" },
  { id: "puja", label: "পূজা", title: "শারদীয় শুভেচ্ছা", line: "ঢাকের শব্দে ঘুম ভাঙল, উঠোনে সাদা আলপনা।" },
  { id: "bijoy", label: "বিজয় দিবস", title: "শুভ বিজয় দিবস", line: "বিজয়ের সকালে উঠোনভরা সাদা আলপনা।" },
  { id: "nobanno", label: "নবান্ন", title: "নবান্নের শুভেচ্ছা", line: "নতুন চালের গুঁড়ি গুলে বছরের প্রথম আলপনা।" },
] as const;

export type OccasionId = (typeof occasions)[number]["id"];
export type AlpanaDoc = { settings: PatternSettings; mode: "motif" | "draw"; strokes: DrawingStroke[] };
export type Shared = AlpanaDoc & { occasion: OccasionId | ""; name: string };

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

export function cleanName(name: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the card text.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}


export function cardText({ occasion, mode, name }: Pick<Shared, "occasion" | "mode" | "name">) {
  const picked = occasions.find(item => item.id === occasion);
  const shown = cleanName(name);
  return {
    title: picked?.title ?? "উঠোনের আলপনা",
    line: picked?.line ?? (mode === "draw" ? "নিজের হাতে, রেখায় রেখায় আঁকা।" : "চালের গুঁড়ি গুলে উঠোনজুড়ে আঁকা।"),
    signature: shown ? `আঁকল: ${shown}` : "",
  };
}

// Settings travel as five digits: the index of each choice in its list. Lists are link codes: append only.
const settingLists = [motifs.map(item => item.id), palettes.map(item => item.id), symmetries, densities.map(item => item.id), layouts.map(item => item.id)] as const;
const settingKeys = ["motif", "palette", "symmetry", "density", "layout"] as const;

export function encodeSettings(settings: PatternSettings) {
  return settingKeys.map((key, index) => (settingLists[index] as readonly unknown[]).indexOf(settings[key])).join("");
}

export function decodeSettings(code: string): PatternSettings | null {
  if (!/^\d{5}$/.test(code)) return null;
  const values = settingKeys.map((_, index) => settingLists[index][Number(code[index])]);
  if (values.some(value => value === undefined)) return null;
  return Object.fromEntries(settingKeys.map((key, index) => [key, values[index]])) as PatternSettings;
}

// Strokes: two header characters (colour; width, symmetry, mirror) then two base-64 characters per coordinate,
// rounded to whole units. Colours, widths and the alphabet are link codes: append only.
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
export const strokeColors = [...palettes.flatMap(palette => [palette.ink, palette.detail]), BRUSH_WHITE, BRUSH_DARK];
const strokeWidths = [2, 4, 8] as const;
const thinningGaps = [1, 6, 12, 24];

// Whole units inside the drawing circle; the +1 slack keeps an already-rounded point stable on re-encoding.
function linkPoint({ x, y }: DrawingPoint): DrawingPoint {
  const scale = Math.hypot(x, y) > DRAWING_RADIUS + 1 ? DRAWING_RADIUS / Math.hypot(x, y) : 1;
  const whole = (value: number) => Math.max(-DRAWING_RADIUS, Math.min(DRAWING_RADIUS, Math.round(value * scale)));
  return { x: whole(x), y: whole(y) };
}

/** Keeps the first and last point and drops points closer than `gap` units to the previous kept one. */
export function thinPoints(points: readonly DrawingPoint[], gap: number): DrawingPoint[] {
  const rounded = points.map(linkPoint);
  const kept: DrawingPoint[] = [];
  rounded.forEach((point, index) => {
    const last = kept.at(-1);
    const far = !last || Math.hypot(point.x - last.x, point.y - last.y) >= gap;
    const final = index === rounded.length - 1 && (!last || point.x !== last.x || point.y !== last.y);
    if (far || final) kept.push(point);
  });
  return kept;
}

function encodeStroke(stroke: DrawingStroke, gap: number) {
  const color = Math.max(0, strokeColors.indexOf(stroke.color as (typeof strokeColors)[number]));
  const width = Math.max(0, strokeWidths.indexOf(stroke.width as (typeof strokeWidths)[number]));
  const flags = width * 8 + symmetries.indexOf(stroke.symmetry) * 2 + (stroke.mirrored ? 1 : 0);
  const coordinate = (value: number) => B64[(value + DRAWING_RADIUS) >> 6] + B64[(value + DRAWING_RADIUS) & 63];
  return B64[color] + B64[flags] + thinPoints(stroke.points, gap).map(point => coordinate(point.x) + coordinate(point.y)).join("");
}

/** Fits strokes into the link budget: first by thinning points, then by leaving out the last strokes. `sent` says how many made it. */
export function encodeStrokes(strokes: readonly DrawingStroke[], budget = LINK_STROKE_BUDGET) {
  let parts: string[] = [];
  for (const gap of thinningGaps) {
    parts = strokes.map(stroke => encodeStroke(stroke, gap));
    if (parts.join(".").length <= budget) return { code: parts.join("."), sent: parts.length };
  }
  let length = -1, sent = 0;
  while (sent < parts.length && length + 1 + parts[sent].length <= budget) length += 1 + parts[sent++].length;
  return { code: parts.slice(0, sent).join("."), sent };
}

export function decodeStrokes(code: string): DrawingStroke[] {
  if (!code || code.length > LINK_STROKE_BUDGET || /[^A-Za-z0-9_.-]/.test(code)) return [];
  return code.split(".").slice(0, MAX_STROKES).flatMap(part => {
    const color = strokeColors[B64.indexOf(part[0])];
    const flags = B64.indexOf(part[1] ?? "");
    const width = strokeWidths[flags >> 3];
    const symmetry = symmetries[(flags >> 1) & 3];
    const count = (part.length - 2) / 4;
    if (!color || flags < 0 || !width || !symmetry || !Number.isInteger(count) || count < 1 || count > MAX_STROKE_POINTS) return [];
    const value = (at: number) => B64.indexOf(part[at]) * 64 + B64.indexOf(part[at + 1]) - DRAWING_RADIUS;
    const points = Array.from({ length: count }, (_, index) => linkPoint({ x: value(2 + index * 4), y: value(4 + index * 4) }));
    return [{ color, width, symmetry, mirrored: Boolean(flags & 1), points }];
  });
}

export function shareState(shared: Shared) {
  const params = new URLSearchParams({ a: encodeSettings(shared.settings) });
  let sent = 0;
  if (shared.mode === "draw") {
    const strokes = encodeStrokes(shared.strokes);
    params.set("m", "d");
    params.set("s", strokes.code);
    sent = strokes.sent;
  }
  if (shared.occasion) params.set("o", shared.occasion);
  const name = cleanName(shared.name);
  if (name) params.set("n", name);
  return { state: params.toString(), sent };
}

export function parseShareHash(hash: string): Shared | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const settings = decodeSettings(params.get("a") ?? "");
  if (!settings) return null;
  const mode = params.get("m") === "d" ? "draw" : "motif";
  const strokes = mode === "draw" ? decodeStrokes(params.get("s") ?? "") : [];
  if (mode === "draw" && !strokes.length) return null;
  const occasion = occasions.find(item => item.id === params.get("o"))?.id ?? "";
  return { settings, mode, strokes, occasion, name: cleanName(params.get("n") ?? "") };
}

export { possessive };
