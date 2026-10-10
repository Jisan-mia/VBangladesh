import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash } from "./lib/game";

// No tally: the link only replays a family's score card.
export const share: ToolShare = {
  normalize(state) {
    const game = parseShareHash(state);
    return game ? shareHash(game).slice(1) : null;
  },
  preview(state) {
    const game = parseShareHash(state);
    return {
      title: game ? previewTitle(game) : "গানের কলি খেলা — অক্ষর তোলো, গান ধরো",
      description: "হাঁড়ি থেকে অক্ষর ওঠে, ৩০ সেকেন্ডে সেই অক্ষরে গান ধরতে হয়, স্কোর ওঠে হারমোনিয়ামের ডালায়। এক ফোনে পুরো পরিবারের খেলা। ফ্রি।",
    };
  },
};
