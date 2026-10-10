import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash, tallyIds } from "./lib/jatra";

export const share: ToolShare = {
  normalize(state) {
    const trip = parseShareHash(state);
    return trip ? shareHash(trip).slice(1) : null;
  },
  preview(state) {
    const trip = parseShareHash(state);
    return {
      title: trip ? previewTitle(trip) : "ঈদযাত্রা — বাড়ি যেতে কত ঘণ্টা লাগল?",
      description: "কোথা থেকে কোথায়, বাস-ট্রেন-লঞ্চ না গাড়ি, কত ঘণ্টা: বাদামি কাগজে আঁকা হয়ে যাবে তোমার বাড়ি ফেরার পথ। নিজেরটা আঁকো।",
    };
  },
  // Route × vehicle × hour bucket for the current Eid only; never a name or a free number.
  tally: tallyIds,
};
