// Levels, the gentle difficulty steps, stars, the skeleton snap and the finder's book. Pure functions, no React.
import { starsFor } from "../../../shared/game-core";
import type { BoneKind } from "./art";
import { bn, DINOS, dinoOf, type Dino, type Part } from "./dinos";

/** Six digs of two dinosaurs each: famous ones first, one plant-eater and one meat-eater where possible. */
export const LEVELS: readonly { dinos: readonly [string, string]; bones: number }[] = [
  { dinos: ["triceratops", "trex"], bones: 3 },
  { dinos: ["stegosaurus", "velociraptor"], bones: 3 },
  { dinos: ["brachiosaurus", "allosaurus"], bones: 4 },
  { dinos: ["ankylosaurus", "spinosaurus"], bones: 4 },
  { dinos: ["diplodocus", "parasaurolophus"], bones: 5 },
  { dinos: ["iguanodon", "pachycephalosaurus"], bones: 5 },
];
export const LEVEL_COUNT = LEVELS.length;
const clampLevel = (level: number) => Math.max(1, Math.min(LEVEL_COUNT, Math.round(level) || 1));
export const dinosOf = (level: number): Dino[] => LEVELS[clampLevel(level) - 1].dinos.map(id => dinoOf(id)!);

/**
 * Sweet-spot difficulty, never announced: three slips in a row ease the next dinosaur (one bone fewer, and the right place
 * glows); five right in a row step it up (one bone more). `help` is -1 (harder), 0 or 1 (easier).
 */
export type Pace = { right: number; wrong: number; help: -1 | 0 | 1 };
export const FRESH_PACE: Pace = { right: 0, wrong: 0, help: 0 };
export function nextPace(pace: Pace, correct: boolean): Pace {
  if (correct) { const right = pace.right + 1; return { right, wrong: 0, help: right >= 5 ? -1 : pace.help === 1 ? 0 : pace.help }; }
  const wrong = pace.wrong + 1;
  return { right: 0, wrong, help: wrong >= 3 ? 1 : pace.help === -1 ? 0 : pace.help };
}
/** Bones to dig for the next dinosaur: the level's count, one fewer when eased, one more when stepped up (3 to 6). */
export const bonesFor = (level: number, pace: Pace) => Math.max(3, Math.min(6, LEVELS[clampLevel(level) - 1].bones - pace.help));
/** The right place glows once the child has tried twice, or straight away when eased. */
export const shouldGlow = (pace: Pace, tries: number) => pace.help === 1 || tries >= 2;

/** Stars are a record only: 3 with no slip, 2 with up to two, else 1. A finished dig always earns one. */
export const starsOf = (slips: number) => starsFor(slips, 0, 2, true);

/** Generous snapping: a tap anywhere on the skeleton goes to the nearest empty place. */
export function nearestSlot(parts: readonly Part[], x: number, y: number, filled: readonly BoneKind[] = []) {
  let best: Part | null = null, distance = Infinity;
  for (const part of parts) {
    if (filled.includes(part[0])) continue;
    const d = Math.hypot(part[1] - x, part[2] - y);
    if (d < distance) { distance = d; best = part; }
  }
  return best;
}

/** "হাত" on a two-legged dinosaur, "সামনের পা" on a four-legged one. */
export function boneName(kind: BoneKind, dino: Dino) {
  if (kind === "arm") return dino.look.legs.length > 2 ? "সামনের পা" : "হাত";
  return BONE_NAMES[kind];
}
const BONE_NAMES: Record<BoneKind, string> = {
  skull: "মাথার খুলি", dome: "মাথার খুলি", ribs: "পাঁজর", leg: "পায়ের হাড়", arm: "হাত", tail: "লেজ", neck: "গলা",
  frill: "ঘাড়ের ঢাল", plate: "পিঠের প্লেট", claw: "নখ", sail: "পিঠের পাল", club: "লেজের মুগুর", crest: "মাথার ঝুঁটি",
};

const WHERE: Record<BoneKind, string> = {
  skull: "সবার সামনে, মাথায়", dome: "সবার সামনে, মাথায়", ribs: "মাঝখানে, পেটের ওপর", leg: "নিচে, মাটির কাছে", arm: "সামনের দিকে", tail: "পেছনের দিকে",
  neck: "মাথা আর শরীরের মাঝে", frill: "মাথার পেছনে", plate: "পিঠের ওপর", claw: "হাতের আগায়", sail: "পিঠের ওপর", club: "লেজের একদম আগায়", crest: "মাথার ওপর",
};
/** One line after a bone goes to the wrong place: what it is and where it belongs. */
export function placeHint(kind: BoneKind, dino: Dino) {
  const where = kind === "claw" && dino.id === "velociraptor" ? "পায়ের কাছে" : WHERE[kind];
  return `এটা ${boneName(kind, dino)}। বসে ${where}।`;
}

/** The end screen and the parent card: what was done, with no name. */
export const doneLine = (level: number) => `আজ ${bn(dinosOf(level).length)}টা ডাইনোসর খুঁজে পেলাম`;

/** The finder's book: ids of every dinosaur found on this phone, in the book's order. Anything unknown is dropped. */
export function readBook(raw: string | null): string[] {
  try {
    const saved = JSON.parse(raw ?? "[]");
    if (!Array.isArray(saved)) return [];
    return DINOS.map(dino => dino.id).filter(id => saved.includes(id));
  } catch { return []; }
}
export const addToBook = (book: readonly string[], id: string) => DINOS.map(dino => dino.id).filter(each => each === id || book.includes(each));
export const BOOK_KEY = "ektukhani-dinosaur-book";
