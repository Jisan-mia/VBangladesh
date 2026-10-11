import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "মেলার সব হাঁড়ি ভাঙতে পারবে?",
      description: "মেলার দোকানে দড়িতে ঝুলছে নকশা-আঁকা মাটির হাঁড়ি। লাঠিতে বল ফিরিয়ে একটা একটা করে ভাঙো। একই হাঁড়ির সারি, দেখো তুমি কয়টা পারো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
