import type { ToolShare } from "../../shared/share-types";

// A children's tool: no result links, no names, no tally. Only the plain page link is shared, from behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({
    title: "গল্পের মোড়: ছোটদের ৯টা ছবির গল্প",
    description: "প্রতিটা গল্পে একটা মোড়। বেছে নাও, দেখো অন্যজনের কেমন লাগল। ফ্রি, অ্যাকাউন্ট লাগে না।",
  }),
};
