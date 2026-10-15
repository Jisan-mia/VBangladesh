import type { ToolShare } from "../../shared/share-types";

// A children's tool: nothing about a child goes into a link, so no result or challenge links and no tally. Only the plain page link, shared from behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({
    title: "ঘড়ি দেখি: কাঁটা ঘুরিয়ে দিনের সময় মেলাও",
    description: "ছোটদের ঘড়ি দেখা শেখার খেলা: ৭টা, সাড়ে ৩টা, সোয়া, পৌনে, তারপর ৫ মিনিট করে। ৫–৯ বছরের জন্য, ফ্রি।",
  }),
};
