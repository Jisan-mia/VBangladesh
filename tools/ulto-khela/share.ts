import type { ToolShare } from "../../shared/share-types";

// A children's tool: no result links, no challenge links, no tally. Only the plain page link, shared from behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({
    title: "উল্টো খেলা: সূর্য এলে চাঁদে চাপো",
    description: "ছবির উল্টোটায় চাপো, ঘণ্টা বাজলে নিয়ম বদলাও। ৪–৮ বছরের মনোযোগের খেলা, ফ্রি।",
  }),
};
