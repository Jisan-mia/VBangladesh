// Amounts in words for cheques and forms: Bangla (হাজার, লাখ/লক্ষ, কোটি) and English (Lakh/Crore or Million/Billion).
// Also used by salami-chek, so it stays free of UI code.
//
// The 1–99 words are irregular, so they are a hand-checked table, not rules. Checked against:
// - Wiktionary's Bengali number data: https://en.wiktionary.org/wiki/Module:number_list/data/bn
// - English Wikipedia, Bengali numerals: https://en.wikipedia.org/wiki/Bengali_numerals
// - Bangla dictionary entries for তিপ্পান্ন, ছাপ্পান্ন, আটাশ: https://www.ebanglalibrary.com/147529/ ,
//   https://www.ebanglalibrary.com/145628/ , https://www.ebanglalibrary.com/135804/
// - NCTB class 3 maths worked examples (এক হাজার দুই শত আটত্রিশ …): https://www.schoolmathbd.com/2024/01/number-class-3-math-bd-2024-ch-1-p-1-19.html
// Spelling follows the Bangla Academy style used in Bangladesh: ঊন- with ঊ (ঊনত্রিশ), -ো endings (এগারো, ষোলো),
// চৌদ্দ, অষ্টাশি. Common alternatives (উনত্রিশ, পনের, তিপান্ন, আটাশি…) are listed in `alternatives` and shown on the page.

// prettier-ignore
export const banglaUnder100 = [
  "শূন্য", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়",
  "দশ", "এগারো", "বারো", "তেরো", "চৌদ্দ", "পনেরো", "ষোলো", "সতেরো", "আঠারো", "উনিশ",
  "বিশ", "একুশ", "বাইশ", "তেইশ", "চব্বিশ", "পঁচিশ", "ছাব্বিশ", "সাতাশ", "আটাশ", "ঊনত্রিশ",
  "ত্রিশ", "একত্রিশ", "বত্রিশ", "তেত্রিশ", "চৌত্রিশ", "পঁয়ত্রিশ", "ছত্রিশ", "সাঁইত্রিশ", "আটত্রিশ", "ঊনচল্লিশ",
  "চল্লিশ", "একচল্লিশ", "বিয়াল্লিশ", "তেতাল্লিশ", "চুয়াল্লিশ", "পঁয়তাল্লিশ", "ছেচল্লিশ", "সাতচল্লিশ", "আটচল্লিশ", "ঊনপঞ্চাশ",
  "পঞ্চাশ", "একান্ন", "বাহান্ন", "তিপ্পান্ন", "চুয়ান্ন", "পঞ্চান্ন", "ছাপ্পান্ন", "সাতান্ন", "আটান্ন", "ঊনষাট",
  "ষাট", "একষট্টি", "বাষট্টি", "তেষট্টি", "চৌষট্টি", "পঁয়ষট্টি", "ছেষট্টি", "সাতষট্টি", "আটষট্টি", "ঊনসত্তর",
  "সত্তর", "একাত্তর", "বাহাত্তর", "তিয়াত্তর", "চুয়াত্তর", "পঁচাত্তর", "ছিয়াত্তর", "সাতাত্তর", "আটাত্তর", "ঊনআশি",
  "আশি", "একাশি", "বিরাশি", "তিরাশি", "চুরাশি", "পঁচাশি", "ছিয়াশি", "সাতাশি", "অষ্টাশি", "ঊননব্বই",
  "নব্বই", "একানব্বই", "বিরানব্বই", "তিরানব্বই", "চুরানব্বই", "পঁচানব্বই", "ছিয়ানব্বই", "সাতানব্বই", "আটানব্বই", "নিরানব্বই",
] as const;

/** Other spellings people (and some textbooks) use; both are understood, banks read either. */
export const alternatives: Partial<Record<number, string>> = {
  11: "এগার", 13: "তের", 14: "চোদ্দ", 15: "পনের", 16: "ষোল", 17: "সতের", 18: "আঠার", 19: "ঊনিশ",
  28: "আঠাশ", 29: "উনত্রিশ", 30: "তিরিশ", 39: "উনচল্লিশ", 49: "উনপঞ্চাশ", 53: "তিপান্ন", 56: "ছাপান্ন",
  59: "উনষাট", 69: "উনসত্তর", 79: "উনআশি", 88: "আটাশি", 89: "উননব্বই",
};

// prettier-ignore
const englishOnes = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const englishTens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

/** Amounts stop below 1000 crore (১০,০০,০০,০০,০০০ টাকা); bigger numbers aren't on any cheque. */
export const MAX_TAKA = 9_999_999_999;

export type Amount = { taka: number; paisa: number };
/** `formal` is the cheque register (লক্ষ, শত); otherwise everyday (লাখ, শো). */
export type BanglaStyle = { formal?: boolean };
export type EnglishStyle = { international?: boolean };

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
export const toBanglaDigits = (text: string) => text.replace(/[0-9]/g, digit => BN_DIGITS[Number(digit)]);
export const toLatinDigits = (text: string) => text.replace(/[০-৯]/g, digit => String(BN_DIGITS.indexOf(digit)));

/** Groups an integer digit string: lakh style 12,34,567 or international 1,234,567. */
export function groupDigits(digits: string, international = false) {
  if (international || digits.length <= 3) return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + digits.slice(-3);
}

const isWhole = (n: number, max: number) => Number.isInteger(n) && n >= 0 && n <= max;

function banglaUnder1000(n: number, formal: boolean) {
  const hundreds = Math.floor(n / 100), rest = n % 100;
  const parts: string[] = [];
  // Joined like the cheque habit: পাঁচশো / পাঁচশত.
  if (hundreds) parts.push(banglaUnder100[hundreds] + (formal ? "শত" : "শো"));
  if (rest) parts.push(banglaUnder100[rest]);
  return parts.join(" ");
}

/** A whole number (0 to MAX_TAKA) in Bangla words: 1234567 → "বারো লাখ চৌত্রিশ হাজার পাঁচশো সাতষট্টি". */
export function banglaNumber(n: number, { formal = false }: BanglaStyle = {}) {
  if (!isWhole(n, MAX_TAKA)) throw new RangeError("out of range");
  if (n === 0) return banglaUnder100[0];
  const crore = Math.floor(n / 10_000_000), lakh = Math.floor(n / 100_000) % 100, thousand = Math.floor(n / 1000) % 100, rest = n % 1000;
  const parts: string[] = [];
  if (crore) parts.push(banglaUnder1000(crore, formal), "কোটি");
  if (lakh) parts.push(banglaUnder100[lakh], formal ? "লক্ষ" : "লাখ");
  if (thousand) parts.push(banglaUnder100[thousand], "হাজার");
  if (rest) parts.push(banglaUnder1000(rest, formal));
  return parts.join(" ");
}

function englishUnder100(n: number) {
  if (n < 20) return englishOnes[n];
  return englishTens[Math.floor(n / 10)] + (n % 10 ? " " + englishOnes[n % 10] : "");
}

function englishUnder1000(n: number) {
  const hundreds = Math.floor(n / 100), rest = n % 100;
  const parts: string[] = [];
  if (hundreds) parts.push(englishOnes[hundreds], "Hundred");
  if (rest) parts.push(englishUnder100(rest));
  return parts.join(" ");
}

/** A whole number in English words, Lakh/Crore by default (the Bangladeshi cheque habit) or Million/Billion. */
export function englishNumber(n: number, { international = false }: EnglishStyle = {}) {
  if (!isWhole(n, MAX_TAKA)) throw new RangeError("out of range");
  if (n === 0) return "Zero";
  const parts: string[] = [];
  if (international) {
    const scales = [[1_000_000_000, "Billion"], [1_000_000, "Million"], [1000, "Thousand"]] as const;
    let rest = n;
    for (const [size, name] of scales) {
      const count = Math.floor(rest / size);
      if (count) parts.push(englishUnder1000(count), name);
      rest %= size;
    }
    if (rest) parts.push(englishUnder1000(rest));
  } else {
    const crore = Math.floor(n / 10_000_000), lakh = Math.floor(n / 100_000) % 100, thousand = Math.floor(n / 1000) % 100, rest = n % 1000;
    if (crore) parts.push(englishUnder1000(crore), "Crore");
    if (lakh) parts.push(englishUnder100(lakh), "Lakh");
    if (thousand) parts.push(englishUnder100(thousand), "Thousand");
    if (rest) parts.push(englishUnder1000(rest));
  }
  return parts.join(" ");
}

function checkAmount({ taka, paisa }: Amount) {
  if (!isWhole(taka, MAX_TAKA) || !isWhole(paisa, 99)) throw new RangeError("out of range");
}

/** The cheque line: "পঞ্চাশ হাজার টাকা মাত্র", "বারো টাকা পঞ্চাশ পয়সা মাত্র", "পঞ্চাশ পয়সা মাত্র". */
export function banglaAmount(amount: Amount, style: BanglaStyle = {}) {
  checkAmount(amount);
  const { taka, paisa } = amount;
  const parts: string[] = [];
  if (taka || !paisa) parts.push(banglaNumber(taka, style), "টাকা");
  if (paisa) parts.push(banglaUnder100[paisa], "পয়সা");
  return [...parts, "মাত্র"].join(" ");
}

/** "Taka Fifty Thousand Only", "Taka Twelve and Paisa Fifty Only", "Paisa Fifty Only". */
export function englishAmount(amount: Amount, style: EnglishStyle = {}) {
  checkAmount(amount);
  const { taka, paisa } = amount;
  const parts: string[] = [];
  if (taka || !paisa) parts.push("Taka", englishNumber(taka, style));
  if (paisa) parts.push(...(parts.length ? ["and"] : []), "Paisa", englishUnder100(paisa));
  return [...parts, "Only"].join(" ");
}

/** The amount in figures: "১২,৩৪,৫৬৭.৫০" (Bangla digits) or "12,34,567.50". Paisa only shows when there is some. */
export function figures({ taka, paisa }: Amount, { bangla = true, international = false } = {}) {
  const text = groupDigits(String(taka), international) + (paisa ? "." + String(paisa).padStart(2, "0") : "");
  return bangla ? toBanglaDigits(text) : text;
}

export type Parsed = { ok: true; amount: Amount } | { ok: false; reason: "empty" | "invalid" | "too-big" };

/**
 * Reads what someone typed: Bangla or English digits, lakh or international commas, spaces, ৳/Tk/টাকা, "/-".
 * More than two paisa digits is refused rather than rounded, so the words never disagree with the figures.
 */
export function parseAmount(raw: string): Parsed {
  const text = toLatinDigits(raw.normalize("NFC")).replace(/৳|tk\.?|taka|টাকা|\/-|[\s,]/gi, "");
  if (!text) return { ok: false, reason: "empty" };
  const match = /^(\d*)(?:\.(\d{0,2}))?$/.exec(text);
  if (!match || (!match[1] && !match[2])) return { ok: false, reason: "invalid" };
  const whole = match[1].replace(/^0+(?=\d)/, "");
  if (whole.length > String(MAX_TAKA).length || Number(whole) > MAX_TAKA) return { ok: false, reason: "too-big" };
  return { ok: true, amount: { taka: Number(whole || 0), paisa: Number((match[2] ?? "").padEnd(2, "0")) } };
}

/**
 * Tidies the field while typing: Bangla digits, lakh commas, one dot, at most two paisa digits.
 * Keeps an unfinished "১২." so the dot doesn't vanish under the thumb.
 */
export function formatTyping(raw: string) {
  const text = toLatinDigits(raw.normalize("NFC")).replace(/[^\d.]/g, "");
  const dot = text.indexOf(".");
  const wholeDigits = (dot < 0 ? text : text.slice(0, dot)).replace(/^0+(?=\d)/, "");
  const decimals = dot < 0 ? null : text.slice(dot + 1).replace(/\./g, "").slice(0, 2);
  const whole = wholeDigits ? groupDigits(wholeDigits) : decimals !== null ? "0" : "";
  return toBanglaDigits(whole + (decimals !== null ? "." + decimals : ""));
}
