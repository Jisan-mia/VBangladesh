import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link only re-opens one solo match (its seed replays the same team's pulls and rests) with the friend's own count.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "রশি টানাটানি: ঢোলের তালে টানো, দাগ পার করাও",
      description: "স্কুলের বার্ষিক ক্রীড়ার রশি টানাটানি, ফোনে। ঢোলের তালে চাপলে জোরে টান। একই দল, একই ঢোল, দেখো তুমি কয় টানে পারো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
