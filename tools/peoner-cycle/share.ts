import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

export const share: ToolShare = {
  // A real-time score can't be re-checked; the link is capped, its parts must add up, and the page calls it the friend's own phone score.
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "ভোরের পথে চিঠি নিয়ে, ক্রিং ক্রিং!",
      description: "গ্রামের পিয়ন সাইকেলে চিঠি বিলি করতে বেরিয়েছে। বাঁয়ে-ডানে চেপে গরু, ছাগল, ভ্যান আর কাদা পাশ কাটাও, গেটের হাতে চিঠি পৌঁছাও। একই রাস্তায় খেলে দেখো কে বেশি যায়। ফ্রি।",
    };
  },
};
