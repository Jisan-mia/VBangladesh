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
      title: card ? previewTitle(card) : "বস্তার পাহাড়: কয়টা বস্তা সাজাতে পারো?",
      description: "নদীঘাটে ক্রেনে দুলছে চালের বস্তা। ঠিক সময়ে চাপো, ট্রাকে বস্তা সাজাও। একই দোলে খেলে দেখো কে বেশি পারে। ফ্রি।",
    };
  },
};
