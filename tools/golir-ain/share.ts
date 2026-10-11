import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, rules, shareHash } from "./lib/ain";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    return {
      title: shared ? previewTitle(shared) : "গলির ক্রিকেটের আইন। তোমার গলিতে কী ছিল?",
      description: "ছাদে মারলে আউট, ব্যাট যার প্রথম ব্যাটিং তার, ড্রেনে পড়লে ছয়… তোমার পাড়ার আইনে টিক দাও, দেয়ালে লেখা পোস্টার বানাও, দেখো কয়টা মেলে।",
    };
  },
  tally: rules.map(rule => rule.id),
};
