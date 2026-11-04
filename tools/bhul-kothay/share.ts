import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/challenge";

// No tally: a link only names one level, its pictures and the friend's own time.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "ভুল কোথায়? দুই ছবির অমিল খোঁজো",
      description: "বাজার, উঠান আর নদীর ঘাটের দুটো প্রায় একই রকম ছবি। একই লেভেল, দেখো তুমি কত সময়ে সব অমিল পাও। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
