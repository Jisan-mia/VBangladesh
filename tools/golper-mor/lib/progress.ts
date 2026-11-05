// What this phone remembers: which turns of which stories were read ("পড়া হয়েছে"), and today's stories for the parent card.
// No stars and no score: a story is read or not yet read, nothing more.
import { STORY_IDS, WORLDS, worldOf, type Side, type WorldId } from "./stories";

export const PROGRESS_KEY = "ektukhani-golper-mor";
export type Progress = { read: Record<string, Side[]>; day: string; today: string[] };
export const empty = (): Progress => ({ read: {}, day: "", today: [] });

/** Reads saved progress, keeping only known story ids and sides 0/1; anything odd becomes empty. */
export function readProgress(raw: string | null): Progress {
  const progress = empty();
  try {
    const saved = JSON.parse(raw ?? "null");
    if (!saved || typeof saved !== "object") return progress;
    for (const id of STORY_IDS) {
      const sides = Array.isArray(saved.read?.[id]) ? saved.read[id].filter((side: unknown): side is Side => side === 0 || side === 1) : [];
      if (sides.length) progress.read[id] = [...new Set<Side>(sides)].sort();
    }
    if (typeof saved.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(saved.day)) {
      progress.day = saved.day;
      progress.today = Array.isArray(saved.today) ? [...new Set<string>(saved.today.filter((id: unknown) => typeof id === "string" && STORY_IDS.includes(id)))] : [];
    }
  } catch { /* broken JSON: start fresh */ }
  return progress;
}

/** A path read to its end. A new day starts a fresh "today" list. */
export function finish(progress: Progress, id: string, side: Side, day: string): Progress {
  const sides = [...new Set<Side>([...(progress.read[id] ?? []), side])].sort();
  const today = progress.day === day ? progress.today : [];
  return { read: { ...progress.read, [id]: sides }, day, today: today.includes(id) ? today : [...today, id] };
}

export const isRead = (progress: Progress, id: string) => (progress.read[id]?.length ?? 0) > 0;
export const bothRead = (progress: Progress, id: string) => (progress.read[id]?.length ?? 0) === 2;
export const readCount = (progress: Progress) => STORY_IDS.filter(id => isRead(progress, id)).length;
/** Today's stories, or none when the saved day is not today. */
export const todayOf = (progress: Progress, day: string) => progress.day === day ? progress.today : [];
/** The first story not read yet (where the ghost finger points), or null when all are read. */
export const nextUnread = (progress: Progress) => STORY_IDS.find(id => !isRead(progress, id)) ?? null;

export const bothCount = (progress: Progress) => STORY_IDS.filter(id => bothRead(progress, id)).length;
/** A shelf is lit when all three of its stories have been read (either turn). */
export const shelfLit = (progress: Progress, world: WorldId) => WORLDS.find(item => item.id === world)!.ids.every(id => isRead(progress, id));
/** The shelf this very story just lit for the first time, or null. */
export const newlyLit = (before: Progress, after: Progress, id: string): WorldId | null => {
  const world = worldOf(id).id;
  return !shelfLit(before, world) && shelfLit(after, world) ? world : null;
};

/**
 * A story read to its end. The saved copy is read again at this moment and the new mark goes on top of it, so a tab that
 * opened earlier can never wipe what another tab saved since. `raw` is the saved text (null when nothing is saved);
 * `undefined` means storage could not be read at all, so this tab's own copy is all there is.
 */
export function recordFinish(raw: string | null | undefined, memory: Progress, id: string, side: Side, day: string): Progress {
  return finish(raw === undefined ? memory : readProgress(raw), id, side, day);
}
/** The story to offer first: one never read, else one with only one path read, else the first. */
export const nextToRead = (progress: Progress) => nextUnread(progress) ?? STORY_IDS.find(id => !bothRead(progress, id)) ?? STORY_IDS[0];
