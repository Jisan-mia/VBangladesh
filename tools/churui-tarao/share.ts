import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash } from "./lib/game";

export const share: ToolShare = {
  // Re-checked against the seed's real afternoon: no more sparrows than came, no grain the unshooed ones couldn't have eaten.
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    return {
      title: shared ? previewTitle(shared) : "ধান পেকেছে, চড়ুই এসেছে!",
      description: "পাকা ধানে চড়ুই নামছে। চেপে চেপে হুশ করে তাড়াও, ৪৫ সেকেন্ডে যত পারো ধান বাঁচাও। একই ক্ষেতে খেলে দেখো কে বেশি বাঁচায়। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
