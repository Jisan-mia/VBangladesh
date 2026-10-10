import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash, tallyIds } from "./lib/seal";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    return {
      title: shared ? previewTitle(shared) : "খেলার আগে বলে রাখো, পরে দেখিয়ে দাও — আমি বলেছিলাম!",
      description: shared?.result
        ? "খেলার আগে সিল করা খাম খোলা হয়েছে। দেখো কার কথা মিলল, তারপর পরের খেলার ভবিষ্যদ্বাণী নিজে সিল করো।"
        : "খেলার আগে সিল করা খাম। খেলা শেষে খুলবে। তুমিও নিজের ভবিষ্যদ্বাণী একই খামে ভরে দাও।",
    };
  },
  // Only the team pair and the winning side (or a draw) are ever counted: never names, margins or scores.
  tally: tallyIds,
};
