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
      title: card ? previewTitle(card) : "কাগজের উড়োজাহাজ: তোমার প্লেন শুকনো থাকবে?",
      description: "খাতার পাতার প্লেনে বর্ষার মেঘ ফাটাও, রোদ কুড়াও। একই আকাশে খেলে দেখো কে বেশি পয়েন্ট পায়। ফ্রি।",
    };
  },
};
