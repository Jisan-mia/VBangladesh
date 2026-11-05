// The tune on the free grid is saved as it is made, so closing the page or opening the rest screen never loses it.
import { noteCount, readSaved, type Saved, type Tune } from "./music";

export const DRAFT_KEY = "ektukhani-sur-banai-draft";

/** Reads the draft: the same checks as a kept tune; anything broken is no draft. */
export function readDraft(raw: string | null): Saved | null {
  try { return readSaved(JSON.stringify([JSON.parse(raw ?? "null")]))[0] ?? null; } catch { return null; }
}
/** An empty grid isn't worth keeping: it writes "" so the draft is gone. */
export const draftText = (tune: Tune, sound: number) => (noteCount(tune) ? JSON.stringify({ tune, sound }) : "");
