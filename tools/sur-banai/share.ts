import type { ToolShare } from "../../shared/share-types";

// A children's tool: no tune links, no names, no tally. Parents share only the plain address, behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({ title: "সুর বানাই: ঘরে চেপে সুর বানানোর খেলা", description: "পাঁচ নোটের ঘরে চাপো, বাজাও চাপো, সুর ঘুরে ঘুরে বাজবে। শুনে সুর মেলানোর খেলাও আছে। ৩–১২ বছরের জন্য, ফ্রি।" }),
};
