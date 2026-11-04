// The ten কার signs and what a word needs around its missing sign: where the sign sits, its look-alikes, and how a word
// splits around the empty seat. Pure. The levels are in levels.ts, a round's rules in round.ts.

export const KARS = ["া", "ি", "ী", "ু", "ূ", "ৃ", "ে", "ৈ", "ো", "ৌ"] as const;
export type Kar = (typeof KARS)[number];

export const KAR_NAME: Record<Kar, string> = {
  "া": "আ-কার", "ি": "ই-কার", "ী": "ঈ-কার", "ু": "উ-কার", "ূ": "ঊ-কার",
  "ৃ": "ঋ-কার", "ে": "এ-কার", "ৈ": "ঐ-কার", "ো": "ও-কার", "ৌ": "ঔ-কার",
};

/** Where the sign shows around its letter, so the empty slot sits exactly there. ো and ৌ wrap both sides. */
export type Side = "left" | "right" | "below" | "both";
export const SIDE: Record<Kar, Side> = {
  "া": "right", "ি": "left", "ী": "right", "ু": "below", "ূ": "below",
  "ৃ": "below", "ে": "left", "ৈ": "left", "ো": "both", "ৌ": "both",
};

/** A lone sign on a dotted circle (◌া), the way primers print it. */
export const dotted = (kar: Kar) => `◌${kar}`;

/** The signs a child most often mixes up with each one, closest first. Wrong choices come from the front of this list. */
export const PARTNERS: Record<Kar, readonly Kar[]> = {
  "া": ["ী", "ো", "ি", "ু"],
  "ি": ["ী", "ে", "া", "ু"],
  "ী": ["ি", "া", "ূ", "ে"],
  "ু": ["ূ", "ৃ", "া", "ি"],
  "ূ": ["ু", "ৃ", "ী", "া"],
  "ৃ": ["ু", "ূ", "ি", "া"],
  "ে": ["ৈ", "ি", "ো", "া"],
  "ৈ": ["ে", "ৌ", "ি", "া"],
  "ো": ["ৌ", "া", "ে", "ু"],
  "ৌ": ["ো", "ৈ", "া", "ি"],
};

/** One picture word with one sign taken out: the `nth` (from 0) time `kar` appears. `not` drops a wrong choice that would spell a real variant. */
export type Item = { word: string; pic: string; kar: Kar; nth: number; not?: readonly Kar[] };
export const word = (text: string, pic: string, kar: Kar, nth = 0, not?: Kar[]): Item => ({ word: text, pic, kar, nth, ...(not ? { not } : {}) });

const bnDigits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => bnDigits.format(value);

/** The word around the missing sign: `base` is the letter (or conjunct) the sign belongs to. */
export type Parts = { before: string; base: string; after: string };
const NUKTA = "়", HASANTA = "্";

export function splitWord(item: Item): Parts {
  let at = -1;
  for (let i = 0, seen = 0; i < item.word.length; i++) if (item.word[i] === item.kar && seen++ === item.nth) { at = i; break; }
  if (at < 1) throw new Error(`${item.word}: no ${item.kar} #${item.nth}`);
  let start = at - 1;
  if (item.word[start] === NUKTA) start--;
  while (start >= 2 && item.word[start - 1] === HASANTA) start -= 2;
  return { before: item.word.slice(0, start), base: item.word.slice(start, at), after: item.word.slice(at + 1) };
}
/** The word as it reads with `kar` in the slot: মাছ, or মীছ for a wrong pick. */
export const spellWith = (item: Item, kar: Kar) => { const parts = splitWord(item); return parts.before + parts.base + kar + parts.after; };
