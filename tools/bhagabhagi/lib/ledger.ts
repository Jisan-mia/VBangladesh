export type Person = { id: string; name: string };
export type Expense = { id: string; label: string; payerId: string; amount: number };
export type Ledger = { people: Person[]; expenses: Expense[] };
export type Balance = { person: Person; paid: number; share: number; net: number };
export type Transfer = { from: Person; to: Person; amount: number };
export const MAX_PEOPLE = 8;
export const MAX_EXPENSES = 100;
export const MAX_EXPENSE_AMOUNT = 100_000_000;
export const initialLedger: Ledger = { people: [{ id: 'person-1', name: 'ব্যক্তি ১' }, { id: 'person-2', name: 'ব্যক্তি ২' }], expenses: [] };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeText(value: unknown, limit: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= limit && !/[\u0000-\u001f\u007f\u2028\u2029\u202a-\u202e\u2066-\u2069]/.test(value);
}

export function parsePoisha(value: string): number {
  const normalized = value.trim().replace(/[০-৯]/g, digit => String('০১২৩৪৫৬৭৮৯'.indexOf(digit)));
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new Error('কমা বা টাকা চিহ্ন ছাড়া পরিমাণ লিখুন। দশমিকের পরে সর্বোচ্চ দুই ঘর দিন।');
  const [whole, fraction = ''] = normalized.split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_EXPENSE_AMOUNT) throw new Error('খরচ শূন্যের বেশি হতে হবে। একবারে সর্বোচ্চ ১০ লাখ টাকা লিখতে পারবেন।');
  return amount;
}

export function validateLedger(value: unknown): Ledger {
  if (!record(value) || !Array.isArray(value.people) || value.people.length < 2 || value.people.length > MAX_PEOPLE || !Array.isArray(value.expenses) || value.expenses.length > MAX_EXPENSES) throw new Error('২ থেকে ৮ জন ও সর্বোচ্চ ১০০টি খরচ দিয়ে হিসাব করুন।');
  const personIds = new Set<string>();
  const names = new Set<string>();
  const people = value.people.map((person: unknown): Person => {
    if (!record(person) || !safeText(person.id, 80) || personIds.has(person.id) || !safeText(person.name, 24)) throw new Error('প্রত্যেকের আলাদা নাম লিখুন। নাম সর্বোচ্চ ২৪ অক্ষরের হতে পারে।');
    const name = person.name.trim().normalize('NFC');
    const normalizedName = name.toLocaleLowerCase('bn-BD');
    if (names.has(normalizedName)) throw new Error('একই নাম দুবার আছে। আলাদা করে চিনতে নামের সঙ্গে কিছু যোগ করুন।');
    names.add(normalizedName);
    personIds.add(person.id);
    return { id: person.id, name };
  });
  const expenseIds = new Set<string>();
  const expenses = value.expenses.map((expense: unknown): Expense => {
    if (!record(expense) || !safeText(expense.id, 80) || expenseIds.has(expense.id) || !safeText(expense.label, 50)) throw new Error('প্রতিটি খরচের নাম লিখুন। সর্বোচ্চ ৫০ অক্ষর ব্যবহার করুন।');
    if (typeof expense.payerId !== 'string' || !personIds.has(expense.payerId)) throw new Error('টাকা কে দিয়েছেন, তালিকা থেকে বেছে নিন।');
    if (typeof expense.amount !== 'number' || !Number.isSafeInteger(expense.amount) || expense.amount <= 0 || expense.amount > MAX_EXPENSE_AMOUNT) throw new Error('খরচের পরিমাণ ঠিক নেই। আবার লিখুন।');
    expenseIds.add(expense.id);
    return { id: expense.id, label: expense.label.trim(), payerId: expense.payerId, amount: expense.amount };
  });
  return { people, expenses };
}

export function allocatePoisha(total: number, count: number): number[] {
  if (!Number.isSafeInteger(total) || total < 0 || total > MAX_EXPENSE_AMOUNT * MAX_EXPENSES || !Number.isInteger(count) || count < 2 || count > MAX_PEOPLE) throw new Error('সমান ভাগ করার তথ্য ঠিক নেই।');
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
  if (!ledger.people.some(person => person.id === personId)) throw new Error('নামটি তালিকায় পাওয়া যায়নি।');
  if (ledger.expenses.some(expense => expense.payerId === personId)) throw new Error('এই নামে খরচ আছে। আগে খরচটি বাদ দিন অথবা টাকা দিয়েছেন এমন অন্য নাম বেছে নিন।');
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
  const lines = ['ভাগাভাগি — সমান ভাগের হিসাব', '', `মোট খরচ: ${formatMoney(total)} টাকা`, `লোকসংখ্যা: ${new Intl.NumberFormat('bn-BD').format(ledger.people.length)}`, '', 'খরচের তালিকা'];
  for (const expense of ledger.expenses) lines.push(`${expense.label}: ${formatMoney(expense.amount)} টাকা — দিয়েছেন ${ledger.people.find(person => person.id === expense.payerId)!.name}`);
  lines.push('', 'সবার হিসাব');
  for (const balance of balances) lines.push(`${balance.person.name}: দিয়েছেন ${formatMoney(balance.paid)}, ভাগ ${formatMoney(balance.share)}; ${balance.net > 0 ? 'পাবেন' : balance.net < 0 ? 'দেবেন' : 'বাকি'} ${formatMoney(Math.abs(balance.net))} টাকা`);
  lines.push('', 'কে কাকে দেবেন');
  for (const transfer of transfers) lines.push(`${transfer.from.name} → ${transfer.to.name}: ${formatMoney(transfer.amount)} টাকা`);
  if (transfers.length === 0) lines.push(ledger.expenses.length ? 'সবার হিসাব মিলে গেছে।' : 'এখনো কোনো খরচ যোগ হয়নি।');
  lines.push('', 'মোট খরচ সবার মধ্যে সমান ভাগ। অবশিষ্ট পয়সা নামের তালিকার শুরু থেকে এক পয়সা করে যোগ হয়।', 'এটি আপনার দেওয়া তথ্যের হিসাব। এখানে টাকা পাঠানো হয় না।');
  return lines.join('\n');
}
