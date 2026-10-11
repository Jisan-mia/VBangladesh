import { possessive } from "../../../shared/bangla";
import { itemById, items, mix, recipes, STARTERS, type Item } from "./recipes";

export { possessive };
export const MAX_NAME_LENGTH = 30;
export const TOTAL = items.length;
/** What can be made: everything except the four starters. Counts shown to people are "made", never "have". */
export const MAKEABLE = TOTAL - STARTERS.length;
export const madeCount = (found: readonly string[]) => found.length - STARTERS.length;
const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);
export const nameOf = (id: string) => itemById(id)?.name ?? "";

export function cleanName(name: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the card text.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

/** Keeps only what can really be made from the four starters using items in the set, so a hand-edited link can't claim 200 finds. */
export function honest(ids: Iterable<string>): string[] {
  const wanted = new Set(ids);
  const have = new Set<string>(STARTERS);
  for (let grew = true; grew;) {
    grew = false;
    for (const { a, b, out } of recipes) {
      if (!have.has(out) && wanted.has(out) && have.has(a) && have.has(b)) { have.add(out); grew = true; }
    }
  }
  return items.filter(item => have.has(item.id)).map(item => item.id);
}

export function encodeSet(ids: readonly string[]) {
  let bits = 0n;
  for (const id of ids) { const item = itemById(id); if (item) bits |= 1n << BigInt(item.index); }
  return bits.toString(36);
}

export function decodeSet(code: string): string[] {
  if (!/^[0-9a-z]{1,52}$/.test(code)) return [];
  const bits = [...code].reduce((total, char) => total * 36n + BigInt(parseInt(char, 36)), 0n);
  return items.filter(item => (bits >> BigInt(item.index)) & 1n).map(item => item.id);
}

export type Shared = { found: string[]; latest: string; name: string };

export function shareHash({ found, latest, name }: Shared) {
  const params = new URLSearchParams({ d: encodeSet(found) });
  if (latest && found.includes(latest) && !(STARTERS as readonly string[]).includes(latest)) params.set("l", latest);
  const shownName = cleanName(name);
  if (shownName) params.set("n", shownName);
  return "#" + params.toString();
}

/** A friend's link. Null unless it carries at least one real find beyond the starters. */
export function parseShareHash(hash: string): Shared | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const found = honest(decodeSet(params.get("d") ?? ""));
  if (found.length <= STARTERS.length) return null;
  const latest = params.get("l") ?? "";
  return { found, latest: found.includes(latest) && !(STARTERS as readonly string[]).includes(latest) ? latest : found.at(-1)!, name: cleanName(params.get("n") ?? "") };
}

/** Progress saved in this browser: finds in the order they were made. Anything unknown or impossible is dropped. */
export function parseSaved(raw: string | null): { order: string[]; latest: string } {
  const fresh = { order: [...STARTERS] as string[], latest: "" };
  if (!raw) return fresh;
  try {
    const value = JSON.parse(raw) as { order?: unknown; latest?: unknown };
    const listed = Array.isArray(value.order) ? value.order.filter((id): id is string => typeof id === "string") : [];
    const real = new Set(honest(listed));
    const order = [...new Set([...STARTERS, ...listed])].filter(id => real.has(id));
    const latest = typeof value.latest === "string" && real.has(value.latest) ? value.latest : "";
    return { order, latest };
  } catch { return fresh; }
}

export type Hint = { a: string; b: string; out: string };

/** The next thing within reach, in the list's order (roughly easy to hard), so hints lead step by step. */
export function nextHint(found: ReadonlySet<string>): Hint | null {
  let best: Hint | null = null;
  for (const recipe of recipes) {
    if (found.has(recipe.out) || !found.has(recipe.a) || !found.has(recipe.b)) continue;
    if (!best || itemById(recipe.out)!.index < itemById(best.out)!.index) best = recipe;
  }
  return best;
}

export type Mixed =
  | { type: "new"; item: Item }
  | { type: "old"; item: Item }
  | { type: "none"; hint: string };

export function combine(a: string, b: string, found: ReadonlySet<string>): Mixed {
  const out = mix(a, b);
  const item = out ? itemById(out) : undefined;
  if (item) return { type: found.has(item.id) ? "old" : "new", item };
  // A gentle nudge: an ingredient they just used still has something waiting, or else the next easy find.
  const waiting = recipes.find(recipe => !found.has(recipe.out) && found.has(recipe.a) && found.has(recipe.b) && [a, b].some(id => id === recipe.a || id === recipe.b));
  if (waiting) {
    const used = [a, b].find(id => id === waiting.a || id === waiting.b)!;
    return { type: "none", hint: `${nameOf(used)} দিয়ে কিছু একটা হয়, অন্য কিছুর সাথে মিশিয়ে দেখো।` };
  }
  const next = nextHint(found);
  return { type: "none", hint: next ? `${nameOf(next.a)} নিয়ে একটু খেলে দেখো।` : "সব বানানো শেষ! এবার বন্ধুদের দেখাও।" };
}

export function humanLine(count: number) {
  if (count >= MAKEABLE) return "সব বানিয়ে ফেলেছ! নানির হাঁড়ির কোনো রহস্য আর বাকি নেই।";
  if (count <= 4) return "সবে চুলা ধরল, হাঁড়ি গরম হচ্ছে।";
  if (count <= 20) return "ভাত-পান্তা দিয়ে শুরু, এখন হাঁড়ি থামতেই চায় না।";
  if (count <= 55) return "নানি দেখলে বলত, ‘এই তো, হাত পেকেছে!’";
  if (count <= 105) return "নদী, খেত, মেলা। হাঁড়ির ভেতর আস্ত একটা দেশ।";
  return "আর অল্প কয়টা বাকি, হাঁড়ি এখনো টগবগ করছে।";
}

/** The card shows the latest find plus the hardest-won ones (later in the list = deeper in the tree). */
export function showcase(found: readonly string[], latest: string, count = 6) {
  return items.filter(item => found.includes(item.id) && item.id !== latest && !(STARTERS as readonly string[]).includes(item.id)).slice(-count).reverse();
}

export const tallyIds = items.filter(item => !(STARTERS as readonly string[]).includes(item.id)).map(item => item.id);

export function headline(name: string, count: number) {
  return `${name || "আমি"} ${bn(count)}টা জিনিস ${name ? "বানিয়েছে" : "বানিয়েছি"}`;
}

export function caption(count: number, latest: string) {
  const last = nameOf(latest);
  return `নানির জাদুর হাঁড়িতে মিশিয়ে মিশিয়ে আমি ${bn(count)}টা জিনিস বানিয়েছি${last ? `, সর্বশেষ ${last}` : ""}! তুমি কয়টা পারবে?`;
}

export function previewTitle(shared: Shared | null) {
  if (!shared) return "দেশি মিশ্রণ — দুটো মেশাও, নতুন বানাও";
  return `${shared.name || "এক বন্ধু"} ${bn(madeCount(shared.found))}টা জিনিস বানিয়েছে · সর্বশেষ: ${nameOf(shared.latest)}। তুমি কয়টা পারবে?`;
}
