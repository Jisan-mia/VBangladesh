import type { ToolShare } from "../../shared/share-types";

// A children's tool: no result links, no challenge links, no tally. Only the plain page link, shared from behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({
    title: "দাঁড়িপাল্লা: দুই দিক সমান করো",
    description: "দোকানের দাঁড়িপাল্লায় বাটখারা চাপিয়ে দুই দিক সমান করো, পরে কলার অজানা ওজন খোঁজো। ৬–১১ বছরের যোগের খেলা, ফ্রি।",
  }),
};
