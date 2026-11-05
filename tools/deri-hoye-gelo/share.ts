import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

export const share: ToolShare = {
  // A real-time score can't be re-checked; the link is capped and cleaned, and the page calls it the friend's own phone score.
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "ঘণ্টা বাজছে, জলদি গেটে চলো!",
      description: "স্কুলে দেরি হয়ে গেছে! কাদাপানি, গরু, সাইকেল টপকে, গামছার নিচে মাথা নুইয়ে ঘণ্টা পড়ার আগে গেটে পৌঁছাও। একই রাস্তায় খেলে দেখো কে আগে পৌঁছায়। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
