import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash, tallyIds } from "./lib/game";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    return {
      title: shared ? previewTitle(shared) : "শেষ বল, দরকার ৫। তুমি পারবে?",
      description: "এক ট্যাপের ক্রিকেট গেম: ঠিক সময়ে ‘মারো!’ চাপো, শেষ বলে ছক্কা মারো। বন্ধুর সাথে একই বল, দেখো কে কম চেষ্টায় পারে। ফ্রি।",
    };
  },
  tally: tallyIds,
};
