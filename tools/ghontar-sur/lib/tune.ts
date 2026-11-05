// Melodies as pure data. A tune is a flat list of notes plus the lengths of its rounds: round r plays the first
// `ends[r]` notes (phrase one, then phrase one and two…). A note's `gap` is the beats until the next note: 1 on the
// beat, 2 for a rest (one silent beat in between). Seeded with makeRng only, so a link replays the same tune.
import { makeRng, pick } from "../../../shared/game-core";
import { legacyTune } from "./legacy";

export const MAX_BELLS = 5;
/** One pentatonic note per bell, low to high (G A C D E): the biggest bell sounds lowest. Bells 0–3 are the old pots' pitches. */
export const BELL_HZ = [392, 440, 523, 587, 659] as const;

export type Note = { readonly bell: number; readonly gap: number };
export type Tune = { readonly notes: readonly Note[]; readonly ends: readonly number[] };
export type TuneSpec = { bells: number; phrases: number; size: number; rests: number; repeat: boolean };
/** A hand-written phrase list: [bell, gap] pairs. */
export type Written = readonly (readonly (readonly [number, number])[])[];

/** A written tune (the finales). The last note's gap doesn't matter. */
export function writtenTune(phrases: Written): Tune {
  const notes: Note[] = [], ends: number[] = [];
  for (const phrase of phrases) {
    for (const [bell, gap] of phrase) notes.push({ bell, gap });
    ends.push(notes.length);
  }
  return { notes, ends };
}

/** The generated tune for a level: random bells with no bell three times running, and a repeat or a rest where the level wants one. */
export function makeTune(spec: TuneSpec, seed: number): Tune {
  const rng = makeRng(seed >>> 0), total = spec.phrases * spec.size, bells: number[] = [];
  const other = (bell: number) => (bell + 1 + pick(rng, spec.bells - 1)) % spec.bells;
  for (let index = 0; index < total; index++) {
    let bell = pick(rng, spec.bells);
    if (index > 0 && bell !== bells[index - 1] && spec.repeat && rng() < 0.22 && !(index > 1 && bells[index - 1] === bells[index - 2])) bell = bells[index - 1];
    if (index > 0 && !spec.repeat && bell === bells[index - 1]) bell = other(bell);
    if (index > 1 && bell === bells[index - 1] && bell === bells[index - 2]) bell = other(bell);
    bells.push(bell);
  }
  const fits = (at: number, bell: number) => {
    const left = at > 0 ? bells[at - 1] : -1, right = at < total - 1 ? bells[at + 1] : -1;
    if (!spec.repeat && (bell === left || bell === right)) return false;
    if (at > 1 && bell === left && bell === bells[at - 2]) return false;
    if (at < total - 2 && bell === right && bell === bells[at + 2]) return false;
    if (left === bell && right === bell) return false;
    return true;
  };
  // Every bell of the level is heard in the tune when it is long enough, and the newest bell always is: it is felt at once.
  {
    for (let bell = spec.bells - 1; bell >= (total >= spec.bells ? 0 : spec.bells - 1); bell--) {
      if (bells.includes(bell)) continue;
      const start = pick(rng, total);
      for (let step = 0; step < total; step++) {
        const at = (start + step) % total, old = bells[at];
        if ((bells.filter(b => b === old).length < 2 && bell !== spec.bells - 1) || !fits(at, bell)) continue;
        bells[at] = bell;
        break;
      }
    }
  }
  // A level that teaches the repeat has at least one.
  if (spec.repeat && !bells.some((bell, at) => at > 0 && bell === bells[at - 1])) {
    for (let at = 1; at < total; at++) {
      const bell = bells[at - 1];
      if (at > 1 && bells[at - 2] === bell) continue;
      if (at < total - 1 && bells[at + 1] === bell) continue;
      if (bells.filter(b => b === bells[at]).length < 2) continue;
      bells[at] = bell;
      break;
    }
  }
  // Rests sit inside a phrase (never at its end), one per phrase in turn, so round one already holds the first.
  const gaps: number[] = new Array(total).fill(1);
  const taken: number[] = [];
  for (let rest = 0; rest < spec.rests; rest++) {
    const phrase = rest % spec.phrases, inner = spec.size - 1;
    if (inner < 1) break;
    for (let tries = 0; tries < inner; tries++) {
      const at = phrase * spec.size + ((pick(rng, inner) + tries) % inner);
      if (!taken.includes(at)) { taken.push(at); gaps[at] = 2; break; }
    }
  }
  const notes = bells.map((bell, at) => ({ bell, gap: gaps[at] }));
  const ends = Array.from({ length: spec.phrases }, (_, phrase) => (phrase + 1) * spec.size);
  return { notes, ends };
}

/** The old endless tune as a tune of one-note phrases: round r plays r + 1 notes. */
export function endlessTune(seed: number, length: number): Tune {
  const notes = legacyTune(seed, length).map(bell => ({ bell, gap: 1 }));
  return { notes, ends: notes.map((_, at) => at + 1) };
}

/** Beats from the start to each note's onset (0 for the first). Multiply by a beat's ms. */
export function beatsOf(notes: readonly Note[]): number[] {
  const out: number[] = [];
  let at = 0;
  for (const note of notes) { out.push(at); at += note.gap; }
  return out;
}
