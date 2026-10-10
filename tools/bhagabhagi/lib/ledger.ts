import { MAX_SHARE_STATE } from '../../../shared/share-types';

export type Person = { id: string; name: string };
export type Expense = { id: string; label: string; payerId: string; amount: number };
export type Ledger = { trip?: string; people: Person[]; expenses: Expense[] };
export type Balance = { person: Person; paid: number; share: number; net: number };
export type Transfer = { from: Person; to: Person; amount: number };
export const MAX_PEOPLE = 8;
export const MAX_EXPENSES = 100;
export const MAX_EXPENSE_AMOUNT = 100_000_000;
export const MAX_TRIP_LENGTH = 40;
/** A blank khata: what "খাতা খালি করো" goes back to. */
export const initialLedger: Ledger = { trip: '', people: [{ id: 'person-1', name: 'বন্ধু ১' }, { id: 'person-2', name: 'বন্ধু ২' }], expenses: [] };
/** What the page opens with, so the slip is never empty: change the names and amounts to your own. */
export const exampleLedger: Ledger = {
  trip: 'কক্সবাজার ট্যুর',
  people: ['রাফি', 'তানিয়া', 'সাকিব', 'মিম', 'জয়'].map((name, index) => ({ id: `p${index}`, name })),
  expenses: [
    { id: 'e0', label: 'ঢাকা-কক্সবাজার বাস', payerId: 'p1', amount: 600_000 },
    { id: 'e1', label: 'হোটেল, দুই রাত', payerId: 'p0', amount: 900_000 },
    { id: 'e2', label: 'সি-ফুড ডিনার', payerId: 'p2', amount: 425_000 },
    { id: 'e3', label: 'ইজিবাইক আর ডাব', payerId: 'p3', amount: 120_000 },
  ],
};
export const tripIdeas = ['কক্সবাজার ট্যুর', 'সাজেক ট্যুর', 'ইফতার পার্টি', 'বন্ধুদের আড্ডা'];

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const unsafe = /[\u0000-\u001f\u007f\u2028\u2029\u202a-\u202e\u2066-\u2069]/;
function safeText(value: unknown, limit: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= limit && !unsafe.test(value);
}

/** What the trip-name box keeps while typing: no control or bidi characters, at most 40 characters. */
export function cleanTrip(value: string): string {
  return value.replace(new RegExp(unsafe.source, 'g'), '').slice(0, MAX_TRIP_LENGTH);
}

function tripName(value: unknown): string {
  if (value === undefined || value === '') return '';
  if (typeof value !== 'string' || value.length > MAX_TRIP_LENGTH || unsafe.test(value)) throw new Error('ট্যুরের নাম ৪০ অক্ষরের মধ্যে লেখো।');
  return value.normalize('NFC').replace(/\s+/g, ' ').trim();
}

export function parsePoisha(value: string): number {
  const normalized = value.trim().replace(/[০-৯]/g, digit => String('০১২৩৪৫৬৭৮৯'.indexOf(digit)));
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new Error('শুধু অঙ্কে টাকার পরিমাণ লেখো, কমা বা ৳ ছাড়া। দশমিকের পরে দুই ঘর পর্যন্ত দেওয়া যায়।');
  const [whole, fraction = ''] = normalized.split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_EXPENSE_AMOUNT) throw new Error('টাকার পরিমাণ শূন্যের বেশি হতে হবে, আর একটা খরচে ১০ লাখ টাকা পর্যন্ত লেখা যায়।');
  return amount;
}

export function validateLedger(value: unknown): Ledger {
  if (!record(value) || !Array.isArray(value.people) || value.people.length < 2 || value.people.length > MAX_PEOPLE || !Array.isArray(value.expenses) || value.expenses.length > MAX_EXPENSES) throw new Error('২ থেকে ৮ জন আর ১০০টা পর্যন্ত খরচ নিয়ে হিসাব করা যায়।');
  const personIds = new Set<string>();
  const names = new Set<string>();
  const people = value.people.map((person: unknown): Person => {
    if (!record(person) || !safeText(person.id, 80) || personIds.has(person.id) || !safeText(person.name, 24)) throw new Error('নামের ঘর খালি রাখা যাবে না। ২৪ অক্ষরের মধ্যে একটা নাম লেখো।');
    const name = person.name.trim().normalize('NFC');
    const normalizedName = name.toLocaleLowerCase('bn-BD');
    if (names.has(normalizedName)) throw new Error('একই নাম দুবার হয়ে গেল। আলাদা করে চিনতে নামের সাথে কিছু যোগ করো।');
    names.add(normalizedName);
    personIds.add(person.id);
    return { id: person.id, name };
  });
  const expenseIds = new Set<string>();
  const expenses = value.expenses.map((expense: unknown): Expense => {
    if (!record(expense) || !safeText(expense.id, 80) || expenseIds.has(expense.id) || !safeText(expense.label, 50)) throw new Error('কিসের খরচ, লেখো। ৫০ অক্ষরের মধ্যে।');
    if (typeof expense.payerId !== 'string' || !personIds.has(expense.payerId)) throw new Error('টাকাটা কে দিয়েছে, নাম বেছে নাও।');
    if (typeof expense.amount !== 'number' || !Number.isSafeInteger(expense.amount) || expense.amount <= 0 || expense.amount > MAX_EXPENSE_AMOUNT) throw new Error('টাকার পরিমাণটা ঠিক নেই। আরেকবার লেখো।');
    expenseIds.add(expense.id);
    return { id: expense.id, label: expense.label.trim().normalize('NFC'), payerId: expense.payerId, amount: expense.amount };
  });
  return { trip: tripName(value.trip), people, expenses };
}

export function allocatePoisha(total: number, count: number): number[] {
  if (!Number.isSafeInteger(total) || total < 0 || total > MAX_EXPENSE_AMOUNT * MAX_EXPENSES || !Number.isInteger(count) || count < 2 || count > MAX_PEOPLE) throw new Error('সমান ভাগ করা গেল না। নাম আর খরচগুলো আরেকবার দেখো।');
  const base = Math.floor(total / count);
  const remainder = total % count;
  return Array.from({ length: count }, (_, index) => base + Number(index < remainder));
}

function settleBalances(balances: Balance[]): Transfer[] {
  const debtors = balances.filter(balance => balance.net < 0).map(balance => ({ person: balance.person, remaining: -balance.net }));
  const creditors = balances.filter(balance => balance.net > 0).map(balance => ({ person: balance.person, remaining: balance.net }));
  const transfers: Transfer[] = [];
  let creditorIndex = 0;
  for (const debtor of debtors) {
    while (debtor.remaining > 0) {
      const creditor = creditors[creditorIndex];
      const amount = Math.min(debtor.remaining, creditor.remaining);
      transfers.push({ from: debtor.person, to: creditor.person, amount });
      debtor.remaining -= amount;
      creditor.remaining -= amount;
      if (creditor.remaining === 0) creditorIndex += 1;
    }
  }
  return transfers;
}

export function calculateLedger(value: unknown) {
  const ledger = validateLedger(value);
  const total = ledger.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const shares = allocatePoisha(total, ledger.people.length);
  const balances = ledger.people.map((person, index): Balance => {
    const paid = ledger.expenses.filter(expense => expense.payerId === person.id).reduce((sum, expense) => sum + expense.amount, 0);
    return { person, paid, share: shares[index], net: paid - shares[index] };
  });
  return { ledger, total, balances, transfers: settleBalances(balances) };
}

export function removePerson(ledger: Ledger, personId: string): Ledger {
  if (!ledger.people.some(person => person.id === personId)) throw new Error('এই নামটা লিস্টে পাওয়া গেল না।');
  if (ledger.expenses.some(expense => expense.payerId === personId)) throw new Error('এই নামে খরচ আছে। আগে সেই খরচটা বাদ দাও, বা খরচটায় অন্য কারও নাম বসাও।');
  return validateLedger({ ...ledger, people: ledger.people.filter(person => person.id !== personId) });
}

export function formatMoney(poisha: number): string {
  return new Intl.NumberFormat('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(poisha / 100);
}

export function inputAmount(poisha: number): string {
  return `${Math.floor(poisha / 100)}.${String(poisha % 100).padStart(2, '0')}`.replace(/\d/g, digit => '০১২৩৪৫৬৭৮৯'[Number(digit)]);
}

export function ledgerReport(value: unknown): string {
  const { ledger, total, balances, transfers } = calculateLedger(value);
  const lines = [`${ledger.trip || 'ভাগাভাগি'} — সমান ভাগের হিসাব`, `মোট খরচ: ${formatMoney(total)} টাকা · ${new Intl.NumberFormat('bn-BD').format(ledger.people.length)} জন · জনপ্রতি ${perPerson(total, ledger.people.length)} টাকা`, '', 'কে কাকে দেবে'];
  for (const transfer of transfers) lines.push(`${transfer.from.name} → ${transfer.to.name}: ${formatMoney(transfer.amount)} টাকা`);
  if (transfers.length === 0) lines.push(ledger.expenses.length ? 'সবার হিসাব মিলে গেছে।' : 'এখনো কোনো খরচ যোগ হয়নি।');
  lines.push('', 'খরচের লিস্ট');
  for (const expense of ledger.expenses) lines.push(`${expense.label}: ${formatMoney(expense.amount)} টাকা — দিয়েছে ${ledger.people.find(person => person.id === expense.payerId)!.name}`);
  lines.push('', 'সবার হিসাব');
  for (const balance of balances) lines.push(`${balance.person.name}: দিয়েছে ${formatMoney(balance.paid)}, ভাগ ${formatMoney(balance.share)}; ${balance.net > 0 ? 'পাবে' : balance.net < 0 ? 'দেবে' : 'বাকি'} ${formatMoney(Math.abs(balance.net))} টাকা`);
  lines.push('', 'মোট খরচ সবার মধ্যে সমান ভাগ করা। ভাগের পর পয়সা বেঁচে গেলে লিস্টের প্রথম জন থেকে এক পয়সা করে যোগ হয়েছে।', 'যা লেখা হয়েছে, শুধু তার হিসাব। ভাগাভাগি দিয়ে টাকা পাঠানো হয় না।');
  return lines.join('\n');
}

/** "৳২০,৪৫০" — paisa only when there are any. */
export function formatTaka(poisha: number): string {
  return '৳' + new Intl.NumberFormat('bn-BD', { minimumFractionDigits: poisha % 100 ? 2 : 0, maximumFractionDigits: 2 }).format(poisha / 100);
}

/** Everyone's share, honest about the one-poisha remainder. */
export function perPerson(total: number, count: number, format = formatMoney): string {
  return `${total % count ? 'প্রায় ' : ''}${format(Math.floor(total / count))}`;
}

export function ledgerLine({ total, balances, transfers }: Pick<ReturnType<typeof calculateLedger>, 'total' | 'balances' | 'transfers'>): string {
  if (!total) return 'খরচ লিখলেই হিসাব মিলবে।';
  if (!transfers.length) return 'সবাই সমান দিয়েছে, কারও কাছে কারও পাওনা নেই!';
  const top = balances.reduce((most, balance) => (balance.paid > most.paid ? balance : most));
  if (top.paid * 2 > total) return `${top.person.name} একাই অর্ধেকের বেশি খরচ টেনেছে। ওর পাওনাটা আগে মিটিয়ে দাও!`;
  return 'হিসাব পরিষ্কার, বন্ধুত্ব অটুট!';
}

// Bangla stays as-is (1 char instead of 9 percent-encoded ones) so a 100-expense ledger fits in one link; only URL syntax is escaped.
const escapeValue = (text: string) => text.replace(/[\s%&=+#]/g, char => (char === ' ' ? '+' : encodeURIComponent(char)));

/** t=trip, one p= per person in order, one e=<payer index>.<poisha>.<label> per expense. */
export function ledgerHash(value: unknown): string {
  const ledger = validateLedger(value);
  const index = new Map(ledger.people.map((person, position) => [person.id, position]));
  const parts = [
    ...(ledger.trip ? [`t=${escapeValue(ledger.trip)}`] : []),
    ...ledger.people.map(person => `p=${escapeValue(person.name)}`),
    ...ledger.expenses.map(expense => `e=${index.get(expense.payerId)}.${expense.amount}.${escapeValue(expense.label)}`),
  ];
  return '#' + parts.join('&');
}

/** Rebuilds a shared ledger for read-only checking. Anything the editor could not have produced is rejected. */
export function parseLedgerHash(hash: string): Ledger | null {
  if (hash.length > MAX_SHARE_STATE * 9) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const people = params.getAll('p').map((name, index) => ({ id: `p${index}`, name }));
  const expenses: Expense[] = [];
  for (const [index, raw] of params.getAll('e').entries()) {
    const match = /^([0-7])\.([1-9]\d{0,8})\.(.+)$/s.exec(raw);
    if (!match) return null;
    expenses.push({ id: `e${index}`, payerId: `p${match[1]}`, amount: Number(match[2]), label: match[3] });
  }
  if (!expenses.length) return null;
  try { return validateLedger({ trip: params.get('t') ?? '', people, expenses }); } catch { return null; }
}
