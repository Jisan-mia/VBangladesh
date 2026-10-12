import { possessive } from "../../../shared/bangla";
// One tested source for amount words, shared with টাকা কথায় লিখি.
import { banglaAmount, figures, toLatinDigits } from "../../taka-kothay/lib/number-words";

export const MAX_NAME_LENGTH = 30;
/** A toy cheque: ১ লাখের বেশি চাইলে সেটা আর ঈদের মজা থাকে না। */
export const MAX_AMOUNT = 100_000;

// Share links and the tally store these ids: once links are public, only append; never rename.
export const givers = [
  { id: "mama", label: "মামা" },
  { id: "khalamoni", label: "খালামণি" },
  { id: "chachchu", label: "চাচ্চু" },
  { id: "fuppi", label: "ফুপ্পি" },
  { id: "bhaiya", label: "বড় ভাইয়া" },
  { id: "apu", label: "বড় আপু" },
  { id: "nanu", label: "নানু" },
  { id: "dadu", label: "দাদু" },
  { id: "abbu", label: "আব্বু" },
  { id: "ammu", label: "আম্মু" },
] as const;

export const amountChips = [500, 1000, 2000, 5000] as const;

export type GiverId = (typeof givers)[number]["id"];
export type Cheque = { giver: GiverId; amount: number; name: string; ok: boolean };

export const defaultCheque: Cheque = { giver: "mama", amount: 1000, name: "", ok: false };

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

const isGiverId = (id: string): id is GiverId => givers.some(giver => giver.id === id);
export const giverLabel = (id: GiverId) => givers.find(giver => giver.id === id)!.label;

export function cleanName(name: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the cheque text.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

/** Reads a typed or linked amount (Bangla or English digits, commas) as whole taka, 1 to MAX_AMOUNT; anything else is null. */
export function readAmount(raw: string): number | null {
  const digits = toLatinDigits(raw.normalize("NFC")).replace(/[,\s]/g, "");
  if (!/^\d{1,7}$/.test(digits)) return null;
  const amount = Number(digits);
  return amount >= 1 && amount <= MAX_AMOUNT ? amount : null;
}

export const amountWords = (amount: number) => banglaAmount({ taka: amount, paisa: 0 });
export const amountFigures = (amount: number) => figures({ taka: amount, paisa: 0 });

export function shareHash({ giver, amount, name, ok }: Cheque) {
  const params = new URLSearchParams({ g: giver, a: String(amount) });
  const shownName = cleanName(name);
  if (shownName) params.set("n", shownName);
  if (ok) params.set("ok", "1");
  return "#" + params.toString();
}

export function parseShareHash(hash: string): Cheque | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const giver = params.get("g") ?? "";
  const amount = readAmount(params.get("a") ?? "");
  if (!isGiverId(giver) || amount === null) return null;
  return { giver, amount, name: cleanName(params.get("n") ?? ""), ok: params.get("ok") === "1" };
}

const giverLines: Record<GiverId, string> = {
  mama: "মামার পকেট থেকে নতুন নোট বের হলেই ঈদ শুরু।",
  khalamoni: "খালামণির ব্যাগে সবসময় একটা নতুন নোট থাকে।",
  chachchu: "চাচ্চু, গতবারের বাকিটাও কিন্তু মনে আছে!",
  fuppi: "ফুপ্পির আদর আর সালামি, দুটোই চাই।",
  bhaiya: "ভাইয়া, এবার না বলো না!",
  apu: "আপু, প্রথম বেতনের কথা কিন্তু ভুলিনি!",
  nanu: "নানুর সালামি আসে আঁচলের গিঁট খুলে।",
  dadu: "দাদুর সালামি মানে নতুন নোট আর অনেক দোয়া।",
  abbu: "আব্বু, বছরে তো একটাই ঈদ!",
  ammu: "আম্মু, এবার কিন্তু জমিয়ে রাখার নাম করে নিয়ো না!",
};

/** The human line on the card, from who pays, how much, and whether it's signed. */
export function chequeLine({ giver, amount, ok }: Cheque) {
  if (ok) return "সই হয়ে গেছে, এবার শুধু নতুন নোটের অপেক্ষা।";
  if (amount >= 5000) return "স্বপ্ন দেখতে টাকা লাগে না।";
  if (amount <= 100) return "ছোট্ট চাওয়া, ফেরানো যায় না।";
  return giverLines[giver];
}

export function previewTitle({ giver, name, ok }: Cheque) {
  const elder = giverLabel(giver);
  if (ok) return name ? `${elder} ${possessive(name)} সালামির চেকে সই করে দিয়েছে!` : `${elder} সালামির চেকে সই করে দিয়েছে!`;
  return name ? `${name} ${possessive(elder)} কাছে সালামি চেয়েছে। সই করে দাও!` : `${possessive(elder)} কাছে একটা সালামির চেক এসেছে। সই করে দাও!`;
}

/** The giver most often signed for, once enough people have signed that "most" means something. */
export function topGiver(counts: Record<string, number>, total: number, minimum: number): GiverId | null {
  if (total < minimum) return null;
  const best = givers.reduce((top, giver) => (counts[giver.id] ?? 0) > (counts[top.id] ?? 0) ? giver : top, givers[0]);
  return (counts[best.id] ?? 0) > 0 ? best.id : null;
}

export { possessive };
