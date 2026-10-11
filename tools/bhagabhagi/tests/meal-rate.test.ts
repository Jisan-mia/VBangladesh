import assert from 'node:assert/strict';
import test from 'node:test';
import { drawMessCard, SLIP_ASK } from '../lib/draw-slip';
import { formatTaka, ledgerHash, parseLedgerHash } from '../lib/ledger';
import { balanceText, calculateMess, cashNote, draftFromMess, exampleMessDraft, MAX_MEMBERS, messFromDraft, messHash, messLine, messReport, parseMeals, parseMessHash, parseTaka, roundingNote, tk, validateMess, type Mess } from '../lib/meal-rate';
import { share } from '../share';

const example = messFromDraft(exampleMessDraft);
const mess = (bazar: number, meals: number[], paid: number[] = []): Mess => ({ title: '', bazar, members: meals.map((halfMeals, index) => ({ name: `নাম ${index}`, halfMeals, paid: paid[index] ?? 0 })) });

test('taka and meals read Bangla or English digits; half meals are kept exactly', () => {
  assert.deepEqual(['১২৫০০', '12500', ' ১২,৫০০ ', '', '০'].map(value => parseTaka(value, 'x')), [12500, 12500, 12500, 0, 0]);
  assert.deepEqual(['২৫', '25.5', '২৫.৫', '12.50', '12.0', '০', '', '২০০'].map(value => parseMeals(value, 'x')), [50, 51, 51, 25, 24, 0, 0, 400]);
});

test('broken money and meal boxes are rejected with the box named', () => {
  for (const value of ['১২.৫০', '-5', '1e3', '১০০০০০১', '৳৫০০', 'abc']) assert.throws(() => parseTaka(value, 'মোট বাজার'), /মোট বাজার/);
  for (const value of ['12.25', '12.05', '201', '-1', '১/২', '.5', 'Infinity']) assert.throws(() => parseMeals(value, 'রাফির মিল'), /রাফির মিল/);
  const draft = structuredClone(exampleMessDraft);
  draft.members[0].meals = '৬২.৩';
  assert.throws(() => messFromDraft(draft), /রাফির মিল/);
  draft.members[0].meals = '৬২';
  draft.members[1] = { ...draft.members[1], name: '', meals: 'x' };
  assert.throws(() => messFromDraft(draft), /সদস্য ২-এর মিল/);
});

test('the starter mess: meal rate, whole-taka shares that add up, and balances', () => {
  const result = calculateMess(example);
  assert.equal(result.totalHalf, 513);
  assert.equal(result.rate, 5166);
  assert.deepEqual(result.members.map(member => member.share), [3203, 2867, 2480, 3099, 1601]);
  assert.equal(result.members.reduce((sum, member) => sum + member.share, 0), 13250);
  assert.deepEqual(result.members.map(member => member.net), [1047, 133, -480, -99, -601]);
  assert.deepEqual(result.members.filter(member => member.roundedUp).map(member => member.label), ['রাফি', 'সাকিব', 'জয়']);
  assert.match(roundingNote(result), /যোগ করলে ঠিক ৳১৩,২৫০।.*৩ টাকা.*রাফি, সাকিব আর জয়ের ভাগে/);
  assert.equal(cashNote(result), '');
  assert.equal(messLine(result), 'হিসাব পরিষ্কার, মেসে শান্তি!');
});

test('shares always add up to the bazar and stay within one taka of the exact share', () => {
  let seed = 7;
  const random = (max: number) => (seed = (seed * 1103515245 + 12345) % 2 ** 31) % (max + 1);
  for (let round = 0; round < 3000; round += 1) {
    const meals = Array.from({ length: 2 + random(MAX_MEMBERS - 2) }, () => random(4) === 0 ? 0 : random(400));
    if (!meals.some(Boolean)) meals[0] = 1;
    const bazar = 1 + random(round % 3 ? 50_000 : 1_000_000 - 1);
    const result = calculateMess(mess(bazar, meals));
    assert.equal(result.members.reduce((sum, member) => sum + member.share, 0), bazar);
    const total = meals.reduce((sum, value) => sum + value, 0);
    result.members.forEach((member, index) => {
      assert.ok(member.share * total <= bazar * meals[index] + total - 1 && member.share * total >= bazar * meals[index] - total + 1, `${bazar} ${meals}`);
      if (!meals[index]) assert.equal(member.share, 0);
    });
  }
});

test('equal leftovers go to the earlier names, and an exact split needs no rounding', () => {
  assert.deepEqual(calculateMess(mess(100, [2, 2, 2])).members.map(member => member.share), [34, 33, 33]);
  assert.deepEqual(calculateMess(mess(101, [2, 2, 2])).members.map(member => member.share), [34, 34, 33]);
  const exact = calculateMess(mess(900, [60, 30, 0]));
  assert.deepEqual([exact.members.map(member => member.share), exact.leftover, exact.rate], [[600, 300, 0], 0, 2000]);
  assert.match(roundingNote(exact), /সবার ভাগ পুরো টাকায় মিলে গেছে/);
  assert.match(roundingNote(calculateMess(mess(1000, [21, 20, 0]))), /১ টাকা হলো, তা গেছে নাম 1-এর ভাগে; পয়সার ঘর তারই/);
});

test('a member with no meals pays nothing and gets back what they put in', () => {
  const result = calculateMess(mess(3000, [60, 0, 30], [0, 500, 2000]));
  assert.deepEqual(result.members.map(member => [member.share, member.net]), [[2000, -2000], [0, 500], [1000, 1000]]);
  assert.match(cashNote(result), /বাকি ৳৫০০ কে দিয়েছে/);
  assert.match(cashNote(calculateMess(mess(3000, [2, 2], [2000, 2000]))), /বাড়তি ৳১,০০০/);
  assert.equal(messLine(calculateMess(mess(3000, [2, 2]))), 'মিল রেট বের হলো। এবার যার যার ভাগটা জমা দাও!');
  assert.equal(messLine(calculateMess(mess(3000, [2, 2], [1500, 1500]))), 'সবার হিসাব মিলে গেছে, কেউ কারও কাছে পায় না!');
});

test('names are optional, NFC, tidy and short; impossible messes are refused', () => {
  const tidy = validateMess({ title: '', bazar: 100, members: [{ name: '  সোহেল   ভাই '.normalize('NFD'), halfMeals: 2, paid: 0 }, { name: '', halfMeals: 2, paid: 0 }] });
  assert.deepEqual(tidy.members.map(member => member.name), ['সোহেল ভাই', '']);
  assert.deepEqual(calculateMess(tidy).members.map(member => member.label), ['সোহেল ভাই', 'সদস্য ২']);
  const ok = mess(100, [2, 2]);
  const invalid: unknown[] = [null, { ...ok, bazar: 0 }, { ...ok, bazar: 1_000_001 }, { ...ok, bazar: 1.5 }, mess(100, [0, 0]), mess(100, [2]), mess(100, Array(MAX_MEMBERS + 1).fill(2)), mess(100, [401, 2]), mess(100, [1.5, 2]), mess(100, [2, 2], [-1]), { ...ok, members: [{ ...ok.members[0], name: 'ক'.repeat(17) }, ok.members[1]] }, { ...ok, members: [{ ...ok.members[0], name: 'রা‮ফি' }, ok.members[1]] }, { ...ok, members: [{ ...ok.members[0], name: 'নাম\nটাকা দাও' }, ok.members[1]] }, { ...ok, title: 'ক'.repeat(41) }];
  for (const value of invalid) assert.throws(() => validateMess(value));
});

test('a shared mess link rebuilds the same hisab, names and all', () => {
  const tricky: Mess = { title: 'মেস & বাসা #২', bazar: 9999, members: [{ name: 'রাফি+১ ভাই', halfMeals: 3, paid: 0 }, { name: '', halfMeals: 0, paid: 9999 }, { name: 'মি.ম', halfMeals: 61, paid: 1 }] };
  for (const value of [example, tricky]) {
    const hash = messHash(value);
    assert.deepEqual(parseMessHash(hash), value);
    assert.equal(messHash(parseMessHash(hash.replace(/[^\x00-\x7f]+/g, encodeURIComponent))!), hash);
    assert.equal(parseLedgerHash(hash), null);
    assert.deepEqual(messFromDraft(draftFromMess(value)), value);
  }
  assert.equal(messHash(example), '#t=এই+মাসের+মিল&b=13250&m=124.4250.রাফি&m=111.3000.সাকিব&m=96.2000.জয়&m=120.3000.তুষার&m=62.1000.নাঈম');
});

test('hostile or impossible mess links are rejected', () => {
  const big = '&m=2.0'.repeat(MAX_MEMBERS + 1);
  for (const hash of ['', '#mil', '#mil-result', '#b=100', '#b=100&m=2.0', '#b=0&m=2.0&m=2.0', '#b=0100&m=2.0&m=2.0', '#b=1000001&m=2.0&m=2.0', '#b=100&m=0.0&m=0.0', '#b=100&m=401.0&m=2.0', '#b=100&m=02.0&m=2.0', '#b=100&m=2.-5&m=2.0', '#b=100&m=2.0.' + 'ক'.repeat(17) + '&m=2.0', '#b=100&m=2.0.রা%E2%80%AEফি&m=2.0', '#b=100&m=2.0.%0A&m=2.0', `#b=100${big}`, `#t=${'ক'.repeat(41)}&b=100&m=2.0&m=2.0`]) {
    assert.equal(parseMessHash(hash), null, hash.slice(0, 60));
  }
});

// Captured from the live tool before the meal-rate mode existed.
const OLD_LINK = '#t=কক্সবাজার+ট্যুর&p=রাফি&p=তানিয়া&p=সাকিব&p=মিম&p=জয়&e=1.600000.ঢাকা-কক্সবাজার+বাস&e=0.900000.হোটেল,+দুই+রাত&e=2.425000.সি-ফুড+ডিনার&e=3.120000.ইজিবাইক+আর+ডাব';

test('links shared before the meal-rate mode still open the same trip hisab', () => {
  const ledger = parseLedgerHash(OLD_LINK)!;
  assert.equal(ledgerHash(ledger), OLD_LINK);
  assert.equal(parseMessHash(OLD_LINK), null);
  assert.equal(share.normalize(OLD_LINK.slice(1)), OLD_LINK.slice(1));
  assert.deepEqual(share.preview(OLD_LINK.slice(1)), { title: 'কক্সবাজার ট্যুর: ৫ জনের হিসাব মিলেছে', description: 'মোট ৳২০,৪৫০, জনপ্রতি ৳৪,০৯০। ৪টা লেনদেনেই সব শোধ। কে কাকে কত দেবে, খুলে মিলিয়ে নাও।' });
});

test('the server normalizes mess links and previews them without names or money', () => {
  const state = messHash(example).slice(1);
  assert.equal(share.normalize(state), state);
  assert.equal(share.normalize(state.replace('b=13250', 'b=0')), null);
  const preview = share.preview(state);
  assert.equal(preview.title, 'এই মাসের মিল: ৫ জনের মিলের হিসাব');
  assert.match(preview.description, /মোট ২৫৬\.৫ মিল/);
  for (const text of [preview.title, preview.description]) {
    assert.ok(!/৳|টাকা/.test(text), text);
    for (const member of example.members) assert.ok(!text.includes(member.name), member.name);
  }
  assert.equal(share.preview(messHash({ ...example, title: '' }).slice(1)).title, '৫ জনের মিলের হিসাব');
});

test('the copied report shows the rate, everyone, and the rounding rule', () => {
  const report = messReport(example);
  assert.ok(report.startsWith('এই মাসের মিল — মিল রেটের হিসাব'));
  assert.ok(report.includes('মিল রেট: ৳৫১.৬৬'));
  assert.ok(report.includes('সাকিব: ৫৫.৫ মিল, ভাগ ৳২,৮৬৭, দিয়েছে ৳৩,০০০; পাবে ৳১৩৩'));
  assert.ok(report.includes('নাঈম: ৩১ মিল, ভাগ ৳১,৬০১, দিয়েছে ৳১,০০০; দেবে ৳৬০১'));
  assert.ok(report.includes('যোগ করলে ঠিক ৳১৩,২৫০') && report.includes('টাকা পাঠানো হয় না'));
});

function fakeCanvas() {
  const texts: Array<{ text: string; y: number }> = [];
  let font = '16px x';
  const context = new Proxy({}, {
    get: (_, key) => key === 'font' ? font
      : key === 'measureText' ? (text: string) => ({ width: text.length * Number(/(\d+(?:\.\d+)?)px/.exec(font)![1]) * 0.5 })
      : key === 'fillText' ? (text: string, _x: number, y: number) => texts.push({ text, y })
      : () => {},
    set: (_, key, value) => { if (key === 'font') font = value; return true; },
  });
  return { canvas: { width: 0, height: 0, getContext: () => context } as unknown as HTMLCanvasElement, texts };
}

test('the mess slip shows rate, every member and balance, clear of the footer and story safe zone, even with 15 members', () => {
  const fifteen: Mess = { title: 'হোস্টেলের মিল', bazar: 87_654, members: Array.from({ length: MAX_MEMBERS }, (_, index) => ({ name: 'ক'.repeat(14) + index, halfMeals: 100 + index, paid: index * 500 })) };
  for (const [value, format, height, footer] of [[example, 'feed', 1350, 96], [fifteen, 'feed', 1350, 96], [fifteen, 'story', 1920, 260]] as const) {
    const result = calculateMess(value);
    const { canvas, texts } = fakeCanvas();
    drawMessCard(canvas, result, format, 'example.com');
    const all = texts.map(item => item.text);
    for (const part of [value.title, tk(value.bazar), formatTaka(result.rate), messLine(result), ...result.members.flatMap(member => [member.label, tk(member.share), balanceText(member.net)])]) assert.ok(all.includes(part), part);
    const body = texts.filter(item => ![SLIP_ASK, 'example.com', 'হিসাব মিলেছে'].includes(item.text));
    assert.ok(body.every(item => item.y < height - footer - 20 && (format === 'feed' || item.y > 250)), format);
  }
});
