import type { ToolShare } from "../../shared/share-types";

// A children's tool: no result links, no names, no tally. Parents share only the plain address, behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({ title: "ছায়া মেলাও: দেয়ালে কার ছায়া পড়ল?", description: "দেয়ালের ছায়া দেখে জিনিস চেনার খেলা। ৩–৬ বছরের জন্য, পড়তে হয় না।" }),
};
