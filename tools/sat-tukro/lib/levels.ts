// The 22 pictures as data: which silhouette, how many pieces are already in, how the shadow's lines look, how many pieces start
// turned and whether the parallelogram starts mirrored. Every level changes one thing from the one before it. Four worlds
// (times of day), each ending in a named "শেষ ছবি". Everything is open: a child never meets a lock.
import { FIGURES, type Figure } from './figures';

/** colour: each spot tinted in its piece's colour; plain: white lines; faint: pale lines; none: only the shadow. */
export type Lines = 'colour' | 'plain' | 'faint' | 'none';
export type WorldId = 0 | 1 | 2 | 3;

export type LevelSpec = {
  figure: string; world: WorldId;
  /** Pieces already in the shadow when the round starts (the smallest first). */
  pre: number;
  lines: Lines;
  /** How many of the pieces still to place start turned wrong (7 = all of them). */
  turns: number;
  /** The parallelogram starts mirrored: it needs the উল্টাও button. */
  flip: boolean;
  /** The last picture of its world. */
  finale: boolean;
  /** The one new thing, in a short line a parent can read aloud. */
  teach: string;
  /** Shown with a নতুন tag. */
  fresh: boolean;
};

const level = (figure: string, world: WorldId, pre: number, lines: Lines, turns: number, flip: boolean, teach: string, finale = false): LevelSpec =>
  ({ figure, world, pre, lines, turns, flip, finale, teach, fresh: false });

/** The levels that bring a new idea (a drag, a tap-and-tap, the coloured lines going, turning, mirroring, faint lines, only the shadow). */
const FRESH = new Set([1, 2, 4, 5, 6, 9, 10, 11]);

const ALL: LevelSpec[] = [
  // ভোর: follow the coloured lines
  level('ghor', 0, 5, 'colour', 0, false, 'টুকরো টেনে রঙের দাগে বসাও।'),
  level('mach', 0, 4, 'colour', 0, false, 'টুকরোয় চেপে, তারপর জায়গায় চাপো।'),
  level('biral', 0, 2, 'colour', 0, false, 'এবার পাঁচটা টুকরো বসাতে হবে।'),
  level('rocket', 0, 0, 'colour', 0, false, 'এবার সাতটা টুকরোই।'),
  level('nouka', 0, 0, 'plain', 0, false, 'রঙের ছোপ নেই, শুধু সাদা দাগ।', true),
  // দুপুর: turn the pieces
  level('pyramid', 1, 4, 'plain', 1, false, 'একটা টুকরো ঘোরানো। চাপলে ঘোরে।'),
  level('khorgosh', 1, 4, 'plain', 3, false, 'তিনটা টুকরোই ঘোরানো।'),
  level('launch', 1, 2, 'plain', 7, false, 'পাঁচটা টুকরো, সবই ঘোরানো।'),
  level('timi', 1, 2, 'plain', 7, true, 'সামান্তরিক উল্টো। উল্টাও চাপলে উল্টায়।'),
  level('ketli', 1, 0, 'faint', 7, true, 'দাগ হালকা, সাতটাই ঘোরানো।', true),
  // বিকেল: only the shadow
  level('kochchhop', 2, 5, 'none', 0, false, 'দাগ নেই, শুধু ছায়া।'),
  level('hash', 2, 3, 'none', 0, false, 'চারটে টুকরো বসাও।'),
  level('penguin', 2, 1, 'none', 0, false, 'ছয়টা টুকরো বসাও।'),
  level('nach', 2, 0, 'none', 0, false, 'সাতটা টুকরো, শুধু ছায়া দেখে।'),
  level('paan', 2, 0, 'none', 1, false, 'একটা টুকরো ঘোরানো।'),
  level('ghuri', 2, 0, 'none', 3, false, 'আরও ঘোরানো টুকরো।', true),
  // রাত: everything
  level('hati', 3, 3, 'none', 7, false, 'চারটে টুকরো, সব ঘোরানো।'),
  level('horin', 3, 0, 'none', 7, false, 'সাতটাই ঘোরানো।'),
  level('bok', 3, 0, 'none', 7, true, 'সামান্তরিকও উল্টো।'),
  level('mombati', 3, 0, 'none', 7, true, 'মোমবাতির লম্বা ছায়া।'),
  level('dourano', 3, 0, 'none', 7, true, 'দৌড়ানো মানুষের ছায়া।'),
  level('rickshaw', 3, 0, 'none', 7, true, 'সব মিলিয়ে শেষ ছবি।', true),
];

export const LEVELS: readonly LevelSpec[] = ALL.map((spec, index) => ({ ...spec, fresh: FRESH.has(index + 1) }));
export const LEVEL_COUNT = LEVELS.length;

export const WORLDS: ReadonlyArray<{ id: WorldId; name: string; idea: string; from: number; to: number; tune: readonly number[]; place: string }> = [
  { id: 0, name: 'ভোর', idea: 'রঙের দাগ ধরে', from: 1, to: 5, tune: [523, 659, 784, 1047], place: 'ভোরের ঘাট' },
  { id: 1, name: 'দুপুর', idea: 'টুকরো ঘোরাও', from: 6, to: 10, tune: [587, 740, 880, 1175], place: 'দুপুরের উঠান' },
  { id: 2, name: 'বিকেল', idea: 'শুধু ছায়া', from: 11, to: 16, tune: [440, 554, 659, 880], place: 'বিকেলের মাঠ' },
  { id: 3, name: 'রাত', idea: 'সব মিলিয়ে', from: 17, to: 22, tune: [392, 494, 587, 784], place: 'রাতের বারান্দা' },
];

export const isLevel = (value: number) => Number.isInteger(value) && value >= 1 && value <= LEVEL_COUNT;
export const specOf = (level: number): LevelSpec => LEVELS[Math.min(LEVEL_COUNT, Math.max(1, Math.round(level) || 1)) - 1];
export const figureOf = (level: number): Figure => FIGURES.find(f => f.id === specOf(level).figure)!;
export const worldOf = (level: number) => WORLDS[specOf(level).world];
export const isFinale = (level: number) => specOf(level).finale;
export const levelsOfWorld = (world: WorldId) => LEVELS.flatMap((spec, index) => spec.world === world ? [index + 1] : []);
/** The last picture of a world is the end of the world. */
export const isWorldEnd = isFinale;

/** The first level without stars, else the first with fewer than three, else level 1. */
export function nextToPlay(stars: Record<number, number>) {
  for (let id = 1; id <= LEVEL_COUNT; id++) if (!stars[id]) return id;
  for (let id = 1; id <= LEVEL_COUNT; id++) if ((stars[id] ?? 0) < 3) return id;
  return 1;
}
/** The picture after this one, or 0 after the last. */
export const nextInOrder = (level: number) => level < LEVEL_COUNT ? level + 1 : 0;

/** What the child can do now, said when a picture is done. */
export const NEWS: Record<WorldId, string> = {
  0: 'এখন তুমি রঙ আর আকার দেখে টুকরো বসাতে পারো।',
  1: 'এখন তুমি টুকরো ঘুরিয়ে, উল্টে জায়গা মেলাতে পারো।',
  2: 'এখন তুমি দাগ ছাড়া শুধু ছায়া দেখে বসাতে পারো।',
  3: 'এখন তুমি ঘুরিয়ে, উল্টে, শুধু ছায়া দেখে ছবি বানাতে পারো।',
};
