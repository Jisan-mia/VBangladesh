// বিদ্যুৎ বিল কত?: the one place the residential tariff lives. Change it here only, with the new order's number, date and links.
/*
 * Checked ("যাচাই করা") on 11 Oct 2026 against the BERC order itself (scanned PDF, posted on DPDC's tariff page):
 * - BERC notice নং-২৮.০১.০০০০.০১২.০৪.০০৩.২৬.২৫২১, 03 Jun 2026, "বিদ্যুতের খুচরা মূল্যহার পুনর্নির্ধারণ সংক্রান্ত বিজ্ঞপ্তি",
 *   for BPDB, the Palli Bidyut Samities (BREB), DPDC, DESCO, WZPDCL and NESCO. LT-A আবাসিক, টাকা/কি.ও.ঘ.:
 *   লাইফ লাইন ০–৫০ ইউনিট ৫.৩২³ · প্রথম ধাপ ০–৭৫ ৬.১৮ · দ্বিতীয় ৭৬–২০০ ৮.৫০ · তৃতীয় ২০১–৩০০ ৯.১০ · চতুর্থ ৩০১–৪০০ ৯.৬২ ·
 *   পঞ্চম ৪০১–৬০০ ১৫.০১ · ষষ্ঠ ৬০০-এর ঊর্ধ্বে ১৭.৩৫ · ডিমান্ড চার্জ ৪২.০০ টাকা/কি.ও./মাস.
 *   Footnote ²: for LT customers demand (kW) is the sanctioned load (অনুমোদিত লোড).
 *   Footnote ³: "লাইফ লাইন (০-৫০ ইউনিট) মূল্যহারের সুবিধা লাইফ লাইন গ্রাহক ব্যতীত আবাসিক গ্রাহকশ্রেণির অন্য কোনো গ্রাহক পাবেন না।"
 *   Item ৪: prepaid customers get a 0.5% rebate on the net bill excluding VAT. Item ৫: effective from bill month June 2026.
 * - BERC amendment নং-২৮.০১.০০০০.০১২.০৪.০০৩.২৬.২৫৬৯, 04 Jun 2026: lifeline stays ৪.৬৩ and প্রথম ধাপ stays ৫.২৬ টাকা/কি.ও.ঘ.
 *   from bill month June 2026; the rest of the 3 June order is unchanged.
 *   Both pages, as one PDF: https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-dpdc/2026/5/a54abcb7-19d9-4b7a-92d7-fe738615f3f5.pdf
 *   DPDC's tariff page lists the same figures (updated 7 Jun 2026): https://dpdc.gov.bd/pages/static-pages/6922de6f933eb65569e1a9c4
 *   Press: Prothom Alo, 3 Jun 2026: https://en.prothomalo.com/business/local/x730jsk72r · Daily Star Bangla, 4 Jun 2026 (withdrawal):
 *   https://bangla.thedailystar.net/environment/natural-resources/electricity-fuel/news-3930651
 * - Slabs are incremental: each band of units is charged at its own rate. Prothom Alo, 12 May 2026, worked example at the
 *   then-current rates: 200 units = first 75 × ৫.২৬ (৩৯৪.৫০) + next 125 × ৭.২০ (৯০০) = ১,২৯৪.৫০ টাকা. PDB's proposal there to
 *   bill all 200 units at the second-step rate was not adopted: the 3 June order keeps the ৭৬–২০০ band.
 *   https://www.prothomalo.com/bangladesh/ao6qwy0g5t
 * - Lifeline customer = uses up to 50 units in the month (same Prothom Alo report: "মাসে ৫০ ইউনিট পর্যন্ত ব্যবহারকারী লাইফলাইন গ্রাহক").
 * - VAT 5% and meter rent: DPDC via TBS, 31 Aug 2026: "A 5% VAT is deducted", demand charge "against the sanctioned load", meter rent
 *   Tk 40 single-phase / Tk 250 three-phase for a company-supplied meter, none for a self-bought one.
 *   https://www.tbsnews.net/node/1529481 — meter rent differs by company and meter, so the estimate leaves it out and says so.
 */

/** Money is kept in paisa (whole numbers) so slab sums never pick up floating-point dust. */
export type Step = { from: number; upTo: number; rate: number; label: string };
export type Tariff = {
  lifeline: { upTo: number; rate: number };
  steps: readonly Step[];
  demandPerKw: number;
  vat: number;
  prepaidRebate: number;
};

export const tariff = {
  lifeline: { upTo: 50, rate: 463 },
  steps: [
    { from: 1, upTo: 75, rate: 526, label: "প্রথম ধাপ" },
    { from: 76, upTo: 200, rate: 850, label: "দ্বিতীয় ধাপ" },
    { from: 201, upTo: 300, rate: 910, label: "তৃতীয় ধাপ" },
    { from: 301, upTo: 400, rate: 962, label: "চতুর্থ ধাপ" },
    { from: 401, upTo: 600, rate: 1501, label: "পঞ্চম ধাপ" },
    { from: 601, upTo: Infinity, rate: 1735, label: "ষষ্ঠ ধাপ" },
  ],
  demandPerKw: 4200,
  vat: 0.05,
  prepaidRebate: 0.005,
} as const satisfies Tariff;

export const tariffInfo = {
  title: "এলটি-এ: আবাসিক",
  effective: "বিল মাস জুন ২০২৬",
  order: "বিইআরসির ৩ জুন ২০২৬-এর আদেশ (স্মারক ২৮.০১.০০০০.০১২.০৪.০০৩.২৬.২৫২১), ৪ জুন ২০২৬-এ সংশোধিত (স্মারক …২৫৬৯)",
  short: "বিইআরসির দর, বিল মাস জুন ২০২৬",
  checked: "১১ অক্টোবর ২০২৬",
  sources: [
    { label: "বিইআরসি: খুচরা মূল্যহার পুনর্নির্ধারণ, ৩ জুন ২০২৬ + লাইফলাইন ও প্রথম ধাপের সংশোধন, ৪ জুন ২০২৬ (পিডিএফ)", url: "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-dpdc/2026/5/a54abcb7-19d9-4b7a-92d7-fe738615f3f5.pdf" },
    { label: "ডিপিডিসি: ট্যারিফ হার (বিল মাস জুন ২০২৬ থেকে)", url: "https://dpdc.gov.bd/pages/static-pages/6922de6f933eb65569e1a9c4" },
    { label: "প্রথম আলো, ১২ মে ২০২৬: ধাপে ধাপে বিলের হিসাব (২০০ ইউনিটের উদাহরণ)", url: "https://www.prothomalo.com/bangladesh/ao6qwy0g5t" },
    { label: "দ্য ডেইলি স্টার বাংলা, ৪ জুন ২০২৬: ৭৫ ইউনিট পর্যন্ত বাড়তি দাম প্রত্যাহার", url: "https://bangla.thedailystar.net/environment/natural-resources/electricity-fuel/news-3930651" },
    { label: "টিবিএস, ৩১ আগস্ট ২০২৬: ৫% ভ্যাট, ডিমান্ড চার্জ ও মিটার ভাড়া (ডিপিডিসি)", url: "https://www.tbsnews.net/node/1529481" },
  ],
} as const;

/** "০–৭৫", "৭৬–২০০" … "৬০০-এর বেশি", the way the order prints them. */
export function stepRange(step: Step) {
  const bn = (value: number) => new Intl.NumberFormat("bn-BD").format(value);
  return Number.isFinite(step.upTo) ? `${bn(step.from === 1 ? 0 : step.from)}–${bn(step.upTo)}` : `${bn(step.from - 1)}-এর বেশি`;
}

export const SANCTIONED_LOADS = [1, 2, 3, 4, 5] as const;
export type Load = (typeof SANCTIONED_LOADS)[number];
export const DEFAULT_LOAD: Load = 2;
export const isLoad = (value: number): value is Load => (SANCTIONED_LOADS as readonly number[]).includes(value);

export type BillLine = { label: string; units: number; rate: number; paisa: number };
export type Bill = { units: number; lifeline: boolean; lines: BillLine[]; energy: number; demand: number; vat: number; total: number; step: Step | null };

/**
 * The month's bill in paisa for whole units and a sanctioned load in kW.
 * A month of 50 units or less is billed at the lifeline rate throughout; above that, each band at its own rate, then the demand charge, then VAT on both.
 */
export function bill(rawUnits: number, kw: number, rates: Tariff = tariff): Bill {
  const units = Math.max(0, Math.round(rawUnits));
  const lines: BillLine[] = [];
  const lifeline = units <= rates.lifeline.upTo;
  if (lifeline) {
    if (units > 0) lines.push({ label: "লাইফলাইন", units, rate: rates.lifeline.rate, paisa: units * rates.lifeline.rate });
  } else {
    for (const step of rates.steps) {
      const inStep = Math.min(units, step.upTo) - (step.from - 1);
      if (inStep <= 0) break;
      lines.push({ label: step.label, units: inStep, rate: step.rate, paisa: inStep * step.rate });
    }
  }
  const energy = lines.reduce((sum, line) => sum + line.paisa, 0);
  const demand = Math.round(kw * rates.demandPerKw);
  const vat = Math.round((energy + demand) * rates.vat);
  const step = lifeline ? null : rates.steps.find(item => units <= item.upTo) ?? null;
  return { units, lifeline, lines, energy, demand, vat, total: energy + demand + vat, step };
}

/** Units left before the next, dearer band starts; null at the top band or inside the lifeline. */
export function toNextStep(units: number, rates: Tariff = tariff) {
  const whole = Math.max(0, Math.round(units));
  if (whole <= rates.lifeline.upTo) return null;
  const step = rates.steps.find(item => whole <= item.upTo);
  return step && Number.isFinite(step.upTo) ? step.upTo + 1 - whole : null;
}
