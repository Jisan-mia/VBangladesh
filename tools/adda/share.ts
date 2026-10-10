import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash, tallyIds } from "./lib/adda";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    return {
      title: previewTitle(parseShareHash(state)),
      description: "কুইন, স্ট্রাইকার, সাদা না কালো গুটি? ৭টা প্রশ্নে দেখো আড্ডায় তুমি কে, তারপর খেলে বন্ধুর ক্যারম বোর্ডে যোগ হও। ফ্রি।",
    };
  },
  // Fixed piece ids only, never names or answers.
  tally: tallyIds,
};
