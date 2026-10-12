import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link only re-opens one level (its seed rebuilds the same pile) with the friend's own ball count.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "সাত চাড়া: এক বলে সাতটা ফেলতে পারবে?",
      description: "গলিতে সাজানো সাতটা চ্যাপ্টা চাড়া। বল পেছনে টেনে ছেড়ে দাও, তিন বলে সাতটাই ফেলো। একই সাজানো, দেখো তুমি কয় বলে পারো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
