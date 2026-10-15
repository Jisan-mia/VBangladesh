import type { ToolShare } from "../../shared/share-types";

// A children's tool: no result links, no challenge links, no tally, and the number never goes anywhere. Only the plain page link, shared from behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({
    title: "আম্মুর নম্বর: ফোন নম্বর মুখস্থ করার খেলা",
    description: "ছোট ছোট টুকরো করে, সুরে সুরে আম্মু-আব্বুর মোবাইল নম্বর মুখস্থ করার খেলা। নম্বর কোথাও রাখা হয় না। ৪–৮ বছরের জন্য, ফ্রি।",
  }),
};
