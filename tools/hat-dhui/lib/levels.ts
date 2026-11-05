// The three levels (ids 1–3 are the saved-stars keys and never change): what each is, in order, and which one is next.
export type ModeId = "hat" | "dat" | "kokhon";
export type Kind = "routine" | "quiz";

export const MODES: readonly { id: ModeId; bn: string; level: number; kind: Kind }[] = [
  { id: "hat", bn: "হাত ধোয়া", level: 1, kind: "routine" },
  { id: "dat", bn: "দাঁত মাজা", level: 2, kind: "routine" },
  { id: "kokhon", bn: "কখন ধোব", level: 3, kind: "quiz" },
];

export const modeOf = (id: string | null | undefined) => MODES.find(mode => mode.id === id) ?? MODES[0];
export const modeFromHash = (hash: string): ModeId | null => { const id = new URLSearchParams(hash.replace(/^#/, "")).get("m"); return MODES.some(mode => mode.id === id) ? id as ModeId : null; };

/** The level to have ready: the first one still without a star, else the first. */
export const firstToPlay = (stars: Readonly<Record<number, number>>): ModeId => (MODES.find(mode => !stars[mode.level]) ?? MODES[0]).id;

/** After শেষ: the next level in order that has no star yet; if all have one, the same level stays ready. */
export function nextMode(current: ModeId, stars: Readonly<Record<number, number>>): ModeId {
  const at = MODES.findIndex(mode => mode.id === current);
  for (let step = 1; step < MODES.length; step++) {
    const mode = MODES[(at + step) % MODES.length];
    if (!stars[mode.level]) return mode.id;
  }
  return current;
}

/** True when this finish closes the whole set for the first time (every other level already has a star). */
export const completesSet = (stars: Readonly<Record<number, number>>, level: number) =>
  !stars[level] && MODES.every(mode => mode.level === level || stars[mode.level]);
