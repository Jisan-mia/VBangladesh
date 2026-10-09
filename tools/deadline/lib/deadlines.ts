export type ChecklistTask = { label: string; done: boolean };
export type Deadline = { id: string; title: string; source: string; dueAt: number; complete: boolean; tasks: ChecklistTask[] };
export type DeadlineState = 'upcoming' | 'today' | 'overdue' | 'done';
export const MAX_ENTRIES = 50;
export const MAX_TASKS = 12;
const DHAKA_OFFSET = 6 * 60 * 60 * 1000;
const MIN_DEADLINE = Date.UTC(2020, 0, 1) - DHAKA_OFFSET;
const MAX_DEADLINE = Date.UTC(2101, 0, 1) - DHAKA_OFFSET;

function latinDigits(value: string): string {
  return value.trim().replace(/[০-৯]/g, digit => String('০১২৩৪৫৬৭৮৯'.indexOf(digit)));
}
function banglaDigits(value: string): string {
  return value.replace(/\d/g, digit => '০১২৩৪৫৬৭৮৯'[Number(digit)]);
}

export function parseDeadline(date: string, time: string): number {
  const dateMatch = latinDigits(date).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const timeMatch = latinDigits(time).match(/^(\d{1,2}):(\d{2})$/);
  if (!dateMatch) throw new Error('দিন/মাস/বছর লিখুন, যেমন ৩১/১০/২০২৬।');
  if (!timeMatch) throw new Error('২৪ ঘণ্টার হিসাবে সময় লিখুন, যেমন ১৭:০০ বা ২৩:৫৯।');
  const [, day, month, year] = dateMatch.map(Number);
  const [, hour, minute] = timeMatch.map(Number);
  const localDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (year < 2020 || year > 2100 || localDate.getUTCFullYear() !== year || localDate.getUTCMonth() !== month - 1 || localDate.getUTCDate() !== day || hour > 23 || minute > 59) {
    throw new Error('তারিখ বা সময়টি ঠিক নেই। আবার মিলিয়ে লিখুন। বছর ২০২০ থেকে ২১০০-এর মধ্যে হতে হবে।');
  }
  return localDate.getTime() - DHAKA_OFFSET;
}

export function dateInputs(timestamp: number): { date: string; time: string } {
  const local = new Date(timestamp + DHAKA_OFFSET).toISOString();
  const [year, month, day] = local.slice(0, 10).split('-');
  return { date: banglaDigits(`${day}/${month}/${year}`), time: banglaDigits(local.slice(11, 16)) };
}

export function formatDeadline(timestamp: number): string {
  return new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(timestamp);
}

export function deadlineState(entry: Deadline, now: number): DeadlineState {
  if (entry.complete) return 'done';
  if (entry.dueAt <= now) return 'overdue';
  return dateInputs(entry.dueAt).date === dateInputs(now).date ? 'today' : 'upcoming';
}

export function validateSource(value: string): string {
  const source = value.trim();
  if (!source || source.length > 2048 || /[\u0000-\u0020\u007f]/.test(source)) throw new Error('বিজ্ঞপ্তির পুরো লিংক দিন। শুরুতে https:// বা http:// থাকতে হবে।');
  try {
    const url = new URL(source);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error();
    return url.href;
  } catch { throw new Error('লিংকটি ঠিক নেই। বিজ্ঞপ্তির https:// বা http:// লিংক দিন।'); }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function validLabel(value: unknown, limit: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= limit && !/[\u0000-\u001f\u007f]/.test(value);
}

export function validateEntries(value: unknown): Deadline[] {
  if (!Array.isArray(value) || value.length > MAX_ENTRIES) throw new Error('তালিকায় সর্বোচ্চ ৫০টি আবেদন রাখা যাবে।');
  const ids = new Set<string>();
  return value.map((entry: unknown): Deadline => {
    if (!isRecord(entry) || typeof entry.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(entry.id) || ids.has(entry.id) || !validLabel(entry.title, 100) || typeof entry.source !== 'string' ||
      typeof entry.dueAt !== 'number' || !Number.isSafeInteger(entry.dueAt) || entry.dueAt < MIN_DEADLINE || entry.dueAt >= MAX_DEADLINE || entry.dueAt % 60000 !== 0 || typeof entry.complete !== 'boolean' || !Array.isArray(entry.tasks) || entry.tasks.length > MAX_TASKS) {
      throw new Error('আবেদনের কিছু তথ্য ঠিক নেই। নাম, তারিখ ও কাজগুলো মিলিয়ে নিন।');
    }
    ids.add(entry.id);
    const labels = new Set<string>();
    const tasks = entry.tasks.map((task: unknown): ChecklistTask => {
      if (!isRecord(task) || !validLabel(task.label, 120) || typeof task.done !== 'boolean' || labels.has(task.label.trim())) throw new Error('প্রতি লাইনে আলাদা একটি কাজ লিখুন। একই কাজ দুবার দেবেন না।');
      labels.add(task.label.trim());
      return { label: task.label.trim(), done: task.done };
    });
    return { id: entry.id, title: entry.title.trim(), source: validateSource(entry.source), dueAt: entry.dueAt, complete: entry.complete, tasks };
  });
}

function calendarText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}
function calendarLine(line: string): string {
  const encoder = new TextEncoder();
  let result = '';
  let bytes = 0;
  for (const character of line) {
    const length = encoder.encode(character).length;
    if (bytes + length > 75) { result += '\r\n '; bytes = 1; }
    result += character;
    bytes += length;
  }
  return result;
}
function calendarDate(timestamp: number): string {
  return new Date(timestamp).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function calendarFile(entry: Deadline, now: number): string {
  const description = `শেষ সময়টি আপনার দেওয়া। মূল বিজ্ঞপ্তির সঙ্গে মিলিয়ে নিন।\nসূত্র: ${entry.source}\nমনে করিয়ে দেওয়ার সময় ক্যালেন্ডারে ঠিক করুন।`;
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//VBangladesh//Shesh Tarikh//BN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${entry.id}@shesh-tarikh.local`, `DTSTAMP:${calendarDate(now)}`, `DTSTART:${calendarDate(entry.dueAt)}`, 'DURATION:PT1M',
    `SUMMARY:${calendarText(entry.title)}`, `DESCRIPTION:${calendarText(description)}`, `URL:${entry.source}`, 'CLASS:PRIVATE', 'TRANSP:TRANSPARENT', 'END:VEVENT', 'END:VCALENDAR'].map(calendarLine).join('\r\n') + '\r\n';
}

export function textList(entries: Deadline[]): string {
  const lines = ['শেষ তারিখ — আমার আবেদনের তালিকা', 'সব সময় ঢাকার হিসাবে দেওয়া। নিজের লেখা তারিখ মূল বিজ্ঞপ্তির সঙ্গে মিলিয়ে নিন।', ''];
  for (const entry of entries) {
    lines.push(entry.title, `শেষ সময়: ${formatDeadline(entry.dueAt)}`, `অবস্থা: ${entry.complete ? 'শেষ করেছি' : 'শেষ করিনি'}`, `সূত্র: ${entry.source}`);
    for (const task of entry.tasks) lines.push(`${task.done ? '[হয়েছে]' : '[বাকি]'} ${task.label}`);
    lines.push('');
  }
  return lines.join('\n');
}
