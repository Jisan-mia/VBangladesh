import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

export const share: ToolShare = {
  // Re-checked against the seed's real storm: no more mangoes than fell, no score those mangoes can't make.
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "ঝড় উঠেছে, আম কুড়াও!",
      description: "কালবৈশাখীর ঝড়ে আমগাছ দুলছে। ডালা পেতে কাঁচা-পাকা আম ধরো, শুকনো ডাল এড়াও। একই ঝড়ে খেলে দেখো কে বেশি কুড়ায়। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
