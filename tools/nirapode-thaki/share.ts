import type { ToolShare } from "../../shared/share-types";

// A children's tool: no result links, no names, no tally. Parents share only the plain address, behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({ title: "নিরাপদে থাকি: রাস্তা, পুকুর, চুলা আর ঝড়ের দিনে কী করব", description: "ছবি দেখে ঠিক কাজটা বেছে নেওয়ার খেলা। ৬–১০ বছরের ছোটদের জন্য, ভয়ের ছবি ছাড়া।" }),
};
