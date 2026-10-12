import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash, tallyIds } from "./lib/moner-boyos";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    return {
      title: previewTitle(parseShareHash(state)),
      description: "লাল চা না কোল্ড কফি, রেডিও না রিল, হাঁটা না রিকশা? ৮টা চেনা পছন্দে মেলার মেশিন মেপে দেবে তোমার মনের বয়স। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
  tally: tallyIds,
};
