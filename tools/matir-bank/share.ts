import type { ToolShare } from "../../shared/share-types";
import { dhakaToday, parseShareHash, plan, previewTitle, shareHash } from "./lib/bank";

export const share: ToolShare = {
  normalize(state) {
    const bank = parseShareHash(state, dhakaToday(new Date()));
    return bank ? shareHash(bank).slice(1) : null;
  },
  preview(state) {
    const bank = parseShareHash(state, dhakaToday(new Date()));
    const p = bank && plan(bank);
    return {
      title: bank && p ? previewTitle(bank, p) : "রোজ একটু, মাটির ব্যাংকে — তোমার ব্যাংকে কত?",
      description: "রোজ বা প্রতি সপ্তাহে কত জমাবে আর কবে ভাঙবে বেছে নাও, দেখো ঈদে বা বৈশাখে কত হবে। পয়সা ফেলো, নিজের মাটির ব্যাংকের কার্ড বানাও।",
    };
  },
  // No tally: amounts and dates are the person's own; nothing fixed worth counting.
};
