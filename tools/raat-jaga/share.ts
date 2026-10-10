import type { ToolShare } from "../../shared/share-types";
import { nights, parseShareHash, previewTitle, shareHash } from "./lib/nights";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    return {
      title: previewTitle(parseShareHash(state)),
      description: "১৯৯০ থেকে ২০২৬, বাংলাদেশে মাঝরাতে শুরু হওয়া বিশ্বকাপের ২০টা ম্যাচ। কয়টা জেগে দেখেছিলে? দাগাও, তারায় ভরা আকাশের কার্ড বানাও।",
    };
  },
  // Only the twenty fixed match ids are ever counted; never names.
  tally: nights.map(night => night.id),
};
