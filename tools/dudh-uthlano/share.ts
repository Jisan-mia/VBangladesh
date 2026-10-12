import type { ToolShare } from "../../shared/share-types";
import { parseShare, potsWord, previewTitle, shareHash } from "./lib/link";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShare(state);
    return shared ? shareHash(shared) : null;
  },
  preview(state) {
    const shared = parseShare(state);
    return {
      title: shared ? previewTitle(shared) : "দুধটা দেখিস! উথলানোর আগে নামাতে পারবে?",
      description: `চুলায় ${potsWord(shared?.scores.length ?? 5)} পাতিল, ফেনা উঠছে। উথলানোর ঠিক আগে নামাও, কিনারার যত কাছে তত নম্বর। একই ${potsWord(shared?.scores.length ?? 5)} পাতিলে খেলে দেখো। ফ্রি, অ্যাকাউন্ট লাগে না।`,
    };
  },
};
