import { possessive } from '../../../shared/bangla';
import { MAX_SHARE_STATE } from '../../../shared/share-types';
import { cleanTrip, escapeValue, formatTaka, tripName, unsafe } from './ledger';

// Mess maths, the way mess managers do it: meal rate = total bazar ÷ total meals, each member's share = meals × rate.
// Money here is whole taka; meals are counted in halves (a half meal is common for breakfast).
export type Member = { name: string; halfMeals: number; paid: number };
export type Mess = { title: string; bazar: number; members: Member[] };
export type MemberDraft = { id: string; name: string; meals: string; paid: string };
export type MessDraft = { title: string; bazar: string; members: MemberDraft[] };
export const MAX_MEMBERS = 15;
export const MAX_NAME_LENGTH = 16;
export const MAX_MEALS = 200;
export const MAX_TAKA = 1_000_000;
export const messIdeas = ['এই মাসের মিল', 'মেসের বাজার', 'ফ্ল্যাটের বাজার'];

const bn = (value: number) => new Intl.NumberFormat('bn-BD').format(value);
const latin = (value: string) => value.trim().replace(/[০-৯]/g, digit => String('০১২৩৪৫৬৭৮৯'.indexOf(digit)));
const bnDigits = (value: number) => String(value).replace(/\d/g, digit => '০১২৩৪৫৬৭৮৯'[Number(digit)]);
export const tk = (taka: number) => formatTaka(taka * 100);
export const formatMeals = (halfMeals: number) => bn(halfMeals / 2);
export const memberLabel = (member: Pick<Member, 'name'>, index: number) => member.name || `সদস্য ${bn(index + 1)}`;
export const cleanName = (value: string) => cleanTrip(value, MAX_NAME_LENGTH);
// "সদস্য ৩" ends in a digit, which possessive() would turn into "সদস্য ৩ের".
const owner = (label: string) => /[০-৯]$/.test(label) ? `${label}-এর` : possessive(label);

/** What the page opens with: a five-person mess where the rounding is visible. */
export const exampleMessDraft: MessDraft = {
  title: 'এই মাসের মিল',
  bazar: '১৩২৫০',
  members: [['রাফি', '৬২', '৪২৫০'], ['সাকিব', '৫৫.৫', '৩০০০'], ['জয়', '৪৮', '২০০০'], ['তুষার', '৬০', '৩০০০'], ['নাঈম', '৩১', '১০০০']]
    .map(([name, meals, paid], index) => ({ id: `m${index}`, name, meals, paid })),
};
export const blankMessDraft = (): MessDraft => ({ title: '', bazar: '', members: [1, 2, 3].map(index => ({ id: `blank-${index}`, name: '', meals: '', paid: '' })) });

/** Whole taka in Bangla or English digits; commas are fine. Empty means 0. */
export function parseTaka(value: string, what: string): number {
  const text = latin(value).replace(/,/g, '');
  if (!text) return 0;
  if (!/^\d{1,7}$/.test(text) || Number(text) > MAX_TAKA) throw new Error(`${what}: পুরো টাকায় লেখো, ১০ লাখের মধ্যে। পয়সা বা ৳ লাগবে না।`);
  return Number(text);
}

/** Meals in whole or half steps (২৫ or ২৫.৫), returned in half-meals. Empty means 0. */
export function parseMeals(value: string, what: string): number {
  const text = latin(value);
  if (!text) return 0;
  const match = /^(\d{1,3})(?:\.([05])0?)?$/.exec(text);
  const half = match ? Number(match[1]) * 2 + Number(match[2] === '5') : NaN;
  if (!(half <= MAX_MEALS * 2)) throw new Error(`${what}: পুরো বা আধা মিল লেখো, যেমন ২৫ বা ২৫.৫। ২০০ মিলের মধ্যে।`);
  return half;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
const count = (value: unknown, max: number): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= max;

/** The trust boundary for both the editor and shared links. */
export function validateMess(value: unknown): Mess {
  if (!record(value) || !Array.isArray(value.members) || value.members.length < 2 || value.members.length > MAX_MEMBERS) throw new Error('২ থেকে ১৫ জন নিয়ে মিলের হিসাব করা যায়।');
  if (!count(value.bazar, MAX_TAKA) || value.bazar === 0) throw new Error('মাসের মোট বাজার খরচটা লেখো।');
  const members = value.members.map((member: unknown, index): Member => {
    if (!record(member) || typeof member.name !== 'string' || unsafe.test(member.name)) throw new Error(`${bn(index + 1)} নম্বর সারির নামটা ঠিক নেই।`);
    const name = member.name.normalize('NFC').replace(/\s+/g, ' ').trim();
    if (name.length > MAX_NAME_LENGTH) throw new Error('নাম ১৬ অক্ষরের মধ্যে লেখো।');
    if (!count(member.halfMeals, MAX_MEALS * 2) || !count(member.paid, MAX_TAKA)) throw new Error(`${owner(memberLabel({ name }, index))} মিল বা টাকার ঘরটা ঠিক নেই।`);
    return { name, halfMeals: member.halfMeals, paid: member.paid };
  });
  if (!members.some(member => member.halfMeals > 0)) throw new Error('অন্তত একজনের মিল লেখো।');
  return { title: tripName(value.title), bazar: value.bazar, members };
}

export function messFromDraft(draft: MessDraft): Mess {
  return validateMess({
    title: draft.title,
    bazar: parseTaka(draft.bazar, 'মোট বাজার'),
    members: draft.members.map((member, index) => {
      const label = memberLabel({ name: member.name.trim() }, index);
      return { name: member.name, halfMeals: parseMeals(member.meals, `${owner(label)} মিল`), paid: parseTaka(member.paid, `${label} কত দিয়েছে`) };
    }),
  });
}

export function draftFromMess(mess: Mess): MessDraft {
  return {
    title: mess.title,
    bazar: bnDigits(mess.bazar),
    members: mess.members.map((member, index) => ({ id: `shared-${index}`, name: member.name, meals: member.halfMeals ? bnDigits(member.halfMeals / 2) : '', paid: member.paid ? bnDigits(member.paid) : '' })),
  };
}

/**
 * Shares in whole taka that add up to the bazar exactly (largest remainder): everyone gets the taka part of
 * bazar × meals ÷ total meals, and the few taka left over go one each to the biggest leftover paisa, ties in list order.
 */
export function calculateMess(value: unknown) {
  const mess = validateMess(value);
  const totalHalf = mess.members.reduce((sum, member) => sum + member.halfMeals, 0);
  const exact = mess.members.map(member => mess.bazar * member.halfMeals);
  const floors = exact.map(amount => Math.floor(amount / totalHalf));
  const leftover = mess.bazar - floors.reduce((sum, share) => sum + share, 0);
  const up = new Set(exact.map((_, index) => index).sort((a, b) => exact[b] % totalHalf - exact[a] % totalHalf || a - b).slice(0, leftover));
  const members = mess.members.map((member, index) => {
    const share = floors[index] + Number(up.has(index));
    return { ...member, label: memberLabel(member, index), share, net: member.paid - share, roundedUp: up.has(index) };
  });
  return {
    mess, members, leftover,
    totalHalf,
    /** In poisha, for display only; shares come from the exact fraction above. */
    rate: Math.round(mess.bazar * 200 / totalHalf),
    paid: mess.members.reduce((sum, member) => sum + member.paid, 0),
  };
}
export type MessResult = ReturnType<typeof calculateMess>;

const listNames = (names: string[]) => names.length > 1 ? `${names.slice(0, -1).join(', ')} আর ${names[names.length - 1]}` : names[0];

/** Says out loud how the rounding was done, so nobody has to trust a hidden rule. */
export function roundingNote({ mess, members, leftover }: MessResult): string {
  if (!leftover) return `সবার ভাগ পুরো টাকায় মিলে গেছে। যোগ করলে ঠিক ${tk(mess.bazar)}।`;
  const names = members.filter(member => member.roundedUp).map(member => member.label);
  if (names.length === 1) return `ভাগ পুরো টাকায় ধরা, যোগ করলে ঠিক ${tk(mess.bazar)}। পয়সাগুলো মিলে যে ১ টাকা হলো, তা গেছে ${owner(names[0])} ভাগে। পয়সার ঘর তারই সবচেয়ে বড় ছিল।`;
  return `ভাগ পুরো টাকায় ধরা, যোগ করলে ঠিক ${tk(mess.bazar)}। পয়সাগুলো মিলে যে ${bn(leftover)} টাকা হলো, তা ১ টাকা করে গেছে ${owner(listNames(names))} ভাগে। পয়সার ঘর তাদেরই সবচেয়ে বড় ছিল।`;
}

/** Only when people wrote what they paid and it does not match the bazar: where the difference sits. */
export function cashNote({ mess, paid }: MessResult): string {
  if (!paid || paid === mess.bazar) return '';
  return paid > mess.bazar
    ? `সবাই মিলে দিয়েছে ${tk(paid)}, বাজার হয়েছে ${tk(mess.bazar)}। বাড়তি ${tk(paid - mess.bazar)} যার কাছে জমা, সে-ই ‘পাবে’-দের ফেরত দেবে।`
    : `সবাই মিলে দিয়েছে ${tk(paid)}, বাজার হয়েছে ${tk(mess.bazar)}। বাকি ${tk(mess.bazar - paid)} কে দিয়েছে, লেখা নেই। ‘দেবে’-দের টাকা উঠলে সেটা মিটবে।`;
}

export function messLine({ members, paid }: MessResult): string {
  if (!paid) return 'মিল রেট বের হলো। এবার যার যার ভাগটা জমা দাও!';
  if (members.every(member => member.net === 0)) return 'সবার হিসাব মিলে গেছে, কেউ কারও কাছে পায় না।';
  return 'হিসাব পরিষ্কার, মেসে শান্তি!';
}

export const balanceText = (net: number) => net === 0 ? 'মিলে গেছে' : `${net > 0 ? 'পাবে' : 'দেবে'} ${tk(Math.abs(net))}`;

export function messReport(value: unknown): string {
  const result = calculateMess(value);
  const { mess, members, totalHalf, rate } = result;
  const lines = [`${mess.title || 'মেসের মিল'} — মিল রেটের হিসাব`, `মোট বাজার: ${tk(mess.bazar)} · মোট মিল: ${formatMeals(totalHalf)} · মিল রেট: ${formatTaka(rate)}`, '', 'কে কত দেবে, কে কত পাবে'];
  for (const member of members) lines.push(`${member.label}: ${formatMeals(member.halfMeals)} মিল, ভাগ ${tk(member.share)}, দিয়েছে ${tk(member.paid)}; ${balanceText(member.net)}`);
  const cash = cashNote(result);
  lines.push('', roundingNote(result), ...(cash ? [cash] : []), 'যা লেখা হয়েছে, শুধু তার হিসাব। ভাগাভাগি দিয়ে টাকা পাঠানো হয় না।');
  return lines.join('\n');
}

/** t=title, b=bazar taka, one m=<half meals>.<paid taka>[.<name>] per member, in order. */
export function messHash(value: unknown): string {
  const mess = validateMess(value);
  return '#' + [
    ...(mess.title ? [`t=${escapeValue(mess.title)}`] : []),
    `b=${mess.bazar}`,
    ...mess.members.map(member => `m=${member.halfMeals}.${member.paid}${member.name ? `.${escapeValue(member.name)}` : ''}`),
  ].join('&');
}

/** Rebuilds a shared mess for read-only checking; null for anything the editor could not have made. */
export function parseMessHash(hash: string): Mess | null {
  if (hash.length > MAX_SHARE_STATE * 9) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const bazar = /^[1-9]\d{0,6}$/.exec(params.get('b') ?? '');
  if (!bazar) return null;
  const members: Member[] = [];
  for (const raw of params.getAll('m')) {
    const match = /^(0|[1-9]\d{0,2})\.(0|[1-9]\d{0,6})(?:\.(.+))?$/s.exec(raw);
    if (!match) return null;
    members.push({ halfMeals: Number(match[1]), paid: Number(match[2]), name: match[3] ?? '' });
  }
  try { return validateMess({ title: params.get('t') ?? '', bazar: Number(bazar[0]), members }); } catch { return null; }
}
