import { basketTotal, MAX_AMOUNT, MAX_QUANTITY, units, type Item, type Unit } from './basket';
import { isPreset, presets, type PresetId } from './presets';
import { possessive } from '../../../shared/bangla';

export const MAX_NAME = 24;
export const SHARE_ITEM_NAME = 30;
export const SHARE_MAX_ITEMS = 60;
// Headroom under the API's MAX_SHARE_STATE (8000), since Bangla text grows ~9× when URL-encoded.
export const SHARE_BUDGET = 6000;

export type Fordo = { name: string; preset: PresetId | ''; items: Item[]; budget: number | null; money: boolean };

const numbers = new Intl.NumberFormat('bn-BD');
export const bn = (value: number) => numbers.format(value);
/** Taka for the card: "১,৮৫০" when whole, "১৮০.৭৫" otherwise. */
export const formatTaka = (poisha: number) => new Intl.NumberFormat('bn-BD', { maximumFractionDigits: 2 }).format(poisha / 100);

/** Strips control and bidi-override characters (so a link can't scramble the card), and the link's field separator. */
export function cleanText(text: string, max: number) {
  return text.replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩*]/g, ' ').trim().replace(/\s+/g, ' ').slice(0, max).trim();
}


export function fordoTitle({ name, preset }: Pick<Fordo, 'name' | 'preset'>) {
  const title = preset ? presets[preset].title : 'বাজারের ফর্দ';
  return name ? `${possessive(name)} ${title}` : title;
}

export const pricedCount = (items: readonly Pick<Item, 'unitPrice'>[]) => items.filter(item => item.unitPrice !== null).length;

/** The human line on the card, from what the person picked and whether the budget holds. */
export function fordoLine(fordo: Fordo) {
  if (fordo.money && fordo.budget !== null && pricedCount(fordo.items) && basketTotal(fordo) > fordo.budget) return 'বাজেট একটু ছাড়িয়ে যাচ্ছে, দরদাম করে কিনো কিন্তু!';
  return fordo.preset ? presets[fordo.preset].line : 'আসার সময় এগুলো এনো, ভুলো না যেন!';
}

/** Link state: n=name, p=preset, b=budget, then one i=name*quantity*unit[*price] per item. Prices and budget only when money is on. */
export function fordoHash(fordo: Fordo) {
  const params = new URLSearchParams();
  const name = cleanText(fordo.name, MAX_NAME);
  if (name) params.set('n', name);
  if (fordo.preset) params.set('p', fordo.preset);
  if (fordo.money && fordo.budget !== null) params.set('b', String(fordo.budget));
  let length = params.toString().length;
  for (const item of fordo.items.slice(0, SHARE_MAX_ITEMS)) {
    const parts = [cleanText(item.name, SHARE_ITEM_NAME), item.quantity, item.unit];
    if (fordo.money && item.unitPrice !== null) parts.push(item.unitPrice);
    const entry = new URLSearchParams({ i: parts.join('*') }).toString();
    // Long lists keep their first items rather than producing a link the server would refuse.
    if (length + entry.length + 1 > SHARE_BUDGET) break;
    params.append('i', parts.join('*'));
    length += entry.length + 1;
  }
  return params.toString();
}

const whole = (value: string, max: number, min = 0) => /^\d{1,9}$/.test(value) && Number(value) >= min && Number(value) <= max ? Number(value) : null;

export function parseFordo(hash: string): Fordo | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const items = params.getAll('i').slice(0, SHARE_MAX_ITEMS).flatMap((raw, index): Item[] => {
    const [rawName = '', rawQuantity = '', unit = '', rawPrice, ...extra] = raw.split('*');
    const name = cleanText(rawName, SHARE_ITEM_NAME);
    const quantity = whole(rawQuantity, MAX_QUANTITY, 1);
    const unitPrice = rawPrice === undefined ? null : whole(rawPrice, MAX_AMOUNT);
    if (extra.length || !name || quantity === null || !Object.hasOwn(units, unit) || (rawPrice !== undefined && unitPrice === null)) return [];
    return [{ id: `s${index}`, name, quantity, unit: unit as Unit, unitPrice }];
  });
  if (!items.length) return null;
  const preset = params.get('p') ?? '';
  const budget = whole(params.get('b') ?? '', MAX_AMOUNT);
  return { name: cleanText(params.get('n') ?? '', MAX_NAME), preset: isPreset(preset) ? preset : '', items, budget, money: budget !== null || pricedCount(items) > 0 };
}

/** Each shared list keeps its own ticks, keyed by its normalized link state. */
export function tickKey(state: string) {
  let hash = 5381;
  for (const char of state) hash = (hash * 33 + char.codePointAt(0)!) >>> 0;
  return `bazar-note-ticks-${hash.toString(36)}`;
}

export function readTicks(storage: Pick<Storage, 'getItem'>, key: string, count: number): number[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(key) ?? '[]');
    return Array.isArray(value) ? [...new Set(value.filter((index): index is number => Number.isInteger(index) && index >= 0 && index < count))].sort((a, b) => a - b) : [];
  } catch { return []; }
}

export const toggleTick = (ticks: readonly number[], index: number) => ticks.includes(index) ? ticks.filter(tick => tick !== index) : [...ticks, index].sort((a, b) => a - b);

export { possessive };
