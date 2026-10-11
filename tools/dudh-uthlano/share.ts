import type { ToolShare } from "../../shared/share-types";
import { parseShare, previewTitle, shareHash } from "./lib/link";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShare(state);
    return shared ? shareHash(shared) : null;
  },
  preview(state) {
    const shared = parseShare(state);
    return {
      title: shared ? previewTitle(shared) : "দুধটা দেখিস! উথলানোর আগে নামাতে পারবে?",
      description: "চুলায় পাঁচটা পাতিল, ফেনা উঠছে। উথলানোর ঠিক আগে নামাও, কিনারার যত কাছে তত নম্বর। একই পাঁচটা পাতিলে খেলে দেখো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
