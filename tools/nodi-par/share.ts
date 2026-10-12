import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash } from "./lib/result";

export const share: ToolShare = {
  // A real-time time can't be re-checked: the link is capped and must fit its river, and the page calls it the friend's own phone time.
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    return {
      title: shared ? previewTitle(shared) : "নৌকা, ভেলা, কচুরিপানায় লাফিয়ে নদী পার",
      description: "চাপ দিলে সামনে লাফ, আঙুল টানলে পাশে। নৌকা, ভেলা আর কচুরিপানায় পা রেখে ওপারের ঘাটে ওঠো, পথে আম তোলো। একই নদীতে খেলে দেখো কে আগে পৌঁছায়। ফ্রি।",
    };
  },
};
