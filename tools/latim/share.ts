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
      title: card ? previewTitle(card) : "লাটিম: তোমার লাটিম কতক্ষণ ঘুরবে?",
      description: "নিচে টেনে লাটিম ছোড়ো, টলতে দেখলে টোকা দাও। একই উঠানে খেলে দেখো কারটা বেশিক্ষণ ঘোরে। ফ্রি।",
    };
  },
};
