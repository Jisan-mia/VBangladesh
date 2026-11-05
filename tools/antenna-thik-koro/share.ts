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
      title: shared ? previewTitle(shared) : "আরেকটু ডানে… হ্যাঁ, এবার আসছে!",
      description: "ছাদের অ্যান্টেনা ঘুরিয়ে ঝিরঝির টিভিতে ছবি আনো। একই চ্যানেল, একই জায়গায়। কত সেকেন্ডে পারো দেখো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
