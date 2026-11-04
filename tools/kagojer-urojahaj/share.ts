import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "কাগজের উড়োজাহাজ: তোমার প্লেন কতদূর যাবে?",
      description: "খাতার পাতার প্লেন ছোড়ো, হাওয়া দেখে ওড়াও, লাল দাগে নামাও। একই উড়ানে খেলে দেখো কে বেশি পয়েন্ট পায়। ফ্রি।",
    };
  },
};
