export const units = { piece: 'পিস', hali: 'হালি', kg: 'কেজি', litre: 'লিটার' } as const;
export type Unit = keyof typeof units;
export type Item = { id: string; name: string; quantity: number; unit: Unit; unitPrice: number };
export type Basket = { items: Item[]; budget: number | null };
export const MAX_ITEMS = 100;
export const MAX_QUANTITY = 999999;
export const MAX_AMOUNT = 99999999;

export function parseHundredths(value: string): number {
  const normalized = value.trim().replace(/[০-৯]/g, digit => String('০১২৩৪৫৬৭৮৯'.indexOf(digit)));
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new Error('সংখ্যাটা ঠিক করে লেখো, যেমন ২ বা ১.৫০। দশমিকের পরে দুই ঘরের বেশি না।');
  const [whole, fraction = ''] = normalized.split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(amount) || amount > MAX_AMOUNT) throw new Error('৯,৯৯,৯৯৯.৯৯-এর বেশি লেখা যায় না।');
  return amount;
}

export function lineTotal(item: Item): number {
  return Math.floor((item.quantity * item.unitPrice + 50) / 100);
}

export function basketTotal(basket: Basket): number {
  return basket.items.reduce((total, item) => total + lineTotal(item), 0);
}

export function formatMoney(poisha: number): string {
  return new Intl.NumberFormat('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(poisha / 100);
}

export function formatQuantity(hundredths: number): string {
  return new Intl.NumberFormat('bn-BD', { maximumFractionDigits: 2, useGrouping: false }).format(hundredths / 100);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_AMOUNT;
}

export function validateBasket(value: unknown): Basket {
  if (!isRecord(value) || !Array.isArray(value.items) || value.items.length > MAX_ITEMS || (value.budget !== null && !isAmount(value.budget))) {
    throw new Error('রাখা লিস্টটা পড়া যাচ্ছে না।');
  }
  const ids = new Set<string>();
  const items = value.items.map((item: unknown): Item => {
    if (!isRecord(item) || typeof item.id !== 'string' || !item.id || item.id.length > 80 || ids.has(item.id) ||
      typeof item.name !== 'string' || !item.name.trim() || item.name.length > 80 || /[\u0000-\u001f\u007f]/.test(item.name) ||
      !isAmount(item.quantity) || item.quantity === 0 || item.quantity > MAX_QUANTITY || !isAmount(item.unitPrice) ||
      typeof item.unit !== 'string' || !Object.hasOwn(units, item.unit)) {
      throw new Error('লিস্টের কিছু লেখা ঠিক নেই। নাম, পরিমাণ আর দাম একবার দেখে নাও।');
    }
    ids.add(item.id);
    return { id: item.id, name: item.name.trim(), quantity: item.quantity, unit: item.unit as Unit, unitPrice: item.unitPrice };
  });
  return { items, budget: value.budget as number | null };
}

export function exportList(basket: Basket, mode: 'items' | 'money'): string {
  const lines = ['বাজার নোট', 'আমার বাজারের লিস্ট', ''];
  for (const [index, item] of basket.items.entries()) {
    lines.push(`${new Intl.NumberFormat('bn-BD').format(index + 1)}. ${item.name} — ${formatQuantity(item.quantity)} ${units[item.unit]}`);
    if (mode === 'money') lines.push(`   প্রতি ${units[item.unit]} ${formatMoney(item.unitPrice)} টাকা · মোট ${formatMoney(lineTotal(item))} টাকা`);
  }
  if (mode === 'money') {
    const total = basketTotal(basket);
    lines.push('', `মোট: ${formatMoney(total)} টাকা`);
    if (basket.budget !== null) {
      const difference = basket.budget - total;
      lines.push(`বাজেট: ${formatMoney(basket.budget)} টাকা`, `${difference < 0 ? 'বাজেটের বেশি' : 'বাজেট থেকে বাকি'}: ${formatMoney(Math.abs(difference))} টাকা`);
    }
    lines.push('দাম নিজের দেওয়া, বাজারের আজকের দর না।');
  }
  return lines.join('\n');
}
