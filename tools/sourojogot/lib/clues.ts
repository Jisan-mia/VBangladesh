// What each planet is known by, in a few words: the porthole clue's caption and the hint after a wrong pick.
import type { PlanetId } from "./planets";

export const CLUE: Record<PlanetId, string> = {
  mercury: "সবচেয়ে ছোট, সূর্যের গা ঘেঁষে",
  venus: "সবচেয়ে গরম",
  earth: "আমাদের বাড়ি, নদী আর গাছ",
  mars: "লাল মাটি আর ধুলো",
  jupiter: "সবচেয়ে বড়, ঝড়ের লাল চোখ",
  saturn: "বড় বলয়",
  uranus: "কাত হয়ে ঘোরে",
  neptune: "নীল, সবচেয়ে জোর বাতাস",
};
