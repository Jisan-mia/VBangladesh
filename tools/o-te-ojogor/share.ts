import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link only re-opens one level (its seed replays the same falling order) with the friend's own mistake count.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "অ-তে অজগর: গাছ থেকে বর্ণ পড়ছে, ঠিকটা ঝুড়িতে ধরো",
      description: "স্বরবর্ণ, ব্যঞ্জনবর্ণ, ছোট শব্দ আর ১ থেকে ২০। একই গাছ, একই ক্রমে বর্ণ পড়বে, দেখো তুমি কয়টা ভুলে পারো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
