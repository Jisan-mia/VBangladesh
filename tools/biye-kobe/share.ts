import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash, timingIds } from "./lib/report";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    return {
      title: shared ? previewTitle(shared) : "কবে বিয়ে হবে? ঘটকের রিপোর্ট দেখো",
      description: "৬টা দুষ্টু প্রশ্নের উত্তর দাও, ঘটকের ফাইল থেকে বেরোবে তোমার মজার রিপোর্ট। আগে বন্ধুর ফাইলটা দেখে নাও।",
    };
  },
  tally: timingIds,
};
