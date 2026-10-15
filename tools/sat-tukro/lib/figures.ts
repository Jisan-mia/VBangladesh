// The 22 silhouettes. Each is written as one known solution: every piece's kind, turn (× 45° clockwise), first corner and,
// for the parallelogram, its mirror. The silhouette is derived from these pieces, so every picture is solvable by
// construction (tests check the pieces are exactly one set, never overlap, and fill the outline).
// `upright`: drawn on the square grid (the square piece sits level). These are stored turned 45° onto the diamond lattice
// and shown turned back, so on screen the house stands straight.
import { placed, type Kind, type Pose } from './tangram';

type Spec = [Kind, number, number, number, 1?];
export type Figure = { id: string; name: string; upright: boolean; pieces: Pose[]; bd: boolean };

const fig = (id: string, name: string, upright: boolean, bd: boolean, specs: Spec[]): Figure =>
  ({ id, name, upright, bd, pieces: specs.map(([kind, rot, x, y, flip]) => placed(kind, rot, x, y, flip === 1)) });

/** In play order: four steps of difficulty (see `bandOf`). */
export const FIGURES: readonly Figure[] = [
  fig('ghor', 'ঘর', true, true, [['L', 5, 0, 4], ['L', 7, 0, 4], ['M', 4, -1, 5], ['S', 3, 0, 4], ['Q', 1, 0, 4], ['P', 0, -3, 5], ['S', 5, -1, 7]]),
  fig('nouka', 'নৌকা', true, true, [['S', 1, -3, -3], ['P', 0, -4, -2], ['L', 7, 0, 0], ['L', 5, -1, 1], ['Q', 1, 0, 0], ['S', 7, 0, 2], ['M', 6, 1, 3]]),
  fig('mach', 'মাছ', false, true, [['M', 6, 2, 0], ['L', 7, 6, 1], ['S', 1, 1, 0], ['L', 5, 3, 2], ['Q', 1, 5, 0], ['P', 0, 0, 1], ['S', 1, 4, 1]]),
  fig('biral', 'বিড়াল', false, false, [['S', 3, 2, 1], ['S', 7, 2, 1], ['Q', 1, 2, 1], ['L', 1, 2, 3], ['L', 5, 2, 7], ['M', 6, 0, 7], ['P', 0, 5, 6, 1]]),
  fig('rocket', 'রকেট', true, false, [['L', 1, -1, 1], ['M', 2, 1, 1], ['L', 5, -3, 5], ['Q', 1, -1, 3], ['S', 5, 0, 4], ['S', 7, -3, 5], ['P', 2, -1, 7, 1]]),
  fig('pyramid', 'পিরামিড', false, false, [['L', 7, 2, 2], ['S', 3, 5, 1], ['Q', 1, 5, 1], ['L', 1, 2, 2], ['M', 6, 4, 4], ['S', 1, 6, 2], ['P', 0, 5, 3]]),

  fig('rickshaw', 'রিকশা', false, true, [['L', 1, 1, 0], ['M', 4, 6, 2], ['P', 0, 0, 2], ['L', 5, 4, 4], ['S', 1, 1, 3], ['S', 5, 1, 5], ['Q', 1, 4, 4]]),
  fig('launch', 'লঞ্চ', true, true, [['S', 3, -2, 4], ['L', 1, -1, 3], ['Q', 1, 1, 3], ['L', 5, -1, 7], ['M', 4, 1, 7], ['S', 3, 2, 6], ['P', 0, -1, 7]]),
  fig('khorgosh', 'খরগোশ', false, false, [['P', 2, 2, 0], ['S', 7, 2, 2], ['Q', 1, 2, 2], ['L', 1, 2, 4], ['L', 5, 2, 8], ['M', 6, 0, 8], ['S', 7, 3, 7]]),
  fig('timi', 'তিমি', false, false, [['S', 3, 6, 0], ['S', 7, 6, 0], ['L', 5, 2, 2], ['M', 6, 0, 2], ['L', 1, 4, 0], ['Q', 1, 6, 0], ['P', 0, 1, 2]]),
  fig('paan', 'পান পাতা', false, true, [['L', 1, 2, 0], ['S', 1, 4, 0], ['P', 0, 3, 1], ['L', 5, 2, 4], ['S', 7, 3, 3], ['M', 0, 4, 2], ['Q', 1, 3, 3]]),
  fig('ketli', 'চায়ের কেটলি', true, true, [['P', 2, -2, 0], ['S', 7, 1, 1], ['L', 1, -1, 1], ['M', 2, 1, 1], ['L', 5, -1, 5], ['Q', 1, 1, 3], ['S', 1, 0, 4]]),

  fig('kochchhop', 'কচ্ছপ', true, false, [['P', 0, -4, 2], ['L', 5, 0, 4], ['L', 7, 0, 4], ['M', 6, -1, 5], ['S', 3, 3, 5], ['S', 3, 2, 6], ['Q', 1, 3, 5]]),
  fig('hash', 'হাঁস', false, true, [['S', 5, 2, 0], ['Q', 1, 3, -1], ['M', 6, 2, 2], ['P', 0, 3, 1], ['S', 1, 7, 1], ['L', 1, 2, 2], ['L', 5, 4, 4]]),
  fig('nach', 'মানুষ নাচছে', false, false, [['Q', 1, 2, 0], ['S', 3, 0, 2], ['S', 7, 4, 2], ['L', 5, 2, 4], ['L', 1, 2, 4], ['M', 2, 2, 6], ['P', 0, 2, 6]]),
  fig('penguin', 'পেঙ্গুইন', true, false, [['P', 0, -1, 1, 1], ['L', 1, -1, 1], ['S', 5, 0, 2], ['Q', 1, 1, 1], ['L', 5, -1, 5], ['M', 6, -3, 5], ['S', 7, 0, 4]]),
  fig('ghuri', 'ঘুড়ি', false, true, [['M', 0, 0, 0], ['L', 1, 2, 0], ['L', 5, 2, 4], ['S', 1, 2, 4], ['S', 5, 2, 6], ['P', 0, 1, 6], ['Q', 1, 3, 7]]),

  fig('hati', 'হাতি', true, false, [['Q', 1, -2, 0], ['M', 2, 0, 0], ['P', 0, -5, 1], ['L', 1, -1, 1], ['S', 1, -3, 3], ['L', 5, -1, 5], ['S', 3, -1, 5]]),
  fig('horin', 'হরিণ', false, true, [['S', 3, 0, 0], ['S', 7, 0, 0], ['Q', 1, 0, 0], ['L', 5, 2, 4], ['L', 1, 4, 2], ['P', 2, 2, 6, 1], ['M', 2, 6, 4]]),
  fig('bok', 'বক', false, true, [['S', 5, 0, 1], ['Q', 1, 1, 0], ['P', 2, 4, 3, 1], ['L', 1, 2, 1], ['L', 5, 2, 5], ['M', 6, 2, 7], ['S', 1, 2, 7]]),
  fig('mombati', 'মোমবাতি', true, true, [['L', 1, -1, 1], ['M', 2, 1, 1], ['S', 3, -3, 3], ['Q', 1, -3, 3], ['L', 5, -1, 5], ['S', 1, -2, 4], ['P', 0, -3, 5]]),
  fig('dourano', 'মানুষ দৌড়াচ্ছে', false, false, [['Q', 1, 2, 0], ['P', 0, 0, 2, 1], ['L', 5, 2, 4], ['S', 5, 5, 3], ['M', 0, 0, 4], ['L', 3, 4, 6], ['S', 1, 1, 7]]),
];

export const LEVEL_COUNT = FIGURES.length;

/** Four steps: outlines with pieces already turned right → outlines, pieces turned → only the shadow → shadow, turned. */
export function bandOf(level: number) {
  const step = level <= 6 ? 0 : level <= 12 ? 1 : level <= 17 ? 2 : 3;
  return { step, outlines: step < 2, turned: step % 2 === 1 };
}

/** The six silhouettes on the printed sheet. */
export const PRINT_IDS = ['ghor', 'nouka', 'biral', 'mach', 'rickshaw', 'dourano'] as const;
