import type { ToolShare } from "../../shared/share-types";

// A children's tool: no result links, no names, no tally. Parents share only the plain address, behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({ title: "পৃথিবী ঘুরি: ঢাকা থেকে উড়াল দাও, পাসপোর্টে সিল নাও", description: "১৮টা দেশের হ্যালো, খাবার, দেখার জায়গা আর প্রাণী। ৬–১২ বছরের জন্য, ফ্রি।" }),
};
