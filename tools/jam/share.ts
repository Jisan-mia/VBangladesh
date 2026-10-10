import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash, tallyIds } from "./lib/jam";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    return {
      title: shared ? previewTitle(shared) : "জ্যামে জীবনের কত দিন গেল?",
      description: "রোজ কত মিনিট জ্যামে, কত বছর ধরে? হিসাব করে দেখো জীবনের কত দিন গেল, আর তাতে কত কাপ চা, কয়টা নাটক হয়ে যেত। ফ্রি।",
    };
  },
  tally: tallyIds,
};
