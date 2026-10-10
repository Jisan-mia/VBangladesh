import { possessive } from "../../../shared/bangla";
import { bn, inputText, parseAmount } from "../../jomi/lib/units";

export { bn, inputText, parseAmount, possessive };

/*
 * Sources, checked ("যাচাই করা") on 11 Oct 2026:
 * - Formula (Schaeffer's / Shaeffer's): live weight (lb) = heart girth² (in) × body length (in) ÷ 300, length from the point of the
 *   shoulder to the pin bone, girth just behind the front legs.
 *   Oregon State University Extension, "Weight Calculator", cattle: "HEART GIRTH x HEART GIRTH x BODY LENGTH / 300 = ANIMAL WEIGHT IN POUNDS";
 *   (70 × 70 × 78) / 300 = 1,274 lbs; "From point of shoulder to pin bone":
 *   https://extension.oregonstate.edu/sites/extd8/files/documents/51006/weightcalculator.pdf
 *   Sher-e-Bangla Agricultural University (Dhaka), class lecture "Determination of Animal Live Weight": W = L × G² / 300 pounds,
 *   "L = Length between Point of shoulder to Pin bone in inch", "most useful for zebu cattle":
 *   https://sau.edu.bd/public/uploads/pdf/dept/class_lecture/22_2020-08-10_5f315ddaf0baa.pdf
 *   (The same lecture's cm version divides by a rounded 10,400 for kg; we convert cm to inches exactly instead, which is ÷ 10,839,
 *   so both units give the same answer. The ÷ 660 seen in Bangla articles is this formula giving kg: 300 ÷ 0.45359237 ≈ 661.)
 * - Pound: exactly 0.45359237 kg (NIST SP 811, Appendix B): https://www.nist.gov/pml/special-publication-811
 * - Inch: exactly 2.54 cm (same NIST page).
 * - মণ: Bangladesh trades in a 40 kg মণ. Prothom Alo, 23 Oct 2020, Rajshahi UNO: "সারা দেশে ৪০ কেজিতে এক মণ।"
 *   https://www.prothomalo.com/bangladesh/district/বানেশ্বর-বাজারে-৪৮-কেজিতে-আমের-মণ-আর-হবে-না
 *   Cattle news uses the same: "সাড়ে ৩২ মণ" bull = "১ হাজার ৩০০ কেজি" (Zoom Bangla, 2 Jun 2024): https://inews.zoombangla.com/the-best-cow-is-kala-manik/
 *   The old 40-সের মণ (80 তোলা of 11.6638 g a সের) is 37.3242 kg: https://en.wikipedia.org/wiki/Maund_(unit) — shown only as a note.
 */
export const checked = "১১ অক্টোবর ২০২৬";
export const sources = [
  { label: "অরেগন স্টেট ইউনিভার্সিটি এক্সটেনশন: Weight Calculator (গরু: বেড় × বেড় × দৈর্ঘ্য ÷ ৩০০ = পাউন্ড)", url: "https://extension.oregonstate.edu/sites/extd8/files/documents/51006/weightcalculator.pdf" },
  { label: "শেরেবাংলা কৃষি বিশ্ববিদ্যালয়: Determination of Animal Live Weight (শেফারের সূত্র)", url: "https://sau.edu.bd/public/uploads/pdf/dept/class_lecture/22_2020-08-10_5f315ddaf0baa.pdf" },
  { label: "প্রথম আলো, ২৩ অক্টোবর ২০২০: “সারা দেশে ৪০ কেজিতে এক মণ”", url: "https://www.prothomalo.com/bangladesh/district/বানেশ্বর-বাজারে-৪৮-কেজিতে-আমের-মণ-আর-হবে-না" },
  { label: "NIST: ১ পাউন্ড = ০.৪৫৩৫৯২৩৭ কেজি, ১ ইঞ্চি = ২.৫৪ সেমি", url: "https://www.nist.gov/pml/special-publication-811" },
  { label: "মণের পুরোনো মাপ (৪০ সের ≈ ৩৭.৩২ কেজি)", url: "https://en.wikipedia.org/wiki/Maund_(unit)" },
] as const;

export const LB_KG = 0.45359237;
export const INCH_CM = 2.54;
export const MON_KG = 40;
export const OLD_MON_KG = 37.3242;
export const DIVISOR = 300;

export type Unit = "in" | "cm";
export const unitLabel = { in: "ইঞ্চি", cm: "সেমি" } as const;
// Calves to the biggest হাট bulls (a 35-মণ bull is about 105 in round and 84 in long).
export const limits = { in: { girth: [20, 130], length: [15, 120] }, cm: { girth: [51, 330], length: [38, 305] } } as const;
export const inRange = (value: number, unit: Unit, field: "girth" | "length") => value >= limits[unit][field][0] && value <= limits[unit][field][1];

export const toInches = (value: number, unit: Unit) => unit === "cm" ? value / INCH_CM : value;
/** Switching the tape's unit keeps the same cow: whole numbers in the new unit, kept inside its limits. */
export function convertLength(value: number, from: Unit, to: Unit, field: "girth" | "length") {
  if (from === to) return value;
  const next = Math.round(to === "cm" ? value * INCH_CM : value / INCH_CM);
  const [min, max] = limits[to][field];
  return Math.min(max, Math.max(min, next));
}

export const lbToKg = (lb: number) => lb * LB_KG;
export const kgToLb = (kg: number) => kg / LB_KG;
export const kgToMon = (kg: number) => kg / MON_KG;
export const monToKg = (mon: number) => mon * MON_KG;

/** Schaeffer's formula: estimated live weight from the two tape measurements. */
export function liveWeight(girth: number, length: number, unit: Unit) {
  const g = toInches(girth, unit), l = toInches(length, unit);
  const lb = (g * g * l) / DIVISOR;
  const kg = lbToKg(lb);
  return { lb, kg, mon: kgToMon(kg) };
}

const oneDecimal = new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 0 });
/** "৩.৯ মণ" → "৪" when it rounds to a whole: one decimal is all a tape can promise. */
export const monText = (mon: number) => oneDecimal.format(Math.round(mon * 10) / 10);
export const kgText = (kg: number) => whole.format(Math.round(kg));
export const lbText = (lb: number) => whole.format(Math.round(lb));
export const meatText = (kg: number) => oneDecimal.format(Math.round(kg * 10) / 10);

// ——— Meat shares (typed in by the person; never worked out from the live weight) ———

export const bowls = [
  { id: "nijer", label: "নিজেদের" },
  { id: "attiyo", label: "আত্মীয়-প্রতিবেশী" },
  { id: "obhabi", label: "অভাবী মানুষ" },
] as const;
export type Split = [number, number, number];
export const MAX_PART = 4;
export const MEAT_LIMITS = [1, 999] as const;
export const packetSizes = [500, 750, 1000] as const;
export type PacketSize = (typeof packetSizes)[number];
export const packetLabel = { 500: "আধা কেজি", 750: "৭৫০ গ্রাম", 1000: "১ কেজি" } as const;

/** Splits the meat by the ratio in 100 g steps that add up exactly to the total (largest remainder). */
export function splitMeat(total: number, split: Split): Split {
  const tenths = Math.round(total * 10);
  const sum = split[0] + split[1] + split[2];
  if (sum <= 0) return [0, 0, 0];
  const raw = split.map(part => (tenths * part) / sum);
  const parts = raw.map(Math.floor);
  let left = tenths - parts.reduce((a, b) => a + b, 0);
  const order = raw.map((value, index) => ({ index, rest: value - Math.floor(value) })).sort((a, b) => b.rest - a.rest || a.index - b.index);
  for (const { index } of order) { if (left <= 0) break; if (split[index] > 0) { parts[index] += 1; left -= 1; } }
  return parts.map(part => part / 10) as Split;
}

/** Packets for the two shares that are given away. */
export function packetCount(total: number, split: Split, packet: PacketSize) {
  const [, relatives, needy] = splitMeat(total, split);
  return Math.floor(((relatives + needy) * 1000) / packet + 1e-9);
}

// ——— Link state ———

export type CardKind = "ojon" | "bhag";
export type Cow = { girth: number; length: number; unit: Unit; name: string; meat: number; split: Split; packet: PacketSize; card: CardKind };
export const sample: Cow = { girth: 50, length: 42, unit: "in", name: "", meat: 36, split: [1, 1, 1], packet: 500, card: "ojon" };
export const MAX_NAME = 12;

/** NFC, no control or bidi characters, single spaces, at most 12 letters, and never ending on a dangling হসন্ত. */
export function cleanName(text: string) {
  const flat = text.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩<>]/g, " ").replace(/\s+/g, " ").trim();
  return Array.from(flat).slice(0, MAX_NAME).join("").replace(/্+$/, "").trim();
}

const NUMBER = /^\d{1,3}(\.\d)?$/;
const readNumber = (raw: string | null) => raw && NUMBER.test(raw) ? Number(raw) : null;
const isPacket = (value: number): value is PacketSize => (packetSizes as readonly number[]).includes(value);

export function cowHash(cow: Cow) {
  const params = new URLSearchParams({ g: String(cow.girth), l: String(cow.length) });
  if (cow.unit === "cm") params.set("u", "cm");
  const name = cleanName(cow.name);
  if (name) params.set("nm", name);
  params.set("m", String(cow.meat));
  if (cow.split.join("-") !== "1-1-1") params.set("s", cow.split.join("-"));
  if (cow.packet !== 500) params.set("p", String(cow.packet));
  if (cow.card === "bhag") params.set("c", "b");
  return params.toString();
}

/** A shared cow, or null when the link has no usable measurements. Bad optional parts fall back to the defaults. */
export function parseCow(hash: string): Cow | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const unit: Unit = params.get("u") === "cm" ? "cm" : "in";
  const girth = readNumber(params.get("g")), length = readNumber(params.get("l"));
  if (girth === null || length === null || !inRange(girth, unit, "girth") || !inRange(length, unit, "length")) return null;
  const meat = readNumber(params.get("m"));
  const split = /^[0-4]-[0-4]-[0-4]$/.test(params.get("s") ?? "") ? params.get("s")!.split("-").map(Number) as Split : sample.split;
  const packet = Number(params.get("p"));
  return {
    girth, length, unit,
    name: cleanName(params.get("nm") ?? ""),
    meat: meat !== null && meat >= MEAT_LIMITS[0] && meat <= MEAT_LIMITS[1] ? meat : sample.meat,
    split: split[0] + split[1] + split[2] > 0 ? split : sample.split,
    packet: isPacket(packet) ? packet : sample.packet,
    card: params.get("c") === "b" ? "bhag" : "ojon",
  };
}

// ——— Words ———

const withKe = (name: string) => /[ঀ-৿]$/.test(name) ? `${name}কে` : `${name}-কে`;

/** One warm line from the weight and the name. Never about meat or price. */
export function weightLine(mon: number, name: string) {
  if (mon < 2) return `${name ? `${name} ` : ""}ছোট্টখাট্টো, কিন্তু আদরে কারও চেয়ে কম না।`;
  if (mon < 4) return name ? `${withKe(name)} দেখে হাটে সবাই একবার ফিরে তাকাবে।` : "মাঝারি গড়ন, হাটে সবাই একবার ফিরে তাকাবে।";
  if (mon < 7) return name ? `${withKe(name)} ঘিরে পাড়ার বাচ্চাদের ভিড় লেগেই থাকবে।` : "বেশ নাদুসনুদুস! পাড়ার বাচ্চারা সারাদিন ঘিরে থাকবে।";
  if (mon < 12) return `${name || "এ"} তো রীতিমতো পালোয়ান! গলার মালাটাও ছোট পড়ে যাচ্ছে।`;
  return `${name ? `${name} ` : ""}হাটের রাজা! দেখতে আশপাশের গ্রাম থেকে লোক আসবে।`;
}

export const cowTitle = (name: string) => `আমাদের ${name || "গরু"}`;
export const weightOf = (cow: Cow) => liveWeight(cow.girth, cow.length, cow.unit);

/** "৩৬ কেজি → ১২ + ১২ + ১২". */
export function shareEquation(cow: Cow) {
  return `${meatText(cow.meat)} কেজি → ${splitMeat(cow.meat, cow.split).map(meatText).join(" + ")}`;
}

export function packetText(cow: Cow) {
  const count = packetCount(cow.meat, cow.split, cow.packet);
  return count ? `${bn(count)}টা প্যাকেট` : "";
}

export function bowlLine(cow: Cow) {
  const count = packetCount(cow.meat, cow.split, cow.packet);
  if (count === 1) return "একটা প্যাকেট, তবু কারও দরজায় ঈদের খুশি পৌঁছাবে।";
  if (count > 1) return `${bn(count)}টা প্যাকেট মানে ${bn(count)}বার কারও দরজায় কড়া নাড়া।`;
  return "ভাগ কীভাবে হবে, সেটা তোমাদের পরিবারের ঠিক করা।";
}

export function previewTitle(cow: Cow) {
  if (cow.card === "bhag") return `${cow.name ? `${possessive(cow.name)} ভাগ: ` : ""}${shareEquation(cow)}${packetText(cow) ? ` · ${packetText(cow)}` : ""}`;
  const weight = weightOf(cow);
  return `${cow.name ? possessive(cow.name) : "এই গরুর"} ওজন প্রায় ${monText(weight.mon)} মণ (${kgText(weight.kg)} কেজি) — তোমাদেরটা কত?`;
}
