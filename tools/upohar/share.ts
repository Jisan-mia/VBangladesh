import type { ToolShare } from "../../shared/share-types";
import { createCard, parseShareHash, previewTitle, relations, shareHash } from "./lib/upohar";

export const share: ToolShare = {
  normalize(state) {
    const envelope = parseShareHash(state);
    return envelope ? shareHash(envelope).slice(1) : null;
  },
  preview(state) {
    const envelope = parseShareHash(state);
    return {
      title: envelope ? previewTitle(createCard(envelope)) : "দাওয়াতে কত দেব? — বিয়ের খামের মজার হিসাব",
      description: "সম্পর্ক, দূরত্ব আর মেনু বেছে নাও, খামে উঠবে একটা হালকা আন্দাজ। নিয়ম না, আন্দাজ। তুমি খামে কত দাও?",
    };
  },
  // Only the relation is counted, never a name or an amount.
  tally: relations.map(relation => relation.id),
};
