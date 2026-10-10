import type { ToolShare } from "../../shared/share-types";
import { parseResult, previewTitle, resultHash } from "./lib/gpa";

// No tally on purpose: no grade comparison, no GPA leaderboard.
export const share: ToolShare = {
  normalize(state) {
    const result = parseResult(state);
    return result ? resultHash(result) : null;
  },
  preview(state) {
    const result = parseResult(state);
    return {
      title: result ? previewTitle(result) : "জিপিএ ক্যালকুলেটর — এসএসসি ও এইচএসসি",
      description: "বিষয়ভিত্তিক গ্রেড বসাও, ৪র্থ বিষয়সহ জিপিএ সাথে সাথে দেখো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
