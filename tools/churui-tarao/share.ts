import type { ToolShare } from "../../shared/share-types";
import { parseShared, sharedHash } from "./lib/challenge";
import { previewTitle } from "./lib/lines";

// A link only re-opens one afternoon (its seed replays the same birds) with the friend's own grain and shoo count. Old links
// (no `v`) are re-checked against the old afternoon; new ones against the real one, so no more birds than came, no grain the
// unshooed ones couldn't have eaten.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "ধান পেকেছে, চড়ুই এসেছে!",
      description: "পাকা ধানে চড়ুই নামছে। চেপে চেপে হুশ করে তাড়াও, সন্ধ্যা পর্যন্ত যত পারো ধান বাঁচাও। একই ক্ষেতে খেলে দেখো কে বেশি বাঁচায়। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
