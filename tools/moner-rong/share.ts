import type { ToolShare } from "../../shared/share-types";

// A children's tool: no result links, no challenge links, no tally. Only the plain page link, shared from behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({
    title: "মনের রং: কার মনে আজ কোন রং?",
    description: "ছবি দেখে খুশি, মন খারাপ, রাগ, ভয়, অবাক আর লজ্জা চেনার খেলা। ৪–৯ বছরের জন্য, ফ্রি।",
  }),
};
