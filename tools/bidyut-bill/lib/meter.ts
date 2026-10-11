// বিদ্যুৎ বিল কত?: appliances, units, link state and the words on the card. Pure, so it runs in tests and on the server.
import { possessive } from "../../../shared/bangla";
import { bill, DEFAULT_LOAD, isLoad, type Load } from "./tariff";

export { possessive };

/*
 * Wattages are typical values ("সাধারণ মান"), not measurements, and every one is editable. Ranges seen on product labels sold in
 * Bangladesh (no brands): 56" ceiling fan 70–80 W (BLDC 28–35 W); LED bulb 9–15 W; LED TV 32–43" 40–80 W; 1-ton split AC
 * 900–1,200 W while the compressor runs; clothes iron 1,000–1,200 W; rice cooker 600–800 W; Wi-Fi router 6–12 W.
 * 1 horsepower = 745.7 W, so a "১ ঘোড়ার" pump is about 750 W. A fridge's label shows 150–250 W, but the compressor runs only part of
 * the time, so the fridge here is a 24-hour average (60 W ≈ 1.4 units a day; an old fridge can use far more). An IPS is the
 * charging-plus-standby draw spread over the hours given. Units: 1 unit = 1 kWh = 1,000 W for one hour (BERC rates are টাকা/কি.ও.ঘ.).
 */
// Fixed ids: they go in links and the tally. Once public, never rename one; labels, order and wattages may change.
export const appliances = [
  { id: "fan", label: "সিলিং ফ্যান", name: "ফ্যান", watts: 75, count: 2, hours: 8, drawing: "M24 4v11M20 4h8M16 15h16l-2 7H18zM16 18 3 20q-1 2 1 2l13-1M32 18l13 2q1 2-1 2l-13-1M21 22q3 5 6 0" },
  { id: "light", label: "এলইডি বাতি", name: "বাতি", watts: 12, count: 4, hours: 6, drawing: "M17 30q-5-5-5-11a12 12 0 0 1 24 0q0 6-5 11v4H17zM18 38h12M20 42h8M19 23l2.5 3 2.5-3 2.5 3 2.5-3M21 26v4M27 26v4" },
  { id: "fridge", label: "ফ্রিজ", name: "ফ্রিজ", watts: 60, count: 1, hours: 24, note: "চালু-বন্ধ মিলিয়ে দিনের গড়", drawing: "M14 5h20v38H14zM14 19h20M18 10v5M18 24v8M17 43v2M31 43v2" },
  { id: "tv", label: "টিভি", name: "টিভি", watts: 60, count: 1, hours: 4, drawing: "M6 12h36v23H6zM18 41h12M24 35v6M19 5l5 6 5-6" },
  { id: "ac", label: "এসি (১ টন)", name: "এসি", watts: 1000, count: 1, hours: 6, drawing: "M4 12h40v15H4zM8 22h32M12 32q2 4 0 8M24 32q2 4 0 8M36 32q2 4 0 8M36 16h4" },
  { id: "ips", label: "আইপিএস", name: "আইপিএস", watts: 100, count: 1, hours: 6, note: "চার্জ আর স্ট্যান্ডবাই মিলিয়ে", drawing: "M8 14h32v26H8zM14 14v-4h6v4M28 14v-4h6v4M26 19l-5 9h6l-5 9" },
  { id: "iron", label: "ইস্ত্রি", name: "ইস্ত্রি", watts: 1000, count: 1, hours: 0.5, drawing: "M6 34q2-14 18-14h14l4 14zM18 20q0-8 8-8h12M14 28h4M22 28h4" },
  { id: "pump", label: "পানির পাম্প (১ ঘোড়া)", name: "পাম্প", watts: 750, count: 1, hours: 1, drawing: "M8 18h18v16H8zM26 22h8v8h-8M34 26h8M42 18v16M12 34v6M22 34v6M13 22v8M17 22v8M21 22v8" },
  { id: "ricecooker", label: "রাইস কুকার", name: "রাইস কুকার", watts: 700, count: 1, hours: 1, drawing: "M10 20h28v18q0 4-4 4H14q-4 0-4-4zM8 20h32M14 20q0-8 10-8t10 8M22 12v-3h4v3M30 30h4" },
  { id: "router", label: "ওয়াইফাই রাউটার", name: "রাউটার", watts: 10, count: 1, hours: 24, drawing: "M8 30h32v8H8zM14 30V14M34 30V14M14 34h2M20 34h2M18 22q6-5 12 0M15 18q9-8 18 0" },
  { id: "computer", label: "কম্পিউটার", name: "কম্পিউটার", watts: 100, count: 1, hours: 4, drawing: "M6 6h36v24H6zM20 30v5h8v-5M15 35h18M8 42h32" },
] as const satisfies readonly { id: string; label: string; name: string; watts: number; count: number; hours: number; note?: string; drawing: string }[];

export type Appliance = (typeof appliances)[number];
export type ApplianceId = Appliance["id"];
export const applianceIds = appliances.map(item => item.id);
export const isApplianceId = (id: string): id is ApplianceId => (applianceIds as string[]).includes(id);
export const applianceOf = (id: ApplianceId): Appliance => appliances.find(item => item.id === id)!;
export const noteOf = (item: Appliance): string | undefined => "note" in item ? item.note : undefined;

/** The home on the first screen: two fans, four bulbs, a fridge and a TV. */
export const PRESET: readonly ApplianceId[] = ["fan", "light", "fridge", "tv"];
export const DAYS = 30;
export const MAX_COUNT = 30;
export const MAX_WATTS = 3000;
export const HOURS_STEP = 0.5;
export const MAX_NAME = 16;

export type Use = { id: ApplianceId; count: number; hours: number; watts: number };
export type Home = { uses: Use[]; load: Load; name: string };

export const defaultUse = (id: ApplianceId): Use => { const item = applianceOf(id); return { id, count: item.count, hours: item.hours, watts: item.watts }; };
export const presetHome = (): Home => ({ uses: PRESET.map(defaultUse), load: DEFAULT_LOAD, name: "" });

export const clampCount = (count: number) => Math.min(MAX_COUNT, Math.max(1, Math.round(count)));
export const clampHours = (hours: number) => Math.min(24, Math.max(HOURS_STEP, Math.round(hours / HOURS_STEP) * HOURS_STEP));
export const clampWatts = (watts: number) => Math.min(MAX_WATTS, Math.max(1, Math.round(watts)));

/** Keeps one entry per appliance, in the fixed display order. */
export const sortUses = (uses: Use[]) => applianceIds.flatMap(id => uses.find(use => use.id === id) ?? []);

// ——— Units ———

export const useUnits = (use: Use) => (use.count * use.watts * use.hours * DAYS) / 1000;
export const totalUnits = (uses: readonly Use[]) => uses.reduce((sum, use) => sum + useUnits(use), 0);
/** The watts drawn with everything on at once: how fast the meter's disc spins. */
export const connectedWatts = (uses: readonly Use[]) => uses.reduce((sum, use) => sum + use.count * use.watts, 0);

export type Share = { use: Use; units: number; percent: number };
/** Each appliance's share of the month, biggest first (ties keep the display order). Percentages are whole and sum to 100. */
export function shares(uses: readonly Use[]): Share[] {
  const total = totalUnits(uses);
  if (total <= 0) return [];
  const rows = uses.map((use, index) => ({ use, index, units: useUnits(use), raw: (useUnits(use) / total) * 100 }));
  const percents = rows.map(row => Math.floor(row.raw));
  let left = 100 - percents.reduce((a, b) => a + b, 0);
  for (const row of [...rows].sort((a, b) => (b.raw - Math.floor(b.raw)) - (a.raw - Math.floor(a.raw)) || a.index - b.index)) { if (left <= 0) break; percents[row.index] += 1; left -= 1; }
  return rows.map((row, i) => ({ use: row.use, units: row.units, percent: percents[i], index: row.index }))
    .sort((a, b) => b.units - a.units || a.index - b.index)
    .map(({ use, units, percent }) => ({ use, units, percent }));
}

// ——— Numbers in Bangla ———

const whole = new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 1 });
const twoDecimals = new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const bn = (value: number) => whole.format(Math.round(value));
export const bnDecimal = (value: number) => oneDecimal.format(value);
/** Paisa → "৩৯৪.৫০". */
export const takaExact = (paisa: number) => twoDecimals.format(paisa / 100);
/** Paisa → "৬৮১": a bill estimate never needs the paisa. */
export const taka = (paisa: number) => whole.format(Math.round(paisa / 100));
export const hoursText = (hours: number) => hours === 0.5 ? "আধা" : hours === 1.5 ? "দেড়" : hours === 2.5 ? "আড়াই" : bnDecimal(hours);
/** Five meter wheels: "০০০৯৫". */
export const wheelDigits = (units: number) => String(Math.min(99999, Math.max(0, Math.round(units)))).padStart(5, "0");

/** Reads ASCII or Bangla digits ("৭৫", "75", "৭.৫"); null for anything else. */
export function parseNumber(text: string) {
  const ascii = text.trim().replace(/[\u09e6-\u09ef]/g, digit => String(digit.charCodeAt(0) - 0x09e6));
  return /^\d{1,5}(\.\d{1,2})?$/.test(ascii) ? Number(ascii) : null;
}

// ——— Link state: #a=fan2.8,light4.6,fridge1.24,tv1.4&kw=2&n=রাফি (appliance, count, hours[, w watts]) ———

/** NFC, no control or bidi characters, single spaces, at most 16 letters, never ending on a dangling হসন্ত. */
export function cleanName(text: string) {
  const flat = text.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069<>]/g, " ").replace(/\s+/g, " ").trim();
  return Array.from(flat).slice(0, MAX_NAME).join("").replace(/্+$/, "").trim();
}

const hoursToken = (hours: number) => String(hours);
export function encodeUse(use: Use) {
  const item = applianceOf(use.id);
  return `${use.id}${use.count}.${hoursToken(use.hours)}${use.watts !== item.watts ? `w${use.watts}` : ""}`;
}

const USE = /^([a-z]{2,12})(\d{1,2})\.(\d{1,2}(?:\.5)?)(?:w(\d{1,4}))?$/;
/** One "fan2.8w60" token, or null when anything is off (unknown id, out of range, junk). */
export function decodeUse(token: string): Use | null {
  const match = USE.exec(token);
  if (!match || !isApplianceId(match[1])) return null;
  const count = Number(match[2]), hours = Number(match[3]);
  const watts = match[4] === undefined ? applianceOf(match[1]).watts : Number(match[4]);
  if (count < 1 || count > MAX_COUNT || hours < HOURS_STEP || hours > 24 || watts < 1 || watts > MAX_WATTS) return null;
  return { id: match[1], count, hours, watts };
}

export function homeHash(home: Home) {
  const params = new URLSearchParams({ a: sortUses(home.uses).map(encodeUse).join(",") });
  if (home.load !== DEFAULT_LOAD) params.set("kw", String(home.load));
  const name = cleanName(home.name);
  if (name) params.set("n", name);
  // URLSearchParams writes "," as %2C; keep the list readable in a pasted link.
  return params.toString().replaceAll("%2C", ",");
}

/** A shared home, or null when the link has no usable appliance. Bad tokens are dropped; a bad load falls back to the default. */
export function parseHome(hash: string): Home | null {
  if (hash.length > 2000) return null;
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const list = params.get("a");
  if (!list) return null;
  const uses: Use[] = [];
  for (const token of list.split(",").slice(0, appliances.length * 2)) {
    const use = decodeUse(token);
    if (use && !uses.some(item => item.id === use.id)) uses.push(use);
  }
  if (!uses.length) return null;
  const load = Number(params.get("kw"));
  return { uses: sortUses(uses), load: isLoad(load) ? load : DEFAULT_LOAD, name: cleanName(params.get("n") ?? "") };
}

// ——— Words ———

const lines: Record<ApplianceId, string> = {
  fan: "ফ্যান ঘোরে, সাথে মিটারও ঘোরে।",
  light: "বাতিগুলো চুপচাপ জ্বলে, ইউনিট কিন্তু ঠিকই গোনে।",
  fridge: "সবাই ঘুমায়, ফ্রিজ সারারাত জেগে থাকে।",
  tv: "খবর-নাটক-খেলা, টিভির ইউনিটও কম না।",
  ac: "এসি ঠান্ডা, বিল গরম।",
  ips: "কারেন্ট গেলে আইপিএস বাঁচায়, ফিরলে নিজেই খায়।",
  iron: "আধা ঘণ্টার ইস্ত্রি, কিন্তু খিদে বেশ বড়।",
  pump: "ট্যাংক ভরে পানিতে, মিটার ভরে ইউনিটে।",
  ricecooker: "ভাতের হাঁড়িতেও মিটার ঘোরে।",
  router: "রাউটার কখনো ঘুমায় না।",
  computer: "কাজের মেশিন, ইউনিটেরও মেশিন।",
};

/** One warm line from the person's own home. Never about price hikes or blame. */
export function homeLine(uses: readonly Use[]) {
  const units = Math.round(totalUnits(uses));
  const top = shares(uses)[0];
  if (!top) return "একটা যন্ত্র যোগ করো, মিটার ঘুরতে শুরু করবে।";
  if (units <= 50) return "মিটার এত ধীরে ঘোরে, প্রায় শোনাই যায় না।";
  return lines[top.use.id];
}

export const whoseHome = (name: string) => name ? `${possessive(name)} বাসায়` : "আমাদের বাসায়";

/** "এ মাসে এসি খেল ৬২%" */
export function headline(uses: readonly Use[]) {
  const top = shares(uses)[0];
  return top ? `এ মাসে ${applianceOf(top.use.id).name} খেল ${bn(top.percent)}%` : "মিটার এখন থেমে আছে";
}

export function previewTitle(home: Home) {
  const top = shares(home.uses)[0];
  const who = home.name ? `${possessive(home.name)} বাসায়` : "এক বাসায়";
  const units = bn(totalUnits(home.uses));
  return top ? `${who} এ মাসে প্রায় ${units} ইউনিট, ${applianceOf(top.use.id).name} খেল ${bn(top.percent)}%। তোমার বাসায়?` : "কোন যন্ত্রে কত বিল আসে?";
}

/** Everything the result and the card show, from one home. */
export function meterReading(home: Home) {
  const units = totalUnits(home.uses);
  return { units, shares: shares(home.uses), bill: bill(units, home.load), headline: headline(home.uses), line: homeLine(home.uses), watts: connectedWatts(home.uses) };
}
export type Reading = ReturnType<typeof meterReading>;

/** Half-hour steps up to 2 hours (an iron, a pump), whole hours above (fans, lights). */
export function stepHours(hours: number, direction: 1 | -1) {
  const next = direction > 0 ? (hours < 2 ? hours + HOURS_STEP : Math.floor(hours) + 1) : (hours <= 2 ? hours - HOURS_STEP : Math.ceil(hours) - 1);
  return clampHours(next);
}
