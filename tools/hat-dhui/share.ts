import type { ToolShare } from "../../shared/share-types";

// A children's tool: no result links, no names, no tally. Parents share only the plain address, behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({ title: "হাত ধুই, দাঁত মাজি: ২০ সেকেন্ডে হাত ধোয়া, ২ মিনিটে দাঁত মাজা", description: "বেসিনের পাশে ফোন রেখে ছোটদের হাত ধোয়া আর দাঁত মাজার খেলা। ৩–৮ বছরের জন্য।" }),
};
