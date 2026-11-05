import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { site } from "../content";
import { share } from "../share";
import { ACTIVITIES, activityOf, PRINT_DAY, SLOTS } from "../lib/day";
import {
  digital, dragHour, dragMinute, hands, hourHint, kindOf, minuteHint, mod, onFace, partOf, readHint, same, sayLeft, sayTime, setHint, snapMinute, tapHour, tapMinute,
} from "../lib/time";

const nfc = (text: string) => assert.equal(text, text.normalize("NFC"), text);
const t = (h: number, m: number) => ({ h, m });

test("times are said the Bangladeshi way", () => {
  assert.equal(sayTime(t(7, 0)), "৭টা");
  assert.equal(sayTime(t(19, 0)), "৭টা");
  assert.equal(sayTime(t(0, 0)), "১২টা");
  assert.equal(sayTime(t(12, 0)), "১২টা");
  assert.equal(sayTime(t(15, 30)), "সাড়ে ৩টা");
  assert.equal(sayTime(t(12, 30)), "সাড়ে ১২টা");
  assert.equal(sayTime(t(13, 30)), "দেড়টা");
  assert.equal(sayTime(t(1, 30)), "দেড়টা");
  assert.equal(sayTime(t(14, 30)), "আড়াইটা");
  assert.equal(sayTime(t(16, 15)), "সোয়া ৪টা");
  assert.equal(sayTime(t(0, 15)), "সোয়া ১২টা");
  assert.equal(sayTime(t(4, 45)), "পৌনে ৫টা", "পৌনে: 15 minutes before the next hour");
  assert.equal(sayTime(t(11, 45)), "পৌনে ১২টা");
  assert.equal(sayTime(t(12, 45)), "পৌনে ১টা", "12:45 is পৌনে ১টা, not পৌনে ১৩টা");
  assert.equal(sayTime(t(23, 45)), "পৌনে ১২টা");
  assert.equal(sayTime(t(16, 10)), "৪টা বেজে ১০ মিনিট");
  assert.equal(sayTime(t(16, 5)), "৪টা বেজে ৫ মিনিট");
  assert.equal(sayTime(t(16, 50)), "৪টা বেজে ৫০ মিনিট");
  assert.equal(sayTime(t(12, 20)), "১২টা বেজে ২০ মিনিট");
});

test("with the part of the day, and as ‘…টায়’", () => {
  assert.equal(sayTime(t(7, 0), { part: true }), "সকাল ৭টা");
  assert.equal(sayTime(t(19, 0), { part: true }), "সন্ধ্যা ৭টা");
  assert.equal(sayTime(t(13, 30), { part: true }), "দুপুর দেড়টা");
  assert.equal(sayTime(t(16, 30), { part: true }), "বিকেল সাড়ে ৪টা");
  assert.equal(sayTime(t(17, 45), { part: true }), "বিকেল পৌনে ৬টা");
  assert.equal(sayTime(t(21, 0), { part: true }), "রাত ৯টা");
  assert.equal(sayTime(t(5, 0), { part: true }), "ভোর ৫টা");
  assert.equal(sayTime(t(8, 0), { at: true }), "৮টায়");
  assert.equal(sayTime(t(8, 30), { at: true, part: true }), "সকাল সাড়ে ৮টায়");
  assert.equal(sayTime(t(14, 30), { at: true }), "আড়াইটায়");
  assert.equal(sayTime(t(4, 45), { at: true }), "পৌনে ৫টায়");
  assert.equal(sayTime(t(16, 10), { at: true }), "৪টা বেজে ১০ মিনিটে");
  assert.deepEqual([0, 4, 5, 6, 11, 12, 15, 16, 17, 18, 19, 20, 23].map(partOf), ["রাত", "ভোর", "ভোর", "সকাল", "সকাল", "দুপুর", "দুপুর", "বিকেল", "বিকেল", "সন্ধ্যা", "সন্ধ্যা", "রাত", "রাত"]);
  assert.equal(sayLeft(t(16, 50)), "৫টা বাজতে ১০ মিনিট বাকি");
  assert.equal(sayLeft(t(11, 55)), "১২টা বাজতে ৫ মিনিট বাকি");
  assert.equal(sayLeft(t(16, 45)), null);
  assert.equal(sayLeft(t(16, 20)), null);
  assert.equal(digital(t(16, 5)), "৪:০৫");
  assert.equal(digital(t(0, 30)), "১২:৩০");
  assert.deepEqual([0, 15, 30, 45, 10].map(kindOf), ["hour", "quarter", "half", "to", "five"]);
  for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 5) { nfc(sayTime(t(h, m), { part: true })); nfc(sayTime(t(h, m), { at: true })); }
});

test("the hour hand moves with the minute hand, as on a real clock", () => {
  assert.deepEqual(hands(0), { hour: 0, minute: 0 });
  assert.deepEqual(hands(3 * 60 + 30), { hour: 105, minute: 1260 });
  assert.equal(mod(hands(4 * 60 + 45).hour, 360), 142.5, "পৌনে ৫টায় ছোট কাঁটা ৫-এর একটু আগে");
  assert.deepEqual(onFace(-15), t(11, 45));
  assert.ok(same(19 * 60, t(7, 0)), "12-hour face");
  assert.ok(same(-60, t(23, 0)));
  assert.ok(!same(7 * 60 + 5, t(7, 0)));
});

test("dragging: the big hand clicks in steps and carries the small one past 12", () => {
  assert.equal(snapMinute(88, 15), 15);
  assert.equal(snapMinute(95, 5), 15);
  assert.equal(snapMinute(358, 5), 0);
  assert.equal(snapMinute(200, 15), 30);
  assert.equal(dragMinute(3 * 60, 90, 15), 3 * 60 + 15);
  assert.equal(dragMinute(3 * 60 + 15, 180, 15), 3 * 60 + 30);
  // Turning forward past 12 moves into the next hour; turning back moves into the last one.
  assert.equal(dragMinute(3 * 60 + 55, 0, 5), 4 * 60);
  assert.equal(dragMinute(3 * 60 + 55, 10, 5), 4 * 60 + 0);
  assert.equal(dragMinute(4 * 60, 330, 5), 3 * 60 + 55);
  let total = 0;
  for (let angle = 0; angle <= 720; angle += 10) total = dragMinute(total, angle, 5);
  assert.equal(total, 120, "two full turns of the big hand = two hours");
  for (let angle = 720; angle >= 0; angle -= 10) total = dragMinute(total, angle, 5);
  assert.equal(total, 0);
  // The small hand goes where the finger points, allowing for the minutes.
  assert.equal(dragHour(0, 90), 180);
  assert.equal(dragHour(30, 105), 3 * 60 + 30, "at :30 the hand sits between 3 and 4");
  assert.equal(dragHour(45, 142), 4 * 60 + 45);
  assert.equal(dragHour(11 * 60, 0), 12 * 60, "turning 11 → 12 goes forward, never round the long way");
});

test("tapping a number: the small hand takes that hour, the big hand those minutes", () => {
  assert.equal(tapHour(0, 120), 4 * 60);
  assert.equal(tapHour(45, 90), 3 * 60 + 45, "minutes stay");
  assert.equal(tapHour(11 * 60, 3), 12 * 60);
  assert.equal(tapMinute(3 * 60, 180, 15), 3 * 60 + 30);
  assert.equal(tapMinute(3 * 60 + 45, 0, 15), 3 * 60, "a tap keeps the hour: no surprise jump");
  assert.equal(tapMinute(3 * 60, 62, 5), 3 * 60 + 10);
});

test("hints say why in one line and point at the hand to fix", () => {
  assert.equal(minuteHint(t(3, 30)), "সাড়ে মানে আধা ঘণ্টা: বড় কাঁটা ৬ নম্বরে।");
  assert.equal(minuteHint(t(4, 45)), "পৌনে মানে আর ১৫ মিনিট বাকি: বড় কাঁটা ৯ নম্বরে।");
  assert.equal(minuteHint(t(4, 10)), "১০ মিনিটে বড় কাঁটা ২ নম্বরে। প্রতি নম্বরে ৫ মিনিট।");
  assert.equal(hourHint(t(4, 45)), "পৌনে ৫টায় ছোট কাঁটা ৫-এর একটু আগে।");
  assert.equal(hourHint(t(15, 30)), "সাড়ে ৩টায় ছোট কাঁটা ৩ আর ৪-এর মাঝখানে।");
  assert.equal(hourHint(t(13, 30)), "দেড়টায় ছোট কাঁটা ১ আর ২-এর মাঝখানে।");
  assert.equal(hourHint(t(7, 0)), "৭টায় ছোট কাঁটা ঠিক ৭ নম্বরে।");
  assert.equal(hourHint(t(16, 15)), "সোয়া ৪টায় ছোট কাঁটা ৪ পেরিয়ে একটু এগিয়েছে।");
  assert.equal(hourHint(t(16, 50)), "৪টা বেজে ৫০ মিনিটে ছোট কাঁটা ৫-এর একটু আগে।");
  assert.equal(setHint(5 * 60 + 45, t(4, 45)), hourHint(t(4, 45)), "big hand right, small hand one off");
  assert.equal(setHint(4 * 60, t(4, 45)), minuteHint(t(4, 45)), "big hand first");
  assert.equal(readHint(t(5, 45), t(4, 45)), hourHint(t(4, 45)));
  assert.equal(readHint(t(4, 15), t(4, 45)), "বড় কাঁটা ৯ নম্বরে, মানে আর ১৫ মিনিট বাকি: পৌনে।");
  assert.equal(readHint(t(4, 15), t(4, 20)), "বড় কাঁটা ৪ নম্বরে। ৫ করে গোনো: ৫, ১০, ১৫, ২০।");
  assert.equal(readHint(t(7, 0), t(19, 0)), "সূর্য ডুবছে, তাই সন্ধ্যা।");
  for (const text of [minuteHint(t(1, 0)), readHint(t(2, 0), t(1, 0)), readHint(t(9, 0), t(21, 0))]) { nfc(text); assert.doesNotMatch(text, /ভুল/); }
});

test("the day: every slot in order, with a picture and a name for every activity", () => {
  const ids = ACTIVITIES.map(activity => activity.id);
  assert.equal(new Set(ids).size, ids.length, "no duplicates");
  assert.equal(new Set(ACTIVITIES.map(activity => activity.name)).size, ids.length);
  for (const activity of ACTIVITIES) nfc(activity.name);
  const art = readFileSync(join(import.meta.dirname, "../components/art.tsx"), "utf8");
  for (const id of ids) assert.match(art, new RegExp(`case "${id}"`), `art for ${id}`);
  const hours = SLOTS.flatMap(slot => slot.hours);
  assert.deepEqual(hours, [...hours].sort((a, b) => a - b), "slots run through the day");
  assert.equal(new Set(hours).size, hours.length, "no two slots share an hour");
  assert.equal(SLOTS[0].options[0].id, "wake");
  assert.equal(SLOTS.at(-1)!.options[0].id, "sleep");
  assert.equal(partOf(SLOTS[6].hours[0]), "বিকেল", "play is in the afternoon");
  assert.equal(partOf(SLOTS[7].hours[0]), "সন্ধ্যা", "study is in the evening");
});

test("the print sheet: six blank clocks through one day, each kind of time once", () => {
  assert.equal(PRINT_DAY.length, 6);
  assert.deepEqual([...new Set(PRINT_DAY.map(entry => entry.time.m % 15 === 0 ? entry.time.m : "five"))].length, 5);
  for (let i = 1; i < PRINT_DAY.length; i++) assert.ok(PRINT_DAY[i].time.h > PRINT_DAY[i - 1].time.h);
  for (const entry of PRINT_DAY) assert.ok(activityOf(entry.activity));
  assert.deepEqual(PRINT_DAY.map(entry => sayTime(entry.time, { part: true })), ["সকাল ৭টা", "সকাল সাড়ে ৮টা", "সকাল সোয়া ১১টা", "দুপুর দেড়টা", "বিকেল পৌনে ৫টা", "সন্ধ্যা ৭টা বেজে ২০ মিনিট"]);
});

test("no sharing of anything about the child", () => {
  assert.equal(share.normalize(""), null);
  assert.equal(share.normalize("level=1&stars=3"), null);
  assert.equal(share.tally, undefined);
});

test("the tool's source never calls fetch or imports share-client", () => {
  const root = join(import.meta.dirname, "..");
  const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? (name === "tests" ? [] : files(path)) : [path];
  });
  const sources = [...files(root), join(root, "../../app/ghori-dekhi/page.tsx")].filter(path => /\.(tsx?|css)$/.test(path));
  assert.ok(sources.length >= 10);
  for (const path of sources) {
    const code = readFileSync(path, "utf8");
    assert.doesNotMatch(code, /\bfetch\s*\(/, path);
    assert.doesNotMatch(code, /share-client|ShareBar|\/api\//, path);
    assert.doesNotMatch(code, /<input|getUserMedia|geolocation/, path);
  }
});

test("content meets the SEO limits and answers the homework question first", () => {
  assert.ok([...site.title].length <= 45, String(site.title.length));
  assert.ok(site.title.startsWith("ঘড়ি দেখা শেখার খেলা"));
  assert.ok(site.description.length >= 120 && site.description.length <= 160, String(site.description.length));
  assert.ok(site.headline && site.headline !== site.title && site.headline !== site.name);
  assert.ok(site.faq.length >= 6);
  assert.equal(site.faq[0].question, "ঘড়ি দেখার নিয়ম কী?");
  assert.ok(site.faq[0].answer.startsWith("ছোট কাঁটা বলে কয়টা বাজে, বড় কাঁটা বলে কত মিনিট।"));
  for (const question of ["কোন বয়সের জন্য?", "ইন্টারনেট লাগে?", "কোনো তথ্য নেওয়া হয়?", "কতক্ষণ খেলবে?"]) assert.ok(site.faq.some(item => item.question === question), question);
  assert.ok(site.faq.some(item => /পৌনে/.test(item.question) && /৪:৪৫/.test(item.answer)));
  assert.equal(site.privacy.length, 1);
  for (const text of [site.title, site.description, site.headline!, site.lead, site.guideIntro, ...site.steps, ...site.privacy, ...site.faq.flatMap(item => [item.question, item.answer])]) {
    nfc(text);
    assert.doesNotMatch(text, /আপনি|করুন|দেখুন/, text);
  }
});
