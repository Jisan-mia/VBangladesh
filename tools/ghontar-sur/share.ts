import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/links";

// No tally: a link carries one tune and the friend's own count.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "ঘণ্টার সুর: মেলার ঘণ্টা মনে রাখো",
      description: "মেলার পিতলের ঘণ্টা একটা একটা করে বাজে। একই ক্রমে বাজাও, সুর প্রতিবার লম্বা হয়। একই সুর খেলে দেখো তুমি কতটা মনে রাখতে পারো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
