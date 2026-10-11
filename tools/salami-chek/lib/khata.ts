import { bn, cleanName, givers, possessive, readAmount } from "./cheque";

// খাতা links store these ids: the cheque's givers first, then relations only the খাতা has. Only append; never rename or reorder.
export const khataGivers = [
  ...givers,
  { id: "mami", label: "মামি" },
  { id: "khalu", label: "খালু" },
  { id: "chachi", label: "চাচি" },
  { id: "fupa", label: "ফুপা" },
  { id: "dulabhai", label: "দুলাভাই" },
  { id: "bhabi", label: "ভাবি" },
  { id: "uncle", label: "আঙ্কেল" },
  { id: "aunty", label: "আন্টি" },
] as const;

export type KhataGiverId = (typeof khataGivers)[number]["id"];
/** One line of the খাতা: who gave, and the amount only if the person chose to write it. */
export type KhataRow = { giver: KhataGiverId; amount: number | null };
export type Khata = { name: string; rows: KhataRow[] };

export const defaultKhata: Khata = { name: "", rows: [{ giver: "mama", amount: null }, { giver: "khalamoni", amount: null }, { giver: "nanu", amount: null }] };

const isKhataGiver = (id: string): id is KhataGiverId => khataGivers.some(giver => giver.id === id);
export const khataLabel = (id: KhataGiverId) => khataGivers.find(giver => giver.id === id)!.label;

/** "#k=mama.500-nanu&n=রাফি": rows in the order they were written, each giver once. Cheque links use g/a and never carry k. */
export function khataHash({ name, rows }: Khata) {
  const params = new URLSearchParams({ k: rows.map(({ giver, amount }) => amount ? `${giver}.${amount}` : giver).join("-") });
  const shownName = cleanName(name);
  if (shownName) params.set("n", shownName);
  return "#" + params.toString();
}

export function parseKhataHash(hash: string): Khata | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const rows: KhataRow[] = [];
  for (const token of (params.get("k") ?? "").split("-")) {
    const [giver, raw, extra] = token.split(".");
    if (!isKhataGiver(giver) || extra !== undefined || rows.some(row => row.giver === giver)) return null;
    const amount = raw === undefined ? null : readAmount(raw);
    if (raw !== undefined && amount === null) return null;
    rows.push({ giver, amount });
  }
  return { name: cleanName(params.get("n") ?? ""), rows };
}

export const khataTitle = (name: string) => name ? `${possessive(name)} সালামি খাতা` : "আমার সালামি খাতা";
export const khataCount = (rows: readonly KhataRow[]) => `${bn(rows.length)} জনের দোয়া আর সালামি`;
export const khataNames = (rows: readonly KhataRow[]) => rows.map(row => khataLabel(row.giver)).join(", ");

/** The sum of the amounts the person wrote, or null when none were written. Shown once, small; never compared or counted anywhere. */
export function khataTotal(rows: readonly KhataRow[]) {
  return rows.reduce((sum, row) => sum + (row.amount ?? 0), 0) || null;
}

/** The human line: about who was there, never about how much. */
export function khataLine({ rows }: Khata) {
  const has = (id: KhataGiverId) => rows.some(row => row.giver === id);
  if (rows.length >= 8) return "এত জনের আদর এক পাতায়, এবারের ঈদটা ভরা ভরা।";
  if (has("dulabhai")) return "দুলাভাই এবারও কথা রেখেছে!";
  if (has("nanu") || has("dadu")) return `${has("nanu") ? "নানুর" : "দাদুর"} দোয়া আর নতুন নোট, দুটোই খাতায় উঠল।`;
  if (rows.length === 1) return "একজনের আদরেই ঈদের সকালটা মিষ্টি।";
  return "নোট খরচ হয়ে যাবে, আদরটুকু খাতায় থেকে যাক।";
}

export function khataPreviewTitle({ name, rows }: Khata) {
  return `${name ? `${possessive(name)} সালামি খাতা` : "এবারের ঈদের সালামি খাতা"} · ${khataCount(rows)}`;
}
