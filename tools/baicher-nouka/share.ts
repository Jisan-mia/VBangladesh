import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash } from "./lib/link";

export const share: ToolShare = {
  // A real-time time can't be re-checked; the link is capped and the page calls it the friend's own phone time.
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    return {
      title: shared ? previewTitle(shared) : "ঢোলের তালে বৈঠা, সবার আগে ঘাটে!",
      description: "নদীতে নৌকাবাইচ। ঢোলের তালে চাপো, কচুরিপানা এড়াও, তিন নৌকাকে পেছনে ফেলো। একই নদীতে খেলে দেখো কে আগে ঘাটে পৌঁছায়। ফ্রি।",
    };
  },
};
