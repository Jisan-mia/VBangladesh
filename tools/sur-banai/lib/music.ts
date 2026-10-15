// The tune grid, the copy-a-tune levels, saved tunes and every line the child or the card sees. Pure: no React, no browser.
import { starsFor } from "../../../shared/game-core";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (n: number) => digits.format(n);

/** Five notes of the pentatonic scale (C D E G A, the সরগম's সা রে গা পা ধা), so any pattern sounds pleasant. Row 0 is the lowest. */
export const NOTES = ["সা", "রে", "গা", "পা", "ধা"] as const;
export const FREQ = [523.25, 587.33, 659.25, 783.99, 880];
export const ROWS = NOTES.length;
export const ROW_COLORS = ["#e4572e", "#e9a10c", "#2a9d5c", "#2f7fd6", "#8e5bd0"];

export const SOUNDS = [
  { name: "বাঁশি", at: "বাঁশিতে" },
  { name: "ঢোল", at: "ঢোলে" },
  { name: "টুং", at: "ঘণ্টিতে" },
] as const;

/** Beat length in ms. The fastest stays above 1/3 s, so a cell never flashes more than 3 times a second. */
export const TEMPOS = [
  { name: "ধীরে", ms: 600 },
  { name: "মাঝারি", ms: 450 },
  { name: "জোরে", ms: 340 },
] as const;

/** Phones get 6 beats a row (cells stay at least 56px at 412px wide); wide screens get 8. */
export const STEPS_NARROW = 6, STEPS_WIDE = 8;
export const MAX_SAVED = 6;

/** A tune is one bitmask per beat: bit r is on when row r (NOTES[r]) plays on that beat. */
export type Tune = number[];
export type Saved = { tune: Tune; sound: number };

export const emptyTune = (steps: number): Tune => Array(steps).fill(0);
export const has = (tune: Tune, step: number, row: number) => ((tune[step] >> row) & 1) === 1;
export const toggle = (tune: Tune, step: number, row: number): Tune => tune.map((mask, i) => (i === step ? mask ^ (1 << row) : mask));
export const rowsAt = (mask: number) => Array.from({ length: ROWS }, (_, row) => row).filter(row => (mask >> row) & 1);
export const noteCount = (tune: Tune) => tune.reduce((sum, mask) => sum + rowsAt(mask).length, 0);
export const sameTune = (a: Tune, b: Tune) => a.length === b.length && a.every((mask, i) => mask === b[i]);

/** "0 2 . 13" → beat 1 plays সা, beat 2 গা, beat 3 rests, beat 4 রে and পা together. */
export const parseTune = (text: string): Tune => text.split(" ").map(token => (token === "." ? 0 : [...token].reduce((mask, digit) => mask | (1 << Number(digit)), 0)));

/** সুরটা মেলাও: listen and watch, then copy. Always 6 beats, so every phone shows the same tune. Notes grow from 4 to 8. */
export const LEVEL_TUNES = [
  "0 1 2 3 . .", // stairs up
  "4 3 2 1 . .", // stairs down
  "0 2 4 2 0 .", // a hill
  "2 2 4 4 2 .", // two by two
  "0 1 2 0 1 2", // the same three twice
  "4 2 3 1 2 0", // zigzag down
  "02 . 13 . 24 0", // pairs climb
  "4 3 24 1 02 .", // pairs fall
  "04 1 3 2 2 04", // a frame
  "0 13 2 4 13 0", // a wave
];
export const LEVELS = LEVEL_TUNES.map(parseTune);
export const LEVEL_COUNT = LEVELS.length;
export const levelTune = (n: number) => LEVELS[Math.max(1, Math.min(LEVEL_COUNT, n)) - 1];

/** How a copy compares with the tune: notes in both, notes that shouldn't be there, notes still missing. */
export function compare(target: Tune, guess: Tune) {
  let right = 0, extra = 0, missing = 0;
  target.forEach((mask, i) => {
    const mine = guess[i] ?? 0;
    right += rowsAt(mask & mine).length;
    extra += rowsAt(mine & ~mask).length;
    missing += rowsAt(mask & ~mine).length;
  });
  return { right, extra, missing, done: extra === 0 && missing === 0 };
}

/** Stars only record how many checks it took; listening again is always free. */
export const starsOf = (tries: number) => starsFor(tries, 1, 2, true);
/** After two checks that don't match, the missing notes glow as a hint. */
export const showHint = (tries: number) => tries >= 2;

/** The line after a check that didn't match: what is right, what to change. Never a penalty. */
export function checkLine(target: Tune, guess: Tune) {
  const { right, extra, missing } = compare(target, guess);
  const total = noteCount(target);
  if (!noteCount(guess)) return "আগে ঘরে চাপো, তারপর মিলিয়ে দেখো।";
  const parts = [`${bn(total)}টা নোটের ${bn(right)}টা মিলেছে।`];
  if (extra) parts.push(`${bn(extra)}টা ঘর বাড়তি, ${extra === 1 ? "ওটা" : "ওগুলো"} দুলছে।`);
  else if (missing) parts.push(`আরও ${bn(missing)}টা বাকি। আবার শোনো।`);
  return parts.join(" ");
}

export function methodLine(tries: number, notes: number) {
  if (tries === 1 && notes >= 6) return `একবার শুনেই ${bn(notes)}টা নোট মনে রেখেছ।`;
  if (tries > 1) return `${bn(tries)} বারে মিলেছে। প্রতিবার একটু একটু করে ঠিক করেছ।`;
  return `${bn(notes)}টা নোট, ঠিক ঠিক জায়গায়।`;
}

/** Reads saved tunes from storage: newest first, at most 6, anything broken dropped. */
export function readSaved(raw: string | null): Saved[] {
  try {
    const list = JSON.parse(raw ?? "[]");
    if (!Array.isArray(list)) return [];
    return list.filter((item): item is Saved =>
      !!item && Array.isArray(item.tune) && (item.tune.length === STEPS_NARROW || item.tune.length === STEPS_WIDE)
      && item.tune.every((mask: unknown) => Number.isInteger(mask) && (mask as number) >= 0 && (mask as number) < 1 << ROWS)
      && Number.isInteger(item.sound) && item.sound >= 0 && item.sound < SOUNDS.length,
    ).map(item => ({ tune: [...item.tune], sound: item.sound })).slice(0, MAX_SAVED);
  } catch { return []; }
}

/** Puts a tune first; the same tune again just moves up, and the oldest drops off past six. */
export const addSaved = (list: Saved[], item: Saved): Saved[] => [item, ...list.filter(old => !sameTune(old.tune, item.tune))].slice(0, MAX_SAVED);

/** What the card says. No name, ever. */
export type Today = { made: number; matched: number; last: Saved | null };

export function cardTitle(today: Today) {
  if (today.made && today.matched) return `আজ ${bn(today.made)}টা সুর বানালাম, ${bn(today.matched)}টা মেলালাম`;
  if (today.matched) return `আজ ${bn(today.matched)}টা সুর শুনে মিলিয়ে বাজালাম`;
  return `আজ ${bn(today.made)}টা সুর বানালাম`;
}

export const cardSub = (last: Saved) => `শেষ সুরটা: ${bn(noteCount(last.tune))}টা নোট, ${SOUNDS[last.sound].at}`;
export const CARD_FOOTER = "একসাথে শোনো, তালে তালে তালি দাও";

/** The #og demo: a tune made on a phone, shown on the card. Nothing is saved. */
export const DEMO: Saved = { tune: parseTune("0 2 4 3 2 13"), sound: 0 };
