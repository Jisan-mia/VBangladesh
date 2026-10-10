import type { ToolShare } from "../../shared/share-types";
import { fishes, parseShareHash, previewTitle, shareHash } from "./lib/fish";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    return {
      title: shared ? previewTitle(shared) : "দেশি মাছ, কয়টা খেয়েছ?",
      description: "ইলিশ, পাবদা, লইট্টা, কাচকি… ছবিসহ ৪০টা দেশি মাছের কয়টা তুমি খেয়েছ? ছুঁয়ে বাঁশের ডালায় তোলো, নিজের ডালার ছবি বানাও।",
    };
  },
  // Only the fixed fish ids are counted, never names.
  tally: fishes.map(fish => fish.id),
};
