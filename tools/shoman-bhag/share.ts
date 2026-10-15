import type { ToolShare } from "../../shared/share-types";

// A children's tool: no result links, no challenge links, no tally. Only the plain page link, shared from behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({
    title: "সমান ভাগ: মেহমান এসেছে, পিঠা সমান ভাগ করো",
    description: "প্লেটে পিঠা-আম সমান ভাগ করে, রুটি কেটে ভাগ আর ভগ্নাংশ শেখার খেলা। ৫–১০ বছরের জন্য, ফ্রি।",
  }),
};
