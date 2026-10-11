import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link only rebuilds one finished game, after replaying and re-checking its moves.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "বাঘবন্দি: উঠোনের বাঘ-ছাগল খেলা, এবার ফোনে",
      description: "দুই বাঘ, বিশ ছাগল, মাটিতে আঁকা ছক। একই শুরু থেকে খেলো, চালগুলো মিলিয়ে দেখা ফল। দেখো তুমি বাঘ হয়ে পারো কি না। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
