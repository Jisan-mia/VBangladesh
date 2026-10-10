import type { ToolShare } from "../../shared/share-types";
import { monthHash, parseMonth, previewTitle, tallyIds } from "./lib/bhag";

export const share: ToolShare = {
  normalize(state) {
    const month = parseMonth(state);
    return month ? monthHash(month) : null;
  },
  preview(state) {
    const month = parseMonth(state);
    return {
      title: month ? previewTitle(month) : "বেতনের টাকা কোথায় যায়? টিফিন ক্যারিয়ারে ভাগ করে দেখো",
      description: "বাসা ভাড়া, বাজার, যাতায়াত, বাড়িতে পাঠানো, জমা… ছয় বাটির টিফিন ক্যারিয়ারে বেতন ভাগ করো, শুধু শতাংশে। টাকার অঙ্ক লাগে না।",
    };
  },
  // Only fixed category:bucket ids (e.g. "rent:35-39"); never names.
  tally: tallyIds,
};
