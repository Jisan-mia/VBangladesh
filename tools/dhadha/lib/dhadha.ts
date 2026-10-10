import { possessive } from "../../../shared/bangla";
import { riddles, type Riddle } from "./riddles";

export { riddles, possessive, type Riddle };

export const MAX_NAME_LENGTH = 24;
/** Index into [answer, ...decoys]: 0 is the right answer. */
export type Pick = 0 | 1 | 2;
/** 1 or 2: solved on that try. 0: two wrong guesses, so নানি told the answer. */
export type Tries = 0 | 1 | 2;
export type Shared = { date: string; id: string; tries: Tries | null; name: string };

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

const byId = new Map(riddles.map(riddle => [riddle.id, riddle]));
export const riddleById = (id: string) => byId.get(id);

/** Today's date in Bangladesh (YYYY-MM-DD): the riddle changes at midnight Dhaka time, wherever the phone is set. */
export function dhakaDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function isDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const time = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === date && date >= "2026-01-01" && date <= "2099-12-31";
}

const dayNumber = (date: string) => Math.round(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
export const shiftDate = (date: string, days: number) => new Date((dayNumber(date) + days) * 86_400_000).toISOString().slice(0, 10);
/** How far back the day buttons go: one full round of the bank, so every riddle can be played. */
export const oldestDate = (today: string) => shiftDate(today, -(riddles.length - 1));

export function bnDate(date: string) {
  return new Intl.DateTimeFormat("bn-BD", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

// Seeded helpers so every phone deals the same riddle for the same day without a server.
function hash(text: string) {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.codePointAt(0)!, 16777619);
  return value >>> 0;
}
function shuffle<T>(items: readonly T[], seed: number): T[] {
  const list = [...items];
  for (let index = list.length - 1; index > 0; index--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const other = Math.floor((seed / 4294967296) * (index + 1));
    [list[index], list[other]] = [list[other], list[index]];
  }
  return list;
}

function cycleOrder(cycle: number): string[] {
  const order = shuffle(riddles.map(riddle => riddle.id), hash(`dhadha:${cycle}`));
  // A new round must not open with the riddle that closed the last one (two days in a row).
  const previousLast = shuffle(riddles.map(riddle => riddle.id), hash(`dhadha:${cycle - 1}`)).at(-1);
  if (order[0] === previousLast) [order[0], order[1]] = [order[1], order[0]];
  return order;
}

/** Each round deals the whole bank once in a fixed shuffled order, so a riddle only returns after all the others.
 *  shortcut: adding riddles reshuffles future days (links keep their riddle via r=); fine while the bank changes rarely. */
export function riddleFor(date: string): Riddle {
  const day = dayNumber(date);
  const size = riddles.length;
  const id = cycleOrder(Math.floor(day / size))[((day % size) + size) % size];
  return byId.get(id)!;
}

/** Fixed chip order per riddle, so the right answer isn't always in the same place but never jumps around on reload. */
export function chipOrder(riddle: Riddle): Pick[] {
  return shuffle([0, 1, 2] as Pick[], hash(riddle.id));
}
export const chipLabel = (riddle: Riddle, pick: Pick) => (pick === 0 ? riddle.answer : riddle.decoys[pick - 1]);

/** One wrong guess gets a second chance; a second wrong guess reveals the answer. */
export function triesOf(picks: readonly Pick[]): Tries | null {
  const right = picks.indexOf(0);
  if (right === 0 || right === 1) return (right + 1) as Tries;
  return picks.length >= 2 ? 0 : null;
}

export function addPick(picks: readonly Pick[], pick: Pick): Pick[] {
  if (triesOf(picks) !== null || picks.includes(pick) || ![0, 1, 2].includes(pick)) return [...picks];
  return [...picks, pick];
}

export function cleanName(name: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the card text.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

export function shareHash({ date, id, tries, name }: Shared) {
  const params = new URLSearchParams({ d: date, r: id });
  if (tries !== null) params.set("t", String(tries));
  const shown = cleanName(name);
  if (shown && tries !== null) params.set("n", shown);
  return "#" + params.toString();
}

/** Reads a link. A future date never shows tomorrow's riddle early: it falls back to today's, with nothing else from the link.
 *  r= keeps an old link on the riddle it was shared with even if the bank grows; without it the date decides. */
export function parseShareHash(hash: string, today = dhakaDate()): Shared | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const date = params.get("d") ?? "";
  if (!isDate(date)) return null;
  if (date > today) return { date: today, id: riddleFor(today).id, tries: null, name: "" };
  const id = byId.has(params.get("r") ?? "") ? params.get("r")! : riddleFor(date).id;
  const raw = params.get("t");
  const tries = raw === "0" || raw === "1" || raw === "2" ? (Number(raw) as Tries) : null;
  return { date, id, tries, name: tries === null ? "" : cleanName(params.get("n") ?? "") };
}

export const dayLabel = (date: string, today: string) => (date === today ? `আজকের ধাঁধা · ${bnDate(date)}` : `${possessive(bnDate(date))} ধাঁধা`);

/** "রাফি প্রথম চেষ্টায় পেরেছে" — the line the card and the link preview carry. Never the answer. */
export function resultLine(tries: Tries | null, name: string) {
  const who = cleanName(name);
  if (tries === 1) return who ? `${who} প্রথম চেষ্টায় পেরেছে!` : "আমি প্রথম চেষ্টায় পেরেছি!";
  if (tries === 2) return who ? `${who} দ্বিতীয় চেষ্টায় পেরেছে` : "আমি দ্বিতীয় চেষ্টায় পেরেছি";
  if (tries === 0) return who ? `${who} এবার আটকে গেছে` : "আমি এবার আটকে গেছি";
  return "নানির মুখে শোনা পুরোনো শোলক";
}

export function humanLine(tries: Tries | null) {
  if (tries === 1) return "নানি থাকলে বলত, ‘বাহ্, মাথায় বুদ্ধি আছে!’";
  if (tries === 2) return "একবার ভুল, তারপর ঠিক। নানি হেসে মাথায় হাত বুলিয়ে দিত।";
  if (tries === 0) return "নানির ধাঁধা এত সহজ না! দেখি তুমি পারো কি না।";
  return "কুপির আলোয় বসে একটু ভাবো, তারপর উত্তর বলো।";
}

/** Post text for Facebook: the riddle and an invitation, never the answer. */
export function captionFor(shared: Shared, today: string) {
  const riddle = byId.get(shared.id)!;
  const lead = shared.date === today ? "আজকের ধাঁধা" : `${possessive(bnDate(shared.date))} ধাঁধা`;
  const result = shared.tries === null ? "" : ` ${resultLine(shared.tries, "")}`;
  return `${lead}: “${riddle.lines.join(" ")}” উত্তর কমেন্টে লেখো!${result} তুমি পারো?`;
}

/** Anonymous tally ids: "seen:<id>" counts people who finished a riddle, "ok:<id>" those who got it on the first try. */
export const tallyIds = riddles.flatMap(riddle => [`seen:${riddle.id}`, `ok:${riddle.id}`]);

export type Played = Record<string, { id: string; picks: Pick[] }>;

/** Everything this browser has finished, as tally ids. Sent whole each time because a new vote replaces the old one on the server. */
export function tallyItems(played: Played): string[] {
  const items = new Set<string>();
  for (const { id, picks } of Object.values(played)) {
    const tries = triesOf(picks);
    if (!byId.has(id) || tries === null) continue;
    items.add(`seen:${id}`);
    if (tries === 1) items.add(`ok:${id}`);
  }
  return [...items];
}

/** Rebuilds saved plays from this browser's storage, keeping only well-formed entries (newest 400 days). */
export function readPlayed(raw: unknown): Played {
  if (!raw || typeof raw !== "object") return {};
  const entries = Object.entries(raw as Record<string, unknown>).filter(([date, value]) => {
    if (!isDate(date) || !value || typeof value !== "object") return false;
    const { id, picks } = value as { id?: unknown; picks?: unknown };
    return typeof id === "string" && byId.has(id) && Array.isArray(picks) && picks.length <= 2 && new Set(picks).size === picks.length && picks.every(pick => pick === 0 || pick === 1 || pick === 2);
  });
  return Object.fromEntries(entries.sort(([a], [b]) => (a < b ? 1 : -1)).slice(0, 400)) as Played;
}
