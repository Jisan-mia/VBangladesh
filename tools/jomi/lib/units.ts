// Land units, checked ("যাচাই করা") on 11 Oct 2026.
// Ministry of Land, "বাংলাদেশ ভূমি পরিমাপের আদর্শ এককসমূহ" (content updated 1 May 2025):
//   https://minland.gov.bd/site/page/4e44d7ef-2c36-4483-aa4e-77b294de729c
//   "1 Decimal = 1 Shotangsho (Shotok) = 435.6 Sq Feet", "1 Katha = 720 Sq Feet", "20 Katha = 1 Bigha", "1 Bigha = 14400 Square Feet",
//   "1 Acore = 100 Shotok", "1 Acore = 43560 Square Feet", "16 Chotak = 1 Kattah", "1 Acore = 3 Bigha 8 Chotak" (43,200 + 8 × 45 = 43,560).
// Cross-check, Shibnagar Union Parishad (Dinajpur) land page: ১ শতাংশ = ৪৩৫.৬০ বর্গফুট, ১ কাঠা = ৭২০ বর্গফুট, ১ বিঘা = ১৪,৪০০ বর্গফুট, ১ একর = ৪৩,৫৬০ বর্গফুট:
//   https://shibnagorup.dinajpur.gov.bd/pages/static-pages/69776150c4774958d7c216e4
// Square metre: the international foot is exactly 0.3048 m (NIST SP 811, Appendix B: https://www.nist.gov/pml/special-publication-811),
//   so 1 m² = 10.7639 sq ft; the ministry's rounded "1 Acore = 4047 Square Meter" and "1 Bigha = 1338 Square Meter" agree.
// গণ্ডা and কানি are left out on purpose: the same ministry page gives each two sizes (1 Kani = 17,280 and 17,424 sq ft).
export const checked = "১১ অক্টোবর ২০২৬";
// ISO twin of the date above for schema dateModified and sitemap lastmod; bump both together.
export const checkedOn = "2026-10-11";
export const sources = [
  { label: "ভূমি মন্ত্রণালয়: ভূমি পরিমাপের আদর্শ একক", url: "https://minland.gov.bd/site/page/4e44d7ef-2c36-4483-aa4e-77b294de729c" },
  { label: "শিবনগর ইউনিয়ন পরিষদ, দিনাজপুর: ভূমির পরিমাপ", url: "https://shibnagorup.dinajpur.gov.bd/pages/static-pages/69776150c4774958d7c216e4" },
  { label: "NIST: ১ ফুট = ০.৩০৪৮ মিটার", url: "https://www.nist.gov/pml/special-publication-811" },
  { label: "ফিফা: মাঠের সুপারিশ করা মাপ ১০৫ × ৬৮ মিটার", url: "https://publications.fifa.com/de/football-stadiums-guidelines/technical-guideline/stadium-guidelines/pitch-dimensions-and-surrounding-areas" },
] as const;

const FOOT_IN_METRES = 0.3048;
export const SQM_IN_SQFT = 1 / FOOT_IN_METRES ** 2;

// Display order. Link state stores ids, so labels and order may change; ids may not.
export const units = [
  { id: "shotangsho", label: "শতাংশ", also: "শতক, ডেসিমাল", sqft: 435.6 },
  { id: "katha", label: "কাঠা", sqft: 720 },
  { id: "bigha", label: "বিঘা", sqft: 14400 },
  { id: "acre", label: "একর", sqft: 43560 },
  { id: "sqft", label: "বর্গফুট", also: "স্কয়ার ফিট", sqft: 1 },
  { id: "sqm", label: "বর্গমিটার", sqft: SQM_IN_SQFT },
  { id: "chhotak", label: "ছটাক", sqft: 45 },
] as const;

export type Unit = (typeof units)[number];
export type UnitId = Unit["id"];
export const isUnitId = (id: string): id is UnitId => units.some(unit => unit.id === id);
export const unitById = (id: UnitId): Unit => units.find(unit => unit.id === id)!;

// FIFA's recommended field of play, "105 metres x 68 metres" (link in `sources`, checked 11 Oct 2026). Real pitches vary.
export const PITCH = { length: 105, width: 68 } as const;
export const PITCH_SQM = PITCH.length * PITCH.width;
export const PITCH_SQFT = PITCH_SQM * SQM_IN_SQFT;

export const convert = (value: number, from: UnitId, to: UnitId) => value * unitById(from).sqft / unitById(to).sqft;

const formats = new Map<string, Intl.NumberFormat>();
function format(value: number, options: Intl.NumberFormatOptions) {
  const key = JSON.stringify(options);
  if (!formats.has(key)) formats.set(key, new Intl.NumberFormat("bn-BD", options));
  return formats.get(key)!.format(value);
}
export const bn = (value: number) => format(value, {});

/** Bangla digits, lakh grouping, and only as many decimals as the size deserves: ১৪,৪০০ · ১,৩৩৮ · ৩৩.০৬ · ০.০১৬৫. */
export function amountText(value: number) {
  if (value > 0 && value < 0.00001) return "০.০০০০১-এর কম";
  if (value >= 1000) return format(value, { maximumFractionDigits: 0 });
  if (value >= 100) return format(value, { maximumFractionDigits: 1 });
  if (value >= 1) return format(value, { maximumFractionDigits: 2 });
  return format(value, { maximumSignificantDigits: 3 });
}

export const MAX_DIGITS = 7;
export const MAX_DECIMALS = 4;

/** Reads what people type: Bangla or English digits, commas or spaces as grouping, one decimal point. Null if it isn't a size above zero. */
export function parseAmount(input: string): number | null {
  const text = input.normalize("NFC").trim().replace(/[০-৯]/g, digit => String(digit.charCodeAt(0) - 0x09e6)).replace(/[,\s]/g, "");
  if (!/\d/.test(text) || !new RegExp(`^\\d{0,${MAX_DIGITS}}(\\.\\d*)?$`).test(text)) return null;
  const value = Math.round(Number(text) * 10 ** MAX_DECIMALS) / 10 ** MAX_DECIMALS;
  return value > 0 ? value : null;
}

/** The value as it goes back into the input box: Bangla digits, no grouping, every decimal kept. */
export const inputText = (value: number) => value.toLocaleString("bn-BD", { useGrouping: false, maximumFractionDigits: MAX_DECIMALS });

/** How big this is next to a FIFA-size pitch, worked out from the numbers above, never typed in. */
export function pitchText(sqft: number) {
  const ratio = sqft / PITCH_SQFT;
  if (ratio < 0.01) return "ফুটবল মাঠের ১%-এরও কম";
  if (ratio < 0.95) return `ফুটবল মাঠের প্রায় ${bn(Math.round(ratio * 100))}%`;
  if (ratio < 1.05) return "প্রায় পুরো একটা ফুটবল মাঠ";
  return `ফুটবল মাঠের প্রায় ${bn(ratio < 10 ? Math.round(ratio * 10) / 10 : Math.round(ratio))} গুণ`;
}
