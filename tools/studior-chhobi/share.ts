import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash, tallyIds } from "./lib/studio";

// The link carries the backdrop, the date and (if given) a name. Never the photo.
export const share: ToolShare = {
  normalize(state) {
    const print = parseShareHash(state);
    return print ? shareHash(print).slice(1) : null;
  },
  preview(state) {
    const print = parseShareHash(state);
    return {
      title: print ? previewTitle(print) : "চলো, স্টুডিওতে একটা ছবি তুলি",
      description: "পাহাড়-লেক, ফুলবাগান, উড়োজাহাজ… ৯০-এর পাড়ার স্টুডিওর আঁকা ব্যাকড্রপে নিজের ছবি বসাও, কোণে কমলা তারিখ। ছবি ফোনেই থাকে। ফ্রি।",
    };
  },
  tally: tallyIds,
};
