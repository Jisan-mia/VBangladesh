import type { ToolShare } from "../../shared/share-types";
import { cardHash, parseCard, previewTitle } from "./lib/result";

// No tally: a link only reopens one board and its result.
export const share: ToolShare = {
  normalize(state) {
    const card = parseCard(state);
    return card ? cardHash(card) : null;
  },
  preview(state) {
    const card = parseCard(state);
    return {
      title: card ? previewTitle(card) : "জোড়া মেলাও: মেলার খেলনার জোড়া খুঁজে বের করো",
      description: "বাঁশি, লাটিম, ঘুড়ি, টমটম উল্টে রাখা। দুটো করে খোলো, একই খেলনা হলে জোড়া থাকবে। একই খেলায় দেখো কে কম চালে পারে। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
