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
      title: shared ? previewTitle(shared) : "এক টোকায় কয়টা গুটি ঢোকাতে পারবে?",
      description: "ফোনেই ক্যারম বোর্ড। স্ট্রাইকার টেনে ছাড়ো, গুটি ঢোকাও, কুইন কভার করো। একই বোর্ডে খেলে দেখো তুমি কয় পয়েন্ট পাও। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
