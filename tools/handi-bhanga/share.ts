import type { ToolShare } from "../../shared/share-types";
import { cardHash, parseCard, previewTitle } from "./lib/link";

export const share: ToolShare = {
  normalize(state) {
    const card = parseCard(state);
    return card ? cardHash(card) : null;
  },
  preview(state) {
    const card = parseCard(state);
    return {
      title: card ? previewTitle(card) : "মেলার সব হাঁড়ি ভাঙতে পারবে?",
      description: "মেলার দোকানে দড়িতে ঝুলছে নকশা-আঁকা মাটির হাঁড়ি। তাক করে বল ছোড়ো, লাঠিতে ফিরিয়ে একটা একটা করে ভাঙো। একই দোকান, দেখো তুমি কয়টা পারো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
