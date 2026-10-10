import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash } from "./lib/hisab";

export const share: ToolShare = {
  normalize(state) {
    const hisab = parseShareHash(state);
    return hisab ? shareHash(hisab).slice(1) : null;
  },
  preview(state) {
    const hisab = parseShareHash(state);
    return {
      title: hisab ? `${previewTitle(hisab)}! তোমার শখের জিনিস কত কাপ?` : "চায়ের কাপে হিসাব — যেকোনো দাম কত কাপ চা?",
      description: "যেকোনো দাম লেখো, দেখো কত কাপ চা, কয়টা সিঙ্গারা আর কতবার রিকশা ভাড়া হয়। মাটির ভাঁড়ের মিনার বানিয়ে শেয়ার করো।",
    };
  },
  // No tally: amounts and prices are free numbers, nothing fixed to count.
};
