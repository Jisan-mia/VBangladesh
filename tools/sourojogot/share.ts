import type { ToolShare } from "../../shared/share-types";

// Kids' tool: nothing about a child goes into a link, so there is no state to share and no tally. Only the plain page link is shared, behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({ title: "সৌরজগতের সফর: রকেটে চড়ে সূর্য থেকে নেপচুন", description: "ছোটদের জন্য ৮টা গ্রহের নাম, ক্রম আর মাপ শেখার খেলা। ফ্রি, বিজ্ঞাপন নেই।" }),
};
