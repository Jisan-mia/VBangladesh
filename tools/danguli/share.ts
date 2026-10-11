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
      title: card ? previewTitle(card) : "ডাংগুলি: দুই চাপে কত ডাং পারো?",
      description: "ছোটবেলার ডাংগুলি, ফোনে। একবার চাপলে কাঠি লাফায়, আবার চাপলে মার। একই মাঠে খেলে দেখো কে বেশি ডাং পারে। ফ্রি।",
    };
  },
};
