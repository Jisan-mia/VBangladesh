import type { ToolShare } from "../../shared/share-types";
import { moments, parseShareHash, previewTitle, shareHash } from "./lib/mess";

export const share: ToolShare = {
  normalize(state) {
    const card = parseShareHash(state);
    return card ? shareHash(card).slice(1) : null;
  },
  preview(state) {
    const card = parseShareHash(state);
    return {
      title: card ? previewTitle(card) : "হল আর মেসের কয়টা দিন তোমার চেনা? মিল কার্ডে ফুটো করে দেখো",
      description: "ডিম-ডাল সপ্তাহ, বুয়া আসেনি, রাত দুটোয় ম্যাগি… হল-মেস জীবনের ৪০টা মুহূর্তের কয়টা তোমার? ট্যাপ করো, মিল কার্ডে ফুটো পড়বে।",
    };
  },
  // Fixed moment ids only; the name and the hall or mess name are never counted.
  tally: moments.map(moment => moment.id),
};
