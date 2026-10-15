import type { ToolShare } from "../../shared/share-types";

// A children's tool: no result links, no challenge links, no tally. Only the plain page link, shared from behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({ title: "ছড়ার তালে: ঢোলে তাল দাও, ছড়া বলো", description: "হাট্টিমা টিম টিম, আতা গাছে তোতা পাখি: ঢোলে তাল দিয়ে ছড়া বলার খেলা। ৩–৬ বছরের জন্য, পড়তে হয় না।" }),
};
