import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link only re-opens one match (its seed replays the same keeper and kicks) with the friend's own score.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "পেনাল্টি কিক: পাড়ার দলকে চ্যাম্পিয়ন বানাতে পারবে?",
      description: "স্কুলমাঠের বাঁশের গোলপোস্টে টাইব্রেকার। আঙুল টেনে শট নাও, কিপার হয়ে ঝাঁপ দাও। একই কিপার, একই শট, দেখো তুমি কয় গোলে জেতো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
