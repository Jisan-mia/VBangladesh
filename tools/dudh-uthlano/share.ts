import type { ToolShare } from "../../shared/share-types";
import { parseShared, potsWord, previewTitle, sharedHash, whereText } from "./lib/challenge";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    const count = shared?.scores.length ?? 5;
    return {
      title: shared ? previewTitle(shared) : "দুধটা দেখিস! উথলানোর আগে নামাতে পারবে?",
      description: shared
        ? `${whereText(shared)}: চুলায় ${potsWord(count)} পাতিল, ফেনা উঠছে। উথলানোর ঠিক আগে নামাও, কিনারার যত কাছে তত নম্বর। একই পাতিলে খেলে দেখো। ফ্রি, অ্যাকাউন্ট লাগে না।`
        : "চুলায় পাতিল, ফেনা উঠছে। উথলানোর ঠিক আগে নামাও, কিনারার যত কাছে তত নম্বর। বন্ধুকে একই পাতিলে চ্যালেঞ্জ দাও। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
