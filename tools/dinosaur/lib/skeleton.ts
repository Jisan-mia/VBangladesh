// The skeleton board's rules: where a tap goes, what a bone is called, and the one line after a bone goes to the wrong place.
import type { BoneKind } from "./art";
import type { Dino, Part } from "./dinos";

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
