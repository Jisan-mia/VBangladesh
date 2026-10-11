import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash } from "./lib/result";

export const share: ToolShare = {
  // A real-time score can't be re-checked; the link is capped and cleaned, and the page calls it the friend's own phone score.
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    return {
      title: shared ? previewTitle(shared) : "ঘণ্টা বাজছে, জলদি গেটে চলো!",
      description: "স্কুলে দেরি হয়ে গেছে! কাদাপানি, গরু, সাইকেল টপকে, গামছার নিচে মাথা নুইয়ে গেটে পৌঁছাও। একই রাস্তায় খেলে দেখো কে বেশি দূর যায়। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
