import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewDescription, previewTitle, shareHash, tallyIds } from "./lib/shelf";

export const share: ToolShare = {
  normalize(state) {
    const shelf = parseShareHash(state);
    return shelf ? shareHash(shelf).slice(1) : null;
  },
  preview(state) {
    const shelf = parseShareHash(state);
    return shelf
      ? { title: previewTitle(shelf), description: previewDescription(shelf) }
      : { title: "চার প্রিয় — তোমার চারটা নাটক, সিনেমা, বই বা গান কী?", description: "কোথাও কেউ নেই, হাওয়া, পথের পাঁচালী… প্রিয় চারটা নীলক্ষেতের তাকের মতো সাজাও, বন্ধুর সাথে মেলাও।" };
  },
  // List ids and curated item ids only; typed titles and names are never counted.
  tally: tallyIds,
};
