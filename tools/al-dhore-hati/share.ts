import type { ToolShare } from "../../shared/share-types";
import { cardHash, parseCard, previewTitle } from "./lib/link";

// No tally: a link only re-opens one field (its seed replays the same ridge, puddles and goats) with the friend's own count of slips.
export const share: ToolShare = {
  normalize(state) {
    const card = parseCard(state);
    return card ? cardHash(card) : null;
  },
  preview(state) {
    const card = parseCard(state);
    return {
      title: card ? previewTitle(card) : "আল ধরে হাঁটি: কাদায় পা না ফেলে আল পার হতে পারবে?",
      description: "ধানখেতের সরু আল ধরে হাঁটো, পা যেন কাদায় না পড়ে। একই খেত, একই আল, দেখো তুমি কয়বার পিছলাও। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
