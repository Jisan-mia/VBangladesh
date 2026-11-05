import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "তারের ফাঁকে বেলুন: কয়টা ফাঁক পার হবে?",
      description: "ঢাকার গলির তারের জটে বেলুনওয়ালার বেলুন। চেপে ধরলে ওঠে, ছাড়লে নামে। একই তার, একই কাক, একই হাওয়ায় খেলে দেখো কে বেশি ফাঁক পার হয়। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
