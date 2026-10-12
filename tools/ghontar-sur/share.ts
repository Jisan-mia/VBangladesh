import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link carries one tune and the friend's own count.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "ঘণ্টার সুর: চার কলসির সুর মনে রাখো",
      description: "চারটা মাটির কলসি একটা করে সুর বাজায়, প্রতিবার একটা করে বাড়ে। একই সুর খেলে দেখো তুমি কয়টা পর্যন্ত মনে রাখতে পারো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
