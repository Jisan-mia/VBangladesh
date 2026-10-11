import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash, years } from "./lib/tokhon";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    return {
      title: shared ? previewTitle(shared) : "সেই ১০০ টাকা আজ কত টাকা? তোমার জন্মসালেরটা দেখো",
      description: "একটা সাল বেছে নাও, দেখো তখনকার ১০, ১০০ বা ১,০০০ টাকা এখন কত টাকার সমান। বিবিএসের ভোক্তা মূল্যসূচক ধরে আনুমানিক হিসাব।",
    };
  },
  // Only the picked year is ever counted.
  tally: years.map(String),
};
