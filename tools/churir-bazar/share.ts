import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link only re-opens one cleared level, after replaying its moves.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "চুড়ির বাজার: এক রঙের তিনটা চুড়ি মেলাও",
      description: "পাশাপাশি দুটো কাচের চুড়ি বদলাও, এক রঙের তিনটা এক লাইনে এলে উঠে যায়। একই লেভেল, চালগুলো মিলিয়ে দেখা হিসাব। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
