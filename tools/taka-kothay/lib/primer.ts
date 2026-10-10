import { banglaAmount, banglaUnder100, figures, parseAmount, type Amount } from "./number-words";

/** What a card shows and a link carries: the amount, plus the two wording choices. Never any free text. */
export type Primer = { amount: Amount; formal: boolean; international: boolean };

export const DEFAULT_PRIMER: Primer = { amount: { taka: 50_000, paisa: 0 }, formal: false, international: false };

/** Amounts people search for word by word ("৫০০০০ টাকা কথায় লেখা"), one tap each. */
export const quickAmounts = [500, 1_000, 15_000, 25_000, 50_000, 1_00_000];

/** "#a=1234567.50&f=1&i=1": the amount in plain Latin digits so the link stays short and readable. */
export function shareHash({ amount, formal, international }: Primer) {
  const params = new URLSearchParams({ a: `${amount.taka}${amount.paisa ? "." + String(amount.paisa).padStart(2, "0") : ""}` });
  if (formal) params.set("f", "1");
  if (international) params.set("i", "1");
  return "#" + params.toString();
}

export function parseShareHash(hash: string): Primer | null {
  if (hash.length > 200) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const raw = params.get("a");
  // Only digits and one dot: no commas, words or currency signs in a link.
  if (!raw || !/^\d{1,10}(\.\d{1,2})?$/.test(raw)) return null;
  const parsed = parseAmount(raw);
  return parsed.ok ? { amount: parsed.amount, formal: params.get("f") === "1", international: params.get("i") === "1" } : null;
}

const UN_WORDS = [29, 39, 49, 59, 69, 79, 89].map(n => banglaUnder100[n]);

/** The red-pen note in the margin, picked from the number itself. */
export function humanLine({ amount, formal }: Primer) {
  const { taka, paisa } = amount;
  const words = banglaAmount(amount, { formal });
  if (taka >= 10_000_000) return "এত শূন্য! গুনতে গুনতে চা ঠান্ডা।";
  const tricky = UN_WORDS.find(word => words.includes(word));
  if (tricky) return `${tricky} — এই বানানে কতজন আটকায়!`;
  if (words.includes("নিরানব্বই")) return "নিরানব্বইয়ের ধাক্কা, আরেকটু হলেই গোল!";
  if (taka === 0 && paisa === 0) return "শূন্য টাকা, তবু লিখতে জানা ভালো।";
  if (paisa) return "পয়সাও বাদ যায়নি, হিসাব একদম পাক্কা।";
  if ((taka >= 1000 && taka % 1000 === 0) || (taka >= 100 && taka < 1000 && taka % 100 === 0)) return "গোল সংখ্যা, মন খুশি।";
  if (taka >= 100_000) return "লাখের ঘরে পা, সাবধানে লেখো।";
  return "অঙ্ক আর কথা মিললে তবেই চেক পাস।";
}

export const caption = (primer: Primer) => `${figures(primer.amount)} = ${banglaAmount(primer.amount, { formal: primer.formal })}। এই সংখ্যাটা কথায় লিখতে পারবে?`;

export const previewTitle = (primer: Primer) => `${figures(primer.amount)} টাকা কথায় কী হয়? দেখে নাও`;
