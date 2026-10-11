import type { ToolShare } from "../../shared/share-types";
import { moments, parseShareHash, previewTitle, shareHash } from "./lib/probash";

export const share: ToolShare = {
  normalize(state) {
    const passport = parseShareHash(state);
    return passport ? shareHash(passport).slice(1) : null;
  },
  preview(state) {
    const passport = parseShareHash(state);
    return {
      title: passport ? previewTitle(passport) : "প্রবাস জীবনের কয়টা মুহূর্ত তোমার? — পাসপোর্টের পাতায় মিলিয়ে দেখো",
      description: "ভিডিও কলে ঈদ, লাগেজে শুঁটকি, একা ইফতার… প্রবাস জীবনের ৪০টা মুহূর্তের কয়টা তোমার? চাপ দাও, পাসপোর্টের পাতায় সিল পড়বে।",
    };
  },
  // Fixed moment ids only; city, name and pack are never counted.
  tally: moments.map(moment => moment.id),
};
