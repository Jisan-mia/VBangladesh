import { possessive } from "../../../shared/bangla";

export const MAX_NAME_LENGTH = 30;
export const MAX_GIFTS = 3;
/** Seven digits (up to ৯৯,৯৯,৯৯৯) is more than any first pay; longer input is not a pay amount. */
export const MAX_AMOUNT_DIGITS = 7;
export const FIRST_YEAR = 1960;
export const LAST_YEAR = 2100;

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);
/** Years read as words, not amounts: ২০১৯, never ২,০১৯. */
export const bnYear = (year: number) => year.toLocaleString("bn-BD", { useGrouping: false });

/** Where the first money came from. Ids go into links and the tally: append only. */
export const sources = [
  { id: "tuition", label: "টিউশনি", scribble: "প্রথম টিউশনির টাকা" },
  { id: "job", label: "চাকরি", scribble: "প্রথম বেতন" },
  { id: "parttime", label: "পার্টটাইম", scribble: "প্রথম পার্টটাইমের টাকা" },
  { id: "freelance", label: "ফ্রিল্যান্সিং", scribble: "প্রথম পেমেন্ট" },
  { id: "business", label: "ব্যবসা", scribble: "ব্যবসার প্রথম লাভ" },
  { id: "intern", label: "ইন্টার্নশিপ", scribble: "ইন্টার্নশিপের প্রথম টাকা" },
] as const;

/** How the family is addressed; only the labels change, the ids stay. */
export const styles = [
  { id: "ammu", label: "আম্মু-আব্বু" },
  { id: "ma", label: "মা-বাবা" },
] as const;

/** What the first money became. `ma` is the label when the family says মা-বাবা. Ids go into links and the tally: append only. */
export const gifts = [
  { id: "shari", label: "আম্মুর জন্য শাড়ি", ma: "মায়ের জন্য শাড়ি" },
  { id: "panjabi", label: "আব্বুর জন্য পাঞ্জাবি", ma: "বাবার জন্য পাঞ্জাবি" },
  { id: "mishti", label: "মিষ্টি বিলি" },
  { id: "bhaibon", label: "ভাইবোনের উপহার" },
  { id: "nanu", label: "নানু-দাদুর জন্য চাদর", ma: "দাদু-দিদার জন্য চাদর" },
  { id: "treat", label: "বন্ধুদের ট্রিট" },
  { id: "joma", label: "জমিয়ে রেখেছি" },
  // The envelope handed over unopened: it can't sit beside other spending, so toggleGift keeps it alone.
  { id: "pura", label: "পুরো খাম আম্মু-আব্বুর হাতে", ma: "পুরো খাম মা-বাবার হাতে" },
] as const;

export type SourceId = (typeof sources)[number]["id"];
export type GiftId = (typeof gifts)[number]["id"];
export type StyleId = (typeof styles)[number]["id"];
/** Everything a link carries. `year` 0 and `amount` 0 mean "not given". */
export type FirstPay = { source: SourceId; gifts: GiftId[]; year: number; style: StyleId; name: string; amount: number };

export const WHOLE: GiftId = "pura";
export const sample: FirstPay = { source: "tuition", gifts: ["shari"], year: 2019, style: "ammu", name: "", amount: 0 };
export const tallyIds: readonly string[] = [...sources.map(source => source.id), ...gifts.map(gift => gift.id)];

const isSource = (id: string): id is SourceId => sources.some(source => source.id === id);
const isGift = (id: string): id is GiftId => gifts.some(gift => gift.id === id);
const isStyle = (id: string): id is StyleId => styles.some(style => style.id === id);

export const sourceById = (id: SourceId) => sources.find(source => source.id === id)!;
export function giftLabel(id: GiftId, style: StyleId) {
  const gift: { label: string; ma?: string } = gifts.find(item => item.id === id)!;
  return style === "ma" && gift.ma ? gift.ma : gift.label;
}
export const giftList = (pay: Pick<FirstPay, "gifts" | "style">) => pay.gifts.map(id => giftLabel(id, pay.style)).join(" · ");

/** Picks in tap order, at most three; the unopened envelope never shares the list. */
export function toggleGift(picked: readonly GiftId[], id: GiftId): GiftId[] {
  if (picked.includes(id)) return picked.filter(item => item !== id);
  if (id === WHOLE) return [WHOLE];
  return [...picked.filter(item => item !== WHOLE), id].slice(-MAX_GIFTS);
}

export function cleanName(name: string) {
  // NFC, and no control or bidi-override characters, so a shared link can't scramble the card. ZWJ/ZWNJ stay for Bangla shaping.
  const flat = name.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim();
  return Array.from(flat).slice(0, MAX_NAME_LENGTH).join("").trim();
}

/** Typed amount (Bangla or English digits, commas, ৳) to a whole number; 0 when empty or not a sensible amount. */
export function parseAmount(text: string) {
  const digits = text.replace(/[০-৯]/g, digit => String(digit.charCodeAt(0) - 0x09e6)).replace(/[,\s৳/-]/g, "");
  if (!/^\d{1,7}$/.test(digits)) return 0;
  return Number(digits);
}

/** "৳ ৩,০০০/-": how a pay envelope is written on, lakh grouping and all. */
export const amountText = (amount: number) => `৳ ${bn(amount)}/-`;

export function shareHash(pay: FirstPay) {
  const params = new URLSearchParams({ s: pay.source, d: pay.gifts.join(".") });
  if (pay.year >= FIRST_YEAR && pay.year <= LAST_YEAR) params.set("y", String(pay.year));
  if (pay.style !== "ammu") params.set("k", pay.style);
  const name = cleanName(pay.name);
  if (name) params.set("n", name);
  if (pay.amount > 0 && pay.amount < 10 ** MAX_AMOUNT_DIGITS) params.set("t", String(Math.floor(pay.amount)));
  return "#" + params.toString();
}

/** Reads #s=tuition&d=shari.mishti&y=2019&n=রাফি; null unless there's a known source and at least one known gift. */
export function parseShareHash(hash: string): FirstPay | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const source = params.get("s") ?? "";
  if (!isSource(source)) return null;
  let picked: GiftId[] = [];
  for (const id of (params.get("d") ?? "").split(".").slice(0, 8)) if (isGift(id)) picked = picked.includes(id) ? picked : toggleGift(picked, id);
  if (!picked.length) return null;
  const year = /^\d{4}$/.test(params.get("y") ?? "") ? Number(params.get("y")) : 0;
  const style = params.get("k") ?? "";
  const amount = /^[1-9]\d{0,6}$/.test(params.get("t") ?? "") ? Number(params.get("t")) : 0;
  return {
    source,
    gifts: picked,
    year: year >= FIRST_YEAR && year <= LAST_YEAR ? year : 0,
    style: isStyle(style) ? style : "ammu",
    name: cleanName(params.get("n") ?? ""),
    amount,
  };
}

/** The human line, chosen from what the money became. First match wins. */
export function payLine(pay: Pick<FirstPay, "gifts" | "style" | "source">) {
  const has = (id: GiftId) => pay.gifts.includes(id);
  const ma = pay.style === "ma";
  const [mother, father] = ma ? ["মা", "বাবা"] : ["আম্মু", "আব্বু"];
  const [mothers, fathers, parents] = ma ? ["মায়ের", "বাবার", "মা-বাবার"] : ["আম্মুর", "আব্বুর", "আম্মু-আব্বুর"];
  if (has(WHOLE)) return `খামটা না খুলেই ${parents} হাতে। ওই হাসির দাম কোনো বেতনে হয় না।`;
  if (pay.gifts.length === MAX_GIFTS) return "এক খামে এত জনের হাসি। টাকাটা কাজে লেগেছে।";
  if (has("shari") && has("panjabi")) return `${mothers} শাড়ি, ${fathers} পাঞ্জাবি। প্রথম আয়ের সবচেয়ে সুন্দর হিসাব।`;
  if (has("shari")) return `${mother} বলেছিল “কেন খরচ করলি?”, তারপর সবাইকে দেখিয়েছিল।`;
  if (has("panjabi")) return `${father} মুখে কিছু বলেনি, কিন্তু প্রতিটা অনুষ্ঠানে ওই পাঞ্জাবিটাই পরত।`;
  if (has("nanu")) return `নতুন চাদর গায়ে, মাথায় হাত। ${ma ? "আশীর্বাদটা" : "দোয়াটা"} এখনো সাথে আছে।`;
  if (has("mishti")) return "প্রথম টাকায় সবার মুখ মিষ্টি, এর চেয়ে ভালো খরচ নেই।";
  if (has("bhaibon")) return "ভাইবোনের হাতে প্রথম উপহার। সেদিন মনে হলো, সত্যিই বড় হয়ে গেছি।";
  if (has("treat")) return pay.source === "tuition" ? "বন্ধুরা বলছিল “ট্রিট কবে?” টিউশনির টাকায় অবশেষে!" : "বন্ধুরা বলছিল “ট্রিট কবে?” অবশেষে!";
  return "প্রথম আয়টা খরচ করিনি, যত্ন করে রেখে দিয়েছি।";
}

export function cardTitle(name: string) {
  return `${name ? possessive(name) : "আমার"} প্রথম আয়`;
}

export function previewTitle(pay: FirstPay) {
  return `${pay.name ? possessive(pay.name) : "এক বন্ধুর"} প্রথম আয়: ${pay.gifts.map(id => giftLabel(id, pay.style)).join(", ")} — তোমারটা দিয়ে কী করেছিলে?`;
}

export { possessive };
