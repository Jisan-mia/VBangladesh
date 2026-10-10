import type { ToolShare } from "../../shared/share-types";
import { parseResult, previewTitle, resultHash, tallyIds } from "./lib/game";

export const share: ToolShare = {
  normalize(state) {
    const result = parseResult(state);
    return result ? resultHash(result) : null;
  },
  preview(state) {
    const result = parseResult(state);
    return {
      title: result ? previewTitle(result) : "সাধারণ জ্ঞান বাংলাদেশ — দেশ চেনো কুইজ",
      description: "ক্লাসের চার্ট পেপারে দেশের ১০টা প্রশ্ন: জাতীয় প্রতীক, নদী, ঋতু, ঐতিহ্য। প্রতিটা উত্তর বাংলাপিডিয়া মিলিয়ে। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
  tally: tallyIds,
};
