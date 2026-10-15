import type { ToolShare } from "../../shared/share-types";

// Kids' tool: nothing about a child goes into a link, so there is no state to share and no tally. Only the plain page link is shared, behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({ title: "ডাইনোসর খুঁজি: বালুর নিচে ডাইনোসরের হাড়", description: "ছোটদের ডাইনোসর গেম: হাড় খুঁড়ে কঙ্কাল জোড়া দাও, ১২টা ডাইনোসর চেনো। ফ্রি, বিজ্ঞাপন নেই।" }),
};
