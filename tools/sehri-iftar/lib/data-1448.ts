import type { Timetable } from "./timetable";

/*
 * Ramadan 1448 AH (about Feb–Mar 2027): the Islamic Foundation Bangladesh's official সেহরি ও ইফতারের সময়সূচি.
 *
 * Checked 10 Oct 2026: NOT PUBLISHED YET. IF usually releases it in the weeks before Ramadan.
 * Look at https://www.islamicfoundation.gov.bd/ and its Facebook page.
 *
 * Until it is out this stays null, and the page shows no time at all — only the "আসছে" state.
 * Never compute times astronomically, never copy them from a news site or app, never reuse an old year's table.
 *
 * How to fill it in when IF publishes:
 * 1. Two people each type the whole table from IF's own PDF/image into their own copy of this file, without looking at the other's.
 * 2. Diff the two files. Every difference is checked against the PDF until the files are identical.
 * 3. `days`: IF's Dhaka table, one row per রমজান, times in 24-hour "HH:MM" (সেহরির শেষ সময় 04:56, ইফতার 18:02).
 * 4. `offsets`: IF's district time-difference list, minutes added to Dhaka (minus = earlier). All 64 districts, Dhaka is 0.
 *    If IF gives different differences for parts of the month, add one entry per part with the রমজান day it starts on.
 * 5. `source.url`: the exact IF page or PDF. `checked`: the day the diff came out clean. `checkedBy`: the two people.
 * 6. Run `node --import tsx --no-warnings --test tools/sehri-iftar/tests/*.test.ts`; validate() must report no problems.
 *
 * Example of the shape (fixture values, not real times):
 * export const TIMETABLE_1448: Timetable | null = {
 *   hijriYear: 1448,
 *   source: { label: "ইসলামিক ফাউন্ডেশন, সাহরি ও ইফতারের সময়সূচি ১৪৪৮ হিজরি", url: "https://www.islamicfoundation.gov.bd/…" },
 *   checked: "2027-01-25", checkedBy: ["…", "…"],
 *   days: [{ day: 1, date: "2027-02-09", sehri: "05:10", iftar: "17:55" }, …],
 *   offsets: { dhaka: [{ from: 1, sehri: 0, iftar: 0 }], sylhet: [{ from: 1, sehri: -6, iftar: -7 }], … },
 * };
 */
export const TIMETABLE_1448: Timetable | null = null;
