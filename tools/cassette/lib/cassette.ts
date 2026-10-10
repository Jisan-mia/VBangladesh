import { possessive } from "../../../shared/bangla";
import { songs, type Song } from "./songs";

export { songs, possessive, type Song };
export const SLOTS = 10;
export const SIDE = 5;
export const MAX_TITLE_LENGTH = 20;
export const DEFAULT_TITLE = "আমার মিক্সটেপ";

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);
const years = new Intl.NumberFormat("bn-BD", { useGrouping: false });

export const kinds = [
  { id: "band", label: "ব্যান্ড" },
  { id: "lok", label: "লোকগান" },
  { id: "kobi", label: "রবীন্দ্র-নজরুল" },
  { id: "chobi", label: "সিনেমা ও আধুনিক" },
] as const;
export type KindId = (typeof kinds)[number]["id"];

/** J-card paper colours, the ones cassette shops sold inlays in. */
export const inlays = [
  { id: 0, label: "হলুদ", paper: "#f4d04a", rule: "#d9ae1f" },
  { id: 1, label: "গোলাপি", paper: "#f5b3c4", rule: "#e08aa1" },
  { id: 2, label: "আকাশি", paper: "#a8d4ee", rule: "#7fb5d6" },
  { id: 3, label: "সবুজ", paper: "#b9dc9c", rule: "#93c172" },
  { id: 4, label: "কমলা", paper: "#f7ab68", rule: "#de8a43" },
] as const;

export const titleIdeas = ["আমার মিক্সটেপ", "বৃষ্টির দিনের গান", "রাত জাগার গান", "বাসে শোনার জন্য"] as const;

/** A spread of eras and kinds, so the first J-card already reads like someone's real tape. */
export const defaultSlots: readonly number[] = [18, 42, 86, 36, 11, 15, 49, 64, 92, 108];

/*
 * The six Bangla seasons on the revised Bangladesh calendar (in use since 1426 / 2019: পহেলা বৈশাখ is always 14 April,
 * বৈশাখ–আশ্বিন have 31 days, ফাল্গুন 29 or 30, the rest 30), two months each.
 * https://bn.wikipedia.org/wiki/বঙ্গাব্দ · https://en.wikipedia.org/wiki/Bengali_calendars#Revised_calendar_of_Bangladesh
 * Each entry is the season's first day as [month (1–12), day].
 */
export const seasons = [
  { id: "grishmo", label: "গ্রীষ্ম", from: [4, 14] },
  { id: "borsha", label: "বর্ষা", from: [6, 15] },
  { id: "shorot", label: "শরৎ", from: [8, 16] },
  { id: "hemonto", label: "হেমন্ত", from: [10, 17] },
  { id: "sheet", label: "শীত", from: [12, 16] },
  { id: "boshonto", label: "বসন্ত", from: [2, 14] },
] as const;

/** "sheet-2026": the Bangla season and the calendar year on a given day, for "রাফির মিক্সটেপ · শীত ২০২৬". */
export function seasonOf(date: Date) {
  const day = (date.getMonth() + 1) * 100 + date.getDate();
  const starts = seasons.map(season => ({ id: season.id, at: season.from[0] * 100 + season.from[1] })).sort((a, b) => b.at - a.at);
  // Before 14 Feb it is still the winter that began in December.
  const season = starts.find(start => day >= start.at) ?? starts.find(start => start.id === "sheet")!;
  return `${season.id}-${date.getFullYear()}`;
}

const WHEN = /^(grishmo|borsha|shorot|hemonto|sheet|boshonto)-(20[2-9]\d)$/;
export function seasonLabel(when: string) {
  const match = WHEN.exec(when);
  if (!match) return "";
  return `${seasons.find(season => season.id === match[1])!.label} ${years.format(Number(match[2]))}`;
}

export type Tape = { slots: number[]; title: string; color: number; when: string };

// Control and direction-override characters out, so a shared link can't scramble the card. ZWJ/ZWNJ stay for Bangla shaping.
const UNSAFE = /[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g;

/** The tape's name: NFC, one line, safe, ≤20 characters. */
export function cleanTitle(text: string) {
  const flat = text.normalize("NFC").replace(UNSAFE, " ").replace(/\s+/g, " ").trim();
  return Array.from(flat).slice(0, MAX_TITLE_LENGTH).join("").trim();
}

export const shownTitle = (tape: Pick<Tape, "title">) => cleanTitle(tape.title) || DEFAULT_TITLE;

/** Puts a song in a slot; if it is already on the tape, the two swap places so nothing is recorded twice. */
export function placeSong(slots: readonly number[], slot: number, song: number): number[] {
  if (!Number.isInteger(song) || song < 0 || song >= songs.length) throw new RangeError("এই গানটা তালিকায় নেই।");
  const next = [...slots];
  const existing = next.indexOf(song);
  if (existing >= 0 && existing !== slot) next[existing] = next[slot];
  next[slot] = song;
  return next;
}

export function credit(song: Song) {
  if (song.role === "kotha-sur") return `কথা-সুর: ${song.by}`;
  return song.also ? `${song.by} · ${song.also}` : song.by;
}

/** "A১" … "B৫" */
export const slotLabel = (slot: number) => `${slot < SIDE ? "A" : "B"}${bn((slot % SIDE) + 1)}`;

/** "#s=12,44,…&t=<name>&c=2&w=sheet-2026" */
export function shareHash({ slots, title, color, when }: Tape) {
  const params = new URLSearchParams({ s: slots.join(",") });
  const name = cleanTitle(title);
  if (name) params.set("t", name);
  if (color) params.set("c", String(color));
  if (WHEN.test(when)) params.set("w", when);
  return "#" + params.toString();
}

/** Exactly ten distinct songs from the list, or null. Name, colour and season fall back quietly when they're off. */
export function parseShareHash(hash: string): Tape | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const raw = params.get("s") ?? "";
  if (raw.length > 60) return null;
  const parts = raw.split(",");
  if (parts.length !== SLOTS || !parts.every(part => /^\d{1,3}$/.test(part))) return null;
  const slots = parts.map(Number);
  if (slots.some(song => song >= songs.length) || new Set(slots).size !== SLOTS) return null;
  const color = Number(params.get("c") ?? 0);
  const when = params.get("w") ?? "";
  return { slots, title: cleanTitle(params.get("t") ?? ""), color: inlays.some(inlay => inlay.id === color) ? color : 0, when: WHEN.test(when) ? when : "" };
}

/** The human line, chosen by which era fills most of the tape. */
export function tapeLine(slots: readonly number[]) {
  const picked = slots.map(slot => songs[slot]);
  const count = (test: (song: Song) => boolean) => picked.filter(test).length;
  if (count(song => song.era === "90") >= 5) return "তোমার ক্যাসেট এখনো রিওয়াইন্ড হয়।";
  if (count(song => song.kind === "band") >= 7) return "ভলিউমটা একটু বাড়াও, এটা ব্যান্ডের ক্যাসেট।";
  if (count(song => song.kind === "lok") >= 5) return "এই ক্যাসেট বাজলে উঠোনে শীতলপাটি পড়ে।";
  if (count(song => song.kind === "kobi") >= 5) return "ভোরবেলার রেডিওর মতো একটা ক্যাসেট।";
  if (count(song => song.era === "old") >= 5) return "রেডিওর অনুরোধের আসর থেকে তুলে রাখা গান।";
  if (count(song => song.era === "00") >= 5) return "ব্লুটুথে গান পাঠানোর দিনগুলো এই ফিতায় আটকে আছে।";
  if (count(song => song.era === "new") >= 5) return "নতুন গান, পুরোনো ফিতা, দিব্যি মিলে গেছে।";
  return "সব যুগের গান এক ফিতায়, এটাই আসল মিক্সটেপ।";
}

/** Songs on both tapes, in my tape's order. */
export const commonSongs = (own: readonly number[], friend: Tape | null) => friend ? own.filter(song => friend.slots.includes(song)) : [];

/** "দুজনেরই আছে: সেই তুমি, মেলায় যাইরে আর ২টা" — for the card when a friend's tape is open. */
export function commonLine(own: readonly number[], friend: Tape | null) {
  if (!friend) return "";
  const who = friend.title ? `“${cleanTitle(friend.title)}”-এর` : "বন্ধুর ক্যাসেটের";
  const both = commonSongs(own, friend).map(song => songs[song].title);
  if (!both.length) return `${who} সাথে একটা গানও মেলেনি!`;
  if (both.length === SLOTS) return `${who} সাথে দশটাই মিলে গেছে!`;
  return `দুজনেরই আছে: ${both.slice(0, 2).join(", ")}${both.length > 2 ? ` আর ${bn(both.length - 2)}টা` : ""}`;
}

export function previewTitle(tape: Tape) {
  return tape.title ? `${tape.title} — দশ গানের ক্যাসেট। তোমার ক্যাসেটে কোন গান?` : "এক বন্ধুর দশ গানের ক্যাসেট — তোমার ক্যাসেটে কোন গান?";
}

export function previewDescription(tape: Tape) {
  const titles = tape.slots.slice(0, 3).map(slot => songs[slot].title);
  return `${titles.join(", ")}… সাইড A আর সাইড B মিলিয়ে নিজের দশ গানের ক্যাসেট বানাও, বন্ধুর ক্যাসেটের সাথে মিলিয়ে দেখো।`;
}

/** Anonymous tally ids: one per listed song. Tape names are never counted. */
export const tallyId = (song: number) => `s${song}`;
export const tallyIds: string[] = songs.map((_, index) => tallyId(index));
