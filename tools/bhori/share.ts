import type { ToolShare } from "../../shared/share-types";
import { createCard, items, parseShareHash, previewTitle, shareHash } from "./lib/bhori";

export const share: ToolShare = {
  normalize(state) {
    const piece = parseShareHash(state);
    return piece ? shareHash(piece).slice(1) : null;
  },
  preview(state) {
    const piece = parseShareHash(state);
    return {
      title: piece ? previewTitle(createCard(piece)) : "ভরির হিসাব — ভরি, আনা, রতি গ্রামে কত?",
      description: "বাড়ির পুরোনো গয়নার ওজন ভরি-আনা-রতি থেকে গ্রামে, গ্রাম থেকে ভরিতে। তোমার বাড়ির পুরোনো গয়নাটা কার?",
    };
  },
  // Only the kind of jewellery is counted, never a weight, a name or a price.
  tally: items.map(item => item.id),
};
