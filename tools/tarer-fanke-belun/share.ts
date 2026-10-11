import type { ToolShare } from "../../shared/share-types";
import { cardHash, parseCard, previewTitle } from "./lib/result";

export const share: ToolShare = {
  normalize(state) {
    const card = parseCard(state);
    return card ? cardHash(card) : null;
  },
  preview(state) {
    const card = parseCard(state);
    return {
      title: card ? previewTitle(card) : "তারের ফাঁকে বেলুন: কয়টা ফাঁক পার হবে?",
      description: "ঢাকার গলির তারের জটে বেলুনওয়ালার বেলুন। চাপ দিলে ওঠে, না দিলে নামে। একই তারের জটে খেলে দেখো কে বেশি ফাঁক পার হয়। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
