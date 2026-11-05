// What a finished set leaves behind: the letters written, the strokes they took, and the stars (recorded once).
import { strokesOf } from "./strokes";
import { accuracyOf, starsOf, type Round } from "./trace";

export type Result = { level: number; letters: readonly string[]; strokes: number; stars: number; noun: string };

const isDigit = (char: string) => /^[০-৯]$/.test(char);

export function resultOf(round: Round): Result {
  const letters = round.letters;
  return {
    level: round.level, letters,
    strokes: letters.reduce((sum, char) => sum + strokesOf(char).length, 0),
    stars: starsOf(round.helps, accuracyOf(round)),
    noun: letters.every(isDigit) ? "সংখ্যা" : "বর্ণ",
  };
}
