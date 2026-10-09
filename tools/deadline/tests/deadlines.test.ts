import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDeadline, dateInputs, deadlineState, validateEntries, validateSource, calendarFile, textList, type Deadline } from '../lib/deadlines';
import { saveEntries, loadEntries } from '../lib/storage';

const item: Deadline = { id: 'application-1', title: 'বিশ্ববিদ্যালয়ে আবেদন', source: 'https://example.edu.bd/notice', dueAt: Date.parse('2026-10-31T17:59:00Z'), complete: false, tasks: [{ label: 'কাগজ প্রস্তুত', done: false }] };

test('Bengali and Latin dates both represent Dhaka time, independent of device timezone', () => {
  assert.equal(parseDeadline('৩১/১০/২০২৬', '২৩:৫৯'), item.dueAt);
  assert.equal(parseDeadline('31/10/2026', '23:59'), item.dueAt);
  assert.equal(parseDeadline('০১/০১/২০২৭', '০০:১৫'), Date.parse('2026-12-31T18:15:00Z'));
});
test('impossible dates, missing values and malformed times fail', () => {
  for (const date of ['', '31/04/2026', '29/02/2026', '1/13/2026', '1/1/9999', '2026-10-31']) assert.throws(() => parseDeadline(date, '23:59'));
  for (const time of ['', '24:00', '12:60', '1:2', '12:00 PM']) assert.throws(() => parseDeadline('31/10/2026', time));
  assert.ok(Number.isFinite(parseDeadline('২৯/০২/২০২৮', '১২:০০')));
});
test('restored fields contain Bengali digits and round-trip across UTC date boundaries', () => {
  for (const dueAt of [item.dueAt, Date.parse('2026-12-31T18:15:00Z')]) {
    const fields = dateInputs(dueAt);
    assert.doesNotMatch(fields.date + fields.time, /[0-9]/);
    assert.equal(parseDeadline(fields.date, fields.time), dueAt);
  }
});
test('deadline states use Dhaka calendar days and completion is explicit', () => {
  const midnight = { ...item, dueAt: Date.parse('2026-10-10T00:00:00Z') };
  assert.equal(deadlineState(midnight, Date.parse('2026-10-09T17:59:00Z')), 'upcoming');
  assert.equal(deadlineState(midnight, Date.parse('2026-10-09T18:01:00Z')), 'today');
  assert.equal(deadlineState(midnight, Date.parse('2026-10-10T00:01:00Z')), 'overdue');
  assert.equal(deadlineState({ ...midnight, complete: true }, Date.parse('2026-10-10T00:01:00Z')), 'done');
});
test('source URLs reject script schemes, credentials and malformed links', () => {
  assert.equal(validateSource('https://example.edu.bd/notice'), item.source);
  for (const source of ['', 'javascript:alert(1)', 'data:text/html,abc', 'https://a:b@example.com', '/notice', 'https://example.com\nfoo']) assert.throws(() => validateSource(source));
});
test('stored records reject malformed tasks, duplicate IDs, unsafe dates and control characters', () => {
  assert.deepEqual(validateEntries([item]), [item]);
  for (const entries of [null, {}, [item, item], [{ ...item, dueAt: NaN }], [{ ...item, complete: 'yes' }], [{ ...item, tasks: [{ label: 'a', done: 'yes' }] }], [{ ...item, title: 'hello\nBEGIN:VEVENT' }]]) assert.throws(() => validateEntries(entries));
});
test('calendar export escapes text, folds UTF-8 safely and retains exact UTC time', () => {
  const titled = { ...item, title: 'আবেদন, পরীক্ষা; প্রস্তুতি \\ ' + 'বাংলা'.repeat(10) };
  const calendar = calendarFile(titled, Date.parse('2026-10-09T00:00:00Z'));
  const unfolded = calendar.replace(/\r\n /g, '');
  assert.match(unfolded, /DTSTART:20261031T175900Z/);
  assert.match(unfolded, /SUMMARY:আবেদন\\, পরীক্ষা\\; প্রস্তুতি \\\\/);
  assert.match(unfolded, /UID:application-1@shesh-tarikh.local/);
  assert.ok(!calendar.includes('VALARM'));
  for (const line of calendar.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75);
  assert.ok(!calendar.includes('\uFFFD'));
});
test('plain-text export contains the same deadline and all checklist states', () => {
  const text = textList([item]);
  assert.match(text, /বিশ্ববিদ্যালয়ে আবেদন/);
  assert.match(text, /২৩:৫৯/);
  assert.match(text, /কাগজ প্রস্তুত/);
  assert.match(text, /https:\/\/example.edu.bd\/notice/);
});
test('explicit save will not replace unreadable stored data', () => {
  let record = '{broken';
  const storage = { getItem: () => record, setItem: (_key: string, value: string) => { record = value; } };
  assert.throws(() => saveEntries(storage, [item]));
  assert.equal(record, '{broken');
});
test('saving and reopening preserves task progress without changing the supplied list', () => {
  let record: string | null = null;
  const storage = { getItem: () => record, setItem: (_key: string, value: string) => { record = value; } };
  saveEntries(storage, [item]);
  assert.deepEqual(loadEntries(storage), [item]);
  const failing = { ...storage, setItem: () => { throw new Error('full'); } };
  assert.throws(() => saveEntries(failing, []));
  assert.deepEqual(loadEntries(storage), [item]);
});
