import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link only replays one level's three shelves, from its seed.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "কোনটা নেই? মুদি দোকানের তাকে মনে রাখার খেলা",
      description: "চাল, ডাল, তেল, ডিম সাজানো তাক। কয়েক সেকেন্ড দেখো, মামা একটা সরিয়ে নেবে, বলো কোনটা নেই। একই তাক, এবার তোমার পালা। ফ্রি।",
    };
  },
};
