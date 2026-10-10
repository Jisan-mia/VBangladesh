import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash, tallyIds } from "./lib/roof";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    return {
      title: shared ? previewTitle(shared) : "আর্জেন্টিনা না ব্রাজিল? তোমার ছাদে কোন পতাকা?",
      description: "এক চাপে দল বাছো, ছাদে পতাকা তোলো, পাশের বাসায় বন্ধুর পতাকা দেখো। দেশের মানুষ কোন দিকে, সেটাও দেখো।",
    };
  },
  // Only fixed team and division ids are ever counted; never names.
  tally: tallyIds,
};
