// The evenings a family can choose, as data. A party game's "levels" are its rounds: the rules never change mid-evening,
// so each format only sets the length, its real cost in minutes, and the finale (the last round, "শেষ দান").
// tests/chor-police.test.ts plays thousands of evenings with headless families to check each one stays fair and tense.

export type Evening = {
  rounds: number;
  /** The chip's name. */
  name: string;
  /** What the chip promises, in the player's terms. */
  promise: string;
  recommended: boolean;
};

export const evenings: readonly Evening[] = [
  { rounds: 5, name: "ঝটপট", promise: "প্রায় ৭ মিনিট", recommended: true },
  { rounds: 10, name: "জমজমাট", promise: "প্রায় ১৫ মিনিট", recommended: false },
  { rounds: 15, name: "সারা সন্ধ্যা", promise: "প্রায় ২০ মিনিট", recommended: false },
];

export const ROUND_CHOICES = evenings.map(evening => evening.rounds) as readonly number[];

/** The named finale of every evening. */
export const FINALE = "শেষ দান";

// Timings, in ms. Kept here so the tests and the model share them with the component.
/** The drumroll before the chits open; the finale rolls a little longer. */
export const ROLL_MS = 750;
export const FINALE_ROLL_MS = 1150;
/** On the reveal, the named suspect's chit flips at 0, the other one after FLIP_GAP, then the points count up. */
export const FLIP_GAP_MS = 420;
