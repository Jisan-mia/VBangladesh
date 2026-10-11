import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash } from "./lib/poster";

export const share: ToolShare = {
  normalize(state) {
    const poster = parseShareHash(state);
    return poster ? shareHash(poster).slice(1) : null;
  },
  preview(state) {
    const poster = parseShareHash(state);
    return {
      title: poster ? `${previewTitle(poster)}। তোমার পোস্টার বানাও` : "আসিতেছে! নতুন ছবির পোস্টার। তোমারটা বানাও",
      description: "পুরোনো দিনের হাতে আঁকা সিনেমার পোস্টার, এবার তোমার নামে। প্রেম, অ্যাকশন, পারিবারিক না কমেডি? বেছে নাও, বন্ধুকে সহশিল্পী বানাও। ফ্রি।",
    };
  },
};
