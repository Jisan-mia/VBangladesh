import type { ToolShare } from "../../shared/share-types";

// A children's tool: nothing about a child goes into a link, so no result or challenge links and no tally. Only the plain page link, shared from behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({
    title: "এবিসি বাজার: M দিয়ে Mango, R দিয়ে Rickshaw",
    description: "ছোটদের ইংরেজি বর্ণমালা শেখার খেলা: ছবি মেলাও, বড় হাতের সাথে ছোট হাতের, b d p q আলাদা করো। ৪–৭ বছরের জন্য, ফ্রি।",
  }),
};
