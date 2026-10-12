import { possessive } from "../../../shared/bangla";

export const MAX_LINES = 6;
export const MAX_EXTRAS = 3;
export const MAX_NAME = 16;

// Ids travel in share links and tallies: once links are public, only append; never rename or delete.
export const teas = [
  { id: "dudh", label: "দুধ চা", color: "#d4a06a" },
  { id: "rong", label: "রং চা", color: "#8e3a12" },
  { id: "lebu", label: "লেবু চা", color: "#c98b2a" },
  { id: "ada", label: "আদা চা", color: "#b06d36" },
  { id: "malai", label: "মালাই চা", color: "#ead0a0" },
  { id: "mosla", label: "মসলা চা", color: "#a5663a" },
  { id: "tetul", label: "তেঁতুল চা", color: "#6f3318" },
  { id: "tandoori", label: "তন্দুরি চা", color: "#9a5631" },
] as const;

export const sugars = [
  { id: "0", label: "চিনি ছাড়া" },
  { id: "kom", label: "চিনি কম" },
  { id: "mid", label: "চিনি মাপমতো" },
  { id: "beshi", label: "চিনি বেশি" },
] as const;

export const cups = [
  { id: "cup", label: "কাপে" },
  { id: "bhar", label: "মাটির কাপে" },
] as const;

// Generic line drawings on a 48×48 grid, shared by the chips and the canvas card.
export const extras = [
  { id: "toast", label: "টোস্ট", unit: "টা", drawing: "M6 27c0-6 6-10 18-10s18 4 18 10v4H6ZM13 23l2 2m8-4 2 2m8-1 2 2" },
  { id: "biscuit", label: "বিস্কুট", unit: "টা", drawing: "M11 13h26a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V15a2 2 0 0 1 2-2ZM17 20h.5m6.5 0h.5m6.5 0h.5M17 28h.5m6.5 0h.5m6.5 0h.5" },
  { id: "bonruti", label: "বনরুটি", unit: "টা", drawing: "M8 34c0-12 7-20 16-20s16 8 16 20ZM6 34h36M16 22c2-2 5-3 8-3" },
  { id: "singara", label: "সিঙ্গারা", unit: "টা", drawing: "M24 8 41 38H7ZM15 31h18M19 24l5 3 5-3" },
  { id: "puri", label: "পুরি", unit: "টা", drawing: "M24 13c10 0 17 5 17 11s-7 11-17 11S7 30 7 24s7-11 17-11ZM15 22c3-3 7-4 11-4" },
  { id: "dalpuri", label: "ডালপুরি", unit: "টা", drawing: "M7 24a17 13 0 1 0 34 0a17 13 0 1 0-34 0ZM17 20h.5m10 1h.5M21 28h.5m8-1h.5M14 26h.5" },
  { id: "kola", label: "কলা", unit: "টা", drawing: "M9 13c2 15 12 23 29 21-3 4-7 5-12 5-10 0-17-8-17-26ZM7 11l3 3m28 20 3 2" },
] as const;

export const vessel = {
  cup: { body: "M10 16h26v13a11 11 0 0 1-11 11h-4A11 11 0 0 1 10 29Z", rest: "M36 19h2a5 5 0 0 1 0 10h-3M5 44h36" },
  bhar: { body: "M9 15h30l-5 27H14Z", rest: "M7 15h34M12 26h24" },
} as const;
export const steam = "M17 10c-2-2 2-4 0-6m7 6c-2-2 2-4 0-6m7 6c-2-2 2-4 0-6";

export type TeaId = (typeof teas)[number]["id"];
export type SugarId = (typeof sugars)[number]["id"];
export type CupId = (typeof cups)[number]["id"];
export type ExtraId = (typeof extras)[number]["id"];
export type Line = { tea: TeaId; sugar: SugarId; cup: CupId; extras: ExtraId[]; name: string };

export const defaultLine: Line = { tea: "dudh", sugar: "kom", cup: "cup", extras: ["toast"], name: "" };

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

const pick = <T extends { id: string }>(list: readonly T[], id: string) => list.find(item => item.id === id);
export const teaOf = (id: TeaId) => pick(teas, id)!;
export const extraOf = (id: ExtraId) => pick(extras, id)!;
const has = (list: readonly { id: string }[], id: string) => list.some(item => item.id === id);

/** Strips control and bidi characters (so a link can't scramble the card) and the link's name separator. */
export function cleanName(name: string) {
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩,]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME).trim();
}

/** Tapping an extra toggles it; a fourth pushes out the oldest, so the plate never says no. */
export function toggleExtra(current: readonly ExtraId[], id: ExtraId): ExtraId[] {
  if (current.includes(id)) return current.filter(item => item !== id);
  return [...current, id].slice(-MAX_EXTRAS);
}

export function orderText(line: Line) {
  return `${teaOf(line.tea).label} · ${pick(sugars, line.sugar)!.label} · ${pick(cups, line.cup)!.label}`;
}

export function sideText(line: Line) {
  return line.extras.length ? `সাথে ${line.extras.map(id => extraOf(id).label).join(", ")}` : "শুধু চা";
}

// Link: o=tea.sugar.cup[.extra_extra];… and n=name,name (names percent-encoded, same order, may be empty).
export function encodeOrder(lines: readonly Line[]) {
  const kept = lines.slice(0, MAX_LINES);
  const o = kept.map(line => [line.tea, line.sugar, line.cup, ...(line.extras.length ? [line.extras.slice(0, MAX_EXTRAS).join("_")] : [])].join(".")).join(";");
  const names = kept.map(line => cleanName(line.name));
  return names.some(Boolean) ? `o=${o}&n=${names.map(encodeURIComponent).join(",")}` : `o=${o}`;
}

export function decodeOrder(hash: string): Line[] | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const raw = params.get("o") ?? "";
  if (!raw || raw.length > 400) return null;
  const names = (params.get("n") ?? "").split(",");
  const lines = raw.split(";").slice(0, MAX_LINES).flatMap((entry, index): Line[] => {
    const [tea = "", sugar = "", cup = "", side = "", ...rest] = entry.split(".");
    const sides = side ? side.split("_") : [];
    if (rest.length || !has(teas, tea) || !has(sugars, sugar) || !has(cups, cup) || sides.length > MAX_EXTRAS || !sides.every(id => has(extras, id))) return [];
    return [{ tea: tea as TeaId, sugar: sugar as SugarId, cup: cup as CupId, extras: [...new Set(sides as ExtraId[])], name: cleanName(names[index] ?? "") }];
  });
  return lines.length ? lines : null;
}

export function chitTitle(lines: readonly Line[]) {
  if (lines.length > 1) return `আড্ডার অর্ডার · ${bn(lines.length)} জন`;
  return lines[0]?.name ? `${possessive(lines[0].name)} অর্ডার` : "আমার অর্ডার";
}

/** "৩ কাপ চা · ২টা সিঙ্গারা · ১টা টোস্ট": what মামা has to bring, the three most-ordered extras so it fits one line. */
export function totalText(lines: readonly Line[]) {
  const counts = new Map<ExtraId, number>();
  for (const line of lines) for (const id of line.extras) counts.set(id, (counts.get(id) ?? 0) + 1);
  const sides = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, count]) => `${bn(count)}${extraOf(id).unit} ${extraOf(id).label}`);
  return [`${bn(lines.length)} কাপ চা`, ...sides].join(" · ");
}

/** The human line, chosen from the order. First matching rule wins. */
export function orderLine(lines: readonly Line[]) {
  if (lines.length > 1) {
    const kinds = new Set(lines.map(line => line.tea)).size;
    return kinds > 1 ? `এক বেঞ্চে ${bn(kinds)} রকম চা, তবু আড্ডা একটাই।` : `${bn(lines.length)} জন, একই চা। এই না হলে বন্ধু!`;
  }
  const line = lines[0] ?? defaultLine;
  const side = (id: ExtraId) => line.extras.includes(id);
  if (line.tea === "lebu" && line.sugar === "0" && (side("biscuit") || side("toast"))) return "চায়ে স্বাস্থ্য খোঁজো, বিস্কুটে সেটা ভাঙো।";
  if (line.tea === "rong" && line.sugar === "0") return "চিনি ছাড়া কড়া রং চা। তুমি সিরিয়াস মানুষ।";
  if (line.sugar === "beshi") return "দিনটা এমনিতেই তেতো, চা-টা অন্তত মিষ্টি হোক।";
  if (line.tea === "tandoori") return "পোড়া মাটির ঘ্রাণ, তন্দুরির মজা এখানেই।";
  if (line.tea === "malai") return "মালাই চা, ওপরে সরের পরত। প্রথম চুমুকেই গোঁফে লাগবে।";
  if (line.tea === "tetul") return "টক-ঝাল-মিষ্টি, একদম আড্ডার মতো।";
  if (side("singara") || side("puri") || side("dalpuri")) return "ভাজাপোড়া ছাড়া বিকেলের চা জমে না।";
  if (side("toast")) return "টোস্ট ডোবাতে দেরি করলেই কাপের তলায়।";
  if (side("bonruti")) return "বনরুটি ডোবানো চায়ের শেষ চুমুকটা চামচে খেতে হয়।";
  if (side("kola")) return "চা আর একটা কলা, নাশতা হয়ে গেল।";
  if (line.cup === "bhar") return "মাটির কাপের চায়ে স্বাদটা একটু বেশি।";
  if (line.tea === "ada") return "ঠান্ডা লাগলে আদা চা, না লাগলেও আদা চা।";
  if (line.tea === "mosla") return "মসলা চায়ে বৃষ্টির বিকেলের ঘ্রাণ।";
  if (line.tea === "dudh" && line.sugar === "kom") return "দুধ চা, চিনি কম। মামা না বলতেই বোঝে।";
  return "এক কাপ চা, আর কিছু না। শান্তি।";
}

/** Ids counted in the anonymous tally: only fixed picks, never names. */
export const tallyIds: readonly string[] = [...teas, ...sugars, ...cups, ...extras].map(item => item.id);
export const lineTally = (line: Line) => [line.tea, line.sugar, line.cup, ...line.extras];

/** "দুধ চা, চিনি কম": the most-counted tea and sugar, or null below the minimum sample. */
export function favourite(counts: Record<string, number>, total: number, minimum: number) {
  if (total < minimum) return null;
  const top = <T extends { id: string; label: string }>(list: readonly T[]) => list.reduce((best, item) => (counts[item.id] ?? 0) > (counts[best.id] ?? 0) ? item : best);
  return `${top(teas).label}, ${top(sugars).label}`;
}

export { possessive };
