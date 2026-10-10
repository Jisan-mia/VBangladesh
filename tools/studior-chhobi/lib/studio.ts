import { possessive } from "../../../shared/bangla";

export const MAX_NAME = 24;

// Share links and the tally store backdrops by id: once links are public, never rename or remove one.
export const backdrops = [
  { id: "lake", label: "পাহাড়-লেক", line: "সুইজারল্যান্ড যাইনি, স্টুডিওতে গেছি।" },
  { id: "garden", label: "ফুলবাগান", line: "ফুলগুলো প্লাস্টিকের, হাসিটা আসল।" },
  { id: "plane", label: "উড়োজাহাজ", line: "ভিসা লাগেনি, শুধু চুলটা আঁচড়াতে হয়েছে।" },
  { id: "villa", label: "বাগানবাড়ি", line: "বাড়িটা আঁকা, স্বপ্নটা নিজের।" },
  { id: "sea", label: "সমুদ্র", line: "সমুদ্র দেখার আগেই সমুদ্রের সাথে ছবি।" },
] as const;

export type Backdrop = (typeof backdrops)[number];
export type BackdropId = Backdrop["id"];
/** What a print is made of. The photo is never part of it: it stays on the phone. */
export type Print = { backdrop: BackdropId; date: string; name: string };
export type Card = { backdrop: Backdrop; stamp: string; dateText: string; name: string; line: string };

export const DEFAULT_PRINT: Print = { backdrop: "lake", date: "", name: "" };
export const tallyIds = backdrops.map(item => item.id);

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);
const bnDigits = (value: number) => numbers.format(value).replace(/,/g, "");

export const isBackdropId = (id: string): id is BackdropId => backdrops.some(item => item.id === id);
export const backdropById = (id: BackdropId) => backdrops.find(item => item.id === id)!;

export function cleanName(name: string) {
  // NFC so one name has one spelling; strip control and bidi-override characters so a link can't scramble the print.
  const clean = name.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim();
  return Array.from(clean).slice(0, MAX_NAME).join("").trim();
}

const pad = (value: number) => String(value).padStart(2, "0");

export function isDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [year, month, day] = date.split("-").map(Number);
  const real = new Date(Date.UTC(year, month - 1, day));
  return year >= 1950 && year <= 2099 && real.getUTCMonth() === month - 1 && real.getUTCDate() === day;
}

/** The phone's own date: a print is stamped with the day it was taken where the person is. */
export const todayLocal = (now = new Date()) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

/** The orange date a 90s point-and-shoot burned into the corner: '27 4 14. */
export function stampText(date: string) {
  if (!isDate(date)) return "";
  const [year, month, day] = date.split("-").map(Number);
  return `'${pad(year % 100)} ${month} ${day}`;
}

const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
export function dateText(date: string) {
  if (!isDate(date)) return "";
  const [year, month, day] = date.split("-").map(Number);
  return `${bnDigits(day)} ${months[month - 1]} ${bnDigits(year)}`;
}

/** The pen line under the print: the backdrop's own joke, unless a friend's link brought the same backdrop. */
export function humanLine(print: Print, friend?: Print | null) {
  if (friend && friend.backdrop === print.backdrop) return `${friend.name || "বন্ধু"} আর আমি, একই ব্যাকড্রপে দুজন।`;
  return backdropById(print.backdrop).line;
}

export function createCard(print: Print, friend?: Print | null): Card {
  return { backdrop: backdropById(print.backdrop), stamp: stampText(print.date), dateText: dateText(print.date), name: cleanName(print.name), line: humanLine(print, friend) };
}

export function shareHash({ backdrop, date, name }: Print) {
  const params = new URLSearchParams({ b: backdrop });
  if (isDate(date)) params.set("d", date);
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  return "#" + params.toString();
}

/** A shared print, or null when the hash isn't one (in-page anchors, junk, unknown backdrops). */
export function parseShareHash(hash: string): Print | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const backdrop = params.get("b") ?? "";
  if (!isBackdropId(backdrop)) return null;
  const date = params.get("d") ?? "";
  return { backdrop, date: isDate(date) ? date : "", name: cleanName(params.get("n") ?? "") };
}

export function previewTitle(print: Print) {
  const name = cleanName(print.name);
  const where = `${possessive(backdropById(print.backdrop).label)} সামনে`;
  return name ? `${possessive(name)} স্টুডিওর ছবি, ${where}। তুমিও তুলবে?` : `স্টুডিওর ছবি, ${where}। তুমিও তুলবে?`;
}

export function caption(print: Print, friend?: Print | null) {
  return `${humanLine(print, friend)} পাড়ার স্টুডিওতে ${possessive(backdropById(print.backdrop).label)} সামনে একটা ছবি তুললাম। তোমার ছোটবেলার স্টুডিওর ছবিটা কোথায়?`;
}

export { possessive };
