import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link only re-opens one solved jam, after replaying its moves.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "জ্যাম ছাড়াও: গাড়ি সরিয়ে সবুজ CNG বের করো",
      description: "ঢাকার জ্যামে আটকা তোমার সবুজ CNG। রিকশা, ভ্যান, বাস, ট্রাক সরিয়ে পথ করো। একই জ্যাম, চালগুলো মিলিয়ে দেখা হিসাব। দেখো তুমি কত কম চালে পারো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
