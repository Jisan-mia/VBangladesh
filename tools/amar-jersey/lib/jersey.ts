import { possessive } from "../../../shared/bangla";

export const MAX_NAME = 12;
export const MAX_NUMBER = 99;

// Kits are named by colour only: no federation names, crests, sponsors or kit-maker marks (trademarks).
// `wall` is the stall's tin wall behind the shirt, picked per kit so every shirt stands out from it.
// Share links store the id: never rename or delete one once links are public.
export const kits = [
  { id: "redgreen", label: "লাল-সবুজ", body: "#006a4e", sleeve: "#e8283c", trim: "#e8283c", ink: "#ffffff", outline: "#e8283c", wall: "#e3ad3c" },
  { id: "sky", label: "আকাশি-সাদা ডোরা", body: "#ffffff", stripe: "#74acdf", sleeve: "", trim: "#1b2a4a", ink: "#1b2a4a", outline: "", wall: "#1f3a56" },
  { id: "yellow", label: "হলুদ-সবুজ", body: "#ffd400", sleeve: "", trim: "#009440", ink: "#00843d", outline: "", wall: "#1e4f8f" },
  { id: "white", label: "সাদা", body: "#f6f5f0", sleeve: "", trim: "#1d2b53", ink: "#1d2b53", outline: "", wall: "#c0503c" },
  { id: "red", label: "লাল", body: "#c8102e", sleeve: "", trim: "#ffffff", ink: "#ffffff", outline: "", wall: "#e3ad3c" },
  { id: "orange", label: "কমলা", body: "#f26a1b", sleeve: "", trim: "#1c1c1c", ink: "#1c1c1c", outline: "", wall: "#1f3a56" },
  { id: "blue", label: "নীল", body: "#1f4fa3", sleeve: "", trim: "#ffffff", ink: "#ffffff", outline: "", wall: "#e3ad3c" },
  { id: "black", label: "কালো-সোনালি", body: "#18191d", sleeve: "", trim: "#d4a62a", ink: "#e8bf4a", outline: "", wall: "#c0503c" },
] as const;

export const sports = [
  { id: "c", label: "ক্রিকেট" },
  { id: "f", label: "ফুটবল" },
] as const;

export const quickNumbers = [1, 7, 9, 10, 11, 23] as const;

export type Kit = (typeof kits)[number];
export type KitId = Kit["id"];
export type SportId = (typeof sports)[number]["id"];
export type Digits = "bn" | "en";
export type Jersey = { name: string; number: number; kit: KitId; sport: SportId; digits: Digits; from: string };

export const defaultJersey: Jersey = { name: "", number: 10, kit: "redgreen", sport: "c", digits: "bn", from: "" };
export const PLACEHOLDER_NAME = "তোমার নাম";

const bnFormat = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => bnFormat.format(value);
export const kitById = (id: string) => kits.find(kit => kit.id === id);
export const sportLabel = (id: SportId) => sports.find(sport => sport.id === id)!.label;
export const numberText = (jersey: Pick<Jersey, "number" | "digits">) => jersey.digits === "bn" ? bn(jersey.number) : String(jersey.number);

// shortcut: a short public-card blocklist, not a full moderation filter; extend it when reports come in.
// Long, distinctive words match anywhere (after spaces and dots are squeezed out); short ones only as a whole word, so ইকবাল/Iqbal and ধোনি/Dhoni stay fine.
const blockedParts = ["চোদা", "চুদি", "চুদ", "চোদন", "মাদারচোদ", "বোকাচোদ", "খানকি", "খাংকি", "মাগি", "মাগী", "হারামি", "হারামজাদ", "বেশ্যা", "কুত্তারবাচ্চা", "শুয়োরেরবাচ্চা", "শুয়রেরবাচ্চা", "গান্ডু", "ভোদা",
  "fuck", "bitch", "pussy", "porn", "khanki", "khangki", "harami", "haramjada", "haramzada", "madarchod", "bokachod", "choda", "chodi", "chudi", "chudir", "gandu", "kuttarbacc", "kuttarbach", "shuorerbacc", "bainchod", "behenchod"];
const blockedWords = new Set(["বাল", "চোদ", "bal", "baal", "chod", "chud", "chodu", "fuk", "shit", "magi", "maggi", "randi", "besha", "dick", "sex", "nude", "cock", "ass"]);

export function isBlocked(text: string) {
  const lower = text.normalize("NFC").toLowerCase().replace(/[\u200c\u200d]/g, "");
  const squeezed = lower.replace(/[^\u0980-\u09ffa-z]/g, "");
  return blockedParts.some(part => squeezed.includes(part)) || lower.split(/[^\u0980-\u09ffa-z]+/).some(word => blockedWords.has(word));
}

/** Keeps Bangla, Latin letters, digits and single spaces, capped at MAX_NAME characters. Anything on the blocklist becomes "". */
export function cleanName(raw: string) {
  const name = raw.normalize("NFC").replace(/[^\u0980-\u09ffA-Za-z0-9 \u200c\u200d]/g, "").replace(/\s+/g, " ").trim();
  const capped = [...name].slice(0, MAX_NAME).join("").trim();
  return isBlocked(capped) ? "" : capped;
}

/** Bangla or English digits, 0–99; anything else is null. */
export function parseNumber(raw: string): number | null {
  const ascii = raw.trim().replace(/[০-৯]/g, digit => String(digit.charCodeAt(0) - 0x09e6));
  if (!/^\d{1,2}$/.test(ascii)) return null;
  return Number(ascii);
}

/** The name as printed on the back: Latin letters in capitals, like a real jersey. */
export const printedName = (name: string) => name.toUpperCase();

export function shareHash(jersey: Jersey) {
  const params = new URLSearchParams();
  const name = cleanName(jersey.name), from = cleanName(jersey.from);
  if (name) params.set("n", name);
  params.set("no", String(jersey.number));
  params.set("k", jersey.kit);
  params.set("s", jersey.sport);
  params.set("d", jersey.digits);
  if (from) params.set("f", from);
  return "#" + params.toString();
}

/** Null unless the hash is a real jersey (valid kit and number); in-page anchors like #result are ignored. */
export function parseShareHash(hash: string): Jersey | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const kit = kitById(params.get("k") ?? "");
  const number = parseNumber(params.get("no") ?? "");
  if (!kit || number === null) return null;
  const sport = params.get("s") === "f" ? "f" : "c";
  const digits = params.get("d") === "en" ? "en" : "bn";
  return { name: cleanName(params.get("n") ?? ""), number, kit: kit.id, sport, digits, from: cleanName(params.get("f") ?? "") };
}

/** The human line, picked by the number (never by a player). */
export function humanLine(number: number) {
  if (number === 10) return "দশ নম্বর মানে দায়িত্ব।";
  if (number === 1) return "সবার আগে আমি, সবার শেষেও আমি।";
  if (number === 0) return "শূন্য থেকেই তো সব শুরু।";
  if (number === 7) return "সাত নম্বরটা পরলে হাঁটাই বদলে যায়।";
  if (number === 9) return "নয় নম্বর মানেই গোলের খিদে।";
  if (number === 11) return "এগারো জনের দল, এগারো নম্বরে আমি।";
  if (number > 9 && number % 11 === 0) return "জোড়া অঙ্ক, জোড়া কপাল।";
  if (number > 9) return "নম্বরটা আমার, গল্পটাও আমার।";
  return "ছোট্ট নম্বর, বড় দাপট।";
}

export function caption(jersey: Jersey) {
  const name = cleanName(jersey.name), from = cleanName(jersey.from);
  if (from && name) return `${name}, তোমার জন্য একটা জার্সি বানালাম! পিঠে ${numberText(jersey)} নম্বর। পছন্দ হলো?`;
  return `আমার জার্সি রেডি: পিঠে ${name || "আমার নাম"}, ${numberText(jersey)} নম্বর! তোমার পিঠে কোন নম্বর? বানিয়ে দেখো:`;
}

export function previewTitle(jersey: Jersey | null) {
  if (!jersey) return "পিঠে নিজের নাম, পছন্দের নম্বর — তোমার জার্সিটা বানাও";
  if (jersey.from) return `${jersey.from} তোমার জন্য একটা জার্সি বানিয়েছে`;
  const who = jersey.name ? possessive(jersey.name) : "এক বন্ধুর";
  return `${who} জার্সি, ${numberText(jersey)} নম্বর — তোমারটা বানাও`;
}

// Fixed ids only: the kit and the number. Never the name.
export const tallyIds = [...kits.map(kit => kit.id), ...Array.from({ length: MAX_NUMBER + 1 }, (_, number) => `no-${number}`)];
export const tallyItems = (jersey: Jersey) => [jersey.kit, `no-${jersey.number}`];

export { possessive };
